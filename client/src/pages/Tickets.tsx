import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  Chip,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  Select,
  useTheme,
} from '@mui/material';
import {
  Add,
  Search,
  Support,
  CheckCircle,
  TrendingUp,
  Computer,
  ChevronLeft,
  ChevronRight,
  AddPhotoAlternate,
  Close as CloseIcon,
} from '@mui/icons-material';
import { PencilLine, Eye, Trash } from 'lucide-react';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';

interface Ticket {
  id: number;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  contactId?: number;
  assignedToId?: number;
  images?: string[];
  createdAt?: string;
  AssignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  CreatedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  Contact?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const Tickets: React.FC = () => {
  const theme = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [totalTickets, setTotalTickets] = useState(0);

  // Diálogo crear ticket (reportar fallos)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubject, setCreateSubject] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createImageFiles, setCreateImageFiles] = useState<File[]>([]);
  const [createImagePreviews, setCreateImagePreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal detalle del ticket
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Calcular estadísticas (solo de los tickets visibles en la página actual)
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  // Función para obtener iniciales
  const getInitials = (subject: string) => {
    if (!subject) return '--';
    const words = subject.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return subject.substring(0, 2).toUpperCase();
  };

  // Función para traducir estado
  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'new': 'Nuevo',
      'open': 'Abierto',
      'closed': 'Cerrado',
      'resolved': 'Resuelto',
      'pending': 'Pendiente',
    };
    return statusMap[status] || status;
  };

