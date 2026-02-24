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
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import { Add, Schedule, PendingActions, ChevronLeft, ChevronRight, ArrowDropDown, CalendarToday } from '@mui/icons-material';
import { PencilLine, Eye, Trash } from 'lucide-react';
import { RiFileWarningLine } from 'react-icons/ri';
import { IoMdCheckboxOutline } from 'react-icons/io';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import api from '../config/api';
import { taxiMonterricoColors, hexToRgba } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { FormDrawer } from '../components/FormDrawer';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { useTaskCompleteFlow } from '../hooks/useTaskCompleteFlow';

library.add(far);

type TaskType = 'call' | 'email' | 'meeting' | 'note' | 'todo' | 'other';

interface Task {
  id: number;
  title: string;
  subject?: string; // Para actividades
  type?: TaskType;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  description?: string;
  companyId?: number;
  contactId?: number;
  dealId?: number;
  AssignedTo?: { firstName: string; lastName: string; avatar?: string | null };
  User?: { firstName: string; lastName: string; avatar?: string | null }; // Para actividades
  Company?: { id: number; name: string };
  Contact?: { id: number; firstName: string; lastName: string; email?: string };
  Deal?: { id: number; name: string };
  isActivity?: boolean;
}

const getTypeLabel = (type: string | undefined): string => {
  const map: Record<string, string> = {
    email: 'Correo',
    meeting: 'Reunión',
    call: 'Llamada',
    note: 'Nota',
    todo: 'Tarea',
    other: 'Otro',
  };
  return type ? (map[type] || type) : '—';
};

