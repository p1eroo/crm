import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Popover,
  Button,
} from '@mui/material';
import {
  Email,
  Assignment,
  AttachMoney,
  People,
  Business,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface User {
  id: number;
  usuario: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

interface UserStats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalTasks: number;
  wonDeals: number;
  totalRevenue: number;
  activitiesCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Función para ordenar meses cronológicamente
const sortMonths = (months: { name: string; value: number }[]): { name: string; value: number }[] => {
  return months.sort((a, b) => {
    // Parsear el formato "mes año" (ej: "ago 2025")
    const parseMonth = (monthStr: string) => {
      const [month, year] = monthStr.split(' ');
      const monthNames: { [key: string]: number } = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };
      return { month: monthNames[month.toLowerCase()] || 0, year: parseInt(year) || 0 };
    };
    
    const dateA = parseMonth(a.name);
    const dateB = parseMonth(b.name);
    
    if (dateA.year !== dateB.year) {
      return dateA.year - dateB.year;
    }
    return dateA.month - dateB.month;
  });
};

const ReportDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([]);
  const [allMonthlyActivity, setAllMonthlyActivity] = useState<any[]>([]);
  const [stageStats, setStageStats] = useState<any>(null);
  const [loadingStageStats, setLoadingStageStats] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const fetchUserData = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar usuario');
    }
  }, [id]);

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas del usuario
      const [contactsRes, companiesRes, dealsRes, tasksRes, activitiesRes] = await Promise.all([
        api.get('/contacts', { params: { ownerId: id } }),
        api.get('/companies', { params: { ownerId: id } }),
        api.get('/deals', { params: { ownerId: id } }),
        api.get('/tasks', { params: { assignedToId: id } }),
        api.get('/activities', { params: { userId: id } }),
      ]);

      const contacts = contactsRes.data.contacts || contactsRes.data || [];
      const companies = companiesRes.data.companies || companiesRes.data || [];
      const deals = dealsRes.data.deals || dealsRes.data || [];
      const tasks = tasksRes.data.tasks || tasksRes.data || [];
      const activities = activitiesRes.data.activities || activitiesRes.data || [];

      const wonDeals = deals.filter((deal: any) => 
        deal.stage === 'won' || deal.stage === 'closed won' || deal.stage === 'cierre_ganado'
      );
      
      const totalRevenue = wonDeals.reduce((sum: number, deal: any) => sum + (parseFloat(deal.amount) || 0), 0);

      setStats({
        totalContacts: contacts.length,
        totalCompanies: companies.length,
        totalDeals: deals.length,
        totalTasks: tasks.length,
        wonDeals: wonDeals.length,
        totalRevenue,
        activitiesCount: activities.length,
      });

      // Procesar deals por etapa
      const stageCounts: { [key: string]: number } = {};
      deals.forEach((deal: any) => {
        const stage = deal.stage || 'unknown';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });
      setDealsByStage(Object.entries(stageCounts).map(([name, value]) => ({ name, value })));

      // Procesar ingresos mensuales de negocios ganados
      const monthlyData: { [key: string]: number } = {};
      
      // Filtrar solo negocios ganados
      const wonDealsForChart = deals.filter((deal: any) => 
        deal.stage === 'won' || deal.stage === 'closed won' || deal.stage === 'cierre_ganado'
      );
      
      // Obtener todos los meses únicos de los negocios ganados
      wonDealsForChart.forEach((deal: any) => {
        // Usar closeDate si está disponible, sino createdAt
        const dealDate = deal.closeDate ? new Date(deal.closeDate) : new Date(deal.createdAt);
        const monthKey = dealDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        
        // Sumar el monto del negocio al mes correspondiente
        const amount = parseFloat(deal.amount) || 0;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
      });

      // Generar todos los meses del año actual
      const currentYear = new Date().getFullYear();
      const allMonthsOfYear: { [key: string]: number } = {};
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1);
        const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        allMonthsOfYear[monthKey] = monthlyData[monthKey] || 0;
      }

      const allActivity = sortMonths(
        Object.entries(allMonthsOfYear).map(([name, value]) => ({ name, value }))
      );
      setAllMonthlyActivity(allActivity);
      
      // Inicializar con todos los meses del año si no hay selección previa
      const now = new Date();
      const allMonthsSet = new Set<string>();
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        allMonthsSet.add(monthKey);
      }
      
      // Inicializar con todos los meses del año (la selección se maneja en el componente)
      setSelectedMonths(allMonthsSet);
      setMonthlyActivity(allActivity);

    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStageStats = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingStageStats(true);
      const response = await api.get(`/reports/user/${id}/stage-stats`);
      setStageStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stage stats:', error);
    } finally {
      setLoadingStageStats(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUserData();
      fetchUserStats();
      fetchStageStats();
    }
  }, [id, fetchUserData, fetchUserStats, fetchStageStats]);

  // Inicializar selectedMonths cuando se cargan los datos por primera vez
  useEffect(() => {
    if (allMonthlyActivity.length > 0 && selectedMonths.size === 0) {
      const now = new Date();
      const allMonthsSet = new Set<string>();
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        allMonthsSet.add(monthKey);
      }
      setSelectedMonths(allMonthsSet);
      setMonthlyActivity(allMonthlyActivity);
    }
  }, [allMonthlyActivity, selectedMonths.size]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const stringToColor = (string: string) => {
    let hash = 0;
    let i;
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.substr(-2);
    }
    return color;
  };

  const stringToGradient = (string: string, isDarkMode: boolean) => {
    const baseColor = stringToColor(string);
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    const darkenAmount = isDarkMode ? 40 : 20;
    const darkerR = Math.max(0, r - darkenAmount);
    const darkerG = Math.max(0, g - darkenAmount);
    const darkerB = Math.max(0, b - darkenAmount);
    
    return `linear-gradient(135deg, ${baseColor} 0%, rgb(${darkerR}, ${darkerG}, ${darkerB}) 100%)`;
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Usuario no encontrado'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4, lg: 8, xl: 16 }, py: 3 }}>
      {/* Header con botón de volver */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          variant="body1"
          onClick={() => navigate('/reports')}
          sx={{
            cursor: 'pointer',
            color: theme.palette.primary.main,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          ← Volver a Reportes
        </Typography>
      </Box>

      {/* Perfil del Usuario */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        overflow: 'visible',
        position: 'relative',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0a1929 0%, #1a2332 50%, #0d1b2a 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #f0f4f8 100%)',
      }}>
        {/* Fondo abstracto con formas onduladas */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '12px',
            opacity: theme.palette.mode === 'dark' ? 0.6 : 0.4,
            background: theme.palette.mode === 'dark'
              ? `radial-gradient(circle at 20% 30%, rgba(0, 150, 136, 0.3) 0%, transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(76, 175, 80, 0.25) 0%, transparent 50%),
                 radial-gradient(circle at 50% 50%, rgba(255, 152, 0, 0.15) 0%, transparent 50%),
                 linear-gradient(135deg, rgba(13, 71, 161, 0.2) 0%, rgba(0, 150, 136, 0.2) 100%)`
              : `radial-gradient(circle at 20% 30%, rgba(0, 150, 136, 0.2) 0%, transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(76, 175, 80, 0.15) 0%, transparent 50%),
                 radial-gradient(circle at 50% 50%, rgba(255, 152, 0, 0.1) 0%, transparent 50%)`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
                : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              animation: 'float 20s ease-in-out infinite',
            },
            '@keyframes float': {
              '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
              '50%': { transform: 'translate(-20px, -20px) rotate(5deg)' },
            },
          }}
        />
        {/* Avatar posicionado absolutamente para que quede por encima */}
        <Box sx={{ position: 'absolute', left: { xs: 16, sm: 20, md: 24 }, bottom: 20, zIndex: 20 }}>
          <Avatar
            src={user.avatar}
            sx={{
              background: stringToGradient(`${user.firstName || ''}${user.lastName || ''}` || 'user', theme.palette.mode === 'dark'),
              color: '#ffffff',
              width: 120,
              height: 120,
              fontSize: '2.5rem',
              fontWeight: 600,
              border: '4px solid rgba(255, 255, 255, 0.9)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                : '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
        </Box>
        <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3, md: 4 }, py: 6, pb: 10, pl: { xs: 16, sm: 18, md: 20, lg: 24 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 7,
                  mt: 14,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a',
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        {/* Rectángulo inferior */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(26, 35, 50, 0.95)' 
              : 'rgba(245, 247, 250, 0.95)',
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            zIndex: 10,
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3, md: 4 },
            pl: { xs: 16, sm: 18, md: 22, lg: 24 },
          }}
        >
          {/* Correo a la izquierda */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }} />
            <Typography 
              variant="body1" 
              sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }}
            >
              {user.email}
            </Typography>
          </Box>

          {/* Tabs a la derecha */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 'auto',
              position: 'relative',
              zIndex: 11,
              pointerEvents: 'auto',
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
                height: 2,
              },
              '& .MuiTab-root': {
                minHeight: 'auto',
                padding: '8px 16px',
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: '0.875rem',
                textTransform: 'none',
                pointerEvents: 'auto',
                cursor: 'pointer',
                '&.Mui-selected': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
                },
              },
            }}
          >
            <Tab label="General" />
            <Tab label="Estadística" />
          </Tabs>
        </Box>
      </Card>

      {/* Contenido General */}
      {activeTab === 0 && (
        <>
      {/* Layout de dos columnas */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
        gap: 3,
        mb: 3
      }}>
        {/* Columna Izquierda */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Estadísticas Principales en un solo card */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <People sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats?.totalContacts || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contactos
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Business sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats?.totalCompanies || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Empresas
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, color: '#00C49F' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats?.totalDeals || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Negocios
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Assignment sx={{ fontSize: 40, color: '#FF8042' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats?.totalTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tareas
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Métricas de Rendimiento */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Rendimiento
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Negocios Ganados</Typography>
                  <Chip
                    label={stats?.wonDeals || 0}
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Ingresos Totales</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Total de Actividades</Typography>
                  <Chip
                    label={stats?.activitiesCount || 0}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Columna Derecha */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Gráfico de Ingresos Mensuales */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
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
                    fontSize: { xs: '1rem', md: '1.25rem' },
                  }}
                >
                  Ingresos Mensuales
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    // Inicializar el año con el año de los meses seleccionados
                    if (selectedMonths.size > 0) {
                      // Obtener el año del primer mes seleccionado
                      const firstSelectedMonth = Array.from(selectedMonths)[0];
                      const yearMatch = firstSelectedMonth.match(/\d{4}/);
                      if (yearMatch) {
                        setSelectedYear(parseInt(yearMatch[0]));
                      } else {
                        setSelectedYear(new Date().getFullYear());
                      }
                    } else if (allMonthlyActivity.length > 0) {
                      // Si no hay meses seleccionados, usar el año del primer mes disponible
                      const firstMonth = allMonthlyActivity[0].name;
                      const yearMatch = firstMonth.match(/\d{4}/);
                      if (yearMatch) {
                        setSelectedYear(parseInt(yearMatch[0]));
                      } else {
                        setSelectedYear(new Date().getFullYear());
                      }
                    } else {
                      setSelectedYear(new Date().getFullYear());
                    }
                    setCalendarAnchorEl(e.currentTarget);
                  }}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <CalendarToday fontSize="small" />
                </IconButton>
              </Box>
              
              {/* Popover para selector de meses */}
              <Popover
                open={Boolean(calendarAnchorEl)}
                anchorEl={calendarAnchorEl}
                onClose={() => setCalendarAnchorEl(null)}
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
                    borderRadius: 2,
                    p: 2,
                    minWidth: 320,
                  },
                }}
              >
                {/* Header con año y navegación */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 2,
                }}>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedYear(prev => prev - 1)}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.05)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.15)' 
                          : 'rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': {
                        color: theme.palette.primary.main,
                      },
                    }}
                    onClick={() => {
                      // Seleccionar todos los meses del año actual
                      const allMonthsOfYear = new Set<string>();
                      for (let i = 0; i < 12; i++) {
                        const date = new Date(selectedYear, i, 1);
                        const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                        allMonthsOfYear.add(monthKey);
                      }
                      setSelectedMonths(allMonthsOfYear);
                      setMonthlyActivity(allMonthlyActivity);
                      setCalendarAnchorEl(null);
                    }}
                  >
                    {selectedYear}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedYear(prev => prev + 1)}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Box>

                {/* Grid de meses 4x3 */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: 1,
                }}>
                  {[
                    { index: 0, name: 'Enero', short: 'ene' },
                    { index: 1, name: 'Febrero', short: 'feb' },
                    { index: 2, name: 'Marzo', short: 'mar' },
                    { index: 3, name: 'Abril', short: 'abr' },
                    { index: 4, name: 'Mayo', short: 'may' },
                    { index: 5, name: 'Junio', short: 'jun' },
                    { index: 6, name: 'Julio', short: 'jul' },
                    { index: 7, name: 'Agosto', short: 'ago' },
                    { index: 8, name: 'Septiembre', short: 'sept' },
                    { index: 9, name: 'Octubre', short: 'oct' },
                    { index: 10, name: 'Noviembre', short: 'nov' },
                    { index: 11, name: 'Diciembre', short: 'dic' },
                  ].map((month) => {
                    const monthKey = `${month.short} ${selectedYear}`;
                    const isSelected = selectedMonths.has(monthKey);
                    // Verificar si hay datos reales (valor > 0) para este mes
                    const monthData = allMonthlyActivity.find(item => item.name === monthKey);
                    const hasData = monthData && monthData.value > 0;
                    
                    // Verificar si todos los meses del año están seleccionados
                    const allMonthsOfYear = new Set<string>();
                    for (let i = 0; i < 12; i++) {
                      const date = new Date(selectedYear, i, 1);
                      const key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                      allMonthsOfYear.add(key);
                    }
                    const allSelected = allMonthsOfYear.size === selectedMonths.size && 
                                      Array.from(allMonthsOfYear).every(month => selectedMonths.has(month));
                    
                    // Si todos están seleccionados, no mostrar el estado de seleccionado individual
                    // Pero si está seleccionado individualmente (no todos), mostrarlo
                    const showAsSelected = isSelected && !allSelected;
                    
                    return (
                      <Button
                        key={month.index}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Verificar si todos los meses del año están seleccionados
                          const allMonthsOfYear = new Set<string>();
                          for (let i = 0; i < 12; i++) {
                            const date = new Date(selectedYear, i, 1);
                            const key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                            allMonthsOfYear.add(key);
                          }
                          const allCurrentlySelected = allMonthsOfYear.size === selectedMonths.size && 
                                                      Array.from(allMonthsOfYear).every(month => selectedMonths.has(month));
                          
                          const newSelected = new Set<string>();
                          
                          if (allCurrentlySelected) {
                            // Si todos los meses del año están seleccionados, deseleccionar todos y seleccionar solo este
                            newSelected.add(monthKey);
                          } else if (isSelected) {
                            // Si está seleccionado, deseleccionarlo
                            selectedMonths.forEach(month => {
                              if (month !== monthKey) {
                                newSelected.add(month);
                              }
                            });
                          } else {
                            // Si no está seleccionado, agregarlo (selección múltiple)
                            selectedMonths.forEach(month => newSelected.add(month));
                            newSelected.add(monthKey);
                          }
                          
                          setSelectedMonths(newSelected);
                          // Filtrar los datos para mostrar solo los meses seleccionados
                          const filteredActivity = allMonthlyActivity.filter(act => newSelected.has(act.name));
                          setMonthlyActivity(filteredActivity);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          minHeight: 48,
                          bgcolor: showAsSelected 
                            ? theme.palette.primary.main 
                            : (theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'transparent'),
                          color: showAsSelected 
                            ? 'white' 
                            : theme.palette.text.primary,
                          borderColor: showAsSelected 
                            ? theme.palette.primary.main 
                            : (hasData 
                              ? theme.palette.primary.main 
                              : theme.palette.divider),
                          borderWidth: showAsSelected || hasData ? 2 : 1,
                          fontWeight: showAsSelected ? 600 : 400,
                          '&:hover': {
                            bgcolor: showAsSelected 
                              ? theme.palette.primary.dark 
                              : theme.palette.action.hover,
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                        }}
                      >
                        {month.name}
                      </Button>
                    );
                  })}
                </Box>
              </Popover>
              {monthlyActivity.length > 0 ? (
                <Box sx={{ width: '100%', height: 300, minHeight: 300, minWidth: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart 
                      data={monthlyActivity}
                      margin={{ top: 19, right: 5, bottom: 35, left: -15 }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={true} vertical={false} />
                      <XAxis 
                        dataKey="name"
                        stroke={theme.palette.text.secondary}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        angle={0}
                        textAnchor="middle"
                        height={40}
                        dy={10}
                        tickFormatter={(value) => {
                          // Extraer solo el mes del formato "ene 2026" -> "ene"
                          return value.split(' ')[0];
                        }}
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
                        domain={[0, 'dataMax']}
                      />
                      <Tooltip 
                        formatter={(value: number | undefined) => {
                          const numValue = typeof value === 'number' ? value : Number(value || 0);
                          return numValue !== undefined && !isNaN(numValue) 
                            ? [`S/ ${numValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Ingresos'] 
                            : ['', 'Ingresos'];
                        }}
                        labelFormatter={(label: any) => label}
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '8px',
                        }}
                      />
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
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de ingresos
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Negocios por Etapa */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Negocios por Etapa
              </Typography>
              {dealsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dealsByStage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dealsByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de negocios
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
        </>
      )}

      {/* Contenido de Estadística */}
      {activeTab === 1 && (
        <>
      {/* Tablas de Estadísticas por Etapa */}
      {stageStats && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Estadísticas por Etapa
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3
          }}>
            {/* Tabla Izquierda: Conteo de Contactos */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Número de Contactos por Etapa
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Etapa</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stageStats.data?.map((row: any) => (
                        <TableRow key={row.stage} hover>
                          <TableCell>{row.label}</TableCell>
                          <TableCell align="right">{row.totalCount || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Tabla Derecha: Valores Monetarios */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Valor Monetario por Etapa
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Etapa</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stageStats.data?.map((row: any) => (
                        <TableRow key={row.stage} hover>
                          <TableCell>{row.label}</TableCell>
                          <TableCell align="right">
                            {row.totalValue > 0 ? formatCurrency(row.totalValue) : 'S/ -'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {loadingStageStats && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
        </>
      )}

    </Box>
  );
};

export default ReportDetail;

