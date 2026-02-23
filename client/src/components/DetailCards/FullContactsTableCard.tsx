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
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  TableSortLabel,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  Person,
  Add,
  OpenInNew,
  ContentCopy,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { taxiMonterricoColors } from '../../theme/colors';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface FullContactsTableCardProps {
  title?: string;
  contacts: Contact[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddExisting?: () => void;
  onAddNew?: () => void;
  onRemove?: (contactId: number, contactName?: string) => void;
  showActions?: boolean;
  getContactInitials?: (firstName?: string, lastName?: string) => string;
  onCopyToClipboard?: (text: string) => void;
  sortField?: 'firstName' | 'email' | 'phone';
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'firstName' | 'email' | 'phone') => void;
}

const FullContactsTableCard: React.FC<FullContactsTableCardProps> = ({
  title = 'Contactos',
  contacts,
  searchValue,
  onSearchChange,
  onAddExisting,
  onAddNew,
  onRemove,
  showActions = false,
  getContactInitials,
  onCopyToClipboard,
  sortField,
  sortOrder = 'asc',
  onSort,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredContacts = contacts.filter(
    (contact) =>
      searchValue === '' ||
      `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(searchValue.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const hasAddMenu = onAddExisting && onAddNew;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        boxShadow: 'none',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
        backgroundColor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
        background: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
        px: 2,
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        mt: 2,
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
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <TextField
          size="small"
          placeholder="Buscar contactos"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              width: '320px',
              transition: 'all 0.3s ease',
              '& .MuiOutlinedInput-root': {
                height: '40px',
                fontSize: '0.875rem',
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                '& fieldset': { borderRadius: 2 },
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
        {hasAddMenu ? (
          <Box sx={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                border: 'none',
                boxShadow: 'none',
                color: '#13944C',
                fontSize: '0.9375rem',
                '&:hover': {
                  color: '#13944C',
                  backgroundColor: 'transparent',
                },
                '& .MuiButton-endIcon svg': { color: '#13944C' },
                '&:hover .MuiButton-endIcon svg': { color: '#13944C' },
              }}
            >
              Agregar
            </Button>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0,0,0,0.5)'
                      : '0 4px 20px rgba(0,0,0,0.15)',
                  bgcolor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
                  backgroundColor: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
                  background: theme.palette.mode === 'dark' ? '#1c252e !important' : theme.palette.background.paper,
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  onAddExisting?.();
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.15)'
                        : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Person
                  sx={{
                    mr: 1.5,
                    fontSize: 20,
                    color: taxiMonterricoColors.green,
                  }}
                />
                <Typography variant="body2">
                  Agregar contacto existente
                </Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  onAddNew?.();
                }}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.15)'
                        : 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <Add
                  sx={{
                    mr: 1.5,
                    fontSize: 20,
                    color: taxiMonterricoColors.green,
                  }}
                />
                <Typography variant="body2">Crear nuevo contacto</Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          onAddNew && (
            <Box sx={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={onAddNew}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                border: 'none',
                boxShadow: 'none',
                color: '#13944C',
                fontSize: '0.9375rem',
                '&:hover': {
                  color: '#13944C',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Agregar
            </Button>
            </Box>
          )
        )}
      </Box>

      {/* Tabla de contactos */}
      {contacts.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
          <Person sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            No hay contactos relacionados
          </Typography>
        </Box>
      ) : filteredContacts.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
          <Person sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            No se encontraron contactos
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              width: '100%',
              border: '1px solid',
              borderColor: theme.palette.divider,
              borderRadius: 1.5,
              overflow: 'hidden',
            }}
          >
            <Table
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  fontSize: '0.75rem',
                  borderBottom: '1px solid',
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                },
                '& .MuiTableBody .MuiTableRow:last-child .MuiTableCell-root': {
                  borderBottom: 'none',
                },
                '& .MuiTableHead .MuiTableCell-root': {
                  fontWeight: 600,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(46, 125, 50, 0.18)'
                      : 'rgba(46, 125, 50, 0.08)',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === 'firstName'}
                        direction={sortField === 'firstName' ? sortOrder : 'asc'}
                        onClick={() => onSort('firstName')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color:
                              sortField === 'firstName'
                                ? taxiMonterricoColors.green
                                : 'inherit',
                          },
                        }}
                      >
                        NOMBRE
                      </TableSortLabel>
                    ) : (
                      'NOMBRE'
                    )}
                  </TableCell>
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === 'email'}
                        direction={sortField === 'email' ? sortOrder : 'asc'}
                        onClick={() => onSort('email')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color:
                              sortField === 'email'
                                ? taxiMonterricoColors.green
                                : 'inherit',
                          },
                        }}
                      >
                        CORREO
                      </TableSortLabel>
                    ) : (
                      'CORREO'
                    )}
                  </TableCell>
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === 'phone'}
                        direction={sortField === 'phone' ? sortOrder : 'asc'}
                        onClick={() => onSort('phone')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color:
                              sortField === 'phone'
                                ? taxiMonterricoColors.green
                                : 'inherit',
                          },
                        }}
                      >
                        NÚMERO DE TELÉFONO
                      </TableSortLabel>
                    ) : (
                      'NÚMERO DE TELÉFONO'
                    )}
                  </TableCell>
                  {showActions && (
                    <TableCell align="right" sx={{ width: '80px' }}>
                      ACCIONES
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.04)',
                    },
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        sx={{
                          color: '#13944C',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {contact.firstName} {contact.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#13944C',
                        }}
                      >
                        {contact.email || '--'}
                      </Typography>
                      {contact.email && onCopyToClipboard && (
                        <>
                          <IconButton
                            size="small"
                            sx={{ p: 0.5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${contact.email}`, '_blank');
                            }}
                            title="Enviar correo"
                          >
                            <OpenInNew
                              fontSize="small"
                              sx={{
                                color: '#13944C',
                              }}
                            />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ p: 0.5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyToClipboard(contact.email || '');
                            }}
                            title="Copiar correo"
                          >
                            <ContentCopy
                              fontSize="small"
                              sx={{
                                color: '#13944C',
                              }}
                            />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {contact.phone || '--'}
                    </Typography>
                  </TableCell>
                  {showActions && onRemove && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(contact.id, `${contact.firstName} ${contact.lastName}`);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': {
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.dark,
                          },
                        }}
                        title="Eliminar contacto"
                      >
                        <Trash size={16} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación - Solo se muestra si hay más de 5 contactos */}
        {filteredContacts.length > itemsPerPage && (
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

export default FullContactsTableCard;