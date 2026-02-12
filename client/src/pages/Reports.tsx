import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Popover,
  useTheme,
  Button,
  Avatar,
} from '@mui/material';
import { Person, Search, ChevronLeft, ChevronRight, Close, Business } from '@mui/icons-material';
import { Building2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { getStageColor as getStageColorUtil } from '../utils/stageColors';
import { formatCurrencyPE } from '../utils/currencyUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface User {
  id: number;
  usuario: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  phone?: string;
}

interface DashboardStats {
  deals: {
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
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  contacto: 'Contacto',
  reunion_agendada: 'Reunión Agendada',
  reunion_efectiva: 'Reunión Efectiva',
  propuesta_economica: 'Propuesta Económica',
  negociacion: 'Negociación',
  licitacion: 'Licitación',
  licitacion_etapa_final: 'Licitación Etapa Final',
  cierre_ganado: 'Cierre Ganado',
  cierre_perdido: 'Cierre Perdido',
  firma_contrato: 'Firma de Contrato',
  activo: 'Activo',
  cliente_perdido: 'Cliente perdido',
  lead_inactivo: 'Lead Inactivo',
  won: 'Ganado',
  'closed won': 'Ganado',
  lost: 'Perdido',
  'closed lost': 'Perdido',
};

function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] || stage;
}

const PIE_STAGE_COLORS = [
  'rgb(255, 99, 132)',
  'rgb(54, 162, 235)',
  'rgb(255, 206, 86)',
  'rgb(75, 192, 192)',
  'rgb(153, 102, 255)',
  'rgb(255, 159, 64)',
  'rgb(199, 199, 199)',
  'rgb(83, 102, 255)',
  'rgb(255, 99, 255)',
  'rgb(99, 255, 132)',
  'rgb(255, 159, 243)',
  'rgb(159, 255, 64)',
  'rgb(64, 159, 255)',
  'rgb(255, 64, 129)',
  'rgb(192, 192, 75)',
];

const ACTIVITY_TYPE_ORDER: Array<'call' | 'email' | 'meeting' | 'note' | 'task'> = [
  'call', 'email', 'meeting', 'note', 'task',
];
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  note: 'Nota',
  task: 'Tarea',
};
const ACTIVITY_BAR_COLORS = [
  '#36A2EB',
  '#4BC0C0',
  '#FFCE56',
  '#FF6384',
  '#9966FF',
];

const COMPANY_STAGE_ORDER = [
  'lead', 'contacto', 'reunion_agendada', 'reunion_efectiva',
  'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final',
  'cierre_ganado', 'firma_contrato', 'activo', 'cierre_perdido', 'cliente_perdido', 'lead_inactivo',
];

