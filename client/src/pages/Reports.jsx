import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Assessment,
  Download,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';
import { reportAPI } from '../utils/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import Alert from '@mui/material/Alert';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(1, 'month'),
    endDate: dayjs()
  });
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { value: 'summary', label: 'Financial Summary' },
    { value: 'expenses', label: 'Expense Analysis' },
    { value: 'income', label: 'Income Analysis' },
    { value: 'budgets', label: 'Budget Performance' },
    { value: 'investments', label: 'Investment Performance' },
    { value: 'goals', label: 'Goals Progress' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate.format('YYYY-MM-DD'),
        endDate: dateRange.endDate.format('YYYY-MM-DD')
      };

      let response;
      switch (reportType) {
        case 'summary':
          response = await reportAPI.getSummary(params);
          break;
        case 'expenses':
          response = await reportAPI.getExpenses(params);
          break;
        case 'income':
          response = await reportAPI.getIncome(params);
          break;
        case 'budgets':
          response = await reportAPI.getBudgets(params);
          break;
        case 'investments':
          response = await reportAPI.getInvestments(params);
          break;
        case 'goals':
          response = await reportAPI.getGoals(params);
          break;
        default:
          response = await reportAPI.getSummary(params);
      }

      setReportData(response.data);
    } catch (err) {
      setError('Failed to fetch report data');
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = {
        type: reportType,
        startDate: dateRange.startDate.format('YYYY-MM-DD'),
        endDate: dateRange.endDate.format('YYYY-MM-DD')
      };

      const response = await reportAPI.exportCSV(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Mock data for charts
  const monthlyData = [
    // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    { month: 'Feb', income: 5200, expenses: 3800, savings: 1400 },
    { month: 'Mar', income: 4800, expenses: 3200, savings: 1600 },
    { month: 'Apr', income: 5500, expenses: 4000, savings: 1500 },
    { month: 'May', income: 5300, expenses: 3600, savings: 1700 },
    { month: 'Jun', income: 5100, expenses: 3300, savings: 1800 }
  ];

  const expenseData = [
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
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Reports & Analytics
        </Typography>
        {/* <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button> */}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                >
                  {reportTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={fetchReportData}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportType === 'summary' && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp color="success" />
                  <Typography variant="h6">Total Income</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {formatCurrency(reportData?.summary?.income || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingDown color="error" />
                  <Typography variant="h6">Total Expenses</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {formatCurrency(reportData?.summary?.expenses || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6">Total Savings</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {formatCurrency(reportData?.summary?.savings || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Assessment color="primary" />
                  <Typography variant="h6">Savings Rate</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {reportData?.summary?.savingsRate?.toFixed(1) || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
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
                <Typography variant="h6" gutterBottom>
                  Expense Categories
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {reportType === 'expenses' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expense Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsBarChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {reportType === 'budgets' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget Performance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Budget performance data will be displayed here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {reportType === 'investments' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Investment Performance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Investment performance data will be displayed here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {reportType === 'goals' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Goals Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Goals progress data will be displayed here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
