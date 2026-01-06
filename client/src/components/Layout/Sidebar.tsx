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
  useMediaQuery,
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

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const { open, collapsed } = useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const drawerWidth = collapsed 
    ? (isMobile ? 0 : 85) 
    : 270;

const mainMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
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
        px: collapsed ? 1 : 3, 
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
            // Para Dashboard, detectar tanto '/' como '/dashboard'
            // Para otros, coincidir si el pathname comienza con el path del item
            const isSelected = item.path === '/dashboard' 
              ? (location.pathname === '/dashboard' || location.pathname === '/')
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
            <ListItemButton
              key={item.text}
              selected={isSelected}
              onClick={() => navigate(item.path)}
              sx={{
              minHeight: collapsed ? 64 : 44,
              borderRadius: 1,
              flexDirection: collapsed ? 'column' : 'row',
              justifyContent: collapsed ? 'center' : 'flex-start',
              alignItems: 'center',
              px: collapsed ? 1 : 2,
              py: collapsed ? 1 : 0.875,
              mb: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  background: theme.palette.mode === 'dark' 
                    ? '#1a2e2a' 
                    : 'rgba(91, 228, 155, 0.1)',
                  color: '#5be49b',
                  boxShadow: 'none',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' 
                      ? '#1a2e2a' 
                      : 'rgba(91, 228, 155, 0.1)',
                    boxShadow: 'none',
                  },
                },
                '&:hover': {
                  ...(isSelected ? {
                    background: theme.palette.mode === 'dark' 
                      ? '#1a2e2a' 
                      : 'rgba(91, 228, 155, 0.1)',
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
                  minWidth: collapsed ? 'auto' : 36,
                  justifyContent: 'center',
                  margin: collapsed ? '0 0 4px 0' : 0,
                  color: isSelected 
                    ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                    : '#637381',
                  '& svg': {
                    fontSize: 20,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected 
                      ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                      : '#5a5c61',
                    ml: 1,
                  }}
                >
                  {item.text}
                </Typography>
              )}
              {collapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected 
                      ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                      : '#5a5c61',
                    textAlign: 'center',
                    mt: 0.25,
                  }}
                >
                  {item.text}
                </Typography>
              )}
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
              minHeight: collapsed ? 64 : 44,
              borderRadius: 1,
              flexDirection: collapsed ? 'column' : 'row',
              justifyContent: collapsed ? 'center' : 'flex-start',
              alignItems: 'center',
              px: collapsed ? 1 : 2,
              py: collapsed ? 1 : 0.875,
              mb: 0,
              mt: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                background: theme.palette.mode === 'dark' 
                  ? '#1a2e2a' 
                  : 'rgba(91, 228, 155, 0.1)',
                color: '#5be49b',
                boxShadow: 'none',
                '&:hover': {
                  background: theme.palette.mode === 'dark' 
                    ? '#1a2e2a' 
                    : 'rgba(91, 228, 155, 0.1)',
                  boxShadow: 'none',
                },
              },
              '&:hover': {
                ...(location.pathname === '/users' ? {
                  background: theme.palette.mode === 'dark' 
                    ? '#1a2e2a' 
                    : 'rgba(91, 228, 155, 0.1)',
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
                minWidth: collapsed ? 'auto' : 36,
                justifyContent: 'center',
                margin: collapsed ? '0 0 4px 0' : 0,
                color: location.pathname === '/users' 
                  ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                  : '#637381',
                '& svg': {
                  fontSize: 20,
                },
              }}
            >
              <AdminPanelSettings />
            </ListItemIcon>
            {!collapsed && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === '/users' ? 600 : 400,
                  color: location.pathname === '/users' 
                    ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                    : '#5a5c61',
                  ml: 1,
                }}
              >
                Usuarios
              </Typography>
            )}
            {collapsed && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.625rem',
                  fontWeight: location.pathname === '/users' ? 600 : 400,
                  color: location.pathname === '/users' 
                    ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                    : '#5a5c61',
                  textAlign: 'center',
                  mt: 0.25,
                }}
              >
                Usuarios
              </Typography>
            )}
          </ListItemButton>
        )}
      </List>
      
      {/* Separador */}
      <Box sx={{ flex: 1 }} />
      
      {/* Configuración */}
      <Box sx={{ width: '100%', px: collapsed ? 1 : 3, mb: 1 }}>
        <ListItemButton
          onClick={() => navigate('/settings')}
          sx={{
            minHeight: collapsed ? 64 : 40,
            borderRadius: 1,
            flexDirection: collapsed ? 'column' : 'row',
            justifyContent: collapsed ? 'center' : 'flex-start',
            alignItems: 'center',
            px: collapsed ? 1 : 1,
            py: collapsed ? 1 : 0.75,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 'auto' : 36,
              justifyContent: 'center',
              margin: collapsed ? '0 0 4px 0' : 0,
              color: '#637381',
              '& svg': {
                fontSize: 20,
              },
            }}
          >
            <Settings />
          </ListItemIcon>
          {!collapsed && (
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
          )}
          {collapsed && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.625rem',
                fontWeight: 400,
                color: '#5a5c61',
                textAlign: 'center',
                mt: 0.25,
              }}
            >
              Configuración
            </Typography>
          )}
        </ListItemButton>
      </Box>
      
    </Drawer>
  );
};

export default Sidebar;




