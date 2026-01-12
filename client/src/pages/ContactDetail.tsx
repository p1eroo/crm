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
  InputAdornment,
  Tooltip,
  Card,
  useTheme,
  Popover,
  Drawer,
  useMediaQuery,
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
  Search,
  KeyboardArrowRight,
  History,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
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
  AutoAwesome,
  ReportProblem,
  Receipt,
  TaskAlt,
  LocationOn,
  AccessTime,
  DonutSmall,
  Person,
  Business,
} from "@mui/icons-material";
import api from "../config/api";
import RichTextEditor from "../components/RichTextEditor";
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
} from "../components/DetailCards";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { formatDatePeru } from "../utils/dateUtils";
import contactLogo from "../assets/contact.png";

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
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [contact, setContact] = useState<ContactDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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
  const [selectedAssociations, setSelectedAssociations] = useState<number[]>(
    []
  );
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [, setEmailValue] = useState("");
  const [, setPhoneValue] = useState("");
  const [, setCompanyValue] = useState("");
  // Estados para elementos excluidos (desmarcados manualmente aunque estén asociados)
  const [excludedCompanies, setExcludedCompanies] = useState<number[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [emailConnectModalOpen, setEmailConnectModalOpen] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);

  // Estados para formularios
  const [noteData, setNoteData] = useState({ subject: "", description: "" });
  const [,] = useState({ subject: "", description: "", to: "" });
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
  const descriptionEditorRef = React.useRef<HTMLDivElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetingData, setMeetingData] = useState({
    subject: "",
    description: "",
    date: "",
    time: "",
  });
  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);

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

      setActivities(allActivities);

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
  }, [id, isRemovingCompany]);

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
      // Inicializar asociaciones seleccionadas con los registros relacionados reales
      if (contact.id) {
        setSelectedContacts([contact.id]);
      }
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

    // Inicializar contacto seleccionado
    if (contact?.id) {
      setSelectedContacts((prev) => {
        if (!prev.includes(contact.id)) {
          return [...prev, contact.id];
        }
        return prev;
      });
    }
  }, [associatedCompanies, associatedDeals, associatedTickets, contact?.id]);

  const fetchAllCompanies = async () => {
    try {
      const response = await api.get("/companies", { params: { limit: 1000 } });
      setAllCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching all companies:", error);
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

  const fetchAssociations = async (searchTerm?: string) => {
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
        // Si no hay búsqueda, solo cargar los vinculados al contacto actual
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

        // Cargar empresas vinculadas si existen
        if (contact?.Companies && contact.Companies.length > 0) {
          associatedItems.companies = contact.Companies;
        } else if (contact?.Company) {
          associatedItems.companies = [contact.Company];
        }

        // El contacto actual siempre está asociado
        if (contact) {
          associatedItems.contacts = [contact];
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

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      // Si solo hay un nombre (empresa/deal), tomar las primeras 2 letras
      const name = firstName.trim();
      if (name.length >= 2) {
        return name.substring(0, 2).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return "?";
  };

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Funciones para abrir diálogos
  const handleOpenNote = () => {
    setNoteData({ subject: "", description: "" });
    setCreateFollowUpTask(false);
    setNoteOpen(true);
  };

  // Ya no se usa login individual de Google - se usa el token guardado desde Perfil

  const handleOpenEmail = async () => {
    if (!contact?.email) {
      setWarningMessage("El contacto no tiene un email registrado");
      setTimeout(() => setWarningMessage(""), 3000);
      return;
    }

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
      const companies =
        contact?.Companies && Array.isArray(contact.Companies)
          ? contact.Companies
          : contact?.Company
          ? [contact.Company]
          : [];

      if (companies.length > 0) {
        const activityPromises = companies.map((company: any) =>
          api.post("/activities/emails", {
            subject: emailData.subject,
            description: emailData.body.replace(/<[^>]*>/g, ""), // Remover HTML para la descripción
            contactId: id,
            companyId: company.id,
          })
        );
        await Promise.all(activityPromises);
      } else {
        await api.post("/activities/emails", {
          subject: emailData.subject,
          description: emailData.body.replace(/<[^>]*>/g, ""),
          contactId: id,
        });
      }

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

  const handleOpenMeeting = () => {
    setMeetingData({ subject: "", description: "", date: "", time: "" });
    setMeetingOpen(true);
  };

  // Funciones para guardar
  const handleSaveNote = async () => {
    if (!noteData.description.trim()) {
      setSuccessMessage("");
      return;
    }
    setSaving(true);

    // Variables para debugging
    let contactsToCreateNote: number[] = [];
    let finalContactIds: number[] = [];
    let companiesToAssociate: number[] = [];

    try {
      // Obtener contactos seleccionados (incluyendo el contacto actual si no está excluido)
      contactsToCreateNote = selectedContacts.filter(
        (contactId) => !excludedContacts.includes(contactId)
      );

      // Si no hay contactos seleccionados, usar el contacto actual
      finalContactIds =
        contactsToCreateNote.length > 0
          ? contactsToCreateNote
          : contact?.id
          ? [contact.id]
          : [];

      if (finalContactIds.length === 0) {
        setSuccessMessage("Error: No hay contactos seleccionados");
        setTimeout(() => setSuccessMessage(""), 3000);
        setSaving(false);
        return;
      }

      // Obtener empresas seleccionadas
      companiesToAssociate = selectedCompanies.filter(
        (companyId) => !excludedCompanies.includes(companyId)
      );

      // Crear notas para cada contacto seleccionado
      const activityPromises: Promise<any>[] = [];

      for (const contactId of finalContactIds) {
        // Obtener información del contacto para el subject
        let contactName = `Contacto ${contactId}`;
        try {
          const contactResponse = await api.get(`/contacts/${contactId}`);
          const contactData = contactResponse.data;
          contactName =
            `${contactData.firstName || ""} ${
              contactData.lastName || ""
            }`.trim() || contactName;
        } catch (e) {
          console.error(`Error fetching contact ${contactId}:`, e);
        }

        if (companiesToAssociate.length > 0) {
          // Crear una nota para cada combinación de contacto y empresa
          for (const companyId of companiesToAssociate) {
            activityPromises.push(
              api.post("/activities/notes", {
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
            api.post("/activities/notes", {
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
          const contactResponse = await api.get(
            `/contacts/${finalContactIds[0]}`
          );
          const contactData = contactResponse.data;
          firstContactName =
            `${contactData.firstName || ""} ${
              contactData.lastName || ""
            }`.trim() || firstContactName;
        } catch (e) {
          console.error(`Error fetching contact ${finalContactIds[0]}:`, e);
        }

        await api.post("/tasks", {
          title: `Seguimiento de nota: ${
            noteData.subject || `Nota para ${firstContactName}`
          }`,
          description: `Tarea de seguimiento generada automáticamente por la nota: ${noteData.description}`,
          type: "todo",
          status: "not started",
          priority: "medium",
          dueDate: followUpDate.toISOString().split("T")[0],
          contactId: finalContactIds[0],
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
        selectedContacts,
        finalContactIds:
          contactsToCreateNote.length > 0
            ? contactsToCreateNote
            : contact?.id
            ? [contact.id]
            : [],
        companiesToAssociate,
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

  const handleSaveCall = async () => {
    if (!callData.subject.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Obtener empresas asociadas al contacto
      const companies =
        contact?.Companies && Array.isArray(contact.Companies)
          ? contact.Companies
          : contact?.Company
          ? [contact.Company]
          : [];

      // Crear una actividad para cada empresa asociada, o solo con contactId si no hay empresas
      if (companies.length > 0) {
        // Crear actividad para cada empresa asociada
        const activityPromises = companies.map((company: any) =>
          api.post("/activities/calls", {
            subject: callData.subject,
            description: callData.description,
            contactId: id,
            companyId: company.id,
          })
        );
        await Promise.all(activityPromises);
      } else {
        // Si no hay empresas asociadas, crear solo con contactId
        await api.post("/activities/calls", {
          subject: callData.subject,
          description: callData.description,
          contactId: id,
        });
      }
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
      // Obtener empresas asociadas al contacto
      const companies =
        contact?.Companies && Array.isArray(contact.Companies)
          ? contact.Companies
          : contact?.Company
          ? [contact.Company]
          : [];

      // Preparar datos de la tarea
      const taskPayload = {
        title: taskData.title,
        description: taskData.description,
        type: "todo",
        status: "not started",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate || undefined,
        contactId: id,
      };

      // Crear una tarea para cada empresa asociada, o solo con contactId si no hay empresas
      if (companies.length > 0) {
        // Crear tarea para cada empresa asociada
        const taskPromises = companies.map((company: any) =>
          api.post("/tasks", {
            ...taskPayload,
            companyId: company.id,
          })
        );
        await Promise.all(taskPromises);
      } else {
        // Si no hay empresas asociadas, crear solo con contactId
        await api.post("/tasks", taskPayload);
      }
      setSuccessMessage(
        "Tarea creada exitosamente" +
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
        contactId: id,
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
        // Abrir Gmail con el correo del contacto prellenado
        const email = contact?.email || "";
        const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(
          email
        )}`;
        window.open(gmailUrl, "_blank");
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

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: { xs: "100vh", md: "100vh" },
        pb: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
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
            onClick={() => navigate("/contacts")}
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
            Información del contacto
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
            onClick={() => navigate("/contacts")}
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
            Contactos
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
            {contact?.firstName} {contact?.lastName}
          </Typography>
        </Box>
      </Box>

      {/* Contenido principal - Separado en 2 partes */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 3 },
          flex: 1,
          overflow: "visible",
          minHeight: { xs: "auto", md: 0 },
          height: { xs: "auto", md: "auto" },
          maxHeight: { xs: "none", md: "none" },
          alignItems: { xs: "stretch", md: "flex-start" },
          alignContent: "flex-start",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Columna Principal - Tabs y Contenido */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            minHeight: 0,
            width: { xs: "100%", md: "auto" },
          }}
        >
          {/* ContactHeader */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 2.5,
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
                  src={contact.avatar || contactLogo}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor:
                      contact.avatar || contactLogo
                        ? "transparent"
                        : taxiMonterricoColors.green,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                  }}
                >
                  {!contact.avatar &&
                    !contactLogo &&
                    getInitials(contact.firstName, contact.lastName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, fontSize: "1.25rem", mb: 0.5 }}
                  >
                    {contact.firstName} {contact.lastName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    {contact.jobTitle ||
                      contact.email ||
                      "Sin información adicional"}
                  </Typography>
                </Box>
              </Box>

              {/* Derecha: Etapa + Menú desplegable de acciones */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Chip
                  label={getStageLabel(contact.lifecycleStage)}
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
                  {contact.email && (
                    <MenuItem
                      onClick={() => {
                        handleOpenEmail();
                        setActionsMenuAnchorEl(null);
                      }}
                    >
                      <Email sx={{ fontSize: 20, mr: 1.5 }} />
                      Enviar email
                    </MenuItem>
                  )}
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
                    onClick={handleMenuClose}
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
              }}
            >
              {contact.email && (
                <Chip
                  icon={<Email sx={{ fontSize: 14 }} />}
                  label={contact.email}
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
              {contact.phone && (
                <Chip
                  icon={<Phone sx={{ fontSize: 14 }} />}
                  label={contact.phone}
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
              {(contact.city || contact.address) && (
                <Chip
                  icon={<LocationOn sx={{ fontSize: 14 }} />}
                  label={contact.city || contact.address || "--"}
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

          {/* Tab Resumen - Cards pequeñas y Actividades Recientes */}
          {activeTab === 0 && (
            <>
              {/* Cards de Fecha de Creación, Etapa del Ciclo de Vida y Última Actividad */}
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
                    {contact.createdAt
                      ? `${new Date(contact.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )} ${new Date(contact.createdAt).toLocaleTimeString(
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
                      {contact.lifecycleStage
                        ? getStageLabel(contact.lifecycleStage)
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
                    {contact.Owner
                      ? contact.Owner.firstName || contact.Owner.lastName
                        ? `${contact.Owner.firstName || ""} ${
                            contact.Owner.lastName || ""
                          }`.trim()
                        : contact.Owner.email || "Sin nombre"
                      : "No asignado"}
                  </Typography>
                </Card>
              </Box>

              {/* Grid 2x2 para Actividades Recientes, Empresas, Negocios y Tickets */}
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
                <LinkedCompaniesCard companies={associatedCompanies} />
                <LinkedDealsCard deals={associatedDeals} />
                <LinkedTicketsCard tickets={associatedTickets} />
              </Box>
            </>
          )}

          {/* Tab Información Avanzada - Vista de Actividades completa */}
          {activeTab === 1 && (
            <>
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

              {/* Empresas */}
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
            </>
          )}

          {/* Tab Actividades */}
          {activeTab === 2 && (
            <>
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
            </>
          )}
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
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)"
                }`,
                borderRight: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.15)"
                }`,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : "linear-gradient(180deg, rgba(249, 250, 251, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
                backgroundImage:
                  theme.palette.mode === "dark"
                    ? "none"
                    : "linear-gradient(180deg, rgba(249, 250, 251, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
                p: 2,
                pb: 3,
                boxSizing: "border-box",
                overflowY: "auto",
                height: "fit-content",
                maxHeight: "calc(100vh - 80px)",
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
                    sx={{ fontWeight: 600, fontSize: "1.125rem" }}
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
                      sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
                    >
                      Muestra preocupantes
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                    >
                      {associatedTickets.length > 0
                        ? `Este contacto tiene ${associatedTickets.length} ticket(s) abierto(s) que requieren atención.`
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
                      backgroundColor: "rgba(255, 152, 0, 0.08)",
                    },
                  }}
                  onClick={() => {
                    setActiveTab(2);
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
                      sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
                    >
                      Próximas pérdidas
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
                    >
                      {associatedTickets.length > 0 ||
                      contact.lifecycleStage === "customer"
                        ? "Facturas pendientes o pagos atrasados detectados. Revisa el estado financiero."
                        : "Sin datos suficientes para identificar riesgos financieros en este momento."}
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
                      backgroundColor: "rgba(244, 67, 54, 0.08)",
                    },
                  }}
                  onClick={() => {
                    setActiveTab(2);
                    setCopilotOpen(false);
                  }}
                >
                  Ver facturas
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
                      sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
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
                      backgroundColor: "rgba(46, 125, 50, 0.08)",
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
                              case "contact":
                                return <Person sx={{ fontSize: 16 }} />;
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
                          case "contact":
                            return <Person sx={{ fontSize: 16 }} />;
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
            borderLeft: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)"
            }`,
            bgcolor:
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : "linear-gradient(180deg, rgba(249, 250, 251, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
            backgroundImage:
              theme.palette.mode === "dark"
                ? "none"
                : "linear-gradient(180deg, rgba(249, 250, 251, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
            pt: { xs: "76px", sm: 2 },
            px: 2,
            pb: 2,
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
              sx={{ fontWeight: 600, fontSize: "1.125rem" }}
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
                sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
              >
                Muestra preocupantes
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                {associatedTickets.length > 0
                  ? `Este contacto tiene ${associatedTickets.length} ticket(s) abierto(s) que requieren atención.`
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
                backgroundColor: "rgba(255, 152, 0, 0.08)",
              },
            }}
            onClick={() => {
              setActiveTab(2);
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
                sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
              >
                Próximas pérdidas
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                {associatedTickets.length > 0 ||
                contact.lifecycleStage === "customer"
                  ? "Facturas pendientes o pagos atrasados detectados. Revisa el estado financiero."
                  : "Sin datos suficientes para identificar riesgos financieros en este momento."}
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
                backgroundColor: "rgba(244, 67, 54, 0.08)",
              },
            }}
            onClick={() => {
              setActiveTab(2);
              setCopilotOpen(false);
            }}
          >
            Ver facturas
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
                sx={{ fontWeight: 700, mb: 0.5, fontSize: "0.875rem" }}
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
                backgroundColor: "rgba(46, 125, 50, 0.08)",
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
                      contacts: contact?.id ? [contact.id] : [],
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
                                        (id: number) => id !== company.id
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
        TransitionProps={{
          appear: false,
          timeout: 0,
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
            width: "560px",
            maxWidth: "90vw",
          },
        }}
        BackdropProps={{
          sx: {
            transition: 'none',
          },
          transitionDuration: 0,
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
            Tarea
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
              // Calcular año y mes correctos
              let year = currentMonth.getFullYear();
              let month = currentMonth.getMonth();

              if (!item.isCurrentMonth) {
                if (index < 7) {
                  // Mes anterior
                  month = month - 1;
                  if (month < 0) {
                    month = 11;
                    year = year - 1;
                  }
                } else {
                  // Mes siguiente
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
                      // Pasar directamente año, mes y día para evitar problemas de zona horaria
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
                  <Event
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
                  Reunión
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
                onClick={() => setMeetingOpen(false)}
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
                value={meetingData.subject}
                onChange={(e) =>
                  setMeetingData({ ...meetingData, subject: e.target.value })
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
              <Box sx={{ display: "flex", gap: 2 }}>
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
                  label="Hora"
                  type="time"
                  value={meetingData.time}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, time: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
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
                onClick={() => setMeetingOpen(false)}
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
                onClick={handleSaveMeeting}
                variant="contained"
                disabled={saving || !meetingData.subject.trim()}
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
            }}
            onClick={() => setMeetingOpen(false)}
          />
        </>
      )}

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
    </Box>
  );
};

export default ContactDetail;
