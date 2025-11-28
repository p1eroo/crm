import React, { useEffect, useState } from 'react';
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
  Link,
  Avatar,
  Checkbox,
  IconButton,
  CircularProgress as MUICircularProgress,
  Divider,
  Menu,
  InputBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Download,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  AccountCircle,
  Search,
  People,
  AccountBalance,
  ShoppingCart,
  AttachMoney,
  Close,
} from '@mui/icons-material';
import {
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
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
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // null = todos los meses (para Ventas)
  const [calendarSelectedMonth, setCalendarSelectedMonth] = useState<string | null>(new Date().getMonth().toString()); // Para Calendario (mes actual por defecto)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [allTasksWithDates, setAllTasksWithDates] = useState<Task[]>([]);
  const [calendarModalDate, setCalendarModalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null); // Día seleccionado en el calendario principal
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

  useEffect(() => {
    fetchStats();
    fetchTasks();
    fetchAllTasksWithDates();
  }, []);

  const fetchAllTasksWithDates = async () => {
    try {
      // Obtener tareas desde /tasks
      const tasksResponse = await api.get('/tasks?limit=1000');
      const tasksFromTasks = (tasksResponse.data.tasks || tasksResponse.data || []).map((task: Task) => ({
        ...task,
        isActivity: false,
      }));

      // Obtener actividades de tipo 'task' desde /activities
      try {
        const activitiesResponse = await api.get('/activities', {
          params: { type: 'task' },
        });
        const tasksFromActivities = (activitiesResponse.data.activities || activitiesResponse.data || []).map((activity: any) => ({
          id: activity.id,
          title: activity.subject || activity.description || 'Sin título',
          type: activity.type,
          status: 'not started',
          priority: 'medium',
          dueDate: activity.dueDate,
          isActivity: true,
        }));

        // Combinar ambas listas
        const allTasks = [...tasksFromTasks, ...tasksFromActivities];
        // Filtrar solo tareas que tienen dueDate
        const tasksWithDates = allTasks.filter((task: Task) => task.dueDate);
        setAllTasksWithDates(tasksWithDates);
      } catch (activitiesError) {
        // Si falla obtener actividades, usar solo tareas
        const tasksWithDates = tasksFromTasks.filter((task: Task) => task.dueDate);
        setAllTasksWithDates(tasksWithDates);
      }
    } catch (error) {
      console.error('Error fetching tasks with dates:', error);
      setAllTasksWithDates([]);
    }
  };

  // Recargar estadísticas cuando cambia el año o mes seleccionado
  useEffect(() => {
    fetchStats();
  }, [selectedYear, selectedMonth]);

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

  // Recargar tareas cuando cambia el mes en el modal del calendario
  useEffect(() => {
    if (calendarModalOpen) {
      fetchAllTasksWithDates();
    }
  }, [calendarModalDate, calendarModalOpen]);

  const fetchStats = async () => {
    try {
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
      
      const response = await api.get('/dashboard/stats', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      console.log('Dashboard stats recibidos:', response.data);
      console.log('Deals por etapa:', response.data.deals?.byStage);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Inicializar con datos por defecto para que el dashboard se muestre
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
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks?limit=10');
      const tasksData = response.data.tasks || response.data || [];
      setTasks(tasksData.slice(0, 5)); // Limitar a 5 tareas para el dashboard
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const handleTaskToggle = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'not started' : 'completed';
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getTaskTypeLabel = (type?: string) => {
    const types: { [key: string]: string } = {
      'todo': 'Programming',
      'call': 'Call',
      'email': 'Email',
      'meeting': 'Meeting',
      'note': 'Note',
    };
    return types[type || 'todo'] || 'Task';
  };

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
      const monthName = monthNames[month]?.label || '';
      
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
        backgroundColor: theme.palette.background.default, 
        minHeight: '100vh',
        px: { xs: 3, sm: 6, md: 8 },
        pt: { xs: 4, sm: 6, md: 6 },
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

  // Generar calendario para el calendario principal (izquierda) - mes completo
  const calendarMonth = calendarDate.getMonth();
  const calendarYear = calendarDate.getFullYear();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Ajustar para que lunes sea 0 (getDay() devuelve 0=domingo, 1=lunes, etc.)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convierte domingo=0 a lunes=0

  const calendarDaysMain = [];
  // Días vacíos al inicio
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDaysMain.push(null);
  }
  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDaysMain.push(i);
  }

  // Generar calendario para el calendario derecho - solo una semana
  const today = new Date();
  const currentDay = today.getDate();
  
  // Obtener el primer día de la semana actual (lunes = 0)
  const firstDayOfWeekRight = new Date(calendarYear, calendarMonth, currentDay);
  const dayOfWeek = (firstDayOfWeekRight.getDay() + 6) % 7; // Convierte domingo=0 a lunes=0
  firstDayOfWeekRight.setDate(currentDay - dayOfWeek);
  
  // Generar los 7 días de la semana
  const calendarDaysRight = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeekRight);
    date.setDate(firstDayOfWeekRight.getDate() + i);
    const dayOfWeekIndex = (date.getDay() + 6) % 7; // Convierte domingo=0 a lunes=0
    calendarDaysRight.push({
      day: date.getDate(),
      dayOfWeek: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][dayOfWeekIndex],
      isCurrentMonth: date.getMonth() === calendarMonth,
    });
  }

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };


  // Array de nombres de meses para el calendario
  const monthNamesArray = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthName = monthNamesArray[calendarMonth];

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.default, 
      minHeight: '100vh',
      px: { xs: 1.5, sm: 3, md: 6, lg: 8 },
      pt: { xs: 2, sm: 3, md: 4, lg: 6 },
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Header con Hello y Profile */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: { xs: 2, sm: 2.5, md: 3 },
        gap: { xs: 2, sm: 0 },
      }}>
        {/* Saludo */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary, 
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            mr: { xs: 0, sm: 3 },
          }}
        >
          Hola, {user?.firstName || 'Usuario'}
        </Typography>
        
        {/* Spacer */}
        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
        
        {/* Contenedor alineado respecto a la columna derecha (320px) */}
        <Box sx={{ 
          width: { xs: '100%', sm: 'auto', lg: 320 }, 
          display: 'flex', 
          justifyContent: { xs: 'flex-end', sm: 'space-between' },
          alignItems: 'center',
          gap: 2,
        }}>
          {/* Profile Text */}
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary, 
              fontSize: { xs: '1rem', md: '1.25rem' },
              cursor: 'pointer',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Perfil
          </Typography>

          {/* Edit Button */}
          <IconButton 
            size="large"
            onClick={handleProfileClick}
            sx={{ 
              bgcolor: theme.palette.action.hover, 
              borderRadius: 1.5, 
              width: { xs: 40, md: 48 }, 
              height: { xs: 40, md: 48 },
              '&:hover': {
                bgcolor: theme.palette.action.selected,
              },
            }}
          >
            <Edit sx={{ fontSize: { xs: 20, md: 24 }, color: theme.palette.text.primary }} />
          </IconButton>
        </Box>
      </Box>

      {/* Contenido principal en dos columnas */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, sm: 3, md: 4, lg: 8 },
      }}>
      {/* Columna Principal Izquierda */}
      <Box sx={{ flex: 1, minWidth: 0 }}>

      {/* Tarjetas KPI con gradientes - Diseño compacto y equilibrado */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, 
        gap: { xs: 1, sm: 1.5, md: 2 }, 
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        {/* Monthly Budget */}
        <Card 
          onClick={canEditBudget ? handleBudgetCardClick : undefined}
          sx={{ 
            borderRadius: 3, 
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 2px 4px rgba(0,0,0,0.08)',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.08)',
            cursor: canEditBudget ? 'pointer' : 'default',
            '&:hover': canEditBudget ? {
              transform: { xs: 'none', md: 'translateY(-2px)' },
              boxShadow: theme.palette.mode === 'dark'
                ? '0 6px 16px rgba(0, 0, 0, 0.4)'
                : '0 4px 12px rgba(0,0,0,0.15)',
            } : {},
          }}
        >
          <CardContent sx={{ 
            p: { xs: 1.5, sm: 2, md: 2.25 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    fontWeight: 500,
                  }}
                >
                  Presupuesto {currentMonthAbbr}
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                  }}
                >
                  S/ {(monthlyBudget / 1000).toFixed(0)}k
                </Typography>
              </Box>
              <AttachMoney 
                sx={{ 
                  fontSize: { xs: 48, sm: 56, md: 64 },
                  color: theme.palette.mode === 'dark' ? '#10B981' : '#059669',
                  ml: 2,
                  opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
                }} 
              />
            </Box>
          </CardContent>
        </Card>

        {/* Weekly Balance */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 2px 4px rgba(0,0,0,0.08)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.08)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 6px 16px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 1.5, sm: 2, md: 2.25 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    fontWeight: 500,
                  }}
                >
                  Balance Semanal
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                  }}
                >
                  S/ {(weeklyBalance / 1000).toFixed(0)}k
                </Typography>
              </Box>
              <AccountBalance 
                sx={{ 
                  fontSize: { xs: 48, sm: 56, md: 64 },
                  color: theme.palette.mode === 'dark' ? '#8B9AFF' : '#667eea',
                  ml: 2,
                  opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
                }} 
              />
            </Box>
          </CardContent>
        </Card>

        {/* Orders In Line */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 2px 4px rgba(0,0,0,0.08)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.08)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 6px 16px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 1.5, sm: 2, md: 2.25 },
            position: 'relative',
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    fontWeight: 500,
                  }}
                >
                  Órdenes en Línea
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {ordersInLine}
                </Typography>
              </Box>
              <ShoppingCart 
                sx={{ 
                  fontSize: { xs: 48, sm: 56, md: 64 },
                  color: theme.palette.mode === 'dark' ? '#F093FB' : '#f5576c',
                  ml: 2,
                  opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
                }} 
              />
            </Box>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 2px 4px rgba(0,0,0,0.08)',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          position: 'relative',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.08)',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 6px 16px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 1.5, sm: 2, md: 2.25 },
            position: 'relative',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    fontWeight: 500,
                  }}
                >
                  Nuevos Clientes
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {newClients}
                </Typography>
              </Box>
              <People 
                sx={{ 
                  fontSize: { xs: 56, sm: 64, md: 72 },
                  color: theme.palette.mode === 'dark' ? '#FA709A' : '#fee140',
                  ml: 2,
                  opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
                }} 
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sección principal: Sales Chart */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1fr',
          lg: '1fr',
          xl: (user?.role === 'admin' || user?.role === 'jefe_comercial') ? '2fr 1fr' : '1fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Sales Chart */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
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
                <LineChart 
                  data={salesChartData}
                  margin={selectedMonth !== null ? { top: 5, right: 5, bottom: 0, left: 5 } : { top: 5, right: 5, bottom: 20, left: 5 }}
                >
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
                <Tooltip 
                  formatter={(value: number) => [`S/ ${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Ventas']}
                  labelFormatter={(label) => selectedMonth !== null ? `Día ${label}` : label}
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
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={selectedMonth !== null ? { r: 4, fill: '#8B5CF6' } : false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Total de Ventas por Asesor - Solo visible para admin y jefe_comercial */}
        {/* Visible solo en xl para estar al lado de Ventas */}
        {(user?.role === 'admin' || user?.role === 'jefe_comercial') && (
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          display: { xs: 'none', xl: 'block' },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                fontSize: { xs: '1rem', md: '1.25rem' },
                mb: { xs: 2, md: 3 },
              }}
            >
              Total de Ventas por Asesor
            </Typography>
            {stats.deals.userPerformance && stats.deals.userPerformance.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
                {stats.deals.userPerformance
                  .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0))
                  .map((user, index) => (
                    <Box 
                      key={user.userId}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        p: { xs: 1.5, md: 2 },
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s',
                        gap: { xs: 1.5, sm: 0 },
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                        <Avatar
                          sx={{
                            width: { xs: 44, md: 48 },
                            height: { xs: 44, md: 48 },
                            bgcolor: '#8B5CF6',
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.text.primary,
                              fontSize: { xs: '0.9375rem', md: '1rem' },
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.8125rem', md: '0.8125rem' },
                            }}
                          >
                            {user.wonDeals || 0} {user.wonDeals === 1 ? 'venta' : 'ventas'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '1.125rem', md: '1.125rem' },
                          ml: { xs: 0, sm: 2 },
                          mt: { xs: 0.5, sm: 0 },
                          alignSelf: { xs: 'flex-end', sm: 'center' },
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        S/ {(user.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  ))}
              </Box>
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
      </Box>

      {/* Sección: Total de Ventas por Asesor (lg) y Distribución de Ventas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1fr',
          lg: '1fr 1fr',
          xl: '1fr' 
        },
        gap: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 } 
      }}>
        {/* Total de Ventas por Asesor - Solo visible para admin y jefe_comercial en lg */}
        {/* Visible solo en lg para estar al lado de Distribución de Ventas */}
        {(user?.role === 'admin' || user?.role === 'jefe_comercial') && (
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          display: { xs: 'block', lg: 'block', xl: 'none' },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.text.primary,
                fontSize: { xs: '1rem', md: '1.25rem' },
                mb: { xs: 2, md: 3 },
              }}
            >
              Total de Ventas por Asesor
            </Typography>
            {stats.deals.userPerformance && stats.deals.userPerformance.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
                {stats.deals.userPerformance
                  .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0))
                  .map((user, index) => (
                    <Box 
                      key={user.userId}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        p: { xs: 1.5, md: 2 },
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s',
                        gap: { xs: 1.5, sm: 0 },
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                        <Avatar
                          sx={{
                            width: { xs: 44, md: 48 },
                            height: { xs: 44, md: 48 },
                            bgcolor: '#8B5CF6',
                            fontSize: { xs: '1rem', md: '1.125rem' },
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: theme.palette.text.primary,
                              fontSize: { xs: '0.9375rem', md: '1rem' },
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.8125rem', md: '0.8125rem' },
                            }}
                          >
                            {user.wonDeals || 0} {user.wonDeals === 1 ? 'venta' : 'ventas'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '1.125rem', md: '1.125rem' },
                          ml: { xs: 0, sm: 2 },
                          mt: { xs: 0.5, sm: 0 },
                          alignSelf: { xs: 'flex-end', sm: 'center' },
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        S/ {(user.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  ))}
              </Box>
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
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
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
                <Tooltip />
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
          ? { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr' } 
          : { xs: '1fr', md: '1fr' };
        
        return (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: gridCols, 
            gap: { xs: 2, md: 3 } 
          }}>
        {/* Weekly Sales */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
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
                <Tooltip />
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
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
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
                      <Tooltip 
                        formatter={(value: number) => `${value.toFixed(1)}%`}
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

      {/* Columna Derecha - Perfil, Calendario y Tareas */}
      <Box sx={{ 
        width: { xs: '100%', md: 320 }, 
        flexShrink: 0,
        mt: { xs: 2, sm: 2.5, md: 0 },
      }}>
        {/* Perfil */}
        <Box sx={{ mb: { xs: 3, md: 4 }, position: 'relative' }}>
          {/* Avatar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, md: 2 } }}>
            <Avatar
              sx={{
                width: { xs: 80, md: 100 },
                height: { xs: 80, md: 100 },
                bgcolor: user?.avatar ? 'transparent' : '#0088FE',
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 600,
              }}
              src={user?.avatar}
            >
              {!user?.avatar && getInitials(user?.firstName, user?.lastName)}
            </Avatar>
          </Box>

          {/* Nombre y verificación */}
          <Box sx={{ textAlign: 'center', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.text.primary, 
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <CheckCircle sx={{ fontSize: { xs: 18, md: 20 }, color: '#10B981' }} />
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary, 
                mt: 0.5, 
                fontSize: { xs: '0.8rem', md: '0.875rem' },
              }}
            >
              {user?.role || 'Usuario'}
            </Typography>
          </Box>
        </Box>

        {/* Calendario */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : { xs: 1, md: 2 },
          mb: { xs: 3, md: 4 },
          bgcolor: theme.palette.background.paper,
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'flex-end', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: { xs: 2, md: 3 },
              gap: { xs: 2, sm: 0 },
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, md: 2 }, 
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' },
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                  <Select
                    value={calendarSelectedMonth || new Date().getMonth().toString()}
                    onChange={(e) => {
                      const monthValue = e.target.value;
                      setCalendarSelectedMonth(monthValue);
                      // Actualizar calendarDate con el mes seleccionado
                      const newDate = new Date(calendarDate);
                      newDate.setMonth(parseInt(monthValue));
                      setCalendarDate(newDate);
                    }}
                    displayEmpty
                    sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                  >
                    {monthNames.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  onClick={() => {
                    // Usar el mes seleccionado en el calendario o el mes actual
                    const monthToUse = calendarSelectedMonth !== null 
                      ? parseInt(calendarSelectedMonth) 
                      : calendarDate.getMonth();
                    const yearToUse = calendarDate.getFullYear();
                    const dateToUse = new Date(yearToUse, monthToUse, 1);
                    setCalendarModalDate(dateToUse);
                    setSelectedDate(new Date(yearToUse, monthToUse, new Date().getDate()));
                    fetchAllTasksWithDates();
                    setCalendarModalOpen(true);
                  }}
                  sx={{ 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Ver
                </Button>
              </Box>
            </Box>
            <Box>
              {/* Días de la semana */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    sx={{ 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                    }}
                  >
                    {day}
                  </Typography>
                ))}
              </Box>
              {/* Días del mes */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, sm: 1 } }}>
                {calendarDaysMain.map((day: number | null, index: number) => {
                  if (!day) {
                    return <Box key={index} />;
                  }

                  // Verificar si hay tareas para este día
                  const calendarMonth = calendarDate.getMonth();
                  const calendarYear = calendarDate.getFullYear();
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayTasks = allTasksWithDates.filter((task) => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
                    return taskDateStr === dateStr;
                  });
                  const hasTasks = dayTasks.length > 0;

                  const dayDate = new Date(calendarYear, calendarMonth, day);
                  const isSelected = selectedCalendarDay && 
                    dayDate.getDate() === selectedCalendarDay.getDate() &&
                    dayDate.getMonth() === selectedCalendarDay.getMonth() &&
                    dayDate.getFullYear() === selectedCalendarDay.getFullYear();

                  return (
                    <Box
                      key={index}
                      onClick={() => {
                        setSelectedCalendarDay(dayDate);
                      }}
                      sx={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        bgcolor: isSelected 
                          ? taxiMonterricoColors.orange 
                          : (hasTasks ? '#F97316' : 'transparent'),
                        color: isSelected || hasTasks ? 'white' : theme.palette.text.primary,
                        fontWeight: isSelected || hasTasks ? 600 : 400,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: isSelected 
                            ? taxiMonterricoColors.orangeDark 
                            : (hasTasks ? '#EA580C' : theme.palette.action.hover),
                        },
                      }}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Card con tareas del día seleccionado */}
        {selectedCalendarDay && (() => {
          const selectedDayStr = `${selectedCalendarDay.getFullYear()}-${String(selectedCalendarDay.getMonth() + 1).padStart(2, '0')}-${String(selectedCalendarDay.getDate()).padStart(2, '0')}`;
          const selectedDayTasks = allTasksWithDates.filter((task) => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
            return taskDateStr === selectedDayStr;
          });

          return (
            <Card sx={{ 
              borderRadius: { xs: 3, md: 6 }, 
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : { xs: 1, md: 2 },
              mb: { xs: 2, sm: 3, md: 4 },
              bgcolor: theme.palette.background.paper,
              border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                {selectedDayTasks.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selectedDayTasks.map((task) => (
                      <Card
                        key={task.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.mode === 'dark' ? taxiMonterricoColors.green : taxiMonterricoColors.green}`,
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : `${taxiMonterricoColors.greenLight}20`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 4px 12px rgba(0,0,0,0.4)' 
                              : 2,
                            transform: 'translateY(-2px)',
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(16, 185, 129, 0.25)' 
                              : `${taxiMonterricoColors.greenLight}30`,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.mode === 'dark' 
                                  ? taxiMonterricoColors.green 
                                  : taxiMonterricoColors.greenDark,
                                mb: 0.5,
                                fontSize: '0.9375rem',
                              }}
                            >
                              {task.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              {task.type && (
                                <Chip
                                  label={getTaskTypeLabel(task.type)}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.1)' 
                                      : '#F3F4F6',
                                    color: theme.palette.mode === 'dark' 
                                      ? theme.palette.text.secondary 
                                      : '#6B7280',
                                  }}
                                />
                              )}
                              {task.priority && (
                                <Chip
                                  label={task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? (task.priority === 'high' 
                                        ? 'rgba(239, 68, 68, 0.2)' 
                                        : task.priority === 'medium' 
                                        ? 'rgba(251, 191, 36, 0.2)' 
                                        : 'rgba(16, 185, 129, 0.2)')
                                      : (task.priority === 'high' 
                                        ? '#FEE2E2' 
                                        : task.priority === 'medium' 
                                        ? '#FEF3C7' 
                                        : '#D1FAE5'),
                                    color: theme.palette.mode === 'dark' 
                                      ? (task.priority === 'high' 
                                        ? '#FCA5A5' 
                                        : task.priority === 'medium' 
                                        ? '#FCD34D' 
                                        : '#6EE7B7')
                                      : (task.priority === 'high' 
                                        ? '#991B1B' 
                                        : task.priority === 'medium' 
                                        ? '#92400E' 
                                        : '#065F46'),
                                  }}
                                />
                              )}
                              {task.dueDate && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: theme.palette.text.secondary, 
                                    fontSize: '0.75rem', 
                                    alignSelf: 'center' 
                                  }}
                                >
                                  {new Date(task.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 4,
                    textAlign: 'center',
                  }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      No hay tareas programadas para este día
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })()}

      </Box>
      </Box>
      <ProfileModal 
        open={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)}
        onSuccess={(message) => setSuccessMessage(message)}
      />
      
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
      
      {/* Modal del Calendario */}
      <Dialog
        open={calendarModalOpen}
        onClose={() => {
          setCalendarModalOpen(false);
          setSelectedDate(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
            Calendario
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton size="small" onClick={() => {
              const newDate = new Date(calendarModalDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCalendarModalDate(newDate);
              setSelectedDate(null);
            }}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body1" sx={{ minWidth: 150, textAlign: 'center', fontWeight: 500 }}>
              {calendarModalDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton size="small" onClick={() => {
              const newDate = new Date(calendarModalDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCalendarModalDate(newDate);
              setSelectedDate(null);
            }}>
              <ChevronRight />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', gap: 3, overflow: 'hidden' }}>
          {(() => {
            const modalMonth = calendarModalDate.getMonth();
            const modalYear = calendarModalDate.getFullYear();
            const firstDay = new Date(modalYear, modalMonth, 1);
            const lastDay = new Date(modalYear, modalMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

            const modalCalendarDays = [];
            for (let i = 0; i < startingDayOfWeek; i++) {
              modalCalendarDays.push(null);
            }
            for (let i = 1; i <= daysInMonth; i++) {
              modalCalendarDays.push(i);
            }

            // Función para obtener tareas de un día específico
            const getTasksForDay = (day: number) => {
              const dateStr = `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return allTasksWithDates.filter((task) => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
                return taskDateStr === dateStr;
              });
            };

            // Obtener tareas del día seleccionado
            const selectedDayTasks = selectedDate ? (() => {
              const selectedDay = selectedDate.getDate();
              const selectedMonth = selectedDate.getMonth();
              const selectedYear = selectedDate.getFullYear();
              if (selectedMonth === modalMonth && selectedYear === modalYear) {
                return getTasksForDay(selectedDay);
              }
              return [];
            })() : [];

            return (
              <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                {/* Columna izquierda: Calendario */}
                <Box sx={{ flex: 1 }}>
                  {/* Días de la semana */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                      <Typography
                        key={index}
                        variant="caption"
                        sx={{ 
                          textAlign: 'center', 
                          fontWeight: 600, 
                          color: theme.palette.text.secondary,
                          fontSize: '0.875rem',
                          py: 1,
                        }}
                      >
                        {day}
                      </Typography>
                    ))}
                  </Box>
                  {/* Días del mes */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                    {modalCalendarDays.map((day: number | null, index: number) => {
                      if (!day) {
                        return <Box key={index} />;
                      }

                      const dayTasks = getTasksForDay(day);
                      const today = new Date();
                      const isToday = day === today.getDate() && 
                                     modalMonth === today.getMonth() && 
                                     modalYear === today.getFullYear();
                      
                      const isSelected = selectedDate && 
                                        day === selectedDate.getDate() && 
                                        modalMonth === selectedDate.getMonth() && 
                                        modalYear === selectedDate.getFullYear();

                      const hasTasks = dayTasks.length > 0;

                      return (
                        <Box
                          key={index}
                          onClick={() => {
                            const clickedDate = new Date(modalYear, modalMonth, day);
                            setSelectedDate(clickedDate);
                          }}
                          sx={{
                            minHeight: 80,
                            border: isSelected ? `2px solid ${taxiMonterricoColors.orange}` : `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            p: 1,
                            bgcolor: isSelected 
                              ? `${taxiMonterricoColors.orangeLight}30` 
                              : (isToday 
                                ? theme.palette.mode === 'dark' 
                                  ? `${taxiMonterricoColors.orange}20` 
                                  : '#F0F9FF' 
                                : theme.palette.background.paper),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            '&:hover': {
                              bgcolor: isSelected 
                                ? `${taxiMonterricoColors.orangeLight}50` 
                                : (isToday 
                                  ? theme.palette.mode === 'dark' 
                                    ? `${taxiMonterricoColors.orange}30` 
                                    : '#E0F2FE' 
                                  : theme.palette.action.hover),
                              borderColor: isSelected ? taxiMonterricoColors.orangeDark : theme.palette.divider,
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isSelected || isToday ? 700 : 500,
                              color: isSelected 
                                ? taxiMonterricoColors.orangeDark 
                                : (isToday 
                                  ? theme.palette.mode === 'dark' 
                                    ? taxiMonterricoColors.orange 
                                    : '#0284C7' 
                                  : theme.palette.text.primary),
                              fontSize: '0.875rem',
                            }}
                          >
                            {day}
                          </Typography>
                          {hasTasks && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 6,
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: isSelected ? taxiMonterricoColors.orangeDark : (isToday ? '#0284C7' : '#EF4444'),
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Columna derecha: Listado de tareas del día seleccionado */}
                <Box sx={{ 
                  width: 320, 
                  borderLeft: '1px solid #E5E7EB',
                  pl: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '60vh',
                  overflow: 'hidden',
                  pt: 0.5,
                  pb: 0.5,
                }}>
                  {selectedDate ? (
                    <>
                      {selectedDayTasks.length > 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 1.5,
                          overflowY: 'auto',
                          pr: 1,
                          pt: 0.5,
                          pb: 0.5,
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#F3F4F6',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#D1D5DB',
                            borderRadius: '3px',
                            '&:hover': {
                              background: '#9CA3AF',
                            },
                          },
                        }}>
                          {selectedDayTasks.map((task) => (
                            <Card
                              key={task.id}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.mode === 'dark' ? taxiMonterricoColors.green : taxiMonterricoColors.green}`,
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(16, 185, 129, 0.15)' 
                                  : `${taxiMonterricoColors.greenLight}20`,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 4px 12px rgba(0,0,0,0.4)' 
                                    : 2,
                                  transform: 'translateY(-2px)',
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(16, 185, 129, 0.25)' 
                                    : `${taxiMonterricoColors.greenLight}30`,
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontWeight: 600,
                                      color: theme.palette.mode === 'dark' 
                                        ? taxiMonterricoColors.green 
                                        : taxiMonterricoColors.greenDark,
                                      mb: 0.5,
                                      fontSize: '0.9375rem',
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {task.type && (
                                      <Chip
                                        label={getTaskTypeLabel(task.type)}
                                        size="small"
                                        sx={{
                                          fontSize: '0.7rem',
                                          height: 22,
                                          bgcolor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.1)' 
                                            : '#F3F4F6',
                                          color: theme.palette.mode === 'dark' 
                                            ? theme.palette.text.secondary 
                                            : '#6B7280',
                                        }}
                                      />
                                    )}
                                    {task.priority && (
                                      <Chip
                                        label={task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                        size="small"
                                        sx={{
                                          fontSize: '0.7rem',
                                          height: 22,
                                          bgcolor: theme.palette.mode === 'dark' 
                                            ? (task.priority === 'high' 
                                              ? 'rgba(239, 68, 68, 0.2)' 
                                              : task.priority === 'medium' 
                                              ? 'rgba(251, 191, 36, 0.2)' 
                                              : 'rgba(16, 185, 129, 0.2)')
                                            : (task.priority === 'high' 
                                              ? '#FEE2E2' 
                                              : task.priority === 'medium' 
                                              ? '#FEF3C7' 
                                              : '#D1FAE5'),
                                          color: theme.palette.mode === 'dark' 
                                            ? (task.priority === 'high' 
                                              ? '#FCA5A5' 
                                              : task.priority === 'medium' 
                                              ? '#FCD34D' 
                                              : '#6EE7B7')
                                            : (task.priority === 'high' 
                                              ? '#991B1B' 
                                              : task.priority === 'medium' 
                                              ? '#92400E' 
                                              : '#065F46'),
                                        }}
                                      />
                                    )}
                                    {task.dueDate && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: theme.palette.text.secondary, 
                                          fontSize: '0.75rem', 
                                          alignSelf: 'center' 
                                        }}
                                      >
                                        {new Date(task.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          py: 6,
                          textAlign: 'center',
                        }}>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                            No hay tareas programadas para este día
                          </Typography>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      py: 6,
                      textAlign: 'center',
                    }}>
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Selecciona una fecha para ver las tareas
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
