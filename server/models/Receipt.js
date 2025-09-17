const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  ocrText: {
    type: String,
    default: null
  },
  extractedData: {
    merchant: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: null
    },
    date: {
      type: Date,
      default: null
    },
    items: [{
      name: String,
      price: Number,
      quantity: Number
    }],
    tax: {
      type: Number,
      default: null
    },
    total: {
      type: Number,
      default: null
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  aiAnalysis: {
    confidence: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      default: null
    },
    subcategory: {
      type: String,
      default: null
    },
    tags: [String],
    suggestions: [String],
    anomalies: [String]
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
receiptSchema.index({ user: 1, createdAt: -1 });
receiptSchema.index({ user: 1, processingStatus: 1 });
receiptSchema.index({ transaction: 1 });

// Virtual for file URL
receiptSchema.virtual('fileUrl').get(function() {
  return `/api/receipts/${this._id}/file`;
});

// Method to update processing status
receiptSchema.methods.updateProcessingStatus = async function(status, error = null) {
  this.processingStatus = status;
  if (error) {
    this.processingError = error;
  }
  await this.save();
  return this;
};

// Method to verify receipt
receiptSchema.methods.verify = async function(verifiedBy) {
  this.isVerified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  await this.save();
  return this;
};

module.exports = mongoose.model('Receipt', receiptSchema);
