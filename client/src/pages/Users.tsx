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
  Paper,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Avatar,
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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Delete,
  Add,
  Search,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import axios from 'axios';

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

  useEffect(() => {
    fetchUsers();
  }, []);

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
    try {
      setUpdating(userId);
      await api.put(`/users/${userId}/status`, { isActive });
      setUsers(users.map(u => u.id === userId ? { ...u, isActive } : u));
      setMessage({ 
        type: 'success', 
        text: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente` 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al actualizar el estado' 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setUpdating(null);
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
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
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={pageStyles.pageTitle}>
            Usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Gestiona los usuarios del sistema y asigna roles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
          sx={{
            bgcolor: taxiMonterricoColors.green,
            '&:hover': {
              bgcolor: '#158a5f',
            },
          }}
        >
          Crear Usuario
        </Button>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)', bgcolor: theme.palette.background.paper }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((userItem) => (
              <TableRow 
                key={userItem.id}
                sx={{ 
                  '&:hover': { bgcolor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#F9FAFB' },
                  '&:last-child td': { border: 0 }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={userItem.avatar}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: taxiMonterricoColors.green,
                        fontSize: '1rem',
                      }}
                    >
                      {!userItem.avatar && getInitials(userItem.firstName, userItem.lastName)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                        {userItem.firstName} {userItem.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        @{userItem.usuario}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                    {userItem.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  {updating === userItem.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        id={`user-role-select-${userItem.id}`}
                        name={`user-role-${userItem.id}`}
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                        sx={{
                          height: 32,
                          bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
                          color: theme.palette.text.primary,
                          '& .MuiSelect-select': {
                            py: 0.5,
                            px: 1.5,
                            fontSize: '0.875rem',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.divider,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.text.secondary,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                      >
                        <MenuItem value="admin" sx={{ color: theme.palette.text.primary }}>Administrador</MenuItem>
                        <MenuItem value="jefe_comercial" sx={{ color: theme.palette.text.primary }}>Jefe Comercial</MenuItem>
                        <MenuItem value="manager" sx={{ color: theme.palette.text.primary }}>Manager</MenuItem>
                        <MenuItem value="user" sx={{ color: theme.palette.text.primary }}>Usuario</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {updating === userItem.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <>
                        <Switch
                          checked={userItem.isActive}
                          onChange={(e) => handleStatusChange(userItem.id, e.target.checked)}
                          size="small"
                          color="success"
                        />
                        <Chip
                          label={userItem.isActive ? 'Activo' : 'Inactivo'}
                          size="small"
                          color={userItem.isActive ? 'success' : 'default'}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                          }}
                        />
                      </>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={userItem.isActive ? 'Usuario activo' : 'Usuario inactivo'}>
                      {userItem.isActive ? (
                        <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
                      ) : (
                        <Cancel sx={{ color: '#EF4444', fontSize: 20 }} />
                      )}
                    </Tooltip>
                    <Tooltip title="Eliminar usuario">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(userItem)}
                          disabled={userItem.id === user?.id}
                          sx={{
                            color: '#EF4444',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : '#ffebee',
                            },
                            '&.Mui-disabled': {
                              color: theme.palette.text.disabled,
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de creación de usuario */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCancelCreate}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.12)',
            bgcolor: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
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
              <TextField
                id="create-role"
                name="role"
                select
                label="Rol"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  },
                }}
              >
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="jefe_comercial">Jefe Comercial</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="user">Usuario</MenuItem>
              </TextField>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCancelCreate} color="inherit" sx={{ color: theme.palette.text.secondary }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitCreate} 
            variant="contained"
            disabled={creating}
            sx={{
              bgcolor: taxiMonterricoColors.green,
              '&:hover': {
                bgcolor: '#158a5f',
              },
            }}
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
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.12)',
            bgcolor: theme.palette.background.paper,
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ color: theme.palette.text.primary }}>
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ({userToDelete?.email})?
            <br />
            <br />
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit" sx={{ color: theme.palette.text.secondary }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;

