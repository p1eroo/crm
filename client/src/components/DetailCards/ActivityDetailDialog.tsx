import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface Activity {
  id: number;
  type?: 'note' | 'email' | 'call' | 'task' | 'todo' | 'meeting';
  subject?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  dueDate?: string;
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

const ActivityDetailDialog: React.FC<ActivityDetailDialogProps> = ({
  activity,
  open,
  onClose,
  getActivityTypeLabel = defaultGetActivityTypeLabel,
}) => {
  const theme = useTheme();

  if (!activity) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          minHeight: 48,
          px: 2,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {getActivityTypeLabel(activity.type || '')}
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
          onClick={onClose}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, pb: 1, pt: 0.5 }}>
        {/* Título */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              mb: 0.75,
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            Título
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          >
            {activity.subject || activity.title}
          </Typography>
        </Box>

        {/* Descripción */}
        {activity.description && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 0.75,
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            >
              Descripción
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : '#F9FAFB',
                border: `1px solid ${theme.palette.divider}`,
                fontSize: '0.875rem',
                lineHeight: 1.6,
                '& *': {
                  margin: 0,
                },
              }}
              dangerouslySetInnerHTML={{
                __html: activity.description,
              }}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Campos adicionales en grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
          }}
        >
          {/* Fecha de vencimiento */}
          {activity.dueDate && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.75,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Fecha de vencimiento
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {new Date(activity.dueDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
            </Box>
          )}

          {/* Prioridad */}
          {activity.priority && (
            <Box>
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
                  mb: 0.75,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
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

          {/* Usuario asignado */}
          {activity.User && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.75,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Asignado a
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {activity.User.firstName} {activity.User.lastName}
              </Typography>
            </Box>
          )}

          {/* Fecha de creación */}
          {activity.createdAt && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.75,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Creado
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailDialog;
