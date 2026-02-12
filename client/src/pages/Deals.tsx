import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Avatar,
  Select,
  Tooltip,
  Menu,
  useTheme,
  Collapse,
  LinearProgress,
} from '@mui/material';
import { Add, Delete, AttachMoney, Visibility, ViewList, AccountTree, CalendarToday, Close, FileDownload, FilterList, ExpandMore, Remove, Bolt, Edit, ChevronLeft, ChevronRight } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors, hexToRgba } from '../theme/colors';
import { getStageColor as getStageColorUtil, getStageProgress } from '../utils/stageColors';
import { pageStyles } from '../theme/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { UnifiedTable, DEFAULT_ITEMS_PER_PAGE } from '../components/UnifiedTable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake, faFilter } from "@fortawesome/free-solid-svg-icons";
import EntityPreviewDrawer from '../components/EntityPreviewDrawer';
import UserAvatar from '../components/UserAvatar';
import { FormDrawer } from '../components/FormDrawer';
import { DealFormContent, getInitialDealFormData, type DealFormData } from '../components/DealFormContent';
import { formatCurrencyPE, formatCurrencyPECompact } from '../utils/currencyUtils';

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
  useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [search] = useState('');
  const [sortBy] = useState('newest');
  const dealFormDataRef = useRef<{ formData: DealFormData; setFormData: React.Dispatch<React.SetStateAction<DealFormData>> }>({
    formData: getInitialDealFormData(null),
    setFormData: () => {},
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Estados para búsqueda asíncrona de empresas
  const [companySearch, setCompanySearch] = useState("");
  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Estados para búsqueda de contactos (filtrado local)
  const [contactSearchInput, setContactSearchInput] = useState("");
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

  // Estados para drag and drop
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pipelineScrollRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
  // Estados para filtros por columna
  const [columnFilters, setColumnFilters] = useState<{
    nombre: string;
    monto: string;
    etapa: string;
    propietario: string;
  }>({
    nombre: '',
    monto: '',
    etapa: '',
    propietario: '',
  });
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState(columnFilters);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDeal, setPreviewDeal] = useState<Deal | null>(null);
  
  // Etapas del pipeline
  const stages = [
    { id: 'lead_inactivo', label: 'Lead Inactivo', color: theme.palette.text.secondary },
    { id: 'lead', label: 'Lead', color: theme.palette.primary.main },
    { id: 'contacto', label: 'Contacto', color: theme.palette.primary.light },
    { id: 'reunion_agendada', label: 'Reunión Agendada', color: taxiMonterricoColors.greenLight },
    { id: 'reunion_efectiva', label: 'Reunión Efectiva', color: taxiMonterricoColors.green },
    { id: 'propuesta_economica', label: 'Propuesta Económica', color: taxiMonterricoColors.orangeLight },
    { id: 'negociacion', label: 'Negociación', color: taxiMonterricoColors.orange },
    { id: 'licitacion', label: 'Licitación', color: taxiMonterricoColors.orangeDark },
    { id: 'licitacion_etapa_final', label: 'Licitación Etapa Final', color: theme.palette.warning.dark },
    { id: 'cierre_ganado', label: 'Cierre Ganado', color: taxiMonterricoColors.greenLight },
    { id: 'firma_contrato', label: 'Firma de Contrato', color: taxiMonterricoColors.green },
    { id: 'activo', label: 'Activo', color: taxiMonterricoColors.green },
    { id: 'cliente_perdido', label: 'Cliente Perdido', color: theme.palette.error.light },
    { id: 'cierre_perdido', label: 'Cierre Perdido', color: theme.palette.error.main },
  ];

  // Función helper para convertir amount a número de forma segura
  const parseAmount = (amount: any): number => {
    if (amount === null || amount === undefined || amount === '') return 0;
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = formatCurrencyPECompact;

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
  }, [selectedStages, selectedOwnerFilters, search, sortBy, debouncedColumnFilters]);


  // Función para vista previa
  const handlePreview = (deal: Deal) => {
    setPreviewDeal(deal);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDeal(null);
  };

  const getStageColor = (stage: string) => getStageColorUtil(theme, stage);

  // Función para obtener el color de fondo de la card según la etapa
  const getStageCardColor = (stage: string) => {
    // Cierre ganado y etapas finales exitosas
    if (['cierre_ganado', 'firma_contrato', 'activo'].includes(stage)) {
      return theme.palette.mode === 'dark' 
        ? `${taxiMonterricoColors.green}26` 
        : `${taxiMonterricoColors.green}15`;
    }
    // Cierre perdido y clientes perdidos
    else if (stage === 'cierre_perdido' || stage === 'cliente_perdido') {
      return theme.palette.mode === 'dark' 
        ? `${theme.palette.error.main}26` 
        : `${theme.palette.error.main}15`;
    }
    // Negociación y reuniones
    else if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
      return theme.palette.mode === 'dark' 
        ? `${taxiMonterricoColors.orange}26` 
        : `${taxiMonterricoColors.orange}15`;
    }
    // Licitación - Color distintivo (púrpura claro)
    else if (stage === 'licitacion_etapa_final' || stage === 'licitacion') {
      return theme.palette.mode === 'dark' 
        ? `${theme.palette.secondary.main}26` 
        : `${theme.palette.secondary.main}15`;
    }
    // Lead y Contacto - Azul claro
    else if (['lead', 'contacto'].includes(stage)) {
      return theme.palette.mode === 'dark' 
        ? `${theme.palette.primary.main}1A` 
        : `${theme.palette.primary.main}15`;
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
      if (debouncedColumnFilters.etapa) params.filterEtapa = debouncedColumnFilters.etapa;
      if (debouncedColumnFilters.propietario) params.filterPropietario = debouncedColumnFilters.propietario;
      
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
  }, [search, currentPage, itemsPerPage, selectedStages, selectedOwnerFilters, sortBy, debouncedColumnFilters]);

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
            params: { minimal: true },
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
          limit: 20, // Solo 20 resultados
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
    }, 300); // Espera 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [companySearch, searchCompanies]);

  const handleExportToExcel = () => {
    const exportData = deals.map((deal) => ({
      'Nombre': deal.name || '--',
      'Monto': deal.amount != null ? formatCurrencyPE(deal.amount) : '--',
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

  const handleOpen = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      const initialData = getInitialDealFormData(deal);
      dealFormDataRef.current.setFormData(initialData);
      if (deal.companyId && (deal as any).Company) {
        setCompanyOptions((prev) => {
          if (prev.some((c: any) => c.id === deal.companyId)) return prev;
          return [{ id: deal.companyId, name: (deal as any).Company?.name || '' }, ...prev];
        });
      }
    } else {
      setEditingDeal(null);
      dealFormDataRef.current.setFormData(getInitialDealFormData(null));
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDeal(null);
  };


  const handleSubmit = async () => {
    try {
      const formData = dealFormDataRef.current.formData;
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount) || 0,
        stage: formData.stage,
        closeDate: formData.closeDate || null,
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

  // Auto-scroll durante el drag
  useEffect(() => {
    if (!isDragging || !pipelineScrollRef.current) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!pipelineScrollRef.current) return;

      const container = pipelineScrollRef.current;
      const rect = container.getBoundingClientRect();
      const scrollThreshold = 100; // Distancia desde el borde para activar scroll
      const scrollSpeed = 10; // Velocidad de scroll

      // Limpiar intervalo anterior si existe
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      // Detectar si está cerca del borde izquierdo
      if (e.clientX - rect.left < scrollThreshold && container.scrollLeft > 0) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (pipelineScrollRef.current) {
            pipelineScrollRef.current.scrollLeft = Math.max(0, pipelineScrollRef.current.scrollLeft - scrollSpeed);
          }
        }, 16); // ~60fps
      }
      // Detectar si está cerca del borde derecho
      else if (rect.right - e.clientX < scrollThreshold && 
               container.scrollLeft < container.scrollWidth - container.clientWidth) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (pipelineScrollRef.current) {
            const maxScroll = container.scrollWidth - container.clientWidth;
            pipelineScrollRef.current.scrollLeft = Math.min(maxScroll, pipelineScrollRef.current.scrollLeft + scrollSpeed);
          }
        }, 16); // ~60fps
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isDragging]);

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', deal.id.toString());
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Limpiar auto-scroll
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
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
          {columnFilters.propietario && (
            <Chip
              size="small"
              label={`Propietario: "${columnFilters.propietario}"`}
              onDelete={() => setColumnFilters(prev => ({ ...prev, propietario: '' }))}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
          <Button
            size="small"
            onClick={() => setColumnFilters({ nombre: '', monto: '', etapa: '', propietario: '' })}
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
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Negocios
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, sm: 0.75 },
              order: { xs: 3, sm: 0 },
            }}
          >
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              onClick={handleExportToExcel}
              sx={{
                border: `1.5px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                bgcolor: 'transparent',
                color: theme.palette.text.secondary,
                px: { xs: 1.25, sm: 1.5 },
                py: { xs: 0.75, sm: 0.875 },
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: taxiMonterricoColors.green,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? `${taxiMonterricoColors.green}1A` 
                    : `${taxiMonterricoColors.green}0D`,
                  color: taxiMonterricoColors.green,
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
                },
              }}
            >
              Exportar
            </Button>
          </Box>
          
          <Button
            size="small"
            startIcon={<FontAwesomeIcon icon={faFilter} style={{ fontSize: 16 }} />}
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            sx={{
              border: `1.5px solid ${showColumnFilters ? taxiMonterricoColors.green : theme.palette.divider}`,
              borderRadius: 1.5,
              bgcolor: showColumnFilters 
                ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}14`)
                : 'transparent',
              color: showColumnFilters ? taxiMonterricoColors.green : theme.palette.text.secondary,
              px: { xs: 1.25, sm: 1.5 },
              py: { xs: 0.75, sm: 0.875 },
              order: { xs: 5, sm: 0 },
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: taxiMonterricoColors.green,
                bgcolor: theme.palette.mode === 'dark' 
                  ? `${taxiMonterricoColors.green}33` 
                  : `${taxiMonterricoColors.green}1A`,
                color: taxiMonterricoColors.green,
                boxShadow: `0 4px 12px ${taxiMonterricoColors.green}20`,
              },
            }}
          >
            Filtro
          </Button>
          
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
                  ...(viewMode === 'list'
                    ? { background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`, color: '#fff' }
                    : {
                        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100],
                        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.primary,
                      }),
                  borderRadius: 1.5,
                  p: { xs: 0.75, sm: 0.875 },
                  border: `1.5px solid ${viewMode === 'list' ? 'transparent' : theme.palette.divider}`,
                  boxShadow: 'none',
                  '& .MuiSvgIcon-root': {
                    color: 'inherit',
                  },
                  '&:hover': {
                    ...(viewMode === 'list'
                      ? { background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`, color: '#fff' }
                      : { bgcolor: theme.palette.action.hover }),
                    boxShadow: 'none',
                    '& .MuiSvgIcon-root': {
                      color: 'inherit',
                    },
                  },
                }}
              >
                <ViewList sx={{ fontSize: { xs: 16, sm: 18 }, color: 'inherit' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver funnel" arrow>
              <IconButton
                onClick={() => setViewMode('funnel')}
                sx={{
                  ...(viewMode === 'funnel'
                    ? { background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`, color: '#fff' }
                    : {
                        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100],
                        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.primary,
                      }),
                  borderRadius: 1.5,
                  p: { xs: 0.75, sm: 0.875 },
                  border: `1.5px solid ${viewMode === 'funnel' ? 'transparent' : theme.palette.divider}`,
                  boxShadow: 'none',
                  '& .MuiSvgIcon-root': {
                    color: 'inherit',
                  },
                  '&:hover': {
                    ...(viewMode === 'funnel'
                      ? { background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`, color: '#fff' }
                      : { bgcolor: theme.palette.action.hover }),
                    boxShadow: 'none',
                    '& .MuiSvgIcon-root': {
                      color: 'inherit',
                    },
                  },
                }}
              >
                <AccountTree sx={{ fontSize: { xs: 16, sm: 18 }, color: 'inherit' }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Button
            size="small"
            startIcon={<Add sx={{ fontSize: { xs: 16, sm: 18 } }} />}
            onClick={() => handleOpen()}
            sx={{
              background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
              color: "white",
              borderRadius: 1.5,
              px: { xs: 1.25, sm: 1.5 },
              py: { xs: 0.75, sm: 0.875 },
              boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
              order: { xs: 2, sm: 0 },
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                boxShadow: `0 8px 20px ${taxiMonterricoColors.green}50`,
                background: `linear-gradient(135deg, ${taxiMonterricoColors.greenLight} 0%, ${taxiMonterricoColors.green} 100%)`,
              },
            }}
          >
            Nuevo Negocio
          </Button>
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
                  ? '#1c252e'
                  : `${taxiMonterricoColors.green}03`,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(5, minmax(0, 1fr))', md: '1.5fr 0.9fr 1fr 0.8fr 0.7fr' },
                columnGap: { xs: 1, md: 1.5 },
                minWidth: { xs: 600, md: 'auto' },
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    },
                  }}
                />
              )}
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
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(5, minmax(0, 1fr))', md: '1.5fr 0.9fr 1fr 0.8fr 0.7fr' },
                  columnGap: { xs: 1, md: 1.5 },
                  minWidth: { xs: 600, md: 'auto' },
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
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
                          bgcolor: (deal as any).logo ? 'transparent' : taxiMonterricoColors.green,
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
                                bgcolor: deal.priority === 'baja' ? taxiMonterricoColors.green : deal.priority === 'media' ? taxiMonterricoColors.orange : theme.palette.error.main,
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
                        color: theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        fontWeight: 500,
                      }}
                    >
                    {formatCurrencyPE(deal.amount)}
                    </Typography>
                </Box>
                <Box
                  sx={{
                    px: { xs: 0.75, md: 1 },
                    py: { xs: 0.5, md: 0.75 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    gap: 0.5,
                    minWidth: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageMenuOpen(e, deal.id);
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.25,
                      cursor: updatingStage[deal.id] ? 'wait' : 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        color: getStageColor(deal.stage).color,
                      }}
                    >
                      {getStageLabel(deal.stage)}
                    </Typography>
                    <ExpandMore
                      sx={{
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        color: getStageColor(deal.stage).color,
                      }}
                    />
                  </Box>
                  {(() => {
                    const prog = getStageProgress(deal.stage);
                    const showVal = Math.max(0, Math.min(100, prog));
                    return (
                  <Box sx={{ position: 'relative', width: 90, height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: theme.palette.action.hover }}>
                    <LinearProgress
                      variant="determinate"
                      value={showVal}
                      sx={{
                        height: '100%',
                        borderRadius: 4,
                        bgcolor: theme.palette.action.hover,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStageProgress(deal.stage) < 0 ? theme.palette.text.disabled : theme.palette.primary.main,
                        },
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: showVal > 40 ? theme.palette.common.white : theme.palette.text.primary,
                        textShadow: showVal > 40 ? '0 0 1px rgba(0,0,0,0.5)' : 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      {prog < 0 ? `${prog}%` : `${showVal}%`}
                    </Typography>
                  </Box>
                    );
                  })()}
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
                {/* Nueva columna: Propietario */}
                <Box sx={{ px: { xs: 0.5, md: 0.75 }, py: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                  {deal.Owner ? (
                    <Tooltip title={`${deal.Owner.firstName} ${deal.Owner.lastName}`} arrow>
                      <UserAvatar
                        firstName={deal.Owner.firstName}
                        lastName={deal.Owner.lastName}
                        colorSeed={deal.Owner.id?.toString() || deal.Owner.email || `${deal.Owner.firstName}${deal.Owner.lastName}`}
                        size={32}
                      />
                    </Tooltip>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.disabled,
                        fontSize: { xs: '0.75rem', md: '0.8125rem' },
                        fontWeight: 400,
                      }}
                    >
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
                          sx={pageStyles.actionButtonEdit(theme)}
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
                          sx={pageStyles.actionButtonView(theme)}
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
                          sx={pageStyles.actionButtonDelete(theme)}
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
                        : theme.palette.grey[100],
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
                      {stageOptions.map((option) => {
                        const stageColor = getStageColor(option.value);
                        const isSelected = selectedStages.includes(option.value);

                        return (
                          <Chip
                            key={option.value}
                            label={option.label}
                            size="small"
                            variant={isSelected ? 'filled' : 'outlined'}
                            onClick={() => {
                              setSelectedStages((prev) =>
                                prev.includes(option.value) ? prev.filter((s) => s !== option.value) : [...prev, option.value]
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
                              ...(isSelected && {
                                bgcolor: stageColor.bg,
                                color: stageColor.color,
                                borderColor: stageColor.bg,
                              }),
                              ...(!isSelected && {
                                borderColor: stageColor.color,
                                color: theme.palette.text.primary,
                              }),
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
              height: 'calc(100vh - 200px)',
              maxHeight: 'calc(100vh - 200px)',
            }}
          >
              <Box
                ref={pipelineScrollRef}
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
                  scrollbarColor: `${theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[400]} ${theme.palette.mode === 'dark' ? `${theme.palette.common.white}14` : `${theme.palette.common.black}14`}`,
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
                    background: theme.palette.mode === 'dark' ? taxiMonterricoColors.grayDark : taxiMonterricoColors.gray,
                    borderRadius: 8,
                    border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                    minHeight: 24,
                    '&:hover': {
                      background: theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[400],
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
                    height: 'calc(100vh - 200px)',
                    maxHeight: 'calc(100vh - 200px)',
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
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                            {/* Empresa vinculada - ahora arriba del nombre */}
                            {deal.Company && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  mb: 0.5,
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  display: 'block',
                                }}
                              >
                                {deal.Company.name}
                              </Typography>
                            )}
                            
                            {/* Título del Deal */}
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={600} 
                              onClick={() => navigate(`/deals/${deal.id}`)}
                              sx={{ 
                                mb: 0.75,
                                color: theme.palette.text.primary,
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                cursor: 'pointer',
                                '&:hover': {
                                  color: taxiMonterricoColors.green,
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
                                  fontSize: '0.8125rem',
                                }}
                              >
                                {formatCurrency(parseAmount(deal.amount))}
                              </Typography>
                              {deal.closeDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarToday sx={{ fontSize: 13, color: theme.palette.text.secondary }} />
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.75rem',
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
                                  <UserAvatar
                                    firstName={deal.Owner.firstName}
                                    lastName={deal.Owner.lastName}
                                    colorSeed={deal.Owner.id?.toString() || deal.Owner.email || `${deal.Owner.firstName}${deal.Owner.lastName}`}
                                    size={18}
                                    variant="default"
                                  />
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.75rem',
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

                            {/* Contactos relacionados */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                              {deal.Contact && (
                                <Tooltip title={`${deal.Contact.firstName} ${deal.Contact.lastName}`} arrow>
                                  <UserAvatar
                                    firstName={deal.Contact.firstName}
                                    lastName={deal.Contact.lastName}
                                    size="small"
                                    variant="minimal"
                                    sx={{ cursor: 'pointer' }}
                                  />
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

      <FormDrawer
        open={open}
        onClose={handleClose}
        title={editingDeal ? 'Editar Negocio' : 'Nuevo Negocio'}
        onSubmit={handleSubmit}
        submitLabel={editingDeal ? 'Actualizar' : 'Crear'}
        submitDisabled={!dealFormDataRef.current.formData.name.trim() || !dealFormDataRef.current.formData.amount.trim()}
        variant="panel"
      >
        <DealFormContent
          initialData={getInitialDealFormData(editingDeal)}
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


      {/* Popover de Filtros Avanzados */}
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
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: theme.palette.common.white }} /> : <Delete />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deals;




