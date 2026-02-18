import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
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
  Avatar,
  Divider,
  Tooltip,
  Select,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Search,
  Business,
  Phone,
  LocationOn,
  FilterList,
  ChevronLeft,
  ChevronRight,
  Description,
} from "@mui/icons-material";
import { PencilLine, Eye, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { taxiMonterricoColors } from "../theme/colors";
import { getStageColor as getStageColorUtil, normalizeStageFromExcel } from "../utils/stageColors";
import { pageStyles } from "../theme/styles";
import { companyLabels } from "../constants/companyLabels";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import * as XLSX from "xlsx";
import { FormDrawer } from "../components/FormDrawer";
import { StageChipWithProgress } from "../components/StageChipWithProgress";
import { UnifiedTable, DEFAULT_ITEMS_PER_PAGE } from "../components/UnifiedTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie, faFileImport, faFileExport, faFilter } from "@fortawesome/free-solid-svg-icons";
import EntityPreviewDrawer from "../components/EntityPreviewDrawer";
import ContactCompanyModal from "../components/ContactCompanyModal";
import UserAvatar from "../components/UserAvatar";

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalContacts, setTotalContacts] = useState(0);
  const [sortBy] = useState("newest");
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
  const [createCompanyDialogOpen, setCreateCompanyDialogOpen] = useState(false);
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
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
    errorList: [] as Array<{ name: string; error: string }>,
    companiesSuccess: 0,
    contactsSuccess: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_users, setUsers] = useState<any[]>([]);
  const [selectedStages] = useState<string[]>([]);
  const [selectedCountries] = useState<string[]>([]);
  const [selectedOwnerFilters] = useState<
    (string | number)[]
  >([]);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  
  // Estados para filtros por columna
  const [columnFilters, setColumnFilters] = useState<{
    nombre: string;
    empresa: string;
    telefono: string;
    correo: string;
    pais: string;
    etapa: string;
    propietario: string;
  }>({
    nombre: '',
    empresa: '',
    telefono: '',
    correo: '',
    pais: '',
    etapa: '',
    propietario: '',
  });
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});

  // Opciones de columnas disponibles


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

  // Plantilla Excel para importación: mismas columnas que espera el importador
  const handleDownloadTemplate = () => {
    const templateHeaders = {
      'Nombre': '',
      'Empresa': '',
      'Correo': '',
      'Teléfono': '',
      'Cargo': '',
      'Ciudad': '',
      'Estado/Provincia': '',
      'País': '',
      'Etapa': '',
    };
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([templateHeaders]);
    ws['!cols'] = [
      { wch: 22 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 20 },
      { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    XLSX.writeFile(wb, 'Plantilla_importacion_contactos.xlsx');
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  // Buscar empresa por nombre (case-insensitive)
  const findCompanyByName = async (name: string): Promise<{ id: number; name: string } | null> => {
    if (!name || !name.trim()) return null;
    try {
      const res = await api.get('/companies', { params: { search: name.trim(), limit: 100 } });
      const list = res.data?.companies ?? res.data ?? [];
      const normalized = name.trim().toLowerCase();
      const found = Array.isArray(list) ? list.find((c: any) => (c.name || '').trim().toLowerCase() === normalized) : null;
      return found ? { id: found.id, name: found.name } : null;
    } catch {
      return null;
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgressOpen(true);
    setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [], companiesSuccess: 0, contactsSuccess: 0 });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      type ContactRow = {
        companyName: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        jobTitle?: string;
        city?: string;
        state?: string;
        country?: string;
        lifecycleStage: string;
      };

      const rows: ContactRow[] = [];
      for (const row of jsonData) {
        const fullName = (row["Nombre"] || "").toString().trim();
        let firstName = "";
        let lastName = "";
        if (fullName) {
          if (fullName.includes(" ")) {
            const nameParts = fullName.split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          } else {
            const matches = fullName.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/g);
            if (matches && matches.length > 0) {
              firstName = matches[0] || "";
              lastName = matches.slice(1).join(" ") || "";
            } else {
              firstName = fullName;
            }
          }
        }
        const companyName = (row["Empresa"] || "").toString().trim();
        const hasName = !!(firstName || (row["Correo"] || "").toString().trim());
        if (hasName) {
          rows.push({
            companyName,
            firstName: firstName || "Sin nombre",
            lastName: lastName || "Sin apellido",
            email: (row["Correo"] || "").toString().trim() || undefined,
            phone: (row["Teléfono"] || "").toString().trim() || undefined,
            jobTitle: (row["Cargo"] || "").toString().trim() || undefined,
            city: (row["Ciudad"] || "").toString().trim() || undefined,
            state: (row["Estado/Provincia"] || row["Estado/Provi"] || "").toString().trim() || undefined,
            country: (row["País"] || "").toString().trim() || undefined,
            lifecycleStage: normalizeStageFromExcel(
              row["Etapa"] !== undefined && row["Etapa"] !== null ? String(row["Etapa"]).trim() : ""
            ),
          });
        }
      }

      const groupKey = (name: string) => (name || "").trim().toLowerCase();
      const groupsByCompanyName = new Map<string, ContactRow[]>();
      for (const row of rows) {
        const key = groupKey(row.companyName);
        if (!groupsByCompanyName.has(key)) groupsByCompanyName.set(key, []);
        groupsByCompanyName.get(key)!.push({ ...row });
      }

      const totalRows = rows.length;
      setImportProgress((prev) => ({ ...prev, total: totalRows }));

      let processed = 0;
      for (const [, contactRows] of Array.from(groupsByCompanyName.entries())) {
        const companyName = contactRows[0].companyName;
        const contactEmail = contactRows.find((r) => r.email && String(r.email).includes('@'))?.email;
        const domainFromContact = contactEmail && typeof contactEmail === 'string'
          ? (contactEmail.split('@')[1] || '').trim().toLowerCase() || undefined
          : undefined;

        let companyId: number;
        try {
          const existing = await findCompanyByName(companyName);
          if (existing) {
            companyId = existing.id;
          } else {
            const companyPayload: { name: string; domain?: string } = { name: companyName.trim() };
            if (domainFromContact) companyPayload.domain = domainFromContact;
            const companyResponse = await api.post('/companies', companyPayload);
            companyId = companyResponse.data?.id;
            setImportProgress((prev) => ({ ...prev, companiesSuccess: prev.companiesSuccess + 1 }));
          }
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || err.message || "Error al crear empresa";
          for (let i = 0; i < contactRows.length; i++) {
            const currentProcessed = processed + 1;
            processed++;
            setImportProgress((prev) => ({
              ...prev,
              current: currentProcessed,
              errors: prev.errors + 1,
              errorList: [...prev.errorList, { name: companyName, error: errorMessage }],
            }));
          }
          continue;
        }

        for (const contactRow of contactRows) {
          const currentProcessed = processed + 1;
          const displayName = `${contactRow.firstName} ${contactRow.lastName}`.trim();
          try {
            await api.post('/contacts', {
              firstName: contactRow.firstName,
              lastName: contactRow.lastName,
              email: contactRow.email,
              phone: contactRow.phone,
              jobTitle: contactRow.jobTitle,
              city: contactRow.city,
              state: contactRow.state,
              country: contactRow.country,
              lifecycleStage: contactRow.lifecycleStage,
              companyId,
            });
            setImportProgress((prev) => ({
              ...prev,
              current: currentProcessed,
              success: prev.success + 1,
              contactsSuccess: prev.contactsSuccess + 1,
            }));
          } catch (contactErr: any) {
            const contactErrorMessage = contactErr.response?.data?.error || contactErr.message || "Error al crear contacto";
            setImportProgress((prev) => ({
              ...prev,
              current: currentProcessed,
              errors: prev.errors + 1,
              errorList: [
                ...prev.errorList,
                { name: `${companyName} - Contacto: ${displayName}`, error: contactErrorMessage },
              ],
            }));
          }
          processed++;
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchContacts();
    } catch (error: any) {
      console.error("Error importing file:", error);
      setImportProgress((prev) => ({
        ...prev,
        errors: prev.errors + 1,
        errorList: [
          ...prev.errorList,
          { name: "Error de procesamiento", error: error.message || "Error desconocido al procesar el archivo" },
        ],
      }));
    } finally {
      setImporting(false);
    }
  };

  // Debounce para filtros de columna (esperar 500ms después de que el usuario deje de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [columnFilters]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      // Búsqueda general
      if (search) {
        params.search = search;
      }
      
      // Filtros por etapas
      if (selectedStages.length > 0) {
        params.stages = selectedStages;
      }
      
      // Filtros por países
      if (selectedCountries.length > 0) {
        params.countries = selectedCountries;
      }
      
      // Filtros por propietarios
      if (selectedOwnerFilters.length > 0) {
        params.owners = selectedOwnerFilters.map(f => 
          f === 'me' ? 'me' : f === 'unassigned' ? 'unassigned' : String(f)
        );
      }
      
      // Ordenamiento
      params.sortBy = sortBy;
      
      // Filtros por columna (usar los valores con debounce)
      if (debouncedColumnFilters.nombre) params.filterNombre = debouncedColumnFilters.nombre;
      if (debouncedColumnFilters.empresa) params.filterEmpresa = debouncedColumnFilters.empresa;
      if (debouncedColumnFilters.telefono) params.filterTelefono = debouncedColumnFilters.telefono;
      if (debouncedColumnFilters.correo) params.filterCorreo = debouncedColumnFilters.correo;
      if (debouncedColumnFilters.pais) params.filterPais = debouncedColumnFilters.pais;
      if (debouncedColumnFilters.etapa) params.filterEtapa = debouncedColumnFilters.etapa;
      if (debouncedColumnFilters.propietario) {
        params.owners = [debouncedColumnFilters.propietario];
      }

      const response = await api.get('/contacts', { params });
      const contactsData = response.data.contacts || response.data || [];
      
      setContacts(contactsData);
      setTotalContacts(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage, selectedStages, selectedCountries, selectedOwnerFilters, sortBy, debouncedColumnFilters]);

  // fetchCompanies removido - ya no se cargan todas las empresas al inicio

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users', { params: { minimal: true } });
      setUsers(response.data || []);
    } catch (error: any) {
      // Si es un error 403, el usuario no tiene permisos para ver usuarios (no es admin)
      // Esto es normal y no debería mostrar un error
      if (error.response?.status === 403) {
        console.log('Usuario no tiene permisos para ver usuarios (no es admin)');
        setUsers([]);
      } else {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Comentado: ya no cargamos todas las empresas al inicio
  // useEffect(() => {
  //   fetchCompanies();
  // }, [fetchCompanies]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "jefe_comercial") {
      fetchUsers();
    }
  }, [fetchUsers, user?.role]);

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
      setSelectedCompanyName(contact.Company?.name || contact.Companies?.[0]?.name || "");
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
      setSelectedCompanyName("");
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

  // Función para validar email en tiempo real - OPTIMIZADA con useCallback
  const validateEmail = useCallback(async (email: string) => {
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

    // Debounce aumentado a 1500ms para reducir llamadas a la API
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
    }, 1500);

    emailValidationTimeoutRef.current = timeoutId;
  }, [editingContact]);

  // Función para validar DNI en tiempo real - OPTIMIZADA con useCallback
  const validateDni = useCallback(async (dni: string) => {
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

    // Solo validar cuando tenga exactamente 8 dígitos, con debounce
    if (dni.length === 8) {
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
      }, 1000); // Debounce de 1000ms incluso cuando tiene 8 dígitos
      
      dniValidationTimeoutRef.current = timeoutId;
    } else {
      setDniValidationError("");
    }
  }, [editingContact]);

  // Función para validar CEE en tiempo real - OPTIMIZADA con useCallback
  const validateCee = useCallback(async (cee: string) => {
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

    // Solo validar cuando tenga exactamente 12 caracteres, con debounce
    if (ceeUpper.length === 12) {
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
      }, 1000); // Debounce de 1000ms
      
      ceeValidationTimeoutRef.current = timeoutId;
    } else {
      setCeeValidationError("");
    }
  }, [editingContact]);

  // Handlers memoizados para evitar re-renders innecesarios
  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, firstName: value }));
    if (formErrors.firstName) {
      setFormErrors((prev) => ({ ...prev, firstName: "" }));
    }
  }, [formErrors.firstName]);

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, lastName: value }));
    if (formErrors.lastName) {
      setFormErrors((prev) => ({ ...prev, lastName: "" }));
    }
  }, [formErrors.lastName]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setFormData((prev) => ({ ...prev, email: newEmail }));
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: "" }));
    }
    // Validar email solo si tiene formato válido
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      validateEmail(newEmail);
    } else {
      setEmailValidationError("");
    }
  }, [formErrors.email, validateEmail]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, phone: e.target.value }));
  }, []);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, address: e.target.value }));
  }, []);

  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, city: e.target.value }));
  }, []);

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, state: e.target.value }));
  }, []);

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, country: e.target.value }));
  }, []);

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
      setSelectedCompanyName(response.data.name);

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

  // Función para manejar cuando se selecciona una empresa del modal
  const handleCompanySelected = (company?: any) => {
    if (company && company.id) {
      setFormData((prev) => ({
        ...prev,
        companyId: company.id.toString(),
      }));
      setSelectedCompanyName(company.name || "");
      if (formErrors.companyId) {
        setFormErrors((prev) => ({ ...prev, companyId: "" }));
      }
    }
    setAddCompanyModalOpen(false);
  };

  // Función para manejar cuando se crea una nueva empresa desde el modal
  const handleCompanyCreated = (company: any) => {
    if (company && company.id) {
      setFormData((prev) => ({
        ...prev,
        companyId: company.id.toString(),
      }));
      setSelectedCompanyName(company.name || "");
      if (formErrors.companyId) {
        setFormErrors((prev) => ({ ...prev, companyId: "" }));
      }
    }
    setCreateCompanyModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Validar que companyId esté presente y sea válido
      if (!formData.companyId || formData.companyId.trim() === '') {
        setFormErrors({ ...formErrors, companyId: 'La empresa principal es requerida' });
        return;
      }

      const companyIdNum = parseInt(formData.companyId, 10);
      if (isNaN(companyIdNum)) {
        setFormErrors({ ...formErrors, companyId: 'El ID de empresa no es válido' });
        return;
      }

      // Preparar los datos para enviar
      const submitData = {
        ...formData,
        companyId: companyIdNum,
      };

      console.log('📤 Enviando datos:', submitData);

      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, submitData);
      } else {
        await api.post("/contacts", submitData);
      }
      setFormErrors({});
      handleClose();
      fetchContacts();
    } catch (error: any) {
      console.error("Error saving contact:", error);
      const errorMessage = error.response?.data?.error || 'Error al guardar el contacto';
      alert(errorMessage);
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

  const handlePreview = (contact: Contact) => {
    setPreviewContact(contact);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewContact(null);
  };

  const getStageColor = (stage: string) => getStageColorUtil(theme, stage);

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

  const stageOptions = [
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
    { value: 'cierre_perdido', label: 'Cierre Perdido' },
    { value: 'lead_inactivo', label: 'Inactivo' },
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

  // Calcular paginación desde el servidor
  const totalPages = Math.ceil(totalContacts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalContacts);

  // Resetear a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStages, selectedCountries, selectedOwnerFilters, search, sortBy, debouncedColumnFilters]);

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
      }}
    >
      {/* Contenedor principal */}
      <UnifiedTable
        title="Contactos"
        actions={
          <>
            <Box
              sx={{
                display: "flex",
                gap: { xs: 0.5, sm: 0.75 },
                order: { xs: 3, sm: 0 },
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                size="small"
                startIcon={<Description sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                onClick={handleDownloadTemplate}
                sx={{
                  border: 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                  color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976D2',
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#1976D2',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.14)',
                    color: theme.palette.mode === 'dark' ? '#90CAF9' : '#1565C0',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.25)',
                  },
                }}
              >
                Plantilla
              </Button>
              <Button
                size="small"
                startIcon={<FontAwesomeIcon icon={faFileImport} style={{ fontSize: 16 }} />}
                onClick={handleImportFromExcel}
                disabled={importing}
                sx={{
                  border: 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.12)' : 'rgba(156, 39, 176, 0.08)',
                  color: theme.palette.mode === 'dark' ? '#CE93D8' : '#7B1FA2',
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#7B1FA2',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.14)',
                    color: theme.palette.mode === 'dark' ? '#E1BEE7' : '#6A1B9A',
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.25)',
                  },
                  '&:disabled': { opacity: 0.5 },
                }}
              >
                {importing ? 'Importando...' : 'Importar'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
              />
              <Button
                size="small"
                startIcon={<FontAwesomeIcon icon={faFileExport} style={{ fontSize: 16 }} />}
                onClick={handleExportToExcel}
                sx={{
                  border: 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.12)' : 'rgba(0, 150, 136, 0.08)',
                  color: theme.palette.mode === 'dark' ? '#4DB6AC' : '#00897B',
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#00897B',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.2)' : 'rgba(0, 150, 136, 0.14)',
                    color: theme.palette.mode === 'dark' ? '#80CBC4' : '#00695C',
                    boxShadow: '0 4px 12px rgba(0, 150, 136, 0.25)',
                  },
                }}
              >
                Exportar
              </Button>
              <Button
                size="small"
                startIcon={<FontAwesomeIcon icon={faFilter} style={{ fontSize: 16 }} />}
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                sx={{
                  border: 'none',
                  borderRadius: 1.5,
                  bgcolor: showColumnFilters 
                    ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}14`)
                    : (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 152, 0, 0.08)'),
                  color: showColumnFilters ? taxiMonterricoColors.green : (theme.palette.mode === 'dark' ? '#FFB74D' : '#E65100'),
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  order: { xs: 5, sm: 0 },
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: showColumnFilters ? taxiMonterricoColors.green : '#FF9800',
                    bgcolor: showColumnFilters 
                      ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}33` : `${taxiMonterricoColors.green}1A`)
                      : (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.14)'),
                    color: showColumnFilters ? taxiMonterricoColors.green : (theme.palette.mode === 'dark' ? '#FFCC80' : '#EF6C00'),
                    boxShadow: showColumnFilters ? `0 4px 12px ${taxiMonterricoColors.green}20` : '0 4px 12px rgba(255, 152, 0, 0.25)',
                  },
                }}
              >
                Filtro
              </Button>
              <Button
                size="small"
                startIcon={<Add sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                onClick={() => handleOpen()}
                sx={{
                  bgcolor: '#13944C',
                  color: "white",
                  borderRadius: 1.5,
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.75, sm: 0.875 },
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: '#0f7039',
                  },
                }}
              >
                Nuevo Contacto
              </Button>
            </Box>
          </>
        }
        header={
          <Box
            component="div"
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? `${taxiMonterricoColors.green}05`
                : `${taxiMonterricoColors.green}03`,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: {
                sm: "repeat(8, minmax(0, 1fr))",
                md: "1.5fr 1fr 0.9fr 1fr 0.7fr 1.2fr 0.6fr 0.7fr",
              },
              columnGap: { sm: 1, md: 1.5 },
              minWidth: { xs: 800, md: 'auto' },
              maxWidth: '100%',
              width: '100%',
              px: { xs: 1.5, md: 2 },
              py: { xs: 1.25, md: 1.5 },
              borderBottom: `2px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.5, width: '100%' }}>
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Correo</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, correo: '' }))} sx={{ p: 0.25, opacity: columnFilters.correo ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.correo}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, correo: e.target.value }))}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      height: 28,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.5, width: '100%' }}>
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.5, width: '100%' }}>
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                alignItems: "center",
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Propietario</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, propietario: '' }))} sx={{ p: 0.25, opacity: columnFilters.propietario ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  select
                  size="small"
                  placeholder="Todos"
                  value={columnFilters.propietario}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, propietario: e.target.value }))}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      height: 28,
                      fontSize: '0.75rem',
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v: unknown): React.ReactNode => {
                      if (!v) return 'Todos';
                      if (v === 'unassigned') return 'Sin asignar';
                      if (v === 'me') return 'Yo';
                      const u = _users.find((x: any) => String(x.id) === v);
                      return u ? `${u.firstName} ${u.lastName}` : String(v);
                    },
                    MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="unassigned">Sin asignar</MenuItem>
                  <MenuItem value="me">Yo</MenuItem>
                  {_users.filter((u: any) => u.role === 'user').map((u: any) => (
                    <MenuItem key={u.id} value={String(u.id)}>{u.firstName} {u.lastName}</MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
            <Box
              sx={{
                ...pageStyles.tableHeaderCell,
                px: { xs: 0.75, md: 1 },
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Acciones</Typography>
            </Box>
          </Box>
        }
        rows={
          <>
          {contacts.map((contact) => (
              <Box
                key={contact.id}
                component="div"
                onClick={() => navigate(`/contacts/${contact.id}`)}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "grid",
                  gridTemplateColumns: {
                    sm: "repeat(8, minmax(0, 1fr))",
                    md: "1.5fr 1fr 0.9fr 1fr 0.7fr 1.2fr 0.6fr 0.7fr",
                  },
                  columnGap: { sm: 1, md: 1.5 },
                  minWidth: { xs: 800, md: 'auto' },
                  maxWidth: '100%',
                  width: "100%",
                  overflow: 'hidden',
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 1, md: 1.25 },
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark'
                      ? 'inset 0 0 0 9999px rgba(255, 255, 255, 0.015)'
                      : 'inset 0 0 0 9999px rgba(0, 0, 0, 0.012)',
                  },
                }}
              >
                {/* Celda 1: Nombre (móvil = card, desktop = columna) */}
                <Box sx={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
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
                      src={contact?.avatar || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: contact?.avatar ? "transparent" : taxiMonterricoColors.green,
                        fontSize: "1rem",
                        fontWeight: 600,
                        boxShadow: theme.palette.mode === 'dark'
                          ? `0 1px 3px ${theme.palette.common.black}1F`
                          : `0 1px 3px ${theme.palette.common.black}1F`,
                        flexShrink: 0,
                      }}
                    >
                      {!contact?.avatar && (
                        <FontAwesomeIcon icon={faUserTie} style={{ fontSize: 24, color: 'white' }} />
                      )}
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
                        <PencilLine size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(contact);
                        }}
                        sx={{ p: 0.75 }}
                      >
                        <Eye size={18} />
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
                      <StageChipWithProgress
                        stage={contact.lifecycleStage || "lead"}
                        label={getStageLabel(contact.lifecycleStage || "lead")}
                        chipBg={getStageColor(contact.lifecycleStage || "lead").bg}
                        chipColor={getStageColor(contact.lifecycleStage || "lead").color}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleStatusMenuOpen(e, contact.id);
                        }}
                        disabled={updatingStatus[contact.id]}
                        barWidth={120}
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
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 4px 12px rgba(0,0,0,0.5)'
                              : '0 4px 12px rgba(0,0,0,0.15)',
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

                {/* Vista desktop: columna Nombre */}
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
                      src={contact?.avatar || undefined}
                      sx={{
                        width: { sm: 32, md: 40 },
                        height: { sm: 32, md: 40 },
                        bgcolor: contact?.avatar ? "transparent" : taxiMonterricoColors.green,
                        fontSize: { sm: "0.75rem", md: "0.875rem" },
                        fontWeight: 600,
                        boxShadow: theme.palette.mode === 'dark'
                          ? `0 1px 3px ${theme.palette.common.black}1F`
                          : `0 1px 3px ${theme.palette.common.black}1F`,
                        flexShrink: 0,
                      }}
                    >
                      {!contact?.avatar && (
                        <FontAwesomeIcon icon={faUserTie} style={{ fontSize: 20, color: 'white' }} />
                      )}
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
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: { sm: "0.625rem", md: "0.8125rem" },
                      fontWeight: 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {contact.email || "--"}
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
                  <StageChipWithProgress
                    stage={contact.lifecycleStage || "lead"}
                    label={getStageLabel(contact.lifecycleStage || "lead")}
                    chipBg={getStageColor(contact.lifecycleStage || "lead").bg}
                    chipColor={getStageColor(contact.lifecycleStage || "lead").color}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStatusMenuOpen(e, contact.id);
                    }}
                    disabled={updatingStatus[contact.id]}
                    barWidth={120}
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
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  {contact.Owner ? (
                    <Tooltip title={`${contact.Owner.firstName} ${contact.Owner.lastName}`} arrow>
                      <UserAvatar
                        firstName={contact.Owner.firstName}
                        lastName={contact.Owner.lastName}
                        colorSeed={contact.ownerId?.toString() || `${contact.Owner.firstName}${contact.Owner.lastName}`}
                        size={32}
                      />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>
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
                    justifyContent: "center",
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
                        sx={pageStyles.actionButtonEdit(theme)}
                      >
                        <PencilLine size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Vista previa">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(contact);
                        }}
                        sx={pageStyles.actionButtonView(theme)}
                      >
                        <Eye size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                        sx={pageStyles.actionButtonDelete(theme)}
                      >
                        <Trash size={20} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))}
            </>
        }
        emptyState={
          contacts.length === 0 ? (
            <Box sx={pageStyles.emptyState}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  py: 6,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? theme.palette.action.disabledBackground
                      : theme.palette.grey[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                    fontSize: '64px',
                    lineHeight: 1,
                  }}
                >
                  👤🏽
                </Box>
                <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    }}
                  >
                    No hay contactos para mostrar
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      lineHeight: 1.6,
                      fontSize: { xs: '0.875rem', md: '0.9375rem' },
                    }}
                  >
                    Crea tu primer contacto para comenzar a gestionar tus relaciones comerciales de manera eficiente.
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : undefined
        }
        pagination={
          totalContacts > 0 ? (
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
                  {startIndex + 1}-{endIndex}{" "}
                  de {totalContacts}
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
          {Object.entries(columnFilters).map(([key, value]) => {
            if (!value) return null;
            let label: string;
            if (key === 'propietario') {
              if (value === 'me') label = 'Propietario: Yo';
              else if (value === 'unassigned') label = 'Propietario: Sin asignar';
              else {
                const u = _users.find((x: any) => String(x.id) === value) as any;
                label = u ? `Propietario: ${u.firstName} ${u.lastName}` : `Propietario: ${value}`;
              }
            } else {
              const keyLabel = { nombre: 'Nombre', empresa: 'Empresa', telefono: 'Teléfono', correo: 'Correo', pais: 'País', etapa: 'Etapa' }[key] || key;
              label = `${keyLabel}: ${value}`;
            }
            return (
              <Chip
                key={key}
                label={label}
                size="small"
                onDelete={() => setColumnFilters(prev => ({ ...prev, [key]: '' }))}
                sx={{ fontSize: '0.6875rem', height: 20 }}
              />
            );
          })}
        </Box>
      )}

      <FormDrawer
        open={open}
        onClose={handleClose}
        title={editingContact ? "Editar Contacto" : "Nuevo Contacto"}
        onSubmit={handleSubmit}
        submitLabel={editingContact ? "Actualizar" : "Crear"}
        variant="panel"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Tipo de identificación: opciones a la izquierda, campo a la derecha */}
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
              <RadioGroup
                row
                value={idType}
                onChange={(e) => {
                  const newType = e.target.value as "dni" | "cee";
                  setIdType(newType);
                  if (newType === "dni") {
                    setFormData((prev) => ({ ...prev, cee: "", dni: "" }));
                    setCeeError("");
                  } else {
                    setFormData((prev) => ({ ...prev, dni: "", cee: "" }));
                    setDniError("");
                  }
                }}
                sx={{ gap: 2 }}
              >
                  <FormControlLabel
                    value="dni"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: `${theme.palette.text.secondary} !important`,
                          "&.Mui-checked": {
                            color: `${taxiMonterricoColors.green} !important`,
                          },
                          "&:hover": {
                            bgcolor: `${taxiMonterricoColors.green}14`,
                          },
                        }}
                      />
                    }
                    label="DNI"
                    sx={{
                      m: 0,
                      px: 1.5,
                      py: 0.5,
                      height: "36px",
                      border: `2px solid ${
                        idType === "dni"
                          ? taxiMonterricoColors.green
                          : theme.palette.divider
                      }`,
                      borderRadius: 1.5,
                      background: idType === "dni" 
                        ? `linear-gradient(135deg, ${taxiMonterricoColors.green}26 0%, ${taxiMonterricoColors.green}0D 100%)` 
                        : theme.palette.background.paper,
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      boxShadow: idType === "dni" ? `0 2px 8px ${taxiMonterricoColors.green}33` : 'none',
                      "&:hover": {
                        borderColor: taxiMonterricoColors.green,
                        background: `linear-gradient(135deg, ${taxiMonterricoColors.green}33 0%, ${taxiMonterricoColors.green}1A 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${taxiMonterricoColors.green}4D`,
                      },
                      "& .MuiFormControlLabel-label": {
                        color: idType === "dni" ? taxiMonterricoColors.green : theme.palette.text.primary,
                        fontWeight: idType === "dni" ? 600 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                  <FormControlLabel
                    value="cee"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: `${theme.palette.text.secondary} !important`,
                          "&.Mui-checked": {
                            color: `${taxiMonterricoColors.orange} !important`,
                          },
                          "&:hover": {
                            bgcolor: `${taxiMonterricoColors.orange}14`,
                          },
                        }}
                      />
                    }
                    label="CEE"
                    sx={{
                      m: 0,
                      px: 1.5,
                      py: 0.5,
                      height: "36px",
                      border: `2px solid ${
                        idType === "cee"
                          ? taxiMonterricoColors.orange
                          : theme.palette.divider
                      }`,
                      borderRadius: 1.5,
                      background: idType === "cee" 
                        ? `linear-gradient(135deg, ${taxiMonterricoColors.orange}26 0%, ${taxiMonterricoColors.orange}0D 100%)` 
                        : theme.palette.background.paper,
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      boxShadow: idType === "cee" ? `0 2px 8px ${taxiMonterricoColors.orange}33` : 'none',
                      "&:hover": {
                        borderColor: taxiMonterricoColors.orange,
                        background: `linear-gradient(135deg, ${taxiMonterricoColors.orange}33 0%, ${taxiMonterricoColors.orange}1A 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${taxiMonterricoColors.orange}4D`,
                      },
                      "& .MuiFormControlLabel-label": {
                        color: idType === "cee" ? taxiMonterricoColors.orange : theme.palette.text.primary,
                        fontWeight: idType === "cee" ? 600 : 400,
                        fontSize: "0.875rem",
                      },
                    }}
                  />
              </RadioGroup>

              {/* Campo de entrada a la derecha */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                  {idType === "dni" ? (
                    <TextField
                      size="small"
                      placeholder="DNI"
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
                      inputProps={{ maxLength: 8 }}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
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
                              color: `${taxiMonterricoColors.green} !important`,
                              borderRadius: 1,
                              transition: 'all 0.2s ease',
                              "&:hover": {
                                bgcolor: `${taxiMonterricoColors.green}26 !important`,
                                transform: 'scale(1.1)',
                                color: `${taxiMonterricoColors.greenDark} !important`,
                              },
                              "&.Mui-disabled": {
                                color: `${theme.palette.action.disabled} !important`,
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
                      size="small"
                      placeholder="CEE"
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
                      inputProps={{ maxLength: 12 }}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
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
                              color: `${taxiMonterricoColors.orange} !important`,
                              borderRadius: 1,
                              transition: 'all 0.2s ease',
                              "&:hover": {
                                bgcolor: `${taxiMonterricoColors.orange}26 !important`,
                                transform: 'scale(1.1)',
                                color: `${taxiMonterricoColors.orangeDark} !important`,
                              },
                              "&.Mui-disabled": {
                                color: `${theme.palette.action.disabled} !important`,
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

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4, rowGap: 0.5, alignItems: 'start' }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>
                Nombre <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>Apellido <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" value={formData.firstName} onChange={handleFirstNameChange} error={!!formErrors.firstName} helperText={formErrors.firstName} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" value={formData.lastName} onChange={handleLastNameChange} error={!!formErrors.lastName} helperText={formErrors.lastName} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Email</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Teléfono</Typography>
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" type="email" value={formData.email} onChange={handleEmailChange} error={!!formErrors.email || !!emailValidationError} helperText={formErrors.email || emailValidationError} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" value={formData.phone} onChange={handlePhoneChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5, gridColumn: '1 / -1' }}>Dirección</Typography>
              <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
                <TextField size="small" value={formData.address} onChange={handleAddressChange} multiline rows={2} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Distrito</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Provincia</Typography>
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" value={formData.city} onChange={handleCityChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" value={formData.state} onChange={handleStateChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Departamento</Typography>
              <Box />
              <Box sx={{ minWidth: 0 }}>
                <TextField size="small" value={formData.country} onChange={handleCountryChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
              </Box>
              <Box />
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Empresa Principal <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Cargo</Typography>
              <Box sx={{ minWidth: 0 }}>
                <TextField
                  select
                  size="small"
                  value={formData.companyId || ""}
                  onChange={(e) => {
                    if (e.target.value === "add_existing") setAddCompanyModalOpen(true);
                    else if (e.target.value === "create_new") setCreateCompanyModalOpen(true);
                  }}
                  error={!!formErrors.companyId}
                  helperText={formErrors.companyId}
                  fullWidth
                  inputProps={{ style: { fontSize: '1rem' } }}
                  InputProps={{ sx: { '& input': { py: 1.05 } } }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (v && selectedCompanyName ? selectedCompanyName : ''),
                    MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
                  }}
                >
                  {formData.companyId && selectedCompanyName && <MenuItem value={formData.companyId} disabled>{selectedCompanyName}</MenuItem>}
                  {formData.companyId && <Divider />}
                  <MenuItem value="add_existing">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Business sx={{ fontSize: 18 }} />{companyLabels.addCompany}</Box>
                  </MenuItem>
                  <MenuItem value="create_new" sx={{ color: taxiMonterricoColors.green }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Add sx={{ fontSize: 18 }} />{companyLabels.createCompany}</Box>
                  </MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <TextField
                  size="small"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  fullWidth
                  inputProps={{ style: { fontSize: '1rem' } }}
                  InputProps={{ sx: { '& input': { py: 1.05 } } }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Etapa del Ciclo de Vida</Typography>
              <Box />
              <Box sx={{ minWidth: 0 }}>
                <TextField
                  select
                  size="small"
                  value={formData.lifecycleStage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lifecycleStage: e.target.value }))}
                  fullWidth
                  inputProps={{ style: { fontSize: '1rem' } }}
                  InputProps={{ sx: { '& input': { py: 1.05 } } }}
                  SelectProps={{ MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } } }}
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
              <Box />
            </Box>
        </Box>
      </FormDrawer>

      {/* Panel de Vista Previa */}
      <EntityPreviewDrawer
        open={previewOpen}
        onClose={handleClosePreview}
        entityType="contact"
        entityId={previewContact?.id || null}
        entityData={previewContact}
      />

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
                <CircularProgress size={16} sx={{ color: theme.palette.common.white }} />
              ) : (
                <Trash size={18} />
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
            backgroundColor: theme.palette.mode === 'dark'
              ? `${theme.palette.common.black}80`
              : `${theme.palette.common.black}80`,
          },
        }}
      >
        <DialogTitle sx={{ color: '#4BB280', fontWeight: 600 }}>Nueva Empresa</DialogTitle>
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
              <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
              <MenuItem value="lead_inactivo">Inactivo</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
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
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCompany}
            variant="contained"
            disabled={!companyFormData.name.trim()}
            sx={pageStyles.saveButton}
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
            setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [], companiesSuccess: 0, contactsSuccess: 0 });
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
                  Procesando {importProgress.current} de {importProgress.total} filas...
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
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                    ✓ Empresas: {importProgress.companiesSuccess} · Contactos: {importProgress.contactsSuccess}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                    ✗ Errores: {importProgress.errors}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {importProgress.companiesSuccess > 0 || importProgress.contactsSuccess > 0 || importProgress.errors > 0
                    ? "Importación completada"
                    : "Error al procesar el archivo"}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {importProgress.companiesSuccess > 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                      ✓ {importProgress.companiesSuccess} empresa{importProgress.companiesSuccess !== 1 ? "s" : ""} importada{importProgress.companiesSuccess !== 1 ? "s" : ""} correctamente
                    </Typography>
                  )}
                  {importProgress.contactsSuccess > 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                      ✓ {importProgress.contactsSuccess} contacto{importProgress.contactsSuccess !== 1 ? "s" : ""} importado{importProgress.contactsSuccess !== 1 ? "s" : ""} correctamente
                    </Typography>
                  )}
                  {importProgress.errors > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.error.main, mb: 1 }}>
                        ✗ {importProgress.errors} fila{importProgress.errors !== 1 ? "s" : ""} con errores:
                      </Typography>
                      <Box
                        sx={{
                          maxHeight: 200,
                          overflowY: "auto",
                          pl: 2,
                          border: `1px solid ${theme.palette.error.light}`,
                          borderRadius: 1,
                          p: 1,
                          bgcolor: (theme.palette.error.light as string) + "10",
                        }}
                      >
                        {importProgress.errorList.map((err, index) => (
                          <Typography
                            key={index}
                            variant="caption"
                            sx={{
                              color: theme.palette.error.main,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            • <strong>{err.name}</strong>: {err.error}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          {!importing && (
            <Button
              onClick={() => {
                setImportProgressOpen(false);
                setImportProgress({
                  current: 0,
                  total: 0,
                  success: 0,
                  errors: 0,
                  errorList: [],
                  companiesSuccess: 0,
                  contactsSuccess: 0,
                });
              }}
              variant="contained"
              sx={pageStyles.saveButton}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal para agregar empresa existente */}
      <ContactCompanyModal
        open={addCompanyModalOpen}
        onClose={() => setAddCompanyModalOpen(false)}
        user={user}
        onSelect={handleCompanySelected}
        onCreate={handleCompanyCreated}
        mode="select"
      />

      {/* Modal para crear nueva empresa */}
      <ContactCompanyModal
        open={createCompanyModalOpen}
        onClose={() => setCreateCompanyModalOpen(false)}
        user={user}
        onSelect={handleCompanySelected}
        onCreate={handleCompanyCreated}
        mode="create"
      />
    </Box>
  );
};

export default Contacts;
