import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Avatar,
  FormControl,
  Select,
  Tooltip,
  Paper,
  useTheme,
} from '@mui/material';
import { Add, Delete, Search, CheckCircle, Visibility, Warning, Schedule, PendingActions, Edit, ChevronLeft, ChevronRight, Refresh, Launch, CheckCircleOutline, FilterList, Clear } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EntityPreviewDrawer from '../components/EntityPreviewDrawer';
import { UnifiedTable } from '../components/UnifiedTable';

interface Task {
  id: number;
  title: string;
  subject?: string; // Para actividades
  type: string;
  status: string;
  priority: string;
  dueDate?: string;
  AssignedTo?: { firstName: string; lastName: string };
  User?: { firstName: string; lastName: string }; // Para actividades
  isActivity?: boolean; // Flag para identificar si viene de actividades
}

const Tasks: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'todo',
    status: 'not started',
    priority: 'medium',
    dueDate: '',
    assignedToId: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; isActivity?: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [totalTasks, setTotalTasks] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calcular estadísticas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && t.status !== 'completed';
  }).length;

  const dueTodayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  }).length;

  const pendingTasks = tasks.filter(t => t.status === 'not started').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  // Calcular paginación desde el servidor
  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);

  // Resetear a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, search, sortBy]);

  // Función para obtener iniciales
  const getInitials = (title: string) => {
    if (!title) return '--';
    const words = title.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  };

  // Función para obtener el label de prioridad en español
  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'urgent': 'Urgente',
    };
    return priorityMap[priority?.toLowerCase()] || priority;
  };

  // Función para vista previa
  const handlePreview = (task: Task) => {
    setPreviewTask(task);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewTask(null);
  };

  const fetchUsers = useCallback(async () => {
    try {
      // Solo usuarios admin pueden ver la lista completa de usuarios
      if (user?.role === 'admin') {
        const response = await api.get('/users');
        setUsers(response.data || []);
      } else {
        // Usuarios no admin solo pueden asignarse a sí mismos
        if (user) {
          setUsers([user]);
        } else {
          setUsers([]);
        }
      }
    } catch (error: any) {
      // Si es un error de permisos (403), solo asignar al usuario actual
      if (error.response?.status === 403 || error.isPermissionError) {
        if (user) {
          setUsers([user]);
        } else {
          setUsers([]);
        }
        return;
      }
      console.error('Error fetching users:', error);
      if (user) {
        setUsers([user]);
      } else {
        setUsers([]);
      }
    }
  }, [user]);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      // Búsqueda general
      if (search) {
        params.search = search;
      }
      
      // Filtro por categoría (activeFilter)
      if (activeFilter) {
        switch (activeFilter) {
          case 'overdue':
            // Filtrar por tareas vencidas (se manejará en el servidor con dueDate)
            params.status = 'not completed'; // Excluir completadas
            break;
          case 'dueToday':
            // Filtrar por tareas de hoy (se manejará en el servidor)
            params.status = 'not completed';
            break;
          case 'pending':
            params.status = 'not started';
            break;
          case 'completed':
            params.status = 'completed';
            break;
        }
      }
      
      // Ordenamiento
      params.sortBy = sortBy;
      
      // Filtros adicionales
      if (filterStatus) {
        params.status = filterStatus;
      }
      if (filterPriority) {
        params.priority = filterPriority;
      }
      if (filterType) {
        params.type = filterType;
      }
      if (sortColumn) {
        params.sortColumn = sortColumn;
        params.sortDirection = sortDirection;
      }
      
      // Obtener tareas desde /tasks con paginación del servidor
      const tasksResponse = await api.get('/tasks', { params });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];
      
      const tasksFromTasks = tasksData.map((task: Task) => ({
        ...task,
        isActivity: false,
      }));

      // Por ahora, mantener solo tareas con paginación del servidor
      // Las actividades se pueden agregar después si es necesario
      setTasks(tasksFromTasks);
      setTotalTasks(tasksResponse.data.total || 0);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, currentPage, itemsPerPage, activeFilter, sortBy, filterStatus, filterPriority, filterType, sortColumn, sortDirection]);

  const handleRefresh = () => {
    fetchTasks(true);
  };

  const handleQuickComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'completed') return;
    
    setCompletingTask(task.id);
    try {
      if (task.isActivity) {
        await api.put(`/activities/${task.id}`, {
          subject: task.title || task.subject,
          type: 'task',
          status: 'completed',
        });
      } else {
        await api.put(`/tasks/${task.id}`, {
          ...task,
          status: 'completed',
        });
      }
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const handleNavigateToTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tasks/${task.id}`);
  };

  const handleFilterByStatus = (status: string) => {
    if (filterStatus === status) {
      setFilterStatus('');
      setActiveFilter(null);
    } else {
      setFilterStatus(status);
      switch (status) {
        case 'not started':
          setActiveFilter('pending');
          break;
        case 'completed':
          setActiveFilter('completed');
          break;
        default:
          setActiveFilter(null);
      }
    }
    setCurrentPage(1);
  };

  const handleFilterByPriority = (priority: string) => {
    setFilterPriority(filterPriority === priority ? '' : priority);
    setCurrentPage(1);
  };

  const handleFilterByType = (type: string) => {
    setFilterType(filterType === type ? '' : type);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return taxiMonterricoColors.green;
      case 'in progress':
        return '#2196F3';
      case 'not started':
        return theme.palette.warning.main;
      case 'cancelled':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'not started': 'No iniciada',
      'in progress': 'En progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpen = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      // Si es una actividad, obtener la descripción si existe
      const description = (task as any).description || '';
      const assignedToId = (task as any).assignedToId || '';
      setFormData({
        title: task.title || task.subject || '',
        description: description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedToId: assignedToId ? assignedToId.toString() : (user?.id ? user.id.toString() : ''),
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        type: 'todo',
        status: 'not started',
        priority: 'medium',
        dueDate: '',
        assignedToId: user?.id ? user.id.toString() : '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : (user?.id || undefined),
      };
      
      if (editingTask) {
        // Si es una actividad, actualizar en /activities
        if (editingTask.isActivity) {
          await api.put(`/activities/${editingTask.id}`, {
            subject: formData.title,
            description: formData.description,
            type: 'task',
            dueDate: formData.dueDate || undefined,
          });
        } else {
          // Si es una tarea normal, actualizar en /tasks
          await api.put(`/tasks/${editingTask.id}`, submitData);
        }
      } else {
        await api.post('/tasks', submitData);
      }
      handleClose();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = (id: number, isActivity?: boolean) => {
    setTaskToDelete({ id, isActivity });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    
    setDeleting(true);
    try {
      // Si es una actividad, eliminar desde /activities
      if (taskToDelete.isActivity) {
        await api.delete(`/activities/${taskToDelete.id}`);
      } else {
        // Si es una tarea normal, eliminar desde /tasks
        await api.delete(`/tasks/${taskToDelete.id}`);
      }
      fetchTasks();
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Cards de resumen */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 16px rgba(0,0,0,0.3)' 
          : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
        bgcolor: theme.palette.background.paper,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        mb: 2.5,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 24px rgba(0,0,0,0.4)' 
            : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
          transform: 'translateY(-2px)',
        },
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1.5, sm: 2 } }}>
            {/* Vencidas */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'overdue' ? null : 'overdue')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2, sm: 3, md: 4 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 1, sm: 1 },
                borderRadius: 2,
                bgcolor: activeFilter === 'overdue' ? `${theme.palette.error.main}10` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: activeFilter === 'overdue' 
                  ? `2px solid ${theme.palette.error.main}` 
                  : '1px solid transparent',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${theme.palette.error.main}15, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  bgcolor: `${theme.palette.error.main}15`,
                  borderColor: theme.palette.error.main,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${theme.palette.error.main}30`,
                  '&::before': {
                    left: '100%',
                  },
                },
              }}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 60, sm: 75, md: 95 },
                height: { xs: 60, sm: 75, md: 95 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.error.main}20 0%, ${theme.palette.error.main}10 100%)`,
                border: `2px solid ${theme.palette.error.main}30`,
                flexShrink: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: `0 4px 12px ${theme.palette.error.main}40`,
                },
              }}>
                <Warning sx={{ 
                  color: theme.palette.error.main, 
                  fontSize: { xs: 35, sm: 45, md: 60 },
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }, fontWeight: 400, lineHeight: 1.4 }}>
                  Vencidas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' }, lineHeight: 1.2 }}>
                  {overdueTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Vencen hoy */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'dueToday' ? null : 'dueToday')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2, sm: 3, md: 4 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 1, sm: 1 },
                borderRadius: 2,
                bgcolor: activeFilter === 'dueToday' ? `${taxiMonterricoColors.orange}10` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: activeFilter === 'dueToday' 
                  ? `2px solid ${taxiMonterricoColors.orange}` 
                  : '1px solid transparent',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${taxiMonterricoColors.orange}15, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.orange}15`,
                  borderColor: taxiMonterricoColors.orange,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.orange}30`,
                  '&::before': {
                    left: '100%',
                  },
                },
              }}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 60, sm: 75, md: 95 },
                height: { xs: 60, sm: 75, md: 95 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${taxiMonterricoColors.orange}20 0%, ${taxiMonterricoColors.orange}10 100%)`,
                border: `2px solid ${taxiMonterricoColors.orange}30`,
                flexShrink: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.orange}40`,
                },
              }}>
                <Schedule sx={{ 
                  color: taxiMonterricoColors.orange, 
                  fontSize: { xs: 35, sm: 45, md: 60 },
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }, fontWeight: 400, lineHeight: 1.4 }}>
                  Vencen hoy
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' }, lineHeight: 1.2 }}>
                  {dueTodayTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Pendientes */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'pending' ? null : 'pending')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2, sm: 3, md: 4 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 1, sm: 1 },
                borderRadius: 2,
                bgcolor: activeFilter === 'pending' ? `${theme.palette.warning.main}10` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: activeFilter === 'pending' 
                  ? `2px solid ${theme.palette.warning.main}` 
                  : '1px solid transparent',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${theme.palette.warning.main}15, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  bgcolor: `${theme.palette.warning.main}15`,
                  borderColor: theme.palette.warning.main,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${theme.palette.warning.main}30`,
                  '&::before': {
                    left: '100%',
                  },
                },
              }}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 60, sm: 75, md: 95 },
                height: { xs: 60, sm: 75, md: 95 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.warning.main}20 0%, ${theme.palette.warning.main}10 100%)`,
                border: `2px solid ${theme.palette.warning.main}30`,
                flexShrink: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: `0 4px 12px ${theme.palette.warning.main}40`,
                },
              }}>
                <PendingActions sx={{ 
                  color: theme.palette.warning.main, 
                  fontSize: { xs: 35, sm: 45, md: 60 },
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }, fontWeight: 400, lineHeight: 1.4 }}>
                  Pendientes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' }, lineHeight: 1.2 }}>
                  {pendingTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Completadas */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'completed' ? null : 'completed')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2, sm: 3, md: 4 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 1, sm: 1 },
                borderRadius: 2,
                bgcolor: activeFilter === 'completed' ? `${taxiMonterricoColors.green}10` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: activeFilter === 'completed' 
                  ? `2px solid ${taxiMonterricoColors.green}` 
                  : '1px solid transparent',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${taxiMonterricoColors.green}15, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.green}15`,
                  borderColor: taxiMonterricoColors.green,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                  '&::before': {
                    left: '100%',
                  },
                },
              }}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 60, sm: 75, md: 95 },
                height: { xs: 60, sm: 75, md: 95 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green}20 0%, ${taxiMonterricoColors.green}10 100%)`,
                border: `2px solid ${taxiMonterricoColors.green}30`,
                flexShrink: 0,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}40`,
                },
              }}>
                <CheckCircle sx={{ 
                  color: taxiMonterricoColors.green, 
                  fontSize: { xs: 35, sm: 45, md: 60 },
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }, fontWeight: 400, lineHeight: 1.4 }}>
                  Completadas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' }, lineHeight: 1.2 }}>
                  {completedTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sección de tabla */}
      <UnifiedTable
        title="Tareas"
        actions={
          <>
            <Tooltip title="Actualizar tareas">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  border: `1.5px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  color: theme.palette.text.secondary,
                  p: { xs: 0.75, sm: 0.875 },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(16, 185, 129, 0.05)',
                    color: taxiMonterricoColors.green,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
                  },
                }}
              >
                <Refresh sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }} />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Buscar tareas..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                InputProps={{
                  startAdornment: <Search sx={{ 
                    mr: 2.5, 
                    color: theme.palette.text.secondary, 
                    fontSize: 20,
                    transition: 'color 0.3s ease',
                  }} />,
                }}
                sx={{ 
                  minWidth: 200,
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                    borderWidth: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: `${taxiMonterricoColors.greenLight} !important`,
                      boxShadow: `0 0 0 2px ${taxiMonterricoColors.greenLight}30`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: `${taxiMonterricoColors.green} !important`,
                      boxShadow: `0 0 0 3px ${taxiMonterricoColors.greenLight}30`,
                    },
                    '& input::placeholder': {
                      fontSize: '0.875rem',
                      opacity: 0.7,
                    },
                  },
                  '&:hover .MuiInputAdornment-root .MuiSvgIcon-root': {
                    color: taxiMonterricoColors.greenLight,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root': {
                    color: taxiMonterricoColors.green,
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  id="tasks-sort-select"
                  name="tasks-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 2,
                    borderWidth: 2,
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: `${taxiMonterricoColors.greenLight} !important`,
                      boxShadow: `0 0 0 2px ${taxiMonterricoColors.greenLight}30`,
                    },
                    '&.Mui-focused': {
                      borderColor: `${taxiMonterricoColors.green} !important`,
                      boxShadow: `0 0 0 3px ${taxiMonterricoColors.greenLight}30`,
                    },
                    '& .MuiSelect-icon': {
                      color: taxiMonterricoColors.green,
                    },
                  }}
                >
                  <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                  <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                </Select>
              </FormControl>
              {totalTasks > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                    {totalTasks} {totalTasks === 1 ? 'tarea' : 'tareas'}
                  </Typography>
                </Box>
              )}
              <Tooltip title="Crear nueva tarea" arrow>
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  onClick={() => handleOpen()}
                  sx={{
                    background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
                    color: 'white',
                    borderRadius: 2,
                    px: 3,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}40`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      transition: 'left 0.5s ease',
                    },
                    '&:hover': {
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: `0 8px 20px ${taxiMonterricoColors.greenLight}60`,
                      background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`,
                      '&::before': {
                        left: '100%',
                      },
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(1)',
                    },
                  }}
                >
                  Nueva Tarea
                </Button>
              </Tooltip>
            </Box>
          </>
        }
        header={<Box />}
        rows={
          <>
            {/* Barra de filtros activos */}
            {(filterStatus || filterPriority || filterType || activeFilter) && (
              <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FilterList sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  Filtros activos:
                </Typography>
                {activeFilter && (
                  <Chip
                    label={activeFilter === 'overdue' ? 'Vencidas' : activeFilter === 'dueToday' ? 'Vencen hoy' : activeFilter === 'pending' ? 'Pendientes' : 'Completadas'}
                    size="small"
                    onDelete={() => {
                      setActiveFilter(null);
                      setFilterStatus('');
                      setCurrentPage(1);
                    }}
                    sx={{
                      bgcolor: taxiMonterricoColors.green,
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: 'white',
                      },
                    }}
                  />
                )}
                {filterStatus && !activeFilter && (
                  <Chip
                    label={`Estado: ${getStatusLabel(filterStatus)}`}
                    size="small"
                    onDelete={() => {
                      setFilterStatus('');
                      setCurrentPage(1);
                    }}
                    sx={{
                      bgcolor: `${getStatusColor(filterStatus)}20`,
                      color: getStatusColor(filterStatus),
                      borderColor: getStatusColor(filterStatus),
                      fontWeight: 600,
                    }}
                  />
                )}
                {filterPriority && (
                  <Chip
                    label={`Prioridad: ${getPriorityLabel(filterPriority)}`}
                    size="small"
                    onDelete={() => {
                      setFilterPriority('');
                      setCurrentPage(1);
                    }}
                    sx={{
                      bgcolor: filterPriority === 'urgent' || filterPriority === 'high'
                        ? '#FFEBEE'
                        : filterPriority === 'medium'
                        ? '#FFF3E0'
                        : '#E8F5E9',
                      color: filterPriority === 'urgent' || filterPriority === 'high'
                        ? '#C62828'
                        : filterPriority === 'medium'
                        ? '#E65100'
                        : '#2E7D32',
                      fontWeight: 600,
                    }}
                  />
                )}
                {filterType && (
                  <Chip
                    label={`Tipo: ${filterType}`}
                    size="small"
                    onDelete={() => {
                      setFilterType('');
                      setCurrentPage(1);
                    }}
                    sx={{
                      bgcolor: `${taxiMonterricoColors.green}20`,
                      color: taxiMonterricoColors.green,
                      borderColor: taxiMonterricoColors.green,
                      fontWeight: 600,
                    }}
                  />
                )}
                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={() => {
                    setFilterStatus('');
                    setFilterPriority('');
                    setFilterType('');
                    setActiveFilter(null);
                    setCurrentPage(1);
                  }}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  Limpiar filtros
                </Button>
              </Box>
            )}
            <Box sx={{ px: 0, pb: 0, width: '100%', overflow: 'hidden' }}>
              <TableContainer 
                component={Paper}
                sx={{ 
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  maxWidth: '100%',
                  width: '100%',
                  borderRadius: 0,
                  border: 'none',
                  boxShadow: 'none',
                  '& .MuiPaper-root': {
                    borderRadius: 0,
                    border: 'none',
                    boxShadow: 'none',
                    width: '100%',
                  },
                  '& .MuiTable-root': {
                    width: '100%',
                  },
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#888',
                    borderRadius: 4,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#555',
                    },
                  },
                }}
              >
          <Table sx={{ minWidth: { xs: 800, md: 'auto' }, width: '100%', tableLayout: 'auto' }}>
            <TableHead>
              <TableRow sx={{ 
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)`,
                overflow: 'hidden',
                width: '100%',
                display: 'table-row',
                borderBottom: `2px solid ${taxiMonterricoColors.greenLight}`,
                '& .MuiTableCell-head': {
                  borderBottom: 'none',
                  fontWeight: 700,
                  bgcolor: 'transparent',
                  background: `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)`,
                },
                '& .MuiTableCell-head:first-of-type': {
                  borderTopLeftRadius: 0,
                },
                '& .MuiTableCell-head:last-of-type': {
                  borderTopRightRadius: 0,
                  pr: 0,
                },
              }}>
                <TableCell 
                  onClick={() => handleSort('title')}
                  sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    py: { xs: 1.5, md: 2 }, 
                    pl: { xs: 2, md: 3 }, 
                    pr: 1, 
                    minWidth: { xs: 200, md: 250 }, 
                    width: { xs: 'auto', md: '30%' },
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Nombre de la Tarea
                    {sortColumn === 'title' && (
                      <Box component="span" sx={{ fontSize: '0.7rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('type')}
                  sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    py: { xs: 1.5, md: 2 }, 
                    px: 1, 
                    minWidth: { xs: 100, md: 120 }, 
                    width: { xs: 'auto', md: '15%' },
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Tipo
                    {sortColumn === 'type' && (
                      <Box component="span" sx={{ fontSize: '0.7rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('priority')}
                  sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    py: { xs: 1.5, md: 2 }, 
                    px: { xs: 1, md: 1.5 }, 
                    minWidth: { xs: 100, md: 120 }, 
                    width: { xs: 'auto', md: '12%' },
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Prioridad
                    {sortColumn === 'priority' && (
                      <Box component="span" sx={{ fontSize: '0.7rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('dueDate')}
                  sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    py: { xs: 1.5, md: 2 }, 
                    px: { xs: 1, md: 1.5 }, 
                    minWidth: { xs: 120, md: 150 }, 
                    width: { xs: 'auto', md: '15%' },
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Fecha de Vencimiento
                    {sortColumn === 'dueDate' && (
                      <Box component="span" sx={{ fontSize: '0.7rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 2 }, 
                  px: { xs: 1, md: 1.5 }, 
                  minWidth: { xs: 120, md: 150 }, 
                  width: { xs: 'auto', md: '13%' },
                  bgcolor: 'transparent',
                  background: `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)`,
                }}>
                  Asignado a
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 2 }, 
                  pl: 1,
                  pr: 0,
                  width: { xs: 100, md: 120 }, 
                  minWidth: { xs: 100, md: 120 },
                  bgcolor: 'transparent',
                  background: `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pr: { xs: 2, md: 3 } }}>
                    Acciones
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', border: 'none' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '64px',
                          lineHeight: 1,
                        }}
                      >
                        📋
                      </Box>
                      <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: '#000000',
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                          }}
                        >
                          No hay tareas registradas
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#000000',
                            lineHeight: 1.6,
                            fontSize: { xs: '0.875rem', md: '0.9375rem' },
                          }}
                        >
                          {tasks.length === 0 && !loading
                            ? 'Crea tu primera tarea para comenzar a organizar tu trabajo de manera eficiente.'
                            : 'No se encontraron tareas que coincidan con tu búsqueda.'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                <TableRow 
                  key={task.id}
                  hover
                  onClick={() => handlePreview(task)}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#fafafa',
                      transform: 'scale(1.001)',
                    },
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    opacity: task.status === 'completed' ? 0.7 : 1,
                  }}
                >
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '30%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: { xs: 32, md: 40 },
                            height: { xs: 32, md: 40 },
                            bgcolor: task.status === 'completed' 
                              ? theme.palette.success.main 
                              : taxiMonterricoColors.green,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            fontWeight: 600,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle sx={{ fontSize: { xs: 20, md: 24 }, color: 'white' }} />
                          ) : (
                            getInitials(task.title || task.subject || '')
                          )}
                        </Avatar>
                        {task.status !== 'completed' && (
                          <Tooltip title="Marcar como completada">
                            <IconButton
                              size="small"
                              onClick={(e) => handleQuickComplete(task, e)}
                              disabled={completingTask === task.id}
                              sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                bgcolor: theme.palette.background.paper,
                                border: `2px solid ${taxiMonterricoColors.green}`,
                                width: 20,
                                height: 20,
                                p: 0,
                                '&:hover': {
                                  bgcolor: taxiMonterricoColors.green,
                                  '& .MuiSvgIcon-root': {
                                    color: 'white',
                                  },
                                },
                              }}
                            >
                              <CheckCircleOutline sx={{ fontSize: 12, color: taxiMonterricoColors.green }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500, 
                            color: theme.palette.text.primary,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            mb: 0.5,
                          }}
                        >
                          {task.title || task.subject}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip
                            label={getStatusLabel(task.status)}
                            size="small"
                            variant={filterStatus === task.status ? "filled" : "outlined"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterByStatus(task.status);
                            }}
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              bgcolor: filterStatus === task.status
                                ? `${getStatusColor(task.status)}20`
                                : (task.status === 'completed' 
                                  ? `${taxiMonterricoColors.green}10`
                                  : task.status === 'in progress'
                                  ? '#E3F2FD'
                                  : '#FFF3E0'),
                              borderColor: filterStatus === task.status
                                ? getStatusColor(task.status)
                                : theme.palette.divider,
                              color: filterStatus === task.status
                                ? getStatusColor(task.status)
                                : (task.status === 'completed'
                                  ? taxiMonterricoColors.green
                                  : task.status === 'in progress'
                                  ? '#2196F3'
                                  : theme.palette.warning.main),
                              '&:hover': {
                                transform: 'scale(1.05)',
                                borderColor: getStatusColor(task.status),
                                color: getStatusColor(task.status),
                                bgcolor: `${getStatusColor(task.status)}15`,
                                boxShadow: 1,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                      <Tooltip title="Ver detalles completos">
                        <IconButton
                          size="small"
                          onClick={(e) => handleNavigateToTask(task, e)}
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(91, 228, 155, 0.1)' 
                                : 'rgba(91, 228, 155, 0.08)',
                            },
                            [`${TableRow}:hover &`]: {
                              opacity: 1,
                            },
                          }}
                        >
                          <Launch sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    <Chip
                      label={task.type}
                      size="small"
                      variant={filterType === task.type ? "filled" : "outlined"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterByType(task.type);
                      }}
                      sx={{
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 20, md: 24 },
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        bgcolor: filterType === task.type 
                          ? `${taxiMonterricoColors.green}20` 
                          : 'transparent',
                        borderColor: filterType === task.type 
                          ? taxiMonterricoColors.green 
                          : theme.palette.divider,
                        color: filterType === task.type 
                          ? taxiMonterricoColors.green 
                          : theme.palette.text.primary,
                        '&:hover': {
                          transform: 'scale(1.05)',
                          borderColor: taxiMonterricoColors.green,
                          color: taxiMonterricoColors.green,
                          bgcolor: `${taxiMonterricoColors.green}15`,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      size="small"
                      variant={filterPriority === task.priority ? "filled" : "filled"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterByPriority(task.priority);
                      }}
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 20, md: 24 },
                        bgcolor: filterPriority === task.priority
                          ? (task.priority === 'urgent' || task.priority === 'high'
                            ? '#C62828'
                            : task.priority === 'medium'
                            ? '#E65100'
                            : '#2E7D32')
                          : (task.priority === 'urgent' || task.priority === 'high'
                            ? '#FFEBEE'
                            : task.priority === 'medium'
                            ? '#FFF3E0'
                            : '#E8F5E9'),
                        color: filterPriority === task.priority
                          ? 'white'
                          : (task.priority === 'urgent' || task.priority === 'high'
                            ? '#C62828'
                            : task.priority === 'medium'
                            ? '#E65100'
                            : '#2E7D32'),
                        border: filterPriority === task.priority 
                          ? `2px solid ${task.priority === 'urgent' || task.priority === 'high' ? '#C62828' : task.priority === 'medium' ? '#E65100' : '#2E7D32'}`
                          : 'none',
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: filterPriority === task.priority ? 3 : 0,
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 2,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                    {task.dueDate ? (
                      <Tooltip 
                        title={new Date(task.dueDate).toLocaleString('es-ES', { 
                          dateStyle: 'full', 
                          timeStyle: 'short' 
                        })}
                        arrow
                      >
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              fontWeight: 500,
                            }}
                          >
                            {new Date(task.dueDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                          {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                            <Chip
                              label="Vencida"
                              size="small"
                              sx={{ 
                                mt: 0.5,
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: '#ffebee',
                                color: '#d32f2f',
                                fontWeight: 600,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%, 100%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                },
                              }}
                            />
                          )}
                          {new Date(task.dueDate).toDateString() === new Date().toDateString() && task.status !== 'completed' && (
                            <Chip
                              label="Hoy"
                              size="small"
                              sx={{ 
                                mt: 0.5,
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: '#fff3e0',
                                color: '#e65100',
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Sin fecha
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '13%' } }}>
                    {task.AssignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: taxiMonterricoColors.green,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          {task.AssignedTo.firstName?.[0]}{task.AssignedTo.lastName?.[0]}
                        </Avatar>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.primary, 
                            fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                        >
                          {task.AssignedTo.firstName} {task.AssignedTo.lastName}
                        </Typography>
                      </Box>
                    ) : task.User ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: taxiMonterricoColors.green,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          {task.User.firstName?.[0]}{task.User.lastName?.[0]}
                        </Avatar>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.primary, 
                            fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                        >
                          {task.User.firstName} {task.User.lastName}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Sin asignar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 }, pr: { xs: 2, md: 3 } }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Ver detalles completos">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToTask(task, e);
                          }}
                          sx={{
                            ...pageStyles.previewIconButton,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(91, 228, 155, 0.15)' 
                                : 'rgba(91, 228, 155, 0.12)',
                            },
                          }}
                        >
                          <Launch sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(task);
                          }}
                          sx={{
                            ...pageStyles.previewIconButton,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(25, 118, 210, 0.15)' 
                                : 'rgba(25, 118, 210, 0.12)',
                            },
                          }}
                        >
                          <Edit sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Vista previa rápida">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(task);
                          }}
                          sx={{
                            ...pageStyles.previewIconButton,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(91, 228, 155, 0.15)' 
                                : 'rgba(91, 228, 155, 0.12)',
                            },
                          }}
                        >
                          <Visibility sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id, task.isActivity);
                          }}
                          sx={{
                            ...pageStyles.deleteIcon,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(211, 47, 47, 0.15)' 
                                : 'rgba(211, 47, 47, 0.12)',
                            },
                          }}
                        >
                          <Delete sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {totalTasks > 0 && (
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: '0 0 6px 6px',
              boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
              borderTop: 'none',
              px: { xs: 2, md: 3 },
              py: { xs: 1, md: 1.5 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 1.5, md: 2 },
            }}
          >
            {/* Rows per page selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                Filas por página:
              </Typography>
              <Select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                size="small"
                sx={{
                  fontSize: '0.8125rem',
                  height: '32px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: taxiMonterricoColors.green,
                  },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={7}>7</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </Box>

            {/* Información de paginación y navegación */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                {startIndex + 1}-{endIndex} de {totalTasks}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  size="small"
                  sx={{
                    color: currentPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: currentPage === 1 ? 'transparent' : theme.palette.action.hover,
                    },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  size="small"
                  sx={{
                    color: currentPage === totalPages ? theme.palette.action.disabled : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: currentPage === totalPages ? 'transparent' : theme.palette.action.hover,
                    },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
            </Box>
          </>
        }
        pagination={null}
        emptyState={null}
      />

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>
          {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              label="Descripción"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="call">Llamada</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="meeting">Reunión</MenuItem>
              <MenuItem value="note">Nota</MenuItem>
              <MenuItem value="todo">Tarea</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </TextField>
            <TextField
              select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="not started">No Iniciada</MenuItem>
              <MenuItem value="in progress">En Progreso</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </TextField>
            <TextField
              select
              label="Prioridad"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
            </TextField>
            <TextField
              label="Fecha Límite"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            {users.length > 0 && (
              <TextField
                select
                label="Asignado a"
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                InputLabelProps={{ shrink: true }}
              >
                {users.map((userItem) => (
                  <MenuItem key={userItem.id} value={userItem.id.toString()}>
                    {userItem.firstName} {userItem.lastName}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: pageStyles.dialog
        }}
      >
        <DialogContent sx={pageStyles.dialogContent}>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            ¿Estás seguro de que deseas eliminar esta tarea?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Esta acción no se puede deshacer. La tarea será eliminada permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button 
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            sx={pageStyles.deleteButton}
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <Delete />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Entity Preview Drawer */}
      <EntityPreviewDrawer
        open={previewOpen}
        onClose={handleClosePreview}
        entityType="task"
        entityId={previewTask?.id || null}
        entityData={previewTask}
      />
    </Box>
  );
};

export default Tasks;




