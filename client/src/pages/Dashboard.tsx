import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Snackbar,
  Alert,
  Popover,
} from '@mui/material';
import {
  Download,
  Close,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  Assessment,
  ArrowOutward,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { taxiMonterricoColors } from '../theme/colors';
import * as XLSX from 'xlsx';

interface DashboardStats {
  contacts: {
    total: number;
    byStage: Array<{ lifecycleStage: string; count: number }>;
  };
  companies: {
    total: number;
    byStage: Array<{ lifecycleStage: string; count: number }>;
  };
  deals: {
    total: number;
    totalValue: number;
    byStage: Array<{ stage: string; count: number; total: number }>;
    wonThisMonth: number;
    wonValueThisMonth: number;
    userPerformance?: Array<{
      userId: number;
      firstName: string;
      lastName: string;
      totalDeals: number;
      wonDeals: number;
      wonDealsValue?: number;
      performance: number;
    }>;
  };
  tasks: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  campaigns: {
    total: number;
    active: number;
  };
  payments?: {
    revenue: number;
    monthly: Array<{ month: string; amount: number }>;
    budgets?: Array<{ month: string; amount: number }>;
  };
  leads?: {
    total: number;
    converted: number;
  };
}

// Componente Tooltip personalizado para el gráfico de KPI
const CustomKPITooltip = ({ active, payload }: any) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const userName = data.name || '';
    const value = data.value || 0;
    // Obtener el color del segmento desde el payload (puede estar en diferentes ubicaciones)
    const segmentColor = payload[0].color || payload[0].fill || data.fill || data.color || taxiMonterricoColors.green;
    
    return (
      <Box
        sx={{
          backgroundColor: 
          theme.palette.mode === 'dark' 
            ?' rgba(18,18,18,0.85)'
            :' rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px', 
          boxShadow: 
            theme.palette.mode === 'dark'
            ? '0 4px 6px rgba(0, 0, 0, 0.5)'
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: segmentColor,
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 900, fontSize: '0.95rem' }}>
          {userName}: {typeof value === 'number' ? value.toFixed(1) : '0'}%
        </Typography>
      </Box>
    );
  }
  return null;
};

