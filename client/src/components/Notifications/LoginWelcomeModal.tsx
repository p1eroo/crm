// Modal de bienvenida que aparece después del login mostrando notificaciones relevantes

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';
import { pageStyles } from '../../theme/styles';

interface LoginWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export const LoginWelcomeModal: React.FC<LoginWelcomeModalProps> = ({
  open,
  onClose,
  onNotificationClick,
}) => {
  const theme = useTheme();
  const { notifications, loading } = useNotifications();
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  // Función helper para verificar si una notificación es de hoy
  const isDueToday = (notification: Notification): boolean => {
    // Verificar si el mensaje contiene "hoy" (case insensitive)
    const message = notification.message.toLowerCase();
    return message.includes('hoy') && 
           (notification.type === 'task' || notification.type === 'event');
  };

  // Filtrar notificaciones relevantes: empresas inactivas y tareas de hoy
  useEffect(() => {
    if (!loading && notifications.length > 0) {
      const relevant = notifications.filter(notification => {
        // Empresas inactivas
        if (notification.id === 'inactivity-alert') {
          return true;
        }
        // Tareas de hoy
        if (notification.type === 'task' && isDueToday(notification)) {
          return true;
        }
        return false;
      });
      setFilteredNotifications(relevant);
    } else if (!loading) {
      setFilteredNotifications([]);
    }
  }, [notifications, loading]);

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 2,
          width: '500px',
          maxWidth: '90vw',
          bgcolor: theme.palette.mode === 'dark' ? '#141A21' : theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? '#141A21' : 'transparent',
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Pendientes de hoy
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            minWidth: 'auto',
            p: 0.5,
            color: theme.palette.text.secondary,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          p: 0,
          bgcolor: theme.palette.mode === 'dark' ? '#141A21' : 'transparent',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              px: 3,
            }}
          >
            <Typography variant="body1" color="text.secondary" align="center">
              No tienes recordatorios pendientes para hoy
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
                {index < filteredNotifications.length - 1 && (
                  <Box
                    sx={{
                      mx: 2.25,
                      height: '1px',
                      minHeight: '1px',
                      borderBottom: `1px dashed ${
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(0, 0, 0, 0.4)'
                      }`,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={pageStyles.dialogActions}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={pageStyles.saveButton}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};
