import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Box,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  AttachMoney,
  Assignment,
  Campaign,
  Timeline,
  Support,
  PieChart,
  Logout,
  AdminPanelSettings,
  AccountTree,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 80;

const mainMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Contactos', icon: <People />, path: '/contacts' },
  { text: 'Empresas', icon: <Business />, path: '/companies' },
  { text: 'Negocios', icon: <AttachMoney />, path: '/deals' },
  { text: 'Pipeline', icon: <AccountTree />, path: '/pipeline' },
  { text: 'Tareas', icon: <Assignment />, path: '/tasks' },
  { text: 'Tickets', icon: <Support />, path: '/tickets' },
  // { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  // { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark' ? '2px 0 8px rgba(0,0,0,0.3)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
        },
      }}
    >
      {/* Logo/Icono superior */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <PieChart sx={{ 
          fontSize: 24, 
          color: taxiMonterricoColors.green,
        }} />
      </Box>

      {/* Lista de items del menú */}
      <List sx={{ 
        width: '100%', 
        px: 1.5, 
        py: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}>
        {mainMenuItems.map((item) => {
          // Para Dashboard, solo coincidir exactamente con '/'
          // Para otros, coincidir si el pathname comienza con el path del item
          const isSelected = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Tooltip 
              key={item.text}
              title={item.text} 
              placement="right"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: theme.palette.mode === 'dark' ? '#424242' : '#424242',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    ml: 1,
                  },
                },
                arrow: {
                  sx: {
                    color: theme.palette.mode === 'dark' ? '#424242' : '#424242',
                  },
                },
              }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  justifyContent: 'center',
                  p: 0,
                  mb: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    backgroundColor: taxiMonterricoColors.orange,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: taxiMonterricoColors.orangeDark,
                    },
                  },
                  '&:hover': {
                    backgroundColor: isSelected ? taxiMonterricoColors.orangeDark : theme.palette.action.hover,
                  },
                  '&:not(.Mui-selected)': {
                    color: theme.palette.text.secondary,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: 'center',
                    color: 'inherit',
                    '& svg': {
                      fontSize: 22,
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          );
        })}
        
        {/* Opción de Administrar Usuarios - Solo visible para admins */}
        {user?.role === 'admin' && (
          <Tooltip 
            title="Administrar Usuarios" 
            placement="right"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: '#424242',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  ml: 1,
                },
              },
              arrow: {
                sx: {
                  color: '#424242',
                },
              },
            }}
          >
            <ListItemButton
              selected={location.pathname === '/users'}
              onClick={() => navigate('/users')}
              sx={{
                minHeight: 48,
                width: 48,
                height: 48,
                borderRadius: 2,
                justifyContent: 'center',
                p: 0,
                mb: 0.5,
                mt: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  backgroundColor: taxiMonterricoColors.orange,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: taxiMonterricoColors.orangeDark,
                  },
                },
                '&:hover': {
                  backgroundColor: location.pathname === '/users' ? taxiMonterricoColors.orangeDark : theme.palette.action.hover,
                },
                '&:not(.Mui-selected)': {
                  color: theme.palette.text.secondary,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: 'center',
                  color: 'inherit',
                  '& svg': {
                    fontSize: 22,
                  },
                }}
              >
                <AdminPanelSettings />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        )}
      </List>
      
      {/* Separador y botón de cerrar sesión al final */}
      <Box sx={{ flex: 1 }} />
      <Box sx={{ width: '100%', px: 1.5 }}>
        <Tooltip 
          title="Cerrar sesión" 
          placement="right"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: '#424242',
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                ml: 1,
              },
            },
            arrow: {
              sx: {
                color: '#424242',
              },
            },
          }}
        >
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              width: 48,
              height: 48,
              borderRadius: 2,
              justifyContent: 'center',
              p: 0,
              mb: 0.5,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.error.main}20` : `${theme.palette.error.main}10`,
                color: theme.palette.error.dark,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
                color: 'inherit',
                '& svg': {
                  fontSize: 22,
                },
              }}
            >
              <Logout />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;




