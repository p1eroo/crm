import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
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
  useTheme,
  FormControl,
} from "@mui/material";
import {
  Email,
  Close,
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
  LinkedCompaniesCard,
  LinkedDealsCard,
  FullContactsTableCard,
  FullCompaniesTableCard,
  FullDealsTableCard,
  FullActivitiesTableCard,
  ActivityDetailDialog,
  ActivitiesTabContent,
  GeneralDescriptionTab,
} from "../components/DetailCards";
import { NoteModal, CallModal, TaskModal, DealModal, CompanyModal, ContactModal } from "../components/ActivityModals";
import type { GeneralInfoCard } from "../components/DetailCards";
import DetailPageLayout from "../components/Layout/DetailPageLayout";
import { useAuth } from "../context/AuthContext";
import { Building2 } from "lucide-react";
import { log } from "../utils/logger";

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
  const [associatedCompanies, setAssociatedCompanies] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Estados para búsquedas y filtros
  const [activitySearch, setActivitySearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
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
  const [dealSortOrder, setDealSortOrder] = useState<"asc" | "desc">("asc");
  const [dealSortField, setDealSortField] = useState<
    "name" | "amount" | "closeDate" | "stage" | undefined
  >(undefined);
  const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">(
    "asc"
  );
  const [contactSortField, setContactSortField] = useState<
    "firstName" | "email" | "phone"
  >("firstName");
  const [companySortField, setCompanySortField] = useState<
    "name" | "domain" | "phone"
  >("name");
  const [companySortOrder, setCompanySortOrder] = useState<"asc" | "desc">(
    "asc"
  );
  const [removeContactDialogOpen, setRemoveContactDialogOpen] = useState(false);
  const [removeCompanyDialogOpen, setRemoveCompanyDialogOpen] = useState(false);
  const [removeDealDialogOpen, setRemoveDealDialogOpen] = useState(false);
  const [contactToRemove, setContactToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [companyToRemove, setCompanyToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [dealToRemove, setDealToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  
  // Estados para diálogos
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [companyDialogTab, setCompanyDialogTab] = useState<"create" | "existing">("create");
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [dealDialogTab, setDealDialogTab] = useState<"create" | "existing">("create");
  const [, setCreateActivityMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [contactDialogTab, setContactDialogTab] = useState<
    "create" | "existing"
  >("create");
  
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
      // Actualizar empresas asociadas desde la relación muchos-a-muchos
      const companies =
        response.data.Companies && Array.isArray(response.data.Companies)
        ? response.data.Companies
        : [];
      setAssociatedCompanies(companies);
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
      
      // Actualizar empresas relacionadas desde la relación muchos-a-muchos
      const companies =
        companyResponse.data.Companies &&
        Array.isArray(companyResponse.data.Companies)
        ? companyResponse.data.Companies
        : [];
      setAssociatedCompanies(companies);

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
    }
  }, [company, id, fetchAssociatedRecords]);

  useEffect(() => {
    if (id) {
      fetchActivityLogs();
    }
  }, [id, fetchActivityLogs]);

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
      
      log("Datos a enviar:", dataToSend);
      
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
      const emailResponse = await api.post("/emails/send", {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
      });

      const { messageId, threadId } = emailResponse.data;

      // Registrar como actividad con messageId y threadId
      const response = await api.post("/activities/emails", {
        subject: emailData.subject,
        description: emailData.body.replace(/<[^>]*>/g, ""), // Remover HTML para la descripción
        companyId: id,
        gmailMessageId: messageId,
        gmailThreadId: threadId,
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

  const handleCreateActivity = (type: string) => {
    setCreateActivityMenuAnchor(null);
    switch (type) {
      case "note":
        handleOpenNote();
        break;
      case "email":
        setEmailOpen(true);
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

  const handleSortCompanies = (field: "name" | "domain" | "phone") => {
    const isAsc = companySortField === field && companySortOrder === "asc";
    setCompanySortOrder(isAsc ? "desc" : "asc");
    setCompanySortField(field);
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

  const handleRemoveCompanyClick = (companyId: number, companyName: string) => {
    setCompanyToRemove({ id: companyId, name: companyName });
    setRemoveCompanyDialogOpen(true);
  };

  const handleConfirmRemoveCompany = async () => {
    if (!id || !companyToRemove) return;
    try {
      setSaving(true);
      await api.delete(`/companies/${id}/companies/${companyToRemove.id}`);
      setAssociatedCompanies((prevCompanies) =>
        prevCompanies.filter((company: any) => company.id !== companyToRemove.id)
      );
      await fetchCompany();
      setRemoveCompanyDialogOpen(false);
      setCompanyToRemove(null);
    } catch (error: any) {
      console.error("Error removing company:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar la empresa";
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
      { component: <LinkedCompaniesCard companies={associatedCompanies || []} /> },
      { component: <LinkedDealsCard deals={associatedDeals || []} /> },
      // { component: <LinkedTicketsCard tickets={associatedTickets || []} /> },
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
        setContactDialogTab('existing');
        setAddContactOpen(true);
      }}
      onAddNew={() => {
        setContactDialogTab('create');
        setAddContactOpen(true);
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

    <FullCompaniesTableCard
      companies={associatedCompanies || []}
      searchValue={companySearch}
      onSearchChange={setCompanySearch}
      onAddExisting={() => {
        setCompanyDialogTab("existing");
        setAddCompanyOpen(true);
      }}
      onAddNew={() => {
        setCompanyDialogTab("create");
        setAddCompanyOpen(true);
      }}
      showActions={true}
      onRemove={(companyId, companyName) =>
        handleRemoveCompanyClick(companyId, companyName || "")
      }
      onCopyToClipboard={handleCopyToClipboard}
      sortField={companySortField}
      sortOrder={companySortOrder}
      onSort={handleSortCompanies}
    />

    <FullDealsTableCard
      deals={associatedDeals || []}
      searchValue={dealSearch}
      onSearchChange={setDealSearch}
      onAddExisting={() => {
        setDealDialogTab("existing");
        setAddDealOpen(true);
      }}
      onAddNew={() => {
        setDealDialogTab("create");
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

    {/* <FullTicketsTableCard
      tickets={associatedTickets || []}
      searchValue={ticketSearch}
      onSearchChange={setTicketSearch}
      onAdd={() => setAddTicketOpen(true)}
      showActions={true}
      onRemove={(ticketId: number, ticketName?: string) =>
        handleRemoveTicketClick(ticketId, ticketName || "")
      }
    /> */}
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

    {/* MANTENER TODOS LOS MODALES Y DIALOGS DESDE AQUÍ */}

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
          // tickets: associatedTickets || [],
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

      {/* Modal para agregar/crear contactos */}
      <ContactModal
        open={addContactOpen} 
        onClose={() => setAddContactOpen(false)}
        entityType="company"
        entityId={id || ""}
        entityName={company?.name || "Sin nombre"}
        user={user}
        initialTab={contactDialogTab}
        defaultCompanyId={company?.id}
        excludedContactIds={(associatedContacts || []).map((c: any) => c.id)}
        associatedContacts={associatedContacts || []}
        onSave={async () => {
          await fetchAssociatedRecords();
          setAddContactOpen(false); 
          setSuccessMessage("Contacto agregado exitosamente");
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />

      {/* Modal para agregar/crear empresas relacionadas */}
      <CompanyModal
        open={addCompanyOpen}
        onClose={() => setAddCompanyOpen(false)}
        entityType="company"
        entityId={id || ""}
        entityName={company?.name || "Sin nombre"}
        user={user}
        initialTab={companyDialogTab}
        excludedCompanyIds={(associatedCompanies || []).map((c: any) => c.id)}
        onSave={async () => {
          await fetchAssociatedRecords();
          setAddCompanyOpen(false);
        }}
      />

      {/* Modal para agregar/crear negocios relacionados */}
      <DealModal
        open={addDealOpen} 
        onClose={() => setAddDealOpen(false)} 
        entityType="company"
        entityId={id || ""}
        entityName={company?.name || "Sin nombre"}
        user={user}
        initialTab={dealDialogTab}
        defaultCompanyId={company?.id}
        excludedDealIds={(associatedDeals || []).map((d: any) => d.id)}
        getStageLabel={getStageLabel}
        onSave={async () => {
          await fetchAssociatedRecords();
          setAddDealOpen(false);
        }}
      />

      {/* Diálogo para agregar ticket */}
      {/* <Dialog 
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
      </Dialog> */}

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

      {/* Dialog para confirmar eliminación de empresa */}
      <Dialog
        open={removeCompanyDialogOpen}
        onClose={() => {
          setRemoveCompanyDialogOpen(false);
          setCompanyToRemove(null);
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
            {companyToRemove?.name} ya no se asociará con {company?.name}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setRemoveCompanyDialogOpen(false);
              setCompanyToRemove(null);
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
            onClick={handleConfirmRemoveCompany}
            variant="contained"
            disabled={saving}
            sx={{
              textTransform: "none",
              bgcolor: "#FF9800",
              color: "white",
              "&:hover": {
                bgcolor: "#F57C00",
              },
              "&:disabled": {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            {saving ? "Eliminando..." : "Eliminar asociación"}
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
      {/* <Dialog
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
      </Dialog> */}
    </>
  );
};

export default CompanyDetail;
