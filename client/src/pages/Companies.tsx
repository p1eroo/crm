import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Divider,
  Avatar,
  Select,
  Tooltip,
  Menu,
  useTheme,
  useMediaQuery,
  Collapse,
  Snackbar,
  Alert,
  LinearProgress,
  Checkbox,
  Popover,
} from '@mui/material';
import { Add, Close, ExpandMore, ExpandLess, Remove, Bolt, ChevronLeft, ChevronRight, MoreVert, Phone, CalendarToday, FormatBold, FormatItalic, FormatUnderlined, StrikethroughS, FormatListBulleted, FormatListNumbered, Description, Business } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors, hexToRgba } from '../theme/colors';
import { getStageColor as getStageColorUtil, normalizeStageFromExcel } from '../utils/stageColors';
import { StageChipWithProgress } from '../components/StageChipWithProgress';
import { pageStyles } from '../theme/styles';
import { companyLabels } from '../constants/companyLabels';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FormDrawer } from '../components/FormDrawer';
import RichTextEditor from '../components/RichTextEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faFileExport, faFilter } from '@fortawesome/free-solid-svg-icons';
import { Building2, PencilLine, Eye, Trash } from "lucide-react";
import { UnifiedTable, DEFAULT_ITEMS_PER_PAGE } from '../components/UnifiedTable';
import EntityPreviewDrawer from '../components/EntityPreviewDrawer';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { CompanyFormContent, getInitialFormData, type CompanyFormData } from '../components/CompanyFormContent';
import { formatCurrencyPE } from '../utils/currencyUtils';

interface Company {
  id: number;
  name: string;
  domain?: string;
  companyname?: string;
  phone?: string;
  email?: string;
  leadSource?: string;
  ruc?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  estimatedRevenue?: number;
  isRecoveredClient?: boolean;
  lifecycleStage: string;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: number;
  Owner?: { firstName: string; lastName: string };
}


