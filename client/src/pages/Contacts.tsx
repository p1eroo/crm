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
  Card,
  CardContent,
  Tabs,
  Tab,
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
  People,
  TrendingUp,
  TrendingDown,
  Computer,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

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
  avatar?: string;
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
  const { user } = useAuth();
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
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
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

  // Filtrar y ordenar contactos
  const filteredContacts = contacts
    .filter((contact) => {
      // Filtro por tab (0 = Todos, 1 = Activos)
      if (activeTab === 1) {
        const activeStages = ['customer', 'evangelist', 'cierre_ganado'];
        if (!activeStages.includes(contact.lifecycleStage)) {
          return false;
        }
      }
      
      // Filtro por búsqueda
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'nameDesc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        default:
          return 0;
      }
    });

  // Calcular estadísticas
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => ['customer', 'evangelist', 'cierre_ganado'].includes(c.lifecycleStage)).length;
  const totalCompanies = new Set(contacts.filter(c => c.Company).map(c => c.Company?.id)).size;

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
    <Box sx={{ 
      bgcolor: '#f5f7fa', 
      minHeight: '100vh',
      pb: { xs: 3, sm: 6, md: 8 },
      px: { xs: 3, sm: 6, md: 8 },
      pt: { xs: 4, sm: 6, md: 6 },
    }}>
      {/* Cards de resumen - Diseño con todas las tarjetas en un contenedor */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        bgcolor: 'white',
        mb: 4,
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {/* Total Customers */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <People sx={{ color: taxiMonterricoColors.green, fontSize: 40 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 1, fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Total Customers
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1.5, fontSize: '2.5rem', lineHeight: 1.2 }}>
                  {totalContacts.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '0.8125rem' }}>
                    16% this month
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Members */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.75, fontSize: '0.875rem', fontWeight: 400 }}>
                  Members
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1, fontSize: '1.75rem', lineHeight: 1.2 }}>
                  {activeContacts.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <TrendingDown sx={{ fontSize: 14, color: '#F44336' }} />
                  <Typography variant="caption" sx={{ color: '#F44336', fontWeight: 500, fontSize: '0.75rem' }}>
                    1% this month
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <Person sx={{ color: taxiMonterricoColors.green, fontSize: 28 }} />
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

            {/* Active Now */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 0.75, fontSize: '0.875rem', fontWeight: 400 }}>
                  Active Now
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1.25, fontSize: '1.75rem', lineHeight: 1.2 }}>
                  {Math.min(activeContacts, 189)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: -0.75 }}>
                  {Array.from({ length: Math.min(5, activeContacts) }).map((_, idx) => {
                    // Usar avatares de contactos reales si están disponibles
                    const contact = contacts[idx];
                    return (
                      <Avatar
                        key={idx}
                        src={contact?.avatar}
                        sx={{
                          width: 28,
                          height: 28,
                          border: '2px solid white',
                          ml: idx > 0 ? -0.75 : 0,
                          bgcolor: contact?.avatar ? 'transparent' : taxiMonterricoColors.green,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          zIndex: 5 - idx,
                        }}
                      >
                        {!contact?.avatar && contact ? 
                          `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() :
                          String.fromCharCode(65 + idx)
                        }
                      </Avatar>
                    );
                  })}
                </Box>
              </Box>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <Computer sx={{ color: taxiMonterricoColors.green, fontSize: 28 }} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sección de tabla */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        bgcolor: 'white',
      }}>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          {/* Header de la tabla con título, búsqueda y ordenamiento */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                All Customers
              </Typography>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(1);
                }}
                sx={{
                  fontSize: '0.875rem',
                  color: '#1976d2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Active Members
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: '#9e9e9e', fontSize: 20 }} />,
                }}
                sx={{ 
                  minWidth: 200,
                  bgcolor: 'white',
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                  }}
                >
                  <MenuItem value="newest">Sort by: Newest</MenuItem>
                  <MenuItem value="oldest">Sort by: Oldest</MenuItem>
                  <MenuItem value="name">Sort by: Name A-Z</MenuItem>
                  <MenuItem value="nameDesc">Sort by: Name Z-A</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Tabla de contactos con diseño mejorado */}
        <TableContainer 
          sx={{ 
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', py: 2, px: 3 }}>
                  Customer Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', px: 2 }}>
                  Company
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', px: 2 }}>
                  Phone Number
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', px: 2 }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', px: 2 }}>
                  Country
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', px: 2 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem', px: 2, width: 60 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContacts.map((contact) => (
                <TableRow 
                  key={contact.id}
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: '#fafafa' },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                >
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: taxiMonterricoColors.green,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        }}
                      >
                        {getInitials(contact.firstName, contact.lastName)}
                      </Avatar>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#1a1a1a',
                          fontSize: '0.875rem',
                        }}
                      >
                        {contact.firstName} {contact.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    {contact.Company?.name ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1a1a1a',
                          fontSize: '0.875rem',
                        }}
                      >
                        {contact.Company.name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: '0.875rem' }}>
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1a1a1a',
                        fontSize: '0.875rem',
                      }}
                    >
                      {contact.phone || contact.mobile || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1a1a1a',
                        fontSize: '0.875rem',
                      }}
                    >
                      {contact.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1a1a1a',
                        fontSize: '0.875rem',
                      }}
                    >
                      {contact.country || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Chip
                      label={['customer', 'evangelist', 'cierre_ganado'].includes(contact.lifecycleStage) ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 24,
                        bgcolor: ['customer', 'evangelist', 'cierre_ganado'].includes(contact.lifecycleStage) 
                          ? '#E8F5E9' 
                          : '#FFEBEE',
                        color: ['customer', 'evangelist', 'cierre_ganado'].includes(contact.lifecycleStage)
                          ? '#2E7D32'
                          : '#C62828',
                        border: 'none',
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ px: 2 }}>
                    <Tooltip title="Vista previa">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(contact);
                        }}
                        sx={{
                          color: '#757575',
                          '&:hover': {
                            color: taxiMonterricoColors.green,
                            bgcolor: `${taxiMonterricoColors.green}15`,
                          },
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 48, color: '#bdbdbd' }} />
                      <Typography variant="body1" sx={{ color: '#757575', fontWeight: 500 }}>
                        No hay contactos para mostrar
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                        Crea tu primer contacto para comenzar
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación mejorada */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: 3, 
          py: 2,
          borderTop: '1px solid #e0e0e0',
        }}>
          <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.875rem' }}>
            Showing data {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredContacts.length)} of {filteredContacts.length.toLocaleString()}K entries
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              onClick={() => handleChangePage(null, page - 1)}
              disabled={page === 0}
              sx={{
                color: '#757575',
                '&:hover': { bgcolor: '#f5f5f5' },
                '&.Mui-disabled': { color: '#bdbdbd' },
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            {(() => {
              const totalPages = Math.ceil(filteredContacts.length / rowsPerPage);
              const pagesToShow: number[] = [];
              
              // Mostrar primera página
              pagesToShow.push(1);
              
              // Mostrar páginas alrededor de la actual
              for (let i = Math.max(2, page); i <= Math.min(page + 2, totalPages - 1); i++) {
                if (!pagesToShow.includes(i)) pagesToShow.push(i);
              }
              
              // Mostrar última página si hay más de 5 páginas
              if (totalPages > 5 && !pagesToShow.includes(totalPages)) {
                pagesToShow.push(totalPages);
              }
              
              return pagesToShow.map((pageNum, idx) => {
                const showEllipsis = idx > 0 && pageNum - pagesToShow[idx - 1] > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && (
                      <Typography sx={{ color: '#757575', px: 0.5 }}>...</Typography>
                    )}
                    <IconButton
                      onClick={() => handleChangePage(null, pageNum - 1)}
                      sx={{
                        minWidth: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        color: page === pageNum - 1 ? 'white' : '#757575',
                        bgcolor: page === pageNum - 1 ? taxiMonterricoColors.green : 'transparent',
                        fontWeight: page === pageNum - 1 ? 600 : 400,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: page === pageNum - 1 ? taxiMonterricoColors.greenDark : '#f5f5f5',
                        },
                      }}
                    >
                      {pageNum}
                    </IconButton>
                  </React.Fragment>
                );
              });
            })()}
            <IconButton
              onClick={() => handleChangePage(null, page + 1)}
              disabled={page >= Math.ceil(filteredContacts.length / rowsPerPage) - 1}
              sx={{
                color: '#757575',
                '&:hover': { bgcolor: '#f5f5f5' },
                '&.Mui-disabled': { color: '#bdbdbd' },
              }}
            >
              <ArrowForward sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </Card>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1.5,
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#1a1a1a',
        }}>
          {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Nombre"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Apellido"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              label="Cargo"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
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
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: '1px solid #e0e0e0',
          gap: 1,
        }}>
          <Button 
            onClick={handleClose}
            sx={{
              textTransform: 'none',
              color: '#757575',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#f5f5f5',
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1.5,
              px: 2.5,
              bgcolor: taxiMonterricoColors.green,
              '&:hover': {
                bgcolor: taxiMonterricoColors.greenDark,
              }
            }}
          >
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

