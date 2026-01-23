import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Badge,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { 
  Search, 
  Notifications,
  Person,
  DarkMode,
  LightMode,
  Logout,
  Menu as MenuIcon,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { taxiMonterricoColors } from '../../theme/colors';
import api from '../../config/api';
import { useTheme as useThemeContext } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { SettingsDrawer } from '../SettingsDrawer';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/tm_login.png';
import UserAvatar from '../UserAvatar';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext();
  const { open: sidebarOpen, toggleSidebar, toggleCollapsed, layoutMode } = useSidebar();
  
  const isHorizontal = layoutMode === 'horizontal';
  
  // Items del menú para el modo horizontal (mismos que en Sidebar)
  const mainMenuItems = [
    { text: 'Dashboard', icon: '📊', path: '/dashboard', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Contactos', icon: '👤', path: '/contacts', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Empresas', icon: '🏢', path: '/companies', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Negocios', icon: '💰', path: '/deals', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Tareas', icon: '📋', path: '/tasks', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Calendario', icon: '📅', path: '/calendar', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Correos', icon: '📧', path: '/emails', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
    { text: 'Reportes', icon: '📈', path: '/reports', roles: ['admin', 'user', 'manager', 'jefe_comercial'] },
  ];

  const adminMenuItems = [
    { text: 'Logs del Sistema', icon: '📝', path: '/system-logs', roles: ['admin'] },
    { text: 'Roles y Permisos', icon: '🛡️', path: '/roles-permissions', roles: ['admin'] },
  ];

  // Filtrar items según el rol del usuario
  const filteredMainItems = mainMenuItems.filter(item => 
    !item.roles || !user?.role || item.roles.includes(user.role)
  );
  const filteredAdminItems = adminMenuItems.filter(item => 
    !item.roles || !user?.role || item.roles.includes(user.role)
  );
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Páginas disponibles para mostrar en el modal de búsqueda
  const availablePages = [
    { 
      title: 'Dashboard', 
      path: '/dashboard', 
      icon: '📊',
    },
    { 
      title: 'Contactos', 
      path: '/contacts', 
      icon: '👤',
    },
    { 
      title: 'Empresas', 
      path: '/companies', 
      icon: '🏢',
    },
    { 
      title: 'Negocios', 
      path: '/deals', 
      icon: '💰',
    },
    { 
      title: 'Tareas', 
      path: '/tasks', 
      icon: '📋',
    },
    // { 
    //   title: 'Tickets', 
    //   path: '/tickets', 
    //   icon: <Support />,
    // },
    { 
      title: 'Calendario', 
      path: '/calendar', 
      icon: '📅',
    },
    { 
      title: 'Correos', 
      path: '/emails', 
      icon: '📧',
    },
    { 
      title: 'Reportes', 
      path: '/reports', 
      icon: '📈',
    },
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
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

  // Obtener notificaciones de tareas y eventos
  useEffect(() => {
    const fetchNotifications = async (autoOpen: boolean = false) => {
      // Verificar autenticación antes de hacer requests
      const token = localStorage.getItem('token');
      if (!user || !token) {
        console.log('⚠️ Usuario no autenticado, omitiendo fetchNotifications');
        return;
      }

      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Inicio del día actual
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7); // 7 días desde hoy
        
        // Obtener tareas con fecha de vencimiento próxima
        // Filtrar solo las tareas asignadas al usuario actual
        const tasksResponse = await api.get('/tasks', {
          params: { 
            limit: 100,
            assignedToId: user?.id, // Filtrar por usuario asignado
          },
        });
        
        // Validar que la respuesta sea un array
        let tasks: any[] = [];
        if (Array.isArray(tasksResponse.data)) {
          tasks = tasksResponse.data;
        } else if (tasksResponse.data?.tasks && Array.isArray(tasksResponse.data.tasks)) {
          tasks = tasksResponse.data.tasks;
        } else if (tasksResponse.data && typeof tasksResponse.data === 'object') {
          // Si es un objeto pero no tiene la propiedad tasks, intentar convertir a array
          tasks = [];
        }
        
        // Filtrar tareas que vencen en los próximos 7 días y no están completadas
        const upcomingTasks = tasks.filter((task: any) => {
          if (!task.dueDate || task.status === 'completed') return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= now && dueDate <= nextWeek;
        });

        // Obtener eventos de Google Calendar (si están disponibles)
        let upcomingEvents: any[] = [];
        try {
          // Verificar autenticación nuevamente antes de hacer el request
          const currentToken = localStorage.getItem('token');
          if (!user || !currentToken) {
            throw new Error('Usuario no autenticado');
          }
          const calendarResponse = await api.get('/google/events');
          if (calendarResponse.data && Array.isArray(calendarResponse.data)) {
            upcomingEvents = calendarResponse.data.filter((event: any) => {
              if (!event.start?.dateTime && !event.start?.date) return false;
              const eventDate = new Date(event.start.dateTime || event.start.date);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= now && eventDate <= nextWeek;
            });
          }
        } catch (error: any) {
          // Si es un 401, significa que el usuario no tiene Google Calendar conectado
          // o el token expiró. Esto es normal y no debería mostrar error.
          if (error.response?.status === 401) {
            console.log('ℹ️ Google Calendar no disponible o no conectado');
          } else {
            // Para otros errores, loguear pero no interrumpir el flujo
            console.log('⚠️ Error obteniendo eventos de Google Calendar:', error.message);
          }
          // Continuar sin eventos de Google Calendar
        }

        const allReminders = [
          ...upcomingTasks.map((task: any) => ({
            type: 'task',
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
            contactId: task.contactId || null,
            companyId: task.companyId || null,
            dealId: task.dealId || null,
          })),
          ...upcomingEvents.map((event: any) => ({
            type: 'event',
            id: event.id,
            title: event.summary || 'Evento sin título',
            dueDate: event.start?.dateTime || event.start?.date,
          })),
        ];

        // Ordenar por fecha
        allReminders.sort((a, b) => {
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          return dateA - dateB;
        });

        setNotifications(allReminders);
        setNotificationCount(allReminders.length);

        // Abrir el diálogo automáticamente si hay notificaciones y autoOpen es true
        if (autoOpen && allReminders.length > 0) {
          setNotificationDialogOpen(true);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setNotificationCount(0);
      }
    };

    // Cargar notificaciones inicialmente
    fetchNotifications(false);
    
    // Actualizar cada 5 minutos (sin abrir automáticamente)
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 5 * 60 * 1000);
    
    // Escuchar eventos de actividad completada
    const handleActivityCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { title, timestamp } = customEvent.detail;
      
      // Agregar la notificación al estado
      const newNotification = {
        type: 'activity',
        id: `activity-${Date.now()}`,
        title: title,
        dueDate: timestamp,
      };
      
      setNotifications((prev) => {
        // Evitar duplicados
        const exists = prev.some((n) => n.id === newNotification.id);
        if (exists) return prev;
        return [newNotification, ...prev];
      });
      setNotificationCount((prev) => prev + 1);
    };
    
    window.addEventListener('activityCompleted', handleActivityCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('activityCompleted', handleActivityCompleted);
    };
  }, [user]);

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
          ? (theme.palette.mode === 'dark' 
              ? 'rgba(18, 22, 35, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)')
          : theme.palette.background.default,
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(10px)' : 'none', // Para Safari
        pl: { xs: 1, sm: 1.5 },
        pr: { xs: 1, sm: 6.5 },
        pt: isHorizontal ? 0 : { xs: 1, sm: 1.25 },
        pb: isHorizontal ? 0 : { xs: 1, sm: 1.25 },
        display: 'flex',
        flexDirection: isHorizontal ? 'column' : 'row',
        alignItems: isHorizontal ? 'stretch' : 'center',
        justifyContent: 'flex-start',
        gap: isHorizontal ? 1 : 0,
        height: isHorizontal ? 'auto' : { xs: 60, sm: 72 },
        minHeight: isHorizontal ? 'auto' : { xs: 60, sm: 72 },
        position: { xs: 'fixed', sm: 'sticky' },
        top: 0,
        left: { 
          xs: 0,
          sm: 0 // El contenedor en MainLayout ya maneja el posicionamiento
        },
        zIndex: { xs: 1400, sm: 1300 },
        marginLeft: 0,
        marginRight: 0,
        borderBottom: isHorizontal 
          ? `1px solid ${theme.palette.divider}` 
          : { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
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

          {/* Elementos de la derecha: búsqueda, tema, notificaciones, configuración, perfil */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Búsqueda */}
            <Button
              onClick={() => setSearchModalOpen(true)}
              sx={{
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '50px',
                px: 1.5,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                border: `1px solid ${theme.palette.divider}`,
                textTransform: 'none',
                color: theme.palette.text.secondary,
                minWidth: 200,
                justifyContent: 'flex-start',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: taxiMonterricoColors.green,
                },
              }}
            >
              <Search 
                sx={{ 
                  fontSize: 18,
                  color: '#7081b9',
                  mr: 1,
                }} 
              />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  flex: 1,
                  textAlign: 'left',
                }}
              >
                Buscar...
              </Typography>
              <Chip
                label="Ctrl+K"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                  color: theme.palette.text.secondary,
                  border: 'none',
                  '& .MuiChip-label': {
                    px: 0.75,
                  },
                }}
              />
            </Button>

            {/* Modo oscuro */}
            <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
              <IconButton 
                size="small"
                onClick={toggleTheme}
                sx={{ 
                  bgcolor: 'transparent', 
                  borderRadius: 1, 
                  width: 40,
                  height: 40,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
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
            <Tooltip title="Notificaciones">
              <IconButton 
                ref={notificationButtonRef}
                size="small"
                onClick={handleNotificationMenu}
                sx={{ 
                  bgcolor: 'transparent', 
                  borderRadius: 1, 
                  width: 40,
                  height: 40,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <Badge 
                  badgeContent={notificationCount > 0 ? notificationCount : undefined} 
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.625rem',
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                    },
                  }}
                >
                  <Notifications sx={{ fontSize: 24, color: '#637381' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Configuración */}
            <Tooltip title="Configuración">
              <IconButton
                size="small"
                onClick={() => setSettingsDrawerOpen(true)}
                sx={{ 
                  bgcolor: 'transparent', 
                  borderRadius: 1, 
                  width: 40,
                  height: 40,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
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
                <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                  {item.icon}
                </Box>
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
                <Box component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                  {item.icon}
                </Box>
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
      
      {/* Botón de búsqueda - Desktop (solo cuando no es horizontal) */}
      {!isHorizontal && (
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            maxWidth: sidebarOpen ? '350px' : '350px',
            marginLeft: 4,
            display: { xs: 'none', sm: 'block' },
          }}
        >
        <Button
          onClick={() => setSearchModalOpen(true)}
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '50px',
            px: 1.5,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease',
            border: `1px solid ${theme.palette.divider}`,
            textTransform: 'none',
            color: theme.palette.text.secondary,
            width: '100%',
            justifyContent: 'flex-start',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.04)',
              borderColor: taxiMonterricoColors.green,
            },
          }}
        >
          <Search 
            sx={{ 
              fontSize: 18,
              color: '#7081b9',
              mr: 1,
            }} 
          />
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              flex: 1,
              textAlign: 'left',
            }}
          >
            Buscar...
          </Typography>
          <Chip
            label="Ctrl+K"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.6875rem',
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)',
              color: theme.palette.text.secondary,
              border: 'none',
              '& .MuiChip-label': {
                px: 0.75,
              },
            }}
          />
        </Button>
        </Box>
      )}

      {/* Icono de búsqueda - Solo móviles (solo cuando no es horizontal) */}
      {!isHorizontal && (
        <Box sx={{ display: { xs: 'block', sm: 'none' }, marginLeft: 1 }}>
        <IconButton
          size="small"
          onClick={() => setSearchModalOpen(true)}
          sx={{
            bgcolor: 'transparent',
            borderRadius: 1,
            width: 36,
            height: 36,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <Search sx={{ fontSize: 24, color: '#637381' }} />
        </IconButton>
        </Box>
      )}

      {/* Elementos del lado derecho - Solo cuando NO es horizontal */}
      {!isHorizontal && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 'auto' }}>
        {/* Modo oscuro */}
        <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
          <IconButton 
            size="small"
            onClick={toggleTheme}
            sx={{ 
              bgcolor: 'transparent', 
              borderRadius: 1, 
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
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
        <Tooltip title="Notificaciones">
          <IconButton 
            ref={notificationButtonRef}
            size="small"
            onClick={handleNotificationMenu}
            sx={{ 
              bgcolor: 'transparent', 
              borderRadius: 1, 
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Badge 
              badgeContent={notificationCount > 0 ? notificationCount : undefined} 
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                },
              }}
            >
              <Notifications sx={{ fontSize: 24, color: '#637381' }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Icono de Configuración */}
        <Tooltip title="Configuración">
          <IconButton
            size="small"
            onClick={() => setSettingsDrawerOpen(true)}
            sx={{ 
              bgcolor: 'transparent', 
              borderRadius: 1, 
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
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

      {/* Menu dropdown de notificaciones (cuando se hace clic manualmente) */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl) && !notificationDialogOpen}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            mt: 1,
            minWidth: 300,
            maxWidth: 400,
            maxHeight: 400,
            boxShadow: theme.shadows[3],
            '& .MuiMenuItem-root': {
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            },
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No hay notificaciones próximas
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification, index) => (
            <MenuItem key={index} onClick={handleNotificationClose}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {notification.type === 'task' ? 'Tarea' : 'Evento'} • {new Date(notification.dueDate).toLocaleString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Dialog de notificaciones */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableAutoFocus={false}
        disableEnforceFocus={false}
        disableRestoreFocus={true}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Notifications sx={{ color: taxiMonterricoColors.green, fontSize: 24 }} />
          <Typography component="div" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Notificaciones
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                No hay notificaciones próximas
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNotificationDialogOpen(false);
                    }}
                    sx={{
                      py: 2,
                      px: 3,
                      cursor: notification.id ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: notification.id ? theme.palette.action.hover : 'transparent',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Typography component="div" variant="body2" sx={{ mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={notification.type === 'task' ? 'Tarea' : 'Evento'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: notification.type === 'task' ? taxiMonterricoColors.green : '#2196F3',
                                color: 'white',
                              }}
                            />
                            <Typography variant="caption" component="span" sx={{ color: theme.palette.text.secondary }}>
                              {new Date(notification.dueDate).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setNotificationDialogOpen(false)}
            variant="contained"
            sx={{
              bgcolor: taxiMonterricoColors.green,
              '&:hover': {
                bgcolor: taxiMonterricoColors.green,
                opacity: 0.9,
              },
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu dropdown del usuario */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            mt: 1,
            minWidth: 200,
            borderRadius: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `1px solid ${theme.palette.divider}`,
            '& .MuiMenuItem-root': {
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
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
        <Divider />
        <MenuItem 
          onClick={handleProfileClick}
          sx={{
            py: 1.5,
            px: 3,
            gap: 1.5,
            mt: 1,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <Person sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            Editar perfil
          </Typography>
        </MenuItem>
        <Divider />
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
            borderRadius: 2,
            mt: { xs: 8, sm: 0 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Search sx={{ color: taxiMonterricoColors.green }} />
          <Typography component="div" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Buscar
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {availablePages.map((page) => (
              <MenuItem
                key={page.path}
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
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  color: theme.palette.text.primary,
                  fontSize: '1.25rem',
                  lineHeight: 1,
                }}>
                  {page.icon}
                </Box>
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
                  }}
                >
                  Ir
                </Button>
              </MenuItem>
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

