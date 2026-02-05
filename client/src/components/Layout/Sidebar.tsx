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
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Task as TaskIcon,
  CalendarToday as CalendarTodayIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { taxiMonterricoColors } from '../../theme/colors';
import logo from '../../assets/tm_logo.png';
import logoMobile from '../../assets/logo.png';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const { open, collapsed } = useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const drawerWidth = collapsed 
    ? (isMobile ? 0 : 90) 
    : 300;

const mainMenuItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Contactos', icon: PersonIcon, path: '/contacts', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Empresas', icon: BusinessIcon, path: '/companies', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Negocios', icon: AttachMoneyIcon, path: '/deals', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Tareas', icon: TaskIcon, path: '/tasks', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  // { text: 'Tickets', icon: <Support />, path: '/tickets', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Calendario', icon: CalendarTodayIcon, path: '/calendar', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Correos', icon: EmailIcon, path: '/emails', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Masivo', icon: EmailIcon, path: '/emails/masivo', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Reportes', icon: AssessmentIcon, path: '/reports', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  // { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  // { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const adminMenuItems = [
  { text: 'Logs del Sistema', icon: DescriptionIcon, path: '/system-logs', roles: ['admin'] },
  { text: 'Roles y Permisos', icon: SecurityIcon, path: '/roles-permissions', roles: ['admin'] },
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
        top: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'visible',
          bgcolor: theme.palette.background.default,
          border: 'none', // Eliminar todos los bordes primero
          borderRight: theme.palette.mode === 'light' 
            ? `0.5px solid ${theme.palette.divider}` 
            : `0.5px solid ${theme.palette.divider}`, // Solo borde derecho
          borderTop: 'none', // Asegurar que no haya borde superior
          borderBottom: 'none', // Asegurar que no haya borde inferior
          borderLeft: 'none', // Asegurar que no haya borde izquierdo
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          py: 0,
          position: 'fixed',
          height: '100vh',
          top: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      {/* Logo en la parte superior del Sidebar */}
      <Box sx={{ 
        width: '100%',
        px: collapsed ? 1 : 0,
        ml: collapsed ? 0 : -3,
        pt: collapsed ? 1.65 : 0,
        mt: collapsed ? 0 : -4,
        pb: collapsed ? 0.5 : 0.5,
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        borderBottom: 'none',
        mb: collapsed ? 3 : -3,
      }}>
        {collapsed ? (
          <img
            src={logoMobile}
            alt="Taxi Monterrico Logo"
            style={{
              width: 40,
              height: 40,
              objectFit: 'contain',
            }}
          />
        ) : (
          <img
            src={logo}
            alt="Taxi Monterrico Logo"
            style={{
              width: '100%',
              maxWidth: 200,
              height: 'auto',
              maxHeight: 140,
              objectFit: 'contain',
            }}
          />
        )}
      </Box>

      {/* Lista de items del menú */}
      <List sx={{ 
        width: '100%', 
        px: collapsed ? 1 : 0.8, 
        pt: 0,
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
                    ? `${taxiMonterricoColors.greenDark}33` 
                    : `${taxiMonterricoColors.green}15`,
                  color: taxiMonterricoColors.greenLight,
                  boxShadow: 'none',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' 
                      ? `${taxiMonterricoColors.greenDark}33` 
                      : `${taxiMonterricoColors.green}15`,
                    boxShadow: 'none',
                  },
                },
                '&:hover': {
                  ...(isSelected ? {
                    background: theme.palette.mode === 'dark' 
                      ? `${taxiMonterricoColors.greenDark}33` 
                      : `${taxiMonterricoColors.green}15`,
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
                  display: 'flex',
                  alignItems: 'center',
                  color: isSelected 
                    ? (theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green)
                    : theme.palette.text.secondary,
                }}
              >
                {React.createElement(item.icon, {
                  sx: { fontSize: 24 }
                })}
              </ListItemIcon>
              {!collapsed && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected 
                      ? (theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green)
                      : theme.palette.text.secondary,
                    ml: 0.8,
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
                      ? (theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green)
                      : theme.palette.text.secondary,
                    textAlign: 'center',
                    mt: 0.25,
                  }}
                ><span>{item.text}</span>
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
                  : '#5cdf9924',
                color: taxiMonterricoColors.greenLight,
                boxShadow: 'none',
                '&:hover': {
                  background: theme.palette.mode === 'dark' 
                    ? '#1a2e2a' 
                    : '#5cdf9924',
                  boxShadow: 'none',
                },
              },
              '&:hover': {
                ...(location.pathname === '/users' ? {
                  background: theme.palette.mode === 'dark' 
                    ? '#1a2e2a' 
                    : '#5cdf9924',
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
                display: 'flex',
                alignItems: 'center',
                color: location.pathname === '/users'
                  ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                  : '#5a5c61',
              }}
            >
              <PeopleIcon sx={{ fontSize: 24 }} />
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
                  ml: 0.8,
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

        {/* Opción de Logs del Sistema - Solo visible para admins */}
        {(() => {
          const userRole = user?.role;
          return userRole === 'admin';
        })() && (
          adminMenuItems
            .filter((item) => {
              const userRole = user?.role;
              if (item.roles && item.roles.length > 0) {
                return userRole && item.roles.includes(userRole);
              }
              return true;
            })
            .map((item) => {
              const isSelected = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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
                    mt: 0,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      background: theme.palette.mode === 'dark' 
                        ? '#1a2e2a' 
                        : '#5cdf9924',
                      color: taxiMonterricoColors.greenLight,
                      boxShadow: 'none',
                      '&:hover': {
                        background: theme.palette.mode === 'dark' 
                          ? '#1a2e2a' 
                          : '#5cdf9924',
                        boxShadow: 'none',
                      },
                    },
                    '&:hover': {
                      ...(isSelected ? {
                        background: theme.palette.mode === 'dark' 
                          ? '#1a2e2a' 
                          : '#5cdf9924',
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
                      display: 'flex',
                      alignItems: 'center',
                      color: isSelected 
                        ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
                        : '#5a5c61',
                    }}
                  >
                    {React.createElement(item.icon, {
                      sx: { fontSize: 24 }
                    })}
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
                        ml: 0.8,
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
            })
        )}
      </List>
      
      {/* Separador */}
      <Box sx={{ flex: 1 }} />
      
    </Drawer>
  );
};

export default Sidebar;




