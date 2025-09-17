import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  People,
  AttachMoney,
  TrendingUp,
  Assessment,
  MoreVert,
  Edit,
  Delete,
  Send,
  Refresh,
  AdminPanelSettings
} from '@mui/icons-material';
import {
  // ...existing code...
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'system_update',
    priority: 'medium',
    userIds: []
  });

  const notificationTypes = [
    { value: 'system_update', label: 'System Update' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'feature', label: 'New Feature' },
    { value: 'security', label: 'Security Alert' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ limit: 50 });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    try {
      await adminAPI.sendNotification(notificationData);
      toast.success('Notification sent successfully');
      setNotificationDialog(false);
      setNotificationData({
        title: '',
        message: '',
        type: 'system_update',
        priority: 'medium',
        userIds: []
      });
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      switch (action) {
        case 'edit':
          // Handle edit user
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            await adminAPI.deleteUser(userId);
            toast.success('User deleted successfully');
            fetchUsers();
          }
          break;
        default:
          break;
      }
    } catch (err) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleMenuOpen = (event, user) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Mock data for charts
  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 150 },
    { month: 'Mar', users: 180 },
    { month: 'Apr', users: 220 },
    { month: 'May', users: 280 },
    { month: 'Jun', users: 350 }
  ];

  const transactionData = [
    { month: 'Jan', transactions: 1200, amount: 50000 },
    { month: 'Feb', transactions: 1500, amount: 65000 },
    { month: 'Mar', transactions: 1800, amount: 78000 },
    { month: 'Apr', transactions: 2200, amount: 95000 },
    { month: 'May', transactions: 2800, amount: 120000 },
    { month: 'Jun', transactions: 3500, amount: 150000 }
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
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AdminPanelSettings sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Admin Dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <People color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {dashboardData?.users?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{dashboardData?.users?.newThisMonth || 0} this month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Income
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(dashboardData?.financial?.totalIncome || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(dashboardData?.financial?.totalExpenses || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Budgets
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {dashboardData?.budgets?.active || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Volume
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                  <Bar dataKey="transactions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Recent Users
            </Typography>
            <Box>
              <IconButton onClick={fetchUsers}>
                <Refresh />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={() => setNotificationDialog(true)}
              >
                Send Notification
              </Button>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'admin' ? 'error' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialog}
        onClose={() => setNotificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send System Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={notificationData.title}
                onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={notificationData.message}
                onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={notificationData.type}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  {notificationTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={notificationData.priority}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  {priorities.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendNotification} variant="contained">
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleUserAction('edit', selectedUser._id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleUserAction('delete', selectedUser._id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminDashboard;
