import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Avatar,
  FormControl,
  Select,
  Tooltip,
  Paper,
  Menu,
} from '@mui/material';
import { Add, Edit, Delete, Search, AttachMoney, TrendingUp, TrendingDown, Computer, Visibility } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';

interface Deal {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  Contact?: { firstName: string; lastName: string };
  Company?: { name: string };
}

const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    stage: 'lead',
    closeDate: '',
    probability: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stageMenuAnchor, setStageMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStage, setUpdatingStage] = useState<{ [key: number]: boolean }>({});

  // Calcular estadísticas
  const totalDeals = deals.length;
  const wonDeals = deals.filter(d => d.stage === 'cierre_ganado' || d.stage === 'closed won' || d.stage === 'won').length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const wonValue = deals
    .filter(d => d.stage === 'cierre_ganado' || d.stage === 'closed won' || d.stage === 'won')
    .reduce((sum, deal) => sum + (deal.amount || 0), 0);

  // Función para obtener iniciales
  const getInitials = (name: string) => {
    if (!name) return '--';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Función para vista previa
  const handlePreview = (deal: Deal) => {
    // Navegar a detalles del deal si existe la ruta
    console.log('Preview deal:', deal);
  };

  // Opciones de etapa según las imágenes proporcionadas
  const stageOptions = [
    { value: 'lead', label: 'Lead' },
    { value: 'contacto', label: 'Contacto' },
    { value: 'reunion_agendada', label: 'Reunión Agendada' },
    { value: 'reunion_efectiva', label: 'Reunión Efectiva' },
    { value: 'propuesta_economica', label: 'Propuesta económica' },
    { value: 'negociacion', label: 'Negociación' },
    { value: 'cierre_ganado', label: 'Cierre ganado' },
    { value: 'cierre_perdido', label: 'Cierre perdido' },
  ];

  // Función para obtener el label de la etapa
  const getStageLabel = (stage: string) => {
    const option = stageOptions.find(opt => opt.value === stage);
    return option ? option.label : stage;
  };

  // Función para obtener el color de la etapa
  const getStageColor = (stage: string) => {
    if (stage === 'cierre_ganado') {
      return { bg: '#E8F5E9', color: '#2E7D32' };
    } else if (stage === 'cierre_perdido') {
      return { bg: '#FFEBEE', color: '#C62828' };
    } else if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
      return { bg: '#FFF3E0', color: '#E65100' };
    }
    return { bg: '#E3F2FD', color: '#1976D2' };
  };

  useEffect(() => {
    fetchDeals();
  }, [search]);

  const fetchDeals = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/deals', { params });
      setDeals(response.data.deals || response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        name: deal.name,
        amount: deal.amount.toString(),
        stage: deal.stage,
        closeDate: deal.closeDate ? deal.closeDate.split('T')[0] : '',
        probability: deal.probability?.toString() || '',
      });
    } else {
      setEditingDeal(null);
      setFormData({
        name: '',
        amount: '',
        stage: 'lead',
        closeDate: '',
        probability: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDeal(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
      };
      if (editingDeal) {
        await api.put(`/deals/${editingDeal.id}`, data);
      } else {
        await api.post('/deals', data);
      }
      handleClose();
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDelete = (id: number) => {
    setDealToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/deals/${dealToDelete}`);
      fetchDeals();
      setDeleteDialogOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert('Error al eliminar el negocio. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDealToDelete(null);
  };

  const handleStageMenuOpen = (event: React.MouseEvent<HTMLElement>, dealId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStageMenuAnchor({ ...stageMenuAnchor, [dealId]: event.currentTarget });
  };

  const handleStageMenuClose = (dealId: number) => {
    setStageMenuAnchor({ ...stageMenuAnchor, [dealId]: null });
  };

  const handleStageChange = async (event: React.MouseEvent<HTMLElement>, dealId: number, newStage: string) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStage({ ...updatingStage, [dealId]: true });
    try {
      await api.put(`/deals/${dealId}`, { stage: newStage });
      // Actualizar el deal en la lista
      setDeals(deals.map(deal => 
        deal.id === dealId 
          ? { ...deal, stage: newStage }
          : deal
      ));
      handleStageMenuClose(dealId);
    } catch (error) {
      console.error('Error updating deal stage:', error);
      alert('Error al actualizar la etapa. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStage({ ...updatingStage, [dealId]: false });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#f5f7fa', 
      minHeight: '100vh',
      pb: { xs: 3, sm: 6, md: 8 },
      px: { xs: 3, sm: 6, md: 8 },
      pt: { xs: 4, sm: 6, md: 6 },
    }}>
      {/* Cards de resumen - Diseño con todas las tarjetas en un contenedor */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        bgcolor: 'white',
        mb: 4,
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {/* Total Deals */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <AttachMoney sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Total Negocios
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {totalDeals.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    8% este mes
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Won Deals */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <TrendingUp sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Negocios Ganados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {wonDeals.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    3% este mes
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Total Value */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <Computer sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Valor Total
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  ${(totalValue / 1000).toFixed(0)}k
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: -0.75 }}>
                  {Array.from({ length: Math.min(5, totalDeals) }).map((_, idx) => {
                    const deal = deals[idx];
                    return (
                      <Avatar
                        key={idx}
                        sx={{
                          width: 36,
                          height: 36,
                          border: '2px solid white',
                          ml: idx > 0 ? -0.75 : 0,
                          bgcolor: taxiMonterricoColors.green,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          zIndex: 5 - idx,
                        }}
                      >
                        {deal ? getInitials(deal.name) : String.fromCharCode(65 + idx)}
                      </Avatar>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sección de tabla */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        bgcolor: 'white',
      }}>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          {/* Header de la tabla con título, búsqueda y ordenamiento */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.25 }}>
                Todos los Negocios
              </Typography>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                }}
                sx={{
                  fontSize: '0.875rem',
                  color: '#1976d2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Negocios Ganados
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: '#9e9e9e', fontSize: 20 }} />,
                }}
                sx={{ 
                  minWidth: 200,
                  bgcolor: 'white',
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                  }}
                >
                  <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                  <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpen()}
                sx={{
                  bgcolor: taxiMonterricoColors.green,
                  '&:hover': {
                    bgcolor: taxiMonterricoColors.green,
                    opacity: 0.9,
                  },
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  px: 2.5,
                  py: 1,
                }}
              >
                Nuevo Negocio
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tabla de negocios con diseño mejorado */}
        <TableContainer 
          component={Paper}
          sx={{ 
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#555',
              },
            },
          }}
        >
          <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '25%' } }}>
                  Nombre del Negocio
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: 1, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                  Monto
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                  Etapa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                  Probabilidad
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '18%' } }}>
                  Contacto
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                  Empresa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deals.map((deal) => (
                <TableRow 
                  key={deal.id}
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: '#fafafa' },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '25%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                      <Avatar
                        sx={{
                          width: { xs: 32, md: 40 },
                          height: { xs: 32, md: 40 },
                          bgcolor: taxiMonterricoColors.green,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 600,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(deal.name)}
                      </Avatar>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#1a1a1a',
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {deal.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1a1a1a',
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        fontWeight: 500,
                      }}
                    >
                      ${deal.amount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell 
                    sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Chip
                      label={getStageLabel(deal.stage)}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStageMenuOpen(e, deal.id);
                      }}
                      disabled={updatingStage[deal.id]}
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 20, md: 24 },
                        bgcolor: getStageColor(deal.stage).bg,
                        color: getStageColor(deal.stage).color,
                        border: 'none',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                    <Menu
                      anchorEl={stageMenuAnchor[deal.id]}
                      open={Boolean(stageMenuAnchor[deal.id])}
                      onClose={(e: React.MouseEvent | {} | undefined) => {
                        if (e && 'stopPropagation' in e) {
                          (e as React.MouseEvent).stopPropagation();
                        }
                        handleStageMenuClose(deal.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      PaperProps={{
                        sx: {
                          minWidth: 200,
                          mt: 0.5,
                          borderRadius: 1.5,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      {stageOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          onClick={(e) => handleStageChange(e, deal.id, option.value)}
                          disabled={updatingStage[deal.id] || deal.stage === option.value}
                          sx={{
                            fontSize: '0.875rem',
                            color: option.value === 'cierre_ganado' ? '#2E7D32' : option.value === 'cierre_perdido' ? '#C62828' : '#1a1a1a',
                            '&:hover': {
                              bgcolor: option.value === 'cierre_ganado' ? '#E8F5E9' : option.value === 'cierre_perdido' ? '#FFEBEE' : '#f5f5f5',
                            },
                            '&.Mui-disabled': {
                              opacity: 0.5,
                            }
                          }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                    {deal.probability ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1a1a1a',
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                        }}
                      >
                        {deal.probability}%
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '18%' } }}>
                    {deal.Contact ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1a1a1a',
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {deal.Contact.firstName} {deal.Contact.lastName}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                    {deal.Company?.name ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1a1a1a',
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {deal.Company.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Vista previa">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(deal);
                          }}
                          sx={{
                            color: '#757575',
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: taxiMonterricoColors.green,
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                          }}
                        >
                          <Visibility sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deal.id);
                          }}
                          sx={{
                            color: '#757575',
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: '#d32f2f',
                              bgcolor: '#ffebee',
                            },
                          }}
                        >
                          <Delete sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDeal ? 'Editar Negocio' : 'Nuevo Negocio'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <TextField
              select
              label="Etapa"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            >
              {stageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha de Cierre"
              type="date"
              value={formData.closeDate}
              onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Probabilidad (%)"
              type="number"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDeal ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1.5,
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Delete sx={{ color: '#d32f2f', fontSize: 28 }} />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#1a1a1a', mb: 1 }}>
            ¿Estás seguro de que deseas eliminar este negocio?
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            Esta acción no se puede deshacer. El negocio será eliminado permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: '1px solid #e0e0e0',
          gap: 1,
        }}>
          <Button 
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={{
              textTransform: 'none',
              color: '#757575',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#f5f5f5',
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1.5,
              px: 2.5,
              bgcolor: '#d32f2f',
              '&:hover': {
                bgcolor: '#b71c1c',
              },
              '&.Mui-disabled': {
                bgcolor: '#ffcdd2',
                color: '#ffffff',
              }
            }}
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <Delete />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deals;




