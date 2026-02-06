import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications,
  NotificationsNone,
  CheckCircle,
  Circle,
  AccessTime,
  Task as TaskIcon,
  Event as EventIcon,
  ArrowForward,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';

export interface Notification {
  id: string | number;
  type: 'task' | 'event';
  title: string;
  description?: string;
  dueDate: string;
  read: boolean;
  priority?: string;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string | number) => void;
  onMarkAllAsRead?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída si no está leída
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Abrir detalle
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
    handleClose();

    // Callback opcional
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Si es hoy y menos de 24 horas
    if (diffInHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Si es ayer
    if (diffInDays === 1 || (diffInDays === 0 && date.getDate() !== now.getDate())) {
      return 'Ayer';
    }

    // Si es más antiguo, mostrar fecha
    if (diffInDays < 7) {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatFullDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          bgcolor: 'transparent',
          borderRadius: '10px',
          width: 40,
          height: 40,
          minWidth: 40,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        <Badge
          badgeContent={unreadCount > 0 ? unreadCount : undefined}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.625rem',
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              fontWeight: 600,
            },
          }}
        >
          <Notifications sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 380,
            maxWidth: 420,
            maxHeight: 600,
            borderRadius: '16px',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            '& .MuiList-root': {
              padding: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              color: theme.palette.text.primary,
            }}
          >
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                color: taxiMonterricoColors.green,
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Marcar todas como leídas
            </Button>
          )}
        </Box>

        {/* Lista de notificaciones */}
        <Box
          sx={{
            maxHeight: 480,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
              '&:hover': {
                background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
            },
          }}
        >
          {notifications.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NotificationsNone
                  sx={{
                    fontSize: 32,
                    color: theme.palette.text.secondary,
                    opacity: 0.5,
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                }}
              >
                No hay notificaciones próximas
              </Typography>
            </Box>
          ) : (
            <>
              {/* Notificaciones no leídas */}
              {unreadNotifications.length > 0 && (
                <>
                  {unreadNotifications.map((notification, index) => (
                    <MenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(34, 197, 94, 0.08)'
                          : 'rgba(34, 197, 94, 0.04)',
                        borderLeft: `3px solid ${taxiMonterricoColors.green}`,
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(34, 197, 94, 0.12)'
                            : 'rgba(34, 197, 94, 0.08)',
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {notification.type === 'task' ? (
                          <TaskIcon
                            sx={{
                              fontSize: 20,
                              color: taxiMonterricoColors.green,
                            }}
                          />
                        ) : (
                          <EventIcon
                            sx={{
                              fontSize: 20,
                              color: '#2196F3',
                            }}
                          />
                        )}
                      </ListItemIcon>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.875rem',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Circle
                            sx={{
                              fontSize: 8,
                              color: taxiMonterricoColors.green,
                              ml: 1,
                              flexShrink: 0,
                            }}
                          />
                        </Box>
                        {notification.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: '0.75rem',
                              display: 'block',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {notification.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={notification.type === 'task' ? 'Tarea' : 'Evento'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: notification.type === 'task' ? taxiMonterricoColors.green : '#2196F3',
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.7rem',
                              }}
                            >
                              {formatRelativeTime(notification.dueDate)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                  {readNotifications.length > 0 && <Divider sx={{ my: 0.5 }} />}
                </>
              )}

              {/* Notificaciones leídas */}
              {readNotifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {notification.type === 'task' ? (
                      <TaskIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.text.secondary,
                          opacity: 0.6,
                        }}
                      />
                    ) : (
                      <EventIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.text.secondary,
                          opacity: 0.6,
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: theme.palette.text.secondary,
                          fontSize: '0.875rem',
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <CheckCircle
                        sx={{
                          fontSize: 14,
                          color: theme.palette.text.secondary,
                          ml: 1,
                          flexShrink: 0,
                          opacity: 0.4,
                        }}
                      />
                    </Box>
                    {notification.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          display: 'block',
                          mb: 0.5,
                          opacity: 0.7,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notification.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={notification.type === 'task' ? 'Tarea' : 'Evento'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 12, color: theme.palette.text.secondary, opacity: 0.5 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.7rem',
                            opacity: 0.7,
                          }}
                        >
                          {formatRelativeTime(notification.dueDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </>
          )}
        </Box>
      </Menu>

      {/* Dialog de detalle */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {selectedNotification && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                pb: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {selectedNotification.type === 'task' ? (
                <TaskIcon sx={{ color: taxiMonterricoColors.green, fontSize: 24 }} />
              ) : (
                <EventIcon sx={{ color: '#2196F3', fontSize: 24 }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography component="div" sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 0.5 }}>
                  {selectedNotification.title}
                </Typography>
                <Chip
                  label={selectedNotification.type === 'task' ? 'Tarea' : 'Evento'}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: selectedNotification.type === 'task' ? taxiMonterricoColors.green : '#2196F3',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              {selectedNotification.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    mb: 2,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedNotification.description}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <AccessTime sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                    Fecha y hora
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {formatFullDateTime(selectedNotification.dueDate)}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={pageStyles.dialogActions}>
              <Button
                onClick={() => setDetailDialogOpen(false)}
                sx={pageStyles.cancelButton}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  // Aquí puedes agregar lógica para navegar al detalle completo
                }}
                variant="contained"
                endIcon={<ArrowForward />}
                sx={pageStyles.saveButton}
              >
                Ver más detalles
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default NotificationDropdown;
