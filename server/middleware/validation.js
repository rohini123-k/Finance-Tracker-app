const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Transaction validation rules
const validateTransaction = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .isIn(['income', 'expense', 'transfer'])
    .withMessage('Type must be income, expense, or transfer'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description is required and must be less than 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Budget validation rules
const validateBudget = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Budget name is required and must be less than 100 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be weekly, monthly, quarterly, or yearly'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

// Financial goal validation rules
const validateFinancialGoal = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('type')
    .isIn(['savings', 'debt_payment', 'investment', 'purchase', 'emergency_fund', 'retirement', 'education', 'other'])
    .withMessage('Invalid goal type'),
  body('targetAmount')
    .isNumeric()
    .withMessage('Target amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be greater than 0'),
  body('targetDate')
    .isISO8601()
    .withMessage('Target date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  handleValidationErrors
];

// Investment validation rules
const validateInvestment = [
  body('symbol')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol is required and must be less than 10 characters')
    .isUppercase()
    .withMessage('Symbol must be uppercase'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('type')
    .isIn(['stock', 'bond', 'etf', 'mutual_fund', 'crypto', 'commodity', 'real_estate', 'other'])
    .withMessage('Invalid investment type'),
  body('quantity')
    .isNumeric()
    .withMessage('Quantity must be a number')
    .isFloat({ min: 0.000001 })
    .withMessage('Quantity must be greater than 0'),
  body('averagePrice')
    .isNumeric()
    .withMessage('Average price must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Average price must be greater than 0'),
  body('purchaseDate')
    .isISO8601()
    .withMessage('Purchase date must be a valid ISO 8601 date'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateTransaction,
  validateBudget,
  validateFinancialGoal,
  validateInvestment,
  validateObjectId,
  validatePagination
};
