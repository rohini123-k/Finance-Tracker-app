import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin' && user?.role !== 'super-admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You don't have permission to access the admin panel. 
            This area is restricted to administrators only.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return children;
};

export default AdminRoute;
