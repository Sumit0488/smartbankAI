/**
 * src/contexts/AppContext.jsx
 * 
 * Global application state context for SmartBank AI.
 * 
 * Provides across the whole app:
 *   - userProfile      (from userService)
 *   - notifications    (from notificationService)
 *   - unreadCount      (derived from notifications)
 *   - isAuthenticated  (currently always true in mock mode)
 * 
 * When the backend is ready:
 *   - Replace the mock loaders with real API calls inside loadAppData()
 *   - Add session/JWT management in the isAuthenticated logic
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '../services/userService';
import { getNotifications, markAllAsRead } from '../services/notificationService';

// ── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const [profile, notifs] = await Promise.all([
          getUserProfile(),
          getNotifications(),
        ]);
        setUserProfile(profile);
        setNotifications(notifs);
      } catch (err) {
        console.error('[AppContext] Failed to load app data:', err);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadAppData();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Actions ────────────────────────────────────────────────────────────────
  const clearNotifications = useCallback(async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const updateUserProfile = useCallback((updates) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  }, []);

  // ── Context Value ──────────────────────────────────────────────────────────
  const value = {
    // State
    userProfile,
    notifications,
    unreadCount,
    isAuthenticated,
    isAppLoading,
    // Actions
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

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Consume the global app context.
 * @returns {{ userProfile, notifications, unreadCount, isAuthenticated, isAppLoading, clearNotifications, updateUserProfile }}
 */
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};

export default AppContext;