const Tasks: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search] = useState('');
  const [sortBy] = useState('newest');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'todo' as TaskType,
    status: 'pending',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    estimatedTime: '',
    assignedToId: '',
    companyId: '',
    contactId: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; isActivity?: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [totalTasks, setTotalTasks] = useState(0);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ el: HTMLElement; taskId: number } | null>(null);
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState<{ el: HTMLElement; taskId: number } | null>(null);
  const [companySearchInput, setCompanySearchInput] = useState('');
  const [contactSearchInput, setContactSearchInput] = useState('');
  const [linkedTaskLockCompanyContact, setLinkedTaskLockCompanyContact] = useState(false);
  const [linkedTaskContacts, setLinkedTaskContacts] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [contactAutocompleteOpen, setContactAutocompleteOpen] = useState(false);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<{
    titulo: string;
    tipo: string;
    estado: string;
    fechaInicio: string;
    fechaVencimiento: string;
    asignadoA: string;
    empresa: string;
    contacto: string;
    prioridad: string;
  }>({
    titulo: '',
    tipo: '',
    estado: '',
    fechaInicio: '',
    fechaVencimiento: '',
    asignadoA: '',
    empresa: '',
    contacto: '',
    prioridad: '',
  });
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);
  const [taskStats, setTaskStats] = useState({ overdue: 0, dueToday: 0, pending: 0, completed: 0 });
  const [taskDetailDrawerTaskId, setTaskDetailDrawerTaskId] = useState<number | null>(null);

  // Estadísticas totales para los cards (no dependen de la página actual)
  const overdueTasks = taskStats.overdue;
  const dueTodayTasks = taskStats.dueToday;
  const pendingTasks = taskStats.pending;
  const completedTasks = taskStats.completed;

  // Calcular paginación desde el servidor
  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);

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

  // Función para convertir texto de estado en español a valor en inglés para el backend
  const mapStatusToEnglish = (statusText: string): string | null => {
    const statusMap: { [key: string]: string } = {
      'pendiente': 'pending',
      'en progreso': 'in progress',
      'completada': 'completed',
      'cancelada': 'cancelled',
    };
    const normalized = statusText.toLowerCase().trim();
    return statusMap[normalized] || null;
  };

  // Función para convertir texto de prioridad en español a valor en inglés para el backend
  const mapPriorityToEnglish = (priorityText: string): string | null => {
    const priorityMap: { [key: string]: string } = {
      'baja': 'low',
      'media': 'medium',
      'alta': 'high',
      'urgente': 'urgent',
    };
    const normalized = priorityText.toLowerCase().trim();
    return priorityMap[normalized] || null;
  };

  const fetchUsers = useCallback(async () => {
    try {
      // Solo usuarios admin pueden ver la lista completa de usuarios
      if (user?.role === 'admin') {
        const response = await api.get('/users', { params: { minimal: true } });
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

  const fetchCompaniesAndContacts = useCallback(async () => {
    try {
      const [companiesRes, contactsRes] = await Promise.all([
        api.get('/companies', { params: { limit: 1000 } }),
        api.get('/contacts', { params: { limit: 1000 } }),
      ]);
      setCompanies(companiesRes.data.companies || companiesRes.data || []);
      setContacts(contactsRes.data.contacts || contactsRes.data || []);
    } catch (error) {
      console.error('Error fetching companies/contacts:', error);
    }
  }, []);

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
      
      // Filtros por columna (tienen prioridad sobre activeFilter)
      if (debouncedColumnFilters.titulo) params.filterTitulo = debouncedColumnFilters.titulo;
      if (debouncedColumnFilters.estado) {
        // Intentar mapear de español a inglés, si no coincide usar el valor original
        const mappedStatus = mapStatusToEnglish(debouncedColumnFilters.estado);
        params.filterEstado = mappedStatus || debouncedColumnFilters.estado;
      }
      if (debouncedColumnFilters.prioridad) {
        // Intentar mapear de español a inglés, si no coincide usar el valor original
        const mappedPriority = mapPriorityToEnglish(debouncedColumnFilters.prioridad);
        params.filterPrioridad = mappedPriority || debouncedColumnFilters.prioridad;
      }
      if (debouncedColumnFilters.tipo) {
        const typeMap: Record<string, string> = {
          Correo: 'email',
          Reunión: 'meeting',
          Llamada: 'call',
          Nota: 'note',
          Tarea: 'todo',
          Otro: 'other',
        };
        params.filterTipo = typeMap[debouncedColumnFilters.tipo] || debouncedColumnFilters.tipo;
      }
      if (debouncedColumnFilters.fechaInicio) params.filterFechaInicio = debouncedColumnFilters.fechaInicio;
      if (debouncedColumnFilters.fechaVencimiento) params.filterFechaVencimiento = debouncedColumnFilters.fechaVencimiento;
      if (debouncedColumnFilters.asignadoA) params.filterAsignadoA = debouncedColumnFilters.asignadoA;
      if (debouncedColumnFilters.empresa) params.filterEmpresa = debouncedColumnFilters.empresa;
      if (debouncedColumnFilters.contacto) params.filterContacto = debouncedColumnFilters.contacto;

      // Filtro por categoría (activeFilter) - solo si no hay filtro de columna para estado
      if (activeFilter && !debouncedColumnFilters.estado) {
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
  }, [search, currentPage, itemsPerPage, activeFilter, sortBy, debouncedColumnFilters]);

  const fetchTaskStats = useCallback(async () => {
    try {
      const res = await api.get('/tasks', { params: { page: 1, limit: 10000 } });
      const allTasks = res.data.tasks || res.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setTaskStats({
        overdue: allTasks.filter((t: Task) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && t.status !== 'completed';
        }).length,
        dueToday: allTasks.filter((t: Task) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        }).length,
        pending: allTasks.filter((t: Task) => t.status === 'pending').length,
        completed: allTasks.filter((t: Task) => t.status === 'completed').length,
      });
    } catch (e) {
      console.error('Error fetching task stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchTaskStats();
  }, [fetchTaskStats]);

  const refreshTasks = useCallback(async () => {
    await fetchTasks();
    await fetchTaskStats();
  }, [fetchTasks, fetchTaskStats]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedColumnFilters(columnFilters), 500);
    return () => clearTimeout(timer);
  }, [columnFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [columnFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchCompaniesAndContacts();
  }, [fetchCompaniesAndContacts]);

  const getDescriptionWithoutCompletada = (desc: string) => {
    const s = (desc || '').replace(/\r\n/g, '\n');
    let idx = s.indexOf('\n\n--- Completada ---');
    if (idx >= 0) return s.slice(0, idx).trim();
    idx = s.indexOf('--- Completada ---');
    if (idx >= 0) return s.slice(0, idx).trim();
    return desc || '';
  };

  const getCompletadaSection = (desc: string) => {
    const s = (desc || '').replace(/\r\n/g, '\n');
    let idx = s.indexOf('\n\n--- Completada ---');
    if (idx >= 0) return s.slice(idx);
    idx = s.indexOf('--- Completada ---');
    if (idx >= 0) return s.slice(idx);
    return '';
  };

  const getCompletedDateAndTime = (desc: string) => {
    const completadaSection = getCompletadaSection(desc);
    if (!completadaSection) return { date: null, time: null, observations: '' };
    
    // Buscar el patrón "Completada el DD/MM/YYYY a las HH:MM" (permite espacios/saltos extra)
    const dateMatch = completadaSection.match(/Completada el (\d{1,2}\/\d{1,2}\/\d{4}) a las (\d{1,2}:\d{2})/);
    if (dateMatch) {
      const [, dateStr, timeStr] = dateMatch;
      // Convertir DD/MM/YYYY a Date object
      const [day, month, year] = dateStr.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Extraer observaciones (todo después de la línea de fecha/hora)
      const observationsStart = completadaSection.indexOf(dateMatch[0]) + dateMatch[0].length;
      const observations = completadaSection.slice(observationsStart).replace(/^[\r\n]+/, '').trim();
      
      return { date, time: timeStr, observations };
    }
    
    // Si no hay fecha/hora específica, extraer solo observaciones
    const observationsStart = completadaSection.indexOf('--- Completada ---') + '--- Completada ---'.length;
    const observations = completadaSection.slice(observationsStart).replace(/^[\r\n]+/, '').trim();
    
    return { date: null, time: null, observations };
  };

  const handleOpen = (task?: Task) => {
    setCompanySearchInput('');
    setContactSearchInput('');
    if (task) {
      setEditingTask(task);
      const fullDescription = (task as any).description || '';
      const description = getDescriptionWithoutCompletada(fullDescription);
      const assignedToId = (task as any).assignedToId || '';
      const companyId = (task as any).companyId;
      const contactId = (task as any).contactId;
      const dueDateStr = task.dueDate ? task.dueDate.split('T')[0] : '';
      const hasDueTime = task.dueDate && typeof task.dueDate === 'string' && task.dueDate.includes('T');
      const dueTimeForForm = hasDueTime ? (() => {
        const d = new Date(task.dueDate!);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })() : '';
      setFormData({
        title: task.title || task.subject || '',
        description: description,
        type: ((task as any).type as TaskType) || 'todo',
        status: task.status,
        priority: task.priority,
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: dueDateStr,
        estimatedTime: dueTimeForForm,
        assignedToId: assignedToId ? assignedToId.toString() : (user?.id ? user.id.toString() : ''),
        companyId: companyId != null ? companyId.toString() : '',
        contactId: contactId != null ? contactId.toString() : '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        type: 'todo',
        status: 'pending',
        priority: 'medium',
        startDate: '',
        dueDate: '',
        estimatedTime: '',
        assignedToId: user?.id ? user.id.toString() : '',
        companyId: '',
        contactId: '',
      });
    }
    setOpen(true);
  };

  const openNewTaskLinkedTo = (task: Task) => {
    setCompanySearchInput('');
    setContactSearchInput('');
    setEditingTask(null);
    setLinkedTaskContacts([]);
    // Obtener empresa/contacto desde IDs o desde las relaciones (por si el listado no devuelve los IDs)
    const companyId = (task as any).companyId ?? (task as any).Company?.id;
    const contactId = (task as any).contactId ?? (task as any).Contact?.id;
    const companyIdStr = companyId != null ? String(companyId) : '';
    const contactIdStr = contactId != null ? String(contactId) : '';
    // Asegurar que la empresa/contacto estén en las listas para que el Autocomplete los muestre
    if ((task as any).Company && companyIdStr) {
      setCompanies(prev => {
        const exists = prev.some(c => c.id === (task as any).Company?.id);
        if (exists) return prev;
        return [...prev, { id: (task as any).Company.id, name: (task as any).Company.name }];
      });
    }
    if ((task as any).Contact && contactIdStr) {
      const c = (task as any).Contact;
      setLinkedTaskContacts(prev => {
        const exists = prev.some(x => x.id === c?.id);
        if (exists) return prev;
        return [...prev, { id: c.id, firstName: c.firstName || '', lastName: c.lastName || '' }];
      });
    }
    setFormData({
      title: '',
      description: '',
      type: 'todo',
      status: 'pending',
      priority: 'medium',
      startDate: '',
      dueDate: '',
      estimatedTime: '',
      assignedToId: user?.id ? user.id.toString() : '',
      companyId: companyIdStr,
      contactId: contactIdStr,
    });
    setLinkedTaskLockCompanyContact(true);
    setOpen(true);
    // Cargar contactos de la empresa para el selector (solo id y nombre)
    if (companyIdStr) {
      api.get(`/companies/${companyIdStr}/contacts`)
        .then(res => {
          const list = res.data.contacts || res.data.Contacts || [];
          setLinkedTaskContacts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = list
              .filter((x: any) => !existingIds.has(x.id))
              .map((x: any) => ({ id: x.id, firstName: x.firstName || '', lastName: x.lastName || '' }));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        })
        .catch(() => {});
    }
  };

  const {
    openCompleteModal,
    openCompleteModalView,
    CompleteModalJSX,
    ActivityModalsJSX,
    LinkPromptJSX,
  } = useTaskCompleteFlow({
    user,
    onRefresh: refreshTasks,
    onOpenNewTaskLinkedTo: (t) => openNewTaskLinkedTo(t as Task),
  });

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
    setLinkedTaskLockCompanyContact(false);
    setLinkedTaskContacts([]);
    setContactAutocompleteOpen(false);
    setCompanySearchInput('');
    setContactSearchInput('');
  };

  const handleSubmit = async () => {
    try {
      const submitData: any = {
        ...formData,
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : (user?.id || undefined),
      };
      if (formData.companyId) submitData.companyId = parseInt(formData.companyId);
      else submitData.companyId = null;
      if (formData.contactId) submitData.contactId = parseInt(formData.contactId);
      else submitData.contactId = null;
      if (formData.dueDate) {
        // Incluir offset de zona horaria para que la fecha/hora se interprete correctamente (evitar desfase UTC)
        const tzOffset = -new Date().getTimezoneOffset();
        const tzSign = tzOffset >= 0 ? '+' : '-';
        const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
        const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
        const timePart = formData.estimatedTime ? `${formData.estimatedTime}:00` : '00:00:00';
        submitData.dueDate = `${formData.dueDate}T${timePart}${tzSign}${tzHours}:${tzMins}`;
      }

      if (editingTask) {
        const completadaSection = getCompletadaSection((editingTask as any).description || '');
        const descriptionToSave = completadaSection
          ? `${(formData.description || '').trim()}${(formData.description || '').trim() ? '\n\n' : ''}${completadaSection}`
          : formData.description;
        if (editingTask.isActivity) {
          await api.put(`/activities/${editingTask.id}`, {
            subject: formData.title,
            description: descriptionToSave,
            type: 'task',
            startDate: formData.startDate || undefined,
            dueDate: submitData.dueDate || formData.dueDate || undefined,
          });
        } else {
          await api.put(`/tasks/${editingTask.id}`, { ...submitData, description: descriptionToSave });
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

  const handleStatusChange = async (taskId: number, newStatus: string, extraPayload?: { description?: string }) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const previousStatus = task.status;

    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );
    setStatusMenuAnchor(null);

    try {
      if (task.isActivity) {
        await api.put(`/activities/${taskId}`, { status: newStatus });
      } else {
        await api.put(`/tasks/${taskId}`, { status: newStatus, ...extraPayload });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, status: previousStatus } : t
        )
      );
      alert('Error al actualizar el estado de la tarea. Por favor, intenta nuevamente.');
    }
  };

  const handleOpenCompleteModal = (task: Task) => {
    setStatusMenuAnchor(null);
    openCompleteModal(task);
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
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Cards de resumen */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: 'none',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        mb: 2.5,
        transition: 'all 0.3s ease',
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
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
                borderRadius: 2,
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
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
                borderRadius: 2,
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
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
                borderRadius: 2,
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
              sx={{ 
                flex: { xs: '1 1 calc(50% - 0.75px)', sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                px: { xs: 0.75, sm: 1 },
                py: { xs: 0.5, sm: 0.5 },
                borderRadius: 2,
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
        boxShadow: 'none',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
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
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '1.1375rem' },
                  color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
                }}
              >
                Tareas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <Button
                size="small"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                startIcon={<FontAwesomeIcon icon={faFilter} style={{ fontSize: 16 }} />}
                sx={{
                  border: 'none',
                  borderRadius: 1.5,
                  bgcolor: showColumnFilters
                    ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}14`)
                    : (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 152, 0, 0.08)'),
                  color: showColumnFilters ? taxiMonterricoColors.green : (theme.palette.mode === 'dark' ? '#FFB74D' : '#E65100'),
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  order: { xs: 2, sm: 0 },
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'transparent',
                    bgcolor: showColumnFilters
                      ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}33` : `${taxiMonterricoColors.green}1A`)
                      : (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.14)'),
                    color: showColumnFilters ? taxiMonterricoColors.green : (theme.palette.mode === 'dark' ? '#FFCC80' : '#EF6C00'),
                  },
                }}
              >
                Filtro
              </Button>
              <Button
                size="small"
                onClick={() => handleOpen()}
                startIcon={<Add sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                sx={{
                  bgcolor: '#13944C',
                  color: "white",
                  borderRadius: 1.5,
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  order: { xs: 3, sm: 0 },
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#0f7039',
                  },
                }}
              >
                Nueva tarea
              </Button>
            </Box>
          </Box>
        </Box>

        <TableContainer 
          component={Paper}
          sx={{ 
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            width: '100%',
            flex: 1,
            borderRadius: 1.5,
            border: 'none',
            boxShadow: 'none',
            paddingRight: 0,
            minWidth: 0,
            '& .MuiPaper-root': {
              borderRadius: 0,
              border: 'none',
              boxShadow: 'none',
              paddingRight: 0,
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
            },
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
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
          <Table sx={{ width: '100%', tableLayout: 'fixed', minWidth: 0 }}>
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
                  width: '12%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Nombre
                    </Box>
                    {showColumnFilters && (
                      <TextField
                        size="small"
                        placeholder="Filtrar..."
                        value={columnFilters.titulo}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, titulo: e.target.value }))}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.75rem', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper },
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1, md: 1.5 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '9%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Tipo
                    </Box>
                    {showColumnFilters && (
                      <FormControl size="small" fullWidth>
                        <Select
                          value={columnFilters.tipo || 'todos'}
                          onChange={(e) => {
                            const value = e.target.value === 'todos' ? '' : e.target.value;
                            setColumnFilters(prev => ({ ...prev, tipo: value }));
                          }}
                          displayEmpty
                          sx={{
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
                            '& .MuiSelect-select': { py: 0.5 },
                          }}
                        >
                          <MenuItem value="todos">Todos</MenuItem>
                          <MenuItem value="Correo">Correo</MenuItem>
                          <MenuItem value="Reunión">Reunión</MenuItem>
                          <MenuItem value="Llamada">Llamada</MenuItem>
                          <MenuItem value="Nota">Nota</MenuItem>
                          <MenuItem value="Tarea">Tarea</MenuItem>
                          <MenuItem value="Otro">Otro</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1, md: 1.5 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '10%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Estado
                    </Box>
                    {showColumnFilters && (
                      <FormControl size="small" fullWidth>
                        <Select
                          value={columnFilters.estado || 'todos'}
                          onChange={(e) => {
                            const value = e.target.value === 'todos' ? '' : e.target.value;
                            setColumnFilters(prev => ({ ...prev, estado: value }));
                            if (value) {
                              setActiveFilter(null);
                            }
                          }}
                          displayEmpty
                          sx={{
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
                            '& .MuiSelect-select': {
                              py: 0.5,
                            },
                          }}
                        >
                          <MenuItem value="todos">Todos</MenuItem>
                          <MenuItem value="Pendiente">Pendiente</MenuItem>
                          <MenuItem value="En Progreso">En Progreso</MenuItem>
                          <MenuItem value="Completada">Completada</MenuItem>
                          <MenuItem value="Cancelada">Cancelada</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  px: { xs: 1.5, md: 2 }, 
                  width: '10%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Fecha de inicio
                    </Box>
                    {showColumnFilters && (
                      <TextField
                        size="small"
                        type="date"
                        value={columnFilters.fechaInicio}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
                            '& input::-webkit-calendar-picker-indicator': {
                              filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '12%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Fecha de Vencimiento
                    </Box>
                    {showColumnFilters && (
                      <TextField
                        size="small"
                        type="date"
                        value={columnFilters.fechaVencimiento}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
                            '& input::-webkit-calendar-picker-indicator': {
                              filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '7%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Asignado a
                    </Box>
                    {showColumnFilters && (
                      <TextField
                        size="small"
                        placeholder="Filtrar..."
                        value={columnFilters.asignadoA}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, asignadoA: e.target.value }))}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.75rem', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper },
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '12%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Empresa
                    </Box>
                    {showColumnFilters && (
                      <TextField
                        size="small"
                        placeholder="Filtrar..."
                        value={columnFilters.empresa}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, empresa: e.target.value }))}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.75rem', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper },
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '11%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Contacto
                    </Box>
                    {showColumnFilters && (
                      <TextField
                        size="small"
                        placeholder="Filtrar..."
                        value={columnFilters.contacto}
                        onChange={(e) => setColumnFilters(prev => ({ ...prev, contacto: e.target.value }))}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.75rem', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper },
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 1.5, md: 2 }, 
                  pr: { xs: 1.5, md: 2 }, 
                  width: '8%',
                  minWidth: 0,
                  bgcolor: 'transparent',
                  verticalAlign: showColumnFilters ? 'top' : 'middle',
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Prioridad
                    </Box>
                    {showColumnFilters && (
                      <FormControl size="small" fullWidth>
                        <Select
                          value={columnFilters.prioridad || 'todos'}
                          onChange={(e) => {
                            const value = e.target.value === 'todos' ? '' : e.target.value;
                            setColumnFilters(prev => ({ ...prev, prioridad: value }));
                          }}
                          displayEmpty
                          sx={{
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
                            '& .MuiSelect-select': { py: 0.5 },
                          }}
                        >
                          <MenuItem value="todos">Todos</MenuItem>
                          <MenuItem value="Baja">Baja</MenuItem>
                          <MenuItem value="Media">Media</MenuItem>
                          <MenuItem value="Alta">Alta</MenuItem>
                          <MenuItem value="Urgente">Urgente</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                  py: { xs: 1.5, md: 1.25 }, 
                  pl: { xs: 2, md: 3 },
                  pr: { xs: 2, md: 3 },
                  width: '8%',
                  minWidth: 0,
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : hexToRgba(taxiMonterricoColors.greenEmerald, 0.01),
                  textAlign: 'center',
                }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa' }}>
                  <TableCell colSpan={10} sx={{ py: 8, textAlign: 'center', border: 'none', bgcolor: 'transparent' }}>
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
                          lineHeight: 1,
                        }}
                      >
                        <PendingActions sx={{ fontSize: 64, color: theme.palette.text.secondary }} />
                      </Box>
                      <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 1,
                            color: theme.palette.text.secondary,
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                          }}
                        >
                          No hay tareas registradas
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
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
                  onClick={() => setTaskDetailDrawerTaskId(task.id)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
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
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: { xs: 0.5, md: 1 }, width: '12%', minWidth: 0, overflow: 'hidden' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500, 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          color: taxiMonterricoColors.green,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {task.title || task.subject}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1, md: 1.5 }, pr: { xs: 1.5, md: 2 }, width: '9%', minWidth: 0, overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.84rem' }, fontWeight: 600, color: theme.palette.text.secondary }}>
                      {getTypeLabel((task as any).type)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1, md: 1.5 }, pr: { xs: 1.5, md: 2 }, width: '10%', minWidth: 0, overflow: 'hidden' }}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.status !== 'completed') {
                          setStatusMenuAnchor({ el: e.currentTarget, taskId: task.id });
                        }
                      }}
                      sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        cursor: task.status === 'completed' ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        px: 1,
                        py: 0.5,
                        borderRadius: 2.5,
                        bgcolor: task.status === 'completed'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : task.status === 'in progress'
                          ? 'rgba(139, 92, 246, 0.15)'
                          : task.status === 'pending'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : task.status === 'cancelled'
                          ? theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)'
                          : 'rgba(245, 158, 11, 0.15)',
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
                      {task.status !== 'completed' && (
                        <ArrowDropDown 
                          sx={{ 
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            color: task.status === 'in progress'
                              ? '#8B5CF6'
                              : task.status === 'pending'
                              ? '#EF4444'
                              : task.status === 'cancelled'
                              ? theme.palette.text.secondary
                              : theme.palette.warning.main,
                          }} 
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1.5, md: 2 }, width: '10%', minWidth: 0, overflow: 'hidden' }}>
                    {task.status === 'completed' ? (() => {
                      const taskDescription = (task as any).description || '';
                      const { date: completedDate } = getCompletedDateAndTime(taskDescription);
                      if (completedDate) {
                        return (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              fontWeight: 500,
                            }}
                          >
                            {completedDate.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                        );
                      }
                      return (
                        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Sin fecha
                        </Typography>
                      );
                    })() : task.startDate ? (
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
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 1.5, md: 2 }, width: '12%', minWidth: 0, overflow: 'hidden' }}>
                    {task.status === 'completed' ? (() => {
                      const taskDescription = (task as any).description || '';
                      const { date: completedDate } = getCompletedDateAndTime(taskDescription);
                      if (completedDate) {
                        return (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              fontWeight: 500,
                            }}
                          >
                            {completedDate.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                        );
                      }
                      return (
                        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Sin fecha
                        </Typography>
                      );
                    })() : task.dueDate ? (
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
                        {task.dueDate && typeof task.dueDate === 'string' && task.dueDate.includes('T') && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.7rem',
                              }}
                            >
                              {new Date(task.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.error.main,
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                }}
                              >
                                Vencida
                              </Typography>
                            )}
                          </Box>
                        )}
                        {task.dueDate && (!(typeof task.dueDate === 'string' && task.dueDate.includes('T'))) && new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
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
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 1.5, md: 2 }, width: '7%', minWidth: 0, overflow: 'hidden' }}>
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
                                border: 'none',
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
                                border: 'none',
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
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 1.5, md: 2 }, width: '9%', minWidth: 0, overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, color: task.Company?.name ? theme.palette.text.primary : theme.palette.text.disabled, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.Company?.name || ''}>
                      {task.Company?.name || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 1.5, md: 2 }, width: '11%', minWidth: 0, overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, color: task.Contact ? theme.palette.text.primary : theme.palette.text.disabled, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.Contact ? `${task.Contact.firstName} ${task.Contact.lastName}`.trim() : ''}>
                      {task.Contact ? `${task.Contact.firstName} ${task.Contact.lastName}`.trim() || '—' : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: { xs: 1.5, md: 2 }, pr: { xs: 1.5, md: 2 }, width: '8%', minWidth: 0, overflow: 'hidden' }}>
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
                            ? '#ff5252' // Rojo claro vibrante
                            : task.priority === 'medium'
                            ? '#ff9800' // Naranja claro vibrante
                            : '#4caf50', // Verde claro vibrante
                        }}
                      >
                        {getPriorityLabel(task.priority)}
                      </Typography>
                      <ArrowDropDown 
                        sx={{ 
                          fontSize: { xs: '0.875rem', md: '1rem' },
                          color: task.priority === 'high'
                            ? '#ff5252' // Rojo claro vibrante
                            : task.priority === 'medium'
                            ? '#ff9800' // Naranja claro vibrante
                            : '#4caf50', // Verde claro vibrante
                        }} 
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    pl: { xs: 2, md: 3 }, 
                    pr: { xs: 2, md: 3 }, 
                    width: '9%',
                    minWidth: 0,
                    textAlign: 'center',
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
                  }}>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(task);
                          }}
                          sx={pageStyles.actionButtonEdit(theme)}
                        >
                          <PencilLine size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={task.status === 'completed' ? 'Ver información de completada' : 'Disponible cuando la tarea esté completada'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={task.status !== 'completed'}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCompleteModalView(task);
                            }}
                            sx={{
                              ...(pageStyles.actionButtonView(theme) as object),
                              '&.Mui-disabled': {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(54, 130, 248, 0.35)' : 'rgba(54, 130, 248, 0.4)',
                                color: theme.palette.mode === 'dark' ? 'rgba(54, 130, 248, 0.45)' : 'rgba(54, 130, 248, 0.5)',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                              },
                            }}
                          >
                            <Eye size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id, task.isActivity);
                          }}
                          sx={pageStyles.actionButtonDelete(theme)}
                        >
                          <Trash size={18} />
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
              boxShadow: 'none',
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
                  columnGap: 4,
                  rowGap: 1,
                  alignItems: 'start',
                }}
              >
                {/* Fila 1: Título | Tipo */}
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500 }}>Título <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500 }}>Tipo</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    fullWidth
                    placeholder="Título"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderWidth: '2px',
                          borderColor: theme.palette.divider,
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.divider,
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '2px',
                          borderColor: theme.palette.divider,
                        },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    select
                    size="small"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                    fullWidth
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                      },
                    }}
                    SelectProps={{
                      MenuProps: {
                        sx: { zIndex: 1700 },
                        slotProps: { root: { sx: { zIndex: 1700 } } },
                        PaperProps: { sx: { zIndex: 1700 } },
                      },
                    }}
                  >
                    <MenuItem value="email">Correo</MenuItem>
                    <MenuItem value="meeting">Reunión</MenuItem>
                    <MenuItem value="call">Llamada</MenuItem>
                    <MenuItem value="note">Nota</MenuItem>
                    <MenuItem value="todo">Tarea</MenuItem>
                    <MenuItem value="other">Otro</MenuItem>
                  </TextField>
                </Box>
                {/* Fila 2: Fecha de inicio | Fecha Límite */}
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Fecha de inicio</Typography>
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Fecha Límite</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end" sx={{ pointerEvents: 'none', mr: 0.5 }}>
                          <CalendarToday sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                        '& input::-webkit-calendar-picker-indicator': { opacity: 0, position: 'absolute', right: 0, width: '100%', height: '100%', cursor: 'pointer' },
                      },
                    }}
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end" sx={{ pointerEvents: 'none', mr: 0.5 }}>
                          <CalendarToday sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                        '& input::-webkit-calendar-picker-indicator': { opacity: 0, position: 'absolute', right: 0, width: '100%', height: '100%', cursor: 'pointer' },
                      },
                    }}
                  />
                </Box>
                {/* Fila 3: Hora estimada | Estado */}
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Hora estimada</Typography>
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Estado</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    size="small"
                    type="time"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end" sx={{ pointerEvents: 'none', mr: 0.5 }}>
                          <Schedule sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                        '& input::-webkit-calendar-picker-indicator': { opacity: 0, position: 'absolute', right: 0, width: '100%', height: '100%', cursor: 'pointer' },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    select
                    size="small"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    fullWidth
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                      },
                    }}
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
                  </TextField>
                </Box>
                {/* Fila 4: Prioridad | Empresa */}
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Prioridad</Typography>
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Empresa</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <TextField
                    select
                    size="small"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    fullWidth
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                      },
                    }}
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
                <Box sx={{ minWidth: 0 }}>
                  {(editingTask || linkedTaskLockCompanyContact) && formData.companyId ? (
                    <TextField
                      size="small"
                      value={companies.find((c) => c.id === parseInt(formData.companyId || '0', 10))?.name || ''}
                      fullWidth
                      disabled
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                          '&:hover fieldset': { borderColor: theme.palette.divider },
                          '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                          '& .MuiInputBase-input': { py: 1 },
                        },
                      }}
                    />
                  ) : (
                    <Autocomplete
                      size="small"
                      options={companies}
                      getOptionLabel={(option) => option.name || ''}
                      value={companies.find((c) => c.id === parseInt(formData.companyId || '0', 10)) || null}
                      onChange={(_, newValue) => {
                        const companyId = newValue ? newValue.id.toString() : '';
                        setFormData({ 
                          ...formData, 
                          companyId, 
                          contactId: '' 
                        });
                        setCompanySearchInput('');
                        if (companyId) {
                          api.get(`/companies/${companyId}/contacts`)
                            .then(res => {
                              const list = res.data.contacts || res.data.Contacts || [];
                              setLinkedTaskContacts(list.map((x: any) => ({ id: x.id, firstName: x.firstName || '', lastName: x.lastName || '' })));
                            })
                            .catch(() => setLinkedTaskContacts([]));
                        } else {
                          setLinkedTaskContacts([]);
                        }
                      }}
                      onInputChange={(_, newInputValue, reason) => {
                        if (reason === 'reset') {
                          setCompanySearchInput('');
                        } else if (reason === 'input') {
                          const sel = companies.find((c) => c.id === parseInt(formData.companyId || '0', 10));
                          if (sel && newInputValue !== sel.name) {
                            setFormData({ ...formData, companyId: '', contactId: '' });
                            setLinkedTaskContacts([]);
                          }
                          setCompanySearchInput(newInputValue);
                        }
                      }}
                      inputValue={
                        (companies.find((c) => c.id === parseInt(formData.companyId || '0', 10)) || null)?.name
                          ?? companySearchInput
                      }
                      open={companySearchInput.length > 0 && companySearchInput.trim().length > 0}
                      openOnFocus={false}
                      onClose={() => setCompanySearchInput('')}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue || inputValue.trim().length === 0) return [];
                        const searchTerm = inputValue.toLowerCase().trim();
                        return options.filter((option) =>
                          option.name.toLowerCase().includes(searchTerm)
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Buscar empresa..."
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              borderRadius: 2,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                              '&:hover fieldset': { borderColor: theme.palette.divider },
                              '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                              '& .MuiInputBase-input': { py: 1 },
                            },
                          }}
                        />
                      )}
                      ListboxProps={{
                      sx: { maxHeight: 300 },
                    }}
                    slotProps={{
                      popper: {
                        sx: { zIndex: 1700 },
                      },
                    }}
                    noOptionsText={companySearchInput.trim().length > 0 ? "No se encontraron empresas" : null}
                    />
                  )}
                </Box>
                {/* Fila 5: Contacto | Asignado a */}
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Contacto</Typography>
                {users.length > 0 ? (
                  <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2 }}>Asignado a</Typography>
                ) : (
                  <Box />
                )}
                <Box sx={{ minWidth: 0 }}>
                  {editingTask && formData.contactId ? (
                    <TextField
                      size="small"
                      value={(() => {
                        const contact = contacts.find((c) => c.id === parseInt(formData.contactId || '0', 10));
                        return contact ? `${contact.firstName} ${contact.lastName}`.trim() : '';
                      })()}
                      fullWidth
                      disabled
                      InputProps={{
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                            '&:hover fieldset': { borderColor: theme.palette.divider },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                          },
                          '& .MuiInputBase-input': { py: 1 },
                        },
                      }}
                    />
                  ) : (
                  <Autocomplete
                    size="small"
                    options={formData.companyId ? linkedTaskContacts : contacts}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`.trim() || ''}
                    value={(formData.companyId ? linkedTaskContacts : contacts).find((c) => c.id === parseInt(formData.contactId || '0', 10)) || null}
                    onChange={(_, newValue) => {
                      setFormData({ 
                        ...formData, 
                        contactId: newValue ? newValue.id.toString() : '' 
                      });
                      setContactSearchInput('');
                    }}
                    onInputChange={(_, newInputValue, reason) => {
                      if (reason === 'reset') {
                        setContactSearchInput('');
                      } else if (reason === 'input') {
                        const list = formData.companyId ? linkedTaskContacts : contacts;
                        const sel = list.find((c) => c.id === parseInt(formData.contactId || '0', 10));
                        const selLabel = sel ? `${sel.firstName} ${sel.lastName}`.trim() : '';
                        if (sel && newInputValue !== selLabel) {
                          setFormData({ ...formData, contactId: '' });
                        }
                        setContactSearchInput(newInputValue);
                        if (!formData.companyId) {
                          setContactAutocompleteOpen(newInputValue.trim().length > 0);
                        }
                      }
                    }}
                    onFocus={() => {
                      if (formData.companyId) {
                        setContactAutocompleteOpen(true);
                        if (linkedTaskContacts.length === 0 && formData.companyId) {
                          api.get(`/companies/${formData.companyId}/contacts`)
                            .then(res => {
                              const list = res.data.contacts || res.data.Contacts || [];
                              setLinkedTaskContacts(list.map((x: any) => ({ id: x.id, firstName: x.firstName || '', lastName: x.lastName || '' })));
                            })
                            .catch(() => {});
                        }
                      }
                    }}
                    onOpen={() => setContactAutocompleteOpen(true)}
                    onClose={() => {
                      setContactAutocompleteOpen(false);
                      setContactSearchInput('');
                    }}
                    inputValue={
                      (() => {
                        const list = formData.companyId ? linkedTaskContacts : contacts;
                        const sel = list.find((c) => c.id === parseInt(formData.contactId || '0', 10));
                        return sel ? `${sel.firstName} ${sel.lastName}`.trim() : contactSearchInput;
                      })()
                    }
                    open={contactAutocompleteOpen}
                    openOnFocus={!!formData.companyId}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    filterOptions={(options, { inputValue }) => {
                      if (formData.companyId && (!inputValue || inputValue.trim().length === 0)) {
                        return options;
                      }
                      if (!inputValue || inputValue.trim().length === 0) return [];
                      const searchTerm = inputValue.toLowerCase().trim();
                      return options.filter((option) =>
                        `${option.firstName} ${option.lastName}`.toLowerCase().includes(searchTerm)
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={formData.companyId ? "Seleccionar contacto de la empresa..." : "Buscar contacto..."}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            borderRadius: 2,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                            '&:hover fieldset': { borderColor: theme.palette.divider },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                            '& .MuiInputBase-input': { py: 1 },
                          },
                        }}
                      />
                    )}
                    ListboxProps={{
                      sx: { maxHeight: 300 },
                    }}
                    slotProps={{
                      popper: {
                        sx: { zIndex: 1700 },
                      },
                    }}
                    noOptionsText={formData.companyId ? "No hay contactos en esta empresa" : (contactSearchInput.trim().length > 0 ? "No se encontraron contactos" : null)}
                  />
                  )}
                </Box>
                {users.length > 0 ? (
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      select
                      size="small"
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      fullWidth
                      InputProps={{
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                            '&:hover fieldset': { borderColor: theme.palette.divider },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                          },
                          '& .MuiInputBase-input': { py: 1 },
                        },
                      }}
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
                ) : (
                  <Box />
                )}
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, mt: 2, gridColumn: '1 / -1' }}>Descripción</Typography>
                <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
                  <TextField
                    multiline
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    fullWidth
                    placeholder="Descripción"
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { borderWidth: '2px', borderColor: theme.palette.divider },
                        '&:hover fieldset': { borderColor: theme.palette.divider },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.divider, borderWidth: '2px' },
                        '& .MuiInputBase-input': { py: 1 },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
      </FormDrawer>
      <TaskDetailDrawer
        open={taskDetailDrawerTaskId != null}
        onClose={() => setTaskDetailDrawerTaskId(null)}
        taskId={taskDetailDrawerTaskId}
        onTaskUpdated={fetchTasks}
      />
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
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: theme.palette.common.white }} /> : <Trash size={18} />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flujo de completar tarea */}
      {CompleteModalJSX}
      {ActivityModalsJSX}
      {LinkPromptJSX}

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
              const t = tasks.find(t => t.id === statusMenuAnchor.taskId);
              if (t) handleOpenCompleteModal(t);
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




