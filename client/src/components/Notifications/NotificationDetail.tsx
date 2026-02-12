// Drawer para mostrar el detalle completo de una notificación

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Box,
  Avatar,
  Chip,
  useTheme,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { Close, Business } from '@mui/icons-material';
import { Notification } from '../../types/notification';
import { formatNotificationDateTime } from '../../utils/formatNotificationTime';
import { getNotificationIcon, getNotificationColor, getNotificationTypeLabel } from './notificationUtils';
import { taxiMonterricoColors } from '../../theme/colors';
import { getStageColor as getStageColorUtil } from '../../utils/stageColors';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

interface NotificationDetailProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

interface InactiveCompany {
  id: number;
  name: string;
  lifecycleStage?: string;
  Owner?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export const NotificationDetail: React.FC<NotificationDetailProps> = ({
  open,
  notification,
  onClose,
  onMarkAsRead,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [inactiveCompanies, setInactiveCompanies] = useState<InactiveCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const isInactivityAlert = notification?.id === 'inactivity-alert';

  // Cargar empresas inactivas cuando se abre el drawer y es la notificación de inactividad
  useEffect(() => {
    if (!open) {
      // Resetear estado cuando se cierra el drawer
      setCurrentPage(1);
      setInactiveCompanies([]);
      return;
    }

    if (!isInactivityAlert) {
      return;
    }

    const fetchInactiveCompanies = async (page: number) => {
      try {
        setLoadingCompanies(true);
        const response = await api.get('/companies/inactive', {
          params: {
            page,
            limit,
          },
        });
        setInactiveCompanies(response.data.companies || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error: any) {
        console.error('Error obteniendo empresas inactivas:', error);
        setInactiveCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchInactiveCompanies(currentPage);
  }, [open, isInactivityAlert, currentPage, limit]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // Scroll al inicio cuando cambia la página
    const contentBox = document.querySelector('[data-notification-content]');
    if (contentBox) {
      contentBox.scrollTop = 0;
    }
  };

  const handleCompanyClick = (companyId: number) => {
    navigate(`/companies/${companyId}`);
    onClose();
  };

  // Función helper para obtener el label de la etapa
  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacto': 'Contacto',
      'reunion_agendada': 'Reunión Agendada',
      'reunion_efectiva': 'Reunión Efectiva',
      'propuesta_economica': 'Propuesta Económica',
      'negociacion': 'Negociación',
      'licitacion': 'Licitación',
      'licitacion_etapa_final': 'Licitación Etapa Final',
      'cierre_ganado': 'Cierre Ganado',
      'firma_contrato': 'Firma de Contrato',
      'activo': 'Activo',
      'cierre_perdido': 'Cierre Perdido',
      'lead_inactivo': 'Inactivo',
      'cliente_perdido': 'Cierre Perdido',
    };
    return labels[stage] || stage;
  };

  const getStageColor = (stage: string) => getStageColorUtil(theme, stage);

  if (!notification) return null;

  const iconColor = getNotificationColor(notification.type, notification.id);
  const isUnread = !notification.read;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      hideBackdrop={true}
      sx={{
        zIndex: 1500,
        '& .MuiDrawer-paper': {
          width: { xs: '100vw', sm: 420 },
          bgcolor: theme.palette.mode === 'dark'
            ? '#141A21'
            : '#ffffff',
          backdropFilter: theme.palette.mode === 'light' ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: theme.palette.mode === 'light' ? 'blur(10px)' : 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? '-4px 0 32px rgba(0, 0, 0, 0.6), -1px 0 8px rgba(0, 0, 0, 0.3)'
            : '-4px 0 24px rgba(0, 0, 0, 0.1)',
          border: 'none',
        },
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.mode === 'dark'
            ? '#141A21'
            : '#ffffff',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            pb: 2,
            bgcolor: 'transparent',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              {getNotificationIcon(notification.type, notification.id)}
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
                    bgcolor: theme.palette.mode === 'dark'
                      ? `${iconColor}25`
                      : `${iconColor}20`,
                    color: iconColor,
                    fontWeight: 600,
                    border: 'none',
                  }}
                />
                {isUnread && (
                  <Chip
                    label="No leída"
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}25`
                        : `${taxiMonterricoColors.green}20`,
                      color: taxiMonterricoColors.green,
                      fontWeight: 600,
                      border: 'none',
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
        </Box>

        {/* Content */}
        <Box
          data-notification-content
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isInactivityAlert ? (
            <>
              {loadingCompanies ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : inactiveCompanies.length > 0 ? (
                <>
                  <List sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                    {inactiveCompanies.map((company) => (
                      <ListItem
                        key={company.id}
                        onClick={() => handleCompanyClick(company.id)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: 'transparent',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: `${iconColor}20`,
                            color: iconColor,
                            width: 36,
                            height: 36,
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Business fontSize="small" />
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 500,
                              }}
                            >
                              {company.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {company.Owner && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {company.Owner.firstName} {company.Owner.lastName}
                                </Typography>
                              )}
                              {!company.Owner && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Sin propietario
                                </Typography>
                              )}
                              {company.lifecycleStage && (
                                <Chip
                                  label={getStageLabel(company.lifecycleStage)}
                                  size="small"
                                  sx={{
                                    width: 'fit-content',
                                    height: 20,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    bgcolor: getStageColor(company.lifecycleStage).bg,
                                    color: getStageColor(company.lifecycleStage).color,
                                    border: 'none',
                                  }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size="small"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            color: theme.palette.text.secondary,
                            '&.Mui-selected': {
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.08)',
                              color: theme.palette.text.primary,
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    No hay empresas inactivas
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </Box>

      </Box>
    </Drawer>
  );
};
