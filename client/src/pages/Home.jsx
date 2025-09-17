import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  AccountBalanceWallet as TransactionIcon,
  Savings as BudgetIcon,
  Flag as GoalIcon,
  TrendingUp as InvestmentIcon,
  Assessment as ReportIcon,
  Security as SecurityIcon,
  Support as SupportIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: 'Transaction Management',
      description: 'Track income and expenses with smart categorization and receipt OCR',
      icon: <TransactionIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/transactions'
    },
    {
      title: 'Budget Planning',
      description: 'Create and manage budgets with real-time spending alerts',
      icon: <BudgetIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/budgets'
    },
    {
      title: 'Financial Goals',
      description: 'Set and track your financial goals with milestone achievements',
      icon: <GoalIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/goals'
    },
    {
      title: 'Investment Tracking',
      description: 'Monitor your investments and portfolio performance',
      icon: <InvestmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/investments'
    },
    {
      title: 'Reports & Analytics',
      description: 'Get detailed insights into your financial health',
      icon: <ReportIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/reports'
    },
    {
      title: 'AI Assistant',
      description: 'Get personalized financial advice and insights',
      icon: <SupportIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/dashboard'
    }
  ];

  const benefits = [
    'Smart expense categorization using AI',
    'Real-time budget monitoring and alerts',
    'Goal tracking with milestone achievements',
    'Investment portfolio management',
    'Comprehensive financial reports',
    'Secure two-factor authentication',
    'Mobile-responsive design',
    'Dark/Light mode support'
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Take Control of Your Finances
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
            A comprehensive personal finance management app with AI-powered insights, 
            budget tracking, and investment monitoring.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Powerful Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(feature.path)}
                    disabled={!isAuthenticated && feature.path !== '/dashboard'}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Why Choose Our App?
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                We provide everything you need to manage your finances effectively and achieve your financial goals.
              </Typography>
              <List>
                {benefits.map((benefit, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.secondary.light}20 100%)`
                }}
              >
                <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Bank-Level Security
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your financial data is protected with industry-standard encryption 
                  and two-factor authentication.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Ready to Transform Your Financial Life?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of users who have already taken control of their finances.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              bgcolor: 'white',
              color: 'secondary.main',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start Your Free Trial'}
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 4, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" textAlign="center">
            © 2025 Finance App. All rights reserved. Built with React, Node.js, and MongoDB.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
