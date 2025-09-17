import React, { useState, useEffect } from 'react';
import {
  ListItemIcon,
  ListItemText,
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
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Flag,
  TrendingUp,
  CheckCircle,
  Warning,
  AttachMoney,
  CalendarToday,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { goalAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goalDialog, setGoalDialog] = useState({ open: false, mode: 'add' });
  const [contributionDialog, setContributionDialog] = useState({ open: false });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuGoal, setMenuGoal] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'savings',
    targetAmount: '',
    currentAmount: '0',
    targetDate: dayjs().add(1, 'year'),
    priority: 'medium',
    recurringContribution: {
      amount: '',
      frequency: 'monthly',
    },
  });

  const [contributionData, setContributionData] = useState({
    amount: '',
    description: '',
  });

  const goalTypes = [
    { value: 'savings', label: 'Savings' },
    { value: 'debt_payment', label: 'Debt Payment' },
    { value: 'investment', label: 'Investment' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'emergency_fund', label: 'Emergency Fund' },
    { value: 'retirement', label: 'Retirement' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'critical', label: 'Critical', color: 'error' },
  ];

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalAPI.getGoals();
      setGoals(response.data.goals);
    } catch (err) {
      setError('Failed to fetch goals');
      toast.error('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = () => {
    setFormData({
      title: '',
      description: '',
      type: 'savings',
      targetAmount: '',
      currentAmount: '0',
      targetDate: dayjs().add(1, 'year'),
      priority: 'medium',
      recurringContribution: {
        amount: '',
        frequency: 'monthly',
      },
    });
    setGoalDialog({ open: true, mode: 'add' });
  };

  const handleEditGoal = (goal) => {
    setFormData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: dayjs(goal.targetDate),
      priority: goal.priority,
      recurringContribution: {
        amount: goal.recurringContribution?.amount?.toString() || '',
        frequency: goal.recurringContribution?.frequency || 'monthly',
      },
    });
    setSelectedGoal(goal);
    setGoalDialog({ open: true, mode: 'edit' });
  };

  const handleSaveGoal = async () => {
    try {
      const goalData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate: formData.targetDate.format('YYYY-MM-DD'),
        recurringContribution: {
          amount: parseFloat(formData.recurringContribution.amount) || 0,
          frequency: formData.recurringContribution.frequency,
        },
      };

      if (goalDialog.mode === 'add') {
        await goalAPI.createGoal(goalData);
        toast.success('Goal created successfully');
      } else {
        await goalAPI.updateGoal(selectedGoal._id, goalData);
        toast.success('Goal updated successfully');
      }

      setGoalDialog({ open: false, mode: 'add' });
      fetchGoals();
    } catch (err) {
      toast.error('Failed to save goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalAPI.deleteGoal(goalId);
        toast.success('Goal deleted successfully');
        fetchGoals();
      } catch (err) {
        toast.error('Failed to delete goal');
      }
    }
  };

  const handleAddContribution = (goal) => {
    setSelectedGoal(goal);
    setContributionData({ amount: '', description: '' });
    setContributionDialog({ open: true });
  };

  const handleSaveContribution = async () => {
    try {
      await goalAPI.addContribution(selectedGoal._id, contributionData);
      toast.success('Contribution added successfully');
      setContributionDialog({ open: false });
      fetchGoals();
    } catch (err) {
      toast.error('Failed to add contribution');
    }
  };

  // ✅ Fixed: no more "default" color for LinearProgress
  const getGoalStatus = (goal) => {
    const progress = goal.progressPercentage;
    const daysLeft = goal.daysRemaining;

    if (progress >= 100) return { status: 'completed', color: 'success', icon: <CheckCircle /> };
    if (daysLeft < 0) return { status: 'overdue', color: 'error', icon: <Warning /> };
    if (progress >= 80) return { status: 'almost_there', color: 'warning', icon: <TrendingUp /> };
    if (progress >= 50) return { status: 'on_track', color: 'info', icon: <TrendingUp /> };
    if (progress >= 25) return { status: 'getting_started', color: 'primary', icon: <Flag /> };
    return { status: 'just_started', color: 'info', icon: <Flag /> }; // changed from "default" → "info"
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleMenuOpen = (event, goal) => {
    setMenuAnchor(event.currentTarget);
    setMenuGoal(goal);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuGoal(null);
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
          Financial Goals
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddGoal}
        >
          Create Goal
        </Button>
      </Box>

      {/* Goals Grid */}
      <Grid container spacing={3}>
        {goals.map((goal) => {
          const status = getGoalStatus(goal);
          const priority = priorities.find((p) => p.value === goal.priority);

          return (
            <Grid item xs={12} md={6} lg={4} key={goal._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {goal.title}
                    </Typography>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, goal)}>
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {goal.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={goalTypes.find((t) => t.value === goal.type)?.label}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={priority?.label}
                      size="small"
                      color={priority?.color}
                      variant="outlined"
                    />
                    <Chip
                      label={goal.status}
                      size="small"
                      color={status.color}
                    />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {(typeof goal.progressPercentage === 'number'
                          ? goal.progressPercentage
                          : 0
                        ).toFixed(1)}
                        %
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progressPercentage}
                      color={status.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Current Amount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(goal.currentAmount)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Target Amount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(goal.targetAmount)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(goal.remainingAmount)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {status.icon}
                    <Typography variant="body2" color={status.color} sx={{ fontWeight: 500 }}>
                      {status.status.charAt(0).toUpperCase() +
                        status.status.slice(1).replace('_', ' ')}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {goal.daysRemaining > 0
                        ? `${goal.daysRemaining} days left`
                        : `${Math.abs(goal.daysRemaining)} days overdue`}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {goals.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Flag sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No goals set yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first financial goal to start building towards your dreams.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddGoal}>
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Goal Dialog */}
      <Dialog
        open={goalDialog.open}
        onClose={() => setGoalDialog({ open: false, mode: 'add' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {goalDialog.mode === 'add' ? 'Create Goal' : 'Edit Goal'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Goal Title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  {goalTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Amount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))}
                required
                InputProps={{
                  startAdornment: <AttachMoney />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Amount"
                type="number"
                value={formData.currentAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, currentAmount: e.target.value }))}
                InputProps={{
                  startAdornment: <AttachMoney />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Target Date"
                  value={formData.targetDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, targetDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Recurring Contribution (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={formData.recurringContribution.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringContribution: {
                          ...prev.recurringContribution,
                          amount: e.target.value,
                        },
                      }))
                    }
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={formData.recurringContribution.frequency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurringContribution: {
                            ...prev.recurringContribution,
                            frequency: e.target.value,
                          },
                        }))
                      }
                      label="Frequency"
                    >
                      {frequencies.map((freq) => (
                        <MenuItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialog({ open: false, mode: 'add' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveGoal} variant="contained">
            {goalDialog.mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

     
     


      {/* Contribution Dialog */}
      <Dialog
        open={contributionDialog.open}
        onClose={() => setContributionDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Contribution</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={contributionData.amount}
                onChange={(e) => setContributionData(prev => ({ ...prev, amount: e.target.value }))}
                required
                InputProps={{
                  startAdornment: <AttachMoney />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={contributionData.description}
                onChange={(e) => setContributionData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContributionDialog({ open: false })}>
            Cancel
          </Button>
          <Button onClick={handleSaveContribution} variant="contained">
            Add Contribution
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
          handleEditGoal(menuGoal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleAddContribution(menuGoal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <AttachMoney fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Contribution</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteGoal(menuGoal._id);
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
        onClick={handleAddGoal}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Goals;
