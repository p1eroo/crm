import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDatePeru } from '../utils/dateUtils';
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
  Select,
  Popover,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputBase,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
  Drawer,
  useMediaQuery,
} from '@mui/material';
import {
  Note,
  Email,
  Phone,
  Person,
  Business,
  CalendarToday,
  Assignment,
  Search,
  MoreVert,
  Close,
  ChevronLeft,
  ChevronRight,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  Image,
  Code,
  TableChart,
  AttachFile,
  Add,
  ExpandMore,
  PersonAdd,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  Event,
  KeyboardArrowRight,
  Edit,
  KeyboardArrowDown,
  OpenInNew,
  ContentCopy,
  Delete,
  Flag,
  DonutSmall,
  AccessTime,
  Comment,
  AttachMoney,
  AutoAwesome,
  ReportProblem,
  Receipt,
  TaskAlt,
} from '@mui/icons-material';
import api from '../config/api';
import axios from 'axios';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import negocioLogo from '../assets/negocio.png';

interface DealDetailData {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  priority?: 'baja' | 'media' | 'alta';
  description?: string;
  createdAt?: string;
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
  const [deal, setDeal] = useState<DealDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [dealContacts, setDealContacts] = useState<any[]>([]);
  const [dealCompanies, setDealCompanies] = useState<any[]>([]);
  const [dealDeals, setDealDeals] = useState<any[]>([]);
  const [removeContactDialogOpen, setRemoveContactDialogOpen] = useState(false);
  const [contactToRemove, setContactToRemove] = useState<{ id: number; name: string } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [moreOptionsMenuAnchorEl, setMoreOptionsMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('empresas');
  const [associateSearch, setAssociateSearch] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedAssociations, setSelectedAssociations] = useState<{ [key: string]: number[] }>({
    companies: [],
    contacts: [],
    deals: [],
  });
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [addCompanyMenuAnchor, setAddCompanyMenuAnchor] = useState<null | HTMLElement>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [addContactMenuAnchor, setAddContactMenuAnchor] = useState<null | HTMLElement>(null);
  const [contactSortField, setContactSortField] = useState<'firstName' | 'email' | 'phone'>('firstName');
  const [contactSortOrder, setContactSortOrder] = useState<'asc' | 'desc'>('asc');
  const [companySortField, setCompanySortField] = useState<'name' | 'domain' | 'phone'>('name');
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('asc');
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [companyDialogTab, setCompanyDialogTab] = useState<'create' | 'existing'>('create');
  const [existingCompaniesSearch, setExistingCompaniesSearch] = useState('');
  const [selectedExistingCompanies, setSelectedExistingCompanies] = useState<number[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loadingAllCompanies, setLoadingAllCompanies] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    ruc: '',
    lifecycleStage: 'lead',
    ownerId: user?.id || null,
  });
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [contactDialogTab, setContactDialogTab] = useState<'create' | 'existing'>('create');
  const [existingContactsSearch, setExistingContactsSearch] = useState('');
  const [selectedExistingContacts, setSelectedExistingContacts] = useState<number[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loadingAllContacts, setLoadingAllContacts] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    identificationType: 'dni',
    dni: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    province: '',
    department: '',
    jobTitle: '',
    lifecycleStage: 'lead',
    ownerId: user?.id || null,
  });

  // Función para ordenar contactos
  const handleSortContacts = (field: 'firstName' | 'email' | 'phone') => {
    const isAsc = contactSortField === field && contactSortOrder === 'asc';
    setContactSortOrder(isAsc ? 'desc' : 'asc');
    setContactSortField(field);
  };

  // Función para ordenar empresas
  const handleSortCompanies = (field: 'name' | 'domain' | 'phone') => {
    const isAsc = companySortField === field && companySortOrder === 'asc';
    setCompanySortOrder(isAsc ? 'desc' : 'asc');
    setCompanySortField(field);
  };

  // Estados para ordenar negocios
  const [dealSortField, setDealSortField] = useState<'name' | 'amount' | 'closeDate' | 'stage'>('name');
  const [dealSortOrder, setDealSortOrder] = useState<'asc' | 'desc'>('asc');

  // Función para ordenar negocios
  const handleSortDeals = (field: 'name' | 'amount' | 'closeDate' | 'stage') => {
    const isAsc = dealSortField === field && dealSortOrder === 'asc';
    setDealSortOrder(isAsc ? 'desc' : 'asc');
    setDealSortField(field);
  };

  // Función para copiar al portapapeles
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Podrías agregar una notificación aquí
  };
  const [createActivityMenuAnchor, setCreateActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('Todo hasta ahora');
  const [timeRangeMenuAnchor, setTimeRangeMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterMenuAnchor, setActivityFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterSearch, setActivityFilterSearch] = useState('');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<any | null>(null);
  const [completedActivities, setCompletedActivities] = useState<{ [key: number]: boolean }>({});
  const activityFilterChipRef = useRef<HTMLDivElement>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all'); // 'all', 'note', 'email', 'call', 'task', 'meeting'
  const [allUsersFilter, setAllUsersFilter] = useState<string>('Todos los usuarios');
  const [allUsersMenuAnchor, setAllUsersMenuAnchor] = useState<null | HTMLElement>(null);

  const fetchDeal = useCallback(async () => {
    try {
      const response = await api.get(`/deals/${id}`);
      if (!response.data) {
        setDeal(null);
        setLoading(false);
        return;
      }
      setDeal(response.data);
      
      // Obtener todos los contactos relacionados al deal (relación muchos a muchos)
      // Solo usar la relación muchos a muchos (Contacts), no el contacto principal (Contact)
      if (response.data.Contacts && Array.isArray(response.data.Contacts)) {
        // Usar siempre la lista de Contacts, incluso si está vacía
        setDealContacts(response.data.Contacts);
      } else {
        // Si no hay contactos en la relación muchos a muchos, dejar el array vacío
        setDealContacts([]);
      }

      // Obtener todas las empresas relacionadas al deal (relación muchos a muchos)
      // Solo usar la relación muchos a muchos (Companies), no la empresa principal (Company)
      if (response.data.Companies && Array.isArray(response.data.Companies)) {
        // Usar siempre la lista de Companies, incluso si está vacía
        setDealCompanies(response.data.Companies);
      } else {
        // Si no hay empresas en la relación muchos a muchos, dejar el array vacío
        setDealCompanies([]);
      }

      // Obtener todos los negocios relacionados al deal (relación muchos a muchos)
      if (response.data.Deals && Array.isArray(response.data.Deals)) {
        setDealDeals(response.data.Deals);
      } else {
        setDealDeals([]);
      }
    } catch (error: any) {
      console.error('Error fetching deal:', error);
      if (error.response?.status === 404) {
        setDeal(null);
      } else {
        // Si hay un error pero no es 404, mantener el deal si existe
        // pero limpiar los contactos y empresas
        setDealContacts([]);
        setDealCompanies([]);
        setDealDeals([]);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchActivities = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await api.get('/activities', {
        params: { dealId: id },
      });
      const activitiesData = response.data.activities || response.data || [];
      
      // Filtrar solo actividades que realmente pertenecen a este negocio
      const dealIdNum = parseInt(id, 10);
      const filteredActivities = activitiesData.filter((activity: any) => {
        return activity.dealId === dealIdNum || activity.dealId === id;
      });
      
      // Obtener tareas asociadas
      const tasksResponse = await api.get('/tasks', {
        params: { dealId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];
      
      // Filtrar solo tareas que realmente pertenecen a este negocio
      const filteredTasks = tasksData.filter((task: any) => {
        return task.dealId === dealIdNum || task.dealId === id;
      });
      
      const tasksAsActivities = filteredTasks.map((task: any) => ({
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
        dealId: task.dealId,
      }));
      
      const allActivities = [...filteredActivities, ...tasksAsActivities].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return dateB - dateA;
      });
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchActivities();
    }
  }, [id, fetchDeal, fetchActivities]);

  useEffect(() => {
    if (descriptionEditorRef.current && taskOpen) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || '';
      }
    }
  }, [taskData.description, taskOpen]);

  const updateActiveFormats = useCallback(() => {
    if (descriptionEditorRef.current) {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    }
  }, []);

  useEffect(() => {
    const editor = descriptionEditorRef.current;
    if (!editor || !taskOpen) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta')) {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('mouseup', handleMouseUp);
    editor.addEventListener('keyup', handleKeyUp as EventListener);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('mouseup', handleMouseUp);
      editor.removeEventListener('keyup', handleKeyUp as EventListener);
    };
  }, [updateActiveFormats, taskOpen]);


  const fetchAllCompanies = async () => {
    try {
      setLoadingAllCompanies(true);
      const response = await api.get('/companies', { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingAllCompanies(false);
    }
  };

  const fetchAllContacts = async () => {
    setLoadingAllContacts(true);
    try {
      const response = await api.get('/contacts', { params: { limit: 1000 } });
      setAllContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error('Error fetching all contacts:', error);
    } finally {
      setLoadingAllContacts(false);
    }
  };

  const fetchAssociations = async (searchTerm?: string) => {
    setLoadingAssociations(true);
    try {
      // Si hay búsqueda, cargar todos los resultados
      if (searchTerm && searchTerm.trim().length > 0) {
        const [companiesRes, contactsRes, dealsRes] = await Promise.all([
          api.get('/companies', { params: { limit: 1000, search: searchTerm } }),
          api.get('/contacts', { params: { limit: 1000, search: searchTerm } }),
          api.get('/deals', { params: { limit: 1000, search: searchTerm } }),
        ]);
        setCompanies(companiesRes.data.companies || companiesRes.data || []);
        setContacts(contactsRes.data.contacts || contactsRes.data || []);
        setDeals(dealsRes.data.deals || dealsRes.data || []);
      } else {
        // Si no hay búsqueda, solo cargar los vinculados al deal actual
        const associatedItems: { companies: any[]; contacts: any[]; deals: any[] } = {
          companies: [],
          contacts: [],
          deals: [],
        };

        // Cargar empresa vinculada si existe
        if (deal?.Company) {
          associatedItems.companies.push(deal.Company);
        }

        // Cargar contacto vinculado si existe
        if (deal?.Contact) {
          associatedItems.contacts.push(deal.Contact);
        }

        setCompanies(associatedItems.companies);
        setContacts(associatedItems.contacts);
        setDeals(associatedItems.deals);
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
    } finally {
      setLoadingAssociations(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      setSaving(true);
      
      // Obtener la empresa principal del deal (primero de dealCompanies o Company del deal)
      const primaryCompanyId = dealCompanies && dealCompanies.length > 0 
        ? dealCompanies[0].id 
        : deal?.Company?.id;
      
      if (!primaryCompanyId) {
        alert('El negocio debe tener al menos una empresa asociada para crear un contacto');
        setSaving(false);
        return;
      }
      
      // Mapear los campos del formulario a los campos del modelo
      const contactData = {
        firstName: contactFormData.firstName,
        lastName: contactFormData.lastName,
        email: contactFormData.email,
        phone: contactFormData.phone,
        address: contactFormData.address,
        city: contactFormData.district, // district -> city
        state: contactFormData.province, // province -> state
        country: contactFormData.department, // department -> country
        jobTitle: contactFormData.jobTitle,
        lifecycleStage: contactFormData.lifecycleStage,
        ownerId: contactFormData.ownerId,
        companyId: primaryCompanyId, // Empresa principal requerida
      };
      const response = await api.post('/contacts', contactData);
      // Asociar el contacto recién creado al deal usando la relación muchos a muchos
      if (id && response.data.id) {
        await api.post(`/deals/${id}/contacts`, { contactIds: [response.data.id] });
      }
      await fetchDeal();
      setAddContactDialogOpen(false);
      setContactFormData({
        identificationType: 'dni',
        dni: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        district: '',
        province: '',
        department: '',
        jobTitle: '',
        lifecycleStage: 'lead',
        ownerId: user?.id || null,
      });
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Error al crear el contacto');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingContacts = async () => {
    try {
      setSaving(true);
      // Asociar todos los contactos seleccionados al deal usando la relación muchos a muchos
      if (id && selectedExistingContacts.length > 0) {
        await api.post(`/deals/${id}/contacts`, { contactIds: selectedExistingContacts });
        // Recargar el deal para obtener los contactos actualizados
        await fetchDeal();
        setAddContactDialogOpen(false);
        setSelectedExistingContacts([]);
        setExistingContactsSearch('');
      }
    } catch (error: any) {
      console.error('Error adding contacts:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al agregar los contactos';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      setSaving(true);
      const companyData = {
        ...companyFormData,
        ownerId: companyFormData.ownerId || user?.id,
      };
      const response = await api.post('/companies', companyData);
      // Asociar la empresa recién creada al deal usando la relación muchos a muchos
      if (id && response.data.id) {
        await api.post(`/deals/${id}/companies`, { companyIds: [response.data.id] });
      }
      await fetchDeal();
      setAddCompanyDialogOpen(false);
      setCompanyFormData({
        name: '',
        domain: '',
        industry: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        ruc: '',
        lifecycleStage: 'lead',
        ownerId: user?.id || null,
      });
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Error al crear la empresa');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingCompanies = async () => {
    try {
      setSaving(true);
      // Asociar todas las empresas seleccionadas al deal usando la relación muchos a muchos
      if (id && selectedExistingCompanies.length > 0) {
        await api.post(`/deals/${id}/companies`, { companyIds: selectedExistingCompanies });
        // Recargar el deal para obtener las empresas actualizadas
        await fetchDeal();
        setAddCompanyDialogOpen(false);
        setSelectedExistingCompanies([]);
        setExistingCompaniesSearch('');
      }
    } catch (error: any) {
      console.error('Error adding companies:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al agregar las empresas';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCompanyClick = (companyId: number, companyName: string) => {
    setContactToRemove({ id: companyId, name: companyName });
    setRemoveContactDialogOpen(true);
  };

  const handleConfirmRemoveCompany = async () => {
    if (!contactToRemove || !id) return;
    try {
      setSaving(true);
      await api.delete(`/deals/${id}/companies/${contactToRemove.id}`);
      // Actualizar la lista de empresas inmediatamente sin esperar fetchDeal
      setDealCompanies((prevCompanies) => prevCompanies.filter((company: any) => company.id !== contactToRemove.id));
      // También recargar el deal completo para asegurar consistencia
      await fetchDeal();
      setRemoveContactDialogOpen(false);
      setContactToRemove(null);
    } catch (error: any) {
      console.error('Error removing company:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar la empresa del negocio';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSearchRuc = async () => {
    if (!companyFormData.ruc || companyFormData.ruc.length < 11) {
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
        `https://api.factiliza.com/v1/ruc/info/${companyFormData.ruc}`,
        {
          headers: {
            'Authorization': `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Actualizar el formulario con los datos obtenidos
        setCompanyFormData({
          ...companyFormData,
          name: data.nombre_o_razon_social || '',
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
        setRucError('Error al buscar RUC. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleRemoveContactClick = (contactId: number, contactName: string) => {
    setContactToRemove({ id: contactId, name: contactName });
    setRemoveContactDialogOpen(true);
  };

  const handleConfirmRemoveContact = async () => {
    if (!id || !contactToRemove) return;

    try {
      await api.delete(`/deals/${id}/contacts/${contactToRemove.id}`);
      // Actualizar la lista de contactos inmediatamente sin esperar fetchDeal
      setDealContacts((prevContacts) => prevContacts.filter((contact: any) => contact.id !== contactToRemove.id));
      // También recargar el deal completo para asegurar consistencia
      await fetchDeal();
      setRemoveContactDialogOpen(false);
      setContactToRemove(null);
    } catch (error: any) {
      console.error('Error removing contact:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar el contacto';
      alert(errorMessage);
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

  const getActivityTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'note': 'Nota',
      'email': 'Correo',
      'call': 'Llamada',
      'task': 'Tarea',
      'meeting': 'Reunión',
      'todo': 'Tarea',
    };
    return typeMap[type?.toLowerCase()] || 'Actividad';
  };

  const getActivityStatusColor = (activity: any) => {
    if (!activity.dueDate) {
      // Sin fecha de vencimiento - gris neutro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(activity.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Vencida - rojo claro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE',
      };
    } else if (diffDays <= 3) {
      // Por vencer (1-3 días) - amarillo/naranja claro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : '#FFF9C4',
      };
    } else {
      // A tiempo - verde claro
      return {
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9',
      };
    }
  };

  // const getStageColor = (stage: string) => {
  //   const colors: { [key: string]: string } = {
  //     'lead': '#EF4444',
  //     'contacto': '#F59E0B',
  //     'reunion_agendada': '#F59E0B',
  //     'reunion_efectiva': '#F59E0B',
  //     'propuesta_economica': '#3B82F6',
  //     'negociacion': '#10B981',
  //     'licitacion': '#10B981',
  //     'licitacion_etapa_final': '#10B981',
  //     'cierre_ganado': '#10B981',
  //     'cierre_perdido': '#EF4444',
  //     'firma_contrato': '#10B981',
  //     'activo': '#10B981',
  //     'cliente_perdido': '#EF4444',
  //     'lead_inactivo': '#EF4444',
  //   };
  //   return colors[stage] || '#6B7280';
  // };

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

  const handleOpenTask = () => {
    setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setSelectedDate(null);
    setCurrentMonth(new Date());
    setTaskOpen(true);
  };

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (taskData.dueDate) {
      // Parsear el string YYYY-MM-DD como fecha local para evitar problemas de UTC
      const dateMatch = taskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Los meses en Date son 0-11
        const day = parseInt(dateMatch[3], 10);
        const date = new Date(year, month, day);
        setSelectedDate(date);
        setCurrentMonth(date);
      } else {
        const date = new Date(taskData.dueDate);
        setSelectedDate(date);
        setCurrentMonth(date);
      }
    } else {
      const today = new Date();
      setSelectedDate(null);
      setCurrentMonth(today);
    }
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    // Crear fecha para mostrar en el calendario (mes es 1-12, pero Date usa 0-11)
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    // Formatear directamente como YYYY-MM-DD sin conversiones de zona horaria
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setTaskData({ ...taskData, dueDate: '' });
    setDatePickerAnchorEl(null);
  };

  const handleToday = () => {
    // Obtener la fecha actual en hora de Perú
    const today = new Date();
    const peruToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const year = peruToday.getFullYear();
    const month = peruToday.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    const day = peruToday.getDate();
    // Usar la misma función handleDateSelect con los valores directos
    handleDateSelect(year, month, day);
  };

  const handleCreateActivity = (type: 'note' | 'task' | 'email' | 'call' | 'meeting') => {
    setCreateActivityMenuAnchor(null);
    if (type === 'note') {
      setNoteData({ subject: '', description: '' });
      setNoteOpen(true);
    } else if (type === 'task') {
      setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
      setTaskOpen(true);
    }
    // TODO: Implementar otros tipos de actividades (email, call, meeting)
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];
    
    // Días del mes anterior
    // Si el mes empieza en domingo (0), no hay días del mes anterior
    // Si empieza en lunes (1), hay 1 día del mes anterior, etc.
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNumber = prevMonthLastDay - startingDayOfWeek + i + 1;
      days.push({ day: dayNumber, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
    // Completar hasta 42 días (6 semanas) con días del siguiente mes
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }
    
    return days;
  };

  const formatDateDisplay = (dateString: string) => {
    return formatDatePeru(dateString);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const handleSaveTask = async () => {
    if (!taskData.title.trim()) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        type: 'todo',
        status: 'not started',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || undefined,
        dealId: id,
      });
      setSuccessMessage('Tarea creada exitosamente' + (taskData.dueDate ? ' y sincronizada con Google Calendar' : ''));
      setTaskOpen(false);
      setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
      fetchActivities();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving task:', error);
      setSuccessMessage('Error al crear la tarea');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSaving(false);
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
      pb: { xs: 2, sm: 3, md: 4 },
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
        flex: 1,
        overflow: { xs: 'visible', md: 'hidden' },
        minHeight: { xs: 'auto', md: 0 },
        gap: 2,
      }}>
        {/* Columna Principal - Descripción y Actividades */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* DealHeader */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              px: 2.5,
              pt: 2.5,
              pb: 1.5,
              mb: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {/* Parte superior: Avatar + Info a la izquierda, Botones a la derecha */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              {/* Izquierda: Avatar + Nombre + Subtítulo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                <Avatar
                  src={negocioLogo}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: negocioLogo ? 'transparent' : taxiMonterricoColors.green,
                    fontSize: '1.25rem',
                    fontWeight: 600,
                  }}
                >
                  {!negocioLogo && getInitials(deal.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', mb: 0.5 }}>
                    {deal.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {formatCurrency(deal.amount || 0)} {deal.closeDate ? `• ${new Date(deal.closeDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Derecha: Etapa + Menú desplegable de acciones */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  label={getStageLabel(deal.stage)}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)',
                    color: taxiMonterricoColors.green,
                    fontWeight: 500,
                  }}
                />
                <Tooltip title="Acciones">
                  <IconButton
                    onClick={(e) => setActionsMenuAnchorEl(e.currentTarget)}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <KeyboardArrowDown />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={actionsMenuAnchorEl}
                  open={Boolean(actionsMenuAnchorEl)}
                  onClose={() => setActionsMenuAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0,0,0,0.5)' 
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleOpenNote();
                      setActionsMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Note sx={{ fontSize: 20, mr: 1.5, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      Crear nota
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenEmail();
                      setActionsMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Email sx={{ fontSize: 20, mr: 1.5, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      Enviar email
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenCall();
                      setActionsMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Phone sx={{ fontSize: 20, mr: 1.5, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      Llamar
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenTask();
                      setActionsMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Assignment sx={{ fontSize: 20, mr: 1.5, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      Crear tarea
                    </Typography>
                  </MenuItem>
                </Menu>
                <Tooltip title="Más opciones">
                  <IconButton
                    onClick={(e) => setMoreOptionsMenuAnchorEl(e.currentTarget)}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={moreOptionsMenuAnchorEl}
                  open={Boolean(moreOptionsMenuAnchorEl)}
                  onClose={() => setMoreOptionsMenuAnchorEl(null)}
                  TransitionProps={{
                    timeout: 200,
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0,0,0,0.5)' 
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      bgcolor: theme.palette.background.paper,
                      animation: 'slideDown 0.2s ease',
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
                    },
                  }}
                >
                  <MenuItem 
                    onClick={() => {
                      // TODO: Implementar edición
                      setMoreOptionsMenuAnchorEl(null);
                    }}
                    sx={{
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    Editar
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      // TODO: Implementar eliminación
                      setMoreOptionsMenuAnchorEl(null);
                    }}
                    sx={{
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    Eliminar
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      // TODO: Implementar duplicación
                      setMoreOptionsMenuAnchorEl(null);
                    }}
                    sx={{
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    Duplicar
                  </MenuItem>
                </Menu>
              </Box>
            </Box>

            {/* Línea separadora */}
            <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

            {/* Parte inferior: Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {deal.closeDate && (
                <Chip
                  icon={<CalendarToday sx={{ fontSize: 14 }} />}
                  label={`Cierre: ${new Date(deal.closeDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                    border: `1px solid ${theme.palette.divider}`,
                    '& .MuiChip-icon': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                />
              )}
              {deal.Owner && (
                <Chip
                  icon={<Person sx={{ fontSize: 14 }} />}
                  label={`${deal.Owner.firstName} ${deal.Owner.lastName}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                    border: `1px solid ${theme.palette.divider}`,
                    '& .MuiChip-icon': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                />
              )}
              <Chip
                icon={<Flag sx={{ fontSize: 14, color: (deal.priority || 'baja') === 'baja' ? taxiMonterricoColors.green : (deal.priority || 'baja') === 'media' ? '#F59E0B' : '#EF4444' }} />}
                label={deal.priority === 'baja' ? 'Baja' : deal.priority === 'media' ? 'Media' : deal.priority === 'alta' ? 'Alta' : 'Baja'}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                  border: `1px solid ${theme.palette.divider}`,
                  color: (deal.priority || 'baja') === 'baja' ? taxiMonterricoColors.green : 
                         (deal.priority || 'baja') === 'media' ? '#F59E0B' : '#EF4444',
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: (deal.priority || 'baja') === 'baja' ? taxiMonterricoColors.green : 
                           (deal.priority || 'baja') === 'media' ? '#F59E0B' : '#EF4444',
                  },
                }}
              />
            </Box>
          </Paper>

          {/* Tabs estilo barra de filtros */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              bgcolor: theme.palette.background.paper,
              px: 2,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  minHeight: 'auto',
                  flex: 1,
                  '& .MuiTabs-flexContainer': {
                    gap: 0,
                    justifyContent: 'flex-start',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: taxiMonterricoColors.green,
                    height: 2,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    minHeight: 40,
                    height: 40,
                    paddingX: 3,
                    bgcolor: 'transparent',
                    color: theme.palette.text.secondary,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&.Mui-selected': {
                      bgcolor: 'transparent',
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: theme.palette.text.primary,
                    },
                    '&:not(:last-child)::after': {
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1px',
                      height: '60%',
                      backgroundColor: theme.palette.divider,
                    },
                  },
                }}
              >
                <Tab label="Resumen" />
                <Tab label="Información Avanzada" />
                <Tab label="Actividades" />
              </Tabs>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                ml: 1,
                pl: 1,
                borderLeft: `1px solid ${theme.palette.divider}`,
              }}>
                <Tooltip title="Copiloto IA">
                  <IconButton
                    onClick={() => setCopilotOpen(!copilotOpen)}
                    size="small"
                    sx={{
                      color: copilotOpen ? taxiMonterricoColors.green : theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    <AutoAwesome />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Box>

          {/* Tab Resumen */}
          {activeTab === 0 && (
            <>
              {/* Cards de Fecha de Creación, Etapa del Negocio, Última Actividad y Propietario */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2, 
                mb: 2 
              }}>
                <Card
                  sx={{
                    width: '100%',
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Fecha de creación
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {deal.createdAt
                      ? `${new Date(deal.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} ${new Date(deal.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'No disponible'}
                  </Typography>
                </Card>

                <Card
                  sx={{
                    width: '100%',
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DonutSmall sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Etapa del negocio
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyboardArrowRight sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {deal.stage ? getStageLabel(deal.stage) : 'No disponible'}
                    </Typography>
                  </Box>
                </Card>

                <Card
                  sx={{
                    width: '100%',
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Última actividad
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {activities.length > 0 && activities[0].createdAt
                      ? new Date(activities[0].createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'No hay actividades'}
                  </Typography>
                </Card>

                <Card
                  sx={{
                    width: '100%',
                    p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Propietario del negocio
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {deal.Owner 
                      ? (deal.Owner.firstName || deal.Owner.lastName
                          ? `${deal.Owner.firstName || ''} ${deal.Owner.lastName || ''}`.trim()
                          : deal.Owner.email || 'Sin nombre')
                      : 'No asignado'}
                  </Typography>
                </Card>
              </Box>

              {/* Card de Actividades Recientes */}
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: theme.palette.background.paper,
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                mt: 2,
                height: 'fit-content',
                minHeight: 'auto',
                overflow: 'visible',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                mb: 2,
              }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  Actividades Recientes
                </Typography>
                
                {activities && activities.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {activities
                      .sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0).getTime();
                        const dateB = new Date(b.createdAt || 0).getTime();
                        return dateB - dateA;
                      })
                      .slice(0, 5)
                      .map((activity) => {
                        const getActivityIcon = () => {
                          switch (activity.type) {
                            case 'note':
                              return <Note sx={{ fontSize: 18, color: '#9E9E9E' }} />;
                            case 'email':
                              return <Email sx={{ fontSize: 18, color: '#1976D2' }} />;
                            case 'call':
                              return <Phone sx={{ fontSize: 18, color: '#2E7D32' }} />;
                            case 'task':
                            case 'todo':
                              return <Assignment sx={{ fontSize: 18, color: '#F57C00' }} />;
                            case 'meeting':
                              return <Event sx={{ fontSize: 18, color: '#7B1FA2' }} />;
                            default:
                              return <Comment sx={{ fontSize: 18, color: theme.palette.text.secondary }} />;
                          }
                        };

                        const getActivityTypeLabel = () => {
                          switch (activity.type) {
                            case 'note':
                              return 'Nota';
                            case 'email':
                              return 'Correo';
                            case 'call':
                              return 'Llamada';
                            case 'task':
                            case 'todo':
                              return 'Tarea';
                            case 'meeting':
                              return 'Reunión';
                            default:
                              return 'Actividad';
                          }
                        };

                        return (
                          <Box
                            key={activity.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: taxiMonterricoColors.green,
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(46, 125, 50, 0.1)' 
                                  : 'rgba(46, 125, 50, 0.05)',
                              },
                            }}
                          >
                            <Box sx={{ pt: 0.5 }}>
                              {getActivityIcon()}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                                  {activity.subject || getActivityTypeLabel()}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, whiteSpace: 'nowrap', ml: 1 }}>
                                  {activity.createdAt && new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </Typography>
                              </Box>
                              {activity.description && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.75rem', 
                                    color: theme.palette.text.secondary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {activity.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                                  {activity.description.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No hay actividades recientes
                  </Typography>
                )}
              </Card>

              {/* Card de Contactos Vinculados */}
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: theme.palette.background.paper,
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                mt: 2,
                height: 'fit-content',
                minHeight: 'auto',
                overflow: 'visible',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                mb: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Person sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Contactos vinculados
                  </Typography>
                </Box>
                {dealContacts && dealContacts.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dealContacts.slice(0, 5).map((contact: any) => (
                      <Box
                        key={contact.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: taxiMonterricoColors.green,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(46, 125, 50, 0.1)' 
                              : 'rgba(46, 125, 50, 0.05)',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                          {contact.firstName && contact.lastName 
                            ? `${contact.firstName} ${contact.lastName}`
                            : contact.email || 'Sin nombre'}
                        </Typography>
                      </Box>
                    ))}
                    {dealContacts.length > 5 && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center', mt: 1 }}>
                        Y {dealContacts.length - 5} más...
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No hay contactos vinculados
                  </Typography>
                )}
              </Card>

              {/* Card de Empresas Vinculadas */}
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: theme.palette.background.paper,
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                mt: 2,
                height: 'fit-content',
                minHeight: 'auto',
                overflow: 'visible',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                mb: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Business sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Empresas vinculadas
                  </Typography>
                </Box>
                {dealCompanies && dealCompanies.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dealCompanies.slice(0, 5).map((company: any) => (
                      <Box
                        key={company.id}
                        onClick={() => navigate(`/companies/${company.id}`)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: taxiMonterricoColors.green,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(46, 125, 50, 0.1)' 
                              : 'rgba(46, 125, 50, 0.05)',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                          {company.name || 'Sin nombre'}
                        </Typography>
                      </Box>
                    ))}
                    {dealCompanies.length > 5 && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center', mt: 1 }}>
                        Y {dealCompanies.length - 5} más...
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No hay empresas vinculadas
                  </Typography>
                )}
              </Card>

              {/* Card de Negocios Vinculados */}
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: theme.palette.background.paper,
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                mt: 2,
                height: 'fit-content',
                minHeight: 'auto',
                overflow: 'visible',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                mb: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Negocios vinculados
                  </Typography>
                </Box>
                {dealDeals && dealDeals.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dealDeals.slice(0, 5).map((dealItem: any) => (
                      <Box
                        key={dealItem.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: taxiMonterricoColors.green,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(46, 125, 50, 0.1)' 
                              : 'rgba(46, 125, 50, 0.05)',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                          {dealItem.name || 'Sin nombre'}
                        </Typography>
                        {dealItem.amount && (
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                            S/ {dealItem.amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {dealDeals.length > 5 && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center', mt: 1 }}>
                        Y {dealDeals.length - 5} más...
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No hay negocios vinculados
                  </Typography>
                )}
              </Card>
            </>
          )}

          {/* Cards de Fecha de Creación, Etapa del Negocio, Última Actividad y Propietario - Solo en pestaña Información Avanzada */}
          {activeTab === 1 && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2, 
              mb: 2 
            }}>
              <Card
                sx={{
                  width: '100%',
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  borderRadius: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarToday sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Fecha de creación
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {deal.createdAt
                    ? `${new Date(deal.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })} ${new Date(deal.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'No disponible'}
                </Typography>
              </Card>

              <Card
                sx={{
                  width: '100%',
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  borderRadius: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DonutSmall sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Etapa del negocio
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <KeyboardArrowRight sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {deal.stage ? getStageLabel(deal.stage) : 'No disponible'}
                  </Typography>
                </Box>
              </Card>

              <Card
                sx={{
                  width: '100%',
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  borderRadius: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Última actividad
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {activities.length > 0 && activities[0].createdAt
                    ? new Date(activities[0].createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'No hay actividades'}
                </Typography>
              </Card>

              <Card
                sx={{
                  width: '100%',
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  borderRadius: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    Propietario del negocio
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {deal.Owner 
                    ? (deal.Owner.firstName || deal.Owner.lastName
                        ? `${deal.Owner.firstName || ''} ${deal.Owner.lastName || ''}`.trim()
                        : deal.Owner.email || 'Sin nombre')
                    : 'No asignado'}
                </Typography>
              </Card>
            </Box>
          )}

          {/* Card de Descripción - Solo visible en pestaña Información Avanzada */}
          {activeTab === 1 && (
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              bgcolor: theme.palette.background.paper,
              px: 2,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Vista de Descripción */}
              <Box>

                {deal.description ? (
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>
                    {deal.description}
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                      Actividades Recientes
                    </Typography>
                    
                    {/* Opciones de búsqueda y crear actividades */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      mb: 2,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          placeholder="Buscar actividades"
                          value={activitySearch}
                          onChange={(e) => setActivitySearch(e.target.value)}
                          sx={{
                            width: '250px',
                            transition: 'all 0.3s ease',
                            '& .MuiOutlinedInput-root': {
                              height: '32px',
                              fontSize: '0.875rem',
                              '&:hover': {
                                '& fieldset': {
                                  borderColor: taxiMonterricoColors.green,
                                },
                              },
                              '&.Mui-focused': {
                                '& fieldset': {
                                  borderColor: taxiMonterricoColors.green,
                                  borderWidth: 2,
                                },
                              },
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Button 
                          size="small" 
                          variant="outlined" 
                          endIcon={<ExpandMore />}
                          onClick={(e) => setCreateActivityMenuAnchor(e.currentTarget)}
                          sx={{
                            borderColor: taxiMonterricoColors.green,
                            color: taxiMonterricoColors.green,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: taxiMonterricoColors.green,
                              backgroundColor: 'rgba(46, 125, 50, 0.08)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                            },
                            '&:active': {
                              transform: 'translateY(0)',
                            },
                          }}
                        >
                          Crear actividades
                        </Button>
                      </Box>
                      
                      {/* Filtros alineados a la derecha */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={selectedTimeRange}
                          size="small" 
                          deleteIcon={<KeyboardArrowDown fontSize="small" />}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setTimeRangeMenuAnchor(e.currentTarget);
                          }}
                          onClick={(e) => setTimeRangeMenuAnchor(e.currentTarget)}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: taxiMonterricoColors.green,
                            '&:hover': {
                              backgroundColor: 'rgba(46, 125, 50, 0.08)',
                              transform: 'scale(1.05)',
                              boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                            },
                          }}
                        />
                        <Box 
                          ref={activityFilterChipRef}
                          sx={{ display: 'inline-flex' }}
                        >
                          {selectedActivityTypes.length > 0 ? (
                            <Chip 
                              label={`(${selectedActivityTypes.length}) Actividad`}
                              size="small" 
                              deleteIcon={<Close fontSize="small" />}
                              onDelete={(e) => {
                                e.stopPropagation();
                                setSelectedActivityTypes([]);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activityFilterChipRef.current) {
                                  setActivityFilterMenuAnchor(activityFilterChipRef.current);
                                }
                              }}
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                bgcolor: 'rgba(46, 125, 50, 0.1)',
                                color: taxiMonterricoColors.green,
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.15)',
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                                },
                              }}
                            />
                          ) : (
                            <Chip 
                              label="Actividad"
                              size="small" 
                              deleteIcon={<KeyboardArrowDown fontSize="small" />}
                              onDelete={(e) => {
                                e.stopPropagation();
                                if (activityFilterChipRef.current) {
                                  setActivityFilterMenuAnchor(activityFilterChipRef.current);
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activityFilterChipRef.current) {
                                  setActivityFilterMenuAnchor(activityFilterChipRef.current);
                                }
                              }}
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: taxiMonterricoColors.green,
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.08)',
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                                },
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Menú de crear actividades */}
                    <Menu
                      anchorEl={createActivityMenuAnchor}
                      open={Boolean(createActivityMenuAnchor)}
                      onClose={() => setCreateActivityMenuAnchor(null)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 320,
                          maxWidth: 320,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                        },
                      }}
                    >
                      <MenuItem 
                        onClick={() => handleCreateActivity('note')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Edit sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Crear nota
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('task')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Assignment sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Crear tarea
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('email')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Email sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Crear correo
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('call')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Phone sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Hacer llamada telefónica
                        </Typography>
                        <KeyboardArrowRight sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('meeting')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Event sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Programar reunión
                        </Typography>
                      </MenuItem>
                    </Menu>

                    {/* Menú de rango de tiempo */}
                    <Menu
                      anchorEl={timeRangeMenuAnchor}
                      open={Boolean(timeRangeMenuAnchor)}
                      onClose={() => setTimeRangeMenuAnchor(null)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 280,
                          maxWidth: 280,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                        },
                      }}
                    >
                      {['Todo', 'Hoy', 'Ayer', 'Esta semana', 'Semana pasada', 'Últimos 7 días'].map((option) => {
                        const isSelected = selectedTimeRange === option || (option === 'Todo' && selectedTimeRange === 'Todo hasta ahora');
                        return (
                          <MenuItem
                            key={option}
                            onClick={() => {
                              setSelectedTimeRange(option === 'Todo' ? 'Todo hasta ahora' : option);
                              setTimeRangeMenuAnchor(null);
                            }}
                            sx={{
                              py: 1.5,
                              px: 2,
                              color: theme.palette.text.primary,
                              backgroundColor: isSelected 
                                ? (theme.palette.mode === 'dark' 
                                  ? 'rgba(144, 202, 249, 0.16)' 
                                  : '#e3f2fd')
                                : 'transparent',
                              '&:hover': {
                                backgroundColor: isSelected
                                  ? (theme.palette.mode === 'dark' 
                                    ? 'rgba(144, 202, 249, 0.24)' 
                                    : '#bbdefb')
                                  : theme.palette.action.hover,
                              },
                            }}
                          >
                            <Typography variant="body2" sx={{ color: 'inherit' }}>
                              {option}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                    </Menu>

                    {/* Menú de tipo de actividad */}
                    <Menu
                      anchorEl={activityFilterMenuAnchor}
                      open={Boolean(activityFilterMenuAnchor)}
                      onClose={() => setActivityFilterMenuAnchor(null)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 280,
                          maxWidth: 280,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                        },
                      }}
                    >
                      <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <TextField
                          size="small"
                          placeholder="Buscar"
                          fullWidth
                          value={activityFilterSearch}
                          onChange={(e) => setActivityFilterSearch(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? theme.palette.background.default 
                                : '#f5f5f5',
                              '& fieldset': {
                                borderColor: theme.palette.divider,
                              },
                              '&:hover fieldset': {
                                borderColor: theme.palette.text.secondary,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: taxiMonterricoColors.green,
                              },
                            },
                          }}
                        />
                      </Box>
                      {(() => {
                        // Filtrar tipos según el término de búsqueda
                        const availableTypes = ['Nota', 'Correo', 'Llamada', 'Tarea', 'Reunión'];
                        const filteredTypes = activityFilterSearch
                          ? availableTypes.filter(type => 
                              type.toLowerCase().includes(activityFilterSearch.toLowerCase())
                            )
                          : availableTypes;

                        return filteredTypes.map((type) => {
                          const isSelected = selectedActivityTypes.includes(type);
                          return (
                            <MenuItem
                              key={type}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedActivityTypes(selectedActivityTypes.filter(t => t !== type));
                                } else {
                                  setSelectedActivityTypes([...selectedActivityTypes, type]);
                                }
                              }}
                              sx={{
                                py: 1.5,
                                px: 2,
                                backgroundColor: isSelected 
                                  ? (theme.palette.mode === 'dark' 
                                    ? 'rgba(46, 125, 50, 0.16)' 
                                    : 'rgba(46, 125, 50, 0.08)')
                                  : 'transparent',
                                '&:hover': {
                                  backgroundColor: isSelected
                                    ? (theme.palette.mode === 'dark' 
                                      ? 'rgba(46, 125, 50, 0.24)' 
                                      : 'rgba(46, 125, 50, 0.12)')
                                    : theme.palette.action.hover,
                                },
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                size="small"
                                sx={{
                                  color: taxiMonterricoColors.green,
                                  '&.Mui-checked': {
                                    color: taxiMonterricoColors.green,
                                  },
                                }}
                              />
                              <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                                {type}
                              </Typography>
                            </MenuItem>
                          );
                        });
                      })()}
                    </Menu>

                    {(() => {
                      // Filtrar actividades según el término de búsqueda
                      let filteredActivities = activitySearch
                        ? activities.filter((activity) => {
                            const searchTerm = activitySearch.toLowerCase();
                            const subject = (activity.subject || activity.title || '').toLowerCase();
                            const description = (activity.description || '').toLowerCase();
                            return subject.includes(searchTerm) || description.includes(searchTerm);
                          })
                        : activities;

                      // Filtrar por tipo de actividad
                      if (selectedActivityTypes.length > 0) {
                        const typeMap: { [key: string]: string[] } = {
                          'Nota': ['note'],
                          'Correo': ['email'],
                          'Llamada': ['call'],
                          'Tarea': ['task'],
                          'Reunión': ['meeting'],
                        };
                        filteredActivities = filteredActivities.filter((activity) => {
                          // Obtener el tipo de actividad
                          let activityType = activity.type?.toLowerCase() || '';
                          
                          // Si es una tarea (isTask), asegurarse de que el tipo sea 'task'
                          if (activity.isTask && !activityType) {
                            activityType = 'task';
                          }
                          
                          // Verificar si el tipo de actividad coincide con alguno de los seleccionados
                          return selectedActivityTypes.some(selectedType => {
                            const mappedTypes = typeMap[selectedType] || [];
                            return mappedTypes.includes(activityType);
                          });
                        });
                      }

                      // Filtrar por rango de tiempo
                      if (selectedTimeRange !== 'Todo hasta ahora') {
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        let startDate: Date;

                        switch (selectedTimeRange) {
                          case 'Hoy':
                            startDate = today;
                            break;
                          case 'Ayer':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - 1);
                            break;
                          case 'Esta semana':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - today.getDay());
                            break;
                          case 'Semana pasada':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - today.getDay() - 7);
                            break;
                          case 'Últimos 7 días':
                            startDate = new Date(today);
                            startDate.setDate(startDate.getDate() - 7);
                            break;
                          default:
                            startDate = new Date(0);
                        }

                        filteredActivities = filteredActivities.filter((activity) => {
                          const activityDate = new Date(activity.createdAt || activity.dueDate || 0);
                          return activityDate >= startDate;
                        });
                      }

                      if (filteredActivities.length === 0) {
                        return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                              {activitySearch ? 'No se encontraron actividades' : 'No hay actividades registradas'}
                        </Typography>
                      </Box>
                        );
                      }

                      return (
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2 
                      }}>
                          {filteredActivities.map((activity) => (
                          <Paper
                            key={activity.id}
                            onClick={() => setExpandedActivity(activity)}
                            sx={{
                              p: 2,
                              ...getActivityStatusColor(activity),
                              borderRadius: 1.5,
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                opacity: 0.9,
                                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                              },
                            }}
                          >
                            <Box
                                sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: taxiMonterricoColors.green,
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {getActivityTypeLabel(activity.type)}
                                </Typography>
                                {activity.User && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Checkbox
                                checked={completedActivities[activity.id] || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setCompletedActivities(prev => ({
                                    ...prev,
                                    [activity.id]: e.target.checked
                                  }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                size="small"
                                sx={{
                                  p: 0.5,
                                  '& .MuiSvgIcon-root': {
                                    fontSize: 20,
                                  },
                                }}
                              />
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mb: 0.5, 
                                  pr: 6,
                                  flex: 1,
                                  textDecoration: completedActivities[activity.id] ? 'line-through' : 'none',
                                  opacity: completedActivities[activity.id] ? 0.6 : 1,
                                }}
                              >
                                {activity.subject || activity.title}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                      );
                    })()}
                      </Box>
                    )}
                  </Box>
            </Card>
          )}

          {/* Cards de Contactos, Empresas, Negocios y Tickets - Solo en pestaña Información Avanzada */}
          {activeTab === 1 && (
            <>
              {/* Card de Contactos */}
              <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            mt: 2,
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Contactos
            </Typography>
            
            {/* Cuadro de búsqueda y botón agregar */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar contactos"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                sx={{
                  width: '250px',
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    fontSize: '0.875rem',
                    '&:hover': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                    '&.Mui-focused': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: 2,
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                size="small" 
                variant="outlined" 
                endIcon={<ExpandMore />}
                onClick={(e) => setAddContactMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Agregar
              </Button>
              </Box>

            {/* Menú para agregar contacto */}
            <Menu
              anchorEl={addContactMenuAnchor}
              open={Boolean(addContactMenuAnchor)}
              onClose={() => setAddContactMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0,0,0,0.5)' 
                    : '0 4px 20px rgba(0,0,0,0.15)',
                  bgcolor: theme.palette.background.paper,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  setAddContactMenuAnchor(null);
                  setContactDialogTab('existing');
                  // Preseleccionar los contactos que ya están asociados al deal
                  const existingContactIds = dealContacts.map((contact: any) => contact.id);
                  setSelectedExistingContacts(existingContactIds);
                  setAddContactDialogOpen(true);
                  fetchAllContacts();
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(46, 125, 50, 0.15)' 
                      : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Person sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                <Typography variant="body2">Agregar contacto existente</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAddContactMenuAnchor(null);
                  setContactDialogTab('create');
                  setAddContactDialogOpen(true);
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(46, 125, 50, 0.15)' 
                      : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Add sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                <Typography variant="body2">Crear nuevo contacto</Typography>
              </MenuItem>
            </Menu>
            
            {dealContacts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay contactos relacionados con este negocio
                </Typography>
              </Box>
            ) : (() => {
              // Filtrar y ordenar contactos
              let filteredContacts = dealContacts.filter((contact: any) => {
                if (!contactSearch.trim()) return true;
                const searchLower = contactSearch.toLowerCase();
                return (
                  contact.firstName?.toLowerCase().includes(searchLower) ||
                  contact.lastName?.toLowerCase().includes(searchLower) ||
                  contact.email?.toLowerCase().includes(searchLower) ||
                  contact.phone?.toLowerCase().includes(searchLower)
                );
              });

              // Ordenar contactos
              filteredContacts = [...filteredContacts].sort((a: any, b: any) => {
                let aValue: string = '';
                let bValue: string = '';

                if (contactSortField === 'firstName') {
                  aValue = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
                  bValue = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
                } else {
                  aValue = (a[contactSortField] || '').toLowerCase();
                  bValue = (b[contactSortField] || '').toLowerCase();
                }

                if (contactSortOrder === 'asc') {
                  return aValue.localeCompare(bValue);
                } else {
                  return bValue.localeCompare(aValue);
                }
              });

              if (filteredContacts.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron contactos
                    </Typography>
                  </Box>
                );
              }

              return (
                <TableContainer sx={{ width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={contactSortField === 'firstName'}
                            direction={contactSortField === 'firstName' ? contactSortOrder : 'asc'}
                            onClick={() => handleSortContacts('firstName')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: contactSortField === 'firstName' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            NOMBRE
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={contactSortField === 'email'}
                            direction={contactSortField === 'email' ? contactSortOrder : 'asc'}
                            onClick={() => handleSortContacts('email')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: contactSortField === 'email' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            CORREO
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={contactSortField === 'phone'}
                            direction={contactSortField === 'phone' ? contactSortOrder : 'asc'}
                            onClick={() => handleSortContacts('phone')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: contactSortField === 'phone' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            NÚMERO DE TELÉFONO
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ width: '80px' }}>
                          ACCIONES
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredContacts.map((contact: any) => (
                        <TableRow
                          key={contact.id}
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(46, 125, 50, 0.04)',
                            },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: taxiMonterricoColors.green,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {contact.firstName?.[0]}{contact.lastName?.[0]}
                              </Avatar>
                              <Typography
                                sx={{
                                  color: taxiMonterricoColors.green,
                                  fontWeight: 500,
                                }}
                              >
                                {contact.firstName} {contact.lastName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                sx={{
                                  color: taxiMonterricoColors.green,
                                }}
                              >
                                {contact.email || '--'}
                              </Typography>
                              {contact.email && (
                                <>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`mailto:${contact.email}`, '_blank');
                                    }}
                                    title="Enviar correo"
                                  >
                                    <OpenInNew fontSize="small" sx={{ color: taxiMonterricoColors.green }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyToClipboard(contact.email || '');
                                    }}
                                    title="Copiar correo"
                                  >
                                    <ContentCopy fontSize="small" sx={{ color: taxiMonterricoColors.green }} />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                              {contact.phone || '--'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveContactClick(contact.id, `${contact.firstName} ${contact.lastName}`);
                              }}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: theme.palette.error.light,
                                  color: theme.palette.error.dark,
                                },
                              }}
                              title="Eliminar contacto del negocio"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Card>

          {/* Card de Empresas */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            mt: 2,
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Empresas
            </Typography>
            
            {/* Cuadro de búsqueda y botón agregar */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar empresas"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                sx={{
                  width: '250px',
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    fontSize: '0.875rem',
                    '&:hover': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                    '&.Mui-focused': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: 2,
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                size="small"
                variant="outlined"
                endIcon={<ExpandMore />}
                onClick={(e) => setAddCompanyMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Agregar
              </Button>
        </Box>

            {/* Menú para agregar empresa */}
            <Menu
              anchorEl={addCompanyMenuAnchor}
              open={Boolean(addCompanyMenuAnchor)}
              onClose={() => setAddCompanyMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0,0,0,0.5)' 
                    : '0 4px 20px rgba(0,0,0,0.15)',
                  bgcolor: theme.palette.background.paper,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  setAddCompanyMenuAnchor(null);
                  setCompanyDialogTab('existing');
                  // Preseleccionar las empresas que ya están asociadas al deal
                  const existingCompanyIds = dealCompanies.map((company: any) => company.id);
                  setSelectedExistingCompanies(existingCompanyIds);
                  setAddCompanyDialogOpen(true);
                  fetchAllCompanies();
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(46, 125, 50, 0.15)' 
                      : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Business sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                <Typography variant="body2">Agregar empresa existente</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAddCompanyMenuAnchor(null);
                  setCompanyDialogTab('create');
                  setAddCompanyDialogOpen(true);
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(46, 125, 50, 0.15)' 
                      : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Add sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                <Typography variant="body2">Crear nueva empresa</Typography>
              </MenuItem>
            </Menu>
            
            {dealCompanies.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                  No hay empresas relacionadas con este negocio
                </Typography>
              </Box>
            ) : (() => {
              // Filtrar y ordenar empresas
              let filteredCompanies = dealCompanies.filter((company: any) => {
                if (!companySearch.trim()) return true;
                const searchLower = companySearch.toLowerCase();
                return (
                  company.name?.toLowerCase().includes(searchLower) ||
                  company.domain?.toLowerCase().includes(searchLower) ||
                  company.phone?.toLowerCase().includes(searchLower) ||
                  company.website?.toLowerCase().includes(searchLower)
                );
              });

              // Ordenar empresas
              filteredCompanies = [...filteredCompanies].sort((a: any, b: any) => {
                let aValue: string = '';
                let bValue: string = '';

                if (companySortField === 'name') {
                  aValue = (a.name || '').toLowerCase();
                  bValue = (b.name || '').toLowerCase();
                } else {
                  aValue = (a[companySortField] || '').toLowerCase();
                  bValue = (b[companySortField] || '').toLowerCase();
                }

                if (companySortOrder === 'asc') {
                  return aValue.localeCompare(bValue);
                } else {
                  return bValue.localeCompare(aValue);
                }
              });

              if (filteredCompanies.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron empresas
                    </Typography>
                  </Box>
                );
              }

              return (
                <TableContainer sx={{ width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={companySortField === 'name'}
                            direction={companySortField === 'name' ? companySortOrder : 'asc'}
                            onClick={() => handleSortCompanies('name')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: companySortField === 'name' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            NOMBRE
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={companySortField === 'domain'}
                            direction={companySortField === 'domain' ? companySortOrder : 'asc'}
                            onClick={() => handleSortCompanies('domain')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: companySortField === 'domain' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            DOMINIO
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={companySortField === 'phone'}
                            direction={companySortField === 'phone' ? companySortOrder : 'asc'}
                            onClick={() => handleSortCompanies('phone')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: companySortField === 'phone' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            NÚMERO DE TELÉFONO
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCompanies.map((company: any) => (
                        <TableRow
                          key={company.id}
                          onClick={() => navigate(`/companies/${company.id}`)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: theme.palette.action.hover } }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: taxiMonterricoColors.green,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {company.name?.[0]}{company.name?.[1] || ''}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: taxiMonterricoColors.green }}>
                                {company.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: taxiMonterricoColors.green }}>
                                {company.domain || company.website || '--'}
                              </Typography>
                              {company.domain && (
                                <>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`http://${company.domain}`, '_blank');
                                    }}
                                    title="Abrir dominio"
                                  >
                                    <OpenInNew fontSize="small" sx={{ color: taxiMonterricoColors.green }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyToClipboard(company.domain || '');
                                    }}
                                    title="Copiar dominio"
                                  >
                                    <ContentCopy fontSize="small" sx={{ color: taxiMonterricoColors.green }} />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                              {company.phone || '--'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCompanyClick(company.id, company.name);
                              }}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: theme.palette.error.light,
                                  color: theme.palette.error.dark,
                                },
                              }}
                              title="Eliminar empresa del negocio"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Card>

          {/* Card de Negocios */}
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper,
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            mt: 2,
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Negocios
            </Typography>
            
            {/* Cuadro de búsqueda y botón agregar */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar negocios"
                value={dealSearch}
                onChange={(e) => setDealSearch(e.target.value)}
                sx={{
                  width: '250px',
                  transition: 'all 0.3s ease',
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    fontSize: '0.875rem',
                    '&:hover': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                    '&.Mui-focused': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: 2,
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                size="small"
                variant="outlined"
                endIcon={<ExpandMore />}
                sx={{
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Agregar
              </Button>
            </Box>

            {dealDeals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay negocios relacionados con este negocio
                </Typography>
              </Box>
            ) : (() => {
              // Filtrar y ordenar negocios
              let filteredDeals = dealDeals.filter((dealItem: any) => {
                if (!dealSearch.trim()) return true;
                const searchLower = dealSearch.toLowerCase();
                return (
                  dealItem.name?.toLowerCase().includes(searchLower) ||
                  dealItem.stage?.toLowerCase().includes(searchLower) ||
                  dealItem.amount?.toString().includes(searchLower)
                );
              });

              // Ordenar negocios
              filteredDeals = [...filteredDeals].sort((a: any, b: any) => {
                let aValue: any = '';
                let bValue: any = '';

                if (dealSortField === 'name') {
                  aValue = (a.name || '').toLowerCase();
                  bValue = (b.name || '').toLowerCase();
                } else if (dealSortField === 'amount') {
                  aValue = a.amount || 0;
                  bValue = b.amount || 0;
                } else if (dealSortField === 'closeDate') {
                  aValue = a.closeDate ? new Date(a.closeDate).getTime() : 0;
                  bValue = b.closeDate ? new Date(b.closeDate).getTime() : 0;
                } else {
                  aValue = (a[dealSortField] || '').toLowerCase();
                  bValue = (b[dealSortField] || '').toLowerCase();
                }

                if (dealSortOrder === 'asc') {
                  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                } else {
                  return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                }
              });

              if (filteredDeals.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron negocios
                    </Typography>
                  </Box>
                );
              }

              return (
                <TableContainer sx={{ width: '100%' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={dealSortField === 'name'}
                            direction={dealSortField === 'name' ? dealSortOrder : 'asc'}
                            onClick={() => handleSortDeals('name')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: dealSortField === 'name' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            NOMBRE DEL NEGOCIO
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={dealSortField === 'amount'}
                            direction={dealSortField === 'amount' ? dealSortOrder : 'asc'}
                            onClick={() => handleSortDeals('amount')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: dealSortField === 'amount' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            VALOR
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={dealSortField === 'closeDate'}
                            direction={dealSortField === 'closeDate' ? dealSortOrder : 'asc'}
                            onClick={() => handleSortDeals('closeDate')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: dealSortField === 'closeDate' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            FECHA DE CIERRE (GMT-5)
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={dealSortField === 'stage'}
                            direction={dealSortField === 'stage' ? dealSortOrder : 'asc'}
                            onClick={() => handleSortDeals('stage')}
                            sx={{
                              '& .MuiTableSortLabel-icon': {
                                color: dealSortField === 'stage' ? taxiMonterricoColors.green : 'inherit',
                              },
                            }}
                          >
                            ETAPA DEL NEGOCIO
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDeals.map((dealItem: any) => (
                        <TableRow
                          key={dealItem.id}
                          onClick={() => navigate(`/deals/${dealItem.id}`)}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: theme.palette.action.hover } }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: taxiMonterricoColors.green,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {dealItem.name ? (dealItem.name.split(' ').length >= 2 
                                  ? `${dealItem.name.split(' ')[0][0]}${dealItem.name.split(' ')[1][0]}`.toUpperCase()
                                  : dealItem.name.substring(0, 2).toUpperCase()) : '--'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
                                {dealItem.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                              {dealItem.amount ? `${dealItem.amount.toLocaleString()} US$` : '--'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                              {dealItem.closeDate 
                                ? new Date(dealItem.closeDate).toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'America/Lima'
                                  }) + ' GMT-5'
                                : '--'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                              {dealItem.stage ? getStageLabel(dealItem.stage) : '--'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Card>
            </>
          )}

          {/* Vista de Actividades */}
            {activeTab === 2 && (
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: theme.palette.background.paper,
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Barra de búsqueda y filtros */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="Buscar actividad"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    sx={{
                      flex: 1,
                      minWidth: '250px',
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '0.875rem',
                        '&:hover': {
                          '& fieldset': {
                            borderColor: taxiMonterricoColors.green,
                          },
                        },
                        '&.Mui-focused': {
                          '& fieldset': {
                            borderColor: taxiMonterricoColors.green,
                            borderWidth: 2,
                          },
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ExpandMore />}
                    onClick={(e) => setActivityFilterMenuAnchor(e.currentTarget)}
                    sx={{
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: taxiMonterricoColors.green,
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      },
                    }}
                  >
                    Filtrar actividad ({activities.length}/{activities.length})
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ExpandMore />}
                    onClick={(e) => setAllUsersMenuAnchor(e.currentTarget)}
                    sx={{
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: taxiMonterricoColors.green,
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      },
                    }}
                  >
                    {allUsersFilter}
                  </Button>
                </Box>

                {/* Menú de filtro de actividad */}
                <Menu
                  anchorEl={activityFilterMenuAnchor}
                  open={Boolean(activityFilterMenuAnchor)}
                  onClose={() => setActivityFilterMenuAnchor(null)}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 280,
                      borderRadius: 2,
                      boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <TextField
                      size="small"
                      placeholder="Buscar"
                      fullWidth
                      value={activityFilterSearch}
                      onChange={(e) => setActivityFilterSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  {['Nota', 'Correo', 'Llamada', 'Tarea', 'Reunión'].map((type) => {
                    const isSelected = selectedActivityTypes.includes(type);
                    return (
                      <MenuItem
                        key={type}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedActivityTypes(selectedActivityTypes.filter(t => t !== type));
                          } else {
                            setSelectedActivityTypes([...selectedActivityTypes, type]);
                          }
                        }}
                        sx={{
                          py: 1.5,
                          backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                        }}
                      >
                        <Checkbox checked={isSelected} size="small" sx={{ color: taxiMonterricoColors.green, '&.Mui-checked': { color: taxiMonterricoColors.green } }} />
                        <Typography variant="body2">{type}</Typography>
                      </MenuItem>
                    );
                  })}
                </Menu>

                {/* Menú de usuarios */}
                <Menu
                  anchorEl={allUsersMenuAnchor}
                  open={Boolean(allUsersMenuAnchor)}
                  onClose={() => setAllUsersMenuAnchor(null)}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                    },
                  }}
                >
                  <MenuItem onClick={() => { setAllUsersFilter('Todos los usuarios'); setAllUsersMenuAnchor(null); }}>
                    Todos los usuarios
                  </MenuItem>
                  <MenuItem onClick={() => { setAllUsersFilter('Yo'); setAllUsersMenuAnchor(null); }}>
                    Yo
                  </MenuItem>
                </Menu>

                {/* Tabs secundarios de tipo de actividad */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  mb: 3, 
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  overflowX: 'auto',
                }}>
                  {[
                    { value: 'all', label: 'Actividad' },
                    { value: 'note', label: 'Notas' },
                    { value: 'email', label: 'Correos' },
                    { value: 'call', label: 'Llamadas' },
                    { value: 'task', label: 'Tareas' },
                    { value: 'meeting', label: 'Reuniones' },
                  ].map((tab) => (
                    <Button
                      key={tab.value}
                      size="small"
                      onClick={() => setSelectedActivityType(tab.value)}
                      sx={{
                        color: selectedActivityType === tab.value ? taxiMonterricoColors.green : theme.palette.text.secondary,
                        textTransform: 'none',
                        fontWeight: selectedActivityType === tab.value ? 600 : 500,
                        borderBottom: selectedActivityType === tab.value ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2.5,
                        py: 1.5,
                        '&:hover': {
                          color: taxiMonterricoColors.green,
                          bgcolor: 'transparent',
                        },
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </Box>

                {/* Contenido de actividades */}
                {(() => {
                  // Filtrar por búsqueda
                  let filteredActivities = activitySearch
                    ? activities.filter((activity) => {
                        const searchTerm = activitySearch.toLowerCase();
                        const subject = (activity.subject || activity.title || '').toLowerCase();
                        const description = (activity.description || '').toLowerCase();
                        return subject.includes(searchTerm) || description.includes(searchTerm);
                      })
                    : activities;

                  // Filtrar por tipo de actividad (tab seleccionado)
                  if (selectedActivityType !== 'all') {
                    const typeMap: { [key: string]: string } = {
                      'note': 'note',
                      'email': 'email',
                      'call': 'call',
                      'task': 'task',
                      'meeting': 'meeting',
                    };
                    filteredActivities = filteredActivities.filter((activity) => {
                      let activityType = activity.type?.toLowerCase() || '';
                      if (activity.isTask && !activityType) {
                        activityType = 'task';
                      }
                      return activityType === typeMap[selectedActivityType];
                    });
                  }

                  // Filtrar por tipos seleccionados en el menú de filtro
                  if (selectedActivityTypes.length > 0) {
                    const typeMap: { [key: string]: string[] } = {
                      'Nota': ['note'],
                      'Correo': ['email'],
                      'Llamada': ['call'],
                      'Tarea': ['task'],
                      'Reunión': ['meeting'],
                    };
                    filteredActivities = filteredActivities.filter((activity) => {
                      let activityType = activity.type?.toLowerCase() || '';
                      if (activity.isTask && !activityType) {
                        activityType = 'task';
                      }
                      return selectedActivityTypes.some(selectedType => {
                        const mappedTypes = typeMap[selectedType] || [];
                        return mappedTypes.includes(activityType);
                      });
                    });
                  }

                  // Filtrar por usuario
                  if (allUsersFilter === 'Yo' && user) {
                    filteredActivities = filteredActivities.filter((activity) => {
                      return activity.User?.id === user.id;
                    });
                  }

                  if (filteredActivities.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          <Assignment sx={{ fontSize: 48, color: theme.palette.text.secondary }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                      No hay actividades registradas
                    </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No hay actividades registradas para este negocio. Crea una nueva actividad para comenzar.
                        </Typography>
                  </Box>
                    );
                  }

                  return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {filteredActivities.map((activity) => (
                      <Paper
                        key={activity.id}
                          onClick={() => setExpandedActivity(activity)}
                        sx={{
                          p: 2,
                            ...getActivityStatusColor(activity),
                          borderRadius: 1.5,
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              opacity: 0.9,
                              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: taxiMonterricoColors.green,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {getActivityTypeLabel(activity.type)}
                            </Typography>
                            {activity.User && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
                          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              checked={completedActivities[activity.id] || false}
                              onChange={(e) => {
                                e.stopPropagation();
                                setCompletedActivities(prev => ({
                                  ...prev,
                                  [activity.id]: e.target.checked
                                }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                              sx={{
                                p: 0.5,
                                '& .MuiSvgIcon-root': {
                                  fontSize: 20,
                                },
                              }}
                            />
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600, 
                                mb: 0.5, 
                                pr: 6,
                                flex: 1,
                                textDecoration: completedActivities[activity.id] ? 'line-through' : 'none',
                                opacity: completedActivities[activity.id] ? 0.6 : 1,
                              }}
                            >
                              {activity.subject || activity.title}
                            </Typography>
                        </Box>
                        {activity.description && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.875rem',
                              }}
                            >
                              {activity.description}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                  );
                })()}
              </Card>
            )}
        </Box>

        {/* Columna Copiloto IA - Solo en desktop cuando está abierto */}
        {isDesktop && copilotOpen && (
        <Box sx={{
          width: 380,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          p: 2,
          pb: 3,
          boxSizing: 'border-box',
          overflowY: 'auto',
          height: 'fit-content',
          maxHeight: 'calc(100vh - 80px)',
          alignSelf: 'flex-start',
          mb: 2,
        }}>
        {/* Header del Copilot */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: taxiMonterricoColors.green, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: theme.palette.text.primary }}>
              Copiloto IA
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setCopilotOpen(false)}
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

        {/* Card 1: Muestra preocupantes */}
        <Card 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 152, 0, 0.1)' 
              : 'rgba(255, 152, 0, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)'}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 152, 0, 0.2)' 
                  : 'rgba(255, 152, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ReportProblem sx={{ fontSize: 20, color: '#FF9800' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Muestra preocupantes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {dealContacts.length === 0 && dealCompanies.length === 0
                  ? 'Este negocio no tiene contactos ni empresas asociadas. Considera vincularlos para un mejor seguimiento.'
                  : 'Sin datos suficientes para generar alertas en este momento.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: '#FF9800',
              color: '#FF9800',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#FF9800',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)',
              },
            }}
            onClick={() => {
              setActiveTab(1);
              setCopilotOpen(false);
            }}
          >
            Ver información
          </Button>
        </Card>

        {/* Card 2: Próximas pérdidas */}
        <Card 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(244, 67, 54, 0.1)' 
              : 'rgba(244, 67, 54, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)'}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(244, 67, 54, 0.2)' 
                  : 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Receipt sx={{ fontSize: 20, color: '#F44336' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Próximas pérdidas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {deal.closeDate && new Date(deal.closeDate) < new Date()
                  ? 'La fecha de cierre estimada ya pasó. Revisa el estado del negocio.'
                  : deal.closeDate
                  ? `Fecha de cierre estimada: ${new Date(deal.closeDate).toLocaleDateString('es-ES')}. Asegúrate de seguir el proceso.`
                  : 'Sin fecha de cierre definida. Establece una fecha para mejorar el seguimiento.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: '#F44336',
              color: '#F44336',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#F44336',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.08)',
              },
            }}
            onClick={() => {
              setActiveTab(1);
              setCopilotOpen(false);
            }}
          >
            Ver detalles
          </Button>
        </Card>

        {/* Card 3: Manejo seguimiento */}
        <Card 
          sx={{ 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(46, 125, 50, 0.1)' 
              : 'rgba(46, 125, 50, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.15)'}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(46, 125, 50, 0.2)' 
                  : 'rgba(46, 125, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TaskAlt sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Manejo seguimiento
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {activities.length > 0
                  ? `Última actividad hace ${Math.floor((Date.now() - new Date(activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))} días. Es momento de hacer seguimiento.`
                  : 'Sin datos suficientes. Crea una tarea para iniciar el seguimiento.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: taxiMonterricoColors.green,
              color: taxiMonterricoColors.green,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: taxiMonterricoColors.green,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)',
              },
            }}
            onClick={() => {
              handleOpenTask();
              setCopilotOpen(false);
            }}
          >
            Crear tarea
          </Button>
        </Card>
        </Box>
        )}
      </Box>

      {/* Drawer Copiloto IA - Solo para móviles */}
      <Drawer
        anchor="right"
        open={copilotOpen && !isDesktop}
        onClose={() => setCopilotOpen(false)}
        variant="temporary"
        PaperProps={{
          sx: {
            width: '100%',
            borderLeft: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            p: 2,
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Header del Drawer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: taxiMonterricoColors.green, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: theme.palette.text.primary }}>
              Copiloto IA
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setCopilotOpen(false)}
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

        {/* Card 1: Muestra preocupantes */}
        <Card 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 152, 0, 0.1)' 
              : 'rgba(255, 152, 0, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)'}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 152, 0, 0.2)' 
                  : 'rgba(255, 152, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ReportProblem sx={{ fontSize: 20, color: '#FF9800' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Muestra preocupantes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {dealContacts.length === 0 && dealCompanies.length === 0
                  ? 'Este negocio no tiene contactos ni empresas asociadas. Considera vincularlos para un mejor seguimiento.'
                  : 'Sin datos suficientes para generar alertas en este momento.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: '#FF9800',
              color: '#FF9800',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#FF9800',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)',
              },
            }}
            onClick={() => {
              setActiveTab(1);
              setCopilotOpen(false);
            }}
          >
            Ver información
          </Button>
        </Card>

        {/* Card 2: Próximas pérdidas */}
        <Card 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(244, 67, 54, 0.1)' 
              : 'rgba(244, 67, 54, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)'}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(244, 67, 54, 0.2)' 
                  : 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Receipt sx={{ fontSize: 20, color: '#F44336' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Próximas pérdidas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {deal.closeDate && new Date(deal.closeDate) < new Date()
                  ? 'La fecha de cierre estimada ya pasó. Revisa el estado del negocio.'
                  : deal.closeDate
                  ? `Fecha de cierre estimada: ${new Date(deal.closeDate).toLocaleDateString('es-ES')}. Asegúrate de seguir el proceso.`
                  : 'Sin fecha de cierre definida. Establece una fecha para mejorar el seguimiento.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: '#F44336',
              color: '#F44336',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#F44336',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.08)',
              },
            }}
            onClick={() => {
              setActiveTab(1);
              setCopilotOpen(false);
            }}
          >
            Ver detalles
          </Button>
        </Card>

        {/* Card 3: Manejo seguimiento */}
        <Card 
          sx={{ 
            p: 2, 
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(46, 125, 50, 0.1)' 
              : 'rgba(46, 125, 50, 0.05)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.15)'}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(46, 125, 50, 0.2)' 
                  : 'rgba(46, 125, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TaskAlt sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Manejo seguimiento
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {activities.length > 0
                  ? `Última actividad hace ${Math.floor((Date.now() - new Date(activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))} días. Es momento de hacer seguimiento.`
                  : 'Sin datos suficientes. Crea una tarea para iniciar el seguimiento.'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: taxiMonterricoColors.green,
              color: taxiMonterricoColors.green,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                borderColor: taxiMonterricoColors.green,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)',
              },
            }}
            onClick={() => {
              handleOpenTask();
              setCopilotOpen(false);
            }}
          >
            Crear tarea
          </Button>
        </Card>
      </Drawer>

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

      {/* Dialog para crear tarea */}
      <Dialog 
        open={taskOpen} 
        onClose={() => setTaskOpen(false)} 
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            width: '560px',
            maxWidth: '90vw',
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: 'transparent',
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 48,
            px: 2,
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            Tarea
          </Typography>
          <IconButton 
            sx={{ 
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease',
              '&:hover': { 
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: 'rotate(90deg)',
              }
            }} 
            size="medium" 
            onClick={() => setTaskOpen(false)}
          >
            <Close />
          </IconButton>
    </Box>

        <DialogContent sx={{ px: 2, pb: 1, pt: 0.5 }}>
          <TextField
            label="Título"
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            fullWidth
            InputLabelProps={{
              shrink: !!taskData.title,
            }}
            sx={{ 
              mb: 1.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 0.5,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '0.75rem',
                '& fieldset': {
                  borderWidth: 0,
                  border: 'none',
                  top: 0,
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: '2px !important',
                  borderColor: `${taxiMonterricoColors.orange} !important`,
                  borderStyle: 'solid !important',
                  top: 0,
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '0px !important',
                '& legend': {
                  width: 0,
                  display: 'none',
                },
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px !important',
                borderColor: `${taxiMonterricoColors.green} !important`,
                borderStyle: 'solid !important',
                '& legend': {
                  width: 0,
                  display: 'none',
                },
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 0,
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                fontSize: '0.75rem',
                '&.Mui-focused': {
                  color: taxiMonterricoColors.orange,
                  transform: 'translateY(-50%)',
                  backgroundColor: 'transparent',
                },
                '&.MuiInputLabel-shrink': {
                  display: 'none',
                },
              },
              '& .MuiInputBase-input': {
                position: 'relative',
                zIndex: 1,
                fontSize: '0.75rem',
                py: 1,
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.75, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Prioridad
              </Typography>
              <TextField
                select
                value={taskData.priority}
                onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                fullWidth
                SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      mt: 1,
                    },
                  },
                },
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '0.75rem',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.75rem',
                  py: 1,
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  '&.Mui-focused': {
                    color: taxiMonterricoColors.orange,
                  },
                },
              }}
            >
              <MenuItem value="low" sx={{ fontSize: '0.75rem', py: 0.75 }}>Baja</MenuItem>
              <MenuItem value="medium" sx={{ fontSize: '0.75rem', py: 0.75 }}>Media</MenuItem>
              <MenuItem value="high" sx={{ fontSize: '0.75rem', py: 0.75 }}>Alta</MenuItem>
              <MenuItem value="urgent" sx={{ fontSize: '0.75rem', py: 0.75 }}>Urgente</MenuItem>
            </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.75, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              >
                Fecha límite
              </Typography>
              <TextField
                value={formatDateDisplay(taskData.dueDate)}
                onClick={handleOpenDatePicker}
                fullWidth
                InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={handleOpenDatePicker}
                    sx={{ 
                      color: theme.palette.text.secondary,
                      mr: 0.5,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: taxiMonterricoColors.orange,
                      }
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 18 }} />
                  </IconButton>
                ),
              }}
              sx={{ 
                cursor: 'pointer',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '0.75rem',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.orange,
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.75rem',
                  py: 1,
                  cursor: 'pointer',
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  '&.Mui-focused': {
                    color: taxiMonterricoColors.orange,
                  },
                },
              }}
            />
            </Box>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ position: 'relative' }}>
            <Box
              ref={descriptionEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                const html = (e.target as HTMLElement).innerHTML;
                if (html !== taskData.description) {
                  setTaskData({ ...taskData, description: html });
                }
              }}
              sx={{
                minHeight: '150px',
                maxHeight: '250px',
                overflowY: 'auto',
                pt: 0,
                pb: 1.5,
                px: 1,
                borderRadius: 0.5,
                border: 'none',
                outline: 'none',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: theme.palette.text.primary,
                '&:empty:before': {
                  content: '"Descripción"',
                  color: theme.palette.text.disabled,
                },
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0.5,
                left: 4,
                right: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0.5,
                backgroundColor: 'transparent',
                borderRadius: 1,
                p: 0.5,
                border: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.bold ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('bold');
                    updateActiveFormats();
                  }}
                  title="Negrita"
                >
                  <FormatBold sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.italic ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('italic');
                    updateActiveFormats();
                  }}
                  title="Cursiva"
                >
                  <FormatItalic sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.underline ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('underline');
                    updateActiveFormats();
                  }}
                  title="Subrayado"
                >
                  <FormatUnderlined sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.strikeThrough ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                    }
                  }}
                  onClick={() => {
                    document.execCommand('strikeThrough');
                    updateActiveFormats();
                  }}
                  title="Tachado"
                >
                  <FormatStrikethrough sx={{ fontSize: 16 }} />
                </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={(e) => setMoreMenuAnchorEl(e.currentTarget)}
                title="Más opciones"
              >
                <MoreVert sx={{ fontSize: 16 }} />
              </IconButton>
              <Menu
                anchorEl={moreMenuAnchorEl}
                open={Boolean(moreMenuAnchorEl)}
                onClose={() => setMoreMenuAnchorEl(null)}
              >
                <MenuItem 
                  onClick={() => { document.execCommand('justifyLeft'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Alinear izquierda"
                >
                  <FormatAlignLeft sx={{ fontSize: 16 }} />
                </MenuItem>
                <MenuItem 
                  onClick={() => { document.execCommand('justifyCenter'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Alinear centro"
                >
                  <FormatAlignCenter sx={{ fontSize: 16 }} />
                </MenuItem>
                <MenuItem 
                  onClick={() => { document.execCommand('justifyRight'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Alinear derecha"
                >
                  <FormatAlignRight sx={{ fontSize: 16 }} />
                </MenuItem>
                <MenuItem 
                  onClick={() => { document.execCommand('justifyFull'); setMoreMenuAnchorEl(null); }}
                  sx={{ py: 0.75, px: 1, minWidth: 'auto', justifyContent: 'center' }}
                  title="Justificar"
                >
                  <FormatAlignJustify sx={{ fontSize: 16 }} />
                </MenuItem>
              </Menu>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25, 
                  minWidth: 28, 
                  height: 28,
                  backgroundColor: activeFormats.unorderedList ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                  }
                }}
                onClick={() => {
                  document.execCommand('insertUnorderedList');
                  updateActiveFormats();
                }}
                title="Lista con viñetas"
              >
                <FormatListBulleted sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ 
                  p: 0.25, 
                  minWidth: 28, 
                  height: 28,
                  backgroundColor: activeFormats.orderedList ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                  }
                }}
                onClick={() => {
                  document.execCommand('insertOrderedList');
                  updateActiveFormats();
                }}
                title="Lista numerada"
              >
                <FormatListNumbered sx={{ fontSize: 16 }} />
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '20px' }} />
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => {
                  const url = prompt('URL:');
                  if (url) {
                    document.execCommand('createLink', false, url);
                  }
                }}
                title="Insertar enlace"
              >
                <LinkIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => imageInputRef.current?.click()}
                title="Insertar imagen"
              >
                <Image sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => {
                  const code = prompt('Ingresa el código:');
                  if (code && descriptionEditorRef.current) {
                    const selection = window.getSelection();
                    let range: Range | null = null;
                    
                    if (selection && selection.rangeCount > 0) {
                      range = selection.getRangeAt(0);
                    } else {
                      range = document.createRange();
                      range.selectNodeContents(descriptionEditorRef.current);
                      range.collapse(false);
                    }
                    
                    if (range) {
                      const pre = document.createElement('pre');
                      pre.style.backgroundColor = theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5';
                      pre.style.color = theme.palette.text.primary;
                      pre.style.padding = '8px';
                      pre.style.borderRadius = '4px';
                      pre.style.fontFamily = 'monospace';
                      pre.style.fontSize = '0.75rem';
                      pre.textContent = code;
                      
                      range.deleteContents();
                      range.insertNode(pre);
                      range.setStartAfter(pre);
                      range.collapse(true);
                      if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }}
                title="Insertar código"
              >
                <Code sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => {
                  const rows = prompt('Número de filas:', '3');
                  const cols = prompt('Número de columnas:', '3');
                  if (rows && cols && descriptionEditorRef.current) {
                    const table = document.createElement('table');
                    table.style.borderCollapse = 'collapse';
                    table.style.width = '100%';
                    table.style.border = '1px solid #ccc';
                    table.style.margin = '8px 0';
                    
                    for (let i = 0; i < parseInt(rows); i++) {
                      const tr = document.createElement('tr');
                      for (let j = 0; j < parseInt(cols); j++) {
                        const td = document.createElement('td');
                        td.style.border = '1px solid #ccc';
                        td.style.padding = '8px';
                        td.innerHTML = '&nbsp;';
                        tr.appendChild(td);
                      }
                      table.appendChild(tr);
                    }
                    
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      range.deleteContents();
                      range.insertNode(table);
                      range.setStartAfter(table);
                      range.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }}
                title="Insertar tabla"
              >
                <TableChart sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{ p: 0.25, minWidth: 28, height: 28 }}
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo"
              >
                <AttachFile sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                onClick={() => {
                  setAssociateOpen(true);
                  setAssociateSearch('');
                  // Inicializar selecciones con los valores actuales del deal
                  setSelectedAssociations({
                    companies: deal?.Company ? [deal.Company.id] : [],
                    contacts: deal?.Contact ? [deal.Contact.id] : [],
                    deals: [],
                  });
                  fetchAssociations();
                }}
                size="small"
                sx={{
                  p: 0.25,
                  minWidth: 28,
                  height: 28,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  }
                }}
                title="Asociado"
              >
                <PersonAdd sx={{ fontSize: 16 }} />
              </IconButton>
              </Box>
            </Box>
          </Box>
          {/* Input oculto para seleccionar archivos de imagen */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !descriptionEditorRef.current) return;

              if (!file.type.startsWith('image/')) {
                alert('Por favor, selecciona un archivo de imagen válido.');
                return;
              }

              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  descriptionEditorRef.current?.focus();
                  
                  const selection = window.getSelection();
                  let range: Range | null = null;
                  
                  if (selection && selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                  } else if (descriptionEditorRef.current) {
                    range = document.createRange();
                    range.selectNodeContents(descriptionEditorRef.current);
                    range.collapse(false);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }

                  if (range) {
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.alt = file.name;
                    
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    if (descriptionEditorRef.current) {
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }
              };
              
              reader.onerror = () => {
                alert('Error al leer el archivo de imagen.');
              };
              
              reader.readAsDataURL(file);
              
              if (imageInputRef.current) {
                imageInputRef.current.value = '';
              }
            }}
          />
          {/* Input oculto para adjuntar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !descriptionEditorRef.current) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  descriptionEditorRef.current?.focus();
                  
                  const selection = window.getSelection();
                  let range: Range | null = null;
                  
                  if (selection && selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                  } else if (descriptionEditorRef.current) {
                    range = document.createRange();
                    range.selectNodeContents(descriptionEditorRef.current);
                    range.collapse(false);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }

                  if (range) {
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = file.name;
                    link.textContent = `📎 ${file.name}`;
                    link.style.display = 'inline-block';
                    link.style.margin = '4px';
                    link.style.padding = '4px 8px';
                    link.style.backgroundColor = theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5';
                    link.style.borderRadius = '4px';
                    link.style.textDecoration = 'none';
                    link.style.color = theme.palette.text.primary;
                    
                    range.insertNode(link);
                    range.setStartAfter(link);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    if (descriptionEditorRef.current) {
                      setTaskData({ ...taskData, description: descriptionEditorRef.current.innerHTML });
                    }
                  }
                }
              };
              
              reader.onerror = () => {
                alert('Error al leer el archivo.');
              };
              
              reader.readAsDataURL(file);
              
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
        </DialogContent>
        <Box sx={{ px: 2 }}>
          <Divider sx={{ mt: 0.25, mb: 1.5 }} />
        </Box>
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 0.75 }}>
          <Button 
            onClick={() => setTaskOpen(false)}
            size="small"
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained" 
            size="small"
            disabled={saving || !taskData.title.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              bgcolor: taskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
              color: 'white',
              '&:hover': {
                bgcolor: taskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
                opacity: 0.9,
              },
              '&:disabled': {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Popover - Se despliega debajo del campo */}
      <Popover
        open={Boolean(datePickerAnchorEl)}
        anchorEl={datePickerAnchorEl}
        onClose={() => setDatePickerAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            mt: 0.5,
            maxWidth: 280,
          },
        }}
      >
        <Box sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
          {/* Header con mes y año - Mejorado */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 3,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              fontSize: '0.95rem',
              color: theme.palette.text.primary,
              letterSpacing: '-0.01em',
            }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Días de la semana - Mejorado */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5, 
            mb: 1.5,
          }}>
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="caption"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  py: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendario - Diseño Mejorado */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5,
            mb: 1.5,
          }}>
            {getDaysInMonth(currentMonth).map((item, index) => {
              // Calcular año y mes correctos
              let year = currentMonth.getFullYear();
              let month = currentMonth.getMonth();
              
              if (!item.isCurrentMonth) {
                if (index < 7) {
                  // Mes anterior
                  month = month - 1;
                  if (month < 0) {
                    month = 11;
                    year = year - 1;
                  }
                } else {
                  // Mes siguiente
                  month = month + 1;
                  if (month > 11) {
                    month = 0;
                    year = year + 1;
                  }
                }
              }
              
              const date = new Date(year, month, item.day);

              const isSelected = selectedDate && 
                item.isCurrentMonth &&
                date.toDateString() === selectedDate.toDateString();
              const isToday = item.isCurrentMonth &&
                date.toDateString() === new Date().toDateString();

              return (
                <Box
                  key={`${item.isCurrentMonth ? 'current' : 'other'}-${item.day}-${index}`}
                  onClick={() => {
                    if (item.isCurrentMonth) {
                      // Pasar directamente año, mes y día para evitar problemas de zona horaria
                      handleDateSelect(year, month + 1, item.day);
                    }
                  }}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    cursor: item.isCurrentMonth ? 'pointer' : 'default',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: isSelected
                      ? taxiMonterricoColors.green
                      : isToday
                      ? `${taxiMonterricoColors.green}20`
                      : 'transparent',
                    color: isSelected
                      ? 'white'
                      : isToday
                      ? taxiMonterricoColors.green
                      : item.isCurrentMonth
                      ? theme.palette.text.primary
                      : theme.palette.text.disabled,
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    fontSize: '0.75rem',
                    position: 'relative',
                    minHeight: '28px',
                    minWidth: '28px',
                    '&:hover': {
                      bgcolor: item.isCurrentMonth
                        ? (isSelected
                            ? taxiMonterricoColors.green
                            : `${taxiMonterricoColors.green}15`)
                        : 'transparent',
                      transform: item.isCurrentMonth && !isSelected ? 'scale(1.05)' : 'none',
                    },
                    opacity: item.isCurrentMonth ? 1 : 0.35,
                  }}
                >
                  {item.day}
                </Box>
              );
            })}
          </Box>

          {/* Botones de acción - Mejorado */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 1.5, 
            pt: 1.5, 
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
          }}>
            <Button
              onClick={handleClearDate}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              Borrar
            </Button>
            <Button
              onClick={handleToday}
              sx={{
                textTransform: 'none',
                color: taxiMonterricoColors.green,
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.green}15`,
                },
              }}
            >
              Hoy
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Dialog para asociar */}
      <Dialog
        open={associateOpen}
        onClose={() => setAssociateOpen(false)}
        maxWidth="sm"
        fullWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
            width: '700px',
            maxWidth: '90vw',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: '500px',
          }}
        >
          {/* Panel izquierdo - Categorías */}
          <Box
            sx={{
              width: 160,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fafafa',
              overflowY: 'auto',
            }}
          >
            <List sx={{ p: 0 }}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'seleccionados'}
                  onClick={() => setSelectedCategory('seleccionados')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Seleccionados"
                    secondary={Object.values(selectedAssociations).flat().length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'empresas'}
                  onClick={() => setSelectedCategory('empresas')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Empresas"
                    secondary={companies.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'contactos'}
                  onClick={() => setSelectedCategory('contactos')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Contactos"
                    secondary={contacts.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === 'negocios'}
                  onClick={() => setSelectedCategory('negocios')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Negocios"
                    secondary={deals.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

          {/* Panel derecho - Contenido */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Asociar
              </Typography>
              <IconButton
                onClick={() => setAssociateOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>

            {/* Búsqueda */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                }}
              >
                <Search sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="Buscar asociaciones actuales"
                  value={associateSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssociateSearch(value);
                    // Cuando se escribe, buscar todos los resultados
                    if (value.trim().length > 0) {
                      fetchAssociations(value);
                    } else {
                      // Si se borra la búsqueda, volver a mostrar solo los vinculados
                      fetchAssociations();
                    }
                  }}
                  sx={{
                    flex: 1,
                    fontSize: '0.875rem',
                    '& input': {
                      py: 0.5,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {loadingAssociations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {selectedCategory === 'empresas' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Empresas
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {companies.map((company: any) => (
                            <ListItem key={company.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = selectedAssociations.companies || [];
                                  if (current.includes(company.id)) {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      companies: current.filter((id) => id !== company.id),
                                    });
                                  } else {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      companies: [...current, company.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedAssociations.companies?.includes(company.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={company.name}
                                  secondary={company.domain}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === 'contactos' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Contactos
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {contacts.map((contact: any) => (
                            <ListItem key={contact.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = selectedAssociations.contacts || [];
                                  if (current.includes(contact.id)) {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      contacts: current.filter((id) => id !== contact.id),
                                    });
                                  } else {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      contacts: [...current, contact.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedAssociations.contacts?.includes(contact.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={`${contact.firstName} ${contact.lastName}`}
                                  secondary={contact.email}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === 'negocios' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Negocios
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {deals.map((deal: any) => (
                            <ListItem key={deal.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = selectedAssociations.deals || [];
                                  if (current.includes(deal.id)) {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      deals: current.filter((id) => id !== deal.id),
                                    });
                                  } else {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      deals: [...current, deal.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedAssociations.deals?.includes(deal.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={deal.name}
                                  secondary={`${deal.amount ? `$${deal.amount.toLocaleString()}` : ''} ${deal.stage || ''}`}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === 'seleccionados' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Seleccionados ({Object.values(selectedAssociations).flat().length})
                      </Typography>
                      {Object.values(selectedAssociations).flat().length === 0 ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, py: 2 }}>
                          No hay elementos seleccionados
                        </Typography>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {selectedAssociations.companies?.map((companyId) => {
                            const company = companies.find((c: any) => c.id === companyId);
                            if (!company) return null;
                            return (
                              <ListItem key={companyId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      companies: selectedAssociations.companies.filter((id) => id !== companyId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <Business sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
                                  <ListItemText
                                    primary={company.name}
                                    secondary={company.domain}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {selectedAssociations.contacts?.map((contactId) => {
                            const contact = contacts.find((c: any) => c.id === contactId);
                            if (!contact) return null;
                            return (
                              <ListItem key={contactId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      contacts: selectedAssociations.contacts.filter((id) => id !== contactId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <Person sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
                                  <ListItemText
                                    primary={`${contact.firstName} ${contact.lastName}`}
                                    secondary={contact.email}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {selectedAssociations.deals?.map((dealId) => {
                            const deal = deals.find((d: any) => d.id === dealId);
                            if (!deal) return null;
                            return (
                              <ListItem key={dealId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setSelectedAssociations({
                                      ...selectedAssociations,
                                      deals: selectedAssociations.deals.filter((id) => id !== dealId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <Assignment sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
                                  <ListItemText
                                    primary={deal.name}
                                    secondary={`${deal.amount ? `$${deal.amount.toLocaleString()}` : ''} ${deal.stage || ''}`}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Footer con botones */}
            <Box
              sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
              }}
            >
              <Button
                onClick={() => setAssociateOpen(false)}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  // TODO: Implementar guardado de asociaciones
                  try {
                    // Aquí iría la lógica para guardar las asociaciones
                    console.log('Guardar asociaciones:', selectedAssociations);
                    setAssociateOpen(false);
                  } catch (error) {
                    console.error('Error guardando asociaciones:', error);
                  }
                }}
                variant="contained"
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  bgcolor: taxiMonterricoColors.green,
                  '&:hover': {
                    bgcolor: taxiMonterricoColors.green,
                    opacity: 0.9,
                  },
                }}
              >
                Guardar
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog para ver detalles de actividad expandida */}
      <Dialog
        open={!!expandedActivity}
        onClose={() => setExpandedActivity(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        {expandedActivity && (
          <>
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 48,
                px: 2,
                pt: 1.5,
                pb: 0.5,
              }}
            >
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '1rem' }}>
                {getActivityTypeLabel(expandedActivity.type)}
              </Typography>
              <IconButton
                sx={{
                  color: theme.palette.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                }}
                size="medium"
                onClick={() => setExpandedActivity(null)}
              >
                <Close />
              </IconButton>
            </Box>

            <DialogContent sx={{ px: 2, pb: 1, pt: 0.5 }}>
              {/* Título */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                  Título
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {expandedActivity.subject || expandedActivity.title}
                </Typography>
              </Box>

              {/* Descripción */}
              {expandedActivity.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                    Descripción
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                      border: `1px solid ${theme.palette.divider}`,
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      '& *': {
                        margin: 0,
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: expandedActivity.description }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Campos adicionales en grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {/* Fecha de vencimiento */}
                {expandedActivity.dueDate && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Fecha de vencimiento
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {new Date(expandedActivity.dueDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                )}

                {/* Prioridad */}
                {expandedActivity.priority && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Prioridad
                    </Typography>
                    <Chip
                      label={expandedActivity.priority === 'low' ? 'Baja' : expandedActivity.priority === 'medium' ? 'Media' : expandedActivity.priority === 'high' ? 'Alta' : expandedActivity.priority === 'urgent' ? 'Urgente' : expandedActivity.priority}
                      size="small"
                      sx={{
                        bgcolor: expandedActivity.priority === 'urgent' ? '#f44336' : expandedActivity.priority === 'high' ? '#ff9800' : expandedActivity.priority === 'medium' ? '#ffc107' : '#4caf50',
                        color: 'white',
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Box>
                )}

                {/* Estado */}
                {expandedActivity.status && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Estado
                    </Typography>
                    <Chip
                      label={expandedActivity.status === 'pending' ? 'Pendiente' : expandedActivity.status === 'in_progress' ? 'En progreso' : expandedActivity.status === 'completed' ? 'Completada' : expandedActivity.status}
                      size="small"
                      sx={{
                        bgcolor: expandedActivity.status === 'completed' ? taxiMonterricoColors.green : expandedActivity.status === 'in_progress' ? '#2196f3' : theme.palette.action.disabledBackground,
                        color: expandedActivity.status === 'completed' ? 'white' : theme.palette.text.primary,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  </Box>
                )}

                {/* Asignado a */}
                {expandedActivity.User && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Asignado a
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {expandedActivity.User.firstName} {expandedActivity.User.lastName}
                    </Typography>
                  </Box>
                )}

                {/* Fecha de creación */}
                {expandedActivity.createdAt && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem' }}>
                      Fecha de creación
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {new Date(expandedActivity.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
              <Button
                onClick={() => setExpandedActivity(null)}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog para agregar/crear contacto */}
      <Dialog
        open={addContactDialogOpen}
        onClose={() => {
          setAddContactDialogOpen(false);
          setContactFormData({
            identificationType: 'dni',
            dni: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            district: '',
            province: '',
            department: '',
            jobTitle: '',
            lifecycleStage: 'lead',
            ownerId: user?.id || null,
          });
          setSelectedExistingContacts([]);
          setExistingContactsSearch('');
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Agregar Contacto</Typography>
            <IconButton
              onClick={() => {
                setAddContactDialogOpen(false);
                setContactDialogTab('create');
                setContactFormData({
                  identificationType: 'dni',
                  dni: '',
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  address: '',
                  district: '',
                  province: '',
                  department: '',
                  jobTitle: '',
                  lifecycleStage: 'lead',
                  ownerId: user?.id || 0,
                });
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={contactDialogTab === 'create' ? 0 : 1} onChange={(e, newValue) => setContactDialogTab(newValue === 0 ? 'create' : 'existing')}>
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {contactDialogTab === 'create' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Selección de tipo de identificación y campo de entrada */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <RadioGroup
                    row
                    value={contactFormData.identificationType}
                    onChange={(e) => setContactFormData({ ...contactFormData, identificationType: e.target.value })}
                    sx={{ gap: 2, flexShrink: 0 }}
                  >
                    <FormControlLabel
                      value="dni"
                      control={
                        <Radio 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            '&.Mui-checked': {
                              color: taxiMonterricoColors.orange,
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
                        border: `2px solid ${contactFormData.identificationType === 'dni' ? taxiMonterricoColors.orange : theme.palette.divider}`,
                        borderRadius: 2,
                        bgcolor: contactFormData.identificationType === 'dni' 
                          ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}20` : `${taxiMonterricoColors.orange}10`)
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          borderColor: taxiMonterricoColors.orange,
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}15` : `${taxiMonterricoColors.orange}08`,
                        },
                        '& .MuiFormControlLabel-label': {
                          color: theme.palette.text.primary,
                          fontWeight: contactFormData.identificationType === 'dni' ? 500 : 400,
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
                              color: taxiMonterricoColors.orange,
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
                        border: `2px solid ${contactFormData.identificationType === 'cee' ? taxiMonterricoColors.orange : theme.palette.divider}`,
                        borderRadius: 2,
                        bgcolor: contactFormData.identificationType === 'cee' 
                          ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}20` : `${taxiMonterricoColors.orange}10`)
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          borderColor: taxiMonterricoColors.orange,
                          bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}15` : `${taxiMonterricoColors.orange}08`,
                        },
                        '& .MuiFormControlLabel-label': {
                          color: theme.palette.text.primary,
                          fontWeight: contactFormData.identificationType === 'cee' ? 500 : 400,
                        },
                      }}
                    />
                  </RadioGroup>

                  {/* Campo de entrada según el tipo seleccionado */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      label="DNI"
                      value={contactFormData.dni}
                      onChange={(e) => setContactFormData({ ...contactFormData, dni: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: '48px',
                          height: '48px',
                        },
                        '& .MuiInputBase-input': {
                          py: 1.5,
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            size="small"
                            sx={{
                              color: taxiMonterricoColors.orange,
                              '&:hover': {
                                bgcolor: `${taxiMonterricoColors.orange}15`,
                              },
                            }}
                          >
                            <Search />
                          </IconButton>
                        ),
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Nombre y Apellido en su propia fila */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Nombre"
                  value={contactFormData.firstName}
                  onChange={(e) => setContactFormData({ ...contactFormData, firstName: e.target.value })}
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
                  value={contactFormData.lastName}
                  onChange={(e) => setContactFormData({ ...contactFormData, lastName: e.target.value })}
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
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
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
                  value={contactFormData.phone}
                  onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
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
                value={contactFormData.address}
                onChange={(e) => setContactFormData({ ...contactFormData, address: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              
              {/* Distrito y Provincia en su propia fila */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Distrito"
                  value={contactFormData.district}
                  onChange={(e) => setContactFormData({ ...contactFormData, district: e.target.value })}
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
                  value={contactFormData.province}
                  onChange={(e) => setContactFormData({ ...contactFormData, province: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
              </Box>
              
              {/* Departamento en su propia fila */}
              <TextField
                label="Departamento"
                value={contactFormData.department}
                onChange={(e) => setContactFormData({ ...contactFormData, department: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              
              {/* Cargo y Etapa del Ciclo de Vida en su propia fila */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Cargo"
                  value={contactFormData.jobTitle}
                  onChange={(e) => setContactFormData({ ...contactFormData, jobTitle: e.target.value })}
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
                  value={contactFormData.lifecycleStage}
                  onChange={(e) => setContactFormData({ ...contactFormData, lifecycleStage: e.target.value })}
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
          ) : (
            <Box>
              <TextField
                size="small"
                placeholder="Buscar Contactos"
                value={existingContactsSearch}
                onChange={(e) => setExistingContactsSearch(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {allContacts.filter((c: any) => {
                    if (!existingContactsSearch.trim()) return true;
                    const search = existingContactsSearch.toLowerCase();
                    return (
                      c.firstName?.toLowerCase().includes(search) ||
                      c.lastName?.toLowerCase().includes(search) ||
                      c.email?.toLowerCase().includes(search)
                    );
                  }).length} Contactos
                </Typography>
                <Select
                  size="small"
                  value="default"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="default">Predeterminado (Agregado recientemente)</MenuItem>
                </Select>
              </Box>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loadingAllContacts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  allContacts
                    .filter((contact: any) => {
                      if (!existingContactsSearch.trim()) return true;
                      const search = existingContactsSearch.toLowerCase();
                      return (
                        contact.firstName?.toLowerCase().includes(search) ||
                        contact.lastName?.toLowerCase().includes(search) ||
                        contact.email?.toLowerCase().includes(search)
                      );
                    })
                    .map((contact: any) => (
                      <Box
                        key={contact.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 1,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Checkbox
                          checked={selectedExistingContacts.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExistingContacts([...selectedExistingContacts, contact.id]);
                            } else {
                              setSelectedExistingContacts(selectedExistingContacts.filter(id => id !== contact.id));
                            }
                          }}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {contact.firstName} {contact.lastName}
                          {contact.email && ` (${contact.email})`}
                        </Typography>
                      </Box>
                    ))
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box>
            {contactDialogTab === 'existing' && (
              <Typography variant="body2" color="text.secondary">
                {selectedExistingContacts.length} elementos
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                setAddContactDialogOpen(false);
                setContactFormData({
                  identificationType: 'dni',
                  dni: '',
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  address: '',
                  district: '',
                  province: '',
                  department: '',
                  jobTitle: '',
                  lifecycleStage: 'lead',
                  ownerId: user?.id || null,
                });
                setSelectedExistingContacts([]);
                setExistingContactsSearch('');
              }}
              sx={{
                textTransform: 'none',
                borderColor: taxiMonterricoColors.orange,
                color: taxiMonterricoColors.orange,
                '&:hover': {
                  borderColor: taxiMonterricoColors.orange,
                  bgcolor: `${taxiMonterricoColors.orange}10`,
                },
              }}
            >
              Cancelar
            </Button>
            {contactDialogTab === 'create' ? (
              <>
                <Button
                  onClick={handleCreateContact}
                  variant="contained"
                  disabled={saving || !contactFormData.firstName || !contactFormData.lastName}
                  sx={{
                    textTransform: 'none',
                    bgcolor: '#2196F3',
                    '&:hover': {
                      bgcolor: '#1976D2',
                    },
                  }}
                >
                  Crear
                </Button>
                <Button
                  onClick={async () => {
                    await handleCreateContact();
                    if (!saving) {
                      setContactFormData({
                        identificationType: 'dni',
                        dni: '',
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        address: '',
                        district: '',
                        province: '',
                        department: '',
                        jobTitle: '',
                        lifecycleStage: 'lead',
                        ownerId: user?.id || null,
                      });
                    }
                  }}
                  variant="contained"
                  disabled={saving || !contactFormData.firstName || !contactFormData.lastName}
                  sx={{
                    textTransform: 'none',
                    bgcolor: '#2196F3',
                    '&:hover': {
                      bgcolor: '#1976D2',
                    },
                  }}
                >
                  Crear y agregar otro
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAddExistingContacts}
                variant="contained"
                disabled={saving || selectedExistingContacts.length === 0}
                sx={{
                  textTransform: 'none',
                  bgcolor: '#2196F3',
                  '&:hover': {
                    bgcolor: '#1976D2',
                  },
                }}
              >
                Guardar
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar empresa */}
      <Dialog
        open={addCompanyDialogOpen}
        onClose={() => {
          setAddCompanyDialogOpen(false);
          setCompanyDialogTab('create');
          setCompanyFormData({
            name: '',
            domain: '',
            industry: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: '',
            ruc: '',
            lifecycleStage: 'lead',
            ownerId: user?.id || null,
          });
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Agregar Empresa</Typography>
            <IconButton
              onClick={() => {
                setAddCompanyDialogOpen(false);
                setCompanyDialogTab('create');
                setCompanyFormData({
                  name: '',
                  domain: '',
                  industry: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  country: '',
                  ruc: '',
                  lifecycleStage: 'lead',
                  ownerId: user?.id || null,
                });
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={companyDialogTab === 'create' ? 0 : 1} onChange={(e, newValue) => setCompanyDialogTab(newValue === 0 ? 'create' : 'existing')}>
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {companyDialogTab === 'create' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* RUC y Nombre en la misma fila */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <TextField
                    label="RUC"
                    value={companyFormData.ruc || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const limitedValue = value.slice(0, 11);
                      setCompanyFormData({ ...companyFormData, ruc: limitedValue });
                      setRucError(''); // Limpiar error al escribir
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && companyFormData.ruc.length === 11) {
                        handleSearchRuc();
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ maxLength: 11 }}
                    error={!!rucError}
                    helperText={rucError}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleSearchRuc}
                            disabled={loadingRuc || companyFormData.ruc.length !== 11}
                            size="small"
                            sx={{ p: 0.5 }}
                            title="Buscar RUC"
                          >
                            {loadingRuc ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Search fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <TextField
                  label="Nombre"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: '4 1 0%',
                    minWidth: 0,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Dominio"
                  value={companyFormData.domain}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, domain: e.target.value })}
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
                  value={companyFormData.phone}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
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
                label="Dirección"
                value={companyFormData.address}
                onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
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
                  value={companyFormData.city}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
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
                  value={companyFormData.state}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, state: e.target.value })}
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
                  value={companyFormData.country}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, country: e.target.value })}
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
                value={companyFormData.lifecycleStage}
                onChange={(e) => setCompanyFormData({ ...companyFormData, lifecycleStage: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
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
          ) : (
            <Box>
              <TextField
                size="small"
                placeholder="Buscar Empresas"
                value={existingCompaniesSearch}
                onChange={(e) => setExistingCompaniesSearch(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {allCompanies.filter((c: any) => {
                    if (!existingCompaniesSearch.trim()) return true;
                    const search = existingCompaniesSearch.toLowerCase();
                    return (
                      c.name?.toLowerCase().includes(search) ||
                      c.domain?.toLowerCase().includes(search) ||
                      c.industry?.toLowerCase().includes(search)
                    );
                  }).length} Empresas
                </Typography>
                <Select
                  size="small"
                  value="default"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="default">Predeterminado (Agregado recientemente)</MenuItem>
                </Select>
              </Box>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loadingAllCompanies ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  allCompanies
                    .filter((company: any) => {
                      if (!existingCompaniesSearch.trim()) return true;
                      const search = existingCompaniesSearch.toLowerCase();
                      return (
                        company.name?.toLowerCase().includes(search) ||
                        company.domain?.toLowerCase().includes(search) ||
                        company.industry?.toLowerCase().includes(search)
                      );
                    })
                    .map((company: any) => (
                      <Box
                        key={company.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 1,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Checkbox
                          checked={selectedExistingCompanies.includes(company.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExistingCompanies([...selectedExistingCompanies, company.id]);
                            } else {
                              setSelectedExistingCompanies(selectedExistingCompanies.filter(id => id !== company.id));
                            }
                          }}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {company.name}
                          {company.domain && ` (${company.domain})`}
                        </Typography>
                      </Box>
                    ))
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box>
            {companyDialogTab === 'existing' && (
              <Typography variant="body2" color="text.secondary">
                {selectedExistingCompanies.length} elementos
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                setAddCompanyDialogOpen(false);
                setCompanyFormData({
                  name: '',
                  domain: '',
                  industry: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  country: '',
                  ruc: '',
                  lifecycleStage: 'lead',
                  ownerId: user?.id || null,
                });
                setSelectedExistingCompanies([]);
                setExistingCompaniesSearch('');
              }}
              sx={{
                textTransform: 'none',
                borderColor: taxiMonterricoColors.orange,
                color: taxiMonterricoColors.orange,
                '&:hover': {
                  borderColor: taxiMonterricoColors.orange,
                  bgcolor: `${taxiMonterricoColors.orange}10`,
                },
              }}
            >
              Cancelar
            </Button>
            {companyDialogTab === 'create' ? (
              <>
                <Button
                  onClick={handleCreateCompany}
                  variant="contained"
                  disabled={saving || !companyFormData.name}
                  sx={{
                    textTransform: 'none',
                    bgcolor: '#2196F3',
                    '&:hover': {
                      bgcolor: '#1976D2',
                    },
                  }}
                >
                  Crear
                </Button>
                <Button
                  onClick={async () => {
                    await handleCreateCompany();
                    if (!saving) {
                      setCompanyFormData({
                        name: '',
                        domain: '',
                        industry: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        country: '',
                        ruc: '',
                        lifecycleStage: 'lead',
                        ownerId: user?.id || null,
                      });
                    }
                  }}
                  variant="contained"
                  disabled={saving || !companyFormData.name}
                  sx={{
                    textTransform: 'none',
                    bgcolor: '#2196F3',
                    '&:hover': {
                      bgcolor: '#1976D2',
                    },
                  }}
                >
                  Crear y agregar otro
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAddExistingCompanies}
                variant="contained"
                disabled={saving || selectedExistingCompanies.length === 0}
                sx={{
                  textTransform: 'none',
                  bgcolor: '#2196F3',
                  '&:hover': {
                    bgcolor: '#1976D2',
                  },
                }}
              >
                Guardar
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación de contacto */}
      <Dialog
        open={removeContactDialogOpen}
        onClose={() => {
          setRemoveContactDialogOpen(false);
          setContactToRemove(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Eliminar asociación
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            {contactToRemove?.name} ya no se asociará con {deal?.name}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setRemoveContactDialogOpen(false);
              setContactToRemove(null);
            }}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              '&:hover': {
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.action.hover,
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Determinar si es contacto o empresa basándose en el contexto
              if (dealContacts.some((c: any) => c.id === contactToRemove?.id)) {
                handleConfirmRemoveContact();
              } else if (dealCompanies.some((c: any) => c.id === contactToRemove?.id)) {
                handleConfirmRemoveCompany();
              }
            }}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#FF9800',
              color: 'white',
              '&:hover': {
                bgcolor: '#F57C00',
              },
            }}
          >
            Eliminar asociación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DealDetail;