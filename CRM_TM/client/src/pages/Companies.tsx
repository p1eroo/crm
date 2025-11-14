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

interface Company {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  phone?: string;
  lifecycleStage: string;
  Owner?: { firstName: string; lastName: string };
}

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    phone: '',
    lifecycleStage: 'lead',
  });

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/companies', { params });
      setCompanies(response.data.companies || response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        domain: company.domain || '',
        industry: company.industry || '',
        phone: company.phone || '',
        lifecycleStage: company.lifecycleStage,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        domain: '',
        industry: '',
        phone: '',
        lifecycleStage: 'lead',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompany(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, formData);
      } else {
        await api.post('/companies', formData);
      }
      handleClose();
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta empresa?')) {
      try {
        await api.delete(`/companies/${id}`);
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'subscriber': 'default',
      'lead': 'info',
      'marketing qualified lead': 'primary',
      'sales qualified lead': 'primary',
      'opportunity': 'warning',
      'customer': 'success',
      'evangelist': 'success',
    };
    return colors[stage] || 'default';
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
        <Typography variant="h4">Empresas</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nueva Empresa
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Buscar empresas..."
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
              <TableCell>Dominio</TableCell>
              <TableCell>Industria</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Etapa</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.domain || '-'}</TableCell>
                <TableCell>{company.industry || '-'}</TableCell>
                <TableCell>{company.phone || '-'}</TableCell>
                <TableCell>
                  <Chip label={company.lifecycleStage} color={getStageColor(company.lifecycleStage)} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(company)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(company.id)}>
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
          {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
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
              label="Dominio"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            />
            <TextField
              label="Industria"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
            >
              <MenuItem value="subscriber">Suscriptor</MenuItem>
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="marketing qualified lead">MQL</MenuItem>
              <MenuItem value="sales qualified lead">SQL</MenuItem>
              <MenuItem value="opportunity">Oportunidad</MenuItem>
              <MenuItem value="customer">Cliente</MenuItem>
              <MenuItem value="evangelist">Evangelista</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCompany ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;





