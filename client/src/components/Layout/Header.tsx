import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  Tooltip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  Search, 
  Contacts as PersonIcon,
  DarkMode,
  LightMode,
  Logout,
  Menu as MenuIcon,
  Settings,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Task as TaskIcon,
  CalendarToday as CalendarTodayIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { Logs } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taxiMonterricoColors } from '../../theme/colors';
import { useTheme as useThemeContext } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { SettingsDrawer } from '../SettingsDrawer';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/tm_login.png';
import UserAvatar from '../UserAvatar';
import { NotificationBell } from '../Notifications';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext();
  const { open: sidebarOpen, collapsed: sidebarCollapsed, toggleSidebar, toggleCollapsed, layoutMode } = useSidebar();
  
  const isHorizontal = layoutMode === 'horizontal';
  
  // Items del menú para el modo horizontal (mismos que en Sidebar)
  const mainMenuItems = [
    { text: 'Dashboard', icon: DashboardIcon, path: '/dashboard', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Contactos', icon: PersonIcon, path: '/contacts', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Empresas', icon: BusinessIcon, path: '/companies', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Negocios', icon: AttachMoneyIcon, path: '/deals', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Tareas', icon: TaskIcon, path: '/tasks', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Calendario', icon: CalendarTodayIcon, path: '/calendar', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Buzón', icon: EmailIcon, path: '/emails', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Masivo', icon: EmailIcon, path: '/emails/masivo', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Reportes', icon: AssessmentIcon, path: '/reports', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  ];

  const adminMenuItems = [
    { text: 'Logs del Sistema', icon: DescriptionIcon, path: '/system-logs', roles: ['admin'] },
    { text: 'Roles y Permisos', icon: SecurityIcon, path: '/roles-permissions', roles: ['admin'] },
  ];

  // Filtrar items según el rol del usuario
  const filteredMainItems = mainMenuItems.filter(item => 
    !item.roles || !user?.role || item.roles.includes(user.role)
  );
  const filteredAdminItems = adminMenuItems.filter(item => 
    !item.roles || !user?.role || item.roles.includes(user.role)
  );
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Páginas disponibles para mostrar en el modal de búsqueda
  const availablePages = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
      icon: DashboardIcon,
    },
    { 
      title: 'Contactos', 
      path: '/contacts', 
      icon: PersonIcon,
    },
    { 
      title: 'Empresas', 
      path: '/companies', 
      icon: BusinessIcon,
    },
    { 
      title: 'Negocios', 
      path: '/deals', 
      icon: AttachMoneyIcon,
    },
    { 
      title: 'Tareas', 
      path: '/tasks', 
      icon: TaskIcon,
    },
    // { 
    //   title: 'Tickets', 
    //   path: '/tickets', 
    //   icon: <Support />,
    // },
    { 
      title: 'Calendario', 
      path: '/calendar', 
      icon: CalendarTodayIcon,
    },
    { 
      title: 'Buzón', 
      path: '/emails', 
      icon: EmailIcon,
    },
    { 
      title: 'Masivo', 
      path: '/emails/masivo', 
      icon: EmailIcon,
    },
    { 
      title: 'Reportes', 
      path: '/reports', 
      icon: AssessmentIcon,
    },
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleClose();
  };

  // Listener para el atajo de teclado Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar si el usuario está escribiendo en un input o textarea
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Verificar si se presionó Ctrl+K (o Cmd+K en Mac)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !isInput) {
        event.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      sx={{
        width: { 
          xs: '100vw',
          sm: '100%' // El contenedor en MainLayout ya maneja el ancho
        },
        bgcolor: isScrolled
          ? alpha(theme.palette.background.default, 0.88)
          : theme.palette.background.default,
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
        pl: { xs: 1, sm: 1.5 },
        pr: { xs: 1, sm: 6.5 },
        pt: isHorizontal ? 0 : { xs: 1, sm: 1.25 },
        pb: isHorizontal ? 0 : { xs: 1, sm: 1.25 },
        display: 'flex',
        flexDirection: isHorizontal ? 'column' : 'row',
        alignItems: isHorizontal ? 'stretch' : 'center',
        justifyContent: 'flex-start',
        gap: isHorizontal ? 1 : 0,
        height: isHorizontal ? 'auto' : { xs: 64, sm: 77 },
        minHeight: isHorizontal ? 'auto' : { xs: 64, sm: 77 },
        position: { xs: 'fixed', sm: 'sticky' },
        top: 0,
        left: { 
          xs: 0,
          sm: 0 // El contenedor en MainLayout ya maneja el posicionamiento
        },
        zIndex: { xs: 1400, sm: 1300 },
        marginLeft: 0,
        marginRight: 0,
        borderBottom: theme.palette.mode === 'light'
          ? '0.5px solid rgba(0, 0, 0, 0.06)'
          : '0.5px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 0.3s ease', // Transición suave para todos los cambios
      }}
    >
      {/* Cuando es horizontal: Primera fila - Logo + elementos de la derecha */}
      {isHorizontal && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          mt: 1.5,
          mb: 0.5,
        }}>
          {/* Logo grande */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0,
              px: 2,
              flexShrink: 0,
              width: 'fit-content',
              height: 'fit-content',
              lineHeight: 0,
            }}
          >
            <img
              src={logo}
              alt="Taxi Monterrico"
              onClick={() => navigate('/dashboard')}
              style={{ 
                height: 30, 
                width: 'auto',
                cursor: 'pointer',
              }}
            />
          </Box>

          {/* Elementos de la derecha: tema, notificaciones, configuración, perfil */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Tickets - reportar fallos / soporte */}
            <Tooltip title="Tickets (reportar fallos o solicitudes)">
              <IconButton
                size="small"
                onClick={() => navigate('/tickets')}
                sx={{
                  bgcolor: 'transparent',
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.12)'
                    : '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 2.5,
                  width: 40,
                  height: 40,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                <SupportIcon sx={{ fontSize: 24, color: '#637381' }} />
              </IconButton>
            </Tooltip>

            {/* Modo oscuro */}
            <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
              <IconButton 
                size="small"
                onClick={toggleTheme}
                sx={{ 
                  bgcolor: 'transparent',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 2.5,
                  width: 40,
                  height: 40,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                {mode === 'light' ? (
                  <DarkMode sx={{ fontSize: 24, color: '#637381' }} />
                ) : (
                  <LightMode sx={{ fontSize: 24, color: '#637381' }} />
                )}
              </IconButton>
            </Tooltip>

            {/* Notificaciones */}
            <NotificationBell />

            {/* Configuración */}
            <Tooltip title="Configuración">
              <IconButton
                size="small"
                onClick={() => setSettingsDrawerOpen(true)}
                sx={{ 
                  bgcolor: 'transparent',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 2.5,
                  width: 40,
                  height: 40,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                <Settings sx={{ fontSize: 24, color: '#637381' }} />
              </IconButton>
            </Tooltip>

            {/* Avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', ml: 1, mr:-3 }} onClick={handleMenu}>
              <UserAvatar
                firstName={user?.firstName}
                lastName={user?.lastName}
                avatar={user?.avatar}
                size="medium"
                variant="header"
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Cuando es horizontal: Segunda fila - Menú de navegación */}
      {isHorizontal && (
        <>
          {/* Línea superior que se extiende completamente */}
          <Box 
            sx={{ 
              borderTop: `1px solid ${theme.palette.divider}`,
              ml: { xs: -1, sm: -1.5 },
              mr: { xs: -1, sm: -6.5 },
            }} 
          />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            overflowX: 'auto',
            width: '100%',
            pt: 0.5,
            pb: 1.5,
            pl: { xs: 1, sm: 1.5 },
            pr: { xs: 1, sm: 6.5 },
          }}>
          {filteredMainItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive ? taxiMonterricoColors.green : theme.palette.text.secondary,
                  fontWeight: isActive ? 600 : 400,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: isActive 
                    ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : `${taxiMonterricoColors.green}10`)
                    : 'transparent',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    bgcolor: isActive 
                      ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}25` : `${taxiMonterricoColors.green}15`)
                      : theme.palette.action.hover,
                  },
                }}
              >
                {React.createElement(item.icon, {
                  sx: { fontSize: 20, mr: 0.5 }
                })}
                {item.text}
              </Button>
            );
          })}
          {user?.role === 'admin' && filteredAdminItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive ? taxiMonterricoColors.green : theme.palette.text.secondary,
                  fontWeight: isActive ? 600 : 400,
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  bgcolor: isActive 
                    ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : `${taxiMonterricoColors.green}10`)
                    : 'transparent',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    bgcolor: isActive 
                      ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}25` : `${taxiMonterricoColors.green}15`)
                      : theme.palette.action.hover,
                  },
                }}
              >
                {React.createElement(item.icon, {
                  sx: { fontSize: 20, mr: 0.5 }
                })}
                {item.text}
              </Button>
            );
          })}
          </Box>
        </>
      )}

      {/* Botón de menú - Solo visible en móviles o cuando no es horizontal */}
      {!isHorizontal && (
        <Box sx={{ 
          display: { xs: 'flex', sm: 'none' }, // Oculto en desktop, visible en móviles
          alignItems: 'center', 
          gap: { xs: 1, sm: 1 }, 
          flexShrink: 0,
        }}>
          {/* Icono de menú para toggle del sidebar */}
          <IconButton
            onClick={() => {
              if (sidebarOpen) {
                toggleCollapsed();
              } else {
                toggleSidebar();
              }
            }}
            size="small"
            sx={{
              p: 0.75,
              borderRadius: '50%',
              minWidth: 36,
              width: 36,
              height: 36,
              flexShrink: 0,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <MenuIcon sx={{ fontSize: 24, color: '#637381' }} />
          </IconButton>
        </Box>
      )}
      
      {/* Botón expandir/contraer sidebar + Búsqueda - Desktop (solo cuando no es horizontal) */}
      {!isHorizontal && (
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            maxWidth: sidebarOpen ? '400px' : '400px',
            marginLeft: { xs: 0, sm: 2 },
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Tooltip title={sidebarOpen && !sidebarCollapsed ? 'Contraer menú' : 'Expandir menú'}>
            <IconButton
              onClick={() => {
                if (sidebarOpen) {
                  toggleCollapsed();
                } else {
                  toggleSidebar();
                }
              }}
              size="small"
              sx={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: 'transparent',
                border: theme.palette.mode === 'light'
                  ? '0.5px solid rgba(0, 0, 0, 0.06)'
                  : '0.5px solid rgba(255, 255, 255, 0.06)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                  border: theme.palette.mode === 'light'
                    ? '0.5px solid rgba(0, 0, 0, 0.1)'
                    : '0.5px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Logs size={22} style={{ color: '#637381' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Elementos del lado derecho - Solo cuando NO es horizontal */}
      {!isHorizontal && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 'auto' }}>
        {/* Tickets */}
        <Tooltip title="Tickets (reportar fallos o solicitudes)">
          <IconButton
            size="small"
            onClick={() => navigate('/tickets')}
            sx={{
              bgcolor: 'transparent',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.12)'
                : '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 2.5,
              width: 40,
              height: 40,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <SupportIcon sx={{ fontSize: 24, color: '#637381' }} />
          </IconButton>
        </Tooltip>

        {/* Modo oscuro */}
        <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
          <IconButton 
            size="small"
            onClick={toggleTheme}
            sx={{ 
              bgcolor: 'transparent',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 2.5,
              width: 40,
              height: 40,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            {mode === 'light' ? (
              <DarkMode sx={{ fontSize: 24, color: '#637381' }} />
            ) : (
              <LightMode sx={{ fontSize: 24, color: '#637381' }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Notificaciones */}
        <NotificationBell />

        {/* Icono de Configuración */}
        <Tooltip title="Configuración">
          <IconButton
            size="small"
            onClick={() => setSettingsDrawerOpen(true)}
            sx={{ 
              bgcolor: 'transparent',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 2.5,
              width: 40,
              height: 40,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <Settings sx={{ fontSize: 24, color: '#637381' }} />
          </IconButton>
        </Tooltip>

        {/* Avatar con dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer', ml: 1 }} onClick={handleMenu}>
          <UserAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            avatar={user?.avatar}
            size="medium"
            variant="header"
          />
        </Box>
        </Box>
      )}

      {/* Menu dropdown del usuario */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : theme.palette.background.paper,
            color: theme.palette.text.primary,
            mt: 1,
            minWidth: 200,
            borderRadius: 1,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.6)' 
              : '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
            margin: 0,
            
          },
          
        }}
        MenuListProps={{
          sx: {
            padding: '0 !important',
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
            bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : 'transparent',
            border: 'none',
            borderTop: 'none',
            borderBottom: 'none',
          },
        }}
        
      >
        <Box sx={{ 
          px: 2.5, 
          pt: 2.5, 
          pb: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : 'transparent',
          border: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          margin: 0,
          '&::before': {
            display: 'none',
            content: '""',
          },
          '&::after': {
            display: 'none',
            content: '""',
          },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UserAvatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              avatar={user?.avatar}
              size={48}
              variant="header"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500, 
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Usuario'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
        {theme.palette.mode !== 'dark' && <Divider />}
        <MenuItem 
          onClick={handleProfileClick}
          sx={{
            py: 1.5,
            px: 3,
            gap: 1.5,
            mt: theme.palette.mode === 'dark' ? 0 : 1,
            bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : 'transparent',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.04)'
                : theme.palette.action.hover,
            },
          }}
        >
          <PersonIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            Editar perfil
          </Typography>
        </MenuItem>
        {theme.palette.mode !== 'dark' && <Divider />}
        <MenuItem 
          onClick={() => {
            handleClose();
            logout();
            navigate('/login');
          }}
          sx={{
            py: 1.5,
            px: 3,
            gap: 1.5,
            bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : 'transparent',
            color: theme.palette.error.main,
            margin: 0,
            marginBottom: 0,
            border: 'none',
            borderTop: 'none',
            borderBottom: 'none',
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

      {/* Modal de búsqueda para móviles */}
      <Dialog
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        fullWidth
        maxWidth="sm"
        disableAutoFocus={false}
        disableEnforceFocus={false}
        disableRestoreFocus={true}
        PaperProps={{
          sx: {
            borderRadius: 5,
            mt: { xs: 8, sm: 0 },
            bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.6)' 
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: 'none',
            '&::before': {
              display: 'none',
            },
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            pb: 1,
            bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : 'transparent',
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider}`,
          }}
        >
          <Search sx={{ color: taxiMonterricoColors.green }} />
          <Typography component="div" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Buscar
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1E252C' : 'transparent', }}>
          <Box sx={{ mt: 2 }}>
            {availablePages.map((page, index) => (
              <React.Fragment key={page.path}>
                <MenuItem
                  onClick={() => {
                    navigate(page.path);
                    setSearchModalOpen(false);
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 1,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderLeft: 'none',
                    borderRight: 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.04)'
                      : theme.palette.action.hover,
                    borderLeft: 'none',
                    borderRight: 'none',
                  },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {page.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {page.path}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1.5,
                      bgcolor: theme.palette.mode === 'dark' ? '#2D3740' : 'transparent',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : undefined,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : undefined,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : undefined,
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : undefined,
                      },
                    }}
                  >
                    Ir
                  </Button>
                </MenuItem>
                {index < availablePages.length - 1 && (
                  <Box
                    sx={{
                      mx: 0,
                      height: '1px',
                      minHeight: '1px',
                      borderBottom: `1px dashed ${
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.2)'
                      }`,
                      mb: 0.5,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Settings Drawer */}
      <SettingsDrawer 
        open={settingsDrawerOpen} 
        onClose={() => setSettingsDrawerOpen(false)} 
      />
    </Box>
  );
};

export default Header;

