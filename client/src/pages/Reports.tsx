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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Assessment, Person, ArrowOutward, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useTheme } from '@mui/material/styles';
import { pageStyles } from '../theme/styles';

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
  const [maximizedAdvisors, setMaximizedAdvisors] = useState(false);
  const [advisorsModalOpen, setAdvisorsModalOpen] = useState(false);

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
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assessment sx={{ fontSize: 40, color: theme.palette.primary.main }} />
        <Typography variant="h4" sx={pageStyles.pageTitle}>
          Reportes
        </Typography>
      </Box>

      {/* Total de Ventas por Asesor */}
      <Card sx={{ 
        borderRadius: 4, 
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 2px 4px rgba(0,0,0,0.1)' 
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        bgcolor: theme.palette.background.paper,
        border: 'none',
        mb: 3,
      }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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
                color: theme.palette.text.primary, 
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            >
              Total de Ventas por Asesor
            </Typography>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                setMaximizedAdvisors(!maximizedAdvisors);
              }}
              sx={{ 
                color: theme.palette.text.secondary,
                padding: 0.1,
                minWidth: 20,
                width: 20,
                height: 20,
                borderRadius: '50%',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                '& svg': {
                  fontSize: 16,
                },
              }}
            >
              <ArrowOutward />
            </IconButton>
          </Box>
          {stats?.deals?.userPerformance && stats.deals.userPerformance.length > 0 ? (
            <>
              {/* Resumen del periodo */}
              {(() => {
                const sortedUsers = [...stats.deals.userPerformance]
                  .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0));
                const topUsers = sortedUsers.slice(0, 5);
                const totalPeriod = sortedUsers.reduce((sum, user) => sum + (user.wonDealsValue || 0), 0);
                const totalAdvisors = sortedUsers.length;
                
                return (
                  <>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2,
                      flexWrap: 'wrap',
                      gap: 2,
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                        }}
                      >
                        Total del periodo: <strong style={{ color: theme.palette.text.primary }}>S/ {totalPeriod.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontSize: '0.75rem',
                        }}
                      >
                        Asesores: <strong style={{ color: theme.palette.text.primary }}>{totalAdvisors}</strong>
                      </Typography>
                    </Box>

                    {/* Lista de top 5 asesores */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {topUsers.map((user, index) => {
                        const rank = index + 1;
                        const maxValue = topUsers[0]?.wonDealsValue || 1;
                        const percentage = ((user.wonDealsValue || 0) / maxValue) * 100;
                        const avatarColors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
                        
                        return (
                          <Box 
                            key={user.userId}
                            sx={{
                              position: 'relative',
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: 'transparent',
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5,
                              mb: 1,
                            }}>
                              {/* Número de ranking */}
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: rank === 1 ? '#FFF4E6' : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                  color: rank === 1 ? '#F59E0B' : theme.palette.text.secondary,
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  flexShrink: 0,
                                }}
                              >
                                {rank}
                              </Box>

                              {/* Avatar */}
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  bgcolor: avatarColors[index % avatarColors.length],
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(user.firstName, user.lastName)}
                              </Avatar>

                              {/* Nombre y ventas */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: theme.palette.text.primary,
                                    fontSize: '0.75rem',
                                    mb: 0.25,
                                  }}
                                >
                                  {user.firstName} {user.lastName}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.6875rem',
                                  }}
                                >
                                  {user.wonDeals || 0} {user.wonDeals === 1 ? 'venta' : 'ventas'}
                                </Typography>
                              </Box>

                              {/* Monto */}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: theme.palette.text.primary,
                                  fontSize: '0.75rem',
                                  flexShrink: 0,
                                }}
                              >
                                S/ {(user.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Typography>
                            </Box>

                            {/* Barra de progreso */}
                            <Box sx={{ 
                              width: '100%', 
                              height: 6, 
                              borderRadius: 1,
                              overflow: 'hidden',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.05)',
                              position: 'relative',
                            }}>
                              <Box
                                sx={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  bgcolor: '#10B981',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                );
              })()}
            </>
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                textAlign: 'center',
                py: 3,
              }}
            >
              No hay datos de ventas por asesor disponibles
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Usuarios con Rol de Usuario
          </Typography>

          {users.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No hay usuarios con rol de usuario para mostrar
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/reports/${user.id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={user.avatar}
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getInitials(user.firstName, user.lastName)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.usuario}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '--'}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Ver Reporte
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de Todos los Asesores */}
      <Dialog
        open={advisorsModalOpen}
        onClose={() => setAdvisorsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
        }}>
          <Typography component="div" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Total de Ventas por Asesor
          </Typography>
          <IconButton
            onClick={() => setAdvisorsModalOpen(false)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {stats?.deals?.userPerformance && stats.deals.userPerformance.length > 0 ? (
            <>
              {/* Resumen del periodo */}
              {(() => {
                const sortedUsers = [...stats.deals.userPerformance]
                  .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0));
                const totalPeriod = sortedUsers.reduce((sum, user) => sum + (user.wonDealsValue || 0), 0);
                const totalAdvisors = sortedUsers.length;
                
                return (
                  <>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 3,
                      flexWrap: 'wrap',
                      gap: 2,
                      pb: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          Total del periodo: <strong style={{ color: theme.palette.text.primary }}>S/ {totalPeriod.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          Asesores: <strong style={{ color: theme.palette.text.primary }}>{totalAdvisors}</strong>
                        </Typography>
                      </Box>
                    </Box>

                    {/* Lista de todos los asesores */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 2,
                      maxHeight: '60vh',
                      overflowY: 'auto',
                      pr: 1,
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '4px',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        },
                      },
                    }}>
                      {sortedUsers.map((user, index) => {
                        const rank = index + 1;
                        const maxValue = sortedUsers[0]?.wonDealsValue || 1;
                        const percentage = ((user.wonDealsValue || 0) / maxValue) * 100;
                        const avatarColors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#10B981'];
                        
                        return (
                          <Box 
                            key={user.userId}
                            sx={{
                              position: 'relative',
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.03)' 
                                : 'rgba(0, 0, 0, 0.02)',
                              border: `1px solid ${theme.palette.divider}`,
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.05)' 
                                  : 'rgba(0, 0, 0, 0.04)',
                              },
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2,
                              mb: 1.5,
                            }}>
                              {/* Número de ranking */}
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: rank === 1 ? '#FFF4E6' : rank === 2 ? '#E0F2FE' : rank === 3 ? '#F3E8FF' : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                  color: rank === 1 ? '#F59E0B' : rank === 2 ? '#0EA5E9' : rank === 3 ? '#8B5CF6' : theme.palette.text.secondary,
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                  flexShrink: 0,
                                }}
                              >
                                {rank}
                              </Box>

                              {/* Avatar */}
                              <Avatar
                                sx={{
                                  width: 48,
                                  height: 48,
                                  bgcolor: avatarColors[index % avatarColors.length],
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(user.firstName, user.lastName)}
                              </Avatar>

                              {/* Nombre y ventas */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: theme.palette.text.primary,
                                    fontSize: '0.9375rem',
                                    mb: 0.5,
                                  }}
                                >
                                  {user.firstName} {user.lastName}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.8125rem',
                                  }}
                                >
                                  {user.wonDeals || 0} {user.wonDeals === 1 ? 'venta' : 'ventas'}
                                </Typography>
                              </Box>

                              {/* Monto */}
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 700, 
                                  color: theme.palette.text.primary,
                                  fontSize: '1rem',
                                  flexShrink: 0,
                                }}
                              >
                                S/ {(user.wonDealsValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Typography>
                            </Box>

                            {/* Barra de progreso */}
                            <Box sx={{ 
                              width: '100%', 
                              height: 8, 
                              borderRadius: 1,
                              overflow: 'hidden',
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.05)',
                              position: 'relative',
                            }}>
                              <Box
                                sx={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  bgcolor: '#10B981',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                );
              })()}
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 6,
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textAlign: 'center',
                }}
              >
                No hay datos de ventas por asesor disponibles
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Fullscreen - Total de Ventas por Asesor */}
      <Dialog
        open={maximizedAdvisors}
        onClose={() => setMaximizedAdvisors(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}>
          <Typography component="div" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Total de Ventas por Asesor
          </Typography>
          <IconButton
            onClick={() => setMaximizedAdvisors(false)}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <ArrowOutward sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {stats?.deals?.userPerformance && stats.deals.userPerformance.length > 0 ? (
            <>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 4,
                flexWrap: 'wrap',
                gap: 2,
              }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                    Total del periodo: <strong style={{ color: theme.palette.text.primary }}>
                      S/ {stats.deals.userPerformance.reduce((sum: number, user: any) => sum + (user.wonDealsValue || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </strong>
                  </Typography>
                  <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                    Asesores: <strong style={{ color: theme.palette.text.primary }}>{stats.deals.userPerformance.length}</strong>
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...stats.deals.userPerformance]
                  .sort((a, b) => (b.wonDealsValue || 0) - (a.wonDealsValue || 0))
                  .map((user, index) => {
                    const maxValue = Math.max(...(stats.deals.userPerformance || []).map((u: any) => u.wonDealsValue || 0));
                    const percentage = maxValue > 0 ? ((user.wonDealsValue || 0) / maxValue) * 100 : 0;
                    const avatarColors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
                    
                    return (
                      <Box 
                        key={user.userId}
                        sx={{
                          position: 'relative',
                          p: 3,
                          borderRadius: 2,
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          mb: 2,
                        }}>
                          <Avatar sx={{ bgcolor: avatarColors[index % avatarColors.length], width: 56, height: 56 }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              S/ {user.wonDealsValue?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                            #{index + 1}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 12, 
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}>
                          <Box
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: avatarColors[index % avatarColors.length],
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 12,
              minHeight: 600,
              width: '100%',
            }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                No hay datos de ventas por asesor disponibles
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Reports;






