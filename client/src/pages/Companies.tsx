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
  useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Search, Business, Domain, TrendingUp, TrendingDown, Computer, Visibility, UploadFile, FileDownload, Warning, CheckCircle } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import axios from 'axios';
import * as XLSX from 'xlsx';
import empresaLogo from '../assets/empresa.png';

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
  const theme = useTheme();
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
  const [rucInfo, setRucInfo] = useState<any>(null);
  const [rucDebts, setRucDebts] = useState<any>(null);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const exportData = companies.map((company) => ({
      'Nombre': company.name || '--',
      'Dominio': company.domain || '--',
      'Industria': company.industry || '--',
      'Teléfono': company.phone || '--',
      'RUC': company.ruc || '--',
      'Dirección': company.address || '--',
      'Ciudad': company.city || '--',
      'Estado/Provincia': company.state || '--',
      'País': company.country || '--',
      'Etapa': company.lifecycleStage || '--',
      'Estado': company.lifecycleStage === 'cierre_ganado' ? 'Activo' : 'Inactivo',
      'Fecha de Creación': (company as any).createdAt ? new Date((company as any).createdAt).toLocaleDateString('es-ES') : '--',
    }));

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 25 }, // Dominio
      { wch: 20 }, // Industria
      { wch: 15 }, // Teléfono
      { wch: 15 }, // RUC
      { wch: 30 }, // Dirección
      { wch: 15 }, // Ciudad
      { wch: 18 }, // Estado/Provincia
      { wch: 15 }, // País
      { wch: 15 }, // Etapa
      { wch: 12 }, // Estado
      { wch: 18 }, // Fecha de Creación
    ];
    ws['!cols'] = colWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');

    // Generar el nombre del archivo con la fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Empresas_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      // Procesar cada fila y crear empresas
      const companiesToCreate = jsonData.map((row) => {
        return {
          name: (row['Nombre'] || '').toString().trim() || 'Sin nombre',
          domain: (row['Dominio'] || '').toString().trim() || undefined,
          industry: (row['Industria'] || '').toString().trim() || undefined,
          phone: (row['Teléfono'] || '').toString().trim() || undefined,
          ruc: (row['RUC'] || '').toString().trim() || undefined,
          address: (row['Dirección'] || '').toString().trim() || undefined,
          city: (row['Ciudad'] || '').toString().trim() || undefined,
          state: (row['Estado/Provincia'] || '').toString().trim() || undefined,
          country: (row['País'] || '').toString().trim() || undefined,
          lifecycleStage: 'lead',
        };
      }).filter(company => company.name !== 'Sin nombre'); // Filtrar filas vacías

      // Crear empresas en el backend
      let successCount = 0;
      let errorCount = 0;

      for (const companyData of companiesToCreate) {
        try {
          await api.post('/companies', companyData);
          successCount++;
        } catch (error) {
          console.error('Error creating company:', error);
          errorCount++;
        }
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Mostrar mensaje de resultado
      alert(`Importación completada:\n${successCount} empresas creadas exitosamente\n${errorCount} empresas con errores`);

      // Recargar la lista de empresas
      fetchCompanies();
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error al importar el archivo. Por favor, verifica que el formato sea correcto.');
    } finally {
      setImporting(false);
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
    setRucInfo(null);
    setRucDebts(null);
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
        
        // Guardar toda la información para mostrarla en el panel lateral
        setRucInfo(data);
        
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

        // Consultar deudas automáticamente después de obtener la información del RUC
        await handleSearchDebts(formData.ruc);
      } else {
        setRucError('No se encontró información para este RUC');
        setRucInfo(null);
        setRucDebts(null);
      }
    } catch (error: any) {
      console.error('Error al buscar RUC:', error);
      setRucInfo(null);
      setRucDebts(null);
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

  const handleSearchDebts = async (ruc: string) => {
    if (!ruc || ruc.length < 11) return;

    setLoadingDebts(true);
    setRucDebts(null);

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setLoadingDebts(false);
        return;
      }

      // Intentar con diferentes endpoints posibles de Factiliza
      // Nota: Verifica la documentación oficial de Factiliza para el endpoint correcto
      // Documentación: https://docs.factiliza.com
      const endpoints = [
        `https://api.factiliza.com/v1/deudas/${ruc}`, // Endpoint según documentación
        `https://api.factiliza.com/v1/ruc/${ruc}/deudas`, // Formato alternativo
        `https://api.factiliza.com/v1/sunat/ruc/${ruc}/deudas`, // Formato con sunat
        `https://api.factiliza.com/v1/ruc/deudas/${ruc}`,
        `https://api.factiliza.com/v1/ruc/deuda/${ruc}`,
        `https://api.factiliza.com/v1/sunat/deudas/${ruc}`,
        `https://api.factiliza.com/v1/consulta/deudas/${ruc}`, // Formato alternativo
      ];

      let debtsFound = false;

      console.log('🔍 Consultando deudas en Factiliza para RUC:', ruc);
      console.log('📋 Endpoints a probar:', endpoints);

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Probando endpoint: ${endpoint}`);
          const debtsResponse = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${factilizaToken}`,
            },
            timeout: 5000,
          });

          console.log(`✅ Respuesta exitosa de ${endpoint}:`, debtsResponse.data);

          if (debtsResponse.data && (debtsResponse.data.success || debtsResponse.data.data)) {
            const debtsData = debtsResponse.data.data || debtsResponse.data;
            
            console.log('📊 Datos de deudas recibidos:', debtsData);
            
            // Normalizar los datos a un formato común
            const normalizedDebts = {
              tiene_deudas: debtsData.tiene_deudas !== undefined 
                ? debtsData.tiene_deudas 
                : (debtsData.deudas && debtsData.deudas.length > 0) 
                  ? true 
                  : false,
              total_deuda: debtsData.total_deuda || debtsData.total || debtsData.monto_total || null,
              deudas: debtsData.deudas || debtsData.deuda || debtsData.detalle || [],
            };

            console.log('✅ Deudas normalizadas:', normalizedDebts);
            setRucDebts(normalizedDebts);
            debtsFound = true;
            break;
          } else {
            console.log(`⚠️ Respuesta sin datos válidos de ${endpoint}`);
          }
        } catch (endpointError: any) {
          // Mostrar errores detallados
          const errorStatus = endpointError.response?.status;
          const errorData = endpointError.response?.data;
          
          console.error(`❌ Error en endpoint ${endpoint}:`, {
            status: errorStatus,
            statusText: endpointError.response?.statusText,
            message: endpointError.message,
            data: errorData,
          });
          
          // Si es 401, el token puede ser inválido o el endpoint requiere autenticación diferente
          if (errorStatus === 401) {
            console.warn(`🔐 Error de autenticación (401) en ${endpoint}`);
            console.warn('💡 Verifica que tu token sea válido y tenga permisos para consultar deudas');
          }
          
          // Si es 403, el plan puede no incluir este servicio
          if (errorStatus === 403) {
            console.warn(`🚫 Acceso denegado (403) en ${endpoint}`);
            console.warn('💡 Tu plan de Factiliza puede no incluir el servicio de consulta de deudas');
            console.warn('💡 Contacta a soporte de Factiliza para verificar qué servicios incluye tu plan');
          }
          
          // Si es 404, el endpoint no existe
          if (errorStatus === 404) {
            console.log(`📍 Endpoint no encontrado (404): ${endpoint}`);
          }
          
          // Continuar con el siguiente endpoint si este falla
          if (errorStatus !== 404 && errorStatus !== 400) {
            console.log(`⚠️ Error no crítico en ${endpoint}, probando siguiente...`);
          }
        }
      }

      // Si no se encontró información en Factiliza
      if (!debtsFound) {
        console.log('⚠️ No se encontró información de deudas en Factiliza');
      } else {
        console.log('✅ Deudas obtenidas exitosamente de Factiliza');
      }
    } catch (error: any) {
      console.error('Error al buscar deudas:', error);
    } finally {
      setLoadingDebts(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompany(null);
    setRucInfo(null);
    setRucDebts(null);
    setRucError('');
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
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 3, sm: 6, md: 8 },
      px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      pt: { xs: 2, sm: 3, md: 3 },
    }}>
      {/* Cards de resumen - Diseño con todas las tarjetas en un contenedor */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
        bgcolor: theme.palette.background.paper,
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Total Empresas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Empresas Activas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Nuevas Este Mes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
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
                          border: `2px solid ${theme.palette.background.paper}`,
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
        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper,
      }}>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          {/* Header de la tabla con título, búsqueda y ordenamiento */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.25 }}>
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
                  color: theme.palette.primary.main,
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
                  startAdornment: <Search sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 20 }} />,
                }}
                sx={{ 
                  minWidth: 200,
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.text.secondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
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
                    bgcolor: theme.palette.background.paper,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.text.secondary,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                  <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={importing ? 'Importando...' : 'Importar'}>
                <IconButton
                  onClick={handleImportFromExcel}
                  disabled={importing}
                  sx={{
                    border: `1px solid ${taxiMonterricoColors.green}`,
                    color: taxiMonterricoColors.green,
                    '&:hover': {
                      borderColor: taxiMonterricoColors.greenDark,
                      bgcolor: `${taxiMonterricoColors.green}10`,
                    },
                    '&:disabled': {
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.disabled,
                    },
                    borderRadius: 1.5,
                    p: 1.25,
                  }}
                >
                  <UploadFile />
                </IconButton>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
              />
              <Tooltip title="Exportar">
                <IconButton
                  onClick={handleExportToExcel}
                  sx={{
                    border: `1px solid ${taxiMonterricoColors.green}`,
                    color: taxiMonterricoColors.green,
                    '&:hover': {
                      borderColor: taxiMonterricoColors.greenDark,
                      bgcolor: `${taxiMonterricoColors.green}10`,
                    },
                    borderRadius: 1.5,
                    p: 1.25,
                  }}
                >
                  <FileDownload />
                </IconButton>
              </Tooltip>
              <Tooltip title="Nueva Empresa">
                <IconButton
                  onClick={() => handleOpen()}
                  sx={{
                    bgcolor: taxiMonterricoColors.green,
                    color: 'white',
                    '&:hover': {
                      bgcolor: taxiMonterricoColors.greenDark,
                    },
                    borderRadius: 1.5,
                    p: 1.25,
                    boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                  }}
                >
                  <Add />
                </IconButton>
              </Tooltip>
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
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? '#666' : '#888',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#777' : '#555',
              },
            },
          }}
        >
          <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '30%' } }}>
                  Nombre de Empresa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                  Industria
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                  Teléfono
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}>
                  Etapa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
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
                    '&:hover': { bgcolor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#fafafa' },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '30%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 } }}>
                      <Avatar
                        src={empresaLogo}
                        sx={{
                          width: { xs: 32, md: 40 },
                          height: { xs: 32, md: 40 },
                          bgcolor: empresaLogo ? 'transparent' : taxiMonterricoColors.green,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 600,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          flexShrink: 0,
                        }}
                      >
                        {!empresaLogo && getInitials(company.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500, 
                            color: theme.palette.text.primary,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.25,
                          }}
                        >
                          {company.name}
                        </Typography>
                        {company.domain && company.domain !== '--' ? (
                          <Typography 
                            component="a"
                            href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption" 
                            onClick={(e) => e.stopPropagation()}
                            sx={{ 
                              color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {company.domain}
                          </Typography>
                        ) : (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            --
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    {company.industry ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {company.industry}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    {company.phone ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                        }}
                      >
                        {company.phone}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
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
                            color: theme.palette.text.secondary,
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
                            color: theme.palette.text.secondary,
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: '#d32f2f',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : '#ffebee',
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

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>
          {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* RUC y Tipo de Contribuyente en la primera fila */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="RUC"
                value={formData.ruc}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Solo números
                  // Limitar a 11 dígitos
                  const limitedValue = value.slice(0, 11);
                  setFormData({ ...formData, ruc: limitedValue });
                  setRucError('');
                }}
                error={!!rucError}
                helperText={rucError}
                inputProps={{ maxLength: 11 }}
                InputLabelProps={{ shrink: true }}
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
                            color: theme.palette.text.disabled,
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
                  flex: '2 1 0%',
                  minWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Tipo de Contribuyente / Industria"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: '3 1 0%',
                  minWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
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
                InputLabelProps={{ shrink: true }}
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
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Departamento"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="lead_inactivo">-5% Lead Inactivo</MenuItem>
              <MenuItem value="cliente_perdido">-1% Cliente perdido</MenuItem>
              <MenuItem value="cierre_perdido">-1% Cierre Perdido</MenuItem>
              <MenuItem value="lead">0% Lead</MenuItem>
              <MenuItem value="contacto">10% Contacto</MenuItem>
              <MenuItem value="reunion_agendada">30% Reunión Agendada</MenuItem>
              <MenuItem value="reunion_efectiva">40% Reunión Efectiva</MenuItem>
              <MenuItem value="propuesta_economica">50% Propuesta Económica</MenuItem>
              <MenuItem value="negociacion">70% Negociación</MenuItem>
              <MenuItem value="licitacion">75% Licitación</MenuItem>
              <MenuItem value="licitacion_etapa_final">85% Licitación Etapa Final</MenuItem>
              <MenuItem value="cierre_ganado">90% Cierre Ganado</MenuItem>
              <MenuItem value="firma_contrato">95% Firma de Contrato</MenuItem>
              <MenuItem value="activo">100% Activo</MenuItem>
            </TextField>
            
            {/* Mensaje de deuda SUNAT */}
            {rucDebts !== null && (
              <Box sx={{ 
                mt: 1.5, 
                p: 1.5, 
                borderRadius: 1,
                bgcolor: rucDebts.tiene_deudas 
                  ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.08)')
                  : (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)'),
                border: `1px solid ${rucDebts.tiene_deudas 
                  ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)')
                  : (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)')}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                {loadingDebts ? (
                  <>
                    <CircularProgress size={16} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Consultando deudas...
                    </Typography>
                  </>
                ) : (
                  <>
                    {rucDebts.tiene_deudas ? (
                      <>
                        <Warning sx={{ color: '#f44336', fontSize: 20 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336', mb: 0.5 }}>
                            La empresa presenta deuda en SUNAT
                          </Typography>
                          {rucDebts.total_deuda && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Total: S/ {rucDebts.total_deuda.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          )}
                        </Box>
                      </>
                    ) : (
                      <>
                        <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          La empresa no presenta deuda en SUNAT
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Box>
            )}
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
          <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            ¿Estás seguro de que deseas eliminar esta empresa?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Esta acción no se puede deshacer. La empresa será eliminada permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}>
          <Button 
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
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





