import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../../context/SidebarContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { open, collapsed } = useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const drawerWidth = collapsed 
    ? (isMobile ? 0 : 85) 
    : 270;
  
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
            width: { 
              xs: '100%', // En móviles siempre ocupa el 100%, especialmente cuando está colapsado
              sm: open ? `calc(100% - ${drawerWidth}px)` : '100%' 
            },
            marginLeft: { 
              xs: 0, // En móviles no hay margen, especialmente cuando está colapsado
              sm: open ? `${drawerWidth}px` : 0 
            },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.default,
            minWidth: 0, // Permite que el contenido se ajuste correctamente
            boxSizing: 'border-box',
            overflowY: 'auto', // Permitir scroll vertical en el contenido principal
            paddingTop: { xs: '60px', sm: 0 }, // Compensar el header fijo en móviles
            transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Box sx={{ flex: 1, bgcolor: theme.palette.background.default, px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: 2 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;




