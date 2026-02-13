import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  useTheme,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { Close, Comment, CalendarToday, Person, Flag } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import UserAvatar from './UserAvatar';

const DARK_PAPER = '#1c252e';

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    'in progress': 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return map[status] || status;
};

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return map[priority] || priority;
};

export interface TaskDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  taskId: number | null;
  onTaskUpdated?: () => void;
}

interface TaskData {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedToId: number;
  AssignedTo?: { id: number; firstName: string; lastName: string; avatar?: string | null };
  Company?: { id: number; name: string };
  Contact?: { id: number; firstName: string; lastName: string };
  createdAt?: string;
}

interface CommentData {
  id: number;
  content: string;
  createdAt: string;
  User?: { id: number; firstName: string; lastName: string; avatar?: string | null };
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  open,
  onClose,
  taskId,
  onTaskUpdated,
}) => {
  const theme = useTheme();
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchTask = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data);
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (id: number) => {
    setCommentsLoading(true);
    try {
      const res = await api.get(`/tasks/${id}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && taskId != null) {
      fetchTask(taskId);
      fetchComments(taskId);
      setCommentsExpanded(false);
      setNewComment('');
      setCommentError(null);
    } else if (!open) {
      setTask(null);
      setComments([]);
      setCommentError(null);
    }
  }, [open, taskId, fetchTask, fetchComments]);

  const handleSaveComment = async () => {
    if (!taskId || !newComment.trim()) return;
    setSavingComment(true);
    setCommentError(null);
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { content: newComment.trim() });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      onTaskUpdated?.();
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Error al guardar el comentario';
      setCommentError(message);
      console.error('Error guardando comentario:', err.response?.data || err);
    } finally {
      setSavingComment(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mismo estilo que FormDrawer "Nueva Tarea": altura completa y color de fondo
  const paperSx = {
    width: { xs: '100%', sm: 420, md: 460 },
    maxWidth: '100%',
    height: '100vh',
    maxHeight: '100vh',
    flex: 'none',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box' as const,
    bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(180deg, ${DARK_PAPER} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
    boxShadow: theme.palette.mode === 'dark' ? '-8px 0 24px rgba(0,0,0,0.4)' : '-8px 0 24px rgba(0,0,0,0.12)',
    border: 'none',
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1600 }}
      PaperProps={{ sx: paperSx }}
    >
      <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Detalle de la tarea
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', overflowX: 'hidden', px: 2, py: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : !task ? (
            <Typography variant="body2" color="text.secondary">
              No se encontró la tarea.
            </Typography>
          ) : (
            <>
              {/* Título y chips */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                {task.title}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  size="small"
                  icon={<CalendarToday sx={{ fontSize: 14 }} />}
                  label={`Vence: ${formatDate(task.dueDate)}`}
                  sx={{ borderRadius: 1.5 }}
                />
                {task.AssignedTo && (
                  <Chip
                    size="small"
                    icon={<Person sx={{ fontSize: 14 }} />}
                    label={`${task.AssignedTo.firstName} ${task.AssignedTo.lastName}`}
                    sx={{ borderRadius: 1.5 }}
                  />
                )}
                <Chip
                  size="small"
                  icon={<Flag sx={{ fontSize: 14 }} />}
                  label={getPriorityLabel(task.priority)}
                  sx={{ borderRadius: 1.5 }}
                />
              </Box>
              <Chip
                size="small"
                label={getStatusLabel(task.status)}
                sx={{
                  mb: 2,
                  borderRadius: 1.5,
                  bgcolor:
                    task.status === 'completed'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : task.status === 'in progress'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : task.status === 'pending'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(255,255,255,0.08)',
                  color:
                    task.status === 'completed'
                      ? '#10B981'
                      : task.status === 'in progress'
                      ? '#8B5CF6'
                      : task.status === 'pending'
                      ? '#EF4444'
                      : theme.palette.text.secondary,
                }}
              />

              {/* Campos de información */}
              <Box sx={{ display: 'grid', gap: 1.5, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Fecha de creación
                  </Typography>
                  <Typography variant="body2">{formatDateTime(task.createdAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Asignado a
                  </Typography>
                  {task.AssignedTo ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserAvatar
                        firstName={task.AssignedTo.firstName}
                        lastName={task.AssignedTo.lastName}
                        avatar={task.AssignedTo.avatar}
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                      />
                      <Typography variant="body2">
                        {task.AssignedTo.firstName} {task.AssignedTo.lastName}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2">—</Typography>
                  )}
                </Box>
                {task.Company && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Empresa
                    </Typography>
                    <Typography variant="body2">{task.Company.name}</Typography>
                  </Box>
                )}
                {task.Contact && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Contacto
                    </Typography>
                    <Typography variant="body2">
                      {task.Contact.firstName} {task.Contact.lastName}
                    </Typography>
                  </Box>
                )}
                {task.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Descripción
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {task.description}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Comentarios */}
              <Box>
                <Box
                  onClick={() => setCommentsExpanded((e) => !e)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    color: taxiMonterricoColors.teal,
                    '&:hover': { opacity: 0.85 },
                  }}
                >
                  <Comment sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={500}>
                    {comments.length === 0
                      ? 'Agregar comentario'
                      : `${comments.length} comentario${comments.length !== 1 ? 's' : ''}`}
                  </Typography>
                </Box>

                {commentsExpanded && (
                  <Box sx={{ mt: 2 }}>
                    {commentsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <>
                        {/* Lista de comentarios */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                          {comments.map((c) => (
                            <Box
                              key={c.id}
                              sx={{
                                display: 'flex',
                                gap: 1.5,
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              }}
                            >
                              {c.User ? (
                                <UserAvatar
                                  firstName={c.User.firstName}
                                  lastName={c.User.lastName}
                                  avatar={c.User.avatar}
                                  sx={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}
                                />
                              ) : (
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>?</Avatar>
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                                  {c.User ? `${c.User.firstName} ${c.User.lastName}` : 'Usuario'}
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {c.content}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {formatDateTime(c.createdAt)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        {/* Input nuevo comentario */}
                        <TextField
                          multiline
                          minRows={3}
                          fullWidth
                          placeholder="Envía una notificación a tu colega escribiendo @ seguido de su nombre. Solo usuarios de tu organización pueden ver los comentarios."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleSaveComment}
                          disabled={!newComment.trim() || savingComment}
                          sx={{
                            mt: 1.5,
                            borderRadius: 1.5,
                            bgcolor: taxiMonterricoColors.green,
                            '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
                          }}
                        >
                          {savingComment ? 'Guardando...' : 'Guardar'}
                        </Button>
                        {commentError && (
                          <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setCommentError(null)}>
                            {commentError}
                          </Alert>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
