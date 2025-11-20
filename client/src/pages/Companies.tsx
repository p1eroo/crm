import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputAdornment,
  Paper,
  Menu,
} from '@mui/material';
import { Add, Edit, Delete, Search, Business, Domain, TrendingUp, TrendingDown, Computer, Visibility } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import axios from 'axios';

interface Company {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  phone?: string;
  ruc?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lifecycleStage: string;
  Owner?: { firstName: string; lastName: string };
}

const Companies: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    phone: '',
    lifecycleStage: 'lead',
    ruc: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});

  // Calcular estadísticas
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.lifecycleStage === 'cierre_ganado').length;

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
  const handlePreview = (company: Company) => {
    navigate(`/companies/${company.id}`);
  };

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/companies', { params });
      setCompanies(response.data.companies || response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        domain: company.domain || '',
        industry: company.industry || '',
        phone: company.phone || '',
        lifecycleStage: company.lifecycleStage,
        ruc: company.ruc || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        domain: '',
        industry: '',
        phone: '',
        lifecycleStage: 'lead',
        ruc: '',
        address: '',
        city: '',
        state: '',
        country: '',
      });
    }
    setRucError('');
    setOpen(true);
  };

  const handleSearchRuc = async () => {
    if (!formData.ruc || formData.ruc.length < 11) {
      setRucError('El RUC debe tener 11 dígitos');
      return;
    }

    setLoadingRuc(true);
    setRucError('');

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setRucError('Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN');
        setLoadingRuc(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/ruc/info/${formData.ruc}`,
        {
          headers: {
            'Authorization': `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Actualizar el formulario con los datos obtenidos
        setFormData({
          ...formData,
          name: data.nombre_o_razon_social || '',
          industry: data.tipo_contribuyente || '',
          address: data.direccion_completa || data.direccion || '',
          city: data.distrito || '',
          state: data.provincia || '',
          country: data.departamento || 'Perú',
        });
      } else {
        setRucError('No se encontró información para este RUC');
      }
    } catch (error: any) {
      console.error('Error al buscar RUC:', error);
      if (error.response?.status === 400) {
        setRucError('RUC no válido o no encontrado');
      } else if (error.response?.status === 401) {
        setRucError('Error de autenticación con la API');
      } else {
        setRucError('Error al consultar el RUC. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompany(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, formData);
      } else {
        await api.post('/companies', formData);
      }
      handleClose();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const handleDelete = (id: number) => {
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/companies/${companyToDelete}`);
      fetchCompanies();
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar la empresa. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStatusMenuAnchor({ ...statusMenuAnchor, [companyId]: event.currentTarget });
  };

  const handleStatusMenuClose = (companyId: number) => {
    setStatusMenuAnchor({ ...statusMenuAnchor, [companyId]: null });
  };

  const handleStatusChange = async (event: React.MouseEvent<HTMLElement>, companyId: number, isActive: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStatus({ ...updatingStatus, [companyId]: true });
    try {
      // Si queremos activar, establecer a 'cierre_ganado', si queremos desactivar, establecer a 'lead'
      const newStage = isActive ? 'cierre_ganado' : 'lead';
      await api.put(`/companies/${companyId}`, { lifecycleStage: newStage });
      // Actualizar la empresa en la lista
      setCompanies(companies.map(company => 
        company.id === companyId 
          ? { ...company, lifecycleStage: newStage }
          : company
      ));
      handleStatusMenuClose(companyId);
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('Error al actualizar el estado. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [companyId]: false });
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'subscriber': 'default',
      'lead': 'info',
      'marketing qualified lead': 'primary',
      'sales qualified lead': 'primary',
      'opportunity': 'warning',
      'customer': 'success',
      'evangelist': 'success',
    };
    return colors[stage] || 'default';
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
            {/* Total Companies */}
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
                <Business sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Total Empresas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {totalCompanies.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    12% este mes
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Active Companies */}
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
                <Domain sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Empresas Activas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {activeCompanies.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    5% este mes
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* New This Month */}
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
                  Nuevas Este Mes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {Math.min(totalCompanies, 15)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: -0.75 }}>
                  {Array.from({ length: Math.min(5, totalCompanies) }).map((_, idx) => {
                    const company = companies[idx];
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
                        {company ? company.name.substring(0, 2).toUpperCase() : String.fromCharCode(65 + idx)}
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
                Todas las Empresas
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
                Empresas Activas
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
                Nueva Empresa
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tabla de empresas con diseño mejorado */}
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
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '30%' } }}>
                  Nombre de Empresa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: 1, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '20%' } }}>
                  Dominio
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                  Industria
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                  Teléfono
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}>
                  Etapa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow 
                  key={company.id}
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: '#fafafa' },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '30%' } }}>
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
                        {getInitials(company.name)}
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
                        {company.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '20%' } }}>
                    {company.domain ? (
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
                        {company.domain}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    {company.industry ? (
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
                        {company.industry}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    {company.phone ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1a1a1a',
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                        }}
                      >
                        {company.phone}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell 
                    sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Chip
                      label={company.lifecycleStage === 'cierre_ganado' ? 'Activo' : 'Inactivo'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStatusMenuOpen(e, company.id);
                      }}
                      disabled={updatingStatus[company.id]}
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 20, md: 24 },
                        bgcolor: company.lifecycleStage === 'cierre_ganado'
                          ? '#E8F5E9' 
                          : '#FFEBEE',
                        color: company.lifecycleStage === 'cierre_ganado'
                          ? '#2E7D32'
                          : '#C62828',
                        border: 'none',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                    <Menu
                      anchorEl={statusMenuAnchor[company.id]}
                      open={Boolean(statusMenuAnchor[company.id])}
                      onClose={(e, reason) => {
                        if (e && 'stopPropagation' in e) {
                          (e as React.MouseEvent).stopPropagation();
                        }
                        handleStatusMenuClose(company.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      PaperProps={{
                        sx: {
                          minWidth: 150,
                          mt: 0.5,
                          borderRadius: 1.5,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      <MenuItem
                        onClick={(e) => handleStatusChange(e, company.id, true)}
                        disabled={updatingStatus[company.id] || company.lifecycleStage === 'cierre_ganado'}
                        sx={{
                          fontSize: '0.875rem',
                          color: '#2E7D32',
                          '&:hover': {
                            bgcolor: '#E8F5E9',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5,
                          }
                        }}
                      >
                        Activo
                      </MenuItem>
                      <MenuItem
                        onClick={(e) => handleStatusChange(e, company.id, false)}
                        disabled={updatingStatus[company.id] || company.lifecycleStage !== 'cierre_ganado'}
                        sx={{
                          fontSize: '0.875rem',
                          color: '#C62828',
                          '&:hover': {
                            bgcolor: '#FFEBEE',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5,
                          }
                        }}
                      >
                        Inactivo
                      </MenuItem>
                    </Menu>
                  </TableCell>
                  <TableCell sx={{ px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Vista previa">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(company);
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
                            handleDelete(company.id);
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
          {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Campo RUC con botón de búsqueda */}
            <TextField
              label="RUC"
              value={formData.ruc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Solo números
                setFormData({ ...formData, ruc: value });
                setRucError('');
              }}
              placeholder="Ingrese RUC (11 dígitos)"
              error={!!rucError}
              helperText={rucError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSearchRuc}
                      disabled={loadingRuc || !formData.ruc || formData.ruc.length < 11}
                      sx={{
                        color: taxiMonterricoColors.green,
                        '&:hover': {
                          bgcolor: `${taxiMonterricoColors.green}15`,
                        },
                        '&.Mui-disabled': {
                          color: '#bdbdbd',
                        },
                      }}
                    >
                      {loadingRuc ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Dominio"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Tipo de Contribuyente / Industria"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Distrito"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Provincia"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <TextField
              label="Departamento"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
            >
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="contacto">Contacto</MenuItem>
              <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
              <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
              <MenuItem value="propuesta_economica">Propuesta Económica</MenuItem>
              <MenuItem value="negociacion">Negociación</MenuItem>
              <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
              <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCompany ? 'Actualizar' : 'Crear'}
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
            ¿Estás seguro de que deseas eliminar esta empresa?
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            Esta acción no se puede deshacer. La empresa será eliminada permanentemente del sistema.
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

export default Companies;





