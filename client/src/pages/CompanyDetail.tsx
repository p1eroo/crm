import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Tabs,
  Tab,
  IconButton,
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
  useTheme,
  Drawer,
  FormControl,
} from "@mui/material";
import {
  Email,
  Close,
  KeyboardArrowLeft,
  Search,
} from "@mui/icons-material";
import { faCalendar, faClock } from "@fortawesome/free-regular-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import api from "../config/api";
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
  GeneralDescriptionTab,
} from "../components/DetailCards";
import { NoteModal, CallModal, TaskModal } from "../components/ActivityModals";
import type { GeneralInfoCard } from "../components/DetailCards";
import DetailPageLayout from "../components/Layout/DetailPageLayout";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Building2 } from "lucide-react";
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

// Agregar los iconos a la librería para usar byPrefixAndName
library.add(far);
library.add(fas);

interface CompanyDetailData {
  id: number;
  name: string;
  domain?: string;
  companyname?: string;
  phone?: string;
  email?: string;
  ruc?: string;
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
  const [company, setCompany] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [ticketFormData, setTicketFormData] = useState({
    subject: "",
    description: "",
    status: "new",
    priority: "medium",
  });
  
  // Estados para edición de campos del contacto
  
  // Estados para diálogos de acciones
  const [noteOpen, setNoteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskType, setTaskType] = useState<"todo" | "meeting">("todo");
  const [meetingOpen, setMeetingOpen] = useState(false);
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
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailConnectModalOpen, setEmailConnectModalOpen] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);

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

  // Función helper para deduplicar notas con el mismo contenido y timestamp similar
  const deduplicateNotes = useCallback((activities: any[]) => {
    const noteGroups = new Map<string, any[]>();
    const otherActivities: any[] = [];

    activities.forEach((activity) => {
      // Solo deduplicar notas (type === 'note') que tengan companyId
      if (activity.type === 'note' && activity.companyId) {
        // Crear una clave única basada en contenido y timestamp
        const timestamp = new Date(activity.createdAt || 0).getTime();
        const timeWindow = Math.floor(timestamp / 5000) * 5000; // Agrupar por ventanas de 5 segundos
        const key = `${activity.description || ''}|${activity.subject || ''}|${activity.userId || ''}|${activity.companyId}|${timeWindow}`;
        
        if (!noteGroups.has(key)) {
          noteGroups.set(key, []);
        }
        noteGroups.get(key)!.push(activity);
      } else {
        // Mantener otras actividades sin deduplicar
        otherActivities.push(activity);
      }
    });

    // Crear array deduplicado: una nota representativa por grupo
    const deduplicatedNotes: any[] = [];
    noteGroups.forEach((group) => {
      if (group.length > 0) {
        // Usar la primera nota como representativa
        const representative = { ...group[0] };
        // Agregar información sobre el grupo si hay múltiples notas
        if (group.length > 1) {
          representative._deduplicatedCount = group.length;
          representative._deduplicatedGroup = group.map((n: any) => n.id);
        }
        deduplicatedNotes.push(representative);
      }
    });

    // Combinar notas deduplicadas con otras actividades y ordenar
    return [...deduplicatedNotes, ...otherActivities].sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
      return dateB - dateA;
    });
  }, []);

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

      // Aplicar deduplicación
      const deduplicatedActivities = deduplicateNotes(allActivities);

      // Merge inteligente: preservar actividades existentes y agregar nuevas del servidor
      setActivities((prevActivities) => {
        // Crear un mapa de IDs existentes para referencia rápida
        const existingIds = new Set(prevActivities.map((a: any) => a.id));
        
        // Agregar actividades nuevas que no estén en el estado actual
        const newActivities = deduplicatedActivities.filter((a: any) => !existingIds.has(a.id));
        
        // Combinar: mantener las actividades existentes + agregar las nuevas del servidor
        const merged = [...prevActivities, ...newActivities].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
          const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
          return dateB - dateA;
        });
        
        // Aplicar deduplicación al resultado final también
        return deduplicateNotes(merged);
      });

      // Inicializar el estado de actividades completadas desde el backend
      const initialCompleted: { [key: number]: boolean } = {};
      allActivities.forEach((activity: any) => {
        if (activity.completed) {
          initialCompleted[activity.id] = true;
        }
      });
      setCompletedActivities(initialCompleted);

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
  }, [id, deduplicateNotes]);

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
    setNoteOpen(true);
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
      const response = await api.post("/activities/emails", {
        subject: emailData.subject,
        description: emailData.body.replace(/<[^>]*>/g, ""), // Remover HTML para la descripción
        companyId: id,
      });
      const newActivity = response.data;

      // Actualización optimista: agregar actividad inmediatamente al estado
      setActivities((prevActivities) => {
        // Verificar que no esté ya en la lista (evitar duplicados)
        const exists = prevActivities.some((a: any) => a.id === newActivity.id);
        if (exists) return prevActivities;
        
        // Agregar al inicio de la lista y ordenar por fecha (más reciente primero)
        const updated = [newActivity, ...prevActivities].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        // Aplicar deduplicación al resultado final
        return deduplicateNotes(updated);
      });

      // Actualizar actividades desde el servidor en segundo plano para consistencia eventual
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
    setCallOpen(true);
  };

  // Callback para cuando se guarda una nota desde NoteModal
  const handleNoteSave = useCallback((newActivity: any) => {
    // Agregar la actividad inmediatamente al estado para que aparezca de inmediato
    setActivities((prevActivities) => {
      // Verificar que no esté ya en la lista (evitar duplicados)
      const exists = prevActivities.some((a: any) => a.id === newActivity.id);
      if (exists) return prevActivities;
      
      // Agregar al inicio de la lista y ordenar por fecha (más reciente primero)
      const updated = [newActivity, ...prevActivities].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      // Aplicar deduplicación al resultado final
      return deduplicateNotes(updated);
    });
    
    // Actualizar registros asociados después de crear la nota
    fetchAssociatedRecords();
  }, [deduplicateNotes, fetchAssociatedRecords]);

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
        setTaskType("todo");
        setTaskOpen(true);
        break;
      case "meeting":
        setTaskType("meeting");
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

  // Preparar campos de detalles
