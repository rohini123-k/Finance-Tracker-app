const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  account: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  tags: [{
    type: String,
    trim: true
  }],
  receipt: {
    url: String,
    ocrText: String,
    aiCategorized: {
      type: Boolean,
      default: false
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    nextDueDate: Date
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  merchant: {
    name: String,
    category: String
  },
  notes: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  aiInsights: {
    confidence: Number,
    suggestions: [String],
    anomalies: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, amount: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

module.exports = mongoose.model('Transaction', transactionSchema);
