const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const OpenAI = require('openai');
const Transaction = require('../models/Transaction');
const Receipt = require('../models/Receipt');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const { authenticateToken, authorizeResource } = require('../middleware/auth');
const { validateTransaction, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all transactions for user
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { user: req.user._id };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('receipt', 'filename ocrText extractedData');

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('receipt');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction' });
  }
});

// Create new transaction
router.post('/', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      user: req.user._id,
      date: req.body.date ? new Date(req.body.date) : new Date()
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // Update budget if it's an expense
    if (transaction.type === 'expense') {
      await updateBudgetSpending(transaction);
    }

    // Create notification for large transactions
    if (Math.abs(transaction.amount) > 1000) {
      await Notification.createNotification(req.user._id, {
        type: 'transaction_alert',
        title: 'Large Transaction',
        message: `A ${transaction.type} of ${transaction.formattedAmount} has been recorded.`,
        priority: 'medium',
        metadata: { transactionId: transaction._id }
      });
    }

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', authenticateToken, validateObjectId('id'), validateTransaction, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const oldAmount = transaction.amount;
    const oldType = transaction.type;

    // Update transaction
    Object.assign(transaction, req.body);
    await transaction.save();

    // Update budget if type or amount changed
    if (oldType === 'expense' || transaction.type === 'expense') {
      await updateBudgetSpending(transaction, oldAmount, oldType);
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update budget if it was an expense
    if (transaction.type === 'expense') {
      await updateBudgetSpending(transaction, transaction.amount, transaction.type, true);
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

// Upload receipt with OCR
router.post('/upload-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create receipt record
    const receipt = new Receipt({
      user: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      processingStatus: 'processing'
    });

    await receipt.save();

    // Process OCR in background
    processReceiptOCR(receipt._id, req.file.path);

    res.json({
      message: 'Receipt uploaded successfully',
      receipt: {
        id: receipt._id,
        filename: receipt.filename,
        processingStatus: receipt.processingStatus
      }
    });
  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({ message: 'Failed to upload receipt' });
  }
});

// Process receipt OCR
const processReceiptOCR = async (receiptId, filePath) => {
  try {
    const receipt = await Receipt.findById(receiptId);
    if (!receipt) return;

    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    receipt.ocrText = text;

    // Extract data using AI
    const extractedData = await extractReceiptData(text);
    receipt.extractedData = extractedData;

    // AI categorization
    const aiAnalysis = await categorizeTransaction(extractedData);
    receipt.aiAnalysis = aiAnalysis;

    receipt.processingStatus = 'completed';
    await receipt.save();

    // Create transaction suggestion
    if (extractedData.amount && extractedData.merchant) {
      await createTransactionSuggestion(receipt.user, receipt._id, extractedData, aiAnalysis);
    }
  } catch (error) {
    console.error('OCR processing error:', error);
    await Receipt.findByIdAndUpdate(receiptId, {
      processingStatus: 'failed',
      processingError: error.message
    });
  }
};

// Extract data from receipt text using AI
const extractReceiptData = async (text) => {
  try {
    const prompt = `
    Extract the following information from this receipt text:
    - merchant name
    - total amount
    - date
    - items (name, price, quantity)
    - tax amount
    - currency
    
    Text: ${text}
    
    Return as JSON format.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI extraction error:', error);
    return {};
  }
};

// Categorize transaction using AI
const categorizeTransaction = async (extractedData) => {
  try {
    const prompt = `
    Categorize this transaction based on the merchant and items:
    Merchant: ${extractedData.merchant || 'Unknown'}
    Items: ${JSON.stringify(extractedData.items || [])}
    Amount: ${extractedData.total || 0}
    
    Provide:
    - category (e.g., food, transportation, shopping, entertainment, etc.)
    - subcategory
    - tags
    - confidence score (0-1)
    - suggestions for better categorization
    
    Return as JSON format.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI categorization error:', error);
    return { confidence: 0, category: 'other', subcategory: null, tags: [], suggestions: [] };
  }
};

// Create transaction suggestion from receipt
const createTransactionSuggestion = async (userId, receiptId, extractedData, aiAnalysis) => {
  try {
    await Notification.createNotification(userId, {
      type: 'transaction_alert',
      title: 'Receipt Processed',
      message: `We found a transaction for ${extractedData.merchant} - ${extractedData.total}. Would you like to add it?`,
      priority: 'medium',
      actionUrl: `/transactions/create?receipt=${receiptId}`,
      actionText: 'Add Transaction',
      metadata: {
        receiptId,
        suggestedAmount: extractedData.total,
        suggestedMerchant: extractedData.merchant,
        suggestedCategory: aiAnalysis.category
      }
    });
  } catch (error) {
    console.error('Transaction suggestion error:', error);
  }
};

// Update budget spending
const updateBudgetSpending = async (transaction, oldAmount = 0, oldType = null, isDelete = false) => {
  try {
    const budgets = await Budget.find({
      user: transaction.user,
      category: transaction.category,
      isActive: true,
      startDate: { $lte: transaction.date },
      endDate: { $gte: transaction.date }
    });

    for (const budget of budgets) {
      let amountChange = 0;
      
      if (isDelete) {
        amountChange = -transaction.amount;
      } else if (oldType === 'expense' && transaction.type === 'expense') {
        amountChange = transaction.amount - oldAmount;
      } else if (oldType !== 'expense' && transaction.type === 'expense') {
        amountChange = transaction.amount;
      } else if (oldType === 'expense' && transaction.type !== 'expense') {
        amountChange = -oldAmount;
      }

      if (amountChange !== 0) {
        budget.spent += amountChange;
        await budget.save();

        // Check if budget threshold is exceeded
        if (budget.alerts.enabled && budget.spent > budget.amount * (budget.alerts.threshold / 100)) {
          await Notification.createNotification(transaction.user, {
            type: 'budget_alert',
            title: 'Budget Alert',
            message: `You've spent ${budget.percentageSpent.toFixed(1)}% of your ${budget.name} budget.`,
            priority: budget.percentageSpent >= 100 ? 'high' : 'medium',
            metadata: { budgetId: budget._id, percentage: budget.percentageSpent }
          });
        }
      }
    }
  } catch (error) {
    console.error('Budget update error:', error);
  }
};

// Get transaction statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.user._id };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      }
    ]);

    const categoryStats = await Transaction.aggregate([
      { $match: { ...filter, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      summary: stats,
      topCategories: categoryStats
    });
  } catch (error) {
    console.error('Transaction stats error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction statistics' });
  }
});

module.exports = router;
