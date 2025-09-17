const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  spent: {
    type: Number,
    default: 0
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 80 // Alert when 80% of budget is spent
    },
    lastAlertSent: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  goals: [{
    name: String,
    targetAmount: Number,
    currentAmount: Number,
    deadline: Date,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes
budgetSchema.index({ user: 1, isActive: 1 });
budgetSchema.index({ user: 1, period: 1 });
budgetSchema.index({ user: 1, startDate: 1, endDate: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

// Virtual for percentage spent
budgetSchema.virtual('percentageSpent').get(function() {
  return this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
});

// Virtual for status
budgetSchema.virtual('status').get(function() {
  const percentage = this.percentageSpent;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'good';
});

// Method to update spent amount
budgetSchema.methods.updateSpent = async function(amount) {
  this.spent += amount;
  await this.save();
  return this;
};

module.exports = mongoose.model('Budget', budgetSchema);
