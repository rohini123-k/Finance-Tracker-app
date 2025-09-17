const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const FinancialGoal = require('../models/FinancialGoal');
const Investment = require('../models/Investment');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get financial summary report
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.user._id };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get transaction summary
    const transactionSummary = await Transaction.aggregate([
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

    // Get category breakdown for expenses
    const expenseCategories = await Transaction.aggregate([
      { $match: { ...filter, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          percentage: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Calculate totals
    const income = transactionSummary.find(t => t._id === 'income')?.total || 0;
    const expenses = Math.abs(transactionSummary.find(t => t._id === 'expense')?.total || 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    res.json({
      summary: {
        income,
        expenses,
        savings,
        savingsRate,
        netWorth: req.user.totalNetWorth || 0
      },
      transactionSummary,
      expenseCategories,
      monthlyTrends
    });
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ message: 'Failed to generate summary report' });
  }
});

// Get expense analysis report
router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'category' } = req.query;
    const filter = { user: req.user._id, type: 'expense' };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get expense breakdown
    const expenseBreakdown = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: `$${groupBy}`,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
          min: { $min: '$amount' },
          max: { $max: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get daily spending pattern
    const dailyPattern = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top merchants
    const topMerchants = await Transaction.aggregate([
      { $match: { ...filter, merchant: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$merchant.name',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Get expense trends over time
    const expenseTrends = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      breakdown: expenseBreakdown,
      dailyPattern,
      topMerchants,
      trends: expenseTrends
    });
  } catch (error) {
    console.error('Expense analysis error:', error);
    res.status(500).json({ message: 'Failed to generate expense analysis' });
  }
});

// Get income analysis report
router.get('/income', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.user._id, type: 'income' };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get income by category
    const incomeByCategory = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get monthly income trends
    const monthlyIncome = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get income sources
    const incomeSources = await Transaction.aggregate([
      { $match: { ...filter, merchant: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$merchant.name',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      byCategory: incomeByCategory,
      monthlyTrends: monthlyIncome,
      sources: incomeSources
    });
  } catch (error) {
    console.error('Income analysis error:', error);
    res.status(500).json({ message: 'Failed to generate income analysis' });
  }
});

// Get budget performance report
router.get('/budgets', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    const budgets = await Budget.find({
      user: req.user._id,
      period,
      isActive: true
    });

    const budgetPerformance = budgets.map(budget => ({
      id: budget._id,
      name: budget.name,
      category: budget.category,
      budgeted: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      percentage: budget.percentageSpent,
      status: budget.status,
      variance: budget.spent - budget.amount
    }));

    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalVariance = totalSpent - totalBudgeted;

    res.json({
      performance: budgetPerformance,
      summary: {
        totalBudgeted,
        totalSpent,
        totalVariance,
        averagePerformance: budgets.length > 0 ? totalSpent / totalBudgeted : 0
      }
    });
  } catch (error) {
    console.error('Budget performance error:', error);
    res.status(500).json({ message: 'Failed to generate budget performance report' });
  }
});

// Get investment performance report
router.get('/investments', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.user._id,
      isActive: true
    });

    const totalCost = investments.reduce((sum, inv) => sum + inv.totalCost, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const performanceByType = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) {
        acc[inv.type] = { cost: 0, value: 0, count: 0 };
      }
      acc[inv.type].cost += inv.totalCost;
      acc[inv.type].value += inv.totalValue;
      acc[inv.type].count += 1;
      return acc;
    }, {});

    // Calculate performance for each type
    Object.keys(performanceByType).forEach(type => {
      const data = performanceByType[type];
      data.gainLoss = data.value - data.cost;
      data.gainLossPercentage = data.cost > 0 ? (data.gainLoss / data.cost) * 100 : 0;
    });

    const topPerformers = investments
      .sort((a, b) => b.unrealizedGainLossPercentage - a.unrealizedGainLossPercentage)
      .slice(0, 5)
      .map(inv => ({
        symbol: inv.symbol,
        name: inv.name,
        gainLoss: inv.unrealizedGainLoss,
        gainLossPercentage: inv.unrealizedGainLossPercentage
      }));

    res.json({
      summary: {
        totalInvestments: investments.length,
        totalCost,
        totalValue,
        totalGainLoss,
        totalGainLossPercentage
      },
      performanceByType,
      topPerformers
    });
  } catch (error) {
    console.error('Investment performance error:', error);
    res.status(500).json({ message: 'Failed to generate investment performance report' });
  }
});

