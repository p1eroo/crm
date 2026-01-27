// Modal/Drawer para mostrar el detalle completo de una notificación

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  useTheme,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Notification } from '../../types/notification';
import { formatNotificationDateTime } from '../../utils/formatNotificationTime';
import { getNotificationIcon, getNotificationColor, getNotificationTypeLabel } from './notificationUtils';
import { taxiMonterricoColors } from '../../theme/colors';
import { useNavigate } from 'react-router-dom';

interface NotificationDetailProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

export const NotificationDetail: React.FC<NotificationDetailProps> = ({
  open,
  notification,
  onClose,
  onMarkAsRead,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!notification) return null;

  const iconColor = getNotificationColor(notification.type);
  const isUnread = !notification.read;

  const handleAction = () => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const handleMarkAsRead = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.5)'
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${iconColor}20`,
              color: iconColor,
              width: 48,
              height: 48,
            }}
          >
            {getNotificationIcon(notification.type)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {notification.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getNotificationTypeLabel(notification.type)}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: `${iconColor}20`,
                  color: iconColor,
                  fontWeight: 600,
                }}
              />
              {isUnread && (
                <Chip
                  label="No leída"
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: `${taxiMonterricoColors.green}20`,
                    color: taxiMonterricoColors.green,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.primary,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {notification.message}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              Fecha y hora:
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
              {formatNotificationDateTime(notification.createdAt)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}
      >
        {isUnread && (
          <Button
            onClick={handleMarkAsRead}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderColor: taxiMonterricoColors.green,
              color: taxiMonterricoColors.green,
              '&:hover': {
                borderColor: taxiMonterricoColors.greenDark,
                bgcolor: `${taxiMonterricoColors.green}10`,
              },
            }}
          >
            Marcar como leída
          </Button>
        )}
        {notification.actionUrl && (
          <Button
            onClick={handleAction}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: iconColor,
              '&:hover': {
                bgcolor: iconColor,
                opacity: 0.9,
              },
            }}
          >
            {notification.actionLabel || 'Ver detalle'}
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            ml: 'auto',
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
