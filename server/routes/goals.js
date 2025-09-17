const express = require('express');
const FinancialGoal = require('../models/FinancialGoal');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { authenticateToken, authorizeResource } = require('../middleware/auth');
const { validateFinancialGoal, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all financial goals for user
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, priority } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const goals = await FinancialGoal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FinancialGoal.countDocuments(filter);

    res.json({
      goals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Failed to fetch financial goals' });
  }
});

// Get goal by ID
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Failed to fetch financial goal' });
  }
});

// Create new financial goal
router.post('/', authenticateToken, validateFinancialGoal, async (req, res) => {
  try {
    const goalData = {
      ...req.body,
      user: req.user._id,
      targetDate: new Date(req.body.targetDate)
    };

    const goal = new FinancialGoal(goalData);
    await goal.save();

    // Set up recurring contribution if specified
    if (goal.recurringContribution.amount > 0) {
      await setupRecurringContribution(goal);
    }

    res.status(201).json({
      message: 'Financial goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Failed to create financial goal' });
  }
});

// Update financial goal
router.put('/:id', authenticateToken, validateObjectId('id'), validateFinancialGoal, async (req, res) => {
  try {
    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    // Update goal
    Object.assign(goal, req.body);
    if (req.body.targetDate) goal.targetDate = new Date(req.body.targetDate);
    
    await goal.save();

    // Update recurring contribution if changed
    if (req.body.recurringContribution) {
      await setupRecurringContribution(goal);
    }

    res.json({
      message: 'Financial goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Failed to update financial goal' });
  }
});

// Delete financial goal
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    await FinancialGoal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Financial goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Failed to delete financial goal' });
  }
});

// Add contribution to goal
router.post('/:id/contribute', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { amount, description = '' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid contribution amount is required' });
    }

    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    if (goal.status !== 'active') {
      return res.status(400).json({ message: 'Cannot contribute to inactive goal' });
    }

    // Add contribution
    await goal.addContribution(amount, description);

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      amount: -amount, // Negative for goal contribution
      type: 'expense',
      category: 'savings',
      subcategory: 'goal_contribution',
      description: `Contribution to goal: ${goal.title}${description ? ` - ${description}` : ''}`,
      date: new Date()
    });
    await transaction.save();

    // Check for milestone achievements
    const achievedMilestones = goal.milestones.filter(m => m.isAchieved && !m.achievedDate);
    for (const milestone of achievedMilestones) {
      await Notification.createNotification(req.user._id, {
        type: 'achievement',
        title: 'Milestone Achieved!',
        message: `Congratulations! You've reached the "${milestone.name}" milestone for your goal "${goal.title}".`,
        priority: 'medium',
        metadata: { goalId: goal._id, milestoneId: milestone._id }
      });
    }

    // Check if goal is completed
    if (goal.status === 'completed') {
      await Notification.createNotification(req.user._id, {
        type: 'achievement',
        title: 'Goal Completed!',
        message: `Congratulations! You've successfully completed your goal "${goal.title}".`,
        priority: 'high',
        metadata: { goalId: goal._id }
      });
    }

    res.json({
      message: 'Contribution added successfully',
      goal
    });
  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({ message: 'Failed to add contribution' });
  }
});

// Update goal status
router.patch('/:id/status', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    goal.status = status;
    await goal.save();

    res.json({
      message: `Goal status updated to ${status}`,
      goal
    });
  } catch (error) {
    console.error('Update goal status error:', error);
    res.status(500).json({ message: 'Failed to update goal status' });
  }
});

// Add milestone to goal
router.post('/:id/milestones', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const { name, targetAmount, deadline } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ message: 'Milestone name and target amount are required' });
    }

    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    const milestone = {
      name,
      targetAmount,
      currentAmount: 0,
      deadline: deadline ? new Date(deadline) : null,
      isCompleted: false
    };

    goal.milestones.push(milestone);
    await goal.save();

    res.json({
      message: 'Milestone added successfully',
      goal
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ message: 'Failed to add milestone' });
  }
});

