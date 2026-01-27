// Panel desplegable de notificaciones con animaciones

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  useTheme,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Settings,
} from '@mui/icons-material';
import { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import { taxiMonterricoColors } from '../../theme/colors';

interface NotificationPanelProps {
  open: boolean;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onClose?: () => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
}

type TabValue = 'all' | 'unread' | 'archived';

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  open,
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onClose,
  panelRef,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [expanded, setExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Contar notificaciones
  // En "All" solo contamos las no archivadas
  const allNotifications = notifications.filter(n => !n.archived);
  const totalCount = allNotifications.length;
  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const archivedCount = notifications.filter(n => n.archived).length;

  // Filtrar notificaciones según el tab activo
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.read && !notification.archived;
    }
    if (activeTab === 'archived') {
      return notification.archived;
    }
    // 'all' muestra todas excepto archivadas
    return !notification.archived;
  });

  // Limitar notificaciones mostradas: solo 5 cuando no está expandido
  const displayedNotifications = expanded 
    ? filteredNotifications 
    : filteredNotifications.slice(0, 5);

  // Log para depuración
  useEffect(() => {
    if (open) {
      console.log(`📬 Tab activo: ${activeTab}`);
      console.log(`📬 Total notificaciones: ${notifications.length}`);
      console.log(`📬 Notificaciones filtradas: ${filteredNotifications.length}`);
      console.log(`📬 Expandido: ${expanded}`);
      console.log(`📬 Notificaciones visibles:`, filteredNotifications.map(n => ({ id: n.id, title: n.title, archived: n.archived })));
    }
  }, [open, activeTab, filteredNotifications.length, expanded]);

  // Función para verificar la posición del scroll
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      setShowTopShadow(false);
      setShowBottomShadow(false);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Verificar si hay contenido desplazable
    const hasScrollableContent = scrollHeight > clientHeight;
    
    if (!hasScrollableContent) {
      // No hay contenido desplazable, ocultar ambas sombras
      setShowTopShadow(false);
      setShowBottomShadow(false);
      return;
    }

    // Verificar posición con una pequeña tolerancia para evitar parpadeos
    const tolerance = 2;
    const isAtTop = scrollTop <= tolerance;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

    setShowTopShadow(!isAtTop);
    setShowBottomShadow(!isAtBottom);
  };

  // Efecto para detectar cambios en el scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) {
      setShowTopShadow(false);
      setShowBottomShadow(false);
      return;
    }

    // Verificar posición inicial con un pequeño delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    // Agregar listener de scroll con throttling para mejor rendimiento
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Verificar cuando cambia el contenido o el tamaño
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });
    resizeObserver.observe(container);

    // También observar cambios en el contenido interno
    const mutationObserver = new MutationObserver(() => {
      checkScrollPosition();
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [open, filteredNotifications, expanded]);

  if (!open) return null;

  return (
    <Box
      ref={panelRef}
      component="div"
      sx={{
        position: 'fixed',
        top: { xs: 60, sm: 72 },
        right: { xs: 16, sm: 24 },
        width: { xs: 'calc(100vw - 32px)', sm: 400 },
        maxWidth: '90vw',
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.4)'
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        zIndex: 1400,
        maxHeight: expanded ? 'calc(100vh - 80px)' : 'calc(100vh - 120px)',
        minHeight: expanded ? 'calc(100vh - 80px)' : '300px',
        height: expanded ? 'calc(100vh - 80px)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideDown 0.2s ease-out',
        '@keyframes slideDown': {
          '0%': {
            opacity: 0,
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
        {/* Header */}
        <Box
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Título e iconos */}
          <Box
            sx={{
              p: 2,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: theme.palette.text.primary,
              }}
            >
              Notificaciones
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {unreadCount > 0 && (
                <Tooltip title="Marcar todas como leídas">
                  <IconButton
                    size="small"
                    onClick={onMarkAllAsRead}
                    sx={{
                      color: taxiMonterricoColors.green,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(46, 125, 50, 0.1)'
                          : 'rgba(46, 125, 50, 0.05)',
                      },
                    }}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Configuración">
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Settings fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue as TabValue)}
            sx={{
              minHeight: 'auto',
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTabs-indicator': {
                height: 2,
                borderRadius: '2px 2px 0 0',
              },
            }}
          >
            <Tab
              label={`Todas ${totalCount}`}
              value="all"
              sx={{
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: activeTab === 'all' ? 600 : 500,
                minHeight: 40,
                px: 1.5,
                color: activeTab === 'all' 
                  ? theme.palette.text.primary 
                  : theme.palette.text.secondary,
                bgcolor: activeTab === 'all'
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)'
                  : 'transparent',
              }}
            />
            <Tab
              label={`No leídas ${unreadCount}`}
              value="unread"
              sx={{
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: activeTab === 'unread' ? 600 : 500,
                minHeight: 40,
                px: 1.5,
                color: activeTab === 'unread' 
                  ? theme.palette.text.primary 
                  : theme.palette.text.secondary,
                bgcolor: activeTab === 'unread'
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)'
                  : 'transparent',
              }}
            />
            <Tab
              label={`Archivadas ${archivedCount}`}
              value="archived"
              sx={{
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: activeTab === 'archived' ? 600 : 500,
                minHeight: 40,
                px: 1.5,
                color: activeTab === 'archived' 
                  ? theme.palette.text.primary 
                  : theme.palette.text.secondary,
                bgcolor: activeTab === 'archived'
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)'
                  : 'transparent',
              }}
            />
          </Tabs>
        </Box>

        {/* Lista de notificaciones con contenedor relativo para las sombras */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sombra superior - aparece cuando hay contenido arriba */}
          <Box
            className={showTopShadow ? 'shadow-top' : ''}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '24px',
              background: showTopShadow
                ? theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 50%, transparent 100%)'
                  : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.06) 50%, transparent 100%)'
                : 'transparent',
              pointerEvents: 'none',
              zIndex: 2,
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: showTopShadow ? 1 : 0,
              willChange: 'opacity',
            }}
          />

          {/* Contenedor scrolleable */}
          <Box
            ref={scrollContainerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              // Asegurar que el scroll funcione correctamente
              overscrollBehavior: 'contain',
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '5px',
                margin: '8px 0',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(0, 0, 0, 0.3)',
                borderRadius: '5px',
                border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.5)'
                    : 'rgba(0, 0, 0, 0.5)',
                },
                '&:active': {
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'rgba(0, 0, 0, 0.6)',
                },
              },
              scrollbarWidth: 'thin',
              scrollbarColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05)',
            }}
          >
          {filteredNotifications.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                {activeTab === 'unread' 
                  ? 'No hay notificaciones no leídas'
                  : activeTab === 'archived'
                  ? 'No hay notificaciones archivadas'
                  : 'No hay notificaciones próximas'}
              </Typography>
              <Typography variant="caption">
                Te notificaremos cuando haya nuevas actualizaciones
              </Typography>
            </Box>
          ) : (
            <>
              {displayedNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onClick={() => onNotificationClick(notification)}
                  />
                  {index < displayedNotifications.length - 1 && (
                    <Divider 
                      sx={{ 
                        mx: 1.25,
                        my: 0.25,
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.15)',
                        borderWidth: '1px',
                        opacity: 1,
                        transition: 'border-color 0.2s ease',
                      }} 
                    />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
          </Box>

          {/* Sombra inferior - aparece cuando hay contenido abajo */}
          <Box
            className={showBottomShadow ? 'shadow-bottom' : ''}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '24px',
              background: showBottomShadow
                ? theme.palette.mode === 'dark'
                  ? 'linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.15) 50%, transparent 100%)'
                  : 'linear-gradient(to top, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.06) 50%, transparent 100%)'
                : 'transparent',
              pointerEvents: 'none',
              zIndex: 2,
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: showBottomShadow ? 1 : 0,
              willChange: 'opacity',
            }}
          />
        </Box>

        {/* Footer con "Ver todos" */}
        {filteredNotifications.length > 5 && (
          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(0, 0, 0, 0.01)',
            }}
          >
            <Button
            onClick={() => {
              const newExpanded = !expanded;
              setExpanded(newExpanded);
              
              // Scroll automático después de expandir/contraer
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  if (newExpanded) {
                    // Al expandir, esperar a que el DOM se actualice y luego hacer scroll
                    setTimeout(() => {
                      if (scrollContainerRef.current) {
                        const container = scrollContainerRef.current;
                        console.log('📬 Scroll container height:', container.clientHeight);
                        console.log('📬 Scroll content height:', container.scrollHeight);
                        console.log('📬 Scroll top:', container.scrollTop);
                        
                        // Hacer scroll hacia abajo para ver todas las notificaciones
                        container.scrollTo({
                          top: container.scrollHeight,
                          behavior: 'smooth',
                        });
                        
                        // Verificar posición después del scroll
                        setTimeout(() => {
                          checkScrollPosition();
                          console.log('📬 Después del scroll - Scroll top:', container.scrollTop);
                          console.log('📬 Después del scroll - Scroll height:', container.scrollHeight);
                        }, 600);
                      }
                    }, 300);
                  } else {
                    // Al contraer, volver arriba
                    scrollContainerRef.current.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    });
                    setTimeout(() => {
                      checkScrollPosition();
                    }, 300);
                  }
                }
              }, 100);
            }}
            sx={{
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {expanded ? 'Ver menos' : 'Ver todos'}
          </Button>
          </Box>
        )}
    </Box>
  );
};
