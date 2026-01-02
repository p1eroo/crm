import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CheckCircle,
} from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { useAuth } from '../context/AuthContext';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Estados para Google Calendar
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

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
      
      if (isConnected) {
        await fetchGoogleCalendarEvents();
      }
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
  }, [fetchGoogleCalendarEvents, user]);

  useEffect(() => {
    if (googleCalendarConnected) {
      fetchGoogleCalendarEvents();
    }
  }, [calendarDate, googleCalendarConnected, fetchGoogleCalendarEvents]);

  const fetchAllTasksWithDates = useCallback(async () => {
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

      // Obtener actividades de tipo 'task' desde /activities
      try {
        const activitiesResponse = await api.get('/activities', {
          params: { type: 'task' },
        });
        const tasksFromActivities = (activitiesResponse.data.activities || activitiesResponse.data || []).map((activity: any) => ({
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
      } catch (activitiesError) {
        const tasksWithDates = tasksFromTasks.filter((task: Task) => task.dueDate);
        setAllTasksWithDates(tasksWithDates);
      }
    } catch (error: any) {
      console.error('Error fetching tasks with dates:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      setAllTasksWithDates([]);
    }
  }, [user]);

  const fetchNotes = useCallback(async () => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem('token');
    if (!user || !token) {
      console.log('⚠️ Usuario no autenticado, omitiendo fetchNotes');
      setNotes([]);
      return;
    }

    try {
      const response = await api.get('/activities', {
        params: { type: 'note', limit: 1000 },
      });
      const notesData = response.data.activities || response.data || [];
      setNotes(notesData);
    } catch (error: any) {
      console.error('Error obteniendo notas:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      setNotes([]);
    }
  }, [user]);

  useEffect(() => {
    // Solo hacer llamadas si el usuario está autenticado
    if (user) {
      fetchAllTasksWithDates();
      fetchNotes();
      checkGoogleCalendarConnection();
    }
  }, [checkGoogleCalendarConnection, user, fetchAllTasksWithDates, fetchNotes]);

  const getEventDate = (event: any): Date => {
    if (event.start.dateTime) {
      const dateTime = new Date(event.start.dateTime);
      const year = dateTime.getUTCFullYear();
      const month = dateTime.getUTCMonth();
      const day = dateTime.getUTCDate();
      return new Date(year, month, day);
    } else if (event.start.date) {
      const dateStr = event.start.date;
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'todo': 'Tarea',
      'call': 'Llamada',
      'email': 'Email',
      'meeting': 'Reunión',
      'note': 'Nota',
    };
    return labels[type] || type;
  };

  const modalMonth = calendarDate.getMonth();
  const modalYear = calendarDate.getFullYear();
  const firstDay = new Date(modalYear, modalMonth, 1);
  const lastDay = new Date(modalYear, modalMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  const modalCalendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    modalCalendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    modalCalendarDays.push(i);
  }

  const getTasksForDay = (day: number) => {
    const dateStr = `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allTasksWithDates.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      return taskDateStr === dateStr;
    });
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return googleCalendarEvents.filter((event) => {
      if (!event.start) return false;
      const eventDate = getEventDate(event);
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventDateStr === dateStr;
    });
  };

  const getNotesForDay = (day: number) => {
    const dateStr = `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return notes.filter((note) => {
      if (!note.createdAt) return false;
      const noteDate = new Date(note.createdAt);
      const noteDateStr = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}-${String(noteDate.getDate()).padStart(2, '0')}`;
      return noteDateStr === dateStr;
    });
  };

  const selectedDayTasks = selectedDate ? (() => {
    const selectedDay = selectedDate.getDate();
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    if (selectedMonth === modalMonth && selectedYear === modalYear) {
      const tasks = getTasksForDay(selectedDay);
      const events = getEventsForDay(selectedDay);
      const dayNotes = getNotesForDay(selectedDay);
      return [
        ...tasks,
        ...events.map(event => {
          const eventDate = getEventDate(event);
          return {
            id: event.id,
            title: event.summary || 'Sin título',
            dueDate: event.start.dateTime || event.start.date,
            eventDate: eventDate,
            isGoogleEvent: true,
            description: event.description,
            location: event.location,
          };
        }),
        ...dayNotes.map(note => ({
          id: note.id,
          title: note.subject || note.description || 'Sin título',
          description: note.description,
          createdAt: note.createdAt,
          isNote: true,
          User: note.User,
        }))
      ];
    }
    return [];
  })() : [];

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: { xs: 2, sm: 2.5, md: 3 },
      }}>
        <Typography variant="h4" sx={pageStyles.pageTitle}>
          Calendario
        </Typography>
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
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="body1" sx={{ minWidth: 150, textAlign: 'center', fontWeight: 500 }}>
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
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
        {/* Columna izquierda: Calendario */}
        <Box sx={{ flex: 1 }}>
          {/* Días de la semana */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <Typography
                key={index}
                variant="caption"
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                  py: 1,
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>
          {/* Días del mes */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {modalCalendarDays.map((day: number | null, index: number) => {
              if (!day) {
                return <Box key={index} />;
              }

              const dayTasks = getTasksForDay(day);
              const dayEvents = getEventsForDay(day);
              const dayNotes = getNotesForDay(day);
              const hasTasks = dayTasks.length > 0;
              const hasEvents = dayEvents.length > 0;
              const hasNotes = dayNotes.length > 0;
              
              const taskColor = hasTasks ? '#F97316' : null;
              const eventColor = hasEvents ? '#1976d2' : null;
              const noteColor = hasNotes ? '#10B981' : null;
              
              const today = new Date();
              const isToday = day === today.getDate() && 
                             modalMonth === today.getMonth() && 
                             modalYear === today.getFullYear();
              
              const isSelected = selectedDate && 
                                day === selectedDate.getDate() && 
                                modalMonth === selectedDate.getMonth() && 
                                modalYear === selectedDate.getFullYear();

              return (
                <Box
                  key={index}
                  onClick={() => {
                    const clickedDate = new Date(modalYear, modalMonth, day);
                    setSelectedDate(clickedDate);
                  }}
                  sx={{
                    minHeight: 80,
                    border: isSelected ? `2px solid ${taxiMonterricoColors.orange}` : `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 1,
                    bgcolor: isSelected 
                      ? `${taxiMonterricoColors.orangeLight}30` 
                      : (isToday 
                        ? theme.palette.mode === 'dark' 
                          ? `${taxiMonterricoColors.orange}20` 
                          : '#F0F9FF' 
                        : theme.palette.background.paper),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: isSelected 
                        ? `${taxiMonterricoColors.orangeLight}50` 
                        : (isToday 
                          ? theme.palette.mode === 'dark' 
                            ? `${taxiMonterricoColors.orange}30` 
                            : '#E0F2FE' 
                          : theme.palette.action.hover),
                      borderColor: isSelected ? taxiMonterricoColors.orangeDark : theme.palette.divider,
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isSelected || isToday ? 700 : 500,
                      color: isSelected 
                        ? taxiMonterricoColors.orangeDark 
                        : (isToday 
                          ? theme.palette.mode === 'dark' 
                            ? taxiMonterricoColors.orange 
                            : '#0284C7' 
                          : theme.palette.text.primary),
                      fontSize: '0.875rem',
                      mb: 0.5,
                    }}
                  >
                    {day}
                  </Typography>
                  {(taskColor || eventColor || noteColor) && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 'auto',
                      }}
                    >
                      {taskColor && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: taskColor,
                          }}
                        />
                      )}
                      {eventColor && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: eventColor,
                          }}
                        />
                      )}
                      {noteColor && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: noteColor,
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Columna derecha: Listado de tareas del día seleccionado */}
        <Box sx={{ 
          width: 320, 
          borderLeft: '1px solid #E5E7EB',
          pl: 3,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '60vh',
          overflow: 'hidden',
          pt: 0.5,
          pb: 0.5,
        }}>
          {selectedDate ? (
            <>
              {selectedDayTasks.length > 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  overflowY: 'auto',
                  pr: 1,
                  pt: 0.5,
                  pb: 0.5,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#F3F4F6',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#D1D5DB',
                    borderRadius: '3px',
                    '&:hover': {
                      background: '#9CA3AF',
                    },
                  },
                }}>
                  {selectedDayTasks.map((item: any) => (
                    <Card
                      key={item.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${item.isGoogleEvent 
                          ? (theme.palette.mode === 'dark' ? '#4285F4' : '#1a73e8')
                          : item.isNote
                          ? (theme.palette.mode === 'dark' ? '#10B981' : '#059669')
                          : (theme.palette.mode === 'dark' ? taxiMonterricoColors.green : taxiMonterricoColors.green)}`,
                        bgcolor: item.isGoogleEvent 
                          ? (theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.15)' : 'rgba(26, 115, 232, 0.1)')
                          : item.isNote
                          ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)')
                          : (theme.palette.mode === 'dark' 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : `${taxiMonterricoColors.greenLight}20`),
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0,0,0,0.4)' 
                            : 2,
                          transform: 'translateY(-2px)',
                          bgcolor: item.isGoogleEvent
                            ? (theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.25)' : 'rgba(26, 115, 232, 0.15)')
                            : item.isNote
                            ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(5, 150, 105, 0.15)')
                            : (theme.palette.mode === 'dark' 
                              ? 'rgba(16, 185, 129, 0.25)' 
                              : `${taxiMonterricoColors.greenLight}30`),
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {item.isGoogleEvent && (
                              <Cloud sx={{ fontSize: '1rem', color: '#4285F4' }} />
                            )}
                            {item.isNote && (
                              <CheckCircle sx={{ fontSize: '1rem', color: '#10B981' }} />
                            )}
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: item.isGoogleEvent
                                  ? (theme.palette.mode === 'dark' ? '#93C5FD' : '#1a73e8')
                                  : item.isNote
                                  ? (theme.palette.mode === 'dark' ? '#10B981' : '#059669')
                                  : (theme.palette.mode === 'dark' 
                                    ? taxiMonterricoColors.green 
                                    : taxiMonterricoColors.greenDark),
                                fontSize: '0.9375rem',
                              }}
                            >
                              {item.title}
                            </Typography>
                          </Box>
                          {item.isGoogleEvent && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                              {item.description && (
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                  {item.description}
                                </Typography>
                              )}
                              {item.location && (
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                  📍 {item.location}
                                </Typography>
                              )}
                            </Box>
                          )}
                          {item.isNote && item.description && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', mt: 1, display: 'block' }}>
                              {item.description}
                            </Typography>
                          )}
                          {item.isNote && item.User && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                              Creada por: {item.User.firstName} {item.User.lastName}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {!item.isGoogleEvent && item.type && (
                              <Chip
                                label={getTaskTypeLabel(item.type)}
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 22,
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : '#F3F4F6',
                                  color: theme.palette.mode === 'dark' 
                                    ? theme.palette.text.secondary 
                                    : '#6B7280',
                                }}
                              />
                            )}
                            {!item.isGoogleEvent && item.priority && (
                              <Chip
                                label={item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 22,
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? (item.priority === 'high' 
                                      ? 'rgba(239, 68, 68, 0.2)' 
                                      : item.priority === 'medium' 
                                      ? 'rgba(251, 191, 36, 0.2)' 
                                      : 'rgba(16, 185, 129, 0.2)')
                                    : (item.priority === 'high' 
                                      ? '#FEE2E2' 
                                      : item.priority === 'medium' 
                                      ? '#FEF3C7' 
                                      : '#D1FAE5'),
                                  color: theme.palette.mode === 'dark' 
                                    ? (item.priority === 'high' 
                                      ? '#FCA5A5' 
                                      : item.priority === 'medium' 
                                      ? '#FCD34D' 
                                      : '#6EE7B7')
                                    : (item.priority === 'high' 
                                      ? '#991B1B' 
                                      : item.priority === 'medium' 
                                      ? '#92400E' 
                                      : '#065F46'),
                                }}
                              />
                            )}
                            {item.dueDate && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.text.secondary, 
                                  fontSize: '0.75rem', 
                                  alignSelf: 'center' 
                                }}
                              >
                                {new Date(item.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 6,
                  textAlign: 'center',
                }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    No hay tareas o eventos programados para este día
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 6,
              textAlign: 'center',
            }}>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                Selecciona una fecha para ver las tareas
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Calendar;


