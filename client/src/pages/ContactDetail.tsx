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
  useTheme,
} from "@mui/material";
import {
  Email,
  Close,
} from "@mui/icons-material";
import api from "../config/api";
import EmailComposer from "../components/EmailComposer";
import { taxiMonterricoColors, hexToRgba } from "../theme/colors";
import { pageStyles } from "../theme/styles";
import {
  FullCompaniesTableCard,
  FullDealsTableCard,
  FullContactsTableCard,
  FullActivitiesTableCard,
  ActivityDetailDialog,
  ActivitiesTabContent,
} from "../components/DetailCards";
import { NoteModal, CallModal, TaskModal, MeetingModal, DealModal, CompanyModal, ContactModal } from "../components/ActivityModals";
import DetailPageLayout from "../components/Layout/DetailPageLayout";
import { FormDrawer } from "../components/FormDrawer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faUserTie } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useTaskCompleteFlow } from "../hooks/useTaskCompleteFlow";

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
  updatedAt?: string;
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
  Contacts?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
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
  const [associatedContacts, setAssociatedContacts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Estados para búsquedas y filtros
  const [activitySearch, setActivitySearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
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
  const [contactSortOrder, setContactSortOrder] = useState<'asc' | 'desc'>('asc');
  const [contactSortField, setContactSortField] = useState<'firstName' | 'email' | 'phone'>('firstName');
  
  // Estados para diálogos de eliminación
  const [removeCompanyDialogOpen, setRemoveCompanyDialogOpen] = useState(false);
  const [removeContactDialogOpen, setRemoveContactDialogOpen] = useState(false);
  const [removeDealDialogOpen, setRemoveDealDialogOpen] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState<{ id: number; name: string } | null>(null);
  const [contactToRemove, setContactToRemove] = useState<{ id: number; name: string } | null>(null);
  const [dealToRemove, setDealToRemove] = useState<{ id: number; name: string } | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<any | null>(null);
  const [deletingActivity, setDeletingActivity] = useState(false);

  // Estados para diálogos
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [dealDialogTab, setDealDialogTab] = useState<"create" | "existing">("create");
  const [, setCreateActivityMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [companyDialogTab, setCompanyDialogTab] = useState<
    "create" | "existing"
  >("create");
  const [contactDialogTab, setContactDialogTab] = useState<
    "create" | "existing"
  >("create");

  // Estados para asociaciones en nota
  const [, setEmailValue] = useState("");
  const [, setPhoneValue] = useState("");
  const [, setCompanyValue] = useState("");

  // Estados para diálogos de acciones
  const [noteOpen, setNoteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
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
      
      // Actualizar contactos relacionados
      const contacts =
        response.data.Contacts && Array.isArray(response.data.Contacts)
          ? response.data.Contacts
          : [];
      setAssociatedContacts(contacts);
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
        
        // Actualizar contactos relacionados
        const contacts =
          updatedContact?.Contacts && Array.isArray(updatedContact.Contacts)
            ? updatedContact.Contacts
            : [];
        setAssociatedContacts(contacts);
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

      // Convertir tareas a formato de actividad: type "task" para que en lista se muestre "Tarea"; taskSubType para el modal
      const tasksAsActivities = tasksData.map((task: any) => ({
        id: task.id,
        type: "task",
        taskSubType: task.type || "todo",
        subject: task.title,
        description: task.description,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        User: task.CreatedBy || task.AssignedTo,
        isTask: true,
        status: task.status,
        priority: task.priority,
        companyId: task.companyId,
        contactId: task.contactId,
        dealId: task.dealId,
        Company: task.Company,
        Contact: task.Contact,
        Deal: task.Deal,
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

      // Inicializar estado de actividades completadas (actividades: completed | tareas: status === 'completed')
      const initialCompleted: { [key: number]: boolean } = {};
      allActivities.forEach((activity: any) => {
        const isCompleted = activity.completed === true || (activity.isTask && activity.status === 'completed');
        if (isCompleted) {
          initialCompleted[activity.id] = true;
        }
      });
      setCompletedActivities(initialCompleted);

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

    } catch (error) {
      console.error("Error fetching associated records:", error);
    }
  }, [id, isRemovingCompany, deduplicateNotes]);

  const handleActivityCreatedOptimistic = useCallback((newActivity: any) => {
    setActivities((prev) => {
      const exists = prev.some((a: any) => a.id === newActivity.id);
      if (exists) return prev;
      return deduplicateNotes([newActivity, ...prev].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return dateB - dateA;
      }));
    });
  }, [deduplicateNotes]);

  const handleDeleteActivityClick = useCallback((activity: any) => {
    setActivityToDelete(activity);
  }, []);

  const handleConfirmDeleteActivity = useCallback(async () => {
    if (!activityToDelete) return;
    setDeletingActivity(true);
    try {
      const isTask = !!(activityToDelete as any).isTask;
      if (isTask) {
        await api.delete(`/tasks/${activityToDelete.id}`);
      } else {
        await api.delete(`/activities/${activityToDelete.id}`);
      }
      setActivities((prev) => prev.filter((a: any) => a.id !== activityToDelete.id));
      setCompletedActivities((prev) => {
        const next = { ...prev };
        delete next[activityToDelete.id];
        return next;
      });
      setActivityToDelete(null);
      setSuccessMessage("Actividad eliminada correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al eliminar:", err);
      setSuccessMessage(err?.response?.data?.error || "Error al eliminar la actividad");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setDeletingActivity(false);
    }
  }, [activityToDelete]);

  const taskCompleteFlow = useTaskCompleteFlow({
    user,
    onRefresh: fetchAssociatedRecords,
    onOpenNewTaskLinkedTo: () => setTaskOpen(true),
    onActivityCreated: handleActivityCreatedOptimistic,
  });
  const { handleToggleComplete, CompleteModalJSX, ActivityModalsJSX, LinkPromptJSX } = taskCompleteFlow;

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
    }
  }, [contact, id, isRemovingCompany, fetchAssociatedRecords]);

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
      firma_contrato: "Firma de Contrato",
      activo: "Activo",
      cierre_perdido: "Cierre Perdido",
      lead_inactivo: "Inactivo",
      cliente_perdido: "Cierre Perdido",
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
      const response = await api.get("/google/auth", {
        params: {
          returnOrigin: window.location.origin,
          returnPath: window.location.pathname || "/dashboard",
        },
      });
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

  const handleOpenCall = () => {
    setCallOpen(true);
  };

  const handleOpenTask = () => {
    setTaskOpen(true);
  };


  const handleOpenMeeting = () => {
    setMeetingOpen(true);
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

  const handleSortContacts = (field: "firstName" | "email" | "phone") => {
    const isAsc = contactSortField === field && contactSortOrder === "asc";
    setContactSortOrder(isAsc ? "desc" : "asc");
    setContactSortField(field);
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copiado al portapapeles");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleRemoveContactClick = (contactId: number, contactName: string) => {
    setContactToRemove({ id: contactId, name: contactName });
    setRemoveContactDialogOpen(true);
  };

  const handleConfirmRemoveContact = async () => {
    if (!id || !contactToRemove) return;
    try {
      await api.delete(`/contacts/${id}/contacts/${contactToRemove.id}`);
      setAssociatedContacts((prevContacts) =>
        prevContacts.filter((contact: any) => contact.id !== contactToRemove.id)
      );
      await fetchContact();
      setRemoveContactDialogOpen(false);
      setContactToRemove(null);
    } catch (error: any) {
      console.error("Error removing contact:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el contacto";
      alert(errorMessage);
    }
  };

  // En lista: cada tipo muestra su nombre; meeting → Reunión, task/todo/other → Tarea
  const getActivityTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case "note":
        return "Nota";
      case "email":
        return "Correo";
      case "call":
        return "Llamada";
      case "meeting":
        return "Reunión";
      case "task":
      case "todo":
      case "other":
        return "Tarea";
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
          theme.palette.mode === "dark" ? hexToRgba(taxiMonterricoColors.error, 0.15) : taxiMonterricoColors.errorLight,
      };
    } else if (diffDays <= 3) {
      // Por vencer (1-3 días) - amarillo/naranja claro
      return {
        bgcolor:
          theme.palette.mode === "dark" ? hexToRgba(taxiMonterricoColors.orangeDark, 0.15) : taxiMonterricoColors.warningLight,
      };
    } else {
      // A tiempo - verde claro
      return {
        bgcolor:
          theme.palette.mode === "dark" ? hexToRgba(taxiMonterricoColors.greenLight, 0.15) : taxiMonterricoColors.successLight,
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
      await api.delete(`/deals/${dealToRemove.id}/contacts/${id}`);
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
      {
        label: 'Fecha de creación',
        value: contact?.createdAt
          ? `${new Date(contact.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })} ${new Date(contact.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : '--',
        show: true,
      },
      {
        label: 'Última actividad',
        value: contact?.updatedAt
          ? new Date(contact.updatedAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '--',
        show: true,
      },
    ];
  
    // Preparar botones de actividades
    const activityButtons = [
      {
        icon: ['fas', 'note-sticky'],
        label: 'Nota',
        onClick: () => handleOpenNote(),
      },
      {
        icon: faEnvelope,
        label: 'Correo',
        onClick: () => handleOpenEmail(),
      },
      {
        icon: ['fas', 'phone'],
        label: 'Llamada',
        onClick: () => handleOpenCall(),
      },
      {
        icon: ['fas', 'thumbtack'],
        label: 'Tarea',
        onClick: () => handleOpenTask(),
      },
      {
        icon: ['fas', 'calendar-week'],
        label: 'Reunión',
        onClick: () => handleOpenMeeting(),
      },
    ];
  
    // Preparar contenido del Tab 0 (Información Avanzada)
    const tab1Content = (
      <>
        <FullActivitiesTableCard
          activities={activities}
          searchValue={activitySearch}
          onSearchChange={setActivitySearch}
          onCreateActivity={(type) => handleCreateActivity(type as string)}
          onActivityClick={setExpandedActivity}
          onToggleComplete={(activity, completed) => {
            handleToggleComplete(activity, completed, setCompletedActivities);
          }}
          completedActivities={completedActivities}
          getActivityTypeLabel={getActivityTypeLabel}
        />

        <FullContactsTableCard
          contacts={associatedContacts || []}
          searchValue={contactSearch}
          onSearchChange={setContactSearch}
          onAddExisting={() => {
            setContactDialogTab("existing");
            setAddContactOpen(true);
          }}
          onAddNew={() => {
            setContactDialogTab("create");
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
        onToggleComplete={(activity, completed) => {
          handleToggleComplete(activity, completed, setCompletedActivities);
        }}
        onDelete={handleDeleteActivityClick}
        completedActivities={completedActivities}
        getActivityTypeLabel={getActivityTypeLabel}
        getActivityStatusColor={getActivityStatusColor}
        emptyMessage="No hay actividades registradas para este contacto. Crea una nueva actividad para comenzar."
      />
    );

    return (
      <>
        <DetailPageLayout
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
          tab0Content={tab1Content}
          tab1Content={tab2Content}
          loading={loading}
          editDialog={
            <FormDrawer
              open={editDialogOpen}
              onClose={handleCloseEditDialog}
              title="Editar Contacto"
              onSubmit={handleSubmitEdit}
              submitLabel={savingEdit ? "Guardando..." : "Guardar"}
              submitDisabled={savingEdit || !editFormData.firstName.trim() || !editFormData.lastName.trim()}
              variant="panel"
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {errorMessage && (
                  <Alert
                    severity="error"
                    onClose={() => setErrorMessage("")}
                    sx={{ mb: 2 }}
                  >
                    {errorMessage}
                  </Alert>
                )}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    columnGap: 4,
                    rowGap: 1,
                    alignItems: 'start',
                  }}
                >
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Nombre <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    Apellido <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
                  </Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      required
                      fullWidth
                      placeholder="Nombre"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      required
                      fullWidth
                      placeholder="Apellido"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>Correo</Typography>
                  <Box sx={{ minWidth: 0, gridColumn: '1 / -1' }}>
                    <TextField
                      size="small"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      fullWidth
                      placeholder="Correo"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Teléfono</Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Móvil</Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      fullWidth
                      placeholder="Teléfono"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      fullWidth
                      placeholder="Móvil"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>Cargo</Typography>
                  <Box sx={{ minWidth: 0, gridColumn: '1 / -1' }}>
                    <TextField
                      size="small"
                      value={editFormData.jobTitle}
                      onChange={(e) => setEditFormData({ ...editFormData, jobTitle: e.target.value })}
                      fullWidth
                      placeholder="Cargo"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>Dirección</Typography>
                  <Box sx={{ minWidth: 0, gridColumn: '1 / -1' }}>
                    <TextField
                      size="small"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      multiline
                      rows={2}
                      fullWidth
                      placeholder="Dirección"
                      inputProps={{ style: { fontSize: '1rem' } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Ciudad</Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Estado/Provincia</Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      fullWidth
                      placeholder="Ciudad"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      fullWidth
                      placeholder="Estado/Provincia"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>País</Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Código Postal</Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                      fullWidth
                      placeholder="País"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.postalCode}
                      onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                      fullWidth
                      placeholder="Código Postal"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>Sitio Web</Typography>
                  <Box sx={{ minWidth: 0, gridColumn: '1 / -1' }}>
                    <TextField
                      size="small"
                      value={editFormData.website}
                      onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                      fullWidth
                      placeholder="Sitio Web"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>LinkedIn</Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Facebook</Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.linkedin}
                      onChange={(e) => setEditFormData({ ...editFormData, linkedin: e.target.value })}
                      fullWidth
                      placeholder="https://www.linkedin.com/in/..."
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.facebook}
                      onChange={(e) => setEditFormData({ ...editFormData, facebook: e.target.value })}
                      fullWidth
                      placeholder="Facebook"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Twitter</Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>GitHub</Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.twitter}
                      onChange={(e) => setEditFormData({ ...editFormData, twitter: e.target.value })}
                      fullWidth
                      placeholder="Twitter"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <TextField
                      size="small"
                      value={editFormData.github}
                      onChange={(e) => setEditFormData({ ...editFormData, github: e.target.value })}
                      fullWidth
                      placeholder="GitHub"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>YouTube</Typography>
                  <Box sx={{ minWidth: 0, gridColumn: '1 / -1' }}>
                    <TextField
                      size="small"
                      value={editFormData.youtube}
                      onChange={(e) => setEditFormData({ ...editFormData, youtube: e.target.value })}
                      fullWidth
                      placeholder="YouTube"
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3, gridColumn: '1 / -1' }}>Etapa del Ciclo de Vida</Typography>
                  <Box sx={{ minWidth: 0, gridColumn: '1 / -1' }}>
                    <TextField
                      select
                      size="small"
                      value={editFormData.lifecycleStage}
                      onChange={(e) => setEditFormData({ ...editFormData, lifecycleStage: e.target.value })}
                      fullWidth
                      inputProps={{ style: { fontSize: '1rem' } }}
                      InputProps={{ sx: { '& input': { py: 1.05 } } }}
                      SelectProps={{
                        MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
                      }}
                    >
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
                      <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
                      <MenuItem value="lead_inactivo">Inactivo</MenuItem>
                    </TextField>
                  </Box>
                </Box>
              </Box>
            </FormDrawer>
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
          contacts: contact ? [contact, ...(associatedContacts || [])] : (associatedContacts || []),
          deals: associatedDeals || [],
          // tickets: associatedTickets || [],
        }}
      />

      {/* Modal de Email - solo registra actividad (sin envío por Gmail) */}
      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        recipientEmail={contact?.email || ""}
        recipientName={
          contact ? `${contact.firstName} ${contact.lastName}` : undefined
        }
        registerOnly
        contactId={id ? parseInt(id, 10) : undefined}
        companyIds={
          contact?.Companies && Array.isArray(contact.Companies)
            ? contact.Companies.map((c: any) => c.id)
            : contact?.Company
            ? [contact.Company.id]
            : undefined
        }
        onSave={(newActivityOrArray) => {
          const activitiesToAdd = Array.isArray(newActivityOrArray) ? newActivityOrArray : [newActivityOrArray];
          setActivities((prev) => {
            const existingIds = new Set(prev.map((a: any) => a.id));
            const toAdd = activitiesToAdd.filter((a: any) => !existingIds.has(a.id));
            if (toAdd.length === 0) return prev;
            return [...toAdd, ...prev].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA;
            });
          });
          fetchAssociatedRecords();
        }}
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

      {/* Modal de crear/editar tarea */}
      <TaskModal
        open={taskOpen || (!!expandedActivity && !!(expandedActivity as any)?.isTask)}
        onClose={() => {
          setTaskOpen(false);
          setExpandedActivity(null);
        }}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        activity={(expandedActivity as any)?.isTask ? expandedActivity : undefined}
        onSave={(newTask: any) => {
          const taskAsActivity = {
            id: newTask.id,
            type: "task",
            taskSubType: newTask.type || "todo",
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
          setActivities((prevActivities) => {
            const exists = prevActivities.some((a: any) => a.id === newTask.id);
            if (exists) {
              return prevActivities.map((a: any) => (a.id === newTask.id ? { ...a, ...taskAsActivity } : a));
            }
            return [taskAsActivity, ...prevActivities].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
              const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
              return dateB - dateA;
            });
          });
          setExpandedActivity(null);
          fetchAssociatedRecords();
        }}
      />

      {/* Modal de crear reunión */}
      <MeetingModal
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        onSave={(newMeeting) => {
          const meetingAsActivity = {
            id: newMeeting.id,
            type: "meeting",
            subject: newMeeting.title,
            description: newMeeting.description,
            dueDate: newMeeting.dueDate,
            createdAt: newMeeting.createdAt,
            User: newMeeting.CreatedBy || newMeeting.AssignedTo,
            contactId: newMeeting.contactId,
          };
          // Agregar la actividad inmediatamente al estado
          setActivities((prevActivities) => {
            const exists = prevActivities.some((a: any) => a.id === newMeeting.id);
            if (exists) return prevActivities;
            return [meetingAsActivity, ...prevActivities].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.dueDate || 0).getTime();
              const dateB = new Date(b.createdAt || b.dueDate || 0).getTime();
              return dateB - dateA;
            });
          });
          fetchAssociatedRecords(); // Actualizar actividades
        }}
      />

      {/* Modal para agregar/crear empresas relacionadas */}
      <CompanyModal
        open={addCompanyOpen}
        onClose={() => setAddCompanyOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        initialTab={companyDialogTab}
        excludedCompanyIds={(associatedCompanies || []).map((c: any) => c.id)}
        useDrawerForCreate
        onSave={async () => {
          await fetchAssociatedRecords();
          setAddCompanyOpen(false);
        }}
      />

      {/* Modal para agregar/crear contactos relacionados */}
      <ContactModal
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        initialTab={contactDialogTab}
        defaultCompanyId={contact?.Company?.id || contact?.Companies?.[0]?.id}
        excludedContactIds={(associatedContacts || []).map((c: any) => c.id)}
        associatedContacts={associatedContacts || []}
        useDrawerForCreate
        onSave={async () => {
          await fetchAssociatedRecords();
          setAddContactOpen(false);
          setSuccessMessage("Contacto agregado exitosamente");
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />

      {/* Modal para agregar/crear negocios relacionados */}
      <DealModal
        open={addDealOpen}
        onClose={() => setAddDealOpen(false)}
        entityType="contact"
        entityId={id || ""}
        entityName={contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email || "Sin nombre" : "Sin nombre"}
        user={user}
        initialTab={dealDialogTab}
        defaultCompanyId={contact?.Company?.id || contact?.Companies?.[0]?.id}
        defaultContactId={contact?.id}
        excludedDealIds={(associatedDeals || []).map((d: any) => d.id)}
        getStageLabel={getStageLabel}
        useDrawerForCreate
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
        <DialogTitle sx={{ color: '#4BB280', fontWeight: 600 }}>Crear Ticket</DialogTitle>
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

      {/* Dialog para ver detalles de actividad expandida (solo no-tareas) */}
      <ActivityDetailDialog
        activity={expandedActivity && !(expandedActivity as any)?.isTask ? expandedActivity : null}
        open={!!expandedActivity && !(expandedActivity as any)?.isTask}
        onClose={() => setExpandedActivity(null)}
        getActivityTypeLabel={getActivityTypeLabel}
      />

      {/* Dialog para confirmar eliminación de actividad */}
      <Dialog
        open={!!activityToDelete}
        onClose={() => !deletingActivity && setActivityToDelete(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Eliminar actividad
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            ¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={() => setActivityToDelete(null)}
            disabled={deletingActivity}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDeleteActivity}
            variant="contained"
            disabled={deletingActivity}
            sx={pageStyles.deleteButton}
          >
            {deletingActivity ? "Eliminando..." : "Eliminar"}
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
        disableRestoreFocus={true}
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
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={() => {
              setRemoveCompanyDialogOpen(false);
              setCompanyToRemove(null);
            }}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemoveCompany}
            variant="contained"
            sx={pageStyles.deleteButton}
          >
            Eliminar asociación
          </Button>
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
        disableRestoreFocus={true}
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
            {contactToRemove?.name} ya no se asociará con {contact?.firstName} {contact?.lastName}.
          </Typography>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={() => {
              setRemoveContactDialogOpen(false);
              setContactToRemove(null);
            }}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemoveContact}
            variant="contained"
            sx={pageStyles.deleteButton}
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
        disableRestoreFocus={true}
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
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={() => {
              setRemoveDealDialogOpen(false);
              setDealToRemove(null);
            }}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRemoveDeal}
            variant="contained"
            sx={pageStyles.deleteButton}
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
      </Dialog> */}

      {/* Flujo de completar tarea */}
      {CompleteModalJSX}
      {ActivityModalsJSX}
      {LinkPromptJSX}
    </>
  );
};

export default ContactDetail;
