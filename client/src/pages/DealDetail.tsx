import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Card,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Popover,
} from '@mui/material';
import {
  Note,
  Email,
  Phone,
  AttachMoney,
  Person,
  Business,
  CalendarToday,
  TrendingUp,
  Assignment,
  MoreVert,
  Close,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import negocioLogo from '../assets/negocio.png';

interface DealDetail {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  priority?: 'baja' | 'media' | 'alta';
  description?: string;
  Contact?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  Company?: {
    id: number;
    name: string;
    domain?: string;
    phone?: string;
  };
  Owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState('');
  const [priorityAnchorEl, setPriorityAnchorEl] = useState<null | HTMLElement>(null);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchActivities();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      const response = await api.get(`/deals/${id}`);
      setDeal(response.data);
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities', {
        params: { dealId: id },
      });
      const activitiesData = response.data.activities || response.data || [];
      
      // Obtener tareas asociadas
      const tasksResponse = await api.get('/tasks', {
        params: { dealId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];
      
      const tasksAsActivities = tasksData.map((task: any) => ({
        id: task.id,
        type: 'task',
        subject: task.title,
        description: task.description,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        User: task.CreatedBy || task.AssignedTo,
        isTask: true,
        status: task.status,
        priority: task.priority,
      }));
      
      const allActivities = [...activitiesData, ...tasksAsActivities].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return dateB - dateA;
      });
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (deal?.name) {
      const words = deal.name.trim().split(' ');
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      }
      return deal.name.substring(0, 2).toUpperCase();
    }
    return '--';
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'lead': '#EF4444',
      'contacto': '#F59E0B',
      'reunion_agendada': '#F59E0B',
      'reunion_efectiva': '#F59E0B',
      'propuesta_economica': '#3B82F6',
      'negociacion': '#10B981',
      'licitacion': '#10B981',
      'licitacion_etapa_final': '#10B981',
      'cierre_ganado': '#10B981',
      'cierre_perdido': '#EF4444',
      'firma_contrato': '#10B981',
      'activo': '#10B981',
      'cliente_perdido': '#EF4444',
      'lead_inactivo': '#EF4444',
    };
    return colors[stage] || '#6B7280';
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacto': 'Contacto',
      'reunion_agendada': 'Reunión Agendada',
      'reunion_efectiva': 'Reunión Efectiva',
      'propuesta_economica': 'Propuesta Económica',
      'negociacion': 'Negociación',
      'licitacion': 'Licitación',
      'licitacion_etapa_final': 'Licitación Etapa Final',
      'cierre_ganado': 'Cierre Ganado',
      'cierre_perdido': 'Cierre Perdido',
      'firma_contrato': 'Firma de Contrato',
      'activo': 'Activo',
      'cliente_perdido': 'Cliente Perdido',
      'lead_inactivo': 'Lead Inactivo',
    };
    return labels[stage] || stage;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      const thousands = value / 1000;
      return `S/ ${thousands.toFixed(1)}k`;
    }
    return `S/ ${value.toFixed(0)}`;
  };

  const handleOpenNote = () => {
    setNoteData({ subject: '', description: '' });
    setNoteOpen(true);
  };

  const handlePriorityClick = (event: React.MouseEvent<HTMLElement>) => {
    setPriorityAnchorEl(event.currentTarget);
  };

  const handlePriorityClose = () => {
    setPriorityAnchorEl(null);
  };

  const handlePriorityChange = async (newPriority: 'baja' | 'media' | 'alta') => {
    if (!deal || updatingPriority) return;
    
    setUpdatingPriority(true);
    try {
      await api.put(`/deals/${deal.id}`, {
        priority: newPriority,
      });
      setDeal({ ...deal, priority: newPriority });
      setSuccessMessage('Prioridad actualizada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      handlePriorityClose();
    } catch (error) {
      console.error('Error updating priority:', error);
      setSuccessMessage('Error al actualizar la prioridad');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteData.description.trim()) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/activities', {
        type: 'note',
        subject: noteData.subject || `Nota para ${deal?.name || 'Negocio'}`,
        description: noteData.description,
        dealId: id,
      });
      setSuccessMessage('Nota creada exitosamente');
      setNoteOpen(false);
      setNoteData({ subject: '', description: '' });
      fetchActivities();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEmail = () => {
    const email = deal?.Contact?.email || deal?.Company?.phone || '';
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  };

  const handleOpenCall = () => {
    const phone = deal?.Contact?.phone || deal?.Company?.phone || '';
    if (phone) {
      window.open(`tel:${phone}`, '_blank');
    }
  };

  const handleOpenTask = () => {
    setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setSelectedDate(null);
    setCurrentMonth(new Date());
    setTaskOpen(true);
  };

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (taskData.dueDate) {
      const date = new Date(taskData.dueDate);
      setSelectedDate(date);
      setCurrentMonth(date);
    } else {
      setSelectedDate(null);
      setCurrentMonth(new Date());
    }
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = date.toISOString().split('T')[0];
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setTaskData({ ...taskData, dueDate: '' });
    setDatePickerAnchorEl(null);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    const formattedDate = today.toISOString().split('T')[0];
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];
    
    // Días del mes anterior
    // Si el mes empieza en domingo (0), no hay días del mes anterior
    // Si empieza en lunes (1), hay 1 día del mes anterior, etc.
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNumber = prevMonthLastDay - startingDayOfWeek + i + 1;
      days.push({ day: dayNumber, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
    // Completar hasta 42 días (6 semanas) con días del siguiente mes
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }
    
    return days;
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const handleSaveTask = async () => {
    if (!taskData.title.trim()) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        type: 'todo',
        status: 'not started',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || undefined,
        dealId: id,
      });
      setSuccessMessage('Tarea creada exitosamente' + (taskData.dueDate ? ' y sincronizada con Google Calendar' : ''));
      setTaskOpen(false);
      setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
      fetchActivities();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving task:', error);
      setSuccessMessage('Error al crear la tarea');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box>
        <Typography>Negocio no encontrado</Typography>
        <Button onClick={() => navigate('/deals')}>Volver a Negocios</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default,
      minHeight: '100vh',
      pb: { xs: 2, sm: 4, md: 8 },
      px: { xs: 0, sm: 0, md: 0.25, lg: 0.5 },
      pt: { xs: 0.25, sm: 0.5, md: 1 },
    }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          {/* Contenido principal */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 3 },
      }}>
            {/* Columna Izquierda - Información del Negocio */}
            <Box sx={{ 
              width: { xs: '100%', md: '350px' },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
          {/* Card 1: Avatar, Nombre y Botones */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}>
            {/* Header: Avatar con valor debajo, Nombre a la derecha, botón de opciones a la derecha */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      src={negocioLogo}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: negocioLogo ? 'transparent' : taxiMonterricoColors.green,
                        fontSize: '1rem',
                      }}
                    >
                      {!negocioLogo && getInitials(deal.name)}
                    </Avatar>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {deal.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, pl: 0.5 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                  Valor: {formatCurrency(deal.amount || 0)}
                </Typography>
                {deal.closeDate && (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                    Fecha de cierre: {new Date(deal.closeDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                  Etapa del negocio: {getStageLabel(deal.stage)}
                </Typography>
              </Box>
            </Box>

            {/* Acciones Rápidas */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box 
                onClick={handleOpenNote}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Note sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Nota
                </Typography>
              </Box>
              
              <Box 
                onClick={handleOpenEmail}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Email sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Correo
                </Typography>
              </Box>
              
              <Box 
                onClick={handleOpenCall}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Phone sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Llamar
                </Typography>
              </Box>
              
              <Box 
                onClick={handleOpenTask}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Assignment sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Tarea
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Card 2: Información del Negocio */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Información del Negocio
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Propietario del negocio
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5, fontSize: '0.875rem' }}>
                  {deal.Owner ? `${deal.Owner.firstName} ${deal.Owner.lastName}` : '--'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Último contacto
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5, fontSize: '0.875rem' }}>
                  {activities.length > 0 && activities[0].createdAt
                    ? new Date(activities[0].createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '--'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Tipo de negocio
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5, fontSize: '0.875rem' }}>
                  Cliente nuevo
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Prioridad
                </Typography>
                <Box 
                  onClick={handlePriorityClick}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mt: 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: deal.priority === 'baja' ? '#20B2AA' : deal.priority === 'media' ? '#F59E0B' : deal.priority === 'alta' ? '#EF4444' : '#10B981',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {deal.priority || 'Baja'}
                  </Typography>
                </Box>
                <Menu
                  anchorEl={priorityAnchorEl}
                  open={Boolean(priorityAnchorEl)}
                  onClose={handlePriorityClose}
                  PaperProps={{
                    sx: {
                      bgcolor: theme.palette.background.paper,
                      boxShadow: theme.shadows[3],
                      borderRadius: 1.5,
                      minWidth: 150,
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => handlePriorityChange('baja')}
                    disabled={updatingPriority}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#20B2AA' }} />
                      Baja
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => handlePriorityChange('media')}
                    disabled={updatingPriority}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                      Media
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => handlePriorityChange('alta')}
                    disabled={updatingPriority}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                      Alta
                    </Box>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Card>


        </Box>

        {/* Columna Derecha - Descripción y Actividades */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              minHeight: 'auto',
              '& .MuiTabs-flexContainer': {
                minHeight: 'auto',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                minHeight: 'auto',
                padding: '6px 16px',
                paddingBottom: '4px',
                lineHeight: 1.2,
              },
              '& .MuiTabs-indicator': {
                bottom: 0,
                height: 2,
              },
            }}
          >
            <Tab label="Descripción" />
            <Tab label="Actividades" />
          </Tabs>

          <Card sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            bgcolor: theme.palette.background.paper,
            flex: 1,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Vista de Descripción */}
            {activeTab === 0 && (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {deal.description ? (
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>
                    {deal.description}
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                      Actividades Recientes
                    </Typography>
                    {activities.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay actividades registradas
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        gap: 2 
                      }}>
                        {activities.slice(0, 6).map((activity) => (
                          <Paper
                            key={activity.id}
                            sx={{
                              p: 2,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1.5,
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: activity.type === 'note' ? taxiMonterricoColors.orange : taxiMonterricoColors.green,
                                }}
                              >
                                {activity.type === 'note' ? <Note /> : <Assignment />}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {activity.subject || activity.title}
                                </Typography>
                                {activity.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {activity.description}
                                  </Typography>
                                )}
                                {activity.User && (
                                  <Typography variant="caption" color="text.secondary">
                                    Por {activity.User.firstName} {activity.User.lastName}
                                    {activity.createdAt && (
                                      <span> • {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}</span>
                                    )}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Vista de Actividades */}
            {activeTab === 1 && (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay actividades registradas
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activities.map((activity) => (
                      <Paper
                        key={activity.id}
                        sx={{
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: activity.type === 'note' ? taxiMonterricoColors.orange : taxiMonterricoColors.green,
                            }}
                          >
                            {activity.type === 'note' ? <Note /> : <Assignment />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {activity.subject || activity.title}
                            </Typography>
                            {activity.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {activity.description}
                              </Typography>
                            )}
                            {activity.User && (
                              <Typography variant="caption" color="text.secondary">
                                Por {activity.User.firstName} {activity.User.lastName}
                                {activity.createdAt && (
                                  <span> • {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}</span>
                                )}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* Dialog para crear nota */}
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nota</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Asunto"
            value={noteData.subject}
            onChange={(e) => setNoteData({ ...noteData, subject: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Descripción"
            value={noteData.description}
            onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveNote} variant="contained" disabled={saving || !noteData.description.trim()}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear tarea */}
      <Dialog 
        open={taskOpen} 
        onClose={() => setTaskOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: 'transparent',
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 72,
            px: 4,
            pt: 3,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: `${taxiMonterricoColors.green}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
            </Box>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
              Tarea
            </Typography>
          </Box>
          <IconButton 
            sx={{ 
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease',
              '&:hover': { 
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: 'rotate(90deg)',
              }
            }} 
            size="medium" 
            onClick={() => setTaskOpen(false)}
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 4, pb: 2 }}>
          <TextField
            label="Título"
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            required
            fullWidth
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderWidth: '2px',
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: taxiMonterricoColors.green,
                },
                '&.Mui-focused fieldset': {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                '&.Mui-focused': {
                  color: taxiMonterricoColors.green,
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              select
              label="Prioridad"
              value={taskData.priority}
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
              fullWidth
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      mt: 1,
                    },
                  },
                },
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: taxiMonterricoColors.green,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.green,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  '&.Mui-focused': {
                    color: taxiMonterricoColors.green,
                  },
                },
              }}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
            </TextField>
            <TextField
              label="Fecha límite"
              value={formatDateDisplay(taskData.dueDate)}
              onClick={handleOpenDatePicker}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={handleOpenDatePicker}
                    sx={{ 
                      color: theme.palette.text.secondary,
                      mr: 0.5,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: taxiMonterricoColors.green,
                      }
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 20 }} />
                  </IconButton>
                ),
              }}
              sx={{ 
                cursor: 'pointer',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: taxiMonterricoColors.green,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.green,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  '&.Mui-focused': {
                    color: taxiMonterricoColors.green,
                  },
                },
                '& .MuiInputBase-input': {
                  cursor: 'pointer',
                },
              }}
            />
          </Box>
          <TextField
            label="Descripción"
            multiline
            rows={5}
            value={taskData.description}
            onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
            fullWidth
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderWidth: '2px',
                  borderColor: theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: taxiMonterricoColors.green,
                },
                '&.Mui-focused fieldset': {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                '&.Mui-focused': {
                  color: taxiMonterricoColors.green,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setTaskOpen(false)}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              px: 3,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained" 
            disabled={saving || !taskData.title.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              bgcolor: taskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
              color: 'white',
              '&:hover': {
                bgcolor: taskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
                opacity: 0.9,
              },
              '&:disabled': {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Popover - Se despliega debajo del campo */}
      <Popover
        open={Boolean(datePickerAnchorEl)}
        anchorEl={datePickerAnchorEl}
        onClose={() => setDatePickerAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            mt: 0.5,
          },
        }}
      >
        <Box sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
          {/* Header con mes y año - Mejorado */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 3,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              fontSize: '1.15rem',
              color: theme.palette.text.primary,
              letterSpacing: '-0.01em',
            }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Días de la semana - Mejorado */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5, 
            mb: 2,
          }}>
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="caption"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  py: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendario - Diseño Mejorado */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.75,
            mb: 2,
          }}>
            {getDaysInMonth(currentMonth).map((item, index) => {
              const date = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                item.day
              );
              
              if (!item.isCurrentMonth) {
                if (index < 7) {
                  date.setMonth(currentMonth.getMonth() - 1);
                } else {
                  date.setMonth(currentMonth.getMonth() + 1);
                }
              }

              const isSelected = selectedDate && 
                item.isCurrentMonth &&
                date.toDateString() === selectedDate.toDateString();
              const isToday = item.isCurrentMonth &&
                date.toDateString() === new Date().toDateString();

              return (
                <Box
                  key={`${item.isCurrentMonth ? 'current' : 'other'}-${item.day}-${index}`}
                  onClick={() => {
                    if (item.isCurrentMonth) {
                      handleDateSelect(date);
                    }
                  }}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    cursor: item.isCurrentMonth ? 'pointer' : 'default',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: isSelected
                      ? taxiMonterricoColors.green
                      : isToday
                      ? `${taxiMonterricoColors.green}20`
                      : 'transparent',
                    color: isSelected
                      ? 'white'
                      : isToday
                      ? taxiMonterricoColors.green
                      : item.isCurrentMonth
                      ? theme.palette.text.primary
                      : theme.palette.text.disabled,
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    fontSize: '0.875rem',
                    position: 'relative',
                    minHeight: '32px',
                    minWidth: '32px',
                    '&:hover': {
                      bgcolor: item.isCurrentMonth
                        ? (isSelected
                            ? taxiMonterricoColors.green
                            : `${taxiMonterricoColors.green}15`)
                        : 'transparent',
                      transform: item.isCurrentMonth && !isSelected ? 'scale(1.05)' : 'none',
                    },
                    opacity: item.isCurrentMonth ? 1 : 0.35,
                  }}
                >
                  {item.day}
                </Box>
              );
            })}
          </Box>

          {/* Botones de acción - Mejorado */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2, 
            pt: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
          }}>
            <Button
              onClick={handleClearDate}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontWeight: 500,
                px: 2,
                py: 0.75,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              Borrar
            </Button>
            <Button
              onClick={handleToday}
              sx={{
                textTransform: 'none',
                color: taxiMonterricoColors.green,
                fontWeight: 600,
                px: 2,
                py: 0.75,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.green}15`,
                },
              }}
            >
              Hoy
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default DealDetail;