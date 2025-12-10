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
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useThemeContext } from '../../context/ThemeContext';
import ProfileModal from '../ProfileModal';
import logo from '../../assets/logo-taxi-monterrico.svg';

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
        width: '100%',
        px: 1.5,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'}`,
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
          p: 0.5,
        }}>
          <img
            src={logo}
            alt="Taxi Monterrico Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>

      {/* Lista de items del menú */}
      <List sx={{ 
        width: '100%', 
        px: 1.5, 
        py: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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
                  borderRadius: '50%',
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
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'}`,
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
        {(() => {
          const userRole = user?.role;
          console.log('🔍 Verificando rol para mostrar opción de administrar usuarios:', userRole);
          return userRole === 'admin';
        })() && (
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
                borderRadius: '50%',
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
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'}`,
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
      
      {/* Separador */}
      <Box sx={{ flex: 1 }} />
      
      {/* Perfil del usuario */}
      <Box sx={{ width: '100%', px: 1.5, mb: 1.5, display: 'flex', justifyContent: 'center' }}>
        <Avatar
          src={user?.avatar}
          onClick={handleProfileClick}
          sx={{
            width: 48,
            height: 48,
            bgcolor: user?.avatar ? 'transparent' : taxiMonterricoColors.green,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          }}
        >
          {!user?.avatar && `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()}
        </Avatar>
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




