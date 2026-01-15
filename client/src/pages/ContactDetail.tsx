import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
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
  InputAdornment,
  useTheme,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  Email,
  Close,
  Search,
} from "@mui/icons-material";
import api from "../config/api";
import EmailComposer from "../components/EmailComposer";
import { taxiMonterricoColors } from "../theme/colors";
import {
  RecentActivitiesCard,
  LinkedCompaniesCard,
  LinkedDealsCard,
  LinkedTicketsCard,
  FullCompaniesTableCard,
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faClock } from "@fortawesome/free-regular-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faUserTie } from "@fortawesome/free-solid-svg-icons";
import { faUser as faUserRegular } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

library.add(far);
library.add(fas);

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
    companyname?: string;
  }>;
  Owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [contact, setContact] = useState<ContactDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [,] = useState<null | HTMLElement>(null);
  const [associatedDeals, setAssociatedDeals] = useState<any[]>([]);
  const [associatedCompanies, setAssociatedCompanies] = useState<any[]>([]);
  const [associatedTickets, setAssociatedTickets] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Estados para búsquedas y filtros
  const [activitySearch, setActivitySearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [isRemovingCompany] = useState(false);

  // Estados para funcionalidades de notas y actividades
  const [completedActivities, setCompletedActivities] = useState<{
    [key: number]: boolean;
  }>({});
  const [expandedActivity, setExpandedActivity] = useState<any>(null);
  const [dealSortOrder, setDealSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dealSortField, setDealSortField] = useState<'name' | 'amount' | 'closeDate' | 'stage' | undefined>(undefined);
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('asc');
  const [companySortField, setCompanySortField] = useState<'name' | 'domain' | 'phone' | undefined>(undefined);
  
  // Estados para diálogos de eliminación
  const [removeCompanyDialogOpen, setRemoveCompanyDialogOpen] = useState(false);
  const [removeDealDialogOpen, setRemoveDealDialogOpen] = useState(false);
  const [removeTicketDialogOpen, setRemoveTicketDialogOpen] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState<{ id: number; name: string } | null>(null);
  const [dealToRemove, setDealToRemove] = useState<{ id: number; name: string } | null>(null);
  const [ticketToRemove, setTicketToRemove] = useState<{ id: number; name: string } | null>(null);

  // Estados para diálogos
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [addTicketOpen, setAddTicketOpen] = useState(false);
  const [, setCreateActivityMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    domain: "",
    phone: "",
    companyname: "",
    lifecycleStage: "lead",
    ruc: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [companyDialogTab, setCompanyDialogTab] = useState<
    "create" | "existing"
  >("create");
  const [existingCompaniesSearch, setExistingCompaniesSearch] = useState("");
  const [selectedExistingCompanies, setSelectedExistingCompanies] = useState<
    number[]
  >([]);
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState("");
  const [dealFormData, setDealFormData] = useState({
    name: "",
    amount: "",
    stage: "lead",
    closeDate: "",
    priority: "baja" as "baja" | "media" | "alta",
    companyId: "",
    contactId: "",
  });
  const [ticketFormData, setTicketFormData] = useState({
    subject: "",
    description: "",
    status: "new",
    priority: "medium",
  });

  // Estados para asociaciones en nota
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loadingAllCompanies, setLoadingAllCompanies] = useState(false);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [, setEmailValue] = useState("");
  const [, setPhoneValue] = useState("");
  const [, setCompanyValue] = useState("");

  // Estados para diálogos de acciones
  const [noteOpen, setNoteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskType, setTaskType] = useState<"todo" | "meeting">("todo");
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [emailConnectModalOpen, setEmailConnectModalOpen] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);

  // Estados para formularios
  const [,] = useState({ subject: "", description: "", to: "" });

  // Estados para el diálogo de edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    jobTitle: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    website: "",
    facebook: "",
    twitter: "",
    github: "",
    linkedin: "",
    youtube: "",
    lifecycleStage: "lead",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Ya no se necesitan estados de OAuth individual - se usa el token guardado desde Perfil

  const fetchContact = useCallback(async () => {
    try {
      const response = await api.get(`/contacts/${id}`);
      setContact(response.data);
      setEmailValue(response.data.email || "");
      setPhoneValue(response.data.phone || "");
      // Usar Companies si está disponible, sino Company (compatibilidad)
      const companies =
        response.data.Companies && Array.isArray(response.data.Companies)
          ? response.data.Companies
          : response.data.Company
          ? [response.data.Company]
          : [];
      setCompanyValue(companies.length > 0 ? companies[0].name : "");
      // Actualizar associatedCompanies también
      setAssociatedCompanies(companies);
    } catch (error) {
      console.error("Error fetching contact:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Función helper para deduplicar notas con el mismo contenido y timestamp similar
  const deduplicateNotes = useCallback((activities: any[]) => {
    const noteGroups = new Map<string, any[]>();
    const otherActivities: any[] = [];

    activities.forEach((activity) => {
      // Solo deduplicar notas (type === 'note') que tengan contactId
      if (activity.type === 'note' && activity.contactId) {
        // Crear una clave única basada en contenido y timestamp
        const timestamp = new Date(activity.createdAt || 0).getTime();
        const timeWindow = Math.floor(timestamp / 5000) * 5000; // Agrupar por ventanas de 5 segundos
        const key = `${activity.description || ''}|${activity.subject || ''}|${activity.userId || ''}|${activity.contactId}|${timeWindow}`;
        
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
      // Obtener deals asociados
      const dealsResponse = await api.get("/deals", {
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
        const companies =
          updatedContact?.Companies && Array.isArray(updatedContact.Companies)
            ? updatedContact.Companies
            : updatedContact?.Company
            ? [updatedContact.Company]
            : [];
        setAssociatedCompanies(companies);
      }

      // Obtener actividades
      const activitiesResponse = await api.get("/activities", {
        params: { contactId: id },
      });
      const activitiesData =
        activitiesResponse.data.activities || activitiesResponse.data || [];

      // Obtener tareas asociadas al contacto
      const tasksResponse = await api.get("/tasks", {
        params: { contactId: id },
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

      // Obtener tickets asociados
      const ticketsResponse = await api.get("/tickets", {
        params: { contactId: id },
      });
      setAssociatedTickets(
        ticketsResponse.data.tickets || ticketsResponse.data || []
      );
    } catch (error) {
      console.error("Error fetching associated records:", error);
    }
  }, [id, isRemovingCompany, deduplicateNotes]);

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

  const fetchActivityLogs = useCallback(async () => {
    if (!id) return;
    setLoadingLogs(true);
    try {
      // Obtener actividades y cambios del contacto
      const [activitiesResponse, contactResponse] = await Promise.all([
        api.get("/activities", { params: { contactId: id } }),
        api.get(`/contacts/${id}`),
      ]);

      const activities =
        activitiesResponse.data.activities || activitiesResponse.data || [];
      const contactData = contactResponse.data;

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

      // Agregar cambios en el contacto si hay updatedAt
      if (
        contactData.updatedAt &&
        contactData.createdAt !== contactData.updatedAt
      ) {
        logs.push({
          id: `contact-update-${contactData.id}`,
          type: "contact",
          action: "updated",
          description: "Información del contacto actualizada",
          user: contactData.Owner,
          timestamp: contactData.updatedAt,
          iconType: "contact",
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
    fetchContact();
  }, [fetchContact]);

  useEffect(() => {
    if (contact && !isRemovingCompany) {
      fetchAssociatedRecords();
      fetchAllCompanies();
    }
  }, [contact, id, isRemovingCompany, fetchAssociatedRecords]);

  useEffect(() => {
    if (id) {
      fetchActivityLogs();
    }
  }, [id, fetchActivityLogs]);

  // Actualizar asociaciones seleccionadas cuando cambian los registros relacionados
  useEffect(() => {
    // Inicializar empresas seleccionadas con las empresas asociadas
    if (associatedCompanies.length > 0) {
      const companyIds = associatedCompanies
        .map((c: any) => c && c.id)
        .filter((id: any) => id !== undefined && id !== null);
      if (companyIds.length > 0) {
        setSelectedCompanies((prev) => {
          // Combinar con las existentes para no perder selecciones manuales, eliminando duplicados
          const combined = [...prev, ...companyIds];
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
  }, [associatedCompanies]);

  const fetchAllCompanies = async () => {
    try {
      setLoadingAllCompanies(true);
      const response = await api.get("/companies", { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching all companies:", error);
    } finally {
      setLoadingAllCompanies(false);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await api.get("/contacts", { params: { limit: 1000 } });
      setAllContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error("Error fetching all contacts:", error);
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
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [noteOpen, emailOpen, callOpen, taskOpen]);


  const getCompanyInitials = (companyName: string) => {
    if (!companyName) return "--";
    const words = companyName
      .trim()
      .split(" ")
      .filter((word) => word.length > 0);
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  // const getStageColor = (stage: string) => {
  //   const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
  //     'lead': 'error', // Rojo para 0%
  //     'contacto': 'warning', // Naranja para 10%
  //     'reunion_agendada': 'warning', // Naranja para 30%
  //     'reunion_efectiva': 'warning', // Amarillo para 40%
  //     'propuesta_economica': 'info', // Verde claro para 50%
  //     'negociacion': 'success', // Verde para 70%
  //     'licitacion': 'success', // Verde para 75%
  //     'licitacion_etapa_final': 'success', // Verde oscuro para 85%
  //     'cierre_ganado': 'success', // Verde oscuro para 90%
  //     'cierre_perdido': 'error', // Rojo para -1%
  //     'firma_contrato': 'success', // Verde oscuro para 95%
  //     'activo': 'success', // Verde más oscuro para 100%
  //     'cliente_perdido': 'error', // Rojo para -1%
  //     'lead_inactivo': 'error', // Rojo para -5%
  //   };
  //   return colors[stage] || 'default';
  // };

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

  // Funciones para el diálogo de edición
  const handleOpenEditDialog = () => {
    if (contact) {
      setEditFormData({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        mobile: contact.mobile || "",
        jobTitle: contact.jobTitle || "",
        address: contact.address || "",
        city: contact.city || "",
        state: contact.state || "",
        country: contact.country || "",
        postalCode: contact.postalCode || "",
        website: contact.website || "",
        facebook: contact.facebook || "",
        twitter: contact.twitter || "",
        github: contact.github || "",
        linkedin: contact.linkedin || "",
        youtube: contact.youtube || "",
        lifecycleStage: contact.lifecycleStage || "lead",
      });
      setEditDialogOpen(true);
      setErrorMessage("");
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      mobile: "",
      jobTitle: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      website: "",
      facebook: "",
      twitter: "",
      github: "",
      linkedin: "",
      youtube: "",
      lifecycleStage: "lead",
    });
    setErrorMessage("");
  };

  const handleSubmitEdit = async () => {
    if (!contact || !editFormData.firstName.trim() || !editFormData.lastName.trim()) {
      return;
    }
    
    setSavingEdit(true);
    setErrorMessage("");
    try {
      const data = {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        email: editFormData.email || null,
        phone: editFormData.phone || null,
        mobile: editFormData.mobile || null,
        jobTitle: editFormData.jobTitle || null,
        address: editFormData.address || null,
        city: editFormData.city || null,
        state: editFormData.state || null,
        country: editFormData.country || null,
        postalCode: editFormData.postalCode || null,
        website: editFormData.website || null,
        facebook: editFormData.facebook || null,
        twitter: editFormData.twitter || null,
        github: editFormData.github || null,
        linkedin: editFormData.linkedin || null,
        youtube: editFormData.youtube || null,
        lifecycleStage: editFormData.lifecycleStage,
      };
      
      await api.put(`/contacts/${contact.id}`, data);
      
      // Recargar los datos del contacto
      await fetchContact();
      
      handleCloseEditDialog();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Error al actualizar el contacto. Por favor, intenta nuevamente.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Funciones para abrir diálogos
  const handleOpenNote = () => {
    setNoteOpen(true);
  };

  const handleOpenEmail = () => {
    setEmailOpen(true);
  };

  // Ya no se usa login individual de Google - se usa el token guardado desde Perfil

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
      const companies =
        contact?.Companies && Array.isArray(contact.Companies)
          ? contact.Companies
          : contact?.Company
          ? [contact.Company]
          : [];

      let newActivities: any[] = [];
      if (companies.length > 0) {
        const activityPromises = companies.map((company: any) =>
          api.post("/activities/emails", {
            subject: emailData.subject,
            description: emailData.body.replace(/<[^>]*>/g, ""), // Remover HTML para la descripción
            contactId: id,
            companyId: company.id,
          })
        );
        const responses = await Promise.all(activityPromises);
        newActivities = responses.map((res) => res.data);
      } else {
        const response = await api.post("/activities/emails", {
          subject: emailData.subject,
          description: emailData.body.replace(/<[^>]*>/g, ""),
          contactId: id,
        });
        newActivities = [response.data];
      }

      // Actualización optimista: agregar actividades inmediatamente al estado
      setActivities((prevActivities) => {
        // Verificar que no estén ya en la lista (evitar duplicados)
        const existingIds = new Set(prevActivities.map((a: any) => a.id));
        const activitiesToAdd = newActivities.filter((a: any) => !existingIds.has(a.id));
        
        if (activitiesToAdd.length === 0) return prevActivities;
        
        // Agregar al inicio de la lista y ordenar por fecha (más reciente primero)
        const updated = [...activitiesToAdd, ...prevActivities].sort((a: any, b: any) => {
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

  const handleOpenTask = () => {
    setTaskType("todo");
    setTaskOpen(true);
  };


  const handleOpenMeeting = () => {
    setTaskType("meeting");
    setTaskOpen(true);
  };

  // Funciones para guardar
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


  // const handleSaveEmail = async () => {
  //   if (!emailData.subject.trim()) {
  //     return;
  //   }
  //   setSaving(true);
  //   try {
  //     // Obtener empresas asociadas al contacto
  //     const companies = (contact?.Companies && Array.isArray(contact.Companies))
  //       ? contact.Companies
  //       : (contact?.Company ? [contact.Company] : []);

  //     // Crear una actividad para cada empresa asociada, o solo con contactId si no hay empresas
  //     if (companies.length > 0) {
  //       // Crear actividad para cada empresa asociada
  //       const activityPromises = companies.map((company: any) =>
  //         api.post('/activities', {
  //           type: 'email',
  //           subject: emailData.subject,
  //           description: emailData.description,
  //           contactId: id,
  //           companyId: company.id,
  //         })
  //       );
  //       await Promise.all(activityPromises);
  //     } else {
  //       // Si no hay empresas asociadas, crear solo con contactId
  //       await api.post('/activities', {
  //         type: 'email',
  //         subject: emailData.subject,
  //         description: emailData.description,
  //         contactId: id,
  //       });
  //     }
  //     setSuccessMessage('Email registrado exitosamente');
  //     setEmailOpen(false);
  //     setEmailData({ subject: '', description: '', to: '' });
  //     fetchAssociatedRecords(); // Actualizar actividades
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //   } catch (error) {
  //     console.error('Error saving email:', error);
  //   } finally {
  //     setSaving(false);
  //   }
  // };



  // Funciones para la pestaña Descripción
  const handleSearchRuc = async () => {
    if (!companyFormData.ruc || companyFormData.ruc.length < 11) {
      setRucError("El RUC debe tener 11 dígitos");
      return;
    }

    setLoadingRuc(true);
    setRucError("");

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";

      if (!factilizaToken) {
        setRucError(
          "Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN"
        );
        setLoadingRuc(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/ruc/info/${companyFormData.ruc}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Actualizar el formulario con los datos obtenidos
        setCompanyFormData({
          ...companyFormData,
          name: data.nombre_o_razon_social || "",
          companyname: data.tipo_contribuyente || "",
          address: data.direccion_completa || data.direccion || "",
          city: data.distrito || "",
          state: data.provincia || "",
          country: data.departamento || "Perú",
        });
      } else {
        setRucError("No se encontró información para este RUC");
      }
    } catch (error: any) {
      console.error("Error al buscar RUC:", error);
      if (error.response?.status === 400) {
        setRucError("RUC no válido o no encontrado");
      } else if (error.response?.status === 401) {
        setRucError("Error de autenticación con la API");
      } else {
        setRucError("Error al buscar RUC. Por favor, intente nuevamente");
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleAddCompany = async () => {
    try {
      await api.post("/companies", {
        ...companyFormData,
        // No asociar automáticamente con el contacto - el usuario debe agregarla manualmente
      });
      setSuccessMessage("Empresa creada exitosamente");
      setAddCompanyOpen(false);
      setCompanyFormData({
        name: "",
        domain: "",
        phone: "",
        companyname: "",
        lifecycleStage: "lead",
        ruc: "",
        address: "",
        city: "",
        state: "",
        country: "",
      });
      setRucError("");
      setCompanyDialogTab("create");
      fetchAssociatedRecords();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error adding company:", error);
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
      const companies =
        response.data.Companies && Array.isArray(response.data.Companies)
          ? response.data.Companies
          : response.data.Company
          ? [response.data.Company]
          : [];
      setAssociatedCompanies(companies);

      // También agregar a selectedCompanies para que se cuenten en las asociaciones
      const newCompanyIds = selectedExistingCompanies.filter(
        (id: number) => !selectedCompanies.includes(id)
      );
      setSelectedCompanies([...selectedCompanies, ...newCompanyIds]);

      setSuccessMessage(
        `${selectedExistingCompanies.length} empresa(s) agregada(s) exitosamente`
      );

      setAddCompanyOpen(false);
      setSelectedExistingCompanies([]);
      setExistingCompaniesSearch("");
      setCompanyDialogTab("create");

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error associating companies:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al asociar las empresas";
      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  // const handleOpenAddCompanyDialog = () => {
  //   setCompanyDialogTab('create');
  //   setSelectedExistingCompanies([]);
  //   setExistingCompaniesSearch('');
  //   setCompanyFormData({
  //     name: '',
  //     domain: '',
  //     phone: '',
  //     industry: '',
  //     lifecycleStage: 'lead',
  //     ruc: '',
  //     address: '',
  //     city: '',
  //     state: '',
  //     country: '',
  //   });
  //   setRucError('');
  //   setAddCompanyOpen(true);
  //   // Cargar empresas disponibles cuando se abre el diálogo
  //   if (allCompanies.length === 0) {
  //     fetchAllCompanies();
  //   }
  // };

  // const handleRemoveCompanyAssociation = async (companyId: number) => {
  //   try {
  //     setIsRemovingCompany(true);
  //
  //     // Verificar si esta empresa está asociada al contacto
  //     const isAssociated = associatedCompanies.some((c: any) => c && c.id === companyId);
  //
  //     if (!isAssociated) {
  //       setSuccessMessage('Esta empresa no está asociada con este contacto');
  //       setTimeout(() => setSuccessMessage(''), 3000);
  //       setIsRemovingCompany(false);
  //       return;
  //     }

  //     // Eliminar la asociación usando el nuevo endpoint
  //     const response = await api.delete(`/contacts/${id}/companies/${companyId}`);
  //
  //     // Actualizar el contacto y las empresas asociadas
  //     setContact(response.data);
  //     const companies = response.data.Companies || [];
  //     setAssociatedCompanies(companies);
  //
  //     // También remover de selectedCompanies y excludedCompanies
  //     setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
  //     setExcludedCompanies(excludedCompanies.filter(id => id !== companyId));
  //
  //     setSuccessMessage('Asociación eliminada exitosamente');
  //     setCompanyActionsMenu({});
  //     setIsRemovingCompany(false);
  //
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //   } catch (error) {
  //     console.error('Error removing company association:', error);
  //     setSuccessMessage('Error al eliminar la asociación');
  //     setIsRemovingCompany(false);
  //     // Revertir el cambio si hay error
  //     fetchAssociatedRecords();
  //     setTimeout(() => setSuccessMessage(''), 3000);
  //   }
  // };

  // const handleOpenCompanyActionsMenu = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
  //   event.stopPropagation();
  //   setCompanyActionsMenu({
  //     ...companyActionsMenu,
  //     [companyId]: event.currentTarget,
  //   });
  // };

  // const handleCloseCompanyActionsMenu = (companyId: number) => {
  //   setCompanyActionsMenu({
  //     ...companyActionsMenu,
  //     [companyId]: null,
  //   });
  // };

  const handleAddDeal = async () => {
    try {
      await api.post("/deals", {
        ...dealFormData,
        amount: parseFloat(dealFormData.amount) || 0,
        contactId: dealFormData.contactId
          ? parseInt(dealFormData.contactId)
          : id,
        companyId: dealFormData.companyId
          ? parseInt(dealFormData.companyId)
          : contact?.Company?.id || contact?.Companies?.[0]?.id,
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
        contactId: id,
        // No asociar automáticamente con la empresa - el usuario debe agregarla manualmente si lo desea
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
      case "email":
        handleOpenEmail();
        break;
      case "call":
        handleOpenCall();
        break;
      case "task":
        handleOpenTask();
        break;
      case "meeting":
        handleOpenMeeting();
        break;
    }
  };

  // const handleCopyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  //   setSuccessMessage('Copiado al portapapeles');
  //   setTimeout(() => setSuccessMessage(''), 2000);
  // };

  const handleSortDeals = (field: "name" | "amount" | "closeDate" | "stage") => {
    const isAsc = dealSortField === field && dealSortOrder === "asc";
    setDealSortOrder(isAsc ? "desc" : "asc");
    setDealSortField(field);
  };

  const handleSortCompanies = (field: "name" | "domain" | "phone") => {
    const isAsc = companySortField === field && companySortOrder === "asc";
    setCompanySortOrder(isAsc ? "desc" : "asc");
    setCompanySortField(field);
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "note":
        return "Nota";
      case "email":
        return "Correo";
      case "call":
        return "Llamada";
      case "task":
      case "todo":
        return "Tarea";
      case "meeting":
        return "Reunión";
      default:
        return "Actividad";
    }
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

  const handleRemoveCompanyClick = (companyId: number, companyName?: string) => {
    setCompanyToRemove({ id: companyId, name: companyName || "" });
    setRemoveCompanyDialogOpen(true);
  };

  const handleConfirmRemoveCompany = async () => {
    if (!id || !companyToRemove) return;
    try {
      await api.delete(`/contacts/${id}/companies/${companyToRemove.id}`);
      setAssociatedCompanies((prevCompanies) =>
        prevCompanies.filter((company: any) => company.id !== companyToRemove.id)
      );
      await fetchContact();
      setRemoveCompanyDialogOpen(false);
      setCompanyToRemove(null);
    } catch (error: any) {
      console.error("Error removing company:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar la empresa";
      alert(errorMessage);
    }
  };

  const handleRemoveDealClick = (dealId: number, dealName?: string) => {
    setDealToRemove({ id: dealId, name: dealName || "" });
    setRemoveDealDialogOpen(true);
  };

  const handleConfirmRemoveDeal = async () => {
    if (!id || !dealToRemove) return;
    try {
      await api.delete(`/contacts/${id}/deals/${dealToRemove.id}`);
      setAssociatedDeals((prevDeals) =>
        prevDeals.filter((deal: any) => deal.id !== dealToRemove.id)
      );
      await fetchContact();
      setRemoveDealDialogOpen(false);
      setDealToRemove(null);
    } catch (error: any) {
      console.error("Error removing deal:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el negocio";
      alert(errorMessage);
    }
  };

  const handleRemoveTicketClick = (ticketId: number, ticketName: string) => {
    setTicketToRemove({ id: ticketId, name: ticketName });
    setRemoveTicketDialogOpen(true);
  };

  const handleConfirmRemoveTicket = async () => {
    if (!id || !ticketToRemove) return;
    try {
      await api.delete(`/contacts/${id}/tickets/${ticketToRemove.id}`);
      setAssociatedTickets((prevTickets) =>
        prevTickets.filter((ticket: any) => ticket.id !== ticketToRemove.id)
      );
      await fetchContact();
      setRemoveTicketDialogOpen(false);
      setTicketToRemove(null);
    } catch (error: any) {
      console.error("Error removing ticket:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el ticket";
      alert(errorMessage);
    }
  };


  // const sortedDeals = [...associatedDeals].sort((a, b) => {
  //   if (!dealSortField) return 0;
  //   let aVal: any = a[dealSortField];
  //   let bVal: any = b[dealSortField];
  //
  //   if (dealSortField === 'amount') {
  //     aVal = aVal || 0;
  //     bVal = bVal || 0;
  //   } else if (dealSortField === 'closeDate') {
  //     aVal = aVal ? new Date(aVal).getTime() : 0;
  //     bVal = bVal ? new Date(bVal).getTime() : 0;
  //   } else {
  //     aVal = String(aVal || '').toLowerCase();
  //     bVal = String(bVal || '').toLowerCase();
  //   }
  //
  //   if (aVal < bVal) return dealSortOrder === 'asc' ? -1 : 1;
  //   if (aVal > bVal) return dealSortOrder === 'asc' ? 1 : -1;
  //   return 0;
  // });

  // const sortedCompanies = [...associatedCompanies].sort((a, b) => {
  //   if (!companySortField) return 0;
  //   let aVal: any = a[companySortField];
  //   let bVal: any = b[companySortField];
  //
  //   aVal = String(aVal || '').toLowerCase();
  //   bVal = String(bVal || '').toLowerCase();
  //
  //   if (aVal < bVal) return companySortOrder === 'asc' ? -1 : 1;
  //   if (aVal > bVal) return companySortOrder === 'asc' ? 1 : -1;
  //   return 0;
  // });

  // const filteredCompanies = sortedCompanies.filter((company) => {
  //   if (companySearch && !company.name?.toLowerCase().includes(companySearch.toLowerCase()) &&
  //       !company.domain?.toLowerCase().includes(companySearch.toLowerCase())) {
  //     return false;
  //   }
  //   return true;
  // });

  // const filteredDeals = sortedDeals.filter((deal) => {
  //   if (dealSearch && !deal.name?.toLowerCase().includes(dealSearch.toLowerCase())) {
  //     return false;
  //   }
  //   return true;
  // });

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

  if (!contact) {
    return (
      <Box>
        <Typography>Contacto no encontrado</Typography>
        <Button onClick={() => navigate("/contacts")}>
          Volver a Contactos
        </Button>
      </Box>
    );
  }

    // Preparar campos de detalles
    const detailFields = [
      {
        label: 'Email',
        value: contact?.email || '--',
        show: !!contact?.email,
      },
      {
        label: 'Teléfono',
        value: contact?.phone || contact?.mobile || '--',
        show: !!(contact?.phone || contact?.mobile),
      },
      {
        label: 'Trabajo',
        value: contact?.jobTitle || '--',
        show: !!contact?.jobTitle,
      },
      {
        label: 'Dirección',
        value: contact?.address || contact?.city || '--',
        show: !!(contact?.address || contact?.city),
      },
      {
        label: 'País',
        value: contact?.country || '--',
        show: !!contact?.country,
      },
      {
        label: 'Etapa',
        value: (
          <Chip
            label={getStageLabel(contact?.lifecycleStage || '')}
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
        show: !!contact?.lifecycleStage,
      },
      {
        label: 'Propietario',
        value: contact?.Owner
          ? `${contact.Owner.firstName || ''} ${contact.Owner.lastName || ''}`.trim() || contact.Owner.email || 'Sin nombre'
          : '--',
        show: !!contact?.Owner,
      },
    ];
  
    // Preparar botones de actividades
    const activityButtons = [
      {
        icon: ['fas', 'note-sticky'],
        tooltip: 'Crear nota',
        onClick: () => handleOpenNote(),
      },
      {
        icon: faEnvelope,
        tooltip: 'Enviar correo',
        onClick: () => handleOpenEmail(),
      },
      {
        icon: ['fas', 'phone'],
        tooltip: 'Llamada',
        onClick: () => handleOpenCall(),
      },
      {
        icon: ['fas', 'thumbtack'],
        tooltip: 'Crear tarea',
        onClick: () => handleOpenTask(),
      },
      {
        icon: ['fas', 'calendar-week'],
        tooltip: 'Programar reunión',
        onClick: () => handleOpenMeeting(),
      },
    ];
  
    // Preparar cards de información general
    const generalInfoCards: GeneralInfoCard[] = [
      {
        label: 'Fecha de creación',
        value: contact?.createdAt
          ? `${new Date(contact.createdAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })} ${new Date(contact.createdAt).toLocaleTimeString("es-ES", {
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
        value: contact?.lifecycleStage
          ? getStageLabel(contact.lifecycleStage)
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
        value: contact?.Owner
          ? contact.Owner.firstName || contact.Owner.lastName
            ? `${contact.Owner.firstName || ""} ${contact.Owner.lastName || ""}`.trim()
            : contact.Owner.email || "Sin nombre"
          : "No asignado",
        icon: faUserRegular,
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
          { component: <LinkedCompaniesCard companies={associatedCompanies || []} /> },
          { component: <LinkedDealsCard deals={associatedDeals} /> },
          { component: <LinkedTicketsCard tickets={associatedTickets} /> },
        ]}
        linkedCardsGridColumns={{ xs: '1fr' }}
      />
    );
  
    // Preparar contenido del Tab 1 (Información Avanzada)
    const tab1Content = (
      <>
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
          getCompanyInitials={getCompanyInitials}
          sortField={companySortField}
          sortOrder={companySortOrder}
          onSort={handleSortCompanies}
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
              companyId:
                contact?.Company?.id?.toString() ||
                contact?.Companies?.[0]?.id?.toString() ||
                "",
              contactId: id?.toString() || "",
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
              companyId:
                contact?.Company?.id?.toString() ||
                contact?.Companies?.[0]?.id?.toString() ||
                "",
              contactId: id?.toString() || "",
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
      </>
    );
  
    // Preparar contenido del Tab 2 (Actividades)
    const tab2Content = (
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
        emptyMessage="No hay actividades registradas para este contacto. Crea una nueva actividad para comenzar."
      />
    );

    return (
      <>
        <DetailPageLayout
          pageTitle="Información del contacto"
          breadcrumbItems={[
            { label: 'Contactos', path: '/contacts' },
            { label: `${contact?.firstName || ''} ${contact?.lastName || ''}` },
          ]}
          onBack={() => navigate('/contacts')}
          avatarIcon={<FontAwesomeIcon icon={faUserTie} style={{ fontSize: 60, color: 'white' }} />}
          avatarBgColor="#0d9394"
          entityName={`${contact?.firstName || ''} ${contact?.lastName || ''}`}
          entitySubtitle={contact?.jobTitle || contact?.email || 'Sin información adicional'}
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
              <DialogTitle>Editar Contacto</DialogTitle>
              <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Nombre"
                      value={editFormData.firstName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, firstName: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{
                        flex: 1,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                    <TextField
                      label="Apellido"
                      value={editFormData.lastName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, lastName: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                      required
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
                      label="Móvil"
                      value={editFormData.mobile}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, mobile: e.target.value })
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
                    label="Cargo"
                    value={editFormData.jobTitle}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, jobTitle: e.target.value })
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
                      label="Ciudad"
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
                      label="Estado/Provincia"
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
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="País"
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
                    <TextField
                      label="Código Postal"
                      value={editFormData.postalCode}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, postalCode: e.target.value })
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
                    label="Sitio Web"
                    value={editFormData.website}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, website: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="LinkedIn"
                      value={editFormData.linkedin}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, linkedin: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                      placeholder="https://www.linkedin.com/in/..."
                      sx={{
                        flex: 1,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                    <TextField
                      label="Facebook"
                      value={editFormData.facebook}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, facebook: e.target.value })
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
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Twitter"
                      value={editFormData.twitter}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, twitter: e.target.value })
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
                      label="GitHub"
                      value={editFormData.github}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, github: e.target.value })
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
                    label="YouTube"
                    value={editFormData.youtube}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, youtube: e.target.value })
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
                <Button onClick={handleCloseEditDialog} disabled={savingEdit}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitEdit} 
                  variant="contained"
                  disabled={savingEdit || !editFormData.firstName.trim() || !editFormData.lastName.trim()}
                  sx={{
                    bgcolor: taxiMonterricoColors.green,
                    "&:hover": {
                      bgcolor: taxiMonterricoColors.greenDark,
                    },
                  }}
                >
                  {savingEdit ? "Guardando..." : "Guardar"}
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

      {/* Modal de crear nota */}
      <NoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        onSave={handleNoteSave}
        relatedEntities={{
          companies: associatedCompanies || [],
          contacts: contact ? [contact] : [],
          deals: associatedDeals || [],
          tickets: associatedTickets || [],
        }}
      />

      {/* Modal de Email con Gmail API */}
      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        recipientEmail={contact?.email || ""}
        recipientName={
          contact ? `${contact.firstName} ${contact.lastName}` : undefined
        }
        onSend={handleSendEmail}
      />

      {/* Modal de crear llamada */}
      <CallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
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
        relatedEntityIds={{
          companyId: associatedCompanies && associatedCompanies.length > 0 
            ? associatedCompanies[0].id 
            : undefined,
        }}
      />

      {/* Modal de crear tarea/reunión */}
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        taskType={taskType}
        onSave={(newTask) => {
          const taskAsActivity = {
            id: newTask.id,
            type: newTask.type,
            subject: newTask.title,
            description: newTask.description,
            dueDate: newTask.dueDate,
            createdAt: newTask.createdAt,
            User: newTask.CreatedBy || newTask.AssignedTo,
            isTask: true,
            status: newTask.status,
            priority: newTask.priority,
            contactId: newTask.contactId,
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
      />

      {/* Diálogo para agregar empresa */}
      <Dialog
        open={addCompanyOpen}
        onClose={() => {
          setAddCompanyOpen(false);
          setCompanyDialogTab("create");
          setSelectedExistingCompanies([]);
          setExistingCompaniesSearch("");
          setCompanyFormData({
            name: "",
            domain: "",
            phone: "",
            companyname: "",
            lifecycleStage: "lead",
            ruc: "",
            address: "",
            city: "",
            state: "",
            country: "",
          });
          setRucError("");
        }}
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
        <DialogContent sx={{ pt: 1 }}>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={companyDialogTab === "create" ? 0 : 1}
              onChange={(e, newValue) =>
                setCompanyDialogTab(newValue === 0 ? "create" : "existing")
              }
            >
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {companyDialogTab === "create" && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              {/* RUC y Tipo de Contribuyente / Industria en la misma fila */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="RUC"
                  value={companyFormData.ruc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Solo números
                    const limitedValue = value.slice(0, 11);
                    setCompanyFormData({
                      ...companyFormData,
                      ruc: limitedValue,
                    });
                    setRucError("");
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
                          disabled={
                            loadingRuc ||
                            !companyFormData.ruc ||
                            companyFormData.ruc.length < 11
                          }
                          sx={{
                            color: taxiMonterricoColors.green,
                            "&:hover": {
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                            "&.Mui-disabled": {
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
                    flex: "2 1 0%",
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  label="Razón social"
                  value={companyFormData.companyname}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      companyname: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: "3 1 0%",
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
              <TextField
                label="Nombre"
                value={companyFormData.name}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    name: e.target.value,
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
                label="Dominio"
                value={companyFormData.domain}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    domain: e.target.value,
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
                label="Teléfono"
                value={companyFormData.phone}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    phone: e.target.value,
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
                value={companyFormData.address}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    address: e.target.value,
                  })
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
                  value={companyFormData.city}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
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
                  value={companyFormData.state}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
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
                  value={companyFormData.country}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
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
              <TextField
                select
                label="Etapa del Ciclo de Vida"
                value={companyFormData.lifecycleStage}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
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
            </Box>
          )}

          {companyDialogTab === "existing" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              {/* Lista de empresas */}
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {loadingAllCompanies ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  allCompanies
                    .filter((company: any) => {
                      const isAlreadyAdded = (associatedCompanies || []).some(
                        (c: any) => c.id === company.id
                      );
                      if (isAlreadyAdded) return false;
                      if (!existingCompaniesSearch.trim()) return true;
                      const searchLower = existingCompaniesSearch.toLowerCase();
                      return (
                        company.name?.toLowerCase().includes(searchLower) ||
                        company.domain?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((company: any) => (
                      <ListItem
                        key={company.id}
                        disablePadding
                        sx={{
                          mb: 0.5,
                          borderRadius: 1,
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemButton
                          onClick={() => {
                            if (
                              selectedExistingCompanies.some(
                                (c: any) => c.id === company.id
                              )
                            ) {
                              setSelectedExistingCompanies(
                                selectedExistingCompanies.filter(
                                  (c: any) => c.id !== company.id
                                )
                              );
                            } else {
                              setSelectedExistingCompanies([
                                ...selectedExistingCompanies,
                                company,
                              ]);
                            }
                          }}
                          sx={{
                            py: 1,
                            px: 2,
                            borderRadius: 1,
                            "&:hover": {
                              bgcolor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Checkbox
                            checked={selectedExistingCompanies.some(
                              (c: any) => c.id === company.id
                            )}
                            sx={{
                              color: theme.palette.text.secondary,
                              "&.Mui-checked": {
                                color: taxiMonterricoColors.green,
                              },
                            }}
                          />
                          <ListItemText
                            primary={company.name}
                            secondary={company.domain}
                            sx={{
                              "& .MuiListItemText-primary": {
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                              },
                              "& .MuiListItemText-secondary": {
                                fontSize: "0.75rem",
                                color: theme.palette.text.secondary,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setAddCompanyOpen(false);
              setCompanyDialogTab("create");
              setSelectedExistingCompanies([]);
              setExistingCompaniesSearch("");
              setCompanyFormData({
                name: "",
                domain: "",
                phone: "",
                companyname: "",
                lifecycleStage: "lead",
                ruc: "",
                address: "",
                city: "",
                state: "",
                country: "",
              });
              setRucError("");
            }}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
            }}
          >
            Cancelar
          </Button>
          {companyDialogTab === "create" ? (
            <Button
              onClick={handleAddCompany}
              variant="contained"
              sx={{
                textTransform: "none",
                bgcolor: taxiMonterricoColors.green,
                "&:hover": {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
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
                textTransform: "none",
                bgcolor: taxiMonterricoColors.green,
                "&:hover": {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
                "&.Mui-disabled": {
                  bgcolor: theme.palette.action.disabledBackground,
                },
              }}
            >
              Agregar ({selectedExistingCompanies.length})
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar empresa */}
      <Dialog
        open={addCompanyOpen}
        onClose={() => {
          setAddCompanyOpen(false);
          setCompanyDialogTab("create");
          setSelectedExistingCompanies([]);
          setExistingCompaniesSearch("");
          setCompanyFormData({
            name: "",
            domain: "",
            phone: "",
            companyname: "",
            lifecycleStage: "lead",
            ruc: "",
            address: "",
            city: "",
            state: "",
            country: "",
          });
          setRucError("");
        }}
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
        <DialogContent sx={{ pt: 1 }}>
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={companyDialogTab === "create" ? 0 : 1}
              onChange={(e, newValue) =>
                setCompanyDialogTab(newValue === 0 ? "create" : "existing")
              }
            >
              <Tab label="Crear nueva" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {companyDialogTab === "create" && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              {/* RUC y Tipo de Contribuyente / Industria en la misma fila */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="RUC"
                  value={companyFormData.ruc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Solo números
                    const limitedValue = value.slice(0, 11);
                    setCompanyFormData({
                      ...companyFormData,
                      ruc: limitedValue,
                    });
                    setRucError("");
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
                          disabled={
                            loadingRuc ||
                            !companyFormData.ruc ||
                            companyFormData.ruc.length < 11
                          }
                          sx={{
                            color: taxiMonterricoColors.green,
                            "&:hover": {
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                            "&.Mui-disabled": {
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
                    flex: "2 1 0%",
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
                <TextField
                  label="Razón social"
                  value={companyFormData.companyname}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      companyname: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: "3 1 0%",
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
              <TextField
                label="Nombre"
                value={companyFormData.name}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    name: e.target.value,
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
                label="Dominio"
                value={companyFormData.domain}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    domain: e.target.value,
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
                label="Teléfono"
                value={companyFormData.phone}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    phone: e.target.value,
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
                value={companyFormData.address}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    address: e.target.value,
                  })
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
                  value={companyFormData.city}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
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
                  value={companyFormData.state}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
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
                  value={companyFormData.country}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
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
              <TextField
                select
                label="Etapa del Ciclo de Vida"
                value={companyFormData.lifecycleStage}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
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
            </Box>
          )}

          {companyDialogTab === "existing" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              {/* Lista de empresas */}
              <Box
                sx={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background:
                      theme.palette.mode === "dark"
                        ? theme.palette.background.paper
                        : "#f1f1f1",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background:
                      theme.palette.mode === "dark"
                        ? theme.palette.divider
                        : "#888",
                    borderRadius: "4px",
                    "&:hover": {
                      background:
                        theme.palette.mode === "dark"
                          ? theme.palette.text.secondary
                          : "#555",
                    },
                  },
                }}
              >
                {(() => {
                  const associatedCompanyIds = (associatedCompanies || [])
                    .map((c: any) => c && c.id)
                    .filter((id: any) => id !== undefined && id !== null);
                  const filteredCompanies = allCompanies.filter(
                    (company: any) => {
                      if (associatedCompanyIds.includes(company.id))
                        return false;
                      if (!existingCompaniesSearch) return true;
                      const searchLower = existingCompaniesSearch.toLowerCase();
                      return (
                        (company.name &&
                          company.name.toLowerCase().includes(searchLower)) ||
                        (company.domain &&
                          company.domain.toLowerCase().includes(searchLower))
                      );
                    }
                  );

                  if (filteredCompanies.length === 0) {
                    return (
                      <Box sx={{ p: 2, textAlign: "center" }}>
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
                        display: "flex",
                        alignItems: "center",
                        p: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Checkbox
                        checked={selectedExistingCompanies.includes(company.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExistingCompanies([
                              ...selectedExistingCompanies,
                              company.id,
                            ]);
                          } else {
                            setSelectedExistingCompanies(
                              selectedExistingCompanies.filter(
                                (id) => id !== company.id
                              )
                            );
                          }
                        }}
                        sx={{
                          color: taxiMonterricoColors.green,
                          "&.Mui-checked": {
                            color: taxiMonterricoColors.green,
                          },
                        }}
                      />
                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                          }}
                        >
                          {company.name}
                        </Typography>
                        {company.domain && (
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary }}
                          >
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
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
          }}
        >
          <Button
            onClick={() => {
              setAddCompanyOpen(false);
              setCompanyDialogTab("create");
              setSelectedExistingCompanies([]);
              setExistingCompaniesSearch("");
              setCompanyFormData({
                name: "",
                domain: "",
                phone: "",
                companyname: "",
                lifecycleStage: "lead",
                ruc: "",
                address: "",
                city: "",
                state: "",
                country: "",
              });
              setRucError("");
            }}
            sx={{
              textTransform: "none",
              color: "#757575",
              fontWeight: 500,
              "&:hover": {
                bgcolor: "#f5f5f5",
              },
            }}
          >
            Cancelar
          </Button>
          {companyDialogTab === "create" ? (
            <Button
              onClick={handleAddCompany}
              variant="contained"
              disabled={!companyFormData.name.trim()}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 1.5,
                px: 2.5,
                bgcolor: taxiMonterricoColors.green,
                "&:hover": {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
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
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 1.5,
                px: 2.5,
                bgcolor: taxiMonterricoColors.green,
                "&:hover": {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
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
              value={
                dealFormData.companyId ||
                contact?.Company?.id?.toString() ||
                contact?.Companies?.[0]?.id?.toString() ||
                ""
              }
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
              value={dealFormData.contactId || id?.toString() || ""}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, contactId: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
              {allContacts.map((contactItem) => (
                <MenuItem
                  key={contactItem.id}
                  value={contactItem.id.toString()}
                >
                  {contactItem.firstName} {contactItem.lastName}
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

      {/* Dialog para ver detalles de actividad expandida */}
      <ActivityDetailDialog
        activity={expandedActivity}
        open={!!expandedActivity}
        onClose={() => setExpandedActivity(null)}
        getActivityTypeLabel={getActivityTypeLabel}
      />

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
            {companyToRemove?.name} ya no se asociará con {contact?.firstName} {contact?.lastName}.
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
            {dealToRemove?.name} ya no se asociará con {contact?.firstName} {contact?.lastName}.
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
            {ticketToRemove?.name} ya no se asociará con {contact?.firstName} {contact?.lastName}.
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

export default ContactDetail;
