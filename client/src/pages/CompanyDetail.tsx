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
  TrendingUp,
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
  OpenInNew,
  ContentCopy,
  KeyboardArrowRight,
  Lock,
  Edit,
  PushPin,
  History,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import {
  Facebook,
  Twitter,
  GitHub,
  LinkedIn,
  YouTube,
} from '@mui/icons-material';
import api from '../config/api';
import RichTextEditor from '../components/RichTextEditor';
import { taxiMonterricoColors } from '../theme/colors';

interface CompanyDetail {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  lifecycleStage: string;
  leadStatus?: string;
  facebook?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
  notes?: string;
  createdAt?: string;
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

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [associatedDeals, setAssociatedDeals] = useState<any[]>([]);
  const [associatedContacts, setAssociatedContacts] = useState<any[]>([]);
  const [associatedTickets, setAssociatedTickets] = useState<any[]>([]);
  const [associatedSubscriptions, setAssociatedSubscriptions] = useState<any[]>([]);
  const [associatedPayments, setAssociatedPayments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Estados para búsquedas y filtros
  const [activitySearch, setActivitySearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [activityFilters, setActivityFilters] = useState<string[]>(['Todo hasta ahora']);
  const [activityFilterMenuAnchor, setActivityFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [activityFilterSearch, setActivityFilterSearch] = useState('');
  const [timeRangeMenuAnchor, setTimeRangeMenuAnchor] = useState<null | HTMLElement>(null);
  const [timeRangeSearch, setTimeRangeSearch] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('Todo hasta ahora');
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
  const [contactSortOrder, setContactSortOrder] = useState<'asc' | 'desc'>('asc');
  const [contactSortField, setContactSortField] = useState<string>('');
  
  // Estados para diálogos
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [addTicketOpen, setAddTicketOpen] = useState(false);
  const [addSubscriptionOpen, setAddSubscriptionOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [createActivityMenuAnchor, setCreateActivityMenuAnchor] = useState<null | HTMLElement>(null);
  const [contactFormData, setContactFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', lifecycleStage: 'lead' });
  const [contactDialogTab, setContactDialogTab] = useState<'create' | 'existing'>('create');
  const [existingContactsSearch, setExistingContactsSearch] = useState('');
  const [selectedExistingContacts, setSelectedExistingContacts] = useState<number[]>([]);
  const [dealFormData, setDealFormData] = useState({ name: '', amount: '', stage: 'qualification', closeDate: '', probability: '' });
  const [ticketFormData, setTicketFormData] = useState({ subject: '', description: '', status: 'new', priority: 'medium' });
  const [subscriptionFormData, setSubscriptionFormData] = useState({ name: '', description: '', status: 'active', amount: '', currency: 'USD', billingCycle: 'monthly', startDate: '', endDate: '', renewalDate: '' });
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', currency: 'USD', status: 'pending', paymentDate: '', dueDate: '', paymentMethod: 'credit_card', reference: '', description: '' });
  
  // Estados para edición de campos del contacto
  const [leadStatusMenuAnchor, setLeadStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [lifecycleStageMenuAnchor, setLifecycleStageMenuAnchor] = useState<null | HTMLElement>(null);
  const [buyingRoleMenuAnchor, setBuyingRoleMenuAnchor] = useState<null | HTMLElement>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingDomain, setEditingDomain] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [domainValue, setDomainValue] = useState('');
  
  // Estados para asociaciones en nota
  const [associationsExpanded, setAssociationsExpanded] = useState(false);
  const [associationsMenuAnchor, setAssociationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAssociationCategory, setSelectedAssociationCategory] = useState<string>('Contactos');
  const [associationSearch, setAssociationSearch] = useState('');
  const [selectedAssociations, setSelectedAssociations] = useState<number[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  // Estados para elementos excluidos (desmarcados manualmente aunque estén asociados)
  const [excludedContacts, setExcludedContacts] = useState<number[]>([]);
  const [excludedDeals, setExcludedDeals] = useState<number[]>([]);
  const [excludedTickets, setExcludedTickets] = useState<number[]>([]);
  
  // Estados para asociaciones en actividades de Descripción (por actividad)
  const [activityAssociationsExpanded, setActivityAssociationsExpanded] = useState<{ [key: number]: boolean }>({});
  const [activityAssociationsMenuAnchor, setActivityAssociationsMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [activitySelectedCategory, setActivitySelectedCategory] = useState<{ [key: number]: string }>({});
  const [activityAssociationSearch, setActivityAssociationSearch] = useState<{ [key: number]: string }>({});
  const [activitySelectedAssociations, setActivitySelectedAssociations] = useState<{ [key: number]: number[] }>({});
  const [activitySelectedContacts, setActivitySelectedContacts] = useState<{ [key: number]: number[] }>({});
  const [activitySelectedLeads, setActivitySelectedLeads] = useState<{ [key: number]: number[] }>({});
  // Estados para elementos excluidos por actividad
  const [activityExcludedContacts, setActivityExcludedContacts] = useState<{ [key: number]: number[] }>({});
  const [activityExcludedDeals, setActivityExcludedDeals] = useState<{ [key: number]: number[] }>({});
  const [activityExcludedTickets, setActivityExcludedTickets] = useState<{ [key: number]: number[] }>({});
  
  // Calcular total de asociaciones basado en selecciones del usuario usando useMemo para asegurar actualización
  const totalAssociations = useMemo(() => {
    // Incluir contactos asociados que aún no están en selectedContacts pero deberían contarse
    // Excluir los contactos que fueron desmarcados manualmente
    const associatedContactIds = (associatedContacts || [])
      .map((c: any) => c && c.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedContacts.includes(id));
    
    // Combinar contactos seleccionados manualmente y contactos asociados (sin duplicar)
    const allContactIds = [...selectedContacts, ...associatedContactIds];
    const contactsToCount = allContactIds.filter((id, index) => allContactIds.indexOf(id) === index);
    
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
    
    const total = contactsToCount.length + selectedLeads.length + dealsToCount + ticketsToCount;
    
    // Debug: Log para verificar valores (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug asociaciones:', {
        associatedContacts: associatedContacts.length,
        associatedContactIds,
        selectedContacts: selectedContacts.length,
        excludedContacts,
        contactsToCount: contactsToCount.length,
        dealsToCount,
        ticketsToCount,
        total,
      });
    }
    
    return total;
  }, [associatedContacts, selectedContacts, excludedContacts, associatedDeals, selectedAssociations, excludedDeals, associatedTickets, excludedTickets, selectedLeads]);
  
  // Variables derivadas para usar en otros lugares
  const associatedContactIds = (associatedContacts || []).map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
  const allContactIds = [...selectedContacts, ...associatedContactIds];
  const contactsToCount = allContactIds.filter((id, index) => allContactIds.indexOf(id) === index);
  const selectedDealIds = selectedAssociations.filter((id: number) => id > 1000 && id < 2000).map(id => id - 1000);
  const associatedDealIds = (associatedDeals || []).map((d: any) => d && d.id).filter((id: any) => id !== undefined && id !== null);
  const allDealIds = [...selectedDealIds, ...associatedDealIds];
  const dealsToCount = allDealIds.filter((id, index) => allDealIds.indexOf(id) === index).length;
  const selectedTicketIds = selectedAssociations.filter((id: number) => id > 2000).map(id => id - 2000);
  const associatedTicketIds = (associatedTickets || []).map((t: any) => t && t.id).filter((id: any) => id !== undefined && id !== null);
  const allTicketIds = [...selectedTicketIds, ...associatedTicketIds];
  const ticketsToCount = allTicketIds.filter((id, index) => allTicketIds.indexOf(id) === index).length;
  
  // Función para calcular total de asociaciones por actividad (basado en selecciones y asociaciones automáticas)
  const getActivityTotalAssociations = (activityId: number) => {
    // Contactos: seleccionados manualmente + contactos asociados automáticamente (excluyendo los desmarcados)
    const selectedContactsForActivity = activitySelectedContacts[activityId] || [];
    const excludedContactsForActivity = activityExcludedContacts[activityId] || [];
    const associatedContactIds = (associatedContacts || [])
      .map((c: any) => c && c.id)
      .filter((id: any) => id !== undefined && id !== null && !excludedContactsForActivity.includes(id));
    const allContactIdsForActivity = [...selectedContactsForActivity, ...associatedContactIds];
    const contactsCount = allContactIdsForActivity.filter((id, index) => allContactIdsForActivity.indexOf(id) === index).length;
    
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
    
    return contactsCount + leads.length + dealsCount + ticketsCount;
  };
  
  // Estados para diálogos de acciones
  const [noteOpen, setNoteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para formularios
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [emailData, setEmailData] = useState({ subject: '', description: '', to: '' });
  const [callData, setCallData] = useState({ subject: '', description: '', duration: '' });
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [meetingData, setMeetingData] = useState({ subject: '', description: '', date: '', time: '' });
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  useEffect(() => {
    if (company) {
      fetchAssociatedRecords();
      fetchAllContacts();
    }
  }, [company, id]);

  // Actualizar asociaciones seleccionadas cuando cambian los registros relacionados
  useEffect(() => {
    // Inicializar contactos seleccionados con los contactos asociados
    if (associatedContacts.length > 0) {
      const contactIds = associatedContacts.map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
      if (contactIds.length > 0) {
        setSelectedContacts(prev => {
          // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
          const combined = [...prev, ...contactIds];
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
    
  }, [associatedContacts, associatedDeals, associatedTickets]);

  const fetchAllContacts = async () => {
    try {
      const response = await api.get('/contacts');
      setAllContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error('Error fetching all contacts:', error);
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

  // Asegurar que el resumen esté contraído al cambiar de empresa
  useEffect(() => {
    setSummaryExpanded(false);
  }, [id]);

  const fetchCompany = async () => {
    try {
      const response = await api.get(`/companies/${id}`);
      setCompany(response.data);
      setPhoneValue(response.data.phone || '');
      setDomainValue(response.data.domain || '');
      // Actualizar contactos asociados desde la relación muchos-a-muchos
      const contacts = (response.data.Contacts && Array.isArray(response.data.Contacts))
        ? response.data.Contacts
        : [];
      setAssociatedContacts(contacts);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociatedRecords = async () => {
    try {
      // Obtener empresa con contactos asociados desde la relación muchos-a-muchos
      const companyResponse = await api.get(`/companies/${id}`);
      const contacts = (companyResponse.data.Contacts && Array.isArray(companyResponse.data.Contacts))
        ? companyResponse.data.Contacts
        : [];
      setAssociatedContacts(contacts);

      // Obtener deals asociados
      const dealsResponse = await api.get('/deals', {
        params: { companyId: id },
      });
      setAssociatedDeals(dealsResponse.data.deals || dealsResponse.data || []);

      // Obtener actividades
      const activitiesResponse = await api.get('/activities', {
        params: { companyId: id },
      });
      setActivities(activitiesResponse.data.activities || activitiesResponse.data || []);

      // Obtener tickets asociados
      const ticketsResponse = await api.get('/tickets', {
        params: { companyId: id },
      });
      setAssociatedTickets(ticketsResponse.data.tickets || ticketsResponse.data || []);

      // Obtener suscripciones asociadas
      const subscriptionsResponse = await api.get('/subscriptions', {
        params: { companyId: id },
      });
      setAssociatedSubscriptions(subscriptionsResponse.data.subscriptions || subscriptionsResponse.data || []);

      // Obtener pagos asociados
      const paymentsResponse = await api.get('/payments', {
        params: { companyId: id },
      });
      setAssociatedPayments(paymentsResponse.data.payments || paymentsResponse.data || []);
    } catch (error) {
      console.error('Error fetching associated records:', error);
    }
  };

  const getInitials = (firstName: string, lastName?: string) => {
    if (lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    const words = firstName.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return firstName.substring(0, 2).toUpperCase();
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

  const handleOpenEmail = () => {
    setEmailData({ subject: '', description: '', to: '' });
    setEmailOpen(true);
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
    try {
      await api.post('/activities', {
        type: 'note',
        subject: noteData.subject || `Nota para ${company?.name || 'Empresa'}`,
        description: noteData.description,
        companyId: id,
      });
      
      // Crear tarea de seguimiento si está marcada
      if (createFollowUpTask) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3); // 3 días laborables
        await api.post('/tasks', {
          title: `Seguimiento de nota: ${noteData.subject || `Nota para ${company?.name || 'Empresa'}`}`,
          description: `Tarea de seguimiento generada automáticamente por la nota: ${noteData.description}`,
          type: 'todo',
          status: 'not started',
          priority: 'medium',
          dueDate: followUpDate.toISOString().split('T')[0],
          companyId: id,
        });
      }
      
      setSuccessMessage('Nota creada exitosamente' + (createFollowUpTask ? ' y tarea de seguimiento creada' : ''));
      setNoteOpen(false);
      setNoteData({ subject: '', description: '' });
      setCreateFollowUpTask(false);
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving note:', error);
      setSuccessMessage('Error al crear la nota');
      setTimeout(() => setSuccessMessage(''), 3000);
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
      await api.post('/activities', {
        type: 'email',
        subject: emailData.subject,
        description: emailData.description,
        companyId: id,
      });
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
      await api.post('/activities', {
        type: 'call',
        subject: callData.subject,
        description: callData.description,
        companyId: id,
      });
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
      await api.post('/activities', {
        type: 'task',
        subject: taskData.title,
        description: taskData.description,
        companyId: id,
      });
      setSuccessMessage('Tarea creada exitosamente');
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
        companyId: id,
      });
      setSuccessMessage('Reunión creada exitosamente');
      setMeetingOpen(false);
      setMeetingData({ subject: '', description: '', date: '', time: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving meeting:', error);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para la pestaña Descripción
  const handleAddContact = async () => {
    try {
      // Crear el contacto primero
      const contactResponse = await api.post('/contacts', {
        ...contactFormData,
        // No establecer companyId aquí para evitar asociación automática como empresa principal
      });
      
      // Asociar el contacto con la empresa usando la relación muchos-a-muchos
      const companyResponse = await api.post(`/companies/${id}/contacts`, {
        contactIds: [contactResponse.data.id],
      });
      
      // Actualizar la empresa y los contactos asociados
      setCompany(companyResponse.data);
      const contacts = (companyResponse.data.Contacts && Array.isArray(companyResponse.data.Contacts))
        ? companyResponse.data.Contacts
        : [];
      setAssociatedContacts(contacts);
      
      setSuccessMessage('Contacto agregado exitosamente');
      setAddContactOpen(false);
      setContactFormData({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', lifecycleStage: 'lead' });
      setContactDialogTab('create');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error adding contact:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al agregar el contacto';
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleAddExistingContacts = async () => {
    try {
      if (selectedExistingContacts.length === 0) {
        return;
      }

      // Agregar contactos usando el nuevo endpoint muchos-a-muchos
      const response = await api.post(`/companies/${id}/contacts`, {
        contactIds: selectedExistingContacts,
      });
      
      // Actualizar la empresa y los contactos asociados
      setCompany(response.data);
      const contacts = (response.data.Contacts && Array.isArray(response.data.Contacts))
        ? response.data.Contacts
        : [];
      setAssociatedContacts(contacts);
      
      setSuccessMessage(`${selectedExistingContacts.length} contacto(s) agregado(s) exitosamente`);
      
      setAddContactOpen(false);
      setSelectedExistingContacts([]);
      setExistingContactsSearch('');
      setContactDialogTab('create');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error associating contacts:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al asociar los contactos';
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleOpenAddContactDialog = () => {
    setContactDialogTab('create');
    setSelectedExistingContacts([]);
    setExistingContactsSearch('');
    setContactFormData({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', lifecycleStage: 'lead' });
    setAddContactOpen(true);
    // Cargar contactos disponibles cuando se abre el diálogo
    if (allContacts.length === 0) {
      fetchAllContacts();
    }
  };


  const handleAddDeal = async () => {
    try {
      await api.post('/deals', {
        ...dealFormData,
        amount: parseFloat(dealFormData.amount) || 0,
        probability: dealFormData.probability ? parseInt(dealFormData.probability) : undefined,
        companyId: company?.id,
      });
      setSuccessMessage('Negocio agregado exitosamente');
      setAddDealOpen(false);
      setDealFormData({ name: '', amount: '', stage: 'qualification', closeDate: '', probability: '' });
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
        companyId: company?.id,
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
        companyId: company?.id,
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
        companyId: company?.id,
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
        handleOpenEmail();
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
    if (contactSortField === field) {
      setContactSortOrder(contactSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setContactSortField(field);
      setContactSortOrder('asc');
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

  const sortedContacts = [...associatedContacts].sort((a, b) => {
    if (!contactSortField) return 0;
    let aVal: any = a[contactSortField];
    let bVal: any = b[contactSortField];
    
    aVal = String(aVal || '').toLowerCase();
    bVal = String(bVal || '').toLowerCase();
    
    if (aVal < bVal) return contactSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return contactSortOrder === 'asc' ? 1 : -1;
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

  const filteredContacts = sortedContacts.filter((contact) => {
    if (contactSearch && !contact.firstName?.toLowerCase().includes(contactSearch.toLowerCase()) &&
        !contact.lastName?.toLowerCase().includes(contactSearch.toLowerCase()) &&
        !contact.email?.toLowerCase().includes(contactSearch.toLowerCase())) {
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
      const noteUrl = `${window.location.origin}/companies/${id}?activity=${noteId}`;
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

  if (!company) {
    return (
      <Box>
        <Typography>Empresa no encontrada</Typography>
        <Button onClick={() => navigate('/companies')}>Volver a Empresas</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#f5f7fa',
      minHeight: '100vh',
      pb: { xs: 2, sm: 4, md: 8 },
      px: { xs: 1, sm: 3, md: 8 },
      pt: { xs: 2, sm: 4, md: 6 },
      display: 'flex', 
      flexDirection: 'column',
    }}>

      {/* Contenido principal - Separado en 2 partes */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 3 },
        flex: 1,
        overflow: { xs: 'visible', md: 'hidden' },
        minHeight: { xs: 'auto', md: 0 },
      }}>
        {/* Parte 1: Columna Izquierda - Información de la Empresa */}
        <Card sx={{ 
          borderRadius: { xs: 2, md: 6 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: '500px' },
          flexShrink: 0,
          height: { xs: 'auto', md: 'calc(100vh - 100px)' },
          maxHeight: { xs: 'none', md: 'calc(100vh - 100px)' },
          p: { xs: 1, sm: 1.5, md: 2 },
        }}>
        {/* Columna Izquierda - Información de la Empresa */}
        <Box sx={{ 
          width: '100%', 
          flexShrink: 0, 
          height: { xs: 'auto', md: '100%' },
          maxHeight: { xs: 'none', md: '100%' },
          overflowY: { xs: 'visible', md: 'auto' },
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
          // Ocultar scrollbar pero mantener scroll funcional
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
          },
          // Para Firefox
          scrollbarWidth: 'none',
        }}>
          <Paper sx={{ 
            p: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}>
            {/* Avatar y Nombre */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
              <Box sx={{ position: 'relative', mb: { xs: 1, md: 2 } }}>
                <Avatar
                  sx={{
                    width: { xs: 80, md: 120 },
                    height: { xs: 80, md: 120 },
                    bgcolor: taxiMonterricoColors.green,
                    fontSize: { xs: '2rem', md: '3rem' },
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  {getInitials(company.name)}
                </Avatar>
                <CheckCircle 
                  sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    fontSize: { xs: 20, md: 28 },
                    color: '#10B981',
                    bgcolor: 'white',
                    borderRadius: '50%',
                    border: '2px solid white',
                  }} 
                />
              </Box>
              <Typography 
                variant="h6" 
                align="center"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  color: '#1F2937',
                  mb: 0.25,
                  px: { xs: 1, md: 0 },
                }}
              >
                {company.name}
              </Typography>
              {company.domain && (
                <Typography 
                  variant="body2"
                  align="center"
                  sx={{
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    color: '#757575',
                    fontWeight: 400,
                    px: { xs: 1, md: 0 },
                  }}
                >
                  {company.domain}
                </Typography>
              )}
            </Box>

            {/* Acciones Rápidas */}
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: { xs: 1, md: 1.5 }, mb: { xs: 2, md: 3 }, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, md: 0.75 } }}>
                <IconButton
                  onClick={handleOpenNote}
                  sx={{
                    width: { xs: 44, md: 52 },
                    height: { xs: 44, md: 52 },
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    color: taxiMonterricoColors.green,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#C8E6C9',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Note sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' }, color: '#1F2937', fontWeight: 500 }}>
                  Nota
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, md: 0.75 } }}>
                <IconButton
                  onClick={handleOpenEmail}
                  sx={{
                    width: { xs: 44, md: 52 },
                    height: { xs: 44, md: 52 },
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    color: taxiMonterricoColors.green,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#C8E6C9',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Email sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' }, color: '#1F2937', fontWeight: 500 }}>
                  Correo
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, md: 0.75 } }}>
                <IconButton
                  onClick={handleOpenCall}
                  sx={{
                    width: { xs: 44, md: 52 },
                    height: { xs: 44, md: 52 },
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    color: taxiMonterricoColors.green,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#C8E6C9',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Phone sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' }, color: '#1F2937', fontWeight: 500 }}>
                  Llamada
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, md: 0.75 } }}>
                <IconButton
                  onClick={handleOpenTask}
                  sx={{
                    width: { xs: 44, md: 52 },
                    height: { xs: 44, md: 52 },
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    color: taxiMonterricoColors.green,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#C8E6C9',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Assignment sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' }, color: '#1F2937', fontWeight: 500 }}>
                  Tarea
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, md: 0.75 } }}>
                <IconButton
                  onClick={handleOpenMeeting}
                  sx={{
                    width: { xs: 44, md: 52 },
                    height: { xs: 44, md: 52 },
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    color: taxiMonterricoColors.green,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#C8E6C9',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <Event sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' }, color: '#1F2937', fontWeight: 500 }}>
                  Reunión
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, md: 0.75 } }}>
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    width: { xs: 44, md: 52 },
                    height: { xs: 44, md: 52 },
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    color: taxiMonterricoColors.green,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#C8E6C9',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <MoreVert sx={{ fontSize: { xs: 18, md: 22 } }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' }, color: '#1F2937', fontWeight: 500 }}>
                  Más
                </Typography>
              </Box>
            </Box>
            <Menu 
              anchorEl={anchorEl} 
              open={Boolean(anchorEl)} 
              onClose={handleMenuClose}
              TransitionProps={{
                timeout: 200,
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
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
                onClick={handleMenuClose}
                sx={{
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                Editar
              </MenuItem>
              <MenuItem 
                onClick={handleMenuClose}
                sx={{
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                Eliminar
              </MenuItem>
              <MenuItem 
                onClick={handleMenuClose}
                sx={{
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                Duplicar
              </MenuItem>
            </Menu>

            <Divider sx={{ my: 2 }} />

            {/* Estadísticas */}
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, mb: { xs: 2, md: 3 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <Box sx={{ 
                flex: { xs: '1 1 calc(33.333% - 8px)', sm: 1 }, 
                minWidth: { xs: 'calc(33.333% - 8px)', sm: 'auto' },
                border: '1px dashed #E0E0E0', 
                borderRadius: { xs: 1, md: 2 }, 
                p: { xs: 1.5, md: 2 }, 
                textAlign: 'center',
                bgcolor: 'white',
              }}>
                <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 700, color: '#37474F', mb: 0.5 }}>
                  {associatedDeals.length}
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, color: '#9E9E9E', fontWeight: 400 }}>
                  Negocios
                </Typography>
              </Box>
              <Box sx={{ 
                flex: { xs: '1 1 calc(33.333% - 8px)', sm: 1 }, 
                minWidth: { xs: 'calc(33.333% - 8px)', sm: 'auto' },
                border: '1px dashed #E0E0E0', 
                borderRadius: { xs: 1, md: 2 }, 
                p: { xs: 1.5, md: 2 }, 
                textAlign: 'center',
                bgcolor: 'white',
              }}>
                <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 700, color: '#37474F', mb: 0.5 }}>
                  {associatedContacts.length}
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, color: '#9E9E9E', fontWeight: 400 }}>
                  Contactos
                </Typography>
              </Box>
              <Box sx={{ 
                flex: { xs: '1 1 calc(33.333% - 8px)', sm: 1 }, 
                minWidth: { xs: 'calc(33.333% - 8px)', sm: 'auto' },
                border: '1px dashed #E0E0E0', 
                borderRadius: { xs: 1, md: 2 }, 
                p: { xs: 1.5, md: 2 }, 
                textAlign: 'center',
                bgcolor: 'white',
              }}>
                <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 700, color: '#37474F', mb: 0.5 }}>
                  {activities.length}
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, color: '#9E9E9E', fontWeight: 400 }}>
                  Actividades
                </Typography>
              </Box>
            </Box>

            {/* Location */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                <LocationOn sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#757575',
                  }}
                >
                  Ubicación
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  fontWeight: 400,
                  color: (company.city || company.address) ? '#424242' : '#9CA3AF',
                  textAlign: { xs: 'left', sm: 'right' },
                  wordBreak: 'break-word',
                }}
              >
                {company.city || company.address || '--'}
              </Typography>
            </Box>

            {/* Número de teléfono */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                <Phone sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#757575',
                  }}
                >
                  Teléfono
                </Typography>
              </Box>
              {editingPhone ? (
                <TextField
                  size="small"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  onBlur={async () => {
                    try {
                      await api.put(`/companies/${company.id}`, { phone: phoneValue });
                      setCompany({ ...company, phone: phoneValue });
                      setEditingPhone(false);
                    } catch (error) {
                      console.error('Error updating phone:', error);
                      setPhoneValue(company.phone || '');
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
                    width: { xs: '100%', sm: '200px' },
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
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
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: company.phone ? '#424242' : '#9CA3AF',
                    cursor: 'pointer',
                    textAlign: { xs: 'left', sm: 'right' },
                    wordBreak: 'break-word',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                  onClick={() => setEditingPhone(true)}
                >
                  {company.phone || '--'}
                </Typography>
              )}
            </Box>

            {/* Correo/Dominio */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                <Email sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#757575',
                  }}
                >
                  Dominio
                </Typography>
              </Box>
              {editingDomain ? (
                <TextField
                  size="small"
                  value={domainValue}
                  onChange={(e) => setDomainValue(e.target.value)}
                  onBlur={async () => {
                    try {
                      await api.put(`/companies/${company.id}`, { domain: domainValue });
                      setCompany({ ...company, domain: domainValue });
                      setEditingDomain(false);
                    } catch (error) {
                      console.error('Error updating domain:', error);
                      setDomainValue(company.domain || '');
                      setEditingDomain(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  autoFocus
                  sx={{
                    width: { xs: '100%', sm: '200px' },
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
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
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: company.domain ? '#424242' : '#9CA3AF',
                    cursor: 'pointer',
                    textAlign: { xs: 'left', sm: 'right' },
                    wordBreak: 'break-word',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                  onClick={() => setEditingDomain(true)}
                >
                  {company.domain || '--'}
                </Typography>
              )}
            </Box>

            {/* Industria */}
            {company.industry && (
              <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                  <Business sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      fontWeight: 400,
                      color: '#757575',
                    }}
                  >
                    Industria
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#424242',
                    textAlign: { xs: 'left', sm: 'right' },
                    wordBreak: 'break-word',
                  }}
                >
                  {company.industry}
                </Typography>
              </Box>
            )}

            {/* Estado del lead */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                <Flag sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#757575',
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
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: company.leadStatus ? '#424242' : '#9CA3AF',
                    cursor: 'pointer',
                    textAlign: { xs: 'left', sm: 'right' },
                    wordBreak: 'break-word',
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                >
                  {company.leadStatus || '--'}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: { xs: 12, md: 14 }, color: '#9E9E9E' }} />
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
                        await api.put(`/companies/${company.id}`, { leadStatus: status });
                        setCompany({ ...company, leadStatus: status });
                        setLeadStatusMenuAnchor(null);
                        fetchCompany();
                      } catch (error) {
                        console.error('Error updating lead status:', error);
                      }
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      backgroundColor: company.leadStatus === status ? '#e3f2fd' : 'transparent',
                    }}
                  >
                    {status}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Etapa del ciclo de vida */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                <TrendingUp sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#757575',
                  }}
                >
                  Etapa del ciclo de vida
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  onClick={(e) => setLifecycleStageMenuAnchor(e.currentTarget)}
                  sx={{
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#424242',
                    cursor: 'pointer',
                    textAlign: { xs: 'left', sm: 'right' },
                    textDecoration: 'underline',
                    textDecorationColor: '#00bcd4',
                    wordBreak: 'break-word',
                    '&:hover': {
                      textDecorationColor: '#0097a7',
                    },
                  }}
                >
                  {company.lifecycleStage}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: { xs: 12, md: 14 }, color: '#9E9E9E' }} />
              </Box>
              <Menu
                anchorEl={lifecycleStageMenuAnchor}
                open={Boolean(lifecycleStageMenuAnchor)}
                onClose={() => setLifecycleStageMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    minWidth: 200,
                    mt: 0.5,
                  },
                }}
              >
                {['subscriber', 'lead', 'marketing qualified lead', 'sales qualified lead', 'opportunity', 'customer', 'evangelist'].map((stage) => (
                  <MenuItem
                    key={stage}
                    onClick={async () => {
                      try {
                        await api.put(`/companies/${company.id}`, { lifecycleStage: stage });
                        setCompany({ ...company, lifecycleStage: stage });
                        setLifecycleStageMenuAnchor(null);
                        fetchCompany(); // Refrescar para obtener datos actualizados
                      } catch (error) {
                        console.error('Error updating lifecycle stage:', error);
                      }
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      backgroundColor: company.lifecycleStage === stage ? '#e3f2fd' : 'transparent',
                    }}
                  >
                    {stage === 'subscriber' ? 'Suscriptor' :
                     stage === 'lead' ? 'Lead' : 
                     stage === 'marketing qualified lead' ? 'Marketing Qualified Lead' :
                     stage === 'sales qualified lead' ? 'Sales Qualified Lead' :
                     stage === 'opportunity' ? 'Oportunidad' :
                     stage === 'customer' ? 'Cliente' :
                     stage === 'evangelist' ? 'Evangelista' : stage}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Rol de compra */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, flex: 1 }}>
                <Person sx={{ fontSize: { xs: 18, md: 20 }, color: '#9E9E9E' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#757575',
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
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    fontWeight: 400,
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    textAlign: { xs: 'left', sm: 'right' },
                    '&:hover': {
                      textDecoration: 'underline',
                      textDecorationColor: '#00bcd4',
                    },
                  }}
                >
                  --
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: { xs: 12, md: 14 }, color: '#9E9E9E' }} />
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

            <Divider sx={{ my: { xs: 1.5, md: 2 } }} />

            {/* Sección Social */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
                Social
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  // Aquí puedes agregar un menú de opciones si es necesario
                }}
                sx={{ p: 0.5 }}
              >
                <MoreVert sx={{ fontSize: { xs: 16, md: 18 }, color: 'text.secondary' }} />
              </IconButton>
            </Box>
            <Divider sx={{ mb: { xs: 1, md: 1.5 } }} />
            
            {/* Lista de redes sociales */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 } }}>
              {/* Facebook */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                <Avatar sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#1877f2' }}>
                  <Facebook sx={{ fontSize: { xs: 18, md: 20 } }} />
                </Avatar>
                <Link
                  href={company.facebook || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!company.facebook || company.facebook === '#') {
                      e.preventDefault();
                      const currentUrl = company.facebook || '';
                      const url = prompt('Ingresa la URL de Facebook:', currentUrl || 'https://www.facebook.com/');
                      if (url !== null) {
                        api.put(`/companies/${company.id}`, { facebook: url || null }).then(() => {
                          setCompany({ ...company, facebook: url || undefined });
                          fetchCompany();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                    // Si existe URL, dejar que el link funcione normalmente
                  }}
                  sx={{
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    color: company.facebook ? '#1976d2' : '#9E9E9E',
                    textDecoration: 'none',
                    flex: 1,
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: company.facebook ? '#1565c0' : '#757575',
                    },
                  }}
                >
                  {company.facebook || 'Agregar Facebook'}
                </Link>
              </Box>

              {/* Twitter */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                <Avatar sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#1da1f2' }}>
                  <Twitter sx={{ fontSize: { xs: 18, md: 20 } }} />
                </Avatar>
                <Link
                  href={company.twitter || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!company.twitter || company.twitter === '#') {
                      e.preventDefault();
                      const currentUrl = company.twitter || '';
                      const url = prompt('Ingresa la URL de Twitter:', currentUrl || 'https://www.twitter.com/');
                      if (url !== null) {
                        api.put(`/companies/${company.id}`, { twitter: url || null }).then(() => {
                          setCompany({ ...company, twitter: url || undefined });
                          fetchCompany();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                    // Si existe URL, dejar que el link funcione normalmente
                  }}
                  sx={{
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    color: company.twitter ? '#1976d2' : '#9E9E9E',
                    textDecoration: 'none',
                    flex: 1,
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: company.twitter ? '#1565c0' : '#757575',
                    },
                  }}
                >
                  {company.twitter || 'Agregar Twitter'}
                </Link>
              </Box>

              {/* GitHub */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                <Avatar sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#24292e' }}>
                  <GitHub sx={{ fontSize: { xs: 18, md: 20 } }} />
                </Avatar>
                <Link
                  href={company.github || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!company.github || company.github === '#') {
                      e.preventDefault();
                      const currentUrl = company.github || '';
                      const url = prompt('Ingresa la URL de GitHub:', currentUrl || 'https://www.github.com/');
                      if (url !== null) {
                        api.put(`/companies/${company.id}`, { github: url || null }).then(() => {
                          setCompany({ ...company, github: url || undefined });
                          fetchCompany();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                    // Si existe URL, dejar que el link funcione normalmente
                  }}
                  sx={{
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    color: company.github ? '#1976d2' : '#9E9E9E',
                    textDecoration: 'none',
                    flex: 1,
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: company.github ? '#1565c0' : '#757575',
                    },
                  }}
                >
                  {company.github || 'Agregar GitHub'}
                </Link>
              </Box>

              {/* LinkedIn */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                <Avatar sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#0077b5' }}>
                  <LinkedIn sx={{ fontSize: { xs: 18, md: 20 } }} />
                </Avatar>
                <Link
                  href={company.linkedin || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!company.linkedin || company.linkedin === '#') {
                      e.preventDefault();
                      const currentUrl = company.linkedin || '';
                      const url = prompt('Ingresa la URL de LinkedIn:', currentUrl || 'https://www.linkedin.com/');
                      if (url !== null) {
                        api.put(`/companies/${company.id}`, { linkedin: url || null }).then(() => {
                          setCompany({ ...company, linkedin: url || undefined });
                          fetchCompany();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                    // Si existe URL, dejar que el link funcione normalmente
                  }}
                  sx={{
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    color: company.linkedin ? '#1976d2' : '#9E9E9E',
                    textDecoration: 'none',
                    flex: 1,
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: company.linkedin ? '#1565c0' : '#757575',
                    },
                  }}
                >
                  {company.linkedin || 'Agregar LinkedIn'}
                </Link>
              </Box>

              {/* YouTube */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                <Avatar sx={{ width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 }, bgcolor: '#ff0000' }}>
                  <YouTube sx={{ fontSize: { xs: 18, md: 20 } }} />
                </Avatar>
                <Link
                  href={company.youtube || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!company.youtube || company.youtube === '#') {
                      e.preventDefault();
                      const currentUrl = company.youtube || '';
                      const url = prompt('Ingresa la URL de YouTube:', currentUrl || 'https://www.youtube.com/');
                      if (url !== null) {
                        api.put(`/companies/${company.id}`, { youtube: url || null }).then(() => {
                          setCompany({ ...company, youtube: url || undefined });
                          fetchCompany();
                        }).catch(err => console.error('Error al guardar:', err));
                      }
                    }
                    // Si existe URL, dejar que el link funcione normalmente
                  }}
                  sx={{
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    color: company.youtube ? '#1976d2' : '#9E9E9E',
                    textDecoration: 'none',
                    flex: 1,
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: company.youtube ? '#1565c0' : '#757575',
                    },
                  }}
                >
                  {company.youtube || 'Agregar YouTube'}
                </Link>
              </Box>
            </Box>

          </Paper>
        </Box>
        </Card>

        {/* Parte 2: Columnas Central y Derecha */}
        <Card sx={{ 
          borderRadius: { xs: 2, md: 6 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: { xs: '100%', md: 'auto' },
          height: { xs: 'auto', md: 'calc(100vh - 100px)' },
          maxHeight: { xs: 'none', md: 'calc(100vh - 100px)' },
          p: { xs: 1, sm: 1.5, md: 2 },
        }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: summaryExpanded ? { xs: 1, md: 2 } : 0,
            flex: 1, 
            overflow: 'hidden',
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
                  color: '#9E9E9E',
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
                <Card sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2 }}>
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
                        {company.createdAt 
                          ? new Date(company.createdAt).toLocaleDateString('es-ES', { 
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
                          label={company.lifecycleStage} 
                          color={getStageColor(company.lifecycleStage)} 
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
                <Card sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      {/* Campo de búsqueda */}
                      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                        <TextField
                          size="small"
                          placeholder="Buscar"
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f5f5f5',
                              '& fieldset': {
                                borderColor: '#e0e0e0',
                              },
                              '&:hover fieldset': {
                                borderColor: '#bdbdbd',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2E7D32',
                              },
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
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <Edit sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          Crear nota
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('email')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <Email sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          Crear correo
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('call')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <Phone sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          Hacer llamada telefónica
                        </Typography>
                        <KeyboardArrowRight sx={{ fontSize: 20, color: 'text.secondary' }} />
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('task')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <Assignment sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          Crear tarea
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        onClick={() => handleCreateActivity('meeting')}
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <Event sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          Programar reunión
                        </Typography>
                      </MenuItem>
                      
                      <MenuItem 
                        sx={{
                          py: 1.5,
                          px: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <LinkIcon sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          Inscribir en una secuencia
                        </Typography>
                        <Lock sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
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
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          maxHeight: 400,
                          overflow: 'auto',
                        },
                      }}
                    >
                      {/* Campo de búsqueda */}
                      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
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
                              backgroundColor: 'white',
                              '& fieldset': {
                                borderColor: '#4fc3f7',
                                borderWidth: 1.5,
                              },
                              '&:hover fieldset': {
                                borderColor: '#4fc3f7',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#4fc3f7',
                              },
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
                              backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                              },
                            }}
                          >
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              {option}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                      
                      {/* Separador */}
                      <Divider sx={{ my: 0.5 }} />
                      
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
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                          Período personalizado
                        </Typography>
                        <KeyboardArrowRight sx={{ fontSize: 18, color: 'text.secondary' }} />
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
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          maxHeight: 400,
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
                      {/* Campo de búsqueda */}
                      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
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
                              backgroundColor: '#f5f5f5',
                              '& fieldset': {
                                borderColor: '#e0e0e0',
                              },
                              '&:hover fieldset': {
                                borderColor: '#bdbdbd',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2E7D32',
                              },
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
                            backgroundColor: '#e3f2fd',
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
                      
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                      
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                      
                      <                      MenuItem
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 6,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
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
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          borderColor: '#2E7D32',
                                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
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
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f0f0f0' }}>
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
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 1,
                                                    p: 2,
                                                    backgroundColor: '#fafafa',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
                                                    borderRight: '1px solid #e0e0e0',
                                                    pr: 2,
                                                    height: '100%',
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                  }}>
                                                  {/* Lista de categorías siempre visible */}
                                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {['Seleccionados', 'Alertas', 'Carritos', 'Clientes', 'Contactos', 'Leads', 'Negocios', 'Tickets'].map((category) => {
                                                      const currentCategory = activitySelectedCategory[activity.id] || 'Contactos';
                                                      const isSelected = currentCategory === category;
                                                      
                                                      // Calcular el conteo para cada categoría
                                                      const getCategoryCount = () => {
                                                        if (category === 'Seleccionados') return getActivityTotalAssociations(activity.id);
                                                        if (category === 'Contactos') {
                                                          const contacts = activitySelectedContacts[activity.id] || [];
                                                          const excludedContactsForActivity = activityExcludedContacts[activity.id] || [];
                                                          const associatedContactIds = (associatedContacts || [])
                                                            .map((c: any) => c && c.id)
                                                            .filter((id: any) => id !== undefined && id !== null && !excludedContactsForActivity.includes(id));
                                                          const allContactIds = [...contacts, ...associatedContactIds];
                                                          return allContactIds.filter((id, index) => allContactIds.indexOf(id) === index).length;
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
                                                            backgroundColor: isSelected ? '#E3F2FD' : 'transparent',
                                                            borderLeft: isSelected ? '3px solid #00bcd4' : '3px solid transparent',
                                                            '&:hover': {
                                                              backgroundColor: '#f5f5f5',
                                                            },
                                                          }}
                                                        >
                                                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: isSelected ? '#00bcd4' : '#666' }}>
                                                            {category === 'Alertas' ? 'Alertas del esp...' : category === 'Clientes' ? 'Clientes de par...' : category}
                                                          </Typography>
                                                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
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
                                                              const associatedContactIds = (associatedContacts || [])
                                                                .map((c: any) => c && c.id)
                                                                .filter((id: any) => id !== undefined && id !== null && !excludedContactsForActivity.includes(id));
                                                              const allContactIds = [...contacts, ...associatedContactIds];
                                                              return allContactIds.filter((id, index) => allContactIds.indexOf(id) === index).length;
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
                                                      placeholder={`Buscar ${(activitySelectedCategory[activity.id] || 'Contactos') === 'Contactos' ? 'Contactos' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Negocios' ? 'Negocios' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Tickets' ? 'Tickets' : (activitySelectedCategory[activity.id] || 'Contactos') === 'Leads' ? 'Leads' : (activitySelectedCategory[activity.id] || 'Contactos')}`}
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
                                                    {(activitySelectedCategory[activity.id] || 'Contactos') === 'Contactos' && (
                                                      <>
                                                        {(allContacts.length > 0 ? allContacts : associatedContacts).filter((contact: any) => 
                                                            !activityAssociationSearch[activity.id] || 
                                                            (contact.firstName && contact.firstName.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase())) ||
                                                            (contact.lastName && contact.lastName.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase())) ||
                                                            (contact.email && contact.email.toLowerCase().includes((activityAssociationSearch[activity.id] || '').toLowerCase()))
                                                        ).map((contact: any) => {
                                                          // Verificar si el contacto está asociado automáticamente o seleccionado manualmente
                                                          const isAssociated = associatedContacts.some((ac: any) => ac && ac.id === contact.id);
                                                          const isSelected = (activitySelectedContacts[activity.id] || []).includes(contact.id);
                                                          const excludedContactsForActivity = activityExcludedContacts[activity.id] || [];
                                                          const isExcluded = excludedContactsForActivity.includes(contact.id);
                                                          // Está marcado si está seleccionado o asociado, pero no si fue excluido
                                                          const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                                                          
                                                          return (
                                                            <Box key={contact.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                                              <Checkbox
                                                                checked={shouldBeChecked}
                                                                onChange={(e) => {
                                                                  const currentContacts = activitySelectedContacts[activity.id] || [];
                                                                  const currentExcluded = activityExcludedContacts[activity.id] || [];
                                                                  if (e.target.checked) {
                                                                    // Si está asociado y estaba excluido, removerlo de excluidos
                                                                    if (isExcluded) {
                                                                      setActivityExcludedContacts({
                                                                        ...activityExcludedContacts,
                                                                        [activity.id]: currentExcluded.filter((id: number) => id !== contact.id),
                                                                      });
                                                                    }
                                                                    // Si no está en selectedContacts, agregarlo
                                                                    if (!currentContacts.includes(contact.id)) {
                                                                      setActivitySelectedContacts({
                                                                        ...activitySelectedContacts,
                                                                        [activity.id]: [...currentContacts, contact.id],
                                                                      });
                                                                    }
                                                                  } else {
                                                                    // Si se desmarca, remover de selectedContacts y agregar a excluidos si está asociado
                                                                    setActivitySelectedContacts({
                                                                      ...activitySelectedContacts,
                                                                      [activity.id]: currentContacts.filter((id: number) => id !== contact.id),
                                                                    });
                                                                    if (isAssociated && !currentExcluded.includes(contact.id)) {
                                                                      setActivityExcludedContacts({
                                                                        ...activityExcludedContacts,
                                                                        [activity.id]: [...currentExcluded, contact.id],
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
                                                                  {contact.email && (
                                                                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.875rem' }}>
                                                                      ({contact.email})
                                                                    </Typography>
                                                                  )}
                                                                </Typography>
                                                              </Tooltip>
                                                            </Box>
                                                          );
                                                        })}
                                                        {(allContacts.length > 0 ? allContacts : associatedContacts).length === 0 && (
                                                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                                                            No hay contactos disponibles
                                                          </Typography>
                                                        )}
                                                      </>
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
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        bgcolor: 'white',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          borderColor: '#2E7D32',
                                          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
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

                {/* Contactos */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Contactos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link 
                        sx={{ fontSize: '0.875rem', cursor: 'pointer' }}
                        onClick={handleOpenAddContactDialog}
                      >
                        + Agregar
                      </Link>
                      <IconButton size="small">
                        <Settings fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Buscar"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    sx={{ 
                      mb: 2,
                      transition: 'all 0.3s ease',
                      '& .MuiOutlinedInput-root': {
                        '&:hover': {
                          '& fieldset': {
                            borderColor: '#2E7D32',
                          },
                        },
                        '&.Mui-focused': {
                          transform: 'scale(1.02)',
                          '& fieldset': {
                            borderColor: '#2E7D32',
                            borderWidth: 2,
                          },
                        },
                      },
                    }}
                  />
                  {filteredContacts.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <TableSortLabel
                                active={contactSortField === 'firstName'}
                                direction={contactSortField === 'firstName' ? contactSortOrder : 'asc'}
                                onClick={() => handleSortCompanies('firstName')}
                              >
                                NOMBRE
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={contactSortField === 'email'}
                                direction={contactSortField === 'email' ? contactSortOrder : 'asc'}
                                onClick={() => handleSortCompanies('email')}
                              >
                                CORREO ELECTRÓNICO
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={contactSortField === 'phone'}
                                direction={contactSortField === 'phone' ? contactSortOrder : 'asc'}
                                onClick={() => handleSortCompanies('phone')}
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
                              sx={{
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                                  transform: 'scale(1.01)',
                                },
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Business fontSize="small" color="action" />
                                  {contact.firstName} {contact.lastName}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {contact.email || '--'}
                                  {contact.email && (
                                    <>
                                      <IconButton 
                                        size="small" 
                                        sx={{ p: 0.5 }}
                                        onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                                        title="Enviar correo"
                                      >
                                        <OpenInNew fontSize="small" />
                                      </IconButton>
                                      <IconButton 
                                        size="small" 
                                        sx={{ p: 0.5 }}
                                        onClick={() => handleCopyToClipboard(contact.email || '')}
                                        title="Copiar correo"
                                      >
                                        <ContentCopy fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{company.phone || '--'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  )}
                </Box>

                {/* Negocios */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Negocios
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link 
                        sx={{ fontSize: '0.875rem', cursor: 'pointer' }}
                        onClick={() => {
                          setDealFormData({ name: '', amount: '', stage: 'qualification', closeDate: '', probability: '' });
                          setAddDealOpen(true);
                        }}
                      >
                        + Agregar
                      </Link>
                      <IconButton size="small">
                        <Settings fontSize="small" />
                      </IconButton>
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
                    fullWidth
                    sx={{ mb: 2 }}
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
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  )}
                </Box>

                {/* Tickets */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Tickets
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link 
                        component="button" 
                        sx={{ fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: 'none', color: 'primary.main' }}
                        onClick={() => setAddTicketOpen(true)}
                      >
                        + Agregar
                      </Link>
                      <IconButton size="small">
                        <Settings fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {associatedTickets.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
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
                </Box>

                {/* Suscripciones */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Suscripciones ({associatedSubscriptions.length})
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link 
                        component="button" 
                        sx={{ fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: 'none', color: 'primary.main' }}
                        onClick={() => setAddSubscriptionOpen(true)}
                      >
                        + Agregar
                      </Link>
                      <IconButton size="small">
                        <Settings fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {associatedSubscriptions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
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
                </Box>

                {/* Pagos */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Pagos ({associatedPayments.length})
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link 
                        component="button" 
                        sx={{ fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: 'none', color: 'primary.main' }}
                        onClick={() => setAddPaymentOpen(true)}
                      >
                        + Agregar
                      </Link>
                      <IconButton size="small">
                        <Settings fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {associatedPayments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No existen objetos asociados de este tipo o no tienes permiso para verlos.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fecha pago</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Referencia</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associatedPayments.map((payment) => (
                            <TableRow key={payment.id} hover>
                              <TableCell>
                                {payment.currency || 'USD'} ${parseFloat(payment.amount || 0).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.status} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: payment.status === 'completed' ? '#c8e6c9' :
                                            payment.status === 'failed' ? '#ffcdd2' :
                                            payment.status === 'refunded' ? '#e0e0e0' :
                                            payment.status === 'cancelled' ? '#e0e0e0' : '#fff9c4',
                                    textTransform: 'capitalize'
                                  }} 
                                />
                              </TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {payment.paymentMethod?.replace('_', ' ')}
                              </TableCell>
                              <TableCell>
                                {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-ES') : '-'}
                              </TableCell>
                              <TableCell>{payment.reference || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 3 }}>
                  {/* Barra de búsqueda y controles */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Buscar actividac"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Search fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: '300px' }}
                    />
                  </Box>

                  {/* Filtros de tipo de actividad */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setSelectedActivityType('all')}
                      sx={{
                        color: selectedActivityType === 'all' ? '#1976d2' : 'text.secondary',
                        textTransform: 'none',
                        borderBottom: selectedActivityType === 'all' ? '2px solid #1976d2' : 'none',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Actividad
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedActivityType('note')}
                      sx={{
                        color: selectedActivityType === 'note' ? '#1976d2' : 'text.secondary',
                        textTransform: 'none',
                        borderBottom: selectedActivityType === 'note' ? '2px solid #1976d2' : 'none',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Notas
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedActivityType('email')}
                      sx={{
                        color: selectedActivityType === 'email' ? '#1976d2' : 'text.secondary',
                        textTransform: 'none',
                        borderBottom: selectedActivityType === 'email' ? '2px solid #1976d2' : 'none',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Correos
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedActivityType('call')}
                      sx={{
                        color: selectedActivityType === 'call' ? '#1976d2' : 'text.secondary',
                        textTransform: 'none',
                        borderBottom: selectedActivityType === 'call' ? '2px solid #1976d2' : 'none',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Llamadas
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedActivityType('task')}
                      sx={{
                        color: selectedActivityType === 'task' ? '#1976d2' : 'text.secondary',
                        textTransform: 'none',
                        borderBottom: selectedActivityType === 'task' ? '2px solid #1976d2' : 'none',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Tareas
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedActivityType('meeting')}
                      sx={{
                        color: selectedActivityType === 'meeting' ? '#1976d2' : 'text.secondary',
                        textTransform: 'none',
                        borderBottom: selectedActivityType === 'meeting' ? '2px solid #1976d2' : 'none',
                        borderRadius: 0,
                        minWidth: 'auto',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      Reuniones
                    </Button>
                  </Box>

                  {/* Filtros dropdown */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <Chip
                      label="Filtrar por: Filtrar actividad (23/33)"
                      size="small"
                      deleteIcon={<KeyboardArrowDown fontSize="small" />}
                      onDelete={() => {}}
                      onClick={() => {}}
                      sx={{
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#bbdefb',
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
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#bbdefb',
                        },
                      }}
                    />
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
                                    border: '1px solid #e0e0e0',
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
                                    border: '1px solid #e0e0e0',
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
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No hay actividades registradas para este contacto.
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
                      <Chip label={company.lifecycleStage} color={getStageColor(company.lifecycleStage)} />
                      {company.industry && <Chip label={`Industria: ${company.industry}`} />}
                      {company.domain && <Chip label={company.domain} />}
                      {company.city && <Chip label={company.city} />}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Descripción de la empresa
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {company.notes || company.name || '--'}
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
            </Box>
          </Paper>
        </Box>

        {/* Columna Derecha - Registros Asociados */}
        <Box sx={{ 
          display: { xs: summaryExpanded ? 'block' : 'none', lg: 'block' },
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
              {/* Resumen AI */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Resumen de registros
                  </Typography>
                  <Chip label="+AI" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Generado {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No hay actividades asociadas. Proporciona más información para obtener un resumen completo.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <IconButton size="small">
                    <ThumbUp fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <ThumbDown fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <Comment fontSize="small" />
                  </IconButton>
                </Box>
                <Button size="small" variant="contained" sx={{ mt: 1, bgcolor: '#e91e63' }}>
                  Hacer una pregunta
                </Button>
              </Box>

            {/* Contactos */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Contactos ({associatedContacts.length})
                </Typography>
                <Box>
                  <Button size="small" onClick={handleOpenAddContactDialog}>+Agregar</Button>
                  <IconButton size="small">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {associatedContacts.length > 0 ? (
                <List>
                  {associatedContacts.map((contact: any) => (
                    <ListItem key={contact.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#2E7D32' }}>
                          {getInitials(contact.firstName || '', contact.lastName || '')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {contact.firstName} {contact.lastName}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {contact.email && (
                              <Typography variant="caption" display="block">
                                {contact.email}
                              </Typography>
                            )}
                            {contact.jobTitle && (
                              <Typography variant="caption" display="block">
                                {contact.jobTitle}
                              </Typography>
                            )}
                            <Link href={`/contacts/${contact.id}`} variant="caption" sx={{ mr: 2 }}>
                              Ver Contacto
                            </Link>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay contactos asociados.
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
                  <Button size="small">+Agregar</Button>
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
                  <Button size="small" onClick={() => setAddTicketOpen(true)}>+Agregar</Button>
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

            {/* Suscripciones en Resumen */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Suscripciones ({associatedSubscriptions.length})
                </Typography>
                <Box>
                  <Button size="small" onClick={() => setAddSubscriptionOpen(true)}>+Agregar</Button>
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
            </Box>

            {/* Pagos en Resumen */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Pagos ({associatedPayments.length})
                </Typography>
                <Box>
                  <Button size="small" onClick={() => setAddPaymentOpen(true)}>+Agregar</Button>
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
            </Box>
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

      {/* Ventana flotante de Nota */}
      {noteOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: { xs: '100vw', sm: '500px' },
            maxWidth: { xs: '100vw', sm: '90vw' },
            height: '100vh',
            backgroundColor: 'white',
            boxShadow: { xs: 'none', sm: '-4px 0 20px rgba(0,0,0,0.15)' },
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideInRight 0.3s ease-out',
            '@keyframes slideInRight': {
              '0%': {
                transform: 'translateX(100%)',
              },
              '100%': {
                transform: 'translateX(0)',
              },
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado personalizado */}
          <Box
            sx={{
              p: 0,
              m: 0,
              background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '56px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 2.5 }}>
              <IconButton 
                sx={{ 
                  color: 'white', 
                  mr: 1,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }} 
                size="small"
              >
                <KeyboardArrowDown />
              </IconButton>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                Nota
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', pr: 0.5 }}>
              <IconButton 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }} 
                size="small"
              >
                <Fullscreen fontSize="small" />
              </IconButton>
              <IconButton 
                sx={{ 
                  color: 'white', 
                  mr: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
                }} 
                size="small" 
                onClick={() => setNoteOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden', overflowY: 'auto' }}>
          {/* Campo "Para" */}
          <Box sx={{ 
            mb: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: 1,
            border: `1px solid ${taxiMonterricoColors.greenLight}40`, 
            borderRadius: 2, 
            p: 2,
            backgroundColor: `${taxiMonterricoColors.greenLight}10`,
            boxShadow: `0 1px 3px ${taxiMonterricoColors.green}20`,
          }}>
            <Typography variant="body2" sx={{ mr: 1, color: taxiMonterricoColors.green, fontWeight: 600, fontSize: '0.875rem' }}>
              Para
            </Typography>
            <Chip
              label={`${company?.name || 'Empresa'}`}
              sx={{ 
                mr: 0.5, 
                backgroundColor: taxiMonterricoColors.green,
                color: 'white',
                height: '28px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
            <Typography variant="body2" sx={{ color: '#546e7a', fontSize: '0.8125rem' }}>
              y 2 registros
            </Typography>
          </Box>

          {/* Editor de texto enriquecido con barra de herramientas integrada */}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            border: '1px solid #e0e0e0', 
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2.5,
            minHeight: '300px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.2s ease',
            '&:focus-within': {
              boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
              borderColor: taxiMonterricoColors.green,
            },
          }}>
            <RichTextEditor
              value={noteData.description}
              onChange={(value: string) => setNoteData({ ...noteData, description: value })}
              placeholder="Empieza a escribir para dejar una nota..."
            />
          </Box>

          {/* Sección "Asociado con X registros" - Siempre visible */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2, 
              p: 2, 
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              maxHeight: '500px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              {/* Lista de categorías en el lado izquierdo */}
              <Box sx={{ 
                width: '200px', 
                flexShrink: 0,
                borderRight: '1px solid #e8eaf6',
                pr: 2,
                maxHeight: '500px',
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f5f5f5',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#bdbdbd',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: '#9e9e9e',
                  },
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
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Seleccionados' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Seleccionados' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Seleccionados' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Seleccionados' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Seleccionados' ? 600 : 400,
                    }}>
                      Seleccionados
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
                      {totalAssociations}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Alertas')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Alertas' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Alertas' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Alertas' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Alertas' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Alertas' ? 600 : 400,
                    }}>
                      Alertas del esp...
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
                      0
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Carritos')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Carritos' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Carritos' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Carritos' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Carritos' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Carritos' ? 600 : 400,
                    }}>
                      Carritos
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
                      0
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Clientes')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Clientes' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Clientes' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Clientes' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Clientes' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Clientes' ? 600 : 400,
                    }}>
                      Clientes de par...
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
                      0
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Contactos')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Contactos' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Contactos' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Contactos' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Contactos' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Contactos' ? 600 : 400,
                    }}>
                      Contactos
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
                      {contactsToCount.length}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Leads')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Leads' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Leads' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Leads' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Leads' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Leads' ? 600 : 400,
                    }}>
                      Leads
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
                      {selectedLeads.length}
                    </Typography>
                  </Box>
                  
                  <Box
                    onClick={() => setSelectedAssociationCategory('Negocios')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Negocios' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Negocios' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Negocios' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Negocios' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Negocios' ? 600 : 400,
                    }}>
                      Negocios
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
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
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedAssociationCategory === 'Tickets' ? `${taxiMonterricoColors.greenLight}20` : 'transparent',
                      borderLeft: selectedAssociationCategory === 'Tickets' ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedAssociationCategory === 'Tickets' ? `${taxiMonterricoColors.greenLight}20` : `${taxiMonterricoColors.greenLight}10`,
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.875rem', 
                      color: selectedAssociationCategory === 'Tickets' ? taxiMonterricoColors.green : '#546e7a',
                      fontWeight: selectedAssociationCategory === 'Tickets' ? 600 : 400,
                    }}>
                      Tickets
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#999' }}>
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
                  <Typography variant="body2" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '0.875rem' }}>
                    {selectedAssociationCategory} ({
                      selectedAssociationCategory === 'Contactos' ? (() => {
                        const associatedContactIds = (associatedContacts || [])
                          .map((c: any) => c && c.id)
                          .filter((id: any) => id !== undefined && id !== null && !excludedContacts.includes(id));
                        const allContactIds = [...selectedContacts, ...associatedContactIds];
                        return allContactIds.filter((id, index) => allContactIds.indexOf(id) === index).length;
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
                  <KeyboardArrowDown sx={{ color: taxiMonterricoColors.green, fontSize: 18 }} />
                </Box>
                <TextField
                  size="small"
                  placeholder={`Buscar ${selectedAssociationCategory === 'Contactos' ? 'Contactos' : selectedAssociationCategory === 'Leads' ? 'Leads' : selectedAssociationCategory === 'Negocios' ? 'Negocios' : selectedAssociationCategory === 'Tickets' ? 'Tickets' : selectedAssociationCategory}`}
                  value={associationSearch}
                  onChange={(e) => setAssociationSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search sx={{ color: taxiMonterricoColors.green }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 1.5,
                    flexShrink: 0,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                      '&:hover fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                  }}
                />
                
                {/* Resultados de búsqueda */}
                <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                    {selectedAssociationCategory === 'Contactos' && (
                      <>
                        {(allContacts.length > 0 ? allContacts : associatedContacts).filter((contact: any) => 
                          !associationSearch || 
                          (contact.firstName && contact.firstName.toLowerCase().includes(associationSearch.toLowerCase())) ||
                          (contact.lastName && contact.lastName.toLowerCase().includes(associationSearch.toLowerCase())) ||
                          (contact.email && contact.email.toLowerCase().includes(associationSearch.toLowerCase()))
                        ).map((contact: any) => {
                          // Verificar si el contacto está asociado o seleccionado
                          const isAssociated = associatedContacts.some((ac: any) => ac && ac.id === contact.id);
                          const isSelected = selectedContacts.includes(contact.id);
                          const isExcluded = excludedContacts.includes(contact.id);
                          // Está marcado si está seleccionado o asociado, pero no si fue excluido
                          const shouldBeChecked = (isSelected || isAssociated) && !isExcluded;
                          
                          return (
                            <Box key={contact.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
                              <Checkbox
                                checked={shouldBeChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Si está asociado y estaba excluido, removerlo de excluidos
                                    if (isExcluded) {
                                      setExcludedContacts(excludedContacts.filter((id: number) => id !== contact.id));
                                    }
                                    // Si no está en selectedContacts, agregarlo
                                    if (!selectedContacts.includes(contact.id)) {
                                      setSelectedContacts([...selectedContacts, contact.id]);
                                    }
                                  } else {
                                    // Si se desmarca, remover de selectedContacts y agregar a excluidos si está asociado
                                    setSelectedContacts(selectedContacts.filter((id: number) => id !== contact.id));
                                    if (isAssociated && !excludedContacts.includes(contact.id)) {
                                      setExcludedContacts([...excludedContacts, contact.id]);
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
                                  {contact.email && (
                                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5, fontSize: '0.875rem' }}>
                                      ({contact.email})
                                    </Typography>
                                  )}
                                </Typography>
                              </Tooltip>
                            </Box>
                          );
                        })}
                        {(allContacts.length > 0 ? allContacts : associatedContacts).length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', p: 1 }}>
                            No hay contactos disponibles
                          </Typography>
                        )}
                      </>
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
                                  color: taxiMonterricoColors.green,
                                  '&.Mui-checked': {
                                    color: taxiMonterricoColors.green,
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

          {/* Opción de Tarea de Seguimiento */}
          <FormControlLabel
            control={
              <Checkbox
                checked={createFollowUpTask}
                onChange={(e) => setCreateFollowUpTask(e.target.checked)}
                name="createFollowUpTask"
                color="primary"
                sx={{ mr: 1 }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  Crear una tarea de
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mr: 0.5 }}>
                  Por hacer
                </Typography>
                <ExpandMore color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  para hacer seguimiento en
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mr: 0.5 }}>
                  En 3 días laborables ({new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { weekday: 'long' })})
                </Typography>
                <ExpandMore color="primary" fontSize="small" />
              </Box>
            }
            sx={{ mb: 2 }}
          />
          </Box>

          {/* Footer con botones */}
          <Box sx={{ 
            p: 2.5, 
            borderTop: '1px solid #e0e0e0', 
            backgroundColor: '#fafbfc', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 1.5,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          }}>
            <Button 
              onClick={() => setNoteOpen(false)} 
              sx={{ 
                textTransform: 'none',
                px: 3,
                py: 1,
                color: '#546e7a',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#eceff1',
                },
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
                px: 3,
                py: 1,
                backgroundColor: saving ? '#bdbdbd' : taxiMonterricoColors.green,
                fontWeight: 600,
                boxShadow: saving ? 'none' : `0 2px 8px ${taxiMonterricoColors.green}50`,
                '&:hover': {
                  backgroundColor: saving ? '#bdbdbd' : taxiMonterricoColors.greenDark,
                  boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}60`,
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e',
                  boxShadow: 'none',
                },
                transition: 'all 0.2s ease',
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

      {/* Ventana flotante de Email */}
      {emailOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '500px',
              maxWidth: '90vw',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s ease-out',
              '@keyframes slideInRight': {
                '0%': {
                  transform: 'translateX(100%)',
                },
                '100%': {
                  transform: 'translateX(0)',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                p: 0,
                m: 0,
                backgroundColor: '#37474F',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '50px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>Correo</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton sx={{ color: 'white', mr: 1 }} size="small" onClick={() => setEmailOpen(false)}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden', overflowY: 'auto' }}>
              <TextField
                label="Para"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                fullWidth
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                label="Asunto"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                required
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Mensaje"
                multiline
                rows={10}
                value={emailData.description}
                onChange={(e) => setEmailData({ ...emailData, description: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
              />
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setEmailOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEmail} 
                variant="contained" 
                disabled={saving || !emailData.subject.trim()}
                sx={{ 
                  textTransform: 'none',
                  backgroundColor: saving ? '#bdbdbd' : '#757575',
                  '&:hover': {
                    backgroundColor: saving ? '#bdbdbd' : '#616161',
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
            onClick={() => setEmailOpen(false)}
          />
        </>
      )}

      {/* Ventana flotante de Llamada */}
      {callOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '500px',
              maxWidth: '90vw',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '48px', md: '56px' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                px: { xs: 2, md: 2.5 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Phone sx={{ fontSize: { xs: 18, md: 22 } }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  Llamada
                </Typography>
              </Box>
              <IconButton 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
                }} 
                size="small" 
                onClick={() => setCallOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 }, overflow: 'hidden', overflowY: 'auto', bgcolor: '#fafafa' }}>
              <TextField
                label="Asunto"
                value={callData.subject}
                onChange={(e) => setCallData({ ...callData, subject: e.target.value })}
                required
                fullWidth
                sx={{ 
                  mb: 2.5,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
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
                  mb: 2.5,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Notas de la llamada"
                multiline
                rows={10}
                value={callData.description}
                onChange={(e) => setCallData({ ...callData, description: e.target.value })}
                fullWidth
                sx={{ 
                  mb: 2,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ p: 2.5, borderTop: '1px solid #e0e0e0', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button 
                onClick={() => setCallOpen(false)} 
                sx={{ 
                  textTransform: 'none',
                  color: '#757575',
                  fontWeight: 500,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
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
                  bgcolor: saving ? '#bdbdbd' : taxiMonterricoColors.green,
                  fontWeight: 500,
                  px: 3,
                  boxShadow: saving ? 'none' : `0 2px 8px ${taxiMonterricoColors.green}30`,
                  '&:hover': {
                    bgcolor: saving ? '#bdbdbd' : taxiMonterricoColors.greenDark,
                    boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#bdbdbd',
                    color: 'white',
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
              top: 0,
              right: 0,
              width: '500px',
              maxWidth: '90vw',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '48px', md: '56px' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                px: { xs: 2, md: 2.5 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Assignment sx={{ fontSize: { xs: 18, md: 22 } }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  Tarea
                </Typography>
              </Box>
              <IconButton 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
                }} 
                size="small" 
                onClick={() => setTaskOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 }, overflow: 'hidden', overflowY: 'auto', bgcolor: '#fafafa' }}>
              <TextField
                label="Título"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                required
                fullWidth
                sx={{ 
                  mb: 2.5,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
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
                  mb: 2.5,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                <TextField
                  select
                  label="Prioridad"
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                  fullWidth
                  sx={{ 
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
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
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ p: 2.5, borderTop: '1px solid #e0e0e0', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button 
                onClick={() => setTaskOpen(false)} 
                sx={{ 
                  textTransform: 'none',
                  color: '#757575',
                  fontWeight: 500,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
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
                  bgcolor: saving ? '#bdbdbd' : taxiMonterricoColors.green,
                  fontWeight: 500,
                  px: 3,
                  boxShadow: saving ? 'none' : `0 2px 8px ${taxiMonterricoColors.green}30`,
                  '&:hover': {
                    bgcolor: saving ? '#bdbdbd' : taxiMonterricoColors.greenDark,
                    boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#bdbdbd',
                    color: 'white',
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
              top: 0,
              right: 0,
              width: '500px',
              maxWidth: '90vw',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '48px', md: '56px' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                px: { xs: 2, md: 2.5 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Event sx={{ fontSize: { xs: 18, md: 22 } }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  Reunión
                </Typography>
              </Box>
              <IconButton 
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
                }} 
                size="small" 
                onClick={() => setMeetingOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 }, overflow: 'hidden', overflowY: 'auto', bgcolor: '#fafafa' }}>
              <TextField
                label="Asunto"
                value={meetingData.subject}
                onChange={(e) => setMeetingData({ ...meetingData, subject: e.target.value })}
                required
                fullWidth
                sx={{ 
                  mb: 2.5,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
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
                  mb: 2.5,
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={meetingData.date}
                  onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
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
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      '&.Mui-focused fieldset': {
                        borderColor: taxiMonterricoColors.green,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ p: 2.5, borderTop: '1px solid #e0e0e0', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button 
                onClick={() => setMeetingOpen(false)} 
                sx={{ 
                  textTransform: 'none',
                  color: '#757575',
                  fontWeight: 500,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
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
                  bgcolor: saving ? '#bdbdbd' : taxiMonterricoColors.green,
                  fontWeight: 500,
                  px: 3,
                  boxShadow: saving ? 'none' : `0 2px 8px ${taxiMonterricoColors.green}30`,
                  '&:hover': {
                    bgcolor: saving ? '#bdbdbd' : taxiMonterricoColors.greenDark,
                    boxShadow: saving ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#bdbdbd',
                    color: 'white',
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

      {/* Diálogo para agregar contacto */}
      <Dialog open={addContactOpen} onClose={() => { setAddContactOpen(false); setContactDialogTab('create'); setSelectedExistingContacts([]); setExistingContactsSearch(''); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {contactDialogTab === 'create' ? 'Crear nuevo contacto' : 'Agregar Contacto existente'}
          <IconButton onClick={() => { setAddContactOpen(false); setContactDialogTab('create'); setSelectedExistingContacts([]); setExistingContactsSearch(''); }} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={contactDialogTab === 'create' ? 0 : 1} onChange={(e, newValue) => setContactDialogTab(newValue === 0 ? 'create' : 'existing')}>
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {contactDialogTab === 'create' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nombre"
                value={contactFormData.firstName}
                onChange={(e) => setContactFormData({ ...contactFormData, firstName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Apellido"
                value={contactFormData.lastName}
                onChange={(e) => setContactFormData({ ...contactFormData, lastName: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Correo electrónico"
                value={contactFormData.email}
                onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={contactFormData.phone}
                onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                fullWidth
              />
              <TextField
                label="Cargo"
                value={contactFormData.jobTitle}
                onChange={(e) => setContactFormData({ ...contactFormData, jobTitle: e.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Etapa del Ciclo de Vida"
                value={contactFormData.lifecycleStage}
                onChange={(e) => setContactFormData({ ...contactFormData, lifecycleStage: e.target.value })}
                fullWidth
              >
                <MenuItem value="subscriber">Suscriptor</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="marketing qualified lead">MQL</MenuItem>
                <MenuItem value="sales qualified lead">SQL</MenuItem>
                <MenuItem value="opportunity">Oportunidad</MenuItem>
                <MenuItem value="customer">Cliente</MenuItem>
                <MenuItem value="evangelist">Evangelista</MenuItem>
              </TextField>
            </Box>
          )}

          {contactDialogTab === 'existing' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Campo de búsqueda */}
              <TextField
                size="small"
                placeholder="Buscar Contactos"
                value={existingContactsSearch}
                onChange={(e) => setExistingContactsSearch(e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search sx={{ color: '#00bcd4' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Contador y ordenamiento */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {(() => {
                    const associatedContactIds = (associatedContacts || []).map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
                    const filtered = allContacts.filter((contact: any) => {
                      if (associatedContactIds.includes(contact.id)) return false;
                      if (!existingContactsSearch) return true;
                      const searchLower = existingContactsSearch.toLowerCase();
                      return (
                        (contact.firstName && contact.firstName.toLowerCase().includes(searchLower)) ||
                        (contact.lastName && contact.lastName.toLowerCase().includes(searchLower)) ||
                        (contact.email && contact.email.toLowerCase().includes(searchLower))
                      );
                    });
                    return `${filtered.length} Contactos`;
                  })()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Predeterminado (Agregado recientemente)
                </Typography>
              </Box>

              {/* Lista de contactos */}
              <Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                {(() => {
                  const associatedContactIds = (associatedContacts || []).map((c: any) => c && c.id).filter((id: any) => id !== undefined && id !== null);
                  const filteredContacts = allContacts.filter((contact: any) => {
                    if (associatedContactIds.includes(contact.id)) return false;
                    if (!existingContactsSearch) return true;
                    const searchLower = existingContactsSearch.toLowerCase();
                    return (
                      (contact.firstName && contact.firstName.toLowerCase().includes(searchLower)) ||
                      (contact.lastName && contact.lastName.toLowerCase().includes(searchLower)) ||
                      (contact.email && contact.email.toLowerCase().includes(searchLower))
                    );
                  });

                  if (filteredContacts.length === 0) {
                    return (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay contactos disponibles
                        </Typography>
                      </Box>
                    );
                  }

                  return filteredContacts.map((contact: any) => (
                    <Box
                      key={contact.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        borderBottom: '1px solid #f0f0f0',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        '&:last-child': { borderBottom: 'none' },
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
                        sx={{
                          color: '#00bcd4',
                          '&.Mui-checked': {
                            color: '#00bcd4',
                          },
                        }}
                      />
                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {contact.firstName} {contact.lastName}
                        </Typography>
                        {contact.email && (
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {contact.email}
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
        <DialogActions>
          <Button onClick={() => { setAddContactOpen(false); setContactDialogTab('create'); setSelectedExistingContacts([]); setExistingContactsSearch(''); }}>
            Cancelar
          </Button>
          {contactDialogTab === 'create' ? (
            <Button onClick={handleAddContact} variant="contained" disabled={!contactFormData.firstName.trim() || !contactFormData.lastName.trim() || !contactFormData.email.trim()}>
              Agregar
            </Button>
          ) : (
            <Button onClick={handleAddExistingContacts} variant="contained" disabled={selectedExistingContacts.length === 0}>
              Agregar ({selectedExistingContacts.length})
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar negocio */}
      <Dialog open={addDealOpen} onClose={() => setAddDealOpen(false)} maxWidth="sm" fullWidth>
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
            >
              <MenuItem value="qualification">Calificación</MenuItem>
              <MenuItem value="needs analysis">Análisis de necesidades</MenuItem>
              <MenuItem value="proposal">Propuesta</MenuItem>
              <MenuItem value="negotiation">Negociación</MenuItem>
              <MenuItem value="closed won">Cerrado ganado</MenuItem>
              <MenuItem value="closed lost">Cerrado perdido</MenuItem>
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
              label="Probabilidad (%)"
              type="number"
              value={dealFormData.probability}
              onChange={(e) => setDealFormData({ ...dealFormData, probability: e.target.value })}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
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
      <Dialog open={addTicketOpen} onClose={() => setAddTicketOpen(false)} maxWidth="sm" fullWidth>
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
      <Dialog open={addSubscriptionOpen} onClose={() => setAddSubscriptionOpen(false)} maxWidth="sm" fullWidth>
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
      <Dialog open={addPaymentOpen} onClose={() => setAddPaymentOpen(false)} maxWidth="sm" fullWidth>
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

export default CompanyDetail;


