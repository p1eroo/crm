import React from 'react';
import { Box, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 220;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
        }}
      >
        <Header />
        <Box sx={{ flex: 1, bgcolor: theme.palette.background.default, overflow: 'hidden', px: { xs: 4, sm: 5, md: 6 }, pt: { xs: 3, sm: 4, md: 5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;




