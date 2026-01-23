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
  Paper,
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
} from '@mui/material';
import { Search, History } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';

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
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchAction, setSearchAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
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
    }
  }, [page, searchAction, filterEntityType]);

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
      <Box sx={pageStyles.pageContainer}>
        <Alert severity="error">No tienes permisos para ver los logs del sistema</Alert>
      </Box>
    );
  }

  return (
    <Box sx={pageStyles.pageContainer}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <History sx={{ fontSize: 32, color: taxiMonterricoColors.green }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Logs del Sistema
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                <Search sx={{ fontSize: 38 }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              fontSize: '1.4rem',
              '& input::placeholder': {
                fontSize: '1.4rem',
                opacity: 0.7,
              },
            },
          }}
          size="medium"
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Tipo de Entidad</InputLabel>
          <Select
            value={filterEntityType}
            onChange={(e) => {
              setFilterEntityType(e.target.value);
              setPage(1);
            }}
            label="Tipo de Entidad"
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
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
          Total: {total} registros
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Alert severity="info">No hay logs registrados</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Entidad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Detalles</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const details = parseDetails(log.details);
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>
                        {log.User ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.User.firstName} {log.User.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {log.User.usuario}
                            </Typography>
                          </Box>
                        ) : (
                          'Usuario eliminado'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={log.entityType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{log.entityId || '--'}</TableCell>
                      <TableCell>
                        {details ? (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {typeof details === 'object' ? JSON.stringify(details, null, 2) : details}
                          </Typography>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{log.ipAddress || '--'}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SystemLogs;
