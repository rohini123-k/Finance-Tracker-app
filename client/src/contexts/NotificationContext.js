import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { notificationAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetchTime: 0
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount || 0,
        isLoading: false,
        error: null,
        lastFetchTime: Date.now()
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        })),
        unreadCount: 0
      };
    case 'ARCHIVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        )
      };
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        )
      };
    case 'UPDATE_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
        error: null
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const maxRetries = 3;
  const fetchInterval = 30000; // 30 seconds
  const minFetchInterval = 5000; // 5 seconds minimum between fetches

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Throttle requests using ref instead of state
    const now = Date.now();
    if (now - lastFetchTimeRef.current < minFetchInterval) {
      return;
    }

    lastFetchTimeRef.current = now;
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await notificationAPI.getNotifications({ page, limit });
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount
        }
      });
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      retryCountRef.current++;
      
      // Only show error for non-auth errors and limit retries
      if (error.response?.status !== 401 && retryCountRef.current <= maxRetries) {
        dispatch({ type: 'FETCH_FAILURE', payload: error.message });
      } else if (error.response?.status === 401) {
        // Don't show error for auth failures, just clear notifications
        dispatch({ type: 'CLEAR_NOTIFICATIONS' });
      }
    }
  }, [isAuthenticated, user, minFetchInterval, maxRetries]);

  const fetchUnreadCount = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Throttle requests using ref instead of state
    const now = Date.now();
    if (now - lastFetchTimeRef.current < minFetchInterval) {
      return;
    }

    lastFetchTimeRef.current = now;
    try {
      const response = await notificationAPI.getUnreadCount();
      dispatch({
        type: 'UPDATE_UNREAD_COUNT',
        payload: response.data.unreadCount
      });
    } catch (error) {
      // Don't log 401 errors as they're expected when not authenticated
      if (error.response?.status !== 401) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  }, [isAuthenticated, user, minFetchInterval]);

  // Fetch notifications only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      fetchNotifications();
      fetchUnreadCount();
      
      // Set up polling interval
      intervalRef.current = setInterval(() => {
        if (isAuthenticated && user) {
          fetchUnreadCount();
        }
      }, fetchInterval);
    } else {
      // Clear notifications when user logs out
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount, fetchInterval]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      dispatch({ type: 'MARK_ALL_READ' });
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      await notificationAPI.archiveNotification(notificationId);
      dispatch({ type: 'ARCHIVE_NOTIFICATION', payload: notificationId });
      toast.success('Notification archived');
    } catch (error) {
      toast.error('Failed to archive notification');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      await notificationAPI.updatePreferences(preferences);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update notification preferences');
    }
  };

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const value = {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    updatePreferences,
    addNotification
  };

  // If not authenticated, return empty functions to prevent API calls
  const safeValue = !isAuthenticated || !user ? {
    ...initialState,
    fetchNotifications: () => {},
    fetchUnreadCount: () => {},
    markAsRead: () => {},
    markAllAsRead: () => {},
    archiveNotification: () => {},
    deleteNotification: () => {},
    updatePreferences: () => {},
    addNotification: () => {}
  } : value;

  return (
    <NotificationContext.Provider value={safeValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
