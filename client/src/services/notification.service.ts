import api from './api';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  entityId?: string;
  entityType?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (): Promise<{
    notifications: AppNotification[];
    unreadCount: number;
  }> => {
    const res = await api.get('/notifications');
    return {
      notifications: res.data.data || [],
      unreadCount: res.data.unreadCount || 0,
    };
  },

  markAsRead: async (id: string): Promise<AppNotification> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
