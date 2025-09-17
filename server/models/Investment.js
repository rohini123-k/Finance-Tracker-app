const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['stock', 'bond', 'etf', 'mutual_fund', 'crypto', 'commodity', 'real_estate', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  averagePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  portfolio: {
    type: String,
    default: 'main'
  },
  notes: String,
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [{
    type: {
      type: String,
      enum: ['buy', 'sell', 'dividend', 'split', 'merger']
    },
    quantity: Number,
    price: Number,
    date: Date,
    fees: {
      type: Number,
      default: 0
    },
    notes: String
  }],
  performance: {
    dayChange: {
      amount: Number,
      percentage: Number
    },
    totalGainLoss: {
      amount: Number,
      percentage: Number
    },
    annualizedReturn: Number,
    volatility: Number,
    sharpeRatio: Number
  },
  alerts: [{
    type: {
      type: String,
      enum: ['price_above', 'price_below', 'gain_loss_percentage', 'volume_spike']
    },
    value: Number,
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
investmentSchema.index({ user: 1, symbol: 1 });
investmentSchema.index({ user: 1, type: 1 });
investmentSchema.index({ user: 1, isActive: 1 });
investmentSchema.index({ user: 1, portfolio: 1 });

// Virtual for unrealized gain/loss
investmentSchema.virtual('unrealizedGainLoss').get(function() {
  return this.totalValue - this.totalCost;
});

// Virtual for unrealized gain/loss percentage
investmentSchema.virtual('unrealizedGainLossPercentage').get(function() {
  return this.totalCost > 0 ? (this.unrealizedGainLoss / this.totalCost) * 100 : 0;
});

// Method to update current price and total value
investmentSchema.methods.updatePrice = async function(newPrice) {
  this.currentPrice = newPrice;
  this.totalValue = this.quantity * newPrice;
  this.lastUpdated = new Date();
  
  // Update performance metrics
  this.performance.totalGainLoss = this.unrealizedGainLoss;
  this.performance.totalGainLoss.percentage = this.unrealizedGainLossPercentage;
  
  await this.save();
  return this;
};

// Method to add transaction
investmentSchema.methods.addTransaction = async function(transactionData) {
  this.transactions.push(transactionData);
  
  // Update quantity and cost based on transaction type
  if (transactionData.type === 'buy') {
    this.quantity += transactionData.quantity;
    this.totalCost += (transactionData.quantity * transactionData.price) + (transactionData.fees || 0);
    this.averagePrice = this.totalCost / this.quantity;
  } else if (transactionData.type === 'sell') {
    this.quantity -= transactionData.quantity;
    this.totalCost -= (transactionData.quantity * this.averagePrice);
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Investment', investmentSchema);
