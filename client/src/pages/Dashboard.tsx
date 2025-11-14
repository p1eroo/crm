import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Assignment,
  Business,
  CheckCircle,
  Pending,
  Cancel,
  AccountBalance,
  Refresh,
  Build,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import api from '../config/api';

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
    completed?: number;
    new?: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  payments?: {
    total: number;
    pending: {
      count: number;
      amount: number;
    };
    completed: {
      count: number;
      amount: number;
    };
    failed: {
      count: number;
      amount: number;
    };
    revenue: number;
    monthly: Array<{ month: string; amount: number }>;
  };
  leads?: {
    total: number;
    converted: number;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard stats response:', response.data);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Establecer datos por defecto para evitar que se muestre el error
      setStats({
        contacts: { total: 0, byStage: [] },
        companies: { total: 0, byStage: [] },
        deals: { total: 0, totalValue: 0, byStage: [], wonThisMonth: 0, wonValueThisMonth: 0 },
        tasks: { total: 0, byStatus: [], completed: 0, new: 0 },
        campaigns: { total: 0, active: 0 },
        payments: {
          total: 0,
          pending: { count: 0, amount: 0 },
          completed: { count: 0, amount: 0 },
          failed: { count: 0, amount: 0 },
          revenue: 0,
          monthly: [],
        },
        leads: { total: 0, converted: 0 },
      });
    } finally {
      setLoading(false);
    }
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
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Error al cargar estadísticas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Por favor, recarga la página o verifica la conexión con el servidor.
        </Typography>
      </Box>
    );
  }

  const payments = stats.payments || {
    total: 0,
    pending: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    revenue: 0,
    monthly: [],
  };

  const leads = stats.leads || { total: 0, converted: 0 };

  // Calcular porcentajes para las barras de progreso
  const pendingPaymentPercent = payments.total > 0 
    ? (payments.pending.count / payments.total) * 100 
    : 0;
  const convertedLeadsPercent = leads.total > 0 
    ? (leads.converted / (leads.total + leads.converted)) * 100 
    : 0;
  const projectsPercent = stats.deals.total > 0 
    ? (stats.deals.wonThisMonth / stats.deals.total) * 100 
    : 0;
  const conversionRate = stats.deals.total > 0 
    ? ((stats.deals.wonThisMonth / stats.deals.total) * 100).toFixed(2)
    : '0.00';

  const totalSales = payments.revenue || stats.deals.totalValue || 0;
  const salesGrowth = 12; // Porcentaje de crecimiento (podría calcularse)

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Dashboard &gt; Home &gt; Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            OCT 16, 25 - NOV 14, 25
          </Typography>
          <Chip label="FILTER" size="small" clickable />
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Facturas Pendientes */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Facturas Pendientes
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {payments.pending.count}/{payments.total || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
                  <AttachMoney />
                </Avatar>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  ${payments.pending.amount.toLocaleString()} ({pendingPaymentPercent.toFixed(0)}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={pendingPaymentPercent} 
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Leads Convertidos */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Leads Convertidos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {leads.converted}/{leads.total + leads.converted}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#2e7d32', width: 48, height: 48 }}>
                  <Refresh />
                </Avatar>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {leads.converted} Completados ({convertedLeadsPercent.toFixed(0)}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={convertedLeadsPercent} 
                color="success"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Proyectos en Progreso */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Proyectos en Progreso
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {stats.deals.wonThisMonth}/{stats.deals.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#ed6c02', width: 48, height: 48 }}>
                  <Build />
                </Avatar>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.deals.wonThisMonth} Completados ({projectsPercent.toFixed(0)}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={projectsPercent} 
                color="warning"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Tasa de Conversión */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tasa de Conversión
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {conversionRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#9c27b0', width: 48, height: 48 }}>
                  <TrendingUp />
                </Avatar>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  ${stats.deals.wonValueThisMonth.toLocaleString()} ({conversionRate}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={parseFloat(conversionRate)} 
                color="secondary"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Gráfico de Payment Record */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' }, minWidth: { xs: '100%', md: '300px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Registro de Pagos
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={payments.monthly.length > 0 ? payments.monthly : [
                  { month: 'Ene', amount: 0 },
                  { month: 'Feb', amount: 0 },
                  { month: 'Mar', amount: 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#666' }}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="amount" fill="#1976d2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Total Sales Card */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' }, minWidth: { xs: '100%', md: '300px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total de Ventas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    ${totalSales.toLocaleString()}
                  </Typography>
                </Box>
                <Chip 
                  label={`+${salesGrowth}%`} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
              <Box sx={{ height: 200, mt: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payments.monthly.length > 0 ? payments.monthly : [
                    { month: 'Ene', amount: 0 },
                    { month: 'Feb', amount: 0 },
                  ]}>
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#fff" 
                      fill="rgba(255,255,255,0.3)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Proyectos Activos" 
                    secondary={`${stats.deals.total} proyectos`}
                    primaryTypographyProps={{ style: { color: 'white', fontSize: '14px' } }}
                    secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.7)', fontSize: '12px' } }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Summary Statistics */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' }, minWidth: { xs: '100%', md: '300px' } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' }, minWidth: { xs: '100%', md: '150px' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pendientes
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    ${payments.pending.amount.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={pendingPaymentPercent} 
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' }, minWidth: { xs: '100%', md: '150px' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completados
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    ${payments.completed.amount.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={payments.total > 0 ? (payments.completed.count / payments.total) * 100 : 0} 
                    color="success"
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' }, minWidth: { xs: '100%', md: '150px' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rechazados
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    ${payments.failed.amount.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={payments.total > 0 ? (payments.failed.count / payments.total) * 100 : 0} 
                    color="error"
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' }, minWidth: { xs: '100%', md: '150px' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ingresos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    ${payments.revenue.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={100} 
                    sx={{ height: 6, borderRadius: 1, bgcolor: '#424242' }}
                  />
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Tasks Cards */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Tareas Completadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    {stats.tasks.completed || 0}/{stats.tasks.total}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }, minWidth: { xs: '100%', sm: '200px' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Nuevas Tareas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    {stats.tasks.new || 0}/{stats.tasks.total}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* Project Done Card */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' }, minWidth: { xs: '100%', md: '300px' } }}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Proyectos Completados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                {stats.deals.wonThisMonth}/{stats.deals.total}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={projectsPercent} 
                color="success"
                sx={{ height: 10, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
