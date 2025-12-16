import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDatePeru, formatDateInputPeru, createDatePeru } from '../utils/dateUtils';
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
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputBase,
  InputAdornment,
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
  Search,
  MoreVert,
  Close,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  Image,
  Code,
  TableChart,
  AttachFile,
  Add,
  ExpandMore,
  PersonAdd,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  Cancel,
  Check,
  Event,
  KeyboardArrowRight,
  Edit,
  KeyboardArrowDown,
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
  createdAt?: string;
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
  const [dealContacts, setDealContacts] = useState<any[]>([]);
  const [dealCompanies, setDealCompanies] = useState<any[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState('');
  const [priorityAnchorEl, setPriorityAnchorEl] = useState<null | HTMLElement>(null);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('empresas');
  const [associateSearch, setAssociateSearch] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedAssociations, setSelectedAssociations] = useState<{ [key: string]: number[] }>({
    companies: [],
    contacts: [],
    deals: [],
  });
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [addCompanyMenuAnchor, setAddCompanyMenuAnchor] = useState<null | HTMLElement>(null);
  const [createActivityMenuAnchor, setCreateActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('Todo hasta ahora');
  const [timeRangeMenuAnchor, setTimeRangeMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterMenuAnchor, setActivityFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterSearch, setActivityFilterSearch] = useState('');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<any | null>(null);
  const [completedActivities, setCompletedActivities] = useState<{ [key: number]: boolean }>({});
  const activityFilterChipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchActivities();
    }
  }, [id]);

  useEffect(() => {
    if (descriptionEditorRef.current && taskOpen) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || '';
      }
    }
  }, [taskData.description, taskOpen]);

  const updateActiveFormats = useCallback(() => {
    if (descriptionEditorRef.current) {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    }
  }, []);

  useEffect(() => {
    const editor = descriptionEditorRef.current;
    if (!editor || !taskOpen) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta')) {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('mouseup', handleMouseUp);
    editor.addEventListener('keyup', handleKeyUp as EventListener);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('mouseup', handleMouseUp);
      editor.removeEventListener('keyup', handleKeyUp as EventListener);
    };
  }, [updateActiveFormats, taskOpen]);

  const fetchDeal = async () => {
    try {
      const response = await api.get(`/deals/${id}`);
      setDeal(response.data);
      
      // Obtener solo el contacto principal asociado al deal
      // El deal tiene un contactId que apunta a un contacto específico
      if (response.data.Contact) {
        // Si hay un contacto asociado, mostrarlo
        setDealContacts([response.data.Contact]);
      } else {
        // Si no hay contacto asociado, dejar el array vacío
        setDealContacts([]);
      }

      // Obtener solo la empresa principal asociada al deal
      // El deal tiene un companyId que apunta a una empresa específica
      if (response.data.Company) {
        // Si hay una empresa asociada, mostrarla
        setDealCompanies([response.data.Company]);
      } else {
        // Si no hay empresa asociada, dejar el array vacío
        setDealCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      setDealContacts([]);
      setDealCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociations = async (searchTerm?: string) => {
    setLoadingAssociations(true);
    try {
      // Si hay búsqueda, cargar todos los resultados
      if (searchTerm && searchTerm.trim().length > 0) {
        const [companiesRes, contactsRes, dealsRes] = await Promise.all([
          api.get('/companies', { params: { limit: 1000, search: searchTerm } }),
          api.get('/contacts', { params: { limit: 1000, search: searchTerm } }),
          api.get('/deals', { params: { limit: 1000, search: searchTerm } }),
        ]);
        setCompanies(companiesRes.data.companies || companiesRes.data || []);
        setContacts(contactsRes.data.contacts || contactsRes.data || []);
        setDeals(dealsRes.data.deals || dealsRes.data || []);
      } else {
        // Si no hay búsqueda, solo cargar los vinculados al deal actual
        const associatedItems: { companies: any[]; contacts: any[]; deals: any[] } = {
          companies: [],
          contacts: [],
          deals: [],
        };

        // Cargar empresa vinculada si existe
        if (deal?.Company) {
          associatedItems.companies.push(deal.Company);
        }

        // Cargar contacto vinculado si existe
        if (deal?.Contact) {
          associatedItems.contacts.push(deal.Contact);
        }

        setCompanies(associatedItems.companies);
        setContacts(associatedItems.contacts);
        setDeals(associatedItems.deals);
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
    } finally {
      setLoadingAssociations(false);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;
    
    try {
      const response = await api.get('/activities', {
        params: { dealId: id },
      });
      const activitiesData = response.data.activities || response.data || [];
      
      // Filtrar solo actividades que realmente pertenecen a este negocio
      const dealIdNum = parseInt(id, 10);
      const filteredActivities = activitiesData.filter((activity: any) => {
        return activity.dealId === dealIdNum || activity.dealId === id;
      });
      
      // Obtener tareas asociadas
      const tasksResponse = await api.get('/tasks', {
        params: { dealId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];
      
      // Filtrar solo tareas que realmente pertenecen a este negocio
      const filteredTasks = tasksData.filter((task: any) => {
        return task.dealId === dealIdNum || task.dealId === id;
      });
      
      const tasksAsActivities = filteredTasks.map((task: any) => ({
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
        dealId: task.dealId,
      }));
      
      const allActivities = [...filteredActivities, ...tasksAsActivities].sort((a: any, b: any) => {
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

  const getActivityTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'note': 'Nota',
      'email': 'Correo',
      'call': 'Llamada',
      'task': 'Tarea',
      'meeting': 'Reunión',
      'todo': 'Tarea',
    };
    return typeMap[type?.toLowerCase()] || 'Actividad';
  };

  const getActivityStatusColor = (activity: any) => {
    if (!activity.dueDate) {
      // Sin fecha de vencimiento - gris neutro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(activity.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Vencida - rojo claro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE',
      };
    } else if (diffDays <= 3) {
      // Por vencer (1-3 días) - amarillo/naranja claro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : '#FFF9C4',
      };
    } else {
      // A tiempo - verde claro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9',
      };
    }
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
      // Parsear el string YYYY-MM-DD como fecha local para evitar problemas de UTC
      const dateMatch = taskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Los meses en Date son 0-11
        const day = parseInt(dateMatch[3], 10);
        const date = new Date(year, month, day);
        setSelectedDate(date);
        setCurrentMonth(date);
      } else {
        const date = new Date(taskData.dueDate);
        setSelectedDate(date);
        setCurrentMonth(date);
      }
    } else {
      const today = new Date();
      setSelectedDate(null);
      setCurrentMonth(today);
    }
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    // Crear fecha para mostrar en el calendario (mes es 1-12, pero Date usa 0-11)
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    // Formatear directamente como YYYY-MM-DD sin conversiones de zona horaria
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setTaskData({ ...taskData, dueDate: '' });
    setDatePickerAnchorEl(null);
  };

  const handleToday = () => {
    // Obtener la fecha actual en hora de Perú
    const today = new Date();
    const peruToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const year = peruToday.getFullYear();
    const month = peruToday.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    const day = peruToday.getDate();
    // Usar la misma función handleDateSelect con los valores directos
    handleDateSelect(year, month, day);
  };

  const handleCreateActivity = (type: 'note' | 'task' | 'email' | 'call' | 'meeting') => {
    setCreateActivityMenuAnchor(null);
    if (type === 'note') {
      setNoteData({ subject: '', description: '' });
      setNoteOpen(true);
    } else if (type === 'task') {
      setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
      setTaskOpen(true);
    }
    // TODO: Implementar otros tipos de actividades (email, call, meeting)
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
    return formatDatePeru(dateString);
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

          {/* Cards de Fecha de Creación, Etapa del Negocio y Última Actividad */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Card
              sx={{
                flex: 1,
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.text.primary }}>
                Fecha de creación
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deal.createdAt
                  ? `${new Date(deal.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })} ${new Date(deal.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'No disponible'}
              </Typography>
            </Card>

            <Card
              sx={{
                flex: 1,
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.text.primary }}>
                Etapa del negocio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deal.stage ? getStageLabel(deal.stage) : 'No disponible'}
              </Typography>
            </Card>

            <Card
              sx={{
                flex: 1,
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.text.primary }}>
                Última actividad
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activities.length > 0 && activities[0].createdAt
                  ? `${new Date(activities[0].createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })} ${new Date(activities[0].createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'No hay actividades'}
              </Typography>
            </Card>
          </Box>

          <Card sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Vista de Descripción */}
            {activeTab === 0 && (
              <Box>

                {deal.description ? (
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>
                    {deal.description}
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                      Actividades Recientes
                    </Typography>
                    
                    {/* Opciones de búsqueda y crear actividades */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      mb: 2,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          placeholder="Buscar actividades"
                          value={activitySearch}
                          onChange={(e) => setActivitySearch(e.target.value)}
                          sx={{
                            width: '250px',
                            transition: 'all 0.3s ease',
                            '& .MuiOutlinedInput-root': {
                              height: '32px',
                              fontSize: '0.875rem',
                              '&:hover': {
                                '& fieldset': {
                                  borderColor: taxiMonterricoColors.green,
                                },
                              },
                              '&.Mui-focused': {
                                '& fieldset': {
                                  borderColor: taxiMonterricoColors.green,
                                  borderWidth: 2,
                                },
                              },
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Button 
                          size="small" 
                          variant="outlined" 
                          endIcon={<ExpandMore />}
                          onClick={(e) => setCreateActivityMenuAnchor(e.currentTarget)}
                          sx={{
                            borderColor: taxiMonterricoColors.green,
                            color: taxiMonterricoColors.green,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: taxiMonterricoColors.green,
                              backgroundColor: 'rgba(46, 125, 50, 0.08)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                            },
                            '&:active': {
                              transform: 'translateY(0)',
                            },
                          }}
                        >
                          Crear actividades
                        </Button>
                      </Box>
                      
                      {/* Filtros alineados a la derecha */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={selectedTimeRange}
                          size="small" 
                          deleteIcon={<KeyboardArrowDown fontSize="small" />}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setTimeRangeMenuAnchor(e.currentTarget);
                          }}
                          onClick={(e) => setTimeRangeMenuAnchor(e.currentTarget)}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: taxiMonterricoColors.green,
                            '&:hover': {
                              backgroundColor: 'rgba(46, 125, 50, 0.08)',
                              transform: 'scale(1.05)',
                              boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                            },
                          }}
                        />
                        <Box 
                          ref={activityFilterChipRef}
                          sx={{ display: 'inline-flex' }}
                        >
                          {selectedActivityTypes.length > 0 ? (
                            <Chip 
                              label={`(${selectedActivityTypes.length}) Actividad`}
                              size="small" 
                              deleteIcon={<Close fontSize="small" />}
                              onDelete={(e) => {
                                e.stopPropagation();
                                setSelectedActivityTypes([]);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activityFilterChipRef.current) {
                                  setActivityFilterMenuAnchor(activityFilterChipRef.current);
                                }
                              }}
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                bgcolor: 'rgba(46, 125, 50, 0.1)',
                                color: taxiMonterricoColors.green,
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.15)',
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                                },
                              }}
                            />
                          ) : (
                            <Chip 
                              label="Actividad"
                              size="small" 
                              deleteIcon={<KeyboardArrowDown fontSize="small" />}
                              onDelete={(e) => {
                                e.stopPropagation();
                                if (activityFilterChipRef.current) {
                                  setActivityFilterMenuAnchor(activityFilterChipRef.current);
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activityFilterChipRef.current) {
                                  setActivityFilterMenuAnchor(activityFilterChipRef.current);
                                }
                              }}
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: taxiMonterricoColors.green,
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.08)',
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                                },
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Menú de crear actividades */}
                    <Menu
                      anchorEl={createActivityMenuAnchor}
                      open={Boolean(createActivityMenuAnchor)}
                      onClose={() => setCreateActivityMenuAnchor(null)}
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
                          mt: 1,
                          minWidth: 320,
                          maxWidth: 320,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                        },
                      }}
                    >
                      <MenuItem 
                        onClick={() => handleCreateActivity('note')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Edit sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Crear nota
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('task')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Assignment sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Crear tarea
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('email')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Email sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Crear correo
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('call')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Phone sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Hacer llamada telefónica
                        </Typography>
                        <KeyboardArrowRight sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('meeting')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Event sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Programar reunión
                        </Typography>
                      </MenuItem>
                    </Menu>

                    {/* Menú de rango de tiempo */}
                    <Menu
                      anchorEl={timeRangeMenuAnchor}
                      open={Boolean(timeRangeMenuAnchor)}
                      onClose={() => setTimeRangeMenuAnchor(null)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 280,
                          maxWidth: 280,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                        },
                      }}
                    >
                      {['Todo', 'Hoy', 'Ayer', 'Esta semana', 'Semana pasada', 'Últimos 7 días'].map((option) => {
                        const isSelected = selectedTimeRange === option || (option === 'Todo' && selectedTimeRange === 'Todo hasta ahora');
                        return (
                          <MenuItem
                            key={option}
                            onClick={() => {
                              setSelectedTimeRange(option === 'Todo' ? 'Todo hasta ahora' : option);
                              setTimeRangeMenuAnchor(null);
                            }}
                            sx={{
                              py: 1.5,
                              px: 2,
                              color: theme.palette.text.primary,
                              backgroundColor: isSelected 
                                ? (theme.palette.mode === 'dark' 
                                  ? 'rgba(144, 202, 249, 0.16)' 
                                  : '#e3f2fd')
                                : 'transparent',
                              '&:hover': {
                                backgroundColor: isSelected
                                  ? (theme.palette.mode === 'dark' 
                                    ? 'rgba(144, 202, 249, 0.24)' 
                                    : '#bbdefb')
                                  : theme.palette.action.hover,
                              },
                            }}
                          >
                            <Typography variant="body2" sx={{ color: 'inherit' }}>
                              {option}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                    </Menu>

                    {/* Menú de tipo de actividad */}
                    <Menu
                      anchorEl={activityFilterMenuAnchor}
                      open={Boolean(activityFilterMenuAnchor)}
                      onClose={() => setActivityFilterMenuAnchor(null)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 280,
                          maxWidth: 280,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                        },
                      }}
                    >
                      <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <TextField
                          size="small"
                          placeholder="Buscar"
                          fullWidth
                          value={activityFilterSearch}
                          onChange={(e) => setActivityFilterSearch(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? theme.palette.background.default 
                                : '#f5f5f5',
                              '& fieldset': {
                                borderColor: theme.palette.divider,
                              },
                              '&:hover fieldset': {
                                borderColor: theme.palette.text.secondary,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: taxiMonterricoColors.green,
                              },
                            },
                          }}
                        />
                      </Box>
                      {(() => {
                        // Filtrar tipos según el término de búsqueda
                        const availableTypes = ['Nota', 'Correo', 'Llamada', 'Tarea', 'Reunión'];
                        const filteredTypes = activityFilterSearch
                          ? availableTypes.filter(type => 
                              type.toLowerCase().includes(activityFilterSearch.toLowerCase())
                            )
                          : availableTypes;

                        return filteredTypes.map((type) => {
                          const isSelected = selectedActivityTypes.includes(type);
                          return (
                            <MenuItem
                              key={type}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedActivityTypes(selectedActivityTypes.filter(t => t !== type));
                                } else {
                                  setSelectedActivityTypes([...selectedActivityTypes, type]);
                                }
                              }}
                              sx={{
                                py: 1.5,
                                px: 2,
                                backgroundColor: isSelected 
                                  ? (theme.palette.mode === 'dark' 
                                    ? 'rgba(46, 125, 50, 0.16)' 
                                    : 'rgba(46, 125, 50, 0.08)')
                                  : 'transparent',
                                '&:hover': {
                                  backgroundColor: isSelected
                                    ? (theme.palette.mode === 'dark' 
                                      ? 'rgba(46, 125, 50, 0.24)' 
                                      : 'rgba(46, 125, 50, 0.12)')
                                    : theme.palette.action.hover,
                                },
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                size="small"
                                sx={{
                                  color: taxiMonterricoColors.green,
                                  '&.Mui-checked': {
                                    color: taxiMonterricoColors.green,
                                  },
                                }}
                              />
                              <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                                {type}
                              </Typography>
                            </MenuItem>
                          );
                        });
                      })()}
                    </Menu>

                    {(() => {
                      // Filtrar actividades según el término de búsqueda
                      let filteredActivities = activitySearch
                        ? activities.filter((activity) => {
                            const searchTerm = activitySearch.toLowerCase();
                            const subject = (activity.subject || activity.title || '').toLowerCase();
                            const description = (activity.description || '').toLowerCase();
                            return subject.includes(searchTerm) || description.includes(searchTerm);
                          })
                        : activities;

                      // Filtrar por tipo de actividad
                      if (selectedActivityTypes.length > 0) {
                        const typeMap: { [key: string]: string[] } = {
                          'Nota': ['note'],
                          'Correo': ['email'],
                          'Llamada': ['call'],
                          'Tarea': ['task'],
                          'Reunión': ['meeting'],
                        };
                        filteredActivities = filteredActivities.filter((activity) => {
                          // Obtener el tipo de actividad
                          let activityType = activity.type?.toLowerCase() || '';
                          
                          // Si es una tarea (isTask), asegurarse de que el tipo sea 'task'
                          if (activity.isTask && !activityType) {
                            activityType = 'task';
                          }
                          
                          // Verificar si el tipo de actividad coincide con alguno de los seleccionados
                          return selectedActivityTypes.some(selectedType => {
                            const mappedTypes = typeMap[selectedType] || [];
                            return mappedTypes.includes(activityType);
                          });
                        });
                      }

                      // Filtrar por rango de tiempo
                      if (selectedTimeRange !== 'Todo hasta ahora') {
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        let startDate: Date;

                        switch (selectedTimeRange) {
                          case 'Hoy':
                            startDate = today;
                            break;
                          case 'Ayer':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - 1);
                            break;
                          case 'Esta semana':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - today.getDay());
                            break;
                          case 'Semana pasada':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - today.getDay() - 7);
                            break;
                          case 'Últimos 7 días':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - 7);
                            break;
                          default:
                            startDate = new Date(0);
                        }

                        filteredActivities = filteredActivities.filter((activity) => {
                          const activityDate = new Date(activity.createdAt || activity.dueDate || 0);
                          return activityDate >= startDate;
                        });
                      }

                      if (filteredActivities.length === 0) {
                        return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                              {activitySearch ? 'No se encontraron actividades' : 'No hay actividades registradas'}
                        </Typography>
                      </Box>
                        );
                      }

                      return (
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2 
                      }}>
                          {filteredActivities.map((activity) => (
                          <Paper
                            key={activity.id}
                            onClick={() => setExpandedActivity(activity)}
                            sx={{
                              p: 2,
                              ...getActivityStatusColor(activity),
                              borderRadius: 1.5,
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                opacity: 0.9,
                                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                              },
                            }}
                          >
                            <Box
                                sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: taxiMonterricoColors.green,
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {getActivityTypeLabel(activity.type)}
                                </Typography>
                                {activity.User && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Checkbox
                                checked={completedActivities[activity.id] || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setCompletedActivities(prev => ({
                                    ...prev,
                                    [activity.id]: e.target.checked
                                  }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                size="small"
                                sx={{
                                  p: 0.5,
                                  '& .MuiSvgIcon-root': {
                                    fontSize: 20,
                                  },
                                }}
                              />
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mb: 0.5, 
                                  pr: 6,
                                  flex: 1,
                                  textDecoration: completedActivities[activity.id] ? 'line-through' : 'none',
                                  opacity: completedActivities[activity.id] ? 0.6 : 1,
                                }}
                              >
                                {activity.subject || activity.title}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                      );
                    })()}
                  </Box>
                )}

              </Box>
            )}

            {/* Vista de Actividades */}
            {activeTab === 1 && (
              <Box>
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
                        onClick={() => setExpandedActivity(activity)}
                        sx={{
                          p: 2,
                          ...getActivityStatusColor(activity),
                          borderRadius: 1.5,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 0.9,
                            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Box
                            sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: taxiMonterricoColors.green,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            {getActivityTypeLabel(activity.type)}
                            </Typography>
                            {activity.User && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            checked={completedActivities[activity.id] || false}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCompletedActivities(prev => ({
                                ...prev,
                                [activity.id]: e.target.checked
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            sx={{
                              p: 0.5,
                              '& .MuiSvgIcon-root': {
                                fontSize: 20,
                              },
                            }}
                          />
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 0.5, 
                              pr: 6,
                              flex: 1,
                              textDecoration: completedActivities[activity.id] ? 'line-through' : 'none',
                              opacity: completedActivities[activity.id] ? 0.6 : 1,
                            }}
                          >
                            {activity.subject || activity.title}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Card>

          {/* Card de Contactos */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            bgcolor: theme.palette.background.paper,
            flex: 1,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            mt: 2,
            maxHeight: '500px',
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Contactos
            </Typography>
            
            {dealContacts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay contactos relacionados con este negocio
                </Typography>
        </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1.5,
                overflowY: 'auto',
                maxHeight: '400px',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                },
              }}>
                {dealContacts.map((contact: any) => (
                  <Paper
                    key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F5',
                        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: taxiMonterricoColors.green,
                        }}
                      >
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {contact.firstName} {contact.lastName}
                        </Typography>
                        {contact.email && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {contact.email}
                          </Typography>
                        )}
                        {contact.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                            {contact.phone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Card>

          {/* Card de Empresas */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            bgcolor: theme.palette.background.paper,
            flex: 1,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            mt: 2,
            maxHeight: '500px',
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Empresas
            </Typography>
            
            {/* Cuadro de búsqueda y botón agregar */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar empresas"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                sx={{
                  width: '250px',
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    fontSize: '0.875rem',
                    '&:hover': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                    '&.Mui-focused': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: 2,
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<Add />}
                endIcon={<ExpandMore />}
                onClick={(e) => setAddCompanyMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Agregar
              </Button>
            </Box>

            {/* Menú para agregar empresa */}
            <Menu
              anchorEl={addCompanyMenuAnchor}
              open={Boolean(addCompanyMenuAnchor)}
              onClose={() => setAddCompanyMenuAnchor(null)}
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
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0,0,0,0.5)' 
                    : '0 4px 20px rgba(0,0,0,0.15)',
                  bgcolor: theme.palette.background.paper,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  setAddCompanyMenuAnchor(null);
                  // TODO: Implementar lógica para agregar empresa existente
                  // Por ejemplo, abrir un modal de selección de empresas
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(46, 125, 50, 0.15)' 
                      : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Business sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                <Typography variant="body2">Agregar empresa existente</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAddCompanyMenuAnchor(null);
                  // TODO: Implementar lógica para crear nueva empresa
                  // Por ejemplo, navegar a la página de crear empresa o abrir un modal
                  navigate('/companies/new');
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(46, 125, 50, 0.15)' 
                      : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Add sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                <Typography variant="body2">Crear nueva empresa</Typography>
              </MenuItem>
            </Menu>
            
            {dealCompanies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay empresas relacionadas con este negocio
                </Typography>
              </Box>
            ) : (() => {
              // Filtrar empresas según la búsqueda
              const filteredCompanies = dealCompanies.filter((company: any) => {
                if (!companySearch.trim()) return true;
                const searchLower = companySearch.toLowerCase();
                return (
                  company.name?.toLowerCase().includes(searchLower) ||
                  company.email?.toLowerCase().includes(searchLower) ||
                  company.phone?.toLowerCase().includes(searchLower) ||
                  company.website?.toLowerCase().includes(searchLower)
                );
              });

              if (filteredCompanies.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron empresas
                    </Typography>
                  </Box>
                );
              }

              return (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  overflowY: 'auto',
                  maxHeight: '400px',
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    },
                  },
                }}>
                  {filteredCompanies.map((company: any) => (
                  <Paper
                    key={company.id}
                    onClick={() => navigate(`/companies/${company.id}`)}
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F5F5F5',
                        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: taxiMonterricoColors.green,
                        }}
                      >
                        {company.name?.[0]}{company.name?.[1] || ''}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {company.name}
                        </Typography>
                        {company.email && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {company.email}
                          </Typography>
                        )}
                        {company.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                            {company.phone}
                          </Typography>
                        )}
                        {company.website && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                            {company.website}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                  ))}
                </Box>
              );
            })()}
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
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            width: '560px',
            maxWidth: '90vw',
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
            minHeight: 48,
            px: 2,
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            Tarea
          </Typography>
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

        <DialogContent sx={{ px: 2, pb: 1, pt: 0.5 }}>
          <TextField
            label="Título"
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            fullWidth
            InputLabelProps={{
              shrink: !!taskData.title,
            }}
            sx={{ 
              mb: 1.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 0.5,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.75rem',
                '& fieldset': {
                  borderWidth: 0,
                  border: 'none',
                  top: 0,
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: '2px !important',
                  borderColor: `${taxiMonterricoColors.orange} !important`,
                  borderStyle: 'solid !important',
                  top: 0,
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '0px !important',
                '& legend': {
                  width: 0,
                  display: 'none',
                },
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px !important',
                borderColor: `${taxiMonterricoColors.green} !important`,
                borderStyle: 'solid !important',
                '& legend': {
                  width: 0,
                  display: 'none',
                },
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 0,
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: '0.75rem',
                '&.Mui-focused': {
                  color: taxiMonterricoColors.orange,
                  transform: 'translateY(-50%)',
                  backgroundColor: 'transparent',
                },
                '&.MuiInputLabel-shrink': {
                  display: 'none',
                },
              },
              '& .MuiInputBase-input': {
                position: 'relative',
                zIndex: 1,
                fontSize: '0.75rem',
                py: 1,
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.75, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Prioridad
              </Typography>
              <TextField
                select
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
                  borderRadius: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '0.75rem',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.75rem',
                  py: 1,
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  '&.Mui-focused': {
                    color: taxiMonterricoColors.orange,
                  },
                },
              }}
            >
              <MenuItem value="low" sx={{ fontSize: '0.75rem', py: 0.75 }}>Baja</MenuItem>
              <MenuItem value="medium" sx={{ fontSize: '0.75rem', py: 0.75 }}>Media</MenuItem>
              <MenuItem value="high" sx={{ fontSize: '0.75rem', py: 0.75 }}>Alta</MenuItem>
              <MenuItem value="urgent" sx={{ fontSize: '0.75rem', py: 0.75 }}>Urgente</MenuItem>
            </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.75, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Fecha límite
              </Typography>
              <TextField
                value={formatDateDisplay(taskData.dueDate)}
                onClick={handleOpenDatePicker}
                fullWidth
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
                        color: taxiMonterricoColors.orange,
                      }
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 18 }} />
                  </IconButton>
                ),
              }}
              sx={{ 
                cursor: 'pointer',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '0.75rem',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.75rem',
                  py: 1,
                  cursor: 'pointer',
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  '&.Mui-focused': {
                    color: taxiMonterricoColors.orange,
                  },
                },
              }}
            />
            </Box>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ position: 'relative' }}>
            <Box
              ref={descriptionEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                const html = (e.target as HTMLElement).innerHTML;
                if (html !== taskData.description) {
                  setTaskData({ ...taskData, description: html });
                }
              }}
              sx={{
                minHeight: '150px',
                maxHeight: '250px',
                overflowY: 'auto',
                pt: 0,
                pb: 1.5,
                px: 1,
                borderRadius: 0.5,
                border: 'none',
                outline: 'none',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: theme.palette.text.primary,
                '&:empty:before': {
                  content: '"Descripción"',
                  color: theme.palette.text.disabled,
                },
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0.5,
                left: 4,
                right: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0.5,
                backgroundColor: 'transparent',
                borderRadius: 1,
                p: 0.5,
                border: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.bold ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('bold');
                    updateActiveFormats();
                  }}
                  title="Negrita"
                >
                  <FormatBold sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.italic ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('italic');
                    updateActiveFormats();
                  }}
                  title="Cursiva"
                >
                  <FormatItalic sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.underline ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('underline');
                    updateActiveFormats();
                  }}
                  title="Subrayado"
                >
                  <FormatUnderlined sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.strikeThrough ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('strikeThrough');
                    updateActiveFormats();
                  }}
                  title="Tachado"
                >
                  <FormatStrikethrough sx={{ fontSize: 16 }} />
                </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={(e) => setMoreMenuAnchorEl(e.currentTarget)}
                title="Más opciones"
              >
                <MoreVert sx={{ fontSize: 16 }} />
              </IconButton>
              <Menu
                anchorEl={moreMenuAnchorEl}
                open={Boolean(moreMenuAnchorEl)}
                onClose={() => setMoreMenuAnchorEl(null)}
              >
                <MenuItem 
                  onClick={() => { document.execCommand('justifyLeft'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Alinear izquierda"
                >
                  <FormatAlignLeft sx={{ fontSize: 16 }} />
                </MenuItem>
                <MenuItem 
                  onClick={() => { document.execCommand('justifyCenter'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Alinear centro"
                >
                  <FormatAlignCenter sx={{ fontSize: 16 }} />
                </MenuItem>
                <MenuItem 
                  onClick={() => { document.execCommand('justifyRight'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Alinear derecha"
                >
                  <FormatAlignRight sx={{ fontSize: 16 }} />
                </MenuItem>
                <MenuItem 
                  onClick={() => { document.execCommand('justifyFull'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Justificar"
                >
                  <FormatAlignJustify sx={{ fontSize: 16 }} />
                </MenuItem>
              </Menu>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25, 
                  minWidth: 28, 
                  height: 28,
                  backgroundColor: activeFormats.unorderedList ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                  }
                }}
                onClick={() => {
                  document.execCommand('insertUnorderedList');
                  updateActiveFormats();
                }}
                title="Lista con viñetas"
              >
                <FormatListBulleted sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25, 
                  minWidth: 28, 
                  height: 28,
                  backgroundColor: activeFormats.orderedList ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                  }
                }}
                onClick={() => {
                  document.execCommand('insertOrderedList');
                  updateActiveFormats();
                }}
                title="Lista numerada"
              >
                <FormatListNumbered sx={{ fontSize: 16 }} />
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => {
                  const url = prompt('URL:');
                  if (url) {
                    document.execCommand('createLink', false, url);
                  }
                }}
                title="Insertar enlace"
              >
                <LinkIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => imageInputRef.current?.click()}
                title="Insertar imagen"
              >
                <Image sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => {
                  const code = prompt('Ingresa el código:');
                  if (code && descriptionEditorRef.current) {
                    const selection = window.getSelection();
                    let range: Range | null = null;
                    
                    if (selection && selection.rangeCount > 0) {
                      range = selection.getRangeAt(0);
                    } else {
                      range = document.createRange();
                      range.selectNodeContents(descriptionEditorRef.current);
                      range.collapse(false);
                    }
                    
                    if (range) {
                      const pre = document.createElement('pre');
                      pre.style.backgroundColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5';
                      pre.style.color = theme.palette.text.primary;
                      pre.style.padding = '8px';
                      pre.style.borderRadius = '4px';
                      pre.style.fontFamily = 'monospace';
                      pre.style.fontSize = '0.75rem';
                      pre.textContent = code;
                      
                      range.deleteContents();
                      range.insertNode(pre);
                      range.setStartAfter(pre);
                      range.collapse(true);
                      if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }}
                title="Insertar código"
              >
                <Code sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => {
                  const rows = prompt('Número de filas:', '3');
                  const cols = prompt('Número de columnas:', '3');
                  if (rows && cols && descriptionEditorRef.current) {
                    const table = document.createElement('table');
                    table.style.borderCollapse = 'collapse';
                    table.style.width = '100%';
                    table.style.border = '1px solid #ccc';
                    table.style.margin = '8px 0';
                    
                    for (let i = 0; i < parseInt(rows); i++) {
                      const tr = document.createElement('tr');
                      for (let j = 0; j < parseInt(cols); j++) {
                        const td = document.createElement('td');
                        td.style.border = '1px solid #ccc';
                        td.style.padding = '8px';
                        td.innerHTML = '&nbsp;';
                        tr.appendChild(td);
                      }
                      table.appendChild(tr);
                    }
                    
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      range.deleteContents();
                      range.insertNode(table);
                      range.setStartAfter(table);
                      range.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }}
                title="Insertar tabla"
              >
                <TableChart sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo"
              >
                <AttachFile sx={{ fontSize: 16 }} />
              </IconButton>
              </Box>
              <IconButton
                onClick={() => {
                  setAssociateOpen(true);
                  setAssociateSearch('');
                  // Inicializar selecciones con los valores actuales del deal
                  setSelectedAssociations({
                    companies: deal?.Company ? [deal.Company.id] : [],
                    contacts: deal?.Contact ? [deal.Contact.id] : [],
                    deals: [],
                  });
                  fetchAssociations();
                }}
                size="small"
                sx={{
                  p: 0.25,
                  minWidth: 28,
                  height: 28,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  }
                }}
                title="Asociado"
              >
                <PersonAdd sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
          {/* Input oculto para seleccionar archivos de imagen */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !descriptionEditorRef.current) return;

              if (!file.type.startsWith('image/')) {
                alert('Por favor, selecciona un archivo de imagen válido.');
                return;
              }

              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  descriptionEditorRef.current?.focus();
                  
                  const selection = window.getSelection();
                  let range: Range | null = null;
                  
                  if (selection && selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                  } else if (descriptionEditorRef.current) {
                    range = document.createRange();
                    range.selectNodeContents(descriptionEditorRef.current);
                    range.collapse(false);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }

                  if (range) {
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.alt = file.name;
                    
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    if (descriptionEditorRef.current) {
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }
              };
              
              reader.onerror = () => {
                alert('Error al leer el archivo de imagen.');
              };
              
              reader.readAsDataURL(file);
              
              if (imageInputRef.current) {
                imageInputRef.current.value = '';
              }
            }}
          />
          {/* Input oculto para adjuntar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !descriptionEditorRef.current) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  descriptionEditorRef.current?.focus();
                  
                  const selection = window.getSelection();
                  let range: Range | null = null;
                  
                  if (selection && selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                  } else if (descriptionEditorRef.current) {
                    range = document.createRange();
                    range.selectNodeContents(descriptionEditorRef.current);
                    range.collapse(false);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }

                  if (range) {
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = file.name;
                    link.textContent = `📎 ${file.name}`;
                    link.style.display = 'inline-block';
                    link.style.margin = '4px';
                    link.style.padding = '4px 8px';
                    link.style.backgroundColor = theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5';
                    link.style.borderRadius = '4px';
                    link.style.textDecoration = 'none';
                    link.style.color = theme.palette.text.primary;
                    
                    range.insertNode(link);
                    range.setStartAfter(link);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    if (descriptionEditorRef.current) {
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }
              };
              
              reader.onerror = () => {
                alert('Error al leer el archivo.');
              };
              
              reader.readAsDataURL(file);
              
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
        </DialogContent>
        <Box sx={{ px: 2 }}>
          <Divider sx={{ mt: 0.25, mb: 1.5 }} />
        </Box>
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 0.75 }}>
          <Button 
            onClick={() => setTaskOpen(false)}
            size="small"
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
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
            size="small"
            disabled={saving || !taskData.title.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
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
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            mt: 0.5,
            maxWidth: 280,
          },
        }}
      >
        <Box sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
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
              fontSize: '0.95rem',
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
            mb: 1.5,
          }}>
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="caption"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  py: 0.5,
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
            gap: 0.5,
            mb: 1.5,
          }}>
            {getDaysInMonth(currentMonth).map((item, index) => {
              // Calcular año y mes correctos
              let year = currentMonth.getFullYear();
              let month = currentMonth.getMonth();
              
              if (!item.isCurrentMonth) {
                if (index < 7) {
                  // Mes anterior
                  month = month - 1;
                  if (month < 0) {
                    month = 11;
                    year = year - 1;
                  }
                } else {
                  // Mes siguiente
                  month = month + 1;
                  if (month > 11) {
                    month = 0;
                    year = year + 1;
                  }
                }
              }
              
              const date = new Date(year, month, item.day);

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
                      // Pasar directamente año, mes y día para evitar problemas de zona horaria
                      handleDateSelect(year, month + 1, item.day);
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
                    fontSize: '0.75rem',
                    position: 'relative',
                    minHeight: '28px',
                    minWidth: '28px',
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
            mt: 1.5, 
            pt: 1.5, 
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
          }}>
            <Button
              onClick={handleClearDate}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
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
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
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

      {/* Dialog para asociar */}
      <Dialog
        open={associateOpen}
        onClose={() => setAssociateOpen(false)}
        maxWidth="sm"
        fullWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
            width: '700px',
            maxWidth: '90vw',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: '500px',
          }}
        >
          {/* Panel izquierdo - Categorías */}
          <Box
            sx={{
              width: 160,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fafafa',
              overflowY: 'auto',
            }}
          >
            <List sx={{ p: 0 }}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'seleccionados'}
                  onClick={() => setSelectedCategory('seleccionados')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Seleccionados"
                    secondary={Object.values(selectedAssociations).flat().length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'empresas'}
                  onClick={() => setSelectedCategory('empresas')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Empresas"
                    secondary={companies.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'contactos'}
                  onClick={() => setSelectedCategory('contactos')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Contactos"
                    secondary={contacts.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'negocios'}
                  onClick={() => setSelectedCategory('negocios')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Negocios"
                    secondary={deals.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

          {/* Panel derecho - Contenido */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Asociar
              </Typography>
              <IconButton
                onClick={() => setAssociateOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>

            {/* Búsqueda */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                }}
              >
                <Search sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="Buscar asociaciones actuales"
                  value={associateSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssociateSearch(value);
                    // Cuando se escribe, buscar todos los resultados
                    if (value.trim().length > 0) {
                      fetchAssociations(value);
                    } else {
                      // Si se borra la búsqueda, volver a mostrar solo los vinculados
                      fetchAssociations();
                    }
                  }}
                  sx={{
                    flex: 1,
                    fontSize: '0.875rem',
                    '& input': {
                      py: 0.5,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {loadingAssociations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {selectedCategory === 'empresas' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Empresas
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {companies.map((company: any) => (
                            <ListItem key={company.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = selectedAssociations.companies || [];
                                  if (current.includes(company.id)) {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      companies: current.filter((id) => id !== company.id),
                                    });
                                  } else {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      companies: [...current, company.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedAssociations.companies?.includes(company.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={company.name}
                                  secondary={company.domain}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === 'contactos' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Contactos
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {contacts.map((contact: any) => (
                            <ListItem key={contact.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = selectedAssociations.contacts || [];
                                  if (current.includes(contact.id)) {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      contacts: current.filter((id) => id !== contact.id),
                                    });
                                  } else {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      contacts: [...current, contact.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedAssociations.contacts?.includes(contact.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={`${contact.firstName} ${contact.lastName}`}
                                  secondary={contact.email}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === 'negocios' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Negocios
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {deals.map((deal: any) => (
                            <ListItem key={deal.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = selectedAssociations.deals || [];
                                  if (current.includes(deal.id)) {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      deals: current.filter((id) => id !== deal.id),
                                    });
                                  } else {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      deals: [...current, deal.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedAssociations.deals?.includes(deal.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={deal.name}
                                  secondary={`${deal.amount ? `$${deal.amount.toLocaleString()}` : ''} ${deal.stage || ''}`}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === 'seleccionados' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Seleccionados ({Object.values(selectedAssociations).flat().length})
                      </Typography>
                      {Object.values(selectedAssociations).flat().length === 0 ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, py: 2 }}>
                          No hay elementos seleccionados
                        </Typography>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {selectedAssociations.companies?.map((companyId) => {
                            const company = companies.find((c: any) => c.id === companyId);
                            if (!company) return null;
                            return (
                              <ListItem key={companyId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      companies: selectedAssociations.companies.filter((id) => id !== companyId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <Business sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
                                  <ListItemText
                                    primary={company.name}
                                    secondary={company.domain}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {selectedAssociations.contacts?.map((contactId) => {
                            const contact = contacts.find((c: any) => c.id === contactId);
                            if (!contact) return null;
                            return (
                              <ListItem key={contactId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      contacts: selectedAssociations.contacts.filter((id) => id !== contactId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <Person sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
                                  <ListItemText
                                    primary={`${contact.firstName} ${contact.lastName}`}
                                    secondary={contact.email}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {selectedAssociations.deals?.map((dealId) => {
                            const deal = deals.find((d: any) => d.id === dealId);
                            if (!deal) return null;
                            return (
                              <ListItem key={dealId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      deals: selectedAssociations.deals.filter((id) => id !== dealId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <Assignment sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
                                  <ListItemText
                                    primary={deal.name}
                                    secondary={`${deal.amount ? `$${deal.amount.toLocaleString()}` : ''} ${deal.stage || ''}`}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Footer con botones */}
            <Box
              sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
              }}
            >
              <Button
                onClick={() => setAssociateOpen(false)}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  // TODO: Implementar guardado de asociaciones
                  try {
                    // Aquí iría la lógica para guardar las asociaciones
                    console.log('Guardar asociaciones:', selectedAssociations);
                    setAssociateOpen(false);
                  } catch (error) {
                    console.error('Error guardando asociaciones:', error);
                  }
                }}
                variant="contained"
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  bgcolor: taxiMonterricoColors.green,
                  '&:hover': {
                    bgcolor: taxiMonterricoColors.green,
                    opacity: 0.9,
                  },
                }}
              >
                Guardar
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog para ver detalles de actividad expandida */}
      <Dialog
        open={!!expandedActivity}
        onClose={() => setExpandedActivity(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        {expandedActivity && (
          <>
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 48,
                px: 2,
                pt: 1.5,
                pb: 0.5,
              }}
            >
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '1rem' }}>
                {getActivityTypeLabel(expandedActivity.type)}
              </Typography>
              <IconButton
                sx={{
                  color: theme.palette.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                }}
                size="medium"
                onClick={() => setExpandedActivity(null)}
              >
                <Close />
              </IconButton>
            </Box>

            <DialogContent sx={{ px: 2, pb: 1, pt: 0.5 }}>
              {/* Título */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                  Título
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {expandedActivity.subject || expandedActivity.title}
                </Typography>
              </Box>

              {/* Descripción */}
              {expandedActivity.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                    Descripción
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      border: `1px solid ${theme.palette.divider}`,
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      '& *': {
                        margin: 0,
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: expandedActivity.description }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Campos adicionales en grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {/* Fecha de vencimiento */}
                {expandedActivity.dueDate && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Fecha de vencimiento
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {new Date(expandedActivity.dueDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                )}

                {/* Prioridad */}
                {expandedActivity.priority && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Prioridad
                    </Typography>
                    <Chip
                      label={expandedActivity.priority === 'low' ? 'Baja' : expandedActivity.priority === 'medium' ? 'Media' : expandedActivity.priority === 'high' ? 'Alta' : expandedActivity.priority === 'urgent' ? 'Urgente' : expandedActivity.priority}
                      size="small"
                      sx={{
                        bgcolor: expandedActivity.priority === 'urgent' ? '#f44336' : expandedActivity.priority === 'high' ? '#ff9800' : expandedActivity.priority === 'medium' ? '#ffc107' : '#4caf50',
                        color: 'white',
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Box>
                )}

                {/* Estado */}
                {expandedActivity.status && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Estado
                    </Typography>
                    <Chip
                      label={expandedActivity.status === 'pending' ? 'Pendiente' : expandedActivity.status === 'in_progress' ? 'En progreso' : expandedActivity.status === 'completed' ? 'Completada' : expandedActivity.status}
                      size="small"
                      sx={{
                        bgcolor: expandedActivity.status === 'completed' ? taxiMonterricoColors.green : expandedActivity.status === 'in_progress' ? '#2196f3' : theme.palette.action.disabledBackground,
                        color: expandedActivity.status === 'completed' ? 'white' : theme.palette.text.primary,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Box>
                )}

                {/* Asignado a */}
                {expandedActivity.User && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Asignado a
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {expandedActivity.User.firstName} {expandedActivity.User.lastName}
                    </Typography>
                  </Box>
                )}

                {/* Fecha de creación */}
                {expandedActivity.createdAt && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Fecha de creación
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {new Date(expandedActivity.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
              <Button
                onClick={() => setExpandedActivity(null)}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DealDetail;