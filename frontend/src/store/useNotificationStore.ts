import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'risk_review' | 'treatment_due' | 'asset_review' | 'system_alert' | 'new_risk_assigned';
  isRead: number; // 0 or 1
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  fetchNotifications: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true });
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((n: NotificationItem) => n.isRead === 0).length;
        set({ notifications: data, unreadCount: unread, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
      set({ loading: false });
    }
  },
  markAsRead: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        set((state) => {
          const updated = state.notifications.map((n) => 
            n.id === id ? { ...n, isRead: 1 as number } : n
          );
          const unread = updated.filter((n) => n.isRead === 0).length;
          return { notifications: updated, unreadCount: unread };
        });
      }
    } catch (err) {
      console.error('Mark notification read error:', err);
    }
  },
  markAllAsRead: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        set((state) => {
          const updated = state.notifications.map((n) => ({ ...n, isRead: 1 as number }));
          return { notifications: updated, unreadCount: 0 };
        });
      }
    } catch (err) {
      console.error('Mark all notifications read error:', err);
    }
  }
}));
