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
  Drawer,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Tooltip,
  Checkbox as MuiCheckbox,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Menu,
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Search, 
  Close, 
  Business, 
  Email, 
  Phone, 
  Work, 
  Person,
  Note,
  Assignment,
  Event,
  MoreVert,
  ExpandMore,
  ContentCopy,
  KeyboardArrowDown,
  Settings,
  LocationOn,
  BarChart,
  FilterList,
  AttachFile,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  lifecycleStage: string;
  leadStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  Company?: { 
    id: number;
    name: string;
    domain?: string;
    phone?: string;
  };
  Companies?: Array<{
    id: number;
    name: string;
    domain?: string;
    phone?: string;
  }>;
  Owner?: { 
    id: number;
    firstName: string; 
    lastName: string;
    email: string;
  };
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
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

  const handlePreview = async (contact: Contact) => {
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      // Obtener información completa del contacto
      const response = await api.get(`/contacts/${contact.id}`);
      setPreviewContact(response.data);
    } catch (error) {
      console.error('Error fetching contact details:', error);
      // Si falla, usar la información básica que ya tenemos
      setPreviewContact(contact);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewContact(null);
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'subscriber': 'default',
      'lead': 'info',
      'contacto': 'info',
      'marketing qualified lead': 'primary',
      'sales qualified lead': 'primary',
      'reunion_efectiva': 'primary',
      'propuesta_economica': 'warning',
      'negociacion': 'warning',
      'opportunity': 'warning',
      'cierre_ganado': 'success',
      'customer': 'success',
      'evangelist': 'success',
    };
    return colors[stage] || 'default';
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'subscriber': 'Suscriptor',
      'lead': 'Lead',
      'contacto': 'Contacto',
      'marketing qualified lead': 'MQL',
      'sales qualified lead': 'SQL',
      'reunion_efectiva': 'Reunión Efectiva',
      'propuesta_economica': 'Propuesta Económica',
      'negociacion': 'Negociación',
      'opportunity': 'Oportunidad',
      'cierre_ganado': 'Cierre Ganado',
      'customer': 'Cliente',
      'evangelist': 'Evangelista',
    };
    return labels[stage] || stage;
  };

  // Agrupar contactos por etapa
  const groupedContacts = contacts.reduce((acc, contact) => {
    const stage = contact.lifecycleStage || 'lead';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Orden de las etapas (incluyendo todas las posibles)
  const stageOrder = [
    'lead', 
    'contacto',
    'marketing qualified lead', 
    'sales qualified lead',
    'reunion_efectiva',
    'propuesta_economica',
    'negociacion',
    'opportunity', 
    'cierre_ganado',
    'customer', 
    'evangelist', 
    'subscriber'
  ];
  
  // Obtener todas las etapas que tienen contactos, ordenadas según stageOrder
  const allStages = Object.keys(groupedContacts);
  const orderedStages = [
    ...stageOrder.filter(stage => groupedContacts[stage] && groupedContacts[stage].length > 0),
    ...allStages.filter(stage => !stageOrder.includes(stage))
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedContacts.map((contact) => contact.id);
      setSelectedContacts(newSelected);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectOne = (contactId: number) => {
    const selectedIndex = selectedContacts.indexOf(contactId);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedContacts, contactId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedContacts.slice(1));
    } else if (selectedIndex === selectedContacts.length - 1) {
      newSelected = newSelected.concat(selectedContacts.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedContacts.slice(0, selectedIndex),
        selectedContacts.slice(selectedIndex + 1)
      );
    }

    setSelectedContacts(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, contactId: number) => {
    setActionMenuAnchor({ ...actionMenuAnchor, [contactId]: event.currentTarget });
  };

  const handleActionMenuClose = (contactId: number) => {
    setActionMenuAnchor({ ...actionMenuAnchor, [contactId]: null });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtrar contactos según búsqueda
  const filteredContacts = contacts.filter((contact) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      contact.firstName.toLowerCase().includes(searchLower) ||
      contact.lastName.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Paginación
  const paginatedContacts = filteredContacts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header con breadcrumbs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Contactos &gt; Home &gt; <span style={{ color: '#1976d2' }}>Contactos</span>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <BarChart />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <FilterList />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <AttachFile />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Settings />
          </IconButton>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => handleOpen()}
            sx={{
              bgcolor: '#1976d2',
              textTransform: 'none',
              fontWeight: 600,
              ml: 1,
            }}
          >
            CREAR CONTACTO
          </Button>
        </Box>
      </Box>

      {/* Controles de paginación y búsqueda */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Mostrar</InputLabel>
            <Select
              value={rowsPerPage}
              label="Mostrar"
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
            >
              <MenuItem value={10}>10 entradas</MenuItem>
              <MenuItem value={25}>25 entradas</MenuItem>
              <MenuItem value={50}>50 entradas</MenuItem>
              <MenuItem value={100}>100 entradas</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
            sx={{ minWidth: 250 }}
          />
        </Box>
      </Paper>

      {/* Tabla de contactos */}
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell padding="checkbox">
                <MuiCheckbox
                  indeterminate={selectedContacts.length > 0 && selectedContacts.length < paginatedContacts.length}
                  checked={paginatedContacts.length > 0 && selectedContacts.length === paginatedContacts.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CONTACTO</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>EMAIL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>GRUPO</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>TELÉFONO</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>FECHA</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ESTADO</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedContacts.map((contact) => (
              <TableRow 
                key={contact.id}
                hover
                sx={{ 
                  '&:hover': { bgcolor: 'action.hover' },
                  cursor: 'pointer',
                }}
              >
                <TableCell padding="checkbox">
                  <MuiCheckbox
                    checked={selectedContacts.indexOf(contact.id) !== -1}
                    onChange={() => handleSelectOne(contact.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: '#1976d2',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(contact.firstName, contact.lastName)}
                    </Avatar>
                    <Typography 
                      variant="body2" 
                      sx={{ fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      {contact.firstName} {contact.lastName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {contact.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {contact.Company?.name && (
                      <Chip
                        label={contact.Company.name}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          bgcolor: '#e3f2fd',
                          color: '#1976d2',
                        }}
                      />
                    )}
                    {contact.tags && contact.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          bgcolor: '#f3e5f5',
                          color: '#7b1fa2',
                        }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {contact.phone || contact.mobile || '--'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(contact.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStageLabel(contact.lifecycleStage)}
                    color={getStageColor(contact.lifecycleStage)}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(contact);
                      }}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionMenuOpen(e, contact.id);
                      }}
                      sx={{ color: 'text.secondary' }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                    <Menu
                      anchorEl={actionMenuAnchor[contact.id]}
                      open={Boolean(actionMenuAnchor[contact.id])}
                      onClose={() => handleActionMenuClose(contact.id)}
                    >
                      <MenuItem onClick={() => {
                        handleOpen(contact);
                        handleActionMenuClose(contact.id);
                      }}>
                        <Edit sx={{ mr: 1, fontSize: 18 }} /> Editar
                      </MenuItem>
                      <MenuItem onClick={() => {
                        handleDelete(contact.id);
                        handleActionMenuClose(contact.id);
                      }}>
                        <Delete sx={{ mr: 1, fontSize: 18 }} /> Eliminar
                      </MenuItem>
                    </Menu>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {paginatedContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay contactos para mostrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <TablePagination
        component="div"
        count={filteredContacts.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Mostrar:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

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
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="contacto">Contacto</MenuItem>
              <MenuItem value="marketing qualified lead">MQL</MenuItem>
              <MenuItem value="sales qualified lead">SQL</MenuItem>
              <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
              <MenuItem value="propuesta_economica">Propuesta Económica</MenuItem>
              <MenuItem value="negociacion">Negociación</MenuItem>
              <MenuItem value="opportunity">Oportunidad</MenuItem>
              <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
              <MenuItem value="customer">Cliente</MenuItem>
              <MenuItem value="evangelist">Evangelista</MenuItem>
              <MenuItem value="subscriber">Suscriptor</MenuItem>
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

        {/* Panel de Vista Previa */}
        <Drawer
          anchor="top"
          open={previewOpen}
          onClose={handleClosePreview}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '100%', sm: 600 },
              maxWidth: '90vw',
              maxHeight: '90vh',
              margin: '0 auto',
              boxSizing: 'border-box',
              borderRadius: { xs: 0, sm: '0 0 8px 8px' },
            },
          }}
        >
          {loadingPreview ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" sx={{ width: '100%' }}>
              <CircularProgress />
            </Box>
          ) : previewContact ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header con fondo teal */}
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {previewContact.firstName} {previewContact.lastName}
                </Typography>
                <IconButton onClick={handleClosePreview} size="small" sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Box>

              {/* Contenido principal */}
              <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
                {/* Información principal del contacto */}
                <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                      }}
                    >
                      {getInitials(previewContact.firstName, previewContact.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {previewContact.firstName} {previewContact.lastName}
                      </Typography>
                      {previewContact.jobTitle && (
                        <Typography variant="body2" color="text.secondary">
                          {previewContact.jobTitle}
                          {(previewContact.Companies && previewContact.Companies.length > 0) || previewContact.Company
                            ? ` en ${(previewContact.Companies && previewContact.Companies.length > 0) ? previewContact.Companies[0].name : previewContact.Company?.name}`
                            : ''}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          navigate(`/contacts/${previewContact.id}`);
                          handleClosePreview();
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        Ver registro
                      </Button>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Email con botón copiar */}
                  {previewContact.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {previewContact.email}
                      </Typography>
                      <Tooltip title="Copiar">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(previewContact.email || '');
                          }}
                        >
                          <ContentCopy sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                  {/* Botones de acción rápida */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Note />}
                      onClick={() => {
                        navigate(`/contacts/${previewContact.id}`);
                        handleClosePreview();
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'rgba(46, 125, 50, 0.04)',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      NOTA
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Email />}
                      onClick={() => {
                        navigate(`/contacts/${previewContact.id}`);
                        handleClosePreview();
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'rgba(46, 125, 50, 0.04)',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      CORREO
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Phone />}
                      onClick={() => {
                        navigate(`/contacts/${previewContact.id}`);
                        handleClosePreview();
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'rgba(46, 125, 50, 0.04)',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      LLAMADA
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => {
                        navigate(`/contacts/${previewContact.id}`);
                        handleClosePreview();
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'rgba(46, 125, 50, 0.04)',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      TAREA
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Event />}
                      onClick={() => {
                        navigate(`/contacts/${previewContact.id}`);
                        handleClosePreview();
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'rgba(46, 125, 50, 0.04)',
                        },
                        '& .MuiButton-startIcon': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      REUNIÓN
                    </Button>
                  </Box>
                </Box>

                {/* Sección "Acerca de este objeto Contacto" */}
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setAboutExpanded(!aboutExpanded)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <KeyboardArrowDown
                        sx={{
                          transform: aboutExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s',
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Acerca de este objeto Contacto
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                      <IconButton size="small">
                        <Settings />
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={aboutExpanded}>
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Correo
                        </Typography>
                        <Typography variant="body2">
                          {previewContact.email || '--'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Número de teléfono
                        </Typography>
                        <Typography variant="body2">
                          {previewContact.phone || previewContact.mobile || '--'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Nombre de la empresa
                        </Typography>
                        <Typography variant="body2">
                          {(previewContact.Companies && previewContact.Companies.length > 0)
                            ? previewContact.Companies[0].name
                            : previewContact.Company?.name || '--'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Estado del lead
                        </Typography>
                        <Typography variant="body2">
                          {previewContact.leadStatus || '--'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Etapa del ciclo de vida
                        </Typography>
                        <Chip
                          label={previewContact.lifecycleStage}
                          color={getStageColor(previewContact.lifecycleStage)}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Propietario del contacto
                        </Typography>
                        <Typography variant="body2">
                          {previewContact.Owner
                            ? `${previewContact.Owner.firstName} ${previewContact.Owner.lastName}`
                            : 'Sin propietario'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Rol de compra
                        </Typography>
                        <Typography variant="body2">--</Typography>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            </Box>
          ) : null}
        </Drawer>
      </Box>
    );
  };
  
  export default Contacts;

