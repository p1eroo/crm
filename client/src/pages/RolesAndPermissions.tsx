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
import { Security, CheckCircle, Cancel } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';

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
      <Box sx={pageStyles.pageContainer}>
        <Alert severity="error">No tienes permisos para ver roles y permisos</Alert>
      </Box>
    );
  }

  return (
    <Box sx={pageStyles.pageContainer}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Security sx={{ fontSize: 32, color: taxiMonterricoColors.green }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Roles y Permisos
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 3,
          }}
        >
          {roles.map((role) => (
            <Card key={role.id} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {getRoleDisplayName(role.name)}
                    </Typography>
                    {role.description && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {role.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    label={`${role.userCount} usuario(s)`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, mt: 2 }}>
                  Permisos:
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '70%' }}>Permiso</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {role.permissions.map((permission) => (
                        <TableRow key={permission.key}>
                          <TableCell>{permission.name}</TableCell>
                          <TableCell align="center">
                            {permission.granted ? (
                              <Chip
                                icon={<CheckCircle />}
                                label="Concedido"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<Cancel />}
                                label="Denegado"
                                color="default"
                                size="small"
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
      )}
    </Box>
  );
};

export default RolesAndPermissions;
