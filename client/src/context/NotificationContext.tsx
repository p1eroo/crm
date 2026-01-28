import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationContextType {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <NotificationContext.Provider value={{ panelOpen, setPanelOpen }}>
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