const detailFields = [
  {
    label: 'RUC',
    value: company?.ruc || '--',
    show: !!company?.ruc,
  },
  {
    label: 'Email',
    value: company?.email || '--',
    show: !!company?.email,
  },
  {
    label: 'Teléfono',
    value: company?.phone || '--',
    show: !!company?.phone,
  },
  {
    label: 'Dirección',
    value: company?.address || company?.city || '--',
    show: !!(company?.address || company?.city),
  },
  {
    label: 'País',
    value: company?.country || '--',
    show: !!company?.country,
  },
  {
    label: 'Etapa',
    value: (
      <Chip
        label={getStageLabel(company?.lifecycleStage || '')}
        size="small"
        sx={{
          height: 24,
          fontSize: '0.75rem',
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(46, 125, 50, 0.2)'
              : 'rgba(46, 125, 50, 0.1)',
          color: taxiMonterricoColors.green,
          fontWeight: 500,
        }}
      />
    ),
    show: !!company?.lifecycleStage,
  },
  {
    label: 'Propietario',
    value: company?.Owner
      ? `${company.Owner.firstName || ''} ${company.Owner.lastName || ''}`.trim() || company.Owner.email || 'Sin nombre'
      : '--',
    show: !!company?.Owner,
  },
];

// Preparar botones de actividades
const activityButtons = [
  {
    icon: ['fas', 'note-sticky'],
    tooltip: 'Crear nota',
    onClick: () => handleCreateActivity('note'),
  },
  {
    icon: faEnvelope,
    tooltip: 'Enviar correo',
    onClick: () => setEmailOpen(true),
  },
  {
    icon: ['fas', 'phone'],
    tooltip: 'Llamada',
    onClick: () => handleCreateActivity('call'),
  },
  {
    icon: ['fas', 'thumbtack'],
    tooltip: 'Crear tarea',
    onClick: () => handleCreateActivity('task'),
  },
  {
    icon: ['fas', 'calendar-week'],
    tooltip: 'Programar reunión',
    onClick: () => handleCreateActivity('meeting'),
  },
];

