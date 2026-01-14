import React, { useEffect, useState, useCallback } from 'react';
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
  FormControl,
  Select,
  Tooltip,
  InputAdornment,
  Menu,
  useTheme,
  useMediaQuery,
  Collapse,
  Snackbar,
  Alert,
  LinearProgress,
  Checkbox,
  Popover,
  Card,
} from '@mui/material';
import { Add, Delete, Search, Visibility, UploadFile, FileDownload, FilterList, Close, ExpandMore, Remove, Bolt, Edit, Business, ChevronLeft, ChevronRight, MoreVert, ViewColumn, Email, Phone, LocationOn, Link as LinkIcon, Note, Assignment, Event, CalendarToday, FormatBold, FormatItalic, FormatUnderlined, StrikethroughS, FormatListBulleted, FormatListNumbered } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FormDrawer } from '../components/FormDrawer';
import RichTextEditor from '../components/RichTextEditor';
import { Building2 } from "lucide-react";
import { UnifiedTable, DEFAULT_ITEMS_PER_PAGE } from '../components/UnifiedTable';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    linkedin: '',
    companyname: '',
    phone: '',
    email: '',
    leadSource: '',
    lifecycleStage: 'lead',
    estimatedRevenue: '',
    ruc: '',
    address: '',
    city: '',
    state: '',
    country: '',
    isRecoveredClient: false,
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
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
  
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
  
  // Estados para filtros avanzados
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [filterRules, setFilterRules] = useState<Array<{
    id: string;
    column: string;
    operator: string;
    value: string;
  }>>([]);

  // Estados para filtros por columna
  const [columnFilters, setColumnFilters] = useState<{
    nombre: string;
    propietario: string;
    telefono: string;
    correo: string;
    origenLead: string;
    etapa: string;
    cr: string;
  }>({
    nombre: '',
    propietario: '',
    telefono: '',
    correo: '',
    origenLead: '',
    etapa: '',
    cr: '',
  });
  
  // Estado para filtros de columna con debounce (espera 500ms después de que el usuario deje de escribir)
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);
  const [showColumnFilters, setShowColumnFilters] = useState(false);

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
  const validateCompanyName = async (name: string) => {
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

    // Debounce: esperar 500ms después de que el usuario deje de escribir
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
    }, 500);
  };

  // Validar RUC en tiempo real con debounce
  const validateCompanyRuc = async (ruc: string) => {
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

    // Debounce: esperar 500ms después de que el usuario deje de escribir
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
    }, 500);
  };

  // Función para validar ambos campos en paralelo
  const validateAllFields = async (name: string, ruc: string) => {
    // Limpiar timeouts anteriores
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }

    // Si el RUC tiene 11 dígitos, validar inmediatamente sin debounce
    if (ruc && ruc.trim().length === 11) {
      // Ejecutar validación del RUC inmediatamente (sin debounce)
      if (rucValidationTimeoutRef.current) {
        clearTimeout(rucValidationTimeoutRef.current);
      }
      
      // Validar RUC inmediatamente
      if (!editingCompany || editingCompany.ruc !== ruc.trim()) {
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
          setRucValidationError('');
        }
      } else {
        setRucValidationError('');
      }
      
      // Validar nombre con debounce solo si tiene contenido
      if (name && name.trim() !== '') {
        validateCompanyName(name);
      } else {
        setNameError('');
      }
    } else {
      // Si el RUC no tiene 11 dígitos, usar las funciones de validación con debounce
      validateCompanyName(name);
      validateCompanyRuc(ruc);
    }
  };

  // Función para vista previa
  const handlePreview = (company: Company, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Toggle: si ya está expandido, colapsar; si no, expandir
    setExpandedCompanyId(expandedCompanyId === company.id ? null : company.id);
  };

  // Funciones para abrir modales de actividades
  const handleOpenNote = (companyId: number) => {
    setActivityCompanyId(companyId);
    setNoteData({ subject: '', description: '' });
    setNoteOpen(true);
  };

  const handleOpenCall = (companyId: number) => {
    setActivityCompanyId(companyId);
    setCallData({ subject: '', description: '', duration: '' });
    setCallOpen(true);
  };

  const handleOpenTask = (companyId: number) => {
    setActivityCompanyId(companyId);
    setTaskData({ title: '', description: '', priority: 'medium', dueDate: '', type: 'todo' });
    setTaskOpen(true);
  };

  const handleOpenMeeting = (companyId: number) => {
    setActivityCompanyId(companyId);
    setTaskData({ title: '', description: '', priority: 'medium', dueDate: '', type: 'meeting' });
    setTaskOpen(true);
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
      await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        type: taskData.type || 'todo',
        status: 'not started',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || undefined,
        companyId: activityCompanyId,
      });
      setSuccessMessage((taskData.type === 'meeting' ? 'Reunión' : 'Tarea') + ' creada exitosamente');
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
      
      // Filtros avanzados
      if (filterRules.length > 0) {
        params.filterRules = JSON.stringify(filterRules);
      }
      
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
  }, [search, currentPage, itemsPerPage, selectedStages, selectedCountries, selectedOwnerFilters, sortBy, filterRules, debouncedColumnFilters]);

  // Debounce para filtros de columna (esperar 500ms después de que el usuario deje de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [columnFilters]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
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
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Realizar peticiones en paralelo con cancelación
        const [companiesRes, usersRes] = await Promise.all([
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
              ...(filterRules.length > 0 && { filterRules: JSON.stringify(filterRules) }),
            },
            signal: abortController.signal 
          }),
          api.get('/users', { 
            signal: abortController.signal 
          })
        ]);

        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
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
          
          // Manejar usuarios
          if (usersRes.data) {
            setUsers(usersRes.data || []);
          }
        }
      } catch (error: any) {
        // Ignorar errores de cancelación
        if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        if (isMounted) {
          // Manejar error de usuarios (403 es normal si no es admin)
          if (error.config?.url?.includes('/users') && error.response?.status === 403) {
            console.log('Usuario no tiene permisos para ver usuarios (no es admin)');
            setUsers([]);
          } else {
            console.error('Error fetching data:', error);
            setCompanies([]);
            setTotalCompanies(0);
          }
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
  }, [currentPage, itemsPerPage, search, selectedStages, selectedCountries, selectedOwnerFilters, sortBy, filterRules, debouncedColumnFilters]);

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
      'Teléfono': company.phone || '--',
      'Correo': (company as any).email || '--',
      'Origen de lead': getLeadSourceLabel((company as any).leadSource),
      'RUC': company.ruc || '--',
      'Asesor': company.Owner ? `${company.Owner.firstName} ${company.Owner.lastName}` : 'Sin asignar',
      'Dirección': company.address || '--',
      'Ciudad': company.city || '--',
      'Estado/Provincia': company.state || '--',
      'País': company.country || '--',
      'Etapa': company.lifecycleStage || '--',
      'Facturación': company.estimatedRevenue 
        ? `S/ ${Number(company.estimatedRevenue).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      { wch: 15 }, // Teléfono
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

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  // Función auxiliar para buscar usuario por nombre completo (más flexible)
  const findUserByName = (fullName: string): number | null => {
    if (!fullName || fullName.trim() === '' || fullName.toLowerCase() === 'sin asignar') {
      return null;
    }
    
    // Normalizar: eliminar espacios extra y convertir a minúsculas
    const normalizedInput = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
    const nameParts = normalizedInput.split(' ');
    
    if (nameParts.length < 2) {
      return null;
    }
    
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    // Primero intentar coincidencia exacta (case-insensitive)
    let foundUser = users.find(
      (user) =>
        user.firstName?.toLowerCase().trim() === firstName &&
        user.lastName?.toLowerCase().trim() === lastName
    );
    
    // Si no encuentra coincidencia exacta, buscar coincidencia parcial
    // Esto maneja casos como "Jack Valdivia Faustino" vs "Jack Valdivia"
    if (!foundUser) {
      foundUser = users.find((user) => {
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

  // Función para traducir mensajes de error al español
  const translateError = (errorMessage: string): string => {
    const errorLower = errorMessage.toLowerCase();
    
    // Errores de validación de lifecycleStage
    if (errorLower.includes('lifecyclestage') || errorLower.includes('lifecycle stage')) {
      if (errorLower.includes('must be one of')) {
        return 'Etapa de ciclo de vida no válida. Debe ser una de: lead, contacto, reunión agendada, reunión efectiva, propuesta económica, negociación, licitación, licitación etapa final, cierre ganado, cierre perdido, firma contrato, activo, cliente perdido, lead inactivo';
      }
      return 'Etapa de ciclo de vida no válida';
    }
    
    // Errores de ownerId
    if (errorLower.includes('ownerid') || errorLower.includes('owner id')) {
      if (errorLower.includes('must be a valid integer') || errorLower.includes('invalid integer')) {
        return 'El propietario debe ser un número válido';
      }
      if (errorLower.includes('foreign key') || errorLower.includes('constraint')) {
        return 'El propietario especificado no existe';
      }
      return 'Error en el campo propietario';
    }
    
    // Errores de estimatedRevenue
    if (errorLower.includes('estimatedrevenue') || errorLower.includes('estimated revenue')) {
      if (errorLower.includes('invalid value') || errorLower.includes('cannot convert')) {
        return 'El valor del potencial de facturación estimado no es válido. Debe ser un número';
      }
      return 'Error en el potencial de facturación estimado';
    }
    
    // Errores de nombre
    if (errorLower.includes('name') && errorLower.includes('cannot be null')) {
      return 'El nombre de la empresa es requerido';
    }
    
    // Errores de RUC
    if (errorLower.includes('ruc')) {
      if (errorLower.includes('duplicate') || errorLower.includes('ya existe')) {
        return 'Ya existe una empresa con este RUC';
      }
      return 'Error en el campo RUC';
    }
    
    // Errores de email
    if (errorLower.includes('email') || errorLower.includes('correo')) {
      if (errorLower.includes('invalid') || errorLower.includes('no válido')) {
        return 'El formato del correo electrónico no es válido';
      }
      return 'Error en el campo correo electrónico';
    }
    
    // Errores de foreign key
    if (errorLower.includes('foreign key') || errorLower.includes('constraint')) {
      return 'Error de referencia: uno de los valores relacionados no existe';
    }
    
    // Errores de validación general
    if (errorLower.includes('validation error')) {
      return 'Error de validación en los datos proporcionados';
    }
    
    // Errores de tipo de dato
    if (errorLower.includes('cannot convert') || errorLower.includes('invalid value')) {
      return 'El valor proporcionado no es del tipo correcto';
    }
    
    // Errores de conexión
    if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection')) {
      return 'Error de conexión con el servidor. Por favor, intenta nuevamente';
    }
    
    // Si el mensaje ya está en español o no coincide con ningún patrón, devolverlo tal cual
    return errorMessage;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgressOpen(true);
    setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [] });
    
    try {
      // Asegurar que los usuarios estén cargados antes de procesar
      if (users.length === 0) {
        await fetchUsers();
      }

      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      // Procesar cada fila y crear empresas
      const companiesToCreate = jsonData.map((row) => {
        const propietarioName = (row['Propietario'] || row['Asesor'] || '').toString().trim();
        const ownerId = propietarioName ? findUserByName(propietarioName) : null;

        const crValue = (row['C.R.'] || row['Cliente Recuperado'] || '').toString().trim().toLowerCase();
        const isRecoveredClient = crValue === 'sí' || crValue === 'si' || crValue === 'yes' || crValue === 'true' || crValue === '1' || crValue === 'x' || crValue === '✓';

        return {
          name: (row['Nombre'] || row['Contacto'] || '').toString().trim() || 'Sin nombre',
          domain: (row['Dominio'] || '').toString().trim() || undefined,
          companyname: (row['Razón social'] || '').toString().trim() || undefined,
          phone: (row['Teléfono'] || '').toString().trim() || undefined,
          email: (row['Correo'] || '').toString().trim() || undefined,
          leadSource: normalizeLeadSource((row['Origen de lead'] || '').toString()),
          ruc: (row['RUC'] || '').toString().trim() || undefined,
          address: (row['Dirección'] || '').toString().trim() || undefined,
          city: (row['Ciudad'] || '').toString().trim() || undefined,
          state: (row['Estado/Provincia'] || '').toString().trim() || undefined,
          country: (row['País'] || '').toString().trim() || undefined,
          lifecycleStage: (row['Etapa'] || 'lead').toString().trim() || 'lead',
          estimatedRevenue: (() => {
            const facturacionValue = row['Facturación'] || row['Potencial de Facturación Estimado'];
            return facturacionValue
              ? parseFloat(facturacionValue.toString().replace(/[^\d.-]/g, '')) || undefined
              : undefined;
          })(),
          isRecoveredClient: isRecoveredClient,
          ownerId: ownerId || undefined,
        };
      }).filter(company => company.name !== 'Sin nombre'); // Filtrar filas vacías

      // Inicializar el progreso total
      setImportProgress(prev => ({ ...prev, total: companiesToCreate.length }));

      // Crear empresas en el backend con progreso
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < companiesToCreate.length; i++) {
        const companyData = companiesToCreate[i];
        try {
          await api.post('/companies', companyData);
          successCount++;
          // Capturar valores actuales para evitar problemas de closure
          const currentSuccess = successCount;
          const currentErrors = errorCount;
          const currentIndex = i + 1;
          setImportProgress(prev => ({
            ...prev,
            current: currentIndex,
            total: companiesToCreate.length,
            success: currentSuccess,
            errors: currentErrors,
          }));
        } catch (error: any) {
          console.error('Error creating company:', error);
          
          // Verificar si es un error de empresa duplicada y tiene facturación para actualizar
          if (
            error.response?.status === 400 &&
            error.response?.data?.error === 'Ya existe una empresa con este nombre' &&
            error.response?.data?.existingCompanyId &&
            companyData.estimatedRevenue !== undefined &&
            companyData.estimatedRevenue !== null
          ) {
            // Si la empresa existe y tiene facturación, actualizar solo ese campo
            try {
              await api.put(`/companies/${error.response.data.existingCompanyId}`, {
                estimatedRevenue: companyData.estimatedRevenue,
              });
              successCount++;
              
              // Actualizar progreso como éxito
              const currentSuccess = successCount;
              const currentErrors = errorCount;
              const currentIndex = i + 1;
              setImportProgress(prev => ({
                ...prev,
                current: currentIndex,
                total: companiesToCreate.length,
                success: currentSuccess,
                errors: currentErrors,
              }));
              continue; // Continuar con la siguiente empresa
            } catch (updateError: any) {
              // Si falla la actualización, contar como error
              errorCount++;
              let updateErrorMessage = 'Error al actualizar facturación';
              if (updateError.response?.data?.error) {
                updateErrorMessage = updateError.response.data.error;
              }
              
              const currentSuccess = successCount;
              const currentErrors = errorCount;
              const currentIndex = i + 1;
              const companyName = companyData.name || companyData.companyname || 'Empresa sin nombre';
              
              setImportProgress(prev => ({
                ...prev,
                current: currentIndex,
                total: companiesToCreate.length,
                success: currentSuccess,
                errors: currentErrors,
                errorList: [...prev.errorList, { 
                  name: companyName, 
                  error: updateErrorMessage 
                }],
              }));
            }
          } else {
            // Manejo de error normal (empresa no existe o no tiene facturación)
            errorCount++;
            
            // Capturar el mensaje de error de diferentes fuentes
            let errorMessage = 'Error desconocido';
            
            if (error.response?.data?.error) {
              // Error del backend (ya viene en español normalmente)
              errorMessage = error.response.data.error;
            } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
              // Errores de validación de Sequelize (múltiples errores)
              errorMessage = error.errors.map((e: any) => translateError(e.message)).join(', ');
            } else if (error.message) {
              // Mensaje de error general - traducir
              errorMessage = translateError(error.message);
            } else if (error.original?.message) {
              // Error original de la base de datos - traducir
              errorMessage = translateError(error.original.message);
            }
            
            // Capturar valores actuales para evitar problemas de closure
            const currentSuccess = successCount;
            const currentErrors = errorCount;
            const currentIndex = i + 1;
            const companyName = companyData.name || companyData.companyname || 'Empresa sin nombre';
            
            setImportProgress(prev => ({
              ...prev,
              current: currentIndex,
              total: companiesToCreate.length,
              success: currentSuccess,
              errors: currentErrors,
              errorList: [...prev.errorList, { 
                name: companyName, 
                error: errorMessage 
              }],
            }));
          }
        }
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Recargar la lista de empresas
      fetchCompanies();
    } catch (error) {
      console.error('Error importing file:', error);
      setImportProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
    } finally {
      setImporting(false);
    }
  };

  const handleOpen = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        domain: company.domain || '',
        linkedin: (company as any).linkedin || '',
        companyname: company.companyname || '',
        phone: company.phone || '',
        email: (company as any).email || '',
        leadSource: (company as any).leadSource || '',
        lifecycleStage: company.lifecycleStage,
        estimatedRevenue: (company as any).estimatedRevenue || '',
        ruc: company.ruc || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        isRecoveredClient: (company as any).isRecoveredClient || false,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        domain: '',
        linkedin: '',
        companyname: '',
        phone: '',
        email: '',
        leadSource: '',
        lifecycleStage: 'lead',
        estimatedRevenue: '',
        ruc: '',
        address: '',
        city: '',
        state: '',
        country: '',
        isRecoveredClient: false,
      });
    }
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
    if (!formData.ruc || formData.ruc.length < 11) {
      setRucError('El RUC debe tener 11 dígitos');
      return;
    }

    setLoadingRuc(true);
    setRucError('');

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno
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
        
        // Actualizar el formulario con los datos obtenidos
        const updatedFormData = {
          ...formData,
          name: newName,
          companyname: data.tipo_contribuyente || '',
          address: data.direccion_completa || data.direccion || '',
          city: data.distrito || '',
          state: data.provincia || '',
          country: data.departamento || 'Perú',
        };
        setFormData(updatedFormData);

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
    
    // Limpiar timeouts pendientes
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }
  };

  const handleSubmit = async () => {
    // Validar antes de enviar
    if (nameError) {
      setErrorMessage('Por favor, corrige el error en el nombre antes de guardar.');
      return;
    }

    if (rucValidationError) {
      setErrorMessage('Por favor, corrige el error en el RUC antes de guardar.');
      return;
    }

    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, formData);
      } else {
        await api.post('/companies', formData);
      }
      handleClose();
      fetchCompanies();
    } catch (error: any) {
      console.error('Error saving company:', error);
      
      // Manejar error de empresa duplicada del servidor
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        const duplicateField = error.response.data.duplicateField;
        
        if (duplicateField === 'name') {
          setNameError(errorMessage);
          // El error ya se muestra en el campo, no necesitamos Snackbar adicional
        } else if (duplicateField === 'ruc') {
          setRucValidationError(errorMessage);
          // El error ya se muestra en el campo, no necesitamos Snackbar adicional
        } else {
          setErrorMessage(errorMessage);
        }
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

  const getStageColor = (stage: string) => {
    // Cierre ganado y etapas finales exitosas
    if (['cierre_ganado', 'firma_contrato', 'activo'].includes(stage)) {
      return { bg: '#E8F5E9', color: '#2E7D32' };
    }
    // Cierre perdido y clientes perdidos
    else if (stage === 'cierre_perdido' || stage === 'cliente_perdido') {
      return { bg: '#FFEBEE', color: '#C62828' };
    }
    // Negociación y reuniones
    else if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
      return { bg: '#FFF3E0', color: '#E65100' };
    }
    // Licitación - Color de texto púrpura oscuro
    else if (stage === 'licitacion_etapa_final' || stage === 'licitacion') {
      return { bg: '#F3E5F5', color: '#7B1FA2' };
    }
    // Lead y Contacto - Azul oscuro
    else if (['lead', 'contacto'].includes(stage)) {
      return { bg: '#E3F2FD', color: '#1976D2' };
    }
    // Lead inactivo - Gris oscuro
    else if (stage === 'lead_inactivo') {
      return { bg: theme.palette.action.hover, color: theme.palette.text.secondary };
    }
    // Por defecto
    return { bg: '#E3F2FD', color: '#1976D2' };
  };

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
      'cierre_perdido': 'Cierre Perdido',
      'firma_contrato': 'Firma de Contrato',
      'activo': 'Activo',
      'cliente_perdido': 'Cliente perdido',
      'lead_inactivo': 'Lead Inactivo',
    };
    return labels[stage] || stage;
  };

  const getStageLabelWithoutPercentage = (stage: string) => {
    return getStageLabel(stage).replace(/\s*\d+%/, '').trim();
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

  // Orden de las etapas según porcentaje
  const stageOrder = [
    'lead_inactivo', // -5%
    'cliente_perdido', // -1%
    'cierre_perdido', // -1%
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
  ];

  // Opciones de columnas disponibles
  const columnOptions = [
    { value: 'name', label: 'Nombre' },
    { value: 'companyname', label: 'Razón Social' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'email', label: 'Correo' },
    { value: 'leadSource', label: 'Origen de Lead' },
    { value: 'country', label: 'País' },
    { value: 'lifecycleStage', label: 'Etapa' },
    { value: 'owner', label: 'Propietario' },
  ];

  // Operadores disponibles
  const operatorOptions = [
    { value: 'contains', label: 'contiene' },
    { value: 'equals', label: 'es igual a' },
    { value: 'notEquals', label: 'no es igual a' },
    { value: 'startsWith', label: 'empieza con' },
    { value: 'endsWith', label: 'termina con' },
  ];

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
  }, [selectedStages, selectedCountries, selectedOwnerFilters, search, sortBy, filterRules, columnFilters]);

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
      minHeight: '100vh',
    }}>

      {/* Indicador de filtros por columna activos */}
      {Object.values(columnFilters).some(v => v) && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          mb: 1.5,
          alignItems: 'center',
          px: { xs: 1, sm: 2 },
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Filtros por columna:
          </Typography>
          {columnFilters.nombre && (
            <Chip
              size="small"
              label={`Nombre: "${columnFilters.nombre}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, nombre: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.propietario && (
            <Chip
              size="small"
              label={`Propietario: "${columnFilters.propietario}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, propietario: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.telefono && (
            <Chip
              size="small"
              label={`Teléfono: "${columnFilters.telefono}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, telefono: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.correo && (
            <Chip
              size="small"
              label={`Correo: "${columnFilters.correo}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, correo: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.origenLead && (
            <Chip
              size="small"
              label={`Origen Lead: "${columnFilters.origenLead}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, origenLead: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.etapa && (
            <Chip
              size="small"
              label={`Etapa: "${columnFilters.etapa}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, etapa: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.cr && (
            <Chip
              size="small"
              label={`C.R.: "${columnFilters.cr}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, cr: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          <Button
            size="small"
            onClick={() => setColumnFilters({ nombre: '', propietario: '', telefono: '', correo: '', origenLead: '', etapa: '', cr: '' })}
            sx={{ 
              fontSize: '0.7rem', 
              textTransform: 'none',
              color: theme.palette.error.main,
              minWidth: 'auto',
              p: 0.5,
            }}
          >
            Limpiar todos
          </Button>
        </Box>
      )}

      {/* Contenedor principal con layout flex para tabla y panel de filtros */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Contenido principal (tabla completa con header y filas) */}
        <UnifiedTable
          title="Empresas"
          actions={
            <>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    id="companies-sort-select"
                    name="companies-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: 1.5,
                      bgcolor: theme.palette.background.paper,
                      fontSize: '0.8125rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.text.secondary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                      },
                    }}
                  >
                    <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                    <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                    <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                    <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title={importing ? 'Importando...' : 'Importar'}>
                  <IconButton
                    size="small"
                    onClick={handleImportFromExcel}
                    disabled={importing}
                    sx={pageStyles.outlinedIconButton}
                  >
                    <UploadFile sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" style={{ display: 'none' }} />
                <Tooltip title="Exportar">
                  <IconButton
                    size="small"
                    onClick={handleExportToExcel}
                    sx={pageStyles.outlinedIconButton}
                  >
                    <FileDownload sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
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
                          column: 'name',
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
                <Tooltip title="Nueva Empresa">
                  <IconButton
                    size="small"
                    onClick={() => handleOpen()}
                    sx={{
                      bgcolor: taxiMonterricoColors.green,
                      color: 'white',
                      '&:hover': {
                        bgcolor: taxiMonterricoColors.greenDark,
                      },
                      borderRadius: 1.5,
                      p: 0.875,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                    }}
                  >
                    <Add sx={{ fontSize: 18 }} />
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
                  xs: 'repeat(10, minmax(0, 1fr))', 
                  md: '50px 2fr 1.3fr 1.3fr 1.1fr 1.4fr 1fr 1fr 1.6fr 100px' 
                },
                columnGap: { xs: 0.5, md: 1 },
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
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.25, md: 0.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>C.R.</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, cr: '' }))} sx={{ p: 0.25, opacity: columnFilters.cr ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar... (Sí/No)"
                  value={columnFilters.cr}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, cr: e.target.value }))}
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
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.5, md: 0.75 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Nombre de Empresa</Typography>
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
            <Box sx={{ 
              ...pageStyles.tableHeaderCell, 
              px: { xs: 0.5, md: 0.75 },
              justifyContent: 'flex-start',
              alignItems: 'center'
            }}>
                  Última Actividad
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.5, md: 0.75 } }}>
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
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.propietario}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, propietario: e.target.value }))}
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
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.5, md: 0.75 } }}>
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
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.5, md: 0.75 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
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
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.5, md: 0.75 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Origen de lead</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, origenLead: '' }))} sx={{ p: 0.25, opacity: columnFilters.origenLead ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.origenLead}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, origenLead: e.target.value }))}
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
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.5, px: { xs: 0.5, md: 0.75 } }}>
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
            <Box sx={{ 
              ...pageStyles.tableHeaderCell, 
              px: { xs: 0.5, md: 0.75 },
              justifyContent: 'flex-start',
              alignItems: 'center'
            }}>
                  Facturación
            </Box>
            <Box sx={{ 
              ...pageStyles.tableHeaderCell, 
              px: { xs: 0.5, md: 0.75 },
              justifyContent: 'flex-start',
              alignItems: 'center'
            }}>
                  Acciones
            </Box>
            </Box>
          }
          rows={
            <>
            {paginatedCompanies.map((company, index) => (
              <React.Fragment key={company.id}>
                <Box
                  component="div"
                  onClick={() => navigate(`/companies/${company.id}`)}
                  sx={{ 
                    bgcolor: theme.palette.background.paper,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'grid',
                    gridTemplateColumns: { 
                      xs: 'repeat(10, minmax(0, 1fr))', 
                      md: '50px 2fr 1.3fr 1.3fr 1.1fr 1.4fr 1fr 1fr 1.6fr 100px' 
                    },
                    columnGap: { xs: 0.5, md: 1 },
                    minWidth: { xs: 800, md: 'auto' },
                    maxWidth: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    px: { xs: 1.5, md: 2 },
                    py: { xs: 1.25, md: 1.5 },
                    borderBottom: index < paginatedCompanies.length - 1 || expandedCompanyId === company.id
                      ? (theme.palette.mode === 'light' 
                        ? '1px solid rgba(0, 0, 0, 0.08)' 
                        : '1px solid rgba(255, 255, 255, 0.1)')
                      : 'none',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : 'rgba(0, 0, 0, 0.02)',
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
                          bgcolor: (company as any).logo ? 'transparent' : '#0d9394',
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
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.8125rem', md: '0.875rem' },
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
                              color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                            fontSize: { xs: '0.6875rem', md: '0.75rem' },
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
                            fontSize: { xs: '0.6875rem', md: '0.75rem' },
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
                    <Typography
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '80px', md: '120px' },
                      }}
                      title={`${company.Owner.firstName} ${company.Owner.lastName}`}
                    >
                      {company.Owner.firstName} {company.Owner.lastName}
                    </Typography>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.disabled,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
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
                          color: theme.palette.text.primary,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
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
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
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
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
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
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                    <Chip
                    label={getStageLabel(company.lifecycleStage || 'lead')}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStatusMenuOpen(e, company.id);
                      }}
                      disabled={updatingStatus[company.id]}
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        height: { xs: 22, md: 24 },
                        cursor: 'pointer',
                        bgcolor: getStageColor(company.lifecycleStage || 'lead').bg,
                        color: getStageColor(company.lifecycleStage || 'lead').color,
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
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
                
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: company.estimatedRevenue 
                        ? (theme.palette.mode === 'dark' ? '#39ff14' : '#00a76f')
                        : theme.palette.text.primary,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
                      fontWeight: 500,
                    }}
                  >
                    {company.estimatedRevenue 
                      ? `S/ ${Number(company.estimatedRevenue).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '--'}
                  </Typography>
                </Box>
                
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
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
                          minWidth: 150,
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
                        <Edit sx={{ fontSize: '1.125rem', color: theme.palette.text.secondary }} />
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
                        <Visibility sx={{ fontSize: '1.125rem', color: theme.palette.text.secondary }} />
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
                          color: '#d32f2f',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : '#ffebee',
                          },
                        }}
                      >
                        <Delete sx={{ fontSize: '1.125rem' }} />
                        <Typography variant="body2">Eliminar</Typography>
                      </MenuItem>
                    </Menu>
                </Box>
            </Box>

                {/* Vista expandida */}
                {expandedCompanyId === company.id && (
                  <Box
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderTop: theme.palette.mode === 'light' 
                        ? '1px solid rgba(0, 0, 0, 0.08)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      p: 3,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 3,
                      overflow: 'visible',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                {/* Columna Izquierda - Card con información principal */}
                <Box sx={{ flex: { xs: '1', md: '0 0 300px' }, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
                  <Card
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                      minHeight: 'fit-content',
                      overflow: 'visible',
                    }}
                  >
                    {/* Avatar/Logo */}
                    <Avatar
                      src={(company as any).logo || undefined}
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: (company as any).logo ? 'transparent' : '#0d9394',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      {!(company as any).logo && <Building2 size={30} color="white" />}
                    </Avatar>

                    {/* Nombre */}
                    <Box sx={{ textAlign: 'center', width: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1.125rem' }}>
                        {company.name}
                      </Typography>
                      
                      {/* Botones de actividades */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                        <Tooltip title="Crear nota">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenNote(company.id);
                            }}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <Note sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hacer llamada">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCall(company.id);
                            }}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <Phone sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Crear tarea">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTask(company.id);
                            }}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <Assignment sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Programar reunión">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMeeting(company.id);
                            }}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <Event sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Divider */}
                    <Divider sx={{ width: '100%', my: 1 }} />

                    {/* Información de contacto */}
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(company as any).email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {(company as any).email}
                          </Typography>
                        </Box>
                      )}
                      {company.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {company.phone}
                          </Typography>
                        </Box>
                      )}
                      {(company.address || company.city || company.country) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {[company.address, company.city, company.country].filter(Boolean).join(', ') || '--'}
                          </Typography>
                        </Box>
                      )}
                      {company.domain && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const domainUrl = company.domain?.startsWith('http') ? company.domain : `https://${company.domain}`;
                              window.open(domainUrl, '_blank');
                            }}
                          >
                            {company.domain}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Box>

                {/* Columna Derecha - Contenido adicional (por ahora vacío) */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Contenido adicional se agregará después */}
                </Box>
              </Box>
            )}
          </React.Fragment>
          ))}
            </>
          }
          emptyState={
            paginatedCompanies.length === 0 ? (
              <Box sx={{ ...pageStyles.emptyState, m: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                    No hay empresas para mostrar
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Crea tu primera empresa para comenzar
                  </Typography>
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

        {/* Panel de Filtros Lateral */}
        {filterDrawerOpen && (
        <Box
          sx={{
            width: { xs: '100%', md: 400 },
            bgcolor: theme.palette.background.paper,
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
                  color: '#d32f2f',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 0.75,
                  py: 0.25,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
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
                            fontWeight: 500,
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
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: '0.625rem',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              {userItem.firstName?.[0]?.toUpperCase() || userItem.email?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
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
        submitLabel={editingCompany ? 'Actualizar' : 'Crear'}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Título de sección */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              Información Básica
            </Typography>
            {/* RUC */}
            <TextField
              label="RUC"
              value={formData.ruc}
              onChange={async (e) => {
                const value = e.target.value.replace(/\D/g, ''); // Solo números
                // Limitar a 11 dígitos
                const limitedValue = value.slice(0, 11);
                const currentName = formData.name; // Obtener el nombre actual del estado
                setFormData({ ...formData, ruc: limitedValue });
                setRucError('');
                
                // Si el RUC tiene exactamente 11 dígitos, validar inmediatamente
                if (limitedValue.length === 11) {
                  // NO limpiar el error aquí, dejar que la validación lo maneje
                  // Validar RUC inmediatamente sin esperar debounce
                  if (editingCompany && editingCompany.ruc === limitedValue.trim()) {
                    setRucValidationError('');
                  } else {
                    try {
                      const response = await api.get('/companies', {
                        params: { search: limitedValue.trim(), limit: 50 },
                      });
                      
                      const companies = response.data.companies || response.data || [];
                      // Buscar coincidencia exacta por RUC
                      const exactMatch = companies.find((c: Company) => c.ruc === limitedValue.trim());

                      if (exactMatch) {
                        setRucValidationError('Ya existe una empresa con este RUC');
                      } else {
                        setRucValidationError('');
                      }
                    } catch (error: any) {
                      console.error('Error validando RUC:', error);
                      setRucValidationError('');
                    }
                  }
                  
                  // Validar nombre con debounce si tiene contenido
                  if (currentName && currentName.trim() !== '') {
                    validateAllFields(currentName, limitedValue);
                  }
                } else {
                  // Si tiene menos de 11 dígitos, limpiar el error y usar validación normal
                  setRucValidationError('');
                  validateAllFields(currentName, limitedValue);
                }
              }}
              error={!!rucError || !!rucValidationError}
              helperText={rucError || rucValidationError}
              inputProps={{ maxLength: 11 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSearchRuc}
                      disabled={loadingRuc || !formData.ruc || formData.ruc.length < 11}
                      sx={{
                        color: taxiMonterricoColors.green,
                        '&:hover': {
                          bgcolor: `${taxiMonterricoColors.green}15`,
                        },
                        '&.Mui-disabled': {
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
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Razón social */}
            <TextField
              label="Razón social"
              value={formData.companyname}
              onChange={(e) => setFormData({ ...formData, companyname: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Nombre comercial */}
            <TextField
              label="Nombre comercial"
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                const currentRuc = formData.ruc; // Obtener el RUC actual del estado
                setFormData({ ...formData, name: newName });
                // Limpiar el error del nombre cuando el usuario empieza a escribir
                if (!newName.trim()) {
                  setNameError('');
                }
                // Validar ambos campos con los valores actuales
                validateAllFields(newName, currentRuc);
              }}
              error={!!nameError}
              helperText={nameError}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Teléfono */}
            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Dirección */}
            <TextField
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Distrito */}
            <TextField
              label="Distrito"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Provincia */}
            <TextField
              label="Provincia"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Departamento */}
            <TextField
              label="Departamento"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Título de sección */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 1, color: theme.palette.text.primary }}>
              Información Comercial
            </Typography>
            {/* Dominio */}
            <TextField
              label="Dominio"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* LinkedIn */}
            <TextField
              label="LinkedIn"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="https://www.linkedin.com/company/..."
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Correo */}
            <TextField
              label="Correo"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            {/* Origen de lead */}
            <TextField
              select
              label="Origen de lead"
              value={formData.leadSource || ''}
              onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              fullWidth
              SelectProps={{
                MenuProps: {
                  disableScrollLock: true,
                  disablePortal: true,
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      zIndex: '2000 !important',
                      position: 'absolute',
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              <MenuItem value="referido">Referido</MenuItem>
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="entorno">Entorno</MenuItem>
              <MenuItem value="feria">Feria</MenuItem>
              <MenuItem value="masivo">Masivo</MenuItem>
            </TextField>
            {/* Etapa del Ciclo de Vida */}
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
              fullWidth
              SelectProps={{
                MenuProps: {
                  disableScrollLock: true,
                  disablePortal: true,
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      zIndex: '2000 !important',
                      position: 'absolute',
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
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
              <MenuItem value="propuesta_economica">Propuesta Económica</MenuItem>
              <MenuItem value="negociacion">Negociación</MenuItem>
              <MenuItem value="licitacion">Licitación</MenuItem>
              <MenuItem value="licitacion_etapa_final">Licitación Etapa Final</MenuItem>
              <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
              <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
              <MenuItem value="activo">Activo</MenuItem>
            </TextField>
            {/* Facturación */}
            <TextField
              fullWidth
              type="number"
              label="Facturación"
              value={formData.estimatedRevenue}
              onChange={(e) => setFormData({ ...formData, estimatedRevenue: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">S/</InputAdornment>,
              }}
            />
            {/* Cliente Recuperado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={formData.isRecoveredClient}
                onChange={(e) => setFormData({ ...formData, isRecoveredClient: e.target.checked })}
                sx={{
                  color: taxiMonterricoColors.green,
                  '&.Mui-checked': {
                    color: taxiMonterricoColors.green,
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                Cliente Recuperado
              </Typography>
            </Box>
            
        </Box>
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
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <Delete />}
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
            setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [] });
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
                  Procesando {importProgress.current} de {importProgress.total} empresas...
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                    ✓ Exitosos: {importProgress.success}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                    ✗ Errores: {importProgress.errors}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {importProgress.success > 0 || importProgress.errors > 0
                    ? `Importación completada`
                    : 'Error al procesar el archivo'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                    ✓ {importProgress.success} empresas creadas exitosamente
                  </Typography>
                  {importProgress.errors > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.error.main, mb: 1 }}>
                        ✗ {importProgress.errors} empresas con errores:
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
        <DialogActions>
          {!importing && (
            <Button 
              onClick={() => {
                setImportProgressOpen(false);
                setImportProgress({ current: 0, total: 0, success: 0, errors: 0, errorList: [] });
              }}
              variant="contained"
              sx={{
                bgcolor: taxiMonterricoColors.green,
                '&:hover': {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
              }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
                value={filterRules.length > 0 ? filterRules[filterRules.length - 1]?.column || 'name' : 'name'}
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
                      column: 'name',
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
                    column: 'name',
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
                    column: 'name',
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
              backgroundColor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
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
                  backgroundColor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
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
              backgroundColor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper, 
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
                        backgroundColor: activeFormats.bold ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
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
                        backgroundColor: activeFormats.italic ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
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
                        backgroundColor: activeFormats.underline ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
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
                        backgroundColor: activeFormats.strikeThrough ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
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
                        backgroundColor: activeFormats.unorderedList ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
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
                        backgroundColor: activeFormats.orderedList ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0') : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
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
            <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5, gap: 0.75 }}>
              <Button 
                onClick={() => setTaskOpen(false)} 
                size="small"
                sx={{ 
                  textTransform: 'none',
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  }
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveTask} 
                variant="contained" 
                size="small"
                disabled={savingActivity || !taskData.title.trim()}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  bgcolor: taskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
                  color: 'white',
                  '&:hover': {
                    bgcolor: taskData.title.trim() ? taxiMonterricoColors.green : theme.palette.action.disabledBackground,
                    opacity: 0.9,
                  },
                  '&:disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: 'none',
                  }
                }}
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





