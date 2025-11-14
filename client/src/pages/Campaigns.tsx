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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../config/api';

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    status: 'draft',
    budget: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data.campaigns || response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        budget: campaign.budget?.toString() || '',
        startDate: '',
        endDate: '',
        description: '',
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        type: 'email',
        status: 'draft',
        budget: '',
        startDate: '',
        endDate: '',
        description: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCampaign(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };
      if (editingCampaign) {
        await api.put(`/campaigns/${editingCampaign.id}`, data);
      } else {
        await api.post('/campaigns', data);
      }
      handleClose();
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta campaña?')) {
      try {
        await api.delete(`/campaigns/${id}`);
        fetchCampaigns();
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'draft': 'default',
      'scheduled': 'info',
      'active': 'success',
      'paused': 'warning',
      'completed': 'success',
      'cancelled': 'error',
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Campañas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nueva Campaña
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Presupuesto</TableCell>
              <TableCell>Gastado</TableCell>
              <TableCell>Impresiones</TableCell>
              <TableCell>Clics</TableCell>
              <TableCell>Conversiones</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.type}</TableCell>
                <TableCell>
                  <Chip label={campaign.status} color={getStatusColor(campaign.status)} size="small" />
                </TableCell>
                <TableCell>{campaign.budget ? `$${campaign.budget.toLocaleString()}` : '-'}</TableCell>
                <TableCell>{campaign.spent ? `$${campaign.spent.toLocaleString()}` : '-'}</TableCell>
                <TableCell>{campaign.impressions || 0}</TableCell>
                <TableCell>{campaign.clicks || 0}</TableCell>
                <TableCell>{campaign.conversions || 0}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(campaign)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(campaign.id)}>
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
          {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
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
              select
              label="Tipo"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="social">Social</MenuItem>
              <MenuItem value="advertising">Publicidad</MenuItem>
              <MenuItem value="other">Otro</MenuItem>
            </TextField>
            <TextField
              select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="draft">Borrador</MenuItem>
              <MenuItem value="scheduled">Programada</MenuItem>
              <MenuItem value="active">Activa</MenuItem>
              <MenuItem value="paused">Pausada</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </TextField>
            <TextField
              label="Presupuesto"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
            <TextField
              label="Fecha de Inicio"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha de Fin"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Descripción"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCampaign ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Campaigns;








