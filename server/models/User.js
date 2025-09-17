const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super-admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      budgetAlerts: {
        type: Boolean,
        default: true
      },
      goalReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  bankAccounts: [{
    name: String,
    type: {
      type: String,
      enum: ['checking', 'savings', 'credit', 'investment', 'crypto']
    },
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  totalNetWorth: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.twoFactorSecret;
  return user;
};

module.exports = mongoose.model('User', userSchema);
