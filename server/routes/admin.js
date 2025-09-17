const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const FinancialGoal = require('../models/FinancialGoal');
const Investment = require('../models/Investment');
const Notification = require('../models/Notification');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// All admin routes require admin or super-admin role
router.use(authenticateToken);
router.use(authorize('admin', 'super-admin'));

// Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Transaction statistics
    const totalTransactions = await Transaction.countDocuments();
    const monthlyTransactions = await Transaction.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Financial statistics
    const totalIncome = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpenses = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Budget and goal statistics
    const totalBudgets = await Budget.countDocuments();
    const activeBudgets = await Budget.countDocuments({ isActive: true });
    const totalGoals = await FinancialGoal.countDocuments();
    const activeGoals = await FinancialGoal.countDocuments({ status: 'active' });

    // Investment statistics
    const totalInvestments = await Investment.countDocuments();
    const activeInvestments = await Investment.countDocuments({ isActive: true });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth
      },
      transactions: {
        total: totalTransactions,
        thisMonth: monthlyTransactions
      },
      financial: {
        totalIncome: totalIncome[0]?.total || 0,
        totalExpenses: Math.abs(totalExpenses[0]?.total || 0)
      },
      budgets: {
        total: totalBudgets,
        active: activeBudgets
      },
      goals: {
        total: totalGoals,
        active: activeGoals
      },
      investments: {
        total: totalInvestments,
        active: activeInvestments
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch admin dashboard data' });
  }
});

// Get all users
router.get('/users', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -twoFactorSecret');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's financial summary
    const transactionCount = await Transaction.countDocuments({ user: user._id });
    const budgetCount = await Budget.countDocuments({ user: user._id });
    const goalCount = await FinancialGoal.countDocuments({ user: user._id });
    const investmentCount = await Investment.countDocuments({ user: user._id });

    res.json({
      user,
      summary: {
        transactions: transactionCount,
        budgets: budgetCount,
        goals: goalCount,
        investments: investmentCount
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent super-admin from being modified by admin
    if (user.role === 'super-admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Cannot modify super-admin user' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role && req.user.role === 'super-admin') user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of super-admin
    if (user.role === 'super-admin') {
      return res.status(403).json({ message: 'Cannot delete super-admin user' });
    }

    // Delete user and all related data
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Transaction.deleteMany({ user: req.params.id }),
      Budget.deleteMany({ user: req.params.id }),
      FinancialGoal.deleteMany({ user: req.params.id }),
      Investment.deleteMany({ user: req.params.id }),
      Notification.deleteMany({ user: req.params.id })
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get system statistics
router.get('/stats/system', async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User growth
    const userGrowth = {
      last24Hours: await User.countDocuments({ createdAt: { $gte: last24Hours } }),
      last7Days: await User.countDocuments({ createdAt: { $gte: last7Days } }),
      last30Days: await User.countDocuments({ createdAt: { $gte: last30Days } })
    };

    // Transaction activity
    const transactionActivity = {
      last24Hours: await Transaction.countDocuments({ createdAt: { $gte: last24Hours } }),
      last7Days: await Transaction.countDocuments({ createdAt: { $gte: last7Days } }),
      last30Days: await Transaction.countDocuments({ createdAt: { $gte: last30Days } })
    };

    // Most active users
    const mostActiveUsers = await Transaction.aggregate([
      {
        $group: {
          _id: '$user',
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { transactionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          transactionCount: 1,
          totalAmount: 1
        }
      }
    ]);

    // Popular categories
    const popularCategories = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      userGrowth,
      transactionActivity,
      mostActiveUsers,
      popularCategories
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ message: 'Failed to fetch system statistics' });
  }
});

// Get all transactions (admin view)
router.get('/transactions', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, userId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (userId) filter.user = userId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Get admin transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Send system notification
router.post('/notifications/send', async (req, res) => {
  try {
    const { title, message, type, priority, userIds, channels } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notifications = [];

    if (userIds && userIds.length > 0) {
      // Send to specific users
      for (const userId of userIds) {
        const notification = await Notification.createNotification(userId, {
          type: type || 'system_update',
          title,
          message,
          priority: priority || 'medium',
          channels: channels || { inApp: true, email: false, push: false }
        });
        notifications.push(notification);
      }
    } else {
      // Send to all users
      const users = await User.find({ isActive: true }).select('_id');
      for (const user of users) {
        const notification = await Notification.createNotification(user._id, {
          type: type || 'system_update',
          title,
          message,
          priority: priority || 'medium',
          channels: channels || { inApp: true, email: false, push: false }
        });
        notifications.push(notification);
      }
    }

    res.json({
      message: `Notification sent to ${notifications.length} users`,
      notificationCount: notifications.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

module.exports = router;
