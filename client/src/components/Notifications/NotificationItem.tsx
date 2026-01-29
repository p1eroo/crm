// Componente para mostrar una notificación individual en la lista

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  useTheme,
  Chip,
} from '@mui/material';
import { Notification } from '../../types/notification';
import { formatNotificationTime } from '../../utils/formatNotificationTime';
import { taxiMonterricoColors } from '../../theme/colors';
import { getNotificationIcon, getNotificationColor, getNotificationTypeLabel } from './notificationUtils';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const theme = useTheme();
  const iconColor = getNotificationColor(notification.type, notification.id);
  const isUnread = !notification.read;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1.25,
        p: 1.25,
        py: 2.5,
        px: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        // Fondo transparente (sin "card" por notificación)
        bgcolor: 'transparent',
        borderLeft: isUnread
          ? `3px solid ${iconColor}`
          : '3px solid transparent',
        '&:hover': {
          // Hover sutil, sin movimiento
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      {/* Ícono */}
      <Avatar
        sx={{
          bgcolor: `${iconColor}20`,
          color: iconColor,
          width: 40,
          height: 40,
          flexShrink: 0,
          fontSize: '1rem',
          
        }}
      >
        {getNotificationIcon(notification.type, notification.id)}
      </Avatar>

      {/* Contenido */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isUnread ? 600 : 500,
              color: theme.palette.text.primary,
              fontSize: '0.9rem',
              lineHeight: 1.3,
              px: 0.8,
            }}
          >
            {notification.title}
          </Typography>
          {isUnread && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#2196F3',
                flexShrink: 0,
                
                ml: 0.75,
              }}
            />
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1,
            mt: 1,
            fontSize: '0.75rem',
            px: 0.8,
            lineHeight: 1.3,
          }}
        >
          {notification.message}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              px: 0.8,
            }}
          >
            {formatNotificationTime(notification.createdAt)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              opacity: 0.6,
            }}
          >
            ·
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
            }}
          >
            {getNotificationTypeLabel(notification.type)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
