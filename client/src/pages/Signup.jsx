import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PersonAdd as SignupIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password
    });
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setIsSubmitting(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: isDarkMode 
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <SignupIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join thousands of users managing their finances effectively
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  error={!!validationErrors.firstName}
                  helperText={validationErrors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  error={!!validationErrors.lastName}
                  helperText={validationErrors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              sx={{ mt: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              sx={{ mt: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              sx={{ mt: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              }
              label={
                <Typography variant="body2" color={validationErrors.agreeToTerms ? 'error' : 'text.primary'}>
                  I agree to the{' '}
                  <Link href="#" color="primary">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="#" color="primary">
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mt: 3, mb: 2 }}
            />
            {validationErrors.agreeToTerms && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: -1, mb: 2 }}>
                {validationErrors.agreeToTerms}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isLoading}
              sx={{ mt: 3, py: 1.5 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  color="primary"
                  sx={{ textDecoration: 'none', fontWeight: 500 }}
                  onClick={() => clearError()}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Features Preview */}
        <Paper
          sx={{
            mt: 3,
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.paper',
            opacity: 0.9
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            What you'll get:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Smart expense tracking • Budget management • Financial goals • Investment monitoring • AI insights
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
