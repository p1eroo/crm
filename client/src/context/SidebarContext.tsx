import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type LayoutMode = 'vertical' | 'collapsed' | 'horizontal';

interface SidebarContextType {
  open: boolean;
  collapsed: boolean;
  layoutMode: LayoutMode;
  toggleSidebar: () => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setOpen: (open: boolean) => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches;

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(() => !isMobileViewport());
  const [collapsed, setCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('layoutMode') as LayoutMode;
    return saved || 'vertical';
  });

  useEffect(() => {
    localStorage.setItem('layoutMode', layoutMode);
  }, [layoutMode]);

  const toggleSidebar = () => {
    setOpen((prev) => !prev);
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ 
      open, 
      collapsed, 
      layoutMode,
      toggleSidebar, 
      toggleCollapsed, 
      setCollapsed,
      setOpen,
      setLayoutMode 
    }}>
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