// Get financial goals progress report
router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await FinancialGoal.find({
      user: req.user._id
    });

    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');

    const goalsByType = goals.reduce((acc, goal) => {
      if (!acc[goal.type]) {
        acc[goal.type] = { total: 0, achieved: 0, count: 0 };
      }
      acc[goal.type].total += goal.targetAmount;
      acc[goal.type].achieved += goal.currentAmount;
      acc[goal.type].count += 1;
      return acc;
    }, {});

    // Calculate progress for each type
    Object.keys(goalsByType).forEach(type => {
      const data = goalsByType[type];
      data.progress = data.total > 0 ? (data.achieved / data.total) * 100 : 0;
    });

    const goalsProgress = goals.map(goal => ({
      id: goal._id,
      title: goal.title,
      type: goal.type,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: goal.progressPercentage,
      status: goal.status,
      daysRemaining: goal.daysRemaining
    }));

    res.json({
      summary: {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        totalTargetAmount: activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0),
        totalCurrentAmount: activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
      },
      goalsByType,
      goalsProgress
    });
  } catch (error) {
    console.error('Goals progress error:', error);
    res.status(500).json({ message: 'Failed to generate goals progress report' });
  }
});

// Export report as CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (!type) {
      return res.status(400).json({ message: 'Report type is required' });
    }

    let data = [];
    let filename = '';

    const filter = { user: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    switch (type) {
      case 'transactions':
        data = await Transaction.find(filter).sort({ date: -1 });
        filename = 'transactions.csv';
        break;
      case 'budgets':
        data = await Budget.find({ user: req.user._id, isActive: true });
        filename = 'budgets.csv';
        break;
      case 'goals':
        data = await FinancialGoal.find({ user: req.user._id });
        filename = 'goals.csv';
        break;
      case 'investments':
        data = await Investment.find({ user: req.user._id, isActive: true });
        filename = 'investments.csv';
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Convert to CSV format
    const csv = convertToCSV(data);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export report' });
  }
});

// Convert data to CSV format
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject());
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return `"${value}"`;
    });
    return values.join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Get dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Current month transactions
    const currentMonthTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startOfMonth }
    });

    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = Math.abs(currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));

    // Year-to-date transactions
    const ytdTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startOfYear }
    });

    const ytdIncome = ytdTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const ytdExpenses = Math.abs(ytdTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));

    // Active budgets
    const activeBudgets = await Budget.find({
      user: req.user._id,
      isActive: true
    });

    const budgetSummary = {
      total: activeBudgets.reduce((sum, budget) => sum + budget.amount, 0),
      spent: activeBudgets.reduce((sum, budget) => sum + budget.spent, 0),
      remaining: activeBudgets.reduce((sum, budget) => sum + budget.remaining, 0)
    };

    // Active goals
    const activeGoals = await FinancialGoal.find({
      user: req.user._id,
      status: 'active'
    });

    const goalsSummary = {
      total: activeGoals.length,
      totalTarget: activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      totalCurrent: activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)
    };

    // Investments
    const investments = await Investment.find({
      user: req.user._id,
      isActive: true
    });

    const investmentSummary = {
      total: investments.length,
      totalCost: investments.reduce((sum, inv) => sum + inv.totalCost, 0),
      totalValue: investments.reduce((sum, inv) => sum + inv.totalValue, 0)
    };

    res.json({
      currentMonth: {
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
        savings: currentMonthIncome - currentMonthExpenses
      },
      yearToDate: {
        income: ytdIncome,
        expenses: ytdExpenses,
        savings: ytdIncome - ytdExpenses
      },
      budgets: budgetSummary,
      goals: goalsSummary,
      investments: investmentSummary,
      netWorth: req.user.totalNetWorth || 0
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
  }
});

module.exports = router;
