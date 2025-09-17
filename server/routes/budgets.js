const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { authenticateToken, authorizeResource } = require('../middleware/auth');
const { validateBudget, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all budgets for user
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, period, isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (period) filter.period = period;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const budgets = await Budget.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(filter);

    res.json({
      budgets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Failed to fetch budgets' });
  }
});

// Get budget by ID
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Failed to fetch budget' });
  }
});

// Create new budget
router.post('/', authenticateToken, validateBudget, async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      user: req.user._id,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    };

    // Check for overlapping budgets in the same category
    const overlappingBudget = await Budget.findOne({
      user: req.user._id,
      category: budgetData.category,
      isActive: true,
      $or: [
        {
          startDate: { $lte: budgetData.endDate },
          endDate: { $gte: budgetData.startDate }
        }
      ]
    });

    if (overlappingBudget) {
      return res.status(400).json({
        message: 'A budget already exists for this category in the specified period',
        overlappingBudget: {
          id: overlappingBudget._id,
          name: overlappingBudget.name,
          startDate: overlappingBudget.startDate,
          endDate: overlappingBudget.endDate
        }
      });
    }

    const budget = new Budget(budgetData);
    await budget.save();

    // Calculate current spending for the period
    await calculateBudgetSpending(budget);

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Failed to create budget' });
  }
});

// Update budget
router.put('/:id', authenticateToken, validateObjectId('id'), validateBudget, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check for overlapping budgets if category or dates changed
    if (req.body.category !== budget.category || 
        req.body.startDate !== budget.startDate || 
        req.body.endDate !== budget.endDate) {
      
      const overlappingBudget = await Budget.findOne({
        user: req.user._id,
        category: req.body.category || budget.category,
        isActive: true,
        _id: { $ne: budget._id },
        $or: [
          {
            startDate: { $lte: new Date(req.body.endDate || budget.endDate) },
            endDate: { $gte: new Date(req.body.startDate || budget.startDate) }
          }
        ]
      });

      if (overlappingBudget) {
        return res.status(400).json({
          message: 'A budget already exists for this category in the specified period',
          overlappingBudget: {
            id: overlappingBudget._id,
            name: overlappingBudget.name,
            startDate: overlappingBudget.startDate,
            endDate: overlappingBudget.endDate
          }
        });
      }
    }

    // Update budget
    Object.assign(budget, req.body);
    if (req.body.startDate) budget.startDate = new Date(req.body.startDate);
    if (req.body.endDate) budget.endDate = new Date(req.body.endDate);
    
    await budget.save();

    // Recalculate spending
    await calculateBudgetSpending(budget);

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Failed to delete budget' });
  }
});

// Toggle budget active status
router.patch('/:id/toggle', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.isActive = !budget.isActive;
    await budget.save();

    res.json({
      message: `Budget ${budget.isActive ? 'activated' : 'deactivated'} successfully`,
      budget
    });
  } catch (error) {
    console.error('Toggle budget error:', error);
    res.status(500).json({ message: 'Failed to toggle budget status' });
  }
});

// Update budget alerts
router.patch('/:id/alerts', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { enabled, threshold } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (enabled !== undefined) budget.alerts.enabled = enabled;
    if (threshold !== undefined) budget.alerts.threshold = threshold;

    await budget.save();

    res.json({
      message: 'Budget alerts updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget alerts error:', error);
    res.status(500).json({ message: 'Failed to update budget alerts' });
  }
});

// Calculate budget spending
const calculateBudgetSpending = async (budget) => {
  try {
    const transactions = await Transaction.find({
      user: budget.user,
      type: 'expense',
      category: budget.category,
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate
      }
    });

    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    budget.spent = totalSpent;
    await budget.save();

    // Check for alerts
    if (budget.alerts.enabled && budget.spent > budget.amount * (budget.alerts.threshold / 100)) {
      const lastAlertSent = budget.alerts.lastAlertSent;
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Only send alert if not sent in the last 24 hours
      if (!lastAlertSent || lastAlertSent < oneDayAgo) {
        await Notification.createNotification(budget.user, {
          type: 'budget_alert',
          title: 'Budget Alert',
          message: `You've spent ${budget.percentageSpent.toFixed(1)}% of your ${budget.name} budget.`,
          priority: budget.percentageSpent >= 100 ? 'high' : 'medium',
          metadata: { budgetId: budget._id, percentage: budget.percentageSpent }
        });

        budget.alerts.lastAlertSent = now;
        await budget.save();
      }
    }
  } catch (error) {
    console.error('Calculate budget spending error:', error);
  }
};

// Get budget statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    const budgets = await Budget.find({
      user: req.user._id,
      period,
      isActive: true
    });

    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;

    const budgetStats = budgets.map(budget => ({
      id: budget._id,
      name: budget.name,
      category: budget.category,
      budgeted: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      percentage: budget.percentageSpent,
      status: budget.status
    }));

    res.json({
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        averageSpent: budgets.length > 0 ? totalSpent / budgets.length : 0,
        budgetCount: budgets.length
      },
      budgets: budgetStats
    });
  } catch (error) {
    console.error('Budget stats error:', error);
    res.status(500).json({ message: 'Failed to fetch budget statistics' });
  }
});

// Get budget performance over time
router.get('/stats/performance', authenticateToken, async (req, res) => {
  try {
    const { budgetId, months = 6 } = req.query;

    if (!budgetId) {
      return res.status(400).json({ message: 'Budget ID is required' });
    }

    const budget = await Budget.findOne({
      _id: budgetId,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const performance = await Transaction.aggregate([
      {
        $match: {
          user: budget.user,
          type: 'expense',
          category: budget.category,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      budget: {
        id: budget._id,
        name: budget.name,
        category: budget.category,
        amount: budget.amount
      },
      performance
    });
  } catch (error) {
    console.error('Budget performance error:', error);
    res.status(500).json({ message: 'Failed to fetch budget performance' });
  }
});

// Recalculate all budgets
router.post('/recalculate', authenticateToken, async (req, res) => {
  try {
    const budgets = await Budget.find({
      user: req.user._id,
      isActive: true
    });

    for (const budget of budgets) {
      await calculateBudgetSpending(budget);
    }

    res.json({ message: 'All budgets recalculated successfully' });
  } catch (error) {
    console.error('Recalculate budgets error:', error);
    res.status(500).json({ message: 'Failed to recalculate budgets' });
  }
});

module.exports = router;