// Componente Tooltip personalizado para el gráfico de Distribución de Ventas
const CustomSalesDistributionTooltip = ({ active, payload }: any) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.name || '';
    const value = data.value || 0;
    // Obtener el color del segmento desde el payload
    const segmentColor = payload[0].color || payload[0].fill || data.color || data.fill || theme.palette.primary.main;
    
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.85)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 6px rgba(0, 0, 0, 0.5)'
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: segmentColor,
            flexShrink: 0,
          }}
        />
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 900, fontSize: '0.95rem' }}>
          {name}: {typeof value === 'number' ? value : '0'}
        </Typography>
      </Box>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // null = todos los meses (para Ventas)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetValue, setBudgetValue] = useState<string>('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [dailyPayments, setDailyPayments] = useState<any[]>([]);
  const [editingBudgetMonth, setEditingBudgetMonth] = useState<number | null>(null); // Mes que se está editando (null = mes actual)
  const [maximizedSalesDistribution, setMaximizedSalesDistribution] = useState(false);
  const [maximizedKPIArea, setMaximizedKPIArea] = useState(false);
  const [maximizedWeeklySales, setMaximizedWeeklySales] = useState(false);
  const [maximizedSales, setMaximizedSales] = useState(false);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLElement | null>(null);
  
  // Generar lista de meses
  const monthNames = [
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
  ];

  const fetchStats = useCallback(async () => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem('token');
    if (!user || !token) {
      console.log('⚠️ Usuario no autenticado, omitiendo fetchStats');
      setLoading(false);
      return;
    }

    try {
      console.log('📊 Iniciando fetchStats...');
      // Calcular fechas de inicio y fin según el año y mes seleccionado
      const year = parseInt(selectedYear);
      let startDate: Date;
      let endDate: Date;
      
      if (selectedMonth !== null) {
        // Si hay un mes seleccionado, filtrar solo ese mes
        const month = parseInt(selectedMonth);
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59); // Último día del mes
      } else {
        // Si no hay mes seleccionado, mostrar todo el año
        startDate = new Date(year, 0, 1); // 1 de enero
        endDate = new Date(year, 11, 31, 23, 59, 59); // 31 de diciembre
      }
      
      console.log('📊 Token disponible para fetchStats:', token ? 'Sí' : 'No');
      
      const response = await api.get('/dashboard/stats', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      
      // Validar que la respuesta sea un objeto JSON válido
      if (typeof response.data === 'string' && (response.data.includes('<!doctype') || response.data.includes('<!DOCTYPE'))) {
        throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica la configuración del proxy reverso.');
      }
      
      console.log('✅ Dashboard stats recibidos:', response.data);
      console.log('Deals por etapa:', response.data.deals?.byStage);
      
      // Validar que response.data sea un objeto antes de establecerlo
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        setStats(response.data);
      } else {
        throw new Error('Respuesta inválida del servidor: se esperaba un objeto JSON');
      }
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Si es un error 401/403, no inicializar con datos por defecto
      // Dejar que el interceptor maneje la redirección
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('❌ Error de autenticación en fetchStats, el interceptor manejará la redirección');
        throw error; // Re-lanzar para que el interceptor lo maneje
      }
      
      // Para otros errores, inicializar con datos por defecto
      setStats({
        contacts: { total: 0, byStage: [] },
        companies: { total: 0, byStage: [] },
        deals: { total: 0, totalValue: 0, byStage: [], wonThisMonth: 0, wonValueThisMonth: 0, userPerformance: [] },
        tasks: { total: 0, byStatus: [] },
        campaigns: { total: 0, active: 0 },
        payments: { revenue: 0, monthly: [], budgets: [] },
        leads: { total: 0, converted: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, user]);

  // Recargar estadísticas cuando cambia el año o mes seleccionado
  // NOTA: Este useEffect fue eliminado porque fetchStats() ya maneja esto
  // El useEffect de abajo (línea 450) llama a fetchStats() que tiene la misma lógica

  // Obtener deals ganados diarios cuando se selecciona un mes
  useEffect(() => {
    const fetchDailyDeals = async () => {
      // Verificar autenticación antes de hacer la llamada
      const token = localStorage.getItem('token');
      if (!user || !token) {
        console.log('⚠️ Usuario no autenticado, omitiendo fetchDailyDeals');
        return;
      }

      if (selectedMonth !== null) {
        try {
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0, 23, 59, 59);
          
          // Obtener todos los deals ganados (sin límite de paginación)
          const response = await api.get('/deals', {
            params: {
              stage: 'cierre_ganado',
              limit: 1000, // Obtener muchos deals para asegurar que no se pierdan datos
            },
          });
          
          // Filtrar deals ganados por fecha en el frontend
          const allDeals = response.data.deals || response.data || [];
          const filteredDeals = allDeals.filter((deal: any) => {
            // Verificar que sea deal ganado (por si acaso)
            const isWon = deal.stage === 'won' || deal.stage === 'closed won' || deal.stage === 'cierre_ganado';
            if (!isWon) return false;
            
            if (!deal.closeDate && !deal.updatedAt) return false;
            // Usar closeDate si existe, sino updatedAt
            const dealDate = deal.closeDate ? new Date(deal.closeDate) : new Date(deal.updatedAt);
            return dealDate >= startDate && dealDate <= endDate;
          });
          
          // Agrupar deals por día
          const dealsByDay: { [key: number]: number } = {};
          const daysInMonth = endDate.getDate();
          
          // Inicializar todos los días con 0
          for (let day = 1; day <= daysInMonth; day++) {
            dealsByDay[day] = 0;
          }

          // Agrupar deals ganados por día
          if (filteredDeals && filteredDeals.length > 0) {
            filteredDeals.forEach((deal: any) => {
              if (deal.amount) {
                // Usar closeDate si existe, sino updatedAt
                const dealDate = deal.closeDate ? new Date(deal.closeDate) : new Date(deal.updatedAt);
                const day = dealDate.getDate();
                if (day >= 1 && day <= daysInMonth) {
                  dealsByDay[day] = (dealsByDay[day] || 0) + parseFloat(deal.amount || 0);
                }
              }
            });
          }

          // Convertir a array para el gráfico con valores acumulativos
          let cumulativeValue = 0;
          const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            // Sumar el valor del día actual al acumulado
            cumulativeValue += dealsByDay[day] || 0;
            return {
              day: day.toString(),
              value: cumulativeValue,
            };
          });

          setDailyPayments(dailyData);
        } catch (error) {
          console.error('Error fetching daily payments:', error);
          // Si hay error, generar días vacíos
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          const endDate = new Date(year, month + 1, 0);
          const daysInMonth = endDate.getDate();
          setDailyPayments(Array.from({ length: daysInMonth }, (_, i) => ({
            day: (i + 1).toString(),
            value: 0,
          })));
        }
      } else {
        setDailyPayments([]);
      }
    };

    fetchDailyDeals();
  }, [selectedYear, selectedMonth, user]);




  useEffect(() => {
    // Solo hacer llamadas si el usuario está autenticado
    if (user) {
      fetchStats();
    }
  }, [fetchStats, user]);

  // const handleTaskToggle = async (taskId: number, currentStatus: string) => {
  //   try {
  //     const newStatus = currentStatus === 'completed' ? 'not started' : 'completed';
  //     await api.patch(`/tasks/${taskId}`, { status: newStatus });
  //     setTasks(tasks.map(task => 
  //       task.id === taskId ? { ...task, status: newStatus } : task
  //     ));
  //   } catch (error) {
  //     console.error('Error updating task:', error);
  //   }
  // };

  // const formatTime = (dateString?: string) => {
  //   if (!dateString) return '';
  //   const date = new Date(dateString);
  //   return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  // };

  // const getTaskTypeLabel = (type?: string) => {
  //   const types: { [key: string]: string } = {
  //     'todo': 'Programming',
  //     'call': 'Call',
  //     'email': 'Email',
  //     'meeting': 'Meeting',
  //     'note': 'Note',
  //   };
  //   return types[type || 'todo'] || 'Task';
  // };

  const handleDownloadDashboard = () => {
    if (!stats) {
      console.warn('No hay datos disponibles para descargar');
      return;
    }
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // 1. Hoja de KPIs
    const kpiData = [
      { Métrica: 'Presupuesto', Valor: `S/ ${monthlyBudget.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
      { Métrica: 'Órdenes en Línea', Valor: ordersInLine },
      { Métrica: 'Empresas', Valor: newCompanies },
      { Métrica: 'KPI Total Equipo', Valor: `${teamKPI.toFixed(1)}%` },
    ];
    const wsKPIs = XLSX.utils.json_to_sheet(kpiData);
    wsKPIs['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');
    
    // 2. Hoja de Distribución de Ventas
    const salesDistributionData = stats.deals.byStage && stats.deals.byStage.length > 0
      ? (() => {
          const normalizedStages = stats.deals.byStage.map((d: any) => ({
            stage: d.stage || d.stage,
            count: typeof d.count === 'string' ? parseInt(d.count, 10) : (d.count || 0),
            total: typeof d.total === 'string' ? parseFloat(d.total) : (d.total || 0),
          }));
          
          const wonStages = normalizedStages.filter(d => 
            ['won', 'closed won', 'cierre_ganado'].includes(d.stage)
          );
          const lostStages = normalizedStages.filter(d => 
            ['lost', 'closed lost', 'cierre_perdido'].includes(d.stage)
          );
          const otherStages = normalizedStages.filter(d => 
            !['won', 'closed won', 'cierre_ganado', 'lost', 'closed lost', 'cierre_perdido'].includes(d.stage)
          );
          
          const wonTotal = wonStages.reduce((sum, d) => sum + d.count, 0);
          const lostTotal = lostStages.reduce((sum, d) => sum + d.count, 0);
          
          const chartData: Array<{ Etapa: string; Cantidad: number; Valor: number }> = [];
          
          if (wonTotal > 0) {
            const wonValue = wonStages.reduce((sum, d) => sum + d.total, 0);
            chartData.push({ Etapa: 'Ganados', Cantidad: wonTotal, Valor: wonValue });
          }
          
          if (lostTotal > 0) {
            const lostValue = lostStages.reduce((sum, d) => sum + d.total, 0);
            chartData.push({ Etapa: 'Perdidos', Cantidad: lostTotal, Valor: lostValue });
          }
          
          const sortedOtherStages = otherStages.sort((a, b) => b.count - a.count);
          sortedOtherStages.slice(0, 5).forEach((deal) => {
            chartData.push({
              Etapa: getStageLabel(deal.stage),
              Cantidad: deal.count,
              Valor: deal.total,
            });
          });
          
          return chartData.length > 0 ? chartData : [{ Etapa: 'Sin datos', Cantidad: 0, Valor: 0 }];
        })()
      : [{ Etapa: 'Sin datos', Cantidad: 0, Valor: 0 }];
    
    const wsDistribution = XLSX.utils.json_to_sheet(salesDistributionData);
    wsDistribution['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDistribution, 'Distribución Ventas');
    
    // 3. Hoja de KPI's Área Comercial
    if (stats.deals.userPerformance && stats.deals.userPerformance.length > 0) {
      const kpiAreaData = stats.deals.userPerformance.map((user) => ({
        Usuario: `${user.firstName} ${user.lastName}`,
        'KPI (%)': user.performance.toFixed(1),
        'Deals Totales': user.totalDeals || 0,
        'Deals Ganados': user.wonDeals || 0,
        'Valor Ganado': user.wonDealsValue || 0,
      }));
      const wsKPIArea = XLSX.utils.json_to_sheet(kpiAreaData);
      wsKPIArea['!cols'] = [
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsKPIArea, 'KPIs Área Comercial');
    }
    
    // 4. Hoja de Ventas por Asesor
    if (stats.deals.userPerformance && stats.deals.userPerformance.length > 0) {
      const advisorsData = [...stats.deals.userPerformance]
        .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0))
        .map((user, index) => ({
          Ranking: index + 1,
          Usuario: `${user.firstName} ${user.lastName}`,
          'Ventas': user.wonDeals || 0,
          'Total Vendido': user.wonDealsValue || 0,
        }));
      const wsAdvisors = XLSX.utils.json_to_sheet(advisorsData);
      wsAdvisors['!cols'] = [
        { wch: 10 },
        { wch: 25 },
        { wch: 15 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsAdvisors, 'Ventas por Asesor');
    }
    
    // 5. Hoja de Ventas Semanales
    const weeklyData = weeklySalesData.map((item, index) => ({
      Semana: item.week,
      Valor: item.value,
    }));
    const wsWeekly = XLSX.utils.json_to_sheet(weeklyData);
    wsWeekly['!cols'] = [
      { wch: 15 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsWeekly, 'Ventas Semanales');
    
    // 6. Hoja de Pipeline de Ventas
    const pipelineDataForExport = (() => {
      const propuestaEconomica = stats.deals.byStage?.find(
        (d: any) => d.stage === 'propuesta_economica'
      ) || { total: 0, count: 0 };
      
      const negociacion = stats.deals.byStage?.find(
        (d: any) => d.stage === 'negociacion'
      ) || { total: 0, count: 0 };
      
      const cierreGanado = stats.deals.byStage?.find(
        (d: any) => d.stage === 'cierre_ganado' || d.stage === 'won' || d.stage === 'closed won'
      ) || { total: 0, count: 0 };
      
      const total = (propuestaEconomica.total || 0) + (negociacion.total || 0) + (cierreGanado.total || 0);
      
      return {
        propuestaEconomica: {
          value: typeof propuestaEconomica.total === 'number' ? propuestaEconomica.total : parseFloat(propuestaEconomica.total || 0),
          count: typeof propuestaEconomica.count === 'number' ? propuestaEconomica.count : parseInt(propuestaEconomica.count || 0),
        },
        negociacion: {
          value: typeof negociacion.total === 'number' ? negociacion.total : parseFloat(negociacion.total || 0),
          count: typeof negociacion.count === 'number' ? negociacion.count : parseInt(negociacion.count || 0),
        },
        cierreGanado: {
          value: typeof cierreGanado.total === 'number' ? cierreGanado.total : parseFloat(cierreGanado.total || 0),
          count: typeof cierreGanado.count === 'number' ? cierreGanado.count : parseInt(cierreGanado.count || 0),
        },
        total,
      };
    })();
    
    const pipelineExportData = [
      {
        Etapa: 'Propuesta Económica',
        Valor: pipelineDataForExport.propuestaEconomica.value,
        'Cantidad Negocios': pipelineDataForExport.propuestaEconomica.count,
      },
      {
        Etapa: 'Negociación',
        Valor: pipelineDataForExport.negociacion.value,
        'Cantidad Negocios': pipelineDataForExport.negociacion.count,
      },
      {
        Etapa: 'Cierre Ganado',
        Valor: pipelineDataForExport.cierreGanado.value,
        'Cantidad Negocios': pipelineDataForExport.cierreGanado.count,
      },
      {
        Etapa: 'Total Pipeline',
        Valor: pipelineDataForExport.total,
        'Cantidad Negocios': pipelineDataForExport.propuestaEconomica.count + pipelineDataForExport.negociacion.count + pipelineDataForExport.cierreGanado.count,
      },
    ];
    const wsPipeline = XLSX.utils.json_to_sheet(pipelineExportData);
    wsPipeline['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPipeline, 'Pipeline Ventas');
    
    // 7. Hoja de Ventas (gráfico de área)
    let salesData: Array<{ [key: string]: string | number }> = [];
    if (selectedMonth !== null && dailyPayments.length > 0) {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      salesData = dailyPayments.map((item, index) => {
        const previousValue = index > 0 ? (dailyPayments[index - 1].value || 0) : 0;
        const currentValue = item.value || 0;
        const dailyAmount = currentValue - previousValue;
        return {
          Día: `Día ${item.day}`,
          Fecha: `${item.day}/${month + 1}/${year}`,
          'Ventas del día': dailyAmount,
          'Ventas acumuladas': currentValue,
        };
      });
    } else {
      const salesMonthlyData = stats.payments?.monthly || [];
      if (salesMonthlyData.length > 0) {
        salesData = salesMonthlyData.map(item => ({
          Mes: item.month,
          Ventas: item.amount,
        }));
      }
    }
    
    if (salesData.length > 0) {
      const wsSales = XLSX.utils.json_to_sheet(salesData);
      if (selectedMonth !== null) {
        wsSales['!cols'] = [
          { wch: 10 },
          { wch: 15 },
          { wch: 18 },
          { wch: 18 },
        ];
      } else {
        wsSales['!cols'] = [
          { wch: 25 },
          { wch: 15 },
        ];
      }
      XLSX.utils.book_append_sheet(wb, wsSales, selectedMonth !== null ? 'Ventas Diarias' : 'Ventas Mensuales');
    }
    
    // Nombre del archivo
    const monthFilter = selectedMonth !== null 
      ? `_${monthNames[parseInt(selectedMonth)]?.label || ''}` 
      : '';
    const fileName = `dashboard_${selectedYear}${monthFilter}.xlsx`;
    
    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ 
        backgroundColor: theme.palette.background.default, 
        minHeight: '100vh',
        px: { xs: 0, sm: 0, md: 0.25 },
        pt: { xs: 0.25, sm: 0.5, md: 1 },
        pb: 4,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 4 }}>
          Hola, {user?.firstName || 'Usuario'}
        </Typography>
        <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 800 }}>No hay datos disponibles</Typography>
      </Box>
    );
  }

  // Preparar datos para gráficos
  const salesData = stats.payments?.monthly || [];
  const salesChartData = (() => {
    // Si hay un mes seleccionado, mostrar datos diarios
    if (selectedMonth !== null && dailyPayments.length > 0) {
      return dailyPayments;
    }
    
    // Si hay datos mensuales, usarlos
    if (salesData.length > 0) {
      return salesData.map(item => ({
        month: item.month.split(' ')[0].substring(0, 3),
        value: item.amount,
      }));
    }
    
    // Si hay un mes seleccionado pero no hay datos diarios aún, mostrar días vacíos
    if (selectedMonth !== null) {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const endDate = new Date(year, month + 1, 0);
      const daysInMonth = endDate.getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        day: (i + 1).toString(),
        value: 0,
      }));
    }
    
    // Si no hay mes seleccionado, mostrar los 12 meses del año
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(parseInt(selectedYear), i, 1);
      return {
        month: date.toLocaleString('es-ES', { month: 'short' }).substring(0, 3),
        value: 0,
      };
    });
  })();

  // Función para obtener el label de la etapa
  const getStageLabel = (stage: string) => {
    const stageLabels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacto': 'Contacto',
      'reunion_agendada': 'Reunión Agendada',
      'reunion_efectiva': 'Reunión Efectiva',
      'propuesta_economica': 'Propuesta económica',
      'negociacion': 'Negociación',
      'cierre_ganado': 'Cierre ganado',
      'cierre_perdido': 'Cierre perdido',
      'won': 'Ganados',
      'closed won': 'Ganados',
      'lost': 'Perdidos',
      'closed lost': 'Perdidos',
    };
    return stageLabels[stage] || stage;
  };

  // Datos para Sales Distribution (pie chart)
  // Priorizar etapas ganadas y perdidas, luego ordenar por cantidad
  const salesDistributionData = stats.deals.byStage && stats.deals.byStage.length > 0
    ? (() => {
        console.log('Procesando deals por etapa:', stats.deals.byStage);
        
        // Normalizar los datos - Sequelize puede devolver count como string o number
        const normalizedStages = stats.deals.byStage.map((d: any) => ({
          stage: d.stage || d.stage,
          count: typeof d.count === 'string' ? parseInt(d.count, 10) : (d.count || 0),
          total: typeof d.total === 'string' ? parseFloat(d.total) : (d.total || 0),
        }));
        
        console.log('Etapas normalizadas:', normalizedStages);
        
        // Separar etapas ganadas, perdidas y otras
        const wonStages = normalizedStages.filter(d => 
          ['won', 'closed won', 'cierre_ganado'].includes(d.stage)
        );
        const lostStages = normalizedStages.filter(d => 
          ['lost', 'closed lost', 'cierre_perdido'].includes(d.stage)
        );
        const otherStages = normalizedStages.filter(d => 
          !['won', 'closed won', 'cierre_ganado', 'lost', 'closed lost', 'cierre_perdido'].includes(d.stage)
        );
        
        console.log('Etapas ganadas:', wonStages);
        console.log('Etapas perdidas:', lostStages);
        console.log('Otras etapas:', otherStages);
        
        // Agregar etapas ganadas y perdidas agrupadas si existen
        const wonTotal = wonStages.reduce((sum, d) => sum + d.count, 0);
        const lostTotal = lostStages.reduce((sum, d) => sum + d.count, 0);
        
        console.log('Total ganados:', wonTotal);
        console.log('Total perdidos:', lostTotal);
        
        const chartData: Array<{ name: string; value: number; color: string }> = [];
        
        if (wonTotal > 0) {
          chartData.push({
            name: 'Ganados',
            value: wonTotal,
            color: taxiMonterricoColors.green,
          });
        }
        
        if (lostTotal > 0) {
          chartData.push({
            name: 'Perdidos',
            value: lostTotal,
            color: theme.palette.error.main,
          });
        }
        
        // Agregar otras etapas (hasta completar 5 elementos totales)
        const remainingSlots = 5 - chartData.length;
        const sortedOtherStages = otherStages.sort((a, b) => b.count - a.count);
        sortedOtherStages.slice(0, remainingSlots).forEach((deal, index) => {
          chartData.push({
            name: getStageLabel(deal.stage),
            value: deal.count,
            color: [taxiMonterricoColors.orange, theme.palette.primary.main, theme.palette.secondary.main][index % 3],
          });
        });
        
        console.log('Datos finales del gráfico:', chartData);
        
        return chartData.length > 0 ? chartData : [{ name: 'Sin datos', value: 1, color: theme.palette.grey[300] }];
      })()
    : [
        { name: 'Sin datos', value: 1, color: theme.palette.grey[300] }
      ];

  // Datos para Weekly Sales (últimas 7 semanas)
  const weeklySalesData = Array.from({ length: 7 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (6 - i) * 7);
    return {
      week: `Sem ${i + 1}`,
      value: Math.floor(Math.random() * 20000) + 10000, // Datos simulados
    };
  });

  // Calcular valores para las tarjetas KPI
  const ordersInLine = stats.deals.total || 0;
  const newCompanies = stats.companies.total || 0;
  
  // Calcular KPI total del equipo (promedio de performance)
  const teamKPI = stats.deals.userPerformance && stats.deals.userPerformance.length > 0
    ? stats.deals.userPerformance.reduce((sum, user) => sum + (user.performance || 0), 0) / stats.deals.userPerformance.length
    : 0;
  
  // Simular comparación con período anterior (en producción, esto debería venir del backend)
  // Por ahora, comparamos con un valor base o calculamos basado en ventas del mes anterior
  const previousTeamKPI = teamKPI * 0.95; // Simulación: 5% menos que el actual
  const kpiChange = teamKPI - previousTeamKPI;
  const kpiChangePercent = previousTeamKPI > 0 ? ((kpiChange / previousTeamKPI) * 100) : 0;
  const isKPIIncreasing = kpiChange >= 0;
  
  // Calcular presupuesto del mes actual
  const currentMonth = new Date().getMonth();
  const currentMonthNameForBudget = monthNames[currentMonth]?.label || '';
  const currentMonthAbbr = currentMonthNameForBudget.substring(0, 3) + '.';
  
  // Buscar el presupuesto del mes actual
  // Primero buscar en budgets (presupuestos guardados), luego en monthly como fallback
  const currentMonthAbbrLower = currentMonthNameForBudget.substring(0, 3).toLowerCase();
  const currentMonthNameLower = currentMonthNameForBudget.toLowerCase();
  
  let currentMonthData = stats.payments?.budgets?.find(item => {
    const monthStr = item.month.toLowerCase();
    return (monthStr.includes(currentMonthNameLower) || monthStr.includes(currentMonthAbbrLower)) &&
           monthStr.includes(currentYear.toString());
  });
  
  // Si no se encuentra en budgets, buscar en monthly (fallback)
  if (!currentMonthData) {
    currentMonthData = stats.payments?.monthly?.find(item => {
      const monthStr = item.month.toLowerCase();
      return (monthStr.includes(currentMonthNameLower) || monthStr.includes(currentMonthAbbrLower)) &&
             monthStr.includes(currentYear.toString());
    });
  }
  
  // Si no se encuentra con el año, buscar sin el año
  if (!currentMonthData) {
    currentMonthData = stats.payments?.budgets?.find(item => {
      const monthStr = item.month.toLowerCase();
      return monthStr.includes(currentMonthNameLower) || monthStr.includes(currentMonthAbbrLower);
    });
  }
  
  if (!currentMonthData) {
    currentMonthData = stats.payments?.monthly?.find(item => {
      const monthStr = item.month.toLowerCase();
      return monthStr.includes(currentMonthNameLower) || monthStr.includes(currentMonthAbbrLower);
    });
  }
  
  const monthlyBudget = currentMonthData?.amount || 0;

  // Calcular presupuesto del mes seleccionado (para mostrar en el gráfico)
  const selectedMonthBudget = selectedMonth !== null && (stats.payments?.budgets || stats.payments?.monthly)
    ? (() => {
        const monthIndex = parseInt(selectedMonth);
        const monthName = monthNames[monthIndex]?.label || '';
        const year = parseInt(selectedYear);
        
        // El backend formatea los meses como "nov 2025" (abreviado)
        // Pero también puede estar guardado como "Noviembre" o "Noviembre 2025"
        const monthAbbr = monthName.substring(0, 3).toLowerCase(); // "nov" para "Noviembre"
        const monthNameLower = monthName.toLowerCase();
        
        // Buscar primero en budgets (presupuestos guardados)
        let monthData = stats.payments?.budgets?.find(item => {
          const monthStr = item.month.toLowerCase();
          return (monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr)) &&
                 monthStr.includes(year.toString());
        });
        
        // Si no se encuentra en budgets, buscar en monthly (fallback)
        if (!monthData) {
          monthData = stats.payments?.monthly?.find(item => {
            const monthStr = item.month.toLowerCase();
            return (monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr)) &&
                   monthStr.includes(year.toString());
          });
        }
        
        // Si no se encuentra con el año, buscar sin el año
        if (!monthData) {
          monthData = stats.payments?.budgets?.find(item => {
            const monthStr = item.month.toLowerCase();
            return monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
          });
        }
        
        if (!monthData) {
          monthData = stats.payments?.monthly?.find(item => {
            const monthStr = item.month.toLowerCase();
            return monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
          });
        }
        
        const budget = monthData?.amount || 0;
        
        return budget;
      })()
    : 0;

  // Handler para abrir modal de edición de presupuesto
  const handleBudgetClick = (monthIndex: number | null = null) => {
    // Solo permitir edición a admin y jefe_comercial
    if (user?.role === 'admin' || user?.role === 'jefe_comercial') {
      const monthToEdit = monthIndex !== null ? monthIndex : currentMonth;
      setEditingBudgetMonth(monthIndex);
      
      // Obtener el presupuesto del mes a editar
      const monthName = monthNames[monthToEdit]?.label || '';
      const yearToEdit = monthIndex !== null ? parseInt(selectedYear) : new Date().getFullYear();
      const monthAbbr = monthName.substring(0, 3).toLowerCase();
      const monthNameLower = monthName.toLowerCase();
      
      // Buscar primero en budgets (presupuestos guardados)
      let monthData = stats.payments?.budgets?.find(item => {
        const monthStr = item.month.toLowerCase();
        const matchesMonth = monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
        const matchesYear = monthStr.includes(yearToEdit.toString());
        return matchesMonth && (matchesYear || !monthStr.match(/\d{4}/));
      });
      
      // Si no se encuentra en budgets, buscar en monthly (fallback)
      if (!monthData) {
        monthData = stats.payments?.monthly?.find(item => {
          const monthStr = item.month.toLowerCase();
          const matchesMonth = monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
          const matchesYear = monthStr.includes(yearToEdit.toString());
          return matchesMonth && (matchesYear || !monthStr.match(/\d{4}/));
        });
      }
      
      // Si no se encuentra con el año, buscar sin el año
      if (!monthData) {
        monthData = stats.payments?.budgets?.find(item => {
          const monthStr = item.month.toLowerCase();
          return monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
        });
      }
      
      if (!monthData) {
        monthData = stats.payments?.monthly?.find(item => {
          const monthStr = item.month.toLowerCase();
          return monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
        });
      }
      
      const budgetToEdit = monthData?.amount || 0;
      
      setBudgetValue(budgetToEdit.toString());
      setBudgetModalOpen(true);
    }
  };

  // Wrapper para manejar el click en la tarjeta de presupuesto (mes actual)
  const handleBudgetCardClick = () => {
    handleBudgetClick(null);
  };

  // Verificar si el usuario puede editar el presupuesto
  const canEditBudget = user?.role === 'admin' || user?.role === 'jefe_comercial';

  // Handler para guardar presupuesto
  const handleSaveBudget = async () => {
    const budgetAmount = parseFloat(budgetValue);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      setSuccessMessage('Por favor ingresa un monto válido');
      return;
    }

    setSavingBudget(true);
    try {
      // Determinar qué mes se está editando
      const monthToEdit = editingBudgetMonth !== null ? editingBudgetMonth : currentMonth;
      const yearToEdit = editingBudgetMonth !== null ? parseInt(selectedYear) : new Date().getFullYear();
      
      // Llamar al API para guardar el presupuesto
      const response = await api.post('/dashboard/budget', {
        month: monthToEdit,
        year: yearToEdit,
        amount: budgetAmount,
      });

      if (response.data.success) {
        // Recargar las estadísticas para obtener los presupuestos actualizados
        await fetchStats();
        
        setSuccessMessage('Presupuesto actualizado exitosamente');
        setBudgetModalOpen(false);
        setEditingBudgetMonth(null);
      } else {
        setSuccessMessage('Error al guardar el presupuesto');
      }
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      setSuccessMessage('Error al guardar el presupuesto');
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <>
      {/* Contenido principal en dos columnas */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, sm: 3, md: 4, lg: 8 },
        pb: { xs: 2, sm: 3, md: 4 },
      }}>
      {/* Columna Principal Izquierda */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
      {/* Título Dashboard con selector de meses */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: { xs: 1.5, sm: 2, md: 2.5 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: { xs: 2, sm: 3, md: -2 } }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              color: theme.palette.text.primary, 
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            HOLA, {user?.firstName?.toUpperCase() || 'USUARIO'}
          </Typography>
          <Box
            component="span"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              lineHeight: 1,
              display: 'inline-block',
              filter: 'none',
              color: 'inherit',
            }}
          >
            👋🏽
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', sm: 'auto' },
          mt: { xs: 2, sm: 3, md: 0 },
        }}>
          {/* Botón que abre el calendario de meses */}
          <IconButton
            size="small"
            onClick={(e) => setCalendarAnchorEl(e.currentTarget)}
            sx={{
              border: `1.5px solid ${taxiMonterricoColors.green}`,
              borderRadius: 1.5,
              color: taxiMonterricoColors.green,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: taxiMonterricoColors.greenDark,
                bgcolor: 'rgba(46, 125, 50, 0.08)',
                transform: 'scale(1.05)',
                boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
              },
            }}
          >
            <CalendarToday sx={{ fontSize: 22 }} />
          </IconButton>

          {/* Popover con el calendario de meses */}
          <Popover
            open={Boolean(calendarAnchorEl)}
            anchorEl={calendarAnchorEl}
            onClose={() => setCalendarAnchorEl(null)}
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
                minWidth: 320,
                maxWidth: 400,
                p: 2,
                mt: 1,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <IconButton
                size="small"
                onClick={() => {
                  const newYear = parseInt(selectedYear) - 1;
                  if (newYear >= 2025) {
                    setSelectedYear(newYear.toString());
                  }
                }}
                disabled={parseInt(selectedYear) <= 2025}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>
              <Typography 
                component="div" 
                onClick={() => {
                  setSelectedMonth(null);
                  setCalendarAnchorEl(null);
                }}
                sx={{ 
                  fontWeight: 800, 
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  '&:hover': {
                    color: taxiMonterricoColors.green,
                  },
                }}
              >
                {selectedYear}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  const newYear = parseInt(selectedYear) + 1;
                  if (newYear <= currentYear) {
                    setSelectedYear(newYear.toString());
                  }
                }}
                disabled={parseInt(selectedYear) >= currentYear}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>

            {/* Grid de meses (3 columnas x 4 filas) */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              {monthNames.map((month) => {
                const isSelected = selectedMonth === month.value;
                const isCurrentMonth = 
                  parseInt(month.value) === new Date().getMonth() && 
                  parseInt(selectedYear) === currentYear;
                
                return (
                  <Button
                    key={month.value}
                    variant={isSelected ? "contained" : "outlined"}
                    onClick={() => {
                      setSelectedMonth(month.value);
                      setCalendarAnchorEl(null);
                    }}
                    sx={{
                      minHeight: 48,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      bgcolor: isSelected ? taxiMonterricoColors.green : 'transparent',
                      color: isSelected ? 'white' : theme.palette.text.primary,
                      borderColor: isCurrentMonth && !isSelected 
                        ? taxiMonterricoColors.green 
                        : theme.palette.divider,
                      fontWeight: isCurrentMonth ? 800 : 700,
                      '&:hover': {
                        bgcolor: isSelected 
                          ? taxiMonterricoColors.greenDark 
                          : `${taxiMonterricoColors.green}0A`,
                        borderColor: taxiMonterricoColors.green,
                      },
                    }}
                  >
                    {month.label}
                  </Button>
                );
              })}
            </Box>
          </Popover>
          <IconButton
            size="small"
            onClick={handleDownloadDashboard}
            sx={{
              bgcolor: taxiMonterricoColors.green,
              color: 'white',
              borderRadius: 1,
              '&:hover': { 
                bgcolor: taxiMonterricoColors.greenDark 
              },
            }}
          >
            <Download sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Tarjetas KPI con gradientes - Diseño compacto y equilibrado */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(4, 1fr)' }, 
        gap: { xs: 1, sm: 1.5, md: 3 },
        mt: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        {/* Monthly Budget */}
        <Card 
          onClick={canEditBudget ? handleBudgetCardClick : undefined}
          sx={{ 
            minHeight: { xs: 140, sm: 160, md: 185 },
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(26, 174, 122, 0.15)'
              : '0 4px 20px rgba(26, 174, 122, 0.1)',
            bgcolor: theme.palette.mode === 'dark' 
              ? `${taxiMonterricoColors.green}1A`
              : `${taxiMonterricoColors.green}15`,
            color: theme.palette.mode === 'dark' 
              ? taxiMonterricoColors.greenLight
              : taxiMonterricoColors.greenDark,
            overflow: 'hidden',
            border: `1px solid rgba(26, 174, 122, 0.2)`,
            cursor: canEditBudget ? 'pointer' : 'default',
            position: 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${taxiMonterricoColors.greenLight} 0%, ${taxiMonterricoColors.green} 100%)`,
              transform: 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform 0.3s ease',
            },
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 40px rgba(26, 174, 122, 0.3)'
                : '0 12px 40px rgba(26, 174, 122, 0.2)',
              borderColor: taxiMonterricoColors.greenLight,
              '&::before': {
                transform: 'scaleX(1)',
              },
              '& .kpi-icon': {
                transform: 'scale(1.1) rotate(5deg)',
              },
            },
          }}
        >
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
            }}>
              {/* Contenido izquierdo (icono y texto) */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 5,
                flex: 1,
              }}>
                <Box
                  className="kpi-icon"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(26, 174, 122, 0.15) 0%, rgba(26, 174, 122, 0.05) 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(26, 174, 122, 0.2)',
                    fontSize: '36px',
                    lineHeight: 1,
                  }}
                >
                  💰
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.mode === 'dark' 
                        ? taxiMonterricoColors.greenLight
                        : taxiMonterricoColors.greenDark,
                      mb: 1.5,
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      lineHeight: 1.2,
                    }}
                  >
                    Presupuesto {currentMonthAbbr}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      fontSize: '1.5rem',
                      lineHeight: 1.2,
                      color: theme.palette.mode === 'dark' 
                        ? taxiMonterricoColors.greenLight
                        : taxiMonterricoColors.greenDark,
                    }}
                  >
                    S/ {monthlyBudget.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              </Box>

              {/* Gráfico a la derecha */}
              <Box sx={{ 
                width: { xs: 100, sm: 120, md: 140 },
                height: { xs: 60, sm: 70, md: 80 },
                position: 'absolute',
                right: { xs: 16, sm: 20, md: 24 },
                top: { xs: 16, sm: 20, md: 24 },
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { value: 20 },
                    { value: 35 },
                    { value: 50 },
                    { value: 45 },
                    { value: 60 },
                    { value: 55 },
                    { value: 70 },
                  ]}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={taxiMonterricoColors.greenLight} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Orders In Line */}
        <Card sx={{ 
          minHeight: { xs: 140, sm: 160, md: 185 },
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(129, 53, 230, 0.15)'
            : '0 4px 20px rgba(129, 53, 230, 0.1)',
          bgcolor: theme.palette.mode === 'dark' 
            ? `${theme.palette.secondary.main}1A`
            : `${theme.palette.secondary.main}15`,
          color: theme.palette.text.primary,
          overflow: 'hidden',
          border: `1px solid rgba(129, 53, 230, 0.2)`,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(129, 53, 230, 0.3)'
              : '0 12px 40px rgba(129, 53, 230, 0.2)',
            borderColor: theme.palette.secondary.main,
            '&::before': {
              transform: 'scaleX(1)',
            },
            '& .kpi-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
            }}>
              <Box
                className="kpi-icon"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(129, 53, 230, 0.15) 0%, rgba(129, 53, 230, 0.05) 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(129, 53, 230, 0.2)',
                  fontSize: '36px',
                  lineHeight: 1,
                }}
              >
                🏷️
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? theme.palette.secondary.light
                      : theme.palette.secondary.dark,
                    mb: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  Órdenes en Línea
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: theme.palette.mode === 'dark' 
                      ? theme.palette.secondary.light
                      : theme.palette.secondary.dark,
                  }}
                >
                  {ordersInLine}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card sx={{ 
          minHeight: { xs: 140, sm: 160, md: 185 },
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(235, 163, 22, 0.15)'
            : '0 4px 20px rgba(235, 163, 22, 0.1)',
          bgcolor: theme.palette.mode === 'dark' 
            ? `${taxiMonterricoColors.orange}1A`
            : `${taxiMonterricoColors.orange}15`,
          color: theme.palette.text.primary,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid rgba(235, 163, 22, 0.2)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${taxiMonterricoColors.orangeDark} 0%, ${taxiMonterricoColors.orange} 100%)`,
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(235, 163, 22, 0.3)'
              : '0 12px 40px rgba(235, 163, 22, 0.2)',
            borderColor: taxiMonterricoColors.orangeDark,
            '&::before': {
              transform: 'scaleX(1)',
            },
            '& .kpi-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
            }}>
              <Box
                className="kpi-icon"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(235, 163, 22, 0.15) 0%, rgba(235, 163, 22, 0.05) 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(235, 163, 22, 0.2)',
                  fontSize: '36px',
                  lineHeight: 1,
                }}
              >
                🏢
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? taxiMonterricoColors.orangeLight
                      : taxiMonterricoColors.orangeDark,
                    mb: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  Empresas
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: theme.palette.mode === 'dark' 
                      ? taxiMonterricoColors.orangeLight
                      : taxiMonterricoColors.orangeDark,
                  }}
                >
                  {newCompanies}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Team KPI */}
        <Card sx={{ 
          minHeight: { xs: 140, sm: 160, md: 185 },
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(239, 97, 65, 0.15)'
            : '0 4px 20px rgba(239, 97, 65, 0.1)',
          bgcolor: theme.palette.mode === 'dark' 
            ? `${theme.palette.error.main}1A`
            : `${theme.palette.error.main}15`,
          color: theme.palette.text.primary,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid rgba(239, 97, 65, 0.2)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(239, 97, 65, 0.3)'
              : '0 12px 40px rgba(239, 97, 65, 0.2)',
            borderColor: theme.palette.error.main,
            '&::before': {
              transform: 'scaleX(1)',
            },
            '& .kpi-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
            }}>
              <Box
                className="kpi-icon"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(239, 97, 65, 0.15) 0%, rgba(239, 97, 65, 0.05) 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(239, 97, 65, 0.2)',
                  fontSize: '36px',
                  lineHeight: 1,
                }}
              >
                👥
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? theme.palette.error.light
                      : theme.palette.error.dark,
                    mb: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  KPI Total Equipo
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      fontSize: '1.5rem',
                      lineHeight: 1.2,
                      color: theme.palette.mode === 'dark' 
                        ? theme.palette.error.light
                        : theme.palette.error.dark,
                    }}
                  >
                    {teamKPI.toFixed(1)}%
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 1,
                  }}>
                    {isKPIIncreasing ? (
                      <TrendingUp 
                        sx={{ 
                          fontSize: 20,
                          color: theme.palette.error.dark,
                        }} 
                      />
                    ) : (
                      <TrendingDown 
                        sx={{ 
                          fontSize: 20,
                          color: theme.palette.error.dark,
                        }} 
                      />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.875rem',
                        color: theme.palette.error.dark,
                        fontWeight: 800,
                      }}
                    >
                      {Math.abs(kpiChangePercent).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sección: Distribución de Ventas y Ventas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '0.72fr 1.5fr',
          lg: '0.72fr 1.5fr',
          xl: '0.72fr 1.5fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Sales Distribution */}
        <Card sx={{ 
            borderRadius: 3, 
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            minHeight: { xs: 400, sm: 480 },
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 40px rgba(16, 185, 129, 0.2)'
                : '0 12px 40px rgba(16, 185, 129, 0.15)',
              borderColor: taxiMonterricoColors.green,
              '&::before': {
                opacity: 1,
              },
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Distribución de Ventas
              </Typography>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximizedSalesDistribution(!maximizedSalesDistribution);
                }}
                sx={{ 
                  color: theme.palette.text.secondary,
                  padding: 1,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: taxiMonterricoColors.green,
                    color: taxiMonterricoColors.green,
                    transform: 'rotate(90deg)',
                  },
                  '& svg': {
                    fontSize: 18,
                  },
                }}
              >
                <ArrowOutward />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <defs>
                  {salesDistributionData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={salesDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  innerRadius={60}
                  fill={theme.palette.primary.main}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={2}
                >
                  {salesDistributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`} 
                      stroke={theme.palette.background.paper}
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomSalesDistributionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, justifyContent: 'center' }}>
              {salesDistributionData.map((entry, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color }} />
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 900, fontSize: '0.875rem' }}>
                    {entry.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          alignSelf: 'start',
          minHeight: { xs: 395, sm: 440 },
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(16, 185, 129, 0.2)'
              : '0 12px 40px rgba(16, 185, 129, 0.15)',
            borderColor: taxiMonterricoColors.green,
            '&::before': {
              opacity: 1,
            },
          },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, pt: { xs: 1.75, md: 2.25 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ventas
              </Typography>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximizedSales(!maximizedSales);
                }}
                sx={{ 
                  color: theme.palette.text.secondary,
                  padding: 1,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: taxiMonterricoColors.green,
                    color: taxiMonterricoColors.green,
                    transform: 'rotate(90deg)',
                  },
                  '& svg': {
                    fontSize: 18,
                  },
                }}
              >
                <ArrowOutward />
              </IconButton>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300 }, minHeight: { xs: 250, sm: 300 }, minWidth: 0, position:'relative'}}>
              <ResponsiveContainer width="100%" height={380} minHeight={250}>
                <AreaChart 
                  data={salesChartData}
                  margin={selectedMonth !== null ? { top: 5, right: 5, bottom: 0, left: -15 } : { top: 19, right: 5, bottom: 35, left: -15 }}
                >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={taxiMonterricoColors.green} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={taxiMonterricoColors.green} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={taxiMonterricoColors.green} stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={true} vertical={false} />
                <XAxis 
                  dataKey={selectedMonth !== null ? "day" : "month"} 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  angle={selectedMonth !== null ? -45 : 0}
                  textAnchor={selectedMonth !== null ? "end" : "middle"}
                  height={selectedMonth !== null ? 50 : 40}
                  dy={selectedMonth !== null ? 5 : 10}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value === 0) return '0';
                    const valueInK = value / 1000;
                    // Si es un número entero, mostrar sin decimales
                    if (valueInK % 1 === 0) {
                      return `${valueInK}k`;
                    }
                    // Si tiene decimales, mostrar con 1 decimal
                    return `${valueInK.toFixed(1)}k`;
                  }}
                  domain={selectedMonth !== null && selectedMonthBudget > 0 
                    ? [0, selectedMonthBudget * 1.1] 
                    : [0, 'dataMax']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => {
                    const numValue = typeof value === 'number' ? value : Number(value);
                    return numValue !== undefined && !isNaN(numValue) 
                      ? [`S/ ${numValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Ventas'] 
                      : ['', 'Ventas'];
                  }}
                  labelFormatter={(label: any) => selectedMonth !== null ? `Día ${label}` : label}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px',
                  }}
                />
                {selectedMonth !== null && selectedMonthBudget > 0 && (
                  <ReferenceLine 
                    y={selectedMonthBudget} 
                    stroke={taxiMonterricoColors.green} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Presupuesto: S/ ${selectedMonthBudget.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
                      position: "right",
                      fill: taxiMonterricoColors.green,
                      fontSize: 12,
                    }}
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={taxiMonterricoColors.green} 
                  strokeWidth={3}
                  fill="url(#colorSales)"
                  dot={false}
                  activeDot={{ 
                    r: 8, 
                    fill: taxiMonterricoColors.green,
                    stroke: theme.palette.common.white,
                    strokeWidth: 2,
                    filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))',
                  }}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sección: Pipeline de Ventas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1fr',
          lg: '1fr',
          xl: '1fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>

      </Box>

      {/* Sección: KPI's Área Comercial y Ventas Semanales */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1.5fr 1fr',
          lg: '1.5fr 1fr',
          xl: '2fr 1fr'   
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Ventas Semanales */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(16, 185, 129, 0.2)'
              : '0 12px 40px rgba(16, 185, 129, 0.15)',
            borderColor: taxiMonterricoColors.green,
            '&::before': {
              opacity: 1,
            },
          },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ventas Semanales
              </Typography>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximizedWeeklySales(!maximizedWeeklySales);
                }}
                sx={{ 
                  color: theme.palette.text.secondary,
                  padding: 1,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    borderColor: taxiMonterricoColors.green,
                    color: taxiMonterricoColors.green,
                    transform: 'rotate(90deg)',
                  },
                  '& svg': {
                    fontSize: 18,
                  },
                }}
              >
                <ArrowOutward />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={weeklySalesData}
                layout="vertical"
                margin={{ top: 5, right: 30, bottom: -10, left: 0 }}
                barCategoryGap="80%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={true} vertical={true} />
                <XAxis 
                  type="number" 
                  stroke={theme.palette.text.secondary}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="week" 
                  stroke={theme.palette.text.secondary} 
                  width={60}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip 
                  trigger="hover"
                  shared={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && payload[0] && payload[0].value !== undefined && payload[0].value !== null) {
                      const value = payload[0].value as number;
                      if (isNaN(value)) return null;
                      return (
                        <Box
                          sx={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            padding: 1.5,
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                              : '0 2px 8px rgba(0, 0, 0, 0.15)',
                            minWidth: 140,
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: '0.875rem',
                              fontWeight: 900,
                              mb: 0.5,
                            }}
                          >
                            {label}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: theme.palette.secondary.main,
                                fontSize: '1.125rem',
                                fontWeight: 800,
                              }}
                            >
                              S/ {value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={30}>
                  {weeklySalesData.map((entry, index) => {
                    const colors = [
                      taxiMonterricoColors.green,
                      theme.palette.error.main,
                      theme.palette.secondary.main,
                      taxiMonterricoColors.orange,
                      theme.palette.primary.main,
                      taxiMonterricoColors.greenLight,
                      taxiMonterricoColors.orangeDark
                    ];
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Desempeño por Usuario */}
        <Card sx={{ 
            borderRadius: 3, 
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 40px rgba(16, 185, 129, 0.2)'
                : '0 12px 40px rgba(16, 185, 129, 0.15)',
              borderColor: taxiMonterricoColors.green,
              '&::before': {
                opacity: 1,
              },
            },
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1,
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.text.primary, 
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  KPI's Área Comercial
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMaximizedKPIArea(!maximizedKPIArea);
                  }}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    padding: 1,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                      transform: 'rotate(90deg)',
                    },
                    '& svg': {
                      fontSize: 18,
                    },
                  }}
                >
                  <ArrowOutward />
                </IconButton>
              </Box>
              {(() => {
                // Asegurar que siempre tengamos un array válido
                const userPerformance = (stats?.deals?.userPerformance && Array.isArray(stats.deals.userPerformance)) 
                  ? stats.deals.userPerformance 
                  : [];
                const hasData = userPerformance.length > 0;
                
                if (hasData) {
                  return (
                    <Box>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <defs>
                            {(() => {
                              const colors = [
                                taxiMonterricoColors.greenLight,
                                taxiMonterricoColors.green,
                                taxiMonterricoColors.greenDark,
                                theme.palette.primary.main,
                                theme.palette.primary.dark,
                                taxiMonterricoColors.greenLight,
                              ];
                              return userPerformance.map((user, index) => (
                                <linearGradient key={`kpi-gradient-${index}`} id={`kpi-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={1} />
                                  <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity={0.7} />
                                </linearGradient>
                              ));
                            })()}
                          </defs>
                          {(() => {
                            // Colores en tonos verdes/teal
                            const colors = [
                              taxiMonterricoColors.greenLight,
                              taxiMonterricoColors.green,
                              taxiMonterricoColors.greenDark,
                              theme.palette.primary.main,
                              theme.palette.primary.dark,
                              taxiMonterricoColors.greenLight,
                            ];
                            return (
                              <Pie
                                data={userPerformance.map((user, index) => ({
                                  name: `${user.firstName} ${user.lastName}`,
                                  value: user.performance,
                                  percentage: user.performance,
                                  fill: colors[index % colors.length],
                                }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={130}
                                innerRadius={90}
                                fill={theme.palette.primary.main}
                                dataKey="value"
                                stroke="none"
                                paddingAngle={2}
                              >
                                {userPerformance.map((user, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={`url(#kpi-gradient-${index})`} 
                                    stroke={theme.palette.background.paper}
                                    strokeWidth={2}
                                    style={{
                                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                                      transition: 'all 0.2s ease',
                                    }}
                                  />
                                ))}
                              </Pie>
                            );
                          })()}
                          <RechartsTooltip content={<CustomKPITooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  );
                }
                
                // Siempre mostrar el icono cuando no hay datos
                return (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 6,
                    minHeight: 300,
                    width: '100%',
                  }}>
                    <Assessment 
                      sx={{ 
                        fontSize: 80, 
                        color: theme.palette.text.disabled,
                        opacity: 0.3,
                        mb: 2,
                      }} 
                    />
                  </Box>
                );
              })()}
            </CardContent>
          </Card>

      </Box>

      </Box>

      </Box>
      
      {/* Modal de edición de presupuesto */}
      <Dialog
        open={budgetModalOpen}
        onClose={() => {
          if (!savingBudget) {
            setBudgetModalOpen(false);
            setEditingBudgetMonth(null);
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
          borderRadius: 2, 
          bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
        }}>
          <Typography component="div" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
            Editar Presupuesto {editingBudgetMonth !== null 
              ? monthNames[editingBudgetMonth]?.label.substring(0, 3) + '.' 
              : currentMonthAbbr}
          </Typography>
          <IconButton
            onClick={() => setBudgetModalOpen(false)}
            disabled={savingBudget}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Presupuesto"
            type="number"
            fullWidth
            variant="outlined"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            disabled={savingBudget}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 800 }}>S/</Typography>,
            }}
              sx={{ 
              mt: 2,
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setBudgetModalOpen(false)}
            disabled={savingBudget}
            sx={{ color: theme.palette.text.secondary }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveBudget}
            variant="contained"
            disabled={savingBudget || !budgetValue || parseFloat(budgetValue) < 0}
            sx={{
              bgcolor: taxiMonterricoColors.green,
              '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
            }}
          >
            {savingBudget ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal Fullscreen - Distribución de Ventas */}
      <Dialog
        open={maximizedSalesDistribution}
        onClose={() => setMaximizedSalesDistribution(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}>
          <Typography 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '1.25rem', md: '1.75rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Distribución de Ventas
          </Typography>
          <IconButton
            onClick={() => setMaximizedSalesDistribution(false)}
            sx={{
              color: theme.palette.text.secondary,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                borderColor: taxiMonterricoColors.green,
                color: taxiMonterricoColors.green,
                transform: 'rotate(90deg)',
              },
            }}
          >
            <ArrowOutward sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <ResponsiveContainer width="100%" height={600}>
            <PieChart>
              <defs>
                {salesDistributionData.map((entry, index) => (
                  <linearGradient key={`gradient-fullscreen-${index}`} id={`gradient-fullscreen-${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={salesDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                innerRadius={80}
                fill={theme.palette.primary.main}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {salesDistributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-fullscreen-${index})`} 
                    stroke={theme.palette.background.paper}
                    strokeWidth={2}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomSalesDistributionTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 4, justifyContent: 'center' }}>
            {salesDistributionData.map((entry, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: entry.color }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 900, fontSize: '1.1rem' }}>
                  {entry.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal Fullscreen - KPI's Área Comercial */}
      <Dialog
        open={maximizedKPIArea}
          onClose={() => setMaximizedKPIArea(false)}
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.default,
            },
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2,
          }}>
            <Typography 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '1.25rem', md: '1.75rem' },
                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              KPI's Área Comercial
            </Typography>
            <IconButton
              onClick={() => setMaximizedKPIArea(false)}
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                  transform: 'rotate(90deg)',
                },
              }}
            >
              ✖️
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            {(() => {
              const userPerformance = (stats?.deals?.userPerformance && Array.isArray(stats.deals.userPerformance)) 
                ? stats.deals.userPerformance 
                : [];
              
              if (userPerformance.length === 0) {
                return (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 12,
                    minHeight: 600,
                    width: '100%',
                  }}>
                    <Assessment 
                      sx={{ 
                        fontSize: 120, 
                        color: theme.palette.text.disabled,
                        opacity: 0.3,
                        mb: 2,
                      }} 
                    />
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 900 }}>
                      No hay datos disponibles
                    </Typography>
                  </Box>
                );
              }
              
              return (
                <Box>
                  <ResponsiveContainer width="100%" height={700}>
                    <PieChart>
                      <defs>
                        {(() => {
                          const colors = [
                            taxiMonterricoColors.greenLight,
                            taxiMonterricoColors.green,
                            taxiMonterricoColors.greenDark,
                            theme.palette.primary.main,
                            theme.palette.primary.dark,
                            taxiMonterricoColors.greenLight,
                          ];
                          return userPerformance.map((user, index) => (
                            <linearGradient key={`kpi-fullscreen-gradient-${index}`} id={`kpi-fullscreen-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={1} />
                              <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity={0.7} />
                            </linearGradient>
                          ));
                        })()}
                      </defs>
                      {(() => {
                        // Colores en tonos verdes/teal
                        const colors = [
                          taxiMonterricoColors.greenLight,
                          taxiMonterricoColors.green,
                          taxiMonterricoColors.greenDark,
                          theme.palette.primary.main,
                          theme.palette.primary.dark,
                          taxiMonterricoColors.greenLight,
                        ];
                        return (
                          <Pie
                            data={userPerformance.map((user, index) => ({
                              name: `${user.firstName} ${user.lastName}`,
                              value: user.performance,
                              percentage: user.performance,
                              fill: colors[index % colors.length],
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={260}
                            innerRadius={190}
                            fill={theme.palette.primary.main}
                            dataKey="value"
                            stroke="none"
                            paddingAngle={2}
                          >
                            {userPerformance.map((user, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#kpi-fullscreen-gradient-${index})`} 
                                stroke={theme.palette.background.paper}
                                strokeWidth={2}
                                style={{
                                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            ))}
                          </Pie>
                        );
                      })()}
                      <RechartsTooltip content={<CustomKPITooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              );
            })()}
          </DialogContent>
        </Dialog>

      {/* Modal Fullscreen - Ventas Semanales */}
      <Dialog
        open={maximizedWeeklySales}
        onClose={() => setMaximizedWeeklySales(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.default,
          },
        }}
      > 
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}>
          <Typography 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '1.25rem', md: '1.75rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ventas Semanales
          </Typography>
          <IconButton
            onClick={() => setMaximizedWeeklySales(false)}
            sx={{
              color: theme.palette.text.secondary,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                borderColor: taxiMonterricoColors.green,
                color: taxiMonterricoColors.green,
                transform: 'rotate(90deg)',
              },
            }}
          >
            <ArrowOutward sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart 
              data={weeklySalesData}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 20, left: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={true} vertical={true} />
              <XAxis 
                type="number" 
                stroke={theme.palette.text.secondary}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="week" 
                stroke={theme.palette.text.secondary} 
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip 
                trigger="hover"
                shared={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && payload[0] && payload[0].value !== undefined && payload[0].value !== null) {
                    const value = payload[0].value as number;
                    if (isNaN(value)) return null;
                    return (
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          padding: 2,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.15)',
                          minWidth: 160,
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '1rem',
                            fontWeight: 900,
                            mb: 0.75,
                          }}
                        >
                          {label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: theme.palette.secondary.main,
                              fontSize: '1.25rem',
                              fontWeight: 800,
                            }}
                          >
                            S/ {value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                {weeklySalesData.map((entry, index) => {
                  const colors = [
                    taxiMonterricoColors.green,
                    theme.palette.error.main,
                    theme.palette.secondary.main,
                    taxiMonterricoColors.orange,
                    theme.palette.primary.main,
                    taxiMonterricoColors.greenLight,
                    taxiMonterricoColors.orangeDark
                  ];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DialogContent>
      </Dialog>

      {/* Modal Fullscreen - Ventas */}
      <Dialog
        open={maximizedSales}
        onClose={() => setMaximizedSales(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}>
          <Typography 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '1.25rem', md: '1.75rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ventas
          </Typography>
          <IconButton
            onClick={() => setMaximizedSales(false)}
            sx={{
              color: theme.palette.text.secondary,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                borderColor: taxiMonterricoColors.green,
                color: taxiMonterricoColors.green,
                transform: 'rotate(90deg)',
              },
            }}
          >
            <ArrowOutward sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ width: '100%', height: 600, minHeight: 600, minWidth: 0, position:'relative'}}>
            <ResponsiveContainer width="100%" height={600} minHeight={600}>
              <AreaChart 
                data={salesChartData}
                margin={selectedMonth !== null ? { top: 5, right: 5, bottom: 0, left: 5 } : { top: 5, right: 5, bottom: 35, left: 5 }}
              >
                <defs>
                  <linearGradient id="colorSalesFullscreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={taxiMonterricoColors.green} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={taxiMonterricoColors.green} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={taxiMonterricoColors.green} stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glowFullscreen">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={true} vertical={false} />
                <XAxis 
                  dataKey={selectedMonth !== null ? "day" : "month"} 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  angle={selectedMonth !== null ? -45 : 0}
                  textAnchor={selectedMonth !== null ? "end" : "middle"}
                  height={selectedMonth !== null ? 50 : 40}
                  dy={selectedMonth !== null ? 5 : 10}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value === 0) return '0';
                    const valueInK = value / 1000;
                    if (valueInK % 1 === 0) {
                      return `${valueInK}k`;
                    }
                    return `${valueInK.toFixed(1)}k`;
                  }}
                  domain={selectedMonth !== null && selectedMonthBudget > 0 
                    ? [0, selectedMonthBudget * 1.1] 
                    : [0, 'dataMax']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => {
                    const numValue = typeof value === 'number' ? value : Number(value);
                    return numValue !== undefined && !isNaN(numValue) 
                      ? [`S/ ${numValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Ventas'] 
                      : ['', 'Ventas'];
                  }}
                  labelFormatter={(label: any) => selectedMonth !== null ? `Día ${label}` : label}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '8px',
                  }}
                />
                {selectedMonth !== null && selectedMonthBudget > 0 && (
                  <ReferenceLine 
                    y={selectedMonthBudget} 
                    stroke={taxiMonterricoColors.green} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Presupuesto: S/ ${selectedMonthBudget.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
                      position: "right",
                      fill: taxiMonterricoColors.green,
                      fontSize: 12,
                    }}
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={taxiMonterricoColors.green} 
                  strokeWidth={3}
                  fill="url(#colorSalesFullscreen)"
                  dot={false}
                  activeDot={{ 
                    r: 8, 
                    fill: taxiMonterricoColors.green,
                    stroke: theme.palette.common.white,
                    strokeWidth: 2,
                    filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))',
                  }}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </DialogContent>
      </Dialog>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;
