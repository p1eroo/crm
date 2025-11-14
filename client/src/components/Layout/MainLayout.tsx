import React from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../../context/SidebarContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;
const collapsedWidth = 64;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { open } = useSidebar();

  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)` },
          transition: 'width 0.3s ease',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;




