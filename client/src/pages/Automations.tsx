import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../config/api';
import { pageStyles } from '../theme/styles';

interface Automation {
  id: number;
  name: string;
  trigger: string;
  status: string;
}

const Automations: React.FC = () => {
  const theme = useTheme();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: '',
    status: 'draft',
    description: '',
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await api.get('/automations');
      setAutomations(response.data);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (automation?: Automation) => {
    if (automation) {
      setEditingAutomation(automation);
      setFormData({
        name: automation.name,
        trigger: automation.trigger,
        status: automation.status,
        description: '',
      });
    } else {
      setEditingAutomation(null);
      setFormData({
        name: '',
        trigger: '',
        status: 'draft',
        description: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAutomation(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingAutomation) {
        await api.put(`/automations/${editingAutomation.id}`, formData);
      } else {
        await api.post('/automations', formData);
      }
      handleClose();
      fetchAutomations();
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta automatización?')) {
      try {
        await api.delete(`/automations/${id}`);
        fetchAutomations();
      } catch (error) {
        console.error('Error deleting automation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'draft': 'default',
      'active': 'success',
      'inactive': 'error',
    };
    return colors[status] || 'default';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Automatizaciones</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nueva Automatización
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Trigger</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {automations.map((automation) => (
              <TableRow key={automation.id}>
                <TableCell>{automation.name}</TableCell>
                <TableCell>{automation.trigger}</TableCell>
                <TableCell>
                  <Chip label={automation.status} color={getStatusColor(automation.status)} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(automation)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(automation.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Trigger"
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              required
              helperText="Ej: Cuando un contacto se crea, cuando un deal cambia de etapa, etc."
            />
            <TextField
              select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="draft">Borrador</MenuItem>
              <MenuItem value="active">Activa</MenuItem>
              <MenuItem value="inactive">Inactiva</MenuItem>
            </TextField>
            <TextField
              label="Descripción"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button onClick={handleClose} sx={pageStyles.cancelButton}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" sx={pageStyles.saveButton}>
            {editingAutomation ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Automations;








