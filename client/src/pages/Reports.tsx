import React, { useEffect, useState, useMemo } from 'react';
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
} from '@mui/material';
import { Person, Search, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { taxiMonterricoColors, hexToRgba } from '../theme/colors';

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

const Reports: React.FC = () => {
  const theme = useTheme();

  const getStageColor = (stage: string): { bg: string; color: string } => {
    if (['cierre_ganado', 'firma_contrato', 'activo', 'won', 'closed won'].includes(stage)) {
      return {
        bg: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}15`,
        color: taxiMonterricoColors.green,
      };
    }
    if (['cierre_perdido', 'cliente_perdido', 'lost', 'closed lost'].includes(stage)) {
      return {
        bg: theme.palette.mode === 'dark' ? `${theme.palette.error.main}26` : `${theme.palette.error.main}15`,
        color: theme.palette.error.main,
      };
    }
    if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
      return {
        bg: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}26` : `${taxiMonterricoColors.orange}15`,
        color: taxiMonterricoColors.orangeDark,
      };
    }
    if (stage === 'licitacion_etapa_final' || stage === 'licitacion') {
      return {
        bg: theme.palette.mode === 'dark' ? `${theme.palette.secondary.main}26` : `${theme.palette.secondary.main}15`,
        color: theme.palette.secondary.main,
      };
    }
    if (['lead', 'contacto'].includes(stage)) {
      return {
        bg: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}26` : `${theme.palette.primary.main}15`,
        color: theme.palette.primary.main,
      };
    }
    if (stage === 'lead_inactivo') {
      return { bg: theme.palette.action.hover, color: theme.palette.text.secondary };
    }
    return {
      bg: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}26` : `${theme.palette.primary.main}15`,
      color: theme.palette.primary.main,
    };
  };
  const navigate = useNavigate();
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
      const response = await api.get('/users');
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Resumen del periodo (si hay datos) */}
      {stats?.deals?.userPerformance && stats.deals.userPerformance.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Total del periodo: <strong style={{ color: theme.palette.text.primary }}>
              S/ {stats.deals.userPerformance.reduce((sum: number, u: any) => sum + (u.wonDealsValue || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </strong>
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Asesores: <strong style={{ color: theme.palette.text.primary }}>{stats.deals.userPerformance.length}</strong>
          </Typography>
        </Box>
      )}

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : `0 4px 16px ${taxiMonterricoColors.greenLight}15`,
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                borderRadius: 0,
                border: 'none',
                boxShadow: 'none',
                bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined,
                '& .MuiPaper-root': { borderRadius: 0, border: 'none', boxShadow: 'none', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined },
              }}
            >
              <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: theme.palette.mode === 'dark'
                        ? '#222B32'
                        : hexToRgba(taxiMonterricoColors.greenEmerald, 0.01),
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
                            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                                      <Typography component="span" sx={{ fontWeight: 500, fontSize: 'inherit', color: 'inherit' }}>
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
                                      <Typography component="span" sx={{ fontWeight: 500, fontSize: 'inherit', color: 'inherit' }}>
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
                            {userStats ? `S/ ${(userStats.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'S/ 0'}
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
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
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
                  <Typography component="span" sx={{ fontWeight: 500, fontSize: 'inherit', color: 'inherit' }}>
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
                    <Typography component="span" sx={{ fontWeight: 500, fontSize: 'inherit', color: 'inherit' }}>
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
