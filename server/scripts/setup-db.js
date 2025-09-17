const mongoose = require('mongoose');
const config = require('../config');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create indexes for better performance
const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');
    
    // User indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ createdAt: 1 });
    
    // Transaction indexes
    await mongoose.connection.db.collection('transactions').createIndex({ userId: 1, date: -1 });
    await mongoose.connection.db.collection('transactions').createIndex({ userId: 1, category: 1 });
    await mongoose.connection.db.collection('transactions').createIndex({ userId: 1, type: 1 });
    
    // Budget indexes
    await mongoose.connection.db.collection('budgets').createIndex({ userId: 1, isActive: 1 });
    await mongoose.connection.db.collection('budgets').createIndex({ userId: 1, category: 1 });
    
    // Goal indexes
    await mongoose.connection.db.collection('financialgoals').createIndex({ userId: 1, status: 1 });
    await mongoose.connection.db.collection('financialgoals').createIndex({ userId: 1, targetDate: 1 });
    
    // Investment indexes
    await mongoose.connection.db.collection('investments').createIndex({ userId: 1, symbol: 1 });
    await mongoose.connection.db.collection('investments').createIndex({ userId: 1, type: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

// Main setup function
const setupDatabase = async () => {
  try {
    await connectDB();
    await createIndexes();
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { connectDB, createIndexes, setupDatabase };
