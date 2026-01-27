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
  const iconColor = getNotificationColor(notification.type);
  const isUnread = !notification.read;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1.25,
        p: 1.25,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        bgcolor: isUnread
          ? theme.palette.mode === 'dark'
            ? 'rgba(46, 125, 50, 0.1)'
            : 'rgba(46, 125, 50, 0.05)'
          : 'transparent',
        borderLeft: isUnread
          ? `3px solid ${iconColor}`
          : '3px solid transparent',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)',
          transform: 'translateX(4px)',
        },
      }}
    >
      {/* Ícono */}
      <Avatar
        sx={{
          bgcolor: `${iconColor}20`,
          color: iconColor,
          width: 32,
          height: 32,
          flexShrink: 0,
          fontSize: '1rem',
        }}
      >
        {getNotificationIcon(notification.type)}
      </Avatar>

      {/* Contenido */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isUnread ? 600 : 500,
              color: theme.palette.text.primary,
              fontSize: '0.8125rem',
              lineHeight: 1.3,
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
                mt: 0.25,
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
            mb: 0.75,
            fontSize: '0.75rem',
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
