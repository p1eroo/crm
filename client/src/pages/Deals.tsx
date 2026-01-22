import React, { useEffect, useState, useCallback } from 'react';
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
  Card,
  CardContent,
  Divider,
  Avatar,
  FormControl,
  Select,
  Tooltip,
  Menu,
  useTheme,
  Collapse,
  Popover,
} from '@mui/material';
import { Add, Delete, AttachMoney, Visibility, ViewList, AccountTree, CalendarToday, Close, FileDownload, UploadFile, FilterList, ExpandMore, Remove, Bolt, Business, Edit, ChevronLeft, ChevronRight, ViewColumn } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { UnifiedTable, DEFAULT_ITEMS_PER_PAGE } from '../components/UnifiedTable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";
import EntityPreviewDrawer from '../components/EntityPreviewDrawer';

interface Deal {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  priority?: 'baja' | 'media' | 'alta';
  companyId?: number;
  contactId?: number;
  Contact?: { firstName: string; lastName: string };
  Company?: { name: string };
  Owner?: { id: number; firstName: string; lastName: string; email?: string };
}

const Deals: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [search] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    stage: 'lead',
    closeDate: '',
    priority: 'baja' as 'baja' | 'media' | 'alta',
    companyId: '',
    contactId: '',
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stageMenuAnchor, setStageMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStage, setUpdatingStage] = useState<{ [key: number]: boolean }>({});
  const [viewMode, setViewMode] = useState<'list' | 'funnel'>('list'); // Modo de vista: lista o funnel
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedOwnerFilters, setSelectedOwnerFilters] = useState<(string | number)[]>([]);
  const [stagesExpanded, setStagesExpanded] = useState(false);
  const [ownerFilterExpanded, setOwnerFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalDeals, setTotalDeals] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Estados para drag and drop
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
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
    monto: string;
    etapa: string;
    contacto: string;
    empresa: string;
  }>({
    nombre: '',
    monto: '',
    etapa: '',
    contacto: '',
    empresa: '',
  });
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDeal, setPreviewDeal] = useState<Deal | null>(null);
  
  // Etapas del pipeline
  const stages = [
    { id: 'lead_inactivo', label: 'Lead Inactivo', color: '#9E9E9E' },
    { id: 'lead', label: 'Lead', color: '#2196F3' },
    { id: 'contacto', label: 'Contacto', color: '#42A5F5' },
    { id: 'reunion_agendada', label: 'Reunión Agendada', color: '#66BB6A' },
    { id: 'reunion_efectiva', label: 'Reunión Efectiva', color: '#81C784' },
    { id: 'propuesta_economica', label: 'Propuesta Económica', color: '#FFB74D' },
    { id: 'negociacion', label: 'Negociación', color: '#FF9800' },
    { id: 'licitacion', label: 'Licitación', color: '#F57C00' },
    { id: 'licitacion_etapa_final', label: 'Licitación Etapa Final', color: '#E65100' },
    { id: 'cierre_ganado', label: 'Cierre Ganado', color: '#4CAF50' },
    { id: 'firma_contrato', label: 'Firma de Contrato', color: '#388E3C' },
    { id: 'activo', label: 'Activo', color: '#2E7D32' },
    { id: 'cliente_perdido', label: 'Cliente Perdido', color: '#F44336' },
    { id: 'cierre_perdido', label: 'Cierre Perdido', color: '#D32F2F' },
  ];

  // Función helper para convertir amount a número de forma segura
  const parseAmount = (amount: any): number => {
    if (amount === null || amount === undefined || amount === '') return 0;
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? 0 : num;
  };

  // Función helper para formatear valores monetarios
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return millions % 1 === 0 ? `S/ ${millions.toFixed(0)}M` : `S/ ${millions.toFixed(1)}M`;
    } else if (value >= 1000) {
      const thousands = value / 1000;
      return thousands % 1 === 0 ? `S/ ${thousands.toFixed(0)}k` : `S/ ${thousands.toFixed(1)}k`;
    }
    return `S/ ${value.toFixed(0)}`;
  };

  // Opciones de etapa según las imágenes proporcionadas
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

  // Función para obtener el label de la etapa
  const getStageLabel = (stage: string) => {
    const option = stageOptions.find(opt => opt.value === stage);
    return option ? option.label : stage;
  };

  // Calcular paginación desde el servidor
  const totalPages = Math.ceil(totalDeals / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalDeals);

  // Resetear a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStages, selectedOwnerFilters, search, sortBy, filterRules, debouncedColumnFilters]);


  // Función para obtener iniciales
  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (typeof firstName === 'string' && !lastName) {
      // Si solo se pasa un string (nombre del deal)
      const words = firstName.trim().split(' ');
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      }
      return firstName.substring(0, 2).toUpperCase();
    }
    return '--';
  };

  // Función para vista previa
  const handlePreview = (deal: Deal) => {
    setPreviewDeal(deal);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDeal(null);
  };

  // Opciones de columnas disponibles
  const columnOptions = [
    { value: 'name', label: 'Nombre' },
    { value: 'amount', label: 'Monto' },
    { value: 'stage', label: 'Etapa' },
    { value: 'contact', label: 'Contacto' },
    { value: 'company', label: 'Empresa' },
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

  // Función para obtener el color de la etapa (para el texto del chip)
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

  // Función para obtener el color de fondo de la card según la etapa
  const getStageCardColor = (stage: string) => {
    // Cierre ganado y etapas finales exitosas
    if (['cierre_ganado', 'firma_contrato', 'activo'].includes(stage)) {
      return theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9';
    }
    // Cierre perdido y clientes perdidos
    else if (stage === 'cierre_perdido' || stage === 'cliente_perdido') {
      return theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE';
    }
    // Negociación y reuniones
    else if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
      return theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : '#FFF3E0';
    }
    // Licitación - Color distintivo (púrpura claro)
    else if (stage === 'licitacion_etapa_final' || stage === 'licitacion') {
      return theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.15)' : '#F3E5F5';
    }
    // Lead y Contacto - Azul claro
    else if (['lead', 'contacto'].includes(stage)) {
      return theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : '#E3F2FD';
    }
    // Lead inactivo
    else if (stage === 'lead_inactivo') {
      return theme.palette.action.hover;
    }
    // Por defecto
    return theme.palette.background.paper;
  };

  // Debounce para filtros de columna (esperar 500ms después de que el usuario deje de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 500);

    return () => clearTimeout(timer);
  }, [columnFilters]);

  const fetchDeals = useCallback(async () => {
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
      if (debouncedColumnFilters.contacto) params.filterContacto = debouncedColumnFilters.contacto;
      if (debouncedColumnFilters.empresa) params.filterEmpresa = debouncedColumnFilters.empresa;
      if (debouncedColumnFilters.etapa) params.filterEtapa = debouncedColumnFilters.etapa;
      
      // Filtros avanzados
      if (filterRules.length > 0) {
        params.filterRules = JSON.stringify(filterRules);
      }
      
      const response = await api.get('/deals', { params });
      const dealsData = response.data.deals || response.data || [];
      
      setDeals(dealsData);
      setTotalDeals(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      setDeals([]);
      setTotalDeals(0);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage, selectedStages, selectedOwnerFilters, sortBy, filterRules, debouncedColumnFilters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Realizar peticiones en paralelo con cancelación
        const [companiesRes, contactsRes, usersRes] = await Promise.all([
          api.get('/companies', { 
            params: { limit: 1000 },
            signal: abortController.signal 
          }),
          api.get('/contacts', { 
            params: { limit: 1000 },
            signal: abortController.signal 
          }),
          api.get('/users', { 
            signal: abortController.signal 
          })
        ]);

        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          setCompanies(companiesRes.data.companies || companiesRes.data || []);
          setContacts(contactsRes.data.contacts || contactsRes.data || []);
          setUsers(usersRes.data || []);
        }
      } catch (error: any) {
        // Ignorar errores de cancelación
        if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        if (isMounted) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();

    // Cleanup: cancelar peticiones al desmontar
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []); // Solo cargar datos una vez al montar el componente


  const handleExportToExcel = () => {
    const exportData = deals.map((deal) => ({
      'Nombre': deal.name || '--',
      'Monto': deal.amount ? `S/ ${deal.amount.toLocaleString()}` : '--',
      'Etapa': getStageLabel(deal.stage) || '--',
      'Probabilidad': deal.probability ? `${deal.probability}%` : '--',
      'Contacto': deal.Contact ? `${deal.Contact.firstName} ${deal.Contact.lastName}` : '--',
      'Empresa': deal.Company?.name || '--',
      'Propietario': deal.Owner ? `${deal.Owner.firstName} ${deal.Owner.lastName}` : '--',
      'Fecha de Cierre': deal.closeDate ? new Date(deal.closeDate).toLocaleDateString('es-ES') : '--',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 15 }, // Monto
      { wch: 20 }, // Etapa
      { wch: 12 }, // Probabilidad
      { wch: 25 }, // Contacto
      { wch: 25 }, // Empresa
      { wch: 20 }, // Propietario
      { wch: 18 }, // Fecha de Cierre
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Negocios');

    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Negocios_${fecha}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      for (const row of jsonData as any[]) {
        const dealData: any = {
          name: row['Nombre'] || '',
          amount: parseFloat(String(row['Monto'] || '0').replace(/[^0-9.-]/g, '')) || 0,
          stage: row['Etapa'] || 'lead',
          probability: row['Probabilidad'] ? parseInt(String(row['Probabilidad']).replace('%', '')) : null,
          closeDate: row['Fecha de Cierre'] ? new Date(row['Fecha de Cierre']).toISOString() : null,
        };

        if (dealData.name) {
          await api.post('/deals', dealData);
        }
      }

      fetchDeals();
      alert('Negocios importados correctamente');
    } catch (error) {
      console.error('Error importing deals:', error);
      alert('Error al importar negocios. Por favor, verifica el formato del archivo.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpen = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        name: deal.name,
        amount: deal.amount.toString(),
        stage: deal.stage,
        closeDate: deal.closeDate ? deal.closeDate.split('T')[0] : '',
        priority: deal.priority || 'baja',
        companyId: deal.companyId?.toString() || '',
        contactId: deal.contactId?.toString() || '',
      });
    } else {
      setEditingDeal(null);
      setFormData({
        name: '',
        amount: '',
        stage: 'lead',
        closeDate: '',
        priority: 'baja' as 'baja' | 'media' | 'alta',
        companyId: '',
        contactId: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDeal(null);
  };

  // Handlers memoizados para evitar re-renders innecesarios
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, amount: e.target.value }));
  }, []);

  const handleStageFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, stage: e.target.value }));
  }, []);

  const handleCloseDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, closeDate: e.target.value }));
  }, []);

  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, priority: e.target.value as 'baja' | 'media' | 'alta' }));
  }, []);

  const handleCompanyIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, companyId: e.target.value }));
  }, []);

  const handleContactIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, contactId: e.target.value }));
  }, []);

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        priority: formData.priority,
        companyId: formData.companyId ? parseInt(formData.companyId) : null,
        contactId: formData.contactId ? parseInt(formData.contactId) : null,
      };
      if (editingDeal) {
        await api.put(`/deals/${editingDeal.id}`, data);
      } else {
        await api.post('/deals', data);
      }
      handleClose();
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDelete = (id: number) => {
    setDealToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/deals/${dealToDelete}`);
      fetchDeals();
      setDeleteDialogOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert('Error al eliminar el negocio. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDealToDelete(null);
  };

  const handleStageMenuOpen = (event: React.MouseEvent<HTMLElement>, dealId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStageMenuAnchor({ ...stageMenuAnchor, [dealId]: event.currentTarget });
  };

  const handleStageMenuClose = (dealId: number) => {
    setStageMenuAnchor({ ...stageMenuAnchor, [dealId]: null });
  };

  const handleStageChange = async (event: React.MouseEvent<HTMLElement>, dealId: number, newStage: string) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStage({ ...updatingStage, [dealId]: true });
    try {
      await api.put(`/deals/${dealId}`, { stage: newStage });
      // Actualizar el deal en la lista
      setDeals(deals.map(deal => 
        deal.id === dealId 
          ? { ...deal, stage: newStage }
          : deal
      ));
      handleStageMenuClose(dealId);
    } catch (error) {
      console.error('Error updating deal stage:', error);
      alert('Error al actualizar la etapa. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStage({ ...updatingStage, [dealId]: false });
    }
  };

  // Función para cambiar etapa sin evento (para drag and drop)
  const handleStageChangeDirect = async (dealId: number, newStage: string) => {
    setUpdatingStage({ ...updatingStage, [dealId]: true });
    try {
      await api.put(`/deals/${dealId}`, { stage: newStage });
      setDeals(deals.map(deal => 
        deal.id === dealId 
          ? { ...deal, stage: newStage }
          : deal
      ));
    } catch (error) {
      console.error('Error updating stage:', error);
      fetchDeals();
    } finally {
      setUpdatingStage({ ...updatingStage, [dealId]: false });
    }
  };

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', deal.id.toString());
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setTimeout(() => {
      setIsDragging(false);
      setDraggedDeal(null);
      setDragOverStage(null);
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedDeal) return;

    if (draggedDeal.stage !== stageId) {
      await handleStageChangeDirect(draggedDeal.id, stageId);
    }

    setTimeout(() => {
      setDraggedDeal(null);
      setIsDragging(false);
    }, 150);
  };

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
      width: '100%',
      maxWidth: '100%',
        overflow: 'hidden',
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
          {columnFilters.monto && (
            <Chip
              size="small"
              label={`Monto: "${columnFilters.monto}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, monto: '' }))}
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
          {columnFilters.contacto && (
            <Chip
              size="small"
              label={`Contacto: "${columnFilters.contacto}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, contacto: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          {columnFilters.empresa && (
            <Chip
              size="small"
              label={`Empresa: "${columnFilters.empresa}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, empresa: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          <Button
            size="small"
            onClick={() => setColumnFilters({ nombre: '', monto: '', etapa: '', contacto: '', empresa: '' })}
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

      {/* Barra de herramientas compartida - se muestra siempre */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          p: 2,
          mb: 0,
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.mode === 'dark' ? '#10B981' : '#2E7D32'} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Negocios
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: "100%", sm: 130 },
              order: { xs: 1, sm: 0 },
            }}
          >
            <Select
              id="deals-sort-select"
              name="deals-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: 1.5,
                bgcolor: theme.palette.background.paper,
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                border: `1.5px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                "& .MuiOutlinedInput-notchedOutline": {
                  border: 'none',
                },
                "&:hover": {
                  borderColor: taxiMonterricoColors.green,
                  boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                },
                "&.Mui-focused": {
                  borderColor: taxiMonterricoColors.green,
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                },
              }}
            >
              <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
              <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
              <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
              <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
            </Select>
          </FormControl>
          
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, sm: 0.75 },
              order: { xs: 3, sm: 0 },
            }}
          >
            <Tooltip title={importing ? 'Importando...' : 'Importar'} arrow>
              <IconButton
                size="small"
                onClick={handleImportFromExcel}
                disabled={importing}
                sx={{
                  border: `1.5px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  color: theme.palette.text.secondary,
                  p: { xs: 0.75, sm: 0.875 },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(16, 185, 129, 0.05)',
                    color: taxiMonterricoColors.green,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <UploadFile sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" style={{ display: 'none' }} />
            
            <Tooltip title="Exportar" arrow>
              <IconButton
                size="small"
                onClick={handleExportToExcel}
                sx={{
                  border: `1.5px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  color: theme.palette.text.secondary,
                  p: { xs: 0.75, sm: 0.875 },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(16, 185, 129, 0.05)',
                    color: taxiMonterricoColors.green,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
                  },
                }}
              >
                <FileDownload sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Tooltip title={showColumnFilters ? "Ocultar filtros por columna" : "Mostrar filtros por columna"} arrow>
            <IconButton
              size="small"
              onClick={() => setShowColumnFilters(!showColumnFilters)}
              sx={{
                border: `1.5px solid ${showColumnFilters ? taxiMonterricoColors.green : theme.palette.divider}`,
                borderRadius: 1.5,
                bgcolor: showColumnFilters 
                  ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)')
                  : 'transparent',
                color: showColumnFilters ? taxiMonterricoColors.green : theme.palette.text.secondary,
                p: { xs: 0.75, sm: 0.875 },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                order: { xs: 5, sm: 0 },
                '&:hover': {
                  borderColor: taxiMonterricoColors.green,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(16, 185, 129, 0.1)',
                  color: taxiMonterricoColors.green,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
                },
              }}
            >
              <ViewColumn sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Filtros avanzados" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                setFilterAnchorEl(e.currentTarget);
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
                border: `1.5px solid ${filterRules.length > 0 ? taxiMonterricoColors.green : theme.palette.divider}`,
                borderRadius: 1.5,
                bgcolor: filterRules.length > 0 
                  ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)')
                  : 'transparent',
                color: filterRules.length > 0 ? taxiMonterricoColors.green : theme.palette.text.secondary,
                p: { xs: 0.75, sm: 0.875 },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                order: { xs: 4, sm: 0 },
                '&::after': filterRules.length > 0 ? {
                  content: '""',
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: taxiMonterricoColors.green,
                  boxShadow: `0 0 8px ${taxiMonterricoColors.green}`,
                } : {},
                '&:hover': {
                  borderColor: taxiMonterricoColors.green,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(16, 185, 129, 0.1)',
                  color: taxiMonterricoColors.green,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
                },
              }}
            >
              <FilterList sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center',
            order: { xs: 6, sm: 0 },
          }}>
            <Tooltip title="Ver lista" arrow>
              <IconButton
                onClick={() => setViewMode('list')}
                sx={{
                  bgcolor: viewMode === 'list' 
                    ? `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`
                    : theme.palette.background.paper,
                  color: viewMode === 'list' ? 'white' : theme.palette.text.secondary,
                  borderRadius: 1.5,
                  p: { xs: 0.75, sm: 0.875 },
                  border: `1.5px solid ${viewMode === 'list' ? 'transparent' : theme.palette.divider}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: viewMode === 'list' ? `0 4px 12px ${taxiMonterricoColors.green}30` : 'none',
                  '&:hover': {
                    bgcolor: viewMode === 'list' 
                      ? `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`
                      : theme.palette.action.hover,
                    transform: 'translateY(-2px)',
                    boxShadow: viewMode === 'list' 
                      ? `0 6px 20px ${taxiMonterricoColors.green}40`
                      : `0 4px 12px ${taxiMonterricoColors.green}20`,
                  },
                }}
              >
                <ViewList sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver funnel" arrow>
              <IconButton
                onClick={() => setViewMode('funnel')}
                sx={{
                  bgcolor: viewMode === 'funnel' 
                    ? `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`
                    : theme.palette.background.paper,
                  color: viewMode === 'funnel' ? 'white' : theme.palette.text.secondary,
                  borderRadius: 1.5,
                  p: { xs: 0.75, sm: 0.875 },
                  border: `1.5px solid ${viewMode === 'funnel' ? 'transparent' : theme.palette.divider}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: viewMode === 'funnel' ? `0 4px 12px ${taxiMonterricoColors.green}30` : 'none',
                  '&:hover': {
                    bgcolor: viewMode === 'funnel' 
                      ? `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`
                      : theme.palette.action.hover,
                    transform: 'translateY(-2px)',
                    boxShadow: viewMode === 'funnel' 
                      ? `0 6px 20px ${taxiMonterricoColors.green}40`
                      : `0 4px 12px ${taxiMonterricoColors.green}20`,
                  },
                }}
              >
                <AccountTree sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Tooltip title="Nuevo Negocio" arrow>
            <IconButton
              size="small"
              onClick={() => handleOpen()}
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                color: "white",
                borderRadius: 1.5,
                p: { xs: 0.75, sm: 0.875 },
                boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                order: { xs: 2, sm: 0 },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: `0 8px 20px ${taxiMonterricoColors.green}50`,
                  background: `linear-gradient(135deg, ${taxiMonterricoColors.greenLight} 0%, ${taxiMonterricoColors.green} 100%)`,
                  '&::before': {
                    left: '100%',
                  },
                },
                '&:active': {
                  transform: 'translateY(0) scale(1)',
                },
              }}
            >
              <Add sx={{ fontSize: { xs: 16, sm: 18 } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Contenedor principal con layout flex para tabla y panel de filtros */}
      {viewMode === 'list' && (
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Contenido principal usando UnifiedTable */}
        <UnifiedTable
          title=""
          actions={null}
          header={
            <Box
              component="div"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(16, 185, 129, 0.02)'
                  : 'rgba(16, 185, 129, 0.01)',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(6, minmax(0, 1fr))', md: '1.5fr 0.9fr 1fr 0.8fr 1fr 0.7fr' },
                columnGap: { xs: 1, md: 1.5 },
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
                  opacity: 0.3,
                },
                minWidth: { xs: 800, md: 'auto' },
                maxWidth: '100%',
                width: '100%',
                px: { xs: 1, md: 1.5 },
                py: { xs: 1.5, md: 2 },
                borderBottom: `2px solid ${theme.palette.divider}`,
              }}
            >
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Nombre del Negocio</Typography>
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
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Monto</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, monto: '' }))} sx={{ p: 0.25, opacity: columnFilters.monto ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.monto}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, monto: e.target.value }))}
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
            <Box sx={{ ...pageStyles.tableHeaderCell, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>Contacto</Typography>
                {showColumnFilters && (
                  <IconButton size="small" onClick={() => setColumnFilters(prev => ({ ...prev, contacto: '' }))} sx={{ p: 0.25, opacity: columnFilters.contacto ? 1 : 0.3 }}>
                    <FilterList sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              {showColumnFilters && (
                <TextField
                  size="small"
                  placeholder="Filtrar..."
                  value={columnFilters.contacto}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, contacto: e.target.value }))}
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
            <Box sx={{ 
              ...pageStyles.tableHeaderCell, 
              px: { xs: 0.75, md: 1 },
              justifyContent: 'flex-start'
            }}>
                  Acciones
            </Box>
          </Box>
          }
          rows={
            <>
            {deals.map((deal, index) => (
              <Box
                  key={deal.id}
                component="div"
                onClick={() => navigate(`/deals/${deal.id}`)}
                  sx={{ 
                  bgcolor: getStageCardColor(deal.stage),
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(6, minmax(0, 1fr))', md: '1.5fr 0.9fr 1fr 0.8fr 1fr 0.7fr' },
                  columnGap: { xs: 1, md: 1.5 },
                  minWidth: { xs: 800, md: 'auto' },
                  maxWidth: '100%',
                  width: '100%',
                  borderRadius: 0,
                  border: 'none',
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                  px: { xs: 1, md: 1.5 },
                  py: { xs: 0.5, md: 0.75 },
                  borderBottom: index < deals.length - 1
                    ? (theme.palette.mode === 'light' 
                      ? '1px solid rgba(0, 0, 0, 0.08)' 
                      : '1px solid rgba(255, 255, 255, 0.1)')
                    : 'none',
                  '&:hover': {
                    bgcolor: getStageCardColor(deal.stage),
                    opacity: 0.9,
                  },
                }}
              >
                <Box sx={{ py: { xs: 0.5, md: 0.75 }, px: { xs: 0.75, md: 1 }, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, width: '100%' }}>
                      <Avatar
                        src={(deal as any).logo || undefined}
                        sx={{
                          width: { xs: 32, md: 40 },
                          height: { xs: 32, md: 40 },
                          bgcolor: (deal as any).logo ? 'transparent' : '#0d9394',
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 600,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          flexShrink: 0,
                        }}
                      >
                        {!(deal as any).logo && <FontAwesomeIcon icon={faHandshake} style={{ fontSize: 20, color: 'white' }} />}
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
                          maxWidth: { xs: '150px', md: '200px' },
                        }}
                        title={deal.name}
                      >
                        {deal.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {deal.priority && (
                          <>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: deal.priority === 'baja' ? '#20B2AA' : deal.priority === 'media' ? '#F59E0B' : '#EF4444',
                                flexShrink: 0,
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.6875rem', md: '0.75rem' },
                                textTransform: 'capitalize',
                              }}
                            >
                              {deal.priority}
                            </Typography>
                          </>
                        )}
                        {!deal.priority && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.6875rem', md: '0.75rem' },
                            }}
                          >
                            --
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 0.5, md: 0.75 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        fontWeight: 500,
                      }}
                    >
                    S/ {deal.amount.toLocaleString()}
                    </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                    <Chip
                      label={getStageLabel(deal.stage)}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStageMenuOpen(e, deal.id);
                      }}
                      disabled={updatingStage[deal.id]}
                      sx={{ 
                        fontWeight: 500,
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
                      height: { xs: 22, md: 24 },
                      cursor: 'pointer',
                        bgcolor: getStageCardColor(deal.stage),
                        color: getStageColor(deal.stage).color,
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                    <Menu
                      anchorEl={stageMenuAnchor[deal.id]}
                      open={Boolean(stageMenuAnchor[deal.id])}
                    onClose={(e, reason) => {
                        if (e && 'stopPropagation' in e) {
                          (e as React.MouseEvent).stopPropagation();
                        }
                        handleStageMenuClose(deal.id);
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
                          onClick={(e) => handleStageChange(e, deal.id, option.value)}
                          disabled={updatingStage[deal.id] || deal.stage === option.value}
                        selected={deal.stage === option.value}
                          sx={{
                            fontSize: '0.875rem',
                          color: theme.palette.text.primary,
                            '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                          '&.Mui-selected': {
                            bgcolor: theme.palette.action.selected,
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                          },
                          }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Menu>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                    {deal.Contact ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        }}
                      >
                        {deal.Contact.firstName} {deal.Contact.lastName}
                      </Typography>
                    ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.8125rem' }, fontWeight: 400 }}>
                        --
                      </Typography>
                    )}
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                    {deal.Company?.name ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        }}
                      >
                        {deal.Company.name}
                      </Typography>
                    ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.8125rem' }, fontWeight: 400 }}>
                        --
                      </Typography>
                    )}
                      </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 0.5, md: 0.75 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(deal);
                          }}
                          sx={pageStyles.previewIconButton}
                        >
                          <Edit sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Vista previa">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(deal);
                          }}
                          sx={pageStyles.previewIconButton}
                        >
                          <Visibility sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deal.id);
                          }}
                          sx={pageStyles.deleteIcon}
                        >
                          <Delete sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                </Box>
              </Box>
            ))}
            </>
          }
          pagination={
            totalDeals > 0 ? (
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
                        borderColor: theme.palette.divider,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.text.secondary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {startIndex + 1}-{endIndex} de {totalDeals}
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
            ) : null
          }
          emptyState={
            deals.length === 0 ? (
              <Box sx={pageStyles.emptyState}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                    }}
                  >
                    <AttachMoney
                      sx={{
                        fontSize: 56,
                        color: theme.palette.text.secondary,
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: theme.palette.text.primary,
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                      }}
                    >
                      No hay negocios para mostrar
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      }}
                    >
                      Crea tu primer negocio para comenzar a gestionar tus oportunidades de venta de manera eficiente.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : null
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
                      {stageOptions.map((option) => {
                        const stageColor = getStageColor(option.value);
                        const isSelected = selectedStages.includes(option.value);

                        return (
                          <Chip
                            key={option.value}
                            label={option.label}
                            size="small"
                            color={isSelected ? (stageColor.bg === '#E8F5E9' ? 'success' : stageColor.bg === '#FFEBEE' ? 'error' : 'warning') : undefined}
                            variant={isSelected ? 'filled' : 'outlined'}
                            onClick={() => {
                              setSelectedStages((prev) =>
                                prev.includes(option.value) ? prev.filter((s) => s !== option.value) : [...prev, option.value]
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
                              '&:hover': {
                                opacity: 1,
                                transform: 'scale(1.02)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </Collapse>
                <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
              </Box>

              {/* Sección Propietario del Registro */}
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
                                src={userItem.avatar}
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
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </Collapse>
                <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      )}

        {/* Vista de Pipeline/Funnel */}
        {viewMode === 'funnel' && (
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              position: 'relative',
              height: 'calc(100vh - 300px)',
              maxHeight: 'calc(100vh - 300px)',
            }}
          >
              <Box
                className="pipeline-scroll-container"
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  overflowX: 'scroll',
                  overflowY: 'hidden',
                  pb: 3,
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${theme.palette.mode === 'dark' ? '#757575' : '#9e9e9e'} ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  WebkitOverflowScrolling: 'touch',
                  // Estilos para la barra de desplazamiento horizontal - siempre visible
                  '&::-webkit-scrollbar': {
                    height: 16,
                    display: 'block !important',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 8,
                    marginTop: 1,
                    marginBottom: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.palette.mode === 'dark' ? '#9e9e9e' : '#757575',
                    borderRadius: 8,
                    border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                    minHeight: 24,
                    '&:hover': {
                      background: theme.palette.mode === 'dark' ? '#bdbdbd' : '#9e9e9e',
                    },
                  },
                  '&::-webkit-scrollbar-corner': {
                    background: 'transparent',
                  },
                  // Forzar visibilidad en Firefox
                  scrollbarGutter: 'stable',
                }}
              >
            {stages.map((stage) => {
              const stageDeals = deals.filter((deal) => deal.stage === stage.id);
              const stageTotal = stageDeals.reduce((sum, deal) => sum + (parseAmount(deal.amount) || 0), 0);
              const dealsCount = stageDeals.length;

              return (
                <Box
                  key={stage.id}
                  sx={{
                    minWidth: 300,
                    maxWidth: 300,
                    width: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 300px)',
                    maxHeight: 'calc(100vh - 300px)',
                    overflow: 'hidden',
                    borderRadius: 2,
                    bgcolor: getStageCardColor(stage.id),
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 2px 8px rgba(0,0,0,0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Stage Header */}
                  <Box
                    sx={{
                      bgcolor: 'transparent',
                      borderRadius: '8px 8px 0 0',
                      p: 1.5,
                      mb: 0,
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: stage.color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          sx={{ 
                            color: theme.palette.text.primary,
                            fontSize: '0.875rem',
                          }}
                        >
                          {stage.label}
                        </Typography>
                      </Box>
                      <Chip
                        label={dealsCount}
                        size="small"
                        sx={{
                          bgcolor: stage.color,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 20,
                          minWidth: 24,
                          '& .MuiChip-label': {
                            px: 0.75,
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                        }}
                      >
                        {dealsCount} {dealsCount === 1 ? 'Negocio' : 'Negocios'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {formatCurrency(stageTotal)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Deals List - Drop Zone */}
                  <Box
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className="pipeline-column-scroll"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      flex: '1 1 auto',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 0,
                      bgcolor: dragOverStage === stage.id 
                        ? (theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.04)')
                        : 'transparent',
                      borderRadius: '0 0 8px 8px',
                      p: 1.5,
                      pt: 1.5,
                      transition: 'all 0.3s',
                      border: dragOverStage === stage.id 
                        ? `2px dashed ${stage.color}` 
                        : '2px dashed transparent',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      '&::-webkit-scrollbar': {
                        display: 'none',
                        width: 0,
                        height: 0,
                      },
                    }}
                  >
                    {stageDeals.length === 0 ? (
                      <Box
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          bgcolor: theme.palette.action.hover,
                          border: `1px dashed ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          mt: 0.5,
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.8125rem',
                          }}
                        >
                          No hay negocios
                        </Typography>
                      </Box>
                    ) : (
                      stageDeals.map((deal) => (
                        <Card
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal)}
                          onDragEnd={handleDragEnd}
                          sx={{
                            cursor: isDragging && draggedDeal?.id === deal.id ? 'grabbing' : 'default',
                            opacity: isDragging && draggedDeal?.id === deal.id ? 0.3 : 1,
                            bgcolor: theme.palette.background.paper,
                            borderRadius: 1.5,
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 1px 3px rgba(0,0,0,0.2)'
                              : '0 1px 3px rgba(0,0,0,0.08)',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.palette.mode === 'dark'
                                ? '0 4px 12px rgba(0,0,0,0.3)'
                                : '0 4px 12px rgba(0,0,0,0.15)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, flexShrink: 0 }}>
                            {/* Título del Deal */}
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={600} 
                              onClick={() => navigate(`/deals/${deal.id}`)}
                              sx={{ 
                                mb: 0.75,
                                color: theme.palette.text.primary,
                                fontSize: '0.8125rem',
                                lineHeight: 1.4,
                                cursor: 'pointer',
                                '&:hover': {
                                  color: '#20B2AA',
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {deal.name}
                            </Typography>

                                  {/* Monto, Fecha y Propietario */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                sx={{ 
                                  color: theme.palette.text.primary,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {formatCurrency(parseAmount(deal.amount))}
                              </Typography>
                              {deal.closeDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarToday sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.6875rem',
                                    }}
                                  >
                                    {new Date(deal.closeDate).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </Typography>
                                </Box>
                              )}
                              {deal.Owner && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Avatar
                                    sx={{
                                      width: 18,
                                      height: 18,
                                      bgcolor: taxiMonterricoColors.green,
                                      fontSize: '0.5625rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {getInitials(deal.Owner.firstName, deal.Owner.lastName)}
                                  </Avatar>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.6875rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {deal.Owner.firstName} {deal.Owner.lastName}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Separador */}
                            <Divider sx={{ my: 1, borderColor: theme.palette.divider }} />

                            {/* Contactos y Empresas relacionados */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              {deal.Contact && (
                                <Tooltip title={`${deal.Contact.firstName} ${deal.Contact.lastName}`} arrow>
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                                      fontSize: '0.625rem',
                                      fontWeight: 600,
                                      border: `1px solid ${theme.palette.divider}`,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {getInitials(deal.Contact.firstName, deal.Contact.lastName)}
                                  </Avatar>
                                </Tooltip>
                              )}
                              {deal.Company && (
                                <Tooltip title={deal.Company.name} arrow>
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: `1px solid ${theme.palette.divider}`,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Business sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                                  </Box>
                                </Tooltip>
                              )}
                            </Box>
                          </CardContent>
      </Card>
                      ))
                    )}
                  </Box>
                </Box>
              );
            })}
            </Box>
          </Box>
        )}

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{
          borderBottom: '2px solid',
          borderImage: 'linear-gradient(90deg, #2E7D32 0%, #FF6F00 100%) 1',
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(255, 111, 0, 0.05) 100%)',
          bgcolor: '#FFFFFF !important',
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              background: 'linear-gradient(135deg, #2E7D32 0%, #FF6F00 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {editingDeal ? 'Editar Negocio' : 'Nuevo Negocio'}
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: '#FF6F00 !important',
                borderRadius: 1.5,
                border: '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 111, 0, 0.1)',
                  borderColor: '#FF6F00',
                  transform: 'rotate(90deg)',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          pt: 3,
          bgcolor: '#FFFFFF !important',
          color: '#000000 !important',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)',
          // Estilos globales para TextField dentro del Dialog
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF !important',
              color: '#000000 !important',
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: '#4CAF50',
                boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2E7D32 !important',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
              },
              '& input': {
                color: '#000000 !important',
                '&::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                  WebkitTextFillColor: '#000000 !important',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6) !important',
              fontWeight: 500,
              '&.Mui-focused': {
                color: '#2E7D32 !important',
                fontWeight: 600,
              },
            },
          },
          // Estilos para Select
          '& .MuiSelect-root': {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
          },
          '& .MuiOutlinedInput-root': {
            '& .MuiSelect-select': {
              color: '#000000 !important',
            },
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4CAF50',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2E7D32 !important',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
              },
            },
          },
          '& .MuiSelect-icon': {
            color: '#2E7D32',
          },
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={handleNameChange}
              required
            />
            <TextField
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={handleAmountChange}
              required
            />
            <TextField
              select
              label="Etapa"
              value={formData.stage}
              onChange={handleStageFormChange}
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
              value={formData.closeDate}
              onChange={handleCloseDateChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Prioridad"
              value={formData.priority}
              onChange={handlePriorityChange}
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
              value={formData.companyId}
              onChange={handleCompanyIdChange}
              fullWidth
            >
              <MenuItem value="">
                <em>Ninguna</em>
              </MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Contacto"
              value={formData.contactId}
              onChange={handleContactIdChange}
              fullWidth
            >
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
              {contacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id.toString()}>
                  {contact.firstName} {contact.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          bgcolor: '#FFFFFF !important',
        }}>
          <Button 
            onClick={handleClose}
            sx={{
              color: '#FF5252 !important',
              borderColor: '#FF5252 !important',
              borderWidth: '2px',
              bgcolor: '#FFFFFF !important',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: '#FF1744 !important',
                borderWidth: '2px',
                backgroundColor: 'rgba(255, 82, 82, 0.08) !important',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(255, 82, 82, 0.2)',
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%) !important',
              color: '#FFFFFF !important',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%) !important',
                boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            {editingDeal ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popover de Filtros Avanzados */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
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
            width: { xs: '90vw', sm: 500 },
            maxWidth: 500,
            maxHeight: '80vh',
            overflow: 'auto',
            mt: 1,
            p: 2,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Filtros Avanzados
          </Typography>
          <IconButton
            size="small"
            onClick={() => setFilterAnchorEl(null)}
            sx={{ p: 0.5 }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filterRules.map((rule, index) => (
            <Box key={rule.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                <Select
                  value={rule.column}
                  onChange={(e) => {
                    const newRules = [...filterRules];
                    newRules[index].column = e.target.value;
                    setFilterRules(newRules);
                  }}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {columnOptions.map((col) => (
                    <MenuItem key={col.value} value={col.value}>
                      {col.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                <Select
                  value={rule.operator}
                  onChange={(e) => {
                    const newRules = [...filterRules];
                    newRules[index].operator = e.target.value;
                    setFilterRules(newRules);
                  }}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {operatorOptions.map((op) => (
                    <MenuItem key={op.value} value={op.value}>
                      {op.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                placeholder="Valor..."
                value={rule.value}
                onChange={(e) => {
                  const newRules = [...filterRules];
                  newRules[index].value = e.target.value;
                  setFilterRules(newRules);
                }}
                sx={{ flex: 1, minWidth: 150 }}
              />

              <IconButton
                size="small"
                onClick={() => {
                  setFilterRules(filterRules.filter((_, i) => i !== index));
                }}
                sx={{ color: theme.palette.error.main }}
              >
                <Delete sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 1 }}>
            <Button
              size="small"
              onClick={() => {
                setFilterRules([...filterRules, {
                  id: `filter-${Date.now()}-${Math.random()}`,
                  column: 'name',
                  operator: 'contains',
                  value: '',
                }]);
              }}
              sx={{ textTransform: 'none' }}
            >
              + Agregar filtro
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  setFilterRules([]);
                }}
                sx={{ textTransform: 'none', color: theme.palette.error.main }}
              >
                Limpiar
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => setFilterAnchorEl(null)}
                sx={{ textTransform: 'none' }}
              >
                Aplicar
              </Button>
            </Box>
          </Box>

          {/* Mostrar filtros activos como chips */}
          {filterRules.filter(r => r.value).length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
                Filtros activos:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {filterRules
                  .filter(rule => rule.value)
                  .map((rule) => {
                    const columnLabel = columnOptions.find(c => c.value === rule.column)?.label || rule.column;
                    const operatorLabel = operatorOptions.find(o => o.value === rule.operator)?.label || rule.operator;
                    return (
                      <Chip
                        key={rule.id}
                        size="small"
                        label={`${columnLabel} ${operatorLabel} "${rule.value}"`}
                        onDelete={() => {
                          setFilterRules(filterRules.filter(r => r.id !== rule.id));
                        }}
                        sx={{ height: 24, fontSize: '0.7rem' }}
                      />
                    );
                  })}
              </Box>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Entity Preview Drawer */}
      <EntityPreviewDrawer
        open={previewOpen}
        onClose={handleClosePreview}
        entityType="deal"
        entityId={previewDeal?.id || null}
        entityData={previewDeal}
      />

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
            ¿Estás seguro de que deseas eliminar este negocio?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Esta acción no se puede deshacer. El negocio será eliminado permanentemente del sistema.
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
    </Box>
  );
};

export default Deals;




