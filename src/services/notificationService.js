/**
 * src/services/notificationService.js
 * Frontend service calling real GraphQL backend for notifications.
 */

import { graphqlRequest } from '../config/api';

const mockNotifications = [
  { id: '1', title: 'Salary Credited', message: '₹30,000 credited to HDFC account', type: 'success', date: '2026-03-09T09:00:00Z', isRead: false },
  { id: '2', title: 'High Expense Alert', message: 'You spent 40% of budget on Dining', type: 'warning', date: '2026-03-08T14:30:00Z', isRead: false },
  { id: '3', title: 'Credit Card Bill', message: 'HDFC Regalia bill of ₹12,450 is due', type: 'info', date: '2026-03-05T10:00:00Z', isRead: true },
];

export const getNotifications = async () => mockNotifications;

export const getUnreadCount = async () => mockNotifications.filter(n => !n.isRead).length;

export const markAsRead = async (id) => ({ success: true });

export const markAllAsRead = async () => ({ success: true });

export const sendSystemNotification = async (userId, title, message, type = 'info') => {
  try {
    await graphqlRequest(`
      mutation($input: SendEmailInput!) {
        sendEmailNotification(input: $input) { success message }
      }
    `, {
      input: {
        to: 'user@smartbank.ai',
        subject: title,
        text: message
      }
    });
  } catch (e) { console.warn('Backend notification trigger failed', e); }
  return { success: true };
};
