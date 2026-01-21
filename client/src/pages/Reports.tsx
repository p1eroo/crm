import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useTheme } from '@mui/material/styles';

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

const Reports: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

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
      // Filtrar solo usuarios con rol "user"
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

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

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
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        flexDirection: 'column',
        mb: 3,
      }}>
        {/* Asesores */}
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            fontWeight: 600,
            mx: { xs: 2, md: 19 },
          }}
        >
          Asesores
        </Typography>
        <Card sx={{ 
          borderRadius: 4, 
          background: theme.palette.mode === 'dark' ? '#171e2b' : theme.palette.background.paper,
          border: 'none',
          mx: { xs: 2, md: 19 },
          maxWidth: { xs: 'calc(100% - 32px)', md: 'calc(100% - 135px)' },
        }}>
          <CardContent sx={{ px: 0, pt: 3, pb: 0 }}>
            {users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No hay usuarios con rol de usuario para mostrar
                </Typography>
              </Box>
            ) : (
              <>
                {/* Resumen del periodo */}
                {stats?.deals?.userPerformance && stats.deals.userPerformance.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2,
                    px: 3, // Agregar padding horizontal solo al resumen
                  }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '1rem',
                      }}
                    >
                      Total del periodo: <strong style={{ color: theme.palette.text.primary }}>
                        S/ {stats.deals.userPerformance.reduce((sum: number, user: any) => sum + (user.wonDealsValue || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </strong>
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '1rem',
                      }}
                    >
                      Asesores: <strong style={{ color: theme.palette.text.primary }}>{stats.deals.userPerformance.length}</strong>
                    </Typography>
                  </Box>
                )}
                <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.action.hover }}>
                      <TableCell sx={{ fontWeight: 600, pl: 6, bgcolor: 'transparent', borderBottom: 'none' }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: 'none' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: 'none' }}>Teléfono</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: 'none' }}>Ventas</TableCell>
                      <TableCell sx={{ fontWeight: 600, pr: 1, bgcolor: 'transparent', borderBottom: 'none' }}>Total Vendido</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/reports/${user.id}`)}
                      >
                        <TableCell sx={{ pl: 5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={user.avatar}
                              sx={{
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                width: 40,
                                height: 40,
                              }}
                            >
                              {getInitials(user.firstName, user.lastName)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '--'}</TableCell>
                        <TableCell>
                          {(() => {
                            const userStats = stats?.deals?.userPerformance?.find((u: any) => u.userId === user.id);
                            return (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {userStats ? `${userStats.wonDeals || 0} ${userStats.wonDeals === 1 ? 'venta' : 'ventas'}` : '0 ventas'}
                              </Typography>
                            );
                          })()}
                        </TableCell>
                        <TableCell sx={{ pr: 3 }}>
                          {(() => {
                            const userStats = stats?.deals?.userPerformance?.find((u: any) => u.userId === user.id);
                            return userStats ? (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                S/ {(userStats.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                S/ 0
                              </Typography>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={users.length}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
                sx={{
                  bgcolor: 'transparent',
                  color: theme.palette.text.primary,
                  '& .MuiTablePagination-toolbar': {
                    bgcolor: 'transparent',
                    color: theme.palette.text.primary,
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    color: theme.palette.text.primary,
                  },
                  '& .MuiIconButton-root': {
                    color: theme.palette.text.primary,
                  },
                }}
              />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Reports;






