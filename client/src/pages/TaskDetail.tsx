import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Divider,
  Menu,
  Tooltip,
  Tabs,
  Tab,
  Drawer,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  InputAdornment,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputBase,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Assignment,
  Flag,
  Person,
  CalendarToday,
  KeyboardArrowDown,
  MoreVert,
  AutoAwesome,
  Close,
  Business,
  AccessTime,
  DonutSmall,
  KeyboardArrowRight,
  Note,
  Email,
  Phone,
  Event,
  Comment,
  ReportProblem,
  TaskAlt,
  Search,
  OpenInNew,
  ContentCopy,
  ExpandMore,
  Add,
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
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  History,
} from '@mui/icons-material';
import api from '../config/api';
import axios from 'axios';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { formatDatePeru } from '../utils/dateUtils';
import RichTextEditor from '../components/RichTextEditor';

interface TaskDetailData {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  AssignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  CreatedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
  dealId?: number;
  companyId?: number;
  contactId?: number;
  Deal?: {
    id: number;
    name: string;
  };
  Company?: {
    id: number;
    name: string;
  };
  Contact?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [moreOptionsMenuAnchorEl, setMoreOptionsMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [callData, setCallData] = useState({ subject: '', description: '', duration: '' });
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [successMessage, setSuccessMessage] = useState('');
  // Estados para el modal de asociaciones de nota separado
  const [noteAssociateModalOpen, setNoteAssociateModalOpen] = useState(false);
  const [noteSelectedCategory, setNoteSelectedCategory] = useState('empresas');
  const [noteAssociateSearch, setNoteAssociateSearch] = useState('');
  const [noteModalCompanies, setNoteModalCompanies] = useState<any[]>([]);
  const [noteModalContacts, setNoteModalContacts] = useState<any[]>([]);
  const [noteModalDeals, setNoteModalDeals] = useState<any[]>([]);
  const [noteModalTickets, setNoteModalTickets] = useState<any[]>([]);
  const [noteSelectedAssociations, setNoteSelectedAssociations] = useState<{ [key: string]: number[] }>({
    companies: [],
    contacts: [],
    deals: [],
    tickets: [],
  });
  const [noteLoadingAssociations, setNoteLoadingAssociations] = useState(false);
  const [selectedCompaniesForNote, setSelectedCompaniesForNote] = useState<number[]>([]);
  const [selectedContactsForNote, setSelectedContactsForNote] = useState<number[]>([]);
  const [selectedAssociationsForNote, setSelectedAssociationsForNote] = useState<number[]>([]);
  const [excludedCompaniesForNote, setExcludedCompaniesForNote] = useState<number[]>([]);
  const [excludedContactsForNote, setExcludedContactsForNote] = useState<number[]>([]);
  const noteEditorRef = React.useRef<HTMLDivElement>(null);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const descriptionEditorRef = React.useRef<HTMLDivElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [taskContacts, setTaskContacts] = useState<any[]>([]);
  const [taskCompanies, setTaskCompanies] = useState<any[]>([]);
  const [taskDeals, setTaskDeals] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [contactSortField, setContactSortField] = useState<'firstName' | 'email' | 'phone'>('firstName');
  const [contactSortOrder, setContactSortOrder] = useState<'asc' | 'desc'>('asc');
  const [companySortField, setCompanySortField] = useState<'name' | 'domain' | 'phone'>('name');
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('asc');
  const [dealSortField, setDealSortField] = useState<'name' | 'amount' | 'closeDate' | 'stage'>('name');
  const [dealSortOrder, setDealSortOrder] = useState<'asc' | 'desc'>('asc');
  const [addContactMenuAnchor, setAddContactMenuAnchor] = useState<null | HTMLElement>(null);
  const [addCompanyMenuAnchor, setAddCompanyMenuAnchor] = useState<null | HTMLElement>(null);
  const [addDealMenuAnchor, setAddDealMenuAnchor] = useState<null | HTMLElement>(null);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [addDealDialogOpen, setAddDealDialogOpen] = useState(false);
  const [contactDialogTab, setContactDialogTab] = useState<'create' | 'existing'>('create');
  const [companyDialogTab, setCompanyDialogTab] = useState<'create' | 'existing'>('create');
  const [dealDialogTab, setDealDialogTab] = useState<'create' | 'existing'>('create');
  const [selectedExistingContact, setSelectedExistingContact] = useState<number | null>(null);
  const [selectedExistingCompany, setSelectedExistingCompany] = useState<number | null>(null);
  const [selectedExistingDeal, setSelectedExistingDeal] = useState<number | null>(null);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [loadingAllContacts, setLoadingAllContacts] = useState(false);
  const [loadingAllCompanies, setLoadingAllCompanies] = useState(false);
  const [loadingAllDeals, setLoadingAllDeals] = useState(false);
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState('');
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [existingContactsSearch, setExistingContactsSearch] = useState('');
  const [existingCompaniesSearch, setExistingCompaniesSearch] = useState('');
  const [existingDealsSearch, setExistingDealsSearch] = useState('');
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
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    domain: '',
    companyname: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    ruc: '',
    lifecycleStage: 'lead',
    ownerId: user?.id || null,
  });
  const [dealFormData, setDealFormData] = useState({
    name: '',
    amount: '',
    stage: 'lead',
    closeDate: '',
    priority: 'baja',
    companyId: '',
    contactId: '',
    ownerId: user?.id || null,
  });
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  
  // Opciones de etapa
  const stageOptions = [
    { value: 'lead_inactivo', label: 'Lead Inactivo' },
    { value: 'cliente_perdido', label: 'Cliente perdido' },
    { value: 'cierre_perdido', label: 'Cierre Perdido' },
    { value: 'lead', label: 'Lead' },
    { value: 'contacto', label: 'Contacto' },
    { value: 'reunion_agendada', label: 'Reunión Agendada' },
    { value: 'reunion_efectiva', label: 'Reunión Efectiva' },
    { value: 'propuesta_economica', label: 'Propuesta Económica' },
    { value: 'negociacion', label: 'Negociación' },
    { value: 'licitacion', label: 'Licitación' },
    { value: 'licitacion_etapa_final', label: 'Licitación Etapa Final' },
    { value: 'cierre_ganado', label: 'Cierre Ganado' },
    { value: 'firma_contrato', label: 'Firma de Contrato' },
    { value: 'activo', label: 'Activo' },
  ];
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'todo',
    status: 'not started',
    priority: 'medium',
    dueDate: '',
    assignedToId: '',
  });
  const [users, setUsers] = useState<any[]>([]);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Intentar obtener desde /tasks primero
      try {
        const response = await api.get(`/tasks/${id}`);
        setTask(response.data);
        setFormData({
          title: response.data.title || '',
          description: response.data.description || '',
          type: response.data.type || 'todo',
          status: response.data.status || 'not started',
          priority: response.data.priority || 'medium',
          dueDate: response.data.dueDate ? response.data.dueDate.split('T')[0] : '',
          assignedToId: response.data.assignedToId ? response.data.assignedToId.toString() : (user?.id ? user.id.toString() : ''),
        });
        
        // Obtener actividades relacionadas
        if (response.data.dealId) {
          try {
            const activitiesRes = await api.get(`/activities`, {
              params: { dealId: response.data.dealId, limit: 10 }
            });
            setActivities(activitiesRes.data.activities || activitiesRes.data || []);
          } catch (err) {
            console.error('Error fetching activities:', err);
          }
        }
        
        // Obtener contactos, empresas y negocios relacionados
        if (response.data.contactId) {
          try {
            const contactRes = await api.get(`/contacts/${response.data.contactId}`);
            setTaskContacts([contactRes.data]);
          } catch (err) {
            console.error('Error fetching contact:', err);
          }
        }
        if (response.data.companyId) {
          try {
            const companyRes = await api.get(`/companies/${response.data.companyId}`);
            setTaskCompanies([companyRes.data]);
          } catch (err) {
            console.error('Error fetching company:', err);
          }
        }
        if (response.data.dealId) {
          try {
            const dealRes = await api.get(`/deals/${response.data.dealId}`);
            setTaskDeals([dealRes.data]);
          } catch (err) {
            console.error('Error fetching deal:', err);
          }
        }
      } catch (error: any) {
        // Si no se encuentra en /tasks, intentar en /activities
        if (error.response?.status === 404) {
          const activityResponse = await api.get(`/activities/${id}`);
          const activity = activityResponse.data;
          setTask({
            id: activity.id,
            title: activity.subject || activity.description || '',
            description: activity.description || '',
            type: activity.type || 'task',
            status: 'not started',
            priority: 'medium',
            dueDate: activity.dueDate,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            CreatedBy: activity.User,
            dealId: activity.dealId,
            companyId: activity.companyId,
            contactId: activity.contactId,
            Deal: activity.Deal,
            Company: activity.Company,
            Contact: activity.Contact,
          });
          setFormData({
            title: activity.subject || activity.description || '',
            description: activity.description || '',
            type: activity.type || 'task',
            status: 'not started',
            priority: 'medium',
            dueDate: activity.dueDate ? activity.dueDate.split('T')[0] : '',
            assignedToId: activity.assignedToId ? activity.assignedToId.toString() : (user?.id ? user.id.toString() : ''),
          });
          
          // Obtener actividades relacionadas
          if (activity.dealId) {
            try {
              const activitiesRes = await api.get(`/activities`, {
                params: { dealId: activity.dealId, limit: 10 }
              });
              setActivities(activitiesRes.data.activities || activitiesRes.data || []);
            } catch (err) {
              console.error('Error fetching activities:', err);
            }
          }
          
          // Obtener contactos, empresas y negocios relacionados
          if (activity.contactId) {
            setTaskContacts(activity.Contact ? [activity.Contact] : []);
          }
          if (activity.companyId) {
            setTaskCompanies(activity.Company ? [activity.Company] : []);
          }
          if (activity.dealId) {
            setTaskDeals(activity.Deal ? [activity.Deal] : []);
          }
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error fetching task:', error);
      if (error.response?.status === 404) {
        setTask(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    try {
      // Solo usuarios admin pueden ver la lista completa de usuarios
      if (user?.role === 'admin') {
        const response = await api.get('/users');
        setUsers(response.data || []);
      } else {
        // Usuarios no admin solo pueden asignarse a sí mismos
        if (user) {
          setUsers([user]);
        } else {
          setUsers([]);
        }
      }
    } catch (error: any) {
      // Si es un error de permisos (403), solo asignar al usuario actual
      if (error.response?.status === 403 || error.isPermissionError) {
        if (user) {
          setUsers([user]);
        } else {
          setUsers([]);
        }
        return;
      }
      console.error('Error fetching users:', error);
      if (user) {
        setUsers([user]);
      } else {
        setUsers([]);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchTask();
    fetchUsers();
  }, [fetchTask, fetchUsers]);

  // Funciones helper para los logs
  const getActivityDescription = (activity: any) => {
    const typeMap: { [key: string]: string } = {
      'note': 'Nota creada',
      'email': 'Email enviado',
      'call': 'Llamada registrada',
      'meeting': 'Reunión agendada',
      'task': 'Tarea creada',
    };
    return typeMap[activity.type] || 'Actividad creada';
  };

  const getActivityIconType = (type: string) => {
    return type; // Retornar el tipo para renderizar después
  };

  const fetchActivityLogs = useCallback(async () => {
    if (!id) return;
    setLoadingLogs(true);
    try {
      // Obtener actividades y cambios de la tarea
      const [activitiesResponse, taskResponse] = await Promise.all([
        api.get('/activities', { params: { taskId: id } }).catch(() => ({ data: { activities: [] } })),
        api.get(`/tasks/${id}`).catch(() => null)
      ]);
      
      const activities = activitiesResponse.data?.activities || activitiesResponse.data || [];
      const taskData = taskResponse?.data;
      
      // Crear logs a partir de actividades y cambios
      const logs: any[] = [];
      
      // Agregar actividades como logs
      activities.forEach((activity: any) => {
        logs.push({
          id: `activity-${activity.id}`,
          type: activity.type,
          action: 'created',
          description: getActivityDescription(activity),
          user: activity.User,
          timestamp: activity.createdAt,
          iconType: getActivityIconType(activity.type),
        });
      });
      
      // Agregar cambios en la tarea si hay updatedAt
      if (taskData?.updatedAt && taskData.createdAt !== taskData.updatedAt) {
        logs.push({
          id: `task-update-${taskData.id}`,
          type: 'task',
          action: 'updated',
          description: 'Información de la tarea actualizada',
          user: taskData.CreatedBy || taskData.AssignedTo,
          timestamp: taskData.updatedAt,
          iconType: 'task',
        });
      }
      
      // Ordenar por fecha (más recientes primero)
      logs.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });
      
      setActivityLogs(logs.slice(0, 10)); // Mostrar solo los últimos 10
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchActivityLogs();
    }
  }, [id, fetchActivityLogs]);

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : (user?.id || undefined),
      };
      
      // Determinar si es una actividad o tarea basándose en el tipo
      if (task?.type && ['note', 'email', 'call', 'meeting'].includes(task.type)) {
        await api.put(`/activities/${id}`, {
          subject: formData.title,
          description: formData.description,
          type: formData.type,
          dueDate: formData.dueDate || undefined,
        });
      } else {
        await api.put(`/tasks/${id}`, submitData);
      }
      setEditDialogOpen(false);
      fetchTask();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      // Determinar si es una actividad o tarea
      if (task?.type && ['note', 'email', 'call', 'meeting'].includes(task.type)) {
        await api.delete(`/activities/${id}`);
      } else {
        await api.delete(`/tasks/${id}`);
      }
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Funciones para obtener todos los contactos/empresas/negocios
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

  const fetchAllCompanies = async () => {
    setLoadingAllCompanies(true);
    try {
      const response = await api.get('/companies', { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error('Error fetching all companies:', error);
    } finally {
      setLoadingAllCompanies(false);
    }
  };

  const fetchAllDeals = async () => {
    setLoadingAllDeals(true);
    try {
      const response = await api.get('/deals', { params: { limit: 1000 } });
      setAllDeals(response.data.deals || response.data || []);
    } catch (error) {
      console.error('Error fetching all deals:', error);
    } finally {
      setLoadingAllDeals(false);
    }
  };

  // Obtener empresas y contactos disponibles para el formulario de negocio
  useEffect(() => {
    const fetchAvailableData = async () => {
      try {
        const [companiesRes, contactsRes] = await Promise.all([
          api.get('/companies', { params: { limit: 1000 } }),
          api.get('/contacts', { params: { limit: 1000 } }),
        ]);
        setAvailableCompanies(companiesRes.data.companies || companiesRes.data || []);
        setAvailableContacts(contactsRes.data.contacts || contactsRes.data || []);
      } catch (error) {
        console.error('Error fetching available data:', error);
      }
    };
    fetchAvailableData();
  }, []);

  // Funciones para crear contactos/empresas/negocios
  const handleCreateContact = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      
      // Obtener la empresa principal de la tarea si existe
      const primaryCompanyId = task?.companyId;
      
      if (!primaryCompanyId) {
        alert('La tarea debe tener al menos una empresa asociada para crear un contacto');
        setSaving(false);
        return;
      }
      
      const contactData: any = {
        firstName: contactFormData.firstName,
        lastName: contactFormData.lastName,
        email: contactFormData.email,
        phone: contactFormData.phone,
        address: contactFormData.address,
        city: contactFormData.district,
        state: contactFormData.province,
        country: contactFormData.department,
        jobTitle: contactFormData.jobTitle,
        lifecycleStage: contactFormData.lifecycleStage,
        ownerId: contactFormData.ownerId,
        companyId: primaryCompanyId,
      };

      // Agregar DNI o CEE según el tipo seleccionado
      if (contactFormData.identificationType === 'cee') {
        contactData.cee = contactFormData.dni ? contactFormData.dni.toUpperCase() : undefined;
      } else {
        contactData.dni = contactFormData.dni || undefined;
      }
      
      const response = await api.post('/contacts', contactData);
      
      // Asociar el contacto recién creado a la tarea
      await api.put(`/tasks/${id}`, { contactId: response.data.id });
      
      await fetchTask();
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
      setDniError('');
    } catch (error: any) {
      console.error('Error creating contact:', error);
      alert(error.response?.data?.error || 'Error al crear el contacto');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingContact = async () => {
    if (!id || !selectedExistingContact) return;
    
    try {
      setSaving(true);
      await api.put(`/tasks/${id}`, { contactId: selectedExistingContact });
      await fetchTask();
      setAddContactDialogOpen(false);
      setSelectedExistingContact(null);
      setExistingContactsSearch('');
    } catch (error: any) {
      console.error('Error adding contact:', error);
      alert(error.response?.data?.error || 'Error al agregar el contacto');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      const companyData = {
        ...companyFormData,
        ownerId: companyFormData.ownerId || user?.id,
      };
      const response = await api.post('/companies', companyData);
      
      // Asociar la empresa recién creada a la tarea
      await api.put(`/tasks/${id}`, { companyId: response.data.id });
      
      await fetchTask();
      setAddCompanyDialogOpen(false);
      setCompanyFormData({
        name: '',
        domain: '',
        companyname: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        ruc: '',
        lifecycleStage: 'lead',
        ownerId: user?.id || null,
      });
    } catch (error: any) {
      console.error('Error creating company:', error);
      alert(error.response?.data?.error || 'Error al crear la empresa');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingCompany = async () => {
    if (!id || !selectedExistingCompany) return;
    
    try {
      setSaving(true);
      await api.put(`/tasks/${id}`, { companyId: selectedExistingCompany });
      await fetchTask();
      setAddCompanyDialogOpen(false);
      setSelectedExistingCompany(null);
      setExistingCompaniesSearch('');
    } catch (error: any) {
      console.error('Error adding company:', error);
      alert(error.response?.data?.error || 'Error al agregar la empresa');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      const dealData: any = {
        name: dealFormData.name,
        amount: dealFormData.amount ? parseFloat(dealFormData.amount) : undefined,
        stage: dealFormData.stage,
        closeDate: dealFormData.closeDate || undefined,
        priority: dealFormData.priority,
        ownerId: dealFormData.ownerId || user?.id,
      };
      
      // Agregar companyId y contactId si están seleccionados
      if (dealFormData.companyId) {
        dealData.companyId = parseInt(dealFormData.companyId);
      }
      if (dealFormData.contactId) {
        dealData.contactId = parseInt(dealFormData.contactId);
      }
      
      const response = await api.post('/deals', dealData);
      
      // Asociar el negocio recién creado a la tarea
      await api.put(`/tasks/${id}`, { dealId: response.data.id });
      
      await fetchTask();
      setAddDealDialogOpen(false);
      setDealFormData({
        name: '',
        amount: '',
        stage: 'lead',
        closeDate: '',
        priority: 'baja',
        companyId: '',
        contactId: '',
        ownerId: user?.id || null,
      });
    } catch (error: any) {
      console.error('Error creating deal:', error);
      alert(error.response?.data?.error || 'Error al crear el negocio');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingDeal = async () => {
    if (!id || !selectedExistingDeal) return;
    
    try {
      setSaving(true);
      await api.put(`/tasks/${id}`, { dealId: selectedExistingDeal });
      await fetchTask();
      setAddDealDialogOpen(false);
      setSelectedExistingDeal(null);
      setExistingDealsSearch('');
    } catch (error: any) {
      console.error('Error adding deal:', error);
      alert(error.response?.data?.error || 'Error al agregar el negocio');
    } finally {
      setSaving(false);
    }
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
    if (!contactFormData.dni || contactFormData.dni.length < 8) {
      setDniError('El DNI debe tener al menos 8 dígitos');
      return;
    }

    setLoadingDni(true);
    setDniError('');

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setDniError('⚠️ La búsqueda automática de DNI no está disponible. Puedes ingresar los datos manualmente. Para habilitarla, configura REACT_APP_FACTILIZA_TOKEN en el archivo .env');
        setLoadingDni(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/dni/info/${contactFormData.dni}`,
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
        setContactFormData(prev => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
          address: direccionCapitalizada,
          district: distritoCapitalizado,
          province: provinciaCapitalizada,
          department: departamentoCapitalizado || 'Perú',
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

  const handleSearchRuc = async () => {
    if (!companyFormData.ruc || companyFormData.ruc.length < 11) {
      setRucError('El RUC debe tener 11 dígitos');
      return;
    }

    setLoadingRuc(true);
    setRucError('');

    try {
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
        
        // Capitalizar solo las iniciales
        const nombreCapitalizado = capitalizeInitials(data.nombre_o_razon_social || '');
        const direccionCapitalizada = capitalizeInitials(data.direccion_completa || data.direccion || '');
        const distritoCapitalizado = capitalizeInitials(data.distrito || '');
        const provinciaCapitalizada = capitalizeInitials(data.provincia || '');
        const departamentoCapitalizado = capitalizeInitials(data.departamento || '');
        
        // Actualizar el formulario con los datos obtenidos
        setCompanyFormData({
          ...companyFormData,
          name: nombreCapitalizado,
          companyname: data.tipo_contribuyente || '',
          address: direccionCapitalizada,
          city: distritoCapitalizado,
          state: provinciaCapitalizada,
          country: departamentoCapitalizado || 'Perú',
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

  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'urgent': 'Urgente',
    };
    return priorityMap[priority?.toLowerCase()] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: { bg: string; color: string } } = {
      'urgent': { bg: '#FFEBEE', color: '#C62828' },
      'high': { bg: '#FFEBEE', color: '#C62828' },
      'medium': { bg: '#FFF3E0', color: '#E65100' },
      'low': { bg: '#E8F5E9', color: '#2E7D32' },
    };
    return colorMap[priority?.toLowerCase()] || { bg: '#F5F5F5', color: '#757575' };
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'not started': 'No Iniciada',
      'in progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'call': 'Llamada',
      'email': 'Email',
      'meeting': 'Reunión',
      'note': 'Nota',
      'todo': 'Tarea',
      'other': 'Otro',
    };
    return typeMap[type?.toLowerCase()] || type;
  };

  const isOverdue = () => {
    if (!task?.dueDate || task.status === 'completed') return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

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

  // Función para ordenar negocios
  const handleSortDeals = (field: 'name' | 'amount' | 'closeDate' | 'stage') => {
    const isAsc = dealSortField === field && dealSortOrder === 'asc';
    setDealSortOrder(isAsc ? 'desc' : 'asc');
    setDealSortField(field);
  };

  // Función para copiar al portapapeles
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (noteEditorRef.current && noteOpen) {
      if (noteData.description !== noteEditorRef.current.innerHTML) {
        noteEditorRef.current.innerHTML = noteData.description || '';
      }
    }
  }, [noteOpen, noteData.description]);

  const fetchAssociationsForNote = async (searchTerm?: string) => {
    setNoteLoadingAssociations(true);
    try {
      if (searchTerm && searchTerm.trim().length > 0) {
        const [companiesRes, contactsRes, dealsRes, ticketsRes] = await Promise.all([
          api.get('/companies', { params: { limit: 1000, search: searchTerm } }),
          api.get('/contacts', { params: { limit: 1000, search: searchTerm } }),
          api.get('/deals', { params: { limit: 1000, search: searchTerm } }),
          api.get('/tickets', { params: { limit: 1000, search: searchTerm } }),
        ]);
        setNoteModalCompanies(companiesRes.data.companies || companiesRes.data || []);
        setNoteModalContacts(contactsRes.data.contacts || contactsRes.data || []);
        setNoteModalDeals(dealsRes.data.deals || dealsRes.data || []);
        setNoteModalTickets(ticketsRes.data.tickets || ticketsRes.data || []);
      } else {
        // Cargar elementos asociados a la tarea actual
        const associatedItems: { companies: any[]; contacts: any[]; deals: any[]; tickets: any[] } = {
          companies: [],
          contacts: [],
          deals: [],
          tickets: [],
        };

        // Cargar empresas vinculadas
        if (taskCompanies && taskCompanies.length > 0) {
          associatedItems.companies = taskCompanies;
        } else if (task?.Company) {
          associatedItems.companies = [task.Company];
        }

        // Cargar contactos vinculados
        if (taskContacts && taskContacts.length > 0) {
          associatedItems.contacts = taskContacts;
        } else if (task?.Contact) {
          associatedItems.contacts = [task.Contact];
        }

        // Cargar negocios vinculados
        if (taskDeals && taskDeals.length > 0) {
          associatedItems.deals = taskDeals;
        } else if (task?.Deal) {
          associatedItems.deals = [task.Deal];
        }

        setNoteModalCompanies(associatedItems.companies);
        setNoteModalContacts(associatedItems.contacts);
        setNoteModalDeals(associatedItems.deals);
        setNoteModalTickets(associatedItems.tickets);
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
    } finally {
      setNoteLoadingAssociations(false);
    }
  };

  const handleOpenNote = () => {
    setNoteData({ subject: '', description: '' });
    setNoteOpen(true);
    // Inicializar asociaciones
    setSelectedCompaniesForNote([]);
    setSelectedContactsForNote([]);
    setSelectedAssociationsForNote([]);
    setExcludedCompaniesForNote([]);
    setExcludedContactsForNote([]);
  };

  const handleOpenCall = () => {
    setCallData({ subject: '', description: '', duration: '' });
    setCallOpen(true);
  };

  const handleOpenTask = () => {
    setNewTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setTaskOpen(true);
  };

  // Funciones para guardar actividades
  const handleSaveNote = async () => {
    if (!noteData.description.trim() || !id) {
      return;
    }
    setSaving(true);
    
    try {
      // Obtener empresas seleccionadas
      const companiesToAssociate = selectedCompaniesForNote.filter(companyId => !excludedCompaniesForNote.includes(companyId));
      
      // Obtener contactos seleccionados
      const contactsToAssociate = selectedContactsForNote.filter(contactId => !excludedContactsForNote.includes(contactId));
      
      // Obtener negocios seleccionados (de selectedAssociationsForNote, donde deals están en el rango 1000-2000)
      const dealsToAssociate = selectedAssociationsForNote
        .filter((id: number) => id > 1000 && id < 2000)
        .map(id => id - 1000);
      
      // Crear nota asociada a la tarea actual
      const activityData: any = {
        subject: noteData.subject || `Nota para ${task?.title || 'Tarea'}`,
        description: noteData.description,
      };
      
      // Agregar asociaciones si existen
      if (companiesToAssociate.length > 0) {
        activityData.companyId = companiesToAssociate[0]; // Solo una empresa por nota
      } else if (task?.companyId) {
        activityData.companyId = task.companyId;
      }
      
      if (contactsToAssociate.length > 0) {
        activityData.contactId = contactsToAssociate[0]; // Solo un contacto por nota
      } else if (task?.contactId) {
        activityData.contactId = task.contactId;
      }
      
      if (dealsToAssociate.length > 0) {
        activityData.dealId = dealsToAssociate[0];
      } else if (task?.dealId) {
        activityData.dealId = task.dealId;
      }
      
      await api.post('/activities/notes', activityData);
      
      setSuccessMessage('Nota creada exitosamente');
      setNoteOpen(false);
      setNoteData({ subject: '', description: '' });
      setSelectedCompaniesForNote([]);
      setSelectedContactsForNote([]);
      setSelectedAssociationsForNote([]);
      setExcludedCompaniesForNote([]);
      setExcludedContactsForNote([]);
      fetchTask();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving note:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Error desconocido';
      setSuccessMessage(`Error al crear la nota: ${errorMessage}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCall = async () => {
    if (!callData.subject.trim() || !id) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/activities/calls', {
        subject: callData.subject,
        description: callData.description,
        dealId: task?.dealId,
        companyId: task?.companyId,
        contactId: task?.contactId,
      });
      setSuccessMessage('Llamada registrada exitosamente');
      setCallOpen(false);
      setCallData({ subject: '', description: '', duration: '' });
      fetchTask();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving call:', error);
      setSuccessMessage('Error al registrar la llamada');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    return formatDatePeru(dateString);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

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

  useEffect(() => {
    if (descriptionEditorRef.current && taskOpen) {
      if (newTaskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = newTaskData.description || '';
      }
    }
  }, [taskOpen, newTaskData.description]);

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (newTaskData.dueDate) {
      const dateMatch = newTaskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const day = parseInt(dateMatch[3], 10);
        const date = new Date(year, month, day);
        setSelectedDate(date);
        setCurrentMonth(date);
      } else {
        const date = new Date(newTaskData.dueDate);
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
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setNewTaskData({ ...newTaskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setNewTaskData({ ...newTaskData, dueDate: '' });
    setDatePickerAnchorEl(null);
  };

  const handleToday = () => {
    const today = new Date();
    const peruToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const year = peruToday.getFullYear();
    const month = peruToday.getMonth() + 1;
    const day = peruToday.getDate();
    handleDateSelect(year, month, day);
  };

  const handleSaveNewTask = async () => {
    if (!newTaskData.title.trim() || !id) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/tasks', {
        title: newTaskData.title,
        description: newTaskData.description,
        type: 'todo',
        status: 'not started',
        priority: newTaskData.priority,
        dueDate: newTaskData.dueDate || undefined,
        dealId: task?.dealId,
        companyId: task?.companyId,
        contactId: task?.contactId,
        assignedToId: user?.id,
      });
      setSuccessMessage('Tarea creada exitosamente');
      setTaskOpen(false);
      setNewTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
      if (descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML = '';
      }
      fetchTask();
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

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Tarea no encontrada
        </Typography>
        <Button onClick={() => navigate('/tasks')} sx={{ mt: 2 }}>
          Volver a Tareas
        </Button>
      </Box>
    );
  }

  const priorityStyle = getPriorityColor(task.priority);

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
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
          {/* Header estilo card */}
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
          {/* Parte superior: Icono + Info a la izquierda, Chip + Menús a la derecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            {/* Izquierda: Icono + Título + Subtítulo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: taxiMonterricoColors.green,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                }}
              >
                <Assignment sx={{ fontSize: 28 }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', mb: 0.5 }}>
                  {task.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {getTypeLabel(task.type)} {task.createdAt ? `• ${new Date(task.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                </Typography>
              </Box>
            </Box>

            {/* Derecha: Estado + Menú desplegable de acciones */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={getStatusLabel(task.status)}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: task.status === 'completed' 
                    ? (theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)')
                    : task.status === 'in progress'
                    ? (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)')
                    : (theme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)'),
                  color: task.status === 'completed' 
                    ? taxiMonterricoColors.green
                    : task.status === 'in progress'
                    ? '#F59E0B'
                    : theme.palette.text.secondary,
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
                    setEditDialogOpen(true);
                    setMoreOptionsMenuAnchorEl(null);
                  }}
                >
                  Editar
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setDeleteDialogOpen(true);
                    setMoreOptionsMenuAnchorEl(null);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  Eliminar
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Línea separadora */}
          <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

          {/* Parte inferior: Chips con información */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {task.dueDate && (
              <Chip
                icon={<CalendarToday sx={{ fontSize: 14 }} />}
                label={`Vence: ${new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                  border: `1px solid ${theme.palette.divider}`,
                  color: isOverdue() ? '#d32f2f' : theme.palette.text.primary,
                  '& .MuiChip-icon': {
                    color: isOverdue() ? '#d32f2f' : theme.palette.text.secondary,
                  },
                }}
              />
            )}
            {(task.AssignedTo || task.CreatedBy) && (
              <Chip
                icon={<Person sx={{ fontSize: 14 }} />}
                label={task.AssignedTo 
                  ? `${task.AssignedTo.firstName} ${task.AssignedTo.lastName}`
                  : task.CreatedBy 
                  ? `${task.CreatedBy.firstName} ${task.CreatedBy.lastName}`
                  : 'Sin asignar'}
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
              icon={<Flag sx={{ fontSize: 14, color: priorityStyle.color }} />}
              label={getPriorityLabel(task.priority)}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                border: `1px solid ${theme.palette.divider}`,
                color: priorityStyle.color,
                fontWeight: 500,
                '& .MuiChip-icon': {
                  color: priorityStyle.color,
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
              {/* Cards de Fecha de Creación, Tipo de Tarea, Última Actividad y Asignado */}
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
                    {task.createdAt
                      ? `${new Date(task.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} ${new Date(task.createdAt).toLocaleTimeString('es-ES', {
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
                      Tipo de tarea
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyboardArrowRight sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {getTypeLabel(task.type)}
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
                      : task.updatedAt
                      ? new Date(task.updatedAt).toLocaleDateString('es-ES', {
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
                      {task.AssignedTo ? 'Asignado a' : 'Creado por'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {task.AssignedTo 
                      ? (task.AssignedTo.firstName || task.AssignedTo.lastName
                          ? `${task.AssignedTo.firstName || ''} ${task.AssignedTo.lastName || ''}`.trim()
                          : task.AssignedTo.email || 'Sin nombre')
                      : task.CreatedBy
                      ? (task.CreatedBy.firstName || task.CreatedBy.lastName
                          ? `${task.CreatedBy.firstName || ''} ${task.CreatedBy.lastName || ''}`.trim()
                          : task.CreatedBy.email || 'Sin nombre')
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
                  {(task.Contact || taskContacts.length > 0) ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {task.Contact && (
                        <Box
                          onClick={() => navigate(`/contacts/${task.Contact?.id}`)}
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
                            {task.Contact.firstName && task.Contact.lastName 
                              ? `${task.Contact.firstName} ${task.Contact.lastName}`
                              : 'Sin nombre'}
                          </Typography>
                        </Box>
                      )}
                      {taskContacts.slice(0, task.Contact ? 4 : 5).map((contact: any) => (
                        <Box
                          key={contact.id}
                          onClick={() => navigate(`/contacts/${contact.id}`)}
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
                            {contact.firstName && contact.lastName 
                              ? `${contact.firstName} ${contact.lastName}`
                              : contact.email || 'Sin nombre'}
                          </Typography>
                        </Box>
                      ))}
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
                  {(task.Company || taskCompanies.length > 0) ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {task.Company && (
                        <Box
                          key={task.Company.id}
                          onClick={() => navigate(`/companies/${task.Company?.id}`)}
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
                            {task.Company.name || 'Sin nombre'}
                          </Typography>
                        </Box>
                      )}
                      {taskCompanies.slice(0, task.Company ? 4 : 5).map((company: any) => (
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
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No hay empresas vinculadas
                    </Typography>
                  )}
                </Card>

              {/* Card de Negocios Vinculados */}
              {(task.Deal || taskDeals.length > 0) && (
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
                    <Assignment sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Negocios vinculados
                    </Typography>
                  </Box>
                  {(task.Deal || taskDeals.length > 0) ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {task.Deal && (
                        <Box
                          key={task.Deal.id}
                          onClick={() => navigate(`/deals/${task.Deal?.id}`)}
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
                            {task.Deal.name || 'Sin nombre'}
                          </Typography>
                        </Box>
                      )}
                      {taskDeals.slice(0, task.Deal ? 4 : 5).map((deal: any) => (
                        <Box
                          key={deal.id}
                          onClick={() => navigate(`/deals/${deal.id}`)}
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
                            {deal.name || 'Sin nombre'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No hay negocios vinculados
                    </Typography>
                  )}
                </Card>
              )}
            </>
          )}

          {/* Tab Información Avanzada */}
          {activeTab === 1 && (
            <>
              {/* Cards de Fecha de Creación, Tipo de Tarea, Última Actividad y Asignado - Solo en pestaña Información Avanzada */}
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
                    {task.createdAt
                      ? `${new Date(task.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} ${new Date(task.createdAt).toLocaleTimeString('es-ES', {
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
                      Tipo de tarea
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyboardArrowRight sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {getTypeLabel(task.type)}
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
                      : task.updatedAt
                      ? new Date(task.updatedAt).toLocaleDateString('es-ES', {
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
                      {task.AssignedTo ? 'Asignado a' : 'Creado por'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {task.AssignedTo 
                      ? (task.AssignedTo.firstName || task.AssignedTo.lastName
                          ? `${task.AssignedTo.firstName || ''} ${task.AssignedTo.lastName || ''}`.trim()
                          : task.AssignedTo.email || 'Sin nombre')
                      : task.CreatedBy
                      ? (task.CreatedBy.firstName || task.CreatedBy.lastName
                          ? `${task.CreatedBy.firstName || ''} ${task.CreatedBy.lastName || ''}`.trim()
                          : task.CreatedBy.email || 'Sin nombre')
                      : 'No asignado'}
                  </Typography>
                </Card>
              </Box>

              {/* Cards de Contactos, Empresas y Negocios - Solo en pestaña Información Avanzada */}
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
                      setSelectedExistingContact(task?.contactId || null);
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

                {(() => {
                  const allContacts = task.Contact 
                    ? [task.Contact, ...taskContacts.filter((contact: any) => contact.id !== task.Contact?.id)]
                    : taskContacts;
                  
                  if (allContacts.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay contactos relacionados con esta tarea
                        </Typography>
                      </Box>
                    );
                  }

                  // Filtrar contactos
                  let filteredContacts = allContacts.filter((contact: any) => {
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
                      setSelectedExistingCompany(task?.companyId || null);
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

                {(() => {
                  const allCompanies = task.Company 
                    ? [task.Company, ...taskCompanies.filter((company: any) => company.id !== task.Company?.id)]
                    : taskCompanies;
                  
                  if (allCompanies.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay empresas relacionadas con esta tarea
                        </Typography>
                      </Box>
                    );
                  }

                  // Filtrar empresas
                  let filteredCompanies = allCompanies.filter((company: any) => {
                    if (!companySearch.trim()) return true;
                    const searchLower = companySearch.toLowerCase();
                    return (
                      company.name?.toLowerCase().includes(searchLower) ||
                      company.domain?.toLowerCase().includes(searchLower) ||
                      company.phone?.toLowerCase().includes(searchLower)
                    );
                  });

                  // Ordenar empresas
                  filteredCompanies = [...filteredCompanies].sort((a: any, b: any) => {
                    let aValue: string = (a[companySortField] || '').toLowerCase();
                    let bValue: string = (b[companySortField] || '').toLowerCase();

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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCompanies.map((company: any) => (
                            <TableRow
                              key={company.id}
                              onClick={() => navigate(`/companies/${company.id}`)}
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
                                    {company.name?.substring(0, 2).toUpperCase()}
                                  </Avatar>
                                  <Typography
                                    sx={{
                                      color: taxiMonterricoColors.green,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {company.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                  {company.domain || '--'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                  {company.phone || '--'}
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
                    onClick={(e) => setAddDealMenuAnchor(e.currentTarget)}
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

                {/* Menú para agregar negocio */}
                <Menu
                  anchorEl={addDealMenuAnchor}
                  open={Boolean(addDealMenuAnchor)}
                  onClose={() => setAddDealMenuAnchor(null)}
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
                      setAddDealMenuAnchor(null);
                      setDealDialogTab('existing');
                      setSelectedExistingDeal(task?.dealId || null);
                      setAddDealDialogOpen(true);
                      fetchAllDeals();
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
                    <Assignment sx={{ mr: 1.5, fontSize: 20, color: taxiMonterricoColors.green }} />
                    <Typography variant="body2">Agregar negocio existente</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setAddDealMenuAnchor(null);
                      setDealDialogTab('create');
                      setAddDealDialogOpen(true);
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
                    <Typography variant="body2">Crear nuevo negocio</Typography>
                  </MenuItem>
                </Menu>

                {(() => {
                  const allDeals = task.Deal 
                    ? [task.Deal, ...taskDeals.filter((deal: any) => deal.id !== task.Deal?.id)]
                    : taskDeals;
                  
                  if (allDeals.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay negocios relacionados con esta tarea
                        </Typography>
                      </Box>
                    );
                  }

                  // Filtrar negocios
                  let filteredDeals = allDeals.filter((deal: any) => {
                    if (!dealSearch.trim()) return true;
                    const searchLower = dealSearch.toLowerCase();
                    return (
                      deal.name?.toLowerCase().includes(searchLower) ||
                      deal.stage?.toLowerCase().includes(searchLower)
                    );
                  });

                  // Ordenar negocios
                  filteredDeals = [...filteredDeals].sort((a: any, b: any) => {
                    let aValue: string = '';
                    let bValue: string = '';

                    if (dealSortField === 'name') {
                      aValue = (a.name || '').toLowerCase();
                      bValue = (b.name || '').toLowerCase();
                    } else if (dealSortField === 'amount') {
                      aValue = String(a.amount || 0);
                      bValue = String(b.amount || 0);
                    } else if (dealSortField === 'closeDate') {
                      aValue = a.closeDate || '';
                      bValue = b.closeDate || '';
                    } else if (dealSortField === 'stage') {
                      aValue = (a.stage || '').toLowerCase();
                      bValue = (b.stage || '').toLowerCase();
                    }

                    if (dealSortOrder === 'asc') {
                      if (dealSortField === 'amount') {
                        return Number(aValue) - Number(bValue);
                      }
                      return aValue.localeCompare(bValue);
                    } else {
                      if (dealSortField === 'amount') {
                        return Number(bValue) - Number(aValue);
                      }
                      return bValue.localeCompare(aValue);
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
                                NOMBRE
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
                                MONTO
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
                                FECHA DE CIERRE
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
                                ETAPA
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredDeals.map((deal: any) => (
                            <TableRow
                              key={deal.id}
                              onClick={() => navigate(`/deals/${deal.id}`)}
                              sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                                },
                              }}
                            >
                              <TableCell>
                                <Typography
                                  sx={{
                                    color: taxiMonterricoColors.green,
                                    fontWeight: 500,
                                  }}
                                >
                                  {deal.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                  {deal.amount ? `S/ ${deal.amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '--'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                  {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  }) : '--'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                  {deal.stage || '--'}
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

          {/* Tab Actividades */}
          {activeTab === 2 && (
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              bgcolor: theme.palette.background.paper,
              px: 2,
              py: 2,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Todas las Actividades
              </Typography>
              {activities && activities.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {activities
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt || 0).getTime();
                      const dateB = new Date(b.createdAt || 0).getTime();
                      return dateB - dateA;
                    })
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
                  No hay actividades disponibles
                </Typography>
              )}
            </Card>
          )}
        </Box>

        {/* Columna Copiloto IA y Registro de Cambios - Solo en desktop cuando está abierto */}
        {isDesktop && copilotOpen && (
        <Box sx={{
          width: 380,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignSelf: 'flex-start',
        }}>
          {/* Copiloto IA */}
          <Box sx={{
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
                {taskContacts.length === 0 && taskCompanies.length === 0 && taskDeals.length === 0
                  ? 'Esta tarea no tiene contactos, empresas ni negocios asociados. Considera vincularlos para un mejor seguimiento.'
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
            onClick={() => setActiveTab(0)}
          >
            Ver información
          </Button>
        </Card>

        {/* Card 2: Próximas pérdidas */}
        {task.dueDate && isOverdue() && (
          <Card 
            sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(211, 47, 47, 0.1)' 
                : 'rgba(211, 47, 47, 0.05)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.15)'}`,
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
                    ? 'rgba(211, 47, 47, 0.2)' 
                    : 'rgba(211, 47, 47, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Note sx={{ fontSize: 20, color: '#d32f2f' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                  Próximas pérdidas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  La fecha de vencimiento ya pasó. Revisa el estado de la tarea.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                mt: 1,
                borderColor: '#d32f2f',
                color: '#d32f2f',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#d32f2f',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
                },
              }}
              onClick={() => setEditDialogOpen(true)}
            >
              Ver detalles
            </Button>
          </Card>
        )}

        {/* Card 3: Manejo seguimiento */}
        {task.updatedAt && (() => {
          const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceUpdate >= 14 ? (
            <Card 
              sx={{ 
                mb: 2, 
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
                    Última actividad hace {daysSinceUpdate} días. Es momento de hacer seguimiento.
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
                onClick={() => setEditDialogOpen(true)}
              >
                Crear tarea
              </Button>
            </Card>
          ) : null;
        })()}
          </Box>

          {/* Card Independiente: Registro de Cambios / Logs */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
            p: 2,
            pb: 3,
            boxSizing: 'border-box',
            overflowY: 'auto',
            height: 'fit-content',
            maxHeight: 'calc(100vh - 80px)',
          }}>
            {/* Card: Registro de Cambios */}
            <Card 
              sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(33, 150, 243, 0.1)' 
                  : 'rgba(33, 150, 243, 0.05)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)'}`,
                borderRadius: 2,
                maxHeight: 400,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(33, 150, 243, 0.2)' 
                      : 'rgba(33, 150, 243, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <History sx={{ fontSize: 20, color: '#2196F3' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem' }}>
                    Registro de Cambios
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Historial de actividades y modificaciones recientes
                  </Typography>
                </Box>
              </Box>
              
              {/* Lista de logs */}
              <Box sx={{ 
                overflowY: 'auto', 
                maxHeight: 280,
                mt: 1,
                '&::-webkit-scrollbar': {
                  width: 6,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderRadius: 3,
                },
              }}>
                {loadingLogs ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : activityLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                    No hay registros disponibles
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {activityLogs.map((log, index) => {
                      const renderIcon = () => {
                        switch (log.iconType) {
                          case 'note':
                            return <Note sx={{ fontSize: 16 }} />;
                          case 'email':
                            return <Email sx={{ fontSize: 16 }} />;
                          case 'call':
                            return <Phone sx={{ fontSize: 16 }} />;
                          case 'meeting':
                            return <Event sx={{ fontSize: 16 }} />;
                          case 'task':
                            return <TaskAlt sx={{ fontSize: 16 }} />;
                          default:
                            return <History sx={{ fontSize: 16 }} />;
                        }
                      };

                      return (
                      <Box
                        key={log.id}
                        sx={{
                          display: 'flex',
                          gap: 1,
                          alignItems: 'flex-start',
                          pb: index < activityLogs.length - 1 ? 1.5 : 0,
                          borderBottom: index < activityLogs.length - 1 
                            ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` 
                            : 'none',
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(33, 150, 243, 0.15)' 
                              : 'rgba(33, 150, 243, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.25,
                          }}
                        >
                          {renderIcon()}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.25 }}>
                            {log.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            {log.user && (
                              <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: theme.palette.text.secondary }}>
                                {log.user.firstName} {log.user.lastName}
                              </Typography>
                            )}
                            {log.timestamp && (
                              <>
                                {log.user && (
                                  <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: theme.palette.text.disabled }}>
                                    •
                                </Typography>
                                )}
                                <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: theme.palette.text.secondary }}>
                                  {new Date(log.timestamp).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Card>
          </Box>
        </Box>
        )}

        {/* Card Independiente: Registro de Cambios / Logs - Solo cuando Copiloto IA está cerrado */}
        {isDesktop && !copilotOpen && (
        <Box sx={{
          width: 380,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
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
          {/* Card: Registro de Cambios */}
          <Card 
            sx={{ 
              p: 2, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(33, 150, 243, 0.1)' 
                : 'rgba(33, 150, 243, 0.05)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)'}`,
              borderRadius: 2,
              maxHeight: 400,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(33, 150, 243, 0.2)' 
                    : 'rgba(33, 150, 243, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <History sx={{ fontSize: 20, color: '#2196F3' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.875rem' }}>
                  Registro de Cambios
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  Historial de actividades y modificaciones recientes
                </Typography>
              </Box>
            </Box>
            
            {/* Lista de logs */}
            <Box sx={{ 
              overflowY: 'auto', 
              maxHeight: 280,
              mt: 1,
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                borderRadius: 3,
              },
            }}>
              {loadingLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : activityLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                  No hay registros disponibles
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {activityLogs.map((log, index) => {
                    const renderIcon = () => {
                      switch (log.iconType) {
                        case 'note':
                          return <Note sx={{ fontSize: 16 }} />;
                        case 'email':
                          return <Email sx={{ fontSize: 16 }} />;
                        case 'call':
                          return <Phone sx={{ fontSize: 16 }} />;
                        case 'meeting':
                          return <Event sx={{ fontSize: 16 }} />;
                        case 'task':
                          return <TaskAlt sx={{ fontSize: 16 }} />;
                        default:
                          return <History sx={{ fontSize: 16 }} />;
                      }
                    };

                    return (
                    <Box
                      key={log.id}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        pb: index < activityLogs.length - 1 ? 1.5 : 0,
                        borderBottom: index < activityLogs.length - 1 
                          ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` 
                          : 'none',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(33, 150, 243, 0.15)' 
                            : 'rgba(33, 150, 243, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        {renderIcon()}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 0.25 }}>
                          {log.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                          {log.user && (
                            <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: theme.palette.text.secondary }}>
                              {log.user.firstName} {log.user.lastName}
                            </Typography>
                          )}
                          {log.timestamp && (
                            <>
                              {log.user && (
                                <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: theme.palette.text.disabled }}>
                                  •
                                </Typography>
                              )}
                              <Typography variant="caption" sx={{ fontSize: '0.6875rem', color: theme.palette.text.secondary }}>
                                {new Date(log.timestamp).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Card>
        </Box>
        )}

        {/* Drawer Copiloto IA - Solo para móviles */}
        <Drawer
          anchor="right"
          open={copilotOpen && !isDesktop}
          onClose={() => setCopilotOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 380 },
              p: 2,
              pb: 3,
            },
          }}
        >
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
          {/* Mismo contenido que el sidebar de desktop */}
        </Drawer>
      </Box>

      {/* Dialog de edición */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Tarea</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              fullWidth
            >
              <MenuItem value="call">Llamada</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="meeting">Reunión</MenuItem>
              <MenuItem value="note">Nota</MenuItem>
              <MenuItem value="todo">Tarea</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </TextField>
            <TextField
              select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            >
              <MenuItem value="not started">No Iniciada</MenuItem>
              <MenuItem value="in progress">En Progreso</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </TextField>
            <TextField
              select
              label="Prioridad"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              fullWidth
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
            </TextField>
            {users.length > 0 && (
              <TextField
                select
                label="Asignado a"
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                fullWidth
              >
                {users.map((userItem) => (
                  <MenuItem key={userItem.id} value={userItem.id.toString()}>
                    {userItem.firstName} {userItem.lastName}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Fecha Límite"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar Tarea</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
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
          setSelectedExistingContact(null);
          setExistingContactsSearch('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Agregar Contacto</Typography>
            <IconButton onClick={() => setAddContactDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
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
                      label={contactFormData.identificationType === 'dni' ? 'DNI' : 'CEE'}
                      value={contactFormData.dni}
                      onChange={(e) => setContactFormData({ ...contactFormData, dni: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      error={!!dniError}
                      helperText={dniError}
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
                            onClick={handleSearchDni}
                            disabled={loadingDni || !contactFormData.dni || contactFormData.dni.length < 8}
                            sx={{
                              color: taxiMonterricoColors.orange,
                              '&:hover': {
                                bgcolor: `${taxiMonterricoColors.orange}15`,
                              },
                            }}
                          >
                            {loadingDni ? <CircularProgress size={20} /> : <Search />}
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
                  <MenuItem value="lead_inactivo">Lead Inactivo</MenuItem>
                  <MenuItem value="cliente_perdido">Cliente perdido</MenuItem>
                  <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
                  <MenuItem value="lead">Lead</MenuItem>
                  <MenuItem value="contacto">Contacto</MenuItem>
                  <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
                  <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
                  <MenuItem value="propuesta_economica">Propuesta Económica</MenuItem>
                  <MenuItem value="negociacion">Negociación</MenuItem>
                  <MenuItem value="licitacion">Licitación</MenuItem>
                  <MenuItem value="licitacion_etapa_final">Licitación Etapa Final</MenuItem>
                  <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
                  <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                </TextField>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <TextField
                size="small"
                placeholder="Buscar contactos"
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
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {loadingAllContacts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  allContacts
                    .filter((contact: any) => {
                      if (!existingContactsSearch.trim()) return true;
                      const searchLower = existingContactsSearch.toLowerCase();
                      return (
                        contact.firstName?.toLowerCase().includes(searchLower) ||
                        contact.lastName?.toLowerCase().includes(searchLower) ||
                        contact.email?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((contact: any) => (
                      <Box
                        key={contact.id}
                        onClick={() => setSelectedExistingContact(contact.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          bgcolor: selectedExistingContact === contact.id
                            ? (theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)')
                            : 'transparent',
                          border: `1px solid ${selectedExistingContact === contact.id ? taxiMonterricoColors.green : theme.palette.divider}`,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {contact.firstName} {contact.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {contact.email}
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
                {selectedExistingContact ? '1 elemento seleccionado' : '0 elementos seleccionados'}
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
                setSelectedExistingContact(null);
                setExistingContactsSearch('');
                setDniError('');
              }}
              sx={{
                textTransform: 'none',
                color: taxiMonterricoColors.orange,
                fontWeight: 500,
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)',
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={contactDialogTab === 'create' ? handleCreateContact : handleAddExistingContact}
              variant="contained"
              disabled={saving || (contactDialogTab === 'existing' && !selectedExistingContact) || (contactDialogTab === 'create' && !contactFormData.email.trim())}
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
                '&:disabled': {
                  bgcolor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              {saving ? 'Guardando...' : 'Crear'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/crear empresa */}
      <Dialog
        open={addCompanyDialogOpen}
        onClose={() => {
          setAddCompanyDialogOpen(false);
          setCompanyFormData({
            name: '',
            domain: '',
            companyname: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: '',
            ruc: '',
            lifecycleStage: 'lead',
            ownerId: user?.id || null,
          });
          setSelectedExistingCompany(null);
          setExistingCompaniesSearch('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Agregar Empresa</Typography>
            <IconButton onClick={() => setAddCompanyDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
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
                      if (e.key === 'Enter' && companyFormData.ruc && companyFormData.ruc.length === 11) {
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
                            disabled={loadingRuc || !companyFormData.ruc || companyFormData.ruc.length !== 11}
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
                <MenuItem value="lead_inactivo">Lead Inactivo</MenuItem>
                <MenuItem value="cliente_perdido">Cliente perdido</MenuItem>
                <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="contacto">Contacto</MenuItem>
                <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
                <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
                <MenuItem value="propuesta_economica">Propuesta Económica</MenuItem>
                <MenuItem value="negociacion">Negociación</MenuItem>
                <MenuItem value="licitacion">Licitación</MenuItem>
                <MenuItem value="licitacion_etapa_final">Licitación Etapa Final</MenuItem>
                <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
                <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
                <MenuItem value="activo">Activo</MenuItem>
              </TextField>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <TextField
                size="small"
                placeholder="Buscar empresas"
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
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {loadingAllCompanies ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  allCompanies
                    .filter((company: any) => {
                      if (!existingCompaniesSearch.trim()) return true;
                      const searchLower = existingCompaniesSearch.toLowerCase();
                      return (
                        company.name?.toLowerCase().includes(searchLower) ||
                        company.companyname?.toLowerCase().includes(searchLower) ||
                        company.ruc?.includes(searchLower)
                      );
                    })
                    .map((company: any) => (
                      <Box
                        key={company.id}
                        onClick={() => setSelectedExistingCompany(company.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          bgcolor: selectedExistingCompany === company.id
                            ? (theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)')
                            : 'transparent',
                          border: `1px solid ${selectedExistingCompany === company.id ? taxiMonterricoColors.green : theme.palette.divider}`,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {company.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {company.ruc || company.companyname}
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
                {selectedExistingCompany ? '1 elemento seleccionado' : '0 elementos seleccionados'}
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
                  companyname: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  country: '',
                  ruc: '',
                  lifecycleStage: 'lead',
                  ownerId: user?.id || null,
                });
                setSelectedExistingCompany(null);
                setExistingCompaniesSearch('');
                setRucError('');
              }}
              sx={{
                textTransform: 'none',
                color: taxiMonterricoColors.orange,
                fontWeight: 500,
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)',
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
                  disabled={saving || !companyFormData.name.trim()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    bgcolor: '#9E9E9E',
                    '&:hover': {
                      bgcolor: '#757575',
                    },
                    '&:disabled': {
                      bgcolor: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  {saving ? 'Guardando...' : 'Crear'}
                </Button>
                <Button
                  onClick={async () => {
                    await handleCreateCompany();
                    if (!saving) {
                      setCompanyFormData({
                        name: '',
                        domain: '',
                        companyname: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        country: '',
                        ruc: '',
                        lifecycleStage: 'lead',
                        ownerId: user?.id || null,
                      });
                      setRucError('');
                    }
                  }}
                  variant="contained"
                  disabled={saving || !companyFormData.name.trim()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    bgcolor: '#9E9E9E',
                    '&:hover': {
                      bgcolor: '#757575',
                    },
                    '&:disabled': {
                      bgcolor: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  Crear y agregar otro
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAddExistingCompany}
                variant="contained"
                disabled={saving || !selectedExistingCompany}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  bgcolor: '#9E9E9E',
                  '&:hover': {
                    bgcolor: '#757575',
                  },
                  '&:disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/crear negocio */}
      <Dialog
        open={addDealDialogOpen}
        onClose={() => {
          setAddDealDialogOpen(false);
          setDealFormData({
            name: '',
            amount: '',
            stage: 'lead',
            closeDate: '',
            priority: 'baja',
            companyId: '',
            contactId: '',
            ownerId: user?.id || null,
          });
          setSelectedExistingDeal(null);
          setExistingDealsSearch('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{dealDialogTab === 'create' ? 'Nuevo Negocio' : 'Agregar Negocio'}</Typography>
            <IconButton onClick={() => setAddDealDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={dealDialogTab === 'create' ? 0 : 1} onChange={(e, newValue) => setDealDialogTab(newValue === 0 ? 'create' : 'existing')}>
              <Tab label="Crear nuevo" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {dealDialogTab === 'create' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nombre"
                value={dealFormData.name}
                onChange={(e) => setDealFormData({ ...dealFormData, name: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Monto"
                type="number"
                value={dealFormData.amount}
                onChange={(e) => setDealFormData({ ...dealFormData, amount: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                select
                label="Etapa"
                value={dealFormData.stage}
                onChange={(e) => setDealFormData({ ...dealFormData, stage: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
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
                value={dealFormData.closeDate}
                onChange={(e) => setDealFormData({ ...dealFormData, closeDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                select
                label="Prioridad"
                value={dealFormData.priority}
                onChange={(e) => setDealFormData({ ...dealFormData, priority: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="baja">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#20B2AA' }} />
                    Baja
                  </Box>
                </MenuItem>
                <MenuItem value="media">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                    Media
                  </Box>
                </MenuItem>
                <MenuItem value="alta">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
                    Alta
                  </Box>
                </MenuItem>
              </TextField>
              <TextField
                select
                label="Empresa"
                value={dealFormData.companyId}
                onChange={(e) => setDealFormData({ ...dealFormData, companyId: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {availableCompanies.map((company) => (
                  <MenuItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Contacto"
                value={dealFormData.contactId}
                onChange={(e) => setDealFormData({ ...dealFormData, contactId: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
                {availableContacts.map((contact) => (
                  <MenuItem key={contact.id} value={contact.id.toString()}>
                    {contact.firstName} {contact.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <TextField
                size="small"
                placeholder="Buscar negocios"
                value={existingDealsSearch}
                onChange={(e) => setExistingDealsSearch(e.target.value)}
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
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {loadingAllDeals ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  allDeals
                    .filter((deal: any) => {
                      if (!existingDealsSearch.trim()) return true;
                      const searchLower = existingDealsSearch.toLowerCase();
                      return deal.name?.toLowerCase().includes(searchLower);
                    })
                    .map((deal: any) => (
                      <Box
                        key={deal.id}
                        onClick={() => setSelectedExistingDeal(deal.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                          bgcolor: selectedExistingDeal === deal.id
                            ? (theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)')
                            : 'transparent',
                          border: `1px solid ${selectedExistingDeal === deal.id ? taxiMonterricoColors.green : theme.palette.divider}`,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {deal.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {deal.amount ? `S/ ${deal.amount.toLocaleString('es-ES')}` : 'Sin monto'} • {deal.stage || 'Sin etapa'}
                        </Typography>
                      </Box>
                    ))
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={() => {
              setAddDealDialogOpen(false);
              setDealFormData({
                name: '',
                amount: '',
                stage: 'lead',
                closeDate: '',
                priority: 'baja',
                companyId: '',
                contactId: '',
                ownerId: user?.id || null,
              });
              setSelectedExistingDeal(null);
              setExistingDealsSearch('');
            }}
            sx={{
              textTransform: 'none',
              color: taxiMonterricoColors.green,
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              bgcolor: 'transparent',
              border: `1px solid ${taxiMonterricoColors.green}`,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)',
                borderColor: taxiMonterricoColors.green,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={dealDialogTab === 'create' ? handleCreateDeal : handleAddExistingDeal}
            variant="contained"
            disabled={saving || (dealDialogTab === 'existing' && !selectedExistingDeal) || (dealDialogTab === 'create' && (!dealFormData.name.trim() || !dealFormData.amount.trim()))}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              bgcolor: taxiMonterricoColors.green,
              color: 'white',
              '&:hover': {
                bgcolor: taxiMonterricoColors.green,
                opacity: 0.9,
              },
              '&:disabled': {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            {saving ? 'Guardando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de crear nota */}
      {noteOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95vw', sm: '700px' },
            maxWidth: { xs: '95vw', sm: '90vw' },
            height: '85vh',
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.3)' 
              : '0 20px 60px rgba(0,0,0,0.12)',
            zIndex: 1401,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 4,
            animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes fadeInScale': {
              '0%': {
                opacity: 0,
                transform: 'translate(-50%, -50%) scale(0.95)',
              },
              '100%': {
                opacity: 1,
                transform: 'translate(-50%, -50%) scale(1)',
              },
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado personalizado */}
          <Box
            sx={{
              px: 3,
              py: 2,
              backgroundColor: 'transparent',
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ 
                color: theme.palette.text.primary, 
                fontWeight: 600, 
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
              }}>
                Nota
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': { 
                    backgroundColor: theme.palette.error.main + '15',
                    color: theme.palette.error.main,
                  },
                  transition: 'all 0.2s ease',
                }} 
                size="small" 
                onClick={() => setNoteOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', p: 3, overflow: 'hidden', gap: 3 }}>
          {/* Columna Izquierda: Editor */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Editor de texto enriquecido con barra de herramientas integrada */}
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`, 
              borderRadius: 3,
              overflow: 'hidden',
              minHeight: '300px',
              backgroundColor: theme.palette.background.paper,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:focus-within': {
                boxShadow: `0 4px 16px ${taxiMonterricoColors.orange}40`,
                borderColor: taxiMonterricoColors.orange,
                transform: 'translateY(-1px)',
              },
            }}>
              <RichTextEditor
                value={noteData.description}
                onChange={(value: string) => setNoteData({ ...noteData, description: value })}
                placeholder="Empieza a escribir para dejar una nota..."
                onAssociateClick={() => {
                  setNoteAssociateModalOpen(true);
                  setNoteSelectedCategory('empresas');
                  setNoteAssociateSearch('');
                  setNoteSelectedAssociations({
                    companies: selectedCompaniesForNote,
                    contacts: selectedContactsForNote,
                    deals: selectedAssociationsForNote.filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000),
                    tickets: selectedAssociationsForNote.filter((id: number) => id > 2000).map(id => id - 2000),
                  });
                  fetchAssociationsForNote();
                }}
              />
            </Box>
          </Box>
          </Box>

          {/* Footer con botones */}
          <Box sx={{ 
            px: 3,
            py: 2.5, 
            borderTop: `1px solid ${theme.palette.divider}`, 
            backgroundColor: theme.palette.background.paper, 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2,
          }}>
            <Button 
              onClick={() => setNoteOpen(false)} 
              sx={{ 
                textTransform: 'none',
                px: 3.5,
                py: 1.25,
                color: theme.palette.text.secondary,
                fontWeight: 500,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                transition: 'all 0.2s ease',
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNote} 
              variant="contained" 
              disabled={saving || !noteData.description.trim()}
              sx={{ 
                textTransform: 'none',
                px: 4,
                py: 1.25,
                backgroundColor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.orange,
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.orange}40`,
                '&:hover': {
                  backgroundColor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.orangeDark,
                  boxShadow: saving ? 'none' : `0 6px 16px ${taxiMonterricoColors.orange}50`,
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                  boxShadow: 'none',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {saving ? 'Guardando...' : 'Crear nota'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Overlay de fondo cuando la ventana está abierta */}
      {noteOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            zIndex: 1400,
            animation: 'fadeIn 0.3s ease-out',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
              },
              '100%': {
                opacity: 1,
              },
            },
          }}
          onClick={() => setNoteOpen(false)}
        />
      )}

      {/* Modal de Asociados para Nota */}
      <Dialog
        open={noteAssociateModalOpen}
        onClose={() => setNoteAssociateModalOpen(false)}
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
                  selected={noteSelectedCategory === 'seleccionados'}
                  onClick={() => setNoteSelectedCategory('seleccionados')}
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
                    secondary={Object.values(noteSelectedAssociations).flat().length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === 'empresas'}
                  onClick={() => setNoteSelectedCategory('empresas')}
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
                    secondary={noteModalCompanies.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === 'contactos'}
                  onClick={() => setNoteSelectedCategory('contactos')}
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
                    secondary={noteModalContacts.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === 'negocios'}
                  onClick={() => setNoteSelectedCategory('negocios')}
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
                    secondary={noteModalDeals.length}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === 'tickets'}
                  onClick={() => setNoteSelectedCategory('tickets')}
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
                    primary="Tickets"
                    secondary={noteModalTickets.length}
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
                onClick={() => setNoteAssociateModalOpen(false)}
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
                  value={noteAssociateSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNoteAssociateSearch(value);
                    if (value.trim().length > 0) {
                      fetchAssociationsForNote(value);
                    } else {
                      fetchAssociationsForNote();
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
              {noteLoadingAssociations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {noteSelectedCategory === 'empresas' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Empresas
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalCompanies
                          .filter((company: any) => 
                            !noteAssociateSearch || company.name?.toLowerCase().includes(noteAssociateSearch.toLowerCase()) || 
                            company.domain?.toLowerCase().includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((company: any) => (
                            <ListItem key={company.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = noteSelectedAssociations.companies || [];
                                  if (current.includes(company.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      companies: current.filter((id) => id !== company.id),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      companies: [...current, company.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={noteSelectedAssociations.companies?.includes(company.id) || false}
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

                  {noteSelectedCategory === 'contactos' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Contactos
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalContacts
                          .filter((contactItem: any) => 
                            !noteAssociateSearch || 
                            `${contactItem.firstName} ${contactItem.lastName}`.toLowerCase().includes(noteAssociateSearch.toLowerCase()) ||
                            contactItem.email?.toLowerCase().includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((contactItem: any) => (
                            <ListItem key={contactItem.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = noteSelectedAssociations.contacts || [];
                                  if (current.includes(contactItem.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      contacts: current.filter((id) => id !== contactItem.id),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      contacts: [...current, contactItem.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={noteSelectedAssociations.contacts?.includes(contactItem.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={`${contactItem.firstName} ${contactItem.lastName}`}
                                  secondary={contactItem.email}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === 'negocios' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Negocios
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalDeals
                          .filter((dealItem: any) => 
                            !noteAssociateSearch || dealItem.name?.toLowerCase().includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((dealItem: any) => (
                            <ListItem key={dealItem.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = noteSelectedAssociations.deals || [];
                                  if (current.includes(dealItem.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: current.filter((id) => id !== dealItem.id),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: [...current, dealItem.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={noteSelectedAssociations.deals?.includes(dealItem.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={dealItem.name}
                                  secondary={`${dealItem.amount ? `$${dealItem.amount.toLocaleString()}` : ''} ${dealItem.stage || ''}`}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === 'tickets' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Tickets
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalTickets
                          .filter((ticket: any) => 
                            !noteAssociateSearch || ticket.subject?.toLowerCase().includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((ticket: any) => (
                            <ListItem key={ticket.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current = noteSelectedAssociations.tickets || [];
                                  if (current.includes(ticket.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets: current.filter((id) => id !== ticket.id),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets: [...current, ticket.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={noteSelectedAssociations.tickets?.includes(ticket.id) || false}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={ticket.subject}
                                  secondary={ticket.description}
                                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === 'seleccionados' && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                        Seleccionados ({Object.values(noteSelectedAssociations).flat().length})
                      </Typography>
                      {Object.values(noteSelectedAssociations).flat().length === 0 ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, py: 2 }}>
                          No hay elementos seleccionados
                        </Typography>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {noteSelectedAssociations.companies?.map((companyId) => {
                            const company = noteModalCompanies.find((c: any) => c.id === companyId);
                            if (!company) return null;
                            return (
                              <ListItem key={companyId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      companies: noteSelectedAssociations.companies.filter((id) => id !== companyId),
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
                          {noteSelectedAssociations.contacts?.map((contactId) => {
                            const contactItem = noteModalContacts.find((c: any) => c.id === contactId);
                            if (!contactItem) return null;
                            return (
                              <ListItem key={contactId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      contacts: noteSelectedAssociations.contacts.filter((id) => id !== contactId),
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
                                    primary={`${contactItem.firstName} ${contactItem.lastName}`}
                                    secondary={contactItem.email}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {noteSelectedAssociations.deals?.map((dealId) => {
                            const dealItem = noteModalDeals.find((d: any) => d.id === dealId);
                            if (!dealItem) return null;
                            return (
                              <ListItem key={dealId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: noteSelectedAssociations.deals.filter((id) => id !== dealId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <ListItemText
                                    primary={dealItem.name}
                                    secondary={`${dealItem.amount ? `$${dealItem.amount.toLocaleString()}` : ''} ${dealItem.stage || ''}`}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {noteSelectedAssociations.tickets?.map((ticketId) => {
                            const ticket = noteModalTickets.find((t: any) => t.id === ticketId);
                            if (!ticket) return null;
                            return (
                              <ListItem key={ticketId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets: noteSelectedAssociations.tickets.filter((id) => id !== ticketId),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <ListItemText
                                    primary={ticket.subject}
                                    secondary={ticket.description}
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
          </Box>
        </Box>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            onClick={() => setNoteAssociateModalOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Aplicar las selecciones a los estados principales
              setSelectedCompaniesForNote(noteSelectedAssociations.companies || []);
              setSelectedContactsForNote(noteSelectedAssociations.contacts || []);
              // Convertir deals y tickets a la estructura esperada
              const dealIds = (noteSelectedAssociations.deals || []).map(id => 1000 + id);
              const ticketIds = (noteSelectedAssociations.tickets || []).map(id => 2000 + id);
              setSelectedAssociationsForNote([...dealIds, ...ticketIds]);
              setNoteAssociateModalOpen(false);
            }}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              backgroundColor: taxiMonterricoColors.green,
              '&:hover': {
                backgroundColor: taxiMonterricoColors.greenDark,
              },
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para registrar llamada */}
      <Dialog open={callOpen} onClose={() => setCallOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Llamada</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Asunto"
            value={callData.subject}
            onChange={(e) => setCallData({ ...callData, subject: e.target.value })}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Duración (minutos)"
            type="number"
            value={callData.duration}
            onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Notas de la llamada"
            value={callData.description}
            onChange={(e) => setCallData({ ...callData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveCall} variant="contained" disabled={saving || !callData.subject.trim()}>
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
            value={newTaskData.title}
            onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
            fullWidth
            InputLabelProps={{
              shrink: !!newTaskData.title,
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
                value={newTaskData.priority}
                onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
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
                value={newTaskData.dueDate ? formatDateDisplay(newTaskData.dueDate) : ''}
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
                if (html !== newTaskData.description) {
                  setNewTaskData({ ...newTaskData, description: html });
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
                        setNewTaskData({ ...newTaskData, description: descriptionEditorRef.current.innerHTML });
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
                        setNewTaskData({ ...newTaskData, description: descriptionEditorRef.current.innerHTML });
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
                      setNewTaskData({ ...newTaskData, description: descriptionEditorRef.current.innerHTML });
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
                      setNewTaskData({ ...newTaskData, description: descriptionEditorRef.current.innerHTML });
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
            onClick={handleSaveNewTask} 
            variant="contained" 
            size="small"
            disabled={saving || !newTaskData.title.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              bgcolor: newTaskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
              color: 'white',
              '&:hover': {
                bgcolor: newTaskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
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

      {/* Date Picker Popover */}
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
          {/* Header con mes y año */}
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

          {/* Días de la semana */}
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

          {/* Calendario */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5,
            mb: 1.5,
          }}>
            {getDaysInMonth(currentMonth).map((item, index) => {
              let year = currentMonth.getFullYear();
              let month = currentMonth.getMonth();
              
              if (!item.isCurrentMonth) {
                if (index < 7) {
                  month = month - 1;
                  if (month < 0) {
                    month = 11;
                    year = year - 1;
                  }
                } else {
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

          {/* Botones de acción */}
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

      {/* Snackbar para mensajes de éxito */}
      {successMessage && (
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default TaskDetail;

