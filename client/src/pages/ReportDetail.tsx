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
} from '@mui/material';
import {
  Email,
  Phone,
  CalendarToday,
  Assignment,
  AttachMoney,
  People,
  Business,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [stageStats, setStageStats] = useState<any>(null);
  const [loadingStageStats, setLoadingStageStats] = useState(false);

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

      // Procesar actividad mensual (últimos 6 meses)
      const monthlyData: { [key: string]: number } = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = 0;
      }

      activities.forEach((activity: any) => {
        const activityDate = new Date(activity.createdAt);
        const monthKey = activityDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey]++;
        }
      });

      setMonthlyActivity(Object.entries(monthlyData).map(([name, value]) => ({ name, value })));

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
    <Box sx={{ p: 3 }}>
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={user.avatar}
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 100,
                height: 100,
                fontSize: '2rem',
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Usuario: {user.usuario}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{user.email}</Typography>
                </Box>
                {user.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{user.phone}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2">
                    Miembro desde: {formatDate(user.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Estadísticas Principales */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 3
      }}>
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
      </Box>

      {/* Gráficos y Métricas Adicionales */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        gap: 3
      }}>
        {/* Gráfico de Negocios por Etapa */}
        <Card>
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

        {/* Gráfico de Actividad Mensual */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Actividad Mensual
            </Typography>
            {monthlyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay datos de actividad
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Métricas de Rendimiento */}
        <Card>
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

        {/* Información Adicional */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Información Adicional
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Rol
                </Typography>
                <Chip label={user.role} color="primary" sx={{ mt: 0.5 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Usuario
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {user.usuario}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

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
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Número de Contactos por Etapa
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Etapa</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                        {stageStats.weeks?.map((week: number) => (
                          <TableCell key={week} align="right" sx={{ fontWeight: 'bold' }}>
                            {week}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stageStats.data?.map((row: any) => (
                        <TableRow key={row.stage} hover>
                          <TableCell>{row.label}</TableCell>
                          <TableCell>{row.percentage}%</TableCell>
                          {row.counts?.map((count: number, idx: number) => (
                            <TableCell key={idx} align="right">
                              {count}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Tabla Derecha: Valores Monetarios */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Valor Monetario por Etapa
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Etapa</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                        {stageStats.weeks?.map((week: number) => (
                          <TableCell key={week} align="right" sx={{ fontWeight: 'bold' }}>
                            {week}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stageStats.data?.map((row: any) => (
                        <TableRow key={row.stage} hover>
                          <TableCell>{row.label}</TableCell>
                          <TableCell>{row.percentage}%</TableCell>
                          {row.values?.map((value: number, idx: number) => (
                            <TableCell key={idx} align="right">
                              {value > 0 ? formatCurrency(value) : 'S/ -'}
                            </TableCell>
                          ))}
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
    </Box>
  );
};

export default ReportDetail;

