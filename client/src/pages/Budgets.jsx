import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  // ...existing code...
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  TrendingUp,
  Warning,
  CheckCircle,
  Savings,
  AttachMoney,
  // ...existing code...
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { budgetAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetDialog, setBudgetDialog] = useState({ open: false, mode: 'add' });
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuBudget, setMenuBudget] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    amount: '',
    period: 'monthly',
    startDate: dayjs(),
    endDate: dayjs().add(1, 'month'),
    alerts: {
      enabled: true,
      threshold: 80
    }
  });

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Investment',
    'Other'
  ];

  const periods = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getBudgets();
      setBudgets(response.data.budgets);
    } catch (err) {
      setError('Failed to fetch budgets');
      toast.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      subcategory: '',
      amount: '',
      period: 'monthly',
      startDate: dayjs(),
      endDate: dayjs().add(1, 'month'),
      alerts: {
        enabled: true,
        threshold: 80
      }
    });
    setBudgetDialog({ open: true, mode: 'add' });
  };

  const handleEditBudget = (budget) => {
    setFormData({
      name: budget.name,
      description: budget.description || '',
      category: budget.category,
      subcategory: budget.subcategory || '',
      amount: budget.amount.toString(),
      period: budget.period,
      startDate: dayjs(budget.startDate),
      endDate: dayjs(budget.endDate),
      alerts: {
        enabled: budget.alerts.enabled,
        threshold: budget.alerts.threshold
      }
    });
    setSelectedBudget(budget);
    setBudgetDialog({ open: true, mode: 'edit' });
  };

  const handleSaveBudget = async () => {
    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        startDate: formData.startDate.format('YYYY-MM-DD'),
        endDate: formData.endDate.format('YYYY-MM-DD')
      };

      if (budgetDialog.mode === 'add') {
        await budgetAPI.createBudget(budgetData);
        toast.success('Budget created successfully');
      } else {
        await budgetAPI.updateBudget(selectedBudget._id, budgetData);
        toast.success('Budget updated successfully');
      }

      setBudgetDialog({ open: false, mode: 'add' });
      fetchBudgets();
    } catch (err) {
      toast.error('Failed to save budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetAPI.deleteBudget(budgetId);
        toast.success('Budget deleted successfully');
        fetchBudgets();
      } catch (err) {
        toast.error('Failed to delete budget');
      }
    }
  };

  const handleToggleBudget = async (budgetId) => {
    try {
      await budgetAPI.toggleBudget(budgetId);
      toast.success('Budget status updated');
      fetchBudgets();
    } catch (err) {
      toast.error('Failed to update budget status');
    }
  };

  const getBudgetStatus = (budget) => {
    const percentage = budget.percentageSpent;
    if (percentage >= 100) return { status: 'exceeded', color: 'error', icon: <Warning /> };
    if (percentage >= 90) return { status: 'critical', color: 'warning', icon: <Warning /> };
    if (percentage >= 80) return { status: 'warning', color: 'warning', icon: <Warning /> };
    return { status: 'good', color: 'success', icon: <CheckCircle /> };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleMenuOpen = (event, budget) => {
    setMenuAnchor(event.currentTarget);
    setMenuBudget(budget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuBudget(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Budgets
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddBudget}
        >
          Create Budget
        </Button>
      </Box>

      {/* Budgets Grid */}
      <Grid container spacing={3}>
        {budgets.map((budget) => {
          const status = getBudgetStatus(budget);
          return (
            <Grid item xs={12} md={6} lg={4} key={budget._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {budget.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, budget)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {budget.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={budget.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={budget.period}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                    {!budget.isActive && (
                      <Chip
                        label="Inactive"
                        size="small"
                        color="default"
                      />
                    )}
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {typeof budget.percentageSpent === 'number' ? budget.percentageSpent.toFixed(1) : '0.0'}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budget.percentageSpent, 100)}
                      color={status.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Spent
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(budget.spent)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(budget.amount)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: budget.remaining >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(budget.remaining)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    {status.icon}
                    <Typography
                      variant="body2"
                      color={`${status.color}.main`}
                      sx={{ fontWeight: 500 }}
                    >
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {budgets.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Savings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No budgets created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first budget to start tracking your spending and achieving your financial goals.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddBudget}
            >
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Budget Dialog */}
      <Dialog
        open={budgetDialog.open}
        onClose={() => setBudgetDialog({ open: false, mode: 'add' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {budgetDialog.mode === 'add' ? 'Create Budget' : 'Edit Budget'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Budget Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subcategory: ''
                  }))}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Subcategory</InputLabel>
                <Select
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  label="Subcategory"
                >
                  <MenuItem value="">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                InputProps={{
                  startAdornment: <AttachMoney />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Period</InputLabel>
                <Select
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                  label="Period"
                >
                  {periods.map(period => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Alert Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Alert Threshold (%)"
                    type="number"
                    value={formData.alerts.threshold}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      alerts: { ...prev.alerts, threshold: parseInt(e.target.value) }
                    }))}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBudgetDialog({ open: false, mode: 'add' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveBudget} variant="contained">
            {budgetDialog.mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleEditBudget(menuBudget);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleToggleBudget(menuBudget._id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {menuBudget?.isActive ? <CheckCircle fontSize="small" /> : <TrendingUp fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {menuBudget?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteBudget(menuBudget._id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddBudget}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Budgets;