const Reports: React.FC = () => {
  const theme = useTheme();

  const getStageColor = (stage: string) => getStageColorUtil(theme, stage);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companiesByUser, setCompaniesByUser] = useState<Record<number, Array<{ stage: string; count: number }>>>({});
  const [dealsByUser, setDealsByUser] = useState<Record<number, Array<{ stage: string; count: number }>>>({});
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [moreAnchor, setMoreAnchor] = useState<{ el: HTMLElement; userId: number } | null>(null);
  const [moreDealsAnchor, setMoreDealsAnchor] = useState<{ el: HTMLElement; userId: number } | null>(null);
  const [hiddenStageIndices, setHiddenStageIndices] = useState<Set<number>>(new Set());
  const [companiesPopoverAnchor, setCompaniesPopoverAnchor] = useState<HTMLElement | null>(null);
  const [companiesAnchorPosition, setCompaniesAnchorPosition] = useState<{ left: number; top: number } | null>(null);
  const [companiesModalStage, setCompaniesModalStage] = useState<string | null>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const clickAnchorRef = React.useRef<HTMLDivElement>(null);
  const [companiesModalStageLabel, setCompaniesModalStageLabel] = useState<string>('');
  const [companiesModalCompanies, setCompaniesModalCompanies] = useState<Array<{ id: number; name: string; companyname?: string | null; lifecycleStage: string; ownerId?: number | null; estimatedRevenue?: number | null }>>([]);
  const [companiesModalLoading, setCompaniesModalLoading] = useState(false);
  const [, setCompaniesModalTotal] = useState(0);
  const [companiesModalPage, setCompaniesModalPage] = useState(1);
  const [companiesModalTotalPages, setCompaniesModalTotalPages] = useState(0);
  const companiesModalLimit = 20;
  const [chartAdvisorFilter, setChartAdvisorFilter] = useState<number | null>(null);
  const [chartOriginFilter, setChartOriginFilter] = useState<string | null>(null);
  const [chartPeriodFilter, setChartPeriodFilter] = useState<string>('');
  const [etapaFilterAnchorEl, setEtapaFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [chartCompaniesByUser, setChartCompaniesByUser] = useState<Record<number, Array<{ stage: string; count: number }>>>({});
  const [chartDealsAdvisorFilter, setChartDealsAdvisorFilter] = useState<number | null>(null);
  const [activitiesByType, setActivitiesByType] = useState<Record<string, number>>({});
  const [activitiesAdvisorFilter, setActivitiesAdvisorFilter] = useState<number | null>(null);
  const [activitiesPeriodFilter, setActivitiesPeriodFilter] = useState<string>('');
  const [activitiesPopoverAnchor, setActivitiesPopoverAnchor] = useState<HTMLElement | null>(null);
  const [activitiesAnchorPosition, setActivitiesAnchorPosition] = useState<{ left: number; top: number } | null>(null);
  const [activitiesModalType, setActivitiesModalType] = useState<string | null>(null);
  const [activitiesModalTypeLabel, setActivitiesModalTypeLabel] = useState<string>('');
  const [activitiesModalItems, setActivitiesModalItems] = useState<Array<{ entityType: 'company' | 'contact' | 'deal'; id: number; name: string }>>([]);
  const [activitiesModalLoading, setActivitiesModalLoading] = useState(false);
  const [activitiesModalPage, setActivitiesModalPage] = useState(1);
  const [activitiesModalTotalPages, setActivitiesModalTotalPages] = useState(0);
  const [, setActivitiesModalTotal] = useState(0);
  const activitiesModalLimit = 20;
  const activitiesChartContainerRef = React.useRef<HTMLDivElement>(null);
  const activitiesClickAnchorRef = React.useRef<HTMLDivElement>(null);
  const activitiesClickPositionRef = React.useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });

  // Movimiento semanal de empresas (polar area: avance, nuevo ingreso, retroceso, sin cambios)
  const [weeklyMovementAdvisorFilter, setWeeklyMovementAdvisorFilter] = useState<number | null>(null);
  const [weeklyMovementRangeData, setWeeklyMovementRangeData] = useState<Array<{
    year: number;
    week: number;
    nuevoIngreso: number;
    avance: number;
    retroceso: number;
    sinCambios: number;
  }>>([]);
  const [weeklyMovementRangeLoading, setWeeklyMovementRangeLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchCompaniesByUser();
    fetchDealsByUser();
  }, []);

  const fetchCompaniesByUser = async () => {
    try {
      const response = await api.get<{ byUser: Record<number, Array<{ stage: string; count: number }>> }>('/reports/companies-by-user');
      setCompaniesByUser(response.data?.byUser || {});
    } catch (err: any) {
      console.error('Error al cargar empresas por asesor:', err);
    }
  };

  const fetchChartCompaniesByUser = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (chartAdvisorFilter != null) params.set('userId', String(chartAdvisorFilter));
      if (chartOriginFilter !== null) {
        params.set('leadSource', chartOriginFilter === '' ? '__null__' : chartOriginFilter);
      }
      if (chartPeriodFilter && ['day', 'week', 'month', 'year'].includes(chartPeriodFilter)) {
        params.set('period', chartPeriodFilter);
      }
      const url = `/reports/companies-by-user${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ byUser: Record<number, Array<{ stage: string; count: number }>> }>(url);
      setChartCompaniesByUser(response.data?.byUser || {});
    } catch (err: any) {
      console.error('Error al cargar empresas para gráfico:', err);
      setChartCompaniesByUser({});
    }
  }, [chartAdvisorFilter, chartOriginFilter, chartPeriodFilter]);

  useEffect(() => {
    fetchChartCompaniesByUser();
  }, [fetchChartCompaniesByUser]);

  const fetchCompaniesList = async (stage: string, page: number) => {
    if (!stage) return;
    setCompaniesModalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('stage', stage);
      if (chartAdvisorFilter != null) params.set('userId', String(chartAdvisorFilter));
      if (chartOriginFilter !== null) params.set('leadSource', chartOriginFilter === '' ? '__null__' : chartOriginFilter);
      if (chartPeriodFilter && ['day', 'week', 'month', 'year'].includes(chartPeriodFilter)) params.set('period', chartPeriodFilter);
      params.set('page', String(page));
      params.set('limit', String(companiesModalLimit));
      const response = await api.get<{ companies: Array<{ id: number; name: string; companyname?: string | null; lifecycleStage: string; ownerId?: number | null; estimatedRevenue?: number | null }>; total: number; page: number; totalPages: number }>(`/reports/companies-list?${params.toString()}`);
      setCompaniesModalCompanies(response.data?.companies || []);
      setCompaniesModalTotal(response.data?.total ?? 0);
      setCompaniesModalPage(response.data?.page ?? 1);
      setCompaniesModalTotalPages(response.data?.totalPages ?? 0);
    } catch (err: any) {
      console.error('Error al cargar empresas por etapa:', err);
      setCompaniesModalCompanies([]);
      setCompaniesModalTotal(0);
    } finally {
      setCompaniesModalLoading(false);
    }
  };

  const handleOpenCompaniesList = (stageKey: string, stageLabel: string, clientX?: number, clientY?: number) => {
    setCompaniesModalStage(stageKey);
    setCompaniesModalStageLabel(stageLabel);
    if (clientX !== undefined && clientY !== undefined) {
      setCompaniesAnchorPosition({ left: clientX, top: clientY });
    } else {
      // Fallback: usar el contenedor del gráfico
      setCompaniesPopoverAnchor(chartContainerRef.current);
    }
    setCompaniesModalPage(1);
    fetchCompaniesList(stageKey, 1);
  };

  // Abrir el popover después de que el ancla se haya renderizado con la posición correcta
  useEffect(() => {
    if (companiesAnchorPosition != null && companiesModalStage != null && clickAnchorRef.current) {
      setCompaniesPopoverAnchor(clickAnchorRef.current);
    }
  }, [companiesAnchorPosition, companiesModalStage]);

  const fetchActivitiesByType = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activitiesAdvisorFilter != null) params.set('userId', String(activitiesAdvisorFilter));
      if (activitiesPeriodFilter && ['day', 'week', 'month', 'year'].includes(activitiesPeriodFilter)) {
        params.set('period', activitiesPeriodFilter);
      }
      const url = `/reports/activities-by-type${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ byType: Record<string, number> }>(url);
      setActivitiesByType(response.data?.byType || {});
    } catch (err: any) {
      console.error('Error al cargar actividades por tipo:', err);
      setActivitiesByType({});
    }
  }, [activitiesAdvisorFilter, activitiesPeriodFilter]);

  const fetchActivitiesEntitiesList = async (activityType: string, page: number) => {
    if (!activityType) return;
    setActivitiesModalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('activityType', activityType);
      if (activitiesAdvisorFilter != null) params.set('userId', String(activitiesAdvisorFilter));
      if (activitiesPeriodFilter && ['day', 'week', 'month', 'year'].includes(activitiesPeriodFilter)) params.set('period', activitiesPeriodFilter);
      params.set('page', String(page));
      params.set('limit', String(activitiesModalLimit));
      const response = await api.get<{ items: Array<{ entityType: 'company' | 'contact' | 'deal'; id: number; name: string }>; total: number; page: number; totalPages: number }>(`/reports/activities-entities-list?${params.toString()}`);
      setActivitiesModalItems(response.data?.items || []);
      setActivitiesModalTotal(response.data?.total ?? 0);
      setActivitiesModalPage(response.data?.page ?? 1);
      setActivitiesModalTotalPages(response.data?.totalPages ?? 0);
    } catch (err: any) {
      console.error('Error al cargar entidades por tipo de actividad:', err);
      setActivitiesModalItems([]);
      setActivitiesModalTotal(0);
    } finally {
      setActivitiesModalLoading(false);
    }
  };

  const fetchCompaniesWeeklyMovementRange = useCallback(async () => {
    setWeeklyMovementRangeLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('weeks', '5');
      if (weeklyMovementAdvisorFilter != null) params.set('userId', String(weeklyMovementAdvisorFilter));
      const response = await api.get<{
        weeks: Array<{
          year: number;
          week: number;
          nuevoIngreso: number;
          avance: number;
          retroceso: number;
          sinCambios: number;
        }>;
      }>(`/reports/companies-weekly-movement-range?${params.toString()}`);
      setWeeklyMovementRangeData(response.data?.weeks ?? []);
    } catch (err: any) {
      console.error('Error al cargar movimiento por rango de semanas:', err);
      setWeeklyMovementRangeData([]);
    } finally {
      setWeeklyMovementRangeLoading(false);
    }
  }, [weeklyMovementAdvisorFilter]);

  useEffect(() => {
    fetchCompaniesWeeklyMovementRange();
  }, [fetchCompaniesWeeklyMovementRange]);

  const handleOpenActivitiesList = (activityType: string, label: string, clientX: number, clientY: number) => {
    setActivitiesAnchorPosition({ left: clientX, top: clientY });
    setActivitiesModalType(activityType);
    setActivitiesModalTypeLabel(label);
    setActivitiesModalPage(1);
    fetchActivitiesEntitiesList(activityType, 1);
  };

  // Abrir el popover después de que el ancla se haya renderizado con la posición correcta
  useEffect(() => {
    if (activitiesAnchorPosition != null && activitiesModalType != null && activitiesClickAnchorRef.current) {
      setActivitiesPopoverAnchor(activitiesClickAnchorRef.current);
    }
  }, [activitiesAnchorPosition, activitiesModalType]);

  useEffect(() => {
    fetchActivitiesByType();
  }, [fetchActivitiesByType]);

  const fetchDealsByUser = async () => {
    try {
      const response = await api.get<{ byUser: Record<number, Array<{ stage: string; count: number }>> }>('/reports/deals-by-user');
      setDealsByUser(response.data?.byUser || {});
    } catch (err: any) {
      console.error('Error al cargar negocios por asesor:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params: { minimal: true } });
      const userRoleUsers = response.data
        .map((user: any) => ({
          ...user,
          role: user.role || user.Role?.name || 'user',
        }))
        .filter((user: User) => user.role === 'user');
      setUsers(userRoleUsers);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let list = [...users];
    const q = (searchInput || '').toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) =>
          (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }
    const perf = stats?.deals?.userPerformance || [];
    const getValue = (u: User) => (perf.find((p: any) => p.userId === u.id)?.wonDealsValue ?? 0);
    if (sortBy === 'name') {
      list.sort((a, b) => (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName));
    } else if (sortBy === 'nameDesc') {
      list.sort((a, b) => (b.firstName + ' ' + b.lastName).localeCompare(a.firstName + ' ' + a.lastName));
    } else if (sortBy === 'totalDesc') {
      list.sort((a, b) => getValue(b) - getValue(a));
    } else if (sortBy === 'totalAsc') {
      list.sort((a, b) => getValue(a) - getValue(b));
    }
    return list;
  }, [users, searchInput, sortBy, stats?.deals?.userPerformance]);

  const totalItems = filteredAndSortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  // Conteo por etapa de empresas (agregado de todos los asesores) para el gráfico polar
  const companyStagesChartData = useMemo(() => {
    const byStage: Record<string, number> = {};
    const lists = Object.values(chartCompaniesByUser);
    lists.forEach((list) => {
      (list || []).forEach(({ stage, count }) => {
        const key = (stage || 'lead').toString().trim().toLowerCase();
        byStage[key] = (byStage[key] || 0) + count;
      });
    });
    const labels: string[] = [];
    const series: number[] = [];
    const stageKeys: string[] = [];
    COMPANY_STAGE_ORDER.forEach((stage) => {
      const total = byStage[stage] ?? 0;
      labels.push(getStageLabel(stage));
      series.push(total);
      stageKeys.push(stage);
    });
    Object.keys(byStage).forEach((stage) => {
      if (!COMPANY_STAGE_ORDER.includes(stage)) {
        labels.push(getStageLabel(stage));
        series.push(byStage[stage] ?? 0);
        stageKeys.push(stage);
      }
    });
    return { labels, series, stageKeys };
  }, [chartCompaniesByUser]);

  // Conteo por etapa de negocios (donut con total en el centro) - card a la derecha de Movimiento por semana
  const dealsChartData = useMemo(() => {
    const lists = chartDealsAdvisorFilter != null && dealsByUser[chartDealsAdvisorFilter]
      ? [dealsByUser[chartDealsAdvisorFilter]!]
      : Object.values(dealsByUser);
    const byStage: Record<string, number> = {};
    lists.forEach((list) => {
      (list || []).forEach(({ stage, count }) => {
        const key = (stage || 'lead').toString().trim().toLowerCase();
        byStage[key] = (byStage[key] || 0) + count;
      });
    });
    const labels: string[] = [];
    const series: number[] = [];
    COMPANY_STAGE_ORDER.forEach((stage) => {
      const total = byStage[stage] ?? 0;
      labels.push(getStageLabel(stage));
      series.push(total);
    });
    Object.keys(byStage).forEach((stage) => {
      if (!COMPANY_STAGE_ORDER.includes(stage)) {
        labels.push(getStageLabel(stage));
        series.push(byStage[stage] ?? 0);
      }
    });
    const total = series.reduce((a, b) => a + b, 0);
    return { labels, series, total };
  }, [dealsByUser, chartDealsAdvisorFilter]);

  const activitiesChartData = useMemo(() => {
    const categories = ACTIVITY_TYPE_ORDER.map((t) => ACTIVITY_TYPE_LABELS[t] || t);
    const data = ACTIVITY_TYPE_ORDER.map((t) => activitiesByType[t] ?? 0);
    return { categories, data };
  }, [activitiesByType]);

  // Colores para gráficos de movimiento semanal (paleta de la imagen: azul, verde, naranja, rojo/rosa)
  const movementChartColors = useMemo(() => [
    '#2196F3', // Azul brillante (Avance)
    '#4CAF50', // Verde brillante (Nuevo ingreso)
    '#FFA726', // Naranja/ámbar (Retroceso)
    '#EF5350', // Rojo/rosa (Sin cambios)
  ], []);

  // Gráfico stacked bar horizontal por semana (números absolutos, no porcentaje)
  const weeklyMovementRangeChart = useMemo(() => {
    const rows = weeklyMovementRangeData;
    if (!rows.length) {
      return {
        series: [] as Array<{ name: string; data: number[] }>,
        options: {
          chart: { type: 'bar' as const, height: 350, stacked: true, horizontal: true, background: 'transparent' },
          xaxis: { categories: [] as string[] },
        } as ApexOptions,
      };
    }
    const categories = rows.map((r) => String(r.week));
    const series = [
      { name: 'Avance', data: rows.map((r) => r.avance) },
      { name: 'Nuevo ingreso', data: rows.map((r) => r.nuevoIngreso) },
      { name: 'Retroceso', data: rows.map((r) => r.retroceso) },
      { name: 'Sin cambios', data: rows.map((r) => r.sinCambios) },
    ];
    return {
      series,
      options: {
        chart: { type: 'bar' as const, height: 680, stacked: true, background: 'transparent' },
        plotOptions: {
          bar: {
            horizontal: true as const,
            barHeight: '85%',
            borderRadius: 4,
          },
        },
        stroke: { width: 2, colors: [theme.palette.background.paper] },
        fill: { opacity: 1 },
        theme: { mode: theme.palette.mode as 'light' | 'dark' },
        grid: {
          borderColor: theme.palette.divider,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
        },
        xaxis: {
          categories,
          axisBorder: { color: theme.palette.divider },
          labels: { style: { colors: theme.palette.text.secondary } },
        },
        yaxis: {
          axisBorder: { color: theme.palette.divider },
          labels: {
            formatter: (val: number) => String(val),
            style: { colors: theme.palette.text.secondary },
          },
        },
        dataLabels: { enabled: true, formatter: (val: number) => (val ? String(val) : '') },
        legend: {
          position: 'top' as const,
          horizontalAlign: 'left' as const,
          offsetX: 40,
          fontSize: '14px',
          itemMargin: { horizontal: 16 },
          markers: { shape: 'circle' as const, strokeWidth: 0, size: 8 },
        },
        colors: movementChartColors,
      } as ApexOptions,
    };
  }, [weeklyMovementRangeData, movementChartColors, theme.palette.mode, theme.palette.divider, theme.palette.text.secondary, theme.palette.background.paper]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, sortBy, itemsPerPage]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const reportsCardBg = theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 1.25 }, mb: 2, alignItems: 'flex-start' }}>
      {/* Card: Conteo por etapa de empresas (gráfico Pie Chart.js) - mismo diseño que bloque Asesores */}
      <Card
        sx={{
          maxWidth: { xs: 660, md: 800 },
          flex: { md: '0 0 auto' },
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 2, md: 1.5 },
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Conteo por etapa (empresas)
          </Typography>
        </Box>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: 1,
            pb: 0,
            bgcolor: reportsCardBg,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 2, sm: 1.5 }, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, flex: { xs: '1 1 100%', md: '0 0 auto' }, minWidth: { md: 0 } }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Asesor
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 }, maxWidth: { sm: 140 }, width: { md: 140 } }}>
                <Select
                  value={chartAdvisorFilter === null ? '' : String(chartAdvisorFilter)}
                  onChange={(e) => setChartAdvisorFilter(e.target.value === '' ? null : Number(e.target.value))}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: reportsCardBg,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                    '& .MuiSelect-select': { py: 1 },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: reportsCardBg,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1.5,
                        mt: 1,
                        '& .MuiMenuItem-root': { color: theme.palette.text.primary },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.firstName} {u.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, flex: { xs: '1 1 auto', md: '0 0 auto' }, minWidth: { md: 0 } }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Origen
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 }, maxWidth: { sm: 120 }, width: { md: 120 } }}>
                <Select
                  value={chartOriginFilter === null ? '' : chartOriginFilter}
                  onChange={(e) => setChartOriginFilter(e.target.value === '' ? null : e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: reportsCardBg,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                    '& .MuiSelect-select': { py: 1 },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: reportsCardBg,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1.5,
                        mt: 1,
                        '& .MuiMenuItem-root': { color: theme.palette.text.primary },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value="__null__">Sin origen</MenuItem>
                  <MenuItem value="referido">Referido</MenuItem>
                  <MenuItem value="base">Base</MenuItem>
                  <MenuItem value="entorno">Entorno</MenuItem>
                  <MenuItem value="feria">Feria</MenuItem>
                  <MenuItem value="masivo">Masivo</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, flex: { xs: '1 1 auto', md: '0 0 auto' }, minWidth: { md: 0 } }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Período
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 }, maxWidth: { sm: 140 }, width: { md: 140 } }}>
                <Select
                  value={chartPeriodFilter}
                  onChange={(e) => setChartPeriodFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: reportsCardBg,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                    '& .MuiSelect-select': { py: 1 },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: reportsCardBg,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1.5,
                        mt: 1,
                        '& .MuiMenuItem-root': { color: theme.palette.text.primary },
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value="day">Por día (24h)</MenuItem>
                  <MenuItem value="week">Por semana (7 días)</MenuItem>
                  <MenuItem value="month">Por mes (30 días)</MenuItem>
                  <MenuItem value="year">Por año</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, flex: { xs: '1 1 auto', md: '0 0 auto' }, minWidth: { md: 0 } }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Etapa
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => setEtapaFilterAnchorEl(e.currentTarget)}
                sx={{
                  minWidth: { xs: '100%', sm: 140 },
                  maxWidth: { sm: 140 },
                  width: { md: 140 },
                  justifyContent: 'space-between',
                  borderRadius: 1.5,
                  bgcolor: reportsCardBg,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  border: `1.5px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                  textTransform: 'none',
                  py: 1,
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    bgcolor: reportsCardBg,
                  },
                }}
              >
                {hiddenStageIndices.size === 0
                  ? 'Todas visibles'
                  : `${hiddenStageIndices.size} oculta${hiddenStageIndices.size === 1 ? '' : 's'}`}
                <ChevronRight sx={{ transform: 'rotate(90deg)', fontSize: 20 }} />
              </Button>
              <Popover
                open={Boolean(etapaFilterAnchorEl)}
                anchorEl={etapaFilterAnchorEl}
                onClose={() => setEtapaFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    bgcolor: reportsCardBg,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    mt: 1,
                    p: 1.5,
                    minWidth: 280,
                    maxWidth: 360,
                  },
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
                  Clic en una etapa para ocultarla o mostrarla en el gráfico
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 0.75,
                  }}
                >
                  {companyStagesChartData.labels.map((label, i) => {
                    const color = PIE_STAGE_COLORS[i % PIE_STAGE_COLORS.length];
                    const isHidden = hiddenStageIndices.has(i);
                    return (
                      <Box
                        key={`etapa-filter-${i}-${label}`}
                        onClick={() => {
                          setHiddenStageIndices((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          });
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          borderRadius: 1,
                          px: 1,
                          py: 0.75,
                          opacity: isHidden ? 0.5 : 1,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                            opacity: isHidden ? 0.7 : 1,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            textDecoration: isHidden ? 'line-through' : 'none',
                          }}
                        >
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Popover>
            </Box>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 0, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg }}>
          {companyStagesChartData.series.some((v) => v > 0) ? (
            (() => {
              const visibleIndices = companyStagesChartData.labels
                .map((_, i) => i)
                .filter((i) => !hiddenStageIndices.has(i));
              const chartLabels = visibleIndices.map((i) => companyStagesChartData.labels[i]);
              const chartSeries = visibleIndices.map((i) => companyStagesChartData.series[i]);
              const chartBg = visibleIndices.map((i) => PIE_STAGE_COLORS[i % PIE_STAGE_COLORS.length]);
              
              // Preparar datos para el funnel chart
              const funnelData = chartSeries.filter((val) => val > 0);
              const funnelLabels = chartLabels.filter((_, i) => chartSeries[i] > 0);
              const funnelStageKeys = visibleIndices
                .filter((_, i) => chartSeries[i] > 0)
                .map((i) => companyStagesChartData.stageKeys[i]);
              const funnelColors = chartBg.filter((_, i) => chartSeries[i] > 0);

              const funnelChartHeight = Math.max(140, Math.min(420, funnelData.length * 52));
              // Opciones del gráfico de embudo
              const funnelOptions: ApexOptions = {
                chart: {
                  type: 'bar',
                  height: funnelChartHeight,
                  dropShadow: {
                    enabled: true,
                  },
                  toolbar: { show: false },
                  fontFamily: 'inherit',
                  selection: { enabled: false },
                  events: {
                    dataPointSelection: (event: MouseEvent, chartContext: unknown, config: { dataPointIndex: number }) => {
                      const index = config?.dataPointIndex ?? -1;
                      if (index >= 0 && index < funnelStageKeys.length) {
                        const stageKey = funnelStageKeys[index];
                        const stageLabel = funnelLabels[index];
                        if (stageKey) {
                          handleOpenCompaniesList(stageKey, stageLabel, event.clientX, event.clientY);
                        }
                      }
                    },
                    click: (event: MouseEvent, chartContext: unknown, config: { dataPointIndex?: number }) => {
                      // Manejar clic en el gráfico
                      if (config?.dataPointIndex !== undefined) {
                        const index = config.dataPointIndex;
                        if (index >= 0 && index < funnelStageKeys.length) {
                          const stageKey = funnelStageKeys[index];
                          const stageLabel = funnelLabels[index];
                          if (stageKey) {
                            handleOpenCompaniesList(stageKey, stageLabel, event.clientX, event.clientY);
                          }
                        }
                      }
                    },
                  },
                },
                plotOptions: {
                  bar: {
                    borderRadius: 0,
                    horizontal: true,
                    barHeight: '80%',
                    isFunnel: true,
                    distributed: true,
                    dataLabels: {
                      position: 'center',
                    },
                  },
                },
                states: {
                  active: {
                    filter: {
                      type: 'none',
                    },
                  },
                  hover: {
                    filter: {
                      type: 'none',
                    },
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: function (val: number, opt: any) {
                    return opt.w.globals.labels[opt.dataPointIndex] + ':  ' + val;
                  },
                  dropShadow: {
                    enabled: true,
                  },
                  style: {
                    colors: [theme.palette.mode === 'dark' ? '#fff' : '#000'],
                    fontSize: '12px',
                    fontWeight: 600,
                  },
                },
                xaxis: {
                  categories: funnelLabels,
                  labels: {
                    style: {
                      colors: theme.palette.text.secondary,
                    },
                  },
                },
                grid: {
                  padding: { top: 0, right: 0, bottom: 0, left: 0 },
                },
                colors: funnelColors,
                legend: {
                  show: false,
                },
                tooltip: {
                  theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
                },
              };

              const funnelSeries = [
                {
                  name: 'Empresas',
                  data: funnelData,
                },
              ];

              return (
                <Box
                  ref={chartContainerRef}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                    pt: 0,
                  }}
                >
                  <Box 
                    sx={{ flex: '0 0 auto', width: '100%', cursor: 'pointer', mt: -1 }}
                    onClickCapture={(e) => {
                      // Capturar posición del clic para el popover
                    }}
                  >
                    {funnelData.length > 0 ? (
                      <ReactApexChart
                        options={funnelOptions}
                        series={funnelSeries}
                        type="bar"
                        height={funnelChartHeight}
                      />
                    ) : (
                      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Todas las etapas ocultas. Haz clic en una etapa para mostrarla.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })()
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay datos de empresas por etapa para mostrar
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Card: Cantidad por tipo de actividad (gráfico de barras ApexCharts) */}
      <Card
        sx={{
          flex: { md: 1 },
          minWidth: 0,
          maxWidth: { xs: 660, md: 'none' },
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 2, md: 1.5 },
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cantidad por tipo de actividad
          </Typography>
        </Box>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: 1,
            pb: 1,
            bgcolor: reportsCardBg,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 1.5 }, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500, minWidth: 44 }}>
                Asesor
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 }, maxWidth: { sm: 160 } }}>
                <Select
                  value={activitiesAdvisorFilter === null ? '' : String(activitiesAdvisorFilter)}
                  onChange={(e) => setActivitiesAdvisorFilter(e.target.value === '' ? null : Number(e.target.value))}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: reportsCardBg,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                    '& .MuiSelect-select': { py: 1 },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: reportsCardBg,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1.5,
                        mt: 1,
                        '& .MuiMenuItem-root': { color: theme.palette.text.primary },
                      },
                    },
                  }}
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.firstName} {u.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 155 }, maxWidth: { sm: 155 } }}>
                <Select
                  value={activitiesPeriodFilter}
                  onChange={(e) => setActivitiesPeriodFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: reportsCardBg,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                    '& .MuiSelect-select': { py: 1 },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: reportsCardBg,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1.5,
                        mt: 1,
                        '& .MuiMenuItem-root': { color: theme.palette.text.primary },
                      },
                    },
                  }}
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  <MenuItem value="day">Por día (24h)</MenuItem>
                  <MenuItem value="week">Por semana (7 días)</MenuItem>
                  <MenuItem value="month">Por mes (30 días)</MenuItem>
                  <MenuItem value="year">Por año</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg }}>
          {activitiesChartData.data.some((v) => v > 0) ? (
            <Box
              ref={activitiesChartContainerRef}
              sx={{ cursor: 'pointer' }}
              onClickCapture={(e) => {
                activitiesClickPositionRef.current = { clientX: e.clientX, clientY: e.clientY };
              }}
            >
            <ReactApexChart
              options={{
                chart: {
                  type: 'bar',
                  height: 350,
                  toolbar: { show: false },
                  fontFamily: 'inherit',
                  selection: { enabled: false },
                  events: {
                    dataPointSelection: (e: MouseEvent, _chartContext: unknown, config: { dataPointIndex: number }) => {
                      const index = config?.dataPointIndex ?? 0;
                      const activityType = ACTIVITY_TYPE_ORDER[index] ?? ACTIVITY_TYPE_ORDER[0];
                      const label = ACTIVITY_TYPE_LABELS[activityType] ?? activityType;
                      handleOpenActivitiesList(activityType, label, e.clientX, e.clientY);
                    },
                  },
                },
                colors: ACTIVITY_BAR_COLORS,
                states: {
                  active: { filter: { type: 'none' } },
                  hover: { filter: { type: 'none' } },
                },
                plotOptions: {
                  bar: {
                    columnWidth: '45%',
                    distributed: true,
                    borderRadius: 4,
                    states: {
                      active: { filter: { type: 'none' } },
                      hover: { filter: { type: 'none' } },
                    },
                  },
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                xaxis: {
                  categories: activitiesChartData.categories,
                  labels: {
                    style: {
                      colors: ACTIVITY_BAR_COLORS,
                      fontSize: '12px',
                    },
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: theme.palette.text.secondary },
                  },
                },
                grid: {
                  borderColor: theme.palette.divider,
                  strokeDashArray: 4,
                  xaxis: { lines: { show: false } },
                },
                tooltip: {
                  theme: theme.palette.mode,
                },
              } as ApexOptions}
              series={[{ name: 'Cantidad', data: activitiesChartData.data }]}
              type="bar"
              height={350}
            />
            </Box>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay actividades para mostrar en el período seleccionado
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
      </Box>

      {/* Fila: Movimiento por semana (izq) + Conteo por etapa negocios donut (der) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 4, mb: 4, alignItems: 'flex-start' }}>
      <Card
        sx={{
          flex: { md: '1 1 auto' },
          minWidth: 0,
          maxWidth: 720,
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 2, md: 1.5 },
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Movimiento por semana (empresas)
          </Typography>
        </Box>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: 1,
            pb: 1,
            bgcolor: reportsCardBg,

            
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={weeklyMovementAdvisorFilter === null ? '' : String(weeklyMovementAdvisorFilter)}
                onChange={(e) => setWeeklyMovementAdvisorFilter(e.target.value === '' ? null : Number(e.target.value))}
                displayEmpty
                sx={{
                  borderRadius: 1.5,
                  bgcolor: reportsCardBg,
                  fontSize: '0.8125rem',
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="">Todos los asesores</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.firstName} {u.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg }}>
          {weeklyMovementRangeLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={40} />
            </Box>
          ) : weeklyMovementRangeChart.series.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay datos de movimiento por semana
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                '& .apexcharts-legend-text': { marginLeft: '-10px' },
              }}
            >
              <ReactApexChart
                options={weeklyMovementRangeChart.options}
                series={weeklyMovementRangeChart.series}
                type="bar"
                height={350}
              />
            </Box>
          )}
        </Box>
      </Card>

      {/* Card: Conteo por etapa (negocios) - donut con total en el centro, a la derecha de Movimiento por semana */}
      <Card
        sx={{
          flex: { md: '1 1 400px' },
          minWidth: { md: 400 },
          maxWidth: { md: 'none' },
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
          },
        }}
      >
        <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 1.5 }, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Conteo por etapa (negocios)
          </Typography>
        </Box>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: 1.5,
            pb: 1.5,
            bgcolor: reportsCardBg,
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>Asesor</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={chartDealsAdvisorFilter === null ? '' : String(chartDealsAdvisorFilter)}
                onChange={(e) => setChartDealsAdvisorFilter(e.target.value === '' ? null : Number(e.target.value))}
                displayEmpty
                sx={{
                  borderRadius: 1.5,
                  bgcolor: reportsCardBg,
                  fontSize: '0.8125rem',
                  border: `1px solid ${theme.palette.divider}`,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="">Todos los asesores</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>{u.firstName} {u.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg }}>
          {dealsChartData.series.some((v) => v > 0) ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                minHeight: 260,
              }}
            >
              <Box
                sx={{
                  flex: '0 0 auto',
                  width: { xs: '100%', sm: 260 },
                  maxWidth: 300,
                  '& .apexcharts-donut-center-label': {
                    '& text': { fill: '#ffffff !important' },
                  },
                }}
              >
                <ReactApexChart
                  options={{
                    chart: { type: 'donut', width: 260, toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
                    colors: PIE_STAGE_COLORS,
                    stroke: { width: 0 },
                    dataLabels: { enabled: false },
                    labels: dealsChartData.labels,
                    theme: { mode: theme.palette.mode as 'light' | 'dark' },
                    plotOptions: {
                      pie: {
                        donut: {
                          labels: {
                            show: true,
                            total: {
                              show: true,
                              showAlways: true,
                              label: 'Total',
                              formatter: () => String(dealsChartData.total),
                              color: '#ffffff',
                            },
                          },
                        },
                      },
                    },
                    responsive: [{ breakpoint: 480, options: { chart: { width: 220, background: 'transparent' } } }],
                    legend: { show: false },
                    tooltip: { theme: theme.palette.mode },
                  } as ApexOptions}
                  series={dealsChartData.series}
                  type="donut"
                  height={260}
                />
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 1,
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: 560,
                }}
              >
                {dealsChartData.labels.map((label, i) => {
                  const color = PIE_STAGE_COLORS[i % PIE_STAGE_COLORS.length];
                  return (
                    <Box
                      key={`${label}-${i}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay datos de negocios por etapa para mostrar
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
      </Box>

      {/* Ancla invisible para Popover de empresas: en portal a body para que position:fixed sea respecto al viewport */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={clickAnchorRef}
            style={{
              position: 'fixed',
              left: companiesAnchorPosition?.left ?? 0,
              top: companiesAnchorPosition?.top ?? 0,
              width: 1,
              height: 1,
              pointerEvents: 'none',
              opacity: 0,
              zIndex: 0,
            }}
            aria-hidden="true"
          />,
          document.body
        )}
      {/* Popover: lista de empresas por etapa al hacer clic en el gráfico (estilo "Asociado con") */}
      <Popover
        open={Boolean(companiesPopoverAnchor)}
        anchorEl={companiesPopoverAnchor}
        onClose={() => {
          setCompaniesPopoverAnchor(null);
          setCompaniesAnchorPosition(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1600 }}
        PaperProps={{
          sx: {
            maxHeight: 520,
            width: 360,
            maxWidth: '90vw',
            overflow: 'hidden',
            mt: 1,
            // Mismo fondo que el card del calendario (#1c252e); forzado aquí por si el tema no gana
            backgroundColor: `${theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper} !important`,
            bgcolor: `${theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper} !important`,
          },
        }}
      >
        {/* Capa de fondo para garantizar #1c252e (mismo que Calendar) por si el Paper no lo aplica */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            borderRadius: 'inherit',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, px: 2, pt: 1.5, pb: 2, bgcolor: 'transparent' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {companiesModalStageLabel}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setCompaniesPopoverAnchor(null)}
              sx={{ color: theme.palette.error.main }}
              aria-label="Cerrar"
            >
              <Close />
            </IconButton>
          </Box>
          {companiesModalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'transparent' }}>
                {companiesModalCompanies.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay empresas en esta etapa
                    </Typography>
                  </Box>
                ) : (
                  companiesModalCompanies.map((c) => (
                    <Box
                      key={c.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        px: 1,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: taxiMonterricoColors.teal,
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                        }}
                      >
                        <Building2 size={16} color="white" />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: theme.palette.text.primary }}>
                          {c.name || '—'}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            display: 'inline-block',
                            mt: 0.25,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: taxiMonterricoColors.green,
                          }}
                        >
                          {c.estimatedRevenue != null ? formatCurrencyPE(Number(c.estimatedRevenue)) : '—'}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
              {companiesModalTotalPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Página {companiesModalPage} de {companiesModalTotalPages}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => companiesModalStage && fetchCompaniesList(companiesModalStage, companiesModalPage - 1)}
                      disabled={companiesModalPage <= 1}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => companiesModalStage && fetchCompaniesList(companiesModalStage, companiesModalPage + 1)}
                      disabled={companiesModalPage >= companiesModalTotalPages}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>

      {/* Ancla invisible para Popover de actividades: en portal a body para que position:fixed sea respecto al viewport */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={activitiesClickAnchorRef}
            style={{
              position: 'fixed',
              left: activitiesAnchorPosition?.left ?? 0,
              top: activitiesAnchorPosition?.top ?? 0,
              width: 1,
              height: 1,
              pointerEvents: 'none',
              opacity: 0,
              zIndex: 0,
            }}
            aria-hidden="true"
          />,
          document.body
        )}
      {/* Popover: entidades vinculadas al tipo de actividad al hacer clic en la barra */}
      <Popover
        open={Boolean(activitiesPopoverAnchor)}
        anchorEl={activitiesPopoverAnchor}
        onClose={() => {
          setActivitiesPopoverAnchor(null);
          setActivitiesAnchorPosition(null);
          setActivitiesModalType(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1600 }}
        PaperProps={{
          sx: {
            maxHeight: 520,
            width: 360,
            maxWidth: '90vw',
            overflow: 'hidden',
            mt: 1,
            backgroundColor: `${theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper} !important`,
            bgcolor: `${theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper} !important`,
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            borderRadius: 'inherit',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, px: 2, pt: 1.5, pb: 2, bgcolor: 'transparent' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {activitiesModalTypeLabel}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setActivitiesPopoverAnchor(null)}
              sx={{ color: theme.palette.error.main }}
              aria-label="Cerrar"
            >
              <Close />
            </IconButton>
          </Box>
          {activitiesModalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'transparent' }}>
                {activitiesModalItems.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay empresas, contactos o negocios vinculados
                    </Typography>
                  </Box>
                ) : (
                  activitiesModalItems.map((item) => (
                    <Box
                      key={`${item.entityType}-${item.id}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        px: 1,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: item.entityType === 'company' ? taxiMonterricoColors.teal : item.entityType === 'contact' ? theme.palette.primary.main : theme.palette.secondary.main,
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                        }}
                      >
                        {item.entityType === 'company' ? (
                          <Building2 size={16} color="white" />
                        ) : item.entityType === 'contact' ? (
                          <Person sx={{ fontSize: 16 }} />
                        ) : (
                          <Business sx={{ fontSize: 16 }} />
                        )}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: theme.palette.text.primary }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {item.entityType === 'company' ? 'Empresa' : item.entityType === 'contact' ? 'Contacto' : 'Negocio'}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
              {activitiesModalTotalPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Página {activitiesModalPage} de {activitiesModalTotalPages}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => activitiesModalType && fetchActivitiesEntitiesList(activitiesModalType, activitiesModalPage - 1)}
                      disabled={activitiesModalPage <= 1}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => activitiesModalType && fetchActivitiesEntitiesList(activitiesModalType, activitiesModalPage + 1)}
                      disabled={activitiesModalPage >= activitiesModalTotalPages}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : `0 8px 24px ${taxiMonterricoColors.greenLight}25`,
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 2, md: 1.5 },
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 2, sm: 0 } }}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${taxiMonterricoColors.green} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Asesores
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField
                size="small"
                placeholder="Buscar"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: { xs: 18, sm: 20 } }} />
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 150 },
                  maxWidth: { xs: '100%', sm: 180 },
                  bgcolor: reportsCardBg,
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    '& fieldset': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: reportsCardBg,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: `1.5px solid ${theme.palette.divider}`,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}20`,
                    },
                    '&.Mui-focused': {
                      borderColor: taxiMonterricoColors.green,
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                    },
                  }}
                >
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                  <MenuItem value="totalDesc">Ordenar por: Total vendido (mayor)</MenuItem>
                  <MenuItem value="totalAsc">Ordenar por: Total vendido (menor)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No hay usuarios con rol de usuario para mostrar
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer
              component={Paper}
              sx={{
                overflowX: 'auto',
                overflowY: 'hidden',
                borderRadius: 1.5,
                overflow: 'hidden',
                border: 'none',
                boxShadow: 'none',
                bgcolor: reportsCardBg,
                '& .MuiPaper-root': { borderRadius: 0, border: 'none', boxShadow: 'none', bgcolor: reportsCardBg },
              }}
            >
              <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: reportsCardBg,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      '& .MuiTableCell-head': { borderBottom: 'none', fontWeight: 600, bgcolor: 'transparent' },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, pl: { xs: 2, md: 3 }, pr: { xs: 0.5, md: 1 }, minWidth: 180, bgcolor: 'transparent' }}>
                      Nombre
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, px: { xs: 1.5, md: 2 }, minWidth: 160, bgcolor: 'transparent' }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, px: { xs: 1.5, md: 2 }, minWidth: 100, bgcolor: 'transparent' }}>
                      Teléfono
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, px: { xs: 1.5, md: 2 }, minWidth: 200, bgcolor: 'transparent' }}>
                      Empresas
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, px: { xs: 1.5, md: 2 }, minWidth: 200, bgcolor: 'transparent' }}>
                      Negocios
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, px: { xs: 1.5, md: 2 }, minWidth: 100, bgcolor: 'transparent' }}>
                      Ventas
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 1.25 }, pl: { xs: 1.5, md: 2 }, pr: { xs: 2, md: 3 }, minWidth: 120, bgcolor: 'transparent' }}>
                      Total Vendido
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center', color: theme.palette.text.secondary }}>
                        No se encontraron asesores que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageUsers.map((user) => {
                      const userStats = stats?.deals?.userPerformance?.find((u: any) => u.userId === user.id);
                      return (
                        <TableRow
                          key={user.id}
                          sx={{
                            bgcolor: reportsCardBg,
                            borderBottom: theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiTableCell-root': { borderBottom: 'none' },
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: theme.palette.mode === 'dark'
                                ? 'inset 0 0 0 9999px rgba(255, 255, 255, 0.015)'
                                : 'inset 0 0 0 9999px rgba(0, 0, 0, 0.012)',
                            },
                          }}
                        >
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: { xs: 0.5, md: 1 } }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, fontSize: { xs: '0.75rem', md: '0.875rem' }, color: theme.palette.text.primary }}>
                            {user.email}
                          </TableCell>
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, fontSize: { xs: '0.75rem', md: '0.875rem' }, color: theme.palette.text.secondary }}>
                            {user.phone || '--'}
                          </TableCell>
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, verticalAlign: 'top' }} onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                              {(() => {
                                const list = companiesByUser[user.id] || [];
                                if (list.length === 0) {
                                  return (
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: theme.palette.text.disabled }}>
                                      --
                                    </Typography>
                                  );
                                }
                                const maxVisible = 4;
                                const visible = list.slice(0, maxVisible);
                                const restCount = list.length - maxVisible;
                                const row1 = visible.slice(0, 2);
                                const row2 = visible.slice(2, 4);
                                const tagBaseSx = {
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 2,
                                  fontSize: '0.75rem',
                                };
                                const Tag = ({ stage, count }: { stage: string; count: number }) => {
                                  const { color } = getStageColor(stage);
                                  return (
                                    <Box
                                      sx={{
                                        ...tagBaseSx,
                                        color,
                                        border: `1px solid ${theme.palette.divider}`,
                                      }}
                                    >
                                      <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                                        {getStageLabel(stage)}:
                                      </Typography>
                                      <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                                        {count}
                                      </Typography>
                                    </Box>
                                  );
                                };
                                return (
                                  <>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                      {row1.map(({ stage, count }) => <Tag key={stage} stage={stage} count={count} />)}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                      {row2.map(({ stage, count }) => <Tag key={stage} stage={stage} count={count} />)}
                                      {restCount > 0 && (
                                        <Box
                                          component="span"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMoreAnchor({ el: e.currentTarget as HTMLElement, userId: user.id });
                                          }}
                                          sx={{
                                            ...tagBaseSx,
                                            cursor: 'pointer',
                                            color: theme.palette.text.secondary,
                                            border: `1px solid ${theme.palette.divider}`,
                                            '&:hover': {
                                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                            },
                                          }}
                                        >
                                          +{restCount} más
                                        </Box>
                                      )}
                                    </Box>
                                  </>
                                );
                              })()}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, verticalAlign: 'top' }} onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                              {(() => {
                                const list = dealsByUser[user.id] || [];
                                if (list.length === 0) {
                                  return (
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: theme.palette.text.disabled }}>
                                      --
                                    </Typography>
                                  );
                                }
                                const maxVisible = 4;
                                const visible = list.slice(0, maxVisible);
                                const restCount = list.length - maxVisible;
                                const row1 = visible.slice(0, 2);
                                const row2 = visible.slice(2, 4);
                                const tagBaseSx = {
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 2,
                                  fontSize: '0.75rem',
                                };
                                const DealTag = ({ stage, count }: { stage: string; count: number }) => {
                                  const { color } = getStageColor(stage);
                                  return (
                                    <Box sx={{ ...tagBaseSx, color, border: `1px solid ${theme.palette.divider}` }}>
                                      <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                                        {getStageLabel(stage)}:
                                      </Typography>
                                      <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                                        {count}
                                      </Typography>
                                    </Box>
                                  );
                                };
                                return (
                                  <>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                      {row1.map(({ stage, count }) => <DealTag key={stage} stage={stage} count={count} />)}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                      {row2.map(({ stage, count }) => <DealTag key={stage} stage={stage} count={count} />)}
                                      {restCount > 0 && (
                                        <Box
                                          component="span"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMoreDealsAnchor({ el: e.currentTarget as HTMLElement, userId: user.id });
                                          }}
                                          sx={{
                                            ...tagBaseSx,
                                            cursor: 'pointer',
                                            color: theme.palette.text.secondary,
                                            border: `1px solid ${theme.palette.divider}`,
                                            '&:hover': {
                                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                            },
                                          }}
                                        >
                                          +{restCount} más
                                        </Box>
                                      )}
                                    </Box>
                                  </>
                                );
                              })()}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' }, color: theme.palette.text.primary }}>
                            {userStats ? `${userStats.wonDeals || 0} ${userStats.wonDeals === 1 ? 'venta' : 'ventas'}` : '0 ventas'}
                          </TableCell>
                          <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 1.5, md: 2 }, pr: { xs: 2, md: 3 }, fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' }, color: theme.palette.text.primary }}>
                            {userStats ? formatCurrencyPE(userStats.wonDealsValue || 0) : formatCurrencyPE(0)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {totalItems > 0 && (
              <Box
                sx={{
                  bgcolor: reportsCardBg,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  px: { xs: 2, md: 3 },
                  py: { xs: 1, md: 1.5 },
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: { xs: 1.5, md: 2 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    Filas por página:
                  </Typography>
                  <Select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    size="small"
                    sx={{
                      fontSize: '0.8125rem',
                      height: '32px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: taxiMonterricoColors.green },
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={7}>7</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {startIndex + 1}-{endIndex} de {totalItems}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      size="small"
                      sx={{
                        color: currentPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                        '&:hover': { bgcolor: currentPage === 1 ? 'transparent' : theme.palette.action.hover },
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      size="small"
                      sx={{
                        color: currentPage === totalPages ? theme.palette.action.disabled : theme.palette.text.secondary,
                        '&:hover': { bgcolor: currentPage === totalPages ? 'transparent' : theme.palette.action.hover },
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </Card>

      <Popover
        open={Boolean(moreAnchor)}
        anchorEl={moreAnchor?.el}
        onClose={() => setMoreAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5, maxWidth: 320 } } }}
      >
        {moreAnchor && (() => {
          const fullList = companiesByUser[moreAnchor.userId] || [];
          const restOnly = fullList.slice(4);
          if (restOnly.length === 0) return null;
          return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {restOnly.map(({ stage, count }) => {
              const { color } = getStageColor(stage);
              return (
                <Box
                  key={stage}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    color,
                    border: `1px solid ${theme.palette.divider}`,
                    fontSize: '0.75rem',
                  }}
                >
                  <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                    {getStageLabel(stage)}:
                  </Typography>
                  <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                    {count}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          );
        })()}
      </Popover>

      <Popover
        open={Boolean(moreDealsAnchor)}
        anchorEl={moreDealsAnchor?.el}
        onClose={() => setMoreDealsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5, maxWidth: 320 } } }}
      >
        {moreDealsAnchor && (() => {
          const fullList = dealsByUser[moreDealsAnchor.userId] || [];
          const restOnly = fullList.slice(4);
          if (restOnly.length === 0) return null;
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {restOnly.map(({ stage, count }) => {
                const { color } = getStageColor(stage);
                return (
                  <Box
                    key={stage}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      color,
                      border: `1px solid ${theme.palette.divider}`,
                      fontSize: '0.75rem',
                    }}
                  >
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                      {getStageLabel(stage)}:
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit', color: 'inherit' }}>
                      {count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          );
        })()}
      </Popover>
    </Box>
  );
};

export default Reports;
