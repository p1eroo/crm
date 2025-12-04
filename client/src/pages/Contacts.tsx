import React, { useEffect, useState, useCallback } from 'react';
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
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
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
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
  const [previewActivities, setPreviewActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
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
  const [idType, setIdType] = useState<'dni' | 'cee'>('dni');
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

  // Agrupar contactos por etapa
  const groupedContacts = contacts.reduce((acc, contact) => {
    const stage = contact.lifecycleStage || 'lead';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

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
      px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      pt: { xs: 2, sm: 3, md: 3 },
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 } }}>
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
                            fontSize: { xs: '0.875rem', md: '0.9375rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.25,
                          }}
                        >
                          {contact.firstName} {contact.lastName}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: { xs: '0.75rem', md: '0.8125rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                        >
                          {contact.email || '--'}
                        </Typography>
                      </Box>
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
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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

