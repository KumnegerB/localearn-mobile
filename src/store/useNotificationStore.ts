import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { AppNotification } from '../types';
import { triggerLocalNotification } from '../services/notificationService';

const NOTIFICATIONS_CACHE_KEY = '@localearn_cached_notifications';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasLoadedOnce: boolean;

  loadCachedNotifications: () => Promise<void>;
  clearNotificationCache: () => Promise<void>;
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

  loadCachedNotifications: async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && get().notifications.length === 0) {
          const unread = parsed.filter((n: AppNotification) => !n.is_read).length;
          set({
            notifications: parsed,
            unreadCount: unread,
            hasLoadedOnce: true,
          });
        }
      }
    } catch {
      // Ignore cache load errors
    }
  },

  clearNotificationCache: async () => {
    try {
      await AsyncStorage.removeItem(NOTIFICATIONS_CACHE_KEY);
    } catch {
      // Ignore error
    }
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasLoadedOnce: false,
    });
  },

  fetchNotifications: async () => {
    const token = await AsyncStorage.getItem('@localearn_token');
    if (!token) {
      set({ notifications: [], unreadCount: 0, isLoading: false });
      return;
    }

    // Only show loading spinner if we have NO cached notifications
    set({ isLoading: get().notifications.length === 0 });
    try {
      const response = await apiClient.get<AppNotification[]>('/notifications');
      const list = response.data;
      const unread = list.filter((n) => !n.is_read).length;

      // Trigger native notification banner for newly arrived unread notifications
      if (get().hasLoadedOnce) {
        const oldIds = new Set(get().notifications.map((n) => n.id));
        const brandNew = list.filter((n) => !n.is_read && !oldIds.has(n.id));
        for (const item of brandNew.slice(0, 3)) {
          triggerLocalNotification(item.title, item.message, { type: item.type, taskId: item.task_id });
        }
      }

      set({
        notifications: list,
        unreadCount: unread,
        isLoading: false,
        hasLoadedOnce: true,
      });
      AsyncStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(list)).catch(() => {});
    } catch (err: any) {
      if (err.response?.status === 401) {
        set({ notifications: [], unreadCount: 0, isLoading: false });
        return;
      }
      set({ isLoading: false });
    }
  },

  pollUnreadCount: async () => {
    const token = await AsyncStorage.getItem('@localearn_token');
    if (!token) {
      set({ unreadCount: 0 });
      return;
    }

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

// Hydrate cached notifications upon launch
useNotificationStore.getState().loadCachedNotifications();

