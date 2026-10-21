import { create } from 'zustand';
import { apiClient } from '../api/client';
import { AppNotification } from '../types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasLoadedOnce: boolean;

  fetchNotifications: () => Promise<void>;
  pollUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasLoadedOnce: false,

  fetchNotifications: async () => {
    set({ isLoading: !get().hasLoadedOnce });
    try {
      const response = await apiClient.get<AppNotification[]>('/notifications');
      const list = response.data;
      const unread = list.filter((n) => !n.is_read).length;
      set({
        notifications: list,
        unreadCount: unread,
        isLoading: false,
        hasLoadedOnce: true,
      });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      set({ isLoading: false });
    }
  },

  pollUnreadCount: async () => {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
      set({ unreadCount: response.data.count });
    } catch (err) {
      // Silently ignore background polling errors
    }
  },

  markAsRead: async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        const unread = updated.filter((n) => !n.is_read).length;
        return { notifications: updated, unreadCount: unread };
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  },
}));
