import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  TextField,
  Button,
} from '@mui/material';
import { Close, CalendarToday } from '@mui/icons-material';
import api from '../../config/api';
import { pageStyles } from '../../theme/styles';

interface Activity {
  id: number;
  type?: 'note' | 'email' | 'call' | 'task' | 'todo' | 'meeting' | 'other';
  taskSubType?: string; // subtipo real cuando type === 'task' (p. ej. email, meeting)
  subject?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  dueDate?: string;
  time?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed';
  User?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface ActivityDetailDialogProps {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
  getActivityTypeLabel?: (type: string) => string;
}

const defaultGetActivityTypeLabel = (type: string) => {
  const typeMap: { [key: string]: string } = {
    note: 'Nota',
    email: 'Correo',
    call: 'Llamada',
    task: 'Tarea',
    todo: 'Tarea',
    meeting: 'Reunión',
  };
  return typeMap[type?.toLowerCase()] || 'Actividad';
};

const TASK_LIKE_TYPES = ['meeting', 'task', 'todo', 'other'];
const isTaskLikeType = (type: string | undefined) =>
  type && TASK_LIKE_TYPES.includes(type.toLowerCase());

const getTaskSubtypeLabel = (type: string | undefined) => {
  const t = type?.toLowerCase() || '';
  const map: { [key: string]: string } = {
    meeting: 'Reunión',
    call: 'Llamada',
    note: 'Nota',
    email: 'Correo',
    task: 'Tarea',
    todo: 'Tarea',
    other: 'Otro',
  };
  return map[t] || 'Tarea';
};

const ActivityDetailDialog: React.FC<ActivityDetailDialogProps> = ({
  activity,
  open,
  onClose,
  getActivityTypeLabel = defaultGetActivityTypeLabel,
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    subject: '',
    description: '',
    dueDate: '',
    time: '',
  });

  // Inicializar datos de edición cuando cambia la actividad
  useEffect(() => {
    if (activity) {
      setEditData({
        subject: activity.subject || activity.title || '',
        description: activity.description || '',
        dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
        time: activity.time || '',
      });
      setIsEditing(false);
    }
  }, [activity, open]);

  if (!activity) return null;

