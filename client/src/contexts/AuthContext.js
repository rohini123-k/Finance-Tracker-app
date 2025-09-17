import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token
            }
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({
            type: 'AUTH_FAILURE',
            payload: 'Session expired. Please login again.'
          });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const setup2FA = async () => {
    try {
      const response = await authAPI.setup2FA();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || '2FA setup failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verify2FA = async (token) => {
    try {
      await authAPI.verify2FA({ token });
      dispatch({
        type: 'UPDATE_USER',
        payload: { twoFactorEnabled: true }
      });
      toast.success('2FA enabled successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '2FA verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const disable2FA = async (password, token) => {
    try {
      await authAPI.disable2FA({ password, token });
      dispatch({
        type: 'UPDATE_USER',
        payload: { twoFactorEnabled: false }
      });
      toast.success('2FA disabled successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '2FA disable failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    setup2FA,
    verify2FA,
    disable2FA,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
