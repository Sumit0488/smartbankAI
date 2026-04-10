/**
 * src/services/notificationService.js
 * Calls real GraphQL backend for notifications.
 */
import { graphqlRequest } from '../config/api';

const NOTIF_FIELDS = 'id notificationId type title message read createdAt';

export const getNotifications = async () => {
  try {
    const data = await graphqlRequest(`query { getNotifications { ${NOTIF_FIELDS} } }`);
    if (data?.getNotifications) return data.getNotifications;
  } catch (e) {
    console.warn('[notificationService] getNotifications failed', e);
  }
  return [];
};

export const getUnreadCount = async () => {
  try {
    const notifs = await getNotifications();
    return notifs.filter(n => !n.read).length;
  } catch {
    return 0;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const data = await graphqlRequest(
      `mutation($notificationId: ID!) { markNotificationRead(notificationId: $notificationId) { ${NOTIF_FIELDS} } }`,
      { notificationId }
    );
    return data?.markNotificationRead;
  } catch (e) {
    console.warn('[notificationService] markAsRead failed', e);
    return { success: false };
  }
};

export const markAllAsRead = async () => {
  try {
    const data = await graphqlRequest(
      `mutation { markAllNotificationsRead { success message } }`
    );
    return data?.markAllNotificationsRead;
  } catch (e) {
    console.warn('[notificationService] markAllAsRead failed', e);
    return { success: false };
  }
};

export const getUserActivity = async () => {
  try {
    const data = await graphqlRequest(
      `query { getUserActivity { id type title amount description createdAt } }`
    );
    return data?.getUserActivity || [];
  } catch (e) {
    console.warn('[notificationService] getUserActivity failed', e);
    return [];
  }
};
