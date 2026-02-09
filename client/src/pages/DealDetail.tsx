import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { taxiMonterricoColors } from "../theme/colors";
import { pageStyles } from "../theme/styles";
import api from "../config/api";
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
import { NoteModal, CallModal, TaskModal, MeetingModal, DealModal, CompanyModal, ContactModal } from "../components/ActivityModals";
import type { GeneralInfoCard } from "../components/DetailCards";
import { useAuth } from "../context/AuthContext";
import DetailPageLayout from "../components/Layout/DetailPageLayout";
import { FormDrawer } from "../components/FormDrawer";
import { DealFormContent, getInitialDealFormData, type DealFormData } from "../components/DealFormContent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faClock } from "@fortawesome/free-regular-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";
import { faUser as faUserRegular } from "@fortawesome/free-regular-svg-icons";

library.add(far);
library.add(fas);

interface DealDetailData {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  priority?: "baja" | "media" | "alta";
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
  const [, setActivityLogs] = useState<any[]>([]);
  const [, setLoadingLogs] = useState(false);
  const [dealContacts, setDealContacts] = useState<any[]>([]);
  const [dealCompanies, setDealCompanies] = useState<any[]>([]);
  const [dealDeals, setDealDeals] = useState<any[]>([]);
  const [removeContactDialogOpen, setRemoveContactDialogOpen] = useState(false);
  const [contactToRemove, setContactToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [removeDealDialogOpen, setRemoveDealDialogOpen] = useState(false);
  const [dealToRemove, setDealToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const dealFormDataRef = useRef<{ formData: DealFormData; setFormData: React.Dispatch<React.SetStateAction<DealFormData>> }>({
    formData: getInitialDealFormData(null),
    setFormData: () => {},
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [companySortField, setCompanySortField] = useState<
    "name" | "domain" | "phone"
  >("name");
  const [companySortOrder, setCompanySortOrder] = useState<"asc" | "desc">(
    "asc"
  );
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [companyDialogTab, setCompanyDialogTab] = useState<
    "create" | "existing"
  >("create");
  // Estados para agregar negocios relacionados
  const [addDealDialogOpen, setAddDealDialogOpen] = useState(false);
  const [dealDialogTab, setDealDialogTab] = useState<"create" | "existing">(
    "create"
  );
  const [contactDialogTab, setContactDialogTab] = useState<
    "create" | "existing"
  >("create");
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Estados para búsqueda asíncrona de empresas
  const [companySearch, setCompanySearch] = useState("");
  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Estados para búsqueda de contactos (filtrado local)
  const [contactSearchInput, setContactSearchInput] = useState("");

  // Función para ordenar empresas
  const handleSortCompanies = (field: "name" | "domain" | "phone") => {
    const isAsc = companySortField === field && companySortOrder === "asc";
    setCompanySortOrder(isAsc ? "desc" : "asc");
    setCompanySortField(field);
  };

  // Estados para ordenar negocios
  const [dealSortField, setDealSortField] = useState<
    "name" | "amount" | "closeDate" | "stage" | undefined
  >(undefined);
  const [dealSortOrder, setDealSortOrder] = useState<"asc" | "desc">("asc");

  // Función para ordenar negocios
  const handleSortDeals = (
    field: "name" | "amount" | "closeDate" | "stage"
  ) => {
    const isAsc = dealSortField === field && dealSortOrder === "asc";
    setDealSortOrder(isAsc ? "desc" : "asc");
    setDealSortField(field);
  };

  const [expandedActivity, setExpandedActivity] = useState<any | null>(null);
  const [completedActivities, setCompletedActivities] = useState<{
    [key: number]: boolean;
  }>({});
  const [, setCreateActivityMenuAnchor] = useState<null | HTMLElement>(null);

  // Función para copiar al portapapeles
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
      // Usar la relación muchos a muchos (Contacts) si existe, sino usar el contacto principal (Contact) como fallback
      if (response.data.Contacts && Array.isArray(response.data.Contacts) && response.data.Contacts.length > 0) {
        // Usar la lista de Contacts si tiene elementos
        setDealContacts(response.data.Contacts);
      } else if (response.data.Contact) {
        // Si no hay contactos en la relación muchos a muchos, usar el contacto principal como fallback
        setDealContacts([response.data.Contact]);
      } else {
        // Si no hay contactos en ninguna relación, dejar el array vacío
        setDealContacts([]);
      }

      // Obtener todas las empresas relacionadas al deal (relación muchos a muchos)
      // Usar la relación muchos a muchos (Companies) si existe, sino usar la empresa principal (Company) como fallback
      if (response.data.Companies && Array.isArray(response.data.Companies) && response.data.Companies.length > 0) {
        // Usar la lista de Companies si tiene elementos
        setDealCompanies(response.data.Companies);
      } else if (response.data.Company) {
        // Si no hay empresas en la relación muchos a muchos, usar la empresa principal como fallback
        setDealCompanies([response.data.Company]);
      } else {
        // Si no hay empresas en ninguna relación, dejar el array vacío
        setDealCompanies([]);
      }

      // Obtener todos los negocios relacionados al deal (relación muchos a muchos)
      if (response.data.Deals && Array.isArray(response.data.Deals)) {
        setDealDeals(response.data.Deals);
      } else {
        setDealDeals([]);
      }
    } catch (error: any) {
      console.error("Error fetching deal:", error);
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

  // Función helper para deduplicar notas con el mismo contenido y timestamp similar
  const deduplicateNotes = useCallback((activities: any[]) => {
    const noteGroups = new Map<string, any[]>();
    const otherActivities: any[] = [];

    activities.forEach((activity) => {
      // Solo deduplicar notas (type === 'note') que tengan dealId
      if (activity.type === 'note' && activity.dealId) {
        // Crear una clave única basada en contenido y timestamp
        const timestamp = new Date(activity.createdAt || 0).getTime();
        const timeWindow = Math.floor(timestamp / 5000) * 5000; // Agrupar por ventanas de 5 segundos
        const key = `${activity.description || ''}|${activity.subject || ''}|${activity.userId || ''}|${activity.dealId}|${timeWindow}`;
        
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

  const fetchActivities = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get("/activities", {
        params: { dealId: id },
      });
      const activitiesData = response.data.activities || response.data || [];

      // Filtrar solo actividades que realmente pertenecen a este negocio
      const dealIdNum = parseInt(id, 10);
      const filteredActivities = activitiesData.filter((activity: any) => {
        return activity.dealId === dealIdNum || activity.dealId === id;
      });

      // Obtener tareas asociadas
      const tasksResponse = await api.get("/tasks", {
        params: { dealId: id },
      });
      const tasksData = tasksResponse.data.tasks || tasksResponse.data || [];

      // Filtrar solo tareas que realmente pertenecen a este negocio
      const filteredTasks = tasksData.filter((task: any) => {
        return task.dealId === dealIdNum || task.dealId === id;
      });

      const tasksAsActivities = filteredTasks.map((task: any) => ({
        id: task.id,
        type: "task",
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

      const allActivities = [...filteredActivities, ...tasksAsActivities].sort(
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
    } catch (error) {
      console.error("Error fetching activities:", error);
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

  const fetchActivityLogs = useCallback(async () => {
    if (!id) return;
    setLoadingLogs(true);
    try {
      // Obtener actividades y cambios del deal
      const [activitiesResponse, dealResponse] = await Promise.all([
        api.get("/activities", { params: { dealId: id } }),
        api.get(`/deals/${id}`),
      ]);

      const activities =
        activitiesResponse.data.activities || activitiesResponse.data || [];
      const dealData = dealResponse.data;

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

      // Agregar cambios en el deal si hay updatedAt
      if (dealData.updatedAt && dealData.createdAt !== dealData.updatedAt) {
        logs.push({
          id: `deal-update-${dealData.id}`,
          type: "deal",
          action: "updated",
          description: "Información del negocio actualizada",
          user: dealData.Owner,
          timestamp: dealData.updatedAt,
          iconType: "deal",
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
    if (id) {
      fetchDeal();
      fetchActivities();
    }
  }, [id, fetchDeal, fetchActivities]);

  useEffect(() => {
    if (id) {
      fetchActivityLogs();
    }
  }, [id, fetchActivityLogs]);

  const fetchAllCompanies = async () => {
    try {
      const response = await api.get("/companies", { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
      setCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching all companies:", error);
    }
  };

  // Cargar contactos al inicio
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get("/contacts", { params: { limit: 1000 } });
        setContacts(response.data.contacts || response.data || []);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, []);

  // Función para buscar empresas de forma asíncrona
  const searchCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCompanyOptions([]);
      return;
    }
    
    try {
      setLoadingCompanies(true);
      const response = await api.get("/companies", {
        params: {
          search: searchTerm,
          limit: 20,
        },
      });
      setCompanyOptions(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error searching companies:", error);
      setCompanyOptions([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // Debounce para búsqueda de empresas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (companySearch) {
        searchCompanies(companySearch);
      } else {
        setCompanyOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [companySearch, searchCompanies]);

  const handleRemoveCompanyClick = (companyId: number, companyName?: string) => {
    setContactToRemove({ id: companyId, name: companyName || "" });
    setRemoveContactDialogOpen(true);
  };

  const handleRemoveContactClick = (contactId: number, contactName?: string) => {
    setContactToRemove({ id: contactId, name: contactName || "" });
    setRemoveContactDialogOpen(true);
  };

  const handleConfirmRemoveCompany = async () => {
    if (!contactToRemove || !id) return;
    try {
      setSaving(true);
      await api.delete(`/deals/${id}/companies/${contactToRemove.id}`);
      // Actualizar la lista de empresas inmediatamente sin esperar fetchDeal
      setDealCompanies((prevCompanies) =>
        prevCompanies.filter(
          (company: any) => company.id !== contactToRemove.id
        )
      );
      // También recargar el deal completo para asegurar consistencia
      await fetchDeal();
      setRemoveContactDialogOpen(false);
      setContactToRemove(null);
    } catch (error: any) {
      console.error("Error removing company:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar la empresa del negocio";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };


  const handleConfirmRemoveContact = async () => {
    if (!id || !contactToRemove) return;

    try {
      await api.delete(`/deals/${id}/contacts/${contactToRemove.id}`);
      // Actualizar la lista de contactos inmediatamente sin esperar fetchDeal
      setDealContacts((prevContacts) =>
        prevContacts.filter((contact: any) => contact.id !== contactToRemove.id)
      );
      // También recargar el deal completo para asegurar consistencia
      await fetchDeal();
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

  const handleRemoveDealClick = (dealId: number, dealName?: string) => {
    setDealToRemove({ id: dealId, name: dealName || "" });
    setRemoveDealDialogOpen(true);
  };

  const handleConfirmRemoveDeal = async () => {
    if (!id || !dealToRemove) return;

    try {
      setSaving(true);
      await api.delete(`/deals/${id}/deals/${dealToRemove.id}`);
      setDealDeals((prevDeals) =>
        prevDeals.filter((deal: any) => deal.id !== dealToRemove.id)
      );
      await fetchDeal();
      setRemoveDealDialogOpen(false);
      setDealToRemove(null);
    } catch (error: any) {
      console.error("Error removing deal:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al eliminar el negocio relacionado";
      alert(errorMessage);
    } finally {
      setSaving(false);
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
      const words = deal.name.trim().split(" ");
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      }
      return deal.name.substring(0, 2).toUpperCase();
    }
    return "--";
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
            : theme.palette.grey[100],
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
          theme.palette.mode === "dark" 
            ? `${theme.palette.error.main}26` 
            : `${theme.palette.error.main}15`,
      };
    } else if (diffDays <= 3) {
      // Por vencer (1-3 días) - amarillo/naranja claro
      return {
        bgcolor:
          theme.palette.mode === "dark" 
            ? `${taxiMonterricoColors.orange}26` 
            : `${taxiMonterricoColors.orange}15`,
      };
    } else {
      // A tiempo - verde claro
      return {
        bgcolor:
          theme.palette.mode === "dark" 
            ? `${taxiMonterricoColors.green}26` 
            : `${taxiMonterricoColors.green}15`,
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
      cliente_perdido: "Cliente Perdido",
      lead_inactivo: "Lead Inactivo",
    };
    return labels[stage] || stage;
  };

  const stageOptions = [
    { value: "lead", label: "Lead" },
    { value: "contacto", label: "Contacto" },
    { value: "reunion_agendada", label: "Reunión Agendada" },
    { value: "reunion_efectiva", label: "Reunión Efectiva" },
    { value: "propuesta_economica", label: "Propuesta Económica" },
    { value: "negociacion", label: "Negociación" },
    { value: "licitacion", label: "Licitación" },
    { value: "licitacion_etapa_final", label: "Licitación Etapa Final" },
    { value: "cierre_ganado", label: "Cierre Ganado" },
    { value: "cierre_perdido", label: "Cierre Perdido" },
    { value: "firma_contrato", label: "Firma de Contrato" },
    { value: "activo", label: "Activo" },
    { value: "cliente_perdido", label: "Cliente Perdido" },
    { value: "lead_inactivo", label: "Lead Inactivo" },
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      const thousands = value / 1000;
      return `S/ ${thousands.toFixed(1)}k`;
    }
    return `S/ ${value.toFixed(0)}`;
  };

  const handleOpenEditDialog = () => {
    if (deal) {
      const initialData = getInitialDealFormData(deal);
      dealFormDataRef.current.setFormData(initialData);
      // Cargar companies si no están cargados
      if (companies.length === 0) {
        fetchAllCompanies();
      }
      // Agregar la empresa del deal a companyOptions si existe
      if (deal.Company?.id && !companyOptions.find((c: any) => c.id === deal.Company?.id)) {
        setCompanyOptions([{ id: deal.Company.id, name: deal.Company.name || '' }, ...companyOptions]);
      }
      setEditDialogOpen(true);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    dealFormDataRef.current.setFormData(getInitialDealFormData(null));
  };

  const handleSubmitEdit = async () => {
    if (!deal) return;
    
    const formData = dealFormDataRef.current.formData;
    if (!formData.name.trim() || !formData.amount.trim()) {
      return;
    }
    
    setSavingEdit(true);
    try {
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount) || 0,
        stage: formData.stage,
        closeDate: formData.closeDate || null,
        priority: formData.priority,
        companyId: formData.companyId ? parseInt(formData.companyId) : null,
        contactId: formData.contactId ? parseInt(formData.contactId) : null,
      };
      
      await api.put(`/deals/${deal.id}`, data);
      
      // Recargar los datos del deal
      const response = await api.get(`/deals/${deal.id}`);
      setDeal(response.data);
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating deal:', error);
      alert('Error al actualizar el negocio. Por favor, intenta nuevamente.');
    } finally {
      setSavingEdit(false);
    }
  };

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
  }, [deduplicateNotes]);



  const handleCreateActivity = (
    type: "note" | "task" | "email" | "call" | "meeting"
  ) => {
    setCreateActivityMenuAnchor(null);
    if (type === "note") {
      setNoteOpen(true);
    } else if (type === "task") {
      setTaskOpen(true);
    } else if (type === "meeting") {
      setMeetingOpen(true);
    } else if (type === "call") {
      setCallOpen(true);
    }
  };


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

  if (!deal) {
    return (
      <Box>
        <Typography>Negocio no encontrado</Typography>
        <Button onClick={() => navigate("/deals")}>Volver a Negocios</Button>
      </Box>
    );
  }

    // Preparar campos de detalles
    const detailFields = [
      {
        label: 'Monto',
        value: deal ? formatCurrency(deal.amount || 0) : 'No disponible',
      },
      {
        label: 'Etapa',
        value: deal ? getStageLabel(deal.stage) : 'No disponible',
      },
      {
        label: 'Fecha de cierre',
        value: deal?.closeDate
          ? new Date(deal.closeDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'No disponible',
      },
      {
        label: 'Prioridad',
        value: deal?.priority
          ? deal.priority === 'baja'
            ? 'Baja'
            : deal.priority === 'media'
            ? 'Media'
            : 'Alta'
          : 'No disponible',
      },
      {
        label: 'Propietario',
        value: deal?.Owner
          ? `${deal.Owner.firstName || ''} ${deal.Owner.lastName || ''}`.trim() ||
            deal.Owner.email ||
            'Sin nombre'
          : 'No asignado',
      },
    ];
  
    // Preparar botones de actividades (botones circulares verdes como en CompanyDetail)
        // Preparar botones de actividades (array de objetos como espera DetailPageLayout)
        const activityButtons = [
          {
            icon: ['fas', 'note-sticky'],
            tooltip: 'Crear nota',
            onClick: () => handleCreateActivity('note'),
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
        value: deal?.createdAt
          ? `${new Date(deal.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })} ${new Date(deal.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'No disponible',
        icon: faCalendar,
        iconBgColor: theme.palette.mode === 'dark' 
          ? `${taxiMonterricoColors.green}29` 
          : `${taxiMonterricoColors.green}15`,
        iconColor: taxiMonterricoColors.green,
      },
      {
        label: 'Etapa del negocio',
        value: deal?.stage ? getStageLabel(deal.stage) : 'No disponible',
        icon: ['fas', 'arrows-rotate'],
        iconBgColor: theme.palette.mode === 'dark' 
          ? `${taxiMonterricoColors.green}26` 
          : `${taxiMonterricoColors.green}15`,
        iconColor: taxiMonterricoColors.greenLight,
        showArrow: true,
      },
      {
        label: 'Última actividad',
        value: activities.length > 0 && activities[0].createdAt
          ? new Date(activities[0].createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'No hay actividades',
        icon: faClock,
        iconBgColor: theme.palette.mode === 'dark' 
          ? `${taxiMonterricoColors.orange}26` 
          : `${taxiMonterricoColors.orange}15`,
        iconColor: taxiMonterricoColors.orange,
      },
      {
        label: 'Propietario del negocio',
        value: deal?.Owner
          ? deal.Owner.firstName || deal.Owner.lastName
            ? `${deal.Owner.firstName || ''} ${deal.Owner.lastName || ''}`.trim()
            : deal.Owner.email || 'Sin nombre'
          : 'No asignado',
        icon: faUserRegular,
        iconBgColor: theme.palette.mode === 'dark' 
          ? `${theme.palette.primary.main}26` 
          : `${theme.palette.primary.main}15`,
        iconColor: theme.palette.primary.main,
      },
    ];

    // Preparar contenido del Tab 0 (Descripción General)
    const tab0Content = (
      <GeneralDescriptionTab
        generalInfoCards={generalInfoCards}
        linkedCards={[
          { component: <RecentActivitiesCard activities={activities} /> },
          { component: <LinkedContactsCard contacts={dealContacts || []} /> },
          { component: <LinkedCompaniesCard companies={dealCompanies || []} /> },
          { component: <LinkedDealsCard deals={dealDeals || []} /> },
        ]}
        linkedCardsGridColumns={{ xs: '1fr' }}
      />
    );
  
    // Preparar contenido del Tab 1 (Información Avanzada)
    const tab1Content = (
      <>
        {/* Card de Descripción - Solo visible cuando hay descripción */}
        {deal?.description && (
          <Card
            sx={{
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
              bgcolor: theme.palette.background.paper,
              px: 2,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              mb: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                whiteSpace: 'pre-wrap',
              }}
            >
              {deal.description}
            </Typography>
          </Card>
        )}
  
        {/* Card de Actividades Recientes - Solo visible cuando no hay descripción */}
        {!deal?.description && (
          <Box sx={{ mb: 2 }}>
            <FullActivitiesTableCard
              activities={activities}
              searchValue={activitySearch}
              onSearchChange={setActivitySearch}
              onCreateActivity={handleCreateActivity}
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
          </Box>
        )}
  
        {/* Cards de Contactos, Empresas, Negocios */}
        <FullContactsTableCard
          contacts={dealContacts || []}
          searchValue={contactSearch}
          onSearchChange={setContactSearch}
          onAddExisting={() => {
            setContactDialogTab('existing');
            setAddContactDialogOpen(true);
          }}
          onAddNew={() => {
            setContactDialogTab('create');
            setAddContactDialogOpen(true);
          }}
          onRemove={(contactId, contactName) =>
            handleRemoveContactClick(contactId, contactName || "")
          }
          showActions={true}
          getContactInitials={(firstName, lastName) =>
            getInitials(firstName, lastName)
          }
          onCopyToClipboard={handleCopyToClipboard}
        />
  
        <FullCompaniesTableCard
          companies={dealCompanies || []}
          searchValue={companySearch}
          onSearchChange={setCompanySearch}
          onAddExisting={() => {
            setCompanyDialogTab('existing');
            setAddCompanyDialogOpen(true);
          }}
          onAddNew={() => {
            setCompanyDialogTab('create');
            setAddCompanyDialogOpen(true);
          }}
          onRemove={handleRemoveCompanyClick}
          showActions={true}
          onCopyToClipboard={handleCopyToClipboard}
          sortField={companySortField}
          sortOrder={companySortOrder}
          onSort={handleSortCompanies}
        />
  
        <FullDealsTableCard
          deals={dealDeals || []}
          searchValue={dealSearch}
          onSearchChange={setDealSearch}
          onAddExisting={() => {
            setDealDialogTab('existing');
            setAddDealDialogOpen(true);
          }}
          onAddNew={() => {
            setDealDialogTab('create');
            setAddDealDialogOpen(true);
          }}
          onRemove={handleRemoveDealClick}
          showActions={true}
          getInitials={getInitials}
          getStageLabel={getStageLabel}
          sortField={dealSortField}
          sortOrder={dealSortOrder}
          onSort={handleSortDeals}
        />
      </>
    );
  
    // Preparar contenido del Tab 2 (Actividades)
    const tab2Content = (
      <ActivitiesTabContent
        activities={activities}
        activitySearch={activitySearch}
        onSearchChange={setActivitySearch}
        onCreateActivity={(type) =>
          handleCreateActivity(type as 'note' | 'task' | 'email' | 'call' | 'meeting')
        }
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
        emptyMessage="No hay actividades registradas para este negocio. Crea una nueva actividad para comenzar."
      />
    );
  
    // Preparar activity logs (necesitas implementar fetchActivityLogs si no existe)
    const activityLogs: any[] = []; // Por ahora vacío, puedes implementarlo después
    const loadingLogs = false;

    return (
      <>
        <DetailPageLayout
          pageTitle="Información del negocio"
          breadcrumbItems={[
            { label: 'Negocios', path: '/deals' },
            { label: deal?.name || '' },
          ]}
          onBack={() => navigate('/deals')}
          avatarIcon={<FontAwesomeIcon icon={faHandshake} style={{ fontSize: 60, color: 'white' }} />}
          avatarBgColor={taxiMonterricoColors.green}
          entityName={deal?.name || ''}
          entitySubtitle={
            deal
              ? `${formatCurrency(deal.amount || 0)}${
                  deal.closeDate
                    ? ` • ${new Date(deal.closeDate).toLocaleDateString(
                        'es-ES',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}`
                    : ''
                }`
              : 'Sin información adicional'
          }
          activityButtons={activityButtons}
          detailFields={detailFields}
          onEditDetails={handleOpenEditDialog}
          editButtonText="Editar Negocio"
          activityLogs={activityLogs}
          loadingLogs={loadingLogs}
          tab0Content={tab0Content}
          tab1Content={tab1Content}
          tab2Content={tab2Content}
          loading={loading}
          editDialog={
            <FormDrawer
              open={editDialogOpen}
              onClose={handleCloseEditDialog}
              title="Editar Negocio"
              onSubmit={handleSubmitEdit}
              submitLabel={savingEdit ? 'Guardando...' : 'Actualizar'}
              submitDisabled={savingEdit || !dealFormDataRef.current.formData.name.trim() || !dealFormDataRef.current.formData.amount.trim()}
              variant="panel"
            >
              <DealFormContent
                initialData={getInitialDealFormData(deal)}
                formDataRef={dealFormDataRef}
                theme={theme}
                companies={companies}
                companyOptions={companyOptions}
                companySearch={companySearch}
                setCompanySearch={setCompanySearch}
                loadingCompanies={loadingCompanies}
                contacts={contacts}
                contactSearchInput={contactSearchInput}
                setContactSearchInput={setContactSearchInput}
              />
            </FormDrawer>
          }
        />
  
        {/* MANTENER TODOS LOS MODALES Y DIALOGS DESDE AQUÍ */}

      {/* Modal para agregar/crear negocios relacionados */}
      <DealModal
        open={addDealDialogOpen}
        onClose={() => setAddDealDialogOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
        user={user}
        initialTab={dealDialogTab}
        defaultCompanyId={deal?.Company?.id}
        defaultContactId={deal?.Contact?.id}
        excludedDealIds={(dealDeals || []).map((d: any) => d.id)}
        getStageLabel={getStageLabel}
        useDrawerForCreate
        onSave={async () => {
          await fetchDeal();
          setAddDealDialogOpen(false);
        }}
      />

      {/* Modal para agregar/crear contactos */}
      <ContactModal
        open={addContactDialogOpen}
        onClose={() => setAddContactDialogOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
        user={user}
        initialTab={contactDialogTab}
        defaultCompanyId={
          dealCompanies && dealCompanies.length > 0
            ? dealCompanies[0].id
            : deal?.Company?.id
        }
        excludedContactIds={(dealContacts || []).map((c: any) => c.id)}
        associatedContacts={dealContacts || []}
        useDrawerForCreate
        onSave={async () => {
          await fetchDeal();
          setAddContactDialogOpen(false);
        }}
      />

      {/* Modal para agregar/crear empresas */}
      <CompanyModal
        open={addCompanyDialogOpen}
        onClose={() => setAddCompanyDialogOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
        user={user}
        initialTab={companyDialogTab}
        excludedCompanyIds={(dealCompanies || []).map((c: any) => c.id)}
        useDrawerForCreate
        onSave={async () => {
          await fetchDeal();
          setAddCompanyDialogOpen(false);
        }}
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
            {contactToRemove?.name} ya no se asociará con {deal?.name}.
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

      {/* Dialog para confirmar eliminación de empresa */}
      <Dialog
        open={removeContactDialogOpen && contactToRemove !== null}
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
            {contactToRemove?.name} ya no se asociará con {deal?.name}.
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
            onClick={handleConfirmRemoveCompany}
            variant="contained"
            disabled={saving}
            sx={pageStyles.deleteButton}
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
            {dealToRemove?.name} ya no se asociará con {deal?.name}.
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
            disabled={saving}
            sx={pageStyles.deleteButton}
            >
            {saving ? "Eliminando..." : "Eliminar asociación"}
            </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de crear llamada */}
      <CallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
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
          fetchActivities(); // Actualizar actividades
        }}
        relatedEntityIds={{
          contactId: deal?.Contact?.id,
          companyId: deal?.Company?.id,
        }}
      />

      {/* Modal de crear nota */}
      <NoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
        user={user}
        onSave={handleNoteSave}
        relatedEntities={{
          companies: dealCompanies && dealCompanies.length > 0 
            ? dealCompanies 
            : deal?.Company 
            ? [deal.Company] 
            : [],
          contacts: dealContacts && dealContacts.length > 0 
            ? dealContacts 
            : deal?.Contact 
            ? [deal.Contact] 
            : [],
          deals: deal ? [deal] : [],
          // tickets: [],
        }}
      />

      {/* Modal de crear tarea */}
      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
        user={user}
        onSave={(newTask) => {
          // Convertir la tarea a formato de actividad para agregarla a la lista
          const taskAsActivity = {
            id: newTask.id,
            type: "task",
            subject: newTask.title,
            description: newTask.description,
            dueDate: newTask.dueDate,
            createdAt: newTask.createdAt,
            User: newTask.CreatedBy || newTask.AssignedTo,
            isTask: true,
            status: newTask.status,
            priority: newTask.priority,
            dealId: newTask.dealId,
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
          fetchActivities(); // Actualizar actividades
        }}
      />

      {/* Modal de crear reunión */}
      <MeetingModal
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        entityType="deal"
        entityId={id || ""}
        entityName={deal?.name || "Sin nombre"}
        user={user}
        onSave={(newMeeting) => {
          // Convertir la reunión a formato de actividad para agregarla a la lista
          const meetingAsActivity = {
            id: newMeeting.id,
            type: "meeting",
            subject: newMeeting.title,
            description: newMeeting.description,
            dueDate: newMeeting.dueDate,
            createdAt: newMeeting.createdAt,
            User: newMeeting.CreatedBy || newMeeting.AssignedTo,
            dealId: newMeeting.dealId,
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
          fetchActivities(); // Actualizar actividades
        }}
      />

      {/* Dialog para ver detalles de actividad expandida */}
      <ActivityDetailDialog
        activity={expandedActivity}
        open={!!expandedActivity}
        onClose={() => setExpandedActivity(null)}
        getActivityTypeLabel={getActivityTypeLabel}
                  />
                </>
  );
};

export default DealDetail;
