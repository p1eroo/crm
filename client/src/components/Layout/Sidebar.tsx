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
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
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
  Edit,
  DarkMode,
  LightMode,
  Assessment,
  CalendarToday,
  Settings,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useThemeContext } from '../../context/ThemeContext';
import ProfileModal from '../ProfileModal';
import logo from '../../assets/tm_logo.png';

const drawerWidth = 200;

const mainMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Contactos', icon: <People />, path: '/contacts', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Empresas', icon: <Business />, path: '/companies', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Negocios', icon: <AttachMoney />, path: '/deals', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Pipeline', icon: <AccountTree />, path: '/pipeline', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Tareas', icon: <Assignment />, path: '/tasks', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Tickets', icon: <Support />, path: '/tickets', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Calendario', icon: <CalendarToday />, path: '/calendar', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Reportes', icon: <Assessment />, path: '/reports', roles: ['admin', 'jefe_comercial'] },
  // { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  // { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext();
  const [profileAnchorEl, setProfileAnchorEl] = React.useState<null | HTMLElement>(null);
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleEditProfile = () => {
    setProfileModalOpen(true);
    handleProfileMenuClose();
  };

  const handleLogout = () => {
    handleProfileMenuClose();
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
          py: 2,
        },
      }}
    >
      {/* Logo/Icono superior */}
      <Box sx={{ 
        mb: -4,
        mt: -4,
        display: 'flex', 
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        pl: 2.5,
        pr: 1,
      }}>
        <img
          src={logo}
          alt="Taxi Monterrico Logo"
          style={{
            width: 120,
            height: 120,
            objectFit: 'contain',
          }}
        />
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
              minHeight: 40,
              borderRadius: 2,
              justifyContent: 'flex-start',
              px: 1,
              py: 0.75,
              mb: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  backgroundColor: '#c4d4d4',
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: '#c4d4d4',
                  },
                },
                '&:hover': {
                  backgroundColor: isSelected ? '#c4d4d4' : theme.palette.action.hover,
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
                  color: 'inherit',
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
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: 'inherit',
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
              minHeight: 40,
              borderRadius: 2,
              justifyContent: 'flex-start',
              px: 1,
              py: 0.75,
              mb: 0,
              mt: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                backgroundColor: '#c4d4d4',
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: '#c4d4d4',
                },
              },
              '&:hover': {
                backgroundColor: location.pathname === '/users' ? '#c4d4d4' : theme.palette.action.hover,
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
                color: 'inherit',
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
                fontSize: '0.8125rem',
                fontWeight: location.pathname === '/users' ? 600 : 400,
                color: 'inherit',
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
          onClick={() => {
            // Aquí puedes agregar la navegación o acción para configuración
            console.log('Configuración');
          }}
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
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: theme.palette.text.primary,
              ml: 1,
            }}
          >
            Configuración
          </Typography>
        </ListItemButton>
      </Box>
      
      {/* Perfil del usuario */}
      <Box sx={{ width: '100%', px: 1, mb: 1.5 }}>
        <ListItemButton
          onClick={handleProfileClick}
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
              color: 'inherit',
            }}
          >
            <Avatar
              src={user?.avatar}
              sx={{
                width: 28,
                height: 28,
                bgcolor: user?.avatar ? 'transparent' : taxiMonterricoColors.green,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {!user?.avatar && `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()}
            </Avatar>
          </ListItemIcon>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: theme.palette.text.primary,
              ml: 1,
            }}
          >
            Perfil
          </Typography>
        </ListItemButton>
      </Box>
      
      {/* Menú del perfil */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: -1,
            ml: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <MenuItem 
          onClick={handleEditProfile}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <Edit sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
              Editar perfil
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Actualizar información
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={toggleTheme}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          {mode === 'light' ? (
            <DarkMode sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          ) : (
            <LightMode sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {mode === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            color: theme.palette.error.main,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? `${theme.palette.error.main}20` : `${theme.palette.error.main}10`,
            },
          }}
        >
          <Logout sx={{ fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Cerrar sesión
          </Typography>
        </MenuItem>
      </Menu>
      
      {/* Modal de perfil */}
      <ProfileModal 
        open={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)}
      />
    </Drawer>
  );
};

export default Sidebar;




