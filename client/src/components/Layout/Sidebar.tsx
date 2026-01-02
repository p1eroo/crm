import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  Box,
  useTheme,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  AttachMoney,
  Assignment,
  Support,
  AdminPanelSettings,
  Assessment,
  CalendarToday,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

const drawerWidth = 260;

const mainMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Contactos', icon: <People />, path: '/contacts', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Empresas', icon: <Business />, path: '/companies', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Negocios', icon: <AttachMoney />, path: '/deals', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Tareas', icon: <Assignment />, path: '/tasks', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Tickets', icon: <Support />, path: '/tickets', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Calendario', icon: <CalendarToday />, path: '/calendar', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Reportes', icon: <Assessment />, path: '/reports', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  // { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  // { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const { open } = useSidebar();

  if (!open) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        zIndex: 1200,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          bgcolor: theme.palette.background.paper,
          borderRight: 'none',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          position: 'fixed',
          height: '100vh',
        },
      }}
    >
      {/* Lista de items del menú */}
      <List sx={{ 
        width: '100%', 
        px: 3, 
        pt: 9.5, // Padding superior para que no quede oculto por el header (72px + espacio extra)
        pb: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        {mainMenuItems
          .filter((item) => {
            // Si el item tiene roles definidos, verificar que el usuario tenga uno de esos roles
            if (item.roles) {
              const userRole = user?.role;
              return userRole && item.roles.includes(userRole);
            }
            // Si no tiene roles definidos, mostrar para todos (compatibilidad hacia atrás)
            return true;
          })
          .map((item) => {
            // Para Dashboard, solo coincidir exactamente con '/'
            // Para otros, coincidir si el pathname comienza con el path del item
            const isSelected = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
            <ListItemButton
              key={item.text}
              selected={isSelected}
              onClick={() => navigate(item.path)}
              sx={{
              minHeight: 44,
              borderRadius: 1,
              justifyContent: 'flex-start',
              px: 2,
              py: 0.875,
              mb: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  background: 'linear-gradient(14deg, #1db513 0%, rgb(95 215 37 / 60%))',
                  color: '#FFFFFF',
                  '&:hover': {
                    background: 'linear-gradient(14deg, #1db513 0%, rgb(95 215 37 / 60%))',
                  },
                },
                '&:hover': {
                  ...(isSelected ? {
                    background: 'linear-gradient(14deg, #1db513 0%, rgb(95 215 37 / 60%))',
                  } : {
                    backgroundColor: theme.palette.action.hover,
                  }),
                },
                '&:not(.Mui-selected)': {
                  color: theme.palette.text.secondary,
                  backgroundColor: 'transparent',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  justifyContent: 'center',
                  color: isSelected ? '#FFFFFF' : '#a6aed4',
                  '& svg': {
                    fontSize: 20,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: isSelected ? '#FFFFFF' : '#5a5c61',
                  ml: 1,
                }}
              >
                {item.text}
              </Typography>
            </ListItemButton>
          );
        })}
        
        {/* Opción de Administrar Usuarios - Solo visible para admins */}
        {(() => {
          const userRole = user?.role;
          console.log('🔍 Verificando rol para mostrar opción de administrar usuarios:', userRole);
          return userRole === 'admin';
        })() && (
          <ListItemButton
            selected={location.pathname === '/users'}
            onClick={() => navigate('/users')}
            sx={{
              minHeight: 44,
              borderRadius: 1,
              justifyContent: 'flex-start',
              px: 2,
              py: 0.875,
              mb: 0,
              mt: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                background: 'linear-gradient(14deg, #1db513 0%, rgb(95 215 37 / 60%))',
                color: '#FFFFFF',
                '&:hover': {
                  background: 'linear-gradient(14deg, #1db513 0%, rgb(95 215 37 / 60%))',
                },
              },
              '&:hover': {
                ...(location.pathname === '/users' ? {
                  background: 'linear-gradient(14deg, #1db513 0%, rgb(95 215 37 / 60%))',
                } : {
                  backgroundColor: theme.palette.action.hover,
                }),
              },
              '&:not(.Mui-selected)': {
                color: theme.palette.text.secondary,
                backgroundColor: 'transparent',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 36,
                justifyContent: 'center',
                color: location.pathname === '/users' ? '#FFFFFF' : '#a6aed4',
                '& svg': {
                  fontSize: 20,
                },
              }}
            >
              <AdminPanelSettings />
            </ListItemIcon>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: location.pathname === '/users' ? '#FFFFFF' : '#5a5c61',
                ml: 1,
              }}
            >
              Usuarios
            </Typography>
          </ListItemButton>
        )}
      </List>
      
      {/* Separador */}
      <Box sx={{ flex: 1 }} />
      
      {/* Configuración */}
      <Box sx={{ width: '100%', px: 3, mb: 1 }}>
        <ListItemButton
          onClick={() => navigate('/settings')}
          sx={{
            minHeight: 40,
            borderRadius: 1,
            justifyContent: 'flex-start',
            px: 1,
            py: 0.75,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              justifyContent: 'center',
              color: '#a6aed4',
              '& svg': {
                fontSize: 20,
              },
            }}
          >
            <Settings />
          </ListItemIcon>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 400,
              color: '#5a5c61',
              ml: 1,
            }}
          >
            Configuración
          </Typography>
        </ListItemButton>
      </Box>
      
    </Drawer>
  );
};

export default Sidebar;




