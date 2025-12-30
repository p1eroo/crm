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
  KeyboardArrowDown,
  Notifications,
  Alarm,
  Person,
  Business,
  AttachMoney,
  Assignment,
  DarkMode,
  LightMode,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { taxiMonterricoColors } from '../../theme/colors';
import ProfileModal from '../ProfileModal';
import CreateMenuButton from '../CreateMenuButton';
import api from '../../config/api';
import { useTheme as useThemeContext } from '../../context/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reminderAnchorEl, setReminderAnchorEl] = useState<null | HTMLElement>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);
  const searchInputRef = useRef<HTMLElement>(null);
  const searchInputElementRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [reminderCount, setReminderCount] = useState(0);
  const reminderButtonRef = useRef<HTMLButtonElement>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreateItem = (type: string) => {
    switch (type) {
      case 'contact':
        navigate('/contacts');
        break;
      case 'company':
        navigate('/companies');
        break;
      case 'deal':
      case 'opportunity':
        navigate('/deals');
        break;
      case 'task':
        navigate('/tasks');
        break;
      case 'ticket':
        navigate('/tickets');
        break;
      case 'note':
        // Para notas, podrías navegar a una página específica o abrir un modal
        // Por ahora, navegamos a contacts donde se pueden crear notas
        navigate('/contacts');
        break;
      case 'contract':
        // Para contratos/suscripciones, podrías navegar a companies o crear una nueva página
        navigate('/companies');
        break;
      case 'invoice':
        // Para facturas, podrías crear una nueva página o navegar a deals
        navigate('/deals');
        break;
      case 'payment':
        // Para pagos, podrías crear una nueva página o navegar a deals
        navigate('/deals');
        break;
      case 'incident':
        // Para incidencias, podrías navegar a tickets
        navigate('/tickets');
        break;
      default:
        break;
    }
  };

  const handleReminderMenu = (event: React.MouseEvent<HTMLElement>) => {
    setReminderAnchorEl(event.currentTarget);
  };

  const handleReminderClose = () => {
    setReminderAnchorEl(null);
  };

  const handleProfileClick = () => {
    setProfileModalOpen(true);
    handleClose();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const theme = useTheme();

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

  // Obtener recordatorios de tareas y eventos
  useEffect(() => {
    const fetchReminders = async (autoOpen: boolean = false) => {
      // Verificar autenticación antes de hacer requests
      const token = localStorage.getItem('token');
      if (!user || !token) {
        console.log('⚠️ Usuario no autenticado, omitiendo fetchReminders');
        return;
      }

      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Inicio del día actual
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7); // 7 días desde hoy
        
        // Obtener tareas con fecha de vencimiento próxima
        const tasksResponse = await api.get('/tasks', {
          params: { limit: 100 },
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
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
          })),
          ...upcomingEvents.map((event: any) => ({
            type: 'event',
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

        setReminders(allReminders);
        setReminderCount(allReminders.length);

        // Abrir el diálogo automáticamente si hay recordatorios y autoOpen es true
        if (autoOpen && allReminders.length > 0) {
          setReminderDialogOpen(true);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
        setReminders([]);
        setReminderCount(0);
      }
    };

    // Cargar recordatorios inicialmente
    fetchReminders(false);
    
    // Actualizar cada 5 minutos y abrir automáticamente si hay recordatorios
    const interval = setInterval(() => {
      fetchReminders(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'theme.palette.background.paper',
        px: 3,
        pt: 2,
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Barra de búsqueda */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          maxWidth: 'calc(100% - 350px)',
        }}
      >
        <Box
          ref={searchInputRef}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
            px: 1.5,
            py: 0.75,
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
              fontSize: 16, 
              color: theme.palette.text.secondary,
              mr: 1,
            }} 
          />
          <InputBase
            id="global-search-input"
            name="global-search"
            placeholder="Buscar contactos, empresas, negocios..."
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
              fontSize: '0.8125rem',
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

      {/* Elementos del lado derecho */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {/* Botón Crear con menú desplegable */}
        <CreateMenuButton onSelect={handleCreateItem} />

        <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 0.25, height: 32, alignSelf: 'center' }} />

        {/* Modo oscuro */}
        <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
          <IconButton 
            size="medium"
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
              <DarkMode sx={{ fontSize: 22, color: theme.palette.text.secondary }} />
            ) : (
              <LightMode sx={{ fontSize: 22, color: theme.palette.text.secondary }} />
            )}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 32, alignSelf: 'center' }} />

        {/* Recordatorios */}
        <Tooltip title="Recordatorios">
          <IconButton 
            ref={reminderButtonRef}
            size="medium"
            onClick={handleReminderMenu}
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
              badgeContent={reminderCount > 0 ? reminderCount : undefined} 
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
              <Alarm sx={{ fontSize: 22, color: theme.palette.text.secondary }} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 32, alignSelf: 'center' }} />

        {/* Notificaciones */}
        <IconButton 
          size="medium"
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
            badgeContent={3} 
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
            <Notifications sx={{ fontSize: 22, color: theme.palette.text.secondary }} />
          </Badge>
        </IconButton>

        <Divider orientation="vertical" flexItem sx={{ ml: 0.25, mr: 1, height: 32, alignSelf: 'center' }} />

        {/* Avatar con dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleMenu}>
          <Avatar
            src={user?.avatar}
            sx={{
              width: 36,
              height: 36,
              bgcolor: user?.avatar ? 'transparent' : taxiMonterricoColors.green,
              fontSize: '0.75rem',
              fontWeight: 600,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {!user?.avatar && getInitials(user?.firstName, user?.lastName)}
          </Avatar>
          <KeyboardArrowDown sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
        </Box>
      </Box>

      {/* Menu dropdown de recordatorios (cuando se hace clic manualmente) */}
      <Menu
        anchorEl={reminderAnchorEl}
        open={Boolean(reminderAnchorEl) && !reminderDialogOpen}
        onClose={handleReminderClose}
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
        {reminders.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No hay recordatorios próximos
            </Typography>
          </MenuItem>
        ) : (
          reminders.map((reminder, index) => (
            <MenuItem key={index} onClick={handleReminderClose}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {reminder.title}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {reminder.type === 'task' ? 'Tarea' : 'Evento'} • {new Date(reminder.dueDate).toLocaleString('es-ES', {
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

      {/* Dialog de recordatorios (cuando se abre automáticamente) */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Alarm sx={{ color: taxiMonterricoColors.green, fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recordatorios
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {reminders.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                No hay recordatorios próximos
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {reminders.map((reminder, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {reminder.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={reminder.type === 'task' ? 'Tarea' : 'Evento'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: reminder.type === 'task' ? taxiMonterricoColors.green : '#2196F3',
                              color: 'white',
                            }}
                          />
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {new Date(reminder.dueDate).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < reminders.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setReminderDialogOpen(false)}
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

      <ProfileModal 
        open={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)}
        onSuccess={(message) => setSuccessMessage(message)}
      />
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
    </Box>
  );
};

export default Header;

