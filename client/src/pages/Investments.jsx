import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
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
  CircularProgress,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShowChart,
  Refresh
} from '@mui/icons-material';
import { investmentAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed unused error state
  const [investmentDialog, setInvestmentDialog] = useState({ open: false, mode: 'add' });
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuInvestment, setMenuInvestment] = useState(null);
    const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock',
    quantity: '',
    averagePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const investmentTypes = [
    { value: 'stock', label: 'Stock' },
    { value: 'bond', label: 'Bond' },
    { value: 'etf', label: 'ETF' },
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'commodity', label: 'Commodity' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await investmentAPI.getInvestments();
      setInvestments(response.data.investments);
    } catch (err) {
      setError('Failed to fetch investments');
      toast.error('Failed to fetch investments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = () => {
    setFormData({
      symbol: '',
      name: '',
      type: 'stock',
      quantity: '',
      averagePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setInvestmentDialog({ open: true, mode: 'add' });
  };

  const handleEditInvestment = (investment) => {
    setFormData({
      symbol: investment.symbol,
      name: investment.name,
      type: investment.type,
      quantity: investment.quantity.toString(),
      averagePrice: investment.averagePrice.toString(),
      purchaseDate: investment.purchaseDate.split('T')[0],
      notes: investment.notes || ''
    });
    setSelectedInvestment(investment);
    setInvestmentDialog({ open: true, mode: 'edit' });
  };

  const handleSaveInvestment = async () => {
    try {
      const investmentData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        averagePrice: parseFloat(formData.averagePrice)
      };

      if (investmentDialog.mode === 'add') {
        await investmentAPI.createInvestment(investmentData);
        toast.success('Investment added successfully');
      } else {
        await investmentAPI.updateInvestment(selectedInvestment._id, investmentData);
        toast.success('Investment updated successfully');
      }

      setInvestmentDialog({ open: false, mode: 'add' });
      fetchInvestments();
    } catch (err) {
      toast.error('Failed to save investment');
    }
  };

  const handleDeleteInvestment = async (investmentId) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await investmentAPI.deleteInvestment(investmentId);
        toast.success('Investment deleted successfully');
        fetchInvestments();
      } catch (err) {
        toast.error('Failed to delete investment');
      }
    }
  };

  const handleUpdatePrices = async () => {
    try {
      await investmentAPI.updatePrices();
      toast.success('Prices updated successfully');
      fetchInvestments();
    } catch (err) {
      toast.error('Failed to update prices');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getGainLossColor = (amount) => {
    return amount >= 0 ? 'success.main' : 'error.main';
  };

  const handleMenuOpen = (event, investment) => {
    setMenuAnchor(event.currentTarget);
    setMenuInvestment(investment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuInvestment(null);
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
          Investments
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleUpdatePrices}
          >
            Update Prices
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddInvestment}
          >
            Add Investment
          </Button>
        </Box>
      </Box>

      {/* Investments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Avg Price</TableCell>
                <TableCell>Current Price</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell>Gain/Loss</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {investments.map((investment) => (
                <TableRow key={investment._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {investment.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>{investment.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={investmentTypes.find(t => t.value === investment.type)?.label}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{investment.quantity}</TableCell>
                  <TableCell>{formatCurrency(investment.averagePrice)}</TableCell>
                  <TableCell>{formatCurrency(investment.currentPrice)}</TableCell>
                  <TableCell>{formatCurrency(investment.totalValue)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {investment.unrealizedGainLoss >= 0 ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={getGainLossColor(investment.unrealizedGainLoss)}
                        sx={{ fontWeight: 600 }}
                      >
                        {formatCurrency(investment.unrealizedGainLoss)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, investment)}
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
      </Card>

      {/* Empty State */}
      {investments.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ShowChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No investments tracked yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Start tracking your investments to monitor your portfolio performance.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddInvestment}
            >
              Add Your First Investment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Investment Dialog */}
      <Dialog
        open={investmentDialog.open}
        onClose={() => setInvestmentDialog({ open: false, mode: 'add' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {investmentDialog.mode === 'add' ? 'Add Investment' : 'Edit Investment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                required
                placeholder="e.g., AAPL"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  {investmentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Apple Inc."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
                inputProps={{ min: 0, step: 0.000001 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Average Price"
                type="number"
                value={formData.averagePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, averagePrice: e.target.value }))}
                required
                InputProps={{
                  startAdornment: <AttachMoney />
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvestmentDialog({ open: false, mode: 'add' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveInvestment} variant="contained">
            {investmentDialog.mode === 'add' ? 'Add' : 'Update'}
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
          handleEditInvestment(menuInvestment);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteInvestment(menuInvestment._id);
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
        onClick={handleAddInvestment}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Investments;
