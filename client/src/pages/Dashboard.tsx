import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Assignment,
  Download,
  FilterList,
  CalendarToday,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { taxiMonterricoColors } from '../theme/colors';

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
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
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

  // Datos para gráficos
  const salesData = payments.monthly.length > 0 ? payments.monthly : [
    { month: 'Ene', amount: 10000 },
    { month: 'Feb', amount: 15000 },
    { month: 'Mar', amount: 20000 },
    { month: 'Abr', amount: 18000 },
    { month: 'May', amount: 25000 },
    { month: 'Jun', amount: 30000 },
    { month: 'Jul', amount: 28000 },
    { month: 'Ago', amount: 35000 },
    { month: 'Sep', amount: 40000 },
    { month: 'Oct', amount: 38000 },
    { month: 'Nov', amount: 45000 },
    { month: 'Dic', amount: 50000 },
  ];

  const weeklySalesData = [
    { day: 'Mon', amount: 8000 },
    { day: 'Tue', amount: 12000 },
    { day: 'Wed', amount: 15000 },
    { day: 'Thu', amount: 10000 },
    { day: 'Fri', amount: 18000 },
    { day: 'Sat', amount: 14000 },
  ];

  const pieData = [
    { name: 'Facebook', value: 35, color: '#FF6B9D' },
    { name: 'Youtube', value: 25, color: '#4ECDC4' },
    { name: 'Instagram', value: 25, color: '#FFA726' },
    { name: 'Website', value: 15, color: taxiMonterricoColors.green },
  ];

  // Datos de ejemplo para la tabla
  const customerData = [
    { id: 1, customer: 'Juan Pérez', date: '2024-01-15', amount: 1500, status: 'Shipped' },
    { id: 2, customer: 'María García', date: '2024-01-16', amount: 2300, status: 'Delivered' },
    { id: 3, customer: 'Carlos López', date: '2024-01-17', amount: 1800, status: 'Paid' },
    { id: 4, customer: 'Ana Martínez', date: '2024-01-18', amount: 3200, status: 'Shipped' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return taxiMonterricoColors.green;
      case 'Shipped': return '#1976d2';
      case 'Paid': return '#1976d2';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ 
      bgcolor: '#f5f7fa', 
      minHeight: '100vh',
      pb: { xs: 3, sm: 6, md: 8 },
      px: { xs: 3, sm: 6, md: 8 },
      pt: { xs: 4, sm: 6, md: 6 },
    }}>
      {/* Saludo personalizado */}
      <Typography
        sx={{
          fontSize: '2rem',
          fontWeight: 600,
          color: '#1a1a1a',
          mb: 4,
        }}
      >
        Hello, {user?.firstName || 'Usuario'}
      </Typography>

      {/* Tarjetas principales con gradientes */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {/* Weekly Balance */}
        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 200,
          }}
        >
          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              Weekly Balance
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              ${(payments.revenue / 1000).toFixed(0)}k
            </Typography>
            <Button
              variant="text"
              sx={{
                color: 'white',
                textTransform: 'none',
                textDecoration: 'underline',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  textDecoration: 'underline',
                  bgcolor: 'transparent',
                },
              }}
            >
              View entire list
            </Button>
          </CardContent>
        </Card>

        {/* Orders In Line */}
        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 200,
          }}
        >
          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              Orders In Line
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {stats.deals.total || 750}
            </Typography>
            <Button
              variant="text"
              sx={{
                color: 'white',
                textTransform: 'none',
                textDecoration: 'underline',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  textDecoration: 'underline',
                  bgcolor: 'transparent',
                },
              }}
            >
              View entire list
            </Button>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 200,
          }}
        >
          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              New Clients
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {stats.contacts.total || 150}
            </Typography>
            <Button
              variant="text"
              sx={{
                color: 'white',
                textTransform: 'none',
                textDecoration: 'underline',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  textDecoration: 'underline',
                  bgcolor: 'transparent',
                },
              }}
            >
              View entire list
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Gráfico de Sales y Calendario */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Sales Chart */}
        <Card sx={{ borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Sales
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select defaultValue="2024" sx={{ fontSize: '0.875rem' }}>
                    <MenuItem value="2024">2024</MenuItem>
                    <MenuItem value="2023">2023</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download />}
                  sx={{ textTransform: 'none' }}
                >
                  Download
                </Button>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#9C27B0"
                  strokeWidth={2}
                  name="Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card sx={{ borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Calendar
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select defaultValue="feb2024" sx={{ fontSize: '0.875rem' }}>
                    <MenuItem value="feb2024">Feb 2024</MenuItem>
                    <MenuItem value="mar2024">Mar 2024</MenuItem>
                  </Select>
                </FormControl>
                <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                  View
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <Typography
                  key={idx}
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#666',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {day}
                </Typography>
              ))}
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <Box
                  key={day}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: day >= 3 && day <= 7 ? '#FFA726' : 'transparent',
                    color: day >= 3 && day <= 7 ? 'white' : '#1a1a1a',
                    fontWeight: day >= 3 && day <= 7 ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Pie Chart y Weekly Sales */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Pie Chart Card */}
        <Card sx={{ borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Sales Distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                {pieData.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: item.color,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {item.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                Distributions of sales across platform
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Total Intake
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {payments.revenue > 0 ? (payments.revenue / 1000).toFixed(0) : 1500}k
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    New Customers
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.contacts.total || 7}k
                    <Chip
                      label="+1k"
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: `${taxiMonterricoColors.green}15`,
                        color: taxiMonterricoColors.green,
                        fontSize: '0.625rem',
                        height: 20,
                      }}
                    />
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Weekly Sales Chart */}
        <Card sx={{ borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Weekly Sales
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 12 }} />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {weeklySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieData[index % pieData.length].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Customer Details Table */}
      <Card sx={{ borderRadius: 3, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Customer Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FilterList />}
                sx={{ textTransform: 'none' }}
              >
                Filter
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Download />}
                sx={{ textTransform: 'none' }}
              >
                Download
              </Button>
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Id</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Invoiced Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>${row.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(row.status)}15`,
                          color: getStatusColor(row.status),
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
