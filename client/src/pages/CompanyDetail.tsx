import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  RadioGroup,
  Radio,
  Tooltip,
  Card,
  useTheme,
  Drawer,
  useMediaQuery,
  Popover,
  FormControl,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputBase,
} from "@mui/material";
import {
  MoreVert,
  Note,
  Email,
  Phone,
  Assignment,
  Event,
  Link as LinkIcon,
  Close,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  Search,
  KeyboardArrowRight,
  LocationOn,
  CalendarToday,
  DonutSmall,
  AccessTime,
  Person,
  AutoAwesome,
  ReportProblem,
  Receipt,
  TaskAlt,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Image,
  Code,
  TableChart,
  AttachFile,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  ChevronLeft,
  ChevronRight,
  Business,
  History,
} from "@mui/icons-material";
import { LinkedIn } from "@mui/icons-material";
import api from "../config/api";
import RichTextEditor from "../components/RichTextEditor";
import EmailComposer from "../components/EmailComposer";
import { taxiMonterricoColors } from "../theme/colors";
import {
  RecentActivitiesCard,
  LinkedContactsCard,
  LinkedDealsCard,
  LinkedTicketsCard,
  FullContactsTableCard,
  FullDealsTableCard,
  FullTicketsTableCard,
  FullActivitiesTableCard,
  ActivityDetailDialog,
  ActivitiesTabContent,
} from "../components/DetailCards";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import empresaLogo from "../assets/empresa.png";
import { formatDatePeru } from "../utils/dateUtils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CompanyDetailData {
  id: number;
  name: string;
  domain?: string;
  companyname?: string;
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

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [company, setCompany] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [associatedDeals, setAssociatedDeals] = useState<any[]>([]);
  const [associatedContacts, setAssociatedContacts] = useState<any[]>([]);
  const [associatedTickets, setAssociatedTickets] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Estados para búsquedas y filtros
  const [activitySearch, setActivitySearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [expandedActivity, setExpandedActivity] = useState<any | null>(null);
  const [completedActivities, setCompletedActivities] = useState<{
    [key: number]: boolean;
  }>({});
  
  // Estados para los filtros de actividad
  // Nota: communicationFilters y teamActivityFilters están comentados porque no se usan actualmente
  // const [communicationFilters] = useState({
  //   all: true,
  //   postal: true,
  //   email: true,
  //   linkedin: true,
  //   calls: true,
  //   sms: true,
  //   whatsapp: true,
  // });
  
  // const [teamActivityFilters] = useState({
  //   all: true,
  //   notes: true,
  //   meetings: true,
  //   tasks: true,
  // });
  
  // Estados para funcionalidades de notas y actividades
  // Nota: expandedNotes y expandedActivities están comentados porque no se usan actualmente
  // const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  // const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  // const [noteActionMenus, setNoteActionMenus] = useState<{ [key: number]: HTMLElement | null }>({});
  const [summaryExpanded, setSummaryExpanded] = useState<boolean>(false);
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">(
    "week"
  );
  const [dealSortOrder, setDealSortOrder] = useState<"asc" | "desc">("asc");
  const [dealSortField, setDealSortField] = useState<
    "name" | "amount" | "closeDate" | "stage"
  >("name");
  const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">(
    "asc"
  );
  const [contactSortField, setContactSortField] = useState<
    "firstName" | "email" | "phone"
  >("firstName");
  const [ticketSearch, setTicketSearch] = useState("");
  const [removeContactDialogOpen, setRemoveContactDialogOpen] = useState(false);
  const [removeDealDialogOpen, setRemoveDealDialogOpen] = useState(false);
  const [removeTicketDialogOpen, setRemoveTicketDialogOpen] = useState(false);
  const [contactToRemove, setContactToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [dealToRemove, setDealToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [ticketToRemove, setTicketToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  
  // Estados para diálogos
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [addTicketOpen, setAddTicketOpen] = useState(false);
  const [, setCreateActivityMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [contactFormData, setContactFormData] = useState({ 
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    lifecycleStage: "lead",
    dni: "",
    cee: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [idType, setIdType] = useState<"dni" | "cee">("dni");
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState("");
  const [loadingCee, setLoadingCee] = useState(false);
  const [ceeError, setCeeError] = useState("");
  const [contactDialogTab, setContactDialogTab] = useState<
    "create" | "existing"
  >("create");
  const [existingContactsSearch, setExistingContactsSearch] = useState("");
  const [selectedExistingContacts, setSelectedExistingContacts] = useState<
    number[]
  >([]);
  const [dealFormData, setDealFormData] = useState({
    name: "",
    amount: "",
    stage: "lead",
    closeDate: "",
    priority: "baja" as "baja" | "media" | "alta",
    companyId: "",
    contactId: "",
  });
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [ticketFormData, setTicketFormData] = useState({
    subject: "",
    description: "",
    status: "new",
    priority: "medium",
  });
  
  // Estados para edición de campos del contacto
  
  // Estados para asociaciones en nota
  const [selectedAssociations, setSelectedAssociations] = useState<number[]>(
    []
  );
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  // Estados para elementos excluidos (desmarcados manualmente aunque estén asociados)
  const [excludedContacts, setExcludedContacts] = useState<number[]>([]);
  
  // Estados para diálogos de acciones
  const [noteOpen, setNoteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [noteAssociateModalOpen, setNoteAssociateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("empresas");
  const [associateSearch, setAssociateSearch] = useState("");
  const [noteModalCompanies, setNoteModalCompanies] = useState<any[]>([]);
  const [noteModalContacts, setNoteModalContacts] = useState<any[]>([]);
  const [noteModalDeals, setNoteModalDeals] = useState<any[]>([]);
  const [noteModalTickets, setNoteModalTickets] = useState<any[]>([]);
  const [noteSelectedAssociations, setNoteSelectedAssociations] = useState<{
    [key: string]: number[];
  }>({
    companies: [],
    contacts: [],
    deals: [],
    tickets: [],
  });
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [excludedCompanies, setExcludedCompanies] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    domain: "",
    linkedin: "",
    companyname: "",
    phone: "",
    phone2: "",
    phone3: "",
    lifecycleStage: "lead",
    ruc: "",
    address: "",
    city: "",
    state: "",
    country: "",
    email: "",
    leadSource: "",
    estimatedRevenue: "",
    isRecoveredClient: false,
  });
  const descriptionEditorRef = React.useRef<HTMLDivElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailConnectModalOpen, setEmailConnectModalOpen] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);
  
  // Estados para formularios
  const [noteData, setNoteData] = useState({ subject: "", description: "" });
  const [callData, setCallData] = useState({
    subject: "",
    description: "",
    duration: "",
  });
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    type: "todo" as string,
  });
  const [meetingData, setMeetingData] = useState({
    subject: "",
    description: "",
    date: "",
    time: "",
  });
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      const response = await api.get(`/companies/${id}`);
      setCompany(response.data);
      // Actualizar contactos asociados desde la relación muchos-a-muchos
      const contacts =
        response.data.Contacts && Array.isArray(response.data.Contacts)
        ? response.data.Contacts
        : [];
      setAssociatedContacts(contacts);
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAssociatedRecords = useCallback(async () => {
    try {
      // Obtener empresa con contactos asociados desde la relación muchos-a-muchos
      const companyResponse = await api.get(`/companies/${id}`);
      const contacts =
        companyResponse.data.Contacts &&
        Array.isArray(companyResponse.data.Contacts)
        ? companyResponse.data.Contacts
        : [];
      setAssociatedContacts(contacts);

      // Obtener deals asociados
      const dealsResponse = await api.get("/deals", {
        params: { companyId: id },
      });
      setAssociatedDeals(dealsResponse.data.deals || dealsResponse.data || []);

      // Obtener actividades
      const activitiesResponse = await api.get("/activities", {
        params: { companyId: id },
      });
      const activitiesData =
        activitiesResponse.data.activities || activitiesResponse.data || [];

      // Obtener tareas asociadas a la empresa
      const tasksResponse = await api.get("/tasks", {
        params: { companyId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];

      // Convertir tareas a formato de actividad para mostrarlas en la lista
      const tasksAsActivities = tasksData.map((task: any) => ({
        id: task.id,
        type: task.type || "task",
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
      const allActivities = [...activitiesData, ...tasksAsActivities].sort(
        (a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return dateB - dateA;
        }
      );

      setActivities(allActivities);

      // Obtener tickets asociados
      const ticketsResponse = await api.get("/tickets", {
        params: { companyId: id },
      });
      setAssociatedTickets(
        ticketsResponse.data.tickets || ticketsResponse.data || []
      );
    } catch (error) {
      console.error("Error fetching associated records:", error);
    }
  }, [id]);

  // Funciones helper para los logs
  const getActivityDescription = (activity: any) => {
    const typeMap: { [key: string]: string } = {
      note: "Nota creada",
      email: "Email enviado",
      call: "Llamada registrada",
      meeting: "Reunión agendada",
      task: "Tarea creada",
    };
    return typeMap[activity.type] || "Actividad creada";
  };

  const getActivityIconType = (type: string) => {
    return type; // Retornar el tipo para renderizar después
  };

  const getActivityTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      note: "Nota",
      email: "Correo",
      call: "Llamada",
      task: "Tarea",
      meeting: "Reunión",
      todo: "Tarea",
    };
    return typeMap[type?.toLowerCase()] || "Actividad";
  };

  const getActivityStatusColor = (activity: any) => {
    if (!activity.dueDate) {
      // Sin fecha de vencimiento - gris neutro
      return {
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.05)"
            : "#F5F5F5",
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
        bgcolor:
          theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.15)" : "#FFEBEE",
      };
    } else if (diffDays <= 3) {
      // Por vencer (1-3 días) - amarillo/naranja claro
      return {
        bgcolor:
          theme.palette.mode === "dark" ? "rgba(255, 152, 0, 0.15)" : "#FFF9C4",
      };
    } else {
      // A tiempo - verde claro
      return {
        bgcolor:
          theme.palette.mode === "dark" ? "rgba(76, 175, 80, 0.15)" : "#E8F5E9",
      };
    }
  };

  const fetchActivityLogs = useCallback(async () => {
    if (!id) return;
    setLoadingLogs(true);
    try {
      // Obtener actividades y cambios de la empresa
      const [activitiesResponse, companyResponse] = await Promise.all([
        api.get("/activities", { params: { companyId: id } }),
        api.get(`/companies/${id}`),
      ]);
      
      const activities =
        activitiesResponse.data.activities || activitiesResponse.data || [];
      const companyData = companyResponse.data;
      
      // Crear logs a partir de actividades y cambios
      const logs: any[] = [];
      
      // Agregar actividades como logs
      activities.forEach((activity: any) => {
        logs.push({
          id: `activity-${activity.id}`,
          type: activity.type,
          action: "created",
          description: getActivityDescription(activity),
          user: activity.User,
          timestamp: activity.createdAt,
          iconType: getActivityIconType(activity.type),
        });
      });
      
      // Agregar cambios en la empresa si hay updatedAt
      if (
        companyData.updatedAt &&
        companyData.createdAt !== companyData.updatedAt
      ) {
        logs.push({
          id: `company-update-${companyData.id}`,
          type: "company",
          action: "updated",
          description: "Información de la empresa actualizada",
          user: companyData.Owner,
          timestamp: companyData.updatedAt,
          iconType: "company",
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
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (company) {
      fetchAssociatedRecords();
      fetchAllContacts();
      fetchAllCompanies();
    }
  }, [company, id, fetchAssociatedRecords]);

  useEffect(() => {
    if (id) {
      fetchActivityLogs();
    }
  }, [id, fetchActivityLogs]);

  // Actualizar asociaciones seleccionadas cuando cambian los registros relacionados
  useEffect(() => {
    // Inicializar contactos seleccionados con los contactos asociados
    if (associatedContacts.length > 0) {
      const contactIds = associatedContacts
        .map((c: any) => c && c.id)
        .filter((id: any) => id !== undefined && id !== null);
      if (contactIds.length > 0) {
        setSelectedContacts((prev) => {
          // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
          const combined = [...prev, ...contactIds];
          const unique = combined.filter(
            (id, index) => combined.indexOf(id) === index
          );
          // Solo actualizar si hay cambios para evitar loops infinitos
          if (
            unique.length !== prev.length ||
            unique.some((id) => !prev.includes(id))
          ) {
            return unique;
          }
          return prev;
        });
      }
    }
    
    // Inicializar negocios seleccionados con los negocios asociados
    if (associatedDeals.length > 0) {
      const dealIds = associatedDeals.map((d: any) => 1000 + d.id);
      setSelectedAssociations((prev) => {
        // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
        const combined = [...prev, ...dealIds];
        const unique = combined.filter(
          (id, index) => combined.indexOf(id) === index
        );
        // Solo actualizar si hay cambios para evitar loops infinitos
        if (
          unique.length !== prev.length ||
          unique.some((id) => !prev.includes(id))
        ) {
          return unique;
        }
        return prev;
      });
    }
    
    // Inicializar tickets seleccionados con los tickets asociados
    if (associatedTickets.length > 0) {
      const ticketIds = associatedTickets.map((t: any) => 2000 + t.id);
      setSelectedAssociations((prev) => {
        // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
        const combined = [...prev, ...ticketIds];
        const unique = combined.filter(
          (id, index) => combined.indexOf(id) === index
        );
        // Solo actualizar si hay cambios para evitar loops infinitos
        if (
          unique.length !== prev.length ||
          unique.some((id) => !prev.includes(id))
        ) {
          return unique;
        }
        return prev;
      });
    }
  }, [associatedContacts, associatedDeals, associatedTickets]);

  const fetchAllContacts = async () => {
    try {
      const response = await api.get("/contacts");
      setAllContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error("Error fetching all contacts:", error);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const response = await api.get("/companies", { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching all companies:", error);
    }
  };

  // Opciones de etapa según las imágenes proporcionadas
  const stageOptions = [
    { value: "lead_inactivo", label: "Lead Inactivo" },
    { value: "cliente_perdido", label: "Cliente perdido" },
    { value: "cierre_perdido", label: "Cierre Perdido" },
    { value: "lead", label: "Lead" },
    { value: "contacto", label: "Contacto" },
    { value: "reunion_agendada", label: "Reunión Agendada" },
    { value: "reunion_efectiva", label: "Reunión Efectiva" },
    { value: "propuesta_economica", label: "Propuesta Económica" },
    { value: "negociacion", label: "Negociación" },
    { value: "licitacion", label: "Licitación" },
    { value: "licitacion_etapa_final", label: "Licitación Etapa Final" },
    { value: "cierre_ganado", label: "Cierre Ganado" },
    { value: "firma_contrato", label: "Firma de Contrato" },
    { value: "activo", label: "Activo" },
  ];

  // Manejar tecla ESC para cerrar paneles
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (noteOpen) setNoteOpen(false);
        if (emailOpen) setEmailOpen(false);
        if (callOpen) setCallOpen(false);
        if (taskOpen) setTaskOpen(false);
        if (meetingOpen) setMeetingOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [noteOpen, emailOpen, callOpen, taskOpen, meetingOpen]);

  // Asegurar que el resumen esté contraído al cambiar de empresa
  useEffect(() => {
    setSummaryExpanded(false);
  }, [id]);

  const getCompanyInitials = (companyName: string) => {
    const words = companyName
      .trim()
      .split(" ")
      .filter((word) => word.length > 0);
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  const getContactInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    return "--";
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      lead: "Lead",
      contacto: "Contacto",
      reunion_agendada: "Reunión Agendada",
      reunion_efectiva: "Reunión Efectiva",
      propuesta_economica: "Propuesta Económica",
      negociacion: "Negociación",
      licitacion: "Licitación",
      licitacion_etapa_final: "Licitación Etapa Final",
      cierre_ganado: "Cierre Ganado",
      cierre_perdido: "Cierre Perdido",
      firma_contrato: "Firma de Contrato",
      activo: "Activo",
      cliente_perdido: "Cliente perdido",
      lead_inactivo: "Lead Inactivo",
    };
    return labels[stage] || stage;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenEditDialog = () => {
    if (company) {
      setEditFormData({
        name: company.name || "",
        domain: company.domain || "",
        linkedin: company.linkedin || "",
        companyname: company.companyname || "",
        phone: company.phone || "",
        phone2: (company as any).phone2 || "",
        phone3: (company as any).phone3 || "",
        lifecycleStage: company.lifecycleStage || "lead",
        ruc: (company as any).ruc || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        email: (company as any).email || "",
        leadSource: (company as any).leadSource || "",
        estimatedRevenue: (company as any).estimatedRevenue || "",
        isRecoveredClient: (company as any).isRecoveredClient || false,
      });
      setEditDialogOpen(true);
      setErrorMessage("");
    }
    setAnchorEl(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditFormData({
      name: "",
      domain: "",
      linkedin: "",
      companyname: "",
      phone: "",
      phone2: "",
      phone3: "",
      lifecycleStage: "lead",
      ruc: "",
      address: "",
      city: "",
      state: "",
      country: "",
      email: "",
      leadSource: "",
      estimatedRevenue: "",
      isRecoveredClient: false,
    });
    setErrorMessage("");
  };

  const handleSaveCompany = async () => {
    if (!company || !editFormData.name.trim()) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      
      // Preparar los datos para enviar, convirtiendo valores vacíos a null
      const dataToSend: any = {
        ...editFormData,
      };
      
      // Manejar estimatedRevenue
      if (
        editFormData.estimatedRevenue === "" ||
        editFormData.estimatedRevenue === null ||
        editFormData.estimatedRevenue === undefined
      ) {
        dataToSend.estimatedRevenue = null;
      } else {
        const parsed = parseFloat(editFormData.estimatedRevenue as string);
        dataToSend.estimatedRevenue = isNaN(parsed) ? null : parsed;
      }
      
      // Manejar leadSource
      dataToSend.leadSource =
        editFormData.leadSource === "" ? null : editFormData.leadSource;
      
      // Manejar email
      dataToSend.email = editFormData.email === "" ? null : editFormData.email;
      
      // Asegurarse de que isRecoveredClient sea boolean
      dataToSend.isRecoveredClient = Boolean(editFormData.isRecoveredClient);
      
      console.log("Datos a enviar:", dataToSend);
      
      const response = await api.put(`/companies/${company.id}`, dataToSend);
      setCompany(response.data);
      handleCloseEditDialog();
      // Recargar los datos de la empresa
      await fetchCompany();
    } catch (error: any) {
      console.error("Error al actualizar la empresa:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al guardar la empresa. Por favor, intenta nuevamente.";
      setErrorMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para abrir diálogos
  const handleOpenNote = () => {
    setNoteData({ subject: "", description: "" });
    setCreateFollowUpTask(false);
    setNoteOpen(true);
  };

  const fetchAssociations = useCallback(
    async (searchTerm?: string) => {
    setLoadingAssociations(true);
    try {
      // Si hay búsqueda, cargar todos los resultados
      if (searchTerm && searchTerm.trim().length > 0) {
          const [companiesRes, contactsRes, dealsRes, ticketsRes] =
            await Promise.all([
              api.get("/companies", {
                params: { limit: 1000, search: searchTerm },
              }),
              api.get("/contacts", {
                params: { limit: 1000, search: searchTerm },
              }),
              api.get("/deals", {
                params: { limit: 1000, search: searchTerm },
              }),
              api.get("/tickets", {
                params: { limit: 1000, search: searchTerm },
              }),
            ]);
          setNoteModalCompanies(
            companiesRes.data.companies || companiesRes.data || []
          );
          setNoteModalContacts(
            contactsRes.data.contacts || contactsRes.data || []
          );
        setNoteModalDeals(dealsRes.data.deals || dealsRes.data || []);
        setNoteModalTickets(ticketsRes.data.tickets || ticketsRes.data || []);
      } else {
        // Si no hay búsqueda, solo cargar los vinculados a la empresa actual
          const associatedItems: {
            companies: any[];
            contacts: any[];
            deals: any[];
            tickets: any[];
          } = {
          companies: [],
          contacts: [],
          deals: [],
          tickets: [],
        };

        // La empresa actual siempre está asociada
        if (company) {
          associatedItems.companies = [company];
        }

        // Cargar contactos vinculados si existen
        if (associatedContacts && associatedContacts.length > 0) {
          associatedItems.contacts = associatedContacts;
        }

        // Cargar negocios y tickets asociados si existen
        if (associatedDeals && associatedDeals.length > 0) {
          associatedItems.deals = associatedDeals;
        }
        if (associatedTickets && associatedTickets.length > 0) {
          associatedItems.tickets = associatedTickets;
        }

        setNoteModalCompanies(associatedItems.companies);
        setNoteModalContacts(associatedItems.contacts);
        setNoteModalDeals(associatedItems.deals);
        setNoteModalTickets(associatedItems.tickets);
      }
    } catch (error) {
        console.error("Error fetching associations:", error);
    } finally {
      setLoadingAssociations(false);
    }
    },
    [company, associatedContacts, associatedDeals, associatedTickets]
  );

  // Inicializar asociaciones cuando se abre el modal de asociaciones
  useEffect(() => {
    if (noteAssociateModalOpen) {
      fetchAssociations();
      // Inicializar selecciones con los valores actuales
      setNoteSelectedAssociations({
        companies: selectedCompanies,
        contacts: selectedContacts,
        deals: selectedAssociations
          .filter((id: number) => id > 1000 && id < 2000)
          .map((id) => id - 1000),
        tickets: selectedAssociations
          .filter((id: number) => id > 2000)
          .map((id) => id - 2000),
      });
      setSelectedCategory("empresas"); // Default to 'Empresas'
    }
  }, [
    noteAssociateModalOpen,
    fetchAssociations,
    selectedCompanies,
    selectedContacts,
    selectedAssociations,
  ]);

  const handleOpenEmail = async () => {
    // Verificar si hay token guardado en el backend
    try {
      const response = await api.get("/google/token");
      const hasToken = response.data.hasToken && !response.data.isExpired;
      
      if (hasToken) {
        // Ya está conectado, abrir el modal directamente
        setEmailOpen(true);
        return;
      }
    } catch (error: any) {
      // Si no hay token (404) o hay otro error, mostrar modal
      if (error.response?.status === 404) {
        setEmailConnectModalOpen(true);
        return;
      }
    }

    // Si llegamos aquí, no hay token guardado
    setEmailConnectModalOpen(true);
  };

  const handleEmailConnect = async () => {
    if (!user?.id) {
      setWarningMessage("Usuario no identificado");
      setTimeout(() => setWarningMessage(""), 3000);
      return;
    }

    setConnectingEmail(true);
    try {
      const response = await api.get("/google/auth");
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error("No se pudo obtener la URL de autorización");
      }
    } catch (error: any) {
      console.error("Error iniciando conexión con Google:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error al conectar con Google. Por favor, intenta nuevamente.";
      setWarningMessage(errorMessage);
      setTimeout(() => setWarningMessage(""), 5000);
      setConnectingEmail(false);
    }
  };

  const handleSendEmail = async (emailData: {
    to: string;
    subject: string;
    body: string;
  }) => {
    try {
      // Enviar email a través del backend (el backend obtendrá el token automáticamente)
      await api.post("/emails/send", {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
      });

      // Registrar como actividad
      await api.post("/activities/emails", {
        subject: emailData.subject,
        description: emailData.body.replace(/<[^>]*>/g, ""), // Remover HTML para la descripción
        companyId: id,
      });

      // Actualizar actividades
      fetchAssociatedRecords();
    } catch (error: any) {
      // Si el token expiró o no hay token, mostrar mensaje
      if (error.response?.status === 401) {
        throw new Error(
          "Por favor, conecta tu correo desde Configuración > Perfil > Correo"
        );
      }
      throw error;
    }
  };

  const handleOpenCall = () => {
    setCallData({ subject: "", description: "", duration: "" });
    setCallOpen(true);
  };

  const handleOpenTask = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      type: "todo",
    });
    setSelectedDate(null);
    setCurrentMonth(new Date());
    setTaskOpen(true);
  };

  const updateActiveFormats = useCallback(() => {
    if (descriptionEditorRef.current) {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
      });
    }
  }, []);

  useEffect(() => {
    if (descriptionEditorRef.current && taskOpen) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || "";
      }
    }
  }, [taskData.description, taskOpen]);

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
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        updateActiveFormats();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    const editorElement = editor;
    editorElement.addEventListener("mouseup", handleMouseUp);
    editorElement.addEventListener("keyup", handleKeyUp as any);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (editorElement) {
        editorElement.removeEventListener("mouseup", handleMouseUp);
        editorElement.removeEventListener("keyup", handleKeyUp as any);
      }
    };
  }, [updateActiveFormats, taskOpen]);

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (taskData.dueDate) {
      const dateMatch = taskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
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
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setTaskData({ ...taskData, dueDate: "" });
    setDatePickerAnchorEl(null);
  };

  const handleToday = () => {
    const today = new Date();
    const peruToday = new Date(
      today.toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const year = peruToday.getFullYear();
    const month = peruToday.getMonth() + 1;
    const day = peruToday.getDate();
    handleDateSelect(year, month, day);
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
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNumber = prevMonthLastDay - startingDayOfWeek + i + 1;
      days.push({ day: dayNumber, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
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
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const weekDays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  // Funciones para guardar
  const handleSaveNote = async () => {
    if (!noteData.description.trim()) {
      setSuccessMessage("");
      return;
    }
    setSaving(true);
    
    // Variables para debugging
    let companiesToCreateNote: number[] = [];
    let finalCompanyIds: number[] = [];
    let contactsToAssociate: number[] = [];
    
    try {
      // Obtener empresas seleccionadas (incluyendo la empresa actual si no está excluida)
      companiesToCreateNote = selectedCompanies.filter(
        (companyId) => !excludedCompanies.includes(companyId)
      );
      
      // Si no hay empresas seleccionadas, usar la empresa actual
      finalCompanyIds =
        companiesToCreateNote.length > 0
          ? companiesToCreateNote
          : company?.id
          ? [company.id]
          : [];
      
      if (finalCompanyIds.length === 0) {
        setSuccessMessage("Error: No hay empresas seleccionadas");
        setTimeout(() => setSuccessMessage(""), 3000);
        setSaving(false);
        return;
      }

      // Obtener contactos seleccionados
      contactsToAssociate = selectedContacts.filter(
        (contactId) => !excludedContacts.includes(contactId)
      );
      
      // Crear notas para cada empresa seleccionada
      const activityPromises: Promise<any>[] = [];
      
      for (const companyId of finalCompanyIds) {
        // Obtener información de la empresa para el subject
        let companyName = `Empresa ${companyId}`;
        try {
          const companyResponse = await api.get(`/companies/${companyId}`);
          const companyData = companyResponse.data;
          companyName = companyData.name || companyName;
        } catch (e) {
          console.error(`Error fetching company ${companyId}:`, e);
        }

        if (contactsToAssociate.length > 0) {
          // Crear una nota para cada combinación de empresa y contacto
          for (const contactId of contactsToAssociate) {
            activityPromises.push(
              api.post("/activities/notes", {
                subject: noteData.subject || `Nota para ${companyName}`,
                description: noteData.description,
                companyId: companyId,
                contactId: contactId,
              })
            );
          }
        } else {
          // Crear nota solo con la empresa (sin contacto)
          activityPromises.push(
            api.post("/activities/notes", {
              subject: noteData.subject || `Nota para ${companyName}`,
              description: noteData.description,
              companyId: companyId,
            })
          );
        }
      }
      
      // Ejecutar todas las creaciones en paralelo
      await Promise.all(activityPromises);
      
      // Crear tarea de seguimiento si está marcada (solo para la primera empresa)
      if (createFollowUpTask && finalCompanyIds.length > 0) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3); // 3 días laborables
        
        // Obtener nombre de la primera empresa
        let firstCompanyName = `Empresa ${finalCompanyIds[0]}`;
        try {
          const companyResponse = await api.get(
            `/companies/${finalCompanyIds[0]}`
          );
          const companyData = companyResponse.data;
          firstCompanyName = companyData.name || firstCompanyName;
        } catch (e) {
          console.error(`Error fetching company ${finalCompanyIds[0]}:`, e);
        }
        
        await api.post("/tasks", {
          title: `Seguimiento de nota: ${
            noteData.subject || `Nota para ${firstCompanyName}`
          }`,
          description: `Tarea de seguimiento generada automáticamente por la nota: ${noteData.description}`,
          type: "todo",
          status: "not started",
          priority: "medium",
          dueDate: followUpDate.toISOString().split("T")[0],
          companyId: finalCompanyIds[0],
        });
      }
      
      const noteCount = activityPromises.length;
      setSuccessMessage(
        `Nota${noteCount > 1 ? "s" : ""} creada${
          noteCount > 1 ? "s" : ""
        } exitosamente${
          createFollowUpTask ? " y tarea de seguimiento creada" : ""
        }`
      );
      setNoteOpen(false);
      setNoteData({ subject: "", description: "" });
      setCreateFollowUpTask(false);
      setSelectedContacts([]);
      setSelectedCompanies([]);
      setExcludedContacts([]);
      setExcludedCompanies([]);
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving note:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        selectedCompanies,
        finalCompanyIds:
          companiesToCreateNote.length > 0
            ? companiesToCreateNote
            : company?.id
            ? [company.id]
            : [],
        contactsToAssociate,
      });
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Error desconocido";
      setSuccessMessage(`Error al crear la nota: ${errorMessage}`);
      setTimeout(() => setSuccessMessage(""), 5000);
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
      await api.post("/activities/calls", {
        subject: callData.subject,
        description: callData.description,
        companyId: id,
      });
      setSuccessMessage("Llamada registrada exitosamente");
      setCallOpen(false);
      setCallData({ subject: "", description: "", duration: "" });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving call:", error);
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
      await api.post("/tasks", {
        title: taskData.title,
        description: taskData.description,
        type: taskData.type || "todo",
        status: "not started",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate || undefined,
        companyId: id,
      });
      setSuccessMessage(
        (taskData.type === "meeting" ? "Reunión" : "Tarea") +
          " creada exitosamente" +
          (taskData.dueDate ? " y sincronizada con Google Calendar" : "")
      );
      setTaskOpen(false);
      setTaskData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        type: "todo",
      });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving task:", error);
      setSuccessMessage("Error al crear la tarea");
      setTimeout(() => setSuccessMessage(""), 3000);
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
      const dueDate =
        meetingData.date && meetingData.time
        ? new Date(`${meetingData.date}T${meetingData.time}`).toISOString()
        : undefined;

      await api.post("/tasks", {
        title: meetingData.subject,
        description: meetingData.description,
        type: "meeting",
        status: "not started",
        priority: "medium",
        dueDate: dueDate,
        companyId: id,
      });
      setSuccessMessage(
        "Reunión creada exitosamente" +
          (dueDate ? " y sincronizada con Google Calendar" : "")
      );
      setMeetingOpen(false);
      setMeetingData({ subject: "", description: "", date: "", time: "" });
      fetchAssociatedRecords(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving meeting:", error);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para la pestaña Descripción
  // Función para capitalizar solo las iniciales de cada palabra
  const capitalizeInitials = (text: string): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSearchDni = async () => {
    if (!contactFormData.dni || contactFormData.dni.length < 8) {
      setDniError("El DNI debe tener al menos 8 dígitos");
      return;
    }

    setLoadingDni(true);
    setDniError("");

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";
      
      if (!factilizaToken) {
        setDniError(
          "Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN"
        );
        setLoadingDni(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/dni/info/${contactFormData.dni}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const nombres = data.nombres || "";
        const apellidoPaterno = data.apellido_paterno || "";
        const apellidoMaterno = data.apellido_materno || "";
        
        // Capitalizar solo las iniciales
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(
          `${apellidoPaterno} ${apellidoMaterno}`.trim()
        );
        const direccionCapitalizada = capitalizeInitials(data.direccion || "");
        const distritoCapitalizado = capitalizeInitials(data.distrito || "");
        const provinciaCapitalizada = capitalizeInitials(data.provincia || "");
        const departamentoCapitalizado = capitalizeInitials(
          data.departamento || ""
        );

        setContactFormData((prev) => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
          address: direccionCapitalizada,
          city: distritoCapitalizado,
          state: provinciaCapitalizada,
          country: departamentoCapitalizado || "Perú",
        }));
      } else {
        setDniError("No se encontró información para este DNI");
      }
    } catch (error: any) {
      console.error("Error al buscar DNI:", error);
      if (error.response?.status === 400) {
        setDniError("DNI no válido o no encontrado");
      } else if (error.response?.status === 401) {
        setDniError("Error de autenticación con la API");
      } else {
        setDniError("Error al consultar el DNI. Por favor, intente nuevamente");
      }
    } finally {
      setLoadingDni(false);
    }
  };

  const handleSearchCee = async () => {
    if (!contactFormData.cee || contactFormData.cee.length < 12) {
      setCeeError("El CEE debe tener 12 caracteres");
      return;
    }

    setLoadingCee(true);
    setCeeError("");

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";
      
      if (!factilizaToken) {
        setCeeError(
          "Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN"
        );
        setLoadingCee(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/cee/info/${contactFormData.cee}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.status === 200 && response.data.data) {
        const data = response.data.data;
        const nombres = data.nombres || "";
        const apellidoPaterno = data.apellido_paterno || "";
        const apellidoMaterno = data.apellido_materno || "";
        
        // Capitalizar solo las iniciales
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(
          `${apellidoPaterno} ${apellidoMaterno}`.trim()
        );
        
        setContactFormData((prev) => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
        }));
      } else {
        setCeeError("No se encontró información para este CEE");
      }
    } catch (error: any) {
      console.error("Error al buscar CEE:", error);
      if (error.response?.status === 400) {
        setCeeError("CEE no válido o no encontrado");
      } else if (error.response?.status === 401) {
        setCeeError("Error de autenticación con la API");
      } else {
        setCeeError("Error al consultar el CEE. Por favor, intente nuevamente");
      }
    } finally {
      setLoadingCee(false);
    }
  };

  const handleAddContact = async () => {
    try {
      // Crear el contacto primero con la empresa actual como empresa principal
      const contactResponse = await api.post("/contacts", {
        ...contactFormData,
        companyId: id, // Usar la empresa actual como empresa principal
      });
      
      // Asociar el contacto con la empresa usando la relación muchos-a-muchos
      const companyResponse = await api.post(`/companies/${id}/contacts`, {
        contactIds: [contactResponse.data.id],
      });
      
      // Actualizar la empresa y los contactos asociados
      setCompany(companyResponse.data);
      const contacts =
        companyResponse.data.Contacts &&
        Array.isArray(companyResponse.data.Contacts)
        ? companyResponse.data.Contacts
        : [];
      setAssociatedContacts(contacts);
      
      setSuccessMessage("Contacto agregado exitosamente");
      setAddContactOpen(false);
      setContactFormData({ 
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        lifecycleStage: "lead",
        dni: "",
        cee: "",
        address: "",
        city: "",
        state: "",
        country: "",
      });
      setIdType("dni");
      setDniError("");
      setCeeError("");
      setContactDialogTab("create");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error adding contact:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar el contacto";
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 5000);
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
      const contacts =
        response.data.Contacts && Array.isArray(response.data.Contacts)
        ? response.data.Contacts
        : [];
      setAssociatedContacts(contacts);
      
      setSuccessMessage(
        `${selectedExistingContacts.length} contacto(s) agregado(s) exitosamente`
      );
      
      setAddContactOpen(false);
      setSelectedExistingContacts([]);
      setExistingContactsSearch("");
      setContactDialogTab("create");
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error associating contacts:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al asociar los contactos";
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const handleOpenAddContactDialog = () => {
    setContactFormData({ 
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      lifecycleStage: "lead",
      dni: "",
      cee: "",
      address: "",
      city: "",
      state: "",
      country: "",
    });
    setIdType("dni");
    setDniError("");
    setCeeError("");
    setContactDialogTab("create");
    setSelectedExistingContacts([]);
    setExistingContactsSearch("");
    setAddContactOpen(true);
    // Cargar contactos disponibles cuando se abre el diálogo
    if (allContacts.length === 0) {
      fetchAllContacts();
    }
  };

  const handleAddDeal = async () => {
    try {
      await api.post("/deals", {
        ...dealFormData,
        amount: parseFloat(dealFormData.amount) || 0,
        companyId: dealFormData.companyId
          ? parseInt(dealFormData.companyId)
          : company?.id,
        contactId: dealFormData.contactId
          ? parseInt(dealFormData.contactId)
          : null,
      });
      setSuccessMessage("Negocio agregado exitosamente");
      setAddDealOpen(false);
      setDealFormData({
        name: "",
        amount: "",
        stage: "lead",
        closeDate: "",
        priority: "baja" as "baja" | "media" | "alta",
        companyId: "",
        contactId: "",
      });
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error adding deal:", error);
    }
  };

  const handleAddTicket = async () => {
    try {
      await api.post("/tickets", {
        ...ticketFormData,
        companyId: company?.id,
      });
      setSuccessMessage("Ticket creado exitosamente");
      setAddTicketOpen(false);
      setTicketFormData({
        subject: "",
        description: "",
        status: "new",
        priority: "medium",
      });
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error adding ticket:", error);
    }
  };

  const handleCreateActivity = (type: string) => {
    setCreateActivityMenuAnchor(null);
    switch (type) {
      case "note":
        handleOpenNote();
        break;
      case "call":
        handleOpenCall();
        break;
      case "task":
        setTaskData({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          type: "todo",
        });
        setTaskOpen(true);
        break;
      case "meeting":
        setTaskData({
          title: "",
          description: "",
          priority: "medium",
          dueDate: "",
          type: "meeting",
        });
        setTaskOpen(true);
        break;
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copiado al portapapeles");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleSortContacts = (field: "firstName" | "email" | "phone") => {
    const isAsc = contactSortField === field && contactSortOrder === "asc";
    setContactSortOrder(isAsc ? "desc" : "asc");
    setContactSortField(field);
  };

  const handleSortDeals = (
    field: "name" | "amount" | "closeDate" | "stage"
  ) => {
    const isAsc = dealSortField === field && dealSortOrder === "asc";
    setDealSortOrder(isAsc ? "desc" : "asc");
      setDealSortField(field);
  };

  const handleRemoveContactClick = (contactId: number, contactName: string) => {
    setContactToRemove({ id: contactId, name: contactName });
    setRemoveContactDialogOpen(true);
  };

  const handleConfirmRemoveContact = async () => {
    if (!id || !contactToRemove) return;
    try {
      setSaving(true);
      await api.delete(`/companies/${id}/contacts/${contactToRemove.id}`);
      setAssociatedContacts((prevContacts) =>
        prevContacts.filter((contact: any) => contact.id !== contactToRemove.id)
      );
      await fetchCompany();
      setRemoveContactDialogOpen(false);
      setContactToRemove(null);
    } catch (error: any) {
      console.error("Error removing contact:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el contacto";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDealClick = (dealId: number, dealName: string) => {
    setDealToRemove({ id: dealId, name: dealName });
    setRemoveDealDialogOpen(true);
  };

  const handleConfirmRemoveDeal = async () => {
    if (!id || !dealToRemove) return;
    try {
      setSaving(true);
      await api.delete(`/companies/${id}/deals/${dealToRemove.id}`);
      setAssociatedDeals((prevDeals) =>
        prevDeals.filter((deal: any) => deal.id !== dealToRemove.id)
      );
      await fetchCompany();
      setRemoveDealDialogOpen(false);
      setDealToRemove(null);
    } catch (error: any) {
      console.error("Error removing deal:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el negocio";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTicketClick = (ticketId: number, ticketName: string) => {
    setTicketToRemove({ id: ticketId, name: ticketName });
    setRemoveTicketDialogOpen(true);
  };

  const handleConfirmRemoveTicket = async () => {
    if (!id || !ticketToRemove) return;
    try {
      setSaving(true);
      await api.delete(`/companies/${id}/tickets/${ticketToRemove.id}`);
      setAssociatedTickets((prevTickets) =>
        prevTickets.filter((ticket: any) => ticket.id !== ticketToRemove.id)
      );
      await fetchCompany();
      setRemoveTicketDialogOpen(false);
      setTicketToRemove(null);
    } catch (error: any) {
      console.error("Error removing ticket:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el ticket";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Nota: filteredActivities está comentado porque no se usa actualmente
  // const filteredActivities = activities.filter((activity) => {
  //   // Filtro por búsqueda de texto
  //   if (activitySearch && !activity.subject?.toLowerCase().includes(activitySearch.toLowerCase()) &&
  //       !activity.description?.toLowerCase().includes(activitySearch.toLowerCase())) {
  //     return false;
  //   }
  //   
  //   // Filtro por tipo de actividad según los filtros de comunicación y actividad del equipo
  //   const activityType = activity.type?.toLowerCase();
  //   
  //   // Si es una nota, verificar filtro de "Actividad del equipo" -> "Notas"
  //   if (activityType === 'note') {
  //     if (!teamActivityFilters.notes) {
  //       return false;
  //     }
  //   }
  //   // Si es una reunión, verificar filtro de "Actividad del equipo" -> "Reuniones"
  //   else if (activityType === 'meeting') {
  //     if (!teamActivityFilters.meetings) {
  //       return false;
  //     }
  //   }
  //   // Si es una tarea, verificar filtro de "Actividad del equipo" -> "Tareas"
  //   else if (activityType === 'task') {
  //     if (!teamActivityFilters.tasks) {
  //       return false;
  //     }
  //   }
  //   // Si es un correo, verificar filtro de "Comunicación" -> "Correos"
  //   else if (activityType === 'email') {
  //     if (!communicationFilters.email) {
  //       return false;
  //     }
  //   }
  //   // Si es una llamada, verificar filtro de "Comunicación" -> "Llamadas"
  //   else if (activityType === 'call') {
  //     if (!communicationFilters.calls) {
  //       return false;
  //     }
  //   }
  //   
  //   return true;
  // });

  // Función para obtener el rango de fechas según la opción seleccionada
  // Nota: getDateRange está comentado porque no se usa actualmente
  // const getDateRange = (range: string): { start: Date | null; end: Date | null } => {
  //   const now = new Date();
  //   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  //   
  //   switch (range) {
  //     case 'Todo hasta ahora':
  //     case 'Todo':
  //       return { start: null, end: null };
  //     
  //     case 'Hoy':
  //       return {
  //         start: today,
  //         end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
  //       };
  //     
  //     case 'Ayer':
  //       const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  //       return {
  //         start: yesterday,
  //         end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
  //       };
  //     
  //     case 'Esta semana':
  //       const dayOfWeek = today.getDay();
  //       const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  //       const weekStart = new Date(today.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
  //       return {
  //         start: weekStart,
  //         end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
  //       };
  //     
  //     case 'Semana pasada':
  //       const lastWeekDayOfWeek = today.getDay();
  //       const lastWeekDaysFromMonday = lastWeekDayOfWeek === 0 ? 6 : lastWeekDayOfWeek - 1;
  //       const lastWeekStart = new Date(today.getTime() - (lastWeekDaysFromMonday + 7) * 24 * 60 * 60 * 1000);
  //       const lastWeekEnd = new Date(today.getTime() - (lastWeekDaysFromMonday + 1) * 24 * 60 * 60 * 1000);
  //       return {
  //         start: lastWeekStart,
  //         end: new Date(lastWeekEnd.getTime() + 24 * 60 * 60 * 1000 - 1),
  //       };
  //     
  //     case 'Últimos 7 días':
  //       return {
  //         start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  //         end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
  //       };
  //     
  //     default:
  //       return { start: null, end: null };
  //   }
  // };

  // Filtrar actividades por rango de tiempo
  // Nota: timeFilteredActivities está comentado porque no se usa actualmente
  // const timeFilteredActivities = filteredActivities.filter((activity) => {
  //   if (!activity.createdAt) return false;
  //   
  //   const dateRange = getDateRange(selectedTimeRange);
  //   if (!dateRange.start && !dateRange.end) return true; // "Todo hasta ahora"
  //   
  //   const activityDate = new Date(activity.createdAt);
  //   activityDate.setHours(0, 0, 0, 0);
  //   
  //   if (dateRange.start) {
  //     const startDate = new Date(dateRange.start);
  //     startDate.setHours(0, 0, 0, 0);
  //     if (activityDate < startDate) return false;
  //   }
  //   
  //   if (dateRange.end) {
  //     const endDate = new Date(dateRange.end);
  //     endDate.setHours(23, 59, 59, 999);
  //     if (activityDate > endDate) return false;
  //   }
  //   
  //   return true;
  // });

  // Funciones para manejar notas y actividades
  // Nota: groupedActivities, toggleNoteExpand y toggleActivityExpand están comentados porque no se usan actualmente
  // const groupedActivities = timeFilteredActivities.reduce((acc: { [key: string]: any[] }, activity) => {
  //   if (!activity.createdAt) return acc;
  //   const date = new Date(activity.createdAt);
  //   const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  //   if (!acc[monthKey]) {
  //     acc[monthKey] = [];
  //   }
  //   acc[monthKey].push(activity);
  //   return acc;
  // }, {});

  // const toggleNoteExpand = (noteId: number) => {
  //   const newExpanded = new Set(expandedNotes);
  //   if (newExpanded.has(noteId)) {
  //     newExpanded.delete(noteId);
  //   } else {
  //     newExpanded.add(noteId);
  //   }
  //   setExpandedNotes(newExpanded);
  // };

  // const toggleActivityExpand = (activityId: number) => {
  //   const newExpanded = new Set(expandedActivities);
  //   if (newExpanded.has(activityId)) {
  //     newExpanded.delete(activityId);
  //   } else {
  //     newExpanded.add(activityId);
  //   }
  //   setExpandedActivities(newExpanded);
  // };

  // const handleNoteActionMenuOpen = (event: React.MouseEvent<HTMLElement>, noteId: number) => {
  //   event.stopPropagation();
  //   setNoteActionMenus({ ...noteActionMenus, [noteId]: event.currentTarget });
  // };

  // const handleNoteActionMenuClose = (noteId: number) => {
  //   setNoteActionMenus({ ...noteActionMenus, [noteId]: null });
  // };

  // const handlePinNote = async (noteId: number) => {
  //   // TODO: Implementar funcionalidad de anclar
  //   console.log('Anclar nota:', noteId);
  //   handleNoteActionMenuClose(noteId);
  // };

  // const handleViewHistory = (noteId: number) => {
  //   // TODO: Implementar historial
  //   console.log('Ver historial:', noteId);
  //   handleNoteActionMenuClose(noteId);
  // };

  // const handleCopyLink = async (noteId: number) => {
  //   try {
  //     const noteUrl = `${window.location.origin}/companies/${id}?activity=${noteId}`;
  //     await navigator.clipboard.writeText(noteUrl);
  //     setSuccessMessage('Enlace copiado al portapapeles');
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //     handleNoteActionMenuClose(noteId);
  //   } catch (error) {
  //     console.error('Error al copiar enlace:', error);
  //     setSuccessMessage('Error al copiar enlace');
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //   }
  // };

  // const handleDeleteNote = async (noteId: number) => {
  //   if (!window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
  //     handleNoteActionMenuClose(noteId);
  //     return;
  //   }
  //   
  //   try {
  //     await api.delete(`/activities/${noteId}`);
  //     setSuccessMessage('Nota eliminada exitosamente');
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //     handleNoteActionMenuClose(noteId);
  //     
  //     // Eliminar la nota del estado local inmediatamente
  //     setActivities(activities.filter(activity => activity.id !== noteId));
  //     
  //     // También actualizar desde el servidor para asegurar consistencia
  //     fetchAssociatedRecords();
  //   } catch (error: any) {
  //     console.error('Error al eliminar nota:', error);
  //     const errorMessage = error.response?.data?.error || error.message || 'Error al eliminar la nota';
  //     setSuccessMessage(errorMessage);
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //   }
  // };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!company) {
    return (
      <Box>
        <Typography>Empresa no encontrada</Typography>
        <Button onClick={() => navigate("/companies")}>
          Volver a Empresas
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
      bgcolor: theme.palette.background.default,
        minHeight: "100vh",
      pb: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Título de la página */}
      <Box
        sx={{
        pt: { xs: 2, sm: 3 }, 
        pb: 2, 
        px: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        gap: 1.5,
        }}
      >
        {/* Lado izquierdo: Botón de regresar y título */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => navigate("/companies")}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                bgcolor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.5rem" },
            }}
          >
            Información de la empresa
          </Typography>
        </Box>

        {/* Lado derecho: Breadcrumb */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          gap: 0.5,
          color: theme.palette.text.secondary,
          }}
        >
          <Typography
            component="span"
            onClick={() => navigate("/companies")}
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              cursor: "pointer",
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.text.primary,
                textDecoration: "underline",
              },
            }}
          >
            Empresas
          </Typography>
          <KeyboardArrowRight
            sx={{
              fontSize: { xs: 16, sm: 18 },
              color: theme.palette.text.disabled,
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              color: theme.palette.text.primary,
              fontWeight: 500,
            }}
          >
            {company?.name}
          </Typography>
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        flex: 1,
          overflow: { xs: "visible", md: "hidden" },
          minHeight: { xs: "auto", md: 0 },
        gap: 2,
        px: { xs: 2, sm: 3, md: 4 },
        }}
      >
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
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              animation: "slideDown 0.2s ease",
              "@keyframes slideDown": {
                "0%": {
                      opacity: 0,
                  transform: "translateY(-10px)",
                    },
                "100%": {
                      opacity: 1,
                  transform: "translateY(0)",
                    },
                  },
                },
              }}
            >
              <MenuItem 
                onClick={handleOpenEditDialog}
                sx={{
              transition: "all 0.15s ease",
              "&:hover": {
                backgroundColor: "rgba(46, 125, 50, 0.08)",
                transform: "translateX(4px)",
                  },
                }}
              >
                Editar
              </MenuItem>
              <MenuItem 
                onClick={handleMenuClose}
                sx={{
              transition: "all 0.15s ease",
              "&:hover": {
                backgroundColor: "rgba(46, 125, 50, 0.08)",
                transform: "translateX(4px)",
                  },
                }}
              >
                Eliminar
              </MenuItem>
              <MenuItem 
                onClick={handleMenuClose}
                sx={{
              transition: "all 0.15s ease",
              "&:hover": {
                backgroundColor: "rgba(46, 125, 50, 0.08)",
                transform: "translateX(4px)",
                  },
                }}
              >
                Duplicar
              </MenuItem>
            </Menu>

        {/* Columna Principal - Descripción y Actividades */}
        <Box
          sx={{
                flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* CompanyHeader */}
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
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Parte superior: Avatar + Info a la izquierda, Botones a la derecha */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              {/* Izquierda: Avatar + Nombre + Subtítulo */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Avatar
                  src={empresaLogo}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: empresaLogo
                      ? "transparent"
                      : taxiMonterricoColors.orange,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                  }}
                >
                  {!empresaLogo && getCompanyInitials(company.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, fontSize: "1.25rem", mb: 0.5 }}
                  >
                    {company.name}
            </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {company.domain ||
                      company.companyname ||
                      "Sin información adicional"}
                </Typography>
              </Box>
              </Box>

              {/* Derecha: Etapa + Menú desplegable de acciones */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Chip
                  label={getStageLabel(company.lifecycleStage)}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: "0.75rem",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(46, 125, 50, 0.2)"
                        : "rgba(46, 125, 50, 0.1)",
                    color: taxiMonterricoColors.green,
                    fontWeight: 500,
                  }}
                />
                <Tooltip title="Acciones">
                  <IconButton
                    onClick={(e) => setActionsMenuAnchorEl(e.currentTarget)}
                  sx={{
                      color: theme.palette.text.secondary,
                      "&:hover": {
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
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleOpenNote();
                      setActionsMenuAnchorEl(null);
                    }}
                  >
                    <Note sx={{ fontSize: 20, mr: 1.5 }} />
                    Crear nota
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenEmail();
                      setActionsMenuAnchorEl(null);
                    }}
                  >
                    <Email sx={{ fontSize: 20, mr: 1.5 }} />
                    Enviar email
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenCall();
                      setActionsMenuAnchorEl(null);
                    }}
                  >
                    <Phone sx={{ fontSize: 20, mr: 1.5 }} />
                    Llamar
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleOpenTask();
                      setActionsMenuAnchorEl(null);
                    }}
                  >
                    <Assignment sx={{ fontSize: 20, mr: 1.5 }} />
                    Crear tarea
                  </MenuItem>
                </Menu>
                <Tooltip title="Más opciones">
                  <IconButton
                    onClick={handleMenuOpen}
                  sx={{
                      color: theme.palette.text.secondary,
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                    },
                  }}
                >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Box>
              </Box>

            {/* Línea separadora */}
            <Divider
              sx={{
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.08)",
              }}
            />

            {/* Parte inferior: Chips */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Email de la empresa */}
                {(company as any).email && (
                  <Chip
                    icon={<Email sx={{ fontSize: 14 }} />}
                    label={(company as any).email}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#FFFFFF",
                      border: `1px solid ${theme.palette.divider}`,
                      "& .MuiChip-icon": {
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />
                )}
                {/* Ubicación */}
                {(company.city || company.address) && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 14 }} />}
                    label={company.city || company.address || "--"}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#FFFFFF",
                      border: `1px solid ${theme.palette.divider}`,
                      "& .MuiChip-icon": {
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />
                )}
                {company.domain && (
                  <Chip
                    icon={<LinkIcon sx={{ fontSize: 14 }} />}
                    label={company.domain}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#FFFFFF",
                      border: `1px solid ${theme.palette.divider}`,
                      "& .MuiChip-icon": {
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />
                )}
                {company.phone && (
                  <Chip
                    icon={<Phone sx={{ fontSize: 14 }} />}
                    label={company.phone}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#FFFFFF",
                      border: `1px solid ${theme.palette.divider}`,
                      "& .MuiChip-icon": {
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />
                )}
              </Box>
              <IconButton
                component={
                  company.linkedin && company.linkedin !== "#" ? "a" : "button"
                }
                href={
                  company.linkedin && company.linkedin !== "#"
                    ? company.linkedin
                    : undefined
                }
                target={
                  company.linkedin && company.linkedin !== "#"
                    ? "_blank"
                    : undefined
                }
                rel={
                  company.linkedin && company.linkedin !== "#"
                    ? "noopener noreferrer"
                    : undefined
                }
                size="small"
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (!company.linkedin || company.linkedin === "#") {
                      e.preventDefault();
                      // Abrir el diálogo de edición en lugar de mostrar un prompt
                      handleOpenEditDialog();
                    }
                  }}
                  sx={{
                  color:
                    company.linkedin && company.linkedin !== "#"
                      ? "#0077b5"
                      : theme.palette.text.secondary,
                  "&:hover": {
                    bgcolor: theme.palette.action.hover,
                    color: "#0077b5",
                    },
                  }}
                >
                <LinkedIn sx={{ fontSize: 20 }} />
              </IconButton>
              </Box>
          </Paper>

          {/* Tabs estilo barra de filtros */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Card
              sx={{
              borderRadius: 2,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.1)",
              bgcolor: theme.palette.background.paper,
              px: 2,
              py: 0.5,
                display: "flex",
                alignItems: "center",
              flex: 1,
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)"
                }`,
              }}
            >
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
                  minHeight: "auto",
                  flex: 1,
                  "& .MuiTabs-flexContainer": {
                    gap: 0,
                    justifyContent: "flex-start",
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: taxiMonterricoColors.green,
                    height: 2,
              },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontSize: "0.875rem",
                fontWeight: 500,
                    minHeight: 40,
                    height: 40,
                    paddingX: 3,
                    bgcolor: "transparent",
                    color: theme.palette.text.secondary,
                    transition: "all 0.2s ease",
                    position: "relative",
                    "&.Mui-selected": {
                      bgcolor: "transparent",
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                    },
                    "&:hover": {
                      bgcolor: "transparent",
                      color: theme.palette.text.primary,
                    },
                    "&:not(:last-child)::after": {
                      content: '""',
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "1px",
                      height: "60%",
                      backgroundColor: theme.palette.divider,
                    },
              },
            }}
          >
                <Tab label="Resumen" />
                <Tab label="Información Avanzada" />
            <Tab label="Actividades" />
          </Tabs>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                ml: 1,
                pl: 1,
                borderLeft: `1px solid ${theme.palette.divider}`,
                gap: 0.5,
                }}
              >
                <Tooltip title="Registro de Cambios">
                  <IconButton
                    onClick={() => setHistoryOpen(!historyOpen)}
                    size="small"
                    sx={{
                      color: historyOpen
                        ? "#2196F3"
                        : theme.palette.text.secondary,
                      "&:hover": {
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    <History />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copiloto IA">
                  <IconButton
                    onClick={() => setCopilotOpen(!copilotOpen)}
                    size="small"
                    sx={{
                      color: copilotOpen
                        ? taxiMonterricoColors.green
                        : theme.palette.text.secondary,
                      "&:hover": {
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    <AutoAwesome />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Box>

          {/* Tab Resumen - Cards pequeñas y Actividades Recientes */}
          {tabValue === 0 && (
            <>
              {/* Cards de Fecha de Creación, Etapa del Ciclo de Vida, Última Actividad y Propietario */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                gap: 2, 
                  mb: 2,
                }}
              >
              <Card
                sx={{
                    width: "100%",
                  p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)"
                    }`,
                  borderRadius: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <CalendarToday
                      sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                  Fecha de creación
                </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                  {company.createdAt
                      ? `${new Date(company.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )} ${new Date(company.createdAt).toLocaleTimeString(
                          "es-ES",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}`
                      : "No disponible"}
                </Typography>
              </Card>

              <Card
                sx={{
                    width: "100%",
                  p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)"
                    }`,
                  borderRadius: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <DonutSmall
                      sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                  Etapa del ciclo de vida
                </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <KeyboardArrowRight
                      sx={{ fontSize: 16, color: theme.palette.text.secondary }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.875rem" }}
                    >
                      {company.lifecycleStage
                        ? getStageLabel(company.lifecycleStage)
                        : "No disponible"}
                </Typography>
                  </Box>
              </Card>

              <Card
                sx={{
                    width: "100%",
                  p: 2,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)"
                    }`,
                  borderRadius: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <AccessTime
                      sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                  Última actividad
                </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                  {activities.length > 0 && activities[0].createdAt
                      ? new Date(activities[0].createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "No hay actividades"}
                </Typography>
              </Card>

                <Card
                      sx={{
                    width: "100%",
                    p: 2,
                          bgcolor: theme.palette.background.paper,
                    border: `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.15)"
                    }`,
                    borderRadius: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                  }}
                          >
                            <Box
                              sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Person
                      sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                    />
                              <Typography 
                      variant="subtitle2"
                                sx={{ 
                                  fontWeight: 600, 
                                  color: theme.palette.text.primary,
                                }}
                              >
                      Propietario del registro
                              </Typography>
                  </Box>
                              <Typography 
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {company.Owner
                      ? company.Owner.firstName || company.Owner.lastName
                        ? `${company.Owner.firstName || ""} ${
                            company.Owner.lastName || ""
                          }`.trim()
                        : company.Owner.email || "Sin nombre"
                      : "No asignado"}
                              </Typography>
                </Card>
                    </Box>

              {/* Grid 2x2 para Actividades Recientes, Contactos, Negocios y Tickets */}
              <Box
                        sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 2,
                  mt: 2,
                  mb: 2,
                }}
              >
                <RecentActivitiesCard activities={activities} />
                <LinkedContactsCard contacts={associatedContacts || []} />
                <LinkedDealsCard deals={associatedDeals || []} />
                <LinkedTicketsCard tickets={associatedTickets || []} />
              </Box>
            </>
          )}

          {/* Contenido de las pestañas */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {/* Pestaña Información Avanzada */}
            {tabValue === 1 && (
              <Box>
                {/* Card de Actividades Recientes */}
                <FullActivitiesTableCard
                  activities={activities}
                  searchValue={activitySearch}
                  onSearchChange={setActivitySearch}
                  onCreateActivity={(type) => handleCreateActivity(type as string)}
                  onActivityClick={setExpandedActivity}
                  onToggleComplete={(activityId, completed) => {
                                  setCompletedActivities((prev) => ({
                                    ...prev,
                      [activityId]: completed,
                                  }));
                                }}
                  completedActivities={completedActivities}
                  getActivityTypeLabel={getActivityTypeLabel}
                />

                {/* Contactos */}
                <FullContactsTableCard
                  contacts={associatedContacts || []}
                  searchValue={contactSearch}
                  onSearchChange={setContactSearch}
                  onAddExisting={() => {
                    handleOpenAddContactDialog();
                  }}
                  onAddNew={() => {
                    handleOpenAddContactDialog();
                  }}
                  showActions={true}
                  onRemove={(contactId, contactName) =>
                    handleRemoveContactClick(contactId, contactName || "")
                  }
                  getContactInitials={getContactInitials}
                  onCopyToClipboard={handleCopyToClipboard}
                  sortField={contactSortField}
                  sortOrder={contactSortOrder}
                  onSort={handleSortContacts}
                />

                {/* Negocios */}
                <FullDealsTableCard
                  deals={associatedDeals || []}
                  searchValue={dealSearch}
                  onSearchChange={setDealSearch}
                  onAddExisting={() => {
                    setDealFormData({
                      name: "",
                      amount: "",
                      stage: "lead",
                      closeDate: "",
                      priority: "baja" as "baja" | "media" | "alta",
                      companyId: company?.id?.toString() || "",
                      contactId: "",
                    });
                          if (allCompanies.length === 0) {
                            fetchAllCompanies();
                          }
                          if (allContacts.length === 0) {
                            fetchAllContacts();
                          }
                          setAddDealOpen(true);
                        }}
                  onAddNew={() => {
                    setDealFormData({
                      name: "",
                      amount: "",
                      stage: "lead",
                      closeDate: "",
                      priority: "baja" as "baja" | "media" | "alta",
                      companyId: company?.id?.toString() || "",
                      contactId: "",
                    });
                    if (allCompanies.length === 0) {
                      fetchAllCompanies();
                    }
                    if (allContacts.length === 0) {
                      fetchAllContacts();
                    }
                    setAddDealOpen(true);
                  }}
                  showActions={true}
                  onRemove={(dealId, dealName) =>
                    handleRemoveDealClick(dealId, dealName || "")
                  }
                  getInitials={(name: string) => {
                    return name
                      ? name.split(" ").length >= 2
                        ? `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`.toUpperCase()
                        : name.substring(0, 2).toUpperCase()
                      : "--";
                  }}
                  getStageLabel={getStageLabel}
                  sortField={dealSortField}
                  sortOrder={dealSortOrder}
                  onSort={handleSortDeals}
                />

                {/* Tickets */}
                <FullTicketsTableCard
                  tickets={associatedTickets || []}
                  searchValue={ticketSearch}
                  onSearchChange={setTicketSearch}
                  onAdd={() => setAddTicketOpen(true)}
                  showActions={true}
                  onRemove={(ticketId: number, ticketName?: string) =>
                    handleRemoveTicketClick(ticketId, ticketName || "")
                  }
                />
              </Box>
            )}

            {/* Pestaña Actividades */}
            {tabValue === 2 && (
              <ActivitiesTabContent
                activities={activities}
                activitySearch={activitySearch}
                onSearchChange={setActivitySearch}
                onCreateActivity={(type) => handleCreateActivity(type as string)}
                onActivityClick={setExpandedActivity}
                onToggleComplete={(activityId, completed) => {
                  setCompletedActivities((prev) => ({
                    ...prev,
                    [activityId]: completed,
                  }));
                }}
                completedActivities={completedActivities}
                getActivityTypeLabel={getActivityTypeLabel}
                getActivityStatusColor={getActivityStatusColor}
                emptyMessage="No hay actividades registradas para esta empresa. Crea una nueva actividad para comenzar."
              />
            )}
          </Box>
        </Box>

        {/* Columna Copiloto IA y Registro de Cambios - Solo en desktop cuando está abierto */}
        {isDesktop && copilotOpen && (
          <Box
            sx={{
          width: 380,
          flexShrink: 0,
              display: "flex",
              flexDirection: "column",
          gap: 2,
              alignSelf: "flex-start",
            }}
          >
          {/* Copiloto IA */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          p: 2,
          pb: 3,
                boxSizing: "border-box",
                overflowY: "auto",
                height: "fit-content",
                maxHeight: "calc(100vh - 80px)",
              }}
            >
        {/* Header del Copilot */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AutoAwesome
                    sx={{ color: taxiMonterricoColors.green, fontSize: 24 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: "1.125rem",
                      color: theme.palette.text.primary,
                    }}
                  >
              Copiloto IA
            </Typography>
          </Box>
          <IconButton
                      size="small"
            onClick={() => setCopilotOpen(false)}
                      sx={{ 
              color: theme.palette.text.secondary,
                    "&:hover": {
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
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 152, 0, 0.1)"
                      : "rgba(255, 152, 0, 0.05)",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 152, 0, 0.2)"
                      : "rgba(255, 152, 0, 0.15)"
                  }`,
            borderRadius: 2,
          }}
        >
                <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box
                        sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 152, 0, 0.2)"
                          : "rgba(255, 152, 0, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                flexShrink: 0,
              }}
            >
                    <ReportProblem sx={{ fontSize: 20, color: "#FF9800" }} />
                    </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: "0.875rem",
                        color: theme.palette.text.primary,
                      }}
                    >
                Muestra preocupantes
              </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                    >
                {associatedTickets.length > 0 
                  ? `Esta empresa tiene ${associatedTickets.length} ticket(s) abierto(s) que requieren atención.`
                        : "Sin datos suficientes para generar alertas en este momento."}
              </Typography>
                  </Box>
          </Box>
                      <Button
            variant="outlined"
                        size="small"
            fullWidth
                        sx={{
              mt: 1,
                    borderColor: "#FF9800",
                    color: "#FF9800",
                    textTransform: "none",
                    fontSize: "0.875rem",
              fontWeight: 500,
                    "&:hover": {
                      borderColor: "#FF9800",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 152, 0, 0.15)"
                          : "rgba(255, 152, 0, 0.08)",
              },
            }}
            onClick={() => {
              setTabValue(1);
              setCopilotOpen(false);
            }}
          >
            Ver tickets
                      </Button>
        </Card>

        {/* Card 2: Próximas pérdidas */}
        <Card 
                              sx={{
                                mb: 2,
            p: 2, 
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(244, 67, 54, 0.1)"
                      : "rgba(244, 67, 54, 0.05)",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(244, 67, 54, 0.2)"
                      : "rgba(244, 67, 54, 0.15)"
                  }`,
            borderRadius: 2,
          }}
        >
                <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(244, 67, 54, 0.2)"
                          : "rgba(244, 67, 54, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                flexShrink: 0,
              }}
            >
                    <Receipt sx={{ fontSize: 20, color: "#F44336" }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: "0.875rem",
                        color: theme.palette.text.primary,
                      }}
                    >
                Próximas pérdidas
                            </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                    >
                      Sin datos suficientes para identificar riesgos financieros
                      en este momento.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
                                  sx={{
              mt: 1,
                    borderColor: "#F44336",
                    color: "#F44336",
                    textTransform: "none",
                    fontSize: "0.875rem",
              fontWeight: 500,
                    "&:hover": {
                      borderColor: "#F44336",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(244, 67, 54, 0.15)"
                          : "rgba(244, 67, 54, 0.08)",
              },
            }}
            onClick={() => {
              setTabValue(1);
              setCopilotOpen(false);
            }}
          >
            Ver pagos
          </Button>
        </Card>

        {/* Card 3: Manejo seguimiento */}
        <Card 
                                        sx={{
            p: 2, 
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(46, 125, 50, 0.1)"
                      : "rgba(46, 125, 50, 0.05)",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(46, 125, 50, 0.2)"
                      : "rgba(46, 125, 50, 0.15)"
                  }`,
            borderRadius: 2,
          }}
        >
                <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                                              <Box
                                                sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(46, 125, 50, 0.2)"
                          : "rgba(46, 125, 50, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                flexShrink: 0,
              }}
            >
                    <TaskAlt
                      sx={{ fontSize: 20, color: taxiMonterricoColors.green }}
                    />
                                              </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: "0.875rem",
                        color: theme.palette.text.primary,
                      }}
                    >
                Manejo seguimiento
                                              </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                    >
                {activities.length > 0
                        ? `Última actividad hace ${Math.floor(
                            (Date.now() -
                              new Date(activities[0].createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )} días. Es momento de hacer seguimiento.`
                        : "Sin datos suficientes. Crea una tarea para iniciar el seguimiento."}
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
                    textTransform: "none",
                    fontSize: "0.875rem",
              fontWeight: 500,
                    "&:hover": {
                borderColor: taxiMonterricoColors.green,
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(46, 125, 50, 0.15)"
                          : "rgba(46, 125, 50, 0.08)",
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

          {/* Card Independiente: Registro de Cambios / Logs */}
          {historyOpen && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.15)"
                  }`,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
            p: 2,
            pb: 3,
                  boxSizing: "border-box",
                  overflowY: "auto",
                  height: "fit-content",
                  maxHeight: "calc(100vh - 80px)",
                }}
              >
            {/* Card: Registro de Cambios */}
            <Card 
              sx={{ 
                p: 2, 
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(33, 150, 243, 0.1)"
                        : "rgba(33, 150, 243, 0.05)",
                    border: `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(33, 150, 243, 0.2)"
                        : "rgba(33, 150, 243, 0.15)"
                    }`,
                borderRadius: 2,
                maxHeight: 400,
                    display: "flex",
                    flexDirection: "column",
              }}
            >
                  <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.2)"
                            : "rgba(33, 150, 243, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                      <History sx={{ fontSize: 20, color: "#2196F3" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
                      >
                    Registro de Cambios
                  </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                      >
                    Historial de actividades y modificaciones recientes
                  </Typography>
                </Box>
              </Box>
              
              {/* Lista de logs */}
                  <Box
                    sx={{
                      overflowY: "auto",
                maxHeight: 280,
                mt: 1,
                      "&::-webkit-scrollbar": {
                  width: 6,
                },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "transparent",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                  borderRadius: 3,
                },
                    }}
                  >
                {loadingLogs ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 2,
                        }}
                      >
                    <CircularProgress size={20} />
                  </Box>
                ) : activityLogs.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: "0.75rem",
                          textAlign: "center",
                          py: 2,
                          fontStyle: "italic",
                        }}
                      >
                    No hay registros disponibles
                  </Typography>
                ) : (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                    {activityLogs.map((log, index) => {
                      const renderIcon = () => {
                        switch (log.iconType) {
                              case "note":
                            return <Note sx={{ fontSize: 16 }} />;
                              case "email":
                            return <Email sx={{ fontSize: 16 }} />;
                              case "call":
                            return <Phone sx={{ fontSize: 16 }} />;
                              case "meeting":
                            return <Event sx={{ fontSize: 16 }} />;
                              case "task":
                            return <TaskAlt sx={{ fontSize: 16 }} />;
                              case "company":
                            return <Business sx={{ fontSize: 16 }} />;
                          default:
                            return <History sx={{ fontSize: 16 }} />;
                        }
                      };

                      return (
                      <Box
                        key={log.id}
                        sx={{
                                display: "flex",
                          gap: 1,
                                alignItems: "flex-start",
                          pb: index < activityLogs.length - 1 ? 1.5 : 0,
                                borderBottom:
                                  index < activityLogs.length - 1
                                    ? `1px solid ${
                                        theme.palette.mode === "dark"
                                          ? "rgba(255,255,255,0.08)"
                                          : "rgba(0,0,0,0.08)"
                                      }`
                                    : "none",
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                                  bgcolor:
                                    theme.palette.mode === "dark"
                                      ? "rgba(33, 150, 243, 0.15)"
                                      : "rgba(33, 150, 243, 0.1)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                            flexShrink: 0,
                            mt: 0.25,
                          }}
                        >
                          {renderIcon()}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    mb: 0.25,
                                  }}
                                >
                            {log.description}
                          </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    flexWrap: "wrap",
                                  }}
                                >
                            {log.user && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: "0.6875rem",
                                        color: theme.palette.text.secondary,
                                      }}
                                    >
                                {log.user.firstName} {log.user.lastName}
                              </Typography>
                            )}
                            {log.timestamp && (
                              <>
                                {log.user && (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontSize: "0.6875rem",
                                            color: theme.palette.text.disabled,
                                          }}
                                        >
                                    •
                                  </Typography>
                                )}
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.6875rem",
                                          color: theme.palette.text.secondary,
                                        }}
                                      >
                                        {new Date(
                                          log.timestamp
                                        ).toLocaleDateString("es-ES", {
                                          day: "2-digit",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
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
        </Box>
        )}

        {/* Card Independiente: Registro de Cambios / Logs - Solo cuando Copiloto IA está cerrado */}
        {isDesktop && !copilotOpen && historyOpen && (
          <Box
            sx={{
          width: 380,
          flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)"
              }`,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          p: 2,
          pb: 3,
              boxSizing: "border-box",
              overflowY: "auto",
              height: "fit-content",
              maxHeight: "calc(100vh - 80px)",
              alignSelf: "flex-start",
          mb: 2,
            }}
          >
          {/* Card: Registro de Cambios */}
          <Card 
            sx={{ 
              p: 2, 
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(33, 150, 243, 0.1)"
                    : "rgba(33, 150, 243, 0.05)",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(33, 150, 243, 0.2)"
                    : "rgba(33, 150, 243, 0.15)"
                }`,
              borderRadius: 2,
              maxHeight: 400,
                display: "flex",
                flexDirection: "column",
            }}
          >
              <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(33, 150, 243, 0.2)"
                        : "rgba(33, 150, 243, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                  <History sx={{ fontSize: 20, color: "#2196F3" }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
                  >
                  Registro de Cambios
                </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                  >
                  Historial de actividades y modificaciones recientes
                </Typography>
              </Box>
            </Box>
            
            {/* Lista de logs */}
              <Box
                sx={{
                  overflowY: "auto",
              maxHeight: 280,
              mt: 1,
                  "&::-webkit-scrollbar": {
                width: 6,
              },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                borderRadius: 3,
              },
                }}
              >
              {loadingLogs ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 2 }}
                  >
                  <CircularProgress size={20} />
                </Box>
              ) : activityLogs.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: "0.75rem",
                      textAlign: "center",
                      py: 2,
                      fontStyle: "italic",
                    }}
                  >
                  No hay registros disponibles
                </Typography>
              ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                  {activityLogs.map((log, index) => {
                    const renderIcon = () => {
                      switch (log.iconType) {
                          case "note":
                          return <Note sx={{ fontSize: 16 }} />;
                          case "email":
                          return <Email sx={{ fontSize: 16 }} />;
                          case "call":
                          return <Phone sx={{ fontSize: 16 }} />;
                          case "meeting":
                          return <Event sx={{ fontSize: 16 }} />;
                          case "task":
                          return <TaskAlt sx={{ fontSize: 16 }} />;
                          case "company":
                          return <Business sx={{ fontSize: 16 }} />;
                        default:
                          return <History sx={{ fontSize: 16 }} />;
                      }
                    };

                    return (
                    <Box
                      key={log.id}
                      sx={{
                            display: "flex",
                        gap: 1,
                            alignItems: "flex-start",
                        pb: index < activityLogs.length - 1 ? 1.5 : 0,
                            borderBottom:
                              index < activityLogs.length - 1
                                ? `1px solid ${
                                    theme.palette.mode === "dark"
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(0,0,0,0.08)"
                                  }`
                                : "none",
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(33, 150, 243, 0.15)"
                                  : "rgba(33, 150, 243, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        {renderIcon()}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                mb: 0.25,
                              }}
                            >
                          {log.description}
                        </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                flexWrap: "wrap",
                              }}
                            >
                          {log.user && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "0.6875rem",
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                              {log.user.firstName} {log.user.lastName}
                            </Typography>
                          )}
                          {log.timestamp && (
                            <>
                              {log.user && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: "0.6875rem",
                                        color: theme.palette.text.disabled,
                                      }}
                                    >
                                  •
                                </Typography>
                              )}
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: "0.6875rem",
                                      color: theme.palette.text.secondary,
                                    }}
                                  >
                                    {new Date(log.timestamp).toLocaleDateString(
                                      "es-ES",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
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
                                  </Box>

      {/* Drawer Copiloto IA - Solo para móviles */}
      <Drawer
        anchor="right"
        open={copilotOpen && !isDesktop}
        onClose={() => setCopilotOpen(false)}
        variant="temporary"
        PaperProps={{
          sx: {
            width: "100%",
            borderLeft: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            p: 2,
            boxSizing: "border-box",
          },
        }}
      >
        {/* Header del Drawer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesome
              sx={{ color: taxiMonterricoColors.green, fontSize: 24 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.125rem",
                color: theme.palette.text.primary,
              }}
            >
              Copiloto IA
                            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setCopilotOpen(false)}
                                  sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
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
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 152, 0, 0.1)"
                : "rgba(255, 152, 0, 0.05)",
            border: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 152, 0, 0.2)"
                : "rgba(255, 152, 0, 0.15)"
            }`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box
                                        sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.2)"
                    : "rgba(255, 152, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ReportProblem sx={{ fontSize: 20, color: "#FF9800" }} />
                                          </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: "0.875rem",
                  color: theme.palette.text.primary,
                }}
              >
                Muestra preocupantes
                                          </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                {associatedTickets.length > 0 
                  ? `Esta empresa tiene ${associatedTickets.length} ticket(s) abierto(s) que requieren atención.`
                  : "Sin datos suficientes para generar alertas en este momento."}
                                    </Typography>
                                  </Box>
                          </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: "#FF9800",
              color: "#FF9800",
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              "&:hover": {
                borderColor: "#FF9800",
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.15)"
                    : "rgba(255, 152, 0, 0.08)",
              },
            }}
            onClick={() => {
              setTabValue(1);
              setCopilotOpen(false);
            }}
          >
            Ver tickets
          </Button>
        </Card>

        {/* Card 2: Próximas pérdidas */}
        <Card 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(244, 67, 54, 0.1)"
                : "rgba(244, 67, 54, 0.05)",
            border: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(244, 67, 54, 0.2)"
                : "rgba(244, 67, 54, 0.15)"
            }`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(244, 67, 54, 0.2)"
                    : "rgba(244, 67, 54, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Receipt sx={{ fontSize: 20, color: "#F44336" }} />
                            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: "0.875rem",
                  color: theme.palette.text.primary,
                }}
              >
                Próximas pérdidas
                            </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                Sin datos suficientes para identificar riesgos financieros en
                este momento.
                            </Typography>
                          </Box>
                      </Box>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              mt: 1,
              borderColor: "#F44336",
              color: "#F44336",
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              "&:hover": {
                borderColor: "#F44336",
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(244, 67, 54, 0.15)"
                    : "rgba(244, 67, 54, 0.08)",
              },
            }}
            onClick={() => {
              setTabValue(1);
              setCopilotOpen(false);
            }}
          >
            Ver pagos
          </Button>
              </Card>

        {/* Card 3: Manejo seguimiento */}
        <Card 
          sx={{ 
            p: 2, 
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(46, 125, 50, 0.1)"
                : "rgba(46, 125, 50, 0.05)",
            border: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(46, 125, 50, 0.2)"
                : "rgba(46, 125, 50, 0.15)"
            }`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(46, 125, 50, 0.2)"
                    : "rgba(46, 125, 50, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TaskAlt
                sx={{ fontSize: 20, color: taxiMonterricoColors.green }}
              />
                  </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: "0.875rem",
                  color: theme.palette.text.primary,
                }}
              >
                Manejo seguimiento
                  </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                {activities.length > 0
                  ? `Última actividad hace ${Math.floor(
                      (Date.now() -
                        new Date(activities[0].createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} días. Es momento de hacer seguimiento.`
                  : "Sin datos suficientes. Crea una tarea para iniciar el seguimiento."}
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
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              "&:hover": {
                borderColor: taxiMonterricoColors.green,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(46, 125, 50, 0.15)"
                    : "rgba(46, 125, 50, 0.08)",
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

      {/* Botón flotante para abrir el Drawer de Registros Asociados */}
      {!summaryExpanded && (
        <Box
          sx={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1000,
            display: { xs: "none", lg: "flex" },
          }}
        >
          <IconButton
            onClick={() => setSummaryExpanded(true)}
            sx={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(46, 125, 50, 0.8)"
                  : "rgba(46, 125, 50, 0.1)",
              color: "#2E7D32",
              borderRadius: "8px 0 0 8px",
              width: 40,
              height: 80,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(46, 125, 50, 0.9)"
                    : "rgba(46, 125, 50, 0.15)",
              },
            }}
          >
            <KeyboardArrowLeft sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>
      )}

      {/* Drawer de Registros Asociados */}
      <Drawer
        anchor="right"
        open={summaryExpanded}
        onClose={() => setSummaryExpanded(false)}
        PaperProps={{
          sx: {
            width: "100vw",
            maxWidth: "100vw",
            height: "100vh",
            maxHeight: "100vh",
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.background.default,
          }}
        >
          {/* Header del Drawer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Estadísticas de Servicios
            </Typography>
            <IconButton
              onClick={() => setSummaryExpanded(false)}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Contenido del Drawer */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              width: "100%",
              height: "100%",
              p: 3,
              // Ocultar scrollbar pero mantener scroll funcional
              "&::-webkit-scrollbar": {
                display: "none",
                width: 0,
              },
              // Para Firefox
              scrollbarWidth: "none",
            }}
          >
            {/* Controles de período */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 4,
                justifyContent: "center",
              }}
            >
              <Button
                variant={timePeriod === "day" ? "contained" : "outlined"}
                onClick={() => setTimePeriod("day")}
                sx={{
                  minWidth: 120,
                  bgcolor:
                    timePeriod === "day"
                      ? taxiMonterricoColors.green
                      : "transparent",
                  "&:hover": {
                    bgcolor:
                      timePeriod === "day"
                        ? taxiMonterricoColors.green
                        : theme.palette.action.hover,
                  },
                }}
              >
                Por Día
              </Button>
              <Button
                variant={timePeriod === "week" ? "contained" : "outlined"}
                onClick={() => setTimePeriod("week")}
                sx={{
                  minWidth: 120,
                  bgcolor:
                    timePeriod === "week"
                      ? taxiMonterricoColors.green
                      : "transparent",
                  "&:hover": {
                    bgcolor:
                      timePeriod === "week"
                        ? taxiMonterricoColors.green
                        : theme.palette.action.hover,
                  },
                }}
              >
                Por Semana
              </Button>
              <Button
                variant={timePeriod === "month" ? "contained" : "outlined"}
                onClick={() => setTimePeriod("month")}
                sx={{
                  minWidth: 120,
                  bgcolor:
                    timePeriod === "month"
                      ? taxiMonterricoColors.green
                      : "transparent",
                  "&:hover": {
                    bgcolor:
                      timePeriod === "month"
                        ? taxiMonterricoColors.green
                        : theme.palette.action.hover,
                  },
                }}
              >
                Por Mes
              </Button>
            </Box>

            {/* Gráfico de Servicios */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Servicios Realizados
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={
                    timePeriod === "day"
                      ? [
                          { servicio: "Transporte", cantidad: 45 },
                          { servicio: "Envío", cantidad: 32 },
                          { servicio: "Carga", cantidad: 28 },
                          { servicio: "Mensajería", cantidad: 19 },
                          { servicio: "Delivery", cantidad: 15 },
                          { servicio: "Traslado", cantidad: 12 },
                        ]
                      : timePeriod === "week"
                      ? [
                          { servicio: "Transporte", cantidad: 285 },
                          { servicio: "Envío", cantidad: 198 },
                          { servicio: "Carga", cantidad: 175 },
                          { servicio: "Mensajería", cantidad: 124 },
                          { servicio: "Delivery", cantidad: 98 },
                          { servicio: "Traslado", cantidad: 76 },
                        ]
                      : [
                          { servicio: "Transporte", cantidad: 1245 },
                          { servicio: "Envío", cantidad: 892 },
                          { servicio: "Carga", cantidad: 756 },
                          { servicio: "Mensajería", cantidad: 534 },
                          { servicio: "Delivery", cantidad: 421 },
                          { servicio: "Traslado", cantidad: 328 },
                        ]
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="servicio"
                    tick={{ fill: theme.palette.text.secondary }}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    tick={{ fill: theme.palette.text.secondary }}
                    style={{ fontSize: "12px" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="cantidad"
                    fill={taxiMonterricoColors.green}
                    radius={[8, 8, 0, 0]}
                    name="Cantidad de Servicios"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            {/* Gráfico de Tendencia */}
            <Paper
              sx={{
                p: 3,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Tendencia de Servicios
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    timePeriod === "day"
                      ? [
                          {
                            periodo: "00:00",
                            Transporte: 2,
                            Envío: 1,
                            Carga: 1,
                          },
                          {
                            periodo: "04:00",
                            Transporte: 1,
                            Envío: 0,
                            Carga: 0,
                          },
                          {
                            periodo: "08:00",
                            Transporte: 8,
                            Envío: 5,
                            Carga: 4,
                          },
                          {
                            periodo: "12:00",
                            Transporte: 12,
                            Envío: 9,
                            Carga: 7,
                          },
                          {
                            periodo: "16:00",
                            Transporte: 15,
                            Envío: 11,
                            Carga: 9,
                          },
                          {
                            periodo: "20:00",
                            Transporte: 7,
                            Envío: 6,
                            Carga: 7,
                          },
                        ]
                      : timePeriod === "week"
                      ? [
                          {
                            periodo: "Lun",
                            Transporte: 38,
                            Envío: 27,
                            Carga: 23,
                          },
                          {
                            periodo: "Mar",
                            Transporte: 42,
                            Envío: 30,
                            Carga: 26,
                          },
                          {
                            periodo: "Mié",
                            Transporte: 45,
                            Envío: 32,
                            Carga: 28,
                          },
                          {
                            periodo: "Jue",
                            Transporte: 48,
                            Envío: 35,
                            Carga: 30,
                          },
                          {
                            periodo: "Vie",
                            Transporte: 52,
                            Envío: 38,
                            Carga: 33,
                          },
                          {
                            periodo: "Sáb",
                            Transporte: 35,
                            Envío: 25,
                            Carga: 22,
                          },
                          {
                            periodo: "Dom",
                            Transporte: 25,
                            Envío: 19,
                            Carga: 13,
                          },
                        ]
                      : [
                          {
                            periodo: "Ene",
                            Transporte: 1020,
                            Envío: 730,
                            Carga: 620,
                          },
                          {
                            periodo: "Feb",
                            Transporte: 1150,
                            Envío: 825,
                            Carga: 700,
                          },
                          {
                            periodo: "Mar",
                            Transporte: 1245,
                            Envío: 892,
                            Carga: 756,
                          },
                          {
                            periodo: "Abr",
                            Transporte: 1180,
                            Envío: 845,
                            Carga: 715,
                          },
                          {
                            periodo: "May",
                            Transporte: 1320,
                            Envío: 945,
                            Carga: 800,
                          },
                          {
                            periodo: "Jun",
                            Transporte: 1280,
                            Envío: 915,
                            Carga: 775,
                          },
                        ]
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fill: theme.palette.text.secondary }}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    tick={{ fill: theme.palette.text.secondary }}
                    style={{ fontSize: "12px" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Transporte"
                    stroke={taxiMonterricoColors.green}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Envío"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Carga"
                    stroke="#2e7d32"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        </Box>
      </Drawer>

      {/* Mensaje de éxito */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage("")}
          sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}
        >
          {successMessage}
        </Alert>
      )}

      {/* Ventana flotante de Nota */}
      {noteOpen && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95vw", sm: "700px" },
            maxWidth: { xs: "95vw", sm: "90vw" },
            height: "85vh",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "#1F2937"
                : theme.palette.background.paper,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 60px rgba(0,0,0,0.5)"
                : "0 20px 60px rgba(0,0,0,0.12)",
            zIndex: 1500,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 4,
            animation: "fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "@keyframes fadeInScale": {
              "0%": {
                opacity: 0,
                transform: "translate(-50%, -50%) scale(0.95)",
              },
              "100%": {
                opacity: 1,
                transform: "translate(-50%, -50%) scale(1)",
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
              backgroundColor: "transparent",
              color: theme.palette.text.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                color: theme.palette.text.primary, 
                fontWeight: 600, 
                  fontSize: "1.25rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Nota
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton 
                sx={{ 
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    backgroundColor: theme.palette.error.main + "15",
                    color: theme.palette.error.main,
                  },
                  transition: "all 0.2s ease",
                }} 
                size="small" 
                onClick={() => setNoteOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "row",
              p: 3,
              overflow: "hidden",
              gap: 3,
            }}
          >
          {/* Columna Izquierda: Editor */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
            {/* Editor de texto enriquecido con barra de herramientas integrada */}
              <Box
                sx={{
              flexGrow: 1, 
                  display: "flex",
                  flexDirection: "column",
                  border: `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : theme.palette.divider
                  }`,
              borderRadius: 2,
                  overflow: "hidden",
                  minHeight: "300px",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "#1F2937"
                      : theme.palette.background.paper,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:focus-within": {
                    boxShadow: "none",
                borderColor: theme.palette.divider,
                    transform: "none",
              },
                }}
              >
              <RichTextEditor
                value={noteData.description}
                  onChange={(value: string) =>
                    setNoteData({ ...noteData, description: value })
                  }
                placeholder="Empieza a escribir para dejar una nota..."
                onAssociateClick={() => {
                  setNoteAssociateModalOpen(true);
                    setSelectedCategory("empresas");
                    setAssociateSearch("");
                  // Inicializar selecciones con los valores actuales
                  setNoteSelectedAssociations({
                    companies: selectedCompanies,
                    contacts: selectedContacts,
                      deals: selectedAssociations
                        .filter((id: number) => id > 1000 && id < 2000)
                        .map((id) => id - 1000),
                      tickets: selectedAssociations
                        .filter((id: number) => id > 2000)
                        .map((id) => id - 2000),
                  });
                  fetchAssociations();
                }}
              />
            </Box>
          </Box>
          </Box>

          {/* Footer con botones */}
          <Box
            sx={{
            px: 3,
            py: 2.5, 
              borderTop: `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : theme.palette.divider
              }`,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "#1F2937"
                  : theme.palette.background.paper,
              display: "flex",
              justifyContent: "flex-end",
            gap: 2,
            }}
          >
            <Button 
              onClick={() => setNoteOpen(false)} 
              sx={{ 
                textTransform: "none",
                px: 3.5,
                py: 1.25,
                color: theme.palette.text.secondary,
                fontWeight: 500,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
                transition: "all 0.2s ease",
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNote} 
              variant="contained" 
              disabled={saving || !noteData.description.trim()}
              sx={{ 
                textTransform: "none",
                px: 4,
                py: 1.25,
                backgroundColor: saving
                  ? theme.palette.action.disabledBackground
                  : taxiMonterricoColors.orange,
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: saving
                  ? "none"
                  : `0 4px 12px ${taxiMonterricoColors.orange}40`,
                "&:hover": {
                  backgroundColor: saving
                    ? theme.palette.action.disabledBackground
                    : taxiMonterricoColors.orangeDark,
                  boxShadow: saving
                    ? "none"
                    : `0 6px 16px ${taxiMonterricoColors.orange}50`,
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                  boxShadow: "none",
                },
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {saving ? "Guardando..." : "Crear nota"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Overlay de fondo cuando la ventana está abierta */}
      {noteOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.7)"
                : "rgba(0, 0, 0, 0.5)",
            zIndex: 1499,
            animation: "fadeIn 0.3s ease-out",
            "@keyframes fadeIn": {
              "0%": {
                opacity: 0,
              },
              "100%": {
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
        sx={{ zIndex: 1600 }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "80vh",
            width: "700px",
            maxWidth: "90vw",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            height: "500px",
          }}
        >
          {/* Panel izquierdo - Categorías */}
          <Box
            sx={{
              width: 160,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor:
                theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa",
              overflowY: "auto",
            }}
          >
            <List sx={{ p: 0 }}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === "seleccionados"}
                  onClick={() => setSelectedCategory("seleccionados")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Seleccionados"
                    secondary={
                      Object.values(noteSelectedAssociations).flat().length
                    }
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === "empresas"}
                  onClick={() => setSelectedCategory("empresas")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Empresas"
                    secondary={noteModalCompanies.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === "contactos"}
                  onClick={() => setSelectedCategory("contactos")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Contactos"
                    secondary={noteModalContacts.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === "negocios"}
                  onClick={() => setSelectedCategory("negocios")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Negocios"
                    secondary={noteModalDeals.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedCategory === "tickets"}
                  onClick={() => setSelectedCategory("tickets")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Tickets"
                    secondary={noteModalTickets.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

          {/* Panel derecho - Contenido */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, fontSize: "1rem" }}
              >
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
            <Box
              sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5",
                }}
              >
                <Search
                  sx={{
                    color: theme.palette.text.secondary,
                    mr: 1,
                    fontSize: 20,
                  }}
                />
                <InputBase
                  placeholder="Buscar asociaciones actuales"
                  value={associateSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAssociateSearch(value);
                    if (value.trim().length > 0) {
                      fetchAssociations(value);
                    } else {
                      fetchAssociations();
                    }
                  }}
                  sx={{
                    flex: 1,
                    fontSize: "0.875rem",
                    "& input": {
                      py: 0.5,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
              {loadingAssociations ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {selectedCategory === "empresas" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Empresas
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalCompanies
                          .filter(
                            (company: any) =>
                              !associateSearch ||
                              company.name
                                ?.toLowerCase()
                                .includes(associateSearch.toLowerCase()) ||
                              company.domain
                                ?.toLowerCase()
                                .includes(associateSearch.toLowerCase())
                          )
                          .map((company: any) => (
                            <ListItem key={company.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.companies || [];
                                  if (current.includes(company.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      companies: current.filter(
                                        (id) => id !== company.id
                                      ),
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
                                  checked={
                                    noteSelectedAssociations.companies?.includes(
                                      company.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={
                                    company.name && company.name.length > 12
                                      ? company.name.substring(0, 12) + "..."
                                      : company.name
                                  }
                                  secondary={company.domain || "--"}
                                  sx={{
                                    overflow: "hidden",
                                    "& .MuiListItemText-primary": {
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "120px",
                                      display: "block",
                                    },
                                  }}
                                  primaryTypographyProps={{ 
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === "contactos" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Contactos
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalContacts
                          .filter(
                            (contactItem: any) =>
                            !associateSearch || 
                              `${contactItem.firstName} ${contactItem.lastName}`
                                .toLowerCase()
                                .includes(associateSearch.toLowerCase()) ||
                              contactItem.email
                                ?.toLowerCase()
                                .includes(associateSearch.toLowerCase())
                          )
                          .map((contactItem: any) => (
                            <ListItem key={contactItem.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.contacts || [];
                                  if (current.includes(contactItem.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      contacts: current.filter(
                                        (id) => id !== contactItem.id
                                      ),
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
                                  checked={
                                    noteSelectedAssociations.contacts?.includes(
                                      contactItem.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={`${contactItem.firstName} ${contactItem.lastName}`}
                                  secondary={contactItem.email}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === "negocios" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Negocios
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalDeals
                          .filter(
                            (deal: any) =>
                              !associateSearch ||
                              deal.name
                                ?.toLowerCase()
                                .includes(associateSearch.toLowerCase())
                          )
                          .map((deal: any) => (
                            <ListItem key={deal.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.deals || [];
                                  if (current.includes(deal.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: current.filter(
                                        (id) => id !== deal.id
                                      ),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: [...current, deal.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={
                                    noteSelectedAssociations.deals?.includes(
                                      deal.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={deal.name}
                                  secondary={`${
                                    deal.amount
                                      ? `S/ ${deal.amount.toLocaleString(
                                          "es-ES"
                                        )}`
                                      : ""
                                  } ${deal.stage || ""}`}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === "tickets" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Tickets
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalTickets
                          .filter(
                            (ticket: any) =>
                              !associateSearch ||
                              ticket.subject
                                ?.toLowerCase()
                                .includes(associateSearch.toLowerCase())
                          )
                          .map((ticket: any) => (
                            <ListItem key={ticket.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.tickets || [];
                                  if (current.includes(ticket.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets: current.filter(
                                        (id) => id !== ticket.id
                                      ),
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
                                  checked={
                                    noteSelectedAssociations.tickets?.includes(
                                      ticket.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={ticket.subject}
                                  secondary={ticket.description}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {selectedCategory === "seleccionados" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Seleccionados (
                        {Object.values(noteSelectedAssociations).flat().length})
                      </Typography>
                      {Object.values(noteSelectedAssociations).flat().length ===
                      0 ? (
                        <Typography
                          variant="body2"
                          sx={{ color: theme.palette.text.secondary, py: 2 }}
                        >
                          No hay elementos seleccionados
                        </Typography>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {noteSelectedAssociations.companies?.map(
                            (companyId) => {
                              const company = noteModalCompanies.find(
                                (c: any) => c.id === companyId
                              );
                            if (!company) return null;
                            return (
                              <ListItem key={companyId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                        companies:
                                          noteSelectedAssociations.companies.filter(
                                            (id) => id !== companyId
                                          ),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                    <Business
                                    sx={{
                                        fontSize: 18,
                                        mr: 1,
                                        color: theme.palette.text.secondary,
                                      }}
                                    />
                                    <ListItemText
                                      primary={
                                        company.name && company.name.length > 12
                                          ? company.name.substring(0, 12) +
                                            "..."
                                          : company.name
                                      }
                                      secondary={company.domain || "--"}
                                      sx={{
                                        overflow: "hidden",
                                        "& .MuiListItemText-primary": {
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          maxWidth: "120px",
                                          display: "block",
                                        },
                                    }}
                                    primaryTypographyProps={{ 
                                        fontSize: "0.875rem",
                                    }}
                                      secondaryTypographyProps={{
                                        fontSize: "0.75rem",
                                      }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                            }
                          )}
                          {noteSelectedAssociations.contacts?.map(
                            (contactId) => {
                              const contactItem = noteModalContacts.find(
                                (c: any) => c.id === contactId
                              );
                            if (!contactItem) return null;
                            return (
                              <ListItem key={contactId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                        contacts:
                                          noteSelectedAssociations.contacts.filter(
                                            (id) => id !== contactId
                                          ),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                    <Person
                                      sx={{
                                        fontSize: 18,
                                        mr: 1,
                                        color: theme.palette.text.secondary,
                                      }}
                                    />
                                  <ListItemText
                                    primary={`${contactItem.firstName} ${contactItem.lastName}`}
                                    secondary={contactItem.email}
                                      primaryTypographyProps={{
                                        fontSize: "0.875rem",
                                      }}
                                      secondaryTypographyProps={{
                                        fontSize: "0.75rem",
                                      }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                            }
                          )}
                          {noteSelectedAssociations.deals?.map((dealId) => {
                            const deal = noteModalDeals.find(
                              (d: any) => d.id === dealId
                            );
                            if (!deal) return null;
                            return (
                              <ListItem key={dealId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals:
                                        noteSelectedAssociations.deals.filter(
                                          (id) => id !== dealId
                                        ),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <ListItemText
                                    primary={deal.name}
                                    secondary={`${
                                      deal.amount
                                        ? `S/ ${deal.amount.toLocaleString(
                                            "es-ES"
                                          )}`
                                        : ""
                                    } ${deal.stage || ""}`}
                                    primaryTypographyProps={{
                                      fontSize: "0.875rem",
                                    }}
                                    secondaryTypographyProps={{
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {noteSelectedAssociations.tickets?.map((ticketId) => {
                            const ticket = noteModalTickets.find(
                              (t: any) => t.id === ticketId
                            );
                            if (!ticket) return null;
                            return (
                              <ListItem key={ticketId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets:
                                        noteSelectedAssociations.tickets.filter(
                                          (id) => id !== ticketId
                                        ),
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
                                    primaryTypographyProps={{
                                      fontSize: "0.875rem",
                                    }}
                                    secondaryTypographyProps={{
                                      fontSize: "0.75rem",
                                    }}
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
        <DialogActions
          sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          <Button
            onClick={() => setNoteAssociateModalOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Aplicar las selecciones a los estados principales
              setSelectedCompanies(noteSelectedAssociations.companies || []);
              setSelectedContacts(noteSelectedAssociations.contacts || []);
              // Convertir deals y tickets a la estructura esperada
              const dealIds = (noteSelectedAssociations.deals || []).map(
                (id) => 1000 + id
              );
              const ticketIds = (noteSelectedAssociations.tickets || []).map(
                (id) => 2000 + id
              );
              setSelectedAssociations([...dealIds, ...ticketIds]);
              setNoteAssociateModalOpen(false);
            }}
            variant="contained"
            sx={{ 
              textTransform: "none",
              backgroundColor: taxiMonterricoColors.green,
              "&:hover": {
                backgroundColor: taxiMonterricoColors.greenDark,
              },
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensaje de advertencia */}
      {warningMessage && (
        <Alert 
          severity="warning" 
          onClose={() => setWarningMessage("")}
          sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}
        >
          {warningMessage}
        </Alert>
      )}

      {/* Modal de conexión de correo */}
      <Dialog
        open={emailConnectModalOpen}
        onClose={() => setEmailConnectModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.mode === "dark" ? "#0B1220" : "#f5f5f5",
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            px: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Email sx={{ fontSize: 20, color: theme.palette.text.primary }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                color: theme.palette.text.primary,
              }}
            >
              Correo
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setEmailConnectModalOpen(false)}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 4, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
              fontSize: "1.5rem",
            }}
          >
            Haz seguimiento de la actividad de tu correo en el CRM
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.text.secondary,
              lineHeight: 1.7,
              fontSize: "0.9375rem",
            }}
          >
            Conecta tu cuenta de correo electrónico al CRM para comenzar a
            enviar correos desde tu plataforma. Todas tus conversaciones por
            correo electrónico aparecerán en la siguiente cronología.
          </Typography>
          <Link
            component="button"
            onClick={() => {
              setEmailConnectModalOpen(false);
              navigate("/settings");
            }}
            sx={{
              color: theme.palette.mode === "dark" ? "#64B5F6" : "#1976d2",
              textDecoration: "none",
              fontSize: "0.875rem",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Más información
          </Link>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, justifyContent: "center" }}>
          <Button
            onClick={handleEmailConnect}
            disabled={connectingEmail}
            variant="contained"
            sx={{
              bgcolor: "#FF6B35",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.9375rem",
              px: 4,
              py: 1.25,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
              "&:hover": {
                bgcolor: "#E55A2B",
                boxShadow: "0 6px 16px rgba(255, 107, 53, 0.4)",
              },
              "&.Mui-disabled": {
                bgcolor: "#FF6B35",
                opacity: 0.6,
              },
            }}
            startIcon={
              connectingEmail ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <Email />
              )
            }
          >
            {connectingEmail ? "Conectando..." : "Conectar bandeja de entrada"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Email con Gmail API */}
      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        recipientEmail={(company as any)?.email || ""}
        recipientName={company?.name || ""}
        onSend={handleSendEmail}
      />

      {/* Ventana flotante de Llamada */}
      {callOpen && (
        <>
          <Box
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              backgroundColor: theme.palette.background.paper,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              borderRadius: 4,
              zIndex: 1500,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "@keyframes fadeInScale": {
                "0%": {
                  opacity: 0,
                  transform: "translate(-50%, -50%) scale(0.9)",
                },
                "100%": {
                  opacity: 1,
                  transform: "translate(-50%, -50%) scale(1)",
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                backgroundColor: "transparent",
                color: theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: { xs: "64px", md: "72px" },
                px: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: `${taxiMonterricoColors.green}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Phone
                    sx={{ fontSize: 20, color: taxiMonterricoColors.green }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700,
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                    letterSpacing: "-0.02em",
                  }}
                >
                  Llamada
                </Typography>
              </Box>
              <IconButton 
                sx={{ 
                  color: theme.palette.text.secondary,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                    transform: "rotate(90deg)",
                  },
                }} 
                size="medium" 
                onClick={() => setCallOpen(false)}
              >
                <Close />
              </IconButton>
            </Box>

            <Box
              sx={{
              flexGrow: 1, 
                display: "flex",
                flexDirection: "column",
              p: { xs: 3, md: 4 }, 
                overflow: "hidden",
                overflowY: "auto",
              gap: 3,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "transparent",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                  borderRadius: "4px",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(0,0,0,0.3)",
                  },
                  transition: "background-color 0.2s ease",
                },
              }}
            >
              <TextField
                label="Asunto"
                value={callData.subject}
                onChange={(e) =>
                  setCallData({ ...callData, subject: e.target.value })
                }
                required
                fullWidth
                sx={{ 
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "& fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.divider,
                    },
                    "&:hover fieldset": {
                      borderColor: taxiMonterricoColors.green,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontWeight: 500,
                    "&.Mui-focused": {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Duración (minutos)"
                type="number"
                value={callData.duration}
                onChange={(e) =>
                  setCallData({ ...callData, duration: e.target.value })
                }
                fullWidth
                sx={{ 
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "& fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.divider,
                    },
                    "&:hover fieldset": {
                      borderColor: taxiMonterricoColors.green,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontWeight: 500,
                    "&.Mui-focused": {
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
                onChange={(e) =>
                  setCallData({ ...callData, description: e.target.value })
                }
                fullWidth
                sx={{ 
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "& fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.divider,
                    },
                    "&:hover fieldset": {
                      borderColor: taxiMonterricoColors.green,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontWeight: 500,
                    "&.Mui-focused": {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              backgroundColor: theme.palette.background.paper, 
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button 
                onClick={() => setCallOpen(false)} 
                variant="outlined"
                sx={{ 
                  textTransform: "none",
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    transform: "translateY(-1px)",
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
                  textTransform: "none",
                  bgcolor: saving
                    ? theme.palette.action.disabledBackground
                    : taxiMonterricoColors.green,
                  color: "white",
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: saving
                    ? "none"
                    : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: saving
                      ? theme.palette.action.disabledBackground
                      : taxiMonterricoColors.greenDark,
                    boxShadow: saving
                      ? "none"
                      : `0 6px 16px ${taxiMonterricoColors.green}50`,
                    transform: "translateY(-2px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: "none",
                  },
                }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1499,
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => setCallOpen(false)}
          />
        </>
      )}

      {/* Dialog de Tarea */}
      <Dialog
        open={taskOpen} 
        onClose={() => setTaskOpen(false)} 
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
            width: "560px",
            maxWidth: "90vw",
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: "transparent",
            color: theme.palette.text.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 48,
            px: 2,
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            {taskData.type === "meeting" ? "Reunión" : "Tarea"}
          </Typography>
          <IconButton 
            sx={{ 
              color: theme.palette.text.secondary,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: "rotate(90deg)",
              },
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
            onChange={(e) =>
              setTaskData({ ...taskData, title: e.target.value })
            }
            fullWidth
            InputLabelProps={{
              shrink: !!taskData.title,
            }}
            sx={{ 
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: 0.5,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                fontSize: "0.75rem",
                "& fieldset": {
                  borderWidth: 0,
                  border: "none",
                  top: 0,
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  borderWidth: "2px !important",
                  borderColor: `${taxiMonterricoColors.orange} !important`,
                  borderStyle: "solid !important",
                  top: 0,
                },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderWidth: "0px !important",
                "& legend": {
                  width: 0,
                  display: "none",
                },
              },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderWidth: "2px !important",
                borderColor: `${taxiMonterricoColors.green} !important`,
                  borderStyle: "solid !important",
                  "& legend": {
                  width: 0,
                    display: "none",
                },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                zIndex: 0,
                backgroundColor: "transparent",
                padding: 0,
                margin: 0,
                fontSize: "0.75rem",
                "&.Mui-focused": {
                  color: taxiMonterricoColors.orange,
                  transform: "translateY(-50%)",
                  backgroundColor: "transparent",
                },
                "&.MuiInputLabel-shrink": {
                  display: "none",
                },
              },
              "& .MuiInputBase-input": {
                position: "relative",
                zIndex: 1,
                fontSize: "0.75rem",
                py: 1,
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.75, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              >
                Prioridad
              </Typography>
              <TextField
                select
                value={taskData.priority}
                onChange={(e) =>
                  setTaskData({ ...taskData, priority: e.target.value })
                }
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
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0.5,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontSize: "0.75rem",
                    "& fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.divider,
                    },
                    "&:hover fieldset": {
                      borderColor: taxiMonterricoColors.orange,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.orange,
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.75rem",
                    py: 1,
                  },
                  "& .MuiInputLabel-root": {
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    "&.Mui-focused": {
                      color: taxiMonterricoColors.orange,
                    },
                  },
                }}
              >
                <MenuItem value="low" sx={{ fontSize: "0.75rem", py: 0.75 }}>
                  Baja
                </MenuItem>
                <MenuItem value="medium" sx={{ fontSize: "0.75rem", py: 0.75 }}>
                  Media
                </MenuItem>
                <MenuItem value="high" sx={{ fontSize: "0.75rem", py: 0.75 }}>
                  Alta
                </MenuItem>
                <MenuItem value="urgent" sx={{ fontSize: "0.75rem", py: 0.75 }}>
                  Urgente
                </MenuItem>
              </TextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 0.75, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: "0.75rem",
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
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: taxiMonterricoColors.orange,
                        },
                      }}
                    >
                      <CalendarToday sx={{ fontSize: 18 }} />
                    </IconButton>
                  ),
                }}
                sx={{ 
                  cursor: "pointer",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0.5,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontSize: "0.75rem",
                    "& fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.divider,
                    },
                    "&:hover fieldset": {
                      borderColor: taxiMonterricoColors.orange,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.orange,
                      borderWidth: "2px",
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.75rem",
                    py: 1,
                    cursor: "pointer",
                  },
                  "& .MuiInputLabel-root": {
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    "&.Mui-focused": {
                      color: taxiMonterricoColors.orange,
                    },
                  },
                }}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ position: "relative" }}>
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
                minHeight: "150px",
                maxHeight: "250px",
                overflowY: "auto",
                pt: 0,
                pb: 1.5,
                px: 1,
                borderRadius: 0.5,
                border: "none",
                outline: "none",
                fontSize: "0.75rem",
                lineHeight: 1.5,
                color: theme.palette.text.primary,
                "&:empty:before": {
                  content: '"Descripción"',
                  color: theme.palette.text.disabled,
                },
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                  borderRadius: "3px",
                },
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0.5,
                left: 4,
                right: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.5,
                backgroundColor: "transparent",
                borderRadius: 1,
                p: 0.5,
                border: "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexWrap: "nowrap",
                }}
              >
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.bold
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "#e0e0e0"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "#e0e0e0",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("bold");
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
                    backgroundColor: activeFormats.italic
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "#e0e0e0"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "#e0e0e0",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("italic");
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
                    backgroundColor: activeFormats.underline
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "#e0e0e0"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "#e0e0e0",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("underline");
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
                    backgroundColor: activeFormats.strikeThrough
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "#e0e0e0"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "#e0e0e0",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("strikeThrough");
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
                    onClick={() => {
                      document.execCommand("justifyLeft");
                      setMoreMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 0.75,
                      px: 1,
                      minWidth: "auto",
                      justifyContent: "center",
                    }}
                    title="Alinear izquierda"
                  >
                    <FormatAlignLeft sx={{ fontSize: 16 }} />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      document.execCommand("justifyCenter");
                      setMoreMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 0.75,
                      px: 1,
                      minWidth: "auto",
                      justifyContent: "center",
                    }}
                    title="Alinear centro"
                  >
                    <FormatAlignCenter sx={{ fontSize: 16 }} />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      document.execCommand("justifyRight");
                      setMoreMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 0.75,
                      px: 1,
                      minWidth: "auto",
                      justifyContent: "center",
                    }}
                    title="Alinear derecha"
                  >
                    <FormatAlignRight sx={{ fontSize: 16 }} />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      document.execCommand("justifyFull");
                      setMoreMenuAnchorEl(null);
                    }}
                    sx={{
                      py: 0.75,
                      px: 1,
                      minWidth: "auto",
                      justifyContent: "center",
                    }}
                    title="Justificar"
                  >
                    <FormatAlignJustify sx={{ fontSize: 16 }} />
                  </MenuItem>
                </Menu>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ mx: 0.5, height: "20px" }}
                />
                <IconButton
                  size="small"
                  sx={{ 
                    p: 0.25, 
                    minWidth: 28, 
                    height: 28,
                    backgroundColor: activeFormats.unorderedList
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "#e0e0e0"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "#e0e0e0",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("insertUnorderedList");
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
                    backgroundColor: activeFormats.orderedList
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "#e0e0e0"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "#e0e0e0",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("insertOrderedList");
                    updateActiveFormats();
                  }}
                  title="Lista numerada"
                >
                  <FormatListNumbered sx={{ fontSize: 16 }} />
                </IconButton>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ mx: 0.5, height: "20px" }}
                />
                <IconButton
                  size="small"
                  sx={{ p: 0.25, minWidth: 28, height: 28 }}
                  onClick={() => {
                    const url = prompt("URL:");
                    if (url) {
                      document.execCommand("createLink", false, url);
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
                    const code = prompt("Ingresa el código:");
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
                        const pre = document.createElement("pre");
                        pre.style.backgroundColor =
                          theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5";
                        pre.style.color = theme.palette.text.primary;
                        pre.style.padding = "8px";
                        pre.style.borderRadius = "4px";
                        pre.style.fontFamily = "monospace";
                        pre.style.fontSize = "0.75rem";
                        pre.textContent = code;
                        
                        range.deleteContents();
                        range.insertNode(pre);
                        range.setStartAfter(pre);
                        range.collapse(true);
                        if (selection) {
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                        setTaskData({
                          ...taskData,
                          description: descriptionEditorRef.current.innerHTML,
                        });
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
                    const rows = prompt("Número de filas:", "3");
                    const cols = prompt("Número de columnas:", "3");
                    if (rows && cols && descriptionEditorRef.current) {
                      const table = document.createElement("table");
                      table.style.borderCollapse = "collapse";
                      table.style.width = "100%";
                      table.style.border = "1px solid #ccc";
                      table.style.margin = "8px 0";
                      
                      for (let i = 0; i < parseInt(rows); i++) {
                        const tr = document.createElement("tr");
                        for (let j = 0; j < parseInt(cols); j++) {
                          const td = document.createElement("td");
                          td.style.border = "1px solid #ccc";
                          td.style.padding = "8px";
                          td.innerHTML = "&nbsp;";
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
                        setTaskData({
                          ...taskData,
                          description: descriptionEditorRef.current.innerHTML,
                        });
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
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !descriptionEditorRef.current) return;

              if (!file.type.startsWith("image/")) {
                alert("Por favor, selecciona un archivo de imagen válido.");
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
                    const img = document.createElement("img");
                    img.src = dataUrl;
                    img.style.maxWidth = "100%";
                    img.style.height = "auto";
                    img.alt = file.name;
                    
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    if (descriptionEditorRef.current) {
                      setTaskData({
                        ...taskData,
                        description: descriptionEditorRef.current.innerHTML,
                      });
                    }
                  }
                }
              };
              
              reader.onerror = () => {
                alert("Error al leer el archivo de imagen.");
              };
              
              reader.readAsDataURL(file);
              
              if (imageInputRef.current) {
                imageInputRef.current.value = "";
              }
            }}
          />
          {/* Input oculto para adjuntar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
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
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = file.name;
                    link.textContent = `📎 ${file.name}`;
                    link.style.display = "inline-block";
                    link.style.margin = "4px";
                    link.style.padding = "4px 8px";
                    link.style.backgroundColor =
                      theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5";
                    link.style.borderRadius = "4px";
                    link.style.textDecoration = "none";
                    link.style.color = theme.palette.text.primary;
                    
                    range.insertNode(link);
                    range.setStartAfter(link);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    
                    if (descriptionEditorRef.current) {
                      setTaskData({
                        ...taskData,
                        description: descriptionEditorRef.current.innerHTML,
                      });
                    }
                  }
                }
              };
              
              reader.onerror = () => {
                alert("Error al leer el archivo.");
              };
              
              reader.readAsDataURL(file);
              
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
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
              textTransform: "none",
              color: theme.palette.text.secondary,
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: "0.75rem",
              "&:hover": {
                bgcolor: theme.palette.action.hover,
              },
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
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: "0.75rem",
              bgcolor: taskData.title.trim()
                ? taxiMonterricoColors.green
                : theme.palette.action.disabledBackground,
              color: "white",
              "&:hover": {
                bgcolor: taskData.title.trim()
                  ? taxiMonterricoColors.green
                  : theme.palette.action.disabledBackground,
                opacity: 0.9,
              },
              "&:disabled": {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Popover */}
      <Popover
        open={Boolean(datePickerAnchorEl)}
        anchorEl={datePickerAnchorEl}
        onClose={() => setDatePickerAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0,0,0,0.4)"
                : "0 8px 32px rgba(0,0,0,0.12)",
            mt: 0.5,
            maxWidth: 280,
          },
        }}
      >
        <Box sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
          {/* Header con mes y año */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            mb: 3,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
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
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
              fontWeight: 600, 
                fontSize: "0.95rem",
              color: theme.palette.text.primary,
                letterSpacing: "-0.01em",
              }}
            >
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
                "&:hover": {
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.5, 
            mb: 1.5,
            }}
          >
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="caption"
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  fontSize: "0.7rem",
                  py: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendario */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.5,
            mb: 1.5,
            }}
          >
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

              const isSelected =
                selectedDate &&
                item.isCurrentMonth &&
                date.toDateString() === selectedDate.toDateString();
              const isToday =
                item.isCurrentMonth &&
                date.toDateString() === new Date().toDateString();

              return (
                <Box
                  key={`${item.isCurrentMonth ? "current" : "other"}-${
                    item.day
                  }-${index}`}
                  onClick={() => {
                    if (item.isCurrentMonth) {
                      handleDateSelect(year, month + 1, item.day);
                    }
                  }}
                  sx={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    cursor: item.isCurrentMonth ? "pointer" : "default",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    bgcolor: isSelected
                      ? taxiMonterricoColors.green
                      : isToday
                      ? `${taxiMonterricoColors.green}20`
                      : "transparent",
                    color: isSelected
                      ? "white"
                      : isToday
                      ? taxiMonterricoColors.green
                      : item.isCurrentMonth
                      ? theme.palette.text.primary
                      : theme.palette.text.disabled,
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    fontSize: "0.75rem",
                    position: "relative",
                    minHeight: "28px",
                    minWidth: "28px",
                    "&:hover": {
                      bgcolor: item.isCurrentMonth
                        ? isSelected
                            ? taxiMonterricoColors.green
                          : `${taxiMonterricoColors.green}15`
                        : "transparent",
                      transform:
                        item.isCurrentMonth && !isSelected
                          ? "scale(1.05)"
                          : "none",
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
            mt: 1.5, 
            pt: 1.5, 
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
            }}
          >
            <Button
              onClick={handleClearDate}
              sx={{
                textTransform: "none",
                color: theme.palette.text.secondary,
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                "&:hover": {
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
                textTransform: "none",
                color: taxiMonterricoColors.green,
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                "&:hover": {
                  bgcolor: `${taxiMonterricoColors.green}15`,
                },
              }}
            >
              Hoy
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Ventana flotante de Reunión */}
      {meetingOpen && (
        <>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "500px",
              maxWidth: "90vw",
              height: "100vh",
              backgroundColor: "white",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideInRight 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.orange} 0%, ${taxiMonterricoColors.orangeDark} 100%)`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: { xs: "48px", md: "56px" },
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                px: { xs: 2, md: 2.5 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Event sx={{ fontSize: { xs: 18, md: 22 } }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: { xs: "1rem", md: "1.1rem" },
                  }}
                >
                  Reunión
                </Typography>
              </Box>
              <IconButton 
                sx={{ 
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
                }} 
                size="small" 
                onClick={() => setMeetingOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                p: { xs: 2, md: 3 },
                overflow: "hidden",
                overflowY: "auto",
                bgcolor: "#fafafa",
              }}
            >
              <TextField
                label="Asunto"
                value={meetingData.subject}
                onChange={(e) =>
                  setMeetingData({ ...meetingData, subject: e.target.value })
                }
                required
                fullWidth
                sx={{ 
                  mb: 2.5,
                  bgcolor: "white",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.orange,
                    },
                  },
                }}
              />
              <TextField
                label="Descripción"
                multiline
                rows={5}
                value={meetingData.description}
                onChange={(e) =>
                  setMeetingData({
                    ...meetingData,
                    description: e.target.value,
                  })
                }
                fullWidth
                sx={{ 
                  mb: 2.5,
                  bgcolor: "white",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": {
                      borderColor: taxiMonterricoColors.orange,
                    },
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={meetingData.date}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, date: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    bgcolor: "white",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "&.Mui-focused fieldset": {
                        borderColor: taxiMonterricoColors.orange,
                      },
                    },
                  }}
                />
                <TextField
                  label="Hora"
                  type="time"
                  value={meetingData.time}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, time: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    bgcolor: "white",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "&.Mui-focused fieldset": {
                        borderColor: taxiMonterricoColors.orange,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                p: 2.5,
                borderTop: "1px solid #e0e0e0",
                backgroundColor: "white",
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
              }}
            >
              <Button 
                onClick={() => setMeetingOpen(false)} 
                sx={{ 
                  textTransform: "none",
                  color: "#757575",
                  fontWeight: 500,
                  px: 2.5,
                  "&:hover": {
                    bgcolor: "#f5f5f5",
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
                  textTransform: "none",
                  bgcolor: saving ? "#bdbdbd" : taxiMonterricoColors.orange,
                  fontWeight: 500,
                  px: 3,
                  boxShadow: saving
                    ? "none"
                    : `0 2px 8px ${taxiMonterricoColors.orange}30`,
                  "&:hover": {
                    bgcolor: saving
                      ? "#bdbdbd"
                      : taxiMonterricoColors.orangeDark,
                    boxShadow: saving
                      ? "none"
                      : `0 4px 12px ${taxiMonterricoColors.orange}40`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#bdbdbd",
                    color: "white",
                  },
                }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              zIndex: 1299,
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => setMeetingOpen(false)}
          />
        </>
      )}

      {/* Diálogo para agregar contacto */}
      <Dialog 
        open={addContactOpen} 
        onClose={() => { 
          setAddContactOpen(false); 
          setContactDialogTab("create");
          setSelectedExistingContacts([]); 
          setExistingContactsSearch("");
          setContactFormData({ 
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            jobTitle: "",
            lifecycleStage: "lead",
            dni: "",
            cee: "",
            address: "",
            city: "",
            state: "",
            country: "",
          });
          setIdType("dni");
          setDniError("");
          setCeeError("");
        }} 
        maxWidth="md" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {contactDialogTab === "create"
            ? "Crear nuevo contacto"
            : "Agregar Contacto existente"}
          <IconButton
            onClick={() => {
            setAddContactOpen(false); 
              setContactDialogTab("create");
            setSelectedExistingContacts([]); 
              setExistingContactsSearch("");
            setContactFormData({ 
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                jobTitle: "",
                lifecycleStage: "lead",
                dni: "",
                cee: "",
                address: "",
                city: "",
                state: "",
                country: "",
              });
              setIdType("dni");
              setDniError("");
              setCeeError("");
            }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={contactDialogTab === "create" ? 0 : 1}
              onChange={(e, newValue) =>
                setContactDialogTab(newValue === 0 ? "create" : "existing")
              }
            >
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {contactDialogTab === "create" && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
            >
              {/* Selección de tipo de identificación y campo de entrada */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <RadioGroup
                    row
                    value={idType}
                    onChange={(e) => {
                      const newType = e.target.value as "dni" | "cee";
                      setIdType(newType);
                      if (newType === "dni") {
                        setContactFormData({
                          ...contactFormData,
                          cee: "",
                          dni: "",
                        });
                        setCeeError("");
                      } else {
                        setContactFormData({
                          ...contactFormData,
                          dni: "",
                          cee: "",
                        });
                        setDniError("");
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
                            "&.Mui-checked": {
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
                        height: "48px",
                        border: `2px solid ${
                          idType === "dni"
                            ? taxiMonterricoColors.orange
                            : theme.palette.divider
                        }`,
                        borderRadius: 2,
                        bgcolor:
                          idType === "dni"
                            ? theme.palette.mode === "dark"
                              ? `${taxiMonterricoColors.orange}20`
                              : `${taxiMonterricoColors.orange}10`
                            : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        "&:hover": {
                          borderColor: taxiMonterricoColors.orange,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? `${taxiMonterricoColors.orange}15`
                              : `${taxiMonterricoColors.orange}08`,
                        },
                        "& .MuiFormControlLabel-label": {
                          color: theme.palette.text.primary,
                          fontWeight: idType === "dni" ? 500 : 400,
                        },
                      }}
                    />
                    <FormControlLabel
                      value="cee"
                      control={
                        <Radio 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            "&.Mui-checked": {
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
                        height: "48px",
                        border: `2px solid ${
                          idType === "cee"
                            ? taxiMonterricoColors.orange
                            : theme.palette.divider
                        }`,
                        borderRadius: 2,
                        bgcolor:
                          idType === "cee"
                            ? theme.palette.mode === "dark"
                              ? `${taxiMonterricoColors.orange}20`
                              : `${taxiMonterricoColors.orange}10`
                            : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        "&:hover": {
                          borderColor: taxiMonterricoColors.orange,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? `${taxiMonterricoColors.orange}15`
                              : `${taxiMonterricoColors.orange}08`,
                        },
                        "& .MuiFormControlLabel-label": {
                          color: theme.palette.text.primary,
                          fontWeight: idType === "cee" ? 500 : 400,
                        },
                      }}
                    />
                  </RadioGroup>

                  {/* Campo de entrada según el tipo seleccionado */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {idType === "dni" ? (
                      <TextField
                        label="DNI"
                        value={contactFormData.dni}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const limitedValue = value.slice(0, 8);
                          setContactFormData({
                            ...contactFormData,
                            dni: limitedValue,
                            cee: "",
                          });
                          setDniError("");
                          setCeeError("");
                        }}
                        onKeyPress={(e) => {
                          if (
                            e.key === "Enter" &&
                            contactFormData.dni &&
                            contactFormData.dni.length === 8 &&
                            !loadingDni
                          ) {
                            handleSearchDni();
                          }
                        }}
                        error={!!dniError}
                        helperText={dniError}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ maxLength: 8 }}
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            minHeight: "48px",
                            height: "48px",
                          },
                          "& .MuiInputBase-input": {
                            py: 1.5,
                            height: "48px",
                            display: "flex",
                            alignItems: "center",
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={handleSearchDni}
                              disabled={
                                loadingDni ||
                                !contactFormData.dni ||
                                contactFormData.dni.length < 8
                              }
                              size="small"
                              sx={{
                                color: taxiMonterricoColors.orange,
                                "&:hover": {
                                  bgcolor: `${taxiMonterricoColors.orange}15`,
                                },
                                "&.Mui-disabled": {
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
                        value={contactFormData.cee}
                        onChange={(e) => {
                          // Convertir a mayúsculas respetando caracteres especiales del español
                          const value =
                            e.target.value.toLocaleUpperCase("es-ES");
                          const limitedValue = value.slice(0, 12);
                          setContactFormData({
                            ...contactFormData,
                            cee: limitedValue,
                            dni: "",
                          });
                          setCeeError("");
                          setDniError("");
                        }}
                        onKeyPress={(e) => {
                          if (
                            e.key === "Enter" &&
                            contactFormData.cee &&
                            contactFormData.cee.length === 12 &&
                            !loadingCee
                          ) {
                            handleSearchCee();
                          }
                        }}
                        error={!!ceeError}
                        helperText={ceeError}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ maxLength: 12 }}
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            minHeight: "48px",
                            height: "48px",
                          },
                          "& .MuiInputBase-input": {
                            py: 1.5,
                            height: "48px",
                            display: "flex",
                            alignItems: "center",
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={handleSearchCee}
                              disabled={
                                loadingCee ||
                                !contactFormData.cee ||
                                contactFormData.cee.length < 12
                              }
                              size="small"
                              sx={{
                                color: taxiMonterricoColors.orange,
                                "&:hover": {
                                  bgcolor: `${taxiMonterricoColors.orange}15`,
                                },
                                "&.Mui-disabled": {
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
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Nombre"
                  value={contactFormData.firstName}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      firstName: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  label="Apellido"
                  value={contactFormData.lastName}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      lastName: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
              
              {/* Email y Teléfono en su propia fila */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={contactFormData.email}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      email: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  label="Teléfono"
                  value={contactFormData.phone}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      phone: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
              
              {/* Dirección en su propia fila */}
              <TextField
                label="Dirección"
                value={contactFormData.address}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    address: e.target.value,
                  })
                }
                multiline
                rows={2}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              
              {/* Distrito, Provincia y Departamento en su propia fila */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Distrito"
                  value={contactFormData.city}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      city: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  label="Provincia"
                  value={contactFormData.state}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      state: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  label="Departamento"
                  value={contactFormData.country}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      country: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
              
              {/* Cargo y Etapa del Ciclo de Vida en su propia fila */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Cargo"
                  value={contactFormData.jobTitle}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      jobTitle: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  select
                  label="Etapa del Ciclo de Vida"
                  value={contactFormData.lifecycleStage}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      lifecycleStage: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                >
                <MenuItem value="lead_inactivo">Lead Inactivo</MenuItem>
                <MenuItem value="cliente_perdido">Cliente perdido</MenuItem>
                <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="contacto">Contacto</MenuItem>
                <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
                <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
                  <MenuItem value="propuesta_economica">
                    Propuesta Económica
                  </MenuItem>
                <MenuItem value="negociacion">Negociación</MenuItem>
                <MenuItem value="licitacion">Licitación</MenuItem>
                  <MenuItem value="licitacion_etapa_final">
                    Licitación Etapa Final
                  </MenuItem>
                <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
                <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
                <MenuItem value="activo">Activo</MenuItem>
                </TextField>
              </Box>
            </Box>
          )}

          {contactDialogTab === "existing" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                      <Search sx={{ color: "#00bcd4" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Contador y ordenamiento */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: "#666" }}>
                  {(() => {
                    const associatedContactIds = (associatedContacts || [])
                      .map((c: any) => c && c.id)
                      .filter((id: any) => id !== undefined && id !== null);
                    const filtered = allContacts.filter((contact: any) => {
                      if (associatedContactIds.includes(contact.id))
                        return false;
                      if (!existingContactsSearch) return true;
                      const searchLower = existingContactsSearch.toLowerCase();
                      return (
                        (contact.firstName &&
                          contact.firstName
                            .toLowerCase()
                            .includes(searchLower)) ||
                        (contact.lastName &&
                          contact.lastName
                            .toLowerCase()
                            .includes(searchLower)) ||
                        (contact.email &&
                          contact.email.toLowerCase().includes(searchLower))
                      );
                    });
                    return `${filtered.length} Contactos`;
                  })()}
                </Typography>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Predeterminado (Agregado recientemente)
                </Typography>
              </Box>

              {/* Lista de contactos */}
              <Box
                sx={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                {(() => {
                  const associatedContactIds = (associatedContacts || [])
                    .map((c: any) => c && c.id)
                    .filter((id: any) => id !== undefined && id !== null);
                  const filteredContacts = allContacts.filter(
                    (contact: any) => {
                      if (associatedContactIds.includes(contact.id))
                        return false;
                    if (!existingContactsSearch) return true;
                    const searchLower = existingContactsSearch.toLowerCase();
                    return (
                        (contact.firstName &&
                          contact.firstName
                            .toLowerCase()
                            .includes(searchLower)) ||
                        (contact.lastName &&
                          contact.lastName
                            .toLowerCase()
                            .includes(searchLower)) ||
                        (contact.email &&
                          contact.email.toLowerCase().includes(searchLower))
                      );
                    }
                  );

                  if (filteredContacts.length === 0) {
                    return (
                      <Box sx={{ p: 2, textAlign: "center" }}>
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
                        display: "flex",
                        alignItems: "center",
                        p: 1.5,
                        borderBottom: "1px solid #f0f0f0",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Checkbox
                        checked={selectedExistingContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExistingContacts([
                              ...selectedExistingContacts,
                              contact.id,
                            ]);
                          } else {
                            setSelectedExistingContacts(
                              selectedExistingContacts.filter(
                                (id) => id !== contact.id
                              )
                            );
                          }
                        }}
                        sx={{
                          color: "#00bcd4",
                          "&.Mui-checked": {
                            color: "#00bcd4",
                          },
                        }}
                      />
                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {contact.firstName} {contact.lastName}
                        </Typography>
                        {contact.email && (
                          <Typography variant="caption" sx={{ color: "#666" }}>
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
          <Button
            onClick={() => {
            setAddContactOpen(false); 
              setContactDialogTab("create");
            setSelectedExistingContacts([]); 
              setExistingContactsSearch("");
            setContactFormData({ 
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                jobTitle: "",
                lifecycleStage: "lead",
                dni: "",
                cee: "",
                address: "",
                city: "",
                state: "",
                country: "",
              });
              setIdType("dni");
              setDniError("");
              setCeeError("");
            }}
          >
            Cancelar
          </Button>
          {contactDialogTab === "create" ? (
            <Button
              onClick={handleAddContact}
              variant="contained"
              disabled={
                !contactFormData.firstName.trim() ||
                !contactFormData.lastName.trim() ||
                !contactFormData.email.trim()
              }
            >
              Agregar
            </Button>
          ) : (
            <Button
              onClick={handleAddExistingContacts}
              variant="contained"
              disabled={selectedExistingContacts.length === 0}
            >
              Agregar ({selectedExistingContacts.length})
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
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle>Nuevo Negocio</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={dealFormData.name}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, name: e.target.value })
              }
              required
            />
            <TextField
              label="Monto"
              type="number"
              value={dealFormData.amount}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, amount: e.target.value })
              }
              required
            />
            <TextField
              select
              label="Etapa"
              value={dealFormData.stage}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, stage: e.target.value })
              }
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
              onChange={(e) =>
                setDealFormData({ ...dealFormData, closeDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Prioridad"
              value={dealFormData.priority}
              onChange={(e) =>
                setDealFormData({
                  ...dealFormData,
                  priority: e.target.value as "baja" | "media" | "alta",
                })
              }
            >
              <MenuItem value="baja">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#20B2AA",
                    }}
                  />
                  Baja
                </Box>
              </MenuItem>
              <MenuItem value="media">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#F59E0B",
                    }}
                  />
                  Media
                </Box>
              </MenuItem>
              <MenuItem value="alta">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#EF4444",
                    }}
                  />
                  Alta
                </Box>
              </MenuItem>
            </TextField>
            <TextField
              select
              label="Empresa"
              value={dealFormData.companyId || company?.id?.toString() || ""}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, companyId: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="">
                <em>Ninguna</em>
              </MenuItem>
              {allCompanies.map((comp) => (
                <MenuItem key={comp.id} value={comp.id.toString()}>
                  {comp.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Contacto"
              value={dealFormData.contactId}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, contactId: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
              {allContacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id.toString()}>
                  {contact.firstName} {contact.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDealOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddDeal} variant="contained">
            Crear
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
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle>Crear Ticket</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Asunto"
              value={ticketFormData.subject}
              onChange={(e) =>
                setTicketFormData({
                  ...ticketFormData,
                  subject: e.target.value,
                })
              }
              required
              fullWidth
            />
            <TextField
              label="Descripción"
              value={ticketFormData.description}
              onChange={(e) =>
                setTicketFormData({
                  ...ticketFormData,
                  description: e.target.value,
                })
              }
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={ticketFormData.status}
              onChange={(e) =>
                setTicketFormData({ ...ticketFormData, status: e.target.value })
              }
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
              onChange={(e) =>
                setTicketFormData({
                  ...ticketFormData,
                  priority: e.target.value,
                })
              }
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
          <Button
            onClick={handleAddTicket}
            variant="contained"
            disabled={!ticketFormData.subject.trim()}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edición de Empresa */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle>Editar Empresa</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              required
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              label="RUC"
              value={editFormData.ruc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                const limitedValue = value.slice(0, 11);
                setEditFormData({ ...editFormData, ruc: limitedValue });
              }}
              inputProps={{ maxLength: 11 }}
              InputLabelProps={{ shrink: true }}
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Dominio"
                value={editFormData.domain}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, domain: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="LinkedIn"
                value={editFormData.linkedin}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, linkedin: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                placeholder="https://www.linkedin.com/company/..."
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Teléfono"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Teléfono 2"
                value={editFormData.phone2}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone2: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Teléfono 3"
                value={editFormData.phone3}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone3: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>
            <TextField
              label="Correo"
              type="email"
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData({ ...editFormData, email: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              select
              label="Origen de lead"
              value={editFormData.leadSource}
              onChange={(e) =>
                setEditFormData({ ...editFormData, leadSource: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            >
              <MenuItem value="">--</MenuItem>
              <MenuItem value="referido">Referido</MenuItem>
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="entorno">Entorno</MenuItem>
              <MenuItem value="feria">Feria</MenuItem>
              <MenuItem value="masivo">Masivo</MenuItem>
            </TextField>
            <TextField
              label="Potencial de Facturación Estimado"
              type="number"
              value={editFormData.estimatedRevenue}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  estimatedRevenue: e.target.value,
                })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">S/</InputAdornment>
                ),
              }}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editFormData.isRecoveredClient}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      isRecoveredClient: e.target.checked,
                    })
                  }
                />
              }
              label="Cliente Recuperado"
            />
            <TextField
              label="Razón social"
              value={editFormData.companyname}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  companyname: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              label="Dirección"
              value={editFormData.address}
              onChange={(e) =>
                setEditFormData({ ...editFormData, address: e.target.value })
              }
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Distrito"
                value={editFormData.city}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, city: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Provincia"
                value={editFormData.state}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, state: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Departamento"
                value={editFormData.country}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, country: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>
            <FormControl fullWidth>
              <TextField
                select
                label="Etapa del Ciclo de Vida"
                value={editFormData.lifecycleStage}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    lifecycleStage: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              >
                <MenuItem value="lead_inactivo">Lead Inactivo</MenuItem>
                <MenuItem value="cliente_perdido">Cliente perdido</MenuItem>
                <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="contacto">Contacto</MenuItem>
                <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
                <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
                <MenuItem value="propuesta_economica">
                  Propuesta Económica
                </MenuItem>
                <MenuItem value="negociacion">Negociación</MenuItem>
                <MenuItem value="licitacion">Licitación</MenuItem>
                <MenuItem value="licitacion_etapa_final">
                  Licitación Etapa Final
                </MenuItem>
                <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
                <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
                <MenuItem value="activo">Activo</MenuItem>
              </TextField>
            </FormControl>
          </Box>
          {errorMessage && (
            <Alert
              severity="error"
              onClose={() => setErrorMessage("")}
              sx={{ mx: 2, mb: 2 }}
            >
              {errorMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveCompany} 
            variant="contained"
            disabled={saving || !editFormData.name.trim()}
            sx={{
              bgcolor: taxiMonterricoColors.green,
              "&:hover": {
                bgcolor: taxiMonterricoColors.greenDark,
              },
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles de actividad expandida */}
      <ActivityDetailDialog
        activity={expandedActivity}
        open={!!expandedActivity}
        onClose={() => setExpandedActivity(null)}
        getActivityTypeLabel={getActivityTypeLabel}
      />

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
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            {contactToRemove?.name} ya no se asociará con {company?.name}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setRemoveContactDialogOpen(false);
              setContactToRemove(null);
            }}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              "&:hover": {
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.action.hover,
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemoveContact}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#FF9800",
              color: "white",
              "&:hover": {
                bgcolor: "#F57C00",
              },
            }}
          >
            Eliminar asociación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación de negocio */}
      <Dialog
        open={removeDealDialogOpen}
        onClose={() => {
          setRemoveDealDialogOpen(false);
          setDealToRemove(null);
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
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            {dealToRemove?.name} ya no se asociará con {company?.name}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setRemoveDealDialogOpen(false);
              setDealToRemove(null);
            }}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              "&:hover": {
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.action.hover,
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemoveDeal}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#FF9800",
              color: "white",
              "&:hover": {
                bgcolor: "#F57C00",
              },
            }}
          >
            Eliminar asociación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación de ticket */}
      <Dialog
        open={removeTicketDialogOpen}
        onClose={() => {
          setRemoveTicketDialogOpen(false);
          setTicketToRemove(null);
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
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            {ticketToRemove?.name} ya no se asociará con {company?.name}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setRemoveTicketDialogOpen(false);
              setTicketToRemove(null);
            }}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              "&:hover": {
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.action.hover,
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemoveTicket}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#FF9800",
              color: "white",
              "&:hover": {
                bgcolor: "#F57C00",
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

export default CompanyDetail;
