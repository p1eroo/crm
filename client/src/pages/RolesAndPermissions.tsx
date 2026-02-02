import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { useTheme } from '@mui/material/styles';
import { UnifiedTable } from '../components/UnifiedTable';

interface Permission {
  key: string;
  name: string;
  granted: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
}

const RolesAndPermissions: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRoles();
    }
  }, [user?.role]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar roles y permisos');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const names: { [key: string]: string } = {
      'user': 'Usuario',
      'manager': 'Gerente',
      'jefe_comercial': 'Jefe Comercial',
      'admin': 'Administrador',
    };
    return names[roleName] || roleName;
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
          No tienes permisos para ver roles y permisos
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
      ) : error ? (
        <Box sx={{ 
          borderRadius: 3, 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(46, 125, 50, 0.08)',
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          p: 3,
        }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Box>
      ) : (
        <UnifiedTable
          title="Roles y Permisos"
          actions={null}
          header={null}
          rows={
            roles.length === 0 ? (
              <Box />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                  },
                  gap: 3,
                  p: { xs: 2, md: 3 },
                }}
              >
          {roles.map((role) => (
            <Card 
              key={role.id} 
              sx={{ 
                height: '100%',
                borderRadius: 3, 
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 4px 12px rgba(46, 125, 50, 0.08)',
                bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 6px 16px rgba(0,0,0,0.4)' 
                    : '0 6px 16px rgba(46, 125, 50, 0.12)',
                  transform: 'translateY(-2px)',
                  borderColor: `${taxiMonterricoColors.green}40`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1,
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1rem', md: '1.25rem' },
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {getRoleDisplayName(role.name)}
                    </Typography>
                    {role.description && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary, 
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                        }}
                      >
                        {role.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    label={`${role.userCount} ${role.userCount === 1 ? 'usuario' : 'usuarios'}`} 
                    size="small" 
                    sx={{
                      bgcolor: `${taxiMonterricoColors.green}20`,
                      color: taxiMonterricoColors.green,
                      borderColor: taxiMonterricoColors.green,
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      height: { xs: 24, md: 28 },
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                      },
                    }}
                    variant="outlined"
                  />
                </Box>

                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1.5, 
                    mt: 2,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    color: theme.palette.text.primary,
                  }}
                >
                  Permisos:
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{
                        background: `linear-gradient(135deg, ${taxiMonterricoColors.green}08 0%, ${taxiMonterricoColors.orange}08 100%)`,
                        borderBottom: `2px solid ${taxiMonterricoColors.greenLight}`,
                        '& .MuiTableCell-head': {
                          borderBottom: 'none',
                          fontWeight: 700,
                        },
                      }}>
                        <TableCell sx={{ fontWeight: 600, width: '70%', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1, md: 1.5 } }}>Permiso</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center', fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1, md: 1.5 } }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {role.permissions.map((permission) => (
                        <TableRow 
                          key={permission.key}
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(91, 228, 155, 0.05)' 
                                : 'rgba(91, 228, 155, 0.03)',
                            },
                          }}
                        >
                          <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1, md: 1.5 } }}>
                            {permission.name}
                          </TableCell>
                          <TableCell align="center" sx={{ py: { xs: 1, md: 1.5 } }}>
                            {permission.granted ? (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                label="Concedido"
                                size="small"
                                sx={{
                                  bgcolor: `${taxiMonterricoColors.green}20`,
                                  color: taxiMonterricoColors.green,
                                  borderColor: taxiMonterricoColors.green,
                                  fontWeight: 600,
                                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                                  height: { xs: 24, md: 28 },
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                                  },
                                }}
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<Cancel sx={{ fontSize: 16 }} />}
                                label="Denegado"
                                size="small"
                                sx={{
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.05)' 
                                    : 'rgba(0, 0, 0, 0.02)',
                                  color: theme.palette.text.secondary,
                                  borderColor: theme.palette.divider,
                                  fontWeight: 600,
                                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                                  height: { xs: 24, md: 28 },
                                  transition: 'all 0.2s ease',
                                }}
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
              ))}
              </Box>
            )
          }
          emptyState={
            roles.length === 0 ? (
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
                    🔒
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
                      No hay roles registrados
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      }}
                    >
                      No se encontraron roles en el sistema.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : null
          }
        />
      )}
    </Box>
  );
};

export default RolesAndPermissions;
