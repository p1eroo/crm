import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types/notification';

interface NotificationContextType {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  removeNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const notificationsData = useNotifications();

  const value: NotificationContextType = {
    panelOpen,
    setPanelOpen,
    notifications: notificationsData.notifications,
    unreadCount: notificationsData.unreadCount,
    loading: notificationsData.loading,
    markAsRead: notificationsData.markAsRead,
    markAllAsRead: notificationsData.markAllAsRead,
    archiveNotification: notificationsData.archiveNotification,
    removeNotification: notificationsData.removeNotification,
    refreshNotifications: notificationsData.refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationPanel = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationPanel must be used within NotificationProvider');
  }
  return context;
};
