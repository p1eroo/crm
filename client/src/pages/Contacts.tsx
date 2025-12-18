import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Link,
  Avatar,
  Divider,
  Collapse,
  Tooltip,
  Select,
  FormControl,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Search, 
  Close, 
  Business, 
  Email, 
  Phone, 
  Person,
  Note,
  Assignment,
  Event,
  MoreVert,
  ExpandMore,
  KeyboardArrowDown,
  LocationOn,
  Flag,
  TrendingUp,
  FilterList,
  Visibility,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  FileDownload,
  UploadFile,
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
  Bolt,
  Remove,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import contactLogo from '../assets/contact.png';

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
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  ownerId?: number | null;
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
  const [search] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewActivities, setPreviewActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [activeTab] = useState(0);
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
  const [idType, setIdType] = useState<'dni' | 'cee'>('dni');
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState('');
  const [loadingCee, setLoadingCee] = useState(false);
  const [ceeError, setCeeError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedOwnerFilter] = useState<string | number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedOwnerFilters, setSelectedOwnerFilters] = useState<(string | number)[]>([]);
  const [stagesExpanded, setStagesExpanded] = useState(true);
  const [ownerFilterExpanded, setOwnerFilterExpanded] = useState(true);
  const [countryFilterExpanded, setCountryFilterExpanded] = useState(true);

  const fetchUsers = useCallback(async () => {
    // Verificar nuevamente el rol antes de hacer la petición
    if (user?.role !== 'admin') {
      setUsers([]);
      return;
    }

    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error: any) {
      // Si es un error de permisos (403), no mostrar error en consola
      // Solo usuarios admin pueden acceder a /users
      if (error.response?.status === 403 || error.isPermissionError) {
        // Silenciar el error, simplemente no cargar usuarios
        setUsers([]);
        return;
      }
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  }, [user?.role]);

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
        
        // Función para separar nombre y apellido
        let firstName = '';
        let lastName = '';
        
        if (fullName) {
          // Si tiene espacios, separar normalmente
          if (fullName.includes(' ')) {
            const nameParts = fullName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else {
            // Si no tiene espacios, separar por letras mayúsculas
            // Ejemplo: "RafaelHornaCastillo" -> "Rafael" y "Horna Castillo"
            const matches = fullName.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/g);
            if (matches && matches.length > 0) {
              firstName = matches[0] || '';
              lastName = matches.slice(1).join(' ') || '';
            } else {
              // Si no se puede separar, poner todo como nombre
              firstName = fullName;
            }
          }
        }

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

  const fetchContacts = useCallback(async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/contacts', { params });
      setContacts(response.data.contacts || response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchContacts();
    // Solo intentar obtener usuarios si el usuario actual es admin
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [fetchContacts, fetchUsers, user?.role]);

  const handleOpen = (contact?: Contact) => {
    setFormErrors({});
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
      setIdType('dni'); // Resetear a DNI por defecto
    }
    setDniError('');
    setCeeError('');
    setOpen(true);
  };

  // Función para capitalizar solo las iniciales de cada palabra
  const capitalizeInitials = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
        setDniError('⚠️ La búsqueda automática de DNI no está disponible. Puedes ingresar los datos manualmente. Para habilitarla, configura REACT_APP_FACTILIZA_TOKEN en el archivo .env');
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
        
        // Capitalizar solo las iniciales
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(`${apellidoPaterno} ${apellidoMaterno}`.trim());
        const direccionCapitalizada = capitalizeInitials(data.direccion || '');
        const distritoCapitalizado = capitalizeInitials(data.distrito || '');
        const provinciaCapitalizada = capitalizeInitials(data.provincia || '');
        const departamentoCapitalizado = capitalizeInitials(data.departamento || '');
        
        // Actualizar el formulario con los datos obtenidos
        setFormData(prev => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
          address: direccionCapitalizada,
          city: distritoCapitalizado,
          state: provinciaCapitalizada,
          country: departamentoCapitalizado || 'Perú',
        }));
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
    if (!formData.cee || formData.cee.length < 12) {
      setCeeError('El CEE debe tener 12 caracteres');
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
        
        // Capitalizar solo las iniciales
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(`${apellidoPaterno} ${apellidoMaterno}`.trim());
        
        // Actualizar el formulario con los datos obtenidos
        setFormData(prev => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
        }));
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

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      setFormErrors({});
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

  const handlePreview = async (contact: Contact) => {
    setLoadingPreview(true);
    setLoadingActivities(true);
    setPreviewOpen(true);
    try {
      // Obtener información completa del contacto
      const response = await api.get(`/contacts/${contact.id}`);
      setPreviewContact(response.data);
      
      // Obtener actividades del contacto
      try {
        const activitiesResponse = await api.get('/activities', {
          params: { contactId: contact.id },
        });
        setPreviewActivities(activitiesResponse.data.activities || activitiesResponse.data || []);
      } catch (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        setPreviewActivities([]);
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
      // Si falla, usar la información básica que ya tenemos
      setPreviewContact(contact);
      setPreviewActivities([]);
    } finally {
      setLoadingPreview(false);
      setLoadingActivities(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewContact(null);
    setPreviewActivities([]);
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'lead': 'error', // Rojo para 0%
      'contacto': 'warning', // Naranja para 10%
      'reunion_agendada': 'warning', // Naranja para 30%
      'reunion_efectiva': 'warning', // Amarillo para 40%
      'propuesta_economica': 'info', // Verde claro para 50%
      'negociacion': 'success', // Verde para 70%
      'licitacion': 'success', // Verde para 75%
      'licitacion_etapa_final': 'success', // Verde oscuro para 85%
      'cierre_ganado': 'success', // Verde oscuro para 90%
      'cierre_perdido': 'error', // Rojo para -1%
      'firma_contrato': 'success', // Verde oscuro para 95%
      'activo': 'success', // Verde más oscuro para 100%
      'cliente_perdido': 'error', // Rojo para -1%
      'lead_inactivo': 'error', // Rojo para -5%
    };
    return colors[stage] || 'default';
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': '0% Lead',
      'contacto': '10% Contacto',
      'reunion_agendada': '30% Reunión Agendada',
      'reunion_efectiva': '40% Reunión Efectiva',
      'propuesta_economica': '50% Propuesta Económica',
      'negociacion': '70% Negociación',
      'licitacion': '75% Licitación',
      'licitacion_etapa_final': '85% Licitación Etapa Final',
      'cierre_ganado': '90% Cierre Ganado',
      'cierre_perdido': '-1% Cierre Perdido',
      'firma_contrato': '95% Firma de Contrato',
      'activo': '100% Activo',
      'cliente_perdido': '-1% Cliente perdido',
      'lead_inactivo': '-5% Lead Inactivo',
    };
    return labels[stage] || stage;
  };

  // Orden de las etapas según porcentaje
  const stageOrder = [
    'lead_inactivo', // -5%
    'cliente_perdido', // -1%
    'cierre_perdido', // -1%
    'lead', // 0%
    'contacto', // 10%
    'reunion_agendada', // 30%
    'reunion_efectiva', // 40%
    'propuesta_economica', // 50%
    'negociacion', // 70%
    'licitacion', // 75%
    'licitacion_etapa_final', // 85%
    'cierre_ganado', // 90%
    'firma_contrato', // 95%
    'activo', // 100%
  ];
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const getStageLabelWithoutPercentage = (stage: string) => {
    return getStageLabel(stage).replace(/\s*\d+%/, '').trim();
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
      
      // Filtro por etapas
      if (selectedStages.length > 0) {
        if (!selectedStages.includes(contact.lifecycleStage || 'lead')) {
          return false;
        }
      }
      
      // Filtro por países
      if (selectedCountries.length > 0) {
        if (!contact.country || !selectedCountries.includes(contact.country)) {
          return false;
        }
      }
      
      // Filtro por propietarios (del panel de filtros)
      if (selectedOwnerFilters.length > 0) {
        let matches = false;
        for (const filter of selectedOwnerFilters) {
          if (filter === 'me') {
            if (contact.ownerId === user?.id) {
              matches = true;
              break;
            }
          } else if (filter === 'unassigned') {
            if (contact.ownerId === null || contact.ownerId === undefined) {
              matches = true;
              break;
            }
          } else {
            if (contact.ownerId === filter) {
              matches = true;
              break;
            }
          }
        }
        if (!matches) return false;
      }
      
      // Filtro por propietario (legacy, mantener por compatibilidad)
      if (selectedOwnerFilter !== null) {
        if (selectedOwnerFilter === 'me') {
          if (contact.ownerId !== user?.id) {
            return false;
          }
        } else if (selectedOwnerFilter === 'unassigned') {
          if (contact.ownerId !== null && contact.ownerId !== undefined) {
            return false;
          }
        } else if (selectedOwnerFilter === 'deactivated') {
          // Todos los propietarios desactivados y eliminados
          // Por ahora, no hay lógica para esto, se puede implementar después
          return true;
        } else {
          if (contact.ownerId !== selectedOwnerFilter) {
            return false;
          }
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
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Header principal - fuera del contenedor */}
      <Box sx={{ pt: 0, pb: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.25, fontSize: { xs: '1.25rem', md: '1.375rem' } }}>
                Todos los Contactos
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 1.5,
                  bgcolor: theme.palette.background.paper,
                  fontSize: '0.8125rem',
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
                size="small"
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
                  p: 0.875,
                }}
              >
                <UploadFile sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" style={{ display: 'none' }} />
            <Tooltip title="Exportar">
              <IconButton
                size="small"
                onClick={handleExportToExcel}
                sx={{
                  border: `1px solid ${taxiMonterricoColors.green}`,
                  color: taxiMonterricoColors.green,
                  '&:hover': {
                    borderColor: taxiMonterricoColors.greenDark,
                    bgcolor: `${taxiMonterricoColors.green}10`,
                  },
                  borderRadius: 1.5,
                  p: 0.875,
                }}
              >
                <FileDownload sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filtros">
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterList sx={{ fontSize: 16 }} />}
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                sx={{
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                  color: theme.palette.text.primary,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.5,
                  minWidth: 'auto',
                  height: '32px',
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                Filter
              </Button>
            </Tooltip>
            <Tooltip title="Nuevo Contacto">
              <IconButton
                size="small"
                onClick={() => handleOpen()}
                sx={{
                  bgcolor: taxiMonterricoColors.green,
                  color: 'white',
                  '&:hover': {
                    bgcolor: taxiMonterricoColors.greenDark,
                  },
                  borderRadius: 1.5,
                  p: 0.875,
                  boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                }}
              >
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Contenedor principal con layout flex para tabla y panel de filtros */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Contenido principal (tabla completa con header y filas) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header de la tabla */}
          <Box
            component="div"
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(35, 39, 44, 0.95)' : '#ffffff',
              borderRadius: '8px 8px 0 0',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(6, minmax(0, 1fr))', md: '1.5fr 1fr 0.9fr 0.7fr 1.2fr 0.7fr' },
              columnGap: { xs: 1, md: 1.5 },
              minWidth: { xs: 800, md: 'auto' },
              maxWidth: '100%',
              width: '100%',
              px: { xs: 1, md: 1.5 },
              py: { xs: 1.5, md: 2 },
              mb: 2,
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.8125rem' }, display: 'flex', alignItems: 'center' }}>
              Nombre del Cliente
            </Box>
            <Box sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.8125rem' }, display: 'flex', alignItems: 'center' }}>
              Empresa
            </Box>
            <Box sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.8125rem' }, display: 'flex', alignItems: 'center' }}>
              Teléfono
            </Box>
            <Box sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.8125rem' }, display: 'flex', alignItems: 'center' }}>
              País
            </Box>
            <Box sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.8125rem' }, display: 'flex', alignItems: 'center' }}>
              Etapa
            </Box>
            <Box sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.8125rem' }, display: 'flex', alignItems: 'center' }}>
              Acciones
            </Box>
          </Box>

          {/* Filas de contactos */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedContacts.map((contact) => (
            <Box
              key={contact.id}
              component="div"
              onClick={() => navigate(`/contacts/${contact.id}`)}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(35, 39, 44, 0.95)' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(6, minmax(0, 1fr))', md: '1.5fr 1fr 0.9fr 0.7fr 1.2fr 0.7fr' },
                columnGap: { xs: 1, md: 1.5 },
                minWidth: { xs: 800, md: 'auto' },
                maxWidth: '100%',
                width: '100%',
                borderRadius: 0,
                border: 'none',
                boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                px: { xs: 1, md: 1.5 },
                py: { xs: 1, md: 1.25 },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(35, 39, 44, 1)' : '#ffffff',
                  boxShadow: theme.palette.mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
                <Box sx={{ py: { xs: 1, md: 1.25 }, px: { xs: 0.75, md: 1 }, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, width: '100%' }}>
                    <Avatar
                      src={contactLogo}
                      sx={{
                        width: { xs: 32, md: 40 },
                        height: { xs: 32, md: 40 },
                        bgcolor: contactLogo ? 'transparent' : taxiMonterricoColors.green,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        fontWeight: 600,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                      }}
                    >
                      {!contactLogo && getInitials(contact.firstName, contact.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.6875rem', md: '0.75rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.25,
                        }}
                      >
                        {contact.firstName?.split(' ')[0] || contact.firstName} {contact.lastName?.split(' ')[0] || contact.lastName}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: { xs: '0.5625rem', md: '0.625rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {contact.jobTitle || '--'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  {contact.Company?.name ? (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.625rem', md: '0.6875rem' },
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {contact.Company.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.625rem', md: '0.6875rem' }, fontWeight: 400 }}>
                      --
                    </Typography>
                  )}
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.625rem', md: '0.6875rem' },
                      fontWeight: 400,
                    }}
                  >
                    {contact.phone || contact.mobile || '--'}
                  </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.625rem', md: '0.6875rem' },
                      fontWeight: 400,
                    }}
                  >
                    {contact.country || '--'}
                  </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Chip
                    label={getStageLabel(contact.lifecycleStage || 'lead')}
                    size="small"
                    color={getStageColor(contact.lifecycleStage || 'lead')}
                    sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.5625rem', md: '0.625rem' },
                      height: { xs: 16, md: 18 },
                    }}
                  />
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
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
                </Box>
              </Box>
            ))}
          {paginatedContacts.length === 0 && (
            <Box sx={{ 
              textAlign: 'center',
              py: 8,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(35, 39, 44, 0.95)' : '#ffffff',
              borderRadius: 0,
              border: 'none',
              boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                  No hay contactos para mostrar
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Crea tu primer contacto para comenzar
                </Typography>
              </Box>
            </Box>
          )}
          </Box>

          {/* Paginación mejorada */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            px: 2, 
            py: 2,
            mt: 2,
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
                const currentPageNum = page + 1; // Convertir de 0-indexed a 1-indexed
                
                // Si hay pocas páginas, mostrar todas
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) {
                    pagesToShow.push(i);
                  }
                } else {
                  // Siempre mostrar primera página
                  pagesToShow.push(1);
                  
                  // Calcular rango de páginas alrededor de la actual
                  const startPage = Math.max(2, currentPageNum - 1);
                  const endPage = Math.min(totalPages - 1, currentPageNum + 1);
                  
                  // Agregar páginas alrededor de la actual
                  for (let i = startPage; i <= endPage; i++) {
                    if (!pagesToShow.includes(i)) {
                      pagesToShow.push(i);
                    }
                  }
                  
                  // Mostrar última página si no está incluida
                  if (!pagesToShow.includes(totalPages)) {
                    pagesToShow.push(totalPages);
                  }
                }
                
                // Ordenar las páginas
                pagesToShow.sort((a, b) => a - b);
                
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
        </Box>

        {/* Panel de Filtros Lateral */}
        {filterDrawerOpen && (
        <Box
          sx={{
            width: { xs: '100%', md: 400 },
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(35, 39, 44, 0.95)' : '#ffffff',
            borderLeft: { xs: 'none', md: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` },
            borderTop: { xs: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, md: 'none' },
            borderRadius: 2,
            height: 'fit-content',
            maxHeight: { xs: 'none', md: 'calc(100vh - 120px)' },
            position: { xs: 'relative', md: 'sticky' },
            top: { xs: 0, md: 0 },
            mt: { xs: 2, md: 2.5 },
            alignSelf: 'flex-start',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header del Panel */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
              px: 2,
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
              }}
            >
              Filter
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                onClick={() => {
                  setSelectedStages([]);
                  setSelectedOwnerFilters([]);
                  setSelectedCountries([]);
                }}
                sx={{
                  color: '#d32f2f',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 0.75,
                  py: 0.25,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
                  },
                }}
              >
                Clear
              </Button>
              <IconButton
                size="small"
                onClick={() => setFilterDrawerOpen(false)}
                sx={{
                  color: theme.palette.text.secondary,
                  padding: '2px',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Contenido del Panel */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {/* Sección Etapas */}
            <Box>
              <Box
                onClick={() => setStagesExpanded(!stagesExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Etapas
                </Typography>
                {stagesExpanded ? (
                  <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary, transform: 'rotate(180deg)' }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={stagesExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {stageOrder.map((stage) => {
                      const stageColor = getStageColor(stage);
                      const isSelected = selectedStages.includes(stage);
                      
                      return (
                        <Chip
                          key={stage}
                          label={getStageLabelWithoutPercentage(stage)}
                          size="small"
                          color={isSelected ? stageColor : undefined}
                          variant={isSelected ? 'filled' : 'outlined'}
                          onClick={() => {
                            setSelectedStages((prev) =>
                              prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
                            );
                          }}
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '24px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: 'auto',
                            py: 0.25,
                            px: 1,
                            opacity: isSelected ? 1 : 0.8,
                            '&:hover': {
                              opacity: 1,
                              transform: 'scale(1.02)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiChip-label': {
                              padding: '0 4px',
                            },
                            ...(!isSelected && {
                              borderColor: stageColor === 'error' 
                                ? theme.palette.error.main 
                                : stageColor === 'warning'
                                ? theme.palette.warning.main
                                : stageColor === 'info'
                                ? theme.palette.info.main
                                : stageColor === 'success'
                                ? theme.palette.success.main
                                : theme.palette.divider,
                              color: theme.palette.text.primary,
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              '& .MuiChip-label': {
                                color: theme.palette.text.primary,
                                padding: '0 4px',
                              },
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>

            {/* Sección Propietario del Contacto */}
            <Box>
              <Box
                onClick={() => setOwnerFilterExpanded(!ownerFilterExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Propietario del Contacto
                </Typography>
                {ownerFilterExpanded ? (
                  <Remove sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                ) : (
                  <Add sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={ownerFilterExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {/* Opción "Yo" */}
                    <Chip
                      icon={<Bolt sx={{ fontSize: 14, color: 'inherit' }} />}
                      label="Yo"
                      size="small"
                      onClick={() => {
                        setSelectedOwnerFilters((prev) =>
                          prev.includes('me') ? prev.filter((o) => o !== 'me') : [...prev, 'me']
                        );
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: '24px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        opacity: selectedOwnerFilters.includes('me') ? 1 : 0.8,
                        variant: selectedOwnerFilters.includes('me') ? 'filled' : 'outlined',
                        color: selectedOwnerFilters.includes('me') ? 'primary' : undefined,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          padding: '0 4px',
                        },
                        ...(!selectedOwnerFilters.includes('me') && {
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.primary,
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          '& .MuiChip-label': {
                            color: theme.palette.text.primary,
                            padding: '0 4px',
                          },
                        }),
                      }}
                    />

                    {/* Opción "Sin asignar" */}
                    <Chip
                      label="Sin asignar"
                      size="small"
                      onClick={() => {
                        setSelectedOwnerFilters((prev) =>
                          prev.includes('unassigned') ? prev.filter((o) => o !== 'unassigned') : [...prev, 'unassigned']
                        );
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: '24px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        opacity: selectedOwnerFilters.includes('unassigned') ? 1 : 0.8,
                        variant: selectedOwnerFilters.includes('unassigned') ? 'filled' : 'outlined',
                        color: selectedOwnerFilters.includes('unassigned') ? 'primary' : undefined,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          padding: '0 4px',
                        },
                        ...(!selectedOwnerFilters.includes('unassigned') && {
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.primary,
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          '& .MuiChip-label': {
                            color: theme.palette.text.primary,
                            padding: '0 4px',
                          },
                        }),
                      }}
                    />

                    {/* Lista de usuarios */}
                    {users.map((userItem) => {
                      const isSelected = selectedOwnerFilters.includes(userItem.id);
                      return (
                        <Chip
                          key={userItem.id}
                          avatar={
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: '0.625rem',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              {userItem.firstName?.[0]?.toUpperCase() || userItem.email?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                          }
                          label={`${userItem.firstName} ${userItem.lastName}`}
                          size="small"
                          onClick={() => {
                            setSelectedOwnerFilters((prev) =>
                              prev.includes(userItem.id) ? prev.filter((o) => o !== userItem.id) : [...prev, userItem.id]
                            );
                          }}
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '24px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: 'auto',
                            py: 0.25,
                            px: 1,
                            opacity: isSelected ? 1 : 0.8,
                            variant: isSelected ? 'filled' : 'outlined',
                            color: isSelected ? 'primary' : undefined,
                            '&:hover': {
                              opacity: 1,
                              transform: 'scale(1.02)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiChip-label': {
                              padding: '0 4px',
                            },
                            ...(!isSelected && {
                              borderColor: theme.palette.divider,
                              color: theme.palette.text.primary,
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              '& .MuiChip-label': {
                                color: theme.palette.text.primary,
                                padding: '0 4px',
                              },
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>

            {/* Sección País */}
            <Box>
              <Box
                onClick={() => setCountryFilterExpanded(!countryFilterExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  País
                </Typography>
                {countryFilterExpanded ? (
                  <Remove sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                ) : (
                  <Add sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={countryFilterExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {Array.from(new Set(contacts.map(c => c.country).filter((c): c is string => typeof c === 'string' && c.length > 0))).sort().map((country: string) => (
                      <Chip
                        key={country}
                        label={country}
                        size="small"
                        onClick={() => {
                          setSelectedCountries((prev: string[]) =>
                            prev.includes(country) ? prev.filter((c: string) => c !== country) : [...prev, country]
                          );
                        }}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.8125rem',
                          height: '28px',
                          cursor: 'pointer',
                          width: 'fit-content',
                          minWidth: 'auto',
                          opacity: selectedCountries.includes(country) ? 1 : 0.8,
                          variant: selectedCountries.includes(country) ? 'filled' : 'outlined',
                          color: selectedCountries.includes(country) ? 'primary' : undefined,
                          '&:hover': {
                            opacity: 1,
                            transform: 'scale(1.02)',
                          },
                          transition: 'all 0.2s ease',
                          ...(!selectedCountries.includes(country) && {
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.primary,
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                            '& .MuiChip-label': {
                              color: theme.palette.text.primary,
                            },
                          }),
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>
          </Box>
        </Box>
      )}
      </Box>

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
        <DialogContent sx={{ pt: 5, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Selección de tipo de identificación y campo de entrada */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
                <RadioGroup
                  row
                  value={idType}
                  onChange={(e) => {
                    const newType = e.target.value as 'dni' | 'cee';
                    setIdType(newType);
                    // Limpiar campos al cambiar de tipo
                    if (newType === 'dni') {
                      setFormData(prev => ({ ...prev, cee: '', dni: '' }));
                      setCeeError('');
                    } else {
                      setFormData(prev => ({ ...prev, dni: '', cee: '' }));
                      setDniError('');
                    }
                  }}
                  sx={{ gap: 2, flexShrink: 0 }}
                >
                  <FormControlLabel
                    value="dni"
                    control={
                      <Radio 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          '&.Mui-checked': {
                            color: taxiMonterricoColors.green,
                          },
                        }} 
                      />
                    }
                  label="DNI"
                  sx={{
                    m: 0,
                    px: 2,
                    py: 0.75,
                    height: '48px',
                    border: `2px solid ${idType === 'dni' ? taxiMonterricoColors.green : theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: idType === 'dni' 
                      ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : `${taxiMonterricoColors.green}10`)
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}15` : `${taxiMonterricoColors.green}08`,
                    },
                    '& .MuiFormControlLabel-label': {
                      color: theme.palette.text.primary,
                      fontWeight: idType === 'dni' ? 500 : 400,
                    },
                  }}
                />
                <FormControlLabel
                  value="cee"
                  control={
                    <Radio 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        '&.Mui-checked': {
                          color: taxiMonterricoColors.green,
                        },
                      }} 
                    />
                  }
                  label="CEE"
                  sx={{
                    m: 0,
                    px: 2,
                    py: 0.75,
                    height: '48px',
                    border: `2px solid ${idType === 'cee' ? taxiMonterricoColors.green : theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: idType === 'cee' 
                      ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : `${taxiMonterricoColors.green}10`)
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}15` : `${taxiMonterricoColors.green}08`,
                    },
                    '& .MuiFormControlLabel-label': {
                      color: theme.palette.text.primary,
                      fontWeight: idType === 'cee' ? 500 : 400,
                    },
                  }}
                  />
                </RadioGroup>

                {/* Campo de entrada según el tipo seleccionado */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {idType === 'dni' ? (
                    <TextField
                      label="DNI"
                      value={formData.dni}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Solo números
                        // Limitar a 8 dígitos
                        const limitedValue = value.slice(0, 8);
                        setFormData(prev => ({ ...prev, dni: limitedValue, cee: '' }));
                        setDniError('');
                        setCeeError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.dni && formData.dni.length === 8 && !loadingDni) {
                          handleSearchDni();
                        }
                      }}
                      error={!!dniError}
                      helperText={dniError}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ maxLength: 8 }}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: '48px', // Misma altura que los botones (py: 1.5 = 12px arriba + 12px abajo + contenido)
                          height: '48px',
                        },
                        '& .MuiInputBase-input': {
                          py: 1.5, // Mismo padding vertical que los botones
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={handleSearchDni}
                            disabled={loadingDni || !formData.dni || formData.dni.length < 8}
                            size="small"
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
                  ) : (
                    <TextField
                      label="CEE"
                      value={formData.cee}
                      onChange={(e) => {
                        // Convertir a mayúsculas respetando caracteres especiales del español
                        const value = e.target.value.toLocaleUpperCase('es-ES');
                        // Limitar a 12 caracteres
                        const limitedValue = value.slice(0, 12);
                        setFormData(prev => ({ ...prev, cee: limitedValue, dni: '' }));
                        setCeeError('');
                        setDniError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.cee && formData.cee.length === 12 && !loadingCee) {
                          handleSearchCee();
                        }
                      }}
                      error={!!ceeError}
                      helperText={ceeError}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ maxLength: 12 }}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: '48px', // Misma altura que los botones (py: 1.5 = 12px arriba + 12px abajo + contenido)
                          height: '48px',
                        },
                        '& .MuiInputBase-input': {
                          py: 1.5, // Mismo padding vertical que los botones
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={handleSearchCee}
                            disabled={loadingCee || !formData.cee || formData.cee.length < 12}
                            size="small"
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
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Nombre y Apellido en su propia fila */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nombre"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, firstName: e.target.value }));
                  if (formErrors.firstName) {
                    setFormErrors(prev => ({ ...prev, firstName: '' }));
                  }
                }}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Apellido"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, lastName: e.target.value }));
                  if (formErrors.lastName) {
                    setFormErrors(prev => ({ ...prev, lastName: '' }));
                  }
                }}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            
            {/* Email y Teléfono en su propia fila */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (formErrors.email) {
                    setFormErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            
            {/* Dirección en su propia fila */}
            <TextField
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              multiline
              rows={2}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            
            {/* Distrito, Provincia y Departamento en su propia fila */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Distrito"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            
            {/* Cargo y Etapa del Ciclo de Vida en su propia fila */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Cargo"
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                select
                label="Etapa del Ciclo de Vida"
                value={formData.lifecycleStage}
                onChange={(e) => setFormData(prev => ({ ...prev, lifecycleStage: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
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
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 2, 
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
        <Dialog
          open={previewOpen}
          onClose={handleClosePreview}
          PaperProps={{
            sx: {
              borderRadius: 6,
              maxHeight: '90vh',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              width: '1200px',
              maxWidth: '95vw',
            },
          }}
          sx={{
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          {loadingPreview ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" sx={{ width: '100%' }}>
              <CircularProgress />
            </Box>
          ) : previewContact ? (
            <>
              <Box sx={{ position: 'relative' }}>
                <IconButton 
                  onClick={handleClosePreview} 
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 32,
                    height: 32,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    color: theme.palette.text.primary,
                    zIndex: 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              <DialogContent sx={{ 
                p: 2, 
                overflow: 'auto',
                display: 'flex',
                gap: 2,
                '&::-webkit-scrollbar': {
                  display: 'none',
                  width: 0,
                  height: 0,
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '& *': {
                  '&::-webkit-scrollbar': {
                    display: 'none',
                    width: 0,
                    height: 0,
                  },
                },
              }}>
                {/* Columna izquierda - Información del contacto */}
                <Box sx={{ 
                  flex: '0 0 40%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                    width: 0,
                    height: 0,
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}>
                {/* Avatar y Nombre */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: (previewContact.avatar || contactLogo) ? 'transparent' : taxiMonterricoColors.green,
                        fontSize: '3rem',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                      src={previewContact.avatar || contactLogo}
                    >
                      {!previewContact.avatar && !contactLogo && getInitials(previewContact.firstName, previewContact.lastName)}
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
                  {previewContact.email && (
                    <Typography 
                      variant="body2"
                      align="center"
                      sx={{
                        fontSize: '0.875rem',
                        color: theme.palette.text.secondary,
                        fontWeight: 400,
                      }}
                    >
                      {previewContact.email}
                    </Typography>
                  )}
                </Box>

                {/* Estadísticas - Ocultado */}
                {/* <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                  <Box sx={{ 
                    flex: 1, 
                    border: `1px dashed ${theme.palette.divider}`, 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: 'transparent',
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
                    bgcolor: 'transparent',
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
                    bgcolor: 'transparent',
                  }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      43.67K
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                      Engagement
                    </Typography>
                  </Box>
                </Box> */}

              {/* Información de contacto - Mismo diseño que ContactDetail */}
              <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  {/* Location */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <LocationOn sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Location
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        color: (previewContact.city || previewContact.address) ? theme.palette.text.primary : theme.palette.text.disabled,
                        textAlign: 'right',
                      }}
                    >
                      {previewContact.city || previewContact.address || '--'}
                    </Typography>
                  </Box>

                  {/* Phone */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Phone sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Phone
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        color: (previewContact.phone || previewContact.mobile) ? theme.palette.text.primary : theme.palette.text.disabled,
                        textAlign: 'right',
                      }}
                    >
                      {previewContact.phone || previewContact.mobile || '--'}
                    </Typography>
                  </Box>

                  {/* Email */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Email sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Email
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        color: previewContact.email ? theme.palette.text.primary : theme.palette.text.disabled,
                        textAlign: 'right',
                      }}
                    >
                      {previewContact.email || '--'}
                    </Typography>
                  </Box>

                  {/* Nombre de la empresa */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Nombre de la empresa
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          color: ((previewContact.Companies && previewContact.Companies.length > 0) || previewContact.Company) ? theme.palette.text.primary : theme.palette.text.disabled,
                          textAlign: 'right',
                        }}
                      >
                        {(previewContact.Companies && previewContact.Companies.length > 0)
                          ? previewContact.Companies[0].name
                          : previewContact.Company?.name || '--'}
                      </Typography>
                      <KeyboardArrowDown sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                    </Box>
                  </Box>

                  {/* Estado del lead */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Flag sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Estado del lead
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          color: previewContact.leadStatus ? theme.palette.text.primary : theme.palette.text.disabled,
                          textAlign: 'right',
                        }}
                      >
                        {previewContact.leadStatus || '--'}
                      </Typography>
                      <KeyboardArrowDown sx={{ fontSize: 14, color: '#9E9E9E' }} />
                    </Box>
                  </Box>

                  {/* Etapa del ciclo de vida */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <TrendingUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Etapa del ciclo de vida
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          color: theme.palette.text.primary,
                          textAlign: 'right',
                        }}
                      >
                        {previewContact.lifecycleStage || '--'}
                      </Typography>
                      <KeyboardArrowDown sx={{ fontSize: 14, color: '#9E9E9E' }} />
                    </Box>
                  </Box>

                  {/* Rol de compra */}
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
                      <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Rol de compra
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          color: theme.palette.text.disabled,
                          textAlign: 'right',
                        }}
                      >
                        --
                      </Typography>
                      <KeyboardArrowDown sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                    </Box>
                  </Box>
                </Box>

                {/* Sección Social */}
                <Box sx={{ 
                  mt: 3,
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Social
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        // Aquí puedes agregar un menú de opciones si es necesario
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <MoreVert sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </IconButton>
                  </Box>
                  
                  {/* Lista de redes sociales */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Facebook */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#1877f2' }}>
                        <Facebook sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.facebook || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!previewContact.facebook || previewContact.facebook === '#') {
                            e.preventDefault();
                            const currentUrl = previewContact.facebook || '';
                            const url = prompt('Ingresa la URL de Facebook:', currentUrl || 'https://www.facebook.com/');
                            if (url !== null) {
                              api.put(`/contacts/${previewContact.id}`, { facebook: url || null }).then(() => {
                                // Actualizar el contacto en el estado local
                                setPreviewContact({ ...previewContact, facebook: url || undefined });
                                fetchContacts(); // Refrescar la lista
                              }).catch(err => console.error('Error al guardar:', err));
                            }
                          }
                        }}
                        sx={{
                          fontSize: '0.875rem',
                          color: previewContact.facebook ? '#1976d2' : '#9E9E9E',
                          textDecoration: 'none',
                          flex: 1,
                          cursor: 'pointer',
                          wordBreak: 'break-all',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: previewContact.facebook ? '#1565c0' : '#757575',
                          },
                        }}
                      >
                        {previewContact.facebook || 'Agregar Facebook'}
                      </Link>
                    </Box>

                    {/* Twitter */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#1da1f2' }}>
                        <Twitter sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.twitter || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!previewContact.twitter || previewContact.twitter === '#') {
                            e.preventDefault();
                            const currentUrl = previewContact.twitter || '';
                            const url = prompt('Ingresa la URL de Twitter:', currentUrl || 'https://www.twitter.com/');
                            if (url !== null) {
                              api.put(`/contacts/${previewContact.id}`, { twitter: url || null }).then(() => {
                                setPreviewContact({ ...previewContact, twitter: url || undefined });
                                fetchContacts();
                              }).catch(err => console.error('Error al guardar:', err));
                            }
                          }
                        }}
                        sx={{
                          fontSize: '0.875rem',
                          color: previewContact.twitter ? '#1976d2' : '#9E9E9E',
                          textDecoration: 'none',
                          flex: 1,
                          cursor: 'pointer',
                          wordBreak: 'break-all',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: previewContact.twitter ? '#1565c0' : '#757575',
                          },
                        }}
                      >
                        {previewContact.twitter || 'Agregar Twitter'}
                      </Link>
                    </Box>

                    {/* LinkedIn */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#0077b5' }}>
                        <LinkedIn sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.linkedin || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!previewContact.linkedin || previewContact.linkedin === '#') {
                            e.preventDefault();
                            const currentUrl = previewContact.linkedin || '';
                            const url = prompt('Ingresa la URL de LinkedIn:', currentUrl || 'https://www.linkedin.com/');
                            if (url !== null) {
                              api.put(`/contacts/${previewContact.id}`, { linkedin: url || null }).then(() => {
                                setPreviewContact({ ...previewContact, linkedin: url || undefined });
                                fetchContacts();
                              }).catch(err => console.error('Error al guardar:', err));
                            }
                          }
                        }}
                        sx={{
                          fontSize: '0.875rem',
                          color: previewContact.linkedin ? '#1976d2' : '#9E9E9E',
                          textDecoration: 'none',
                          flex: 1,
                          cursor: 'pointer',
                          wordBreak: 'break-all',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: previewContact.linkedin ? '#1565c0' : '#757575',
                          },
                        }}
                      >
                        {previewContact.linkedin || 'Agregar LinkedIn'}
                      </Link>
                    </Box>

                    {/* YouTube */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#ff0000' }}>
                        <YouTube sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.youtube || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!previewContact.youtube || previewContact.youtube === '#') {
                            e.preventDefault();
                            const currentUrl = previewContact.youtube || '';
                            const url = prompt('Ingresa la URL de YouTube:', currentUrl || 'https://www.youtube.com/');
                            if (url !== null) {
                              api.put(`/contacts/${previewContact.id}`, { youtube: url || null }).then(() => {
                                setPreviewContact({ ...previewContact, youtube: url || undefined });
                                fetchContacts();
                              }).catch(err => console.error('Error al guardar:', err));
                            }
                          }
                        }}
                        sx={{
                          fontSize: '0.875rem',
                          color: previewContact.youtube ? '#1976d2' : '#9E9E9E',
                          textDecoration: 'none',
                          flex: 1,
                          cursor: 'pointer',
                          wordBreak: 'break-all',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: previewContact.youtube ? '#1565c0' : '#757575',
                          },
                        }}
                      >
                        {previewContact.youtube || 'Agregar YouTube'}
                      </Link>
                    </Box>
                  </Box>
                </Box>
                </Box>

                {/* Columna derecha - Actividades */}
                <Box sx={{ 
                  flex: '0 0 60%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  position: 'relative',
                  pl: 2, 
                  overflow: 'auto', 
                  maxHeight: 'calc(90vh - 100px)',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                    width: 0,
                    height: 0,
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: -16,
                    bottom: -16,
                    width: '1px',
                    bgcolor: theme.palette.divider,
                  },
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                    Actividades
                  </Typography>
                  
                  {loadingActivities ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : previewActivities.length === 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      py: 4,
                      textAlign: 'center',
                    }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}>
                        <Assignment sx={{ fontSize: 30, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF' }} />
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.text.secondary,
                        maxWidth: 200,
                      }}>
                        No hay actividades registradas
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {previewActivities.slice(0, 10).map((activity) => (
                        <Paper
                          key={activity.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.2s ease',
                            maxWidth: '85%',
                            '&:hover': {
                              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: activity.type === 'note' ? '#2E7D32' :
                                       activity.type === 'email' ? '#1976d2' :
                                       activity.type === 'call' ? '#0288d1' :
                                       activity.type === 'task' ? '#f57c00' :
                                       activity.type === 'meeting' ? '#7b1fa2' : '#757575',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {activity.type === 'note' ? <Note sx={{ fontSize: 18, color: 'white' }} /> :
                               activity.type === 'email' ? <Email sx={{ fontSize: 18, color: 'white' }} /> :
                               activity.type === 'call' ? <Phone sx={{ fontSize: 18, color: 'white' }} /> :
                               activity.type === 'task' ? <Assignment sx={{ fontSize: 18, color: 'white' }} /> :
                               activity.type === 'meeting' ? <Event sx={{ fontSize: 18, color: 'white' }} /> :
                               <Note sx={{ fontSize: 18, color: 'white' }} />}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600, 
                                color: theme.palette.text.primary,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                              }}>
                                {activity.subject || (activity.description ? activity.description.replace(/<[^>]*>/g, '').substring(0, 50) : 'Sin título')}
                              </Typography>
                              {activity.description && activity.description !== activity.subject && (
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.text.secondary,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                  {activity.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                                </Typography>
                              )}
                              {activity.createdAt && (
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.text.secondary,
                                  display: 'block',
                                  mt: 0.5,
                                }}>
                                  {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                      {previewActivities.length > 10 && (
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          textAlign: 'center',
                          mt: 1,
                        }}>
                          Mostrando 10 de {previewActivities.length} actividades
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </DialogContent>
            </>
          ) : null}
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
              ¿Estás seguro de que deseas eliminar este contacto?
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente del sistema.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            px: 2, 
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

