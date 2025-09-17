import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import FinanceChatBot from './components/FinanceChatBot';

 


// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Investments from './pages/Investments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

// Hooks
import { useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDarkMode 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }} key={location.pathname}>
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              } />
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              } />
              <Route path="/goals" element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              } />
              <Route path="/investments" element={
                <ProtectedRoute>
                  <Investments />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#333',
          },
        }}

      />
      
          {/* 🔹 Add Finance Chatbot here */}
          <Box sx={{ position: 'fixed', bottom: 24, right: 40, zIndex: 1300, }}>
            <FinanceChatBot apiEndpoint="/api/chatbot/chat" />

          </Box>
    </ThemeProvider>
  );
}


function App() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
      
    </ThemeContextProvider>
  );
}

export default App;
