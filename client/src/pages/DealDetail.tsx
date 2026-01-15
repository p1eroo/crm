import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
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
  Tabs,
  Tab,
  Checkbox,
  InputAdornment,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import {
  Search,
  Close,
} from "@mui/icons-material";
import api from "../config/api";
import axios from "axios";
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
import { NoteModal, CallModal, TaskModal } from "../components/ActivityModals";
import type { GeneralInfoCard } from "../components/DetailCards";
import { useAuth } from "../context/AuthContext";
import DetailPageLayout from "../components/Layout/DetailPageLayout";
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
  const [taskType, setTaskType] = useState<"todo" | "meeting">("todo");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    amount: '',
    stage: 'lead',
    closeDate: '',
    priority: 'baja' as 'baja' | 'media' | 'alta',
    companyId: '',
    contactId: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
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
  const [existingCompaniesSearch, setExistingCompaniesSearch] = useState("");
  const [selectedExistingCompanies, setSelectedExistingCompanies] = useState<
    number[]
  >([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loadingAllCompanies, setLoadingAllCompanies] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    domain: "",
    companyname: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    ruc: "",
    lifecycleStage: "lead",
    ownerId: user?.id || null,
  });
  // Estados para agregar negocios relacionados
  const [addDealDialogOpen, setAddDealDialogOpen] = useState(false);
  const [dealDialogTab, setDealDialogTab] = useState<"create" | "existing">(
    "create"
  );
  const [existingDealsSearch, setExistingDealsSearch] = useState("");
  const [selectedExistingDeals, setSelectedExistingDeals] = useState<number[]>(
    []
  );
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [loadingAllDeals, setLoadingAllDeals] = useState(false);
  const [dealFormData, setDealFormData] = useState({
    name: "",
    amount: "",
    stage: "lead",
    closeDate: "",
    priority: "baja" as "baja" | "media" | "alta",
    companyId: deal?.Company?.id?.toString() || "",
    contactId: deal?.Contact?.id?.toString() || "",
    ownerId: user?.id || null,
  });
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState("");
  const [dniError, setDniError] = useState("");
  const [loadingDni, setLoadingDni] = useState(false);
  const [contactDialogTab, setContactDialogTab] = useState<
    "create" | "existing"
  >("create");
  const [existingContactsSearch, setExistingContactsSearch] = useState("");
  const [selectedExistingContacts, setSelectedExistingContacts] = useState<
    number[]
  >([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loadingAllContacts, setLoadingAllContacts] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    identificationType: "dni",
    dni: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    province: "",
    department: "",
    jobTitle: "",
    lifecycleStage: "lead",
    ownerId: user?.id || null,
  });

  // Función para ordenar empresas
  const handleSortCompanies = (field: "name" | "domain" | "phone") => {
    const isAsc = companySortField === field && companySortOrder === "asc";
    setCompanySortOrder(isAsc ? "desc" : "asc");
    setCompanySortField(field);
  };

  // Estados para ordenar negocios
  const [dealSortField, setDealSortField] = useState<
    "name" | "amount" | "closeDate" | "stage"
  >("name");
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
      setLoadingAllCompanies(true);
      const response = await api.get("/companies", { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoadingAllCompanies(false);
    }
  };

  const fetchAllContacts = async () => {
    setLoadingAllContacts(true);
    try {
      const response = await api.get("/contacts", { params: { limit: 1000 } });
      setAllContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error("Error fetching all contacts:", error);
    } finally {
      setLoadingAllContacts(false);
    }
  };

  const fetchAllDeals = async () => {
    setLoadingAllDeals(true);
    try {
      const response = await api.get("/deals", { params: { limit: 1000 } });
      setAllDeals(response.data.deals || response.data || []);
    } catch (error) {
      console.error("Error fetching all deals:", error);
    } finally {
      setLoadingAllDeals(false);
    }
  };


  const handleCreateContact = async () => {
    try {
      setSaving(true);

      // Obtener la empresa principal del deal (primero de dealCompanies o Company del deal)
      const primaryCompanyId =
        dealCompanies && dealCompanies.length > 0
          ? dealCompanies[0].id
          : deal?.Company?.id;

      if (!primaryCompanyId) {
        alert(
          "El negocio debe tener al menos una empresa asociada para crear un contacto"
        );
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
      const response = await api.post("/contacts", contactData);
      // Asociar el contacto recién creado al deal usando la relación muchos a muchos
      if (id && response.data.id) {
        await api.post(`/deals/${id}/contacts`, {
          contactIds: [response.data.id],
        });
      }
      await fetchDeal();
      setAddContactDialogOpen(false);
      setContactFormData({
        identificationType: "dni",
        dni: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        district: "",
        province: "",
        department: "",
        jobTitle: "",
        lifecycleStage: "lead",
        ownerId: user?.id || null,
      });
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error al crear el contacto");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingContacts = async () => {
    try {
      setSaving(true);
      // Asociar todos los contactos seleccionados al deal usando la relación muchos a muchos
      if (id && selectedExistingContacts.length > 0) {
        await api.post(`/deals/${id}/contacts`, {
          contactIds: selectedExistingContacts,
        });
        // Recargar el deal para obtener los contactos actualizados
        await fetchDeal();
        setAddContactDialogOpen(false);
        setSelectedExistingContacts([]);
        setExistingContactsSearch("");
      }
    } catch (error: any) {
      console.error("Error adding contacts:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar los contactos";
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
      const response = await api.post("/companies", companyData);
      // Asociar la empresa recién creada al deal usando la relación muchos a muchos
      if (id && response.data.id) {
        const associateResponse = await api.post(`/deals/${id}/companies`, {
          companyIds: [response.data.id],
        });
        
        // Usar la respuesta del POST directamente (optimistic update)
        if (associateResponse.data?.Companies) {
          setDealCompanies(associateResponse.data.Companies);
        }
        
        // Actualizar también el deal principal si viene en la respuesta
        if (associateResponse.data) {
          setDeal(associateResponse.data);
        }
      }
      setAddCompanyDialogOpen(false);
      setCompanyFormData({
        name: "",
        domain: "",
        companyname: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        ruc: "",
        lifecycleStage: "lead",
        ownerId: user?.id || null,
      });
    } catch (error) {
      console.error("Error creating company:", error);
      alert("Error al crear la empresa");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingCompanies = async () => {
    try {
      setSaving(true);
      // Asociar todas las empresas seleccionadas al deal usando la relación muchos a muchos
      if (id && selectedExistingCompanies.length > 0) {
        const response = await api.post(`/deals/${id}/companies`, {
          companyIds: selectedExistingCompanies,
        });
        
        // Usar la respuesta del POST directamente (optimistic update)
        if (response.data?.Companies) {
          setDealCompanies(response.data.Companies);
        }
        
        // Actualizar también el deal principal si viene en la respuesta
        if (response.data) {
          setDeal(response.data);
        }
        
        setAddCompanyDialogOpen(false);
        setSelectedExistingCompanies([]);
        setExistingCompaniesSearch("");
      }
    } catch (error: any) {
      console.error("Error adding companies:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar las empresas";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDeal = async () => {
    try {
      setSaving(true);
      const dealData = {
        ...dealFormData,
        amount: dealFormData.amount ? parseFloat(dealFormData.amount) : 0,
        companyId: dealFormData.companyId
          ? parseInt(dealFormData.companyId)
          : deal?.Company?.id,
        contactId: dealFormData.contactId
          ? parseInt(dealFormData.contactId)
          : deal?.Contact?.id,
        ownerId: dealFormData.ownerId || user?.id,
      };
      const response = await api.post("/deals", dealData);
      // Asociar el negocio recién creado al deal usando la relación muchos a muchos
      if (id && response.data.id) {
        await api.post(`/deals/${id}/deals`, {
          dealIds: [response.data.id],
        });
      }
      await fetchDeal();
      setAddDealDialogOpen(false);
      setDealFormData({
        name: "",
        amount: "",
        stage: "lead",
        closeDate: "",
        priority: "baja" as "baja" | "media" | "alta",
        companyId: deal?.Company?.id?.toString() || "",
        contactId: deal?.Contact?.id?.toString() || "",
        ownerId: user?.id || null,
      });
    } catch (error) {
      console.error("Error creating deal:", error);
      alert("Error al crear el negocio");
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingDeals = async () => {
    try {
      setSaving(true);
      // Asociar todos los negocios seleccionados al deal usando la relación muchos a muchos
      if (id && selectedExistingDeals.length > 0) {
        await api.post(`/deals/${id}/deals`, {
          dealIds: selectedExistingDeals,
        });
        // Recargar el deal para obtener los negocios actualizados
        await fetchDeal();
        setAddDealDialogOpen(false);
        setSelectedExistingDeals([]);
        setExistingDealsSearch("");
      }
    } catch (error: any) {
      console.error("Error adding deals:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar los negocios";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCompanyClick = (companyId: number, companyName?: string) => {
    setContactToRemove({ id: companyId, name: companyName || "" });
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

  const capitalizeInitials = (text: string) => {
    if (!text) return "";
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
          district: distritoCapitalizado,
          province: provinciaCapitalizada,
          department: departamentoCapitalizado || "Perú",
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
        setDniError("Error al buscar DNI. Por favor, intente nuevamente");
      }
    } finally {
      setLoadingDni(false);
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
      setEditFormData({
        name: deal.name || '',
        amount: deal.amount?.toString() || '',
        stage: deal.stage || 'lead',
        closeDate: deal.closeDate ? deal.closeDate.split('T')[0] : '',
        priority: (deal.priority as 'baja' | 'media' | 'alta') || 'baja',
        companyId: deal.Company?.id?.toString() || '',
        contactId: deal.Contact?.id?.toString() || '',
      });
      // Cargar companies y contacts si no están cargados
      if (allCompanies.length === 0) {
        fetchAllCompanies();
      }
      if (allContacts.length === 0) {
        fetchAllContacts();
      }
      setEditDialogOpen(true);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditFormData({
      name: '',
      amount: '',
      stage: 'lead',
      closeDate: '',
      priority: 'baja' as 'baja' | 'media' | 'alta',
      companyId: '',
      contactId: '',
    });
  };

  const handleSubmitEdit = async () => {
    if (!deal || !editFormData.name.trim() || !editFormData.amount.trim()) {
      return;
    }
    
    setSavingEdit(true);
    try {
      const data = {
        name: editFormData.name,
        amount: parseFloat(editFormData.amount) || 0,
        stage: editFormData.stage,
        closeDate: editFormData.closeDate || null,
        priority: editFormData.priority,
        companyId: editFormData.companyId ? parseInt(editFormData.companyId) : null,
        contactId: editFormData.contactId ? parseInt(editFormData.contactId) : null,
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
      setTaskType("todo");
      setTaskOpen(true);
    } else if (type === "meeting") {
      setTaskType("meeting");
      setTaskOpen(true);
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
        iconBgColor: '#0d939429',
        iconColor: '#0d9394',
      },
      {
        label: 'Etapa del negocio',
        value: deal?.stage ? getStageLabel(deal.stage) : 'No disponible',
        icon: ['fas', 'arrows-rotate'],
        iconBgColor: '#e4f6d6',
        iconColor: '#56ca00',
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
        iconBgColor: '#fff3d6',
        iconColor: '#ffb400',
      },
      {
        label: 'Propietario del negocio',
        value: deal?.Owner
          ? deal.Owner.firstName || deal.Owner.lastName
            ? `${deal.Owner.firstName || ''} ${deal.Owner.lastName || ''}`.trim()
            : deal.Owner.email || 'Sin nombre'
          : 'No asignado',
        icon: faUserRegular,
        iconBgColor: '#daf2ff',
        iconColor: '#16b1ff',
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
            const existingContactIds = (dealContacts || []).map((c: any) => c.id);
            setSelectedExistingContacts(existingContactIds);
            setAddContactDialogOpen(true);
            fetchAllContacts();
          }}
          onAddNew={() => {
            setContactDialogTab('create');
            setAddContactDialogOpen(true);
          }}
          onRemove={async (contactId, contactName) => {
            if (
              window.confirm(
                `¿Estás seguro de que deseas eliminar el contacto "${contactName}" de este negocio?`
              )
            ) {
              try {
                await api.delete(`/deals/${id}/contacts/${contactId}`);
                fetchDeal();
              } catch (error: any) {
                console.error('Error al eliminar contacto:', error);
                alert(
                  error.response?.data?.error ||
                    'Error al eliminar el contacto'
                );
              }
            }
          }}
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
            const existingCompanyIds = (dealCompanies || []).map(
              (c: any) => c.id
            );
            setSelectedExistingCompanies(existingCompanyIds);
            setAddCompanyDialogOpen(true);
            fetchAllCompanies();
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
            const existingDealIds = (dealDeals || []).map((d: any) => d.id);
            setSelectedExistingDeals(existingDealIds);
            setAddDealDialogOpen(true);
            fetchAllDeals();
          }}
          onAddNew={() => {
            setDealDialogTab('create');
            setDealFormData({
              name: '',
              amount: '',
              stage: 'lead',
              closeDate: '',
              priority: 'baja' as 'baja' | 'media' | 'alta',
              companyId: deal?.Company?.id?.toString() || '',
              contactId: deal?.Contact?.id?.toString() || '',
              ownerId: user?.id || null,
            });
            if (allCompanies.length === 0) {
              fetchAllCompanies();
            }
            if (allContacts.length === 0) {
              fetchAllContacts();
            }
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
          avatarBgColor="#0d9394"
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
            <Dialog
              open={editDialogOpen}
              onClose={handleCloseEditDialog}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Editar Negocio</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <TextField
                    label="Nombre"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Monto"
                    type="number"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    required
                    fullWidth
                  />
                  <TextField
                    select
                    label="Etapa"
                    value={editFormData.stage}
                    onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                    fullWidth
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
                    value={editFormData.closeDate}
                    onChange={(e) => setEditFormData({ ...editFormData, closeDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Prioridad"
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as 'baja' | 'media' | 'alta' })}
                    fullWidth
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
                    value={editFormData.companyId}
                    onChange={(e) => setEditFormData({ ...editFormData, companyId: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {allCompanies.map((company) => (
                      <MenuItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Contacto"
                    value={editFormData.contactId}
                    onChange={(e) => setEditFormData({ ...editFormData, contactId: e.target.value })}
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
                <Button onClick={handleCloseEditDialog} disabled={savingEdit}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitEdit} 
                  variant="contained"
                  disabled={savingEdit || !editFormData.name.trim() || !editFormData.amount.trim()}
                >
                  {savingEdit ? 'Guardando...' : 'Actualizar'}
                </Button>
              </DialogActions>
            </Dialog>
          }
        />
  
        {/* MANTENER TODOS LOS MODALES Y DIALOGS DESDE AQUÍ */}

      {/* Dialog para agregar/crear negocios relacionados */}
      <Dialog
        open={addDealDialogOpen}
        onClose={() => {
          setAddDealDialogOpen(false);
          setDealFormData({
            name: "",
            amount: "",
            stage: "lead",
            closeDate: "",
            priority: "baja" as "baja" | "media" | "alta",
            companyId: deal?.Company?.id?.toString() || "",
            contactId: deal?.Contact?.id?.toString() || "",
            ownerId: user?.id || null,
          });
          setSelectedExistingDeals([]);
          setExistingDealsSearch("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
              <Box
                sx={{
                  display: "flex",
              justifyContent: "space-between",
                  alignItems: "center",
            }}
          >
            <Typography variant="h6">
              {dealDialogTab === "create" ? "Nuevo Negocio" : "Agregar Negocio"}
            </Typography>
            <IconButton
              onClick={() => setAddDealDialogOpen(false)}
                  size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={dealDialogTab === "create" ? 0 : 1}
              onChange={(e, newValue) =>
                setDealDialogTab(newValue === 0 ? "create" : "existing")
              }
            >
              <Tab label="Crear nuevo" />
              <Tab label="Agregar existente" />
            </Tabs>
          </Box>

          {dealDialogTab === "create" ? (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Nombre"
                value={dealFormData.name}
                onChange={(e) =>
                  setDealFormData({ ...dealFormData, name: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Monto"
                type="number"
                value={dealFormData.amount}
                onChange={(e) =>
                  setDealFormData({ ...dealFormData, amount: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                select
                label="Etapa"
                value={dealFormData.stage}
                onChange={(e) =>
                  setDealFormData({ ...dealFormData, stage: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                  sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    },
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
                onChange={(e) =>
                  setDealFormData({
                    ...dealFormData,
                    closeDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                  sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
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
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    },
                  }}
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
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  select
                  label="Empresa"
                  value={dealFormData.companyId}
                  onChange={(e) =>
                    setDealFormData({
                      ...dealFormData,
                      companyId: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                  },
                }}
              >
                  <MenuItem value="">
                    <em>Ninguna</em>
                  </MenuItem>
                  {allCompanies.map((company: any) => (
                    <MenuItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Contacto"
                  value={dealFormData.contactId}
                  onChange={(e) =>
                    setDealFormData({
                      ...dealFormData,
                      contactId: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Ninguno</em>
                  </MenuItem>
                  {allContacts.map((contact: any) => (
                    <MenuItem key={contact.id} value={contact.id.toString()}>
                      {contact.firstName} {contact.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
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
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {loadingAllDeals ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress size={24} />
                </Box>
                ) : (
                  allDeals
                    .filter((deal: any) => {
                      const isAlreadyAdded = (dealDeals || []).some(
                        (d: any) => d.id === deal.id
                      );
                      if (isAlreadyAdded) return false;
                      if (!existingDealsSearch.trim()) return true;
                      const searchLower = existingDealsSearch.toLowerCase();
                      return deal.name?.toLowerCase().includes(searchLower);
                    })
                    .map((deal: any) => (
                      <Box
                        key={deal.id}
                        onClick={() => {
                          if (selectedExistingDeals.includes(deal.id)) {
                            setSelectedExistingDeals(
                              selectedExistingDeals.filter((id) => id !== deal.id)
                            );
                          } else {
                            setSelectedExistingDeals([
                              ...selectedExistingDeals,
                              deal.id,
                            ]);
                          }
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: "pointer",
                          bgcolor: selectedExistingDeals.includes(deal.id)
                            ? theme.palette.mode === "dark"
                              ? "rgba(46, 125, 50, 0.2)"
                              : "rgba(46, 125, 50, 0.1)"
                            : "transparent",
                          border: `1px solid ${
                            selectedExistingDeals.includes(deal.id)
                              ? taxiMonterricoColors.green
                              : theme.palette.divider
                          }`,
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox
                            checked={selectedExistingDeals.includes(deal.id)}
                          size="small"
                          sx={{
                              p: 0,
                            color: taxiMonterricoColors.green,
                            "&.Mui-checked": {
                              color: taxiMonterricoColors.green,
                            },
                          }}
                        />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {deal.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {deal.amount
                                ? `S/ ${deal.amount.toLocaleString("es-ES")}`
                                : "Sin monto"}{" "}
                              • {deal.stage ? getStageLabel(deal.stage) : "Sin etapa"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
          <Button
                    onClick={() => {
              setAddDealDialogOpen(false);
              setDealFormData({
                name: "",
                amount: "",
                stage: "lead",
                closeDate: "",
                priority: "baja" as "baja" | "media" | "alta",
                companyId: deal?.Company?.id?.toString() || "",
                contactId: deal?.Contact?.id?.toString() || "",
                ownerId: user?.id || null,
              });
              setSelectedExistingDeals([]);
              setExistingDealsSearch("");
                    }}
                    sx={{
                      textTransform: "none",
                        color: taxiMonterricoColors.green,
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: "0.75rem",
                        bgcolor: "transparent",
              border: `1px solid ${taxiMonterricoColors.green}`,
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(46, 125, 50, 0.15)"
                    : "rgba(46, 125, 50, 0.08)",
                borderColor: taxiMonterricoColors.green,
                      },
                    }}
                  >
            Cancelar
                  </Button>
          <Button
            onClick={
              dealDialogTab === "create"
                ? handleCreateDeal
                : handleAddExistingDeals
            }
            variant="contained"
            disabled={
              saving ||
              (dealDialogTab === "existing" &&
                selectedExistingDeals.length === 0) ||
              (dealDialogTab === "create" &&
                (!dealFormData.name.trim() || !dealFormData.amount.trim()))
            }
                        sx={{
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              py: 0.5,
              fontSize: "0.75rem",
              bgcolor: taxiMonterricoColors.green,
              color: "white",
                          "&:hover": {
                bgcolor: taxiMonterricoColors.green,
                            opacity: 0.9,
              },
              "&:disabled": {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
                          },
                        }}
                      >
            {saving
              ? "Guardando..."
              : dealDialogTab === "create"
              ? "Crear"
              : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/crear contactos */}
      <Dialog
        open={addContactDialogOpen}
        onClose={() => {
          setAddContactDialogOpen(false);
          setContactFormData({
            identificationType: "dni",
            dni: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            district: "",
            province: "",
            department: "",
            jobTitle: "",
            lifecycleStage: "lead",
            ownerId: user?.id || null,
          });
          setSelectedExistingContacts([]);
          setExistingContactsSearch("");
          setDniError("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
                        <Box
                          sx={{
                            display: "flex",
              justifyContent: "space-between",
                            alignItems: "center",
            }}
          >
            <Typography variant="h6">Agregar Contacto</Typography>
            <IconButton
              onClick={() => setAddContactDialogOpen(false)}
                            size="small"
            >
              <Close />
            </IconButton>
                        </Box>
        </DialogTitle>
        <DialogContent>
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

          {contactDialogTab === "create" ? (
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
                    value={contactFormData.identificationType}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        identificationType: e.target.value,
                      })
                    }
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
                          contactFormData.identificationType === "dni"
                            ? taxiMonterricoColors.orange
                            : theme.palette.divider
                        }`,
                        borderRadius: 2,
                        bgcolor:
                          contactFormData.identificationType === "dni"
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
                          fontWeight:
                            contactFormData.identificationType === "dni"
                              ? 500
                              : 400,
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
                          contactFormData.identificationType === "cee"
                            ? taxiMonterricoColors.orange
                            : theme.palette.divider
                  }`,
                  borderRadius: 2,
                      bgcolor:
                          contactFormData.identificationType === "cee"
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
                          fontWeight:
                            contactFormData.identificationType === "cee"
                              ? 500
                              : 400,
                        },
                      }}
                    />
                  </RadioGroup>

                  {/* Campo de entrada según el tipo seleccionado */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TextField
                      label={
                        contactFormData.identificationType === "dni"
                          ? "DNI"
                          : "CEE"
                      }
                      value={contactFormData.dni}
                      onChange={(e) =>
                        setContactFormData({
                          ...contactFormData,
                          dni: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      error={!!dniError}
                      helperText={dniError}
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
                  size="small"
                            onClick={handleSearchDni}
                            disabled={
                              loadingDni ||
                              !contactFormData.dni ||
                              contactFormData.dni.length < 8
                            }
                  sx={{
                              color: taxiMonterricoColors.orange,
                    "&:hover": {
                                bgcolor: `${taxiMonterricoColors.orange}15`,
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
                  </Box>
                </Box>
              </Box>

              {/* Nombre y Apellido */}
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

              {/* Email y Teléfono */}
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

              {/* Dirección */}
              <TextField
                label="Dirección"
                value={contactFormData.address}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    address: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              {/* Distrito y Provincia */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Distrito"
                  value={contactFormData.district}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      district: e.target.value,
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
                  value={contactFormData.province}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      province: e.target.value,
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

              {/* Departamento */}
              <TextField
                label="Departamento"
                value={contactFormData.department}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    department: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                    sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />

              {/* Cargo y Etapa del Ciclo de Vida */}
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
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {loadingAllContacts ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  allContacts
                    .filter((contact: any) => {
                      const isAlreadyAdded = (dealContacts || []).some(
                        (c: any) => c.id === contact.id
                      );
                      if (isAlreadyAdded) return false;
                      if (!existingContactsSearch.trim()) return true;
                      const searchLower = existingContactsSearch.toLowerCase();
                          return (
                        contact.firstName
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        contact.lastName?.toLowerCase().includes(searchLower) ||
                        contact.email?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((contact: any) => (
                      <Box
                        key={contact.id}
                        onClick={() => {
                          if (selectedExistingContacts.includes(contact.id)) {
                            setSelectedExistingContacts(
                              selectedExistingContacts.filter(
                                (id) => id !== contact.id
                              )
                            );
                          } else {
                            setSelectedExistingContacts([
                              ...selectedExistingContacts,
                              contact.id,
                            ]);
                          }
                        }}
                                sx={{
                          p: 1.5,
                                  borderRadius: 1,
                          mb: 1,
                          cursor: "pointer",
                          bgcolor: selectedExistingContacts.includes(contact.id)
                            ? theme.palette.mode === "dark"
                              ? "rgba(46, 125, 50, 0.2)"
                              : "rgba(46, 125, 50, 0.1)"
                            : "transparent",
                          border: `1px solid ${
                            selectedExistingContacts.includes(contact.id)
                              ? taxiMonterricoColors.green
                              : theme.palette.divider
                          }`,
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Checkbox
                            checked={selectedExistingContacts.includes(contact.id)}
                            size="small"
                                  sx={{
                              p: 0,
                              color: taxiMonterricoColors.green,
                              "&.Mui-checked": {
                                color: taxiMonterricoColors.green,
                              },
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {contact.firstName} {contact.lastName}
                                </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {contact.email}
                                    </Typography>
                                </Box>
                              </Box>
                            </Box>
                    ))
                    )}
                  </Box>
              </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Box>
            {contactDialogTab === "existing" && (
              <Typography variant="body2" color="text.secondary">
                {selectedExistingContacts.length} elemento(s) seleccionado(s)
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => {
                setAddContactDialogOpen(false);
                setContactFormData({
                  identificationType: "dni",
                  dni: "",
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  address: "",
                  district: "",
                  province: "",
                  department: "",
                  jobTitle: "",
                  lifecycleStage: "lead",
                  ownerId: user?.id || null,
                });
                setSelectedExistingContacts([]);
                setExistingContactsSearch("");
                setDniError("");
              }}
              sx={{
                textTransform: "none",
                color: taxiMonterricoColors.orange,
                fontWeight: 500,
                px: 2,
                py: 0.5,
                fontSize: "0.75rem",
                "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                      ? "rgba(255, 152, 0, 0.15)"
                      : "rgba(255, 152, 0, 0.08)",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={
                contactDialogTab === "create"
                  ? handleCreateContact
                  : handleAddExistingContacts
              }
              variant="contained"
              disabled={
                saving ||
                (contactDialogTab === "existing" &&
                  selectedExistingContacts.length === 0) ||
                (contactDialogTab === "create" && !contactFormData.email.trim())
              }
                  sx={{
                textTransform: "none",
                fontWeight: 500,
                px: 2,
                py: 0.5,
                fontSize: "0.75rem",
                bgcolor: taxiMonterricoColors.green,
                "&:hover": {
                  bgcolor: taxiMonterricoColors.green,
                  opacity: 0.9,
                },
                "&:disabled": {
                  bgcolor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              {saving
                ? "Guardando..."
                : contactDialogTab === "create"
                ? "Crear"
                : "Agregar"}
            </Button>
                </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/crear empresas */}
      <Dialog
        open={addCompanyDialogOpen}
        onClose={() => {
          setAddCompanyDialogOpen(false);
          setCompanyFormData({
            name: "",
            domain: "",
            companyname: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            ruc: "",
            lifecycleStage: "lead",
            ownerId: user?.id || null,
          });
          setSelectedExistingCompanies([]);
          setExistingCompaniesSearch("");
          setRucError("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
                    sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Agregar Empresa</Typography>
            <IconButton
              onClick={() => setAddCompanyDialogOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
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

          {companyDialogTab === "create" ? (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
            >
              {/* RUC y Nombre */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                          sx={{
                    flex: "1 1 0%",
                    minWidth: 0,
                            display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <TextField
                    label="RUC"
                    value={companyFormData.ruc || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const limitedValue = value.slice(0, 11);
                      setCompanyFormData({
                        ...companyFormData,
                        ruc: limitedValue,
                      });
                      setRucError("");
                    }}
                    onKeyPress={(e) => {
                      if (
                        e.key === "Enter" &&
                        companyFormData.ruc &&
                        companyFormData.ruc.length === 11
                      ) {
                        handleSearchRuc();
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ maxLength: 11 }}
                    error={!!rucError}
                    helperText={rucError}
                            sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleSearchRuc}
                            disabled={
                              loadingRuc ||
                              !companyFormData.ruc ||
                              companyFormData.ruc.length !== 11
                            }
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
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      name: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                              sx={{
                    flex: "4 1 0%",
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
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
                    flex: 1,
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
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
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
                      const isAlreadyAdded = (dealCompanies || []).some(
                        (c: any) => c.id === company.id
                      );
                      if (isAlreadyAdded) return false;
                      if (!existingCompaniesSearch.trim()) return true;
                      const searchLower = existingCompaniesSearch.toLowerCase();
                      return (
                        company.name?.toLowerCase().includes(searchLower) ||
                        company.companyname
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        company.ruc?.includes(searchLower)
                      );
                    })
                    .map((company: any) => (
                      <Box
                        key={company.id}
                        onClick={() => {
                          if (selectedExistingCompanies.includes(company.id)) {
                            setSelectedExistingCompanies(
                              selectedExistingCompanies.filter(
                                (id) => id !== company.id
                              )
                            );
                          } else {
                            setSelectedExistingCompanies([
                              ...selectedExistingCompanies,
                              company.id,
                            ]);
                          }
                        }}
          sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: "pointer",
                          bgcolor: selectedExistingCompanies.includes(company.id)
                            ? theme.palette.mode === "dark"
                              ? "rgba(46, 125, 50, 0.2)"
                              : "rgba(46, 125, 50, 0.1)"
                            : "transparent",
            border: `1px solid ${
                            selectedExistingCompanies.includes(company.id)
                              ? taxiMonterricoColors.green
                              : theme.palette.divider
                          }`,
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Checkbox
                            checked={selectedExistingCompanies.includes(company.id)}
                            size="small"
              sx={{
                              p: 0,
                              color: taxiMonterricoColors.green,
                              "&.Mui-checked": {
                                color: taxiMonterricoColors.green,
                              },
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {company.name}
              </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.ruc || company.companyname}
              </Typography>
            </Box>
          </Box>
                      </Box>
                    ))
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Box>
            {companyDialogTab === "existing" && (
              <Typography variant="body2" color="text.secondary">
                {selectedExistingCompanies.length} elemento(s) seleccionado(s)
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
          <Button
              onClick={() => {
                setAddCompanyDialogOpen(false);
                setCompanyFormData({
                  name: "",
                  domain: "",
                  companyname: "",
                  phone: "",
                  address: "",
                  city: "",
                  state: "",
                  country: "",
                  ruc: "",
                  lifecycleStage: "lead",
                  ownerId: user?.id || null,
                });
                setSelectedExistingCompanies([]);
                setExistingCompaniesSearch("");
                setRucError("");
              }}
            sx={{
              textTransform: "none",
                color: taxiMonterricoColors.orange,
              fontWeight: 500,
                px: 2,
                py: 0.5,
                fontSize: "0.75rem",
              "&:hover": {
                  bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.15)"
                    : "rgba(255, 152, 0, 0.08)",
              },
            }}
          >
              Cancelar
          </Button>
            {companyDialogTab === "create" ? (
              <>
                <Button
                  onClick={handleCreateCompany}
                  variant="contained"
                  disabled={saving || !companyFormData.name.trim()}
          sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    fontSize: "0.75rem",
                    bgcolor: "#9E9E9E",
                    "&:hover": {
                      bgcolor: "#757575",
                    },
                    "&:disabled": {
                      bgcolor: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  {saving ? "Guardando..." : "Crear"}
                </Button>
                <Button
                  onClick={async () => {
                    await handleCreateCompany();
                    if (!saving) {
                      setCompanyFormData({
                        name: "",
                        domain: "",
                        companyname: "",
                        phone: "",
                        address: "",
                        city: "",
                        state: "",
                        country: "",
                        ruc: "",
                        lifecycleStage: "lead",
                        ownerId: user?.id || null,
                      });
                      setRucError("");
                    }
                  }}
                  variant="contained"
                  disabled={saving || !companyFormData.name.trim()}
                sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    px: 2,
                    py: 0.5,
                    fontSize: "0.75rem",
                    bgcolor: "#9E9E9E",
                    "&:hover": {
                      bgcolor: "#757575",
                    },
                    "&:disabled": {
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
                onClick={handleAddExistingCompanies}
                variant="contained"
                disabled={saving || selectedExistingCompanies.length === 0}
            sx={{
              textTransform: "none",
              fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: "0.75rem",
                  bgcolor: "#9E9E9E",
              "&:hover": {
                    bgcolor: "#757575",
                  },
                  "&:disabled": {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                {saving ? "Guardando..." : "Agregar"}
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
              <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
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
            {dealToRemove?.name} ya no se asociará con {deal?.name}.
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
          tickets: [],
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
        taskType={taskType}
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
