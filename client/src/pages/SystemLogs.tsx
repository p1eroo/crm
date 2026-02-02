import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Pagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Collapse,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { 
  Search, 
  Refresh, 
  ExpandMore, 
  ExpandLess,
  Visibility,
  Launch,
  Person,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { UnifiedTable } from '../components/UnifiedTable';

interface SystemLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  User?: {
    id: number;
    usuario: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

const SystemLogs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchAction, setSearchAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; details: any; title: string }>({
    open: false,
    details: null,
    title: '',
  });

  const fetchLogs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const params: any = {
        page,
        limit: 50,
      };
      if (searchAction) {
        params.action = searchAction;
      }
      if (filterEntityType) {
        params.entityType = filterEntityType;
      }
      const response = await api.get('/system-logs', { params });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchAction, filterEntityType]);

  const handleRefresh = () => {
    fetchLogs(true);
  };

  const toggleRowExpansion = (logId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const handleViewDetails = (details: any, title: string) => {
    setDetailsDialog({ open: true, details, title });
  };

  const handleNavigateToEntity = (entityType: string, entityId?: number) => {
    if (!entityId) return;
    
    const routes: { [key: string]: string } = {
      contact: '/contacts',
      company: '/companies',
      deal: '/deals',
      task: '/tasks',
      ticket: '/tickets',
      user: '/users',
    };

    const route = routes[entityType.toLowerCase()];
    if (route) {
      navigate(`${route}/${entityId}`);
    }
  };

  const handleFilterByAction = (action: string) => {
    setSearchAction(action);
    setPage(1);
  };

  const handleFilterByEntity = (entityType: string) => {
    setFilterEntityType(entityType);
    setPage(1);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user?.role, fetchLogs]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const parseDetails = (details?: string) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ 
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            maxWidth: '600px',
            width: '100%',
          }}
        >
          No tienes permisos para ver los logs del sistema
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      '@keyframes shimmer': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: taxiMonterricoColors.green }} />
        </Box>
      ) : (
        <UnifiedTable
          title="Logs del Sistema"
          actions={
            <>
              <TextField
                placeholder="Buscar por acción..."
                value={searchAction}
                onChange={(e) => {
                  setSearchAction(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{ 
                  minWidth: { xs: '100%', sm: 200 },
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'white',
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                    borderWidth: 1.5,
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: `${taxiMonterricoColors.greenLight} !important`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: `${taxiMonterricoColors.green} !important`,
                    },
                    '& input::placeholder': {
                      fontSize: '0.875rem',
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel>Tipo de Entidad</InputLabel>
                <Select
                  value={filterEntityType}
                  onChange={(e) => {
                    setFilterEntityType(e.target.value);
                    setPage(1);
                  }}
                  label="Tipo de Entidad"
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.8125rem',
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'white',
                    '& .MuiSelect-icon': {
                      color: taxiMonterricoColors.green,
                    },
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="user">Usuario</MenuItem>
                  <MenuItem value="contact">Contacto</MenuItem>
                  <MenuItem value="company">Empresa</MenuItem>
                  <MenuItem value="deal">Negocio</MenuItem>
                  <MenuItem value="task">Tarea</MenuItem>
                  <MenuItem value="ticket">Ticket</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.8125rem' }}>
                  Total: {total} {total === 1 ? 'registro' : 'registros'}
                </Typography>
              </Box>
              <Tooltip title="Actualizar logs">
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="small"
                  sx={{
                    color: taxiMonterricoColors.green,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Refresh sx={{ 
                    fontSize: 18,
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }} />
                </IconButton>
              </Tooltip>
            </>
          }
          header={
            <TableContainer sx={{ width: '100%', px: 0 }}>
              <Table sx={{ width: '100%', tableLayout: 'auto' }}>
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined,
                    background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined,
                    borderBottom: `2px solid ${taxiMonterricoColors.greenLight}`,
                    width: '100%',
                    display: 'table-row',
                    '& .MuiTableCell-head': {
                      borderBottom: 'none',
                      fontWeight: 700,
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent',
                      background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined,
                    },
                    '& .MuiTableCell-head:last-of-type': {
                      pr: 0,
                    },
                  }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>Acción</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>Entidad</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>Detalles</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: 1, pr: 0, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent', background: theme.palette.mode === 'light' ? `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)` : undefined }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pr: { xs: 2, md: 3 } }}>
                        IP
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          }
          rows={
            <TableContainer sx={{ width: '100%', px: 0 }}>
              <Table sx={{ width: '100%', tableLayout: 'auto' }}>
                <TableBody>
                  {logs.map((log) => {
                    const details = parseDetails(log.details);
                    const isExpanded = expandedRows.has(log.id);
                    const hasDetails = details && Object.keys(details).length > 0;
                    
                    return (
                    <React.Fragment key={log.id}>
                      <TableRow 
                        hover
                        sx={{
                          cursor: hasDetails ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(91, 228, 155, 0.08)' 
                              : 'rgba(91, 228, 155, 0.05)',
                            transform: 'scale(1.001)',
                            boxShadow: `inset 0 0 0 1px ${taxiMonterricoColors.green}20`,
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 0,
                            bgcolor: taxiMonterricoColors.green,
                            transition: 'width 0.3s ease',
                          },
                          '&:hover::before': {
                            width: 4,
                          },
                        }}
                        onClick={() => hasDetails && toggleRowExpansion(log.id)}
                      >
                        <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 } }}>
                          <Tooltip title={new Date(log.createdAt).toLocaleString('es-ES', { 
                            dateStyle: 'full', 
                            timeStyle: 'medium' 
                          })}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                transition: 'color 0.2s ease',
                              }}
                            >
                              {formatDate(log.createdAt)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                          {log.User ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                              <Box>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 500,
                                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                                    transition: 'color 0.2s ease',
                                  }}
                                >
                                  {log.User.firstName} {log.User.lastName}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontSize: { xs: '0.7rem', md: '0.75rem' },
                                  }}
                                >
                                  {log.User.usuario}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.text.secondary, 
                                fontStyle: 'italic',
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                              }}
                            >
                              Usuario eliminado
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action) as any}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterByAction(log.action);
                            }}
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              height: { xs: 20, md: 24 },
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: 3,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                          <Chip 
                            label={log.entityType} 
                            size="small" 
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterByEntity(log.entityType);
                            }}
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              height: { xs: 20, md: 24 },
                              borderColor: theme.palette.divider,
                              '&:hover': {
                                transform: 'scale(1.1)',
                                borderColor: taxiMonterricoColors.green,
                                color: taxiMonterricoColors.green,
                                bgcolor: `${taxiMonterricoColors.green}15`,
                                boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                          {log.entityId ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: taxiMonterricoColors.green,
                                  cursor: 'pointer',
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    textDecoration: 'underline',
                                    transform: 'scale(1.05)',
                                  },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigateToEntity(log.entityType, log.entityId);
                                }}
                              >
                                {log.entityId}
                              </Typography>
                              <Tooltip title={`Ver ${log.entityType}`}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToEntity(log.entityType, log.entityId);
                                  }}
                                  sx={{
                                    p: 0.5,
                                    color: taxiMonterricoColors.green,
                                    borderRadius: 1.5,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      bgcolor: theme.palette.mode === 'dark' 
                                        ? 'rgba(91, 228, 155, 0.15)' 
                                        : 'rgba(91, 228, 155, 0.12)',
                                      transform: 'scale(1.15) rotate(5deg)',
                                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                                    },
                                  }}
                                >
                                  <Launch sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                              }}
                            >
                              --
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                          {hasDetails ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Tooltip title="Ver detalles completos">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(details, `${log.action} - ${log.entityType}`);
                                  }}
                                  sx={{
                                    p: 0.5,
                                    color: taxiMonterricoColors.green,
                                    borderRadius: 1.5,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      bgcolor: theme.palette.mode === 'dark' 
                                        ? 'rgba(91, 228, 155, 0.15)' 
                                        : 'rgba(91, 228, 155, 0.12)',
                                      transform: 'scale(1.15)',
                                      boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                                    },
                                  }}
                                >
                                  <Visibility sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                                  color: theme.palette.text.secondary,
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {typeof details === 'object' 
                                  ? `${Object.keys(details).length} campo(s)` 
                                  : details.toString().substring(0, 30) + '...'}
                              </Typography>
                              {hasDetails && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpansion(log.id);
                                  }}
                                  sx={{ 
                                    p: 0.5,
                                    borderRadius: 1.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: theme.palette.action.hover,
                                      transform: 'scale(1.1)',
                                    },
                                  }}
                                >
                                  {isExpanded ? (
                                    <ExpandLess sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                                  ) : (
                                    <ExpandMore sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                              }}
                            >
                              --
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: { xs: 1.5, md: 2 }, pr: { xs: 2, md: 3 } }}>
                          <Tooltip title={`IP: ${log.ipAddress || 'No disponible'}`}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontFamily: 'monospace',
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                                color: theme.palette.text.secondary,
                              }}
                            >
                              {log.ipAddress || '--'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {hasDetails && (
                        <TableRow>
                          <TableCell 
                            colSpan={7} 
                            sx={{ 
                              py: 0,
                              borderBottom: 'none',
                            }}
                          >
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 3 }}>
                                <Card 
                                  variant="outlined"
                                  sx={{
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.03)' 
                                      : 'rgba(0, 0, 0, 0.02)',
                                    borderColor: theme.palette.divider,
                                  }}
                                >
                                  <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                      <Info sx={{ fontSize: 18, color: taxiMonterricoColors.green }} />
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Detalles del Log
                                      </Typography>
                                    </Box>
                                    <Box
                                      component="pre"
                                      sx={{
                                        m: 0,
                                        p: 2,
                                        bgcolor: theme.palette.mode === 'dark' 
                                          ? 'rgba(0, 0, 0, 0.3)' 
                                          : 'rgba(0, 0, 0, 0.02)',
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace',
                                        overflow: 'auto',
                                        maxHeight: 300,
                                        border: `1px solid ${theme.palette.divider}`,
                                      }}
                                    >
                                      {typeof details === 'object' 
                                        ? JSON.stringify(details, null, 2) 
                                        : details}
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          }
          emptyState={
            logs.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                      lineHeight: 1,
                    }}
                  >
                    📋
                  </Box>
                  <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1,
                        fontSize: { xs: '1rem', md: '1.125rem' },
                      }}
                    >
                      No hay logs registrados
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      }}
                    >
                      Los registros de actividad del sistema aparecerán aquí.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : null
          }
          pagination={
            totalPages > 1 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: theme.palette.text.primary,
                      '&.Mui-selected': {
                        bgcolor: taxiMonterricoColors.green,
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: taxiMonterricoColors.greenDark,
                        },
                      },
                      '&:hover': {
                        bgcolor: `${taxiMonterricoColors.green}20`,
                      },
                    },
                  }}
                />
              </Box>
            ) : null
          }
        />
      )}

      {/* Dialog para ver detalles completos */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, details: null, title: '' })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(46, 125, 50, 0.12)',
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          pb: 2,
          borderBottom: `2px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, transparent 100%)`
            : `linear-gradient(135deg, rgba(46, 125, 50, 0.02) 0%, transparent 100%)`,
        }}>
          <Info sx={{ color: taxiMonterricoColors.green, fontSize: 24 }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {detailsDialog.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.3)' 
                : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 1,
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: 400,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {detailsDialog.details && typeof detailsDialog.details === 'object'
              ? JSON.stringify(detailsDialog.details, null, 2)
              : detailsDialog.details}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setDetailsDialog({ open: false, details: null, title: '' })}
            variant="contained"
            sx={{
              bgcolor: taxiMonterricoColors.green,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 12px rgba(46, 125, 50, 0.3)' 
                : '0 4px 12px rgba(46, 125, 50, 0.2)',
              '&:hover': {
                bgcolor: '#158a5f',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 6px 16px rgba(46, 125, 50, 0.4)' 
                  : '0 6px 16px rgba(46, 125, 50, 0.3)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemLogs;
