import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Snackbar,
  Alert,
  Divider,
  Tooltip,
  Link,
} from '@mui/material';
import {
  Download,
  People,
  AccountBalance,
  ShoppingCart,
  AttachMoney,
  Close,
  LocalOffer,
  Receipt,
  TrendingUp,
  TrendingDown,
  Groups,
  ArrowDropDown,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
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
      email: string;
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

interface Task {
  id: number;
  title: string;
  type?: string;
  status: string;
  dueDate?: string;
  priority?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [, setTasks] = useState<Task[]>([]);
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

  // Generar lista de años: año actual y 5 años anteriores
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
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
      
      const token = localStorage.getItem('token');
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
        deals: { total: 0, totalValue: 0, byStage: [], wonThisMonth: 0, wonValueThisMonth: 0 },
        tasks: { total: 0, byStatus: [] },
        campaigns: { total: 0, active: 0 },
        payments: { revenue: 0, monthly: [], budgets: [] },
        leads: { total: 0, converted: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, [fetchStats]);

  // Recargar estadísticas cuando cambia el año o mes seleccionado
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Obtener deals ganados diarios cuando se selecciona un mes
  useEffect(() => {
    const fetchDailyDeals = async () => {
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
  }, [selectedYear, selectedMonth]);




  const fetchTasks = async () => {
    try {
      console.log('📋 Iniciando fetchTasks...');
      const token = localStorage.getItem('token');
      console.log('📋 Token disponible para fetchTasks:', token ? 'Sí' : 'No');
      
      const response = await api.get('/tasks?limit=10');
      
      // Validar que la respuesta sea un array válido
      let tasksData: any[] = [];
      if (Array.isArray(response.data)) {
        tasksData = response.data;
      } else if (response.data?.tasks && Array.isArray(response.data.tasks)) {
        tasksData = response.data.tasks;
      } else if (response.data && typeof response.data === 'object') {
        // Si es un objeto pero no tiene la propiedad tasks, usar array vacío
        tasksData = [];
      }
      setTasks(tasksData.slice(0, 5)); // Limitar a 5 tareas para el dashboard
    } catch (error: any) {
      console.error('❌ Error fetching tasks:', error);
      console.error('❌ Error status:', error.response?.status);
      
      // Si es un error de autenticación, no hacer nada (el interceptor manejará la redirección)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('❌ Error de autenticación en fetchTasks');
        throw error; // Re-lanzar para que el interceptor lo maneje
      }
      
      setTasks([]);
    }
  };

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

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

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

  const handleDownloadSales = () => {
    if (!stats) {
      console.warn('No hay datos disponibles para descargar');
      return;
    }
    
    // Preparar datos para Excel
    let excelData: Array<{ [key: string]: string | number }> = [];
    
    // Si hay un mes seleccionado, mostrar datos diarios
    if (selectedMonth !== null) {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      // const monthName = monthNames[month]?.label || '';
      
      // Usar datos diarios si están disponibles
      if (dailyPayments.length > 0) {
        excelData = dailyPayments.map((item, index) => {
          // Calcular el monto del día individual (diferencia entre acumulados)
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
        // Si no hay datos diarios, generar estructura con días del mes
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        excelData = Array.from({ length: daysInMonth }, (_, i) => ({
          Día: `Día ${i + 1}`,
          Fecha: `${i + 1}/${month + 1}/${year}`,
          'Ventas del día': 0,
          'Ventas acumuladas': 0,
        }));
      }
    } else {
      // Si no hay mes seleccionado, mostrar datos mensuales
      const salesData = stats.payments?.monthly || [];
      
      if (salesData.length > 0) {
        excelData = salesData.map(item => ({
          Mes: item.month,
          Ventas: item.amount,
        }));
      } else {
        // Si no hay datos, generar estructura con meses del año seleccionado
        const year = parseInt(selectedYear);
        excelData = monthNames.map(month => ({
          Mes: `${month.label} ${year}`,
          Ventas: 0,
        }));
      }
    }
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar el ancho de las columnas
    if (selectedMonth !== null) {
      ws['!cols'] = [
        { wch: 10 }, // Día
        { wch: 15 }, // Fecha
        { wch: 18 }, // Ventas del día
        { wch: 18 }, // Ventas acumuladas
      ];
    } else {
      ws['!cols'] = [
        { wch: 25 }, // Mes
        { wch: 15 }, // Ventas
      ];
    }
    
    // Agregar la hoja de ventas al libro
    XLSX.utils.book_append_sheet(wb, ws, selectedMonth !== null ? 'Ventas Diarias' : 'Ventas');
    
    // Si hay un mes seleccionado, agregar segunda hoja con ventas por usuario
    if (selectedMonth !== null && stats.deals.userPerformance && stats.deals.userPerformance.length > 0) {
      // Preparar datos de ventas por usuario
      const userSalesData = stats.deals.userPerformance
        .filter(user => (user.wonDealsValue || 0) > 0) // Solo usuarios con ventas
        .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0)) // Ordenar por ventas descendente
        .map(user => ({
          Usuario: `${user.firstName} ${user.lastName}`,
          Email: user.email || '',
          'Deals ganados': user.wonDeals || 0,
          'Total vendido': user.wonDealsValue || 0,
        }));
      
      // Si no hay usuarios con ventas, agregar una fila indicando que no hay datos
      if (userSalesData.length === 0) {
        userSalesData.push({
          Usuario: 'Sin datos',
          Email: '',
          'Deals ganados': 0,
          'Total vendido': 0,
        });
      }
      
      // Crear hoja de ventas por usuario
      const wsUsers = XLSX.utils.json_to_sheet(userSalesData);
      
      // Ajustar el ancho de las columnas
      wsUsers['!cols'] = [
        { wch: 25 }, // Usuario
        { wch: 30 }, // Email
        { wch: 15 }, // Deals ganados
        { wch: 18 }, // Total vendido
      ];
      
      // Agregar la hoja de usuarios al libro
      XLSX.utils.book_append_sheet(wb, wsUsers, 'Ventas por Usuario');
    }
    
    // Nombre del archivo con año y mes si aplica
    const monthFilter = selectedMonth !== null 
      ? `_${monthNames[parseInt(selectedMonth)]?.label || ''}` 
      : '';
    const fileName = `ventas_${selectedYear}${monthFilter}.xlsx`;
    
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
        backgroundColor: '#c4d4d4', 
        minHeight: '100vh',
        px: { xs: 0, sm: 0, md: 0.25 },
        pt: { xs: 0.25, sm: 0.5, md: 1 },
        pb: 4,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 4 }}>
          Hola, {user?.firstName || 'Usuario'}
        </Typography>
        <Typography sx={{ color: theme.palette.text.secondary }}>No hay datos disponibles</Typography>
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
            color: '#4BC0C0',
          });
        }
        
        if (lostTotal > 0) {
          chartData.push({
            name: 'Perdidos',
            value: lostTotal,
            color: '#FF6384',
          });
        }
        
        // Agregar otras etapas (hasta completar 5 elementos totales)
        const remainingSlots = 5 - chartData.length;
        const sortedOtherStages = otherStages.sort((a, b) => b.count - a.count);
        sortedOtherStages.slice(0, remainingSlots).forEach((deal, index) => {
          chartData.push({
            name: getStageLabel(deal.stage),
            value: deal.count,
            color: ['#FFCE56', '#36A2EB', '#9966FF'][index % 3],
          });
        });
        
        console.log('Datos finales del gráfico:', chartData);
        
        return chartData.length > 0 ? chartData : [{ name: 'Sin datos', value: 1, color: '#E5E7EB' }];
      })()
    : [
        { name: 'Sin datos', value: 1, color: '#E5E7EB' }
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
  const weeklyBalance = stats.payments?.revenue || 0;
  const ordersInLine = stats.deals.total || 0;
  const newClients = stats.leads?.converted || stats.contacts.total || 0;
  
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

  // Calcular valores del Pipeline de Ventas
  const pipelineData = (() => {
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
      
      setBudgetValue((budgetToEdit / 1000).toFixed(0));
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
    const budgetAmount = parseFloat(budgetValue) * 1000; // Convertir de k a cantidad real
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

      {/* Tarjetas KPI con gradientes - Diseño compacto y equilibrado */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)', xl: 'repeat(5, 1fr)' }, 
        gap: { xs: 1, sm: 1.5, md: 2 }, 
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        {/* Monthly Budget */}
        <Card 
          onClick={canEditBudget ? handleBudgetCardClick : undefined}
          sx={{ 
            borderRadius: 2, 
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
              : '0 1px 3px rgba(0,0,0,0.1)',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.15)' 
              : '1px solid rgba(0, 0, 0, 0.15)',
            cursor: canEditBudget ? 'pointer' : 'default',
            '&:hover': canEditBudget ? {
              transform: { xs: 'none', md: 'translateY(-2px)' },
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 2px 6px rgba(0,0,0,0.15)',
            } : {},
          }}
        >
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: 2,
            }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AttachMoney 
                  sx={{ 
                    fontSize: 28,
                    color: '#2E7D32',
                  }} 
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#000000',
                    mb: 1.5,
                    fontSize: '1.5rem',
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
                    color: '#757575',
                  }}
                >
                  S/ {(monthlyBudget / 1000).toFixed(0)}k
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Weekly Balance */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
            : '0 1px 3px rgba(0,0,0,0.1)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 6px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: 2,
            }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AccountBalance 
                  sx={{ 
                    fontSize: 28,
                    color: '#2E7D32',
                  }} 
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#000000',
                    mb: 1.5,
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  Balance Semanal
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: '#757575',
                  }}
                >
                  S/ {(weeklyBalance / 1000).toFixed(0)}k
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Orders In Line */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
            : '0 1px 3px rgba(0,0,0,0.1)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 6px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: 2,
            }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LocalOffer 
                  sx={{ 
                    fontSize: 28,
                    color: '#2E7D32',
                  }} 
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#000000',
                    mb: 1.5,
                    fontSize: '1.5rem',
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
                    color: '#757575',
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
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
            : '0 1px 3px rgba(0,0,0,0.1)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          position: 'relative',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 6px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: 2,
            }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <People 
                  sx={{ 
                    fontSize: 28,
                    color: '#2E7D32',
                  }} 
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#000000',
                    mb: 1.5,
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  Nuevos Clientes
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                    color: '#757575',
                  }}
                >
                  {newClients}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Team KPI */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
            : '0 1px 3px rgba(0,0,0,0.1)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          position: 'relative',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.15)' 
            : '1px solid rgba(0, 0, 0, 0.15)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 6px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: 2,
            }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Groups 
                  sx={{ 
                    fontSize: 28,
                    color: '#2E7D32',
                  }} 
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#000000',
                    mb: 1.5,
                    fontSize: '1.5rem',
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
                      color: '#757575',
                    }}
                  >
                    {teamKPI.toFixed(1)}%
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 'auto',
                  }}>
                    {isKPIIncreasing ? (
                      <TrendingUp 
                        sx={{ 
                          fontSize: 20,
                          color: '#2E7D32',
                        }} 
                      />
                    ) : (
                      <TrendingDown 
                        sx={{ 
                          fontSize: 20,
                          color: '#D32F2F',
                        }} 
                      />
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: isKPIIncreasing ? '#2E7D32' : '#D32F2F',
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

      {/* Sección principal: Sales Chart y Pipeline de Ventas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1fr',
          lg: '1.5fr 1fr',
          xl: '1.5fr 1fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Sales Chart */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: { xs: 2, md: 3 },
              gap: { xs: 2, sm: 0 },
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                Ventas
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, md: 2 }, 
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' },
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                  >
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                  <Select
                    value={selectedMonth || 'all'}
                    onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : e.target.value)}
                    displayEmpty
                    sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                  >
                    <MenuItem value="all">Todos los meses</MenuItem>
                    {monthNames.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  endIcon={<Download sx={{ fontSize: { xs: 16, md: 18 } }} />}
                  onClick={handleDownloadSales}
                  sx={{ 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Descargar
                </Button>
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300 }, minHeight: { xs: 250, sm: 300 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={salesChartData}
                  margin={selectedMonth !== null ? { top: 5, right: 5, bottom: 0, left: 5 } : { top: 5, right: 5, bottom: 20, left: 5 }}
                >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey={selectedMonth !== null ? "day" : "month"} 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                  angle={selectedMonth !== null ? -45 : 0}
                  textAnchor={selectedMonth !== null ? "end" : "middle"}
                  height={selectedMonth !== null ? 50 : undefined}
                  dy={selectedMonth !== null ? 5 : undefined}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
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
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Presupuesto: S/ ${(selectedMonthBudget / 1000).toFixed(0)}k`, 
                      position: "right",
                      fill: "#10B981",
                      fontSize: 12,
                    }}
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fill="url(#colorSales)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#10B981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Pipeline de Ventas */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 1px 3px rgba(0,0,0,0.1)',
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 }, pb: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                Pipeline de Ventas
              </Typography>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                <ArrowDropDown />
              </IconButton>
            </Box>

            {/* Tres columnas con etapas */}
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : '#F5F5F0',
              borderRadius: 1,
              p: 2,
              mb: 3,
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                {/* Propuesta Económica */}
                <Box sx={{ flex: 1.2, px: { xs: 0, sm: 2 }, py: { xs: 1.5, sm: 0 }, textAlign: 'center' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      mb: 1,
                      fontWeight: 600,
                    }}
                  >
                    Propuesta Económica
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      color: theme.palette.text.primary,
                      mb: 0.5,
                    }}
                  >
                    S/ {pipelineData.propuestaEconomica.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                    }}
                  >
                    {pipelineData.propuestaEconomica.count} negocios
                  </Typography>
                </Box>

                <Divider 
                  orientation="vertical" 
                  flexItem 
                  sx={{ 
                    display: { xs: 'none', sm: 'block' },
                    mx: 1,
                    borderColor: theme.palette.divider,
                  }} 
                />

                {/* Negociación */}
                <Box sx={{ flex: 1, px: { xs: 0, sm: 2 }, py: { xs: 1.5, sm: 0 }, textAlign: 'center' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      mb: 1,
                      fontWeight: 600,
                    }}
                  >
                    Negociación
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      color: theme.palette.text.primary,
                      mb: 0.5,
                    }}
                  >
                    S/ {pipelineData.negociacion.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                    }}
                  >
                    {pipelineData.negociacion.count} negocios
                  </Typography>
                </Box>

                <Divider 
                  orientation="vertical" 
                  flexItem 
                  sx={{ 
                    display: { xs: 'none', sm: 'block' },
                    mx: 1,
                    borderColor: theme.palette.divider,
                  }} 
                />

                {/* Cierre Ganado */}
                <Box sx={{ flex: 1, px: { xs: 0, sm: 2 }, py: { xs: 1.5, sm: 0 }, textAlign: 'center' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      mb: 1,
                      fontWeight: 600,
                    }}
                  >
                    Cierre Ganado
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      color: theme.palette.text.primary,
                      mb: 0.5,
                    }}
                  >
                    S/ {pipelineData.cierreGanado.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                    }}
                  >
                    {pipelineData.cierreGanado.count} negocios
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Gráfico de barras horizontales */}
            <Box sx={{ mt: 3, mb: 0, pb: 0 }}>
              {/* Barra de Propuesta Económica */}
              <Tooltip
                title={`Propuesta Económica: S/ ${pipelineData.propuestaEconomica.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${pipelineData.propuestaEconomica.count} negocios)`}
                arrow
                placement="top"
              >
                <Box sx={{ mb: 1.5, cursor: 'pointer' }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 40, 
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : '#E0E0E0',
                  }}>
                    <Box
                      sx={{
                        width: pipelineData.total > 0 
                          ? `${(pipelineData.propuestaEconomica.value / pipelineData.total) * 100}%` 
                          : '0%',
                        bgcolor: '#2E7D32',
                        height: '100%',
                        minWidth: pipelineData.propuestaEconomica.value > 0 ? '2px' : '0',
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Tooltip>

              {/* Barra de Negociación */}
              <Tooltip
                title={`Negociación: S/ ${pipelineData.negociacion.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${pipelineData.negociacion.count} negocios)`}
                arrow
                placement="top"
              >
                <Box sx={{ mb: 1.5, cursor: 'pointer' }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 40, 
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : '#E0E0E0',
                  }}>
                    <Box
                      sx={{
                        width: pipelineData.total > 0 
                          ? `${(pipelineData.negociacion.value / pipelineData.total) * 100}%` 
                          : '0%',
                        bgcolor: '#4CAF50',
                        height: '100%',
                        minWidth: pipelineData.negociacion.value > 0 ? '2px' : '0',
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Tooltip>

              {/* Barra de Cierre Ganado */}
              <Tooltip
                title={`Cierre Ganado: S/ ${pipelineData.cierreGanado.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${pipelineData.cierreGanado.count} negocios)`}
                arrow
                placement="top"
              >
                <Box sx={{ mb: 0, cursor: 'pointer' }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 40, 
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : '#E0E0E0',
                  }}>
                    <Box
                      sx={{
                        width: pipelineData.total > 0 
                          ? `${(pipelineData.cierreGanado.value / pipelineData.total) * 100}%` 
                          : '0%',
                        bgcolor: '#81C784',
                        height: '100%',
                        minWidth: pipelineData.cierreGanado.value > 0 ? '2px' : '0',
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Tooltip>

              {/* Barra secundaria (total) */}
              <Tooltip
                title={`Total Pipeline: S/ ${pipelineData.total.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                arrow
                placement="top"
              >
                <Box sx={{ 
                  width: pipelineData.total > 0 ? '85%' : '0%', 
                  height: 24, 
                  borderRadius: 1,
                  bgcolor: '#C8E6C9',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }} />
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sección: Total de Ventas por Asesor (lg) y Distribución de Ventas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1fr',
          lg: '1fr 1fr',
          xl: '1fr 1fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Total de Ventas por Asesor - Solo visible para admin y jefe_comercial en lg */}
        {/* Visible solo en lg para estar al lado de Distribución de Ventas */}
        {(user?.role === 'admin' || user?.role === 'jefe_comercial') && (
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
          display: { xs: 'block', lg: 'block', xl: 'block' },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                fontSize: { xs: '1rem', md: '1.25rem' },
                mb: 2,
              }}
            >
              Total de Ventas por Asesor
            </Typography>
            {stats.deals.userPerformance && stats.deals.userPerformance.length > 0 ? (
              <>
                {/* Resumen del periodo */}
                {(() => {
                  const sortedUsers = [...stats.deals.userPerformance]
                    .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0));
                  const topUsers = sortedUsers.slice(0, 5);
                  const totalPeriod = sortedUsers.reduce((sum, user) => sum + (user.wonDealsValue || 0), 0);
                  const totalAdvisors = sortedUsers.length;
                  
                  return (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2,
                        flexWrap: 'wrap',
                        gap: 1,
                      }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: '0.875rem',
                            }}
                          >
                            Total del periodo: <strong style={{ color: theme.palette.text.primary }}>S/ {totalPeriod.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: '0.875rem',
                            }}
                          >
                            Asesores: <strong style={{ color: theme.palette.text.primary }}>{totalAdvisors}</strong>
                          </Typography>
                        </Box>
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => {
                            // Aquí puedes agregar la funcionalidad para ver todos
                            console.log('Ver todos los asesores');
                          }}
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Ver todos
                        </Link>
                      </Box>

                      {/* Lista de top 5 asesores */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {topUsers.map((user, index) => {
                          const rank = index + 1;
                          const maxValue = topUsers[0]?.wonDealsValue || 1;
                          const percentage = ((user.wonDealsValue || 0) / maxValue) * 100;
                          const avatarColors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
                          
                          return (
                            <Box 
                              key={user.userId}
                              sx={{
                                position: 'relative',
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: 'transparent',
                              }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1.5,
                                mb: 1,
                              }}>
                                {/* Número de ranking */}
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: rank === 1 ? '#FFF4E6' : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                    color: rank === 1 ? '#F59E0B' : theme.palette.text.secondary,
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  {rank}
                                </Box>

                                {/* Avatar */}
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: avatarColors[index % avatarColors.length],
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                  }}
                                >
                                  {getInitials(user.firstName, user.lastName)}
                                </Avatar>

                                {/* Nombre y ventas */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      color: theme.palette.text.primary,
                                      fontSize: '0.875rem',
                                      mb: 0.25,
                                    }}
                                  >
                                    {user.firstName} {user.lastName}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    {user.wonDeals || 0} {user.wonDeals === 1 ? 'venta' : 'ventas'}
                                  </Typography>
                                </Box>

                                {/* Monto */}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: theme.palette.text.primary,
                                    fontSize: '0.875rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  S/ {(user.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </Typography>
                              </Box>

                              {/* Barra de progreso */}
                              <Box sx={{ 
                                width: '100%', 
                                height: 6, 
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                              }}>
                                <Box
                                  sx={{
                                    width: `${percentage}%`,
                                    height: '100%',
                                    bgcolor: '#10B981',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  );
                })()}
              </>
            ) : (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textAlign: 'center',
                  py: 3,
                }}
              >
                No hay datos de ventas por asesor disponibles
              </Typography>
            )}
          </CardContent>
        </Card>
        )}

        {/* Sales Distribution */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary, 
                mb: { xs: 2, md: 3 },
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              Distribución de Ventas
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={salesDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, justifyContent: 'center' }}>
              {salesDistributionData.map((entry, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color }} />
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {entry.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sección inferior: Weekly Sales y Desempeño por Usuario */}
      {/* Verificar si el usuario tiene permisos para ver KPIs comerciales */}
      {(() => {
        const canViewCommercialKPIs = user?.role === 'admin' || user?.role === 'jefe_comercial';
        const gridCols = canViewCommercialKPIs 
          ? { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr', xl: '1fr 1fr' } 
          : { xs: '1fr', md: '1fr' };
        
        return (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: gridCols, 
            gap: { xs: 2, md: 3 } 
          }}>
        {/* Weekly Sales */}
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary, 
                mb: { xs: 2, md: 3 },
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              Ventas Semanales
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="week" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Desempeño por Usuario - Solo visible para admin y jefe_comercial */}
        {(user?.role === 'admin' || user?.role === 'jefe_comercial') && (
          <Card sx={{ 
            borderRadius: { xs: 3, md: 6 }, 
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : { xs: 1, md: 2 },
            bgcolor: theme.palette.background.paper,
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                KPI's Área Comercial
              </Typography>
              {stats.deals.userPerformance && stats.deals.userPerformance.length > 0 ? (
                <Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.deals.userPerformance.map((user) => ({
                          name: `${user.firstName} ${user.lastName}`,
                          value: user.performance,
                          percentage: user.performance,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(props: any) => {
                          const { name, percentage, cx, cy, midAngle, innerRadius, outerRadius } = props;
                          if (midAngle === undefined || innerRadius === undefined || outerRadius === undefined) {
                            return null;
                          }
                          const RADIAN = Math.PI / 180;
                          // Calcular posición fuera del círculo
                          const radius = outerRadius + 20; // 20px fuera del círculo
                          const xPos = cx + radius * Math.cos(-midAngle * RADIAN);
                          const yPos = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <text
                              x={xPos}
                              y={yPos}
                              fill={theme.palette.text.primary}
                              textAnchor={xPos > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={12}
                              fontWeight={600}
                            >
                              {name}: {percentage.toFixed(1)}%
                            </text>
                          );
                        }}
                        outerRadius={80}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.deals.userPerformance.map((user, index) => {
                          // Colores similares a la imagen: negro, dorado, teal
                          const colors = ['#1F2937', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
                          return (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          );
                        })}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => {
                          const numValue = typeof value === 'number' ? value : Number(value);
                          return numValue !== undefined && !isNaN(numValue) ? `${numValue.toFixed(1)}%` : '0%';
                        }}
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '8px',
                          padding: '8px',
                          color: theme.palette.text.primary,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    No hay datos de desempeño disponibles
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
          </Box>
        );
      })()}
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
          <Typography variant="h6" fontWeight={600}>
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
            label="Presupuesto (en miles)"
            type="number"
            fullWidth
            variant="outlined"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            disabled={savingBudget}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1, color: theme.palette.text.secondary }}>S/</Typography>,
              endAdornment: <Typography sx={{ ml: 1, color: theme.palette.text.secondary }}>k</Typography>,
            }}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            El monto se guardará en miles. Ejemplo: 10 = S/ 10,000
          </Typography>
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
