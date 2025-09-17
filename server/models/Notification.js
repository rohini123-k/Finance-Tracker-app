const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'budget_alert',
      'goal_reminder',
      'transaction_alert',
      'investment_alert',
      'bill_reminder',
      'security_alert',
      'system_update',
      'achievement',
      'ai_insight'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: null
  },
  actionText: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  sentAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ user: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Method to archive
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  await this.save();
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, notificationData) {
  const notification = new this({
    user: userId,
    ...notificationData
  });
  
  await notification.save();
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    user: userId,
    isRead: false,
    isArchived: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
