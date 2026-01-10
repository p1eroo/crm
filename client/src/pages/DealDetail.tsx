import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDatePeru } from "../utils/dateUtils";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Card,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Popover,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputBase,
  InputAdornment,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Note,
  Phone,
  Person,
  Business,
  CalendarToday,
  Assignment,
  Search,
  MoreVert,
  Close,
  ChevronLeft,
  ChevronRight,
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
  KeyboardArrowRight,
  KeyboardArrowDown,
  Flag,
  DonutSmall,
  AccessTime,
  AutoAwesome,
  History,
} from "@mui/icons-material";
import api from "../config/api";
import axios from "axios";
import RichTextEditor from "../components/RichTextEditor";
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
} from "../components/DetailCards";
import { useAuth } from "../context/AuthContext";
import negocioLogo from "../assets/negocio.png";

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
  const [noteData, setNoteData] = useState({ subject: "", description: "" });
  const [callOpen, setCallOpen] = useState(false);
  const [callData, setCallData] = useState({
    subject: "",
    description: "",
    duration: "",
  });
  // Estados para el modal de asociaciones de nota
  const [noteAssociateModalOpen, setNoteAssociateModalOpen] = useState(false);
  const [noteSelectedCategory, setNoteSelectedCategory] = useState("empresas");
  const [noteAssociateSearch, setNoteAssociateSearch] = useState("");
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
  const [noteLoadingAssociations, setNoteLoadingAssociations] = useState(false);
  const [selectedCompaniesForNote, setSelectedCompaniesForNote] = useState<
    number[]
  >([]);
  const [selectedContactsForNote, setSelectedContactsForNote] = useState<
    number[]
  >([]);
  const [selectedAssociationsForNote, setSelectedAssociationsForNote] =
    useState<number[]>([]);
  const [excludedCompaniesForNote, setExcludedCompaniesForNote] = useState<
    number[]
  >([]);
  const [excludedContactsForNote, setExcludedContactsForNote] = useState<
    number[]
  >([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    type: "todo" as string,
  });
  const [saving, setSaving] = useState(false);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [moreOptionsMenuAnchorEl, setMoreOptionsMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [activitySearch, setActivitySearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [, setAddCompanyMenuAnchor] = useState<null | HTMLElement>(null);
  const [, setAddContactMenuAnchor] = useState<null | HTMLElement>(null);
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

      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
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

  useEffect(() => {
    if (descriptionEditorRef.current && taskOpen) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || "";
      }
    }
  }, [taskData.description, taskOpen]);

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
        e.key &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "Shift" ||
          e.key === "Control" ||
          e.key === "Meta")
      ) {
        updateActiveFormats();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    editor.addEventListener("mouseup", handleMouseUp);
    editor.addEventListener("keyup", handleKeyUp as EventListener);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      editor.removeEventListener("mouseup", handleMouseUp);
      editor.removeEventListener("keyup", handleKeyUp as EventListener);
    };
  }, [updateActiveFormats, taskOpen]);

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

  const fetchAssociationsForNote = async (searchTerm?: string) => {
    setNoteLoadingAssociations(true);
    try {
      if (searchTerm && searchTerm.trim().length > 0) {
        const [companiesRes, contactsRes, dealsRes, ticketsRes] =
          await Promise.all([
            api.get("/companies", {
              params: { limit: 1000, search: searchTerm },
            }),
            api.get("/contacts", {
              params: { limit: 1000, search: searchTerm },
            }),
            api.get("/deals", { params: { limit: 1000, search: searchTerm } }),
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
        // Cargar elementos asociados al negocio actual
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

        // Cargar empresas vinculadas
        if (dealCompanies && dealCompanies.length > 0) {
          associatedItems.companies = dealCompanies;
        } else if (deal?.Company) {
          associatedItems.companies = [deal.Company];
        }

        // Cargar contactos vinculados
        if (dealContacts && dealContacts.length > 0) {
          associatedItems.contacts = dealContacts;
        } else if (deal?.Contact) {
          associatedItems.contacts = [deal.Contact];
        }

        // El negocio actual siempre está asociado
        if (deal) {
          associatedItems.deals = [deal];
        }

        setNoteModalCompanies(associatedItems.companies);
        setNoteModalContacts(associatedItems.contacts);
        setNoteModalDeals(associatedItems.deals);
        setNoteModalTickets(associatedItems.tickets);
      }
    } catch (error) {
      console.error("Error fetching associations:", error);
    } finally {
      setNoteLoadingAssociations(false);
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
        await api.post(`/deals/${id}/companies`, {
          companyIds: [response.data.id],
        });
      }
      await fetchDeal();
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
        await api.post(`/deals/${id}/companies`, {
          companyIds: selectedExistingCompanies,
        });
        // Recargar el deal para obtener las empresas actualizadas
        await fetchDeal();
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

  const handleOpenNote = () => {
    setNoteData({ subject: "", description: "" });
    setNoteOpen(true);
    // Inicializar asociaciones
    setSelectedCompaniesForNote([]);
    setSelectedContactsForNote([]);
    setSelectedAssociationsForNote([]);
    setExcludedCompaniesForNote([]);
    setExcludedContactsForNote([]);
  };

  const handleSaveNote = async () => {
    if (!noteData.description.trim()) {
      return;
    }
    setSaving(true);

    try {
      // Obtener empresas seleccionadas
      const companiesToAssociate = selectedCompaniesForNote.filter(
        (companyId) => !excludedCompaniesForNote.includes(companyId)
      );

      // Obtener contactos seleccionados
      const contactsToAssociate = selectedContactsForNote.filter(
        (contactId) => !excludedContactsForNote.includes(contactId)
      );

      // Crear nota asociada al negocio actual
      const activityData: any = {
        subject: noteData.subject || `Nota para ${deal?.name || "Negocio"}`,
        description: noteData.description,
        dealId: id,
      };

      // Agregar asociaciones si existen
      if (companiesToAssociate.length > 0) {
        activityData.companyId = companiesToAssociate[0]; // Solo una empresa por nota
      }
      if (contactsToAssociate.length > 0) {
        activityData.contactId = contactsToAssociate[0]; // Solo un contacto por nota
      }

      await api.post("/activities/notes", activityData);

      setSuccessMessage("Nota creada exitosamente");
      setNoteOpen(false);
      setNoteData({ subject: "", description: "" });
      setSelectedCompaniesForNote([]);
      setSelectedContactsForNote([]);
      setSelectedAssociationsForNote([]);
      setExcludedCompaniesForNote([]);
      setExcludedContactsForNote([]);
      fetchActivities();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving note:", error);
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

  const handleOpenCall = () => {
    setCallData({ subject: "", description: "", duration: "" });
    setCallOpen(true);
  };

  const handleSaveCall = async () => {
    if (!callData.subject.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Crear actividad de llamada asociada al deal
      await api.post("/activities/calls", {
        subject: callData.subject,
        description: callData.description,
        dealId: id,
        contactId: deal?.Contact?.id,
        companyId: deal?.Company?.id,
      });
      setSuccessMessage("Llamada registrada exitosamente");
      setCallOpen(false);
      setCallData({ subject: "", description: "", duration: "" });
      fetchDeal(); // Actualizar actividades
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving call:", error);
    } finally {
      setSaving(false);
    }
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

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (taskData.dueDate) {
      // Parsear el string YYYY-MM-DD como fecha local para evitar problemas de UTC
      const dateMatch = taskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Los meses en Date son 0-11
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
    // Crear fecha para mostrar en el calendario (mes es 1-12, pero Date usa 0-11)
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    // Formatear directamente como YYYY-MM-DD sin conversiones de zona horaria
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
    // Obtener la fecha actual en hora de Perú
    const today = new Date();
    const peruToday = new Date(
      today.toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const year = peruToday.getFullYear();
    const month = peruToday.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    const day = peruToday.getDate();
    // Usar la misma función handleDateSelect con los valores directos
    handleDateSelect(year, month, day);
  };

  const handleCreateActivity = (
    type: "note" | "task" | "email" | "call" | "meeting"
  ) => {
    setCreateActivityMenuAnchor(null);
    if (type === "note") {
      setNoteData({ subject: "", description: "" });
      setNoteOpen(true);
    } else if (type === "task") {
      setTaskData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        type: "todo",
      });
      setTaskOpen(true);
    } else if (type === "meeting") {
      setTaskData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        type: "meeting",
      });
      setTaskOpen(true);
    } else if (type === "call") {
      setCallOpen(true);
    }
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

    // Días del mes anterior
    // Si el mes empieza en domingo (0), no hay días del mes anterior
    // Si empieza en lunes (1), hay 1 día del mes anterior, etc.
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
        dealId: id,
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
      fetchActivities();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving task:", error);
      setSuccessMessage("Error al crear la tarea");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setSaving(false);
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

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        pb: { xs: 2, sm: 3, md: 4 },
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
            onClick={() => navigate("/deals")}
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
            Información del negocio
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
            onClick={() => navigate("/deals")}
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
            Negocios
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
            {deal?.name}
          </Typography>
        </Box>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2, mx: { xs: 2, sm: 3, md: 4 } }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

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
        {/* Columna Principal - Descripción y Actividades */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* DealHeader */}
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
                  src={negocioLogo}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: negocioLogo
                      ? "transparent"
                      : taxiMonterricoColors.green,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                  }}
                >
                  {!negocioLogo && getInitials(deal.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, fontSize: "1.25rem", mb: 0.5 }}
                  >
                    {deal.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {formatCurrency(deal.amount || 0)}{" "}
                    {deal.closeDate
                      ? `• ${new Date(deal.closeDate).toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}`
                      : ""}
                  </Typography>
                </Box>
              </Box>

              {/* Derecha: Etapa + Menú desplegable de acciones */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Chip
                  label={getStageLabel(deal.stage)}
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
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 4px 20px rgba(0,0,0,0.5)"
                          : "0 4px 20px rgba(0,0,0,0.15)",
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
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Note
                      sx={{
                        fontSize: 20,
                        mr: 1.5,
                        color: theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary }}
                    >
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
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Phone
                      sx={{
                        fontSize: 20,
                        mr: 1.5,
                        color: theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary }}
                    >
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
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Assignment
                      sx={{
                        fontSize: 20,
                        mr: 1.5,
                        color: theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      Crear tarea
                    </Typography>
                  </MenuItem>
                </Menu>
                <Tooltip title="Más opciones">
                  <IconButton
                    onClick={(e) => setMoreOptionsMenuAnchorEl(e.currentTarget)}
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
                <Menu
                  anchorEl={moreOptionsMenuAnchorEl}
                  open={Boolean(moreOptionsMenuAnchorEl)}
                  onClose={() => setMoreOptionsMenuAnchorEl(null)}
                  TransitionProps={{
                    timeout: 200,
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 4px 20px rgba(0,0,0,0.5)"
                          : "0 4px 20px rgba(0,0,0,0.15)",
                      bgcolor: theme.palette.background.paper,
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
                    onClick={() => {
                      // TODO: Implementar edición
                      setMoreOptionsMenuAnchorEl(null);
                    }}
                    sx={{
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    Editar
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      // TODO: Implementar eliminación
                      setMoreOptionsMenuAnchorEl(null);
                    }}
                    sx={{
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    Eliminar
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      // TODO: Implementar duplicación
                      setMoreOptionsMenuAnchorEl(null);
                    }}
                    sx={{
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    Duplicar
                  </MenuItem>
                </Menu>
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
              }}
            >
              {deal.closeDate && (
                <Chip
                  icon={<CalendarToday sx={{ fontSize: 14 }} />}
                  label={`Cierre: ${new Date(deal.closeDate).toLocaleDateString(
                    "es-ES",
                    { day: "numeric", month: "short", year: "numeric" }
                  )}`}
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
              {deal.Owner && (
                <Chip
                  icon={<Person sx={{ fontSize: 14 }} />}
                  label={`${deal.Owner.firstName} ${deal.Owner.lastName}`}
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
              <Chip
                icon={
                  <Flag
                    sx={{
                      fontSize: 14,
                      color:
                        (deal.priority || "baja") === "baja"
                          ? taxiMonterricoColors.green
                          : (deal.priority || "baja") === "media"
                          ? "#F59E0B"
                          : "#EF4444",
                    }}
                  />
                }
                label={
                  deal.priority === "baja"
                    ? "Baja"
                    : deal.priority === "media"
                    ? "Media"
                    : deal.priority === "alta"
                    ? "Alta"
                    : "Baja"
                }
                size="small"
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#FFFFFF",
                  border: `1px solid ${theme.palette.divider}`,
                  color:
                    (deal.priority || "baja") === "baja"
                      ? taxiMonterricoColors.green
                      : (deal.priority || "baja") === "media"
                      ? "#F59E0B"
                      : "#EF4444",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color:
                      (deal.priority || "baja") === "baja"
                        ? taxiMonterricoColors.green
                        : (deal.priority || "baja") === "media"
                        ? "#F59E0B"
                        : "#EF4444",
                  },
                }}
              />
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
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
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

          {/* Tab Resumen */}
          {activeTab === 0 && (
            <>
              {/* Cards de Fecha de Creación, Etapa del Negocio, Última Actividad y Propietario */}
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
                    {deal.createdAt
                      ? `${new Date(deal.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )} ${new Date(deal.createdAt).toLocaleTimeString(
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
                      Etapa del negocio
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
                      {deal.stage ? getStageLabel(deal.stage) : "No disponible"}
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
                      Propietario del negocio
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {deal.Owner
                      ? deal.Owner.firstName || deal.Owner.lastName
                        ? `${deal.Owner.firstName || ""} ${
                            deal.Owner.lastName || ""
                          }`.trim()
                        : deal.Owner.email || "Sin nombre"
                      : "No asignado"}
                  </Typography>
                </Card>
              </Box>

              {/* Grid 2x2 para Actividades Recientes, Contactos, Empresas y Negocios */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <RecentActivitiesCard activities={activities} />
                <LinkedContactsCard contacts={dealContacts || []} />
                <LinkedCompaniesCard companies={dealCompanies || []} />
                <LinkedDealsCard deals={dealDeals || []} />
              </Box>
            </>
          )}

          {/* Card de Descripción - Solo visible en pestaña Información Avanzada */}
          {activeTab === 1 && deal.description && (
            <Card
              sx={{
                borderRadius: 2,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.1)",
                bgcolor: theme.palette.background.paper,
                px: 2,
                py: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Vista de Descripción */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {deal.description}
                  </Typography>
            </Card>
          )}

          {/* Card de Actividades Recientes - Solo visible en pestaña Información Avanzada cuando no hay descripción */}
          {activeTab === 1 && !deal.description && (
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
          )}

          {/* Cards de Contactos, Empresas, Negocios y Tickets - Solo en pestaña Información Avanzada */}
          {activeTab === 1 && (
            <>
              {/* Card de Contactos*/}
              <FullContactsTableCard
                contacts={dealContacts || []}
                searchValue={contactSearch}
                onSearchChange={setContactSearch}
                onAddExisting={() => {
                  setAddContactMenuAnchor(null);
                  setContactDialogTab("existing");
                  const existingContactIds = (dealContacts || []).map(
                    (c: any) => c.id
                  );
                  setSelectedExistingContacts(existingContactIds);
                  setAddContactDialogOpen(true);
                  fetchAllContacts();
                }}
                onAddNew={() => {
                  setAddContactMenuAnchor(null);
                  setContactDialogTab("create");
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
                      console.error("Error al eliminar contacto:", error);
                      alert(
                        error.response?.data?.error ||
                          "Error al eliminar el contacto"
                      );
                    }
                  }
                }}
                showActions={true}
                getContactInitials={(firstName, lastName) => getInitials(firstName, lastName)}
                onCopyToClipboard={handleCopyToClipboard}
              />

              {/* Card de Empresas */}
              <FullCompaniesTableCard
                companies={dealCompanies || []}
                searchValue={companySearch}
                onSearchChange={setCompanySearch}
                onAddExisting={() => {
                  setAddCompanyMenuAnchor(null);
                  setCompanyDialogTab("existing");
                  const existingCompanyIds = (dealCompanies || []).map(
                    (c: any) => c.id
                  );
                  setSelectedExistingCompanies(existingCompanyIds);
                  setAddCompanyDialogOpen(true);
                  fetchAllCompanies();
                }}
                onAddNew={() => {
                  setAddCompanyMenuAnchor(null);
                  setCompanyDialogTab("create");
                  setAddCompanyDialogOpen(true);
                }}
                onRemove={handleRemoveCompanyClick}
                showActions={true}
                onCopyToClipboard={handleCopyToClipboard}
                sortField={companySortField}
                sortOrder={companySortOrder}
                onSort={handleSortCompanies}
              />

              {/* Card de Negocios */}
              <FullDealsTableCard
                deals={dealDeals || []}
                searchValue={dealSearch}
                onSearchChange={setDealSearch}
                onAddExisting={() => {
                  setDealDialogTab("existing");
                  const existingDealIds = (dealDeals || []).map(
                    (d: any) => d.id
                  );
                  setSelectedExistingDeals(existingDealIds);
                  setAddDealDialogOpen(true);
                  fetchAllDeals();
                }}
                onAddNew={() => {
                  setDealDialogTab("create");
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
          )}

          {/* Tab Actividades */}
          {activeTab === 2 && (
            <>
              <ActivitiesTabContent
                activities={activities}
                activitySearch={activitySearch}
                onSearchChange={setActivitySearch}
                onCreateActivity={(type) => handleCreateActivity(type as "note" | "task" | "email" | "call" | "meeting")}
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
            </>
          )}
        </Box>
      </Box>

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
              "@keyframes fadeIn": {
                "0%": {
                  opacity: 0,
                },
                "100%": {
                  opacity: 1,
                },
              },
            }}
            onClick={() => setCallOpen(false)}
          />
        </>
      )}

      {/* Modal de crear nota */}
      {noteOpen && (
        <>
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
                    transition: "all 0.2s ease",
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
                      setNoteSelectedCategory("empresas");
                      setNoteAssociateSearch("");
                      setNoteSelectedAssociations({
                        companies: selectedCompaniesForNote,
                        contacts: selectedContactsForNote,
                        deals: selectedAssociationsForNote
                          .filter((id: number) => id > 1000 && id < 2000)
                          .map((id) => id - 1000),
                        tickets: selectedAssociationsForNote
                          .filter((id: number) => id > 2000)
                          .map((id) => id - 2000),
                      });
                      fetchAssociationsForNote();
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
                variant="outlined"
                sx={{
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  fontWeight: 600,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
                    : taxiMonterricoColors.green,
                  color: "white",
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: saving
                    ? "none"
                    : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  "&:hover": {
                    backgroundColor: saving
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
          {/* Overlay de fondo cuando la ventana está abierta */}
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
        </>
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
                  selected={noteSelectedCategory === "seleccionados"}
                  onClick={() => setNoteSelectedCategory("seleccionados")}
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
                  selected={noteSelectedCategory === "empresas"}
                  onClick={() => setNoteSelectedCategory("empresas")}
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
                  selected={noteSelectedCategory === "contactos"}
                  onClick={() => setNoteSelectedCategory("contactos")}
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
                  selected={noteSelectedCategory === "negocios"}
                  onClick={() => setNoteSelectedCategory("negocios")}
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
                  selected={noteSelectedCategory === "tickets"}
                  onClick={() => setNoteSelectedCategory("tickets")}
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
              {noteLoadingAssociations ? (
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
                  {noteSelectedCategory === "empresas" && (
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
                              !noteAssociateSearch ||
                              company.name
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase()) ||
                              company.domain
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
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
                                  primary={company.name}
                                  secondary={company.domain}
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

                  {noteSelectedCategory === "contactos" && (
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
                              !noteAssociateSearch ||
                              `${contactItem.firstName} ${contactItem.lastName}`
                                .toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase()) ||
                              contactItem.email
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
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

                  {noteSelectedCategory === "negocios" && (
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
                            (dealItem: any) =>
                              !noteAssociateSearch ||
                              dealItem.name
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((dealItem: any) => (
                            <ListItem key={dealItem.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.deals || [];
                                  if (current.includes(dealItem.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: current.filter(
                                        (id) => id !== dealItem.id
                                      ),
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
                                  checked={
                                    noteSelectedAssociations.deals?.includes(
                                      dealItem.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={dealItem.name}
                                  secondary={`${
                                    dealItem.amount
                                      ? `S/ ${dealItem.amount.toLocaleString("es-ES")}`
                                      : ""
                                  } ${dealItem.stage || ""}`}
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

                  {noteSelectedCategory === "tickets" && (
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
                              !noteAssociateSearch ||
                              ticket.subject
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
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

                  {noteSelectedCategory === "seleccionados" && (
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
                                      primary={company.name}
                                      secondary={company.domain}
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
                            const dealItem = noteModalDeals.find(
                              (d: any) => d.id === dealId
                            );
                            if (!dealItem) return null;
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
                                    primary={dealItem.name}
                                    secondary={`${
                                      dealItem.amount
                                        ? `S/ ${dealItem.amount.toLocaleString("es-ES")}`
                                        : ""
                                    } ${dealItem.stage || ""}`}
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
              setSelectedCompaniesForNote(
                noteSelectedAssociations.companies || []
              );
              setSelectedContactsForNote(
                noteSelectedAssociations.contacts || []
              );
              // Convertir deals y tickets a la estructura esperada
              const dealIds = (noteSelectedAssociations.deals || []).map(
                (id) => 1000 + id
              );
              const ticketIds = (noteSelectedAssociations.tickets || []).map(
                (id) => 2000 + id
              );
              setSelectedAssociationsForNote([...dealIds, ...ticketIds]);
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

      {/* Dialog para crear tarea */}
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
                value={
                  taskData.dueDate ? formatDateDisplay(taskData.dueDate) : ""
                }
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

      {/* Dialog para ver detalles de actividad expandida */}
      <ActivityDetailDialog
        activity={expandedActivity}
        open={!!expandedActivity}
        onClose={() => setExpandedActivity(null)}
        getActivityTypeLabel={getActivityTypeLabel}
                  />
                </Box>
  );
};

export default DealDetail;
