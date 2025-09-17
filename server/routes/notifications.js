const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all notifications for user
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority, isRead } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get notification by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: 'Failed to fetch notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Archive notification
router.patch('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.archive();

    res.json({ message: 'Notification archived' });
  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({ message: 'Failed to archive notification' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get unread count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { email, push, budgetAlerts, goalReminders } = req.body;

    const user = req.user;
    user.preferences.notifications = {
      email: email !== undefined ? email : user.preferences.notifications.email,
      push: push !== undefined ? push : user.preferences.notifications.push,
      budgetAlerts: budgetAlerts !== undefined ? budgetAlerts : user.preferences.notifications.budgetAlerts,
      goalReminders: goalReminders !== undefined ? goalReminders : user.preferences.notifications.goalReminders
    };

    await user.save();

    res.json({
      message: 'Notification preferences updated',
      preferences: user.preferences.notifications
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

// Get notification statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const total = await Notification.countDocuments({ user: req.user._id });
    const unread = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });
    const archived = await Notification.countDocuments({ 
      user: req.user._id, 
      isArchived: true 
    });

    const byType = await Notification.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const byPriority = await Notification.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      summary: {
        total,
        unread,
        archived,
        read: total - unread
      },
      byType,
      byPriority
    });
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({ message: 'Failed to fetch notification statistics' });
  }
});

module.exports = router;
