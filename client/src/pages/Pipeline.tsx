import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  Paper,
  useTheme,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit,
  Delete,
  AttachMoney,
  Person,
  Business,
  CalendarToday,
  DragIndicator,
  Close,
  Timeline,
  CheckCircle,
  RadioButtonUnchecked,
  Note,
  Phone,
  Email,
  Event,
  Assignment,
} from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';

interface Deal {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  createdAt?: string;
  updatedAt?: string;
  Contact?: { firstName: string; lastName: string };
  Company?: { name: string };
  Owner?: { id: number; firstName: string; lastName: string; email?: string };
}

interface Activity {
  id: number;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal' | 'contact' | 'company';
  subject: string;
  description?: string;
  createdAt: string;
  User?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

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

const Pipeline: React.FC = () => {
  const theme = useTheme();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    stage: 'lead',
    closeDate: '',
    probability: '',
    contactId: '',
    companyId: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/deals');
      setDeals(response.data.deals || response.data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        name: deal.name,
        amount: deal.amount?.toString() || '',
        stage: deal.stage,
        closeDate: deal.closeDate || '',
        probability: deal.probability?.toString() || '',
        contactId: '',
        companyId: '',
      });
    } else {
      setEditingDeal(null);
      setFormData({
        name: '',
        amount: '',
        stage: 'lead',
        closeDate: '',
        probability: '',
        contactId: '',
        companyId: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDeal(null);
  };

  const handleSubmit = async () => {
    try {
      const dealData = {
        name: formData.name,
        amount: parseFloat(formData.amount) || 0,
        stage: formData.stage,
        closeDate: formData.closeDate || null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        contactId: formData.contactId || null,
        companyId: formData.companyId || null,
      };

      if (editingDeal) {
        await api.put(`/deals/${editingDeal.id}`, dealData);
      } else {
        await api.post('/deals', dealData);
      }

      fetchDeals();
      handleClose();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDelete = async () => {
    if (!dealToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/deals/${dealToDelete}`);
      fetchDeals();
      setDeleteDialogOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error('Error deleting deal:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleStageChange = async (dealId: number, newStage: string) => {
    try {
      await api.put(`/deals/${dealId}`, { stage: newStage });
      // Actualizar el estado localmente en lugar de recargar todos los deals
      setDeals(prevDeals => prevDeals.map(deal =>
        deal.id === dealId ? { ...deal, stage: newStage } : deal
      ));
    } catch (error) {
      console.error('Error updating stage:', error);
      // Si hay error, recargar para sincronizar
      fetchDeals();
    }
  };

  // Estados para drag and drop
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartTimeRef = useRef<number>(0);

  // Estados para animaciones mejoradas
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Handlers para drag and drop con animaciones mejoradas
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    setIsDragging(true);
    dragStartTimeRef.current = Date.now();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', deal.id.toString());
    
    // Crear una imagen personalizada para el drag con mejor diseño
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    const rect = e.currentTarget.getBoundingClientRect();
    // Mantener las dimensiones originales del card
    dragImage.style.width = `${rect.width}px`;
    dragImage.style.height = 'auto';
    dragImage.style.maxWidth = `${rect.width}px`;
    dragImage.style.transform = 'rotate(3deg)';
    dragImage.style.opacity = '0.95';
    dragImage.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1)';
    dragImage.style.borderRadius = '8px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.boxSizing = 'border-box';
    document.body.appendChild(dragImage);
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Pequeño delay para evitar que el onClick se ejecute después del drag
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
    // Solo limpiar si realmente salimos del área (no solo pasamos sobre un hijo)
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

    // Solo actualizar si cambió de etapa
    if (draggedDeal.stage !== stageId) {
      // Agregar una pequeña animación de "éxito" antes de actualizar
      await handleStageChange(draggedDeal.id, stageId);
    }

    // Pequeño delay para que la animación se vea suave
    setTimeout(() => {
      setDraggedDeal(null);
      setIsDragging(false);
    }, 150);
  };

  const handleViewHistory = async (deal: Deal) => {
    setSelectedDeal(deal);
    setHistoryModalOpen(true);
    setLoadingActivities(true);
    
    try {
      const response = await api.get('/activities', {
        params: { dealId: deal.id },
      });
      setActivities(response.data.activities || response.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getStageIndex = (stageId: string) => {
    return stages.findIndex((s) => s.id === stageId);
  };

  const getCompletedStages = (currentStage: string) => {
    const currentIndex = getStageIndex(currentStage);
    return stages.slice(0, currentIndex + 1);
  };

  const getStageDate = (stageId: string, stageIndex: number, deal: Deal, allActivities: Activity[]) => {
    const currentIndex = getStageIndex(deal.stage);
    const isFirstStage = stageIndex === 0;
    const isCurrentStage = deal.stage === stageId;
    
    // Para la primera etapa, usar la fecha de creación
    if (isFirstStage && deal.createdAt) {
      return new Date(deal.createdAt);
    }
    
    // Para la etapa actual, usar la fecha de última actualización
    if (isCurrentStage && deal.updatedAt) {
      return new Date(deal.updatedAt);
    }
    
    // Para etapas intermedias, buscar actividades relacionadas o calcular proporcionalmente
    if (deal.createdAt && deal.updatedAt) {
      const startDate = new Date(deal.createdAt);
      const endDate = new Date(deal.updatedAt);
      const totalStages = currentIndex + 1;
      
      // Buscar actividades que puedan estar relacionadas con esta etapa
      const stageActivities = allActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        // Buscar actividades en el rango de tiempo que correspondería a esta etapa
        const stageStartTime = startDate.getTime() + ((stageIndex / totalStages) * (endDate.getTime() - startDate.getTime()));
        const stageEndTime = startDate.getTime() + (((stageIndex + 1) / totalStages) * (endDate.getTime() - startDate.getTime()));
        return activityDate.getTime() >= stageStartTime && activityDate.getTime() <= stageEndTime;
      });
      
      // Si hay actividades, usar la fecha de la primera
      if (stageActivities.length > 0) {
        const sortedActivities = stageActivities.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return new Date(sortedActivities[0].createdAt);
      }
      
      // Si no hay actividades, calcular proporcionalmente
      const timeDiff = endDate.getTime() - startDate.getTime();
      const stageTime = startDate.getTime() + ((stageIndex / totalStages) * timeDiff);
      return new Date(stageTime);
    }
    
    return null;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone />;
      case 'email':
        return <Email />;
      case 'meeting':
        return <Event />;
      case 'task':
        return <Assignment />;
      case 'note':
      default:
        return <Note />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call':
        return '#0288d1';
      case 'email':
        return '#1976d2';
      case 'meeting':
        return '#7b1fa2';
      case 'task':
        return '#f57c00';
      case 'note':
      default:
        return '#2E7D32';
    }
  };

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

  const getDealsByStage = (stageId: string) => {
    if (!Array.isArray(deals)) return [];
    return deals.filter((deal) => deal.stage === stageId);
  };

  const getStageTotal = (stageId: string) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.amount || 0), 0);
  };

  const filteredDeals = Array.isArray(deals) ? deals.filter((deal) =>
    deal.name?.toLowerCase().includes(search.toLowerCase()) ||
    deal.Contact?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    deal.Contact?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    deal.Company?.name?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 }, pt: { xs: 2, sm: 2.5, md: 3 }, pb: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Pipeline Board Container */}
      <Card
        sx={{
          p: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
          borderRadius: 4,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.08)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            overflowY: 'hidden', // Ocultar scroll vertical
            pb: 2,
            flex: 1,
            minHeight: 0,
            // Estilo para la barra horizontal (visible)
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'dark' ? '#616161' : '#bdbdbd',
              borderRadius: 4,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              '&:hover': {
                background: theme.palette.mode === 'dark' ? '#757575' : '#9e9e9e',
              },
            },
            scrollbarWidth: 'thin', // Firefox - mostrar horizontal
            scrollbarColor: `${theme.palette.mode === 'dark' ? '#616161' : '#bdbdbd'} ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`, // Firefox
          }}
        >
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter((deal) => deal.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

          return (
            <Box
              key={stage.id}
              sx={{
                minWidth: 320,
                maxWidth: 320,
                width: 320,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* Stage Header */}
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                  border: `2px solid ${stage.color}20`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: stage.color,
                      }}
                    />
                    <Typography variant="h6" fontWeight={600}>
                      {stage.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={stageDeals.length}
                    size="small"
                    sx={{
                      bgcolor: stage.color,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {formatCurrency(stageTotal)}
                </Typography>
              </Paper>

              {/* Deals List - Drop Zone */}
              <Box
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'visible',
                  minHeight: '100px', // Altura mínima para facilitar el drop
                  maxHeight: '100%',
                  position: 'relative',
                  borderRadius: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: dragOverStage === stage.id 
                    ? (theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.04)')
                    : 'transparent',
                  border: dragOverStage === stage.id 
                    ? `2px dashed ${stage.color}` 
                    : '2px dashed transparent',
                  borderStyle: dragOverStage === stage.id ? 'dashed' : 'solid',
                  transform: dragOverStage === stage.id ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: dragOverStage === stage.id 
                    ? `0 0 0 4px ${stage.color}20, 0 4px 12px rgba(0,0,0,0.15)`
                    : 'none',
                  animation: dragOverStage === stage.id ? 'pulseBorder 1.5s ease-in-out infinite' : 'none',
                  '@keyframes pulseBorder': {
                    '0%, 100%': {
                      borderColor: stage.color,
                      boxShadow: `0 0 0 4px ${stage.color}20, 0 4px 12px rgba(0,0,0,0.15)`,
                    },
                    '50%': {
                      borderColor: `${stage.color}CC`,
                      boxShadow: `0 0 0 6px ${stage.color}30, 0 6px 16px rgba(0,0,0,0.2)`,
                    },
                  },
                  '&::before': dragOverStage === stage.id ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${stage.color}20 0%, ${stage.color}05 50%, transparent 100%)`,
                    pointerEvents: 'none',
                    zIndex: 0,
                    animation: 'fadeIn 0.3s ease-in-out',
                  } : {},
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                  },
                  '&::-webkit-scrollbar': {
                    display: 'none',
                    width: 0,
                  },
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE and Edge
                }}
              >
                {stageDeals.length === 0 ? (
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA',
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No hay negocios
                    </Typography>
                  </Paper>
                ) : (
                  stageDeals.map((deal, index) => (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        cursor: isDragging && draggedDeal?.id === deal.id ? 'grabbing' : 'grab',
                        transition: isDragging && draggedDeal?.id === deal.id 
                          ? 'none' 
                          : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        width: '100%',
                        minHeight: 'fit-content',
                        overflow: 'visible',
                        userSelect: 'none', // Prevenir selección de texto al arrastrar
                        opacity: isDragging && draggedDeal?.id === deal.id ? 0.3 : 1,
                        transform: isDragging && draggedDeal?.id === deal.id 
                          ? 'rotate(3deg)' 
                          : 'rotate(0deg)',
                        zIndex: isDragging && draggedDeal?.id === deal.id ? 1000 : 1,
                        height: isDragging && draggedDeal?.id === deal.id ? 'auto' : 'auto',
                        maxHeight: isDragging && draggedDeal?.id === deal.id ? 'none' : 'none',
                        animation: !isDragging || draggedDeal?.id !== deal.id 
                          ? `slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`
                          : 'none',
                        '@keyframes slideIn': {
                          '0%': {
                            opacity: 0,
                            transform: 'translateY(-10px) scale(0.95)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'translateY(0) scale(1)',
                          },
                        },
                        '&:hover': {
                          transform: isDragging && draggedDeal?.id === deal.id 
                            ? 'rotate(3deg)' 
                            : 'translateY(-4px) scale(1.02)',
                          boxShadow: isDragging && draggedDeal?.id === deal.id
                            ? 'none'
                            : theme.palette.mode === 'dark'
                            ? '0 8px 16px rgba(0,0,0,0.5)'
                            : '0 8px 16px rgba(0,0,0,0.2)',
                        },
                        borderLeft: `4px solid ${stage.color}`,
                        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                        borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                        borderRadius: 2,
                        boxShadow: isDragging && draggedDeal?.id === deal.id
                          ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1)'
                          : theme.palette.mode === 'dark'
                          ? '0 2px 8px rgba(0,0,0,0.2)'
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        // Efecto de "placeholder" cuando se arrastra desde otra etapa
                        '&::after': isDragging && draggedDeal?.id === deal.id && draggedDeal?.stage !== stage.id ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 2,
                          border: `2px dashed ${stage.color}60`,
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)',
                          pointerEvents: 'none',
                          zIndex: -1,
                        } : {},
                      }}
                      onClick={(e) => {
                        // Solo abrir el historial si no se está arrastrando
                        // Verificar si pasó suficiente tiempo desde el inicio del drag
                        const timeSinceDragStart = Date.now() - dragStartTimeRef.current;
                        if (!isDragging && timeSinceDragStart > 200) {
                          handleViewHistory(deal);
                        }
                      }}
                    >
                      <CardContent sx={{ 
                        p: 2.5, 
                        '&:last-child': { pb: 2.5 }, 
                        width: '100%', 
                        boxSizing: 'border-box',
                        overflow: 'visible',
                        minHeight: 'fit-content',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        {/* Título */}
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {deal.name}
                        </Typography>

                        {/* Monto */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={600} 
                            color={taxiMonterricoColors.green}
                            sx={{ wordBreak: 'break-word' }}
                          >
                            {formatCurrency(deal.amount || 0)}
                          </Typography>
                        </Box>

                        {/* Nombre de contacto */}
                        {deal.Contact && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Person sx={{ fontSize: 16, color: theme.palette.text.secondary, flexShrink: 0 }} />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ wordBreak: 'break-word' }}
                            >
                              {deal.Contact.firstName} {deal.Contact.lastName}
                            </Typography>
                          </Box>
                        )}

                        {/* Usuario que creó el negocio */}
                        {deal.Owner && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Person sx={{ fontSize: 16, color: theme.palette.text.secondary, flexShrink: 0 }} />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ wordBreak: 'break-word' }}
                            >
                              {deal.Owner.firstName} {deal.Owner.lastName}
                            </Typography>
                          </Box>
                        )}

                        {/* Fecha */}
                        {deal.closeDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
                            <CalendarToday sx={{ fontSize: 16, color: theme.palette.text.secondary, flexShrink: 0 }} />
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ wordBreak: 'break-word' }}
                            >
                              {new Date(deal.closeDate).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        )}

                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            </Box>
          );
        })}
        </Box>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDeal ? 'Editar Negocio' : 'Nuevo Negocio'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre del Negocio"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              label="Etapa"
              select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              fullWidth
            >
              {stages.map((stage) => (
                <MenuItem key={stage.id} value={stage.id}>
                  {stage.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Probabilidad (%)"
              type="number"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Fecha de Cierre"
              type="date"
              value={formData.closeDate}
              onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              bgcolor: taxiMonterricoColors.green,
              '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
            }}
          >
            {editingDeal ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar este negocio?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Modal */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {selectedDeal?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Historial del Proceso
            </Typography>
          </Box>
          <IconButton onClick={() => setHistoryModalOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedDeal && (
            <Box>
              {/* Deal Info */}
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Información del Negocio
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney sx={{ fontSize: 18, color: taxiMonterricoColors.green }} />
                        <Typography variant="body1" fontWeight={600} color={taxiMonterricoColors.green}>
                          {formatCurrency(selectedDeal.amount || 0)}
                        </Typography>
                      </Box>
                      {selectedDeal.Contact && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {selectedDeal.Contact.firstName} {selectedDeal.Contact.lastName}
                          </Typography>
                        </Box>
                      )}
                      {selectedDeal.Company && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {selectedDeal.Company.name}
                          </Typography>
                        </Box>
                      )}
                      {selectedDeal.closeDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Fecha de cierre: {new Date(selectedDeal.closeDate).toLocaleDateString('es-ES')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={stages.find((s) => s.id === selectedDeal.stage)?.label || selectedDeal.stage}
                      sx={{
                        bgcolor: stages.find((s) => s.id === selectedDeal.stage)?.color || '#9E9E9E',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                    {selectedDeal.probability && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Probabilidad: {selectedDeal.probability}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              {/* Timeline of Stages */}
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Progreso del Proceso
              </Typography>
              <Box sx={{ position: 'relative', mb: 4 }}>
                {stages.map((stage, index) => {
                  const isCompleted = getStageIndex(selectedDeal.stage) >= index;
                  const isCurrent = selectedDeal.stage === stage.id;
                  const stageDate = getStageDate(stage.id, index, selectedDeal, activities);
                  
                  return (
                    <Box
                      key={stage.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mb: 3,
                        position: 'relative',
                      }}
                    >
                      {/* Timeline Line */}
                      {index < stages.length - 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 16,
                            top: 40,
                            width: 2,
                            height: 60,
                            bgcolor: isCompleted
                              ? stage.color
                              : theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.1)',
                            zIndex: 0,
                          }}
                        />
                      )}
                      
                      {/* Stage Icon */}
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: isCompleted ? stage.color : 'transparent',
                          border: `2px solid ${isCompleted ? stage.color : theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                          mr: 2,
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                        )}
                      </Box>
                      
                      {/* Stage Info */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {stage.label}
                          </Typography>
                          {isCurrent && (
                            <Chip
                              label="Actual"
                              size="small"
                              sx={{
                                bgcolor: stage.color,
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                        {isCompleted && stageDate && (
                          <Typography variant="caption" color="text.secondary">
                            {index === 0 ? 'Iniciado' : isCurrent ? 'Última actualización' : 'Completado'}: {stageDate.toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: index === 0 || isCurrent ? '2-digit' : undefined,
                              minute: index === 0 || isCurrent ? '2-digit' : undefined,
                            })}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {/* Activities */}
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Actividades Relacionadas
              </Typography>
              {loadingActivities ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : activities.length === 0 ? (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA',
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No hay actividades registradas
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activities.map((activity) => (
                    <Paper
                      key={activity.id}
                      sx={{
                        p: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                        borderRadius: 2,
                        borderLeft: `4px solid ${getActivityColor(activity.type)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: getActivityColor(activity.type),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            {activity.subject}
                          </Typography>
                          {activity.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {activity.description.replace(/<[^>]*>/g, '').substring(0, 150)}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            {activity.User && (
                              <Typography variant="caption" color="text.secondary">
                                Por: {activity.User.firstName} {activity.User.lastName}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              • {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setHistoryModalOpen(false)}>Cerrar</Button>
          {selectedDeal && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                setHistoryModalOpen(false);
                handleOpen(selectedDeal);
              }}
              sx={{
                bgcolor: taxiMonterricoColors.green,
                '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
              }}
            >
              Editar Negocio
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pipeline;

