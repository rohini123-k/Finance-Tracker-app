# Finance Web App - Complete MERN Stack Application

A comprehensive personal finance management application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring advanced AI capabilities, OCR receipt processing, and real-time financial insights.

## 🚀 Features

### Core Financial Management
- **Transaction Management**: Track income, expenses, and transfers with smart categorization
- **Budget Planning**: Create and manage budgets with real-time spending alerts
- **Financial Goals**: Set and track financial goals with milestone achievements
- **Investment Tracking**: Monitor investment portfolio performance
- **Reports & Analytics**: Comprehensive financial reports and insights

### AI-Powered Features
- **Smart Categorization**: AI automatically categorizes transactions
- **Receipt OCR**: Upload receipts for automatic data extraction
- **Financial Chatbot**: Get personalized financial advice and insights
- **Expense Predictions**: AI predicts future spending patterns
- **Anomaly Detection**: Identifies unusual spending patterns

### Advanced Features
- **Two-Factor Authentication**: Enhanced security with 2FA
- **Dark/Light Mode**: Customizable theme preferences
- **Real-time Notifications**: Budget alerts and goal reminders
- **Multi-currency Support**: Handle multiple currencies
- **Admin Panel**: Comprehensive admin dashboard
- **Mobile Responsive**: PWA-ready for mobile devices

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **OpenAI API** for AI features
- **Tesseract.js** for OCR processing
- **Nodemailer** for email notifications
- **Multer** for file uploads

### Frontend
- **React 18** with functional components and hooks
- **Material-UI (MUI)** for UI components
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls
- **React Dropzone** for file uploads
- **React Hot Toast** for notifications

### Additional Libraries
- **Speakeasy** for 2FA
- **QRCode** for QR code generation
- **Day.js** for date handling
- **Framer Motion** for animations

## 📁 Project Structure

```
finance-web-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File upload directory
│   └── server.js
├── package.json            # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-web-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   **Backend (.env in server/ directory):**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/finance-app
   JWT_SECRET=your-super-secret-jwt-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   NODE_ENV=development
   ```

   **Frontend (.env in client/ directory):**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_OPENAI_API_KEY=your-openai-api-key-here
   REACT_APP_VERSION=1.0.0
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both client and server in development mode
- `npm run install-all` - Install dependencies for both client and server
- `npm start` - Start production server
- `npm run build` - Build frontend for production

### Backend (server/)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend (client/)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/setup-2fa` - Setup 2FA
- `POST /api/auth/verify-2fa` - Verify 2FA

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/upload-receipt` - Upload receipt with OCR

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Financial Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `POST /api/goals/:id/contribute` - Add contribution

### Investments
- `GET /api/investments` - Get all investments
- `POST /api/investments` - Create investment
- `POST /api/investments/update-prices` - Update investment prices

### Reports
- `GET /api/reports/summary` - Financial summary
- `GET /api/reports/expenses` - Expense analysis
- `GET /api/reports/export/csv` - Export data as CSV

### AI Chatbot
- `POST /api/chatbot/chat` - Chat with AI assistant
- `POST /api/chatbot/advice` - Get financial advice
- `POST /api/chatbot/analyze-spending` - Analyze spending patterns

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `POST /api/admin/notifications/send` - Send system notification

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** using bcryptjs
- **Two-Factor Authentication** with TOTP
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS** configuration
- **Helmet.js** for security headers

## 🎨 UI/UX Features

- **Material-UI** design system
- **Dark/Light Mode** toggle
- **Responsive Design** for all devices
- **Interactive Charts** with Recharts
- **Real-time Notifications**
- **Smooth Animations** with Framer Motion
- **Accessibility** compliant

## 📱 Mobile Support

- **Progressive Web App (PWA)** ready
- **Responsive Design** for mobile devices
- **Touch-friendly** interface
- **Offline Support** (basic functionality)

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Heroku)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Get connection string
3. Update MONGO_URI in environment variables

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📈 Performance Optimizations

- **Code Splitting** for faster loading
- **Lazy Loading** of components
- **Image Optimization**
- **API Response Caching**
- **Database Indexing**
- **Compression** middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@financeapp.com or create an issue in the GitHub repository.

## 🔮 Future Enhancements

- **Mobile App** (React Native)
- **Advanced Analytics** with machine learning
- **Bank Integration** via APIs
- **Cryptocurrency** tracking
- **Tax Reporting** features
- **Multi-language** support
- **Voice Commands** integration

---

**Built with ❤️ using the MERN stack and modern web technologies.**
#   F i n a n c e - T r a c k e r - a p p  
 #   F i n a n c e - T r a c k e r - a p p  
 #   F i n a n c e - T r a c k e r - a p p  
 