import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  MenuItem,
  Menu,
  Chip,
  CircularProgress,
  Link,
  Avatar,
  Divider,
  Tooltip,
  Select,
  FormControl,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
  LinearProgress,
  Popover,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Close,
  Business,
  Email,
  Phone,
  Person,
  Note,
  Assignment,
  Event,
  MoreVert,
  KeyboardArrowDown,
  LocationOn,
  Flag,
  TrendingUp,
  FilterList,
  Visibility,
  CheckCircle,
  FileDownload,
  UploadFile,
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
  Edit,
  ChevronLeft,
  ChevronRight,
  ViewColumn,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { taxiMonterricoColors } from "../theme/colors";
import { pageStyles } from "../theme/styles";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import * as XLSX from "xlsx";
import contactLogo from "../assets/contact.png";
import { UnifiedTable } from "../components/UnifiedTable";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  lifecycleStage: string;
  leadStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  avatar?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  ownerId?: number | null;
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
  }>;
  Owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewActivities, setPreviewActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [activeTab] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    lifecycleStage: "lead",
    companyId: "",
    dni: "",
    cee: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [createCompanyDialogOpen, setCreateCompanyDialogOpen] = useState(false);
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
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState("");
  const [idType, setIdType] = useState<"dni" | "cee">("dni");
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState("");
  const [loadingCee, setLoadingCee] = useState(false);
  const [ceeError, setCeeError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [emailValidationError, setEmailValidationError] = useState("");
  const [dniValidationError, setDniValidationError] = useState("");
  const [ceeValidationError, setCeeValidationError] = useState("");
  const emailValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const dniValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const ceeValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importProgressOpen, setImportProgressOpen] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    errors: 0,
  });
  const [selectedOwnerFilter] = useState<string | number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_users, setUsers] = useState<any[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [filterRules, setFilterRules] = useState<Array<{
    id: string;
    column: string;
    operator: string;
    value: string;
  }>>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedOwnerFilters, setSelectedOwnerFilters] = useState<
    (string | number)[]
  >([]);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  
  // Estados para filtros por columna
  const [columnFilters, setColumnFilters] = useState<{
    nombre: string;
    empresa: string;
    telefono: string;
    pais: string;
    etapa: string;
  }>({
    nombre: '',
    empresa: '',
    telefono: '',
    pais: '',
    etapa: '',
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});

  // Opciones de columnas disponibles
  const columnOptions = [
    { value: 'firstName', label: 'Nombre' },
    { value: 'lastName', label: 'Apellido' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'company', label: 'Empresa' },
    { value: 'country', label: 'País' },
    { value: 'lifecycleStage', label: 'Etapa' },
    { value: 'jobTitle', label: 'Cargo' },
  ];

  // Operadores disponibles
  const operatorOptions = [
    { value: 'contains', label: 'contiene' },
    { value: 'equals', label: 'es igual a' },
    { value: 'notEquals', label: 'no es igual a' },
    { value: 'startsWith', label: 'empieza con' },
    { value: 'endsWith', label: 'termina con' },
  ];

  const fetchUsers = useCallback(async () => {
    // Verificar nuevamente el rol antes de hacer la petición
    if (user?.role !== "admin") {
      setUsers([]);
      return;
    }

    try {
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (error: any) {
      // Si es un error de permisos (403), no mostrar error en consola
      // Solo usuarios admin pueden acceder a /users
      if (error.response?.status === 403 || error.isPermissionError) {
        // Silenciar el error, simplemente no cargar usuarios
        setUsers([]);
        return;
      }
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  }, [user?.role]);

  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const exportData = contacts.map((contact) => ({
      Nombre: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
      Empresa: contact.Company?.name || contact.Companies?.[0]?.name || "--",
      Teléfono: contact.phone || contact.mobile || "--",
      Correo: contact.email || "--",
      País: contact.country || "--",
      Ciudad: contact.city || "--",
      "Estado/Provincia": contact.state || "--",
      Cargo: contact.jobTitle || "--",
      Etapa: contact.lifecycleStage || "--",
      Estado:
        contact.lifecycleStage === "cierre_ganado" ? "Activo" : "Inactivo",
      "Fecha de Creación": contact.createdAt
        ? new Date(contact.createdAt).toLocaleDateString("es-ES")
        : "--",
    }));

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 20 }, // Empresa
      { wch: 15 }, // Teléfono
      { wch: 25 }, // Correo
      { wch: 15 }, // País
      { wch: 15 }, // Ciudad
      { wch: 18 }, // Estado/Provincia
      { wch: 20 }, // Cargo
      { wch: 15 }, // Etapa
      { wch: 12 }, // Estado
      { wch: 18 }, // Fecha de Creación
    ];
    ws["!cols"] = colWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Contactos");

    // Generar el nombre del archivo con la fecha actual
    const fecha = new Date().toISOString().split("T")[0];
    const fileName = `Contactos_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgressOpen(true);
    setImportProgress({ current: 0, total: 0, success: 0, errors: 0 });

    try {
      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      // Función helper para buscar o crear empresa
      const getOrCreateCompany = async (
        companyName: string
      ): Promise<number | null> => {
        if (!companyName || !companyName.trim()) {
          return null;
        }

        try {
          // Buscar empresa existente
          const searchResponse = await api.get("/companies", {
            params: { search: companyName.trim(), limit: 100 },
          });
          const companies =
            searchResponse.data.companies || searchResponse.data || [];
          const existingCompany = companies.find(
            (c: any) =>
              c.name.toLowerCase().trim() === companyName.toLowerCase().trim()
          );

          if (existingCompany) {
            return existingCompany.id;
          }

          // Si no existe, crear la empresa
          const newCompanyResponse = await api.post("/companies", {
            name: companyName.trim(),
            lifecycleStage: "lead",
            ownerId: user?.id || null,
          });
          return newCompanyResponse.data.id;
        } catch (error) {
          console.error("Error al buscar/crear empresa:", error);
          return null;
        }
      };

      // Procesar cada fila y crear contactos
      const contactsToCreate = [];

      for (const row of jsonData) {
        const fullName = (row["Nombre"] || "").toString().trim();

        // Función para separar nombre y apellido
        let firstName = "";
        let lastName = "";

        if (fullName) {
          // Si tiene espacios, separar normalmente
          if (fullName.includes(" ")) {
            const nameParts = fullName.split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          } else {
            // Si no tiene espacios, separar por letras mayúsculas
            // Ejemplo: "RafaelHornaCastillo" -> "Rafael" y "Horna Castillo"
            const matches = fullName.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/g);
            if (matches && matches.length > 0) {
              firstName = matches[0] || "";
              lastName = matches.slice(1).join(" ") || "";
            } else {
              // Si no se puede separar, poner todo como nombre
              firstName = fullName;
            }
          }
        }

        // Obtener o crear la empresa
        const companyName = (row["Empresa"] || "").toString().trim();
        const companyId = companyName
          ? await getOrCreateCompany(companyName)
          : null;

        // Solo agregar si tiene nombre o email
        if (firstName || (row["Correo"] || "").toString().trim()) {
          contactsToCreate.push({
            firstName: firstName || "Sin nombre",
            lastName: lastName || "Sin apellido",
            email: (row["Correo"] || "").toString().trim() || undefined,
            phone: (row["Teléfono"] || "").toString().trim() || undefined,
            jobTitle: (row["Cargo"] || "").toString().trim() || undefined,
            city: (row["Ciudad"] || "").toString().trim() || undefined,
            state:
              (row["Estado/Provincia"] || row["Estado/Provi"] || "")
                .toString()
                .trim() || undefined,
            country: (row["País"] || "").toString().trim() || undefined,
            lifecycleStage:
              (row["Etapa"] || "lead").toString().trim() || "lead",
            companyId: companyId, // Incluir companyId
          });
        }
      }

      // Inicializar el progreso total
      setImportProgress((prev) => ({
        ...prev,
        total: contactsToCreate.length,
      }));

      // Crear contactos en el backend con progreso
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < contactsToCreate.length; i++) {
        const contactData = contactsToCreate[i];
        try {
          await api.post("/contacts", contactData);
          successCount++;
          setImportProgress({
            current: i + 1,
            total: contactsToCreate.length,
            success: successCount,
            errors: errorCount,
          });
        } catch (error) {
          console.error("Error creating contact:", error);
          errorCount++;
          setImportProgress({
            current: i + 1,
            total: contactsToCreate.length,
            success: successCount,
            errors: errorCount,
          });
        }
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Recargar la lista de contactos
      fetchContacts();
    } catch (error) {
      console.error("Error importing file:", error);
      setImportProgress((prev) => ({ ...prev, errors: prev.errors + 1 }));
    } finally {
      setImporting(false);
    }
  };

  const fetchContacts = useCallback(async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get("/contacts", { params });
      setContacts(response.data.contacts || response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await api.get("/companies");
      setCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
    // Solo intentar obtener usuarios si el usuario actual es admin
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [fetchContacts, fetchUsers, fetchCompanies, user?.role]);

  const handleOpen = (contact?: Contact) => {
    setFormErrors({});
    setEmailValidationError("");
    setDniValidationError("");
    setCeeValidationError("");
    if (contact) {
      setEditingContact(contact);
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || "",
        jobTitle: contact.jobTitle || "",
        lifecycleStage: contact.lifecycleStage,
        companyId: contact.Company?.id?.toString() || "",
        dni: (contact as any).dni || "",
        cee: (contact as any).cee || "",
        address: contact.address || "",
        city: contact.city || "",
        state: contact.state || "",
        country: contact.country || "",
      });
    } else {
      setEditingContact(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        lifecycleStage: "lead",
        companyId: "",
        dni: "",
        cee: "",
        address: "",
        city: "",
        state: "",
        country: "",
      });
      setIdType("dni"); // Resetear a DNI por defecto
    }
    setDniError("");
    setCeeError("");
    setOpen(true);
  };

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
    if (!formData.dni || formData.dni.length < 8) {
      setDniError("El DNI debe tener al menos 8 dígitos");
      return;
    }

    setLoadingDni(true);
    setDniError("");

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno o configuración
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";

      if (!factilizaToken) {
        setDniError(
          "⚠️ La búsqueda automática de DNI no está disponible. Puedes ingresar los datos manualmente. Para habilitarla, configura REACT_APP_FACTILIZA_TOKEN en el archivo .env"
        );
        setLoadingDni(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/dni/info/${formData.dni}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Separar nombres y apellidos
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

        // Actualizar el formulario con los datos obtenidos
        setFormData((prev) => ({
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
    if (!formData.cee || formData.cee.length < 12) {
      setCeeError("El CEE debe tener 12 caracteres");
      return;
    }

    setLoadingCee(true);
    setCeeError("");

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno o configuración
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";

      if (!factilizaToken) {
        setCeeError(
          "Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN"
        );
        setLoadingCee(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/cee/info/${formData.cee}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.status === 200 && response.data.data) {
        const data = response.data.data;

        // Separar nombres y apellidos
        const nombres = data.nombres || "";
        const apellidoPaterno = data.apellido_paterno || "";
        const apellidoMaterno = data.apellido_materno || "";

        // Capitalizar solo las iniciales
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(
          `${apellidoPaterno} ${apellidoMaterno}`.trim()
        );

        // Actualizar el formulario con los datos obtenidos
        setFormData((prev) => ({
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

  // Función para validar email en tiempo real
  const validateEmail = async (email: string) => {
    if (emailValidationTimeoutRef.current) {
      clearTimeout(emailValidationTimeoutRef.current);
    }

    if (
      !email ||
      email.trim() === "" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setEmailValidationError("");
      return;
    }

    if (
      editingContact &&
      editingContact.email.toLowerCase() === email.trim().toLowerCase()
    ) {
      setEmailValidationError("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get("/contacts", {
          params: { search: email.trim(), limit: 50 },
        });

        const contacts = response.data.contacts || response.data || [];
        const exactMatch = contacts.find(
          (c: Contact) =>
            c.email.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (exactMatch) {
          setEmailValidationError("Ya existe un contacto con este email");
        } else {
          setEmailValidationError("");
        }
      } catch (error) {
        setEmailValidationError("");
      }
    }, 500);

    emailValidationTimeoutRef.current = timeoutId;
  };

  // Función para validar DNI en tiempo real
  const validateDni = async (dni: string) => {
    if (dniValidationTimeoutRef.current) {
      clearTimeout(dniValidationTimeoutRef.current);
    }

    if (!dni || dni.trim() === "" || dni.length < 8) {
      setDniValidationError("");
      return;
    }

    if (editingContact && (editingContact as any).dni === dni.trim()) {
      setDniValidationError("");
      return;
    }

    // Si tiene exactamente 8 dígitos, validar inmediatamente
    if (dni.length === 8) {
      try {
        const response = await api.get("/contacts", {
          params: { search: dni.trim(), limit: 50 },
        });

        const contacts = response.data.contacts || response.data || [];
        const exactMatch = contacts.find(
          (c: Contact) => (c as any).dni === dni.trim()
        );

        if (exactMatch) {
          setDniValidationError("Ya existe un contacto con este DNI");
        } else {
          setDniValidationError("");
        }
      } catch (error) {
        setDniValidationError("");
      }
    } else {
      // Si tiene menos de 8 dígitos, usar debounce
      const timeoutId = setTimeout(async () => {
        try {
          const response = await api.get("/contacts", {
            params: { search: dni.trim(), limit: 50 },
          });

          const contacts = response.data.contacts || response.data || [];
          const exactMatch = contacts.find(
            (c: Contact) => (c as any).dni === dni.trim()
          );

          if (exactMatch) {
            setDniValidationError("Ya existe un contacto con este DNI");
          } else {
            setDniValidationError("");
          }
        } catch (error) {
          setDniValidationError("");
        }
      }, 500);

      dniValidationTimeoutRef.current = timeoutId;
    }
  };

  // Función para validar CEE en tiempo real
  const validateCee = async (cee: string) => {
    if (ceeValidationTimeoutRef.current) {
      clearTimeout(ceeValidationTimeoutRef.current);
    }

    const ceeUpper = cee.trim().toUpperCase();
    if (!ceeUpper || ceeUpper.length < 12) {
      setCeeValidationError("");
      return;
    }

    if (editingContact && (editingContact as any).cee === ceeUpper) {
      setCeeValidationError("");
      return;
    }

    // Si tiene exactamente 12 caracteres, validar inmediatamente
    if (ceeUpper.length === 12) {
      try {
        const response = await api.get("/contacts", {
          params: { search: ceeUpper, limit: 50 },
        });

        const contacts = response.data.contacts || response.data || [];
        const exactMatch = contacts.find(
          (c: Contact) => (c as any).cee === ceeUpper
        );

        if (exactMatch) {
          setCeeValidationError("Ya existe un contacto con este CEE");
        } else {
          setCeeValidationError("");
        }
      } catch (error) {
        setCeeValidationError("");
      }
    } else {
      // Si tiene menos de 12 caracteres, usar debounce
      const timeoutId = setTimeout(async () => {
        try {
          const response = await api.get("/contacts", {
            params: { search: ceeUpper, limit: 50 },
          });

          const contacts = response.data.contacts || response.data || [];
          const exactMatch = contacts.find(
            (c: Contact) => (c as any).cee === ceeUpper
          );

          if (exactMatch) {
            setCeeValidationError("Ya existe un contacto con este CEE");
          } else {
            setCeeValidationError("");
          }
        } catch (error) {
          setCeeValidationError("");
        }
      }, 500);

      ceeValidationTimeoutRef.current = timeoutId;
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingContact(null);
    // Limpiar timeouts de validación
    if (emailValidationTimeoutRef.current) {
      clearTimeout(emailValidationTimeoutRef.current);
    }
    if (dniValidationTimeoutRef.current) {
      clearTimeout(dniValidationTimeoutRef.current);
    }
    if (ceeValidationTimeoutRef.current) {
      clearTimeout(ceeValidationTimeoutRef.current);
    }
    setEmailValidationError("");
    setDniValidationError("");
    setCeeValidationError("");
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "El nombre es requerido";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "El apellido es requerido";
    }

    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "El email no es válido";
    }

    if (!formData.companyId) {
      errors.companyId = "La empresa principal es requerida";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearchRuc = async () => {
    if (!companyFormData.ruc || companyFormData.ruc.length < 11) {
      setRucError("El RUC debe tener 11 dígitos");
      return;
    }

    setLoadingRuc(true);
    setRucError("");

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";

      if (!factilizaToken) {
        setRucError("Token de API no configurado");
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
        setRucError("Error al consultar el RUC. Por favor, intente nuevamente");
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyFormData.name.trim()) {
      return;
    }

    try {
      const response = await api.post("/companies", {
        ...companyFormData,
        ownerId: companyFormData.ownerId || user?.id || null,
      });

      // Agregar la nueva empresa a la lista y seleccionarla
      setCompanies([...companies, response.data]);
      setFormData((prev) => ({
        ...prev,
        companyId: response.data.id.toString(),
      }));

      // Cerrar el diálogo y limpiar el formulario
      setCreateCompanyDialogOpen(false);
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
    } catch (error: any) {
      console.error("Error creating company:", error);
      setRucError(error.response?.data?.error || "Error al crear la empresa");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Preparar los datos para enviar, convirtiendo companyId a número
      const submitData = {
        ...formData,
        companyId: formData.companyId
          ? parseInt(formData.companyId)
          : undefined,
      };

      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, submitData);
      } else {
        await api.post("/contacts", submitData);
      }
      setFormErrors({});
      handleClose();
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const handleDelete = (id: number) => {
    setContactToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/contacts/${contactToDelete}`);
      fetchContacts();
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error al eliminar el contacto. Por favor, intenta nuevamente.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handlePreview = async (contact: Contact) => {
    setLoadingPreview(true);
    setLoadingActivities(true);
    setPreviewOpen(true);
    try {
      // Obtener información completa del contacto
      const response = await api.get(`/contacts/${contact.id}`);
      setPreviewContact(response.data);

      // Obtener actividades del contacto
      try {
        const activitiesResponse = await api.get("/activities", {
          params: { contactId: contact.id },
        });
        setPreviewActivities(
          activitiesResponse.data.activities || activitiesResponse.data || []
        );
      } catch (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
        setPreviewActivities([]);
      }
    } catch (error) {
      console.error("Error fetching contact details:", error);
      // Si falla, usar la información básica que ya tenemos
      setPreviewContact(contact);
      setPreviewActivities([]);
    } finally {
      setLoadingPreview(false);
      setLoadingActivities(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewContact(null);
    setPreviewActivities([]);
  };

  const getStageColor = (stage: string) => {
    const colors: {
      [key: string]:
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
    } = {
      lead: "error", // Rojo para 0%
      contacto: "warning", // Naranja para 10%
      reunion_agendada: "warning", // Naranja para 30%
      reunion_efectiva: "warning", // Amarillo para 40%
      propuesta_economica: "info", // Verde claro para 50%
      negociacion: "success", // Verde para 70%
      licitacion: "success", // Verde para 75%
      licitacion_etapa_final: "success", // Verde oscuro para 85%
      cierre_ganado: "success", // Verde oscuro para 90%
      cierre_perdido: "error", // Rojo para -1%
      firma_contrato: "success", // Verde oscuro para 95%
      activo: "success", // Verde más oscuro para 100%
      cliente_perdido: "error", // Rojo para -1%
      lead_inactivo: "error", // Rojo para -5%
    };
    return colors[stage] || "default";
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const stageOptions = [
    { value: 'lead_inactivo', label: 'Lead Inactivo' },
    { value: 'cliente_perdido', label: 'Cliente perdido' },
    { value: 'cierre_perdido', label: 'Cierre Perdido' },
    { value: 'lead', label: 'Lead' },
    { value: 'contacto', label: 'Contacto' },
    { value: 'reunion_agendada', label: 'Reunión Agendada' },
    { value: 'reunion_efectiva', label: 'Reunión Efectiva' },
    { value: 'propuesta_economica', label: 'Propuesta Económica' },
    { value: 'negociacion', label: 'Negociación' },
    { value: 'licitacion', label: 'Licitación' },
    { value: 'licitacion_etapa_final', label: 'Licitación Etapa Final' },
    { value: 'cierre_ganado', label: 'Cierre Ganado' },
    { value: 'firma_contrato', label: 'Firma de Contrato' },
    { value: 'activo', label: 'Activo' },
  ];

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, contactId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStatusMenuAnchor({ ...statusMenuAnchor, [contactId]: event.currentTarget });
  };

  const handleStatusMenuClose = (contactId: number) => {
    setStatusMenuAnchor({ ...statusMenuAnchor, [contactId]: null });
  };

  const handleStatusChange = async (event: React.MouseEvent<HTMLElement>, contactId: number, newStage: string) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStatus({ ...updatingStatus, [contactId]: true });
    try {
      await api.put(`/contacts/${contactId}`, { lifecycleStage: newStage });
      // Actualizar el contacto en la lista
      setContacts(contacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, lifecycleStage: newStage }
          : contact
      ));
      handleStatusMenuClose(contactId);
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Error al actualizar la etapa. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [contactId]: false });
    }
  };

  // Función auxiliar para aplicar operadores
  const applyOperator = (fieldValue: string, operator: string, filterValue: string): boolean => {
    const fieldLower = fieldValue.toLowerCase();
    const filterLower = filterValue.toLowerCase();
    switch (operator) {
      case 'contains':
        return fieldLower.includes(filterLower);
      case 'equals':
        return fieldLower === filterLower;
      case 'notEquals':
        return fieldLower !== filterLower;
      case 'startsWith':
        return fieldLower.startsWith(filterLower);
      case 'endsWith':
        return fieldLower.endsWith(filterLower);
      default:
        return true;
    }
  };

  // Filtrar y ordenar contactos
  const filteredContacts = contacts
    .filter((contact) => {
      // Filtro por tab (0 = Todos, 1 = Activos)
      if (activeTab === 1) {
        const activeStages = ["cierre_ganado"];
        if (!activeStages.includes(contact.lifecycleStage)) {
          return false;
        }
      }

      // Filtro por etapas
      if (selectedStages.length > 0) {
        if (!selectedStages.includes(contact.lifecycleStage || "lead")) {
          return false;
        }
      }

      // Filtro por países
      if (selectedCountries.length > 0) {
        if (!contact.country || !selectedCountries.includes(contact.country)) {
          return false;
        }
      }

      // Filtro por propietarios (del panel de filtros)
      if (selectedOwnerFilters.length > 0) {
        let matches = false;
        for (const filter of selectedOwnerFilters) {
          if (filter === "me") {
            if (contact.ownerId === user?.id) {
              matches = true;
              break;
            }
          } else if (filter === "unassigned") {
            if (contact.ownerId === null || contact.ownerId === undefined) {
              matches = true;
              break;
            }
          } else {
            if (contact.ownerId === filter) {
              matches = true;
              break;
            }
          }
        }
        if (!matches) return false;
      }

      // Filtro por propietario (legacy, mantener por compatibilidad)
      if (selectedOwnerFilter !== null) {
        if (selectedOwnerFilter === "me") {
          if (contact.ownerId !== user?.id) {
            return false;
          }
        } else if (selectedOwnerFilter === "unassigned") {
          if (contact.ownerId !== null && contact.ownerId !== undefined) {
            return false;
          }
        } else if (selectedOwnerFilter === "deactivated") {
          // Todos los propietarios desactivados y eliminados
          // Por ahora, no hay lógica para esto, se puede implementar después
          return true;
        } else {
          if (contact.ownerId !== selectedOwnerFilter) {
            return false;
          }
        }
      }

      // Aplicar filtros de reglas
      for (const rule of filterRules) {
        if (!rule.value) continue; // Saltar reglas sin valor

        let matches = false;
        const ruleValue = rule.value.toLowerCase();

        switch (rule.column) {
          case 'firstName':
            matches = applyOperator(contact.firstName || '', rule.operator, ruleValue);
            break;
          case 'lastName':
            matches = applyOperator(contact.lastName || '', rule.operator, ruleValue);
            break;
          case 'email':
            matches = applyOperator(contact.email || '', rule.operator, ruleValue);
            break;
          case 'phone':
            const phoneValue = contact.phone || contact.mobile || '';
            matches = applyOperator(phoneValue, rule.operator, ruleValue);
            break;
          case 'company':
            const companyName = contact.Company?.name || contact.Companies?.[0]?.name || '';
            matches = applyOperator(companyName, rule.operator, ruleValue);
            break;
          case 'country':
            matches = applyOperator(contact.country || '', rule.operator, ruleValue);
            break;
          case 'lifecycleStage':
            const stageLabel = getStageLabel(contact.lifecycleStage || 'lead');
            matches = applyOperator(stageLabel, rule.operator, ruleValue);
            break;
          case 'jobTitle':
            matches = applyOperator(contact.jobTitle || '', rule.operator, ruleValue);
            break;
          default:
            matches = true;
        }

        if (!matches) return false;
      }

      // Aplicar filtros por columna
      if (columnFilters.nombre) {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        if (!fullName.includes(columnFilters.nombre.toLowerCase())) return false;
      }
      if (columnFilters.empresa) {
        const companyName = contact.Company?.name || contact.Companies?.[0]?.name || '';
        if (!companyName.toLowerCase().includes(columnFilters.empresa.toLowerCase())) return false;
      }
      if (columnFilters.telefono) {
        const phoneValue = contact.phone || contact.mobile || '';
        if (!phoneValue.toLowerCase().includes(columnFilters.telefono.toLowerCase())) return false;
      }
      if (columnFilters.pais) {
        if (!contact.country?.toLowerCase().includes(columnFilters.pais.toLowerCase())) return false;
      }
      if (columnFilters.etapa) {
        const stageLabel = getStageLabel(contact.lifecycleStage || 'lead');
        if (!stageLabel.toLowerCase().includes(columnFilters.etapa.toLowerCase())) return false;
      }

      // Filtro por búsqueda
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          );
        case "nameDesc":
          return `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`
          );
        default:
          return 0;
      }
    });

  // Calcular paginación
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStages, selectedCountries, selectedOwnerFilters, search, sortBy, filterRules, columnFilters]);

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

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        pb: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Contenedor principal */}
      <UnifiedTable
        title="Contactos"
        actions={
          <>
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 130 },
                order: { xs: 1, sm: 0 },
              }}
            >
              <Select
                id="contacts-sort-select"
                name="contacts-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 1.5,
                  bgcolor: theme.palette.background.paper,
                  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.divider,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.text.secondary,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#64B5F6" : "#1976d2",
                  },
                }}
              >
                <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Nuevo Contacto">
              <IconButton
                size="small"
                onClick={() => handleOpen()}
                sx={{
                  bgcolor: taxiMonterricoColors.green,
                  color: "white",
                  "&:hover": {
                    bgcolor: taxiMonterricoColors.greenDark,
                  },
                  borderRadius: 1.5,
                  p: { xs: 0.75, sm: 0.875 },
                  boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                  order: { xs: 2, sm: 0 },
                }}
              >
                <Add sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 0.5, sm: 0.75 },
                order: { xs: 3, sm: 0 },
              }}
            >
              <Tooltip title={importing ? "Importando..." : "Importar"}>
                <IconButton
                  size="small"
                  onClick={handleImportFromExcel}
                  disabled={importing}
                  sx={{
                    ...pageStyles.outlinedIconButton,
                    p: { xs: 0.75, sm: 0.875 },
                  }}
                >
                  <UploadFile sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
              />
              <Tooltip title="Exportar">
                <IconButton
                  size="small"
                  onClick={handleExportToExcel}
                  sx={{
                    ...pageStyles.outlinedIconButton,
                    p: { xs: 0.75, sm: 0.875 },
                  }}
                >
                  <FileDownload sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Tooltip title={showColumnFilters ? "Ocultar filtros por columna" : "Mostrar filtros por columna"}>
              <IconButton
                size="small"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                sx={{
                  border: `1px solid ${showColumnFilters ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: showColumnFilters 
                    ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)')
                    : 'transparent',
                  color: showColumnFilters ? theme.palette.primary.main : theme.palette.text.secondary,
                  p: { xs: 0.75, sm: 0.875 },
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(25, 118, 210, 0.3)' 
                      : 'rgba(25, 118, 210, 0.15)',
                  },
                  order: { xs: 5, sm: 0 },
                }}
              >
                <ViewColumn sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filtros avanzados">
              <IconButton
                size="small"
                onClick={(e) => {
                  setFilterAnchorEl(e.currentTarget);
                  // Si no hay reglas, agregar una inicial
                  if (filterRules.length === 0) {
                    setFilterRules([{
                      id: `filter-${Date.now()}`,
                      column: 'firstName',
                      operator: 'contains',
                      value: '',
                    }]);
                  }
                }}
                sx={{
                  border: `1px solid ${filterRules.length > 0 ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: filterRules.length > 0 
                    ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)')
                    : 'transparent',
                  color: filterRules.length > 0 ? theme.palette.primary.main : theme.palette.text.secondary,
                  p: { xs: 0.75, sm: 0.875 },
                  order: { xs: 4, sm: 0 },
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(25, 118, 210, 0.3)' 
                      : 'rgba(25, 118, 210, 0.15)',
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <FilterList sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </IconButton>
            </Tooltip>
          </>
        }
        header={
          <Box
            component="div"
            sx={{
              bgcolor: theme.palette.background.paper,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: {
                sm: "repeat(6, minmax(0, 1fr))",
                md: "1.5fr 1fr 0.9fr 0.7fr 1.2fr 0.7fr",
              },
              columnGap: { sm: 1, md: 1.5 },
              minWidth: { xs: 800, md: 'auto' },
              maxWidth: '100%',
              width: '100%',
              px: { xs: 1.5, md: 2 },
              py: { xs: 1.25, md: 1.5 },
              borderBottom: theme.palette.mode === 'light' 
                ? '1px solid rgba(0, 0, 0, 0.08)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Nombre del Cliente</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, nombre: '' }))} sx={{ p: 0.25, opacity: columnFilters.nombre ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.nombre}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, nombre: e.target.value }))}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': { 
                      height: 28, 
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Empresa</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, empresa: '' }))} sx={{ p: 0.25, opacity: columnFilters.empresa ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.empresa}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, empresa: e.target.value }))}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': { 
                      height: 28, 
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Teléfono</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, telefono: '' }))} sx={{ p: 0.25, opacity: columnFilters.telefono ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.telefono}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, telefono: e.target.value }))}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': { 
                      height: 28, 
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>País</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, pais: '' }))} sx={{ p: 0.25, opacity: columnFilters.pais ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.pais}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, pais: e.target.value }))}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': { 
                      height: 28, 
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Etapa</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, etapa: '' }))} sx={{ p: 0.25, opacity: columnFilters.etapa ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.etapa}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, etapa: e.target.value }))}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': { 
                      height: 28, 
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box
              sx={{
                ...pageStyles.tableHeaderCell,
                px: { xs: 0.75, md: 1 },
                justifyContent: "flex-start",
              }}
            >
              Acciones
            </Box>
          </Box>
        }
        rows={
          <>
          {paginatedContacts.map((contact) => (
              <Box
                key={contact.id}
                component="div"
                onClick={() => navigate(`/contacts/${contact.id}`)}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "grid",
                  gridTemplateColumns: {
                    sm: "repeat(6, minmax(0, 1fr))",
                    md: "1.5fr 1fr 0.9fr 0.7fr 1.2fr 0.7fr",
                  },
                  columnGap: { sm: 1, md: 1.5 },
                  minWidth: { xs: 800, md: 'auto' },
                  maxWidth: '100%',
                  width: "100%",
                  overflow: 'hidden',
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 1, md: 1.25 },
                  borderBottom: theme.palette.mode === 'light' 
                    ? '1px solid rgba(0, 0, 0, 0.08)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                {/* Vista móvil: Card con información principal */}
                <Box
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    flexDirection: "column",
                    width: "100%",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      width: "100%",
                      pb: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Avatar
                      src={contactLogo}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: contactLogo
                          ? "transparent"
                          : taxiMonterricoColors.green,
                        fontSize: "1rem",
                        fontWeight: 600,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        flexShrink: 0,
                      }}
                    >
                      {!contactLogo &&
                        getInitials(contact.firstName, contact.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: "0.9375rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          mb: 0.25,
                        }}
                      >
                        {contact.firstName} {contact.lastName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.75rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {contact.jobTitle || "--"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(contact);
                        }}
                        sx={{ p: 0.75 }}
                      >
                        <Edit sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(contact);
                        }}
                        sx={{ p: 0.75 }}
                      >
                        <Visibility sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    {contact.Company?.name && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Business
                          sx={{
                            fontSize: 16,
                            color: theme.palette.text.secondary,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {contact.Company.name}
                        </Typography>
                      </Box>
                    )}
                    {(contact.phone || contact.mobile) && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Phone
                          sx={{
                            fontSize: 16,
                            color: theme.palette.text.secondary,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {contact.phone || contact.mobile}
                        </Typography>
                      </Box>
                    )}
                    {contact.country && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocationOn
                          sx={{
                            fontSize: 16,
                            color: theme.palette.text.secondary,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {contact.country}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={getStageLabel(contact.lifecycleStage || "lead")}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleStatusMenuOpen(e, contact.id);
                        }}
                        disabled={updatingStatus[contact.id]}
                        color={getStageColor(contact.lifecycleStage || "lead")}
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.6875rem",
                          height: 20,
                          cursor: "pointer",
                          "&:hover": {
                            opacity: 0.8,
                          },
                        }}
                      />
                      <Menu
                        anchorEl={statusMenuAnchor[contact.id]}
                        open={Boolean(statusMenuAnchor[contact.id])}
                        onClose={(e: any, reason?: string) => {
                          if (e && 'stopPropagation' in e) {
                            (e as React.MouseEvent).stopPropagation();
                          }
                          handleStatusMenuClose(contact.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        PaperProps={{
                          sx: {
                            minWidth: 220,
                            maxHeight: 400,
                            mt: 0.5,
                            borderRadius: 1.5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            overflow: 'auto',
                          }
                        }}
                      >
                        {stageOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            onClick={(e) => handleStatusChange(e, contact.id, option.value)}
                            disabled={updatingStatus[contact.id] || contact.lifecycleStage === option.value}
                            selected={contact.lifecycleStage === option.value}
                            sx={{
                              fontSize: '0.875rem',
                              '&:hover': {
                                bgcolor: theme.palette.action.hover,
                              },
                              '&.Mui-selected': {
                                bgcolor: theme.palette.action.selected,
                                '&:hover': {
                                  bgcolor: theme.palette.action.selected,
                                },
                              },
                              '&.Mui-disabled': {
                                opacity: 0.5,
                              }
                            }}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  </Box>
                </Box>

                {/* Vista desktop: Grid layout */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    py: { xs: 0.5, md: 0.75 },
                    px: { sm: 0.75, md: 1 },
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: { sm: 1, md: 1.5 },
                      width: "100%",
                    }}
                  >
                    <Avatar
                      src={contactLogo}
                      sx={{
                        width: { sm: 32, md: 40 },
                        height: { sm: 32, md: 40 },
                        bgcolor: contactLogo
                          ? "transparent"
                          : taxiMonterricoColors.green,
                        fontSize: { sm: "0.75rem", md: "0.875rem" },
                        fontWeight: 600,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        flexShrink: 0,
                      }}
                    >
                      {!contactLogo &&
                        getInitials(contact.firstName, contact.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          fontSize: { sm: "0.6875rem", md: "0.8125rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          mb: 0.25,
                        }}
                      >
                        {contact.firstName?.split(" ")[0] || contact.firstName}{" "}
                        {contact.lastName?.split(" ")[0] || contact.lastName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { sm: "0.5625rem", md: "0.75rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {contact.jobTitle || "--"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    px: { sm: 0.75, md: 1 },
                    py: { xs: 0.5, md: 0.75 },
                    alignItems: "center",
                    justifyContent: "flex-start",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {contact.Company?.name ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: { sm: "0.625rem", md: "0.8125rem" },
                        fontWeight: 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {contact.Company.name}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.disabled,
                        fontSize: { sm: "0.625rem", md: "0.8125rem" },
                        fontWeight: 400,
                      }}
                    >
                      --
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    px: { sm: 0.75, md: 1 },
                    py: { xs: 0.5, md: 0.75 },
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: { sm: "0.625rem", md: "0.8125rem" },
                      fontWeight: 400,
                    }}
                  >
                    {contact.phone || contact.mobile || "--"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    px: { sm: 0.75, md: 1 },
                    py: { xs: 0.5, md: 0.75 },
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: { sm: "0.625rem", md: "0.8125rem" },
                      fontWeight: 400,
                    }}
                  >
                    {contact.country || "--"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    px: { xs: 1, md: 1.5 },
                    py: { xs: 1, md: 1.25 },
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Chip
                    label={getStageLabel(contact.lifecycleStage || "lead")}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStatusMenuOpen(e, contact.id);
                    }}
                    disabled={updatingStatus[contact.id]}
                    color={getStageColor(contact.lifecycleStage || "lead")}
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: "0.75rem", md: "0.8125rem" },
                      height: { xs: 22, md: 24 },
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                  />
                  <Menu
                    anchorEl={statusMenuAnchor[contact.id]}
                    open={Boolean(statusMenuAnchor[contact.id])}
                    onClose={(e: any, reason?: string) => {
                      if (e && 'stopPropagation' in e) {
                        (e as React.MouseEvent).stopPropagation();
                      }
                      handleStatusMenuClose(contact.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{
                      sx: {
                        minWidth: 220,
                        maxHeight: 400,
                        mt: 0.5,
                        borderRadius: 1.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        overflow: 'auto',
                      }
                    }}
                  >
                    {stageOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        onClick={(e) => handleStatusChange(e, contact.id, option.value)}
                        disabled={updatingStatus[contact.id] || contact.lifecycleStage === option.value}
                        selected={contact.lifecycleStage === option.value}
                        sx={{
                          fontSize: '0.875rem',
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                          '&.Mui-selected': {
                            bgcolor: theme.palette.action.selected,
                            '&:hover': {
                              bgcolor: theme.palette.action.selected,
                            },
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5,
                          }
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    px: { sm: 0.75, md: 1 },
                    py: { xs: 0.5, md: 0.75 },
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(contact);
                        }}
                        sx={pageStyles.previewIconButton}
                      >
                        <Edit
                          sx={{ fontSize: { sm: "1rem", md: "1.25rem" } }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Vista previa">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(contact);
                        }}
                        sx={pageStyles.previewIconButton}
                      >
                        <Visibility
                          sx={{ fontSize: { sm: "1rem", md: "1.25rem" } }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                        sx={pageStyles.deleteIcon}
                      >
                        <Delete
                          sx={{ fontSize: { sm: "1rem", md: "1.25rem" } }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))}
            </>
        }
        emptyState={
          paginatedContacts.length === 0 ? (
            <Box sx={pageStyles.emptyState}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Person
                  sx={{ fontSize: 48, color: theme.palette.text.disabled }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  No hay contactos para mostrar
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Crea tu primer contacto para comenzar
                </Typography>
              </Box>
            </Box>
          ) : undefined
        }
        pagination={
          filteredContacts.length > 0 ? (
            <>
              {/* Rows per page selector */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  Filas por página:
                </Typography>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  size="small"
                  sx={{
                    fontSize: "0.8125rem",
                    height: "32px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.divider,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.text.secondary,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: taxiMonterricoColors.green,
                    },
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={7}>7</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </Box>

              {/* Información de paginación y navegación */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {startIndex + 1}-{Math.min(endIndex, filteredContacts.length)}{" "}
                  de {filteredContacts.length}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    size="small"
                    sx={{
                      color:
                        currentPage === 1
                          ? theme.palette.action.disabled
                          : theme.palette.text.secondary,
                      "&:hover": {
                        bgcolor:
                          currentPage === 1
                            ? "transparent"
                            : theme.palette.action.hover,
                      },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    size="small"
                    sx={{
                      color:
                        currentPage === totalPages
                          ? theme.palette.action.disabled
                          : theme.palette.text.secondary,
                      "&:hover": {
                        bgcolor:
                          currentPage === totalPages
                            ? "transparent"
                            : theme.palette.action.hover,
                      },
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
              </>
          ) : undefined
        }
      />

      {/* Indicador de filtros por columna activos */}
      {Object.values(columnFilters).some(v => v) && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          mb: 2,
          alignItems: 'center',
        }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
            Filtros activos:
          </Typography>
          {Object.entries(columnFilters).map(([key, value]) => value && (
            <Chip
              key={key}
              label={`${key}: ${value}`}
              size="small"
              onDelete={() => setColumnFilters(prev => ({ ...prev, [key]: '' }))}
              sx={{ fontSize: '0.6875rem', height: 20 }}
            />
          ))}
        </Box>
      )}

      {/* Popover de Filtros - Diseño tipo Tags */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'center' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isMobile ? 'center' : 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: isMobile ? 'calc(100vw - 32px)' : 420,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 500,
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.5)'
              : '0 8px 24px rgba(0,0,0,0.15)',
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: theme.palette.text.primary }}>
              Filtros
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {filterRules.length > 0 && (
                <Button
                  size="small"
                  onClick={() => {
                    setFilterRules([]);
                    setSelectedStages([]);
                    setSelectedOwnerFilters([]);
                    setSelectedCountries([]);
                  }}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    px: 1.5,
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(211, 47, 47, 0.1)' 
                        : 'rgba(211, 47, 47, 0.05)',
                    },
                  }}
                >
                  Limpiar todo
                </Button>
              )}
              <IconButton
                size="small"
                onClick={() => setFilterAnchorEl(null)}
                sx={{ color: theme.palette.text.secondary }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Filtros activos como Tags/Chips */}
          {filterRules.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {filterRules.map((rule) => {
                const columnLabel = columnOptions.find(c => c.value === rule.column)?.label || rule.column;
                const operatorLabel = operatorOptions.find(o => o.value === rule.operator)?.label || rule.operator;
                return (
                  <Chip
                    key={rule.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {columnLabel}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                          {operatorLabel.toLowerCase()}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                          "{rule.value || '...'}"
                        </Typography>
                      </Box>
                    }
                    onDelete={() => {
                      setFilterRules(filterRules.filter(r => r.id !== rule.id));
                    }}
                    sx={{
                      height: 'auto',
                      py: 0.5,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(25, 118, 210, 0.2)' 
                        : 'rgba(25, 118, 210, 0.1)',
                      border: `1px solid ${theme.palette.primary.main}`,
                      '& .MuiChip-label': {
                        px: 1,
                      },
                      '& .MuiChip-deleteIcon': {
                        fontSize: 16,
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.error.main,
                        },
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}

          {/* Formulario para agregar nuevo filtro */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1, 
            alignItems: { xs: 'stretch', sm: 'flex-end' },
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.03)' 
              : 'rgba(0, 0, 0, 0.02)',
            border: `1px dashed ${theme.palette.divider}`,
          }}>
            {/* Columna */}
            <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
              <Select
                value={filterRules.length > 0 ? filterRules[filterRules.length - 1]?.column || 'firstName' : 'firstName'}
                onChange={(e) => {
                  if (filterRules.length === 0) {
                    setFilterRules([{
                      id: `filter-${Date.now()}`,
                      column: e.target.value,
                      operator: 'contains',
                      value: '',
                    }]);
                  } else {
                    const newRules = [...filterRules];
                    newRules[newRules.length - 1].column = e.target.value;
                    setFilterRules(newRules);
                  }
                }}
                displayEmpty
                sx={{
                  fontSize: '0.8125rem',
                  bgcolor: theme.palette.background.paper,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                }}
              >
                {columnOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Operador */}
            <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
              <Select
                value={filterRules.length > 0 ? filterRules[filterRules.length - 1]?.operator || 'contains' : 'contains'}
                onChange={(e) => {
                  if (filterRules.length === 0) {
                    setFilterRules([{
                      id: `filter-${Date.now()}`,
                      column: 'firstName',
                      operator: e.target.value,
                      value: '',
                    }]);
                  } else {
                    const newRules = [...filterRules];
                    newRules[newRules.length - 1].operator = e.target.value;
                    setFilterRules(newRules);
                  }
                }}
                displayEmpty
                sx={{
                  fontSize: '0.8125rem',
                  bgcolor: theme.palette.background.paper,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                }}
              >
                {operatorOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Valor */}
            <TextField
              size="small"
              placeholder="Valor..."
              value={filterRules.length > 0 ? filterRules[filterRules.length - 1]?.value || '' : ''}
              onChange={(e) => {
                if (filterRules.length === 0) {
                  setFilterRules([{
                    id: `filter-${Date.now()}`,
                    column: 'firstName',
                    operator: 'contains',
                    value: e.target.value,
                  }]);
                } else {
                  const newRules = [...filterRules];
                  newRules[newRules.length - 1].value = e.target.value;
                  setFilterRules(newRules);
                }
              }}
              sx={{
                flex: 1.5,
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme.palette.background.paper,
                  fontSize: '0.8125rem',
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '0.8125rem',
                },
              }}
            />

            {/* Botón Agregar */}
            <IconButton
              size="small"
              onClick={() => {
                setFilterRules([
                  ...filterRules,
                  {
                    id: `filter-${Date.now()}`,
                    column: 'firstName',
                    operator: 'contains',
                    value: '',
                  },
                ]);
              }}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              }}
            >
              <Add sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Texto de ayuda */}
          {filterRules.length === 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: theme.palette.text.secondary, textAlign: 'center' }}>
              Configura los campos y haz clic en + para agregar un filtro
            </Typography>
          )}
        </Box>
      </Popover>

      <Dialog
        open={open}
        onClose={handleClose}
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
        <DialogContent sx={{ pt: 5, pb: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
                    // Limpiar campos al cambiar de tipo
                    if (newType === "dni") {
                      setFormData((prev) => ({ ...prev, cee: "", dni: "" }));
                      setCeeError("");
                    } else {
                      setFormData((prev) => ({ ...prev, dni: "", cee: "" }));
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
                            color: taxiMonterricoColors.green,
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
                          ? taxiMonterricoColors.green
                          : theme.palette.divider
                      }`,
                      borderRadius: 2,
                      bgcolor:
                        idType === "dni"
                          ? theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}20`
                            : `${taxiMonterricoColors.green}10`
                          : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: taxiMonterricoColors.green,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}15`
                            : `${taxiMonterricoColors.green}08`,
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
                            color: taxiMonterricoColors.green,
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
                          ? taxiMonterricoColors.green
                          : theme.palette.divider
                      }`,
                      borderRadius: 2,
                      bgcolor:
                        idType === "cee"
                          ? theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}20`
                            : `${taxiMonterricoColors.green}10`
                          : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: taxiMonterricoColors.green,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}15`
                            : `${taxiMonterricoColors.green}08`,
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
                      value={formData.dni}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/\D/g, ""); // Solo números
                        // Limitar a 8 dígitos
                        const limitedValue = value.slice(0, 8);
                        setFormData((prev) => ({
                          ...prev,
                          dni: limitedValue,
                          cee: "",
                        }));
                        setDniError("");
                        setCeeError("");
                        setCeeValidationError("");
                        // Validar DNI en tiempo real
                        validateDni(limitedValue);
                      }}
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          formData.dni &&
                          formData.dni.length === 8 &&
                          !loadingDni
                        ) {
                          handleSearchDni();
                        }
                      }}
                      error={!!dniError || !!dniValidationError}
                      helperText={dniError || dniValidationError}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ maxLength: 8 }}
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          minHeight: "48px", // Misma altura que los botones (py: 1.5 = 12px arriba + 12px abajo + contenido)
                          height: "48px",
                        },
                        "& .MuiInputBase-input": {
                          py: 1.5, // Mismo padding vertical que los botones
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
                              !formData.dni ||
                              formData.dni.length < 8
                            }
                            size="small"
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
                      value={formData.cee}
                      onChange={async (e) => {
                        // Convertir a mayúsculas respetando caracteres especiales del español
                        const value = e.target.value.toLocaleUpperCase("es-ES");
                        // Limitar a 12 caracteres
                        const limitedValue = value.slice(0, 12);
                        setFormData((prev) => ({
                          ...prev,
                          cee: limitedValue,
                          dni: "",
                        }));
                        setCeeError("");
                        setDniError("");
                        setDniValidationError("");
                        // Validar CEE en tiempo real
                        validateCee(limitedValue);
                      }}
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          formData.cee &&
                          formData.cee.length === 12 &&
                          !loadingCee
                        ) {
                          handleSearchCee();
                        }
                      }}
                      error={!!ceeError || !!ceeValidationError}
                      helperText={ceeError || ceeValidationError}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ maxLength: 12 }}
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          minHeight: "48px", // Misma altura que los botones (py: 1.5 = 12px arriba + 12px abajo + contenido)
                          height: "48px",
                        },
                        "& .MuiInputBase-input": {
                          py: 1.5, // Mismo padding vertical que los botones
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
                              !formData.cee ||
                              formData.cee.length < 12
                            }
                            size="small"
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
                value={formData.firstName}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }));
                  if (formErrors.firstName) {
                    setFormErrors((prev) => ({ ...prev, firstName: "" }));
                  }
                }}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
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
                value={formData.lastName}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }));
                  if (formErrors.lastName) {
                    setFormErrors((prev) => ({ ...prev, lastName: "" }));
                  }
                }}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
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
                value={formData.email}
                onChange={async (e) => {
                  const newEmail = e.target.value;
                  setFormData((prev) => ({ ...prev, email: newEmail }));
                  if (formErrors.email) {
                    setFormErrors((prev) => ({ ...prev, email: "" }));
                  }
                  // Validar email en tiempo real
                  validateEmail(newEmail);
                }}
                error={!!formErrors.email || !!emailValidationError}
                helperText={formErrors.email || emailValidationError}
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
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
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
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
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
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
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
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
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
                value={formData.country}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, country: e.target.value }))
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

            {/* Empresa Principal */}
            <TextField
              select
              label="Empresa Principal"
              value={formData.companyId}
              onChange={(e) => {
                if (e.target.value === "create_new") {
                  setCreateCompanyDialogOpen(true);
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    companyId: e.target.value,
                  }));
                  if (formErrors.companyId) {
                    setFormErrors((prev) => ({ ...prev, companyId: "" }));
                  }
                }
              }}
              error={!!formErrors.companyId}
              helperText={formErrors.companyId}
              required
              InputLabelProps={{ shrink: true }}
              disabled={loadingCompanies}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem
                value="create_new"
                sx={{ color: taxiMonterricoColors.green }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Add sx={{ fontSize: 18 }} />
                  Crear empresa
                </Box>
              </MenuItem>
            </TextField>

            {/* Cargo y Etapa del Ciclo de Vida en su propia fila */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Cargo"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
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
                value={formData.lifecycleStage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lifecycleStage: e.target.value,
                  }))
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
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            gap: 1,
          }}
        >
          <Button onClick={handleClose} sx={pageStyles.cancelButton}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={pageStyles.saveButton}
          >
            {editingContact ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Panel de Vista Previa */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        PaperProps={{
          sx: {
            borderRadius: 6,
            maxHeight: "90vh",
            margin: 0,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            width: "1200px",
            maxWidth: "95vw",
          },
        }}
        sx={{
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        {loadingPreview ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
            sx={{ width: "100%" }}
          >
            <CircularProgress />
          </Box>
        ) : previewContact ? (
          <>
            <Box sx={{ position: "relative" }}>
              <IconButton
                onClick={handleClosePreview}
                size="small"
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  color: theme.palette.text.primary,
                  zIndex: 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  "&:hover": {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <DialogContent
              sx={{
                p: 2,
                overflow: "auto",
                display: "flex",
                gap: 2,
                "&::-webkit-scrollbar": {
                  display: "none",
                  width: 0,
                  height: 0,
                },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "& *": {
                  "&::-webkit-scrollbar": {
                    display: "none",
                    width: 0,
                    height: 0,
                  },
                },
              }}
            >
              {/* Columna izquierda - Información del contacto */}
              <Box
                sx={{
                  flex: "0 0 40%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "auto",
                  "&::-webkit-scrollbar": {
                    display: "none",
                    width: 0,
                    height: 0,
                  },
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {/* Avatar y Nombre */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Box sx={{ position: "relative", mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor:
                          previewContact.avatar || contactLogo
                            ? "transparent"
                            : taxiMonterricoColors.green,
                        fontSize: "3rem",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "scale(1.05)",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                        },
                      }}
                      src={previewContact.avatar || contactLogo}
                    >
                      {!previewContact.avatar &&
                        !contactLogo &&
                        getInitials(
                          previewContact.firstName,
                          previewContact.lastName
                        )}
                    </Avatar>
                    <CheckCircle
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        fontSize: 28,
                        color: "#10B981",
                        bgcolor: theme.palette.background.paper,
                        borderRadius: "50%",
                        border: `2px solid ${theme.palette.background.paper}`,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: theme.palette.text.primary,
                      mb: 0.25,
                    }}
                  >
                    {previewContact.firstName} {previewContact.lastName}
                  </Typography>
                  {previewContact.email && (
                    <Typography
                      variant="body2"
                      align="center"
                      sx={{
                        fontSize: "0.875rem",
                        color: theme.palette.text.secondary,
                        fontWeight: 400,
                      }}
                    >
                      {previewContact.email}
                    </Typography>
                  )}
                </Box>

                {/* Estadísticas - Ocultado */}
                {/* <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                  <Box sx={{ 
                    flex: 1, 
                    border: `1px dashed ${theme.palette.divider}`, 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: 'transparent',
                  }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      28.65K
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                      Followers
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    flex: 1, 
                    border: `1px dashed ${theme.palette.divider}`, 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: 'transparent',
                  }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      38.85K
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                      Following
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    flex: 1, 
                    border: `1px dashed ${theme.palette.divider}`, 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: 'transparent',
                  }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                      43.67K
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 400 }}>
                      Engagement
                    </Typography>
                  </Box>
                </Box> */}

                {/* Información de contacto - Mismo diseño que ContactDetail */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 1px 3px rgba(0,0,0,0.3)"
                        : "0 1px 3px rgba(0,0,0,0.1)",
                    bgcolor: "transparent",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {/* Location */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <LocationOn
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Location
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 400,
                        color:
                          previewContact.city || previewContact.address
                            ? theme.palette.text.primary
                            : theme.palette.text.disabled,
                        textAlign: "right",
                      }}
                    >
                      {previewContact.city || previewContact.address || "--"}
                    </Typography>
                  </Box>

                  {/* Phone */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <Phone
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Phone
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 400,
                        color:
                          previewContact.phone || previewContact.mobile
                            ? theme.palette.text.primary
                            : theme.palette.text.disabled,
                        textAlign: "right",
                      }}
                    >
                      {previewContact.phone || previewContact.mobile || "--"}
                    </Typography>
                  </Box>

                  {/* Email */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <Email
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Email
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 400,
                        color: previewContact.email
                          ? theme.palette.text.primary
                          : theme.palette.text.disabled,
                        textAlign: "right",
                      }}
                    >
                      {previewContact.email || "--"}
                    </Typography>
                  </Box>

                  {/* Nombre de la empresa */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <Business
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Nombre de la empresa
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color:
                            (previewContact.Companies &&
                              previewContact.Companies.length > 0) ||
                            previewContact.Company
                              ? theme.palette.text.primary
                              : theme.palette.text.disabled,
                          textAlign: "right",
                        }}
                      >
                        {previewContact.Companies &&
                        previewContact.Companies.length > 0
                          ? previewContact.Companies[0].name
                          : previewContact.Company?.name || "--"}
                      </Typography>
                      <KeyboardArrowDown
                        sx={{
                          fontSize: 14,
                          color: theme.palette.text.secondary,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Estado del lead */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <Flag
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Estado del lead
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color: previewContact.leadStatus
                            ? theme.palette.text.primary
                            : theme.palette.text.disabled,
                          textAlign: "right",
                        }}
                      >
                        {previewContact.leadStatus || "--"}
                      </Typography>
                      <KeyboardArrowDown
                        sx={{ fontSize: 14, color: "#9E9E9E" }}
                      />
                    </Box>
                  </Box>

                  {/* Etapa del ciclo de vida */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <TrendingUp
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Etapa del ciclo de vida
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color: theme.palette.text.primary,
                          textAlign: "right",
                        }}
                      >
                        {previewContact.lifecycleStage || "--"}
                      </Typography>
                      <KeyboardArrowDown
                        sx={{ fontSize: 14, color: "#9E9E9E" }}
                      />
                    </Box>
                  </Box>

                  {/* Rol de compra */}
                  <Box
                    sx={{
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: "0 0 auto",
                      }}
                    >
                      <Person
                        sx={{
                          fontSize: 18,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Rol de compra
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color: theme.palette.text.disabled,
                          textAlign: "right",
                        }}
                      >
                        --
                      </Typography>
                      <KeyboardArrowDown
                        sx={{
                          fontSize: 14,
                          color: theme.palette.text.secondary,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Sección Social */}
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: 2,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 1px 3px rgba(0,0,0,0.3)"
                        : "0 1px 3px rgba(0,0,0,0.1)",
                    bgcolor: "transparent",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      Social
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        // Aquí puedes agregar un menú de opciones si es necesario
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <MoreVert
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                    </IconButton>
                  </Box>

                  {/* Lista de redes sociales */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {/* Facebook */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{ width: 36, height: 36, bgcolor: "#1877f2" }}
                      >
                        <Facebook sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.facebook || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (
                            !previewContact.facebook ||
                            previewContact.facebook === "#"
                          ) {
                            e.preventDefault();
                            const currentUrl = previewContact.facebook || "";
                            const url = prompt(
                              "Ingresa la URL de Facebook:",
                              currentUrl || "https://www.facebook.com/"
                            );
                            if (url !== null) {
                              api
                                .put(`/contacts/${previewContact.id}`, {
                                  facebook: url || null,
                                })
                                .then(() => {
                                  // Actualizar el contacto en el estado local
                                  setPreviewContact({
                                    ...previewContact,
                                    facebook: url || undefined,
                                  });
                                  fetchContacts(); // Refrescar la lista
                                })
                                .catch((err) =>
                                  console.error("Error al guardar:", err)
                                );
                            }
                          }
                        }}
                        sx={{
                          fontSize: "0.875rem",
                          color: previewContact.facebook
                            ? "#1976d2"
                            : "#9E9E9E",
                          textDecoration: "none",
                          flex: 1,
                          cursor: "pointer",
                          wordBreak: "break-all",
                          "&:hover": {
                            textDecoration: "underline",
                            color: previewContact.facebook
                              ? "#1565c0"
                              : "#757575",
                          },
                        }}
                      >
                        {previewContact.facebook || "Agregar Facebook"}
                      </Link>
                    </Box>

                    {/* Twitter */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{ width: 36, height: 36, bgcolor: "#1da1f2" }}
                      >
                        <Twitter sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.twitter || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (
                            !previewContact.twitter ||
                            previewContact.twitter === "#"
                          ) {
                            e.preventDefault();
                            const currentUrl = previewContact.twitter || "";
                            const url = prompt(
                              "Ingresa la URL de Twitter:",
                              currentUrl || "https://www.twitter.com/"
                            );
                            if (url !== null) {
                              api
                                .put(`/contacts/${previewContact.id}`, {
                                  twitter: url || null,
                                })
                                .then(() => {
                                  setPreviewContact({
                                    ...previewContact,
                                    twitter: url || undefined,
                                  });
                                  fetchContacts();
                                })
                                .catch((err) =>
                                  console.error("Error al guardar:", err)
                                );
                            }
                          }
                        }}
                        sx={{
                          fontSize: "0.875rem",
                          color: previewContact.twitter ? "#1976d2" : "#9E9E9E",
                          textDecoration: "none",
                          flex: 1,
                          cursor: "pointer",
                          wordBreak: "break-all",
                          "&:hover": {
                            textDecoration: "underline",
                            color: previewContact.twitter
                              ? "#1565c0"
                              : "#757575",
                          },
                        }}
                      >
                        {previewContact.twitter || "Agregar Twitter"}
                      </Link>
                    </Box>

                    {/* LinkedIn */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{ width: 36, height: 36, bgcolor: "#0077b5" }}
                      >
                        <LinkedIn sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.linkedin || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (
                            !previewContact.linkedin ||
                            previewContact.linkedin === "#"
                          ) {
                            e.preventDefault();
                            const currentUrl = previewContact.linkedin || "";
                            const url = prompt(
                              "Ingresa la URL de LinkedIn:",
                              currentUrl || "https://www.linkedin.com/"
                            );
                            if (url !== null) {
                              api
                                .put(`/contacts/${previewContact.id}`, {
                                  linkedin: url || null,
                                })
                                .then(() => {
                                  setPreviewContact({
                                    ...previewContact,
                                    linkedin: url || undefined,
                                  });
                                  fetchContacts();
                                })
                                .catch((err) =>
                                  console.error("Error al guardar:", err)
                                );
                            }
                          }
                        }}
                        sx={{
                          fontSize: "0.875rem",
                          color: previewContact.linkedin
                            ? "#1976d2"
                            : "#9E9E9E",
                          textDecoration: "none",
                          flex: 1,
                          cursor: "pointer",
                          wordBreak: "break-all",
                          "&:hover": {
                            textDecoration: "underline",
                            color: previewContact.linkedin
                              ? "#1565c0"
                              : "#757575",
                          },
                        }}
                      >
                        {previewContact.linkedin || "Agregar LinkedIn"}
                      </Link>
                    </Box>

                    {/* YouTube */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{ width: 36, height: 36, bgcolor: "#ff0000" }}
                      >
                        <YouTube sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Link
                        href={previewContact.youtube || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (
                            !previewContact.youtube ||
                            previewContact.youtube === "#"
                          ) {
                            e.preventDefault();
                            const currentUrl = previewContact.youtube || "";
                            const url = prompt(
                              "Ingresa la URL de YouTube:",
                              currentUrl || "https://www.youtube.com/"
                            );
                            if (url !== null) {
                              api
                                .put(`/contacts/${previewContact.id}`, {
                                  youtube: url || null,
                                })
                                .then(() => {
                                  setPreviewContact({
                                    ...previewContact,
                                    youtube: url || undefined,
                                  });
                                  fetchContacts();
                                })
                                .catch((err) =>
                                  console.error("Error al guardar:", err)
                                );
                            }
                          }
                        }}
                        sx={{
                          fontSize: "0.875rem",
                          color: previewContact.youtube ? "#1976d2" : "#9E9E9E",
                          textDecoration: "none",
                          flex: 1,
                          cursor: "pointer",
                          wordBreak: "break-all",
                          "&:hover": {
                            textDecoration: "underline",
                            color: previewContact.youtube
                              ? "#1565c0"
                              : "#757575",
                          },
                        }}
                      >
                        {previewContact.youtube || "Agregar YouTube"}
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Columna derecha - Actividades */}
              <Box
                sx={{
                  flex: "0 0 60%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  pl: 2,
                  overflow: "auto",
                  maxHeight: "calc(90vh - 100px)",
                  "&::-webkit-scrollbar": {
                    display: "none",
                    width: 0,
                    height: 0,
                  },
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: -16,
                    bottom: -16,
                    width: "1px",
                    bgcolor: theme.palette.divider,
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  Actividades
                </Typography>

                {loadingActivities ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 4,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : previewActivities.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 4,
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        bgcolor: theme.palette.action.hover,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Assignment
                        sx={{
                          fontSize: 30,
                          color:
                            theme.palette.mode === "dark"
                              ? "rgba(255, 255, 255, 0.4)"
                              : "#9CA3AF",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        maxWidth: 200,
                      }}
                    >
                      No hay actividades registradas
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {previewActivities.slice(0, 10).map((activity) => (
                      <Paper
                        key={activity.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: theme.palette.action.hover,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: "all 0.2s ease",
                          maxWidth: "85%",
                          "&:hover": {
                            boxShadow:
                              theme.palette.mode === "dark"
                                ? "0 2px 8px rgba(0,0,0,0.3)"
                                : "0 2px 8px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              bgcolor:
                                activity.type === "note"
                                  ? "#2E7D32"
                                  : activity.type === "email"
                                  ? "#1976d2"
                                  : activity.type === "call"
                                  ? "#0288d1"
                                  : activity.type === "task"
                                  ? "#f57c00"
                                  : activity.type === "meeting"
                                  ? "#7b1fa2"
                                  : "#757575",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {activity.type === "note" ? (
                              <Note sx={{ fontSize: 18, color: "white" }} />
                            ) : activity.type === "email" ? (
                              <Email sx={{ fontSize: 18, color: "white" }} />
                            ) : activity.type === "call" ? (
                              <Phone sx={{ fontSize: 18, color: "white" }} />
                            ) : activity.type === "task" ? (
                              <Assignment
                                sx={{ fontSize: 18, color: "white" }}
                              />
                            ) : activity.type === "meeting" ? (
                              <Event sx={{ fontSize: 18, color: "white" }} />
                            ) : (
                              <Note sx={{ fontSize: 18, color: "white" }} />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                mb: 0.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "100%",
                              }}
                            >
                              {activity.subject ||
                                (activity.description
                                  ? activity.description
                                      .replace(/<[^>]*>/g, "")
                                      .substring(0, 50)
                                  : "Sin título")}
                            </Typography>
                            {activity.description &&
                              activity.description !== activity.subject && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {activity.description
                                    .replace(/<[^>]*>/g, "")
                                    .substring(0, 100)}
                                </Typography>
                              )}
                            {activity.createdAt && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  display: "block",
                                  mt: 0.5,
                                }}
                              >
                                {new Date(
                                  activity.createdAt
                                ).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                    {previewActivities.length > 10 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          textAlign: "center",
                          mt: 1,
                        }}
                      >
                        Mostrando 10 de {previewActivities.length} actividades
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </DialogContent>
          </>
        ) : null}
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: pageStyles.dialog,
        }}
      >
        <DialogContent sx={pageStyles.dialogContent}>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.primary, mb: 1 }}
          >
            ¿Estás seguro de que deseas eliminar este contacto?
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Esta acción no se puede deshacer. El contacto será eliminado
            permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            sx={pageStyles.deleteButton}
            startIcon={
              deleting ? (
                <CircularProgress size={16} sx={{ color: "#ffffff" }} />
              ) : (
                <Delete />
              )
            }
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear empresa */}
      <Dialog
        open={createCompanyDialogOpen}
        onClose={() => {
          setCreateCompanyDialogOpen(false);
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
        }}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle>Nueva Empresa</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* RUC y Tipo de Contribuyente */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="RUC"
                value={companyFormData.ruc}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const limitedValue = value.slice(0, 11);
                  setCompanyFormData({ ...companyFormData, ruc: limitedValue });
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
                setCompanyFormData({ ...companyFormData, name: e.target.value })
              }
              required
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
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateCompanyDialogOpen(false);
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
            }}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCompany}
            variant="contained"
            disabled={!companyFormData.name.trim()}
            sx={{
              textTransform: "none",
              bgcolor: taxiMonterricoColors.green,
              "&:hover": {
                bgcolor: taxiMonterricoColors.green,
                opacity: 0.9,
              },
            }}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Progreso de Importación */}
      <Dialog
        open={importProgressOpen}
        onClose={() => {
          if (!importing && importProgress.current === importProgress.total) {
            setImportProgressOpen(false);
            setImportProgress({ current: 0, total: 0, success: 0, errors: 0 });
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          {importing ? "Importando..." : "Importación Completada"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {importing ? (
              <>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: theme.palette.text.secondary }}
                >
                  Procesando {importProgress.current} de {importProgress.total}{" "}
                  contactos...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    importProgress.total > 0
                      ? (importProgress.current / importProgress.total) * 100
                      : 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.success.main }}
                  >
                    ✓ Exitosos: {importProgress.success}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.error.main }}
                  >
                    ✗ Errores: {importProgress.errors}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {importProgress.success > 0 || importProgress.errors > 0
                    ? `Importación completada`
                    : "Error al procesar el archivo"}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.success.main }}
                  >
                    ✓ {importProgress.success} contactos creados exitosamente
                  </Typography>
                  {importProgress.errors > 0 && (
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.error.main }}
                    >
                      ✗ {importProgress.errors} contactos con errores
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {!importing && (
            <Button
              onClick={() => {
                setImportProgressOpen(false);
                setImportProgress({
                  current: 0,
                  total: 0,
                  success: 0,
                  errors: 0,
                });
              }}
              variant="contained"
              sx={{
                bgcolor: taxiMonterricoColors.green,
                "&:hover": {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
              }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contacts;
