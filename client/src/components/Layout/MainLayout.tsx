import React from 'react';
import { Box, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../../context/SidebarContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 260;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { open } = useSidebar();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Header sticky - debe estar fuera del contenedor con overflow */}
      <Box sx={{ 
        width: '100vw',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 1300,
      }}>
        <Header />
      </Box>
      
      <Box sx={{ display: 'flex', flex: 1, width: '100%', overflowX: 'hidden', position: 'relative' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
            marginLeft: { sm: open ? `${drawerWidth}px` : 0 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.default,
            minWidth: 0, // Permite que el contenido se ajuste correctamente
            boxSizing: 'border-box',
            overflowY: 'auto', // Permitir scroll vertical en el contenido principal
          }}
        >
          <Box sx={{ flex: 1, bgcolor: theme.palette.background.default, px: 3, pt: 2.5, pb: 2 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;




