import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Popover,
  useTheme,
  Button,
  Avatar,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Close, Business, KeyboardArrowDown } from '@mui/icons-material';
import { Building2, Handshake, UserRound, PencilLine } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { CCalendar } from '@coreui/react-pro';
import '@coreui/coreui-pro/dist/css/coreui.min.css';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { formatCurrencyPE } from '../utils/currencyUtils';

ChartJS.register(ArcElement, ChartTooltip, Legend);

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
  cliente_perdido: 'Cierre Perdido',
  lead_inactivo: 'Inactivo',
  won: 'Ganado',
  'closed won': 'Ganado',
  lost: 'Perdido',
  'closed lost': 'Perdido',
};

function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] || stage;
}

// Paleta clara para embudo y pastel (sin gradientes, colores planos y vibrantes)
const PIE_STAGE_COLORS = [
  '#4F9B4D',   // Lead - verde medio
  '#5CB85C',   // Contacto - verde claro
  '#3C7B3B',   // Reunión Agendada - verde oscuro
  '#43AF96',   // Reunión Efectiva - teal
  '#3DBDB8',   // Propuesta Económica - teal claro
  '#3498DB',   // Negociación - azul
  '#5DADE2',   // Licitación - azul claro
  '#2980B9',   // Licitación Etapa Final - azul oscuro
  '#27AE60',   // Cierre Ganado - verde éxito
  '#2ECC71',   // Firma Contrato - verde
  '#1ABC9C',   // Activo - teal
  '#E74C3C',   // Cierre Perdido - rojo
  '#95A5A6',   // Inactivo - gris
];

const WEEKLY_MOVEMENT_LABELS = ['Avance', 'Nuevo ingreso', 'Retroceso', 'Sin cambios'];
const WEEKLY_MOVEMENT_TYPES = ['avance', 'nuevoIngreso', 'retroceso', 'sinCambios'] as const;

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
  '#13944C', // Verde principal
  '#4CAF50', // Verde claro
  '#0d9394', // Teal
  '#FFA726', // Ámbar (acento)
  '#1976D2', // Azul profesional
];

const COMPANY_STAGE_ORDER = [
  'lead', 'contacto', 'reunion_agendada', 'reunion_efectiva',
  'propuesta_economica', 'negociacion', 'licitacion', 'licitacion_etapa_final',
  'cierre_ganado', 'firma_contrato', 'activo', 'cierre_perdido', 'lead_inactivo',
];

