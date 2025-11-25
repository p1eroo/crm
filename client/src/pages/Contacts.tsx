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
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Link,
  Drawer,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Tooltip,
  Checkbox as MuiCheckbox,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Menu,
  Card,
  CardContent,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Search, 
  Close, 
  Business, 
  Email, 
  Phone, 
  Work, 
  Person,
  Note,
  Assignment,
  Event,
  MoreVert,
  ExpandMore,
  ContentCopy,
  KeyboardArrowDown,
  Settings,
  LocationOn,
  Flag,
  TrendingUp,
  BarChart,
  FilterList,
  AttachFile,
  Visibility,
  People,
  TrendingDown,
  Computer,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  FileDownload,
  UploadFile,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  lifecycleStage: string;
  leadStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  avatar?: string;
  Company?: { 
    id: number;
    name: string;
    domain?: string;
    phone?: string;
  };
  Companies?: Array<{
    id: number;
    name: string;
    domain?: string;
    phone?: string;
  }>;
  Owner?: { 
    id: number;
    firstName: string; 
    lastName: string;
    email: string;
  };
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    lifecycleStage: 'lead',
    dni: '',
    cee: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState('');
  const [loadingCee, setLoadingCee] = useState(false);
  const [ceeError, setCeeError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const exportData = contacts.map((contact) => ({
      'Nombre': `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      'Empresa': contact.Company?.name || contact.Companies?.[0]?.name || '--',
      'Teléfono': contact.phone || contact.mobile || '--',
      'Correo': contact.email || '--',
      'País': contact.country || '--',
      'Ciudad': contact.city || '--',
      'Estado/Provincia': contact.state || '--',
      'Cargo': contact.jobTitle || '--',
      'Etapa': contact.lifecycleStage || '--',
      'Estado': contact.lifecycleStage === 'cierre_ganado' ? 'Activo' : 'Inactivo',
      'Fecha de Creación': contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('es-ES') : '--',
    }));

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 20 }, // Empresa
      { wch: 15 }, // Teléfono
      { wch: 25 }, // Correo
      { wch: 15 }, // País
      { wch: 15 }, // Ciudad
      { wch: 18 }, // Estado/Provincia
      { wch: 20 }, // Cargo
      { wch: 15 }, // Etapa
      { wch: 12 }, // Estado
      { wch: 18 }, // Fecha de Creación
    ];
    ws['!cols'] = colWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');

    // Generar el nombre del archivo con la fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Contactos_${fecha}.xlsx`;

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

      // Procesar cada fila y crear contactos
      const contactsToCreate = jsonData.map((row) => {
        // Mapear columnas del Excel a los campos del contacto
        const fullName = (row['Nombre'] || '').toString().trim();
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          firstName: firstName || 'Sin nombre',
          lastName: lastName || 'Sin apellido',
          email: (row['Correo'] || '').toString().trim() || undefined,
          phone: (row['Teléfono'] || '').toString().trim() || undefined,
          jobTitle: (row['Cargo'] || '').toString().trim() || undefined,
          city: (row['Ciudad'] || '').toString().trim() || undefined,
          state: (row['Estado/Provincia'] || '').toString().trim() || undefined,
          country: (row['País'] || '').toString().trim() || undefined,
          lifecycleStage: 'lead',
        };
      }).filter(contact => contact.firstName !== 'Sin nombre' || contact.email); // Filtrar filas vacías

      // Crear contactos en el backend
      let successCount = 0;
      let errorCount = 0;

      for (const contactData of contactsToCreate) {
        try {
          await api.post('/contacts', contactData);
          successCount++;
        } catch (error) {
          console.error('Error creating contact:', error);
          errorCount++;
        }
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Mostrar mensaje de resultado
      alert(`Importación completada:\n${successCount} contactos creados exitosamente\n${errorCount} contactos con errores`);

      // Recargar la lista de contactos
      fetchContacts();
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error al importar el archivo. Por favor, verifica que el formato sea correcto.');
    } finally {
      setImporting(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/contacts', { params });
      setContacts(response.data.contacts || response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || '',
        jobTitle: contact.jobTitle || '',
        lifecycleStage: contact.lifecycleStage,
    dni: '',
    cee: '',
    address: contact.address || '',
    city: contact.city || '',
    state: contact.state || '',
    country: contact.country || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        lifecycleStage: 'lead',
        dni: '',
        cee: '',
        address: '',
        city: '',
        state: '',
        country: '',
      });
    }
    setDniError('');
    setCeeError('');
    setOpen(true);
  };

  const handleSearchDni = async () => {
    if (!formData.dni || formData.dni.length < 8) {
      setDniError('El DNI debe tener al menos 8 dígitos');
      return;
    }

    setLoadingDni(true);
    setDniError('');

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno o configuración
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setDniError('Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN');
        setLoadingDni(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/dni/info/${formData.dni}`,
        {
          headers: {
            'Authorization': `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Separar nombres y apellidos
        const nombres = data.nombres || '';
        const apellidoPaterno = data.apellido_paterno || '';
        const apellidoMaterno = data.apellido_materno || '';
        
        // Actualizar el formulario con los datos obtenidos
        setFormData({
          ...formData,
          firstName: nombres,
          lastName: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
          address: data.direccion_completa || data.direccion || '',
          city: data.distrito || '',
          state: data.provincia || '',
          country: data.departamento || 'Perú',
        });
      } else {
        setDniError('No se encontró información para este DNI');
      }
    } catch (error: any) {
      console.error('Error al buscar DNI:', error);
      if (error.response?.status === 400) {
        setDniError('DNI no válido o no encontrado');
      } else if (error.response?.status === 401) {
        setDniError('Error de autenticación con la API');
      } else {
        setDniError('Error al consultar el DNI. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingDni(false);
    }
  };

  const handleSearchCee = async () => {
    if (!formData.cee || formData.cee.length < 8) {
      setCeeError('El CEE debe tener al menos 8 caracteres');
      return;
    }

    setLoadingCee(true);
    setCeeError('');

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno o configuración
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setCeeError('Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN');
        setLoadingCee(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/cee/info/${formData.cee}`,
        {
          headers: {
            'Authorization': `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.status === 200 && response.data.data) {
        const data = response.data.data;
        
        // Separar nombres y apellidos
        const nombres = data.nombres || '';
        const apellidoPaterno = data.apellido_paterno || '';
        const apellidoMaterno = data.apellido_materno || '';
        
        // Actualizar el formulario con los datos obtenidos
        setFormData({
          ...formData,
          firstName: nombres,
          lastName: `${apellidoPaterno} ${apellidoMaterno}`.trim(),
        });
      } else {
        setCeeError('No se encontró información para este CEE');
      }
    } catch (error: any) {
      console.error('Error al buscar CEE:', error);
      if (error.response?.status === 400) {
        setCeeError('CEE no válido o no encontrado');
      } else if (error.response?.status === 401) {
        setCeeError('Error de autenticación con la API');
      } else {
        setCeeError('Error al consultar el CEE. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingCee(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      handleClose();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleDelete = (id: number) => {
    setContactToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/contacts/${contactToDelete}`);
      fetchContacts();
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error al eliminar el contacto. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, contactId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStatusMenuAnchor({ ...statusMenuAnchor, [contactId]: event.currentTarget });
  };

  const handleStatusMenuClose = (contactId: number) => {
    setStatusMenuAnchor({ ...statusMenuAnchor, [contactId]: null });
  };

  const handleStatusChange = async (event: React.MouseEvent<HTMLElement>, contactId: number, isActive: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStatus({ ...updatingStatus, [contactId]: true });
    try {
      // Si queremos activar, establecer a 'cierre_ganado', si queremos desactivar, establecer a 'lead'
      const newStage = isActive ? 'cierre_ganado' : 'lead';
      await api.put(`/contacts/${contactId}`, { lifecycleStage: newStage });
      // Actualizar el contacto en la lista
      setContacts(contacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, lifecycleStage: newStage }
          : contact
      ));
      handleStatusMenuClose(contactId);
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Error al actualizar el estado. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [contactId]: false });
    }
  };

  const handlePreview = async (contact: Contact) => {
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      // Obtener información completa del contacto
      const response = await api.get(`/contacts/${contact.id}`);
      setPreviewContact(response.data);
    } catch (error) {
      console.error('Error fetching contact details:', error);
      // Si falla, usar la información básica que ya tenemos
      setPreviewContact(contact);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewContact(null);
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'lead': 'info',
      'contacto': 'info',
      'reunion_agendada': 'primary',
      'reunion_efectiva': 'primary',
      'propuesta_economica': 'warning',
      'negociacion': 'warning',
      'cierre_ganado': 'success',
      'cierre_perdido': 'error',
    };
    return colors[stage] || 'default';
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacto': 'Contacto',
      'reunion_agendada': 'Reunión Agendada',
      'reunion_efectiva': 'Reunión Efectiva',
      'propuesta_economica': 'Propuesta Económica',
      'negociacion': 'Negociación',
      'cierre_ganado': 'Cierre Ganado',
      'cierre_perdido': 'Cierre Perdido',
    };
    return labels[stage] || stage;
  };

  // Agrupar contactos por etapa
  const groupedContacts = contacts.reduce((acc, contact) => {
    const stage = contact.lifecycleStage || 'lead';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Orden de las etapas (incluyendo todas las posibles)
  const stageOrder = [
    'lead', 
    'contacto',
    'marketing qualified lead', 
    'sales qualified lead',
    'reunion_efectiva',
    'propuesta_economica',
    'negociacion',
    'opportunity', 
    'cierre_ganado',
    'customer', 
    'evangelist', 
    'subscriber'
  ];
  
  // Obtener todas las etapas que tienen contactos, ordenadas según stageOrder
  const allStages = Object.keys(groupedContacts);
  const orderedStages = [
    ...stageOrder.filter(stage => groupedContacts[stage] && groupedContacts[stage].length > 0),
    ...allStages.filter(stage => !stageOrder.includes(stage))
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedContacts.map((contact) => contact.id);
      setSelectedContacts(newSelected);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectOne = (contactId: number) => {
    const selectedIndex = selectedContacts.indexOf(contactId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedContacts, contactId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedContacts.slice(1));
    } else if (selectedIndex === selectedContacts.length - 1) {
      newSelected = newSelected.concat(selectedContacts.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedContacts.slice(0, selectedIndex),
        selectedContacts.slice(selectedIndex + 1)
      );
    }

    setSelectedContacts(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, contactId: number) => {
    setActionMenuAnchor({ ...actionMenuAnchor, [contactId]: event.currentTarget });
  };

  const handleActionMenuClose = (contactId: number) => {
    setActionMenuAnchor({ ...actionMenuAnchor, [contactId]: null });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtrar y ordenar contactos
  const filteredContacts = contacts
    .filter((contact) => {
      // Filtro por tab (0 = Todos, 1 = Activos)
      if (activeTab === 1) {
        const activeStages = ['cierre_ganado'];
        if (!activeStages.includes(contact.lifecycleStage)) {
          return false;
        }
      }
      
      // Filtro por búsqueda
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'nameDesc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        default:
          return 0;
      }
    });

  // Calcular estadísticas
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.lifecycleStage === 'cierre_ganado').length;
  const totalCompanies = new Set(contacts.filter(c => c.Company).map(c => c.Company?.id)).size;
  
  // Calcular contactos nuevos este mes
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = contacts.filter(c => {
    if (!c.createdAt) return false;
    const createdDate = new Date(c.createdAt);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;

  // Paginación
  const paginatedContacts = filteredContacts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
      px: { xs: 3, sm: 6, md: 8 },
      pt: { xs: 4, sm: 6, md: 6 },
    }}>
      {/* Cards de resumen - Diseño igual al de Companies */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
        bgcolor: theme.palette.background.paper,
        mb: 4,
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {/* Total Customers */}
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
                <People sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Total de Clientes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {totalContacts.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    16% este mes
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Members */}
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
                <Person sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Miembros
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {activeContacts.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingDown sx={{ fontSize: 20, color: '#F44336' }} />
                  <Typography variant="caption" sx={{ color: '#F44336', fontWeight: 500, fontSize: '1rem' }}>
                    1% este mes
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Active Now */}
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
                  Activos Ahora
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {Math.min(activeContacts, 189)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: -0.75 }}>
                  {Array.from({ length: Math.min(5, Math.min(activeContacts, contacts.length)) }).map((_, idx) => {
                    // Usar avatares de contactos reales si están disponibles
                    const contact = contacts[idx];
                    return (
                      <Avatar
                        key={idx}
                        src={contact?.avatar}
                        sx={{
                          width: 36,
                          height: 36,
                          border: `2px solid ${theme.palette.background.paper}`,
                          ml: idx > 0 ? -0.75 : 0,
                          bgcolor: contact?.avatar ? 'transparent' : taxiMonterricoColors.green,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          zIndex: 5 - idx,
                        }}
                      >
                        {!contact?.avatar && contact ? 
                          `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() :
                          String.fromCharCode(65 + idx)
                        }
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
                Todos los Clientes
              </Typography>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(1);
                }}
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Miembros Activos
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
                      borderColor: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
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
                      borderColor: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
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
              <Tooltip title="Nuevo Contacto">
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

        {/* Tabla de contactos con diseño mejorado */}
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
              <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '25%' } }}>
                  Nombre del Cliente
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, px: 1, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '18%' } }}>
                  Empresa
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                  Teléfono
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 150, md: 200 }, width: { xs: 'auto', md: '20%' } }}>
                  Correo
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}>
                  País
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}>
                  Estado
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '0.9375rem' }, py: { xs: 1.5, md: 2 }, px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 } }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContacts.map((contact) => (
                <TableRow 
                  key={contact.id}
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#fafafa' },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
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
                        {getInitials(contact.firstName, contact.lastName)}
                      </Avatar>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.875rem', md: '0.9375rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.firstName} {contact.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 1, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '18%' } }}>
                    {contact.Company?.name ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.875rem', md: '0.9375rem' },
                          fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.Company.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.875rem', md: '0.9375rem' }, fontWeight: 400 }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                        fontWeight: 400,
                      }}
                    >
                      {contact.phone || contact.mobile || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 150, md: 200 }, width: { xs: 'auto', md: '20%' } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {contact.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                        fontWeight: 400,
                      }}
                    >
                      {contact.country || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell 
                    sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 80, md: 100 }, width: { xs: 'auto', md: '10%' } }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Chip
                      label={contact.lifecycleStage === 'cierre_ganado' ? 'Activo' : 'Inactivo'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStatusMenuOpen(e, contact.id);
                      }}
                      disabled={updatingStatus[contact.id]}
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 20, md: 24 },
                        bgcolor: contact.lifecycleStage === 'cierre_ganado'
                          ? '#E8F5E9' 
                          : '#FFEBEE',
                        color: contact.lifecycleStage === 'cierre_ganado'
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
                      anchorEl={statusMenuAnchor[contact.id]}
                      open={Boolean(statusMenuAnchor[contact.id])}
                      onClose={(e, reason) => {
                        if (e && 'stopPropagation' in e) {
                          (e as React.MouseEvent).stopPropagation();
                        }
                        handleStatusMenuClose(contact.id);
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
                        onClick={(e) => handleStatusChange(e, contact.id, true)}
                        disabled={updatingStatus[contact.id] || contact.lifecycleStage === 'cierre_ganado'}
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
                        onClick={(e) => handleStatusChange(e, contact.id, false)}
                        disabled={updatingStatus[contact.id] || contact.lifecycleStage !== 'cierre_ganado'}
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
                            handlePreview(contact);
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
                            handleDelete(contact.id);
                          }}
                          sx={{
                            color: theme.palette.text.secondary,
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
              {paginatedContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        No hay contactos para mostrar
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Crea tu primer contacto para comenzar
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación mejorada */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 3, 
          py: 2,
          borderTop: '1px solid #e0e0e0',
        }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
            Mostrando {page * rowsPerPage + 1} a {Math.min((page + 1) * rowsPerPage, filteredContacts.length)} de {filteredContacts.length.toLocaleString()} registros
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              onClick={() => handleChangePage(null, page - 1)}
              disabled={page === 0}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': { bgcolor: theme.palette.action.hover },
                '&.Mui-disabled': { color: theme.palette.text.disabled },
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            {(() => {
              const totalPages = Math.ceil(filteredContacts.length / rowsPerPage);
              const pagesToShow: number[] = [];
              
              // Mostrar primera página
              pagesToShow.push(1);
              
              // Mostrar páginas alrededor de la actual
              for (let i = Math.max(2, page); i <= Math.min(page + 2, totalPages - 1); i++) {
                if (!pagesToShow.includes(i)) pagesToShow.push(i);
              }
              
              // Mostrar última página si hay más de 5 páginas
              if (totalPages > 5 && !pagesToShow.includes(totalPages)) {
                pagesToShow.push(totalPages);
              }
              
              return pagesToShow.map((pageNum, idx) => {
                const showEllipsis = idx > 0 && pageNum - pagesToShow[idx - 1] > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && (
                      <Typography sx={{ color: theme.palette.text.secondary, px: 0.5 }}>...</Typography>
                    )}
                    <IconButton
                      onClick={() => handleChangePage(null, pageNum - 1)}
                      sx={{
                        minWidth: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        color: page === pageNum - 1 ? 'white' : theme.palette.text.secondary,
                        bgcolor: page === pageNum - 1 ? taxiMonterricoColors.green : 'transparent',
                        fontWeight: page === pageNum - 1 ? 600 : 400,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: page === pageNum - 1 ? taxiMonterricoColors.greenDark : (theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5'),
                        },
                      }}
                    >
                      {pageNum}
                    </IconButton>
                  </React.Fragment>
                );
              });
            })()}
            <IconButton
              onClick={() => handleChangePage(null, page + 1)}
              disabled={page >= Math.ceil(filteredContacts.length / rowsPerPage) - 1}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': { bgcolor: theme.palette.action.hover },
                '&.Mui-disabled': { color: theme.palette.text.disabled },
              }}
            >
              <ArrowForward sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Card>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: theme.palette.text.primary,
        }}>
          {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Campos DNI y CEE con botones de búsqueda */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="DNI"
                value={formData.dni}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Solo números
                  setFormData({ ...formData, dni: value, cee: '' }); // Limpiar CEE si se ingresa DNI
                  setDniError('');
                  setCeeError('');
                }}
                placeholder="Ingrese DNI (8 dígitos)"
                error={!!dniError}
                helperText={dniError}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleSearchDni}
                      disabled={loadingDni || !formData.dni || formData.dni.length < 8}
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
                      {loadingDni ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )}
                    </IconButton>
                  ),
                }}
              />
              <Typography sx={{ alignSelf: 'center', color: theme.palette.text.secondary, px: 1 }}>o</Typography>
              <TextField
                label="CEE (Carnet de Extranjería)"
                value={formData.cee}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase(); // Convertir a mayúsculas
                  setFormData({ ...formData, cee: value, dni: '' }); // Limpiar DNI si se ingresa CEE
                  setCeeError('');
                  setDniError('');
                }}
                placeholder="Ingrese CEE"
                error={!!ceeError}
                helperText={ceeError}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleSearchCee}
                      disabled={loadingCee || !formData.cee || formData.cee.length < 8}
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
                      {loadingCee ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )}
                    </IconButton>
                  ),
                }}
              />
            </Box>
            <TextField
              label="Nombre"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Apellido"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
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
              label="Cargo"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
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
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}>
          <Button 
            onClick={handleClose}
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
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1.5,
              px: 2.5,
              bgcolor: taxiMonterricoColors.green,
              '&:hover': {
                bgcolor: taxiMonterricoColors.greenDark,
              }
            }}
          >
            {editingContact ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

        {/* Panel de Vista Previa */}
        <Drawer
          anchor="top"
          open={previewOpen}
          onClose={handleClosePreview}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '100%', sm: 520 },
              maxWidth: '90vw',
              maxHeight: '90vh',
              margin: '0 auto',
              boxSizing: 'border-box',
              borderRadius: { xs: 0, sm: '0 0 8px 8px' },
            },
          }}
        >
          {loadingPreview ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" sx={{ width: '100%' }}>
              <CircularProgress />
            </Box>
          ) : previewContact ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header con fondo verde */}
              <Box
                sx={{
                  bgcolor: taxiMonterricoColors.green,
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  {previewContact.firstName} {previewContact.lastName}
                </Typography>
                <IconButton onClick={handleClosePreview} size="small" sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Box>

              {/* Contenido principal */}
              <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
                <Paper sx={{ 
                  p: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}>
                  {/* Avatar y Nombre */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          bgcolor: previewContact.avatar ? 'transparent' : taxiMonterricoColors.green,
                          fontSize: '3rem',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                        src={previewContact.avatar}
                      >
                        {!previewContact.avatar && getInitials(previewContact.firstName, previewContact.lastName)}
                      </Avatar>
                      <CheckCircle 
                        sx={{ 
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          fontSize: 28,
                          color: '#10B981',
                          bgcolor: theme.palette.background.paper,
                          borderRadius: '50%',
                          border: `2px solid ${theme.palette.background.paper}`,
                        }} 
                      />
                    </Box>
                    <Typography 
                      variant="h6" 
                      align="center"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: theme.palette.text.primary,
                        mb: 0.25,
                      }}
                    >
                      {previewContact.firstName} {previewContact.lastName}
                    </Typography>
                    {previewContact.jobTitle && (
                      <Typography 
                        variant="body2"
                        align="center"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#757575',
                          fontWeight: 400,
                        }}
                      >
                        {previewContact.jobTitle}
                        {(previewContact.Companies && previewContact.Companies.length > 0) || previewContact.Company
                          ? ` en ${(previewContact.Companies && previewContact.Companies.length > 0) ? previewContact.Companies[0].name : previewContact.Company?.name}`
                          : ''}
                      </Typography>
                    )}
                    {previewContact.email && (
                      <Typography 
                        variant="body2"
                        align="center"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#757575',
                          fontWeight: 400,
                          mt: 0.5,
                        }}
                      >
                        {previewContact.email}
                      </Typography>
                    )}
                  </Box>

                  {/* Acciones Rápidas */}
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, mb: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                      <IconButton
                        onClick={() => {
                          navigate(`/contacts/${previewContact.id}`);
                          handleClosePreview();
                        }}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : '#E8F5E9',
                          color: taxiMonterricoColors.green,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}30` : '#C8E6C9',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Note sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                        Nota
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                      <IconButton
                        onClick={() => {
                          navigate(`/contacts/${previewContact.id}`);
                          handleClosePreview();
                        }}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : '#E8F5E9',
                          color: taxiMonterricoColors.green,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}30` : '#C8E6C9',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Email sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                        Correo
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                      <IconButton
                        onClick={() => {
                          navigate(`/contacts/${previewContact.id}`);
                          handleClosePreview();
                        }}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : '#E8F5E9',
                          color: taxiMonterricoColors.green,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}30` : '#C8E6C9',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Phone sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                        Llamada
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                      <IconButton
                        onClick={() => {
                          navigate(`/contacts/${previewContact.id}`);
                          handleClosePreview();
                        }}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : '#E8F5E9',
                          color: taxiMonterricoColors.green,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}30` : '#C8E6C9',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Assignment sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                        Tarea
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                      <IconButton
                        onClick={() => {
                          navigate(`/contacts/${previewContact.id}`);
                          handleClosePreview();
                        }}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : '#E8F5E9',
                          color: taxiMonterricoColors.green,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}30` : '#C8E6C9',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Event sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                        Reunión
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Estadísticas */}
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                    <Box sx={{ 
                      flex: 1, 
                      border: `1px dashed ${theme.palette.divider}`, 
                      borderRadius: 2, 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: theme.palette.background.paper,
                    }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        28.65K
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                        Followers
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: 1, 
                      border: `1px dashed ${theme.palette.divider}`, 
                      borderRadius: 2, 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: theme.palette.background.paper,
                    }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        38.85K
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                        Following
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: 1, 
                      border: `1px dashed ${theme.palette.divider}`, 
                      borderRadius: 2, 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: theme.palette.background.paper,
                    }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        43.67K
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                        Engagement
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Sección "Acerca de este objeto Contacto" */}
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setAboutExpanded(!aboutExpanded)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <KeyboardArrowDown
                        sx={{
                          transform: aboutExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s',
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Acerca de este objeto Contacto
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                      {user?.role !== 'user' && (
                        <IconButton size="small">
                          <Settings />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Collapse in={aboutExpanded}>
                    <Box sx={{ px: 2, pb: 2 }}>
                      {/* Correo */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Email sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Correo
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: previewContact.email ? theme.palette.text.primary : theme.palette.text.secondary,
                            textAlign: 'right',
                          }}
                        >
                          {previewContact.email || '--'}
                        </Typography>
                      </Box>

                      {/* Número de teléfono */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Phone sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Número de teléfono
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: (previewContact.phone || previewContact.mobile) ? theme.palette.text.primary : theme.palette.text.secondary,
                            textAlign: 'right',
                          }}
                        >
                          {previewContact.phone || previewContact.mobile || '--'}
                        </Typography>
                      </Box>

                      {/* Nombre de la empresa */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Business sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Nombre de la empresa
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: ((previewContact.Companies && previewContact.Companies.length > 0) || previewContact.Company) ? theme.palette.text.primary : theme.palette.text.secondary,
                            textAlign: 'right',
                          }}
                        >
                          {(previewContact.Companies && previewContact.Companies.length > 0)
                            ? previewContact.Companies[0].name
                            : previewContact.Company?.name || '--'}
                        </Typography>
                      </Box>

                      {/* Estado del lead */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Flag sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Estado del lead
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: previewContact.leadStatus ? theme.palette.text.primary : theme.palette.text.secondary,
                            textAlign: 'right',
                          }}
                        >
                          {previewContact.leadStatus || '--'}
                        </Typography>
                      </Box>

                      {/* Etapa del ciclo de vida */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <TrendingUp sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Etapa del ciclo de vida
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: previewContact.lifecycleStage ? theme.palette.text.primary : theme.palette.text.secondary,
                            textAlign: 'right',
                          }}
                        >
                          {previewContact.lifecycleStage ? getStageLabel(previewContact.lifecycleStage) : '--'}
                        </Typography>
                      </Box>

                      {/* Propietario del contacto */}
                      {previewContact.Owner && (
                        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            <Person sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                color: theme.palette.text.secondary,
                              }}
                            >
                              Propietario del contacto
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.primary,
                              textAlign: 'right',
                            }}
                          >
                            {previewContact.Owner.firstName} {previewContact.Owner.lastName}
                          </Typography>
                        </Box>
                      )}

                      {/* Rol de compra */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Person sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 400,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Rol de compra
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: theme.palette.text.secondary,
                            textAlign: 'right',
                          }}
                        >
                          --
                        </Typography>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            </Box>
          ) : null}
        </Drawer>

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
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <Delete sx={{ color: '#d32f2f', fontSize: 28 }} />
            Confirmar Eliminación
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
              ¿Estás seguro de que deseas eliminar este contacto?
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente del sistema.
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

export default Contacts;

