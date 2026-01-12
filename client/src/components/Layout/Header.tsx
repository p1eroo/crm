import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  InputBase,
  IconButton,
  Badge,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider,
  CircularProgress,
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
  Business,
  AttachMoney,
  Assignment,
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

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext();
  const { open: sidebarOpen, toggleSidebar, toggleCollapsed, collapsed } = useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Calcular el ancho del drawer igual que en MainLayout
  const drawerWidth = collapsed 
    ? (isMobile ? 0 : 85) 
    : 270;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);
  const searchInputRef = useRef<HTMLElement>(null);
  const searchInputElementRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Búsqueda global
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchValue.trim().length === 0) {
      setSearchResults(null);
      setSearchAnchorEl(null);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/search/global', {
          params: { q: searchValue, limit: 5 },
        });
        setSearchResults(response.data);
        if (searchInputRef.current) {
          setSearchAnchorEl(searchInputRef.current);
        }
        // Mantener el foco en el input después de recibir resultados
        setTimeout(() => {
          if (searchInputElementRef.current) {
            searchInputElementRef.current.focus();
          }
        }, 0);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue]);

  // Mantener el foco en el input cuando el menú está abierto
  useEffect(() => {
    if (searchAnchorEl && searchResults && searchInputElementRef.current) {
      // Usar requestAnimationFrame para asegurar que el foco se establezca después de que el menú se renderice
      requestAnimationFrame(() => {
        if (searchInputElementRef.current) {
          searchInputElementRef.current.focus();
        }
      });
    }
  }, [searchAnchorEl, searchResults]);

  const handleSearchResultClick = (url: string) => {
    setSearchValue('');
    setSearchResults(null);
    setSearchAnchorEl(null);
    navigate(url);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
  };

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
        pt: { xs: 1, sm: 1.25 },
        pb: { xs: 1, sm: 1.25 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0,
        height: { xs: 60, sm: 72 },
        position: { xs: 'fixed', sm: 'sticky' },
        top: 0,
        left: { 
          xs: 0,
          sm: 0 // El contenedor en MainLayout ya maneja el posicionamiento
        },
        zIndex: { xs: 1400, sm: 1300 },
        marginLeft: 0,
        marginRight: 0,
        borderBottom: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
        transition: 'all 0.3s ease', // Transición suave para todos los cambios
      }}
    >
      {/* Botón de menú - Solo visible en móviles */}
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
      
      {/* Barra de búsqueda - Desktop */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          maxWidth: sidebarOpen ? '350px' : '350px',
          marginLeft: 4,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <Box
          ref={searchInputRef}
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
            '&:focus-within': {
              bgcolor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 2px 8px rgba(0,0,0,0.3)' 
                : '0 2px 4px rgba(0,0,0,0.1)',
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
          <InputBase
            id="global-search-input"
            name="global-search"
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            onKeyDown={(e) => {
              // Prevenir que el menú capture las teclas
              e.stopPropagation();
              // Mantener el foco en el input
              if (searchInputElementRef.current) {
                searchInputElementRef.current.focus();
              }
            }}
            onFocus={(e) => {
              // Asegurar que el input mantiene el foco
              e.target.focus();
            }}
            inputRef={searchInputElementRef}
            autoFocus={false}
            sx={{
              flex: 1,
              fontSize: '0.875rem',
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1,
              },
            }}
          />
          {searchLoading && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
        </Box>

        {/* Menú de resultados de búsqueda */}
        <Menu
          anchorEl={searchAnchorEl}
          open={Boolean(searchAnchorEl && searchResults)}
          onClose={handleSearchClose}
          disableAutoFocus
          disableEnforceFocus
          disableAutoFocusItem
          disableRestoreFocus
          MenuListProps={{
            disablePadding: true,
            onKeyDown: (e) => {
              // Si es una tecla de escritura normal, prevenir que el menú la capture
              // y mantener el foco en el input
              if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
                if (searchInputElementRef.current) {
                  searchInputElementRef.current.focus();
                }
                return;
              }
              // Para otras teclas (Enter, Escape, ArrowUp, ArrowDown), permitir el comportamiento normal
            },
          }}
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              mt: 1,
              minWidth: 400,
              maxWidth: 500,
              maxHeight: 500,
              boxShadow: theme.shadows[3],
              borderRadius: 1.5,
              overflow: 'hidden',
            },
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {searchResults?.contacts && searchResults.contacts.length > 0 && (
            <Box>
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Contactos
                    </Typography>
                  </Box>
                  {searchResults.contacts.map((result: any) => (
                    <MenuItem
                      key={`contact-${result.id}`}
                      onClick={() => handleSearchResultClick(result.url)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Person sx={{ fontSize: 20, color: theme.palette.primary.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
            </Box>
              )}

          {searchResults?.companies && searchResults.companies.length > 0 && (
            <Box>
                  {(searchResults.contacts?.length > 0) && <Divider />}
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Empresas
                    </Typography>
                  </Box>
                  {searchResults.companies.map((result: any) => (
                    <MenuItem
                      key={`company-${result.id}`}
                      onClick={() => handleSearchResultClick(result.url)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Business sx={{ fontSize: 20, color: theme.palette.info.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
            </Box>
              )}

          {searchResults?.deals && searchResults.deals.length > 0 && (
            <Box>
                  {((searchResults.contacts?.length > 0) || (searchResults.companies?.length > 0)) && <Divider />}
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Negocios
                    </Typography>
                  </Box>
                  {searchResults.deals.map((result: any) => (
                    <MenuItem
                      key={`deal-${result.id}`}
                      onClick={() => handleSearchResultClick(result.url)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <AttachMoney sx={{ fontSize: 20, color: theme.palette.success.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle} {result.amount && `• ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(result.amount)}`}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
            </Box>
              )}

          {searchResults?.tasks && searchResults.tasks.length > 0 && (
            <Box>
                  {((searchResults.contacts?.length > 0) || (searchResults.companies?.length > 0) || (searchResults.deals?.length > 0)) && <Divider />}
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Tareas
                    </Typography>
                  </Box>
                  {searchResults.tasks.map((result: any) => (
                    <MenuItem
                      key={`task-${result.id}`}
                      onClick={() => handleSearchResultClick(result.url)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Assignment sx={{ fontSize: 20, color: theme.palette.warning.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
            </Box>
              )}

          {(!searchResults?.contacts || searchResults.contacts.length === 0) &&
           (!searchResults?.companies || searchResults.companies.length === 0) &&
           (!searchResults?.deals || searchResults.deals.length === 0) &&
           (!searchResults?.tasks || searchResults.tasks.length === 0) && (
                <MenuItem disabled>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    No se encontraron resultados
                  </Typography>
                </MenuItem>
          )}
        </Menu>
      </Box>

      {/* Icono de búsqueda - Solo móviles */}
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

      {/* Elementos del lado derecho */}
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
          <Avatar
            src={user?.avatar}
            sx={{
              width: 40,
              height: 40,
              bgcolor: user?.avatar ? 'transparent' : taxiMonterricoColors.green,
              fontSize: '0.875rem',
              fontWeight: 600,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {!user?.avatar && getInitials(user?.firstName, user?.lastName)}
          </Avatar>
        </Box>
      </Box>

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
            <Avatar
              src={user?.avatar}
              sx={{
                width: 48,
                height: 48,
                bgcolor: taxiMonterricoColors.green,
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
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
          <Box
            ref={searchInputRef}
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
              '&:focus-within': {
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 2px 8px rgba(0,0,0,0.3)' 
                  : '0 2px 4px rgba(0,0,0,0.1)',
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
            <InputBase
              id="mobile-search-input"
              name="mobile-search"
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              inputRef={searchInputElementRef}
              autoFocus
              sx={{
                flex: 1,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                },
              }}
            />
            {searchLoading && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}
          </Box>
          {/* Mostrar resultados de búsqueda en el modal */}
          {searchResults && (
            <Box sx={{ mt: 2, maxHeight: '60vh', overflowY: 'auto' }}>
              {searchResults?.contacts && searchResults.contacts.length > 0 && (
                <Box>
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Contactos
                    </Typography>
                  </Box>
                  {searchResults.contacts.map((result: any) => (
                    <MenuItem
                      key={`contact-${result.id}`}
                      onClick={() => {
                        handleSearchResultClick(result.url);
                        setSearchModalOpen(false);
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Person sx={{ fontSize: 20, color: theme.palette.primary.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              )}

              {searchResults?.companies && searchResults.companies.length > 0 && (
                <Box>
                  {(searchResults.contacts?.length > 0) && <Divider />}
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Empresas
                    </Typography>
                  </Box>
                  {searchResults.companies.map((result: any) => (
                    <MenuItem
                      key={`company-${result.id}`}
                      onClick={() => {
                        handleSearchResultClick(result.url);
                        setSearchModalOpen(false);
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Business sx={{ fontSize: 20, color: theme.palette.info.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              )}

              {searchResults?.deals && searchResults.deals.length > 0 && (
                <Box>
                  {((searchResults.contacts?.length > 0) || (searchResults.companies?.length > 0)) && <Divider />}
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Negocios
                    </Typography>
                  </Box>
                  {searchResults.deals.map((result: any) => (
                    <MenuItem
                      key={`deal-${result.id}`}
                      onClick={() => {
                        handleSearchResultClick(result.url);
                        setSearchModalOpen(false);
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <AttachMoney sx={{ fontSize: 20, color: theme.palette.success.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle} {result.amount && `• ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(result.amount)}`}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              )}

              {searchResults?.tasks && searchResults.tasks.length > 0 && (
                <Box>
                  {((searchResults.contacts?.length > 0) || (searchResults.companies?.length > 0) || (searchResults.deals?.length > 0)) && <Divider />}
                  <Box sx={{ px: 2, py: 1, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                      Tareas
                    </Typography>
                  </Box>
                  {searchResults.tasks.map((result: any) => (
                    <MenuItem
                      key={`task-${result.id}`}
                      onClick={() => {
                        handleSearchResultClick(result.url);
                        setSearchModalOpen(false);
                      }}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Assignment sx={{ fontSize: 20, color: theme.palette.warning.main, mr: 1.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.subtitle}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              )}

              {(!searchResults?.contacts || searchResults.contacts.length === 0) &&
               (!searchResults?.companies || searchResults.companies.length === 0) &&
               (!searchResults?.deals || searchResults.deals.length === 0) &&
               (!searchResults?.tasks || searchResults.tasks.length === 0) && (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        No se encontraron resultados
                      </Typography>
                    </Box>
              )}
            </Box>
          )}
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

