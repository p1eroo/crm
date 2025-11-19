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
} from '@mui/material';
import {
  Download,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  AccountCircle,
  Settings,
  Logout,
  Search,
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
} from 'recharts';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('es-ES', { month: 'short', year: 'numeric' }));
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard stats recibidos:', response.data);
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
        payments: { revenue: 0, monthly: [] },
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
        backgroundColor: '#F5F5F5', 
        minHeight: '100vh',
        px: { xs: 3, sm: 6, md: 8 },
        pt: { xs: 4, sm: 6, md: 6 },
        pb: 4,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F2937', mb: 4 }}>
          Hola, {user?.firstName || 'Usuario'}
        </Typography>
        <Typography>No hay datos disponibles</Typography>
      </Box>
    );
  }

  // Preparar datos para gráficos
  const salesData = stats.payments?.monthly || [];
  const salesChartData = salesData.length > 0 
    ? salesData.map(item => ({
        month: item.month.split(' ')[0].substring(0, 3),
        value: item.amount,
      }))
    : Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return {
          month: date.toLocaleString('es-ES', { month: 'short' }).substring(0, 3),
          value: 0,
        };
      });

  // Datos para Sales Distribution (pie chart)
  const salesDistributionData = stats.deals.byStage && stats.deals.byStage.length > 0
    ? stats.deals.byStage.slice(0, 5).map((deal, index) => ({
        name: deal.stage === 'won' ? 'Ganados' : deal.stage === 'lost' ? 'Perdidos' : deal.stage,
        value: deal.count || 0,
        color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
      }))
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

  // Generar calendario para el calendario principal (izquierda) - mes completo
  const calendarMonth = calendarDate.getMonth();
  const calendarYear = calendarDate.getFullYear();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

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
  
  // Obtener el primer día de la semana actual (domingo = 0)
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, currentDay);
  firstDayOfWeek.setDate(currentDay - firstDayOfWeek.getDay());
  
  // Generar los 7 días de la semana
  const calendarDaysRight = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    calendarDaysRight.push({
      day: date.getDate(),
      dayOfWeek: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()],
      isCurrentMonth: date.getMonth() === calendarMonth,
    });
  }

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleProfileMenuClose();
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthName = monthNames[calendarMonth];

  return (
    <Box sx={{ 
      backgroundColor: '#F5F5F5', 
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
            color: '#1F2937', 
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
              color: '#1F2937', 
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
            onClick={handleProfileMenuOpen}
            sx={{ 
              bgcolor: '#F3F4F6', 
              borderRadius: 1.5, 
              width: { xs: 40, md: 48 }, 
              height: { xs: 40, md: 48 },
              '&:hover': {
                bgcolor: '#E5E7EB',
              },
            }}
          >
            <Edit sx={{ fontSize: { xs: 20, md: 24 }, color: '#1F2937' }} />
          </IconButton>

          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e0e0e0',
                '& .MuiMenuItem-root': {
                  fontSize: '0.875rem',
                  py: 1.25,
                  px: 2,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <AccountCircle sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} />
              Perfil
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>
              <Settings sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} />
              Configuración
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={handleLogoutClick}
              sx={{
                color: '#d32f2f',
                '&:hover': {
                  bgcolor: '#ffebee',
                },
              }}
            >
              <Logout sx={{ mr: 1.5, fontSize: 20 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Contenido principal en dos columnas */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 4, sm: 5, md: 8 },
      }}>
      {/* Columna Principal Izquierda */}
      <Box sx={{ flex: 1, minWidth: 0 }}>

      {/* Tarjetas KPI con gradientes - Diseño compacto y equilibrado */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
        gap: { xs: 1.5, sm: 2, md: 2 }, 
        mb: { xs: 3, md: 4 } 
      }}>
        {/* Weekly Balance */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 1.75, sm: 2, md: 2.25 },
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95, 
                mb: 0.75,
                fontSize: { xs: '0.75rem', md: '0.8rem' },
                fontWeight: 500,
              }}
            >
              Balance Semanal
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 1.25,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                lineHeight: 1.1,
              }}
            >
              ${(weeklyBalance / 1000).toFixed(0)}k
            </Typography>
            <Link 
              href="#" 
              sx={{ 
                color: 'white', 
                textDecoration: 'underline', 
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                opacity: 0.9,
                display: 'inline-block',
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              Ver lista completa
            </Link>
          </CardContent>
        </Card>

        {/* Orders In Line */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 1.75, sm: 2, md: 2.25 },
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95, 
                mb: 0.75,
                fontSize: { xs: '0.75rem', md: '0.8rem' },
                fontWeight: 500,
              }}
            >
              Órdenes en Línea
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 1.25,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                lineHeight: 1.1,
              }}
            >
              {ordersInLine}
            </Typography>
            <Link 
              href="#" 
              sx={{ 
                color: 'white', 
                textDecoration: 'underline', 
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                opacity: 0.9,
                display: 'inline-block',
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              Ver lista completa
            </Link>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card sx={{ 
          borderRadius: 3, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: { xs: 'none', md: 'translateY(-2px)' },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}>
          <CardContent sx={{ 
            p: { xs: 1.75, sm: 2, md: 2.25 },
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95, 
                mb: 0.75,
                fontSize: { xs: '0.75rem', md: '0.8rem' },
                fontWeight: 500,
              }}
            >
              Nuevos Clientes
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                mb: 1.25,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                lineHeight: 1.1,
              }}
            >
              {newClients}
            </Typography>
            <Link 
              href="#" 
              sx={{ 
                color: 'white', 
                textDecoration: 'underline', 
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                opacity: 0.9,
                display: 'inline-block',
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              Ver lista completa
            </Link>
          </CardContent>
        </Card>
      </Box>

      {/* Sección principal: Sales Chart y Calendar */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gap: { xs: 2, md: 3 }, 
        mb: { xs: 2, md: 3 } 
      }}>
        {/* Sales Chart */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: { xs: 1, md: 2 },
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
                  color: '#1F2937',
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
                    <MenuItem value="2024">2024</MenuItem>
                    <MenuItem value="2023">2023</MenuItem>
                    <MenuItem value="2022">2022</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={<Download sx={{ fontSize: { xs: 16, md: 18 } }} />}
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 20, height: 2, bgcolor: '#8B5CF6' }} />
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  → Ventas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: { xs: 1, md: 2 },
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
                  color: '#1F2937',
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                Calendario
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, md: 2 }, 
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' },
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                  >
                    <MenuItem value={new Date().toLocaleString('es-ES', { month: 'short', year: 'numeric' })}>
                      {new Date().toLocaleString('es-ES', { month: 'short', year: 'numeric' })}
                    </MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
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
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    sx={{ 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      color: '#6B7280',
                      fontSize: '0.75rem',
                    }}
                  >
                    {day}
                  </Typography>
                ))}
              </Box>
              {/* Días del mes */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {calendarDaysMain.map((day: number | null, index: number) => {
                  const isHighlighted = day && day >= 3 && day <= 7;
                  return day ? (
                    <Box
                      key={index}
                      sx={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        bgcolor: isHighlighted ? '#F97316' : 'transparent',
                        color: isHighlighted ? 'white' : '#1F2937',
                        fontWeight: isHighlighted ? 600 : 400,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isHighlighted ? '#EA580C' : '#F3F4F6',
                        },
                      }}
                    >
                      {day}
                    </Box>
                  ) : (
                    <Box key={index} />
                  );
                })}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sección inferior: Sales Distribution y Weekly Sales */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
        gap: { xs: 2, md: 3 } 
      }}>
        {/* Sales Distribution */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: { xs: 1, md: 2 },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#1F2937', 
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
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    {entry.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Weekly Sales */}
        <Card sx={{ 
          borderRadius: { xs: 3, md: 6 }, 
          boxShadow: { xs: 1, md: 2 },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: '#1F2937', 
                mb: { xs: 2, md: 3 },
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              Ventas Semanales
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
      </Box>

      {/* Columna Derecha - Perfil, Calendario y Tareas */}
      <Box sx={{ 
        width: { xs: '100%', lg: 320 }, 
        flexShrink: 0,
        mt: { xs: 3, lg: 0 },
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
                  color: '#1F2937', 
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
                color: '#6B7280', 
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
          boxShadow: { xs: 1, md: 2 }, 
          mb: { xs: 3, md: 4 },
          bgcolor: '#F3F4F6',
        }}>
          <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
            {/* Header del calendario */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <IconButton size="small" onClick={handlePrevMonth} sx={{ width: 24, height: 24 }}>
                <ChevronLeft sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>
                {currentMonthName} {calendarYear}
              </Typography>
              <IconButton size="small" onClick={handleNextMonth} sx={{ width: 24, height: 24 }}>
                <ChevronRight sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {/* Días de la semana */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  sx={{ 
                    textAlign: 'center', 
                    fontWeight: 500, 
                    color: '#9CA3AF',
                    fontSize: '0.7rem',
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Días de la semana - solo una semana */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {calendarDaysRight.map((dateInfo, index) => {
                const today = new Date();
                const isToday = dateInfo.day === today.getDate() && dateInfo.isCurrentMonth && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                const isSelected = dateInfo.day === 25 && dateInfo.isCurrentMonth; // Fecha destacada como en la imagen
                
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      minHeight: 48,
                    }}
                  >
                    {/* Óvalo oscuro de fondo que incluye día de semana y fecha */}
                    {isSelected ? (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 44,
                          height: 48,
                          borderRadius: '24px',
                          bgcolor: '#374151',
                          zIndex: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.25,
                        }}
                      >
                        {/* Día de la semana dentro del óvalo */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: 'white',
                            lineHeight: 1,
                          }}
                        >
                          {dateInfo.dayOfWeek}
                        </Typography>
                        
                        {/* Fecha con círculo teal dentro del óvalo */}
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            bgcolor: '#4FD1C7',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        >
                          {dateInfo.day}
                        </Box>
                      </Box>
                    ) : (
                      <>
                        {/* Día de la semana normal */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 400,
                            color: '#9CA3AF',
                            mb: 0.5,
                          }}
                        >
                          {dateInfo.dayOfWeek}
                        </Typography>
                        
                        {/* Fecha normal */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: isToday ? 600 : 400,
                            color: dateInfo.isCurrentMonth ? (isToday ? '#1F2937' : '#9CA3AF') : '#D1D5DB',
                            cursor: 'pointer',
                            '&:hover': {
                              color: dateInfo.isCurrentMonth ? '#1F2937' : '#9CA3AF',
                            },
                          }}
                        >
                          {dateInfo.day}
                        </Typography>
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Línea divisoria */}
        <Divider sx={{ my: 3, borderColor: '#E5E7EB', borderWidth: 1 }} />

        {/* To Do List */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#1F2937', mb: 2, fontSize: '1.125rem' }}>
            Lista de Tareas
          </Typography>

          {tasks.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {tasks.map((task) => {
                const isCompleted = task.status === 'completed';
                
                return (
                  <Box key={task.id}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox
                        checked={isCompleted}
                        onChange={() => handleTaskToggle(task.id, task.status)}
                        sx={{
                          color: '#6B7280',
                          '&.Mui-checked': {
                            color: '#10B981',
                          },
                          p: 0.25,
                          '& .MuiSvgIcon-root': {
                            fontSize: 22,
                          },
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: isCompleted ? '#9CA3AF' : '#1F2937',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            fontSize: '0.9375rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {task.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>
                            {getTaskTypeLabel(task.type)}
                          </Typography>
                          {task.dueDate && (
                            <>
                              <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>
                                |
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#F97316', fontSize: '0.8125rem' }}>
                                {formatTime(task.dueDate)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: '#9CA3AF', textAlign: 'center', py: 1.5, fontSize: '0.875rem' }}>
              No hay tareas pendientes
            </Typography>
          )}
        </Box>
      </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
