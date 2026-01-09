import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Box,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  InputAdornment,
  Chip,
  useTheme,
  IconButton,
} from '@mui/material';
import { Search, Support, Delete, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { taxiMonterricoColors } from '../../theme/colors';

interface Ticket {
  id: number;
  subject: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  description?: string;
}

interface FullTicketsTableCardProps {
  title?: string;
  tickets: Ticket[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd?: () => void;
  onRemove?: (ticketId: number, ticketName?: string) => void;
  showActions?: boolean;
}

const FullTicketsTableCard: React.FC<FullTicketsTableCardProps> = ({
  title = 'Tickets',
  tickets,
  searchValue,
  onSearchChange,
  onAdd,
  onRemove,
  showActions = false,
}) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredTickets = tickets.filter(
    (ticket) =>
      searchValue === '' ||
      ticket.subject?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)',
        bgcolor: theme.palette.background.paper,
        px: 2,
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        mt: 2,
        height: 'fit-content',
        minHeight: 'auto',
        overflow: 'visible',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>

      {/* Cuadro de búsqueda y botón agregar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar tickets"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            width: '250px',
            transition: 'all 0.3s ease',
            '& .MuiOutlinedInput-root': {
              height: '32px',
              fontSize: '0.875rem',
              '&:hover': {
                '& fieldset': {
                  borderColor: taxiMonterricoColors.green,
                },
              },
              '&.Mui-focused': {
                '& fieldset': {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: 2,
                },
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {onAdd && (
          <Button
            size="small"
            variant="outlined"
            onClick={onAdd}
            sx={{
              borderColor: taxiMonterricoColors.green,
              color: taxiMonterricoColors.green,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: taxiMonterricoColors.green,
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Agregar
          </Button>
        )}
      </Box>

      {/* Tabla de tickets */}
      {tickets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay tickets relacionados
          </Typography>
        </Box>
      ) : filteredTickets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron tickets
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              maxHeight: 'none',
              height: 'auto',
              overflow: 'visible',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Asunto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Prioridad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  {showActions && onRemove && (
                    <TableCell sx={{ fontWeight: 600 }}>ACCIONES</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTickets.map((ticket) => (
              <TableRow key={ticket.id} hover>
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Support
                      sx={{
                        fontSize: 20,
                        color: taxiMonterricoColors.green,
                      }}
                    />
                    <Typography variant="body2">
                      {ticket.subject || 'Sin asunto'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {ticket.status ? (
                    <Chip
                      label={ticket.status}
                      size="small"
                      sx={{
                        bgcolor:
                          ticket.status === 'closed'
                            ? taxiMonterricoColors.greenLight + '40'
                            : taxiMonterricoColors.orangeLight + '40',
                        color:
                          ticket.status === 'closed'
                            ? taxiMonterricoColors.greenDark
                            : taxiMonterricoColors.orangeDark,
                      }}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {ticket.priority ? (
                    <Chip
                      label={ticket.priority}
                      size="small"
                      sx={{
                        bgcolor:
                          ticket.priority === 'high'
                            ? '#ef444440'
                            : taxiMonterricoColors.grayLight,
                        color:
                          ticket.priority === 'high'
                            ? '#ef4444'
                            : theme.palette.text.secondary,
                      }}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleDateString('es-ES')
                    : '-'}
                </TableCell>
                {showActions && onRemove && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(ticket.id, ticket.subject);
                      }}
                      sx={{
                        color: theme.palette.error.main,
                        '&:hover': {
                          bgcolor: theme.palette.error.light + '20',
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación - Solo se muestra si hay más de 5 tickets */}
      {filteredTickets.length > itemsPerPage && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mt: 2,
          }}
        >
          <IconButton
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            size="small"
            sx={{
              color:
                currentPage === 1
                  ? theme.palette.text.disabled
                  : taxiMonterricoColors.green,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(46, 125, 50, 0.1)'
                    : 'rgba(46, 125, 50, 0.05)',
              },
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            }}
          >
            <ChevronLeft />
          </IconButton>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              minWidth: '60px',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            {currentPage} / {totalPages}
          </Typography>

          <IconButton
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            size="small"
            sx={{
              color:
                currentPage === totalPages
                  ? theme.palette.text.disabled
                  : taxiMonterricoColors.green,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(46, 125, 50, 0.1)'
                    : 'rgba(46, 125, 50, 0.05)',
              },
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}
    </>
    )}
    </Card>
  );
};

export default FullTicketsTableCard;