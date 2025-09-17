const express = require('express');
const axios = require('axios');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { authenticateToken, authorizeResource } = require('../middleware/auth');
const { validateInvestment, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all investments for user
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, portfolio, isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (portfolio) filter.portfolio = portfolio;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const investments = await Investment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Investment.countDocuments(filter);

    res.json({
      investments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ message: 'Failed to fetch investments' });
  }
});

// Get investment by ID
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    res.json(investment);
  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({ message: 'Failed to fetch investment' });
  }
});

// Create new investment
router.post('/', authenticateToken, validateInvestment, async (req, res) => {
  try {
    const investmentData = {
      ...req.body,
      user: req.user._id,
      purchaseDate: new Date(req.body.purchaseDate)
    };

    // Calculate total cost
    investmentData.totalCost = investmentData.quantity * investmentData.averagePrice;
    investmentData.totalValue = investmentData.quantity * (investmentData.currentPrice || investmentData.averagePrice);

    const investment = new Investment(investmentData);
    await investment.save();

    // Add initial transaction
    await investment.addTransaction({
      type: 'buy',
      quantity: investmentData.quantity,
      price: investmentData.averagePrice,
      date: investmentData.purchaseDate,
      notes: 'Initial purchase'
    });

    res.status(201).json({
      message: 'Investment created successfully',
      investment
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ message: 'Failed to create investment' });
  }
});

// Update investment
router.put('/:id', authenticateToken, validateObjectId('id'), validateInvestment, async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    // Update investment
    Object.assign(investment, req.body);
    if (req.body.purchaseDate) investment.purchaseDate = new Date(req.body.purchaseDate);
    
    // Recalculate totals
    investment.totalCost = investment.quantity * investment.averagePrice;
    investment.totalValue = investment.quantity * investment.currentPrice;
    
    await investment.save();

    res.json({
      message: 'Investment updated successfully',
      investment
    });
  } catch (error) {
    console.error('Update investment error:', error);
    res.status(500).json({ message: 'Failed to update investment' });
  }
});

// Delete investment
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    await Investment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ message: 'Failed to delete investment' });
  }
});

// Add transaction to investment
router.post('/:id/transactions', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { type, quantity, price, date, fees = 0, notes = '' } = req.body;

    if (!type || !quantity || !price) {
      return res.status(400).json({ message: 'Type, quantity, and price are required' });
    }

    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    const transactionData = {
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date: date ? new Date(date) : new Date(),
      fees: parseFloat(fees),
      notes
    };

    await investment.addTransaction(transactionData);

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      amount: type === 'buy' ? -(quantity * price + fees) : (quantity * price - fees),
      type: type === 'buy' ? 'expense' : 'income',
      category: 'investment',
      subcategory: type === 'buy' ? 'purchase' : 'sale',
      description: `${type.toUpperCase()} ${quantity} shares of ${investment.symbol} at $${price}`,
      date: transactionData.date
    });
    await transaction.save();

    res.json({
      message: 'Transaction added successfully',
      investment
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});

// Update investment prices
router.post('/update-prices', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.user._id,
      isActive: true
    });

    const updatedInvestments = [];

    for (const investment of investments) {
      try {
        const currentPrice = await getCurrentPrice(investment.symbol, investment.type);
        if (currentPrice) {
          await investment.updatePrice(currentPrice);
          updatedInvestments.push(investment);
        }
      } catch (error) {
        console.error(`Failed to update price for ${investment.symbol}:`, error);
      }
    }

    res.json({
      message: `Updated prices for ${updatedInvestments.length} investments`,
      updatedCount: updatedInvestments.length
    });
  } catch (error) {
    console.error('Update prices error:', error);
    res.status(500).json({ message: 'Failed to update investment prices' });
  }
});

// Get current price for symbol
const getCurrentPrice = async (symbol, type) => {
  try {
    // This is a mock implementation - in production, you would use real APIs
    // like Alpha Vantage, Yahoo Finance, or CoinGecko for crypto
    
    if (type === 'crypto') {
      // Mock crypto price (in production, use CoinGecko API)
      return Math.random() * 1000;
    } else {
      // Mock stock price (in production, use Alpha Vantage or similar)
      return Math.random() * 100;
    }
  } catch (error) {
    console.error('Get current price error:', error);
    return null;
  }
};

// Get investment statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.user._id,
      isActive: true
    });

    const totalCost = investments.reduce((sum, inv) => sum + inv.totalCost, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const investmentsByType = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + 1;
      return acc;
    }, {});

    const topPerformers = investments
      .sort((a, b) => b.unrealizedGainLossPercentage - a.unrealizedGainLossPercentage)
      .slice(0, 5);

    const worstPerformers = investments
      .sort((a, b) => a.unrealizedGainLossPercentage - b.unrealizedGainLossPercentage)
      .slice(0, 5);

    res.json({
      summary: {
        totalInvestments: investments.length,
        totalCost,
        totalValue,
        totalGainLoss,
        totalGainLossPercentage,
        averageGainLoss: investments.length > 0 ? totalGainLoss / investments.length : 0
      },
      investmentsByType,
      topPerformers,
      worstPerformers
    });
  } catch (error) {
    console.error('Investment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch investment statistics' });
  }
});

// Get portfolio performance over time
router.get('/stats/performance', authenticateToken, async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const investments = await Investment.find({
      user: req.user._id,
      isActive: true
    });

    // Mock performance data - in production, you would calculate this from historical data
    const performanceData = [];
    for (let i = 0; i < parseInt(months); i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      performanceData.push({
        date,
        totalValue: Math.random() * 100000 + 50000,
        totalCost: Math.random() * 80000 + 40000,
        gainLoss: Math.random() * 20000 - 10000
      });
    }

    res.json({
      performance: performanceData.reverse()
    });
  } catch (error) {
    console.error('Investment performance error:', error);
    res.status(500).json({ message: 'Failed to fetch investment performance' });
  }
});

// Set up price alerts
router.post('/:id/alerts', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || !value) {
      return res.status(400).json({ message: 'Alert type and value are required' });
    }

    const validTypes = ['price_above', 'price_below', 'gain_loss_percentage', 'volume_spike'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid alert type' });
    }

    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    const alert = {
      type,
      value: parseFloat(value),
      isActive: true,
      createdAt: new Date()
    };

    investment.alerts.push(alert);
    await investment.save();

    res.json({
      message: 'Price alert set successfully',
      alert
    });
  } catch (error) {
    console.error('Set alert error:', error);
    res.status(500).json({ message: 'Failed to set price alert' });
  }
});

// Remove price alert
router.delete('/:id/alerts/:alertId', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    investment.alerts = investment.alerts.filter(
      alert => alert._id.toString() !== req.params.alertId
    );
    await investment.save();

    res.json({ message: 'Price alert removed successfully' });
  } catch (error) {
    console.error('Remove alert error:', error);
    res.status(500).json({ message: 'Failed to remove price alert' });
  }
});

// Get market data (mock implementation)
router.get('/market/data', authenticateToken, async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({ message: 'Symbols parameter is required' });
    }

    const symbolList = symbols.split(',');
    const marketData = [];

    for (const symbol of symbolList) {
      // Mock market data - in production, use real market data APIs
      marketData.push({
        symbol,
        price: Math.random() * 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 20,
        volume: Math.floor(Math.random() * 1000000),
        marketCap: Math.floor(Math.random() * 1000000000)
      });
    }

    res.json({ marketData });
  } catch (error) {
    console.error('Get market data error:', error);
    res.status(500).json({ message: 'Failed to fetch market data' });
  }
});

module.exports = router;
