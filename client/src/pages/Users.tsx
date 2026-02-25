import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Switch,
  Tooltip,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  Pagination,
} from '@mui/material';
import {
  Add,
  Search,
  Sync,
} from '@mui/icons-material';
import { Trash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import axios from 'axios';
import { UnifiedTable } from '../components/UnifiedTable';
import UserAvatar from '../components/UserAvatar';

interface User {
  id: number;
  usuario: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'manager' | 'jefe_comercial';
  isActive: boolean;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

const Users: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [syncingOwners, setSyncingOwners] = useState(false);
  
  // Estados para el modal de creación
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'admin' | 'user' | 'manager' | 'jefe_comercial',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // Estados para búsqueda de DNI
  const [dni, setDni] = useState('');
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState('');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchUsers();
  }, []);

  // Ajustar página actual si excede el total (ej. tras eliminar usuarios)
  const totalUsers = users.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);
  const paginatedUsers = users.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      // Asegurar que cada usuario tenga el campo role correctamente mapeado
      const usersWithRole = response.data.map((user: any) => ({
        ...user,
        role: user.role || user.Role?.name || 'user',
      }));
      setUsers(usersWithRole);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al cargar usuarios' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setUpdating(userId);
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      // Actualizar con los datos del servidor para asegurar que tenemos el rol correcto
      const updatedUser = response.data;
      setUsers(users.map(u => u.id === userId ? { ...u, role: updatedUser.role || newRole } : u));
      setMessage({ type: 'success', text: 'Rol actualizado correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al actualizar el rol' 
      });
      setTimeout(() => setMessage(null), 5000);
      // Recargar usuarios para obtener el estado correcto
      fetchUsers();
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    const previousUsers = users;
    setUsers(users.map(u => u.id === userId ? { ...u, isActive } : u));
    setMessage({ 
      type: 'success', 
      text: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente` 
    });
    setTimeout(() => setMessage(null), 3000);
    try {
      await api.put(`/users/${userId}/status`, { isActive });
    } catch (error: any) {
      setUsers(previousUsers);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al actualizar el estado' 
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDelete = (userItem: User) => {
    setUserToDelete(userItem);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente' });
      setTimeout(() => setMessage(null), 3000);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al eliminar el usuario' 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Función para capitalizar iniciales (similar a Contacts.tsx)
  const capitalizeInitials = (text: string) => {
    if (!text) return '';
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Función para buscar DNI
  const handleSearchDni = async () => {
    if (!dni || dni.length < 8) {
      setDniError('El DNI debe tener al menos 8 dígitos');
      return;
    }

    setLoadingDni(true);
    setDniError('');

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';

      if (!factilizaToken) {
        setDniError(
          '⚠️ La búsqueda automática de DNI no está disponible. Puedes ingresar los datos manualmente. Para habilitarla, configura REACT_APP_FACTILIZA_TOKEN en el archivo .env'
        );
        setLoadingDni(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/dni/info/${dni}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Separar nombres y apellidos
        const nombres = data.nombres || '';
        const apellidoPaterno = data.apellido_paterno || '';
        const apellidoMaterno = data.apellido_materno || '';

        // Capitalizar solo las iniciales para nombre y apellido
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(
          `${apellidoPaterno} ${apellidoMaterno}`.trim()
        );

        // Generar usuario: primera letra del nombre + apellido completo (todo en minúsculas)
        // Ejemplo: "Jack Valdivia" -> "jvaldivia"
        const primerNombre = nombres.split(' ')[0] || '';
        const primerApellido = apellidoPaterno || '';
        const usuarioGenerado = `${primerNombre.charAt(0).toLowerCase()}${primerApellido.toLowerCase().replace(/\s+/g, '')}`;

        // Actualizar el formulario con los datos obtenidos
        setFormData((prev) => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
          usuario: usuarioGenerado,
          // No modificar password
        }));
        
        setDniError(''); // Limpiar error si fue exitoso
      } else {
        setDniError('No se encontró información para este DNI');
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        setDniError('DNI no válido o no encontrado');
      } else if (error.response?.status === 401) {
        setDniError('Error de autenticación con la API');
      } else {
        setDniError('Error al consultar el DNI. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingDni(false);
    }
  };

  const handleSyncContactOwners = async () => {
    try {
      setSyncingOwners(true);
      const res = await api.post('/contacts/sync-owners');
      const data = res.data || {};
      const msg = `Sincronización completada: ${data.updated ?? 0} contactos actualizados, ${data.skipped ?? 0} omitidos.${data.errors?.length ? ` ${data.errors.length} error(es).` : ''}`;
      setMessage({ type: data.errors?.length ? 'error' : 'success', text: msg });
      setTimeout(() => setMessage(null), 6000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al sincronizar propietarios de contactos',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSyncingOwners(false);
    }
  };

  const handleCreateUser = () => {
    setFormData({
      usuario: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user',
    });
    setFormErrors({});
    setDni('');
    setDniError('');
    setCreateDialogOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.usuario.trim()) {
      errors.usuario = 'El nombre de usuario es requerido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/auth/register', formData);
      
      // Agregar el nuevo usuario a la lista
      const newUser = {
        ...response.data.user,
        isActive: true,
      };
      setUsers([newUser, ...users]);
      
      setMessage({ type: 'success', text: 'Usuario creado correctamente' });
      setTimeout(() => setMessage(null), 3000);
      setCreateDialogOpen(false);
      setFormData({
        usuario: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user',
      });
      setFormErrors({});
      setDni('');
      setDniError('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Error al crear el usuario';
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setCreateDialogOpen(false);
    setFormData({
      usuario: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user',
    });
    setFormErrors({});
    setDni('');
    setDniError('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {message.text}
        </Alert>
      )}

      <UnifiedTable
        title="Usuarios"
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {(user?.role === 'admin' || user?.role === 'jefe_comercial') && (
              <Tooltip title="Igualar propietario de cada contacto al propietario de su empresa">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={syncingOwners ? <CircularProgress size={16} color="inherit" /> : <Sync />}
                    onClick={handleSyncContactOwners}
                    disabled={syncingOwners}
                    size="small"
                    sx={{
                      borderColor: taxiMonterricoColors.green,
                      color: taxiMonterricoColors.green,
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: { xs: '0.75rem', md: '0.8125rem' },
                      '&:hover': {
                        borderColor: '#158a5f',
                        bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}15` : `${taxiMonterricoColors.green}08`,
                      },
                    }}
                  >
                    {syncingOwners ? 'Sincronizando…' : 'Sincronizar propietarios'}
                  </Button>
                </span>
              </Tooltip>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateUser}
              size="small"
              sx={{
                bgcolor: '#13944C',
                borderRadius: 1.5,
                px: 2,
                py: 0.75,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: { xs: '0.75rem', md: '0.8125rem' },
                '&:hover': {
                  bgcolor: '#0f7039',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Crear Usuario
            </Button>
          </Box>
        }
        header={
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ width: '100%', px: 0 }}>
              <Table sx={{ 
                width: '100%', 
                tableLayout: 'fixed',
                '& .MuiTableCell-body': {
                  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                },
              }}>
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined,
                    '& .MuiTableCell-head': {
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      fontWeight: 700,
                      bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent',
                    },
                    '& .MuiTableCell-head:last-of-type': {
                      pr: 0,
                    },
                  }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, width: '25%', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent' }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, width: '25%', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, width: '18%', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent' }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, width: '17%', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, width: '15%', pl: 1, pr: { xs: 2, md: 3 }, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : 'transparent' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center', border: 'none' }}>
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
                      👤
                    </Box>
                    <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: theme.palette.text.primary,
                          fontSize: { xs: '1.25rem', md: '1.5rem' },
                        }}
                      >
                        No hay usuarios registrados
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          lineHeight: 1.6,
                          fontSize: { xs: '0.875rem', md: '0.9375rem' },
                        }}
                      >
                        Crea tu primer usuario para comenzar a gestionar el sistema.
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((userItem) => (
                <TableRow 
                  key={userItem.id}
                  sx={{ 
                    cursor: 'pointer',
                    '&:last-child td': { border: 0 },
                  }}
                >
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, width: '25%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <UserAvatar
                        firstName={userItem.firstName}
                        lastName={userItem.lastName}
                        avatar={userItem.avatar}
                        colorSeed={userItem.id?.toString() || userItem.email || userItem.usuario}
                        size="medium"
                        variant="default"
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: theme.palette.text.primary, 
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                          }}
                        >
                          {userItem.firstName} {userItem.lastName}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: theme.palette.text.secondary, 
                            fontSize: { xs: '0.7rem', md: '0.75rem' },
                          }}
                        >
                          @{userItem.usuario}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, width: '25%' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary, 
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                      }}
                    >
                      {userItem.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, width: '18%' }}>
                    {updating === userItem.id ? (
                      <CircularProgress size={20} sx={{ color: taxiMonterricoColors.green }} />
                    ) : (
                      <FormControl size="small" sx={{ minWidth: { xs: 120, md: 150 } }}>
                        <Select
                          id={`user-role-select-${userItem.id}`}
                          name={`user-role-${userItem.id}`}
                          value={userItem.role}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRoleChange(userItem.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            height: { xs: 28, md: 32 },
                            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
                            color: theme.palette.text.primary,
                            borderRadius: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            '& .MuiSelect-select': {
                              py: 0.5,
                              px: 1.5,
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              fontWeight: 500,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                            '&.Mui-focused': {
                              borderColor: taxiMonterricoColors.green,
                              boxShadow: `0 0 0 3px ${taxiMonterricoColors.green}30`,
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(91, 228, 155, 0.08)' 
                                : 'rgba(91, 228, 155, 0.05)',
                            },
                            '& .MuiSelect-icon': {
                              color: taxiMonterricoColors.green,
                            },
                          }}
                        >
                          <MenuItem 
                            value="admin" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              '&.Mui-selected': {
                                bgcolor: `${taxiMonterricoColors.green}20`,
                                color: taxiMonterricoColors.green,
                                fontWeight: 600,
                              },
                            }}
                          >
                            Administrador
                          </MenuItem>
                          <MenuItem 
                            value="jefe_comercial" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              '&.Mui-selected': {
                                bgcolor: `${taxiMonterricoColors.green}20`,
                                color: taxiMonterricoColors.green,
                                fontWeight: 600,
                              },
                            }}
                          >
                            Jefe Comercial
                          </MenuItem>
                          <MenuItem 
                            value="manager" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              '&.Mui-selected': {
                                bgcolor: `${taxiMonterricoColors.green}20`,
                                color: taxiMonterricoColors.green,
                                fontWeight: 600,
                              },
                            }}
                          >
                            Manager
                          </MenuItem>
                          <MenuItem 
                            value="user" 
                            sx={{ 
                              color: theme.palette.text.primary, 
                              fontSize: { xs: '0.75rem', md: '0.875rem' },
                              '&.Mui-selected': {
                                bgcolor: `${taxiMonterricoColors.green}20`,
                                color: taxiMonterricoColors.green,
                                fontWeight: 600,
                              },
                            }}
                          >
                            Usuario
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, width: '17%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {updating === userItem.id ? (
                        <CircularProgress size={20} sx={{ color: taxiMonterricoColors.green }} />
                      ) : (
                        <>
                          <Switch
                            checked={userItem.isActive}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(userItem.id, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: taxiMonterricoColors.green,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: taxiMonterricoColors.green,
                              },
                            }}
                          />
                          <Chip
                            label={userItem.isActive ? 'Activo' : 'Inactivo'}
                            size="small"
                            sx={{
                              height: { xs: 20, md: 24 },
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              fontWeight: 600,
                              bgcolor: userItem.isActive 
                                ? `${taxiMonterricoColors.green}20` 
                                : theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(0, 0, 0, 0.05)',
                              color: userItem.isActive 
                                ? taxiMonterricoColors.green 
                                : theme.palette.text.secondary,
                              border: userItem.isActive 
                                ? `1px solid ${taxiMonterricoColors.green}40` 
                                : `1px solid ${theme.palette.divider}`,
                            }}
                          />
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1.5, md: 2 }, pr: { xs: 2, md: 3 }, width: '15%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Eliminar usuario">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(userItem);
                            }}
                            disabled={userItem.id === user?.id}
                            sx={{
                              color: '#EF4444',
                              borderRadius: 1.5,
                              '&.Mui-disabled': {
                                color: theme.palette.text.disabled,
                                opacity: 0.5,
                              },
                            }}
                          >
                            <Trash size={20} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        }
        rows={null}
        pagination={
          totalUsers > 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, value) => setCurrentPage(value)}
                color="primary"
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
          ) : undefined
        }
      />

      {/* Dialog de creación de usuario */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCancelCreate}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(46, 125, 50, 0.12)',
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#4BB280', 
          fontWeight: 700,
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          pb: 2,
          borderBottom: `2px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, transparent 100%)`
            : `linear-gradient(135deg, rgba(46, 125, 50, 0.02) 0%, transparent 100%)`,
        }}>
          Crear Nuevo Usuario
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Campo DNI con botón de búsqueda */}
            <TextField
              id="create-dni"
              name="dni"
              label="DNI (opcional)"
              value={dni}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                setDni(value);
                setDniError('');
              }}
              error={!!dniError}
              helperText={dniError || 'Ingresa el DNI para autocompletar datos'}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSearchDni}
                      disabled={loadingDni || !dni || dni.length < 8}
                      size="small"
                      sx={{
                        color: taxiMonterricoColors.green,
                        '&:hover': {
                          bgcolor: `${taxiMonterricoColors.green}15`,
                        },
                        '&.Mui-disabled': {
                          color: theme.palette.text.disabled,
                        },
                      }}
                    >
                      {loadingDni ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              id="create-usuario"
              name="usuario"
              label="Nombre de Usuario"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              error={!!formErrors.usuario}
              helperText={formErrors.usuario}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              id="create-password"
              name="password"
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={!!formErrors.password}
              helperText={formErrors.password || 'Mínimo 6 caracteres'}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              id="create-firstName"
              name="firstName"
              label="Nombre"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              id="create-lastName"
              name="lastName"
              label="Apellido"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="create-role-label">Rol</InputLabel>
              <Select
                id="create-role"
                name="role"
                labelId="create-role-label"
                label="Rol"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                sx={{
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: 1.5,
                  },
                }}
              >
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="jefe_comercial">Jefe Comercial</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="user">Usuario</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button 
            onClick={handleCancelCreate} 
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitCreate} 
            variant="contained"
            disabled={creating}
            sx={pageStyles.saveButton}
          >
            {creating ? <CircularProgress size={20} /> : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(211, 47, 47, 0.12)',
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText id="delete-dialog-description" sx={{ color: theme.palette.text.primary, fontSize: { xs: '0.875rem', md: '1rem' } }}>
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ({userToDelete?.email})?
            <br />
            <br />
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button 
            onClick={handleCancelDelete} 
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained"
            disabled={deleting}
            sx={pageStyles.deleteButton}
          >
            {deleting ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;

