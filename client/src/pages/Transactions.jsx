import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
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
  Grid,
  Fab,
  CircularProgress,
  Pagination,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Upload,
  Search,
  MoreVert,
  Receipt,
  TrendingUp,
  TrendingDown,
  Category
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useDropzone } from 'react-dropzone';
import { transactionAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed unused error state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  
  // Dialog states
  const [transactionDialog, setTransactionDialog] = useState({ open: false, mode: 'add' });
  const [receiptDialog, setReceiptDialog] = useState({ open: false });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTransaction, setMenuTransaction] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    subcategory: '',
    description: '',
    date: dayjs(),
    account: 'main',
    tags: []
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
    'Income',
    'Other'
  ];

  const subcategories = {
    'Food & Dining': ['Restaurants', 'Groceries', 'Coffee', 'Fast Food'],
    'Transportation': ['Gas', 'Public Transit', 'Uber/Lyft', 'Parking'],
    'Shopping': ['Clothing', 'Electronics', 'Home & Garden', 'Books'],
    'Entertainment': ['Movies', 'Games', 'Sports', 'Music'],
    'Bills & Utilities': ['Electricity', 'Water', 'Internet', 'Phone'],
    'Healthcare': ['Doctor', 'Pharmacy', 'Insurance', 'Dental'],
    'Education': ['Tuition', 'Books', 'Courses', 'Supplies'],
    'Travel': ['Flights', 'Hotels', 'Car Rental', 'Activities'],
    'Investment': ['Stocks', 'Bonds', 'Crypto', 'Real Estate'],
    'Income': ['Salary', 'Freelance', 'Investment', 'Other'],
    'Other': ['Miscellaneous', 'Gifts', 'Donations', 'Fees']
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, searchTerm, filterType, filterCategory, dateRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        type: filterType,
        category: filterCategory,
        startDate: dateRange.startDate?.format('YYYY-MM-DD'),
        endDate: dateRange.endDate?.format('YYYY-MM-DD')
      };

      const response = await transactionAPI.getTransactions(params);
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to fetch transactions');
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category: '',
      subcategory: '',
      description: '',
      date: dayjs(),
      account: 'main',
      tags: []
    });
    setTransactionDialog({ open: true, mode: 'add' });
  };

  const handleEditTransaction = (transaction) => {
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory || '',
      description: transaction.description,
      date: dayjs(transaction.date),
      account: transaction.account,
      tags: transaction.tags || []
    });
    setSelectedTransaction(transaction);
    setTransactionDialog({ open: true, mode: 'edit' });
  };

  const handleSaveTransaction = async () => {
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date.format('YYYY-MM-DD')
      };

      if (transactionDialog.mode === 'add') {
        await transactionAPI.createTransaction(transactionData);
        toast.success('Transaction added successfully');
      } else {
        await transactionAPI.updateTransaction(selectedTransaction._id, transactionData);
        toast.success('Transaction updated successfully');
      }

      setTransactionDialog({ open: false, mode: 'add' });
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to save transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionAPI.deleteTransaction(transactionId);
        toast.success('Transaction deleted successfully');
        fetchTransactions();
      } catch (err) {
        toast.error('Failed to delete transaction');
      }
    }
  };

  const handleUploadReceipt = async (files) => {
    const file = files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await transactionAPI.uploadReceipt(formData);
      toast.success('Receipt uploaded successfully');
      
      // Open transaction dialog with suggested data
      if (response.data.suggestedData) {
        setFormData(prev => ({
          ...prev,
          ...response.data.suggestedData
        }));
        setTransactionDialog({ open: true, mode: 'add' });
      }
    } catch (err) {
      toast.error('Failed to upload receipt');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUploadReceipt,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'success' : 'error';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? <TrendingUp /> : <TrendingDown />;
  };

  const handleMenuOpen = (event, transaction) => {
    setMenuAnchor(event.currentTarget);
    setMenuTransaction(transaction);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTransaction(null);
  };

  if (loading && transactions.length === 0) {
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
          Transactions
        </Typography>
        <Box display="flex" gap={2}>
          {/* <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setReceiptDialog({ open: true })}
          >
            Upload Receipt
          </Button> */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddTransaction}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setFilterCategory('');
                  setDateRange({ startDate: null, endDate: null });
                }}
                fullWidth
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction._id} hover>
                  <TableCell>
                    {dayjs(transaction.date).format('MMM DD, YYYY')}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {transaction.receipt && (
                        <Receipt color="action" fontSize="small" />
                      )}
                      {transaction.description}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.category}
                      size="small"
                      icon={<Category />}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type}
                      color={getTypeColor(transaction.type)}
                      size="small"
                      icon={getTypeIcon(transaction.type)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={getTypeColor(transaction.type) + '.main'}
                      sx={{ fontWeight: 600 }}
                    >
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, transaction)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Transaction Dialog */}
      <Dialog
        open={transactionDialog.open}
        onClose={() => setTransactionDialog({ open: false, mode: 'add' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {transactionDialog.mode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
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
                  disabled={!formData.category}
                >
                  {formData.category && subcategories[formData.category]?.map(subcategory => (
                    <MenuItem key={subcategory} value={subcategory}>{subcategory}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionDialog({ open: false, mode: 'add' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveTransaction} variant="contained">
            {transactionDialog.mode === 'add' ? 'Add' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Upload Dialog */}
      <Dialog
        open={receiptDialog.open}
        onClose={() => setReceiptDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Receipt</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the receipt here' : 'Drag & drop a receipt image here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to select a file
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Supports: JPG, PNG, GIF (max 5MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialog({ open: false })}>
            Cancel
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
          handleEditTransaction(menuTransaction);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeleteTransaction(menuTransaction._id);
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
        onClick={handleAddTransaction}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Transactions;
