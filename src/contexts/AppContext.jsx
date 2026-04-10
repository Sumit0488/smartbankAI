/**
 * src/contexts/AppContext.jsx
 *
 * Global application state context for SmartBank AI.
 * Provides: userProfile, notifications, isAuthenticated, login, logout, etc.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markAllAsRead } from '../services/notificationService';
import { setToken, clearToken, getToken, graphqlRequest } from '../config/api';

const USER_FIELDS = 'id userId name email role salary profileType status createdAt';

// ── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  // Initialize from localStorage — true if a token already exists
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAppData = async () => {
      if (!getToken()) {
        setIsAppLoading(false);
        return;
      }
      try {
        // Validate token against real backend — throws if token invalid/expired
        const data = await graphqlRequest(`query { getProfile { ${USER_FIELDS} } }`);
        if (!data?.getProfile) throw new Error('No profile returned');
        setUserProfile(data.getProfile);
        const notifs = await getNotifications().catch(() => []);
        setNotifications(notifs);
      } catch (err) {
        console.error('[AppContext] Token validation failed — logging out:', err.message);
        // Stale or invalid token — force re-login
        clearToken();
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadAppData();
  }, [isAuthenticated]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback((token, userData) => {
    setToken(token);
    setUserProfile(userData || null);
    setNotifications([]);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUserProfile(null);
    setNotifications([]);
    window.location.href = '/login';
  }, []);

  const clearNotifications = useCallback(async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const updateUserProfile = useCallback((updates) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  }, []);

  // ── Context Value ──────────────────────────────────────────────────────────
  const value = {
    userProfile,
    user: userProfile,
    notifications,
    unreadCount,
    isAuthenticated,
    isAppLoading,
    darkMode,
    toggleDarkMode,
    login,
    logout,
    clearNotifications,
    updateUserProfile,
    setNotifications,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};

// Alias — Login.jsx and Sidebar import useAuth
export const useAuth = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AppContext;
