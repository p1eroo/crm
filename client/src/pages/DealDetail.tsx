import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Card,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Note,
  Email,
  Phone,
  AttachMoney,
  Person,
  Business,
  CalendarToday,
  TrendingUp,
  Assignment,
  MoreVert,
} from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import negocioLogo from '../assets/negocio.png';

interface DealDetail {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  priority?: 'baja' | 'media' | 'alta';
  description?: string;
  Contact?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  Company?: {
    id: number;
    name: string;
    domain?: string;
    phone?: string;
  };
  Owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [priorityAnchorEl, setPriorityAnchorEl] = useState<null | HTMLElement>(null);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchActivities();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      const response = await api.get(`/deals/${id}`);
      setDeal(response.data);
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities', {
        params: { dealId: id },
      });
      const activitiesData = response.data.activities || response.data || [];
      
      // Obtener tareas asociadas
      const tasksResponse = await api.get('/tasks', {
        params: { dealId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];
      
      const tasksAsActivities = tasksData.map((task: any) => ({
        id: task.id,
        type: 'task',
        subject: task.title,
        description: task.description,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        User: task.CreatedBy || task.AssignedTo,
        isTask: true,
        status: task.status,
        priority: task.priority,
      }));
      
      const allActivities = [...activitiesData, ...tasksAsActivities].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return dateB - dateA;
      });
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (deal?.name) {
      const words = deal.name.trim().split(' ');
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      }
      return deal.name.substring(0, 2).toUpperCase();
    }
    return '--';
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'lead': '#EF4444',
      'contacto': '#F59E0B',
      'reunion_agendada': '#F59E0B',
      'reunion_efectiva': '#F59E0B',
      'propuesta_economica': '#3B82F6',
      'negociacion': '#10B981',
      'licitacion': '#10B981',
      'licitacion_etapa_final': '#10B981',
      'cierre_ganado': '#10B981',
      'cierre_perdido': '#EF4444',
      'firma_contrato': '#10B981',
      'activo': '#10B981',
      'cliente_perdido': '#EF4444',
      'lead_inactivo': '#EF4444',
    };
    return colors[stage] || '#6B7280';
  };

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
      'cierre_perdido': 'Cierre Perdido',
      'firma_contrato': 'Firma de Contrato',
      'activo': 'Activo',
      'cliente_perdido': 'Cliente Perdido',
      'lead_inactivo': 'Lead Inactivo',
    };
    return labels[stage] || stage;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      const thousands = value / 1000;
      return `S/ ${thousands.toFixed(1)}k`;
    }
    return `S/ ${value.toFixed(0)}`;
  };

  const handleOpenNote = () => {
    setNoteData({ subject: '', description: '' });
    setNoteOpen(true);
  };

  const handlePriorityClick = (event: React.MouseEvent<HTMLElement>) => {
    setPriorityAnchorEl(event.currentTarget);
  };

  const handlePriorityClose = () => {
    setPriorityAnchorEl(null);
  };

  const handlePriorityChange = async (newPriority: 'baja' | 'media' | 'alta') => {
    if (!deal || updatingPriority) return;
    
    setUpdatingPriority(true);
    try {
      await api.put(`/deals/${deal.id}`, {
        priority: newPriority,
      });
      setDeal({ ...deal, priority: newPriority });
      setSuccessMessage('Prioridad actualizada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      handlePriorityClose();
    } catch (error) {
      console.error('Error updating priority:', error);
      setSuccessMessage('Error al actualizar la prioridad');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteData.description.trim()) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/activities', {
        type: 'note',
        subject: noteData.subject || `Nota para ${deal?.name || 'Negocio'}`,
        description: noteData.description,
        dealId: id,
      });
      setSuccessMessage('Nota creada exitosamente');
      setNoteOpen(false);
      setNoteData({ subject: '', description: '' });
      fetchActivities();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEmail = () => {
    const email = deal?.Contact?.email || deal?.Company?.phone || '';
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  };

  const handleOpenCall = () => {
    const phone = deal?.Contact?.phone || deal?.Company?.phone || '';
    if (phone) {
      window.open(`tel:${phone}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box>
        <Typography>Negocio no encontrado</Typography>
        <Button onClick={() => navigate('/deals')}>Volver a Negocios</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default,
      minHeight: '100vh',
      pb: { xs: 2, sm: 4, md: 8 },
      px: { xs: 0, sm: 0, md: 0.25, lg: 0.5 },
      pt: { xs: 0.25, sm: 0.5, md: 1 },
    }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          {/* Contenido principal */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 3 },
      }}>
            {/* Columna Izquierda - Información del Negocio */}
            <Box sx={{ 
              width: { xs: '100%', md: '350px' },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
          {/* Card 1: Avatar, Nombre y Botones */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}>
            {/* Header: Avatar con valor debajo, Nombre a la derecha, botón de opciones a la derecha */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      src={negocioLogo}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: negocioLogo ? 'transparent' : taxiMonterricoColors.green,
                        fontSize: '1rem',
                      }}
                    >
                      {!negocioLogo && getInitials(deal.name)}
                    </Avatar>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {deal.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, pl: 0.5 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                  Valor: {formatCurrency(deal.amount || 0)}
                </Typography>
                {deal.closeDate && (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                    Fecha de cierre: {new Date(deal.closeDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                  Etapa del negocio: {getStageLabel(deal.stage)}
                </Typography>
              </Box>
            </Box>

            {/* Acciones Rápidas */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box 
                onClick={handleOpenNote}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Note sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Nota
                </Typography>
              </Box>
              
              <Box 
                onClick={handleOpenEmail}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Email sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Correo
                </Typography>
              </Box>
              
              <Box 
                onClick={handleOpenCall}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Phone sx={{ color: '#20B2AA', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 400 }}>
                  Llamar
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Card 2: Información del Negocio */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Información del Negocio
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Propietario del negocio
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5, fontSize: '0.875rem' }}>
                  {deal.Owner ? `${deal.Owner.firstName} ${deal.Owner.lastName}` : '--'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Último contacto
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5, fontSize: '0.875rem' }}>
                  {activities.length > 0 && activities[0].createdAt
                    ? new Date(activities[0].createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '--'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Tipo de negocio
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5, fontSize: '0.875rem' }}>
                  Cliente nuevo
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                  Prioridad
                </Typography>
                <Box 
                  onClick={handlePriorityClick}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mt: 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: deal.priority === 'baja' ? '#20B2AA' : deal.priority === 'media' ? '#F59E0B' : deal.priority === 'alta' ? '#EF4444' : '#10B981',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {deal.priority || 'Baja'}
                  </Typography>
                </Box>
                <Menu
                  anchorEl={priorityAnchorEl}
                  open={Boolean(priorityAnchorEl)}
                  onClose={handlePriorityClose}
                  PaperProps={{
                    sx: {
                      bgcolor: theme.palette.background.paper,
                      boxShadow: theme.shadows[3],
                      borderRadius: 1.5,
                      minWidth: 150,
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => handlePriorityChange('baja')}
                    disabled={updatingPriority}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#20B2AA' }} />
                      Baja
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => handlePriorityChange('media')}
                    disabled={updatingPriority}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                      Media
                    </Box>
                  </MenuItem>
                  <MenuItem
                    onClick={() => handlePriorityChange('alta')}
                    disabled={updatingPriority}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                      Alta
                    </Box>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Card>


        </Box>

        {/* Columna Derecha - Descripción y Actividades */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              minHeight: 'auto',
              '& .MuiTabs-flexContainer': {
                minHeight: 'auto',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                minHeight: 'auto',
                padding: '6px 16px',
                paddingBottom: '4px',
                lineHeight: 1.2,
              },
              '& .MuiTabs-indicator': {
                bottom: 0,
                height: 2,
              },
            }}
          >
            <Tab label="Descripción" />
            <Tab label="Actividades" />
          </Tabs>

          <Card sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            bgcolor: theme.palette.background.paper,
            flex: 1,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Vista de Descripción */}
            {activeTab === 0 && (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {deal.description ? (
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>
                    {deal.description}
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                      Actividades Recientes
                    </Typography>
                    {activities.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay actividades registradas
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        gap: 2 
                      }}>
                        {activities.slice(0, 6).map((activity) => (
                          <Paper
                            key={activity.id}
                            sx={{
                              p: 2,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1.5,
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: activity.type === 'note' ? taxiMonterricoColors.orange : taxiMonterricoColors.green,
                                }}
                              >
                                {activity.type === 'note' ? <Note /> : <Assignment />}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {activity.subject || activity.title}
                                </Typography>
                                {activity.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {activity.description}
                                  </Typography>
                                )}
                                {activity.User && (
                                  <Typography variant="caption" color="text.secondary">
                                    Por {activity.User.firstName} {activity.User.lastName}
                                    {activity.createdAt && (
                                      <span> • {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}</span>
                                    )}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Vista de Actividades */}
            {activeTab === 1 && (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay actividades registradas
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activities.map((activity) => (
                      <Paper
                        key={activity.id}
                        sx={{
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: activity.type === 'note' ? taxiMonterricoColors.orange : taxiMonterricoColors.green,
                            }}
                          >
                            {activity.type === 'note' ? <Note /> : <Assignment />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {activity.subject || activity.title}
                            </Typography>
                            {activity.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {activity.description}
                              </Typography>
                            )}
                            {activity.User && (
                              <Typography variant="caption" color="text.secondary">
                                Por {activity.User.firstName} {activity.User.lastName}
                                {activity.createdAt && (
                                  <span> • {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}</span>
                                )}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* Dialog para crear nota */}
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Nota</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Asunto"
            value={noteData.subject}
            onChange={(e) => setNoteData({ ...noteData, subject: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Descripción"
            value={noteData.description}
            onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveNote} variant="contained" disabled={saving || !noteData.description.trim()}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DealDetail;

