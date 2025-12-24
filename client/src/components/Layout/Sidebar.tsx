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
  IconButton,
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
  ChevronLeft,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import logo from '../../assets/tm_logo.png';

const drawerWidth = 200;

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
  const { open, toggleSidebar } = useSidebar();

  if (!open) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
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
        },
      }}
    >
      {/* Logo/Icono superior */}
      <Box sx={{ 
        mb: -4,
        mt: -5.5,
        pt: 0,
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        pl: 2.5,
        pr: 1,
      }}>
        <img
          src={logo}
          alt="Taxi Monterrico Logo"
          style={{
            width: 130,
            height: 130,
            objectFit: 'contain',
          }}
        />
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <ChevronLeft />
        </IconButton>
      </Box>

      {/* Lista de items del menú */}
      <List sx={{ 
        width: '100%', 
        px: 1, 
        pt: -10,
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
              minHeight: 48,
              borderRadius: 2,
              justifyContent: 'flex-start',
              px: 1,
              py: 1,
              mb: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? taxiMonterricoColors.greenDark 
                    : '#c4d4d4',
                  color: theme.palette.mode === 'dark' 
                    ? '#FFFFFF' 
                    : theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? taxiMonterricoColors.greenDark 
                      : '#c4d4d4',
                    opacity: theme.palette.mode === 'dark' ? 0.9 : 1,
                  },
                },
                '&:hover': {
                  backgroundColor: isSelected 
                    ? (theme.palette.mode === 'dark' 
                        ? taxiMonterricoColors.greenDark 
                        : '#c4d4d4')
                    : theme.palette.action.hover,
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
                  color: isSelected && theme.palette.mode === 'dark' 
                    ? '#FFFFFF' 
                    : 'inherit',
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
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected && theme.palette.mode === 'dark' 
                    ? '#FFFFFF' 
                    : 'inherit',
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
              minHeight: 48,
              borderRadius: 2,
              justifyContent: 'flex-start',
              px: 1,
              py: 1,
              mb: 0,
              mt: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? taxiMonterricoColors.greenDark 
                  : '#c4d4d4',
                color: theme.palette.mode === 'dark' 
                  ? '#FFFFFF' 
                  : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? taxiMonterricoColors.greenDark 
                    : '#c4d4d4',
                  opacity: theme.palette.mode === 'dark' ? 0.9 : 1,
                },
              },
              '&:hover': {
                backgroundColor: location.pathname === '/users' 
                  ? (theme.palette.mode === 'dark' 
                      ? taxiMonterricoColors.greenDark 
                      : '#c4d4d4')
                  : theme.palette.action.hover,
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
                color: location.pathname === '/users' && theme.palette.mode === 'dark' 
                  ? '#FFFFFF' 
                  : 'inherit',
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
                fontWeight: location.pathname === '/users' ? 600 : 400,
                color: location.pathname === '/users' && theme.palette.mode === 'dark' 
                  ? '#FFFFFF' 
                  : 'inherit',
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
      <Box sx={{ width: '100%', px: 1, mb: 1 }}>
        <ListItemButton
          onClick={() => navigate('/settings')}
          sx={{
            minHeight: 40,
            borderRadius: 2,
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
              color: theme.palette.text.secondary,
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
              color: theme.palette.text.primary,
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




