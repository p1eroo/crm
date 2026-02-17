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
  Menu,
  MenuItem,
} from '@mui/material';
import { ChartPie, ContactRound, Building2, CircleDollarSign, ClipboardList, CalendarDays, Mail, FileChartColumn, UsersRound, FileClock, ShieldUser, ChevronDown, ChevronRight } from 'lucide-react';
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
  const { open, collapsed, setCollapsed } = useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const expandedByHoverRef = React.useRef(false);
  const [correoExpanded, setCorreoExpanded] = React.useState(() => location.pathname.startsWith('/emails'));
  const [correoMenuAnchor, setCorreoMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleSidebarMouseEnter = React.useCallback(() => {
    if (collapsed && !isMobile) {
      setCollapsed(false);
      expandedByHoverRef.current = true;
    }
  }, [collapsed, isMobile, setCollapsed]);

  const handleSidebarMouseLeave = React.useCallback(() => {
    if (expandedByHoverRef.current) {
      setCollapsed(true);
      expandedByHoverRef.current = false;
    }
  }, [setCollapsed]);

  React.useEffect(() => {
    if (location.pathname.startsWith('/emails')) setCorreoExpanded(true);
  }, [location.pathname]);

  const drawerWidth = collapsed 
    ? (isMobile ? 0 : 90) 
    : 300;

const correoSubItems = [
  { text: 'Buzón', path: '/emails' },
  { text: 'Masivo', path: '/emails/masivo' },
];

const mainMenuItems = [
  { text: 'Dashboard', icon: ChartPie, path: '/dashboard', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Contactos', icon: ContactRound, path: '/contacts', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Empresas', icon: Building2, path: '/companies', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Negocios', icon: CircleDollarSign, path: '/deals', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Tareas', icon: ClipboardList, path: '/tasks', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  // { text: 'Tickets', icon: <Support />, path: '/tickets', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Calendario', icon: CalendarDays, path: '/calendar', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  { text: 'Correo', icon: Mail, path: '/emails', roles: ['admin', 'user', 'manager', 'jefe_comercial'], subItems: correoSubItems },
  { text: 'Reportes', icon: FileChartColumn, path: '/reports', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  // { text: 'Campañas', icon: <Campaign />, path: '/campaigns' },
  // { text: 'Automatizaciones', icon: <Timeline />, path: '/automations' },
];

const adminMenuItems = [
  { text: 'Logs del Sistema', icon: FileClock, path: '/system-logs', roles: ['admin'] },
  { text: 'Roles y Permisos', icon: ShieldUser, path: '/roles-permissions', roles: ['admin'] },
];


  if (!open) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        zIndex: 1200,
        top: 0,
        transition: 'width 200ms ease-in-out',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'visible',
          bgcolor: 'transparent',
          backgroundColor: 'transparent',
          background: 'transparent',
          border: 'none', // Eliminar todos los bordes primero
          borderRight: theme.palette.mode === 'light'
            ? '0.5px solid rgba(0, 0, 0, 0.06)'
            : '0.5px solid rgba(255, 255, 255, 0.06)',
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
          transition: 'width 200ms ease-in-out',
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
            const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
            const isCorreo = item.text === 'Correo';
            const isSelected = item.path === '/dashboard' 
              ? (location.pathname === '/dashboard' || location.pathname === '/')
              : isCorreo
                ? (location.pathname === '/emails' || location.pathname.startsWith('/emails/'))
                : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

            if (hasSubItems && isCorreo) {
              return (
                <Box key={item.text} sx={{ mb: 0 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={(e) => {
                      if (collapsed) setCorreoMenuAnchor(e.currentTarget);
                      else setCorreoExpanded((v) => !v);
                    }}
                    sx={{
                      minHeight: collapsed ? 64 : 44,
                      borderRadius: 3,
                      flexDirection: collapsed ? 'column' : 'row',
                      justifyContent: collapsed ? 'center' : 'space-between',
                      alignItems: 'center',
                      px: collapsed ? 1 : 2,
                      py: collapsed ? 1 : 0.875,
                      mb: 0,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&.Mui-selected': {
                        background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                        color: taxiMonterricoColors.greenLight,
                        boxShadow: 'none',
                        ...(collapsed ? {} : { mx: 1, width: 'calc(100% - 16px)' }),
                        '&:hover': {
                          background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                          boxShadow: 'none',
                        },
                      },
                      '&:hover': {
                        ...(isSelected ? {
                          background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                        } : { backgroundColor: theme.palette.action.hover }),
                      },
                      '&:not(.Mui-selected)': { color: theme.palette.text.secondary, backgroundColor: 'transparent' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 36, justifyContent: 'center', margin: collapsed ? '0 0 4px 0' : 0, display: 'flex', alignItems: 'center', color: isSelected ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f') : theme.palette.text.secondary }}>
                        <Mail size={24} />
                      </ListItemIcon>
                      {!collapsed && (
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f') : theme.palette.text.secondary, ml: 0.8 }}>
                          Correo
                        </Typography>
                      )}
                    </Box>
                    {!collapsed && (correoExpanded ? <ChevronDown size={18} style={{ color: theme.palette.text.secondary }} /> : <ChevronRight size={18} style={{ color: theme.palette.text.secondary }} />)}
                    {collapsed && (
                      <Typography variant="caption" sx={{ fontSize: '0.625rem', fontWeight: 600, color: isSelected ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f') : theme.palette.text.secondary, textAlign: 'center', mt: 0.25 }}>Correo</Typography>
                    )}
                  </ListItemButton>
                  {!collapsed && correoExpanded && item.subItems && item.subItems.map((sub: { text: string; path: string }, subIndex: number) => {
                    const subSelected = location.pathname === sub.path || (sub.path !== '/emails' && location.pathname.startsWith(sub.path + '/'));
                    return (
                      <ListItemButton
                        key={sub.text}
                        selected={subSelected}
                        onClick={() => navigate(sub.path)}
                        sx={{
                          minHeight: 40,
                          borderRadius: 2,
                          pl: 2.5,
                          py: 0.75,
                          ml: 6,
                          mr: 1,
                          mt: subIndex === 0 ? 1 : 0.5,
                          width: 'calc(100% - 56px)',
                          '&.Mui-selected': {
                            background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                            color: theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f',
                            '&:hover': { background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924' },
                          },
                          '&:hover': { backgroundColor: theme.palette.action.hover },
                          '&:not(.Mui-selected)': { color: theme.palette.text.secondary, backgroundColor: 'transparent' },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: subSelected ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f') : 'inherit' }}>
                          {sub.text}
                        </Typography>
                      </ListItemButton>
                    );
                  })}
                </Box>
              );
            }

            return (
            <ListItemButton
              key={item.text}
              selected={isSelected}
              onClick={() => navigate(item.path)}
              sx={{
              minHeight: collapsed ? 64 : 44,
              borderRadius: 3,
              flexDirection: collapsed ? 'column' : 'row',
              justifyContent: collapsed ? 'center' : 'flex-start',
              alignItems: 'center',
              px: collapsed ? 1 : 2,
              py: collapsed ? 1 : 0.875,
              mb: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                  color: taxiMonterricoColors.greenLight,
                  boxShadow: 'none',
                  ...(collapsed ? {} : { mx: 1, width: 'calc(100% - 16px)' }),
                  '&:hover': {
                    background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                    boxShadow: 'none',
                  },
                },
                '&:hover': {
                  ...(isSelected ? {
                    background: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
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
                    : theme.palette.text.secondary,
                }}
              >
                {item.text === 'Dashboard' ? <ChartPie size={24} /> : item.text === 'Contactos' ? <ContactRound size={24} /> : item.text === 'Empresas' ? <Building2 size={24} /> : item.text === 'Negocios' ? <CircleDollarSign size={24} /> : item.text === 'Tareas' ? <ClipboardList size={24} /> : item.text === 'Calendario' ? <CalendarDays size={24} /> : item.text === 'Reportes' ? <FileChartColumn size={24} /> : React.createElement(item.icon as React.ComponentType<{ sx?: { fontSize?: number } }>, {
                  sx: { fontSize: 24 }
                })}
              </ListItemIcon>
              {!collapsed && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isSelected 
                      ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
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
                    fontWeight: 600,
                    color: isSelected 
                      ? (theme.palette.mode === 'dark' ? '#5be49b' : '#00a76f')
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

        <Menu
          anchorEl={correoMenuAnchor}
          open={Boolean(correoMenuAnchor)}
          onClose={() => setCorreoMenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { mt: 1.5, minWidth: 140, borderRadius: 2 } } }}
        >
          <MenuItem
            onClick={() => { navigate('/emails'); setCorreoMenuAnchor(null); }}
            selected={location.pathname === '/emails'}
            sx={{ py: 1.25, '&.Mui-selected': { bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}25` : `${taxiMonterricoColors.green}15` } }}
          >
            Buzón
          </MenuItem>
          <MenuItem
            onClick={() => { navigate('/emails/masivo'); setCorreoMenuAnchor(null); }}
            selected={location.pathname === '/emails/masivo'}
            sx={{ py: 1.25, '&.Mui-selected': { bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}25` : `${taxiMonterricoColors.green}15` } }}
          >
            Masivo
          </MenuItem>
        </Menu>
        
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
              borderRadius: 3,
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
                ...(collapsed ? {} : { mx: 1, width: 'calc(100% - 16px)' }),
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
              <UsersRound size={24} />
            </ListItemIcon>
            {!collapsed && (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
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
                  fontWeight: 600,
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
                    borderRadius: 3,
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
                      ...(collapsed ? {} : { mx: 1, width: 'calc(100% - 16px)' }),
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
                    {item.text === 'Dashboard' ? <ChartPie size={24} /> : item.text === 'Contactos' ? <ContactRound size={24} /> : item.text === 'Empresas' ? <Building2 size={24} /> : item.text === 'Negocios' ? <CircleDollarSign size={24} /> : item.text === 'Tareas' ? <ClipboardList size={24} /> : item.text === 'Calendario' ? <CalendarDays size={24} /> : item.text === 'Correos' ? <Mail size={24} /> : item.text === 'Reportes' ? <FileChartColumn size={24} /> : item.text === 'Logs del Sistema' ? <FileClock size={24} /> : item.text === 'Roles y Permisos' ? <ShieldUser size={24} /> : React.createElement(item.icon as React.ComponentType<{ sx?: { fontSize?: number } }>, {
                      sx: { fontSize: 24 }
                    })}
                  </ListItemIcon>
                  {!collapsed && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
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
                        fontWeight: 600,
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




