import React, { useEffect, useState } from 'react';
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
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../config/api';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'todo',
    status: 'not started',
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // Obtener tareas desde /tasks
      const tasksResponse = await api.get('/tasks');
      const tasksFromTasks = (tasksResponse.data.tasks || tasksResponse.data || []).map((task: Task) => ({
        ...task,
        isActivity: false,
      }));

      // Obtener actividades de tipo 'task' desde /activities
      const activitiesResponse = await api.get('/activities', {
        params: { type: 'task' },
      });
      const tasksFromActivities = (activitiesResponse.data.activities || activitiesResponse.data || []).map((activity: any) => ({
        id: activity.id,
        title: activity.subject || activity.description || 'Sin título',
        subject: activity.subject,
        description: activity.description || '', // Incluir descripción para poder editarla
        type: activity.type,
        status: 'not started', // Valor por defecto para actividades
        priority: 'medium', // Valor por defecto para actividades
        dueDate: activity.dueDate,
        createdAt: activity.createdAt,
        User: activity.User,
        isActivity: true,
      }));

      // Combinar ambas listas
      const allTasks = [...tasksFromTasks, ...tasksFromActivities];
      
      // Ordenar por fecha de creación (más recientes primero)
      // Las actividades tienen createdAt, las tareas también deberían tenerlo
      allTasks.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 
                      a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 
                      b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateB - dateA;
      });

      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      // Si es una actividad, obtener la descripción si existe
      const description = (task as any).description || '';
      setFormData({
        title: task.title || task.subject || '',
        description: description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
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
          await api.put(`/tasks/${editingTask.id}`, formData);
        }
      } else {
        await api.post('/tasks', formData);
      }
      handleClose();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (id: number, isActivity?: boolean) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      try {
        // Si es una actividad, eliminar desde /activities
        if (isActivity) {
          await api.delete(`/activities/${id}`);
        } else {
          // Si es una tarea normal, eliminar desde /tasks
          await api.delete(`/tasks/${id}`);
        }
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'not started': 'default',
      'in progress': 'info',
      'completed': 'success',
      'cancelled': 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'low': 'default',
      'medium': 'warning',
      'high': 'error',
      'urgent': 'error',
    };
    return colors[priority] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tareas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nueva Tarea
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Prioridad</TableCell>
              <TableCell>Fecha Límite</TableCell>
              <TableCell>Asignado a</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title || task.subject}</TableCell>
                <TableCell>{task.type}</TableCell>
                <TableCell>
                  <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
                </TableCell>
                <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  {task.AssignedTo ? `${task.AssignedTo.firstName} ${task.AssignedTo.lastName}` :
                   task.User ? `${task.User.firstName} ${task.User.lastName}` : '-'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(task)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(task.id, task.isActivity)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;