// Preparar cards de información general
const generalInfoCards: GeneralInfoCard[] = [
  {
    label: 'Fecha de creación',
    value: company?.createdAt
      ? `${new Date(company.createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} ${new Date(company.createdAt).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "No disponible",
    icon: faCalendar,
    iconBgColor: "#0d939429",
    iconColor: "#0d9394",
  },
  {
    label: 'Etapa del ciclo de vida',
    value: company?.lifecycleStage
      ? getStageLabel(company.lifecycleStage)
      : "No disponible",
    icon: ['fas', 'arrows-rotate'],
    iconBgColor: "#e4f6d6",
    iconColor: "#56ca00",
    showArrow: true,
  },
  {
    label: 'Última actividad',
    value: activities.length > 0 && activities[0].createdAt
      ? new Date(activities[0].createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "No hay actividades",
    icon: faClock,
    iconBgColor: "#fff3d6",
    iconColor: "#ffb400",
  },
  {
    label: 'Propietario del registro',
    value: company?.Owner
      ? company.Owner.firstName || company.Owner.lastName
        ? `${company.Owner.firstName || ""} ${
            company.Owner.lastName || ""
          }`.trim()
        : company.Owner.email || "Sin nombre"
      : "No asignado",
    icon: ['far', 'user'],
    iconBgColor: "#daf2ff",
    iconColor: "#16b1ff",
  },
];

// Preparar contenido del Tab 0 (Descripción General)
const tab0Content = (
  <GeneralDescriptionTab
    generalInfoCards={generalInfoCards}
    linkedCards={[
      { component: <RecentActivitiesCard activities={activities} /> },
      { component: <LinkedContactsCard contacts={associatedContacts || []} /> },
      { component: <LinkedDealsCard deals={associatedDeals || []} /> },
      { component: <LinkedTicketsCard tickets={associatedTickets || []} /> },
    ]}
    linkedCardsGridColumns={{ xs: '1fr' }}
  />
);

// Preparar contenido del Tab 1 (Información Avanzada)
const tab1Content = (
  <Box>
    <FullActivitiesTableCard
      activities={activities}
      searchValue={activitySearch}
      onSearchChange={setActivitySearch}
      onCreateActivity={(type) => handleCreateActivity(type as string)}
      onActivityClick={setExpandedActivity}
      onToggleComplete={async (activityId, completed) => {
        try {
          setCompletedActivities((prev) => ({
            ...prev,
            [activityId]: completed,
          }));
          await api.put(`/activities/${activityId}`, {
            completed: completed,
          });
          if (completed) {
            const activity = activities.find((a: any) => a.id === activityId);
            const activityName = activity?.subject || activity?.title || 'la actividad';
            setSuccessMessage(`Se completó ${activityName}`);
            setTimeout(() => setSuccessMessage(""), 3000);
            const notificationEvent = new CustomEvent('activityCompleted', {
              detail: {
                type: 'activity',
                title: `Se completó ${activityName}`,
                activityId: activityId,
                activityName: activityName,
                timestamp: new Date().toISOString(),
              },
            });
            window.dispatchEvent(notificationEvent);
          }
        } catch (error) {
          console.error('Error al actualizar el estado de la actividad:', error);
          setCompletedActivities((prev) => ({
            ...prev,
            [activityId]: !completed,
          }));
        }
      }}
      completedActivities={completedActivities}
      getActivityTypeLabel={getActivityTypeLabel}
    />

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
);

// Preparar contenido del Tab 2 (Actividades)
const tab2Content = (
  <ActivitiesTabContent
    activities={activities}
    activitySearch={activitySearch}
    onSearchChange={setActivitySearch}
    onCreateActivity={(type) => handleCreateActivity(type as string)}
    onActivityClick={setExpandedActivity}
    onToggleComplete={async (activityId, completed) => {
      try {
        setCompletedActivities((prev) => ({
          ...prev,
          [activityId]: completed,
        }));
        await api.put(`/activities/${activityId}`, {
          completed: completed,
        });
        if (completed) {
          const activity = activities.find((a: any) => a.id === activityId);
          const activityName = activity?.subject || activity?.title || 'la actividad';
          setSuccessMessage(`Se completó ${activityName}`);
          setTimeout(() => setSuccessMessage(""), 3000);
          const notificationEvent = new CustomEvent('activityCompleted', {
            detail: {
              type: 'activity',
              title: `Se completó ${activityName}`,
              activityId: activityId,
              activityName: activityName,
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(notificationEvent);
        }
      } catch (error) {
        console.error('Error al actualizar el estado de la actividad:', error);
        setCompletedActivities((prev) => ({
          ...prev,
          [activityId]: !completed,
        }));
      }
    }}
    completedActivities={completedActivities}
    getActivityTypeLabel={getActivityTypeLabel}
    getActivityStatusColor={getActivityStatusColor}
    emptyMessage="No hay actividades registradas para esta empresa. Crea una nueva actividad para comenzar."
  />
);

  return (  
  <>
    <DetailPageLayout
      pageTitle="Información de la empresa"
      breadcrumbItems={[
        { label: 'Empresas', path: '/companies' },
        { label: company?.name || '' },
      ]}
      onBack={() => navigate('/companies')}
      avatarIcon={<Building2 size={60} color="white" />}
      avatarBgColor="#0d9394"
      entityName={company?.name || ''}
      entitySubtitle={company?.domain || 'Sin información adicional'}
      activityButtons={activityButtons}
      detailFields={detailFields}
      onEditDetails={handleOpenEditDialog}
      activityLogs={activityLogs}
      loadingLogs={loadingLogs}
      tab0Content={tab0Content}
      tab1Content={tab1Content}
      tab2Content={tab2Content}
      loading={loading}
      editDialog={
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
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
      }
    />

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

    {/* MANTENER TODOS LOS MODALES Y DIALOGS DESDE AQUÍ */}

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

      {/* Modal de crear nota */}
      <NoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        entityType="company"
        entityId={id || ""}
        entityName={company?.name || "Sin nombre"}
        user={user}
        onSave={handleNoteSave}
        relatedEntities={{
          companies: company ? [company] : [],
          contacts: associatedContacts || [],
          deals: associatedDeals || [],
          tickets: associatedTickets || [],
        }}
      />

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
              navigate("/profile");
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

      {/* Modal de crear llamada */}
      <CallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        entityType="company"
        entityId={id || ""}
        entityName={company?.name || "Sin nombre"}
        user={user}
        onSave={(newActivity) => {
          // Agregar la actividad inmediatamente al estado
          setActivities((prevActivities) => {
            const exists = prevActivities.some((a: any) => a.id === newActivity.id);
            if (exists) return prevActivities;
            return [newActivity, ...prevActivities].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA;
            });
          });
          fetchAssociatedRecords(); // Actualizar actividades
        }}
      />

      {/* Modal de crear tarea/reunión */}
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        entityType="company"
        entityId={id || ""}
        entityName={company?.name || "Sin nombre"}
        user={user}
        onSave={(newTask) => {
          // Convertir la tarea a formato de actividad para agregarla a la lista
          const taskAsActivity = {
            id: newTask.id,
            type: newTask.type === "meeting" ? "meeting" : "task",
            subject: newTask.title,
            description: newTask.description,
            dueDate: newTask.dueDate,
            createdAt: newTask.createdAt,
            User: newTask.CreatedBy || newTask.AssignedTo,
            isTask: true,
            status: newTask.status,
            priority: newTask.priority,
            companyId: newTask.companyId,
          };
          // Agregar la actividad inmediatamente al estado
          setActivities((prevActivities) => {
            const exists = prevActivities.some((a: any) => a.id === newTask.id);
            if (exists) return prevActivities;
            return [taskAsActivity, ...prevActivities].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
              const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
              return dateB - dateA;
            });
          });
          fetchAssociatedRecords(); // Actualizar actividades
        }}
        taskType={taskType}
      />

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
        disablePortal={false}
        TransitionProps={{
          appear: false,
        }}
        PaperProps={{
          sx: {
            zIndex: 2000,
            position: 'relative',
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1999,
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
        TransitionProps={{
          appear: false,
        }}
        PaperProps={{
          sx: {
            zIndex: 2000,
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1999,
            transition: 'none',
          },
          transitionDuration: 0,
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

      {/* Dialog de Edición de Empresa - Movido a DetailPageLayout como prop editDialog */}

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
    </>
  );
};

export default CompanyDetail;
