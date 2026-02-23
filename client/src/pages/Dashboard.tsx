import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
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
} from '@mui/material';
import {
  Close,
  TrendingUp,
  TrendingDown,
  Assessment,
  ArrowOutward,
} from '@mui/icons-material';
import { Calendar } from 'primereact/calendar';
import { addLocale, locale } from 'primereact/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faTags, faBuilding, faPeopleGroup, faFileExport } from '@fortawesome/free-solid-svg-icons';
import ReactApexChart from 'react-apexcharts';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
import { pageStyles } from '../theme/styles';
import { useAuth } from '../context/AuthContext';
import { taxiMonterricoColors } from '../theme/colors';
import { formatCurrencyPE, formatCurrencyPEDecimals } from '../utils/currencyUtils';
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
  const dashboardCardBg = theme.palette.mode === 'light' ? '#fafafa' : '#1c252ea6';
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
  // Valor para PrimeReact Calendar (mes/año): null = Todo el año
  const periodDate = selectedMonth !== null
    ? new Date(parseInt(selectedYear), parseInt(selectedMonth), 1)
    : null;

  // Locale español para PrimeReact Calendar (meses y botones)
  useEffect(() => {
    addLocale('es', {
      firstDayOfWeek: 0,
      dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
      dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      today: 'Hoy',
      clear: 'Limpiar',
    });
    locale('es');
  }, []);

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
      { Métrica: 'Presupuesto', Valor: formatCurrencyPE(monthlyBudget) },
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
        
        // Paleta distinta por categoría para que Ganados, Reunión Efectiva, etc. no se confundan
        const otherStagesPalette = [
          taxiMonterricoColors.orange,
          taxiMonterricoColors.teal,
          '#7C4DFF', // violeta
          '#0288D1', // azul
          taxiMonterricoColors.orangeDark,
        ];
        
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
        
        // Agregar otras etapas (hasta 5 elementos) con colores distintos
        const remainingSlots = 5 - chartData.length;
        const sortedOtherStages = otherStages.sort((a, b) => b.count - a.count);
        sortedOtherStages.slice(0, remainingSlots).forEach((deal, index) => {
          chartData.push({
            name: getStageLabel(deal.stage),
            value: deal.count,
            color: otherStagesPalette[index % otherStagesPalette.length],
          });
        });
        
        console.log('Datos finales del gráfico:', chartData);
        
        return chartData.length > 0 ? chartData : [{ name: 'Sin datos', value: 1, color: theme.palette.grey[300] }];
      })()
    : [
        { name: 'Sin datos', value: 1, color: theme.palette.grey[300] }
      ];

  // Opciones para el gráfico donut (Distribución de Ventas) — espaciado entre segmentos
  const strokeGapColor = theme.palette.background.paper;
  const salesDistributionChartOptions = {
    chart: {
      type: 'donut' as const,
      background: 'transparent',
    },
    stroke: {
      show: true,
      width: 3,
      colors: [strokeGapColor],
    },
    labels: salesDistributionData.map((d) => d.name),
    colors: salesDistributionData.map((d) => d.color),
    legend: { show: false },
    dataLabels: { enabled: true },
    plotOptions: {
      pie: {
        distributed: true,
        stroke: { width: 3, colors: [strokeGapColor] },
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: { show: true },
          },
        },
      },
    },
    theme: {
      mode: theme.palette.mode as 'light' | 'dark',
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
        },
      },
    ],
  };

  const salesDistributionChartSeries = salesDistributionData.map((d) => d.value);

  // KPI's Área Comercial — polar area (datos por usuario)
  const kpiAreaUserPerformance = (stats?.deals?.userPerformance && Array.isArray(stats.deals.userPerformance))
    ? stats.deals.userPerformance
    : [];
  const kpiAreaChartSeries = kpiAreaUserPerformance.map((u) => u.performance ?? 0);
  const kpiAreaChartLabels = kpiAreaUserPerformance.map((u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Usuario');
  const kpiAreaChartColors = [
    taxiMonterricoColors.greenLight,
    taxiMonterricoColors.green,
    taxiMonterricoColors.greenDark,
    theme.palette.primary.main,
    theme.palette.primary.dark,
    taxiMonterricoColors.orange,
    taxiMonterricoColors.teal,
    '#7C4DFF',
    '#0288D1',
  ];
  const kpiAreaChartOptions = {
    chart: {
      type: 'polarArea' as const,
      background: 'transparent',
    },
    labels: kpiAreaChartLabels,
    colors: kpiAreaChartLabels.map((_, i) => kpiAreaChartColors[i % kpiAreaChartColors.length]),
    stroke: {
      colors: [theme.palette.mode === 'dark' ? '#fff' : 'rgba(0,0,0,0.08)'],
      width: 1,
    },
    fill: { opacity: 1, type: 'solid' as const },
    plotOptions: {
      polarArea: {
        rings: {
          strokeWidth: 1,
          strokeColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        },
        spokes: {
          strokeWidth: 1,
          connectorColors: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        },
      },
    },
    legend: { position: 'bottom' as const, horizontalAlign: 'center' as const },
    theme: { mode: theme.palette.mode as 'light' | 'dark' },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' as const },
        },
      },
    ],
  };

  // Datos para Weekly Sales: solo últimas 5 semanas (al conectar datos reales, usar .slice(-5) para que vaya corriendo)
  const weeklySalesData = Array.from({ length: 5 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (4 - i) * 7);
    return {
      week: `Sem ${i + 1}`,
      value: Math.floor(Math.random() * 20000) + 10000, // Datos simulados
    };
  });

  // Gráfico de barras horizontales - Ventas Semanales (ApexCharts)
  const weeklySalesChartSeries = [{ name: 'Ventas', data: weeklySalesData.map((d) => d.value) }];
  const weeklySalesChartColors = [
    taxiMonterricoColors.green,
    taxiMonterricoColors.greenLight,
    taxiMonterricoColors.greenDark,
    taxiMonterricoColors.greenEmerald,
    taxiMonterricoColors.teal,
  ];
  const weeklySalesChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 400,
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        distributed: true,
        horizontal: true,
        barHeight: '75%',
        borderRadius: 8,
        dataLabels: { position: 'bottom' as const },
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start' as const,
      style: {
        colors: [theme.palette.mode === 'dark' ? '#fff' : '#304758'],
      },
      formatter: (_val: number, opts: { w: { globals: { labels: string[] } }; dataPointIndex: number }) =>
        opts.w.globals.labels[opts.dataPointIndex],
      offsetX: 0,
      dropShadow: { enabled: false },
    },
    colors: weeklySalesChartColors,
    xaxis: {
      categories: weeklySalesData.map((d) => d.week),
      labels: {
        style: { colors: theme.palette.text.secondary },
        formatter: (val: number) => (val === 0 ? '0' : val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: theme.palette.mode,
      x: { show: false },
      y: {
        title: {
          formatter: (_: string, opts: { w: { globals: { labels: string[] } }; dataPointIndex: number }) =>
            opts.w.globals.labels[opts.dataPointIndex],
        },
        formatter: (val: number) => formatCurrencyPE(val),
      },
    },
    legend: { show: false },
    states: {
      active: {
        filter: { type: 'darken' as const, value: 1 },
      },
    },
    theme: { mode: theme.palette.mode as 'light' | 'dark' },
  };

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
  
  // Buscar el presupuesto del mes actual solo en budgets (meta), no en ventas realizadas
  const currentMonthAbbrLower = currentMonthNameForBudget.substring(0, 3).toLowerCase();
  const currentMonthNameLower = currentMonthNameForBudget.toLowerCase();
  
  let currentMonthData = stats.payments?.budgets?.find(item => {
    const monthStr = item.month.toLowerCase();
    return (monthStr.includes(currentMonthNameLower) || monthStr.includes(currentMonthAbbrLower)) &&
           monthStr.includes(currentYear.toString());
  });
  
  if (!currentMonthData) {
    currentMonthData = stats.payments?.budgets?.find(item => {
      const monthStr = item.month.toLowerCase();
      return monthStr.includes(currentMonthNameLower) || monthStr.includes(currentMonthAbbrLower);
    });
  }
  
  const monthlyBudget = currentMonthData?.amount ?? 0;

  // Calcular presupuesto del mes seleccionado (solo desde budgets = meta, no ventas)
  const selectedMonthBudget = selectedMonth !== null && stats.payments?.budgets
    ? (() => {
        const monthIndex = parseInt(selectedMonth);
        const monthName = monthNames[monthIndex]?.label || '';
        const year = parseInt(selectedYear);
        const monthAbbr = monthName.substring(0, 3).toLowerCase();
        const monthNameLower = monthName.toLowerCase();
        
        let monthData = stats.payments?.budgets?.find(item => {
          const monthStr = item.month.toLowerCase();
          return (monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr)) &&
                 monthStr.includes(year.toString());
        });
        
        if (!monthData) {
          monthData = stats.payments?.budgets?.find(item => {
            const monthStr = item.month.toLowerCase();
            return monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
          });
        }
        
        return monthData?.amount ?? 0;
      })()
    : 0;

  // Gráfico de barras de Ventas por meses (o por días si hay mes seleccionado)
  const safeSalesChartData = Array.isArray(salesChartData) ? salesChartData : [];
  const salesChartApexCategories = selectedMonth !== null
    ? safeSalesChartData.map((d) => (d as { day: string }).day ?? '')
    : safeSalesChartData.map((d) => (d as { month: string }).month ?? '');
  const salesChartApexSeries = [{ name: 'Ventas', data: safeSalesChartData.map((d) => (d?.value ?? 0)) }];
  const salesChartApexOptions = {
    chart: {
      type: 'bar' as const,
      height: 460,
      background: 'transparent',
      toolbar: { show: false },
    },
    fill: { opacity: 1, type: 'solid' as const },
    plotOptions: {
      bar: {
        borderRadius: 10,
        dataLabels: { position: 'top' as const },
      },
    },
    states: {
      normal: { filter: { type: 'none' as const } },
      hover: { filter: { type: 'none' as const } },
      active: { filter: { type: 'none' as const } },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatCurrencyPE(val),
      offsetY: -52,
      style: {
        fontSize: '12px',
        colors: [theme.palette.mode === 'dark' ? '#E5E7EB' : '#304758'],
      },
    },
    xaxis: {
      categories: salesChartApexCategories,
      position: 'top' as const,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: theme.palette.text.secondary },
        offsetY: -8,
      },
    },
    yaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        show: false,
        formatter: (val: number) => formatCurrencyPE(val),
      },
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      padding: { top: 10, left: 0, right: 0, bottom: 0 },
    },
    tooltip: {
      theme: theme.palette.mode,
      y: { formatter: (val: number) => formatCurrencyPEDecimals(val) },
    },
    legend: { show: false },
    colors: [theme.palette.mode === 'dark' ? '#E5AC03' : '#FFD54F'],
    theme: { mode: theme.palette.mode as 'light' | 'dark' },
    stroke: { show: false, width: 0 },
    ...(selectedMonth !== null &&
      selectedMonthBudget > 0 && {
        annotations: {
          yaxis: [
            {
              y: selectedMonthBudget,
              borderColor: taxiMonterricoColors.green,
              strokeDashArray: 5,
              borderWidth: 2,
              label: {
                show: true,
                borderColor: taxiMonterricoColors.green,
                style: { color: theme.palette.text.primary, background: theme.palette.background.paper },
                text: `Presupuesto: ${formatCurrencyPE(selectedMonthBudget)}`,
                position: 'right' as const,
              },
            },
          ],
        },
      }),
  };

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
      
      // Solo presupuestos guardados (meta), no ventas realizadas
      let monthData = stats.payments?.budgets?.find(item => {
        const monthStr = item.month.toLowerCase();
        const matchesMonth = monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
        const matchesYear = monthStr.includes(yearToEdit.toString());
        return matchesMonth && (matchesYear || !monthStr.match(/\d{4}/));
      });
      
      if (!monthData) {
        monthData = stats.payments?.budgets?.find(item => {
          const monthStr = item.month.toLowerCase();
          return monthStr.includes(monthNameLower) || monthStr.includes(monthAbbr);
        });
      }
      
      const budgetToEdit = monthData?.amount ?? 0;
      
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
    <Box sx={{ bgcolor: theme.palette.mode === 'light' ? '#f2f2f2' : undefined, minHeight: '100%', py: 2 }}>
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
              fontWeight: 600, 
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary, 
              fontSize: { xs: '1.35rem', sm: '1.6rem', md: '2.00rem' },
              letterSpacing: '0.02em',
            }}
          >
            Hola, {user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase() : 'Usuario'}
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', sm: 'auto' },
          mt: { xs: 2, sm: 3, md: 0 },
        }}>
          {/* Selector de periodo con PrimeReact Calendar (month picker) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Calendar
              value={periodDate}
              onChange={(e) => {
                const v = e.value as Date | null;
                if (v) {
                  setSelectedYear(v.getFullYear().toString());
                  setSelectedMonth(v.getMonth().toString());
                } else {
                  setSelectedMonth(null);
                  setSelectedYear(currentYear.toString());
                }
              }}
              view="month"
              dateFormat="mm/yy"
              showButtonBar
              showIcon={false}
              minDate={new Date(2025, 0, 1)}
              maxDate={new Date(currentYear, 11, 31)}
              placeholder="Todo el año"
              locale="es"
              inputClassName="p-inputtext-sm"
              style={{ width: '100%', minWidth: 140 }}
            />
          </Box>
          <Button
            size="small"
            startIcon={<FontAwesomeIcon icon={faFileExport} style={{ fontSize: 16 }} />}
            onClick={handleDownloadDashboard}
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
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            minHeight: { xs: 140, sm: 160, md: 185 },
            cursor: canEditBudget ? 'pointer' : 'default',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: 'relative', bgcolor: dashboardCardBg }}>
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
                <FontAwesomeIcon 
                  icon={faCoins} 
                  style={{
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.main : "#1aae7a",
                    fontSize: 36,
                  }} 
                />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? 'white' : '#004B50',
                      mb: 1.5,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    Presupuesto {currentMonthAbbr}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '1.5rem',
                      lineHeight: 1.2,
                      color: theme.palette.mode === 'dark' ? 'white' : '#004B50',
                    }}
                  >
                    {formatCurrencyPE(monthlyBudget)}
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
                minWidth: 0,
                minHeight: 0,
              }}>
                <ResponsiveContainer width={140} height={80}>
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
                      stroke="#1aae7a" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Orders In Line */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            minHeight: { xs: 140, sm: 160, md: 185 },
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: 'relative', bgcolor: dashboardCardBg }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
            }}>
              <FontAwesomeIcon 
                icon={faTags} 
                style={{
                  color: "#8135e6",
                  fontSize: 36,
                }} 
              />
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'white' : '#27097a',
                    mb: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  Órdenes en Línea
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: theme.palette.mode === 'dark' ? 'white' : '#27097a',
                  }}
                >
                  {ordersInLine}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* New Clients */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            minHeight: { xs: 140, sm: 160, md: 185 },
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: 'relative', bgcolor: dashboardCardBg }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
            }}>
              <FontAwesomeIcon 
                icon={faBuilding} 
                style={{
                  color: "#eba316",
                  fontSize: 36,
                }} 
              />
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'white' : '#944100',
                    mb: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  Empresas
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: theme.palette.mode === 'dark' ? 'white' : '#944100',
                  }}
                >
                  {newCompanies}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Team KPI */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            minHeight: { xs: 140, sm: 160, md: 185 },
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: 'relative', bgcolor: dashboardCardBg }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 5,
            }}>
              <FontAwesomeIcon 
                icon={faPeopleGroup} 
                style={{
                  color: "#ef6141",
                  fontSize: 36,
                }} 
              />
              <Box sx={{ textAlign: 'left' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'white' : '#b24930',
                    mb: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 600,
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
                      fontWeight: 600, 
                      fontSize: '1.5rem',
                      lineHeight: 1.2,
                      color: theme.palette.mode === 'dark' ? 'white' : '#b24930',
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
                          color: theme.palette.success.main,
                        }} 
                      />
                    ) : (
                      <TrendingDown 
                        sx={{ 
                          fontSize: 20,
                          color: theme.palette.error.main,
                        }} 
                      />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.875rem',
                        color: isKPIIncreasing ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 600,
                      }}
                    >
                      {Math.abs(kpiChangePercent).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Sección: Distribución de Ventas y Ventas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '0.85fr 1.35fr',
          lg: '0.85fr 1.35fr',
          xl: '0.85fr 1.35fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Sales Distribution - mismo componente y estilos que Reportes */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            minHeight: { xs: 400, sm: 480 },
            display: 'flex',
            flexDirection: 'column',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: dashboardCardBg, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 4,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary, 
                  fontSize: { xs: '1rem', md: '1.25rem' },
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
                  '& svg': {
                    fontSize: 18,
                  },
                }}
              >
                <ArrowOutward />
              </IconButton>
            </Box>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '& [class*="apexcharts"]': { background: 'transparent !important' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
                <ReactApexChart
                  options={salesDistributionChartOptions}
                  series={salesDistributionChartSeries}
                  type="donut"
                  height={300}
                  width={1000}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, justifyContent: 'center' }}>
                {salesDistributionData.map((entry, index) => (
                  <Box key={`${entry.name}-${entry.color}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="span"
                      sx={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0 }}
                      style={{ backgroundColor: entry.color }}
                    />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.85rem' }}>
                      {entry.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Sales Chart */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            alignSelf: 'start',
            minHeight: { xs: 505, sm: 460 },
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, md: 2.5 }, pt: { xs: 1.75, md: 2.25 }, bgcolor: dashboardCardBg }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
                  fontSize: { xs: '1rem', md: '1.25rem' },
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
                  '& svg': {
                    fontSize: 18,
                  },
                }}
              >
                <ArrowOutward />
              </IconButton>
            </Box>
            <Box sx={{ width: '100%', height: 400, minWidth: 0 }}>
              {salesChartApexSeries[0]?.data && (
                <ReactApexChart
                  options={salesChartApexOptions}
                  series={salesChartApexSeries}
                  type="bar"
                  height={400}
                  width="100%"
                />
              )}
            </Box>
          </Box>
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
          md: '1.4fr 1.25fr',
          lg: '1.4fr 1.25fr',
          xl: '1.65fr 1.25fr'   
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Ventas Semanales */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: dashboardCardBg }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary, 
                  fontSize: { xs: '1rem', md: '1.25rem' },
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
                  '& svg': {
                    fontSize: 18,
                  },
                }}
              >
                <ArrowOutward />
              </IconButton>
            </Box>
            <Box sx={{ width: '100%', height: 400 }}>
              <ReactApexChart
                options={weeklySalesChartOptions}
                series={weeklySalesChartSeries}
                type="bar"
                height={400}
                width="100%"
              />
            </Box>
          </Box>
        </Card>

        {/* Desempeño por Usuario */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            overflow: 'hidden',
            bgcolor: dashboardCardBg,
            border: 'none',
            transition: 'all 0.3s ease',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: dashboardCardBg }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1,
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary, 
                    fontSize: { xs: '1rem', md: '1.25rem' },
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
                    '& svg': {
                      fontSize: 18,
                    },
                  }}
                >
                  <ArrowOutward />
                </IconButton>
              </Box>
              {kpiAreaChartSeries.length > 0 ? (
                <Box sx={{ width: '100%', height: 400, pt:3, }}>
                  <ReactApexChart
                    options={kpiAreaChartOptions}
                    series={kpiAreaChartSeries}
                    type="polarArea"
                    height={360}
                    width="100%"
                  />
                </Box>
              ) : (
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
              )}
          </Box>
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
            borderRadius: 4,
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.6)'
              : '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
            '&::before': {
              display: 'none',
              content: '""',
            },
            '&::after': {
              display: 'none',
              content: '""',
            },
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent',
          borderBottom: theme.palette.mode === 'dark' 
            ? `1px solid rgba(255, 255, 255, 0.08)` 
            : `1px solid ${theme.palette.divider}`,
        }}>
          <Typography component="div" sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#4BB280' }}>
            Editar Presupuesto {editingBudgetMonth !== null 
              ? monthNames[editingBudgetMonth]?.label.substring(0, 3) + '.' 
              : currentMonthAbbr}
          </Typography>
          <IconButton
            onClick={() => setBudgetModalOpen(false)}
            disabled={savingBudget}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : theme.palette.action.hover,
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent',
          pt: 3,
        }}>
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
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.background.paper,
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.12)' 
                    : theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: 2,
                },
              },
              '& .MuiInputLabel-root': {
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.7)' 
                  : theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: taxiMonterricoColors.green,
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
              },
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
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={() => setBudgetModalOpen(false)}
            disabled={savingBudget}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveBudget}
            variant="contained"
            disabled={savingBudget || !budgetValue || parseFloat(budgetValue) < 0}
            sx={pageStyles.saveButton}
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
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
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
                color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
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
            {kpiAreaChartSeries.length > 0 ? (
              <Box sx={{ width: '100%', height: 700 }}>
                <ReactApexChart
                  options={kpiAreaChartOptions}
                  series={kpiAreaChartSeries}
                  type="polarArea"
                  height={700}
                  width="100%"
                />
              </Box>
            ) : (
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
            )}
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
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
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
          <Box sx={{ width: '100%', height: 600 }}>
            <ReactApexChart
              options={{ ...weeklySalesChartOptions, chart: { ...weeklySalesChartOptions.chart, height: 600 } }}
              series={weeklySalesChartSeries}
              type="bar"
              height={600}
              width="100%"
            />
          </Box>
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
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
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
                      ? [formatCurrencyPEDecimals(numValue), 'Ventas'] 
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
                      value: `Presupuesto: ${formatCurrencyPE(selectedMonthBudget)}`, 
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
    </Box>
  );
};

export default Dashboard;
