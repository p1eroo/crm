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
  Menu,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  FormControl,
  Select,
  Tooltip,
  Paper,
  useTheme,
} from '@mui/material';
import { Add, Delete, Search, Schedule, PendingActions, Edit, ChevronLeft, ChevronRight, ArrowDropDown } from '@mui/icons-material';
import { RiFileWarningLine } from 'react-icons/ri';
import { IoMdCheckboxOutline } from 'react-icons/io';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import api from '../config/api';
import { taxiMonterricoColors, hexToRgba } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { FormDrawer } from '../components/FormDrawer';

library.add(far);

interface Task {
  id: number;
  title: string;
  subject?: string; // Para actividades
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  createdAt?: string; // Fecha de creación
  AssignedTo?: { firstName: string; lastName: string; avatar?: string | null };
  User?: { firstName: string; lastName: string; avatar?: string | null }; // Para actividades
  isActivity?: boolean; // Flag para identificar si viene de actividades
}

const Tasks: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Estado local para el input
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    estimatedTime: '',
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
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ el: HTMLElement; taskId: number } | null>(null);
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState<{ el: HTMLElement; taskId: number } | null>(null);

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

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  // Calcular paginación desde el servidor
  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Resetear a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, search, sortBy]);

  // Función para obtener el label de prioridad en español
  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
    };
    return priorityMap[priority?.toLowerCase()] || priority;
  };

  // Función para obtener el label de estado en español
  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
    };
    return statusMap[status?.toLowerCase()] || status;
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

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
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
            break;
          case 'dueToday':
            // Filtrar por tareas de hoy (se manejará en el servidor)
            break;
          case 'pending':
            params.status = 'pending';
            break;
          case 'completed':
            params.status = 'completed';
            break;
        }
      }
      
      // Ordenamiento
      params.sortBy = sortBy;
      
      // Obtener tareas desde /tasks con paginación del servidor
      const tasksResponse = await api.get('/tasks', { params });
      let tasksData = tasksResponse.data.tasks || tasksResponse.data || [];
      
      // Filtrar por fecha de vencimiento de hoy si el filtro está activo
      if (activeFilter === 'dueToday') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tasksData = tasksData.filter((task: Task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      }
      
      // Filtrar por tareas vencidas si el filtro está activo
      if (activeFilter === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tasksData = tasksData.filter((task: Task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && task.status !== 'completed';
        });
      }
      
      const tasksFromTasks = tasksData.map((task: Task) => ({
        ...task,
        isActivity: false,
      }));

      // Por ahora, mantener solo tareas con paginación del servidor
      // Las actividades se pueden agregar después si es necesario
      setTasks(tasksFromTasks);
      setTotalTasks(tasksResponse.data.total || tasksFromTasks.length);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage, activeFilter, sortBy]);

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
        status: task.status,
        priority: task.priority,
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedTime: '',
        assignedToId: assignedToId ? assignedToId.toString() : (user?.id ? user.id.toString() : ''),
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        startDate: '',
        dueDate: '',
        estimatedTime: '',
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
            startDate: formData.startDate || undefined,
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

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    // Guardar el estado anterior para poder revertir en caso de error
    const previousStatus = task.status;
  
    // Actualización optimista: actualizar el estado local inmediatamente
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );
    setStatusMenuAnchor(null);
  
    // Actualizar en el servidor en segundo plano
    try {
      if (task.isActivity) {
        await api.put(`/activities/${taskId}`, {
          status: newStatus,
        });
      } else {
        await api.put(`/tasks/${taskId}`, {
          status: newStatus,
        });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revertir el cambio en caso de error
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, status: previousStatus } : t
        )
      );
      alert('Error al actualizar el estado de la tarea. Por favor, intenta nuevamente.');
    }
  };

  const handlePriorityChange = async (taskId: number, newPriority: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    // Guardar la prioridad anterior para poder revertir en caso de error
    const previousPriority = task.priority;
  
    // Actualización optimista: actualizar el estado local inmediatamente
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? { ...t, priority: newPriority } : t
      )
    );
    setPriorityMenuAnchor(null);
  
    // Actualizar en el servidor en segundo plano
    try {
      if (task.isActivity) {
        await api.put(`/activities/${taskId}`, {
          priority: newPriority,
        });
      } else {
        await api.put(`/tasks/${taskId}`, {
          priority: newPriority,
        });
      }
    } catch (error) {
      console.error('Error updating task priority:', error);
      // Revertir el cambio en caso de error
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, priority: previousPriority } : t
        )
      );
      alert('Error al actualizar la prioridad de la tarea. Por favor, intenta nuevamente.');
    }
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
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        mb: 2.5,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 24px rgba(0,0,0,0.4)' 
            : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
        },
      }}>
        <CardContent sx={{ 
          px: { xs: 1.5, sm: 2, md: 2 },
          pt: { xs: 1.5, sm: 2, md: 2 },
          pb: { xs: 1, sm: 1.25, md: 1.5 },
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          '&:last-child': {
            paddingBottom: { xs: 1, sm: 1.25, md: 1.5 },
          },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1.5, sm: 2 } }}>
            {/* Vencidas */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'overdue' ? null : 'overdue')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
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
                width: { xs: 50, sm: 60, md: 70 },
                height: { xs: 50, sm: 60, md: 70 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.error.main}20 0%, ${theme.palette.error.main}10 100%)`,
                border: `2px solid ${theme.palette.error.main}30`,
                flexShrink: 0,
                fontSize: { xs: 28, sm: 36, md: 44 },
              }}>
                {React.createElement(RiFileWarningLine as any, { 
                  style: { color: theme.palette.error.main },
                })}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.25, fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' }, fontWeight: 400, lineHeight: 1.3 }}>
                  Vencidas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                  {overdueTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, display: { xs: 'none', sm: 'block' } }} />

            {/* Vencen hoy */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'dueToday' ? null : 'dueToday')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
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
                width: { xs: 50, sm: 60, md: 70 },
                height: { xs: 50, sm: 60, md: 70 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${taxiMonterricoColors.orange}20 0%, ${taxiMonterricoColors.orange}10 100%)`,
                border: `2px solid ${taxiMonterricoColors.orange}30`,
                flexShrink: 0,
              }}>
                <Schedule sx={{ 
                  color: taxiMonterricoColors.orange, 
                  fontSize: { xs: 28, sm: 36, md: 44 },
                }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.25, fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' }, fontWeight: 400, lineHeight: 1.3 }}>
                  Vencen hoy
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                  {dueTodayTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, display: { xs: 'none', sm: 'block' } }} />

            {/* Pendientes */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'pending' ? null : 'pending')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
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
                width: { xs: 50, sm: 60, md: 70 },
                height: { xs: 50, sm: 60, md: 70 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.warning.main}20 0%, ${theme.palette.warning.main}10 100%)`,
                border: `2px solid ${theme.palette.warning.main}30`,
                flexShrink: 0,
              }}>
                <PendingActions sx={{ 
                  color: theme.palette.warning.main, 
                  fontSize: { xs: 28, sm: 36, md: 44 },
                }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.25, fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' }, fontWeight: 400, lineHeight: 1.3 }}>
                  Pendientes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                  {pendingTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, display: { xs: 'none', sm: 'block' } }} />

            {/* Completadas */}
            <Box 
              onClick={() => setActiveFilter(activeFilter === 'completed' ? null : 'completed')}
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
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
                width: { xs: 50, sm: 60, md: 70 },
                height: { xs: 50, sm: 60, md: 70 },
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green}20 0%, ${taxiMonterricoColors.green}10 100%)`,
                border: `2px solid ${taxiMonterricoColors.green}30`,
                flexShrink: 0,
                fontSize: { xs: 28, sm: 36, md: 44 },
              }}>
                {React.createElement(IoMdCheckboxOutline as any, { 
                  style: { 
                    color: taxiMonterricoColors.green,
                  },
                })}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.25, fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' }, fontWeight: 400, lineHeight: 1.3 }}>
                  Completadas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                  {completedTasks.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sección de tabla */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 16px rgba(0,0,0,0.3)' 
          : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 24px rgba(0,0,0,0.4)' 
            : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
        },
      }}>
        <Box sx={{ 
          px: { xs: 2, md: 3 }, 
          pt: { xs: 2, md: 1.5 }, 
          pb: { xs: 1.5, md: 2 },
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          borderBottom: `2px solid ${theme.palette.divider}`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0, flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 2, sm: 0 } }}>
            <Box>
              <Typography 
                variant="h5" 
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Tareas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField
                size="small"
                placeholder="Buscar"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ 
                    mr: 1, 
                    color: theme.palette.text.secondary, 
                    fontSize: { xs: 18, sm: 20 },
                  }} />,
                }}
                sx={{ 
                  minWidth: { xs: '100%', sm: 150 },
                  maxWidth: { xs: '100%', sm: 180 },
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1.5,
                  order: { xs: 1, sm: 0 },
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                    '& input::placeholder': {
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      opacity: 0.7,
                    },
                  },
                }}
              />
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: '100%', sm: 130 },
                  order: { xs: 2, sm: 0 },
                }}
              >
                <Select
                  id="tasks-sort-select"
                  name="tasks-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                  }}
                >
                  <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                  <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Nueva Tarea" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleOpen()}
                  sx={{
                    background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                    color: "white",
                    borderRadius: 1.5,
                    p: { xs: 0.75, sm: 0.875 },
                    boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    order: { xs: 3, sm: 0 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      transition: 'left 0.5s ease',
                    },
                    '&:hover': {
                      transform: 'translateY(-2px) scale(1.05)',
                      boxShadow: `0 8px 20px ${taxiMonterricoColors.green}50`,
                      background: `linear-gradient(135deg, ${taxiMonterricoColors.greenLight} 0%, ${taxiMonterricoColors.green} 100%)`,
                      '&::before': {
                        left: '100%',
                      },
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(1)',
                    },
                  }}
                >
                  <Add sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <TableContainer 
          component={Paper}
          sx={{ 
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            borderRadius: 0,
            border: 'none',
            boxShadow: 'none',
            paddingRight: 0,
            '& .MuiPaper-root': {
              borderRadius: 0,
              border: 'none',
              boxShadow: 'none',
              paddingRight: 0,
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined,
            },
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined,
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.grey[500],
              borderRadius: 4,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[600],
              },
            },
          }}
        >
          <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: theme.palette.mode === 'dark'
                  ? '#1c252e'
                  : hexToRgba(taxiMonterricoColors.greenEmerald, 0.01),
                borderBottom: `2px solid ${theme.palette.divider}`,
                '& .MuiTableCell-head': {
                  borderBottom: 'none',
                  fontWeight: 600,
                  bgcolor: 'transparent',
                },
              }}>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 2, md: 3 }, 
                  pr: { xs: 0.5, md: 1 }, 
                  minWidth: { xs: 180, md: 200 }, 
                  width: { xs: 'auto', md: '22%' },
                  bgcolor: 'transparent'
                }}>
                  Nombre
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1, md: 1.5 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  minWidth: { xs: 100, md: 120 }, 
                  width: { xs: 'auto', md: '14%' },
                  bgcolor: 'transparent'
                }}>
                  Estado
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  px: { xs: 1.5, md: 2 }, 
                  minWidth: { xs: 120, md: 150 }, 
                  width: { xs: 'auto', md: '14%' },
                  bgcolor: 'transparent'
                }}>
                  Fecha de inicio
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  minWidth: { xs: 140, md: 170 }, 
                  width: { xs: 'auto', md: '15%' },
                  bgcolor: 'transparent'
                }}>
                  Fecha de Vencimiento
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 3, md: 4 }, 
                  minWidth: { xs: 100, md: 120 }, 
                  width: { xs: 'auto', md: '10%' },
                  bgcolor: 'transparent'
                }}>
                  Asignado a
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 4, md: 5 }, 
                  pr: { xs: 0.5, md: 1 }, 
                  minWidth: { xs: 100, md: 120 }, 
                  width: { xs: 'auto', md: '13%' },
                  bgcolor: 'transparent'
                }}>
                  Prioridad
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 5, md: 6 },
                  pr: { xs: 0.5, md: 1 },
                  width: { xs: 100, md: 120 }, 
                  minWidth: { xs: 100, md: 120 },
                  bgcolor: 'transparent'
                }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', border: 'none' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : theme.palette.grey[100],
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
                            color: theme.palette.text.primary,
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                          }}
                        >
                          No hay tareas registradas
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.primary,
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
                tasks.map((task, index) => (
                <TableRow 
                  key={task.id}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    borderBottom: theme.palette.mode === 'light' 
                      ? '1px solid rgba(0, 0, 0, 0.08)' 
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiTableCell-root': {
                      borderBottom: 'none',
                    },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? 'inset 0 0 0 9999px rgba(255, 255, 255, 0.015)'
                        : 'inset 0 0 0 9999px rgba(0, 0, 0, 0.012)',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'transparent !important',
                    },
                    '&.Mui-selected:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? 'inset 0 0 0 9999px rgba(255, 255, 255, 0.015)'
                        : 'inset 0 0 0 9999px rgba(0, 0, 0, 0.012)',
                    },
                  }}
                >
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: { xs: 0.5, md: 1 }, minWidth: { xs: 180, md: 200 }, width: { xs: 'auto', md: '22%' } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title || task.subject}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1, md: 1.5 }, pr: { xs: 1.5, md: 2 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '14%' } }}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusMenuAnchor({ el: e.currentTarget, taskId: task.id });
                      }}
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      <Typography
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', md: '0.8125rem' },
                          color: task.status === 'completed'
                            ? '#10B981'
                            : task.status === 'in progress'
                            ? '#8B5CF6'
                            : task.status === 'pending'
                            ? '#EF4444'
                            : task.status === 'cancelled'
                            ? theme.palette.text.secondary
                            : theme.palette.warning.main,
                        }}
                      >
                        {getStatusLabel(task.status)}
                      </Typography>
                      <ArrowDropDown 
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: task.status === 'completed'
                            ? '#10B981'
                            : task.status === 'in progress'
                            ? '#8B5CF6'
                            : task.status === 'pending'
                            ? '#EF4444'
                            : task.status === 'cancelled'
                            ? theme.palette.text.secondary
                            : theme.palette.warning.main,
                        }} 
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1.5, md: 2 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '14%' } }}>
                    {task.startDate ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary, 
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 500,
                        }}
                      >
                        {new Date(task.startDate).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    ) : task.createdAt ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary, 
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 500,
                        }}
                      >
                        {new Date(task.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Sin fecha
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 1.5, md: 2 }, minWidth: { xs: 140, md: 170 }, width: { xs: 'auto', md: '15%' } }}>
                    {task.dueDate ? (
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
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.error.main,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              display: 'block',
                              mt: 0.25
                            }}
                          >
                            Vencida
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Sin fecha
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 3, md: 4 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '10%' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      {task.AssignedTo ? (
                        <Tooltip 
                          title={`${task.AssignedTo.firstName} ${task.AssignedTo.lastName}`}
                          arrow
                        >
                          <Box sx={{ display: 'inline-block' }}>
                            <UserAvatar
                              firstName={task.AssignedTo.firstName}
                              lastName={task.AssignedTo.lastName}
                              avatar={task.AssignedTo.avatar}
                              sx={{
                                width: { xs: 28, md: 32 },
                                height: { xs: 28, md: 32 },
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                flexShrink: 0,
                                cursor: 'pointer',
                              }}
                            />
                          </Box>
                        </Tooltip>
                      ) : task.User ? (
                        <Tooltip 
                          title={`${task.User.firstName} ${task.User.lastName}`}
                          arrow
                        >
                          <Box sx={{ display: 'inline-block' }}>
                            <UserAvatar
                              firstName={task.User.firstName}
                              lastName={task.User.lastName}
                              avatar={task.User.avatar}
                              sx={{
                                width: { xs: 28, md: 32 },
                                height: { xs: 28, md: 32 },
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                flexShrink: 0,
                                cursor: 'pointer',
                              }}
                            />
                          </Box>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          --
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 4, md: 5 }, pr: { xs: 0.5, md: 1 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '13%' } }}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        setPriorityMenuAnchor({ el: e.currentTarget, taskId: task.id });
                      }}
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      <Typography
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', md: '0.8125rem' },
                          color: task.priority === 'high'
                            ? theme.palette.error.main
                            : task.priority === 'medium'
                            ? taxiMonterricoColors.orangeDark
                            : taxiMonterricoColors.green,
                        }}
                      >
                        {getPriorityLabel(task.priority)}
                      </Typography>
                      <ArrowDropDown 
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: task.priority === 'high'
                            ? theme.palette.error.main
                            : task.priority === 'medium'
                            ? taxiMonterricoColors.orangeDark
                            : taxiMonterricoColors.green,
                        }} 
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 5, md: 6 }, pr: { xs: 0.5, md: 1 }, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'flex-start' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(task);
                          }}
                          sx={{
                            color: theme.palette.text.secondary,
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: taxiMonterricoColors.green,
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                          }}
                        >
                          <Edit sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id, task.isActivity);
                          }}
                          sx={pageStyles.deleteIcon}
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
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
      </Card>

      {/* Panel deslizable para Nueva/Editar Tarea */}
      <FormDrawer
        open={open}
        onClose={handleClose}
        title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        onSubmit={handleSubmit}
        submitLabel={editingTask ? 'Actualizar' : 'Crear'}
        variant="panel"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: 'auto auto',
                  columnGap: 4,
                  rowGap: 1,
                  alignItems: 'start',
                }}
              >
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>Título <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>Fecha de inicio</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    fullWidth
                    placeholder="Título"
                    inputProps={{ style: { fontSize: '1rem' } }}
                    InputProps={{ sx: { '& input': { py: 1.05 } } }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    inputProps={{ style: { fontSize: '1rem' } }}
                    InputProps={{ sx: { '& input': { py: 1.05 } } }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Hora estimada</Typography>
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Fecha Límite</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    type="time"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    fullWidth
                    inputProps={{ style: { fontSize: '1rem' } }}
                    InputProps={{ sx: { '& input': { py: 1.05 } } }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    inputProps={{ style: { fontSize: '1rem' } }}
                    InputProps={{ sx: { '& input': { py: 1.05 } } }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Estado</Typography>
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Prioridad</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    select
                    size="small"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    fullWidth
                    inputProps={{ style: { fontSize: '1rem' } }}
                    InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    SelectProps={{
                      MenuProps: {
                        sx: { zIndex: 1700 },
                        slotProps: { root: { sx: { zIndex: 1700 } } },
                        PaperProps: { sx: { zIndex: 1700 } },
                      },
                    }}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="in progress">En Progreso</MenuItem>
                    <MenuItem value="completed">Completada</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    select
                    size="small"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    fullWidth
                    inputProps={{ style: { fontSize: '1rem' } }}
                    InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    SelectProps={{
                      MenuProps: {
                        sx: { zIndex: 1700 },
                        slotProps: { root: { sx: { zIndex: 1700 } } },
                        PaperProps: { sx: { zIndex: 1700 } },
                      },
                    }}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </TextField>
                </Box>
                {users.length > 0 && (
                  <>
                    <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Asignado a</Typography>
                    <Box />
                    <Box sx={{ minWidth: 0 }}>
                      <TextField
                        select
                        size="small"
                        value={formData.assignedToId}
                        onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                        fullWidth
                        inputProps={{ style: { fontSize: '1rem' } }}
                        InputProps={{ sx: { '& input': { py: 1.05 } } }}
                        SelectProps={{
                        MenuProps: {
                          sx: { zIndex: 1700 },
                          slotProps: { root: { sx: { zIndex: 1700 } } },
                          PaperProps: { sx: { zIndex: 1700 } },
                        },
                      }}
                      >
                        {users.map((userItem) => (
                          <MenuItem key={userItem.id} value={userItem.id.toString()}>
                            {userItem.firstName} {userItem.lastName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                    <Box />
                  </>
                )}
                <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>Descripción</Typography>
                <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
                  <TextField
                    multiline
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    fullWidth
                    placeholder="Descripción"
                  />
                </Box>
              </Box>
            </Box>
      </FormDrawer>
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
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: theme.palette.common.white }} /> : <Delete />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menú de selección de estado */}
      <Menu
        anchorEl={statusMenuAnchor?.el || null}
        open={Boolean(statusMenuAnchor)}
        onClose={() => setStatusMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (statusMenuAnchor) {
              handleStatusChange(statusMenuAnchor.taskId, 'pending');
            }
          }}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : theme.palette.action.hover,
            },
          }}
        >
          Pendiente
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (statusMenuAnchor) {
              handleStatusChange(statusMenuAnchor.taskId, 'in progress');
            }
          }}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : theme.palette.action.hover,
            },
          }}
        >
          En Progreso
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (statusMenuAnchor) {
              handleStatusChange(statusMenuAnchor.taskId, 'completed');
            }
          }}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : theme.palette.action.hover,
            },
          }}
        >
          Completada
        </MenuItem>
      </Menu>

      {/* Menú de selección de prioridad */}
      <Menu
        anchorEl={priorityMenuAnchor?.el || null}
        open={Boolean(priorityMenuAnchor)}
        onClose={() => setPriorityMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (priorityMenuAnchor) {
              handlePriorityChange(priorityMenuAnchor.taskId, 'low');
            }
          }}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : theme.palette.action.hover,
            },
          }}
        >
          Baja
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (priorityMenuAnchor) {
              handlePriorityChange(priorityMenuAnchor.taskId, 'medium');
            }
          }}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : theme.palette.action.hover,
            },
          }}
        >
          Media
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (priorityMenuAnchor) {
              handlePriorityChange(priorityMenuAnchor.taskId, 'high');
            }
          }}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : theme.palette.action.hover,
            },
          }}
        >
          Alta
        </MenuItem>
      </Menu>

    </Box>
  );
};

export default Tasks;




