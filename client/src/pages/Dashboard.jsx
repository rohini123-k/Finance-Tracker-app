import React, { useState, useEffect } from 'react';
 

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  // ...existing code...
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Savings,
  Flag,
  Assessment,
  Refresh,
  Add,
  ArrowUpward,
  ArrowDownward,
  Warning,
  // ...existing code...
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI, transactionAPI, budgetAPI, goalAPI, investmentAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, transactions, budgets, goals, investments] = await Promise.all([
        reportAPI.getDashboard(),
        transactionAPI.getTransactions({ limit: 5 }),
        budgetAPI.getStats(),
        goalAPI.getStats(),
        investmentAPI.getStats()
      ]);

      setDashboardData({
        ...dashboard.data,
        budgets: budgets.data,
        goals: goals.data,
        investments: investments.data
      });
      setRecentTransactions(transactions.data.transactions);
      
      // Mock budget alerts - in real app, this would come from the API
      setBudgetAlerts([
        { id: 1, message: 'Food budget 85% used', severity: 'warning' },
        { id: 2, message: 'Entertainment budget exceeded', severity: 'error' }
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // ...existing code...

  // Mock data for charts
  // const monthlyTrends = [
  //   { month: 'Jan', income: 5000, expenses: 3500, savings: 1500 },
  //   { month: 'Feb', income: 5200, expenses: 3800, savings: 1400 },
  //   { month: 'Mar', income: 4800, expenses: 3200, savings: 1600 },
  //   { month: 'Apr', income: 5500, expenses: 4000, savings: 1500 },
  //   { month: 'May', income: 5300, expenses: 3600, savings: 1700 },
  //   { month: 'Jun', income: 5100, expenses: 3300, savings: 1800 }
  // ];
const monthlyTrends = [
  { month: 'Jan', income: 5000, expenses: 3500, savings: 1500 },
  { month: 'Feb', income: 5200, expenses: 3800, savings: 1400 },
  { month: 'Mar', income: 4800, expenses: 3200, savings: 1600 },
  { month: 'Apr', income: 5500, expenses: 4000, savings: 1500 },
  { month: 'May', income: 5300, expenses: 3600, savings: 1700 },
  { month: 'Jun', income: 5100, expenses: 3300, savings: 1800 },
  { month: 'Jul', income: 5600, expenses: 3900, savings: 1700 },
  { month: 'Aug', income: 5800, expenses: 4100, savings: 1700 },
  { month: 'Sep', income: 6000, expenses: 3600, savings: 1800 },
  { month: 'Oct', income: 5800, expenses: 3000, savings: 1800 },
  { month: 'Nov', income: 6000, expenses: 4600, savings: 1800 },
  { month: 'Dec', income: 5800, expenses: 3600, savings: 2000 }
];


  const expenseCategories = [
    { name: 'Food', value: 1200, color: '#0088FE' },
    { name: 'Transportation', value: 800, color: '#00C49F' },
    { name: 'Entertainment', value: 600, color: '#FFBB28' },
    { name: 'Shopping', value: 400, color: '#FF8042' },
    { name: 'Others', value: 300, color: '#8884D8' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchDashboardData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your financial health
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Monthly Income
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(dashboardData?.currentMonth?.income || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <ArrowUpward color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +5.2% from last month
                    </Typography>
                  </Box>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Monthly Expenses
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(dashboardData?.currentMonth?.expenses || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <ArrowDownward color="error" fontSize="small" />
                    <Typography variant="body2" color="error.main" sx={{ ml: 0.5 }}>
                      -2.1% from last month
                    </Typography>
                  </Box>
                </Box>
                <TrendingDown color="error" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Monthly Savings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(dashboardData?.currentMonth?.savings || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <ArrowUpward color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +12.3% from last month
                    </Typography>
                  </Box>
                </Box>
                <Savings color="success" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Net Worth
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(dashboardData?.netWorth || 0)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <ArrowUpward color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +8.7% this year
                    </Typography>
                  </Box>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Monthly Trends
                </Typography>
                <IconButton onClick={fetchDashboardData} size="small">
                  <Refresh />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Expense Categories
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Transactions
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate('/transactions')}
                >
                  Add
                </Button>
              </Box>
              <List>
                {recentTransactions.slice(0, 5).map((transaction, index) => (
                  <React.Fragment key={transaction._id}>
                    <ListItem>
                      <ListItemIcon>
                        {transaction.type === 'income' ? (
                          <ArrowUpward color="success" />
                        ) : (
                          <ArrowDownward color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={transaction.description}
                        secondary={`${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}`}
                      />
                      <Typography
                        variant="body2"
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        sx={{ fontWeight: 600 }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Typography>
                    </ListItem>
                    {index < recentTransactions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Alerts & Goals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Budget Alerts
              </Typography>
              <List>
                {budgetAlerts.map((alert) => (
                  <ListItem key={alert.id}>
                    <ListItemIcon>
                      {alert.severity === 'error' ? (
                        <Warning color="error" />
                      ) : (
                        <Warning color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={alert.message} />
                    <Chip
                      label={alert.severity}
                      color={alert.severity === 'error' ? 'error' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/transactions')}
          >
            Add Transaction
          </Button>
          <Button
            variant="outlined"
            startIcon={<Savings />}
            onClick={() => navigate('/budgets')}
          >
            Create Budget
          </Button>
          <Button
            variant="outlined"
            startIcon={<Flag />}
            onClick={() => navigate('/goals')}
          >
            Set Goal
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/reports')}
          >
            View Reports
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;


