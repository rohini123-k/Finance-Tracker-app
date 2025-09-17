# Finance App Setup Guide

This guide will help you set up the Finance App with proper CORS configuration and database connectivity.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The app will connect to `mongodb://localhost:27017/finance-app`

#### Option B: MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGO_URI` in `server/config.js` or create a `.env` file

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/finance-app
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-app?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_OPENAI_API_KEY=your-openai-api-key-here
REACT_APP_VERSION=1.0.0
```

### 4. Start the Application

#### Start the Backend Server
```bash
cd server
npm run dev
```

#### Start the Frontend Client
```bash
cd client
npm start
```

## CORS Configuration

The server is configured with proper CORS settings to allow:
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:3000` (Alternative localhost)
- `http://localhost:3001` (Alternative port)
- `http://127.0.0.1:3001` (Alternative localhost port)

## Database Setup Script

Run the database setup script to create indexes and optimize performance:

```bash
cd server
npm run setup-db
```

## Health Check

Test the server connection:
- Visit `http://localhost:5000/api/health`
- Should return server status and database connection status

## Troubleshooting

### CORS Errors
If you're still getting CORS errors:
1. Make sure both servers are running
2. Check that the frontend is running on port 3000
3. Verify the CORS configuration in `server/server.js`
4. Clear browser cache and try again

### Database Connection Issues
1. Ensure MongoDB is running (if using local installation)
2. Check your connection string in the environment variables
3. Verify network connectivity to MongoDB Atlas (if using cloud)

### Port Conflicts
If ports 3000 or 5000 are in use:
1. Change the PORT in server configuration
2. Update the REACT_APP_API_URL in client configuration
3. Update the FRONTEND_URL in server configuration

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Update CORS origins to your production domain
3. Use a secure JWT secret
4. Configure proper MongoDB Atlas connection
5. Set up environment variables on your hosting platform

## API Endpoints

- Health Check: `GET /api/health`
- Authentication: `/api/auth/*`
- Transactions: `/api/transactions/*`
- Budgets: `/api/budgets/*`
- Goals: `/api/goals/*`
- Investments: `/api/investments/*`
- Reports: `/api/reports/*`
- Admin: `/api/admin/*`

## Support

If you encounter any issues:
1. Check the console logs for both client and server
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that MongoDB is accessible
