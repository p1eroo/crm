import React from 'react';
import { Box, useTheme, IconButton } from '@mui/material';
import { Menu } from '@mui/icons-material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../../context/SidebarContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 220;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { open, toggleSidebar } = useSidebar();
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
          transition: 'width 0.3s ease',
        }}
      >
        {!open && (
          <IconButton
            onClick={toggleSidebar}
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1300,
              bgcolor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Menu />
          </IconButton>
        )}
        <Header />
        <Box sx={{ flex: 1, bgcolor: theme.palette.background.default, overflow: 'hidden', px: { xs: 4, sm: 5, md: 6 }, pt: { xs: 3, sm: 4, md: 5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;




