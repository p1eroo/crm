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
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Delete,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
          Administración de Usuarios
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Gestiona los usuarios del sistema y asigna roles
        </Typography>
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
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

