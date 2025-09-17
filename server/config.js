module.exports = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // Database Configuration
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/finance-app',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',

  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12
};