  // Formatear hora para mostrar
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  };

  const handleSave = async () => {
    if (!activity) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        subject: editData.subject,
        description: editData.description,
      };

      if (editData.dueDate) {
        updateData.dueDate = editData.dueDate;
      }

      if (editData.time) {
        // El tiempo ya viene en formato 24h del input type="time"
        updateData.time = editData.time;
      }

      await api.put(`/activities/${activity.id}`, updateData);
      setIsEditing(false);
      // Recargar la página o actualizar la actividad
      window.location.reload();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (activity) {
      setEditData({
        subject: activity.subject || activity.title || '',
        description: activity.description || '',
        dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
        time: activity.time || '',
      });
    }
    setIsEditing(false);
  };

  return (
    <Dialog
      open={open}
      onClose={isEditing ? handleCancel : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          bgcolor: `${theme.palette.background.paper} !important`,
          color: `${theme.palette.text.primary} !important`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.6)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: `none`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: `${theme.palette.background.paper} !important`,
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: { xs: '64px', md: '60px' },
          px: { xs: 3, md: 4 },
          pt: 2,
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            letterSpacing: '-0.02em',
          }}
        >
          {isTaskLikeType(activity.type) ? 'Tarea' : getActivityTypeLabel(activity.type || '')}
        </Typography>
        <IconButton
          sx={{
            color: theme.palette.text.secondary,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
              transform: 'rotate(90deg)',
            },
          }}
          size="medium"
          onClick={onClose}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent 
        sx={{ 
          px: 3, 
          pb: 0, 
          pt: 4,
          bgcolor: `${theme.palette.background.paper} !important`,
          color: `${theme.palette.text.primary} !important`,
        }}
      >
        {/* Tipo (solo para tareas: reunión, llamada, nota, correo, etc.) */}
        {isTaskLikeType(activity.type) && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Tipo"
              value={getTaskSubtypeLabel(activity.taskSubType || activity.type)}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : theme.palette.divider,
                  },
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  py: 1.75,
                },
              }}
            />
          </Box>
        )}

        {/* Título */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Título"
            value={isEditing ? editData.subject : (activity.subject || activity.title || '')}
            onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              readOnly: !isEditing,
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.875rem',
                '&.Mui-focused': {
                  color: theme.palette.text.secondary,
                },
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: 'transparent',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : theme.palette.divider,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : theme.palette.divider,
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
                py: 1.75,
              },
            }}
          />
        </Box>

        {/* Hora y Fecha para reuniones - Justo después del título */}
        {activity.type === 'meeting' && (activity.dueDate || activity.time || isEditing) && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: activity.dueDate && activity.time ? 'repeat(2, 1fr)' : '1fr',
                gap: 2,
              }}
            >
              {/* Hora */}
              {(activity.time || (isEditing && activity.type === 'meeting')) && (
                <TextField
                  fullWidth
                  label="Hora"
                  type={isEditing ? "time" : "text"}
                  value={isEditing ? editData.time : formatTime(activity.time || '')}
                  onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    readOnly: !isEditing,
                  }}
                  disabled={!isEditing && !activity.time}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: theme.palette.text.secondary,
                      },
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: 'transparent',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : theme.palette.divider,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : theme.palette.divider,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                      fontSize: '0.875rem',
                      py: 1.75,
                      cursor: 'default',
                    },
                  }}
                />
              )}
              
              {/* Fecha */}
              {(activity.dueDate || isEditing) && (
                <TextField
                  fullWidth
                  label="Fecha"
                  type="date"
                  value={isEditing ? editData.dueDate : (activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '')}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    readOnly: !isEditing,
                    endAdornment: !isEditing ? (
                      <CalendarToday
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                          mr: 1,
                        }}
                      />
                    ) : undefined,
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: theme.palette.text.secondary,
                      },
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: 'transparent',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : theme.palette.divider,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : theme.palette.divider,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                      fontSize: '0.875rem',
                      py: 1.75,
                      cursor: 'default',
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Descripción */}
        <Box sx={{ mb: 3, mt: 4.5 }}>
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={4}
            value={isEditing ? editData.description : (activity.description ? activity.description.replace(/<[^>]*>/g, '') : '')}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              readOnly: !isEditing,
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.875rem',
                '&.Mui-focused': {
                  color: theme.palette.text.secondary,
                },
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: 'transparent',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : theme.palette.divider,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : theme.palette.divider,
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
              },
            }}
          />
        </Box>


        {/* Campos adicionales en grid */}
        {(activity.priority || activity.status) && (
          <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
              }}
            >
              {/* Prioridad */}
              {activity.priority && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    Prioridad
                  </Typography>
                  <Chip
                    label={
                      activity.priority === 'low'
                        ? 'Baja'
                        : activity.priority === 'medium'
                        ? 'Media'
                        : activity.priority === 'high'
                        ? 'Alta'
                        : activity.priority === 'urgent'
                        ? 'Urgente'
                        : activity.priority
                    }
                    size="small"
                    sx={{
                      bgcolor:
                        activity.priority === 'urgent'
                          ? '#f44336'
                          : activity.priority === 'high'
                          ? '#ff9800'
                          : activity.priority === 'medium'
                          ? '#ffc107'
                          : '#4caf50',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              )}

              {/* Estado */}
              {activity.status && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    Estado
                  </Typography>
                  <Chip
                    label={
                      activity.status === 'pending'
                        ? 'Pendiente'
                        : activity.status === 'in_progress'
                        ? 'En progreso'
                        : activity.status === 'completed'
                        ? 'Completada'
                        : activity.status
                    }
                    size="small"
                    sx={{
                      bgcolor:
                        activity.status === 'completed'
                          ? '#4caf50'
                          : activity.status === 'in_progress'
                          ? '#2196f3'
                          : theme.palette.action.disabledBackground,
                      color:
                        activity.status === 'completed'
                          ? 'white'
                          : theme.palette.text.primary,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              )}
            </Box>
        )}
      </DialogContent>

      <DialogActions sx={pageStyles.dialogActions}>
        <Button
          onClick={isEditing ? handleCancel : onClose}
          disabled={saving}
          sx={pageStyles.cancelButton}
        >
          {isEditing ? 'Cancelar' : 'Cerrar'}
        </Button>
        <Button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          variant="contained"
          disabled={saving}
          sx={pageStyles.saveButton}
        >
          {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Editar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDetailDialog;
