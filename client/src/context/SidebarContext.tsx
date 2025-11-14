import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  open: boolean;
  toggleSidebar: () => void;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(true);

  const toggleSidebar = () => {
    setOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};