  // Función para traducir prioridad
  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'urgent': 'Urgente',
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja',
    };
    return priorityMap[priority] || priority;
  };

  const handlePreview = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedTicket(null);
  };

  // Función para abrir modal de edición
  const handleOpen = (ticket?: Ticket) => {
    console.log('Edit ticket:', ticket);
  };

  const handleOpenCreateDialog = () => {
    setCreateSubject('');
    setCreateDescription('');
    setCreateImageFiles([]);
    setCreateImagePreviews([]);
    setCreateError('');
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    createImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setCreateDialogOpen(false);
  };

  const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    const valid = newFiles.filter((f) => f.type.startsWith('image/'));
    if (valid.length > 5) {
      setCreateError('Máximo 5 imágenes por ticket.');
      return;
    }
    setCreateImageFiles((prev) => [...prev, ...valid].slice(0, 5));
    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setCreateImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
    setCreateError('');
  };

  const removeCreateImage = (index: number) => {
    setCreateImageFiles((prev) => prev.filter((_, i) => i !== index));
    setCreateImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitCreateTicket = async () => {
    const subject = createSubject.trim();
    if (!subject) {
      setCreateError('El título es obligatorio.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const imagesBase64: string[] = [];
      for (const file of createImageFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imagesBase64.push(dataUrl);
      }
      await api.post('/tickets', {
        subject,
        description: createDescription.trim() || undefined,
        status: 'new',
        priority: 'medium',
        images: imagesBase64.length > 0 ? imagesBase64 : undefined,
      });
      fetchTickets();
      handleCloseCreateDialog();
    } catch (error: any) {
      setCreateError(error.response?.data?.error || error.message || 'Error al crear el ticket.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: number) => {
    setTicketToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/tickets/${ticketToDelete}`);
      fetchTickets();
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Error al eliminar el ticket. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
  };

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/tickets', {
          signal: abortController.signal
        });
        
        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          setTickets(response.data.tickets || response.data || []);
        }
      } catch (error: any) {
        // Ignorar errores de cancelación
        if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        if (isMounted) {
          console.error('Error fetching tickets:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup: cancelar peticiones al desmontar
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      // Búsqueda general
      if (search) {
        params.search = search;
      }
      
      // Ordenamiento
      params.sortBy = sortBy;
      
      const response = await api.get('/tickets', { params });
      const ticketsData = response.data.tickets || response.data || [];
      
      setTickets(ticketsData);
      setTotalTickets(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
      setTotalTickets(0);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, itemsPerPage, sortBy]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Calcular paginación desde el servidor
  const totalPages = Math.ceil(totalTickets / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTickets);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);



  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Cards de resumen */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: 'none',
        bgcolor: theme.palette.background.paper,
        mb: 4,
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {/* Total Tickets */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <Support sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Total Tickets
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {totalTickets.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    6% this month
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' }, borderColor: theme.palette.divider }} />

            {/* Open Tickets */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <Computer sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Open Tickets
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {openTickets.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: taxiMonterricoColors.green }} />
                  <Typography variant="caption" sx={{ color: taxiMonterricoColors.green, fontWeight: 500, fontSize: '1rem' }}>
                    2% this month
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' }, borderColor: theme.palette.divider }} />

            {/* Resolved Tickets */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              bgcolor: 'transparent',
            }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: `${taxiMonterricoColors.green}15`,
                flexShrink: 0,
              }}>
                <CheckCircle sx={{ color: taxiMonterricoColors.green, fontSize: 60 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.4 }}>
                  Resolved Tickets
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: '3.5rem', lineHeight: 1.2 }}>
                  {resolvedTickets.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: -0.75 }}>
                  {Array.from({ length: Math.min(5, totalTickets) }).map((_, idx) => {
                    const ticket = tickets[idx];
                    return (
                      <Avatar
                        key={idx}
                        sx={{
                          width: 36,
                          height: 36,
                          border: `2px solid ${theme.palette.background.paper}`,
                          ml: idx > 0 ? -0.75 : 0,
                          bgcolor: taxiMonterricoColors.green,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          zIndex: 5 - idx,
                        }}
                      >
                        {ticket ? getInitials(ticket.subject) : String.fromCharCode(65 + idx)}
                      </Avatar>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sección de tabla */}
      <Card sx={{ 
        borderRadius: 6,
        boxShadow: 'none',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
      }}>
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="h4" sx={pageStyles.pageTitle}>
                Tickets
              </Typography>
              <Typography
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                }}
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Tickets resueltos
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="medium"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 2.5, color: theme.palette.text.secondary, fontSize: 38 }} />,
                }}
                sx={{ 
                  minWidth: 200,
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.4rem',
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.text.secondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& input::placeholder': {
                      fontSize: '1.4rem',
                      opacity: 0.7,
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  id="tickets-sort-select"
                  name="tickets-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
                    fontSize: '0.8125rem',
                    border: 'none',
                    boxShadow: 'none',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': { boxShadow: 'none' },
                    '&.Mui-focused': { boxShadow: 'none' },
                  }}
                >
                  <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                  <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleOpenCreateDialog}
                sx={pageStyles.primaryButton}
              >
                Crear ticket
              </Button>
            </Box>
          </Box>
        </Box>
        {/* Contenido principal */}
        <TableContainer 
          component={Paper}
          sx={{ 
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            borderRadius: 1.5,
            overflow: 'hidden',
            border: 'none',
            boxShadow: 'none',
            '& .MuiPaper-root': {
              borderRadius: 0,
              border: 'none',
              boxShadow: 'none',
            },
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.grey[500],
              borderRadius: 4,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[600],
              },
            },
          }}
        >
          <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafafa',
                '& .MuiTableCell-head': {
                  borderBottom: 'none',
                },
              }}>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '25%' } }}>
                    Asunto
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: 1, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '18%' } }}>
                    Contacto
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                    Prioridad
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                    Asignado a
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 1.5, md: 2 }, px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                    Fecha de Creación
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: theme.palette.text.primary, 
                    fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                    py: { xs: 1.5, md: 2 }, 
                    px: 1, 
                    width: { xs: 100, md: 120 }, 
                    minWidth: { xs: 100, md: 120 },
                    pr: { xs: 2, md: 3 }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Acciones
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', border: 'none' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : theme.palette.grey[100],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Support
                            sx={{
                              fontSize: 48,
                              color: theme.palette.text.secondary,
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              color: theme.palette.text.primary,
                            }}
                          >
                            No hay tickets registrados
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {tickets.length === 0 && !loading
                              ? 'Crea tu primer ticket para comenzar a gestionar el soporte a tus clientes.'
                              : 'No se encontraron tickets que coincidan con tu búsqueda.'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id} 
                      hover
                      onClick={() => handlePreview(ticket)}
                      sx={{ 
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                    <TableCell sx={{ py: { xs: 1.5, md: 2 }, pl: { xs: 2, md: 3 }, pr: 1, minWidth: { xs: 200, md: 250 }, width: { xs: 'auto', md: '25%' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                        <Avatar
                          sx={{
                            width: { xs: 32, md: 40 },
                            height: { xs: 32, md: 40 },
                            bgcolor: taxiMonterricoColors.green,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            fontWeight: 600,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(ticket.subject)}
                        </Avatar>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500, 
                            color: theme.palette.text.primary,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ticket.subject}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 1, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '18%' } }}>
                      {ticket.Contact ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.Contact.firstName} {ticket.Contact.lastName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          --
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '15%' } }}>
                      <Chip 
                        label={getStatusLabel(ticket.status)} 
                        size="small" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', md: '0.75rem' },
                          height: { xs: 20, md: 24 },
                          bgcolor: ticket.status === 'closed' 
                            ? (theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300])
                            : ticket.status === 'resolved' 
                            ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}15`)
                            : ticket.status === 'pending' 
                            ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}26` : `${taxiMonterricoColors.orange}15`)
                            : ticket.status === 'open' 
                            ? (theme.palette.mode === 'dark' ? `${theme.palette.primary.main}26` : `${theme.palette.primary.main}15`)
                            : theme.palette.grey[100],
                          color: ticket.status === 'closed' 
                            ? theme.palette.text.secondary
                            : ticket.status === 'resolved' 
                            ? taxiMonterricoColors.green
                            : ticket.status === 'pending' 
                            ? taxiMonterricoColors.orangeDark
                            : ticket.status === 'open' 
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                          border: 'none',
                          borderRadius: 1,
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 100, md: 120 }, width: { xs: 'auto', md: '12%' } }}>
                      <Chip 
                        label={getPriorityLabel(ticket.priority)} 
                        size="small" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.7rem', md: '0.75rem' },
                          height: { xs: 20, md: 24 },
                          bgcolor: ticket.priority === 'urgent' 
                            ? (theme.palette.mode === 'dark' ? `${theme.palette.error.main}26` : `${theme.palette.error.main}15`)
                            : ticket.priority === 'high' 
                            ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}26` : `${taxiMonterricoColors.orange}15`)
                            : ticket.priority === 'medium' 
                            ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orangeLight}26` : `${taxiMonterricoColors.orangeLight}15`)
                            : (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}15`),
                          color: ticket.priority === 'urgent' 
                            ? theme.palette.error.main
                            : ticket.priority === 'high' 
                            ? taxiMonterricoColors.orangeDark
                            : ticket.priority === 'medium' 
                            ? taxiMonterricoColors.orange
                            : taxiMonterricoColors.green,
                          border: 'none',
                          borderRadius: 1,
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                      {ticket.AssignedTo ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.AssignedTo.firstName} {ticket.AssignedTo.lastName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          --
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: { xs: 1, md: 1.5 }, minWidth: { xs: 120, md: 150 }, width: { xs: 'auto', md: '15%' } }}>
                      {ticket.createdAt ? (
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          --
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 1, width: { xs: 100, md: 120 }, minWidth: { xs: 100, md: 120 }, pr: { xs: 2, md: 3 } }}>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpen(ticket);
                            }}
                            sx={pageStyles.actionButtonEdit(theme)}
                          >
                            <PencilLine size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Vista previa">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(ticket);
                            }}
                            sx={pageStyles.actionButtonView(theme)}
                          >
                            <Eye size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ticket.id);
                            }}
                            sx={pageStyles.actionButtonDelete(theme)}
                          >
                            <Trash size={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {totalTickets > 0 && (
            <Box
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
                borderRadius: '0 0 6px 6px',
                boxShadow: 'none',
                borderTop: 'none',
                px: { xs: 2, md: 3 },
                py: { xs: 1, md: 1.5 },
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: { xs: 1.5, md: 2 },
              }}
            >
              {/* Rows per page selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Filas por página:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      '& .MuiSelect-select': {
                        py: 0.75,
                      },
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={7}>7</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={15}>15</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Pagination info */}
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {startIndex + 1}-{endIndex} de {totalTickets}
              </Typography>

              {/* Pagination controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                    '&.Mui-disabled': {
                      color: theme.palette.text.disabled,
                    },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, minWidth: 60, textAlign: 'center' }}>
                  Página {currentPage} de {totalPages}
                </Typography>
                <IconButton
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                    '&.Mui-disabled': {
                      color: theme.palette.text.disabled,
                    },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
          )}
      </Card>

      {/* Modal detalle del ticket */}
      <Dialog
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.12)',
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        {selectedTicket && (
          <>
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
              {selectedTicket.subject}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  label={getStatusLabel(selectedTicket.status)}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    bgcolor: selectedTicket.status === 'closed' ? (theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300]) : selectedTicket.status === 'resolved' ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}15`) : selectedTicket.status === 'pending' ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}26` : `${taxiMonterricoColors.orange}15`) : selectedTicket.status === 'open' ? (theme.palette.mode === 'dark' ? `${theme.palette.primary.main}26` : `${theme.palette.primary.main}15`) : theme.palette.grey[100],
                    color: selectedTicket.status === 'closed' ? theme.palette.text.secondary : selectedTicket.status === 'resolved' ? taxiMonterricoColors.green : selectedTicket.status === 'pending' ? taxiMonterricoColors.orangeDark : selectedTicket.status === 'open' ? theme.palette.primary.main : theme.palette.text.secondary,
                    border: 'none',
                    borderRadius: 1,
                  }}
                />
                <Chip
                  label={getPriorityLabel(selectedTicket.priority)}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    bgcolor: selectedTicket.priority === 'urgent' ? (theme.palette.mode === 'dark' ? `${theme.palette.error.main}26` : `${theme.palette.error.main}15`) : selectedTicket.priority === 'high' ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orange}26` : `${taxiMonterricoColors.orange}15`) : selectedTicket.priority === 'medium' ? (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.orangeLight}26` : `${taxiMonterricoColors.orangeLight}15`) : (theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}26` : `${taxiMonterricoColors.green}15`),
                    color: selectedTicket.priority === 'urgent' ? theme.palette.error.main : selectedTicket.priority === 'high' ? taxiMonterricoColors.orangeDark : selectedTicket.priority === 'medium' ? taxiMonterricoColors.orange : taxiMonterricoColors.green,
                    border: 'none',
                    borderRadius: 1,
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                Descripción
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description || 'Sin descripción'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  <strong>Asignado a:</strong> {selectedTicket.AssignedTo ? `${selectedTicket.AssignedTo.firstName} ${selectedTicket.AssignedTo.lastName}` : '--'}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  <strong>Creado por:</strong> {selectedTicket.CreatedBy ? `${selectedTicket.CreatedBy.firstName} ${selectedTicket.CreatedBy.lastName}` : '--'}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  <strong>Fecha de creación:</strong> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('es-ES') : '--'}
                </Typography>
              </Box>
              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Imágenes adjuntas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedTicket.images.map((src, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={src}
                        alt={`Adjunto ${idx + 1}`}
                        sx={{
                          maxWidth: 200,
                          maxHeight: 200,
                          objectFit: 'contain',
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
              <Button onClick={handleCloseDetailModal} variant="contained" sx={{ bgcolor: taxiMonterricoColors.green, '&:hover': { bgcolor: taxiMonterricoColors.green, filter: 'brightness(1.1)' } }}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
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
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            ¿Estás seguro de que deseas eliminar este ticket?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Esta acción no se puede deshacer. El ticket será eliminado permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button 
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            sx={pageStyles.deleteButton}
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: theme.palette.common.white }} /> : <Trash size={18} />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Crear ticket (reportar fallos) */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.12)',
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2, color: '#4BB280', fontWeight: 600 }}>
          Nuevo ticket
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
            Reporta un fallo o envía una solicitud. Incluye título, descripción y capturas si es posible.
          </Typography>
          <TextField
            label="Título"
            placeholder="Ej: Error al guardar contacto"
            value={createSubject}
            onChange={(e) => setCreateSubject(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            label="Descripción"
            placeholder="Describe el problema o la solicitud..."
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
            Imágenes (máx. 5)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {createImagePreviews.map((url, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeCreateImage(index)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {createImagePreviews.length < 5 && (
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<AddPhotoAlternate />}
                sx={{ minHeight: 80, minWidth: 120 }}
              >
                Añadir imagen
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleCreateImageChange}
                />
              </Button>
            )}
          </Box>
          {createError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {createError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={handleCloseCreateDialog} disabled={creating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCreateTicket}
            disabled={creating || !createSubject.trim()}
            startIcon={creating ? <CircularProgress size={16} sx={{ color: 'white' }} /> : null}
            sx={{ bgcolor: taxiMonterricoColors.green, '&:hover': { bgcolor: taxiMonterricoColors.green, filter: 'brightness(1.1)' } }}
          >
            {creating ? 'Enviando...' : 'Enviar ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tickets;

