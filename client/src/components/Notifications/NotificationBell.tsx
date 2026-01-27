// Componente principal del sistema de notificaciones con ícono de campana

import React, { useState, useRef, useEffect } from 'react';
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

export const NotificationBell: React.FC = () => {
  const theme = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
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
    setPanelOpen(prev => !prev);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailOpen(true);
    setPanelOpen(false);
    
    // Si está archivada, eliminarla completamente
    // Si no está archivada, archivarla (se marca como leída y archivada)
    if (notification.archived) {
      removeNotification(notification.id);
    } else {
      archiveNotification(notification.id);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification({ ...selectedNotification, read: true });
    }
  };

  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        anchorRef.current &&
        !anchorRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setPanelOpen(false);
      }
    };

    if (panelOpen) {
      // Pequeño delay para evitar que se cierre inmediatamente al abrir
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [panelOpen]);

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