const Companies: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search] = useState('');
  const [sortBy] = useState('newest');
  const [totalCompanies, setTotalCompanies] = useState(0);
  const companyFormDataRef = useRef<{ formData: CompanyFormData; setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>> }>({
    formData: getInitialFormData(null),
    setFormData: () => {},
  });
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [nameError, setNameError] = useState('');
  const [rucValidationError, setRucValidationError] = useState('');
  const [, setRucInfo] = useState<any>(null);
  const [, setRucDebts] = useState<any>(null);
  const [, setLoadingDebts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
  const nameValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const rucValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedOwnerFilters, setSelectedOwnerFilters] = useState<(string | number)[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stagesExpanded, setStagesExpanded] = useState(false);
  const [ownerFilterExpanded, setOwnerFilterExpanded] = useState(false);
  const [countryFilterExpanded, setCountryFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCompany, setPreviewCompany] = useState<Company | null>(null);
  
  // Estados para modales de actividades
  const [noteOpen, setNoteOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [activityCompanyId, setActivityCompanyId] = useState<number | null>(null);
  const [noteData, setNoteData] = useState({ subject: '', description: '' });
  const [callData, setCallData] = useState({ subject: '', description: '', duration: '' });
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent', dueDate: '', type: 'todo' as string });
  const [savingActivity, setSavingActivity] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados adicionales para el modal de tarea
  const descriptionEditorRef = React.useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<null | HTMLElement>(null);
  
  // Estados para filtros por columna
  const [columnFilters, setColumnFilters] = useState<{
    nombre: string;
    tipo: string;
    propietario: string;
    telefono: string;
    correo: string;
    origenLead: string;
    etapa: string;
    cr: string;
  }>({
    nombre: '',
    tipo: '',
    propietario: '',
    telefono: '',
    correo: '',
    origenLead: '',
    etapa: '',
    cr: '',
  });
  
  // Estado para filtros de columna con debounce (espera 500ms después de que el usuario deje de escribir)
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);

  // Función para obtener el label del origen de lead
  const getLeadSourceLabel = (source?: string) => {
    const labels: { [key: string]: string } = {
      'referido': 'Referido',
      'base': 'Base',
      'entorno': 'Entorno',
      'feria': 'Feria',
      'masivo': 'Masivo',
    };
    return source && labels[source] ? labels[source] : (source || '--');
  };

  // Función auxiliar para normalizar el origen de lead en la importación
  const normalizeLeadSource = (source: string): string | undefined => {
    if (!source || source.trim() === '') return undefined;
    
    const normalized = source.trim().toLowerCase();
    const mapping: { [key: string]: string } = {
      'referido': 'referido',
      'base': 'base',
      'entorno': 'entorno',
      'feria': 'feria',
      'masivo': 'masivo',
    };
    
    return mapping[normalized] || normalized;
  };

  // Validar nombre en tiempo real con debounce
  // Función para validar nombre - OPTIMIZADA con useCallback
  const validateCompanyName = useCallback(async (name: string) => {
    // Limpiar timeout anterior
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }

    // Si el campo está vacío, limpiar error
    if (!name || name.trim() === '') {
      setNameError('');
      return;
    }

    // Si estamos editando, no validar contra la misma empresa
    if (editingCompany && editingCompany.name.toLowerCase() === name.trim().toLowerCase()) {
      setNameError('');
      return;
    }

    // Debounce aumentado a 1500ms para reducir llamadas a la API
    nameValidationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/companies', {
          params: { search: name.trim(), limit: 50 },
        });
        
        const companies = response.data.companies || response.data || [];
        const exactMatch = companies.find((c: Company) => 
          c.name.toLowerCase().trim() === name.toLowerCase().trim()
        );

        if (exactMatch) {
          setNameError('Ya existe una empresa con este nombre');
        } else {
          setNameError('');
        }
      } catch (error) {
        // Si hay error en la validación, no mostrar error al usuario
        setNameError('');
      }
    }, 1500);
  }, [editingCompany]);

  // Validar RUC en tiempo real - OPTIMIZADA con useCallback
  const validateCompanyRuc = useCallback(async (ruc: string) => {
    // Limpiar timeout anterior
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }

    // Si el campo está vacío o tiene menos de 11 dígitos, limpiar error
    if (!ruc || ruc.trim() === '' || ruc.length < 11) {
      setRucValidationError('');
      return;
    }

    // Si estamos editando, no validar contra la misma empresa
    if (editingCompany && editingCompany.ruc === ruc.trim()) {
      setRucValidationError('');
      return;
    }

    // Debounce aumentado a 1000ms, solo validar cuando tenga 11 dígitos
    if (ruc.length === 11) {
      rucValidationTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get('/companies', {
            params: { search: ruc.trim(), limit: 50 },
          });
          
          const companies = response.data.companies || response.data || [];
          const exactMatch = companies.find((c: Company) => c.ruc === ruc.trim());

          if (exactMatch) {
            setRucValidationError('Ya existe una empresa con este RUC');
          } else {
            setRucValidationError('');
          }
        } catch (error) {
          // Si hay error en la validación, no mostrar error al usuario
          setRucValidationError('');
        }
      }, 1000);
    } else {
      setRucValidationError('');
    }
  }, [editingCompany]);

  // Función para validar ambos campos en paralelo - OPTIMIZADA con useCallback
  const validateAllFields = useCallback(async (name: string, ruc: string) => {
    // Limpiar timeouts anteriores
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }

    // Si el RUC tiene 11 dígitos, validar con debounce
    if (ruc && ruc.trim().length === 11) {
      validateCompanyRuc(ruc);
      
      // Validar nombre con debounce solo si tiene contenido
      if (name && name.trim() !== '') {
        validateCompanyName(name);
      } else {
        setNameError('');
      }
    } else {
      // Si el RUC no tiene 11 dígitos, usar las funciones de validación con debounce
      if (name && name.trim() !== '') {
        validateCompanyName(name);
      } else {
        setNameError('');
      }
      validateCompanyRuc(ruc);
    }
  }, [validateCompanyName, validateCompanyRuc]);

  // Handlers que actualizan el estado del formulario en el hijo (vía ref) para no re-renderizar toda la página al escribir
  const handleRucChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formData: CompanyFormData) => {
    const value = e.target.value.replace(/\D/g, '');
    const limitedValue = value.slice(0, 11);
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, ruc: limitedValue }));
    setRucError('');
    if (limitedValue.length === 11) {
      validateCompanyRuc(limitedValue);
      if (formData?.name && formData.name.trim() !== '') validateCompanyName(formData.name);
    } else {
      setRucValidationError('');
      if (formData?.name && formData.name.trim() !== '') validateCompanyName(formData.name);
    }
  }, [validateCompanyRuc, validateCompanyName]);

  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, companyname: e.target.value }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formData: CompanyFormData) => {
    const newName = e.target.value;
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, name: newName }));
    if (!newName.trim()) setNameError('');
    validateAllFields(newName, formData?.ruc ?? '');
  }, [validateAllFields]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, phone: e.target.value }));
  }, []);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, address: e.target.value }));
  }, []);

  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, city: e.target.value }));
  }, []);

  const handleStateChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, state: e.target.value }));
  }, []);

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, country: e.target.value }));
  }, []);

  const handleDomainChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, domain: e.target.value }));
  }, []);

  const handleFormDataChange = useCallback((updates: Partial<CompanyFormData>) => {
    companyFormDataRef.current?.setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Función para vista previa
  const handlePreview = (company: Company, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setPreviewCompany(company);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewCompany(null);
  };


  // Funciones para guardar actividades
  const handleSaveNote = async () => {
    if (!noteData.description.trim() || !activityCompanyId) {
      return;
    }
    setSavingActivity(true);
    try {
      await api.post('/activities/notes', {
        subject: noteData.subject || `Nota para ${companies.find(c => c.id === activityCompanyId)?.name || 'Empresa'}`,
        description: noteData.description,
        companyId: activityCompanyId,
      });
      setSuccessMessage('Nota creada exitosamente');
      setNoteOpen(false);
      setNoteData({ subject: '', description: '' });
      setActivityCompanyId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving note:', error);
      setSuccessMessage('Error al crear la nota');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleSaveCall = async () => {
    if (!callData.subject.trim() || !activityCompanyId) {
      return;
    }
    setSavingActivity(true);
    try {
      await api.post('/activities/calls', {
        subject: callData.subject,
        description: callData.description,
        companyId: activityCompanyId,
      });
      setSuccessMessage('Llamada registrada exitosamente');
      setCallOpen(false);
      setCallData({ subject: '', description: '', duration: '' });
      setActivityCompanyId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving call:', error);
      setSuccessMessage('Error al registrar la llamada');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleSaveTask = async () => {
    if (!taskData.title.trim() || !activityCompanyId) {
      return;
    }
    setSavingActivity(true);
    try {
      // Construir dueDate con zona horaria para evitar desfase (Companies solo tiene fecha, sin hora)
      let dueDateToSend: string | undefined = undefined;
      if (taskData.dueDate) {
        const tzOffset = -new Date().getTimezoneOffset();
        const tzSign = tzOffset >= 0 ? '+' : '-';
        const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
        const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
        dueDateToSend = `${taskData.dueDate}T00:00:00${tzSign}${tzHours}:${tzMins}`;
      }
      // Guardar siempre como tarea en /tasks (incluyendo reuniones) para que aparezca en la lista de tareas
      await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        type: taskData.type || 'todo',
        status: 'pending',
        priority: taskData.priority || 'medium',
        dueDate: dueDateToSend,
        companyId: activityCompanyId,
      });
      setSuccessMessage(taskData.type === 'meeting' ? 'Reunión creada exitosamente' : 'Tarea creada exitosamente');
      setTaskOpen(false);
      setTaskData({ title: '', description: '', priority: 'medium', dueDate: '', type: 'todo' });
      setActivityCompanyId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving task:', error);
      setSuccessMessage('Error al crear la ' + (taskData.type === 'meeting' ? 'reunión' : 'tarea'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setSavingActivity(false);
    }
  };

  // Funciones auxiliares para el editor de texto enriquecido
  const updateActiveFormats = useCallback(() => {
    if (descriptionEditorRef.current) {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    }
  }, []);

  useEffect(() => {
    if (descriptionEditorRef.current && taskOpen) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || '';
      }
    }

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    const editorElement = descriptionEditorRef.current;
    if (editorElement) {
      editorElement.addEventListener('mouseup', handleMouseUp);
      editorElement.addEventListener('keyup', handleKeyUp as any);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editorElement) {
        editorElement.removeEventListener('mouseup', handleMouseUp);
        editorElement.removeEventListener('keyup', handleKeyUp as any);
      }
    };
  }, [updateActiveFormats, taskOpen, taskData.description]);

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (taskData.dueDate) {
      const dateMatch = taskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const day = parseInt(dateMatch[3]);
        setCurrentMonth(new Date(year, month, day));
        setSelectedDate(new Date(year, month, day));
      }
    }
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    const selected = new Date(year, month, day);
    setSelectedDate(selected);
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setTaskData({ ...taskData, dueDate: '' });
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Función helper para sanitizar valores null/undefined
  const safeValue = (value: any, fallback: string = '--'): string => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
      return fallback;
    }
    return String(value);
  };

  const fetchCompanies = useCallback(async () => {
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
      if (debouncedColumnFilters.propietario) params.filterPropietario = debouncedColumnFilters.propietario;
      if (debouncedColumnFilters.telefono) params.filterTelefono = debouncedColumnFilters.telefono;
      if (debouncedColumnFilters.correo) params.filterCorreo = debouncedColumnFilters.correo;
      if (debouncedColumnFilters.origenLead) params.filterOrigenLead = debouncedColumnFilters.origenLead;
      if (debouncedColumnFilters.etapa) params.filterEtapa = debouncedColumnFilters.etapa;
      if (debouncedColumnFilters.cr) params.filterCR = debouncedColumnFilters.cr;
      
      const response = await api.get('/companies', { params });
      const companiesData = response.data.companies || response.data;
      
      // Sanitizar valores null antes de guardar
      const sanitizedCompanies = companiesData.map((company: any) => ({
        ...company,
        domain: company.domain || null,
        companyname: company.companyname || null,
        phone: company.phone || null,
        leadSource: company.leadSource || null,
        city: company.city || null,
        state: company.state || null,
        country: company.country || null,
        estimatedRevenue: company.estimatedRevenue || null,
        Owner: company.Owner || null,
      }));
      
      setCompanies(sanitizedCompanies);
      setTotalCompanies(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
      setTotalCompanies(0);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage, selectedStages, selectedCountries, selectedOwnerFilters, sortBy, debouncedColumnFilters]);

  // Debounce para filtros de columna (esperar 500ms después de que el usuario deje de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [columnFilters]);

  const fetchUsers = useCallback(async (): Promise<any[]> => {
    try {
      const response = await api.get('/users', { params: { minimal: true } });
      const list = response.data || [];
      setUsers(list);
      return list;
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
      return [];
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Realizar peticiones en paralelo con cancelación usando Promise.allSettled
        // para que el error de /users no afecte a /companies
        const [companiesResult, usersResult] = await Promise.allSettled([
          api.get('/companies', { 
            params: {
              page: currentPage,
              limit: itemsPerPage,
              ...(search && { search }),
              ...(selectedStages.length > 0 && { stages: selectedStages }),
              ...(selectedCountries.length > 0 && { countries: selectedCountries }),
              ...(selectedOwnerFilters.length > 0 && { 
                owners: selectedOwnerFilters.map(f => 
                  f === 'me' ? 'me' : f === 'unassigned' ? 'unassigned' : String(f)
                )
              }),
              sortBy,
              ...(debouncedColumnFilters.nombre && { filterNombre: debouncedColumnFilters.nombre }),
              ...(debouncedColumnFilters.propietario && { filterPropietario: debouncedColumnFilters.propietario }),
              ...(debouncedColumnFilters.telefono && { filterTelefono: debouncedColumnFilters.telefono }),
              ...(debouncedColumnFilters.correo && { filterCorreo: debouncedColumnFilters.correo }),
              ...(debouncedColumnFilters.origenLead && { filterOrigenLead: debouncedColumnFilters.origenLead }),
              ...(debouncedColumnFilters.etapa && { filterEtapa: debouncedColumnFilters.etapa }),
              ...(debouncedColumnFilters.cr && { filterCR: debouncedColumnFilters.cr }),
            },
            signal: abortController.signal 
          }),
          api.get('/users', { 
            params: { minimal: true },
            signal: abortController.signal 
          })
        ]);

        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          // Manejar respuesta de companies
          if (companiesResult.status === 'fulfilled') {
            const companiesRes = companiesResult.value;
            const companiesData = companiesRes.data.companies || companiesRes.data;
            const sanitizedCompanies = companiesData.map((company: any) => ({
              ...company,
              domain: company.domain || null,
              companyname: company.companyname || null,
              phone: company.phone || null,
              leadSource: company.leadSource || null,
              city: company.city || null,
              state: company.state || null,
              country: company.country || null,
              estimatedRevenue: company.estimatedRevenue || null,
              Owner: company.Owner || null,
            }));
            setCompanies(sanitizedCompanies);
            setTotalCompanies(companiesRes.data.total || 0);
          } else {
            // Error en companies
            const error = companiesResult.reason;
            if (error.name !== 'CanceledError' && error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
              console.error('Error fetching companies:', error);
              setCompanies([]);
              setTotalCompanies(0);
            }
          }
          
          // Manejar respuesta de users
          if (usersResult.status === 'fulfilled') {
            const usersRes = usersResult.value;
            if (usersRes.data) {
              setUsers(usersRes.data || []);
            }
          } else {
            // Error en users (403 es normal si no es admin)
            const error = usersResult.reason;
            if (error.response?.status === 403) {
              console.log('Usuario no tiene permisos para ver usuarios (no es admin)');
              setUsers([]);
            } else if (error.name !== 'CanceledError' && error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
              console.error('Error fetching users:', error);
              setUsers([]);
            }
          }
        }
      } catch (error: any) {
        // Ignorar errores de cancelación
        if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        if (isMounted) {
          console.error('Error inesperado fetching data:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Solo hacer fetch si hay dependencias válidas
    fetchData();

    // Cleanup: cancelar peticiones al desmontar
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [currentPage, itemsPerPage, search, selectedStages, selectedCountries, selectedOwnerFilters, sortBy, debouncedColumnFilters]);

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      if (nameValidationTimeoutRef.current) {
        clearTimeout(nameValidationTimeoutRef.current);
      }
      if (rucValidationTimeoutRef.current) {
        clearTimeout(rucValidationTimeoutRef.current);
      }
    };
  }, []);

  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const exportData = companies.map((company) => ({
      'C.R.': (company as any).isRecoveredClient ? 'Sí' : 'No',
      'Contacto': company.name || '--',
      'Dominio': company.domain || '--',
      'Razón social': company.companyname || '--',
      'Rubro': (company as any).rubro || '--',
      'Teléfono empresa': company.phone || '--',
      'Correo': (company as any).email || '--',
      'Origen de lead': getLeadSourceLabel((company as any).leadSource),
      'RUC': company.ruc || '--',
      'Asesor': company.Owner ? `${company.Owner.firstName} ${company.Owner.lastName}` : 'Sin asignar',
      'Dirección': company.address || '--',
      'Ciudad': company.city || '--',
      'Estado/Provincia': company.state || '--',
      'País': company.country || '--',
      'Etapa': company.lifecycleStage || '--',
      'Facturación': company.estimatedRevenue != null
        ? formatCurrencyPE(Number(company.estimatedRevenue))
        : '--',
      'Estado': company.lifecycleStage === 'cierre_ganado' ? 'Activo' : 'Inactivo',
      'Fecha de Creación': (company as any).createdAt ? new Date((company as any).createdAt).toLocaleDateString('es-ES') : '--',
    }));

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 8 }, // C.R.
      { wch: 30 }, // Nombre
      { wch: 25 }, // Dominio
      { wch: 20 }, // Razón social
      { wch: 18 }, // Rubro
      { wch: 18 }, // Teléfono empresa
      { wch: 25 }, // Correo
      { wch: 20 }, // Origen de lead
      { wch: 15 }, // RUC
      { wch: 20 }, // Propietario
      { wch: 30 }, // Dirección
      { wch: 15 }, // Ciudad
      { wch: 18 }, // Estado/Provincia
      { wch: 15 }, // País
      { wch: 15 }, // Etapa
      { wch: 30 }, // Facturación
      { wch: 12 }, // Estado
      { wch: 18 }, // Fecha de Creación
    ];
    ws['!cols'] = colWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');

    // Generar el nombre del archivo con la fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Empresas_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  // Plantilla Excel para importación: mismas columnas que espera el importador
  const handleDownloadTemplate = () => {
    const templateHeaders = {
      'Nombre': '',
      'Rubro': '',
      'Tipo de empresa': '',
      'Propietario': '',
      'Contacto': '',
      'Cargo': '',
      'Correo contacto': '',
      'Teléfono contacto': '',
      'Dominio': '',
      'Teléfono empresa': '',
      'Etapa': '',
      'Origen de lead': '',
      'Facturación': '',
      'C.R.': '',
      'RUC': '',
      'Correo': '',
      'Razón social': '',
      'Dirección': '',
      'Ciudad': '',
      'Estado/Provincia': '',
      'País': '',
    };
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([templateHeaders]);
    ws['!cols'] = [
      { wch: 28 }, { wch: 18 }, { wch: 14 }, // Nombre, Rubro, Tipo de empresa
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 22 },
      { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
      { wch: 8 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 28 },
      { wch: 14 }, { wch: 18 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
    XLSX.writeFile(wb, 'Plantilla_importacion_empresas.xlsx');
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  // Función auxiliar para buscar usuario por nombre completo (más flexible).
  // Si se pasa usersList se usa esa lista (p. ej. la recién cargada en import); si no, se usa el estado users.
  const findUserByName = (fullName: string, usersList?: any[]): number | null => {
    if (!fullName || fullName.trim() === '' || fullName.toLowerCase() === 'sin asignar') {
      return null;
    }
    const list = usersList ?? users;
    if (!list.length) return null;

    // Normalizar: eliminar espacios extra y convertir a minúsculas
    const normalizedInput = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
    const nameParts = normalizedInput.split(' ');

    if (nameParts.length < 2) {
      return null;
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Primero intentar coincidencia exacta (case-insensitive)
    let foundUser = list.find(
      (user: any) =>
        user.firstName?.toLowerCase().trim() === firstName &&
        user.lastName?.toLowerCase().trim() === lastName
    );

    // Si no encuentra coincidencia exacta, buscar coincidencia parcial
    // Esto maneja casos como "Jack Valdivia Faustino" vs "Jack Valdivia"
    if (!foundUser) {
      foundUser = list.find((user: any) => {
        const userFirstName = user.firstName?.toLowerCase().trim() || '';
        const userLastName = user.lastName?.toLowerCase().trim() || '';

        // Coincidencia exacta del nombre
        if (userFirstName !== firstName) {
          return false;
        }

        // El lastName del usuario debe empezar con el lastName del input
        // O el lastName del input debe empezar con el lastName del usuario
        return userLastName.startsWith(lastName) || lastName.startsWith(userLastName);
      });
    }

    return foundUser ? foundUser.id : null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgressOpen(true);
    setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [], companiesSuccess: 0, contactsSuccess: 0 });
    
    try {
      // Obtener lista de usuarios para el matching: si ya está en estado la usamos;
      // si no, la cargamos y usamos la respuesta directa (setState es asíncrono y no estaría disponible aún en el map).
      let usersForImport = users;
      if (usersForImport.length === 0) {
        usersForImport = await fetchUsers();
      }

      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      // Procesar cada fila y crear empresas (usar usersForImport para que el propietario se resuelva correctamente)
      const companiesToCreate = jsonData.map((row) => {
        const propietarioName = (row['Propietario'] || row['Asesor'] || '').toString().trim();
        const ownerId = propietarioName ? findUserByName(propietarioName, usersForImport) : null;

        const crValue = (row['C.R.'] || row['Cliente Recuperado'] || '').toString().trim().toLowerCase();
        const isRecoveredClient = crValue === 'sí' || crValue === 'si' || crValue === 'yes' || crValue === 'true' || crValue === '1' || crValue === 'x' || crValue === '✓';

        // Extraer datos del contacto si existen
        const contactName = (row['Contacto'] || row['Nombre Contacto'] || '').toString().trim();
        const contactJobTitleRaw = (row['Cargo'] || row['Cargo Contacto'] || '').toString().trim();
        const contactJobTitle = (contactJobTitleRaw === '0' || contactJobTitleRaw === '') ? undefined : contactJobTitleRaw;
        const contactEmail = (row['Correo contacto'] || row['Email contacto'] || '').toString().trim() || undefined;
        const contactPhone = (row['Teléfono contacto'] || '').toString().trim() || undefined;

        // Dominio: columna "Dominio" o, si está vacía, extraer del correo del contacto (parte después de @)
        const domainFromColumn = (row['Dominio'] || '').toString().trim() || undefined;
        const domainFromContactEmail = contactEmail && contactEmail.includes('@')
          ? (contactEmail.split('@')[1] || '').trim().toLowerCase() || undefined
          : undefined;
        const domain = domainFromColumn || domainFromContactEmail || undefined;

        const etapaRaw = row['Etapa'];
        const etapaStr = etapaRaw !== undefined && etapaRaw !== null ? String(etapaRaw).trim() : '';
        const lifecycleStage = normalizeStageFromExcel(etapaStr);

        // Tipo de empresa: aceptar A/B/C (o a/b/c) y guardar como minúscula
        const tipoRaw = (row['Tipo de empresa'] || row['Tipo'] || '').toString().trim();
        const companyType = tipoRaw ? (['a', 'b', 'c'].includes(tipoRaw.toLowerCase()) ? tipoRaw.toLowerCase() : tipoRaw) : undefined;

        return {
          name: (row['Nombre'] || '').toString().trim() || 'Sin nombre',
          domain,
          rubro: (row['Rubro'] || '').toString().trim() || undefined,
          companyType: companyType || undefined,
          companyname: (row['Razón social'] || '').toString().trim() || undefined,
          phone: (row['Teléfono empresa'] || row['Teléfono'] || '').toString().trim() || undefined,
          email: (row['Correo'] || '').toString().trim() || undefined,
          leadSource: normalizeLeadSource((row['Origen de lead'] || '').toString()),
          ruc: (row['RUC'] || '').toString().trim() || undefined,
          address: (row['Dirección'] || '').toString().trim() || undefined,
          city: (row['Ciudad'] || '').toString().trim() || undefined,
          state: (row['Estado/Provincia'] || '').toString().trim() || undefined,
          country: (row['País'] || '').toString().trim() || undefined,
          lifecycleStage,
          estimatedRevenue: (() => {
            const facturacionValue = row['Facturación'] || row['Potencial de Facturación Estimado'];
            return facturacionValue
              ? parseFloat(facturacionValue.toString().replace(/[^\d.-]/g, '')) || undefined
              : undefined;
          })(),
          isRecoveredClient: isRecoveredClient,
          ownerId: ownerId || undefined,
          // Agregar datos del contacto para crear después
          _contactName: contactName || undefined,
          _contactJobTitle: contactJobTitle || undefined,
          _contactEmail: contactEmail,
          _contactPhone: contactPhone,
        };
      }).filter(company => company.name !== 'Sin nombre'); // Filtrar filas vacías

      // Agrupar filas por nombre de empresa (mismo nombre = una sola empresa, varios contactos)
      const groupKey = (name: string) => (name || '').trim().toLowerCase();
      const groupsByCompanyName = new Map<string, typeof companiesToCreate>();
      for (const row of companiesToCreate) {
        const key = groupKey(row.name);
        if (!groupsByCompanyName.has(key)) groupsByCompanyName.set(key, []);
        groupsByCompanyName.get(key)!.push({ ...row });
      }

      const totalRows = companiesToCreate.length;
      setImportProgress(prev => ({ ...prev, total: totalRows }));

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

      let processed = 0;
      for (const [, rows] of Array.from(groupsByCompanyName.entries())) {
        const firstRow = rows[0];
        const companyName = firstRow.name;

        // Datos de empresa a usar (solo del primer registro del grupo)
        const companyPayload = {
          name: firstRow.name,
          domain: firstRow.domain,
          companyname: firstRow.companyname,
          rubro: firstRow.rubro,
          companyType: firstRow.companyType,
          phone: firstRow.phone,
          email: firstRow.email,
          leadSource: firstRow.leadSource,
          ruc: firstRow.ruc,
          address: firstRow.address,
          city: firstRow.city,
          state: firstRow.state,
          country: firstRow.country,
          lifecycleStage: firstRow.lifecycleStage,
          estimatedRevenue: firstRow.estimatedRevenue,
          isRecoveredClient: firstRow.isRecoveredClient,
          ownerId: firstRow.ownerId,
        };

        let companyId: number;

        try {
          const existing = await findCompanyByName(companyName);
          if (existing) {
            companyId = existing.id;
          } else {
            const companyResponse = await api.post('/companies', companyPayload);
            const created = companyResponse.data;
            companyId = created.id;
            setImportProgress(prev => ({ ...prev, companiesSuccess: prev.companiesSuccess + 1 }));
          }
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || err.message || 'Error al crear empresa';
          for (let i = 0; i < rows.length; i++) {
            const currentProcessed = processed + 1;
            processed++;
            setImportProgress(prev => ({
              ...prev,
              current: currentProcessed,
              errors: prev.errors + 1,
              errorList: [...prev.errorList, { name: companyName, error: errorMessage }],
            }));
          }
          continue;
        }

        // Crear un contacto por cada fila del grupo que tenga datos de contacto
        for (const row of rows) {
          const currentProcessed = processed + 1;
          const contactName = (row as any)._contactName;
          const contactJobTitle = (row as any)._contactJobTitle;
          const contactEmail = (row as any)._contactEmail;
          const contactPhone = (row as any)._contactPhone;

          if (contactName && contactName.trim()) {
            try {
              const nameParts = contactName.trim().split(' ');
              const firstName = nameParts[0] || 'Sin nombre';
              const lastName = nameParts.slice(1).join(' ') || 'Sin apellido';
              await api.post('/contacts', {
                firstName,
                lastName,
                email: contactEmail || undefined,
                phone: contactPhone || undefined,
                jobTitle: contactJobTitle || undefined,
                companyId,
                lifecycleStage: 'lead',
              });
              setImportProgress(prev => ({
                ...prev,
                current: currentProcessed,
                success: prev.success + 1,
                contactsSuccess: prev.contactsSuccess + 1,
              }));
            } catch (contactErr: any) {
              const contactErrorMessage = contactErr.response?.data?.error || contactErr.message || 'Error al crear contacto';
              setImportProgress(prev => ({
                ...prev,
                current: currentProcessed,
                errors: prev.errors + 1,
                errorList: [...prev.errorList, {
                  name: `${companyName} - Contacto: ${contactName}`,
                  error: contactErrorMessage,
                }],
              }));
            }
          } else {
            setImportProgress(prev => ({ ...prev, current: currentProcessed, success: prev.success + 1 }));
          }
          processed++;
        }
      }

      // El progreso final ya se actualiza automáticamente con cada setImportProgress

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Recargar la lista de empresas
      await fetchCompanies();
    } catch (error: any) {
      console.error('Error al procesar el archivo:', error);
      setImportProgress((prev) => ({
        ...prev,
        errors: prev.errors + 1,
        errorList: [...(prev.errorList || []), {
          name: 'Error de procesamiento',
          error: error.message || 'Error desconocido al procesar el archivo',
        }],
      }));
    } finally {
      setImporting(false);
    }
  };

  const handleOpen = (company?: Company) => {
    setEditingCompany(company ?? null);
    setRucError('');
    setRucInfo(null);
    setRucDebts(null);
    setOpen(true);
  };

  const handleToggleRecoveredClient = async (companyId: number, currentValue: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/companies/${companyId}`, {
        isRecoveredClient: !currentValue,
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error updating recovered client status:', error);
    }
  };

  const handleSearchRuc = async () => {
    const formData = companyFormDataRef.current?.formData;
    if (!formData?.ruc || formData.ruc.length < 11) {
      setRucError('El RUC debe tener 11 dígitos');
      return;
    }

    setLoadingRuc(true);
    setRucError('');

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      if (!factilizaToken) {
        setRucError('Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN');
        setLoadingRuc(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/ruc/info/${formData.ruc}`,
        {
          headers: {
            'Authorization': `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Guardar el RUC actual antes de actualizar el formulario
        const currentRuc = formData.ruc;
        const newName = data.nombre_o_razon_social || '';
        
        // Guardar toda la información para mostrarla en el panel lateral
        setRucInfo(data);
        
        const updatedFormData = {
          ...formData,
          name: newName,
          companyname: data.tipo_contribuyente || '',
          address: data.direccion_completa || data.direccion || '',
          city: data.distrito || '',
          state: data.provincia || '',
          country: data.departamento || 'Perú',
        };
        companyFormDataRef.current?.setFormData(updatedFormData);

        // Consultar deudas automáticamente después de obtener la información del RUC
        await handleSearchDebts(currentRuc);

        // Validar ambos campos inmediatamente después de autocompletar
        // Limpiar timeouts anteriores para evitar conflictos
        if (nameValidationTimeoutRef.current) {
          clearTimeout(nameValidationTimeoutRef.current);
        }
        if (rucValidationTimeoutRef.current) {
          clearTimeout(rucValidationTimeoutRef.current);
        }
        
        // Ejecutar validaciones inmediatamente sin debounce cuando se autocompleta
        const validateNameImmediate = async () => {
          if (!newName || newName.trim() === '') {
            setNameError('');
            return;
          }

          if (editingCompany && editingCompany.name.toLowerCase() === newName.trim().toLowerCase()) {
            setNameError('');
            return;
          }

          try {
            const response = await api.get('/companies', {
              params: { search: newName.trim(), limit: 50 },
            });
            
            const companies = response.data.companies || response.data || [];
            const exactMatch = companies.find((c: Company) => 
              c.name.toLowerCase().trim() === newName.toLowerCase().trim()
            );

            if (exactMatch) {
              setNameError('Ya existe una empresa con este nombre');
            } else {
              setNameError('');
            }
          } catch (error) {
            setNameError('');
          }
        };

        const validateRucImmediate = async () => {
          if (!currentRuc || currentRuc.trim() === '' || currentRuc.length < 11) {
            setRucValidationError('');
            return;
          }

          if (editingCompany && editingCompany.ruc === currentRuc.trim()) {
            setRucValidationError('');
            return;
          }

          try {
            const response = await api.get('/companies', {
              params: { search: currentRuc.trim(), limit: 50 },
            });
            
            const companies = response.data.companies || response.data || [];
            const exactMatch = companies.find((c: Company) => c.ruc === currentRuc.trim());

            if (exactMatch) {
              setRucValidationError('Ya existe una empresa con este RUC');
            } else {
              setRucValidationError('');
            }
          } catch (error) {
            setRucValidationError('');
          }
        };

        // Ejecutar ambas validaciones inmediatamente en paralelo
        await Promise.all([validateNameImmediate(), validateRucImmediate()]);
      } else {
        setRucError('No se encontró información para este RUC');
        setRucInfo(null);
        setRucDebts(null);
      }
    } catch (error: any) {
      console.error('Error al buscar RUC:', error);
      setRucInfo(null);
      setRucDebts(null);
      if (error.response?.status === 400) {
        setRucError('RUC no válido o no encontrado');
      } else if (error.response?.status === 401) {
        setRucError('Error de autenticación con la API');
      } else {
        setRucError('Error al consultar el RUC. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleSearchDebts = async (ruc: string) => {
    if (!ruc || ruc.length < 11) return;

    setLoadingDebts(true);
    setRucDebts(null);

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setLoadingDebts(false);
        return;
      }

      // Intentar con diferentes endpoints posibles de Factiliza
      // Nota: Verifica la documentación oficial de Factiliza para el endpoint correcto
      // Documentación: https://docs.factiliza.com
      const endpoints = [
        `https://api.factiliza.com/v1/deudas/${ruc}`, // Endpoint según documentación
        `https://api.factiliza.com/v1/ruc/${ruc}/deudas`, // Formato alternativo
        `https://api.factiliza.com/v1/sunat/ruc/${ruc}/deudas`, // Formato con sunat
        `https://api.factiliza.com/v1/ruc/deudas/${ruc}`,
        `https://api.factiliza.com/v1/ruc/deuda/${ruc}`,
        `https://api.factiliza.com/v1/sunat/deudas/${ruc}`,
        `https://api.factiliza.com/v1/consulta/deudas/${ruc}`, // Formato alternativo
      ];

      let debtsFound = false;

      console.log('🔍 Consultando deudas en Factiliza para RUC:', ruc);
      console.log('📋 Endpoints a probar:', endpoints);

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Probando endpoint: ${endpoint}`);
          const debtsResponse = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${factilizaToken}`,
            },
            timeout: 5000,
          });

          console.log(`✅ Respuesta exitosa de ${endpoint}:`, debtsResponse.data);

          if (debtsResponse.data && (debtsResponse.data.success || debtsResponse.data.data)) {
            const debtsData = debtsResponse.data.data || debtsResponse.data;
            
            console.log('📊 Datos de deudas recibidos:', debtsData);
            
            // Normalizar los datos a un formato común
            const normalizedDebts = {
              tiene_deudas: debtsData.tiene_deudas !== undefined 
                ? debtsData.tiene_deudas 
                : (debtsData.deudas && debtsData.deudas.length > 0) 
                  ? true 
                  : false,
              total_deuda: debtsData.total_deuda || debtsData.total || debtsData.monto_total || null,
              deudas: debtsData.deudas || debtsData.deuda || debtsData.detalle || [],
            };

            console.log('✅ Deudas normalizadas:', normalizedDebts);
            setRucDebts(normalizedDebts);
            debtsFound = true;
            break;
          } else {
            console.log(`⚠️ Respuesta sin datos válidos de ${endpoint}`);
          }
        } catch (endpointError: any) {
          // Mostrar errores detallados
          const errorStatus = endpointError.response?.status;
          const errorData = endpointError.response?.data;
          
          console.error(`❌ Error en endpoint ${endpoint}:`, {
            status: errorStatus,
            statusText: endpointError.response?.statusText,
            message: endpointError.message,
            data: errorData,
          });
          
          // Si es 401, el token puede ser inválido o el endpoint requiere autenticación diferente
          if (errorStatus === 401) {
            console.warn(`🔐 Error de autenticación (401) en ${endpoint}`);
            console.warn('💡 Verifica que tu token sea válido y tenga permisos para consultar deudas');
          }
          
          // Si es 403, el plan puede no incluir este servicio
          if (errorStatus === 403) {
            console.warn(`🚫 Acceso denegado (403) en ${endpoint}`);
            console.warn('💡 Tu plan de Factiliza puede no incluir el servicio de consulta de deudas');
            console.warn('💡 Contacta a soporte de Factiliza para verificar qué servicios incluye tu plan');
          }
          
          // Si es 404, el endpoint no existe
          if (errorStatus === 404) {
            console.log(`📍 Endpoint no encontrado (404): ${endpoint}`);
          }
          
          // Continuar con el siguiente endpoint si este falla
          if (errorStatus !== 404 && errorStatus !== 400) {
            console.log(`⚠️ Error no crítico en ${endpoint}, probando siguiente...`);
          }
        }
      }

      // Si no se encontró información en Factiliza
      if (!debtsFound) {
        console.log('⚠️ No se encontró información de deudas en Factiliza');
      } else {
        console.log('✅ Deudas obtenidas exitosamente de Factiliza');
      }
    } catch (error: any) {
      console.error('Error al buscar deudas:', error);
    } finally {
      setLoadingDebts(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompany(null);
    setRucInfo(null);
    setRucDebts(null);
    setRucError('');
    setNameError('');
    setRucValidationError('');
    setErrorMessage(null);
    if (nameValidationTimeoutRef.current) clearTimeout(nameValidationTimeoutRef.current);
    if (rucValidationTimeoutRef.current) clearTimeout(rucValidationTimeoutRef.current);
  };

  const handleSubmit = async () => {
    const formData = companyFormDataRef.current?.formData;
    if (!formData) return;
    if (!formData.name || !formData.name.trim()) {
      setNameError('El nombre de la empresa es requerido');
      setErrorMessage('Por favor, completa el nombre de la empresa antes de guardar.');
      return;
    }
    if (nameError) {
      setErrorMessage('Por favor, corrige el error en el nombre antes de guardar.');
      return;
    }
    if (rucValidationError) {
      setErrorMessage('Por favor, corrige el error en el RUC antes de guardar.');
      return;
    }
    try {
      const submitData: any = { ...formData };
      if (user && (user.role === 'admin' || user.role === 'jefe_comercial')) {
        submitData.ownerId = formData.ownerId?.trim() ? Number(formData.ownerId) : null;
      }
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, submitData);
      } else {
        await api.post('/companies', submitData);
      }
      handleClose();
      fetchCompanies();
    } catch (error: any) {
      console.error('Error saving company:', error);
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        const duplicateField = error.response.data.duplicateField;
        const field = error.response.data.field;
        if (field === 'name' || duplicateField === 'name') setNameError(errorMessage);
        else if (duplicateField === 'ruc') setRucValidationError(errorMessage);
        else setErrorMessage(errorMessage);
      } else {
        setErrorMessage('Error al guardar la empresa. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleDelete = (id: number) => {
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/companies/${companyToDelete}`);
      fetchCompanies();
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar la empresa. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStatusMenuAnchor({ ...statusMenuAnchor, [companyId]: event.currentTarget });
  };

  const handleStatusMenuClose = (companyId: number) => {
    setStatusMenuAnchor({ ...statusMenuAnchor, [companyId]: null });
  };

  const handleActionsMenuOpen = (event: React.MouseEvent<HTMLElement>, company: Company) => {
    event.stopPropagation();
    setActionsMenuAnchor({ ...actionsMenuAnchor, [company.id]: event.currentTarget });
    setSelectedCompany(company);
  };

  const handleActionsMenuClose = (companyId: number) => {
    setActionsMenuAnchor({ ...actionsMenuAnchor, [companyId]: null });
    setSelectedCompany(null);
  };

  const handleStatusChange = async (event: React.MouseEvent<HTMLElement>, companyId: number, newStage: string) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStatus({ ...updatingStatus, [companyId]: true });
    try {
      await api.put(`/companies/${companyId}`, { lifecycleStage: newStage });
      // Actualizar la empresa en la lista
      setCompanies(companies.map(company => 
        company.id === companyId 
          ? { ...company, lifecycleStage: newStage }
          : company
      ));
      handleStatusMenuClose(companyId);
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('Error al actualizar la etapa. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [companyId]: false });
    }
  };

  const getStageColor = (stage: string) => getStageColorUtil(theme, stage);

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacto': 'Contacto',
      'reunion_agendada': 'Reunión Agendada',
      'reunion_efectiva': 'Reunión Efectiva',
      'propuesta_economica': 'Propuesta Económica',
      'negociacion': 'Negociación',
      'licitacion': 'Licitación',
      'licitacion_etapa_final': 'Licitación Etapa Final',
      'cierre_ganado': 'Cierre Ganado',
      'firma_contrato': 'Firma de Contrato',
      'activo': 'Activo',
      'cierre_perdido': 'Cierre Perdido',
      'lead_inactivo': 'Inactivo',
      'cliente_perdido': 'Cierre Perdido',
    };
    return labels[stage] || stage;
  };

  const getStageLabelWithoutPercentage = (stage: string) => {
    return getStageLabel(stage).replace(/\s*\d+%/, '').trim();
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

  // Orden de las etapas según porcentaje (como en funnel)
  const stageOrder = [
    'lead', // 0%
    'contacto', // 10%
    'reunion_agendada', // 30%
    'reunion_efectiva', // 40%
    'propuesta_economica', // 50%
    'negociacion', // 70%
    'licitacion', // 75%
    'licitacion_etapa_final', // 85%
    'cierre_ganado', // 90%
    'firma_contrato', // 95%
    'activo', // 100%
    'cierre_perdido', // -1%
    'lead_inactivo', // -5%
  ];

  // Opciones de columnas disponibles

  // Los datos ya vienen filtrados y ordenados del servidor
  // Solo aplicamos filtros adicionales que requieren lógica del cliente
  // (como búsqueda por nombre del propietario que requiere el join)
  const filteredCompanies = companies.filter((company) => {
    // Filtro por nombre del propietario (requiere join, se hace en cliente)
    if (columnFilters.propietario) {
      const ownerName = company.Owner ? `${company.Owner.firstName} ${company.Owner.lastName}` : '';
      if (!ownerName.toLowerCase().includes(columnFilters.propietario.toLowerCase())) return false;
    }
    
    // Filtro por correo (si viene del servidor, pero por seguridad lo verificamos aquí también)
    if (columnFilters.correo && (company as any).email) {
      if (!(company as any).email.toLowerCase().includes(columnFilters.correo.toLowerCase())) return false;
    }
    if (columnFilters.tipo) {
      const tipo = ((company as any).companyType || '').toString().toLowerCase();
      if (!tipo.includes(columnFilters.tipo.toLowerCase())) return false;
    }
    
    return true;
  });

  // Calcular paginación usando el total del servidor
  // Nota: Los filtros del cliente se aplican sobre los datos ya paginados del servidor
  // Para filtros más complejos, deberían implementarse en el servidor
  const totalPages = Math.ceil(totalCompanies / itemsPerPage);
  const paginatedCompanies = filteredCompanies; // Ya viene paginado del servidor

  // Resetear a la página 1 cuando cambien los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedStages, selectedCountries, selectedOwnerFilters, search, sortBy, columnFilters]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default,
      minWidth: 0,
    }}>

      {/* Barra de título y acciones - mismo diseño que Contactos */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          px: { xs: 2, md: 3 },
          py: { xs: 1.25, md: 1.5 },
          mb: 4,
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.1375rem' },
            color: '#828690',
          }}
        >
          Empresas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
              '&:hover': {
                borderColor: '#1976D2',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.14)',
                color: theme.palette.mode === 'dark' ? '#90CAF9' : '#1565C0',
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
              '&:hover': {
                borderColor: '#7B1FA2',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.14)',
                color: theme.palette.mode === 'dark' ? '#E1BEE7' : '#6A1B9A',
              },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {importing ? 'Importando...' : 'Importar'}
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" style={{ display: 'none' }} />
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
              '&:hover': {
                borderColor: '#00897B',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.2)' : 'rgba(0, 150, 136, 0.14)',
                color: theme.palette.mode === 'dark' ? '#80CBC4' : '#00695C',
              },
            }}
          >
            Exportar
          </Button>
          <Button
            size="small"
            startIcon={<Add sx={{ fontSize: { xs: 16, sm: 18 } }} />}
            onClick={() => handleOpen()}
            sx={{
              bgcolor: '#13944C',
              color: 'white',
              borderRadius: 1.5,
              px: { xs: 1.25, sm: 1.5 },
              py: { xs: 0.75, sm: 0.875 },
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#0f7039',
              },
            }}
          >
            Nueva Empresa
          </Button>
        </Box>
      </Box>

      {/* Panel de filtros - siempre visible y abierto */}
      <Box
        sx={{
          mb: 3,
          bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header del panel - clickeable para colapsar/expandir */}
        <Box
          onClick={() => setFilterPanelCollapsed(!filterPanelCollapsed)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            cursor: 'pointer',
            borderBottom: filterPanelCollapsed ? 'none' : `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faFilter} style={{ fontSize: 18, color: theme.palette.text.secondary }} />
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary }}>
              Filtro
            </Typography>
          </Box>
          <IconButton size="small" sx={{ p: 0.5, '&:hover': { bgcolor: 'transparent' } }} disableRipple>
            {filterPanelCollapsed ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Box>

        {/* Contenido del panel - campos de filtro */}
        {!filterPanelCollapsed && (
        <Box sx={{ px: 2, py: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'flex-end',
                  mb: 2,
                }}
              >
                <Box sx={{ minWidth: 140, flex: '1 1 120px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Nombre
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Nombre"
                    value={columnFilters.nombre}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, nombre: e.target.value }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'transparent',
                        fontSize: '0.875rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'transparent' },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 120, flex: '1 1 100px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Tipo
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Tipo (A/B/C)"
                    value={columnFilters.tipo}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, tipo: e.target.value }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'transparent',
                        fontSize: '0.875rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'transparent' },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 120, flex: '1 1 100px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Teléfono
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Teléfono"
                    value={columnFilters.telefono}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, telefono: e.target.value }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'transparent',
                        fontSize: '0.875rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'transparent' },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 160, flex: '1 1 140px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Correo
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Correo"
                    value={columnFilters.correo}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, correo: e.target.value }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'transparent',
                        fontSize: '0.875rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'transparent' },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 160, flex: '1 1 140px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Origen Lead
                  </Typography>
                  <Select
                    size="small"
                    displayEmpty
                    value={columnFilters.origenLead}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, origenLead: e.target.value }))}
                    fullWidth
                    sx={{
                      bgcolor: 'transparent',
                      fontSize: '0.875rem',
                      borderRadius: 2,
                      '& .MuiSelect-select': { py: 1 },
                      '&:hover': { bgcolor: 'transparent' },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                        borderWidth: '1px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                    }}
                    renderValue={(v) => v ? getLeadSourceLabel(v) : 'Todos'}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="referido">Referido</MenuItem>
                    <MenuItem value="base">Base</MenuItem>
                    <MenuItem value="entorno">Entorno</MenuItem>
                    <MenuItem value="feria">Feria</MenuItem>
                    <MenuItem value="masivo">Masivo</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ minWidth: 160, flex: '1 1 140px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Etapa
                  </Typography>
                  <Select
                    size="small"
                    displayEmpty
                    value={columnFilters.etapa}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, etapa: e.target.value }))}
                    fullWidth
                    sx={{
                      bgcolor: 'transparent',
                      fontSize: '0.875rem',
                      borderRadius: 2,
                      '& .MuiSelect-select': { py: 1 },
                      '&:hover': { bgcolor: 'transparent' },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                        borderWidth: '1px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                    }}
                    renderValue={(v) => v ? getStageLabelWithoutPercentage(v) : 'Seleccionar etapa'}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {stageOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box sx={{ minWidth: 160, flex: '1 1 140px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    Propietario
                  </Typography>
                  <Select
                    size="small"
                    displayEmpty
                    value={columnFilters.propietario}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, propietario: e.target.value }))}
                    fullWidth
                    sx={{
                      bgcolor: 'transparent',
                      fontSize: '0.875rem',
                      borderRadius: 2,
                      '& .MuiSelect-select': { py: 1 },
                      '&:hover': { bgcolor: 'transparent' },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                        borderWidth: '1px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                    }}
                    MenuProps={{ sx: { zIndex: 1700 } }}
                    renderValue={(v) => {
                      if (!v) return 'Todos';
                      if (v === 'unassigned') return 'Sin asignar';
                      if (v === 'me') return 'Yo';
                      const u = users.find((x: any) => String(x.id) === v);
                      return u ? `${u.firstName} ${u.lastName}` : String(v);
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="unassigned">Sin asignar</MenuItem>
                    <MenuItem value="me">Yo</MenuItem>
                    {users.filter((u: any) => u.role === 'user').map((u: any) => (
                      <MenuItem key={u.id} value={String(u.id)}>{u.firstName} {u.lastName}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <Box sx={{ minWidth: 120, flex: '1 1 100px' }}>
                  <Typography sx={{ fontSize: '0.85rem', mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }}>
                    C.R.
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Sí/No"
                    value={columnFilters.cr}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, cr: e.target.value }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'transparent',
                        fontSize: '0.875rem',
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'transparent' },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          borderWidth: '1px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Botones Filter y Limpiar */}
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  startIcon={<FontAwesomeIcon icon={faFilter} style={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: '#1976D2',
                    color: 'white',
                    borderRadius: 1.5,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1976D2' },
                  }}
                >
                  Filtrar
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setColumnFilters({
                      nombre: '',
                      tipo: '',
                      propietario: '',
                      telefono: '',
                      correo: '',
                      origenLead: '',
                      etapa: '',
                      cr: '',
                    });
                  }}
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.12)',
                    color: theme.palette.mode === 'dark' ? '#EF5350' : '#D32F2F',
                    borderRadius: 1.5,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.12)',
                    },
                  }}
                >
                  Limpiar filtros
                </Button>
              </Box>
            </Box>
        )}
      </Box>

      {/* Contenedor principal con layout flex para tabla y panel de filtros */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' }, minWidth: 0, overflow: 'hidden' }}>
        {/* Contenido principal (tabla completa con header y filas) */}
        <UnifiedTable
          title="Lista de empresas"
          titleIcon={<FormatListBulleted sx={{ fontSize: 20 }} />}
          collapsible
          header={
            <Box sx={{ width: '100%', px: { xs: 2.5, md: 3 } }}>
            <Box
              component="div"
              sx={{
                bgcolor: theme.palette.mode === 'dark'
                  ? theme.palette.background.paper
                  : '#fafafa',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: { 
                  xs: 'repeat(11, minmax(0, 1fr))', 
                  md: '50px 2fr 0.5fr 1.4fr 1.4fr 1.2fr 1.5fr 1.25fr 1.5fr 1.55fr 100px' 
                },
                columnGap: { xs: 0.5, md: 1 },
                minWidth: 800,
                maxWidth: '100%',
                width: '100%',
                py: { xs: 1.25, md: 1.5 },
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>C.R.</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Nombre de Empresa</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Tipo</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Última Actividad</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Propietario</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Teléfono</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Correo</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Etapa</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Origen de lead</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>Facturación</Typography>
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '0.9375rem' }, textAlign: 'center' }}>Acciones</Typography>
            </Box>
          </Box>
          </Box>
          }
          rows={
            <>
            {paginatedCompanies.map((company) => (
              <Box key={company.id} sx={{ width: '100%', px: { xs: 2.5, md: 3 } }}>
                <Box
                  component="div"
                  onClick={() => navigate(`/companies/${company.id}`)}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'grid',
                    gridTemplateColumns: { 
                      xs: 'repeat(11, minmax(0, 1fr))', 
                      md: '50px 2fr 0.5fr 1.4fr 1.4fr 1.2fr 1.5fr 1.25fr 1.5fr 1.55fr 100px' 
                    },
                    columnGap: { xs: 0.5, md: 1 },
                    minWidth: 800,
                    maxWidth: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    py: { xs: 1.25, md: 1.5 },
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark'
                        ? 'inset 0 0 0 9999px rgba(255, 255, 255, 0.015)'
                        : 'inset 0 0 0 9999px rgba(0, 0, 0, 0.012)',
                    },
                  }}
                >
                <Box sx={{ px: { xs: 0.25, md: 0.5 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={(company as any).isRecoveredClient || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleRecoveredClient(company.id, (company as any).isRecoveredClient || false, e as any);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: taxiMonterricoColors.green,
                      '&.Mui-checked': {
                        color: taxiMonterricoColors.green,
                      },
                      padding: { xs: 0.25, md: 0.5 },
                    }}
                  />
                </Box>
                <Box sx={{ py: 0, px: { xs: 0.5, md: 0.75 }, display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, width: '100%' }}>
                      <Avatar
                        src={(company as any).logo || undefined}
                        sx={{
                          width: { xs: 32, md: 40 },
                          height: { xs: 32, md: 40 },
                          bgcolor: (company as any).logo ? 'transparent' : taxiMonterricoColors.green,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 600,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          flexShrink: 0,
                        }}
                      >
                        {!(company as any).logo && <Building2 size={20} color="white" />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: theme.palette.mode === 'light' ? '#666666' : theme.palette.text.primary,
                          fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.25,
                          maxWidth: { xs: '100px', md: '150px' },
                        }}
                        title={company.name}
                      >
                        {company.name && company.name.length > 12 ? company.name.substring(0, 12) + '...' : company.name}
                      </Typography>
                        {company.domain && company.domain !== '--' ? (
                          <Typography 
                            variant="caption" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (company.domain && company.domain !== '--') {
                                const domainUrl = company.domain.startsWith('http') ? company.domain : `https://${company.domain}`;
                                window.open(domainUrl, '_blank');
                              }
                            }}
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.75rem', md: '0.8125rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {company.domain}
                          </Typography>
                        ) : (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.75rem', md: '0.8125rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            --
                          </Typography>
                        )}
                      </Box>
                    </Box>
                </Box>
                {/* Columna Tipo */}
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666666' : theme.palette.text.primary, fontSize: { xs: '0.8125rem', md: '0.9375rem' }, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {((company as any).companyType === 'a' ? 'A' : (company as any).companyType === 'b' ? 'B' : (company as any).companyType === 'c' ? 'C' : (company as any).companyType) || '--'}
                  </Typography>
                </Box>
                {/* Nueva columna: Fecha de última actividad */}
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
                      fontWeight: 400,
                    }}
                  >
                    {company.updatedAt
                      ? new Date(company.updatedAt).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : safeValue(company.updatedAt)}
                  </Typography>
                </Box>
                {/* Nueva columna: Propietario */}
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  {company.Owner ? (
                    <Tooltip title={`${company.Owner.firstName} ${company.Owner.lastName}`} arrow>
                      <UserAvatar
                        firstName={company.Owner.firstName}
                        lastName={company.Owner.lastName}
                        colorSeed={company.ownerId?.toString() || `${company.Owner.firstName}${company.Owner.lastName}`}
                        size={32}
                      />
                    </Tooltip>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                        fontWeight: 400,
                      }}
                    >
                      Sin asignar
                    </Typography>
                  )}
                </Box>
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'light' ? '#666666' : theme.palette.text.primary,
                          fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                          fontWeight: 400,
                        }}
                      >
                    {company.phone || '--'}
                      </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#666666' : theme.palette.text.primary,
                      fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                      fontWeight: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: '120px', md: '150px' },
                      width: '100%',
                    }}
                    title={safeValue((company as any).email)}
                  >
                    {safeValue((company as any).email)}
                  </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                    <StageChipWithProgress
                      stage={company.lifecycleStage || 'lead'}
                      label={getStageLabel(company.lifecycleStage || 'lead')}
                      chipBg={getStageColor(company.lifecycleStage || 'lead').bg}
                      chipColor={getStageColor(company.lifecycleStage || 'lead').color}
                      progressBarColor={getStageColor(company.lifecycleStage || 'lead').progressBar}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStatusMenuOpen(e, company.id);
                      }}
                      disabled={updatingStatus[company.id]}
                      barWidth={120}
                    />
                    <Menu
                      anchorEl={statusMenuAnchor[company.id]}
                      open={Boolean(statusMenuAnchor[company.id])}
                      onClose={(e, reason) => {
                        if (e && 'stopPropagation' in e) {
                          (e as React.MouseEvent).stopPropagation();
                        }
                        handleStatusMenuClose(company.id);
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
                        onClick={(e) => handleStatusChange(e, company.id, option.value)}
                        disabled={updatingStatus[company.id] || company.lifecycleStage === option.value}
                        selected={company.lifecycleStage === option.value}
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
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, pl: { xs: 2, md: 2.5 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.mode === 'light' ? '#666666' : theme.palette.text.primary,
                      fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                      fontWeight: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: '120px', md: '150px' },
                    }}
                    title={getLeadSourceLabel((company as any).leadSource)}
                  >
                    {getLeadSourceLabel((company as any).leadSource)}
                  </Typography>
                </Box>
                
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, pl: { xs: 2, md: 2.5 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: company.estimatedRevenue != null ? (theme.palette.mode === 'dark' ? '#4ade80' : '#15803d') : (theme.palette.mode === 'light' ? '#666666' : theme.palette.text.primary),
                      fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                      fontWeight: 600,
                    }}
                  >
                    {company.estimatedRevenue != null
                      ? formatCurrencyPE(Number(company.estimatedRevenue))
                      : '--'}
                  </Typography>
                </Box>
                
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: { xs: 0, md: 0.5 }, minWidth: 0, overflow: 'hidden' }}>
                  {isLargeScreen ? (
                    <>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(company);
                          }}
                          sx={pageStyles.actionButtonEdit(theme)}
                        >
                          <PencilLine size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(company, e);
                          }}
                          sx={pageStyles.actionButtonView(theme)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                          }}
                          sx={pageStyles.actionButtonDelete(theme)}
                        >
                          <Trash size={18} />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionsMenuOpen(e, company)}
                        sx={{
                          color: theme.palette.text.secondary,
                          padding: 0.5,
                          '&:hover': {
                            color: theme.palette.text.primary,
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <MoreVert sx={{ fontSize: '1.25rem' }} />
                      </IconButton>
                      <Menu
                        anchorEl={actionsMenuAnchor[company.id]}
                        open={Boolean(actionsMenuAnchor[company.id])}
                        onClose={() => handleActionsMenuClose(company.id)}
                        onClick={(e) => e.stopPropagation()}
                        PaperProps={{
                          sx: {
                            minWidth: 180,
                            mt: 0.5,
                            borderRadius: 1.5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      >
                        <MenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(company);
                            handleActionsMenuClose(company.id);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1.5,
                          }}
                        >
                          <PencilLine size={18} color={theme.palette.text.secondary} />
                          <Typography variant="body2">Editar</Typography>
                        </MenuItem>
                        <MenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(company, e);
                            handleActionsMenuClose(company.id);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1.5,
                          }}
                        >
                          <Eye size={18} color={theme.palette.text.secondary} />
                          <Typography variant="body2">Ver</Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                            handleActionsMenuClose(company.id);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1.5,
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' 
                                ? `${theme.palette.error.main}26` 
                                : `${theme.palette.error.main}15`,
                            },
                          }}
                        >
                          <Trash size={18} />
                          <Typography variant="body2">Eliminar</Typography>
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </Box>
            </Box>
          </Box>
          ))}
            </>
          }
          emptyState={
            paginatedCompanies.length === 0 ? (
              <Box sx={{ ...pageStyles.emptyState, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper, py: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : theme.palette.grey[100],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    <Business
                      sx={{
                        fontSize: 64,
                        color: theme.palette.text.secondary,
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                      }}
                    >
                      No hay empresas para mostrar
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      }}
                    >
                      Crea tu primera empresa para comenzar a gestionar tus relaciones comerciales de manera eficiente.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : undefined
          }
          pagination={
            filteredCompanies.length > 0 ? (
              <>
              {/* Rows per page selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
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
                    fontSize: '0.8125rem',
                    height: '32px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCompanies)} de {totalCompanies}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    size="small"
                    sx={{
                      color: currentPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: currentPage === 1 ? 'transparent' : theme.palette.action.hover,
                      },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    size="small"
                    sx={{
                      color: currentPage === totalPages ? theme.palette.action.disabled : theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: currentPage === totalPages ? 'transparent' : theme.palette.action.hover,
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

      {/* Indicador de filtros activos */}
      {Object.values(columnFilters).some(v => v) && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          mb: 2,
          alignItems: 'center',
          width: '100%',
          flexBasis: '100%',
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
                const u = users.find((x: any) => String(x.id) === value) as any;
                label = u ? `Propietario: ${u.firstName} ${u.lastName}` : `Propietario: ${value}`;
              }
            } else {
              const keyLabel: { [key: string]: string } = {
                nombre: 'Nombre',
                tipo: 'Tipo',
                propietario: 'Propietario',
                telefono: 'Teléfono',
                correo: 'Correo',
                origenLead: 'Origen Lead',
                etapa: 'Etapa',
                cr: 'C.R.',
              };
              label = `${keyLabel[key] || key}: ${key === 'etapa' && value ? getStageLabelWithoutPercentage(value) : key === 'origenLead' && value ? getLeadSourceLabel(value) : value}`;
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

        {/* Panel de Filtros Lateral */}
        {filterDrawerOpen && (
        <Box
          sx={{
            width: { xs: '100%', md: 400 },
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            borderLeft: { xs: 'none', md: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` },
            borderTop: { xs: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, md: 'none' },
            borderRadius: 2,
            height: 'fit-content',
            maxHeight: { xs: 'none', md: 'calc(100vh - 120px)' },
            position: { xs: 'relative', md: 'sticky' },
            top: { xs: 0, md: 0 },
            mt: { xs: 2, md: 2.5 },
            alignSelf: 'flex-start',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header del Panel */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
              px: 2,
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
              }}
            >
              Filter
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                onClick={() => {
                  setSelectedStages([]);
                  setSelectedOwnerFilters([]);
                  setSelectedCountries([]);
                }}
                sx={{
                  color: theme.palette.error.main,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 0.75,
                  py: 0.25,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? hexToRgba(taxiMonterricoColors.error, 0.1) : hexToRgba(taxiMonterricoColors.error, 0.05),
                  },
                }}
              >
                Clear
              </Button>
              <IconButton
                size="small"
                onClick={() => setFilterDrawerOpen(false)}
                sx={{
                  color: theme.palette.text.secondary,
                  padding: '2px',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Contenido del Panel */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {/* Sección Etapas */}
            <Box>
              <Box
                onClick={() => setStagesExpanded(!stagesExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Etapas
                </Typography>
                {stagesExpanded ? (
                  <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary, transform: 'rotate(180deg)' }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={stagesExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {stageOrder.map((stage) => {
                      const stageColorObj = getStageColor(stage);
                      const isSelected = selectedStages.includes(stage);
                      
                      return (
                        <Chip
                          key={stage}
                          label={getStageLabelWithoutPercentage(stage)}
                          size="small"
                          variant={isSelected ? 'filled' : 'outlined'}
                          onClick={() => {
                            setSelectedStages((prev) =>
                              prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
                            );
                          }}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '24px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: 'auto',
                            py: 0.25,
                            px: 1,
                            opacity: isSelected ? 1 : 0.8,
                            bgcolor: isSelected ? stageColorObj.bg : 'transparent',
                            color: isSelected ? stageColorObj.color : theme.palette.text.primary,
                            borderColor: isSelected ? stageColorObj.bg : stageColorObj.color,
                            '&:hover': {
                              opacity: 1,
                              transform: 'scale(1.02)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiChip-label': {
                              padding: '0 4px',
                            },
                            ...(!isSelected && {
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              '& .MuiChip-label': {
                                color: theme.palette.text.primary,
                                padding: '0 4px',
                              },
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>

            {/* Sección Propietario de la Empresa */}
            <Box>
              <Box
                onClick={() => setOwnerFilterExpanded(!ownerFilterExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Propietario del Registro
                </Typography>
                {ownerFilterExpanded ? (
                  <Remove sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                ) : (
                  <Add sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={ownerFilterExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {/* Opción "Yo" */}
                    <Chip
                      icon={<Bolt sx={{ fontSize: 14, color: 'inherit' }} />}
                      label="Yo"
                      size="small"
                      onClick={() => {
                        setSelectedOwnerFilters((prev) =>
                          prev.includes('me') ? prev.filter((o) => o !== 'me') : [...prev, 'me']
                        );
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: '24px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        opacity: selectedOwnerFilters.includes('me') ? 1 : 0.8,
                        variant: selectedOwnerFilters.includes('me') ? 'filled' : 'outlined',
                        color: selectedOwnerFilters.includes('me') ? 'primary' : undefined,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          padding: '0 4px',
                        },
                        ...(!selectedOwnerFilters.includes('me') && {
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.primary,
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          '& .MuiChip-label': {
                            color: theme.palette.text.primary,
                            padding: '0 4px',
                          },
                        }),
                      }}
                    />

                    {/* Opción "Sin asignar" */}
                    <Chip
                      label="Sin asignar"
                      size="small"
                      onClick={() => {
                        setSelectedOwnerFilters((prev) =>
                          prev.includes('unassigned') ? prev.filter((o) => o !== 'unassigned') : [...prev, 'unassigned']
                        );
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: '24px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        opacity: selectedOwnerFilters.includes('unassigned') ? 1 : 0.8,
                        variant: selectedOwnerFilters.includes('unassigned') ? 'filled' : 'outlined',
                        color: selectedOwnerFilters.includes('unassigned') ? 'primary' : undefined,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          padding: '0 4px',
                        },
                        ...(!selectedOwnerFilters.includes('unassigned') && {
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.primary,
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          '& .MuiChip-label': {
                            color: theme.palette.text.primary,
                            padding: '0 4px',
                          },
                        }),
                      }}
                    />

                    {/* Lista de usuarios */}
                    {users.map((userItem) => {
                      const isSelected = selectedOwnerFilters.includes(userItem.id);
                      return (
                        <Chip
                          key={userItem.id}
                          avatar={
                            <UserAvatar
                              firstName={userItem.firstName}
                              lastName={userItem.lastName}
                              avatar={userItem.avatar}
                              colorSeed={userItem.id?.toString() || userItem.email || `${userItem.firstName}${userItem.lastName}`}
                              size={20}
                              variant="minimal"
                            />
                          }
                          label={`${userItem.firstName} ${userItem.lastName}`}
                          size="small"
                          onClick={() => {
                            setSelectedOwnerFilters((prev) =>
                              prev.includes(userItem.id) ? prev.filter((o) => o !== userItem.id) : [...prev, userItem.id]
                            );
                          }}
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '24px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: 'auto',
                            py: 0.25,
                            px: 1,
                            opacity: isSelected ? 1 : 0.8,
                            variant: isSelected ? 'filled' : 'outlined',
                            color: isSelected ? 'primary' : undefined,
                            '&:hover': {
                              opacity: 1,
                              transform: 'scale(1.02)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiChip-label': {
                              padding: '0 4px',
                            },
                            ...(!isSelected && {
                              borderColor: theme.palette.divider,
                              color: theme.palette.text.primary,
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              '& .MuiChip-label': {
                                color: theme.palette.text.primary,
                                padding: '0 4px',
                              },
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>

            {/* Sección País */}
            <Box>
              <Box
                onClick={() => setCountryFilterExpanded(!countryFilterExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  País
                </Typography>
                {countryFilterExpanded ? (
                  <Remove sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                ) : (
                  <Add sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={countryFilterExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {Array.from(new Set(companies.map(c => c.country).filter((c): c is string => typeof c === 'string' && c.length > 0))).sort().map((country: string) => (
                      <Chip
                        key={country}
                        label={country}
                        size="small"
                        onClick={() => {
                          setSelectedCountries((prev: string[]) =>
                            prev.includes(country) ? prev.filter((c: string) => c !== country) : [...prev, country]
                          );
                        }}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.8125rem',
                          height: '28px',
                          cursor: 'pointer',
                          width: 'fit-content',
                          minWidth: 'auto',
                          opacity: selectedCountries.includes(country) ? 1 : 0.8,
                          variant: selectedCountries.includes(country) ? 'filled' : 'outlined',
                          color: selectedCountries.includes(country) ? 'primary' : undefined,
                          '&:hover': {
                            opacity: 1,
                            transform: 'scale(1.02)',
                          },
                          transition: 'all 0.2s ease',
                          ...(!selectedCountries.includes(country) && {
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.primary,
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                            '& .MuiChip-label': {
                              color: theme.palette.text.primary,
                            },
                          }),
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>
          </Box>
        </Box>
      )}
      </Box>

      <FormDrawer
        open={open}
        onClose={handleClose}
        title={editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
        onSubmit={handleSubmit}
        submitLabel={editingCompany ? 'Actualizar' : companyLabels.create}
        variant="panel"
      >
        {open && (
          <CompanyFormContent
            key={editingCompany?.id ?? 'new'}
            initialData={getInitialFormData(editingCompany)}
            formDataRef={companyFormDataRef}
            user={user}
            users={users}
            editingCompany={editingCompany}
            theme={theme}
            rucError={rucError}
            nameError={nameError}
            rucValidationError={rucValidationError}
            loadingRuc={loadingRuc}
            setRucError={setRucError}
            setNameError={setNameError}
            setRucValidationError={setRucValidationError}
            setLoadingRuc={setLoadingRuc}
            onRucChange={handleRucChange}
            onCompanyNameChange={handleCompanyNameChange}
            onNameChange={handleNameChange}
            onPhoneChange={handlePhoneChange}
            onAddressChange={handleAddressChange}
            onCityChange={handleCityChange}
            onStateChange={handleStateChange}
            onCountryChange={handleCountryChange}
            onDomainChange={handleDomainChange}
            onSearchRuc={handleSearchRuc}
            onFormDataChange={handleFormDataChange}
          />
        )}
      </FormDrawer>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: pageStyles.dialog
        }}
      >
          <DialogContent sx={pageStyles.dialogContent}>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            ¿Estás seguro de que deseas eliminar esta empresa?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Esta acción no se puede deshacer. La empresa será eliminada permanentemente del sistema.
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
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: theme.palette.common.white }} /> : <Trash size={18} />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensajes de error */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1700 }}
      >
        <Alert 
          onClose={() => setErrorMessage(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

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
          {importing ? 'Importando...' : 'Importación Completada'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {importing ? (
              <>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Procesando {importProgress.current} de {importProgress.total} filas...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, flexWrap: 'wrap', gap: 1 }}>
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
                    ? `Importación completada`
                    : 'Error al procesar el archivo'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {importProgress.companiesSuccess > 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                      ✓ {importProgress.companiesSuccess} empresa{importProgress.companiesSuccess !== 1 ? 's' : ''} importada{importProgress.companiesSuccess !== 1 ? 's' : ''} correctamente
                    </Typography>
                  )}
                  {importProgress.contactsSuccess > 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                      ✓ {importProgress.contactsSuccess} contacto{importProgress.contactsSuccess !== 1 ? 's' : ''} importado{importProgress.contactsSuccess !== 1 ? 's' : ''} correctamente
                    </Typography>
                  )}
                  {importProgress.errors > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.error.main, mb: 1 }}>
                        ✗ {importProgress.errors} fila{importProgress.errors !== 1 ? 's' : ''} con errores:
                      </Typography>
                      <Box sx={{ 
                        maxHeight: 200, 
                        overflowY: 'auto', 
                        pl: 2,
                        border: `1px solid ${theme.palette.error.light}`,
                        borderRadius: 1,
                        p: 1,
                        bgcolor: theme.palette.error.light + '10'
                      }}>
                        {importProgress.errorList.map((err, index) => (
                          <Typography 
                            key={index} 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.error.main, 
                              display: 'block',
                              mb: 0.5
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
                setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [], companiesSuccess: 0, contactsSuccess: 0 });
              }}
              variant="contained"
              sx={pageStyles.saveButton}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes de éxito */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Entity Preview Drawer */}
      <EntityPreviewDrawer
        open={previewOpen}
        onClose={handleClosePreview}
        entityType="company"
        entityId={previewCompany?.id || null}
        entityData={previewCompany}
      />

      {/* Modal de Nota - Diseño exacto de CompanyDetail */}
      {noteOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95vw', sm: '700px' },
              maxWidth: { xs: '95vw', sm: '90vw' },
              height: '85vh',
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 20px 60px rgba(0,0,0,0.5)' 
                : '0 20px 60px rgba(0,0,0,0.12)',
              zIndex: 1500,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 4,
              animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes fadeInScale': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.95)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.text.primary, 
                  fontWeight: 600, 
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                }}>
                  Nota
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': { 
                      backgroundColor: theme.palette.error.main + '15',
                      color: theme.palette.error.main,
                    },
                    transition: 'all 0.2s ease',
                  }} 
                  size="small" 
                  onClick={() => setNoteOpen(false)}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', p: 3, overflow: 'hidden', gap: 3 }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Box sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`, 
                  borderRadius: 2,
                  overflow: 'hidden',
                  minHeight: '300px',
                  backgroundColor: theme.palette.background.paper,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:focus-within': {
                    boxShadow: 'none',
                    borderColor: theme.palette.divider,
                    transform: 'none',
                  },
                }}>
                  <RichTextEditor
                    value={noteData.description}
                    onChange={(value: string) => setNoteData({ ...noteData, description: value })}
                    placeholder="Empieza a escribir para dejar una nota..."
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ 
              px: 3,
              py: 2.5, 
              borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`, 
              backgroundColor: theme.palette.background.paper, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2,
            }}>
              <Button 
                onClick={() => setNoteOpen(false)} 
                sx={{ 
                  textTransform: 'none',
                  px: 3.5,
                  py: 1.25,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveNote} 
                variant="contained" 
                disabled={savingActivity || !noteData.description.trim()}
                sx={{ 
                  textTransform: 'none',
                  px: 4,
                  py: 1.25,
                  backgroundColor: savingActivity ? theme.palette.action.disabledBackground : taxiMonterricoColors.orange,
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: savingActivity ? 'none' : `0 4px 12px ${taxiMonterricoColors.orange}40`,
                  '&:hover': {
                    backgroundColor: savingActivity ? theme.palette.action.disabledBackground : taxiMonterricoColors.orangeDark,
                    boxShadow: savingActivity ? 'none' : `0 6px 16px ${taxiMonterricoColors.orange}50`,
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:disabled': {
                    backgroundColor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {savingActivity ? 'Guardando...' : 'Crear nota'}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              zIndex: 1499,
              animation: 'fadeIn 0.3s ease-out',
              '@keyframes fadeIn': {
                '0%': {
                  opacity: 0,
                },
                '100%': {
                  opacity: 1,
                },
              },
            }}
            onClick={() => setNoteOpen(false)}
          />
        </>
      )}

      {/* Modal de Llamada - Diseño exacto de CompanyDetail */}
      {callOpen && (
        <>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: 4,
              zIndex: 1500,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes fadeInScale': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.9)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: { xs: '64px', md: '72px' },
                px: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: `${taxiMonterricoColors.green}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                </Box>
                <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.25rem' }, letterSpacing: '-0.02em' }}>
                  Llamada
                </Typography>
              </Box>
              <IconButton 
                sx={{ 
                  color: theme.palette.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                    transform: 'rotate(90deg)',
                  }
                }} 
                size="medium" 
                onClick={() => setCallOpen(false)}
              >
                <Close />
              </IconButton>
            </Box>

            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              p: { xs: 3, md: 4 }, 
              overflow: 'hidden', 
              overflowY: 'auto',
              gap: 3,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                },
                transition: 'background-color 0.2s ease',
              },
            }}>
              <TextField
                label="Asunto"
                value={callData.subject}
                onChange={(e) => setCallData({ ...callData, subject: e.target.value })}
                required
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
              <TextField
                label="Duración (minutos)"
                type="number"
                value={callData.duration}
                onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
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
                onChange={(e) => setCallData({ ...callData, description: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: taxiMonterricoColors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: taxiMonterricoColors.green,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.green,
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ 
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              backgroundColor: theme.palette.background.paper, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2 
            }}>
              <Button 
                onClick={() => setCallOpen(false)} 
                variant="outlined"
                sx={{ 
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: theme.palette.text.secondary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCall} 
                variant="contained" 
                disabled={savingActivity || !callData.subject.trim()}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: savingActivity ? theme.palette.action.disabledBackground : taxiMonterricoColors.green,
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: savingActivity ? 'none' : `0 4px 12px ${taxiMonterricoColors.green}40`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: savingActivity ? theme.palette.action.disabledBackground : taxiMonterricoColors.greenDark,
                    boxShadow: savingActivity ? 'none' : `0 6px 16px ${taxiMonterricoColors.green}50`,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: 'none',
                  },
                }}
              >
                {savingActivity ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1499,
              animation: 'fadeIn 0.3s ease-out',
            }}
            onClick={() => setCallOpen(false)}
          />
        </>
      )}

      {/* Modal de Tarea/Reunión - Diseño exacto de CompanyDetail */}
      {taskOpen && (
        <>
          <Dialog
            open={taskOpen} 
            onClose={() => setTaskOpen(false)} 
            maxWidth={false}
            fullWidth={false}
            PaperProps={{
              sx: {
                borderRadius: 2,
                maxHeight: '90vh',
                width: '560px',
                maxWidth: '90vw',
              },
            }}
          >
            <Box
              sx={{
                backgroundColor: 'transparent',
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 48,
                px: 2,
                pt: 1.5,
                pb: 0.5,
              }}
            >
              <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                {taskData.type === 'meeting' ? 'Reunión' : 'Tarea'}
              </Typography>
              <IconButton 
                sx={{ 
                  color: theme.palette.text.secondary,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                    transform: 'rotate(90deg)',
                  }
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
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                fullWidth
                InputLabelProps={{
                  shrink: !!taskData.title,
                }}
                sx={{ 
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0.5,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '0.75rem',
                    '& fieldset': {
                      borderWidth: 0,
                      border: 'none',
                      top: 0,
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: '2px !important',
                      borderColor: `${taxiMonterricoColors.orange} !important`,
                      borderStyle: 'solid !important',
                      top: 0,
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '0px !important',
                    '& legend': {
                      width: 0,
                      display: 'none',
                    },
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px !important',
                    borderColor: `${taxiMonterricoColors.green} !important`,
                    borderStyle: 'solid !important',
                    '& legend': {
                      width: 0,
                      display: 'none',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    backgroundColor: 'transparent',
                    padding: 0,
                    margin: 0,
                    fontSize: '0.75rem',
                    '&.Mui-focused': {
                      color: taxiMonterricoColors.orange,
                      transform: 'translateY(-50%)',
                      backgroundColor: 'transparent',
                    },
                    '&.MuiInputLabel-shrink': {
                      display: 'none',
                    },
                  },
                  '& .MuiInputBase-input': {
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '0.75rem',
                    py: 1,
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.75, 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.75rem',
                    }}
                  >
                    Prioridad
                  </Typography>
                  <TextField
                    select
                    value={taskData.priority}
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value as any })}
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
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0.5,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontSize: '0.75rem',
                        '& fieldset': {
                          borderWidth: '2px',
                          borderColor: theme.palette.divider,
                        },
                        '&:hover fieldset': {
                          borderColor: taxiMonterricoColors.orange,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: taxiMonterricoColors.orange,
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.75rem',
                        py: 1,
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        '&.Mui-focused': {
                          color: taxiMonterricoColors.orange,
                        },
                      },
                    }}
                  >
                    <MenuItem value="low" sx={{ fontSize: '0.75rem', py: 0.75 }}>Baja</MenuItem>
                    <MenuItem value="medium" sx={{ fontSize: '0.75rem', py: 0.75 }}>Media</MenuItem>
                    <MenuItem value="high" sx={{ fontSize: '0.75rem', py: 0.75 }}>Alta</MenuItem>
                    <MenuItem value="urgent" sx={{ fontSize: '0.75rem', py: 0.75 }}>Urgente</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 0.75, 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.75rem',
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
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: taxiMonterricoColors.orange,
                            }
                          }}
                        >
                          <CalendarToday sx={{ fontSize: 18 }} />
                        </IconButton>
                      ),
                    }}
                    sx={{ 
                      cursor: 'pointer',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0.5,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontSize: '0.75rem',
                        '& fieldset': {
                          borderWidth: '2px',
                          borderColor: theme.palette.divider,
                        },
                        '&:hover fieldset': {
                          borderColor: taxiMonterricoColors.orange,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: taxiMonterricoColors.orange,
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.75rem',
                        py: 1,
                        cursor: 'pointer',
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        '&.Mui-focused': {
                          color: taxiMonterricoColors.orange,
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ position: 'relative' }}>
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
                    minHeight: '150px',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    pt: 0,
                    pb: 1.5,
                    px: 1,
                    borderRadius: 0.5,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    color: theme.palette.text.primary,
                    '&:empty:before': {
                      content: '"Descripción"',
                      color: theme.palette.text.disabled,
                    },
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      borderRadius: '3px',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0.5,
                    left: 4,
                    right: 4,
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.5,
                    backgroundColor: 'transparent',
                    borderRadius: 1,
                    p: 0.5,
                    border: 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                    <IconButton
                      size="small"
                      sx={{ 
                        p: 0.25, 
                        minWidth: 28, 
                        height: 28,
                        backgroundColor: activeFormats.bold ? (theme.palette.mode === 'dark' ? `${theme.palette.common.white}26` : theme.palette.grey[300]) : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.common.white}1A` : theme.palette.grey[300],
                        }
                      }}
                      onClick={() => {
                        document.execCommand('bold');
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
                        backgroundColor: activeFormats.italic ? (theme.palette.mode === 'dark' ? `${theme.palette.common.white}26` : theme.palette.grey[300]) : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.common.white}1A` : theme.palette.grey[300],
                        }
                      }}
                      onClick={() => {
                        document.execCommand('italic');
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
                        backgroundColor: activeFormats.underline ? (theme.palette.mode === 'dark' ? `${theme.palette.common.white}26` : theme.palette.grey[300]) : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.common.white}1A` : theme.palette.grey[300],
                        }
                      }}
                      onClick={() => {
                        document.execCommand('underline');
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
                        backgroundColor: activeFormats.strikeThrough ? (theme.palette.mode === 'dark' ? `${theme.palette.common.white}26` : theme.palette.grey[300]) : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.common.white}1A` : theme.palette.grey[300],
                        }
                      }}
                      onClick={() => {
                        document.execCommand('strikeThrough');
                        updateActiveFormats();
                      }}
                      title="Tachado"
                    >
                      <StrikethroughS sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ 
                        p: 0.25, 
                        minWidth: 28, 
                        height: 28,
                        backgroundColor: activeFormats.unorderedList ? (theme.palette.mode === 'dark' ? `${theme.palette.common.white}26` : theme.palette.grey[300]) : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.common.white}1A` : theme.palette.grey[300],
                        }
                      }}
                      onClick={() => {
                        document.execCommand('insertUnorderedList');
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
                        backgroundColor: activeFormats.orderedList ? (theme.palette.mode === 'dark' ? `${theme.palette.common.white}26` : theme.palette.grey[300]) : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? `${theme.palette.common.white}1A` : theme.palette.grey[300],
                        }
                      }}
                      onClick={() => {
                        document.execCommand('insertOrderedList');
                        updateActiveFormats();
                      }}
                      title="Lista numerada"
                    >
                      <FormatListNumbered sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <Box sx={{ px: 2 }}>
              <Divider sx={{ mt: 0.25, mb: 1.5 }} />
            </Box>
            <DialogActions sx={pageStyles.dialogActions}>
              <Button 
                onClick={() => setTaskOpen(false)} 
                sx={pageStyles.cancelButton}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveTask} 
                variant="contained" 
                disabled={savingActivity || !taskData.title.trim()}
                sx={pageStyles.saveButton}
              >
                {savingActivity ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Date Picker Popover */}
          <Popover
            open={Boolean(datePickerAnchorEl)}
            anchorEl={datePickerAnchorEl}
            onClose={() => setDatePickerAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 8px 32px rgba(0,0,0,0.4)' 
                  : '0 8px 32px rgba(0,0,0,0.12)',
                mt: 0.5,
                maxWidth: 280,
              },
            }}
          >
            <Box sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: 3,
                pb: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}>
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
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                    },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.95rem',
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.01em',
                }}>
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
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                    },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 0.5,
                mb: 2,
              }}>
                {dayNames.map((day) => (
                  <Typography
                    key={day}
                    sx={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      py: 0.5,
                    }}
                  >
                    {day}
                  </Typography>
                ))}
                {getDaysInMonth(currentMonth).map((day, index) => {
                  if (day === null) {
                    return <Box key={`empty-${index}`} />;
                  }
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth.getMonth() &&
                    selectedDate.getFullYear() === currentMonth.getFullYear();
                  const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === currentMonth.getMonth() &&
                    new Date().getFullYear() === currentMonth.getFullYear();
                  
                  return (
                    <IconButton
                      key={day}
                      onClick={() => handleDateSelect(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
                      sx={{
                        minWidth: 32,
                        height: 32,
                        p: 0,
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected 
                          ? 'white' 
                          : isToday 
                            ? taxiMonterricoColors.green 
                            : theme.palette.text.primary,
                        bgcolor: isSelected ? taxiMonterricoColors.green : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? taxiMonterricoColors.greenDark : theme.palette.action.hover,
                        },
                      }}
                    >
                      {day}
                    </IconButton>
                  );
                })}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={handleClearDate}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  size="small"
                  onClick={handleToday}
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    bgcolor: taxiMonterricoColors.green,
                    '&:hover': {
                      bgcolor: taxiMonterricoColors.greenDark,
                    },
                  }}
                >
                  Hoy
                </Button>
              </Box>
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

export default Companies;





