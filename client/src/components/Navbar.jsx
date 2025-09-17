import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings,
  Logout,
  LightMode,
  DarkMode,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    handleNotificationMenuClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    handleNotificationMenuClose();
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          {/* <MenuIcon /> */}
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Finance App
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                icon={<LightMode />}
                checkedIcon={<DarkMode />}
              />
            }
            label=""
            sx={{ m: 0 }}
          />

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            sx={{ position: 'relative' }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
        >
          <MenuItem disabled>
            <ListItemText
              primary={`${user?.firstName} ${user?.lastName}`}
              secondary={user?.email}
            />
          </MenuItem>
          {/* <Divider />
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <MenuItem onClick={handleProfileMenuClose}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider /> */}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Log" />
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            sx: { width: 350, maxHeight: 400 }
          }}
        >
          <MenuItem disabled>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
          </MenuItem>
          <Divider />
          
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </MenuItem>
          ) : (
            <>
              {notifications.slice(0, 5).map((notification) => (
                <MenuItem
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    borderLeft: notification.isRead ? 'none' : '3px solid',
                    borderLeftColor: 'primary.main'
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              
              {notifications.length > 5 && (
                <>
                  <Divider />
                  <MenuItem onClick={handleMarkAllAsRead}>
                    <Typography variant="body2" color="primary">
                      Mark all as read
                    </Typography>
                  </MenuItem>
                </>
              )}
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
