/**
 * src/hooks/useNotifications.js
 * Fetches notifications and exposes unread count and mark-as-read actions.
 */
import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await getNotifications();
        if (!cancelled) setNotifications(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = useCallback(async (id) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return { notifications, unreadCount, isLoading, error, markAsRead: handleMarkAsRead, markAllAsRead: handleMarkAllAsRead };
};
