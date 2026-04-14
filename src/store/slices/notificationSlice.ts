import { StateCreator } from 'zustand';
import { Notification, NotificationPreferences } from '../../types';

export interface NotificationSlice {
  notifications: Notification[];
  notificationPreferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
}

export const createNotificationSlice: StateCreator<NotificationSlice> = (set) => ({
  notifications: [
    {
      id: '1',
      title: 'Welcome to NeuralStudy',
      message: 'Your neural interface is now active. Start by initializing your syllabus.',
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: '2',
      title: 'AI Insight Available',
      message: 'Based on your recent activity, we recommend focusing on Calculus today.',
      type: 'ai',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      link: '/weak-areas'
    }
  ],
  notificationPreferences: {
    systemAlerts: true,
    aiRecommendations: true,
    reviewReminders: true,
    emailNotifications: false,
  },
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...state.notifications,
    ],
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),
  updateNotificationPreferences: (prefs) => set((state) => ({
    notificationPreferences: { ...state.notificationPreferences, ...prefs },
  })),
});
