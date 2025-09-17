import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import toast from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import Person from '@mui/icons-material/Person';
import Notifications from '@mui/icons-material/Notifications';
import Palette from '@mui/icons-material/Palette';
import Save from '@mui/icons-material/Save';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { updatePreferences } = useNotifications();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    budgetAlerts: true,
    goalReminders: true
  });

  const [themePrefs, setThemePrefs] = useState({
    theme: 'auto'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
      setNotificationPrefs({
        email: user.preferences?.notifications?.email ?? true,
        push: user.preferences?.notifications?.push ?? true,
        budgetAlerts: user.preferences?.notifications?.budgetAlerts ?? true,
        goalReminders: user.preferences?.notifications?.goalReminders ?? true
      });
      setThemePrefs({
        theme: user.preferences?.theme || 'auto'
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      await updateProfile(profileData);
      toast.success("Profile updated!");
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error("Profile update failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      await updatePreferences(notificationPrefs);
      toast.success("Notification preferences updated!");
    } catch (err) {
      console.error('Notification preferences update error:', err);
      toast.error("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeUpdate = async () => {
    try {
      setLoading(true);
      await updateProfile({ preferences: { ...user.preferences, ...themePrefs } });
      toast.success("Theme updated!");
    } catch (err) {
      console.error('Theme preferences update error:', err);
      toast.error("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Settings
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Palette />} label="Appearance" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationPrefs.email}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, email: e.target.checked }))}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationPrefs.push}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, push: e.target.checked }))}
                  />
                }
                label="Push Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationPrefs.budgetAlerts}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, budgetAlerts: e.target.checked }))}
                  />
                }
                label="Budget Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationPrefs.goalReminders}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, goalReminders: e.target.checked }))}
                  />
                }
                label="Goal Reminders"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleNotificationUpdate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Save Preferences'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Theme Settings
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                  />
                }
                label="Dark Mode"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleThemeUpdate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Save Theme'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Settings;