// Setup recurring contribution
const setupRecurringContribution = async (goal) => {
  try {
    if (!goal.recurringContribution.amount || goal.recurringContribution.amount <= 0) {
      return;
    }

    const now = new Date();
    let nextContributionDate = new Date(now);

    // Calculate next contribution date based on frequency
    switch (goal.recurringContribution.frequency) {
      case 'weekly':
        nextContributionDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextContributionDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        nextContributionDate.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        nextContributionDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    goal.recurringContribution.nextContributionDate = nextContributionDate;
    await goal.save();

    // Schedule reminder notification
    await Notification.createNotification(goal.user, {
      type: 'goal_reminder',
      title: 'Recurring Contribution Due',
      message: `It's time to make your recurring contribution of ${goal.recurringContribution.amount} to your goal "${goal.title}".`,
      priority: 'medium',
      metadata: { goalId: goal._id, amount: goal.recurringContribution.amount },
      expiresAt: nextContributionDate
    });
  } catch (error) {
    console.error('Setup recurring contribution error:', error);
  }
};

// Get goal statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const goals = await FinancialGoal.find({
      user: req.user._id
    });

    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    const goalsByType = goals.reduce((acc, goal) => {
      acc[goal.type] = (acc[goal.type] || 0) + 1;
      return acc;
    }, {});

    const goalsByPriority = goals.reduce((acc, goal) => {
      acc[goal.priority] = (acc[goal.priority] || 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        totalTargetAmount,
        totalCurrentAmount,
        totalProgress,
        averageProgress: activeGoals.length > 0 ? totalProgress / activeGoals.length : 0
      },
      goalsByType,
      goalsByPriority,
      recentGoals: goals.slice(0, 5)
    });
  } catch (error) {
    console.error('Goal stats error:', error);
    res.status(500).json({ message: 'Failed to fetch goal statistics' });
  }
});

// Get goal progress over time
router.get('/:id/progress', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const goal = await FinancialGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Financial goal not found' });
    }

    // Get contribution history from transactions
    const contributions = await Transaction.find({
      user: req.user._id,
      category: 'savings',
      subcategory: 'goal_contribution',
      description: { $regex: goal.title, $options: 'i' }
    }).sort({ date: 1 });

    const progressData = [];
    let cumulativeAmount = 0;

    for (const contribution of contributions) {
      cumulativeAmount += Math.abs(contribution.amount);
      progressData.push({
        date: contribution.date,
        amount: Math.abs(contribution.amount),
        cumulativeAmount,
        percentage: (cumulativeAmount / goal.targetAmount) * 100
      });
    }

    res.json({
      goal: {
        id: goal._id,
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progressPercentage: goal.progressPercentage
      },
      progressData
    });
  } catch (error) {
    console.error('Goal progress error:', error);
    res.status(500).json({ message: 'Failed to fetch goal progress' });
  }
});

// Process recurring contributions (to be called by cron job)
router.post('/process-recurring', async (req, res) => {
  try {
    const now = new Date();
    const goals = await FinancialGoal.find({
      'recurringContribution.amount': { $gt: 0 },
      'recurringContribution.nextContributionDate': { $lte: now },
      status: 'active'
    });

    for (const goal of goals) {
      // Create reminder notification
      await Notification.createNotification(goal.user, {
        type: 'goal_reminder',
        title: 'Recurring Contribution Due',
        message: `It's time to make your recurring contribution of ${goal.recurringContribution.amount} to your goal "${goal.title}".`,
        priority: 'medium',
        metadata: { goalId: goal._id, amount: goal.recurringContribution.amount }
      });

      // Calculate next contribution date
      let nextDate = new Date(goal.recurringContribution.nextContributionDate);
      switch (goal.recurringContribution.frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      goal.recurringContribution.nextContributionDate = nextDate;
      await goal.save();
    }

    res.json({ message: `Processed ${goals.length} recurring contributions` });
  } catch (error) {
    console.error('Process recurring contributions error:', error);
    res.status(500).json({ message: 'Failed to process recurring contributions' });
  }
});

module.exports = router;
