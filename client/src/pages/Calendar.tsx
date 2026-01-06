import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  IconButton,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ViewModule,
  ViewList,
  Menu as MenuIcon,
  Close,
  Person,
  CalendarToday,
  Flag,
  DonutSmall,
} from '@mui/icons-material';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  getCalendarDays,
  isToday as isTodayUtil,
  getAllEventsForDay,
  truncateEventTitle,
} from '../utils/calendarUtils';

interface Task {
  id: number;
  title: string;
  type?: string;
  status: string;
  dueDate?: string;
  priority?: string;
}

const Calendar: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [allTasksWithDates, setAllTasksWithDates] = useState<Task[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Estados para Google Calendar
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  
  // Estados para el modal de detalles del evento
  const [eventModalOpen, setEventModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loadingEventDetails, setLoadingEventDetails] = useState(false);

  const fetchGoogleCalendarEvents = useCallback(async () => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem('token');
    if (!user || !token) {
      console.log('⚠️ Usuario no autenticado, omitiendo fetchGoogleCalendarEvents');
      setGoogleCalendarEvents([]);
      return;
    }

    if (!googleCalendarConnected) {
      setGoogleCalendarEvents([]);
      return;
    }

    try {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const response = await api.get('/google/events', {
        params: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
        },
      });

      setGoogleCalendarEvents(response.data.events || []);
    } catch (error: any) {
      console.error('Error obteniendo eventos de Google Calendar:', error);
      setGoogleCalendarEvents([]);
    }
  }, [googleCalendarConnected, calendarDate, user]);

  const checkGoogleCalendarConnection = useCallback(async () => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem('token');
    if (!user || !token) {
      console.log('⚠️ Usuario no autenticado, omitiendo checkGoogleCalendarConnection');
      setGoogleCalendarConnected(false);
      setGoogleCalendarEvents([]);
      return;
    }

    try {
      const response = await api.get('/google/token');
      const isConnected = response.data.hasToken && !response.data.isExpired;
      setGoogleCalendarConnected(isConnected);
      // NO llamar fetchGoogleCalendarEvents aquí, el otro useEffect lo hará cuando cambie googleCalendarConnected
    } catch (error: any) {
      if (error.response?.status === 404) {
        setGoogleCalendarConnected(false);
        setGoogleCalendarEvents([]);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        return;
      } else {
        console.error('Error verificando conexión de Google Calendar:', error);
        setGoogleCalendarConnected(false);
        setGoogleCalendarEvents([]);
      }
    }
  }, [user]);

  useEffect(() => {
    if (googleCalendarConnected) {
      fetchGoogleCalendarEvents();
    }
  }, [calendarDate, googleCalendarConnected, fetchGoogleCalendarEvents]);

  // Función combinada para obtener todas las actividades de una vez
  const fetchAllActivities = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      console.log('⚠️ Usuario no autenticado, omitiendo fetchAllActivities');
      setNotes([]);
      setMeetings([]);
      return [];
    }

    try {
      // Una sola llamada obteniendo todas las actividades sin filtrar por tipo
      const response = await api.get('/activities', {
        params: { limit: 1000 },
      });
      
      const allActivities = response.data.activities || response.data || [];
      
      // Separar por tipo en el frontend
      const notesData = allActivities.filter((a: any) => a.type === 'note');
      const meetingsData = allActivities.filter((a: any) => a.type === 'meeting');
      const taskActivities = allActivities.filter((a: any) => a.type === 'task');
      
      setNotes(notesData);
      setMeetings(meetingsData);
      
      return taskActivities; // Retornar actividades tipo task para usar en fetchAllTasksWithDates
    } catch (error: any) {
      console.error('Error obteniendo actividades:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      setNotes([]);
      setMeetings([]);
      return [];
    }
  }, [user]);

  const fetchAllTasksWithDates = useCallback(async (taskActivities: any[] = []) => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem('token');
    if (!user || !token) {
      console.log('⚠️ Usuario no autenticado, omitiendo fetchAllTasksWithDates');
      setAllTasksWithDates([]);
      return;
    }

    try {
      // Obtener tareas desde /tasks
      const tasksResponse = await api.get('/tasks?limit=1000');
      const tasksFromTasks = (tasksResponse.data.tasks || tasksResponse.data || []).map((task: Task) => ({
        ...task,
        isActivity: false,
      }));

      // Usar las actividades tipo task ya obtenidas de fetchAllActivities
      const tasksFromActivities = taskActivities.map((activity: any) => ({
        id: activity.id,
        title: activity.subject || activity.description || 'Sin título',
        type: activity.type,
        status: 'not started',
        priority: 'medium',
        dueDate: activity.dueDate,
        isActivity: true,
      }));

      const allTasks = [...tasksFromTasks, ...tasksFromActivities];
      const tasksWithDates = allTasks.filter((task: Task) => task.dueDate);
      setAllTasksWithDates(tasksWithDates);
    } catch (error: any) {
      console.error('Error fetching tasks with dates:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      setAllTasksWithDates([]);
    }
  }, [user]);

  useEffect(() => {
    // Solo hacer llamadas si el usuario está autenticado
    if (!user) return;
    
    // Primero obtener todas las actividades (que también actualiza notes y meetings)
    fetchAllActivities().then((taskActivities) => {
      // Luego obtener las tareas (que usa las actividades ya obtenidas)
      fetchAllTasksWithDates(taskActivities);
    });
    
    checkGoogleCalendarConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Solo depender de user, las funciones son estables y no necesitan estar en dependencias

  // Función para obtener detalles completos del evento
  const fetchEventDetails = useCallback(async (event: any) => {
    if (!event.id) return;
    
    setLoadingEventDetails(true);
    try {
      // Si es una nota o reunión de activities (tiene isNote o isMeeting explícito)
      if (event.isNote || (event.isMeeting && !event.type)) {
        // Para notas y reuniones, obtener desde activities
        const response = await api.get(`/activities/${event.id}`);
        setEventDetails(response.data);
      } else if (event.type === 'task' || event.type === 'meeting') {
        // Si es una tarea (incluyendo tareas de tipo meeting), obtener desde /tasks
        const response = await api.get(`/tasks/${event.id}`);
        setEventDetails(response.data);
      } else if (event.isGoogleEvent) {
        // Para eventos de Google Calendar, usar la información que ya tenemos
        setEventDetails(event);
      } else {
        // Por defecto, intentar obtener desde activities
        try {
          const response = await api.get(`/activities/${event.id}`);
          setEventDetails(response.data);
        } catch {
          // Si falla, usar la información básica del evento
          setEventDetails(event);
        }
      }
    } catch (error) {
      console.error('Error obteniendo detalles del evento:', error);
      setEventDetails(event); // Usar información básica si falla
    } finally {
      setLoadingEventDetails(false);
    }
  }, []);

  // Función para abrir el modal
  const handleEventClick = async (event: any) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
    await fetchEventDetails(event);
  };

  // Función para obtener el label de prioridad
  const getPriorityLabel = (priority?: string) => {
    const labels: { [key: string]: string } = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority || 'medium'] || 'Media';
  };

  // Función para obtener el color de prioridad
  const getPriorityColor = (priority?: string) => {
    const colors: { [key: string]: { bg: string; color: string } } = {
      low: { bg: '#D1FAE5', color: '#065F46' },
      medium: { bg: '#FEF3C7', color: '#92400E' },
      high: { bg: '#FEE2E2', color: '#991B1B' },
      urgent: { bg: '#FEE2E2', color: '#C62828' },
    };
    return colors[priority || 'medium'] || colors.medium;
  };

  // Función para obtener el label de estado
  const getStatusLabel = (status?: string) => {
    const labels: { [key: string]: string } = {
      'not started': 'No iniciada',
      'in progress': 'En progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
    };
    return labels[status || 'not started'] || 'No iniciada';
  };

  const modalMonth = calendarDate.getMonth();
  const modalYear = calendarDate.getFullYear();
  const calendarDays = getCalendarDays(modalYear, modalMonth);

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Card principal del calendario */}
      <Card
        sx={{
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : theme.palette.background.paper,
          borderRadius: 2,
          p: 0,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Barra superior dentro del Card */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: { xs: 2, sm: 2.5, md: 3 },
          pb: 2,
          px: { xs: 1.5, md: 2 },
          pt: { xs: 1.5, md: 2 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          {/* Iconos de vista (izquierda) */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              }}
            >
              <ViewModule fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <ViewList fontSize="small" />
            </IconButton>
          </Box>

          {/* Mes y año con navegación (centro) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton 
              size="small" 
              onClick={() => {
                const newDate = new Date(calendarDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCalendarDate(newDate);
                setSelectedDate(null);
              }}
              sx={{
                color: theme.palette.text.primary,
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 180, textAlign: 'center', fontWeight: 500 }}>
              {calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => {
                const newDate = new Date(calendarDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCalendarDate(newDate);
                setSelectedDate(null);
              }}
              sx={{
                color: theme.palette.text.primary,
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Botón Today y menú (derecha) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setCalendarDate(new Date());
                setSelectedDate(null);
              }}
              sx={{
                bgcolor: theme.palette.error.main,
                color: theme.palette.error.contrastText,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: theme.palette.error.dark,
                },
              }}
            >
              Today
            </Button>
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Días de la semana */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 0,
          mb: 0,
          px: { xs: 1.5, md: 2 },
          py: 0.5,
        }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Typography
                  key={day}
                  variant="caption"
                  sx={{ 
                    textAlign: 'center', 
                    fontWeight: 500, 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    py: 0.5,
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Días del calendario */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 0,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
              overflow: 'hidden',
            }}>
              {calendarDays.map((calendarDay, index) => {
                if (!calendarDay.day) {
                  return (
                    <Box 
                      key={index} 
                      sx={{ 
                        minHeight: 110,
                        borderRight: `1px solid ${theme.palette.divider}`,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }} 
                    />
                  );
                }

                const allDayEvents = getAllEventsForDay(
                  calendarDay.day,
                  modalYear,
                  modalMonth,
                  allTasksWithDates,
                  googleCalendarEvents,
                  notes,
                  meetings
                );
                
                const dayIsToday = isTodayUtil(calendarDay.date);

                // Limitar eventos visibles (mostrar máximo 3)
                const maxVisibleEvents = 3;
                const visibleEvents = allDayEvents.slice(0, maxVisibleEvents);
                const remainingEvents = allDayEvents.length - maxVisibleEvents;

                return (
                  <Box
                    key={index}
                    onClick={() => {
                      if (calendarDay.isCurrentMonth) {
                        setSelectedDate(calendarDay.date);
                      }
                    }}
                    sx={{
                      minHeight: 110,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      borderRadius: 0,
                      p: 0.75,
                      bgcolor: calendarDay.isCurrentMonth
                        ? theme.palette.background.paper
                        : (theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(0, 0, 0, 0.02)'),
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: calendarDay.isCurrentMonth ? 'pointer' : 'default',
                      position: 'relative',
                    }}
                  >
                    {/* Número del día */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      mb: 0.5,
                    }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: dayIsToday ? 700 : 500,
                          fontSize: '0.875rem',
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: dayIsToday ? 24 : 'auto',
                          height: dayIsToday ? 24 : 'auto',
                          borderRadius: dayIsToday ? '50%' : 0,
                          bgcolor: dayIsToday ? theme.palette.error.main : 'transparent',
                          color: dayIsToday 
                            ? theme.palette.error.contrastText 
                            : (calendarDay.isCurrentMonth
                              ? theme.palette.text.primary
                              : theme.palette.text.disabled),
                        }}
                      >
                        {calendarDay.day}
                      </Typography>
                    </Box>

                    {/* Eventos */}
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      flex: 1,
                      overflow: 'hidden',
                    }}>
                      {visibleEvents.map((event, eventIndex) => (
                        <Box
                          key={event.id || eventIndex}
                          sx={{
                            bgcolor: event.color,
                            color: '#fff',
                            borderRadius: 0.5,
                            px: 0.75,
                            py: 0.25,
                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.9,
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          {event.time && (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                mr: 0.5,
                              }}
                            >
                              {event.time}
                            </Typography>
                          )}
                          <Typography
                            component="span"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 400,
                            }}
                          >
                            {truncateEventTitle(event.title, 20)}
                          </Typography>
                        </Box>
                      ))}

                      {/* "+X more" si hay más eventos */}
                      {remainingEvents > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              color: theme.palette.primary.main,
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(calendarDay.date);
                          }}
                        >
                          +{remainingEvents} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Card>

      {/* Modal de detalles del evento */}
      <Dialog
        open={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
          setEventDetails(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            pt: 3,
            px: 3,
            mb: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {eventDetails?.isNote ? 'Nota' : 
             eventDetails?.isMeeting || eventDetails?.type === 'meeting' ? 'Reunión' : 
             eventDetails?.type === 'task' ? 'Tarea' : 
             eventDetails?.isGoogleEvent ? 'Evento de Google Calendar' : 
             'Evento'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setEventModalOpen(false);
              setSelectedEvent(null);
              setEventDetails(null);
            }}
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 4, px: 3, pb: 2, '&.MuiDialogContent-root': { pt: 4 } }}>
          {loadingEventDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : eventDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0 }}>
              {/* Título */}
              <TextField
                label="Título"
                value={eventDetails.title || eventDetails.subject || 'Sin título'}
                fullWidth
                disabled
                variant="outlined"
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 500,
                  },
                }}
              />

              {/* Descripción */}
              <TextField
                label="Descripción"
                value={eventDetails.description || 'Sin descripción'}
                fullWidth
                multiline
                rows={4}
                disabled
                variant="outlined"
              />

              {/* Fecha de vencimiento */}
              {eventDetails.dueDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Fecha de vencimiento: {new Date(eventDetails.dueDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              )}

              {/* Prioridad y Estado */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {eventDetails.priority && (
                  <Chip
                    icon={<Flag sx={{ fontSize: 16 }} />}
                    label={getPriorityLabel(eventDetails.priority)}
                    size="small"
                    sx={{
                      bgcolor: getPriorityColor(eventDetails.priority).bg,
                      color: getPriorityColor(eventDetails.priority).color,
                      fontWeight: 500,
                    }}
                  />
                )}
                {eventDetails.status && (
                  <Chip
                    icon={<DonutSmall sx={{ fontSize: 16 }} />}
                    label={getStatusLabel(eventDetails.status)}
                    size="small"
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : '#F3F4F6',
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>

              {/* Asignado a */}
              {eventDetails.AssignedTo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Asignado a: {eventDetails.AssignedTo.firstName} {eventDetails.AssignedTo.lastName}
                  </Typography>
                </Box>
              )}

              {/* Fecha de creación */}
              {eventDetails.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Fecha de creación: {new Date(eventDetails.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              )}

              {/* Ubicación (para eventos de Google Calendar) */}
              {eventDetails.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    📍 {eventDetails.location}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setEventModalOpen(false);
              setSelectedEvent(null);
              setEventDetails(null);
            }}
            variant="outlined"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;


