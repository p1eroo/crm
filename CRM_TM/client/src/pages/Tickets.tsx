import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Tabs,
  Tab,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  ImportExport,
  FilterList,
  ViewList,
  ViewModule,
  Refresh,
  ContentCopy,
  Edit,
  KeyboardArrowDown,
  Close,
} from '@mui/icons-material';
import api from '../config/api';

interface Ticket {
  id: number;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  contactId?: number;
  assignedToId?: number;
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState(0);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data.tickets || response.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionsMenuAnchor(event.currentTarget);
  };

  const handleActionsMenuClose = () => {
    setActionsMenuAnchor(null);
  };

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewMenuAnchor(event.currentTarget);
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchor(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              Tickets
              <KeyboardArrowDown fontSize="small" />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tickets.length} registros
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowDown />}
              onClick={handleActionsMenuOpen}
              sx={{
                borderColor: '#2E7D32',
                color: '#2E7D32',
                '&:hover': {
                  borderColor: '#1B5E20',
                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                },
              }}
            >
              Acciones
            </Button>
            <Menu
              anchorEl={actionsMenuAnchor}
              open={Boolean(actionsMenuAnchor)}
              onClose={handleActionsMenuClose}
            >
              <MenuItem onClick={handleActionsMenuClose}>Importar</MenuItem>
              <MenuItem onClick={handleActionsMenuClose}>Exportar</MenuItem>
            </Menu>
            <Button
              variant="outlined"
              startIcon={<ImportExport />}
              sx={{
                borderColor: '#FF9800',
                color: '#FF9800',
                '&:hover': {
                  borderColor: '#F57C00',
                  backgroundColor: 'rgba(255, 152, 0, 0.04)',
                },
              }}
            >
              Importar
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                bgcolor: '#FF9800',
                '&:hover': {
                  bgcolor: '#F57C00',
                },
              }}
            >
              Crear ticket
            </Button>
          </Box>
        </Box>

        {/* Tabs de vistas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={viewTab}
            onChange={(e, newValue) => setViewTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minHeight: 48,
                fontSize: '0.875rem',
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Todos tickets
                  <IconButton
                    size="small"
                    sx={{
                      width: 20,
                      height: 20,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
            <Tab label="Mis tickets abiertos" />
            <Tab label="Tickets no asignados" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Add fontSize="small" />
                  Agregar vista (3/5)
                </Box>
              }
            />
            <Tab label="Todas las vistas" />
          </Tabs>
        </Box>

        {/* Toolbar de filtros */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" sx={{ bgcolor: '#e3f2fd' }}>
              <ViewList fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ViewModule fontSize="small" />
            </IconButton>
          </Box>
          <Chip
            label="Todos los pipelines"
            size="small"
            deleteIcon={<KeyboardArrowDown fontSize="small" />}
            onDelete={() => {}}
            onClick={() => {}}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Propietario del ticket"
            size="small"
            deleteIcon={<KeyboardArrowDown fontSize="small" />}
            onDelete={() => {}}
            onClick={() => {}}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Fecha de creación"
            size="small"
            deleteIcon={<KeyboardArrowDown fontSize="small" />}
            onDelete={() => {}}
            onClick={() => {}}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Última actividad"
            size="small"
            deleteIcon={<KeyboardArrowDown fontSize="small" />}
            onDelete={() => {}}
            onClick={() => {}}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Prioridad"
            size="small"
            deleteIcon={<KeyboardArrowDown fontSize="small" />}
            onDelete={() => {}}
            onClick={() => {}}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="+ Más"
            size="small"
            onClick={() => {}}
            sx={{ cursor: 'pointer' }}
          />
          <IconButton size="small" onClick={handleViewMenuOpen}>
            <FilterList fontSize="small" />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small">
            <Refresh fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <ContentCopy fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <Edit fontSize="small" />
          </IconButton>
        </Box>

        {/* Barra de búsqueda */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" size="small">
            Exportar
          </Button>
          <Button variant="outlined" size="small">
            Editar columnas
          </Button>
        </Box>
      </Box>

      {/* Contenido principal */}
      {tickets.length === 0 ? (
        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            bgcolor: '#fafafa',
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Hazle seguimiento a los problemas con tus clientes
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Crea tickets y asígnalos a un miembro de tu equipo para que pueda ofrecer la ayuda adecuada en el momento apropiado.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              ¿Quieres obtener más información sobre los tickets?{' '}
              <Link
                href="#"
                sx={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Lee el artículo de la base de conocimientos.
              </Link>
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                bgcolor: '#FF9800',
                '&:hover': {
                  bgcolor: '#F57C00',
                },
              }}
            >
              Crear ticket
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Asunto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Prioridad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Asignado a</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha de creación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>
                      {ticket.Contact ? `${ticket.Contact.firstName} ${ticket.Contact.lastName}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status} 
                        size="small" 
                        sx={{ 
                          bgcolor: ticket.status === 'closed' ? '#e0e0e0' : 
                                  ticket.status === 'resolved' ? '#c8e6c9' :
                                  ticket.status === 'pending' ? '#fff9c4' :
                                  ticket.status === 'open' ? '#bbdefb' : '#f5f5f5',
                          textTransform: 'capitalize'
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.priority} 
                        size="small" 
                        sx={{ 
                          bgcolor: ticket.priority === 'urgent' ? '#ffcdd2' :
                                  ticket.priority === 'high' ? '#ffe0b2' :
                                  ticket.priority === 'medium' ? '#fff9c4' : '#e8f5e9',
                          textTransform: 'capitalize'
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      {ticket.AssignedTo ? `${ticket.AssignedTo.firstName} ${ticket.AssignedTo.lastName}` : '-'}
                    </TableCell>
                    <TableCell>
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('es-ES') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default Tickets;

