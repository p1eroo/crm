import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  TableSortLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Tooltip,
  Card,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  MoreVert,
  Note,
  Email,
  Phone,
  LocationOn,
  Assignment,
  Event,
  Business,
  Flag,
  Person,
  AttachMoney,
  Support,
  Refresh,
  ThumbUp,
  ThumbDown,
  Comment,
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
  Fullscreen,
  Close,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  Search,
  Settings,
  ArrowUpward,
  ArrowDownward,
  TrendingUp,
  OpenInNew,
  ContentCopy,
  KeyboardArrowRight,
  Lock,
  Edit,
  PushPin,
  History,
  Delete,
  CheckCircle,
  Visibility,
  MoreHoriz,
} from '@mui/icons-material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
} from '@mui/icons-material';
import api from '../config/api';
import RichTextEditor from '../components/RichTextEditor';
import EmailComposer from '../components/EmailComposer';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface ContactDetailData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
  avatar?: string;
  lifecycleStage: string;
  leadStatus?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
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
    industry?: string;
  }>;
  Owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contact-tabpanel-${index}`}
      aria-labelledby={`contact-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [contact, setContact] = useState<ContactDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [associatedDeals, setAssociatedDeals] = useState<any[]>([]);
  const [associatedCompanies, setAssociatedCompanies] = useState<any[]>([]);
  const [associatedTickets, setAssociatedTickets] = useState<any[]>([]);
  const [associatedSubscriptions, setAssociatedSubscriptions] = useState<any[]>([]);
  const [associatedPayments, setAssociatedPayments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Estados para búsquedas y filtros
  const [activitySearch, setActivitySearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [companyActionsMenu, setCompanyActionsMenu] = useState<{ [key: number]: HTMLElement | null }>({});
  const [isRemovingCompany, setIsRemovingCompany] = useState(false);
  const [activityFilters, setActivityFilters] = useState<string[]>(['Todo hasta ahora']);
  const [activityFilterMenuAnchor, setActivityFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterSearch, setActivityFilterSearch] = useState('');
  const [timeRangeMenuAnchor, setTimeRangeMenuAnchor] = useState<null | HTMLElement>(null);
  const [timeRangeSearch, setTimeRangeSearch] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('Hoy');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all'); // 'all', 'note', 'email', 'call', 'task', 'meeting'
  
  // Estados para los filtros de actividad
  const [communicationFilters, setCommunicationFilters] = useState({
    all: true,
    postal: true,
    email: true,
    linkedin: true,
    calls: true,
    sms: true,
    whatsapp: true,
  });
  
  const [teamActivityFilters, setTeamActivityFilters] = useState({
    all: true,
    notes: true,
    meetings: true,
    tasks: true,
  });
  
  // Estados para funcionalidades de notas y actividades
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [noteActionMenus, setNoteActionMenus] = useState<{ [key: number]: HTMLElement | null }>({});
  const [noteComments, setNoteComments] = useState<{ [key: number]: string }>({});
  const [summaryExpanded, setSummaryExpanded] = useState<boolean>(false);
  const [dealSortOrder, setDealSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dealSortField, setDealSortField] = useState<string>('');
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('asc');
  const [companySortField, setCompanySortField] = useState<string>('');
  
  // Estados para diálogos
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [addTicketOpen, setAddTicketOpen] = useState(false);
  const [addSubscriptionOpen, setAddSubscriptionOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [createActivityMenuAnchor, setCreateActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [companyFormData, setCompanyFormData] = useState({ 
    name: '', 
    domain: '', 
    phone: '', 
    industry: '', 
    lifecycleStage: 'lead',
    ruc: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [companyDialogTab, setCompanyDialogTab] = useState<'create' | 'existing'>('create');
  const [existingCompaniesSearch, setExistingCompaniesSearch] = useState('');
  const [selectedExistingCompanies, setSelectedExistingCompanies] = useState<number[]>([]);
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [dealFormData, setDealFormData] = useState({ name: '', amount: '', stage: 'lead', closeDate: '', priority: 'medium' });
  const [ticketFormData, setTicketFormData] = useState({ subject: '', description: '', status: 'new', priority: 'medium' });
  const [subscriptionFormData, setSubscriptionFormData] = useState({ name: '', description: '', status: 'active', amount: '', currency: 'USD', billingCycle: 'monthly', startDate: '', endDate: '', renewalDate: '' });
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', currency: 'USD', status: 'pending', paymentDate: '', dueDate: '', paymentMethod: 'credit_card', reference: '', description: '' });
  
  // Estados para edición de campos del contacto
  const [leadStatusMenuAnchor, setLeadStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [lifecycleStageMenuAnchor, setLifecycleStageMenuAnchor] = useState<null | HTMLElement>(null);
  const [buyingRoleMenuAnchor, setBuyingRoleMenuAnchor] = useState<null | HTMLElement>(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [companyValue, setCompanyValue] = useState('');
  
  // Estados para asociaciones en nota
  const [associationsExpanded, setAssociationsExpanded] = useState(false);
  const [associationsMenuAnchor, setAssociationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAssociationCategory, setSelectedAssociationCategory] = useState<string>('Contactos');
  const [associationSearch, setAssociationSearch] = useState('');
  const [selectedAssociations, setSelectedAssociations] = useState<number[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  // Estados para elementos excluidos (desmarcados manualmente aunque estén asociados)
  const [excludedCompanies, setExcludedCompanies] = useState<number[]>([]);
  const [excludedDeals, setExcludedDeals] = useState<number[]>([]);
  const [excludedTickets, setExcludedTickets] = useState<number[]>([]);
  const [excludedContacts, setExcludedContacts] = useState<number[]>([]);
  
  // Estados para asociaciones en actividades de Descripción (por actividad)
  const [activityAssociationsExpanded, setActivityAssociationsExpanded] = useState<{ [key: number]: boolean }>({});
  const [activityAssociationsMenuAnchor, setActivityAssociationsMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [activitySelectedCategory, setActivitySelectedCategory] = useState<{ [key: number]: string }>({});
  const [activityAssociationSearch, setActivityAssociationSearch] = useState<{ [key: number]: string }>({});
  const [activitySelectedAssociations, setActivitySelectedAssociations] = useState<{ [key: number]: number[] }>({});
  const [activitySelectedContacts, setActivitySelectedContacts] = useState<{ [key: number]: number[] }>({});
  const [activitySelectedCompanies, setActivitySelectedCompanies] = useState<{ [key: number]: number[] }>({});
  const [activitySelectedLeads, setActivitySelectedLeads] = useState<{ [key: number]: number[] }>({});
  // Estados para elementos excluidos por actividad
  const [activityExcludedCompanies, setActivityExcludedCompanies] = useState<{ [key: number]: number[] }>({});
  const [activityExcludedDeals, setActivityExcludedDeals] = useState<{ [key: number]: number[] }>({});
  const [activityExcludedTickets, setActivityExcludedTickets] = useState<{ [key: number]: number[] }>({});
  const [activityExcludedContacts, setActivityExcludedContacts] = useState<{ [key: number]: number[] }>({});
  
  // Calcular total de asociaciones basado en selecciones del usuario usando useMemo para asegurar actualización
  const totalAssociations = useMemo(() => {
    // Incluir empresas asociadas que aún no están en selectedCompanies pero deberían contarse
    // Excluir las empresas que fueron desmarcadas manualmente
    const associatedCompanyIds = (associatedCompanies || [])
      .map((c: any) => c && c.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedCompanies.includes(id));
    
    // Combinar empresas seleccionadas manualmente y empresas asociadas (sin duplicar)
    const allCompanyIds = [...selectedCompanies, ...associatedCompanyIds];
    const companiesToCount = allCompanyIds.filter((id, index) => allCompanyIds.indexOf(id) === index);
    
    // Contar negocios: los seleccionados manualmente más los asociados (sin duplicar)
    // Excluir los negocios que fueron desmarcados manualmente
    const selectedDealIds = selectedAssociations.filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
    const associatedDealIds = (associatedDeals || [])
      .map((d: any) => d && d.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedDeals.includes(id));
    const allDealIds = [...selectedDealIds, ...associatedDealIds];
    const dealsToCount = allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
    
    // Contar tickets: los seleccionados manualmente más los asociados (sin duplicar)
    // Excluir los tickets que fueron desmarcados manualmente
    const selectedTicketIds = selectedAssociations.filter((id: number) => id > 2000).map(id => id - 2000);
    const associatedTicketIds = (associatedTickets || [])
      .map((t: any) => t && t.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedTickets.includes(id));
    const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
    const ticketsToCount = allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
    
    // Contar contactos: el contacto actual siempre cuenta si existe y no fue excluido
    const contactsCount = (contact?.id && !excludedContacts.includes(contact.id)) ? 1 : 0;
    
    const total = contactsCount + companiesToCount.length + selectedLeads.length + dealsToCount + ticketsToCount;
    
    // Debug: Log para verificar valores (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug asociaciones:', {
        associatedCompanies: associatedCompanies.length,
        associatedCompanyIds,
        selectedCompanies: selectedCompanies.length,
        excludedCompanies,
        companiesToCount: companiesToCount.length,
        contactsCount,
        dealsToCount,
        ticketsToCount,
        total,
      });
    }
    
    return total;
  }, [associatedCompanies, selectedCompanies, excludedCompanies, associatedDeals, selectedAssociations, excludedDeals, associatedTickets, excludedTickets, selectedLeads, excludedContacts, contact?.id]);
  
  // Variables derivadas para usar en otros lugares
  const associatedCompanyIds = (associatedCompanies || []).map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
  const allCompanyIds = [...selectedCompanies, ...associatedCompanyIds];
  const companiesToCount = allCompanyIds.filter((id, index) => allCompanyIds.indexOf(id) === index);
  const selectedDealIds = selectedAssociations.filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
  const associatedDealIds = (associatedDeals || []).map((d: any) => d && d.id).filter((id: any) => id !== undefined && id !== null);
  const allDealIds = [...selectedDealIds, ...associatedDealIds];
  const dealsToCount = allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
  const selectedTicketIds = selectedAssociations.filter((id: number) => id > 2000).map(id => id - 2000);
  const associatedTicketIds = (associatedTickets || []).map((t: any) => t && t.id).filter((id: any) => id !== undefined && id !== null);
  const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
  const ticketsToCount = allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
  const contactsCount = contact?.id ? 1 : 0;
  
  // Función para calcular total de asociaciones por actividad (basado en selecciones y asociaciones automáticas)
  const getActivityTotalAssociations = (activityId: number) => {
    // Contactos seleccionados manualmente o el contacto actual si existe (excluyendo los desmarcados)
    const contacts = activitySelectedContacts[activityId] || [];
    const excludedContactsForActivity = activityExcludedContacts[activityId] || [];
    const contactsCount = contacts.length > 0 ? contacts.length : ((contact?.id && !excludedContactsForActivity.includes(contact.id)) ? 1 : 0);
    
    // Empresas: seleccionadas manualmente + empresas asociadas automáticamente (excluyendo las desmarcadas)
    const selectedCompaniesForActivity = activitySelectedCompanies[activityId] || [];
    const excludedCompaniesForActivity = activityExcludedCompanies[activityId] || [];
    const associatedCompanyIds = (associatedCompanies || [])
      .map((c: any) => c && c.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedCompaniesForActivity.includes(id));
    const allCompanyIdsForActivity = [...selectedCompaniesForActivity, ...associatedCompanyIds];
    const companiesCount = allCompanyIdsForActivity.filter((id, index) => allCompanyIdsForActivity.indexOf(id) === index).length;
    
    // Leads seleccionados manualmente
    const leads = activitySelectedLeads[activityId] || [];
    
    // Negocios: seleccionados manualmente + negocios asociados automáticamente (excluyendo los desmarcados)
    const selectedDealIdsForActivity = (activitySelectedAssociations[activityId] || []).filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
    const excludedDealsForActivity = activityExcludedDeals[activityId] || [];
    const associatedDealIds = (associatedDeals || [])
      .map((d: any) => d && d.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedDealsForActivity.includes(id));
    const allDealIdsForActivity = [...selectedDealIdsForActivity, ...associatedDealIds];
    const dealsCount = allDealIdsForActivity.filter((id, index) => allDealIdsForActivity.indexOf(id) === index).length;
    
    // Tickets: seleccionados manualmente + tickets asociados automáticamente (excluyendo los desmarcados)
    const selectedTicketIdsForActivity = (activitySelectedAssociations[activityId] || []).filter((id: number) => id > 2000).map(id => id - 2000);
    const excludedTicketsForActivity = activityExcludedTickets[activityId] || [];
    const associatedTicketIds = (associatedTickets || [])
      .map((t: any) => t && t.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedTicketsForActivity.includes(id));
    const allTicketIdsForActivity = [...selectedTicketIdsForActivity, ...associatedTicketIds];
    const ticketsCount = allTicketIdsForActivity.filter((id, index) => allTicketIdsForActivity.indexOf(id) === index).length;
    
    return contactsCount + companiesCount + leads.length + dealsCount + ticketsCount;
  };
  
  // Estados para diálogos de acciones
  const [noteOpen, setNoteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  
  // Estados para formularios
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [emailData, setEmailData] = useState({ subject: '', description: '', to: '' });
  const [callData, setCallData] = useState({ subject: '', description: '', duration: '' });
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [meetingData, setMeetingData] = useState({ subject: '', description: '', date: '', time: '' });
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);

  // Ya no se necesitan estados de OAuth individual - se usa el token guardado desde Perfil

  useEffect(() => {
    fetchContact();
  }, [id]);

  useEffect(() => {
    if (contact && !isRemovingCompany) {
      fetchAssociatedRecords();
      fetchAllCompanies();
      // Inicializar asociaciones seleccionadas con los registros relacionados reales
      if (contact.id) {
        setSelectedContacts([contact.id]);
      }
    }
  }, [contact, id, isRemovingCompany]);

  // Actualizar asociaciones seleccionadas cuando cambian los registros relacionados
  useEffect(() => {
    // Inicializar empresas seleccionadas con las empresas asociadas
    if (associatedCompanies.length > 0) {
      const companyIds = associatedCompanies.map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
      if (companyIds.length > 0) {
        setSelectedCompanies(prev => {
          // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
          const combined = [...prev, ...companyIds];
          const unique = combined.filter((id, index) => combined.indexOf(id) === index);
          // Solo actualizar si hay cambios para evitar loops infinitos
          if (unique.length !== prev.length || unique.some(id => !prev.includes(id))) {
            return unique;
          }
          return prev;
        });
      }
    }
    
    // Inicializar negocios seleccionados con los negocios asociados
    if (associatedDeals.length > 0) {
      const dealIds = associatedDeals.map((d: any) => 1000 + d.id);
      setSelectedAssociations(prev => {
        // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
        const combined = [...prev, ...dealIds];
        const unique = combined.filter((id, index) => combined.indexOf(id) === index);
        // Solo actualizar si hay cambios para evitar loops infinitos
        if (unique.length !== prev.length || unique.some(id => !prev.includes(id))) {
          return unique;
        }
        return prev;
      });
    }
    
    // Inicializar tickets seleccionados con los tickets asociados
    if (associatedTickets.length > 0) {
      const ticketIds = associatedTickets.map((t: any) => 2000 + t.id);
      setSelectedAssociations(prev => {
        // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
        const combined = [...prev, ...ticketIds];
        const unique = combined.filter((id, index) => combined.indexOf(id) === index);
        // Solo actualizar si hay cambios para evitar loops infinitos
        if (unique.length !== prev.length || unique.some(id => !prev.includes(id))) {
          return unique;
        }
        return prev;
      });
    }
    
    // Inicializar contacto seleccionado
    if (contact?.id) {
      setSelectedContacts(prev => {
        if (!prev.includes(contact.id)) {
          return [...prev, contact.id];
        }
        return prev;
      });
    }
  }, [associatedCompanies, associatedDeals, associatedTickets, contact?.id]);

  const fetchAllCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error('Error fetching all companies:', error);
    }
  };

  // Manejar tecla ESC para cerrar paneles
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (noteOpen) setNoteOpen(false);
        if (emailOpen) setEmailOpen(false);
        if (callOpen) setCallOpen(false);
        if (taskOpen) setTaskOpen(false);
        if (meetingOpen) setMeetingOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [noteOpen, emailOpen, callOpen, taskOpen, meetingOpen]);

  // Asegurar que el resumen esté contraído al cambiar de contacto
  useEffect(() => {
    setSummaryExpanded(false);
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await api.get(`/contacts/${id}`);
      setContact(response.data);
      setEmailValue(response.data.email || '');
      setPhoneValue(response.data.phone || '');
      // Usar Companies si está disponible, sino Company (compatibilidad)
      const companies = (response.data.Companies && Array.isArray(response.data.Companies)) 
        ? response.data.Companies 
        : (response.data.Company ? [response.data.Company] : []);
      setCompanyValue(companies.length > 0 ? companies[0].name : '');
      // Actualizar associatedCompanies también
      setAssociatedCompanies(companies);
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociatedRecords = async () => {
    try {
      // Obtener deals asociados
      const dealsResponse = await api.get('/deals', {
        params: { contactId: id },
      });
      setAssociatedDeals(dealsResponse.data.deals || dealsResponse.data || []);

      // Obtener empresas asociadas desde el contacto
      const contactResponse = await api.get(`/contacts/${id}`);
      const updatedContact = contactResponse.data;
      
      // Si estamos removiendo una empresa, no actualizar el estado desde la base de datos
      // para evitar perder las empresas que están en el estado local
      if (!isRemovingCompany) {
        // Usar Companies (muchos-a-muchos) si está disponible, sino usar Company (compatibilidad)
        const companies = (updatedContact?.Companies && Array.isArray(updatedContact.Companies))
          ? updatedContact.Companies
          : (updatedContact?.Company ? [updatedContact.Company] : []);
        setAssociatedCompanies(companies);
      }

      // Obtener actividades
      const activitiesResponse = await api.get('/activities', {
        params: { contactId: id },
      });
      const activitiesData = activitiesResponse.data.activities || activitiesResponse.data || [];

      // Obtener tareas asociadas al contacto
      const tasksResponse = await api.get('/tasks', {
        params: { contactId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];

      // Convertir tareas a formato de actividad para mostrarlas en la lista
      const tasksAsActivities = tasksData.map((task: any) => ({
        id: task.id,
        type: task.type || 'task',
        subject: task.title,
        description: task.description,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        User: task.CreatedBy || task.AssignedTo,
        isTask: true, // Flag para identificar que es una tarea
        status: task.status,
        priority: task.priority,
      }));

      // Combinar actividades y tareas, ordenadas por fecha de creación (más recientes primero)
      const allActivities = [...activitiesData, ...tasksAsActivities].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return dateB - dateA;
      });

      setActivities(allActivities);

      // Obtener tickets asociados
      const ticketsResponse = await api.get('/tickets', {
        params: { contactId: id },
      });
      setAssociatedTickets(ticketsResponse.data.tickets || ticketsResponse.data || []);

      // Obtener suscripciones asociadas
      const subscriptionsResponse = await api.get('/subscriptions', {
        params: { contactId: id },
      });
      setAssociatedSubscriptions(subscriptionsResponse.data.subscriptions || subscriptionsResponse.data || []);

      // Obtener pagos asociados
      const paymentsResponse = await api.get('/payments', {
        params: { contactId: id },
      });
      setAssociatedPayments(paymentsResponse.data.payments || paymentsResponse.data || []);
    } catch (error) {
      console.error('Error fetching associated records:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Funciones para abrir diálogos
  const handleOpenNote = () => {
    setNoteData({ subject: '', description: '' });
    setCreateFollowUpTask(false);
    setNoteOpen(true);
  };

  // Ya no se usa login individual de Google - se usa el token guardado desde Perfil

  const handleOpenEmail = async () => {
    if (!contact?.email) {
      setWarningMessage('El contacto no tiene un email registrado');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    // Verificar si hay token guardado en el backend
    try {
      const response = await api.get('/google/token');
      const hasToken = response.data.hasToken && !response.data.isExpired;
      
      if (hasToken) {
        // Ya está conectado, abrir el modal directamente
        setEmailOpen(true);
        return;
      }
    } catch (error: any) {
      // Si no hay token (404) o hay otro error, mostrar mensaje
      if (error.response?.status === 404) {
        setWarningMessage('Por favor, conecta tu correo desde Configuración > Perfil > Correo para poder enviar emails');
        setTimeout(() => setWarningMessage(''), 5000);
        return;
      }
    }

    // Si llegamos aquí, no hay token guardado
    setWarningMessage('Por favor, conecta tu correo desde Configuración > Perfil > Correo para poder enviar emails');
    setTimeout(() => setWarningMessage(''), 5000);
  };

  const handleSendEmail = async (emailData: { to: string; subject: string; body: string }) => {
    try {
      // Enviar email a través del backend (el backend obtendrá el token automáticamente)
      await api.post('/emails/send', {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
      });

      // Registrar como actividad
      const companies = (contact?.Companies && Array.isArray(contact.Companies))
        ? contact.Companies
        : (contact?.Company ? [contact.Company] : []);

      if (companies.length > 0) {
        const activityPromises = companies.map((company: any) =>
          api.post('/activities', {
            type: 'email',
            subject: emailData.subject,
            description: emailData.body.replace(/<[^>]*>/g, ''), // Remover HTML para la descripción
            contactId: id,
            companyId: company.id,
          })
        );
        await Promise.all(activityPromises);
      } else {
        await api.post('/activities', {
          type: 'email',
          subject: emailData.subject,
          description: emailData.body.replace(/<[^>]*>/g, ''),
          contactId: id,
        });
      }

      // Actualizar actividades
      fetchAssociatedRecords();
    } catch (error: any) {
      // Si el token expiró o no hay token, mostrar mensaje
      if (error.response?.status === 401) {
        throw new Error('Por favor, conecta tu correo desde Configuración > Perfil > Correo');
      }
      throw error;
    }
  };

  const handleOpenCall = () => {
    setCallData({ subject: '', description: '', duration: '' });
    setCallOpen(true);
  };

  const handleOpenTask = () => {
    setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setTaskOpen(true);
  };

  const handleOpenMeeting = () => {
    setMeetingData({ subject: '', description: '', date: '', time: '' });
    setMeetingOpen(true);
  };

  // Funciones para guardar
  const handleSaveNote = async () => {
    if (!noteData.description.trim()) {
      setSuccessMessage('');
      return;
    }
    setSaving(true);
    
    // Variables para debugging
    let contactsToCreateNote: number[] = [];
    let finalContactIds: number[] = [];
    let companiesToAssociate: number[] = [];
    
    try {
      // Obtener contactos seleccionados (incluyendo el contacto actual si no está excluido)
      contactsToCreateNote = selectedContacts.filter(contactId => !excludedContacts.includes(contactId));
      
      // Si no hay contactos seleccionados, usar el contacto actual
      finalContactIds = contactsToCreateNote.length > 0 ? contactsToCreateNote : (contact?.id ? [contact.id] : []);
      
      if (finalContactIds.length === 0) {
        setSuccessMessage('Error: No hay contactos seleccionados');
        setTimeout(() => setSuccessMessage(''), 3000);
        setSaving(false);
        return;
      }

      // Obtener empresas seleccionadas
      companiesToAssociate = selectedCompanies.filter(companyId => !excludedCompanies.includes(companyId));
      
      // Crear notas para cada contacto seleccionado
      const activityPromises: Promise<any>[] = [];
      
      for (const contactId of finalContactIds) {
        // Obtener información del contacto para el subject
        let contactName = `Contacto ${contactId}`;
        try {
          const contactResponse = await api.get(`/contacts/${contactId}`);
          const contactData = contactResponse.data;
          contactName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || contactName;
        } catch (e) {
          console.error(`Error fetching contact ${contactId}:`, e);
        }

        if (companiesToAssociate.length > 0) {
          // Crear una nota para cada combinación de contacto y empresa
          for (const companyId of companiesToAssociate) {
            activityPromises.push(
              api.post('/activities', {
                type: 'note',
                subject: noteData.subject || `Nota para ${contactName}`,
                description: noteData.description,
                contactId: contactId,
                companyId: companyId,
              })
            );
          }
        } else {
          // Crear nota solo con el contacto (sin empresa)
          activityPromises.push(
            api.post('/activities', {
              type: 'note',
              subject: noteData.subject || `Nota para ${contactName}`,
              description: noteData.description,
              contactId: contactId,
            })
          );
        }
      }
      
      // Ejecutar todas las creaciones en paralelo
      await Promise.all(activityPromises);
      
      // Crear tarea de seguimiento si está marcada (solo para el primer contacto)
      if (createFollowUpTask && finalContactIds.length > 0) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3); // 3 días laborables
        
        // Obtener nombre del primer contacto
        let firstContactName = `Contacto ${finalContactIds[0]}`;
        try {
          const contactResponse = await api.get(`/contacts/${finalContactIds[0]}`);
          const contactData = contactResponse.data;
          firstContactName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || firstContactName;
        } catch (e) {
          console.error(`Error fetching contact ${finalContactIds[0]}:`, e);
        }
        
        await api.post('/tasks', {
          title: `Seguimiento de nota: ${noteData.subject || `Nota para ${firstContactName}`}`,
          description: `Tarea de seguimiento generada automáticamente por la nota: ${noteData.description}`,
          type: 'todo',
          status: 'not started',
          priority: 'medium',
          dueDate: followUpDate.toISOString().split('T')[0],
          contactId: finalContactIds[0],
        });
      }
      
      const noteCount = activityPromises.length;
      setSuccessMessage(`Nota${noteCount > 1 ? 's' : ''} creada${noteCount > 1 ? 's' : ''} exitosamente${createFollowUpTask ? ' y tarea de seguimiento creada' : ''}`);
      setNoteOpen(false);
      setNoteData({ subject: '', description: '' });
      setCreateFollowUpTask(false);
      setSelectedContacts([]);
      setSelectedCompanies([]);
      setExcludedContacts([]);
      setExcludedCompanies([]);
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving note:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        selectedContacts,
        finalContactIds: contactsToCreateNote.length > 0 ? contactsToCreateNote : (contact?.id ? [contact.id] : []),
        companiesToAssociate,
      });
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Error desconocido';
      setSuccessMessage(`Error al crear la nota: ${errorMessage}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailData.subject.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Obtener empresas asociadas al contacto
      const companies = (contact?.Companies && Array.isArray(contact.Companies))
        ? contact.Companies
        : (contact?.Company ? [contact.Company] : []);

      // Crear una actividad para cada empresa asociada, o solo con contactId si no hay empresas
      if (companies.length > 0) {
        // Crear actividad para cada empresa asociada
        const activityPromises = companies.map((company: any) =>
          api.post('/activities', {
            type: 'email',
            subject: emailData.subject,
            description: emailData.description,
            contactId: id,
            companyId: company.id,
          })
        );
        await Promise.all(activityPromises);
      } else {
        // Si no hay empresas asociadas, crear solo con contactId
        await api.post('/activities', {
          type: 'email',
          subject: emailData.subject,
          description: emailData.description,
          contactId: id,
        });
      }
      setSuccessMessage('Email registrado exitosamente');
      setEmailOpen(false);
      setEmailData({ subject: '', description: '', to: '' });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving email:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCall = async () => {
    if (!callData.subject.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Obtener empresas asociadas al contacto
      const companies = (contact?.Companies && Array.isArray(contact.Companies))
        ? contact.Companies
        : (contact?.Company ? [contact.Company] : []);

      // Crear una actividad para cada empresa asociada, o solo con contactId si no hay empresas
      if (companies.length > 0) {
        // Crear actividad para cada empresa asociada
        const activityPromises = companies.map((company: any) =>
          api.post('/activities', {
            type: 'call',
            subject: callData.subject,
            description: callData.description,
            contactId: id,
            companyId: company.id,
          })
        );
        await Promise.all(activityPromises);
      } else {
        // Si no hay empresas asociadas, crear solo con contactId
        await api.post('/activities', {
          type: 'call',
          subject: callData.subject,
          description: callData.description,
          contactId: id,
        });
      }
      setSuccessMessage('Llamada registrada exitosamente');
      setCallOpen(false);
      setCallData({ subject: '', description: '', duration: '' });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving call:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTask = async () => {
    if (!taskData.title.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Obtener empresas asociadas al contacto
      const companies = (contact?.Companies && Array.isArray(contact.Companies))
        ? contact.Companies
        : (contact?.Company ? [contact.Company] : []);

      // Preparar datos de la tarea
      const taskPayload = {
        title: taskData.title,
        description: taskData.description,
        type: 'todo',
        status: 'not started',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || undefined,
        contactId: id,
      };

      // Crear una tarea para cada empresa asociada, o solo con contactId si no hay empresas
      if (companies.length > 0) {
        // Crear tarea para cada empresa asociada
        const taskPromises = companies.map((company: any) =>
          api.post('/tasks', {
            ...taskPayload,
            companyId: company.id,
          })
        );
        await Promise.all(taskPromises);
      } else {
        // Si no hay empresas asociadas, crear solo con contactId
        await api.post('/tasks', taskPayload);
      }
      setSuccessMessage('Tarea creada exitosamente' + (taskData.dueDate ? ' y sincronizada con Google Calendar' : ''));
      setTaskOpen(false);
      setTaskData({ title: '', description: '', priority: 'medium', dueDate: '' });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving task:', error);
      setSuccessMessage('Error al crear la tarea');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeeting = async () => {
    if (!meetingData.subject.trim()) {
      return;
    }
    setSaving(true);
    try {
      const dueDate = meetingData.date && meetingData.time 
        ? new Date(`${meetingData.date}T${meetingData.time}`).toISOString()
        : undefined;

      await api.post('/tasks', {
        title: meetingData.subject,
        description: meetingData.description,
        type: 'meeting',
        status: 'not started',
        priority: 'medium',
        dueDate: dueDate,
        contactId: id,
      });
      setSuccessMessage('Reunión creada exitosamente' + (dueDate ? ' y sincronizada con Google Calendar' : ''));
      setMeetingOpen(false);
      setMeetingData({ subject: '', description: '', date: '', time: '' });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving meeting:', error);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para la pestaña Descripción
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
        setRucError('Error al buscar RUC. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleAddCompany = async () => {
    try {
      const response = await api.post('/companies', {
        ...companyFormData,
        // No asociar automáticamente con el contacto - el usuario debe agregarla manualmente
      });
      setSuccessMessage('Empresa creada exitosamente');
      setAddCompanyOpen(false);
      setCompanyFormData({ 
        name: '', 
        domain: '', 
        phone: '', 
        industry: '', 
        lifecycleStage: 'lead',
        ruc: '',
        address: '',
        city: '',
        state: '',
        country: '',
      });
      setRucError('');
      setCompanyDialogTab('create');
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding company:', error);
    }
  };

  const handleAddExistingCompanies = async () => {
    try {
      if (selectedExistingCompanies.length === 0) {
        return;
      }

      // Agregar empresas usando el nuevo endpoint muchos-a-muchos
      const response = await api.post(`/contacts/${id}/companies`, {
        companyIds: selectedExistingCompanies,
      });
      
      // Actualizar el contacto y las empresas asociadas
      setContact(response.data);
      const companies = (response.data.Companies && Array.isArray(response.data.Companies))
        ? response.data.Companies
        : (response.data.Company ? [response.data.Company] : []);
      setAssociatedCompanies(companies);
      
      // También agregar a selectedCompanies para que se cuenten en las asociaciones
      const newCompanyIds = selectedExistingCompanies.filter((id: number) => 
        !selectedCompanies.includes(id)
      );
      setSelectedCompanies([...selectedCompanies, ...newCompanyIds]);
      
      setSuccessMessage(`${selectedExistingCompanies.length} empresa(s) agregada(s) exitosamente`);
      
      setAddCompanyOpen(false);
      setSelectedExistingCompanies([]);
      setExistingCompaniesSearch('');
      setCompanyDialogTab('create');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error associating companies:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al asociar las empresas';
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleOpenAddCompanyDialog = () => {
    setCompanyDialogTab('create');
    setSelectedExistingCompanies([]);
    setExistingCompaniesSearch('');
    setCompanyFormData({ 
      name: '', 
      domain: '', 
      phone: '', 
      industry: '', 
      lifecycleStage: 'lead',
      ruc: '',
      address: '',
      city: '',
      state: '',
      country: '',
    });
    setRucError('');
    setAddCompanyOpen(true);
    // Cargar empresas disponibles cuando se abre el diálogo
    if (allCompanies.length === 0) {
      fetchAllCompanies();
    }
  };

  const handleRemoveCompanyAssociation = async (companyId: number) => {
    try {
      setIsRemovingCompany(true);
      
      // Verificar si esta empresa está asociada al contacto
      const isAssociated = associatedCompanies.some((c: any) => c && c.id === companyId);
      
      if (!isAssociated) {
        setSuccessMessage('Esta empresa no está asociada con este contacto');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsRemovingCompany(false);
        return;
      }

      // Eliminar la asociación usando el nuevo endpoint
      const response = await api.delete(`/contacts/${id}/companies/${companyId}`);
      
      // Actualizar el contacto y las empresas asociadas
      setContact(response.data);
      const companies = response.data.Companies || [];
      setAssociatedCompanies(companies);
      
      // También remover de selectedCompanies y excludedCompanies
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
      setExcludedCompanies(excludedCompanies.filter(id => id !== companyId));
      
      setSuccessMessage('Asociación eliminada exitosamente');
      setCompanyActionsMenu({});
      setIsRemovingCompany(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error removing company association:', error);
      setSuccessMessage('Error al eliminar la asociación');
      setIsRemovingCompany(false);
      // Revertir el cambio si hay error
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleOpenCompanyActionsMenu = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
    event.stopPropagation();
    setCompanyActionsMenu({
      ...companyActionsMenu,
      [companyId]: event.currentTarget,
    });
  };

  const handleCloseCompanyActionsMenu = (companyId: number) => {
    setCompanyActionsMenu({
      ...companyActionsMenu,
      [companyId]: null,
    });
  };

  const handleAddDeal = async () => {
    try {
      await api.post('/deals', {
        ...dealFormData,
        amount: parseFloat(dealFormData.amount) || 0,
        contactId: id,
        companyId: contact?.Company?.id,
      });
      setSuccessMessage('Negocio agregado exitosamente');
      setAddDealOpen(false);
      setDealFormData({ name: '', amount: '', stage: 'lead', closeDate: '', priority: 'medium' });
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding deal:', error);
    }
  };

  const handleAddTicket = async () => {
    try {
      await api.post('/tickets', {
        ...ticketFormData,
        contactId: id,
        // No asociar automáticamente con la empresa - el usuario debe agregarla manualmente si lo desea
      });
      setSuccessMessage('Ticket creado exitosamente');
      setAddTicketOpen(false);
      setTicketFormData({ subject: '', description: '', status: 'new', priority: 'medium' });
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding ticket:', error);
    }
  };

  const handleAddSubscription = async () => {
    try {
      await api.post('/subscriptions', {
        ...subscriptionFormData,
        amount: parseFloat(subscriptionFormData.amount) || 0,
        contactId: id,
        companyId: contact?.Company?.id,
      });
      setSuccessMessage('Suscripción creada exitosamente');
      setAddSubscriptionOpen(false);
      setSubscriptionFormData({ name: '', description: '', status: 'active', amount: '', currency: 'USD', billingCycle: 'monthly', startDate: '', endDate: '', renewalDate: '' });
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  const handleAddPayment = async () => {
    try {
      await api.post('/payments', {
        ...paymentFormData,
        amount: parseFloat(paymentFormData.amount) || 0,
        contactId: id,
        companyId: contact?.Company?.id,
      });
      setSuccessMessage('Pago creado exitosamente');
      setAddPaymentOpen(false);
      setPaymentFormData({ amount: '', currency: 'USD', status: 'pending', paymentDate: '', dueDate: '', paymentMethod: 'credit_card', reference: '', description: '' });
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const handleCreateActivity = (type: string) => {
    setCreateActivityMenuAnchor(null);
    switch (type) {
      case 'note':
        handleOpenNote();
        break;
      case 'email':
        // Abrir Gmail con el correo del contacto prellenado
        const email = contact?.email || '';
        const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`;
        window.open(gmailUrl, '_blank');
        break;
      case 'call':
        handleOpenCall();
        break;
      case 'task':
        handleOpenTask();
        break;
      case 'meeting':
        handleOpenMeeting();
        break;
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copiado al portapapeles');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleSortDeals = (field: string) => {
    if (dealSortField === field) {
      setDealSortOrder(dealSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setDealSortField(field);
      setDealSortOrder('asc');
    }
  };

  const handleSortCompanies = (field: string) => {
    if (companySortField === field) {
      setCompanySortOrder(companySortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setCompanySortField(field);
      setCompanySortOrder('asc');
    }
  };

  const sortedDeals = [...associatedDeals].sort((a, b) => {
    if (!dealSortField) return 0;
    let aVal: any = a[dealSortField];
    let bVal: any = b[dealSortField];
    
    if (dealSortField === 'amount') {
      aVal = aVal || 0;
      bVal = bVal || 0;
    } else if (dealSortField === 'closeDate') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }
    
    if (aVal < bVal) return dealSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return dealSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedCompanies = [...associatedCompanies].sort((a, b) => {
    if (!companySortField) return 0;
    let aVal: any = a[companySortField];
    let bVal: any = b[companySortField];
    
    aVal = String(aVal || '').toLowerCase();
    bVal = String(bVal || '').toLowerCase();
    
    if (aVal < bVal) return companySortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return companySortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredActivities = activities.filter((activity) => {
    // Filtro por búsqueda de texto
    if (activitySearch && !activity.subject?.toLowerCase().includes(activitySearch.toLowerCase()) &&
        !activity.description?.toLowerCase().includes(activitySearch.toLowerCase())) {
      return false;
    }
    
    // Filtro por tipo de actividad según los filtros de comunicación y actividad del equipo
    const activityType = activity.type?.toLowerCase();
    
    // Si es una nota, verificar filtro de "Actividad del equipo" -> "Notas"
    if (activityType === 'note') {
      if (!teamActivityFilters.notes) {
        return false;
      }
    }
    // Si es una reunión, verificar filtro de "Actividad del equipo" -> "Reuniones"
    else if (activityType === 'meeting') {
      if (!teamActivityFilters.meetings) {
        return false;
      }
    }
    // Si es una tarea, verificar filtro de "Actividad del equipo" -> "Tareas"
    else if (activityType === 'task') {
      if (!teamActivityFilters.tasks) {
        return false;
      }
    }
    // Si es un correo, verificar filtro de "Comunicación" -> "Correos"
    else if (activityType === 'email') {
      if (!communicationFilters.email) {
        return false;
      }
    }
    // Si es una llamada, verificar filtro de "Comunicación" -> "Llamadas"
    else if (activityType === 'call') {
      if (!communicationFilters.calls) {
        return false;
      }
    }
    
    return true;
  });

  const filteredCompanies = sortedCompanies.filter((company) => {
    if (companySearch && !company.name?.toLowerCase().includes(companySearch.toLowerCase()) &&
        !company.domain?.toLowerCase().includes(companySearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredDeals = sortedDeals.filter((deal) => {
    if (dealSearch && !deal.name?.toLowerCase().includes(dealSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Función para obtener el rango de fechas según la opción seleccionada
  const getDateRange = (range: string): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'Todo hasta ahora':
      case 'Todo':
        return { start: null, end: null };
      
      case 'Hoy':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      
      case 'Ayer':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      
      case 'Esta semana':
        const dayOfWeek = today.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(today.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
        return {
          start: weekStart,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      
      case 'Semana pasada':
        const lastWeekDayOfWeek = today.getDay();
        const lastWeekDaysFromMonday = lastWeekDayOfWeek === 0 ? 6 : lastWeekDayOfWeek - 1;
        const lastWeekStart = new Date(today.getTime() - (lastWeekDaysFromMonday + 7) * 24 * 60 * 60 * 1000);
        const lastWeekEnd = new Date(today.getTime() - (lastWeekDaysFromMonday + 1) * 24 * 60 * 60 * 1000);
        return {
          start: lastWeekStart,
          end: new Date(lastWeekEnd.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      
      case 'Últimos 7 días':
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      
      default:
        return { start: null, end: null };
    }
  };

  // Filtrar actividades por rango de tiempo
  const timeFilteredActivities = filteredActivities.filter((activity) => {
    if (!activity.createdAt) return false;
    
    const dateRange = getDateRange(selectedTimeRange);
    if (!dateRange.start && !dateRange.end) return true; // "Todo hasta ahora"
    
    const activityDate = new Date(activity.createdAt);
    activityDate.setHours(0, 0, 0, 0);
    
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      if (activityDate < startDate) return false;
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (activityDate > endDate) return false;
    }
    
    return true;
  });

  // Agrupar actividades por mes/año
  const groupedActivities = timeFilteredActivities.reduce((acc: { [key: string]: any[] }, activity) => {
    if (!activity.createdAt) return acc;
    const date = new Date(activity.createdAt);
    const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(activity);
    return acc;
  }, {});

  // Funciones para manejar notas y actividades
  const toggleNoteExpand = (noteId: number) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const toggleActivityExpand = (activityId: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleNoteActionMenuOpen = (event: React.MouseEvent<HTMLElement>, noteId: number) => {
    event.stopPropagation();
    setNoteActionMenus({ ...noteActionMenus, [noteId]: event.currentTarget });
  };

  const handleNoteActionMenuClose = (noteId: number) => {
    setNoteActionMenus({ ...noteActionMenus, [noteId]: null });
  };

  const handlePinNote = async (noteId: number) => {
    // TODO: Implementar funcionalidad de anclar
    console.log('Anclar nota:', noteId);
    handleNoteActionMenuClose(noteId);
  };

  const handleViewHistory = (noteId: number) => {
    // TODO: Implementar historial
    console.log('Ver historial:', noteId);
    handleNoteActionMenuClose(noteId);
  };

  const handleCopyLink = async (noteId: number) => {
    try {
      const noteUrl = `${window.location.origin}/contacts/${id}?activity=${noteId}`;
      await navigator.clipboard.writeText(noteUrl);
      setSuccessMessage('Enlace copiado al portapapeles');
      setTimeout(() => setSuccessMessage(''), 3000);
      handleNoteActionMenuClose(noteId);
    } catch (error) {
      console.error('Error al copiar enlace:', error);
      setSuccessMessage('Error al copiar enlace');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      handleNoteActionMenuClose(noteId);
      return;
    }
    
    try {
      await api.delete(`/activities/${noteId}`);
      setSuccessMessage('Nota eliminada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      handleNoteActionMenuClose(noteId);
      
      // Eliminar la nota del estado local inmediatamente
      setActivities(activities.filter(activity => activity.id !== noteId));
      
      // También actualizar desde el servidor para asegurar consistencia
      fetchAssociatedRecords();
    } catch (error: any) {
      console.error('Error al eliminar nota:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar la nota';
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box>
        <Typography>Contacto no encontrado</Typography>
        <Button onClick={() => navigate('/contacts')}>Volver a Contactos</Button>
      </Box>
    );
  }

  return (
      <Box sx={{ 
        bgcolor: theme.palette.background.default,
        height: { xs: 'auto', md: '100vh' },
        minHeight: { xs: '100vh', md: '100vh' },
        pb: { xs: 0, sm: 0, md: 0 },
        px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
        pt: { xs: 2, sm: 2.5, md: 3 },
        display: 'flex', 
        flexDirection: 'column',
        overflow: { xs: 'visible', md: 'hidden' },
      }}>

      {/* Contenido principal - Separado en 2 partes */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 3 },
        flex: 1,
        overflow: { xs: 'visible', md: 'hidden' },
        minHeight: { xs: 'auto', md: 0 },
        height: { xs: 'auto', md: '100%' },
        maxHeight: { xs: 'none', md: '100%' },
        alignItems: { xs: 'stretch', md: 'stretch' },
      }}>
        {/* Parte 1: Columna Izquierda - Información del Contacto */}
        <Card sx={{ 
          borderRadius: { xs: 2, md: 6 },
          boxShadow: 'none',
          overflow: { xs: 'visible', md: 'hidden' },
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', sm: '100%', md: '400px', lg: '450px', xl: '500px' },
          minWidth: { xs: '100%', sm: '280px', md: '350px' },
          maxWidth: { xs: '100%', md: '500px' },
          flexShrink: 0,
          flexGrow: 1,
          height: { xs: 'auto', md: 'calc(100% - 20px)' },
          minHeight: { xs: 'auto', md: 0 },
          mb: { xs: 0, md: 2 },
          px: { xs: 1, sm: 1.5, md: 2 },
          pt: { xs: 1, sm: 1.5, md: 2 },
          pb: { xs: 0, sm: 0, md: 0.5 }
        }}>
        {/* Columna Izquierda - Información del Contacto */}
        <Box sx={{ 
          width: '100%', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: { xs: 'none', md: '100%' },
          overflowY: { xs: 'visible', md: 'scroll' },
          overflowX: 'hidden',
          animation: 'slideInLeft 0.4s ease',
          '@keyframes slideInLeft': {
            '0%': {
              opacity: 0,
              transform: 'translateX(-20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
          // Estilos para la barra de desplazamiento - siempre visible
          '&::-webkit-scrollbar': {
            width: '12px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            margin: '8px 0',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
            borderRadius: '6px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              backgroundClip: 'padding-box',
            },
          },
          // Para Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.4) rgba(0, 0, 0, 0.15)',
        }}>
          <Paper sx={{ 
            px: 3,
            pt: 3,
            pb: { xs: 2, sm: 2.5, md: 2.5 },
            bgcolor: theme.palette.background.paper,
            boxShadow: 'none',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            '&:hover': {
              boxShadow: 'none',
            },
          }}>
            {/* Avatar y Nombre */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: contact.avatar ? 'transparent' : '#2E7D32',
                    fontSize: '3rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                  src={contact.avatar}
                >
                  {!contact.avatar && getInitials(contact.firstName, contact.lastName)}
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
                {contact.firstName} {contact.lastName}
              </Typography>
              {contact.email && (
                <Typography 
                  variant="body2"
                  align="center"
                  sx={{
                    fontSize: '0.875rem',
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                  }}
                >
                  {contact.email}
                </Typography>
              )}
            </Box>

            {/* Acciones Rápidas */}
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, mb: 3, justifyContent: 'center', flexWrap: 'nowrap' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                <IconButton
                  onClick={handleOpenNote}
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
                  onClick={handleOpenEmail}
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
                  onClick={handleOpenCall}
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
                  onClick={handleOpenTask}
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
                  onClick={handleOpenMeeting}
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
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                <IconButton
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
                  <MoreVert sx={{ fontSize: 22 }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                  Más
                </Typography>
              </Box>
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

            {/* Información del contacto */}
            <Card sx={{ 
              mb: { xs: 1, md: 1.5 }, 
              p: 3, 
              borderRadius: 2, 
              boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
            }}>
            {/* Location */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.875rem',
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
                  color: (contact.city || contact.address) ? theme.palette.text.primary : theme.palette.text.disabled,
                  textAlign: 'right',
                }}
              >
                {contact.city || contact.address || '--'}
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
                  Phone
                </Typography>
              </Box>
              {editingPhone ? (
                <TextField
                  size="small"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  onBlur={async () => {
                    try {
                      await api.put(`/contacts/${contact.id}`, { phone: phoneValue });
                      setContact({ ...contact, phone: phoneValue });
                      setEditingPhone(false);
                    } catch (error) {
                      console.error('Error updating phone:', error);
                      setPhoneValue(contact.phone || '');
                      setEditingPhone(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  autoFocus
                  sx={{
                    width: '200px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      '& fieldset': {
                        borderColor: '#00bcd4',
                      },
                    },
                  }}
                />
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: contact.phone ? theme.palette.text.primary : theme.palette.text.disabled,
                    cursor: 'pointer',
                    textAlign: 'right',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                  onClick={() => setEditingPhone(true)}
                >
                  {contact.phone || '--'}
                </Typography>
              )}
            </Box>

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
                  Email
                </Typography>
              </Box>
              {editingEmail ? (
                <TextField
                  size="small"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  onBlur={async () => {
                    try {
                      await api.put(`/contacts/${contact.id}`, { email: emailValue });
                      setContact({ ...contact, email: emailValue });
                      setEditingEmail(false);
                    } catch (error) {
                      console.error('Error updating email:', error);
                      setEmailValue(contact.email || '');
                      setEditingEmail(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  autoFocus
                  sx={{
                    width: '200px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      '& fieldset': {
                        borderColor: '#00bcd4',
                      },
                    },
                  }}
                />
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: contact.email ? theme.palette.text.primary : theme.palette.text.disabled,
                    cursor: 'pointer',
                    textAlign: 'right',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                  onClick={() => setEditingEmail(true)}
                >
                  {contact.email || '--'}
                </Typography>
              )}
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
              {editingCompany ? (
                <TextField
                  size="small"
                  value={companyValue}
                  onChange={(e) => setCompanyValue(e.target.value)}
                  onBlur={async () => {
                    try {
                      const trimmedValue = companyValue.trim();
                      
                      // Si el campo está vacío, no hacer nada
                      if (!trimmedValue) {
                        setEditingCompany(false);
                        return;
                      }

                      // Buscar la empresa por nombre en todas las empresas disponibles
                      if (allCompanies.length === 0) {
                        await fetchAllCompanies();
                      }

                      const foundCompany = allCompanies.find((c: any) => 
                        c.name.toLowerCase() === trimmedValue.toLowerCase()
                      );

                      if (foundCompany) {
                        // Si la empresa existe, asociarla con el contacto usando la relación muchos-a-muchos
                        const response = await api.post(`/contacts/${id}/companies`, {
                          companyIds: [foundCompany.id],
                        });
                        
                        // Actualizar el contacto y las empresas asociadas
                        setContact(response.data);
                        const companies = (response.data.Companies && Array.isArray(response.data.Companies))
                          ? response.data.Companies
                          : (response.data.Company ? [response.data.Company] : []);
                        setAssociatedCompanies(companies);
                        setCompanyValue(foundCompany.name);
                      } else {
                        // Si la empresa no existe, crear una nueva empresa y asociarla
                        const newCompanyResponse = await api.post('/companies', {
                          name: trimmedValue,
                          lifecycleStage: 'lead',
                        });
                        
                        // Asociar la nueva empresa con el contacto
                        const response = await api.post(`/contacts/${id}/companies`, {
                          companyIds: [newCompanyResponse.data.id],
                        });
                        
                        // Actualizar el contacto y las empresas asociadas
                        setContact(response.data);
                        const companies = (response.data.Companies && Array.isArray(response.data.Companies))
                          ? response.data.Companies
                          : (response.data.Company ? [response.data.Company] : []);
                        setAssociatedCompanies(companies);
                        setCompanyValue(trimmedValue);
                        
                        // Actualizar la lista de empresas disponibles
                        await fetchAllCompanies();
                      }
                      
                      setEditingCompany(false);
                    } catch (error) {
                      console.error('Error updating company:', error);
                      // Revertir al valor anterior en caso de error
                      const companies = (contact.Companies && Array.isArray(contact.Companies))
                        ? contact.Companies
                        : (contact.Company ? [contact.Company] : []);
                      setCompanyValue(companies.length > 0 ? companies[0].name : '');
                      setEditingCompany(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  autoFocus
                  sx={{
                    width: '200px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      '& fieldset': {
                        borderColor: '#00bcd4',
                      },
                    },
                  }}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      color: companyValue || (contact.Companies && contact.Companies.length > 0) ? theme.palette.text.primary : theme.palette.text.disabled,
                      cursor: 'pointer',
                      textAlign: 'right',
                      '&:hover': {
                        textDecoration: 'underline',
                        textDecorationColor: '#00bcd4',
                      },
                    }}
                    onClick={() => {
                      // Inicializar el valor con la primera empresa asociada o la empresa principal
                      const companies = (contact.Companies && Array.isArray(contact.Companies))
                        ? contact.Companies
                        : (contact.Company ? [contact.Company] : []);
                      setCompanyValue(companies.length > 0 ? companies[0].name : '');
                      setEditingCompany(true);
                    }}
                  >
                    {companyValue || (contact.Companies && contact.Companies.length > 0 
                      ? contact.Companies[0].name 
                      : (contact.Company?.name || '--'))}
                  </Typography>
                  <KeyboardArrowDown sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                </Box>
              )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  onClick={(e) => setLeadStatusMenuAnchor(e.currentTarget)}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: contact.leadStatus ? theme.palette.text.primary : theme.palette.text.disabled,
                    cursor: 'pointer',
                    textAlign: 'right',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                >
                  {contact.leadStatus || '--'}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: 14, color: '#9E9E9E' }} />
              </Box>
              <Menu
                anchorEl={leadStatusMenuAnchor}
                open={Boolean(leadStatusMenuAnchor)}
                onClose={() => setLeadStatusMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    minWidth: 200,
                    mt: 0.5,
                  },
                }}
              >
                {['Nuevo', 'Contactado', 'Calificado', 'Interesado', 'No calificado', 'Perdido'].map((status) => (
                  <MenuItem
                    key={status}
                    onClick={async () => {
                      try {
                        await api.put(`/contacts/${contact.id}`, { leadStatus: status });
                        setContact({ ...contact, leadStatus: status });
                        setLeadStatusMenuAnchor(null);
                      } catch (error) {
                        console.error('Error updating lead status:', error);
                      }
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      backgroundColor: contact.leadStatus === status ? '#e3f2fd' : 'transparent',
                    }}
                  >
                    {status}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Etapa del ciclo de vida */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <TrendingUp sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  onClick={(e) => setLifecycleStageMenuAnchor(e.currentTarget)}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.primary,
                    cursor: 'pointer',
                    textAlign: 'right',
                    textDecoration: 'none',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  {getStageLabel(contact.lifecycleStage)}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: 14, color: '#9E9E9E' }} />
              </Box>
              <Menu
                anchorEl={lifecycleStageMenuAnchor}
                open={Boolean(lifecycleStageMenuAnchor)}
                onClose={() => setLifecycleStageMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    minWidth: 200,
                    mt: 0.5,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.5)' 
                      : '0 4px 12px rgba(0,0,0,0.15)',
                    border: theme.palette.mode === 'dark' 
                      ? `1px solid ${theme.palette.divider}` 
                      : 'none',
                  },
                }}
              >
                {['lead_inactivo', 'cliente_perdido', 'cierre_perdido', 'lead', 'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado', 'firma_contrato', 'activo'].map((stage) => (
                  <MenuItem
                    key={stage}
                    onClick={async () => {
                      try {
                        await api.put(`/contacts/${contact.id}`, { lifecycleStage: stage });
                        setContact({ ...contact, lifecycleStage: stage });
                        setLifecycleStageMenuAnchor(null);
                        fetchContact(); // Refrescar para obtener datos actualizados
                      } catch (error) {
                        console.error('Error updating lifecycle stage:', error);
                      }
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.primary,
                      backgroundColor: contact.lifecycleStage === stage 
                        ? (theme.palette.mode === 'dark' 
                          ? 'rgba(144, 202, 249, 0.16)' 
                          : '#e3f2fd')
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: contact.lifecycleStage === stage
                          ? (theme.palette.mode === 'dark' 
                            ? 'rgba(144, 202, 249, 0.24)' 
                            : '#bbdefb')
                          : theme.palette.action.hover,
                      },
                    }}
                  >
                    {getStageLabel(stage)}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Propietario del contacto */}
            {contact.Owner && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                  Propietario del contacto
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {contact.Owner.firstName} {contact.Owner.lastName}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  onClick={(e) => setBuyingRoleMenuAnchor(e.currentTarget)}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    color: theme.palette.text.disabled,
                    cursor: 'pointer',
                    textAlign: 'right',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                >
                  --
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: 14, color: '#9E9E9E' }} />
              </Box>
              <Menu
                anchorEl={buyingRoleMenuAnchor}
                open={Boolean(buyingRoleMenuAnchor)}
                onClose={() => setBuyingRoleMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    minWidth: 200,
                    mt: 0.5,
                  },
                }}
              >
                {['Influenciador', 'Decisor', 'Evaluador', 'Usuario final', 'Comprador', 'Gatekeeper'].map((role) => (
                  <MenuItem
                    key={role}
                    onClick={() => {
                      // Aquí puedes agregar la lógica para guardar el rol de compra
                      setBuyingRoleMenuAnchor(null);
                    }}
                    sx={{
                      fontSize: '0.875rem',
                    }}
                  >
                    {role}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            </Card>

            {/* Sección Social */}
            <Card sx={{ 
              mb: 0, 
              px: 2.5,
              pt: 2.5,
              pb: 2.5,
              mt: { xs: 1, md: 1.5 }, 
              borderRadius: 2, 
              boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, flexWrap: 'wrap', pb: 0 }}>
              {/* Facebook */}
              <Tooltip title={contact.facebook || 'Agregar Facebook'} arrow>
                <Link
                  href={contact.facebook || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!contact.facebook || contact.facebook === '#') {
                      e.preventDefault();
                      const currentUrl = contact.facebook || '';
                      const url = prompt('Ingresa la URL de Facebook:', currentUrl || 'https://www.facebook.com/');
                      if (url !== null) {
                        api.put(`/contacts/${contact.id}`, { facebook: url || null }).then(() => {
                          setContact({ ...contact, facebook: url || undefined });
                          fetchContact();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#1877f2', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                    <Facebook sx={{ fontSize: 20 }} />
                  </Avatar>
                </Link>
              </Tooltip>

              {/* Twitter */}
              <Tooltip title={contact.twitter || 'Agregar Twitter'} arrow>
                <Link
                  href={contact.twitter || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!contact.twitter || contact.twitter === '#') {
                      e.preventDefault();
                      const currentUrl = contact.twitter || '';
                      const url = prompt('Ingresa la URL de Twitter:', currentUrl || 'https://www.twitter.com/');
                      if (url !== null) {
                        api.put(`/contacts/${contact.id}`, { twitter: url || null }).then(() => {
                          setContact({ ...contact, twitter: url || undefined });
                          fetchContact();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#1da1f2', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                    <Twitter sx={{ fontSize: 20 }} />
                  </Avatar>
                </Link>
              </Tooltip>

              {/* LinkedIn */}
              <Tooltip title={contact.linkedin || 'Agregar LinkedIn'} arrow>
                <Link
                  href={contact.linkedin || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!contact.linkedin || contact.linkedin === '#') {
                      e.preventDefault();
                      const currentUrl = contact.linkedin || '';
                      const url = prompt('Ingresa la URL de LinkedIn:', currentUrl || 'https://www.linkedin.com/');
                      if (url !== null) {
                        api.put(`/contacts/${contact.id}`, { linkedin: url || null }).then(() => {
                          setContact({ ...contact, linkedin: url || undefined });
                          fetchContact();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#0077b5', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                    <LinkedIn sx={{ fontSize: 20 }} />
                  </Avatar>
                </Link>
              </Tooltip>

              {/* YouTube */}
              <Tooltip title={contact.youtube || 'Agregar YouTube'} arrow>
                <Link
                  href={contact.youtube || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!contact.youtube || contact.youtube === '#') {
                      e.preventDefault();
                      const currentUrl = contact.youtube || '';
                      const url = prompt('Ingresa la URL de YouTube:', currentUrl || 'https://www.youtube.com/');
                      if (url !== null) {
                        api.put(`/contacts/${contact.id}`, { youtube: url || null }).then(() => {
                          setContact({ ...contact, youtube: url || undefined });
                          fetchContact();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#ff0000', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                    <YouTube sx={{ fontSize: 20 }} />
                  </Avatar>
                </Link>
              </Tooltip>
            </Box>
            </Card>

          </Paper>
        </Box>
        </Card>

        {/* Parte 2: Columnas Central y Derecha */}
        <Card sx={{ 
          borderRadius: { xs: 2, md: 6 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: { xs: 'visible', md: 'hidden' },
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: { xs: '100%', sm: '300px', md: '400px' },
          width: { xs: '100%', md: 'auto' },
          height: { xs: 'auto', md: 'calc(100% - 20px)' },
          maxHeight: { xs: 'none', md: 'calc(100% - 20px)' },
          p: { xs: 1, sm: 1.5, md: 2 },
        }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: summaryExpanded ? { xs: 1, md: 2 } : 0,
            flex: 1, 
            overflow: { xs: 'visible', md: 'hidden' },
            minHeight: 0,
            position: 'relative',
            transition: 'gap 0.2s ease',
          }}>
        {/* Columna Central - Pestañas */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          width: { xs: '100%', lg: 'auto' },
          height: { xs: 'auto', md: '100%' },
          minHeight: { xs: '400px', md: 0 },
          maxHeight: { xs: '600px', md: 'none' },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'fadeIn 0.5s ease',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
            },
            '100%': {
              opacity: 1,
            },
          },
        }}>
          <Paper sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            height: '100%',
            minHeight: 0,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons="auto"
              sx={{
                flexShrink: 0,
                '& .MuiTabs-flexContainer': {
                  display: 'flex',
                  width: '100%',
                  padding: { xs: '0 8px', md: '0 24px' },
                },
                '& .MuiTab-root': {
                  transition: 'all 0.2s ease',
                  flex: { xs: '0 0 auto', md: 1 },
                  minWidth: { xs: 'auto', md: 'auto' },
                  maxWidth: { xs: 'none', md: 'none' },
                  padding: { xs: '8px 12px', md: '12px 16px' },
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.04)',
                  },
                },
                '& .Mui-selected': {
                  color: '#2E7D32',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(46, 125, 50, 0.08)',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#2E7D32',
                  height: 3,
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <Tab label="Descripción" />
              <Tab label="Actividades" />
              <Tab label="Información avanzada" />
            </Tabs>

            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              overflowX: 'hidden',
              py: 0.5,
              px: 0.5,
              minHeight: 0,
              // Ocultar scrollbar pero mantener scroll funcional
              '&::-webkit-scrollbar': {
                display: 'none',
                width: 0,
              },
              // Para Firefox
              scrollbarWidth: 'none',
            }}>
              <TabPanel value={tabValue} index={0}>
                {/* Aspectos destacados de los datos */}
                <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  pb: 6,
                  minHeight: '300px',
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Aspectos destacados de los datos
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        FECHA DE CREACIÓN
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {contact.createdAt 
                          ? new Date(contact.createdAt).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) + ' GMT-5'
                          : '--'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        ETAPA DEL CICLO DE VIDA
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'center' }}>
                        <Chip 
                          label={getStageLabel(contact.lifecycleStage)} 
                          color={getStageColor(contact.lifecycleStage)} 
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        ÚLTIMA ACTIVIDAD
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        --
                      </Typography>
                    </Box>
                  </Box>
                </Card>

                {/* Actividades recientes */}
                <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Actividades recientes
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Buscar actividades"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      sx={{
                        width: '300px',
                        transition: 'all 0.3s ease',
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          fontSize: '0.875rem',
                          '&:hover': {
                            '& fieldset': {
                              borderColor: '#2E7D32',
                            },
                          },
                          '&.Mui-focused': {
                            '& fieldset': {
                              borderColor: '#2E7D32',
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
                        borderColor: '#2E7D32',
                        color: '#2E7D32',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#1B5E20',
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
                      {/* Campo de búsqueda */}
                      <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <TextField
                          size="small"
                          placeholder="Buscar"
                          fullWidth
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
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: theme.palette.text.secondary,
                              opacity: 1,
                            },
                          }}
                        />
                      </Box>
                      
                      {/* Opciones del menú */}
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
                      
                      <MenuItem 
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <LinkIcon sx={{ mr: 2, fontSize: 20, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
                          Inscribir en una secuencia
                        </Typography>
                        <Lock sx={{ fontSize: 16, color: theme.palette.text.secondary, ml: 1 }} />
                      </MenuItem>
                    </Menu>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                        },
                      }}
                    />
                    <Menu
                      anchorEl={timeRangeMenuAnchor}
                      open={Boolean(timeRangeMenuAnchor)}
                      onClose={() => setTimeRangeMenuAnchor(null)}
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
                          minWidth: 240,
                          maxWidth: 240,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                          border: theme.palette.mode === 'dark' 
                            ? `1px solid ${theme.palette.divider}` 
                            : 'none',
                          maxHeight: 400,
                          overflow: 'auto',
                          // Estilos de scrollbar adaptados al modo nocturno
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : '1px solid rgba(0, 0, 0, 0.1)',
                            '&:hover': {
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.3)' 
                                : 'rgba(0, 0, 0, 0.3)',
                            },
                          },
                          // Para Firefox
                          scrollbarWidth: 'thin',
                          scrollbarColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    >
                      {/* Campo de búsqueda */}
                      <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <TextField
                          size="small"
                          placeholder="Buscar"
                          fullWidth
                          value={timeRangeSearch}
                          onChange={(e) => setTimeRangeSearch(e.target.value)}
                          autoFocus
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? theme.palette.background.default 
                                : 'white',
                              '& fieldset': {
                                borderColor: theme.palette.mode === 'dark' 
                                  ? theme.palette.divider 
                                  : '#4fc3f7',
                                borderWidth: 1.5,
                              },
                              '&:hover fieldset': {
                                borderColor: theme.palette.mode === 'dark' 
                                  ? theme.palette.action.hover 
                                  : '#4fc3f7',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#4fc3f7',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: theme.palette.text.secondary,
                              opacity: 1,
                            },
                          }}
                        />
                      </Box>
                      
                      {/* Opciones de rango de tiempo */}
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
                      
                      {/* Separador */}
                      <Divider sx={{ my: 0.5, borderColor: theme.palette.divider }} />
                      
                      {/* Período personalizado */}
                      <MenuItem
                        onClick={() => {
                          // TODO: Implementar selector de período personalizado
                          console.log('Período personalizado');
                          setTimeRangeMenuAnchor(null);
                        }}
                        sx={{
                          py: 1.5,
                          px: 2,
                          color: theme.palette.text.secondary,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            color: theme.palette.text.primary,
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'inherit', flexGrow: 1 }}>
                          Período personalizado
                        </Typography>
                        <KeyboardArrowRight sx={{ fontSize: 18, color: 'inherit' }} />
                      </MenuItem>
                    </Menu>
                    <Chip 
                      label="Actividad" 
                      size="small" 
                      deleteIcon={<KeyboardArrowDown fontSize="small" />}
                      onDelete={(e) => setActivityFilterMenuAnchor(e.currentTarget)}
                      onClick={(e) => setActivityFilterMenuAnchor(e.currentTarget)}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                        },
                      }}
                    />
                    <Menu
                      anchorEl={activityFilterMenuAnchor}
                      open={Boolean(activityFilterMenuAnchor)}
                      onClose={() => setActivityFilterMenuAnchor(null)}
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
                          minWidth: 280,
                          maxWidth: 280,
                          borderRadius: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 20px rgba(0,0,0,0.5)' 
                            : '0 4px 20px rgba(0,0,0,0.15)',
                          bgcolor: theme.palette.background.paper,
                          border: theme.palette.mode === 'dark' 
                            ? `1px solid ${theme.palette.divider}` 
                            : 'none',
                          maxHeight: 400,
                          overflow: 'auto',
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
                          // Estilos de scrollbar adaptados al modo nocturno
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : '1px solid rgba(0, 0, 0, 0.1)',
                            '&:hover': {
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.3)' 
                                : 'rgba(0, 0, 0, 0.3)',
                            },
                          },
                          // Para Firefox
                          scrollbarWidth: 'thin',
                          scrollbarColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    >
                      {/* Campo de búsqueda */}
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
                                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
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
                                borderColor: theme.palette.mode === 'dark' 
                                  ? theme.palette.action.hover 
                                  : theme.palette.text.secondary,
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2E7D32',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: theme.palette.text.secondary,
                              opacity: 1,
                            },
                          }}
                        />
                      </Box>
                      
                      {/* Categoría Comunicación */}
                      <MenuItem
                        sx={{
                          py: 1,
                          px: 2,
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newValue = !communicationFilters.all;
                          setCommunicationFilters({
                            all: newValue,
                            postal: newValue,
                            email: newValue,
                            linkedin: newValue,
                            calls: newValue,
                            sms: newValue,
                            whatsapp: newValue,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.all}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Comunicación
                        </Typography>
                      </MenuItem>
                      
                      {/* Sub-opciones de Comunicación */}
                      <MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommunicationFilters({
                            ...communicationFilters,
                            postal: !communicationFilters.postal,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.postal}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">Correo postal</Typography>
                      </MenuItem>
                      
                      <MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommunicationFilters({
                            ...communicationFilters,
                            email: !communicationFilters.email,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.email}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">Correos</Typography>
                      </MenuItem>
                      
                      <MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommunicationFilters({
                            ...communicationFilters,
                            linkedin: !communicationFilters.linkedin,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.linkedin}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">LinkedIn</Typography>
                      </MenuItem>
                      
                      <MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommunicationFilters({
                            ...communicationFilters,
                            calls: !communicationFilters.calls,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.calls}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">Llamadas</Typography>
                      </MenuItem>
                      
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommunicationFilters({
                            ...communicationFilters,
                            sms: !communicationFilters.sms,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.sms}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">SMS</Typography>
                      </MenuItem>
                      
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommunicationFilters({
                            ...communicationFilters,
                            whatsapp: !communicationFilters.whatsapp,
                          });
                        }}
                      >
                        <Checkbox
                          checked={communicationFilters.whatsapp}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">WhatsApp</Typography>
                      </MenuItem>
                      
                      {/* Categoría Actividad del equipo */}
                      <MenuItem
                        sx={{
                          py: 1,
                          px: 2,
                          mt: 0.5,
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newValue = !teamActivityFilters.all;
                          setTeamActivityFilters({
                            all: newValue,
                            notes: newValue,
                            meetings: newValue,
                            tasks: newValue,
                          });
                        }}
                      >
                        <Checkbox
                          checked={teamActivityFilters.all}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Actividad del equipo
                        </Typography>
                      </MenuItem>
                      
                      {/* Sub-opciones de Actividad del equipo */}
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeamActivityFilters({
                            ...teamActivityFilters,
                            notes: !teamActivityFilters.notes,
                          });
                        }}
                      >
                        <Checkbox
                          checked={teamActivityFilters.notes}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">Notas</Typography>
                      </MenuItem>
                      
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeamActivityFilters({
                            ...teamActivityFilters,
                            meetings: !teamActivityFilters.meetings,
                          });
                        }}
                      >
                        <Checkbox
                          checked={teamActivityFilters.meetings}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">Reuniones</Typography>
                      </MenuItem>
                      
                      <MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeamActivityFilters({
                            ...teamActivityFilters,
                            tasks: !teamActivityFilters.tasks,
                          });
                        }}
                      >
                        <Checkbox
                          checked={teamActivityFilters.tasks}
                          sx={{
                            color: '#2E7D32',
                            '&.Mui-checked': {
                              color: '#2E7D32',
                            },
                          }}
                        />
                        <Typography variant="body2">Tareas</Typography>
                      </MenuItem>
                    </Menu>
                    <Box sx={{ flexGrow: 1 }} />
                  </Box>
                  {timeFilteredActivities.length > 0 ? (
                    <Box>
                      {Object.entries(groupedActivities).map(([monthKey, monthActivities]) => (
                        <Box key={monthKey} sx={{ mb: 4 }}>
                          {/* Encabezado del mes */}
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              textAlign: 'center',
                              mb: 2,
                              color: 'text.secondary',
                              textTransform: 'capitalize',
                              fontWeight: 'bold',
                            }}
                          >
                            {monthKey}
                          </Typography>
                          
                          {/* Actividades */}
                          <Box>
                            {monthActivities.map((activity, index) => {
                              const isNote = activity.type === 'note';
                              const isExpanded = isNote ? expandedNotes.has(activity.id) : expandedActivities.has(activity.id);
                              const actionMenuAnchor = noteActionMenus[activity.id];
                              
                              return (
                                <Box 
                                  key={activity.id} 
                                  sx={{ 
                                    mb: 1.5,
                                    animation: 'slideInRight 0.3s ease',
                                    animationDelay: `${index * 0.05}s`,
                                    '@keyframes slideInRight': {
                                      '0%': {
                                        opacity: 0,
                                        transform: 'translateX(-20px)',
                                      },
                                      '100%': {
                                        opacity: 1,
                                        transform: 'translateX(0)',
                                      },
                                    },
                                  }}
                                >
                                  {isNote ? (
                                    /* Nota estilo mejorado - Versión resumida/expandida */
                                    <Paper
                                      elevation={0}
                                      sx={{
                                        p: isExpanded ? 2 : 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: theme.palette.background.paper,
                                        color: theme.palette.text.primary,
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          borderColor: '#2E7D32',
                                          boxShadow: theme.palette.mode === 'dark' 
                                            ? '0 2px 8px rgba(46, 125, 50, 0.2)' 
                                            : '0 2px 8px rgba(46, 125, 50, 0.08)',
                                        },
                                      }}
                                      onClick={() => toggleNoteExpand(activity.id)}
                                    >
                                      {/* Header de la nota - Siempre visible */}
                                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        {/* Iconos a la izquierda */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
                                          <Edit sx={{ fontSize: 18, color: '#9E9E9E' }} />
                                          <CheckCircle sx={{ fontSize: 18, color: '#2E7D32' }} />
                                        </Box>
                                        
                                        {/* Contenido principal */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                              <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                  fontWeight: 'bold',
                                                  color: '#2E7D32',
                                                  fontSize: '0.875rem',
                                                }}
                                              >
                                                Nota creada por {activity.User ? `${activity.User.firstName} ${activity.User.lastName}`.toUpperCase() : 'Usuario'}
                                              </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', ml: 1 }}>
                                              {activity.createdAt && new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              })} a la(s) {activity.createdAt && new Date(activity.createdAt).toLocaleTimeString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })} GMT-5
                                            </Typography>
                                          </Box>
                                          
                                          {isExpanded && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                              <Link
                                                component="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleNoteActionMenuOpen(e, activity.id);
                                                }}
                                                sx={{
                                                  color: '#2E7D32',
                                                  textDecoration: 'none',
                                                  fontSize: '0.875rem',
                                                  cursor: 'pointer',
                                                  border: 'none',
                                                  background: 'none',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  transition: 'all 0.2s ease',
                                                  borderRadius: 1,
                                                  px: 1,
                                                  '&:hover': {
                                                    textDecoration: 'underline',
                                                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                                                  },
                                                }}
                                              >
                                                Acciones
                                                <KeyboardArrowDown fontSize="small" />
                                              </Link>
                                              <Menu
                                                anchorEl={actionMenuAnchor}
                                                open={Boolean(actionMenuAnchor)}
                                                onClose={() => handleNoteActionMenuClose(activity.id)}
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
                                                    minWidth: 180,
                                                    borderRadius: 1,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                  },
                                                }}
                                              >
                                                <MenuItem 
                                                  onClick={() => handlePinNote(activity.id)}
                                                  sx={{
                                                    '&:hover': {
                                                      backgroundColor: '#e3f2fd',
                                                    },
                                                  }}
                                                >
                                                  <PushPin sx={{ mr: 1.5, fontSize: 18 }} />
                                                  Anclar
                                                </MenuItem>
                                                <MenuItem 
                                                  onClick={() => handleViewHistory(activity.id)}
                                                  sx={{
                                                    '&:hover': {
                                                      backgroundColor: '#e3f2fd',
                                                    },
                                                  }}
                                                >
                                                  <History sx={{ mr: 1.5, fontSize: 18 }} />
                                                  Historial
                                                </MenuItem>
                                                <MenuItem 
                                                  onClick={() => handleCopyLink(activity.id)}
                                                  sx={{
                                                    '&:hover': {
                                                      backgroundColor: '#e3f2fd',
                                                    },
                                                  }}
                                                >
                                                  <ContentCopy sx={{ mr: 1.5, fontSize: 18 }} />
                                                  Copiar enlace
                                                </MenuItem>
                                                <MenuItem 
                                                  onClick={() => handleDeleteNote(activity.id)}
                                                  sx={{
                                                    '&:hover': {
                                                      backgroundColor: '#ffebee',
                                                    },
                                                    color: '#d32f2f',
                                                  }}
                                                >
                                                  <Delete sx={{ mr: 1.5, fontSize: 18 }} />
                                                  Eliminar
                                                </MenuItem>
                                              </Menu>
                                            </Box>
                                          )}
                                          
                                          {/* Contenido resumido cuando está colapsado */}
                                          {!isExpanded && (
                                            <Box sx={{ mt: 1 }}>
                                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                {activity.description ? (
                                                  <Box
                                                    dangerouslySetInnerHTML={{ __html: activity.description.replace(/<[^>]*>/g, '').substring(0, 50) + (activity.description.replace(/<[^>]*>/g, '').length > 50 ? '...' : '') }}
                                                  />
                                                ) : (
                                                  'Sin descripción'
                                                )}
                                              </Typography>
                                            </Box>
                                          )}
                                          
                                          {/* Contenido expandido */}
                                          {isExpanded && (
                                            <>
                                              {/* Descripción de la nota */}
                                              <Box sx={{ mb: 2, mt: 1.5 }}>
                                                {activity.description ? (
                                                  <Box
                                                    dangerouslySetInnerHTML={{ __html: activity.description }}
                                                    sx={{
                                                      '& p': { margin: 0, mb: 1 },
                                                      '& *': { fontSize: '0.875rem', color: 'text.primary' },
                                                    }}
                                                  />
                                                ) : (
                                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    Agregar descripción
                                                  </Typography>
                                                )}
                                              </Box>
                                          
                                              {/* Footer de la nota */}
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                                            <Link
                                              component="button"
                                              onClick={(e) => e.stopPropagation()}
                                              sx={{
                                                color: '#2E7D32',
                                                textDecoration: 'none',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                border: 'none',
                                                background: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                '&:hover': {
                                                  textDecoration: 'underline',
                                                },
                                              }}
                                            >
                                              <Comment fontSize="small" />
                                              Agregar comentario
                                            </Link>
                                            <Box sx={{ position: 'relative' }}>
                                              <Link
                                                component="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActivityAssociationsExpanded({
                                                    ...activityAssociationsExpanded,
                                                    [activity.id]: !activityAssociationsExpanded[activity.id],
                                                  });
                                                }}
                                                sx={{
                                                  color: '#2E7D32',
                                                  textDecoration: 'none',
                                                  fontSize: '0.875rem',
                                                  cursor: 'pointer',
                                                  border: 'none',
                                                  background: 'none',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  '&:hover': {
                                                    textDecoration: 'underline',
                                                  },
                                                }}
                                              >
                                                {getActivityTotalAssociations(activity.id)} asociaciones
                                                <KeyboardArrowDown 
                                                  fontSize="small" 
                                                  sx={{
                                                    transform: activityAssociationsExpanded[activity.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease',
                                                  }}
                                                />
                                              </Link>
                                              
                                              {/* Panel de asociaciones - Expandible/Colapsable */}
                                              {activityAssociationsExpanded[activity.id] && (
                                                <Box
                                                  onClick={(e) => e.stopPropagation()}
                                                  sx={{
                                                    position: 'absolute',
                                                    bottom: '100%',
                                                    right: 0,
                                                    mb: 1,
                                                    width: '600px',
                                                    height: '400px',
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 1,
                                                    p: 2,
                                                    backgroundColor: theme.palette.background.paper,
                                                    boxShadow: theme.palette.mode === 'dark' 
                                                      ? '0 4px 12px rgba(0,0,0,0.5)' 
                                                      : '0 4px 12px rgba(0,0,0,0.15)',
                                                    zIndex: 1000,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    overflow: 'hidden',
                                                    animation: 'slideDown 0.3s ease-out',
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
                                                  }}
                                                >
                                                {/* Contenedor principal con scroll */}
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                                  {/* Lista de categorías en el lado izquierdo */}
                                                  <Box sx={{ 
                                                    width: '200px', 
                                                    flexShrink: 0,
                                                    borderRight: `1px solid ${theme.palette.divider}`,
                                                    pr: 2,
                                                    height: '100%',
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                  }}>
                                                  {/* Lista de categorías siempre visible */}
                                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {['Seleccionados', 'Alertas', 'Carritos', 'Clientes', 'Contactos', 'Empresas', 'Leads', 'Negocios', 'Tickets'].map((category) => {
                                                      const currentCategory = activitySelectedCategory[activity.id] || 'Contactos';
                                                      const isSelected = currentCategory === category;
                                                      
                                                      // Calcular el conteo para cada categoría
                                                      const getCategoryCount = () => {
                                                        if (category === 'Seleccionados') return getActivityTotalAssociations(activity.id);
                                                        if (category === 'Contactos') {
                                                          const contacts = activitySelectedContacts[activity.id] || [];
                                                          const excludedContactsForActivity = activityExcludedContacts[activity.id] || [];
                                                          return contacts.length > 0 ? contacts.length : ((contact?.id && !excludedContactsForActivity.includes(contact.id)) ? 1 : 0);
                                                        }
                                                        if (category === 'Empresas') {
                                                          const selectedCompaniesForActivity = activitySelectedCompanies[activity.id] || [];
                                                          const excludedCompaniesForActivity = activityExcludedCompanies[activity.id] || [];
                                                          const associatedCompanyIds = (associatedCompanies || [])
                                                            .map((c: any) => c && c.id)
                                                            .filter((id: any) => id !== undefined && id !== null && !excludedCompaniesForActivity.includes(id));
                                                          const allCompanyIds = [...selectedCompaniesForActivity, ...associatedCompanyIds];
                                                          return allCompanyIds.filter((id, index) => allCompanyIds.indexOf(id) === index).length;
                                                        }
                                                        if (category === 'Negocios') {
                                                          const selectedDealIds = (activitySelectedAssociations[activity.id] || []).filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
                                                          const excludedDealsForActivity = activityExcludedDeals[activity.id] || [];
                                                          const associatedDealIds = (associatedDeals || [])
                                                            .map((d: any) => d && d.id)
                                                            .filter((id: any) => id !== undefined && id !== null && !excludedDealsForActivity.includes(id));
                                                          const allDealIds = [...selectedDealIds, ...associatedDealIds];
                                                          return allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
                                                        }
                                                        if (category === 'Tickets') {
                                                          const selectedTicketIds = (activitySelectedAssociations[activity.id] || []).filter((id: number) => id > 2000).map(id => id - 2000);
                                                          const excludedTicketsForActivity = activityExcludedTickets[activity.id] || [];
                                                          const associatedTicketIds = (associatedTickets || [])
                                                            .map((t: any) => t && t.id)
                                                            .filter((id: any) => id !== undefined && id !== null && !excludedTicketsForActivity.includes(id));
                                                          const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
                                                          return allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
                                                        }
                                                        if (category === 'Leads') return (activitySelectedLeads[activity.id] || []).length;
                                                        return 0;
                                                      };
                                                      
                                                      return (
                                                        <Box
                                                          key={category}
                                                          onClick={() => {
                                                            setActivitySelectedCategory({
                                                              ...activitySelectedCategory,
                                                              [activity.id]: category,
                                                            });
                                                          }}
                                                          sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            p: 1.5,
                                                            borderRadius: 1,
                                                            cursor: 'pointer',
                                                            backgroundColor: isSelected 
                                                              ? (theme.palette.mode === 'dark' ? 'rgba(0, 188, 212, 0.2)' : '#E3F2FD') 
                                                              : 'transparent',
                                                            borderLeft: isSelected ? '3px solid #00bcd4' : '3px solid transparent',
                                                            '&:hover': {
                                                              backgroundColor: theme.palette.action.hover,
                                                            },
                                                          }}
                                                        >
                                                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: isSelected ? '#00bcd4' : '#666' }}>
                                                            {category === 'Alertas' ? 'Alertas del esp...' : category === 'Clientes' ? 'Clientes de par...' : category}
                                                          </Typography>
                                                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                                                            {getCategoryCount()}
                                                          </Typography>
                                                        </Box>
                                                      );
                                                    })}
                                                  </Box>
                                                </Box>

                                                  {/* Área de búsqueda y resultados - Siempre visible */}
                                                  <Box sx={{ flex: 1, pl: 2, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
                                                      <Typography variant="body2" sx={{ color: '#00bcd4', fontWeight: 500, fontSize: '0.875rem' }}>
                                                        {(activitySelectedCategory[activity.id] || 'Contactos')} ({
                                                          (() => {
                                                            const category = activitySelectedCategory[activity.id] || 'Contactos';
                                                            if (category === 'Contactos') {
                                                              const contacts = activitySelectedContacts[activity.id] || [];
                                                              const excludedContactsForActivity = activityExcludedContacts[activity.id] || [];
                                                              return contacts.length > 0 ? contacts.length : ((contact?.id && !excludedContactsForActivity.includes(contact.id)) ? 1 : 0);
                                                            } else if (category === 'Empresas') {
                                                              const selectedCompanies = activitySelectedCompanies[activity.id] || [];
                                                              const excludedCompaniesForActivity = activityExcludedCompanies[activity.id] || [];
                                                              const associatedCompanyIds = (associatedCompanies || [])
                                                                .map((c: any) => c && c.id)
                                                                .filter((id: any) => id !== undefined && id !== null && !excludedCompaniesForActivity.includes(id));
                                                              const allCompanyIds = [...selectedCompanies, ...associatedCompanyIds];
                                                              return allCompanyIds.filter((id, index) => allCompanyIds.indexOf(id) === index).length;
                                                            } else if (category === 'Negocios') {
                                                              const selectedDealIds = (activitySelectedAssociations[activity.id] || []).filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
                                                              const excludedDealsForActivity = activityExcludedDeals[activity.id] || [];
                                                              const associatedDealIds = (associatedDeals || [])
                                                                .map((d: any) => d && d.id)
                                                                .filter((id: any) => id !== undefined && id !== null && !excludedDealsForActivity.includes(id));
                                                              const allDealIds = [...selectedDealIds, ...associatedDealIds];
                                                              return allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
                                                            } else if (category === 'Tickets') {
                                                              const selectedTicketIds = (activitySelectedAssociations[activity.id] || []).filter((id: number) => id > 2000).map(id => id - 2000);
                                                              const excludedTicketsForActivity = activityExcludedTickets[activity.id] || [];
                                                              const associatedTicketIds = (associatedTickets || [])
                                                                .map((t: any) => t && t.id)
                                                                .filter((id: any) => id !== undefined && id !== null && !excludedTicketsForActivity.includes(id));
                                                              const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
                                                              return allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
                                                            } else if (category === 'Leads') {
                                                              return (activitySelectedLeads[activity.id] || []).length;
                                                            }
                                                            return 0;
                                                          })()
                                                        })
                                                      </Typography>
                                                      <KeyboardArrowDown sx={{ color: '#00bcd4', fontSize: 18 }} />
                                                    </Box>
                                                    <TextField
                                                      size="small"
                                                      placeholder={`Buscar ${(activitySelectedCategory[activity.id] || 'Contactos') === 'Empresas' ? 'Empresas' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Contactos' ? 'Contactos' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Negocios' ? 'Negocios' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Tickets' ? 'Tickets' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Leads' ? 'Leads' : (activitySelectedCategory[activity.id] || 'Contactos')}`}
                                                      value={activityAssociationSearch[activity.id] || ''}
                                                      onChange={(e) => {
                                                        setActivityAssociationSearch({
                                                          ...activityAssociationSearch,
                                                          [activity.id]: e.target.value,
                                                        });
                                                      }}
                                                      fullWidth
                                                      InputProps={{
                                                        endAdornment: (
                                                          <InputAdornment position="end">
                                                            <Search sx={{ color: '#00bcd4' }} />
                                                          </InputAdornment>
                                                        ),
                                                      }}
                                                      sx={{
                                                        mb: 1.5,
                                                        flexShrink: 0,
                                                        '& .MuiOutlinedInput-root': {
                                                          '& fieldset': {
                                                            borderColor: '#00bcd4',
                                                          },
                                                          '&:hover fieldset': {
                                                            borderColor: '#00bcd4',
                                                          },
                                                          '&.Mui-focused fieldset': {
                                                            borderColor: '#00bcd4',
                                                          },
                                                        },
                                                      }}
                                                    />
                                                    
                                                    {/* Resultados de búsqueda con scroll */}
                                                    <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                                                    {(activitySelectedCategory[activity.id] || 'Contactos') === 'Empresas' && (
                                                      <>
                                                        {associatedCompanies.filter((company: any) => 
                                                            !activityAssociationSearch[activity.id] || company.name.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase()) || 
                                                            (company.domain && company.domain.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase()))
                                                        ).map((company: any) => {
                                                          // Verificar si la empresa está asociada automáticamente o seleccionada manualmente
                                                          const isAssociated = associatedCompanies.some((ac: any) => ac && ac.id === company.id);
                                                          const isSelected = (activitySelectedCompanies[activity.id] || []).includes(company.id);
                                                          const excludedCompaniesForActivity = activityExcludedCompanies[activity.id] || [];
                                                          const isExcluded = excludedCompaniesForActivity.includes(company.id);
                                                          // Está marcada si está seleccionada o asociada, pero no si fue excluida
                                                          const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                                                          
                                                          return (
                                                            <Box key={company.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' } }}>
                                                              <Checkbox
                                                                checked={shouldBeChecked}
                                                                onChange={(e) => {
                                                                  const currentCompanies = activitySelectedCompanies[activity.id] || [];
                                                                  const currentExcluded = activityExcludedCompanies[activity.id] || [];
                                                                  if (e.target.checked) {
                                                                    // Si está asociada y estaba excluida, removerla de excluidas
                                                                    if (isExcluded) {
                                                                      setActivityExcludedCompanies({
                                                                        ...activityExcludedCompanies,
                                                                        [activity.id]: currentExcluded.filter(id => id !== company.id),
                                                                      });
                                                                    }
                                                                    // Si no está en selectedCompanies, agregarla
                                                                    if (!currentCompanies.includes(company.id)) {
                                                                      setActivitySelectedCompanies({
                                                                        ...activitySelectedCompanies,
                                                                        [activity.id]: [...currentCompanies, company.id],
                                                                      });
                                                                    }
                                                                  } else {
                                                                    // Si se desmarca, remover de selectedCompanies y agregar a excluidas si está asociada
                                                                    setActivitySelectedCompanies({
                                                                      ...activitySelectedCompanies,
                                                                      [activity.id]: currentCompanies.filter(id => id !== company.id),
                                                                    });
                                                                    if (isAssociated && !currentExcluded.includes(company.id)) {
                                                                      setActivityExcludedCompanies({
                                                                        ...activityExcludedCompanies,
                                                                        [activity.id]: [...currentExcluded, company.id],
                                                                      });
                                                                    }
                                                                  }
                                                                }}
                                                                sx={{
                                                                  color: '#00bcd4',
                                                                  '&.Mui-checked': {
                                                                    color: '#00bcd4',
                                                                  },
                                                                }}
                                                              />
                                                              <Tooltip 
                                                                title={
                                                                  <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                                      {company.name}
                                                                    </Typography>
                                                                    {company.domain && (
                                                                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                                        {company.domain}
                                                                      </Typography>
                                                                    )}
                                                                  </Box>
                                                                }
                                                                arrow
                                                                placement="top"
                                                              >
                                                                <Typography 
                                                                  variant="body2" 
                                                                  sx={{ 
                                                                    fontSize: '0.875rem', 
                                                                    flex: 1,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    cursor: 'pointer',
                                                                  }}
                                                                >
                                                                  {company.name}
                                                                  {company.domain && (
                                                                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.875rem' }}>
                                                                      ({company.domain})
                                                                    </Typography>
                                                                  )}
                                                                </Typography>
                                                              </Tooltip>
                                                            </Box>
                                                          );
                                                        })}
                                                        {associatedCompanies.length === 0 && (
                                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                                                            No hay empresas asociadas
                                                          </Typography>
                                                        )}
                                                      </>
                                                    )}
                                                    {(activitySelectedCategory[activity.id] || 'Contactos') === 'Contactos' && contact && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                          <Checkbox
                                                            checked={(() => {
                                                              const currentContacts = activitySelectedContacts[activity.id] || [];
                                                              const excludedContactsForActivity = activityExcludedContacts[activity.id] || [];
                                                              return ((currentContacts.includes(contact.id) || contact?.id !== undefined) && !excludedContactsForActivity.includes(contact.id));
                                                            })()}
                                                            onChange={(e) => {
                                                              const contactId = contact.id;
                                                              const currentContacts = activitySelectedContacts[activity.id] || [];
                                                              const currentExcluded = activityExcludedContacts[activity.id] || [];
                                                              if (e.target.checked) {
                                                                // Si estaba excluido, removerlo de excluidos
                                                                if (currentExcluded.includes(contactId)) {
                                                                  setActivityExcludedContacts({
                                                                    ...activityExcludedContacts,
                                                                    [activity.id]: currentExcluded.filter(id => id !== contactId),
                                                                  });
                                                                }
                                                                // Si no está en selectedContacts, agregarlo
                                                                if (!currentContacts.includes(contactId)) {
                                                                  setActivitySelectedContacts({
                                                                    ...activitySelectedContacts,
                                                                    [activity.id]: [...currentContacts, contactId],
                                                                  });
                                                                }
                                                              } else {
                                                                // Si se desmarca, remover de selectedContacts y agregar a excluidos
                                                                setActivitySelectedContacts({
                                                                  ...activitySelectedContacts,
                                                                  [activity.id]: currentContacts.filter(id => id !== contactId),
                                                                });
                                                                if (!currentExcluded.includes(contactId)) {
                                                                  setActivityExcludedContacts({
                                                                    ...activityExcludedContacts,
                                                                    [activity.id]: [...currentExcluded, contactId],
                                                                  });
                                                                }
                                                              }
                                                            }}
                                                            sx={{
                                                              color: '#00bcd4',
                                                              '&.Mui-checked': {
                                                                color: '#00bcd4',
                                                              },
                                                            }}
                                                          />
                                                          <Tooltip
                                                            title={
                                                              <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                                  {contact.firstName} {contact.lastName}
                                                                </Typography>
                                                                {contact.email && (
                                                                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                                    {contact.email}
                                                                  </Typography>
                                                                )}
                                                              </Box>
                                                            }
                                                            arrow
                                                            placement="top"
                                                          >
                                                            <Typography 
                                                              variant="body2" 
                                                              sx={{ 
                                                                fontSize: '0.875rem', 
                                                                flex: 1,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                cursor: 'pointer',
                                                              }}
                                                            >
                                                              {contact.firstName} {contact.lastName}
                                                              <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.875rem' }}>
                                                                ({contact.email})
                                                              </Typography>
                                                            </Typography>
                                                          </Tooltip>
                                                        </Box>
                                                    )}
                                                    {(activitySelectedCategory[activity.id] || 'Contactos') === 'Negocios' && (
                                                      <>
                                                        {associatedDeals.filter((deal: any) => 
                                                          !activityAssociationSearch[activity.id] || deal.name.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase())
                                                        ).map((deal: any) => {
                                                            const dealId = 1000 + deal.id; // Usar IDs > 1000 para negocios
                                                            // Verificar si el negocio está asociado automáticamente o seleccionado manualmente
                                                            const isAssociated = associatedDeals.some((ad: any) => ad && ad.id === deal.id);
                                                            const isSelected = (activitySelectedAssociations[activity.id] || []).includes(dealId);
                                                            const excludedDealsForActivity = activityExcludedDeals[activity.id] || [];
                                                            const isExcluded = excludedDealsForActivity.includes(deal.id);
                                                            // Está marcado si está seleccionado o asociado, pero no si fue excluido
                                                            const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                                                            
                                                            return (
                                                              <Box key={deal.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                                <Checkbox
                                                                  checked={shouldBeChecked}
                                                                  onChange={(e) => {
                                                                    const currentAssociations = activitySelectedAssociations[activity.id] || [];
                                                                    const currentExcluded = activityExcludedDeals[activity.id] || [];
                                                                    if (e.target.checked) {
                                                                      // Si está asociado y estaba excluido, removerlo de excluidos
                                                                      if (isExcluded) {
                                                                        setActivityExcludedDeals({
                                                                          ...activityExcludedDeals,
                                                                          [activity.id]: currentExcluded.filter(id => id !== deal.id),
                                                                        });
                                                                      }
                                                                      // Si no está en selectedAssociations, agregarlo
                                                                      if (!currentAssociations.includes(dealId)) {
                                                                        setActivitySelectedAssociations({
                                                                          ...activitySelectedAssociations,
                                                                          [activity.id]: [...currentAssociations, dealId],
                                                                        });
                                                                      }
                                                                    } else {
                                                                      // Si se desmarca, remover de selectedAssociations y agregar a excluidos si está asociado
                                                                      setActivitySelectedAssociations({
                                                                        ...activitySelectedAssociations,
                                                                        [activity.id]: currentAssociations.filter(id => id !== dealId),
                                                                      });
                                                                      if (isAssociated && !currentExcluded.includes(deal.id)) {
                                                                        setActivityExcludedDeals({
                                                                          ...activityExcludedDeals,
                                                                          [activity.id]: [...currentExcluded, deal.id],
                                                                        });
                                                                      }
                                                                    }
                                                                  }}
                                                                  sx={{
                                                                    color: '#00bcd4',
                                                                    '&.Mui-checked': {
                                                                      color: '#00bcd4',
                                                                    },
                                                                  }}
                                                                />
                                                                <Tooltip
                                                                  title={
                                                                    <Box>
                                                                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                        {deal.name}
                                                                      </Typography>
                                                                    </Box>
                                                                  }
                                                                  arrow
                                                                  placement="top"
                                                                >
                                                                  <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                      fontSize: '0.875rem', 
                                                                      flex: 1,
                                                                      overflow: 'hidden',
                                                                      textOverflow: 'ellipsis',
                                                                      whiteSpace: 'nowrap',
                                                                      cursor: 'pointer',
                                                                    }}
                                                                  >
                                                                    {deal.name}
                                                                  </Typography>
                                                                </Tooltip>
                                                              </Box>
                                                            );
                                                        })}
                                                        {associatedDeals.length === 0 && (
                                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                                                            No hay negocios asociados
                                                          </Typography>
                                                        )}
                                                      </>
                                                    )}
                                                    {(activitySelectedCategory[activity.id] || 'Contactos') === 'Tickets' && (
                                                      <>
                                                        {associatedTickets.filter((ticket: any) => 
                                                          !activityAssociationSearch[activity.id] || ticket.subject.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase())
                                                        ).map((ticket: any) => {
                                                            const ticketId = 2000 + ticket.id; // Usar IDs > 2000 para tickets
                                                            // Verificar si el ticket está asociado automáticamente o seleccionado manualmente
                                                            const isAssociated = associatedTickets.some((at: any) => at && at.id === ticket.id);
                                                            const isSelected = (activitySelectedAssociations[activity.id] || []).includes(ticketId);
                                                            const excludedTicketsForActivity = activityExcludedTickets[activity.id] || [];
                                                            const isExcluded = excludedTicketsForActivity.includes(ticket.id);
                                                            // Está marcado si está seleccionado o asociado, pero no si fue excluido
                                                            const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                                                            
                                                            return (
                                                              <Box key={ticket.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                                <Checkbox
                                                                  checked={shouldBeChecked}
                                                                  onChange={(e) => {
                                                                    const currentAssociations = activitySelectedAssociations[activity.id] || [];
                                                                    const currentExcluded = activityExcludedTickets[activity.id] || [];
                                                                    if (e.target.checked) {
                                                                      // Si está asociado y estaba excluido, removerlo de excluidos
                                                                      if (isExcluded) {
                                                                        setActivityExcludedTickets({
                                                                          ...activityExcludedTickets,
                                                                          [activity.id]: currentExcluded.filter(id => id !== ticket.id),
                                                                        });
                                                                      }
                                                                      // Si no está en selectedAssociations, agregarlo
                                                                      if (!currentAssociations.includes(ticketId)) {
                                                                        setActivitySelectedAssociations({
                                                                          ...activitySelectedAssociations,
                                                                          [activity.id]: [...currentAssociations, ticketId],
                                                                        });
                                                                      }
                                                                    } else {
                                                                      // Si se desmarca, remover de selectedAssociations y agregar a excluidos si está asociado
                                                                      setActivitySelectedAssociations({
                                                                        ...activitySelectedAssociations,
                                                                        [activity.id]: currentAssociations.filter(id => id !== ticketId),
                                                                      });
                                                                      if (isAssociated && !currentExcluded.includes(ticket.id)) {
                                                                        setActivityExcludedTickets({
                                                                          ...activityExcludedTickets,
                                                                          [activity.id]: [...currentExcluded, ticket.id],
                                                                        });
                                                                      }
                                                                    }
                                                                  }}
                                                                  sx={{
                                                                    color: '#00bcd4',
                                                                    '&.Mui-checked': {
                                                                      color: '#00bcd4',
                                                                    },
                                                                  }}
                                                                />
                                                                <Tooltip
                                                                  title={
                                                                    <Box>
                                                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                                        {ticket.subject}
                                                                      </Typography>
                                                                      {ticket.description && (
                                                                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                                          {ticket.description}
                                                                        </Typography>
                                                                      )}
                                                                    </Box>
                                                                  }
                                                                  arrow
                                                                  placement="top"
                                                                >
                                                                  <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                      fontSize: '0.875rem', 
                                                                      flex: 1,
                                                                      overflow: 'hidden',
                                                                      textOverflow: 'ellipsis',
                                                                      whiteSpace: 'nowrap',
                                                                      cursor: 'pointer',
                                                                    }}
                                                                  >
                                                                    {ticket.subject}
                                                                  </Typography>
                                                                </Tooltip>
                                                              </Box>
                                                            );
                                                        })}
                                                        {associatedTickets.length === 0 && (
                                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                                                            No hay tickets asociados
                                                          </Typography>
                                                        )}
                                                      </>
                                                    )}
                                                    </Box>
                                                  </Box>
                                                </Box>
                                              </Box>
                                              )}
                                            </Box>
                                          </Box>
                                        </>
                                      )}
                                        </Box>
                                      </Box>
                                    </Paper>
                                  ) : (
                                    /* Otras actividades (email, call, meeting, task) - Versión mejorada */
                                    <Paper
                                      elevation={0}
                                      sx={{
                                        p: isExpanded ? 2 : 1.5,
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: theme.palette.background.paper,
                                        color: theme.palette.text.primary,
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          borderColor: '#2E7D32',
                                          boxShadow: theme.palette.mode === 'dark' 
                                            ? '0 2px 8px rgba(46, 125, 50, 0.2)' 
                                            : '0 2px 8px rgba(46, 125, 50, 0.08)',
                                        },
                                      }}
                                      onClick={() => toggleActivityExpand(activity.id)}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <Avatar sx={{ 
                                          bgcolor: activity.type === 'email' ? '#2E7D32' :
                                                   activity.type === 'call' ? '#4CAF50' :
                                                   activity.type === 'meeting' ? '#FF9800' :
                                                   activity.type === 'task' ? '#9C27B0' : '#757575',
                                          width: 40,
                                          height: 40,
                                        }}>
                                          {activity.type === 'email' ? <Email sx={{ fontSize: 20, color: 'white' }} /> :
                                           activity.type === 'call' ? <Phone sx={{ fontSize: 20, color: 'white' }} /> :
                                           activity.type === 'meeting' ? <Event sx={{ fontSize: 20, color: 'white' }} /> :
                                           activity.type === 'task' ? <Assignment sx={{ fontSize: 20, color: 'white' }} /> : <Comment sx={{ fontSize: 20, color: 'white' }} />}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography 
                                              variant="body2" 
                                              sx={{ 
                                                fontWeight: 'bold',
                                                color: 'text.primary',
                                                fontSize: '0.875rem',
                                              }}
                                            >
                                              {activity.subject || 'Sin título'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', ml: 1 }}>
                                              {activity.createdAt && new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              })}, {activity.createdAt && new Date(activity.createdAt).toLocaleTimeString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </Typography>
                                          </Box>
                                          
                                          {/* Contenido resumido cuando está colapsado */}
                                          {!isExpanded && activity.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                              {activity.description.replace(/<[^>]*>/g, '').substring(0, 60) + (activity.description.replace(/<[^>]*>/g, '').length > 60 ? '...' : '')}
                                            </Typography>
                                          )}
                                          
                                          {/* Contenido expandido */}
                                          {isExpanded && (
                                            <>
                                              {activity.description && (
                                                <Box
                                                  dangerouslySetInnerHTML={{ __html: activity.description }}
                                                  sx={{
                                                    '& p': { margin: 0, mb: 1 },
                                                    '& *': { fontSize: '0.875rem' },
                                                    mb: 1,
                                                  }}
                                                />
                                              )}
                                              <Typography variant="caption" color="text.secondary">
                                                {activity.User && `${activity.User.firstName} ${activity.User.lastName}`}
                                              </Typography>
                                            </>
                                          )}
                                        </Box>
                                      </Box>
                                    </Paper>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Search sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Ninguna actividad coincide con los filtros actuales. Cambia los filtros para ampliar tu búsqueda.
                      </Typography>
                    </Box>
                  )}
                </Card>

                {/* Empresas */}
                <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Empresas
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={handleOpenAddCompanyDialog}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            color: taxiMonterricoColors.orange,
                            border: `1px solid ${taxiMonterricoColors.orange}`,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.25,
                            minWidth: 'auto',
                            '&:hover': {
                              bgcolor: `${taxiMonterricoColors.orange}10`,
                              borderColor: taxiMonterricoColors.orange,
                            }
                          }}
                        >
                          Agregar
                        </Button>
                        {user?.role !== 'user' && (
                          <IconButton size="small">
                            <Settings fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Buscar"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        width: '300px',
                        mb: 2,
                        transition: 'all 0.3s ease',
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          fontSize: '0.875rem',
                          '&:hover': {
                            '& fieldset': {
                              borderColor: '#2E7D32',
                            },
                          },
                          '&.Mui-focused': {
                            '& fieldset': {
                              borderColor: '#2E7D32',
                              borderWidth: 2,
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                  {filteredCompanies.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={companySortField === 'name'}
                                direction={companySortField === 'name' ? companySortOrder : 'asc'}
                                onClick={() => handleSortCompanies('name')}
                              >
                                NOMBRE DE LA EMPRESA
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={companySortField === 'domain'}
                                direction={companySortField === 'domain' ? companySortOrder : 'asc'}
                                onClick={() => handleSortCompanies('domain')}
                              >
                                NOMBRE DE DOMINIO DE LA EMPRESA
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={companySortField === 'phone'}
                                direction={companySortField === 'phone' ? companySortOrder : 'asc'}
                                onClick={() => handleSortCompanies('phone')}
                              >
                                NÚMERO DE TELÉFONO
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCompanies.map((company) => (
                            <TableRow 
                              key={company.id}
                              sx={{
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                                },
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Business fontSize="small" color="action" />
                                  <Typography
                                    sx={{
                                      cursor: 'pointer',
                                      color: 'primary.main',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                      },
                                    }}
                                    onClick={() => navigate(`/companies/${company.id}`)}
                                  >
                                    {company.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography
                                    sx={{
                                      cursor: 'pointer',
                                      color: 'primary.main',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                      },
                                    }}
                                    onClick={() => company.domain && window.open(company.domain.startsWith('http') ? company.domain : `https://${company.domain}`, '_blank')}
                                  >
                                    {company.domain || '--'}
                                  </Typography>
                                  {company.domain && (
                                    <>
                                      <IconButton 
                                        size="small" 
                                        sx={{ p: 0.5 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(company.domain?.startsWith('http') ? company.domain : `https://${company.domain}`, '_blank');
                                        }}
                                        title="Abrir en nueva pestaña"
                                      >
                                        <OpenInNew fontSize="small" />
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
                                        <ContentCopy fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{company.phone || '--'}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.75rem',
                                      minWidth: 'auto',
                                      px: 1,
                                      py: 0.25,
                                    }}
                                    onClick={() => navigate(`/companies/${company.id}`)}
                                  >
                                    Vista previa
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    endIcon={<KeyboardArrowDown />}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '0.75rem',
                                      minWidth: 'auto',
                                      px: 1,
                                      py: 0.25,
                                    }}
                                    onClick={(e) => handleOpenCompanyActionsMenu(e, company.id)}
                                  >
                                    Acciones
                                  </Button>
                                  <Menu
                                    anchorEl={companyActionsMenu[company.id]}
                                    open={Boolean(companyActionsMenu[company.id])}
                                    onClose={() => handleCloseCompanyActionsMenu(company.id)}
                                  >
                                    <MenuItem onClick={() => {
                                      handleCloseCompanyActionsMenu(company.id);
                                      // TODO: Implementar editar etiquetas de asociación
                                    }}>
                                      Editar etiquetas de asociación
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                      handleCloseCompanyActionsMenu(company.id);
                                      if (window.confirm('¿Estás seguro de eliminar esta asociación?')) {
                                        handleRemoveCompanyAssociation(company.id);
                                      }
                                    }}>
                                      Eliminar asociación
                                    </MenuItem>
                                  </Menu>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No existen objetos asociados de este tipo o no tienes permiso para verlos.
                      </Typography>
                    </Box>
                  )}
                </Card>

                {/* Negocios Section */}
                <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Negocios
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setDealFormData({ name: '', amount: '', stage: 'lead', closeDate: '', priority: 'medium' });
                            setAddDealOpen(true);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            color: taxiMonterricoColors.orange,
                            border: `1px solid ${taxiMonterricoColors.orange}`,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.25,
                            minWidth: 'auto',
                            '&:hover': {
                              bgcolor: `${taxiMonterricoColors.orange}10`,
                              borderColor: taxiMonterricoColors.orange,
                            }
                          }}
                        >
                          Agregar
                        </Button>
                        {user?.role !== 'user' && (
                          <IconButton size="small">
                            <Settings fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Buscar"
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        width: '300px',
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" endIcon={<ExpandMore />}>
                        Propietario del negocio
                      </Button>
                      <Button size="small" variant="outlined" endIcon={<ExpandMore />}>
                        Fecha de cierre
                      </Button>
                      <Button size="small" variant="outlined" endIcon={<ExpandMore />}>
                        Fecha de creación
                      </Button>
                      <Button size="small" variant="outlined" endIcon={<ExpandMore />}>
                        Más
                      </Button>
                    </Box>
                  </Box>
                  {filteredDeals.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={dealSortField === 'name'}
                                direction={dealSortField === 'name' ? dealSortOrder : 'asc'}
                                onClick={() => handleSortDeals('name')}
                              >
                                NOMBRE DEL NEGOCIO
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={dealSortField === 'amount'}
                                direction={dealSortField === 'amount' ? dealSortOrder : 'asc'}
                                onClick={() => handleSortDeals('amount')}
                              >
                                VALOR
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={dealSortField === 'closeDate'}
                                direction={dealSortField === 'closeDate' ? dealSortOrder : 'asc'}
                                onClick={() => handleSortDeals('closeDate')}
                              >
                                FECHA DE CIERRE
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredDeals.map((deal) => (
                            <TableRow 
                              key={deal.id}
                              sx={{
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                                  transform: 'scale(1.01)',
                                },
                              }}
                            >
                              <TableCell>{deal.name}</TableCell>
                              <TableCell>
                                {deal.amount ? `$${deal.amount.toLocaleString()} US$` : '--'}
                              </TableCell>
                              <TableCell>
                                {deal.closeDate 
                                  ? new Date(deal.closeDate).toLocaleDateString('es-ES', { 
                                      day: 'numeric', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })
                                  : '--'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No existen objetos asociados de este tipo o no tienes permiso para verlos.
                      </Typography>
                    </Box>
                  )}
                </Card>

                {/* Tickets */}
                <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Tickets
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setAddTicketOpen(true)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          color: taxiMonterricoColors.orange,
                          border: `1px solid ${taxiMonterricoColors.orange}`,
                          borderRadius: 1.5,
                          px: 1,
                          py: 0.25,
                          minWidth: 'auto',
                          '&:hover': {
                            bgcolor: `${taxiMonterricoColors.orange}10`,
                            borderColor: taxiMonterricoColors.orange,
                          }
                        }}
                      >
                        Agregar
                      </Button>
                      {user?.role !== 'usuario' && (
                        <IconButton size="small">
                          <Settings fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {associatedTickets.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Asunto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Prioridad</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Asignado a</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fecha de creación</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associatedTickets.map((ticket) => (
                            <TableRow key={ticket.id} hover>
                              <TableCell>{ticket.subject}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={ticket.status} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: ticket.status === 'closed' ? '#e0e0e0' : 
                                            ticket.status === 'resolved' ? '#c8e6c9' :
                                            ticket.status === 'pending' ? '#fff9c4' :
                                            ticket.status === 'open' ? '#bbdefb' : '#f5f5f5',
                                    textTransform: 'capitalize'
                                  }} 
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={ticket.priority} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: ticket.priority === 'urgent' ? '#ffcdd2' :
                                            ticket.priority === 'high' ? '#ffe0b2' :
                                            ticket.priority === 'medium' ? '#fff9c4' : '#e8f5e9',
                                    textTransform: 'capitalize'
                                  }} 
                                />
                              </TableCell>
                              <TableCell>
                                {ticket.AssignedTo ? `${ticket.AssignedTo.firstName} ${ticket.AssignedTo.lastName}` : '-'}
                              </TableCell>
                              <TableCell>
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('es-ES') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card>

                {/* Suscripciones - Ocultado */}
                {/* <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Suscripciones ({associatedSubscriptions.length})
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setAddSubscriptionOpen(true)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          color: taxiMonterricoColors.orange,
                          border: `1px solid ${taxiMonterricoColors.orange}`,
                          borderRadius: 1.5,
                          px: 1,
                          py: 0.25,
                          minWidth: 'auto',
                          '&:hover': {
                            bgcolor: `${taxiMonterricoColors.orange}10`,
                            borderColor: taxiMonterricoColors.orange,
                          }
                        }}
                      >
                        Agregar
                      </Button>
                      {user?.role !== 'usuario' && (
                        <IconButton size="small">
                          <Settings fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {associatedSubscriptions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ciclo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fecha inicio</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fecha renovación</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associatedSubscriptions.map((subscription) => (
                            <TableRow key={subscription.id} hover>
                              <TableCell>{subscription.name}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={subscription.status} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: subscription.status === 'active' ? '#c8e6c9' :
                                            subscription.status === 'cancelled' ? '#ffcdd2' :
                                            subscription.status === 'expired' ? '#e0e0e0' : '#fff9c4',
                                    textTransform: 'capitalize'
                                  }} 
                                />
                              </TableCell>
                              <TableCell>
                                {subscription.currency || 'USD'} ${parseFloat(subscription.amount || 0).toLocaleString()}
                              </TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>{subscription.billingCycle}</TableCell>
                              <TableCell>
                                {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('es-ES') : '-'}
                              </TableCell>
                              <TableCell>
                                {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString('es-ES') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card> */}

                {/* Pagos - Ocultado */}
                {/* <Card sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2, 
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', 
                  bgcolor: 'transparent',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Pagos ({associatedPayments.length})
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setAddPaymentOpen(true)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          color: taxiMonterricoColors.orange,
                          border: `1px solid ${taxiMonterricoColors.orange}`,
                          borderRadius: 1.5,
                          px: 1,
                          py: 0.25,
                          minWidth: 'auto',
                          '&:hover': {
                            bgcolor: `${taxiMonterricoColors.orange}10`,
                            borderColor: taxiMonterricoColors.orange,
                          }
                        }}
                      >
                        Agregar
                      </Button>
                      {user?.role !== 'usuario' && (
                        <IconButton size="small">
                          <Settings fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                
                  {associatedPayments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fecha pago</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associatedPayments.map((payment) => (
                            <TableRow key={payment.id} hover>
                              <TableCell>{payment.currency || 'USD'} ${parseFloat(payment.amount || 0).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={payment.status}
                                  size="small"
                                  sx={{
                                    bgcolor:
                                      payment.status === 'completed' ? '#c8e6c9' :
                                      payment.status === 'failed' ? '#ffcdd2' :
                                      payment.status === 'refunded' ? '#e0e0e0' :
                                      payment.status === 'cancelled' ? '#e0e0e0' : '#fff9c4',
                                    textTransform: 'capitalize'
                                  }}
                                />
                              </TableCell>
                              <TableCell>{payment.paymentMethod?.replace('_', ' ')}</TableCell>
                              <TableCell>
                                {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-ES') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card> */}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Barra de búsqueda y controles */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'stretch', sm: 'center' }, 
                    gap: 2,
                    mb: 3,
                  }}>
                    <TextField
                      size="small"
                      placeholder="Buscar actividad"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: taxiMonterricoColors.green, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        width: { xs: '100%', sm: '320px' },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                          },
                          '&.Mui-focused': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'white',
                          },
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : undefined,
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: theme.palette.text.primary,
                          '&::placeholder': {
                            color: theme.palette.text.secondary,
                            opacity: 1,
                          },
                        },
                      }}
                    />
                    
                    {/* Filtros dropdown */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Filtrar actividad (${filteredActivities.length}/${activities.length})`}
                        size="small"
                        deleteIcon={<KeyboardArrowDown fontSize="small" />}
                        onDelete={() => {}}
                        onClick={() => {}}
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(46, 125, 50, 0.2)' 
                            : `${taxiMonterricoColors.greenLight}20`,
                          color: theme.palette.mode === 'dark' 
                            ? taxiMonterricoColors.greenLight 
                            : taxiMonterricoColors.greenDark,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : `${taxiMonterricoColors.greenLight}40`}`,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(46, 125, 50, 0.3)' 
                              : `${taxiMonterricoColors.greenLight}30`,
                            borderColor: taxiMonterricoColors.green,
                          },
                          '& .MuiChip-deleteIcon': {
                            color: taxiMonterricoColors.green,
                            '&:hover': {
                              color: theme.palette.mode === 'dark' 
                                ? taxiMonterricoColors.greenLight 
                                : taxiMonterricoColors.greenDark,
                            },
                          },
                        }}
                      />
                      <Chip
                        label="Todos los usuarios"
                        size="small"
                        deleteIcon={<KeyboardArrowDown fontSize="small" />}
                        onDelete={() => {}}
                        onClick={() => {}}
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(46, 125, 50, 0.2)' 
                            : `${taxiMonterricoColors.greenLight}20`,
                          color: theme.palette.mode === 'dark' 
                            ? taxiMonterricoColors.greenLight 
                            : taxiMonterricoColors.greenDark,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : `${taxiMonterricoColors.greenLight}40`}`,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(46, 125, 50, 0.3)' 
                              : `${taxiMonterricoColors.greenLight}30`,
                            borderColor: taxiMonterricoColors.green,
                          },
                          '& .MuiChip-deleteIcon': {
                            color: taxiMonterricoColors.green,
                            '&:hover': {
                              color: theme.palette.mode === 'dark' 
                                ? taxiMonterricoColors.greenLight 
                                : taxiMonterricoColors.greenDark,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Filtros de tipo de actividad - Tabs mejorados */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 0.5, sm: 1 }, 
                    mb: 3, 
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                      height: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#D1D5DB',
                      borderRadius: '2px',
                      '&:hover': {
                        background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#9CA3AF',
                      },
                    },
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
                          color: selectedActivityType === tab.value 
                            ? (theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.greenDark)
                            : theme.palette.text.secondary,
                          textTransform: 'none',
                          fontWeight: selectedActivityType === tab.value ? 600 : 500,
                          borderBottom: selectedActivityType === tab.value ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                          borderRadius: 0,
                          minWidth: 'auto',
                          px: { xs: 1.5, sm: 2.5 },
                          py: 1.5,
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.greenDark,
                            bgcolor: selectedActivityType === tab.value 
                              ? 'transparent' 
                              : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB'),
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -2,
                            left: 0,
                            right: 0,
                            height: selectedActivityType === tab.value ? '3px' : '0px',
                            bgcolor: taxiMonterricoColors.green,
                            transition: 'height 0.2s ease',
                          },
                        }}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </Box>

                  {/* Actividades agrupadas */}
                  {(() => {
                    // Filtrar por tipo de actividad seleccionado
                    const typeFilteredActivities = selectedActivityType === 'all' 
                      ? timeFilteredActivities 
                      : timeFilteredActivities.filter((activity) => activity.type === selectedActivityType);
                    
                    // Separar actividades en "Próximamente" (futuras) y por mes/año (pasadas)
                    const now = new Date();
                    const upcomingActivities = typeFilteredActivities.filter((activity) => {
                      if (activity.type === 'task' || activity.type === 'meeting') {
                        const dueDate = activity.dueDate ? new Date(activity.dueDate) : null;
                        return dueDate && dueDate > now;
                      }
                      return false;
                    });

                    const pastActivities = typeFilteredActivities.filter((activity) => {
                      if (activity.type === 'task' || activity.type === 'meeting') {
                        const dueDate = activity.dueDate ? new Date(activity.dueDate) : null;
                        return !dueDate || dueDate <= now;
                      }
                      return true;
                    });

                    const pastGrouped = pastActivities.reduce((acc: { [key: string]: any[] }, activity) => {
                      if (!activity.createdAt) return acc;
                      const date = new Date(activity.createdAt);
                      const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
                      if (!acc[monthKey]) {
                        acc[monthKey] = [];
                      }
                      acc[monthKey].push(activity);
                      return acc;
                    }, {});

                    return (
                      <Box>
                        {/* Sección Próximamente */}
                        {upcomingActivities.length > 0 && (
                          <Box sx={{ mb: 4 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                textAlign: 'left',
                                mb: 2,
                                color: 'text.secondary',
                                textTransform: 'capitalize',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                              }}
                            >
                              Próximamente
                            </Typography>
                            {upcomingActivities.map((activity) => {
                              const isExpanded = expandedActivities.has(activity.id);
                              return (
                                <Paper
                                  key={activity.id}
                                  elevation={0}
                                  sx={{
                                    mb: 1.5,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                    p: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      borderColor: '#1976d2',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    },
                                  }}
                                  onClick={() => toggleActivityExpand(activity.id)}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                                      <KeyboardArrowRight
                                        sx={{
                                          fontSize: 18,
                                          color: '#1976d2',
                                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                          transition: 'transform 0.3s ease',
                                          mt: 0.5,
                                        }}
                                      />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 0.5 }}>
                                          {activity.type === 'task' ? 'Tarea asignada a' : activity.type === 'meeting' ? 'Reunión programada para' : 'Actividad'} {activity.User ? `${activity.User.firstName} ${activity.User.lastName}`.toUpperCase() : 'Usuario'}
                                        </Typography>
                                        {isExpanded && (
                                          <Box sx={{ pl: 0, mt: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                              <Box
                                                sx={{
                                                  width: 16,
                                                  height: 16,
                                                  borderRadius: '50%',
                                                  bgcolor: activity.type === 'task' ? '#9C27B0' : '#FF9800',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                }}
                                              >
                                                {activity.type === 'task' ? (
                                                  <Assignment sx={{ fontSize: 10, color: 'white' }} />
                                                ) : (
                                                  <Event sx={{ fontSize: 10, color: 'white' }} />
                                                )}
                                              </Box>
                                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                {activity.subject || activity.description?.replace(/<[^>]*>/g, '').substring(0, 50) || 'Sin título'}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        )}
                                        {!isExpanded && (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', pl: 0, fontStyle: 'italic' }}>
                                            {activity.type === 'meeting' ? 'reunion' : activity.type === 'task' ? 'tarea' : 'actividad'}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                    {activity.dueDate && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
                                        <Event fontSize="small" sx={{ color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                          Pendiente: {new Date(activity.dueDate).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })} a la(s) {new Date(activity.dueDate).toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })} GMT-5
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                        )}

                        {/* Actividades pasadas agrupadas por mes */}
                        {Object.entries(pastGrouped).map(([monthKey, monthActivities]) => (
                          <Box key={monthKey} sx={{ mb: 4 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                textAlign: 'left',
                                mb: 2,
                                color: 'text.secondary',
                                textTransform: 'capitalize',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                              }}
                            >
                              {monthKey}
                            </Typography>
                            {monthActivities.map((activity) => {
                              const isExpanded = activity.type === 'note' ? expandedNotes.has(activity.id) : expandedActivities.has(activity.id);
                              const activityTypeLabel = activity.type === 'note' ? 'Nota' : activity.type === 'email' ? 'Correo' : activity.type === 'call' ? 'Llamada' : activity.type === 'task' ? 'Tarea' : activity.type === 'meeting' ? 'Reunión' : 'Actividad';
                              return (
                                <Paper
                                  key={activity.id}
                                  elevation={0}
                                  sx={{
                                    mb: 1.5,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                    p: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      borderColor: '#1976d2',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    },
                                  }}
                                  onClick={() => {
                                    if (activity.type === 'note') {
                                      toggleNoteExpand(activity.id);
                                    } else {
                                      toggleActivityExpand(activity.id);
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                                      <KeyboardArrowRight
                                        sx={{
                                          fontSize: 18,
                                          color: '#1976d2',
                                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                          transition: 'transform 0.3s ease',
                                          mt: 0.5,
                                        }}
                                      />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 0.5 }}>
                                          {activityTypeLabel} por {activity.User ? `${activity.User.firstName} ${activity.User.lastName}`.toUpperCase() : 'Usuario'}
                                        </Typography>
                                        {isExpanded && (
                                          <Box sx={{ pl: 0, mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                              {activity.description ? (
                                                <Box dangerouslySetInnerHTML={{ __html: activity.description.substring(0, 200) + (activity.description.length > 200 ? '...' : '') }} />
                                              ) : activity.subject || 'Sin descripción'}
                                            </Typography>
                                          </Box>
                                        )}
                                        {!isExpanded && (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', pl: 0, fontStyle: 'italic' }}>
                                            {activity.type === 'note' ? 'nuevo' : activity.type === 'email' ? 'correo' : activity.type === 'call' ? 'llamada' : activity.type === 'task' ? 'tarea' : activity.type === 'meeting' ? 'reunion' : 'actividad'}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', ml: 2 }}>
                                      {activity.createdAt && new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })} a la(s) {activity.createdAt && new Date(activity.createdAt).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })} GMT-5
                                    </Typography>
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                        ))}

                        {upcomingActivities.length === 0 && Object.keys(pastGrouped).length === 0 && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            py: 8,
                            textAlign: 'center',
                          }}>
                            <Box sx={{ 
                              width: 80, 
                              height: 80, 
                              borderRadius: '50%', 
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 3,
                            }}>
                              <Assignment sx={{ fontSize: 40, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF' }} />
                            </Box>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.text.primary, 
                              fontWeight: 600,
                              mb: 1,
                            }}>
                              No hay actividades registradas
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.secondary,
                              maxWidth: 400,
                            }}>
                              No hay actividades registradas para este contacto. Crea una nueva actividad para comenzar.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    CRM Taxi Monterrico no tiene datos de enriquecimiento para este registro todavía.
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Etapa del ciclo de vida
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip label={getStageLabel(contact.lifecycleStage)} color={getStageColor(contact.lifecycleStage)} />
                      {contact.Company && <Chip label={`Empresa: ${contact.Company.name}`} />}
                      {contact.jobTitle && <Chip label={contact.jobTitle} />}
                      {contact.city && <Chip label={contact.city} />}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Descripción de la empresa
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contact.Company?.name || '--'}
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
            </Box>
          </Paper>
        </Box>

        {/* Columna Derecha - Registros Asociados */}
        <Box sx={{ 
          display: { xs: 'block', lg: 'block' },
          width: { xs: '100%', lg: summaryExpanded ? '320px' : '24px' },
          flexShrink: 0,
          height: { xs: 'auto', lg: '100%' },
          maxHeight: { xs: '400px', lg: '100%' },
          overflowY: 'auto',
          overflowX: 'hidden',
          position: { xs: 'relative', lg: summaryExpanded ? 'relative' : 'absolute' },
          right: { xs: 'auto', lg: summaryExpanded ? 'auto' : 0 },
          top: 0,
          transition: 'width 0.2s ease',
          mt: { xs: 2, lg: 0 },
          // Ocultar scrollbar pero mantener scroll funcional
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
          },
          // Para Firefox
          scrollbarWidth: 'none',
        }}>
          {/* Columna delgada para expandir cuando está contraído */}
          {!summaryExpanded && (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                onClick={() => setSummaryExpanded(true)}
                sx={{
                  backgroundColor: 'transparent',
                  color: '#2E7D32',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <KeyboardArrowLeft sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          )}
          
          <Paper sx={{ 
            p: 2,
            height: '100%',
            width: summaryExpanded ? '100%' : 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            opacity: summaryExpanded ? 1 : 0,
            visibility: summaryExpanded ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease, width 0.2s ease',
          }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                flexShrink: 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Resumen
              </Typography>
              <IconButton 
                size="small"
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                sx={{
                  transform: summaryExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <KeyboardArrowRight />
              </IconButton>
            </Box>

            {/* Contenido desplegable */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                maxWidth: summaryExpanded ? '100%' : 0,
                width: summaryExpanded ? '100%' : 0,
                opacity: summaryExpanded ? 1 : 0,
                visibility: summaryExpanded ? 'visible' : 'hidden',
                // Ocultar scrollbar pero mantener scroll funcional
                '&::-webkit-scrollbar': {
                  display: 'none',
                  width: 0,
                },
                // Para Firefox
                scrollbarWidth: 'none',
              }}
            >
            {/* Empresas */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Empresas ({associatedCompanies.length})
                </Typography>
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={handleOpenAddCompanyDialog}
                    sx={{ 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      borderWidth: '0.5px',
                      '&:hover': {
                        borderWidth: '0.5px',
                      }
                    }}
                  >+</Button>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {associatedCompanies.length > 0 ? (
                <List>
                  {associatedCompanies.map((company) => (
                    <ListItem key={company.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#2E7D32' }}>
                          {company.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {company.name}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {company.domain && (
                              <Typography variant="caption" display="block">
                                Nombre de dominio: {company.domain}
                              </Typography>
                            )}
                            <Link 
                              href="#" 
                              variant="caption" 
                              sx={{ 
                                mr: 2,
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/companies/${company.id}`);
                              }}
                            >
                              Ver Empresas asociado
                            </Link>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay empresas asociadas.
                </Typography>
              )}
            </Box>

            {/* Deals */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Negocios ({associatedDeals.length})
                </Typography>
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      borderWidth: '0.5px',
                      '&:hover': {
                        borderWidth: '0.5px',
                      }
                    }}
                  >+</Button>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {associatedDeals.length > 0 ? (
                <List>
                  {associatedDeals.map((deal) => (
                    <ListItem key={deal.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#FF9800' }}>
                          <AttachMoney />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={deal.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Valor: ${deal.amount?.toLocaleString() || '0'}
                            </Typography>
                            {deal.closeDate && (
                              <Typography variant="caption" display="block">
                                Fecha de cierre: {new Date(deal.closeDate).toLocaleDateString('es-ES')}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              Etapa: {deal.stage}
                            </Typography>
                            <Link href="#" variant="caption" sx={{ mr: 2 }}>
                              Ver Negocios asociado
                            </Link>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay negocios asociados.
                </Typography>
              )}
            </Box>

            {/* Tickets */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Tickets ({associatedTickets.length})
                </Typography>
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => setAddTicketOpen(true)}
                    sx={{ 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      borderWidth: '0.5px',
                      '&:hover': {
                        borderWidth: '0.5px',
                      }
                    }}
                  >+</Button>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {associatedTickets.length > 0 ? (
                <List>
                  {associatedTickets.map((ticket) => (
                    <ListItem key={ticket.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#1976d2' }}>
                          <Support />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={ticket.subject}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Estado: <Chip 
                                label={ticket.status} 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: ticket.status === 'closed' ? '#e0e0e0' : 
                                          ticket.status === 'resolved' ? '#c8e6c9' :
                                          ticket.status === 'pending' ? '#fff9c4' :
                                          ticket.status === 'open' ? '#bbdefb' : '#f5f5f5',
                                  textTransform: 'capitalize'
                                }} 
                              />
                            </Typography>
                            <Typography variant="caption" display="block">
                              Prioridad: <Chip 
                                label={ticket.priority} 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: ticket.priority === 'urgent' ? '#ffcdd2' :
                                          ticket.priority === 'high' ? '#ffe0b2' :
                                          ticket.priority === 'medium' ? '#fff9c4' : '#e8f5e9',
                                  textTransform: 'capitalize'
                                }} 
                              />
                            </Typography>
                            {ticket.createdAt && (
                              <Typography variant="caption" display="block">
                                Creado: {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                              </Typography>
                            )}
                            <Link href="#" variant="caption" sx={{ mr: 2 }}>
                              Ver Ticket asociado
                            </Link>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay tickets asociados.
                </Typography>
              )}
            </Box>

            {/* Suscripciones en Resumen - Ocultado */}
            {/* <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Suscripciones ({associatedSubscriptions.length})
                </Typography>
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => setAddSubscriptionOpen(true)}
                    sx={{ 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      borderWidth: '0.5px',
                      '&:hover': {
                        borderWidth: '0.5px',
                      }
                    }}
                  >+</Button>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {associatedSubscriptions.length > 0 ? (
                <List>
                  {associatedSubscriptions.map((subscription) => (
                    <ListItem key={subscription.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#9C27B0' }}>
                          <Business />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={subscription.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Estado: <Chip 
                                label={subscription.status} 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: subscription.status === 'active' ? '#c8e6c9' :
                                          subscription.status === 'cancelled' ? '#ffcdd2' :
                                          subscription.status === 'expired' ? '#e0e0e0' : '#fff9c4',
                                  textTransform: 'capitalize'
                                }} 
                              />
                            </Typography>
                            <Typography variant="caption" display="block">
                              Monto: {subscription.currency || 'USD'} ${parseFloat(subscription.amount || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Ciclo: {subscription.billingCycle?.replace('_', ' ')}
                            </Typography>
                            <Link href="#" variant="caption" sx={{ mr: 2 }}>
                              Ver Suscripción asociada
                            </Link>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay suscripciones asociadas.
                </Typography>
              )}
            </Box> */}

            {/* Pagos en Resumen - Ocultado */}
            {/* <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Pagos ({associatedPayments.length})
                </Typography>
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => setAddPaymentOpen(true)}
                    sx={{ 
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      borderWidth: '0.5px',
                      '&:hover': {
                        borderWidth: '0.5px',
                      }
                    }}
                  >+</Button>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {associatedPayments.length > 0 ? (
                <List>
                  {associatedPayments.map((payment) => (
                    <ListItem key={payment.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#4CAF50' }}>
                          <AttachMoney />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${payment.currency || 'USD'} $${parseFloat(payment.amount || 0).toLocaleString()}`}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Estado: <Chip 
                                label={payment.status} 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: payment.status === 'completed' ? '#c8e6c9' :
                                          payment.status === 'failed' ? '#ffcdd2' :
                                          payment.status === 'refunded' ? '#e0e0e0' :
                                          payment.status === 'cancelled' ? '#e0e0e0' : '#fff9c4',
                                  textTransform: 'capitalize'
                                }} 
                              />
                            </Typography>
                            <Typography variant="caption" display="block">
                              Método: {payment.paymentMethod?.replace('_', ' ')}
                            </Typography>
                            {payment.paymentDate && (
                              <Typography variant="caption" display="block">
                                Fecha: {new Date(payment.paymentDate).toLocaleDateString('es-ES')}
                              </Typography>
                            )}
                            <Link href="#" variant="caption" sx={{ mr: 2 }}>
                              Ver Pago asociado
                            </Link>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay pagos asociados.
                </Typography>
              )}
            </Box> */}
            </Box>
          </Paper>
        </Box>
          </Box>
        </Card>
      </Box>

      {/* Mensaje de éxito */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage('')}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
        >
          {successMessage}
        </Alert>
      )}

      {/* Mensaje de advertencia */}
      {warningMessage && (
        <Alert 
          severity="warning" 
          onClose={() => setWarningMessage('')}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
        >
          {warningMessage}
        </Alert>
      )}

      {/* Ventana flotante de Nota */}
      {noteOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95vw', sm: '1100px' },
            maxWidth: { xs: '95vw', sm: '95vw' },
            height: '85vh',
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)' 
              : '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            zIndex: 1300,
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
              <IconButton 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                  transition: 'all 0.2s ease',
                }} 
                size="small"
              >
                <KeyboardArrowDown />
              </IconButton>
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
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                  transition: 'all 0.2s ease',
                }} 
                size="small"
              >
                <Fullscreen fontSize="small" />
              </IconButton>
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
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 2px 8px rgba(0,0,0,0.4)' 
                : '0 2px 8px rgba(0,0,0,0.04)',
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
              />
            </Box>
          </Box>

          {/* Columna Derecha: Sección de Asociaciones */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {/* Sección "Asociado con X registros" - Siempre visible */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <Box sx={{ 
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`, 
              borderRadius: 3, 
              p: 2.5, 
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : theme.palette.background.paper,
              display: 'flex',
              gap: 2.5,
              alignItems: 'flex-start',
              maxHeight: '500px',
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 2px 8px rgba(0,0,0,0.4)' 
                : '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}>
              {/* Lista de categorías en el lado izquierdo */}
              <Box sx={{ 
                width: '220px', 
                flexShrink: 0,
                borderRight: `1px solid ${theme.palette.divider}`,
                pr: 2.5,
                maxHeight: '500px',
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.3)' 
                      : 'rgba(0,0,0,0.3)',
                  },
                  transition: 'background-color 0.2s ease',
                },
              }}>
                {/* Lista de categorías siempre visible */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box
                    onClick={() => setSelectedAssociationCategory('Seleccionados')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Seleccionados' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Seleccionados' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Seleccionados' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Seleccionados' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Seleccionados' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Seleccionados' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Seleccionados' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Seleccionados' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Seleccionados' ? 700 : 400,
                    }}>
                      Seleccionados
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Seleccionados' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Seleccionados' ? 600 : 500,
                    }}>
                      {totalAssociations}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Alertas')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Alertas' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Alertas' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Alertas' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Alertas' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Alertas' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Alertas' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Alertas' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Alertas' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Alertas' ? 600 : 400,
                    }}>
                      Alertas del esp...
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      0
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Carritos')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Carritos' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Carritos' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Carritos' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Carritos' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Carritos' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Carritos' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Carritos' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Carritos' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Carritos' ? 600 : 400,
                    }}>
                      Carritos
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      0
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Clientes')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Clientes' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Clientes' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Clientes' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Clientes' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Clientes' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Clientes' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Clientes' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Clientes' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Clientes' ? 600 : 400,
                    }}>
                      Clientes de par...
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      0
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Contactos')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Contactos' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Contactos' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Contactos' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Contactos' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Contactos' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Contactos' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Contactos' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Contactos' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Contactos' ? 600 : 400,
                    }}>
                      Contactos
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Contactos' ? taxiMonterricoColors.green : theme.palette.text.secondary,
                      fontWeight: 500,
                    }}>
                      {contact?.id && !excludedContacts.includes(contact.id) ? 1 : 0}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Empresas')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Empresas' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Empresas' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Empresas' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Empresas' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Empresas' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Empresas' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Empresas' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Empresas' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Empresas' ? 600 : 400,
                    }}>
                      Empresas
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      {(() => {
                        const associatedCompanyIds = (associatedCompanies || [])
                          .map((c: any) => c && c.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedCompanies.includes(id));
                        const allCompanyIds = [...selectedCompanies, ...associatedCompanyIds];
                        return allCompanyIds.filter((id, index) => allCompanyIds.indexOf(id) === index).length;
                      })()}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Leads')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Leads' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Leads' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Leads' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Leads' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Leads' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Leads' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Leads' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Leads' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Leads' ? 600 : 400,
                    }}>
                      Leads
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      {selectedLeads.length}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Negocios')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Negocios' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Negocios' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Negocios' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Negocios' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Negocios' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Negocios' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Negocios' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Negocios' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Negocios' ? 600 : 400,
                    }}>
                      Negocios
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      {(() => {
                        const selectedDealIds = selectedAssociations.filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
                        const associatedDealIds = (associatedDeals || [])
                          .map((d: any) => d && d.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedDeals.includes(id));
                        const allDealIds = [...selectedDealIds, ...associatedDealIds];
                        return allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
                      })()}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Tickets')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.75,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Tickets' 
                        ? taxiMonterricoColors.orange
                        : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Tickets' 
                        ? `4px solid ${taxiMonterricoColors.orangeDark}` 
                        : '4px solid transparent',
                      color: selectedAssociationCategory === 'Tickets' 
                        ? 'white'
                        : theme.palette.text.secondary,
                      boxShadow: selectedAssociationCategory === 'Tickets' 
                        ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                        : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Tickets' 
                          ? taxiMonterricoColors.orangeDark
                          : theme.palette.action.hover,
                        transform: selectedAssociationCategory === 'Tickets' 
                          ? 'scale(1.02)'
                          : 'translateX(4px)',
                        boxShadow: selectedAssociationCategory === 'Tickets' 
                          ? `0 4px 12px ${taxiMonterricoColors.orange}50`
                          : 'none',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Tickets' ? 'white' : theme.palette.text.secondary,
                      fontWeight: selectedAssociationCategory === 'Tickets' ? 600 : 400,
                    }}>
                      Tickets
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                      {(() => {
                        const selectedTicketIds = selectedAssociations.filter((id: number) => id > 2000).map(id => id - 2000);
                        const associatedTicketIds = (associatedTickets || [])
                          .map((t: any) => t && t.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedTickets.includes(id));
                        const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
                        return allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
                      })()}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Área de búsqueda y resultados - Siempre visible */}
              <Box sx={{ flex: 1, pl: 2, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
                  <Typography variant="body2" sx={{ color: taxiMonterricoColors.orange, fontWeight: 500, fontSize: '0.875rem' }}>
                    {selectedAssociationCategory} ({
                      selectedAssociationCategory === 'Contactos' ? (contact?.id && !excludedContacts.includes(contact.id) ? 1 : 0) :
                      selectedAssociationCategory === 'Empresas' ? (() => {
                        const associatedCompanyIds = (associatedCompanies || [])
                          .map((c: any) => c && c.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedCompanies.includes(id));
                        const allCompanyIds = [...selectedCompanies, ...associatedCompanyIds];
                        return allCompanyIds.filter((id, index) => allCompanyIds.indexOf(id) === index).length;
                      })() :
                      selectedAssociationCategory === 'Negocios' ? (() => {
                        const selectedDealIds = selectedAssociations.filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
                        const associatedDealIds = (associatedDeals || [])
                          .map((d: any) => d && d.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedDeals.includes(id));
                        const allDealIds = [...selectedDealIds, ...associatedDealIds];
                        return allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
                      })() :
                      selectedAssociationCategory === 'Tickets' ? (() => {
                        const selectedTicketIds = selectedAssociations.filter((id: number) => id > 2000).map(id => id - 2000);
                        const associatedTicketIds = (associatedTickets || [])
                          .map((t: any) => t && t.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedTickets.includes(id));
                        const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
                        return allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
                      })() :
                      selectedAssociationCategory === 'Leads' ? selectedLeads.length : 0
                    })
                  </Typography>
                  <KeyboardArrowDown sx={{ color: taxiMonterricoColors.orange, fontSize: 18 }} />
                </Box>
                <TextField
                  size="small"
                  placeholder={`Buscar ${selectedAssociationCategory === 'Empresas' ? 'Empresas' : selectedAssociationCategory === 'Contactos' ? 'Contactos' : selectedAssociationCategory === 'Leads' ? 'Leads' : selectedAssociationCategory}`}
                  value={associationSearch}
                  onChange={(e) => setAssociationSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search sx={{ color: taxiMonterricoColors.orange }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 1.5,
                    flexShrink: 0,
                    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : 'transparent',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : 'transparent',
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.orange,
                      },
                      '&:hover fieldset': {
                        borderColor: taxiMonterricoColors.orange,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.orange,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: theme.palette.text.secondary,
                      opacity: 0.7,
                    },
                  }}
                />
                
                {/* Resultados de búsqueda */}
                <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                    {selectedAssociationCategory === 'Empresas' && (
                      <>
                        {(allCompanies.length > 0 ? allCompanies : associatedCompanies).filter((company: any) => 
                          !associationSearch || company.name.toLowerCase().includes(associationSearch.toLowerCase()) || 
                          (company.domain && company.domain.toLowerCase().includes(associationSearch.toLowerCase()))
                        ).map((company: any) => {
                          // Verificar si la empresa está asociada o seleccionada
                          const isAssociated = associatedCompanies.some((ac: any) => ac && ac.id === company.id);
                          const isSelected = selectedCompanies.includes(company.id);
                          const isExcluded = excludedCompanies.includes(company.id);
                          // Está marcada si está seleccionada o asociada, pero no si fue excluida
                          const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                          
                          return (
                            <Box key={company.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' } }}>
                              <Checkbox
                                checked={shouldBeChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Si está asociada y estaba excluida, removerla de excluidas
                                    if (isExcluded) {
                                      setExcludedCompanies(excludedCompanies.filter(id => id !== company.id));
                                    }
                                    // Si no está en selectedCompanies, agregarla
                                    if (!selectedCompanies.includes(company.id)) {
                                      setSelectedCompanies([...selectedCompanies, company.id]);
                                    }
                                  } else {
                                    // Si se desmarca, remover de selectedCompanies y agregar a excluidas si está asociada
                                    setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                                    if (isAssociated && !excludedCompanies.includes(company.id)) {
                                      setExcludedCompanies([...excludedCompanies, company.id]);
                                    }
                                  }
                                }}
                                sx={{
                                  color: taxiMonterricoColors.orange,
                                  borderRadius: '4px',
                                  padding: '4px',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    backgroundColor: `${taxiMonterricoColors.orange}10`,
                                    transform: 'scale(1.1)',
                                  },
                                  '&.Mui-checked': {
                                    color: 'white',
                                    backgroundColor: taxiMonterricoColors.orange,
                                    '&:hover': {
                                      backgroundColor: taxiMonterricoColors.orangeDark,
                                      transform: 'scale(1.1)',
                                    },
                                  },
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '1.5rem',
                                    borderRadius: '4px',
                                    border: `2px solid ${taxiMonterricoColors.orange}`,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  },
                                  '&.Mui-checked .MuiSvgIcon-root': {
                                    border: `2px solid ${taxiMonterricoColors.orange}`,
                                    boxShadow: `0 2px 8px ${taxiMonterricoColors.orange}40`,
                                  },
                                }}
                              />
                            <Tooltip 
                              title={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                    {company.name}
                                  </Typography>
                                  {company.domain && (
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                      {company.domain}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              arrow
                              placement="top"
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: '0.875rem', 
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  cursor: 'pointer',
                                }}
                              >
                                {company.name}
                                {company.domain && (
                                  <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.875rem' }}>
                                    ({company.domain})
                                  </Typography>
                                )}
                              </Typography>
                            </Tooltip>
                          </Box>
                          );
                        })}
                        {(allCompanies.length > 0 ? allCompanies : associatedCompanies).length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                            No hay empresas disponibles
                          </Typography>
                        )}
                      </>
                  )}
                  {selectedAssociationCategory === 'Contactos' && contact && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#f5f5f5' } }}>
                        <Checkbox
                          checked={(selectedContacts.includes(contact.id) || contact?.id !== undefined) && !excludedContacts.includes(contact.id)}
                          onChange={(e) => {
                            const contactId = contact.id;
                            if (e.target.checked) {
                              // Remover de excluidos si estaba ahí
                              if (excludedContacts.includes(contactId)) {
                                setExcludedContacts(excludedContacts.filter(id => id !== contactId));
                              }
                              // Agregar a seleccionados si no está
                              if (!selectedContacts.includes(contactId)) {
                                setSelectedContacts([...selectedContacts, contactId]);
                              }
                            } else {
                              // Remover de seleccionados y agregar a excluidos
                              setSelectedContacts(selectedContacts.filter(id => id !== contactId));
                              if (!excludedContacts.includes(contactId)) {
                                setExcludedContacts([...excludedContacts, contactId]);
                              }
                            }
                          }}
                          sx={{
                            color: taxiMonterricoColors.green,
                            '&.Mui-checked': {
                              color: taxiMonterricoColors.green,
                            },
                          }}
                        />
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {contact.firstName} {contact.lastName}
                              </Typography>
                              {contact.email && (
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  {contact.email}
                                </Typography>
                              )}
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem', 
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                            }}
                          >
                            {contact.firstName} {contact.lastName}
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.875rem' }}>
                              ({contact.email})
                            </Typography>
                          </Typography>
                        </Tooltip>
                      </Box>
                  )}
                  {selectedAssociationCategory === 'Negocios' && (
                      <>
                        {associatedDeals.filter((deal: any) => 
                          !associationSearch || deal.name.toLowerCase().includes(associationSearch.toLowerCase())
                        ).map((deal: any) => {
                          const dealId = 1000 + deal.id; // Usar IDs > 1000 para negocios
                          // Verificar si el negocio está asociado automáticamente o seleccionado manualmente
                          const isAssociated = associatedDeals.some((ad: any) => ad && ad.id === deal.id);
                          const isSelected = selectedAssociations.includes(dealId);
                          const isExcluded = excludedDeals.includes(deal.id);
                          // Está marcado si está seleccionado o asociado, pero no si fue excluido
                          const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                          
                          return (
                            <Box key={deal.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                              <Checkbox
                                checked={shouldBeChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Si está asociado y estaba excluido, removerlo de excluidos
                                    if (isExcluded) {
                                      setExcludedDeals(excludedDeals.filter(id => id !== deal.id));
                                    }
                                    // Si no está en selectedAssociations, agregarlo
                                    if (!selectedAssociations.includes(dealId)) {
                                      setSelectedAssociations([...selectedAssociations, dealId]);
                                    }
                                  } else {
                                    // Si se desmarca, remover de selectedAssociations y agregar a excluidos si está asociado
                                    setSelectedAssociations(selectedAssociations.filter(id => id !== dealId));
                                    if (isAssociated && !excludedDeals.includes(deal.id)) {
                                      setExcludedDeals([...excludedDeals, deal.id]);
                                    }
                                  }
                                }}
                                sx={{
                                  color: taxiMonterricoColors.orange,
                                  borderRadius: '4px',
                                  padding: '4px',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    backgroundColor: `${taxiMonterricoColors.orange}10`,
                                    transform: 'scale(1.1)',
                                  },
                                  '&.Mui-checked': {
                                    color: 'white',
                                    backgroundColor: taxiMonterricoColors.orange,
                                    '&:hover': {
                                      backgroundColor: taxiMonterricoColors.orangeDark,
                                      transform: 'scale(1.1)',
                                    },
                                  },
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '1.5rem',
                                    borderRadius: '4px',
                                    border: `2px solid ${taxiMonterricoColors.orange}`,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  },
                                  '&.Mui-checked .MuiSvgIcon-root': {
                                    border: `2px solid ${taxiMonterricoColors.orange}`,
                                    boxShadow: `0 2px 8px ${taxiMonterricoColors.orange}40`,
                                  },
                                }}
                              />
                              <Tooltip
                                title={
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {deal.name}
                                    </Typography>
                                  </Box>
                                }
                                arrow
                                placement="top"
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.875rem', 
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {deal.name}
                                </Typography>
                              </Tooltip>
                            </Box>
                          );
                        })}
                        {associatedDeals.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                            No hay negocios asociados
                          </Typography>
                        )}
                      </>
                  )}
                  {selectedAssociationCategory === 'Tickets' && (
                      <>
                        {associatedTickets.filter((ticket: any) => 
                          !associationSearch || ticket.subject.toLowerCase().includes(associationSearch.toLowerCase())
                        ).map((ticket: any) => {
                          const ticketId = 2000 + ticket.id; // Usar IDs > 2000 para tickets
                          // Verificar si el ticket está asociado automáticamente o seleccionado manualmente
                          const isAssociated = associatedTickets.some((at: any) => at && at.id === ticket.id);
                          const isSelected = selectedAssociations.includes(ticketId);
                          const isExcluded = excludedTickets.includes(ticket.id);
                          // Está marcado si está seleccionado o asociado, pero no si fue excluido
                          const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                          
                          return (
                            <Box key={ticket.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                              <Checkbox
                                checked={shouldBeChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Si está asociado y estaba excluido, removerlo de excluidos
                                    if (isExcluded) {
                                      setExcludedTickets(excludedTickets.filter(id => id !== ticket.id));
                                    }
                                    // Si no está en selectedAssociations, agregarlo
                                    if (!selectedAssociations.includes(ticketId)) {
                                      setSelectedAssociations([...selectedAssociations, ticketId]);
                                    }
                                  } else {
                                    // Si se desmarca, remover de selectedAssociations y agregar a excluidos si está asociado
                                    setSelectedAssociations(selectedAssociations.filter(id => id !== ticketId));
                                    if (isAssociated && !excludedTickets.includes(ticket.id)) {
                                      setExcludedTickets([...excludedTickets, ticket.id]);
                                    }
                                  }
                                }}
                                sx={{
                                  color: taxiMonterricoColors.orange,
                                  borderRadius: '4px',
                                  padding: '4px',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    backgroundColor: `${taxiMonterricoColors.orange}10`,
                                    transform: 'scale(1.1)',
                                  },
                                  '&.Mui-checked': {
                                    color: 'white',
                                    backgroundColor: taxiMonterricoColors.orange,
                                    '&:hover': {
                                      backgroundColor: taxiMonterricoColors.orangeDark,
                                      transform: 'scale(1.1)',
                                    },
                                  },
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '1.5rem',
                                    borderRadius: '4px',
                                    border: `2px solid ${taxiMonterricoColors.orange}`,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  },
                                  '&.Mui-checked .MuiSvgIcon-root': {
                                    border: `2px solid ${taxiMonterricoColors.orange}`,
                                    boxShadow: `0 2px 8px ${taxiMonterricoColors.orange}40`,
                                  },
                                }}
                              />
                              <Tooltip
                                title={
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                      {ticket.subject}
                                    </Typography>
                                    {ticket.description && (
                                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                        {ticket.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                arrow
                                placement="top"
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.875rem', 
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {ticket.subject}
                                </Typography>
                              </Tooltip>
                            </Box>
                          );
                        })}
                        {associatedTickets.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                            No hay tickets asociados
                          </Typography>
                        )}
                      </>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
          </Box>
          </Box>

          {/* Footer con botones */}
          <Box sx={{ 
            px: 3,
            py: 2.5, 
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`, 
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : theme.palette.background.paper, 
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
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 1299,
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

      {/* Modal de Email con Gmail API */}
      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        recipientEmail={contact?.email || ''}
        recipientName={contact ? `${contact.firstName} ${contact.lastName}` : undefined}
        onSend={handleSendEmail}
      />

      {/* Ventana flotante de Llamada */}
      {callOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: 4,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes fadeInScale': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.9)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '64px', md: '72px' },
                px: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: `${taxiMonterricoColors.green}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                </Box>
                <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' }, letterSpacing: '-0.02em' }}>
                  Llamada
                </Typography>
              </Box>
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
                onClick={() => setCallOpen(false)}
              >
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              p: { xs: 3, md: 4 }, 
              overflow: 'hidden', 
              overflowY: 'auto',
              gap: 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                },
                transition: 'background-color 0.2s ease',
              },
            }}>
              <TextField
                label="Asunto"
                value={callData.subject}
                onChange={(e) => setCallData({ ...callData, subject: e.target.value })}
                required
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Duración (minutos)"
                type="number"
                value={callData.duration}
                onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Notas de la llamada"
                multiline
                rows={8}
                value={callData.description}
                onChange={(e) => setCallData({ ...callData, description: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ 
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              backgroundColor: theme.palette.background.paper, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2 
            }}>
              <Button 
                onClick={() => setCallOpen(false)} 
                variant="outlined"
                sx={{ 
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCall} 
                variant="contained" 
                disabled={saving || !callData.subject.trim()}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.green,
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.greenDark,
                    boxShadow: saving ? 'none' : `0 6px 16px ${taxiMonterricoColors.green}50`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: 'none',
                  },
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              zIndex: 1299,
              animation: 'fadeIn 0.3s ease-out',
            }}
            onClick={() => setCallOpen(false)}
          />
        </>
      )}

      {/* Ventana flotante de Tarea */}
      {taskOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: 4,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes fadeInScale': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.9)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '64px', md: '72px' },
                px: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: `${taxiMonterricoColors.green}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Assignment sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                </Box>
                <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' }, letterSpacing: '-0.02em' }}>
                  Tarea
                </Typography>
              </Box>
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

            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              p: { xs: 3, md: 4 }, 
              overflow: 'hidden', 
              overflowY: 'auto',
              gap: 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                },
                transition: 'background-color 0.2s ease',
              },
            }}>
              <TextField
                label="Título"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                required
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Descripción"
                multiline
                rows={5}
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Prioridad"
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& fieldset': {
                        borderWidth: '2px',
                        borderColor: theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: taxiMonterricoColors.green,
                      },
                    },
                  }}
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </TextField>
                <TextField
                  label="Fecha límite"
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& fieldset': {
                        borderWidth: '2px',
                        borderColor: theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: taxiMonterricoColors.green,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ 
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              backgroundColor: theme.palette.background.paper, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2 
            }}>
              <Button 
                onClick={() => setTaskOpen(false)} 
                variant="outlined"
                sx={{ 
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveTask} 
                variant="contained" 
                disabled={saving || !taskData.title.trim()}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.green,
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.greenDark,
                    boxShadow: saving ? 'none' : `0 6px 16px ${taxiMonterricoColors.green}50`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: 'none',
                  },
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              zIndex: 1299,
              animation: 'fadeIn 0.3s ease-out',
            }}
            onClick={() => setTaskOpen(false)}
          />
        </>
      )}

      {/* Ventana flotante de Reunión */}
      {meetingOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: 4,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes fadeInScale': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.9)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '64px', md: '72px' },
                px: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: `${taxiMonterricoColors.green}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Event sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                </Box>
                <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' }, letterSpacing: '-0.02em' }}>
                  Reunión
                </Typography>
              </Box>
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
                onClick={() => setMeetingOpen(false)}
              >
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              p: { xs: 3, md: 4 }, 
              overflow: 'hidden', 
              overflowY: 'auto',
              gap: 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                },
                transition: 'background-color 0.2s ease',
              },
            }}>
              <TextField
                label="Asunto"
                value={meetingData.subject}
                onChange={(e) => setMeetingData({ ...meetingData, subject: e.target.value })}
                required
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Descripción"
                multiline
                rows={5}
                value={meetingData.description}
                onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={meetingData.date}
                  onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& fieldset': {
                        borderWidth: '2px',
                        borderColor: theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: taxiMonterricoColors.green,
                      },
                    },
                  }}
                />
                <TextField
                  label="Hora"
                  type="time"
                  value={meetingData.time}
                  onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& fieldset': {
                        borderWidth: '2px',
                        borderColor: theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: taxiMonterricoColors.green,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ 
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              backgroundColor: theme.palette.background.paper, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2 
            }}>
              <Button 
                onClick={() => setMeetingOpen(false)} 
                variant="outlined"
                sx={{ 
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveMeeting} 
                variant="contained" 
                disabled={saving || !meetingData.subject.trim()}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.green,
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: saving ? theme.palette.action.disabledBackground : taxiMonterricoColors.greenDark,
                    boxShadow: saving ? 'none' : `0 6px 16px ${taxiMonterricoColors.green}50`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: 'none',
                  },
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              zIndex: 1299,
              animation: 'fadeIn 0.3s ease-out',
            }}
            onClick={() => setMeetingOpen(false)}
          />
        </>
      )}

      {/* Diálogo para agregar empresa */}
      <Dialog open={addCompanyOpen} onClose={() => { 
        setAddCompanyOpen(false); 
        setCompanyDialogTab('create'); 
        setSelectedExistingCompanies([]); 
        setExistingCompaniesSearch('');
        setCompanyFormData({ 
          name: '', 
          domain: '', 
          phone: '', 
          industry: '', 
          lifecycleStage: 'lead',
          ruc: '',
          address: '',
          city: '',
          state: '',
          country: '',
        });
        setRucError('');
      }} maxWidth="sm" fullWidth
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
        <DialogContent sx={{ pt: 1 }}>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={companyDialogTab === 'create' ? 0 : 1} onChange={(e, newValue) => setCompanyDialogTab(newValue === 0 ? 'create' : 'existing')}>
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {companyDialogTab === 'create' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* RUC y Tipo de Contribuyente / Industria en la misma fila */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="RUC"
                  value={companyFormData.ruc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Solo números
                    const limitedValue = value.slice(0, 11);
                    setCompanyFormData({ ...companyFormData, ruc: limitedValue });
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
                          disabled={loadingRuc || !companyFormData.ruc || companyFormData.ruc.length < 11}
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
                  value={companyFormData.industry}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
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
                value={companyFormData.name}
                onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Dominio"
                value={companyFormData.domain}
                onChange={(e) => setCompanyFormData({ ...companyFormData, domain: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
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
          )}

          {companyDialogTab === 'existing' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Campo de búsqueda */}
              <TextField
                size="small"
                placeholder="Buscar Empresas"
                value={existingCompaniesSearch}
                onChange={(e) => setExistingCompaniesSearch(e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search sx={{ color: taxiMonterricoColors.green }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />

              {/* Lista de empresas */}
              <Box sx={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' ? theme.palette.divider : '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#555',
                  },
                },
              }}>
                {(() => {
                  const associatedCompanyIds = (associatedCompanies || []).map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
                  const filteredCompanies = allCompanies.filter((company: any) => {
                    if (associatedCompanyIds.includes(company.id)) return false;
                    if (!existingCompaniesSearch) return true;
                    const searchLower = existingCompaniesSearch.toLowerCase();
                    return (
                      (company.name && company.name.toLowerCase().includes(searchLower)) ||
                      (company.domain && company.domain.toLowerCase().includes(searchLower))
                    );
                  });

                  if (filteredCompanies.length === 0) {
                    return (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay empresas disponibles
                        </Typography>
                      </Box>
                    );
                  }

                  return filteredCompanies.map((company: any) => (
                    <Box
                      key={company.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:hover': { backgroundColor: theme.palette.action.hover },
                        '&:last-child': { borderBottom: 'none' },
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
                        sx={{
                          color: taxiMonterricoColors.green,
                          '&.Mui-checked': {
                            color: taxiMonterricoColors.green,
                          },
                        }}
                      />
                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                          {company.name}
                        </Typography>
                        {company.domain && (
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {company.domain}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ));
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}>
          <Button 
            onClick={() => { 
              setAddCompanyOpen(false); 
              setCompanyDialogTab('create'); 
              setSelectedExistingCompanies([]); 
              setExistingCompaniesSearch('');
              setCompanyFormData({ 
                name: '', 
                domain: '', 
                phone: '', 
                industry: '', 
                lifecycleStage: 'lead',
                ruc: '',
                address: '',
                city: '',
                state: '',
                country: '',
              });
              setRucError('');
            }}
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
          {companyDialogTab === 'create' ? (
            <Button 
              onClick={handleAddCompany} 
              variant="contained" 
              disabled={!companyFormData.name.trim()}
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
              Crear
            </Button>
          ) : (
            <Button 
              onClick={handleAddExistingCompanies} 
              variant="contained" 
              disabled={selectedExistingCompanies.length === 0}
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
              Agregar ({selectedExistingCompanies.length})
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar negocio */}
      <Dialog 
        open={addDealOpen} 
        onClose={() => setAddDealOpen(false)} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>Agregar Negocio</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre del Negocio"
              value={dealFormData.name}
              onChange={(e) => setDealFormData({ ...dealFormData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Valor"
              type="number"
              value={dealFormData.amount}
              onChange={(e) => setDealFormData({ ...dealFormData, amount: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Etapa"
              value={dealFormData.stage}
              onChange={(e) => setDealFormData({ ...dealFormData, stage: e.target.value })}
              fullWidth
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
              <MenuItem value="propuesta_economica">Propuesta económica</MenuItem>
              <MenuItem value="negociacion">Negociación</MenuItem>
              <MenuItem value="cierre_ganado">Cierre ganado</MenuItem>
              <MenuItem value="cierre_perdido">Cierre perdido</MenuItem>
            </TextField>
            <TextField
              label="Fecha de cierre"
              type="date"
              value={dealFormData.closeDate}
              onChange={(e) => setDealFormData({ ...dealFormData, closeDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Prioridad"
              value={dealFormData.priority}
              onChange={(e) => setDealFormData({ ...dealFormData, priority: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDealOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddDeal} variant="contained" disabled={!dealFormData.name.trim()}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar ticket */}
      <Dialog 
        open={addTicketOpen} 
        onClose={() => setAddTicketOpen(false)} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>Crear Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Asunto"
              value={ticketFormData.subject}
              onChange={(e) => setTicketFormData({ ...ticketFormData, subject: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              value={ticketFormData.description}
              onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={ticketFormData.status}
              onChange={(e) => setTicketFormData({ ...ticketFormData, status: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="new">Nuevo</option>
              <option value="open">Abierto</option>
              <option value="pending">Pendiente</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </TextField>
            <TextField
              select
              label="Prioridad"
              value={ticketFormData.priority}
              onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTicketOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddTicket} variant="contained" disabled={!ticketFormData.subject.trim()}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar suscripción */}
      <Dialog 
        open={addSubscriptionOpen} 
        onClose={() => setAddSubscriptionOpen(false)} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>Crear Suscripción</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={subscriptionFormData.name}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              value={subscriptionFormData.description}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={subscriptionFormData.status}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, status: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="active">Activa</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelada</option>
              <option value="expired">Expirada</option>
            </TextField>
            <TextField
              label="Monto"
              type="number"
              value={subscriptionFormData.amount}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, amount: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Moneda"
              value={subscriptionFormData.currency}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, currency: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Ciclo de facturación"
              value={subscriptionFormData.billingCycle}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, billingCycle: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
              <option value="one-time">Una vez</option>
            </TextField>
            <TextField
              label="Fecha de inicio"
              type="date"
              value={subscriptionFormData.startDate}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, startDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha de fin"
              type="date"
              value={subscriptionFormData.endDate}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, endDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha de renovación"
              type="date"
              value={subscriptionFormData.renewalDate}
              onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, renewalDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSubscriptionOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddSubscription} variant="contained" disabled={!subscriptionFormData.name.trim() || !subscriptionFormData.startDate}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar pago */}
      <Dialog 
        open={addPaymentOpen} 
        onClose={() => setAddPaymentOpen(false)} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>Crear Pago</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Monto"
              type="number"
              value={paymentFormData.amount}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Moneda"
              value={paymentFormData.currency}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, currency: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={paymentFormData.status}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, status: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="failed">Fallido</option>
              <option value="refunded">Reembolsado</option>
              <option value="cancelled">Cancelado</option>
            </TextField>
            <TextField
              label="Fecha de pago"
              type="date"
              value={paymentFormData.paymentDate}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={paymentFormData.dueDate}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, dueDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Método de pago"
              value={paymentFormData.paymentMethod}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="credit_card">Tarjeta de crédito</option>
              <option value="debit_card">Tarjeta de débito</option>
              <option value="bank_transfer">Transferencia bancaria</option>
              <option value="cash">Efectivo</option>
              <option value="check">Cheque</option>
              <option value="other">Otro</option>
            </TextField>
            <TextField
              label="Referencia"
              value={paymentFormData.reference}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={paymentFormData.description}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddPayment} variant="contained" disabled={!paymentFormData.amount.trim() || !paymentFormData.paymentDate}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactDetail;