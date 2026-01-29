// Componente principal del sistema de notificaciones con ícono de campana

import React, { useState, useRef } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { NotificationPanel } from './NotificationPanel';
import { NotificationDetail } from './NotificationDetail';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types/notification';
import { taxiMonterricoColors } from '../../theme/colors';
import { useNotificationPanel } from '../../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const theme = useTheme();
  const { panelOpen, setPanelOpen } = useNotificationPanel();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    removeNotification,
  } = useNotifications();

  const handleTogglePanel = () => {
    setPanelOpen(!panelOpen);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
  };

  // Función helper para verificar si una notificación vence hoy
  const isDueToday = (notification: Notification): boolean => {
    const message = notification.message.toLowerCase();
    return message.includes('hoy') && 
           (notification.type === 'task' || notification.type === 'event');
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailOpen(true);
    // No cerrar el panel principal, mantenerlo abierto
    
    // Si está archivada, eliminarla completamente
    if (notification.archived) {
      removeNotification(notification.id);
    } else {
      // Si la notificación vence hoy o es la alerta de inactividad, solo marcarla como leída (no archivar)
      // para que permanezca visible
      if (isDueToday(notification) || notification.id === 'inactivity-alert') {
        markAsRead(notification.id);
      } else {
        // Para otras notificaciones, archivarlas normalmente
        archiveNotification(notification.id);
      }
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedNotification(null);
    // Mantener el panel principal abierto
    setPanelOpen(true);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification({ ...selectedNotification, read: true });
    }
  };

  const panelRef = useRef<HTMLDivElement>(null);


  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          ref={anchorRef}
          size="small"
          onClick={handleTogglePanel}
          sx={{
            bgcolor: 'transparent',
            borderRadius: 1,
            width: 40,
            height: 40,
            position: 'relative',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
              transform: 'scale(1.05)',
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
                fontWeight: 600,
                minWidth: 18,
                height: 18,
                padding: '0 4px',
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: `0 0 0 0 rgba(239, 68, 68, 0.7)`,
                  },
                  '70%': {
                    boxShadow: `0 0 0 6px rgba(239, 68, 68, 0)`,
                  },
                  '100%': {
                    boxShadow: `0 0 0 0 rgba(239, 68, 68, 0)`,
                  },
                },
              },
            }}
          >
            <Notifications
              sx={{
                fontSize: 24,
                color: theme.palette.text.secondary,
                transition: 'all 0.2s ease',
                ...(panelOpen && {
                  color: taxiMonterricoColors.green,
                  transform: 'rotate(10deg)',
                }),
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Panel de notificaciones */}
      <NotificationPanel
        open={panelOpen}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={markAllAsRead}
        onClose={handleClosePanel}
        panelRef={panelRef}
      />

      {/* Modal de detalle */}
      <NotificationDetail
        open={detailOpen}
        notification={selectedNotification}
        onClose={handleCloseDetail}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
};
