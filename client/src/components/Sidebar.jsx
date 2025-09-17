import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as TransactionIcon,
  Savings as BudgetIcon,
  Flag as GoalIcon,
  TrendingUp as InvestmentIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    requireAuth: true
  },
  {
    title: 'Transactions',
    path: '/transactions',
    icon: <TransactionIcon />,
    requireAuth: true
  },
  {
    title: 'Budgets',
    path: '/budgets',
    icon: <BudgetIcon />,
    requireAuth: true
  },
  {
    title: 'Goals',
    path: '/goals',
    icon: <GoalIcon />,
    requireAuth: true
  },
  {
    title: 'Investments',
    path: '/investments',
    icon: <InvestmentIcon />,
    requireAuth: true
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <ReportIcon />,
    requireAuth: true
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    requireAuth: true
  }
];

const adminItems = [
  {
    title: 'Admin Dashboard',
    path: '/admin',
    icon: <AdminIcon />,
    requireAuth: true,
    requireAdmin: true
  }
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expandedItems, setExpandedItems] = useState({});

  const handleItemClick = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleExpandClick = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const isItemActive = (path) => {
    return location.pathname === path;
  };

  const canAccessItem = (item) => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.requireAdmin && user?.role !== 'admin' && user?.role !== 'super-admin') return false;
    return true;
  };

  const renderMenuItem = (item, level = 0) => {
    if (!canAccessItem(item)) return null;

    const isActive = isItemActive(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.title];

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => hasSubItems ? handleExpandClick(item.title) : handleItemClick(item.path)}
            sx={{
              pl: 2 + level * 2,
              bgcolor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                bgcolor: isActive ? 'primary.dark' : 'action.hover',
              },
              borderRadius: 1,
              mx: 1,
              mb: 0.5
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? 'primary.contrastText' : 'text.secondary',
                minWidth: 40
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400
              }}
            />
            {hasSubItems && (
              <IconButton size="small" sx={{ color: 'inherit' }}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </ListItemButton>
        </ListItem>
        
        {hasSubItems && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map(subItem => renderMenuItem(subItem, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Finance App
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Personal Finance Manager
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {/* Home - always visible */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick('/')}
            sx={{
              pl: 2,
              bgcolor: isItemActive('/') ? 'primary.main' : 'transparent',
              color: isItemActive('/') ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                bgcolor: isItemActive('/') ? 'primary.dark' : 'action.hover',
              },
              borderRadius: 1,
              mx: 1,
              mb: 0.5
            }}
          >
            <ListItemIcon
              sx={{
                color: isItemActive('/') ? 'primary.contrastText' : 'text.secondary',
                minWidth: 40
              }}
            >
              <HomeIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Home"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isItemActive('/') ? 600 : 400
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Main Menu Items */}
        {menuItems.map(item => renderMenuItem(item))}

        {/* Admin Items */}
        {user?.role === 'admin' || user?.role === 'super-admin' ? (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
              Administration
            </Typography>
            {adminItems.map(item => renderMenuItem(item))}
          </>
        ) : null}
      </List>

      {/* User Info */}
      {isAuthenticated && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'primary.main' }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider'
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