const Reports: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isRoleUser = currentUser?.role === 'user';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setStats] = useState<DashboardStats | null>(null);
  const [, setCompaniesByUser] = useState<Record<number, Array<{ stage: string; count: number }>>>({});
  const [dealsByUser, setDealsByUser] = useState<Record<number, Array<{ stage: string; count: number; amount: number }>>>({});
  const [companiesPopoverAnchor, setCompaniesPopoverAnchor] = useState<HTMLElement | null>(null);
  const [companiesAnchorPosition, setCompaniesAnchorPosition] = useState<{ left: number; top: number } | null>(null);
  const [companiesModalStage, setCompaniesModalStage] = useState<string | null>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const clickAnchorRef = React.useRef<HTMLDivElement>(null);
  const [companiesModalStageLabel, setCompaniesModalStageLabel] = useState<string>('');
  const [companiesModalWeeklyContext, setCompaniesModalWeeklyContext] = useState<{ year: number; week: number; movementType: string } | null>(null);
  const [companiesModalCompanies, setCompaniesModalCompanies] = useState<Array<{ id: number; name: string; companyname?: string | null; lifecycleStage: string; ownerId?: number | null; estimatedRevenue?: number | null }>>([]);
  const [companiesModalLoading, setCompaniesModalLoading] = useState(false);
  const [, setCompaniesModalTotal] = useState(0);
  const [companiesModalPage, setCompaniesModalPage] = useState(1);
  const [companiesModalTotalPages, setCompaniesModalTotalPages] = useState(0);
  const companiesModalLimit = 20;
  const [reportsAdvisorFilter, setReportsAdvisorFilter] = useState<number | null>(null);
  const [reportsDateRange, setReportsDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [periodPopoverAnchor, setPeriodPopoverAnchor] = useState<HTMLElement | null>(null);
  const [calendarStart, setCalendarStart] = useState<Date | null>(null);
  const [calendarEnd, setCalendarEnd] = useState<Date | null>(null);
  const [chartOriginFilter, setChartOriginFilter] = useState<string | null>(null);
  const [chartEtapaHiddenStages, setChartEtapaHiddenStages] = useState<Set<string>>(new Set());
  const [chartEtapaFilterAnchorEl, setChartEtapaFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [chartRecoveredClientFilter, setChartRecoveredClientFilter] = useState<string>('');
  const [chartCompaniesByUser, setChartCompaniesByUser] = useState<Record<number, Array<{ stage: string; count: number }>>>({});
  const [activitiesByType, setActivitiesByType] = useState<Record<string, number>>({});
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

  // Etapas ocultas en el gráfico de negocios (al hacer clic en la leyenda)
  const [dealsChartHiddenStages, setDealsChartHiddenStages] = useState<Set<string>>(new Set());

  // Popover de negocios por etapa (al hacer clic en el gráfico de donut)
  const [dealsPopoverAnchor, setDealsPopoverAnchor] = useState<HTMLElement | null>(null);
  const [dealsAnchorPosition, setDealsAnchorPosition] = useState<{ left: number; top: number } | null>(null);
  const [dealsModalStage, setDealsModalStage] = useState<string | null>(null);
  const [dealsModalStageLabel, setDealsModalStageLabel] = useState<string>('');
  const [dealsModalDeals, setDealsModalDeals] = useState<Array<{ id: number; name: string; amount: number }>>([]);
  const [dealsModalLoading, setDealsModalLoading] = useState(false);
  const [dealsModalPage, setDealsModalPage] = useState(1);
  const [dealsModalTotalPages, setDealsModalTotalPages] = useState(0);
  const dealsModalLimit = 20;
  const dealsClickAnchorRef = React.useRef<HTMLDivElement>(null);

  // Movimiento semanal de empresas (polar area: avance, nuevo ingreso, retroceso, sin cambios)
  const [weeklyMovementRangeData, setWeeklyMovementRangeData] = useState<Array<{
    year: number;
    week: number;
    nuevoIngreso: number;
    avance: number;
    retroceso: number;
    sinCambios: number;
    nuevoIngresoMonto?: number;
    avanceMonto?: number;
    retrocesoMonto?: number;
    sinCambiosMonto?: number;
    objetivo?: number;
    facturacionOverride?: number | null;
  }>>([]);
  const [weeklyMovementRangeLoading, setWeeklyMovementRangeLoading] = useState(false);
  const [weeklyMovementWeekFilter, setWeeklyMovementWeekFilter] = useState<Set<number>>(new Set());
  const [weeklyFilterPopoverAnchor, setWeeklyFilterPopoverAnchor] = useState<HTMLElement | null>(null);
  const [weeklyMovementListModalOpen, setWeeklyMovementListModalOpen] = useState(false);
  const weeklyFilterTableButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const resumenMontoChartContainerRef = React.useRef<HTMLDivElement>(null);
  const [resumenMontoChartHeight, setResumenMontoChartHeight] = useState(360);
  const [weeklyGoalEditModalOpen, setWeeklyGoalEditModalOpen] = useState(false);
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState<{ year: number; week: number; facturacion: number; objetivo: number } | null>(null);
  const [weeklyGoalFacturacionValue, setWeeklyGoalFacturacionValue] = useState('');
  const [weeklyGoalObjetivoValue, setWeeklyGoalObjetivoValue] = useState('');
  const [savingWeeklyGoal, setSavingWeeklyGoal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchCompaniesByUser();
    if (currentUser == null) return;
    if (currentUser.role === 'user') {
      setUsers([{ id: currentUser.id, usuario: (currentUser as any).usuario ?? '', email: currentUser.email ?? '', firstName: currentUser.firstName ?? '', lastName: currentUser.lastName ?? '', role: 'user' } as User]);
      setLoading(false);
    } else {
      fetchUsers();
    }
  }, [currentUser]);

  // Para rol "user", fijar el filtro de asesor al usuario actual (solo ven su reporte)
  useEffect(() => {
    if (currentUser?.id != null && isRoleUser) {
      setReportsAdvisorFilter(currentUser.id);
    }
  }, [currentUser?.id, isRoleUser]);

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
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      if (chartOriginFilter !== null) {
        params.set('leadSource', chartOriginFilter === '' ? '__null__' : chartOriginFilter);
      }
      if (reportsDateRange) {
        params.set('fromDate', reportsDateRange.from.toISOString());
        params.set('toDate', reportsDateRange.to.toISOString());
      }
      if (chartRecoveredClientFilter === 'true' || chartRecoveredClientFilter === 'false') {
        params.set('recoveredClient', chartRecoveredClientFilter);
      }
      const visibleStages = chartEtapaHiddenStages.size > 0
        ? COMPANY_STAGE_ORDER.filter((s) => !chartEtapaHiddenStages.has(s))
        : [];
      if (visibleStages.length > 0) {
        visibleStages.forEach((s) => params.append('stages', s));
      } else if (chartEtapaHiddenStages.size > 0) {
        params.set('stages', '__none__');
      }
      const url = `/reports/companies-by-user${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ byUser: Record<number, Array<{ stage: string; count: number }>> }>(url);
      setChartCompaniesByUser(response.data?.byUser || {});
    } catch (err: any) {
      console.error('Error al cargar empresas para gráfico:', err);
      setChartCompaniesByUser({});
    }
  }, [reportsAdvisorFilter, chartOriginFilter, chartEtapaHiddenStages, chartRecoveredClientFilter, reportsDateRange]);

  useEffect(() => {
    fetchChartCompaniesByUser();
  }, [fetchChartCompaniesByUser]);

  const fetchCompaniesList = async (stage: string, page: number) => {
    if (!stage) return;
    setCompaniesModalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('stage', stage);
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      if (chartOriginFilter !== null) params.set('leadSource', chartOriginFilter === '' ? '__null__' : chartOriginFilter);
      if (reportsDateRange) {
        params.set('fromDate', reportsDateRange.from.toISOString());
        params.set('toDate', reportsDateRange.to.toISOString());
      }
      if (chartRecoveredClientFilter === 'true' || chartRecoveredClientFilter === 'false') params.set('recoveredClient', chartRecoveredClientFilter);
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

  const fetchCompaniesWeeklyMovementList = useCallback(async (year: number, week: number, movementType: string, page: number) => {
    setCompaniesModalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('year', String(year));
      params.set('week', String(week));
      params.set('movementType', movementType);
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      params.set('page', String(page));
      params.set('limit', String(companiesModalLimit));
      const response = await api.get<{ companies: Array<{ id: number; name: string; companyname?: string | null; lifecycleStage: string; ownerId?: number | null; estimatedRevenue?: number | null }>; total: number; page: number; totalPages: number }>(`/reports/companies-weekly-movement-list?${params.toString()}`);
      setCompaniesModalCompanies(response.data?.companies || []);
      setCompaniesModalTotal(response.data?.total ?? 0);
      setCompaniesModalPage(response.data?.page ?? 1);
      setCompaniesModalTotalPages(response.data?.totalPages ?? 0);
    } catch (err: any) {
      console.error('Error al cargar empresas por movimiento semanal:', err);
      setCompaniesModalCompanies([]);
      setCompaniesModalTotal(0);
    } finally {
      setCompaniesModalLoading(false);
    }
  }, [reportsAdvisorFilter, companiesModalLimit]);

  const handleOpenCompaniesList = (stageKey: string, stageLabel: string, clientX?: number, clientY?: number) => {
    setCompaniesModalWeeklyContext(null);
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

  const handleOpenWeeklyMovementCompaniesList = useCallback((year: number, week: number, movementType: string, movementLabel: string, clientX: number, clientY: number) => {
    setCompaniesModalStage('weekly');
    setCompaniesModalStageLabel(`Semana ${week} - ${movementLabel}`);
    setCompaniesModalWeeklyContext({ year, week, movementType });
    setCompaniesAnchorPosition({ left: clientX, top: clientY });
    setCompaniesModalPage(1);
    fetchCompaniesWeeklyMovementList(year, week, movementType, 1);
  }, [fetchCompaniesWeeklyMovementList]);

  // Abrir el popover después de que el ancla se haya renderizado con la posición correcta
  useEffect(() => {
    if (companiesAnchorPosition != null && companiesModalStage != null && clickAnchorRef.current) {
      setCompaniesPopoverAnchor(clickAnchorRef.current);
    }
  }, [companiesAnchorPosition, companiesModalStage]);

  const fetchActivitiesByType = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      if (reportsDateRange) {
        params.set('fromDate', reportsDateRange.from.toISOString());
        params.set('toDate', reportsDateRange.to.toISOString());
      }
      const url = `/reports/activities-by-type${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ byType: Record<string, number> }>(url);
      setActivitiesByType(response.data?.byType || {});
    } catch (err: any) {
      console.error('Error al cargar actividades por tipo:', err);
      setActivitiesByType({});
    }
  }, [reportsAdvisorFilter, reportsDateRange]);

  const fetchActivitiesEntitiesList = async (activityType: string, page: number) => {
    if (!activityType) return;
    setActivitiesModalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('activityType', activityType);
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      if (reportsDateRange) {
        params.set('fromDate', reportsDateRange.from.toISOString());
        params.set('toDate', reportsDateRange.to.toISOString());
      }
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
      params.set('weeks', '10');
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
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
  }, [reportsAdvisorFilter]);

  useEffect(() => {
    fetchCompaniesWeeklyMovementRange();
  }, [fetchCompaniesWeeklyMovementRange]);

  const handleOpenWeeklyGoalEdit = (row: { year: number; week: number; avanceMonto?: number; nuevoIngresoMonto?: number; retrocesoMonto?: number; sinCambiosMonto?: number; objetivo?: number; facturacionOverride?: number | null }) => {
    const facturacion = row.facturacionOverride != null
      ? row.facturacionOverride
      : (row.avanceMonto ?? 0) + (row.nuevoIngresoMonto ?? 0) + (row.retrocesoMonto ?? 0) + (row.sinCambiosMonto ?? 0);
    const objetivo = row.objetivo ?? 0;
    setEditingWeeklyGoal({ year: row.year, week: row.week, facturacion, objetivo });
    setWeeklyGoalFacturacionValue(facturacion.toString());
    setWeeklyGoalObjetivoValue(objetivo.toString());
    setWeeklyGoalEditModalOpen(true);
  };

  const handleSaveWeeklyGoal = async () => {
    if (!editingWeeklyGoal) return;
    setSavingWeeklyGoal(true);
    try {
      const facturacion = parseFloat(weeklyGoalFacturacionValue);
      const objetivo = parseFloat(weeklyGoalObjetivoValue);
      await api.put('/reports/weekly-goal', {
        year: editingWeeklyGoal.year,
        week: editingWeeklyGoal.week,
        objetivo: Number.isNaN(objetivo) ? 0 : objetivo,
        facturacionOverride: Number.isNaN(facturacion) ? null : facturacion,
      });
      setWeeklyGoalEditModalOpen(false);
      setEditingWeeklyGoal(null);
      fetchCompaniesWeeklyMovementRange();
    } catch (err: any) {
      console.error('Error al guardar objetivo semanal:', err);
    } finally {
      setSavingWeeklyGoal(false);
    }
  };

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

  const fetchDealsList = async (stage: string | null, page: number) => {
    setDealsModalLoading(true);
    try {
      const params = new URLSearchParams();
      if (stage) params.set('stage', stage);
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      if (reportsDateRange) {
        params.set('fromDate', reportsDateRange.from.toISOString());
        params.set('toDate', reportsDateRange.to.toISOString());
      }
      params.set('page', String(page));
      params.set('limit', String(dealsModalLimit));
      const response = await api.get<{ deals: Array<{ id: number; name: string; amount: number }>; total: number; page: number; totalPages: number }>(`/reports/deals-list?${params.toString()}`);
      setDealsModalDeals(response.data?.deals || []);
      setDealsModalPage(response.data?.page ?? 1);
      setDealsModalTotalPages(response.data?.totalPages ?? 0);
    } catch (err: any) {
      console.error('Error al cargar negocios por etapa:', err);
      setDealsModalDeals([]);
    } finally {
      setDealsModalLoading(false);
    }
  };

  const handleOpenDealsList = (stageKey: string | null, stageLabel: string, clientX: number, clientY: number) => {
    setDealsModalStage(stageKey);
    setDealsModalStageLabel(stageLabel);
    setDealsAnchorPosition({ left: clientX, top: clientY });
    setDealsModalPage(1);
    fetchDealsList(stageKey, 1);
  };

  useEffect(() => {
    if (dealsAnchorPosition != null && dealsModalStageLabel !== '' && dealsClickAnchorRef.current) {
      setDealsPopoverAnchor(dealsClickAnchorRef.current);
    }
  }, [dealsAnchorPosition, dealsModalStageLabel]);

  useEffect(() => {
    fetchActivitiesByType();
  }, [fetchActivitiesByType]);

  const fetchDealsByUser = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (reportsAdvisorFilter != null) params.set('userId', String(reportsAdvisorFilter));
      if (reportsDateRange) {
        params.set('fromDate', reportsDateRange.from.toISOString());
        params.set('toDate', reportsDateRange.to.toISOString());
      }
      const visibleStages = chartEtapaHiddenStages.size > 0
        ? COMPANY_STAGE_ORDER.filter((s) => !chartEtapaHiddenStages.has(s))
        : [];
      if (visibleStages.length > 0) {
        visibleStages.forEach((s) => params.append('stages', s));
      } else if (chartEtapaHiddenStages.size > 0) {
        params.set('stages', '__none__');
      }
      const url = `/reports/deals-by-user${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ byUser: Record<number, Array<{ stage: string; count: number; amount: number }>> }>(url);
      setDealsByUser(response.data?.byUser || {});
    } catch (err: any) {
      console.error('Error al cargar negocios por asesor:', err);
      setDealsByUser({});
    }
  }, [reportsAdvisorFilter, reportsDateRange, chartEtapaHiddenStages]);

  useEffect(() => {
    fetchDealsByUser();
  }, [fetchDealsByUser]);

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
      const userRoleUsers = (response.data || [])
        .filter((u: any) => u.isActive !== false)
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
    const lists = reportsAdvisorFilter != null
      ? [dealsByUser[reportsAdvisorFilter] || []]
      : Object.values(dealsByUser);
    const byStage: Record<string, { count: number; amount: number }> = {};
    lists.forEach((list) => {
      (list || []).forEach(({ stage, count, amount }) => {
        const key = (stage || 'lead').toString().trim().toLowerCase();
        if (!byStage[key]) byStage[key] = { count: 0, amount: 0 };
        byStage[key].count += count;
        byStage[key].amount += amount ?? 0;
      });
    });
    const labels: string[] = [];
    const series: number[] = [];
    const amounts: number[] = [];
    const stageKeys: string[] = [];
    COMPANY_STAGE_ORDER.forEach((stage) => {
      const data = byStage[stage] ?? { count: 0, amount: 0 };
      labels.push(getStageLabel(stage));
      series.push(data.count);
      amounts.push(data.amount);
      stageKeys.push(stage);
    });
    Object.keys(byStage).forEach((stage) => {
      if (!COMPANY_STAGE_ORDER.includes(stage)) {
        const data = byStage[stage];
        labels.push(getStageLabel(stage));
        series.push(data.count);
        amounts.push(data.amount);
        stageKeys.push(stage);
      }
    });
    const total = series.reduce((a, b) => a + b, 0);
    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    return { labels, series, amounts, total, totalAmount, stageKeys };
  }, [dealsByUser, reportsAdvisorFilter]);

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

  // Gráfico stacked bar horizontal por semana - solo 5 semanas (la tabla Resumen de monto muestra más)
  const weeklyMovementRangeChart = useMemo(() => {
    let rows = weeklyMovementRangeData;
    if (weeklyMovementWeekFilter.size > 0) {
      rows = rows.filter((r) => weeklyMovementWeekFilter.has(r.week));
    } else {
      rows = rows.slice(-5);
    }
    if (!rows.length) {
      return {
        series: [] as Array<{ name: string; data: number[] }>,
        options: {
          chart: { type: 'bar' as const, height: 350, stacked: true, horizontal: true, background: 'transparent' },
          xaxis: { categories: [] as string[] },
          states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
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
        chart: {
          type: 'bar' as const,
          height: 680,
          stacked: true,
          background: 'transparent',
          toolbar: { show: false },
          events: {
            dataPointSelection: (event: MouseEvent, _chartContext: unknown, config: { dataPointIndex?: number; seriesIndex?: number }) => {
              const dataPointIndex = config?.dataPointIndex ?? -1;
              const seriesIndex = config?.seriesIndex ?? -1;
              if (dataPointIndex >= 0 && seriesIndex >= 0 && dataPointIndex < rows.length && seriesIndex < 4) {
                const row = rows[dataPointIndex];
                const value = series[seriesIndex].data[dataPointIndex];
                if (row && value != null && value > 0) {
                  handleOpenWeeklyMovementCompaniesList(
                    row.year,
                    row.week,
                    WEEKLY_MOVEMENT_TYPES[seriesIndex],
                    WEEKLY_MOVEMENT_LABELS[seriesIndex],
                    event.clientX,
                    event.clientY
                  );
                }
              }
            },
          },
        },
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
          yaxis: { lines: { show: false } },
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
        tooltip: {
          theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
          custom: ({ series, dataPointIndex }: { series: number[][]; dataPointIndex: number }) => {
            const row = rows[dataPointIndex];
            if (!row) return '';
            const total = series.reduce((sum, s) => sum + (s[dataPointIndex] ?? 0), 0);
            const labels = WEEKLY_MOVEMENT_LABELS;
            const amounts = [row.avanceMonto ?? 0, row.nuevoIngresoMonto ?? 0, row.retrocesoMonto ?? 0, row.sinCambiosMonto ?? 0];
            let html = `<div style="padding: 8px 12px; font-family: inherit;">`;
            html += `<div style="font-weight: 600; margin-bottom: 6px; font-size: 14px;">${total}</div>`;
            for (let i = 0; i < series.length; i++) {
              const val = series[i]?.[dataPointIndex] ?? 0;
              if (val > 0) {
                const monto = amounts[i] ?? 0;
                const montoStr = monto > 0 ? ` - Monto: ${formatCurrencyPE(monto)}` : '';
                html += `<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0; font-size: 12px;">`;
                html += `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${movementChartColors[i]}; flex-shrink: 0;"></span>`;
                html += `<span>${labels[i]}: ${val}${montoStr}</span></div>`;
              }
            }
            html += `</div>`;
            return html;
          },
        },
        legend: {
          position: 'bottom' as const,
          horizontalAlign: 'center' as const,
          fontSize: '14px',
          itemMargin: { horizontal: 16 },
          markers: { shape: 'circle' as const, strokeWidth: 0, size: 8 },
        },
        colors: movementChartColors,
        states: {
          hover: { filter: { type: 'none' } },
          active: { filter: { type: 'none' } },
        },
      } as ApexOptions,
    };
  }, [weeklyMovementRangeData, weeklyMovementWeekFilter, movementChartColors, theme.palette.mode, theme.palette.divider, theme.palette.text.secondary, theme.palette.background.paper, handleOpenWeeklyMovementCompaniesList]);

  // Gráfico Actual vs Expected (Facturación semanal vs Objetivo semanal) - solo 5 semanas (la tabla muestra más)
  const resumenMontoChartData = useMemo(() => {
    let rows = weeklyMovementRangeData;
    if (weeklyMovementWeekFilter.size > 0) {
      rows = rows.filter((r) => weeklyMovementWeekFilter.has(r.week));
    } else {
      rows = rows.slice(-5);
    }
    const data = rows.map((row) => {
      const facturacion = row.facturacionOverride != null ? row.facturacionOverride : (row.avanceMonto ?? 0) + (row.nuevoIngresoMonto ?? 0) + (row.retrocesoMonto ?? 0) + (row.sinCambiosMonto ?? 0);
      const objetivo = row.objetivo ?? 0;
      return {
        x: String(row.week),
        y: facturacion,
        goals: [
          {
            name: 'Objetivo',
            value: objetivo,
            strokeHeight: 5,
            strokeColor: '#775DD0',
          },
        ],
      };
    });
    return data;
  }, [weeklyMovementRangeData, weeklyMovementWeekFilter]);

  // Altura dinámica del gráfico Facturación vs Objetivo para llenar el espacio del card
  useEffect(() => {
    const el = resumenMontoChartContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setResumenMontoChartHeight(Math.floor(h));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const reportsCardBg = theme.palette.mode === 'light' ? '#fafafa' : '#1c252e';

  return (
    <Box sx={{ bgcolor: theme.palette.mode === 'light' ? '#f2f2f2' : undefined, minHeight: '100%', py: 2 }}>
      {/* Título y filtros generales (asesor y periodo) alineados a la derecha */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          px: { xs: 2, md: 3 },
          py: { xs: 1.25, md: 1.5 },
          mt: 0,
          mb: 4,
          bgcolor: reportsCardBg,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.1375rem' },
            color: '#828690',
          }}
        >
          Reportes
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={reportsAdvisorFilter === null ? '' : String(reportsAdvisorFilter)}
              onChange={(e) => !isRoleUser && setReportsAdvisorFilter(e.target.value === '' ? null : Number(e.target.value))}
              displayEmpty
              disabled={isRoleUser}
              sx={{
                borderRadius: 1.5,
                bgcolor: 'transparent',
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { border: `1px solid ${theme.palette.divider}` },
                '& .MuiSelect-select': { py: 1, fontStyle: 'normal' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    mt: 1,
                  },
                },
              }}
              renderValue={(v) => {
                if (v === '' || v == null) return 'Todos los asesores';
                const u = (isRoleUser && currentUser ? [currentUser] : users).find((x) => x.id === Number(v));
                return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.usuario || 'Asesor' : 'Todos los asesores';
              }}
            >
              <MenuItem value="">Todos los asesores</MenuItem>
              {(isRoleUser && currentUser ? [currentUser] : users).map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.usuario}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setChartEtapaFilterAnchorEl(e.currentTarget)}
            sx={{
              borderRadius: 1.5,
              bgcolor: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 400,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
              minWidth: 160,
              height: 40,
              py: 0,
              px: 1.5,
              textTransform: 'none',
              justifyContent: 'space-between',
              '& .MuiButton-endIcon': { ml: 0.5 },
              '&:hover': { border: `1px solid ${theme.palette.divider}`, bgcolor: 'transparent' },
            }}
            endIcon={<KeyboardArrowDown sx={{ color: theme.palette.action.disabled, fontSize: 20 }} />}
          >
            {chartEtapaHiddenStages.size === 0
              ? 'Todas las etapas'
              : chartEtapaHiddenStages.size === COMPANY_STAGE_ORDER.length
                ? 'Ninguna'
                : `${chartEtapaHiddenStages.size} oculta${chartEtapaHiddenStages.size === 1 ? '' : 's'}`}
          </Button>
          <Popover
            open={Boolean(chartEtapaFilterAnchorEl)}
            anchorEl={chartEtapaFilterAnchorEl}
            onClose={() => setChartEtapaFilterAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                mt: 1.5,
                p: 1.5,
                minWidth: 280,
                maxWidth: 360,
              },
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
              Clic en una etapa para ocultarla o mostrarla en el gráfico
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.75 }}>
              {COMPANY_STAGE_ORDER.map((stageKey, i) => {
                const color = PIE_STAGE_COLORS[i % PIE_STAGE_COLORS.length];
                const isHidden = chartEtapaHiddenStages.has(stageKey);
                return (
                  <Box
                    key={`chart-etapa-${stageKey}`}
                    onClick={() => {
                      setChartEtapaHiddenStages((prev) => {
                        const next = new Set(prev);
                        if (next.has(stageKey)) next.delete(stageKey);
                        else next.add(stageKey);
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
                      {getStageLabel(stageKey)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Popover>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setPeriodPopoverAnchor(e.currentTarget)}
            sx={{
              borderRadius: 1.5,
              bgcolor: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 400,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
              minWidth: 160,
              height: 40,
              py: 0,
              px: 1.5,
              textTransform: 'none',
              justifyContent: 'space-between',
              '& .MuiButton-endIcon': { ml: 0.5 },
              '&:hover': { border: `1px solid ${theme.palette.divider}`, bgcolor: 'transparent' },
            }}
            endIcon={<KeyboardArrowDown sx={{ color: theme.palette.action.disabled, fontSize: 20 }} />}
          >
            {reportsDateRange
              ? `${reportsDateRange.from.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${reportsDateRange.to.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
              : 'Todo el periodo'}
          </Button>
          <Popover
            open={Boolean(periodPopoverAnchor)}
            anchorEl={periodPopoverAnchor}
            onClose={() => {
              setPeriodPopoverAnchor(null);
              setCalendarStart(null);
              setCalendarEnd(null);
            }}
            TransitionProps={{
              onEntered: () => {
                if (reportsDateRange) {
                  setCalendarStart(reportsDateRange.from);
                  setCalendarEnd(reportsDateRange.to);
                }
              },
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                p: 0,
                overflow: 'visible',
                mt: 1.5,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 24px rgba(0,0,0,0.4)'
                  : '0 8px 24px rgba(0,0,0,0.08)',
                // Mismo color que las líneas divisorias internas (un solo borde, sin doble)
                border: theme.palette.mode === 'dark'
                  ? '2px solid rgba(255,255,255,0.35)'
                  : `2px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                backgroundColor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
              },
            }}
          >
            <Box
              sx={{
                p: 0,
                bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                '& .calendar': {
                  backgroundColor: 'transparent',
                  '--cui-body-bg': 'transparent',
                  '--cui-body-color': theme.palette.text.primary,
                  '--cui-calendar-cell-selected-bg': taxiMonterricoColors.green,
                  '--cui-calendar-cell-selected-color': '#fff',
                  '--cui-calendar-cell-today-color': taxiMonterricoColors.green,
                  '& table': { backgroundColor: 'transparent' },
                  // Líneas: solo horizontal bajo el nav (sin línea vertical entre calendarios)
                  ...(theme.palette.mode === 'dark'
                    ? {
                        '--cui-calendar-nav-border': '2px solid rgba(255,255,255,0.35)',
                        '& .calendar-nav': {
                          backgroundColor: 'transparent',
                          borderBottom: '2px solid rgba(255,255,255,0.35)',
                        },
                        '&:not(:first-child)': {
                          borderInlineStart: 'none !important',
                        },
                      }
                    : {
                        '--cui-calendar-nav-border': `2px solid ${theme.palette.divider}`,
                        '& .calendar-nav': {
                          backgroundColor: 'transparent',
                          borderBottom: `2px solid ${theme.palette.divider}`,
                        },
                        '&:not(:first-child)': {
                          borderInlineStart: 'none !important',
                        },
                      }),
                  ...(theme.palette.mode === 'dark' && {
                    color: theme.palette.text.primary,
                    '--cui-calendar-nav-icon-color': 'rgba(255,255,255,0.9)',
                    '--cui-calendar-nav-icon-hover-color': '#fff',
                    '--cui-calendar-nav-date-color': theme.palette.text.primary,
                    '--cui-calendar-cell-header-inner-color': 'rgba(255,255,255,0.85)',
                    '--cui-calendar-cell-disabled-color': 'rgba(255,255,255,0.55)',
                    '--cui-calendar-cell-hover-color': '#fff',
                    '--cui-calendar-cell-hover-bg': 'rgba(255,255,255,0.12)',
                  }),
                },
                '& .calendar tbody tr td:nth-child(6), & .calendar tbody tr td:nth-child(7)': {
                  opacity: 0.5,
                  color: theme.palette.text.disabled,
                  pointerEvents: 'none',
                  cursor: 'not-allowed',
                },
              }}
            >
              <CCalendar
                  calendarDate={reportsDateRange?.from || calendarStart || new Date()}
                  calendars={2}
                  range
                  locale="es-ES"
                  firstDayOfWeek={1}
                  minDate={new Date(2020, 0, 1)}
                  maxDate={new Date()}
                  startDate={reportsDateRange?.from || calendarStart || null}
                  endDate={reportsDateRange?.to || calendarEnd || null}
                  onStartDateChange={(date: Date | string | null) => {
                    const d = date ? (typeof date === 'string' ? new Date(date) : date) : null;
                    if (d && (d.getDay() === 0 || d.getDay() === 6)) return;
                    setCalendarStart(d);
                    if (d && calendarEnd && d <= calendarEnd) {
                      setReportsDateRange({ from: d, to: calendarEnd });
                      setPeriodPopoverAnchor(null);
                    }
                  }}
                  onEndDateChange={(date: Date | string | null) => {
                    const d = date ? (typeof date === 'string' ? new Date(date) : date) : null;
                    if (d && (d.getDay() === 0 || d.getDay() === 6)) return;
                    setCalendarEnd(d);
                    if (d && calendarStart && calendarStart <= d) {
                      setReportsDateRange({ from: calendarStart, to: d });
                      setPeriodPopoverAnchor(null);
                    }
                  }}
                  className="rounded"
                />
            </Box>
          </Popover>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 }, mb: 2, alignItems: 'flex-start' }}>
      {/* Card: Conteo por etapa de empresas (gráfico Pie Chart.js) - mismo diseño que bloque Asesores */}
      <Card
        sx={{
          maxWidth: { xs: 660, md: 980 },
          flex: { md: '1 1 52%' },
          minWidth: 0,
          borderRadius: 3,
          boxShadow: 'none',
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 3, md: 2.5 },
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            }}
          >
            Empresas
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 1.5 }, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 }, width: { md: 120 } }}>
                <Select
                  value={chartOriginFilter === null ? '' : chartOriginFilter}
                  onChange={(e) => setChartOriginFilter(e.target.value === '' ? null : e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: 'none',
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': { py: 1, fontStyle: 'normal' },
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
                  <MenuItem value="">Origen</MenuItem>
                  <MenuItem value="__null__">Sin origen</MenuItem>
                  <MenuItem value="referido">Referido</MenuItem>
                  <MenuItem value="base">Base</MenuItem>
                  <MenuItem value="entorno">Entorno</MenuItem>
                  <MenuItem value="feria">Feria</MenuItem>
                  <MenuItem value="masivo">Masivo</MenuItem>
                </Select>
              </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 140 }, width: { md: 140 } }}>
                <Select
                  value={chartRecoveredClientFilter}
                  onChange={(e) => setChartRecoveredClientFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    border: 'none',
                    color: theme.palette.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': { py: 1, fontStyle: 'normal' },
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
                  <MenuItem value="">C.R.</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 0, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg }}>
          {companyStagesChartData.series.some((v) => v > 0) ? (
            (() => {
              const visibleIndices = companyStagesChartData.labels.map((_, i) => i);
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

              const funnelChartHeight = Math.max(200, Math.min(550, funnelData.length * 95));
              // Opciones del gráfico de embudo
              const funnelOptions: ApexOptions = {
                chart: {
                  type: 'bar',
                  height: funnelChartHeight,
                  dropShadow: { enabled: false },
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
                fill: { type: 'solid', opacity: 1 },
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
                  dropShadow: { enabled: false },
                  style: {
                    colors: ['#fff'],
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
          flex: { md: '1 1 48%' },
          minWidth: 0,
          maxWidth: { xs: 660, md: 900 },
          borderRadius: 3,
          boxShadow: 'none',
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 3, md: 3.5 },
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            }}
          >
            Actividades
          </Typography>
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
                  background: 'transparent',
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
                fill: { type: 'solid', opacity: 1 },
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
                  axisBorder: { show: false },
                  labels: {
                    style: {
                      colors: ACTIVITY_BAR_COLORS,
                      fontSize: '13px',
                      fontWeight: 600,
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 }, mt: 4, mb: 4, alignItems: 'flex-start' }}>
      <Card
        sx={{
          flex: { md: '1 1 56%' },
          minWidth: 0,
          maxWidth: { md: 'none' },
          borderRadius: 3,
          boxShadow: 'none',
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            pt: { xs: 3, md: 3.5 },
            pb: { xs: 1.5, md: 0 },
            bgcolor: reportsCardBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            }}
          >
            Avance Semanal - Empresas
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setWeeklyMovementListModalOpen(true)}
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: 'none',
                color: theme.palette.text.primary,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                py: 1,
                px: 1.5,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              Ver tabla
            </Button>
            <Button
              variant="text"
              size="small"
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => setWeeklyFilterPopoverAnchor(e.currentTarget)}
            sx={{
              textTransform: 'none',
              borderRadius: 1.5,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: 'none',
              color: theme.palette.text.primary,
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              py: 1,
              px: 1.5,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              },
            }}
          >
            Semana {weeklyMovementWeekFilter.size > 0 ? `(${weeklyMovementWeekFilter.size})` : ''}
          </Button>
          </Box>
          <Popover
            open={Boolean(weeklyFilterPopoverAnchor)}
            anchorEl={weeklyFilterPopoverAnchor}
            onClose={() => setWeeklyFilterPopoverAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                maxHeight: 320,
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                color: theme.palette.text.primary,
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                Semana
              </Typography>
              <Box
                component="button"
                onClick={() => setWeeklyMovementWeekFilter(new Set())}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  py: 1,
                  px: 0,
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 1,
                  '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                }}
              >
                <Checkbox
                  size="small"
                  checked={weeklyMovementWeekFilter.size === 0}
                  sx={{ p: 0.5 }}
                />
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Todas</Typography>
              </Box>
              <Box sx={{ maxHeight: 220, overflowY: 'auto', mt: 0.5 }}>
                {(() => {
                  const weeksInData = weeklyMovementRangeData.map((r) => r.week);
                  const maxWeek = weeksInData.length > 0 ? Math.max(...weeksInData) : 52;
                  return Array.from({ length: maxWeek }, (_, i) => i + 1);
                })().map((week) => (
                  <Box
                    key={week}
                    component="button"
                    onClick={() => {
                      setWeeklyMovementWeekFilter((prev) => {
                        const next = new Set(prev);
                        if (next.has(week)) {
                          next.delete(week);
                        } else {
                          next.add(week);
                        }
                        return next;
                      });
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%',
                      py: 0.75,
                      px: 0,
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: 1,
                      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={weeklyMovementWeekFilter.has(week)}
                      sx={{ p: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{week}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Popover>
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
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                '& > div': { width: '100% !important' },
                '& .apexcharts-legend-text': { marginLeft: '-10px' },
                '& .apexcharts-canvas': { width: '100% !important' },
                '& .apexcharts-inner': { width: '100% !important' },
                '& .apexcharts-svg': { width: '100% !important' },
                '& .apexcharts-toolbar': { display: 'none !important' },
              }}
            >
              <ReactApexChart
                options={weeklyMovementRangeChart.options}
                series={weeklyMovementRangeChart.series}
                type="bar"
                height={420}
              />
            </Box>
          )}
        </Box>
      </Card>

      {/* Modal: Resumen de prospección por semana */}
      <Dialog
        open={weeklyMovementListModalOpen}
        onClose={() => setWeeklyMovementListModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Resumen de prospección por semana
          <IconButton size="small" onClick={() => setWeeklyMovementListModalOpen(false)} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {(() => {
            let rows = weeklyMovementRangeData;
            if (weeklyMovementWeekFilter.size > 0) {
              rows = rows.filter((r) => weeklyMovementWeekFilter.has(r.week));
            }
            const avance = rows.reduce((s, r) => s + r.avance, 0);
            const nuevoIngreso = rows.reduce((s, r) => s + r.nuevoIngreso, 0);
            const retroceso = rows.reduce((s, r) => s + r.retroceso, 0);
            const sinCambios = rows.reduce((s, r) => s + r.sinCambios, 0);
            const avanceMonto = rows.reduce((s, r) => s + (r.avanceMonto ?? 0), 0);
            const nuevoIngresoMonto = rows.reduce((s, r) => s + (r.nuevoIngresoMonto ?? 0), 0);
            const retrocesoMonto = rows.reduce((s, r) => s + (r.retrocesoMonto ?? 0), 0);
            const sinCambiosMonto = rows.reduce((s, r) => s + (r.sinCambiosMonto ?? 0), 0);
            const totalCantidad = avance + nuevoIngreso + retroceso + sinCambios;
            const totalMonto = avanceMonto + nuevoIngresoMonto + retrocesoMonto + sinCambiosMonto;
            const tableRows = [
              { label: 'Avance', cantidad: avance, monto: avanceMonto },
              { label: 'Nuevo ingreso', cantidad: nuevoIngreso, monto: nuevoIngresoMonto },
              { label: 'Retroceso', cantidad: retroceso, monto: retrocesoMonto },
              { label: 'Sin cambios', cantidad: sinCambios, monto: sinCambiosMonto },
            ];
            return (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent', '& .MuiTableCell-root': { borderBottom: 'none' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Movimiento</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Cantidad</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.secondary, borderColor: theme.palette.divider }}>Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.label} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{row.label}</TableCell>
                        <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{row.cantidad}</TableCell>
                        <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{formatCurrencyPE(row.monto)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, borderColor: theme.palette.divider, color: theme.palette.text.primary }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{totalCantidad}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{formatCurrencyPE(totalMonto)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Card: Conteo por etapa (negocios) - donut con total en el centro, a la derecha de Movimiento por semana */}
      <Card
        sx={{
          flex: { md: '1 1 44%' },
          minWidth: { md: 400 },
          minHeight: { md: 530 },
          maxWidth: { md: 'none' },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: 'none',
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        }}
      >
        <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 3, md: 3.5 }, pb: { xs: 1.5, md: 0 }, bgcolor: reportsCardBg }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
            }}
          >
            Negocios
          </Typography>
        </Box>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            mt: 0,
            pb: { xs: 1.5, md: 2 },
            bgcolor: reportsCardBg,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 0,
          }}
        >
          {dealsChartData.series.some((v) => v > 0) ? (
            (() => {
              const allIndices = dealsChartData.labels.map((_, i) => i);
              const withDataIndices = allIndices.filter((i) => (dealsChartData.series[i] ?? 0) > 0);
              let visibleDealsIndices = withDataIndices.filter((i) => !dealsChartHiddenStages.has(dealsChartData.stageKeys[i] ?? ''));
              if (visibleDealsIndices.length === 0) visibleDealsIndices = withDataIndices;
              const chartLabels = visibleDealsIndices.map((i) => dealsChartData.labels[i]);
              const chartSeries = visibleDealsIndices.map((i) => dealsChartData.series[i]);
              const chartAmounts = visibleDealsIndices.map((i) => dealsChartData.amounts[i] ?? 0);
              const chartColors = visibleDealsIndices.map((i) => PIE_STAGE_COLORS[i % PIE_STAGE_COLORS.length]);
              const chartStageKeys = visibleDealsIndices.map((i) => dealsChartData.stageKeys[i] ?? '');
              const legendLabels = withDataIndices.map((i) => dealsChartData.labels[i]);
              const legendStageKeys = withDataIndices.map((i) => dealsChartData.stageKeys[i] ?? '');
              const legendColors = withDataIndices.map((i) => PIE_STAGE_COLORS[i % PIE_STAGE_COLORS.length]);
              return (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: '100%', maxWidth: 330, cursor: 'pointer' }}>
              <ReactApexChart
                options={{
                  chart: {
                    type: 'pie',
                    width: 400,
                    toolbar: { show: false },
                    fontFamily: 'inherit',
                    background: 'transparent',
                    events: {
                      dataPointSelection: (event: MouseEvent, _chartContext: unknown, config: { dataPointIndex: number }) => {
                        const index = config?.dataPointIndex ?? -1;
                        if (index >= 0 && index < chartStageKeys.length) {
                          const stageKey = chartStageKeys[index];
                          const stageLabel = chartLabels[index];
                          if (stageKey) {
                            handleOpenDealsList(stageKey, stageLabel, event.clientX, event.clientY);
                          }
                        }
                      },
                      click: (event: MouseEvent, _chartContext: unknown, config: { dataPointIndex?: number }) => {
                        if (config?.dataPointIndex !== undefined) {
                          const index = config.dataPointIndex;
                          if (index >= 0 && index < chartStageKeys.length) {
                            const stageKey = chartStageKeys[index];
                            const stageLabel = chartLabels[index];
                            if (stageKey) {
                              handleOpenDealsList(stageKey, stageLabel, event.clientX, event.clientY);
                            }
                          }
                        }
                      },
                    },
                  },
                  labels: chartLabels,
                  colors: chartColors,
                  fill: { type: 'solid', opacity: 1 },
                  plotOptions: {
                    pie: {
                      expandOnClick: false,
                    },
                  },
                  states: {
                    hover: { filter: { type: 'none' } },
                    active: { filter: { type: 'none' } },
                  },
                  stroke: {
                    width: 3,
                    colors: [theme.palette.mode === 'dark' ? theme.palette.background.paper : 'rgba(255,255,255,0.9)'],
                  },
                  dataLabels: {
                    enabled: true,
                    dropShadow: { enabled: false },
                    formatter: (val: string | number | number[], opts?: { seriesIndex?: number }) => {
                      const idx = opts?.seriesIndex ?? 0;
                      const count = chartSeries[idx] ?? 0;
                      const visibleTotal = chartSeries.reduce((a, b) => a + b, 0);
                      const pct = visibleTotal > 0 ? ((count / visibleTotal) * 100).toFixed(1) : '0';
                      return `${pct}%`;
                    },
                  },
                  theme: { mode: theme.palette.mode as 'light' | 'dark' },
                  legend: { show: false },
                  tooltip: {
                    theme: theme.palette.mode,
                    custom: ({ seriesIndex, w }: { seriesIndex: number; w: { globals: { labels: string[] } } }) => {
                      const label = w.globals.labels[seriesIndex] ?? '';
                      const count = chartSeries[seriesIndex] ?? 0;
                      const amount = chartAmounts[seriesIndex] ?? 0;
                      return `<div style="padding: 8px 12px; background: ${theme.palette.mode === 'dark' ? '#1c252e' : '#fff'}; border: 1px solid ${theme.palette.divider}; border-radius: 8px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${label}</div>
                        <div>Cantidad: ${count}</div>
                        <div>Monto: ${formatCurrencyPE(amount)}</div>
                      </div>`;
                    },
                  },
                  responsive: [{
                    breakpoint: 480,
                    options: {
                      chart: { width: 450 },
                    },
                  }],
                } as ApexOptions}
                series={chartSeries}
                type="pie"
                height={450}
              />
              </Box>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-evenly',
                  gap: { xs: 1, sm: 1.5 },
                  px: 0.5,
                }}
              >
                {legendLabels.map((label, i) => {
                  const stageKey = legendStageKeys[i];
                  const isHidden = stageKey ? dealsChartHiddenStages.has(stageKey) : false;
                  return (
                    <Box
                      key={stageKey ?? i}
                      onClick={() => {
                        if (stageKey) {
                          setDealsChartHiddenStages((prev) => {
                            const next = new Set(prev);
                            if (next.has(stageKey)) next.delete(stageKey);
                            else next.add(stageKey);
                            return next;
                          });
                        }
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        minWidth: 0,
                        cursor: 'pointer',
                        opacity: isHidden ? 0.4 : 1,
                        '&:hover': { opacity: isHidden ? 0.6 : 0.85 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: legendColors[i],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary, fontSize: '0.8125rem' }}>
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
              );
            })()
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

      {/* Fila: Tabla Resumen de monto + Gráfico Facturación vs Objetivo */}
      <Box
        sx={{
          mt: 4,
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
          alignItems: 'stretch',
          minHeight: { md: 455 },
        }}
      >
      {/* Card: Resumen de monto por semana (tabla) */}
      <Card
        sx={{
          flex: { md: '1 1 55%' },
          minWidth: 0,
          minHeight: { md: 455 },
          borderRadius: 3,
          boxShadow: 'none',
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            bgcolor: reportsCardBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: theme.palette.text.primary,
              letterSpacing: '0.02em',
            }}
          >
            Resumen de monto por semana
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              ref={weeklyFilterTableButtonRef}
              variant="text"
              size="small"
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => setWeeklyFilterPopoverAnchor(e.currentTarget)}
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: 'none',
                color: theme.palette.text.primary,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                py: 1,
                px: 1.5,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              Semana {weeklyMovementWeekFilter.size > 0 ? `(${weeklyMovementWeekFilter.size})` : ''}
            </Button>
          </Box>
        </Box>
        <Box sx={{ bgcolor: reportsCardBg, px: 0, pb: { xs: 1.5, md: 2 }, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TableContainer
            id="resumen-monto-tabla"
            sx={{
              flex: 1,
              overflowX: 'auto',
              bgcolor: 'transparent',
              '& .MuiTableCell-root': { bgcolor: 'transparent', borderBottom: 'none', py: 1.5, fontSize: '0.8125rem' },
              '& thead .MuiTableCell-root': {
                bgcolor: reportsCardBg,
                py: 1.5,
                fontSize: '0.8125rem',
                borderTop: `1px solid ${theme.palette.divider}`,
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiTableRow-root': { bgcolor: 'transparent' },
            }}
          >
            <Table size="small" sx={{ bgcolor: 'transparent' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, py: 1.5, borderColor: theme.palette.divider, width: 48, maxWidth: 48 }}>Semana</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, py: 1.5, borderColor: theme.palette.divider }}>Facturación semanal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, py: 1.5, borderColor: theme.palette.divider }}>Objetivo semanal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, py: 1.5, borderColor: theme.palette.divider, minWidth: 100, pr: 4 }}>% Cumplimiento</TableCell>
                    <TableCell sx={{ py: 1.5, borderColor: theme.palette.divider, width: 56, pl: 4 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    let rows = weeklyMovementRangeData;
                    if (weeklyMovementWeekFilter.size > 0) {
                      rows = rows.filter((r) => weeklyMovementWeekFilter.has(r.week));
                    } else {
                      rows = rows.filter((r) => r.week >= 5 && r.week <= 51);
                    }
                    const totalFacturacion = rows.reduce((s, r) => {
                      const f = r.facturacionOverride != null ? r.facturacionOverride : (r.avanceMonto ?? 0) + (r.nuevoIngresoMonto ?? 0) + (r.retrocesoMonto ?? 0) + (r.sinCambiosMonto ?? 0);
                      return s + f;
                    }, 0);
                    const totalObjetivo = rows.reduce((s, r) => s + (r.objetivo ?? 0), 0);
                    return (
                      <>
                        {rows.map((row) => {
                          const facturacion = row.facturacionOverride != null ? row.facturacionOverride : (row.avanceMonto ?? 0) + (row.nuevoIngresoMonto ?? 0) + (row.retrocesoMonto ?? 0) + (row.sinCambiosMonto ?? 0);
                          const objetivo = row.objetivo ?? 0;
                          const cumplimiento = objetivo > 0 ? ((facturacion / objetivo) * 100).toFixed(2) : '—';
                          return (
                            <TableRow key={`${row.year}-${row.week}`} sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' } }}>
                              <TableCell sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary, width: 48, maxWidth: 48 }}>{row.week}</TableCell>
                              <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{formatCurrencyPE(facturacion)}</TableCell>
                              <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{objetivo > 0 ? formatCurrencyPE(objetivo) : 'S/ 0'}</TableCell>
                              <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary, minWidth: 100, pr: 4 }}>{cumplimiento}</TableCell>
                              <TableCell sx={{ borderColor: theme.palette.divider, py: 1, pl: 4 }}>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenWeeklyGoalEdit(row)}
                                    sx={pageStyles.actionButtonEdit(theme)}
                                    aria-label="Editar"
                                  >
                                    <PencilLine size={18} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                          <TableCell sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary, width: 48, maxWidth: 48 }}>Total</TableCell>
                          <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{formatCurrencyPE(totalFacturacion)}</TableCell>
                          <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary }}>{formatCurrencyPE(totalObjetivo)}</TableCell>
                          <TableCell align="right" sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary, minWidth: 100, pr: 4 }}>
                            {totalObjetivo > 0 ? ((totalFacturacion / totalObjetivo) * 100).toFixed(2) : '—'}
                          </TableCell>
                          <TableCell sx={{ borderColor: theme.palette.divider, pl: 4 }} />
                        </TableRow>
                      </>
                    );
                  })()}
                </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      {/* Card: Facturación vs Objetivo semanal (gráfico Actual vs Expected) */}
      <Card
        sx={{
          flex: { md: '1 1 45%' },
          minWidth: 0,
          minHeight: { md: 455 },
          borderRadius: 3,
          boxShadow: 'none',
          overflow: 'hidden',
          bgcolor: reportsCardBg,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            bgcolor: reportsCardBg,
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: theme.palette.text.primary,
              letterSpacing: '0.02em',
            }}
          >
            Facturación vs Objetivo semanal
          </Typography>
        </Box>
        <Box
          ref={resumenMontoChartContainerRef}
          sx={{ px: { xs: 2, md: 3 }, pb: { xs: 1.5, md: 2 }, bgcolor: reportsCardBg, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          {resumenMontoChartData.length > 0 ? (
            <ReactApexChart
              options={{
                chart: {
                  type: 'bar',
                  height: resumenMontoChartHeight,
                  background: 'transparent',
                  toolbar: { show: false },
                  fontFamily: 'inherit',
                },
                plotOptions: {
                  bar: {
                    columnWidth: '60%',
                    borderRadius: 4,
                  },
                },
                colors: ['#00E396'],
                dataLabels: { enabled: false },
                legend: {
                  show: true,
                  showForSingleSeries: true,
                  customLegendItems: ['Facturación', 'Objetivo'],
                  markers: { fillColors: ['#00E396', '#775DD0'] },
                  position: 'bottom',
                  horizontalAlign: 'center',
                  labels: { colors: theme.palette.text.secondary },
                },
                xaxis: {
                  labels: { style: { colors: theme.palette.text.secondary } },
                  axisBorder: { color: theme.palette.divider },
                },
                yaxis: {
                  labels: {
                    style: { colors: theme.palette.text.secondary },
                    formatter: (val: number) => formatCurrencyPE(val),
                  },
                  axisBorder: { color: theme.palette.divider },
                },
                grid: {
                  borderColor: theme.palette.divider,
                  xaxis: { lines: { show: false } },
                },
                tooltip: {
                  theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
                  y: {
                    formatter: (val: number) => formatCurrencyPE(val),
                  },
                },
              }}
              series={[{ name: 'Facturación', data: resumenMontoChartData }]}
              type="bar"
              height={resumenMontoChartHeight}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, color: theme.palette.text.disabled }}>
              <Typography variant="body2">No hay datos para mostrar</Typography>
            </Box>
          )}
        </Box>
      </Card>
      </Box>

      {/* Modal: Editar facturación y objetivo semanal */}
      <Dialog
        open={weeklyGoalEditModalOpen}
        onClose={() => {
          if (!savingWeeklyGoal) {
            setWeeklyGoalEditModalOpen(false);
            setEditingWeeklyGoal(null);
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: reportsCardBg,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
            bgcolor: reportsCardBg,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography component="div" sx={{ fontWeight: 800, fontSize: '1.1rem', color: theme.palette.text.primary }}>
            Editar Semana {editingWeeklyGoal?.week ?? ''}
          </Typography>
          <IconButton
            onClick={() => setWeeklyGoalEditModalOpen(false)}
            disabled={savingWeeklyGoal}
            size="small"
            sx={{ color: theme.palette.text.secondary, '&:hover': { bgcolor: theme.palette.action.hover } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: reportsCardBg, pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Facturación semanal"
            type="number"
            fullWidth
            variant="outlined"
            value={weeklyGoalFacturacionValue}
            onChange={(e) => setWeeklyGoalFacturacionValue(e.target.value)}
            disabled={savingWeeklyGoal}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>S/</Typography>,
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : theme.palette.primary.main },
                '&.Mui-focused fieldset': { borderColor: taxiMonterricoColors.green, borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: theme.palette.text.secondary, '&.Mui-focused': { color: taxiMonterricoColors.green } },
              '& .MuiInputBase-input': { color: theme.palette.text.primary },
              '& input[type=number]': { MozAppearance: 'textfield' },
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
            }}
          />
          <TextField
            margin="dense"
            label="Objetivo semanal"
            type="number"
            fullWidth
            variant="outlined"
            value={weeklyGoalObjetivoValue}
            onChange={(e) => setWeeklyGoalObjetivoValue(e.target.value)}
            disabled={savingWeeklyGoal}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>S/</Typography>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : theme.palette.primary.main },
                '&.Mui-focused fieldset': { borderColor: taxiMonterricoColors.green, borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: theme.palette.text.secondary, '&.Mui-focused': { color: taxiMonterricoColors.green } },
              '& .MuiInputBase-input': { color: theme.palette.text.primary },
              '& input[type=number]': { MozAppearance: 'textfield' },
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
            }}
          />
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button onClick={() => setWeeklyGoalEditModalOpen(false)} disabled={savingWeeklyGoal} sx={pageStyles.cancelButton}>
            Cancelar
          </Button>
          <Button onClick={handleSaveWeeklyGoal} variant="contained" disabled={savingWeeklyGoal} sx={pageStyles.saveButton}>
            {savingWeeklyGoal ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

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
          setCompaniesModalWeeklyContext(null);
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
                      onClick={() => {
                        setCompaniesPopoverAnchor(null);
                        navigate(`/companies/${c.id}`);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        px: 1,
                        cursor: 'pointer',
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
                      onClick={() => {
                        if (companiesModalWeeklyContext) {
                          fetchCompaniesWeeklyMovementList(companiesModalWeeklyContext.year, companiesModalWeeklyContext.week, companiesModalWeeklyContext.movementType, companiesModalPage - 1);
                        } else if (companiesModalStage) {
                          fetchCompaniesList(companiesModalStage, companiesModalPage - 1);
                        }
                      }}
                      disabled={companiesModalPage <= 1}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (companiesModalWeeklyContext) {
                          fetchCompaniesWeeklyMovementList(companiesModalWeeklyContext.year, companiesModalWeeklyContext.week, companiesModalWeeklyContext.movementType, companiesModalPage + 1);
                        } else if (companiesModalStage) {
                          fetchCompaniesList(companiesModalStage, companiesModalPage + 1);
                        }
                      }}
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

      {/* Ancla invisible para Popover de negocios */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dealsClickAnchorRef}
            style={{
              position: 'fixed',
              left: dealsAnchorPosition?.left ?? 0,
              top: dealsAnchorPosition?.top ?? 0,
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
      {/* Popover: lista de negocios por etapa al hacer clic en el gráfico de donut */}
      <Popover
        open={Boolean(dealsPopoverAnchor)}
        anchorEl={dealsPopoverAnchor}
        onClose={() => {
          setDealsPopoverAnchor(null);
          setDealsAnchorPosition(null);
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
              {dealsModalStageLabel}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setDealsPopoverAnchor(null)}
              sx={{ color: theme.palette.error.main }}
              aria-label="Cerrar"
            >
              <Close />
            </IconButton>
          </Box>
          {dealsModalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'transparent' }}>
                {dealsModalDeals.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay negocios en esta etapa
                    </Typography>
                  </Box>
                ) : (
                  dealsModalDeals.map((d) => (
                    <Box
                      key={d.id}
                      onClick={() => {
                        setDealsPopoverAnchor(null);
                        navigate(`/deals/${d.id}`);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        px: 1,
                        cursor: 'pointer',
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
                        <Handshake size={16} color="white" />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: theme.palette.text.primary }}>
                          {d.name || '—'}
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
                          {formatCurrencyPE(Number(d.amount))}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
              {dealsModalTotalPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Página {dealsModalPage} de {dealsModalTotalPages}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => dealsModalStage && fetchDealsList(dealsModalStage, dealsModalPage - 1)}
                      disabled={dealsModalPage <= 1}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => dealsModalStage && fetchDealsList(dealsModalStage, dealsModalPage + 1)}
                      disabled={dealsModalPage >= dealsModalTotalPages}
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
                          <UserRound size={16} color="white" />
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

    </Box>
  );
};

export default Reports;
