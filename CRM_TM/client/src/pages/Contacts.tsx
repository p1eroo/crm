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
  Link,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  lifecycleStage: string;
  Company?: { name: string };
  Owner?: { firstName: string; lastName: string };
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    lifecycleStage: 'lead',
  });

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const fetchContacts = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/contacts', { params });
      setContacts(response.data.contacts || response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || '',
        jobTitle: contact.jobTitle || '',
        lifecycleStage: contact.lifecycleStage,
      });
    } else {
      setEditingContact(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        lifecycleStage: 'lead',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      handleClose();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este contacto?')) {
      try {
        await api.delete(`/contacts/${id}`);
        fetchContacts();
      } catch (error) {
        console.error('Error deleting contact:', error);
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
        <Typography variant="h4">Contactos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Nuevo Contacto
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Buscar contactos..."
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
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Etapa</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      font: 'inherit',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {contact.firstName} {contact.lastName}
                  </Link>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone || '-'}</TableCell>
                <TableCell>{contact.jobTitle || '-'}</TableCell>
                <TableCell>{contact.Company?.name || '-'}</TableCell>
                <TableCell>
                  <Chip label={contact.lifecycleStage} color={getStageColor(contact.lifecycleStage)} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(contact)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(contact.id)}>
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
          {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <TextField
              label="Apellido"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Cargo"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
            {editingContact ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contacts;

