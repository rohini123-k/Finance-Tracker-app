const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['savings', 'debt_payment', 'investment', 'purchase', 'emergency_fund', 'retirement', 'education', 'other'],
    required: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  recurringContribution: {
    amount: {
      type: Number,
      default: 0
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    nextContributionDate: Date
  },
  milestones: [{
    name: String,
    targetAmount: Number,
    achievedDate: Date,
    isAchieved: {
      type: Boolean,
      default: false
    }
  }],
  notes: String,
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  aiInsights: {
    suggestedContribution: Number,
    riskAssessment: String,
    timelineAdjustment: String,
    tips: [String]
  }
}, {
  timestamps: true
});

// Indexes
financialGoalSchema.index({ user: 1, status: 1 });
financialGoalSchema.index({ user: 1, type: 1 });
financialGoalSchema.index({ user: 1, targetDate: 1 });
financialGoalSchema.index({ user: 1, priority: 1 });

// Virtual for progress percentage
financialGoalSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Virtual for remaining amount
financialGoalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Virtual for days remaining
financialGoalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for status based on progress and time
financialGoalSchema.virtual('completionStatus').get(function() {
  const progress = this.progressPercentage;
  const daysLeft = this.daysRemaining;
  
  if (progress >= 100) return 'completed';
  if (daysLeft < 0) return 'overdue';
  if (progress >= 80) return 'almost_there';
  if (progress >= 50) return 'on_track';
  if (progress >= 25) return 'getting_started';
  return 'just_started';
});

// Method to add contribution
financialGoalSchema.methods.addContribution = async function(amount, description = '') {
  this.currentAmount += amount;
  
  // Check if any milestones are achieved
  this.milestones.forEach(milestone => {
    if (!milestone.isAchieved && this.currentAmount >= milestone.targetAmount) {
      milestone.isAchieved = true;
      milestone.achievedDate = new Date();
    }
  });
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
