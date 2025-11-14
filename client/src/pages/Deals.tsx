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
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import api from '../config/api';

interface Deal {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  Contact?: { firstName: string; lastName: string };
  Company?: { name: string };
}

const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    stage: 'qualification',
    closeDate: '',
    probability: '',
  });

  const stages = [
    'qualification',
    'needs analysis',
    'proposal',
    'negotiation',
    'closed won',
    'closed lost',
  ];

  useEffect(() => {
    fetchDeals();
  }, [search]);

  const fetchDeals = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/deals', { params });
      setDeals(response.data.deals || response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (deal?: Deal) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        name: deal.name,
        amount: deal.amount.toString(),
        stage: deal.stage,
        closeDate: deal.closeDate ? deal.closeDate.split('T')[0] : '',
        probability: deal.probability?.toString() || '',
      });
    } else {
      setEditingDeal(null);
      setFormData({
        name: '',
        amount: '',
        stage: 'qualification',
        closeDate: '',
        probability: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDeal(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
      };
      if (editingDeal) {
        await api.put(`/deals/${editingDeal.id}`, data);
      } else {
        await api.post('/deals', data);
      }
      handleClose();
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este negocio?')) {
      try {
        await api.delete(`/deals/${id}`);
        fetchDeals();
      } catch (error) {
        console.error('Error deleting deal:', error);
      }
    }
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
        <Typography variant="h4">Negocios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nuevo Negocio
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Buscar negocios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Etapa</TableCell>
              <TableCell>Probabilidad</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>{deal.name}</TableCell>
                <TableCell>${deal.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={deal.stage} size="small" />
                </TableCell>
                <TableCell>{deal.probability ? `${deal.probability}%` : '-'}</TableCell>
                <TableCell>
                  {deal.Contact ? `${deal.Contact.firstName} ${deal.Contact.lastName}` : '-'}
                </TableCell>
                <TableCell>{deal.Company?.name || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(deal)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(deal.id)}>
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
          {editingDeal ? 'Editar Negocio' : 'Nuevo Negocio'}
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
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <TextField
              select
              label="Etapa"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            >
              {stages.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha de Cierre"
              type="date"
              value={formData.closeDate}
              onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Probabilidad (%)"
              type="number"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDeal ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deals;




