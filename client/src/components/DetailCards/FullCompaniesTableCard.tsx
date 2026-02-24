import React, { useState, useEffect, useMemo } from 'react';
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
  Link,
  useTheme,
  TableSortLabel,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  Business,
  Add,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { taxiMonterricoColors } from '../../theme/colors';
import EntityPreviewDrawer from '../EntityPreviewDrawer';
import { companyLabels } from '../../constants/companyLabels';

interface Company {
  id: number;
  name: string;
  domain?: string;
  phone?: string;
  website?: string;
  companyname?: string;
}

interface FullCompaniesTableCardProps {
  title?: string;
  companies: Company[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddExisting?: () => void;
  onAddNew?: () => void;
  onRemove?: (companyId: number, companyName?: string) => void;
  showActions?: boolean;
  empresaLogo?: string;
  getCompanyInitials?: (name: string) => string;
  onCopyToClipboard?: (text: string) => void;
  sortField?: 'name' | 'domain' | 'phone';
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'domain' | 'phone') => void;
}

const FullCompaniesTableCard: React.FC<FullCompaniesTableCardProps> = ({
  title = 'Empresas',
  companies,
  searchValue,
  onSearchChange,
  onAddExisting,
  onAddNew,
  onRemove,
  showActions = false,
  empresaLogo,
  getCompanyInitials,
  onCopyToClipboard,
  sortField,
  sortOrder = 'asc',
  onSort,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCompanyId, setPreviewCompanyId] = useState<number | null>(null);
  const [hoveredCompanyId, setHoveredCompanyId] = useState<number | null>(null);
  const itemsPerPage = 5;

  const filteredCompanies = companies.filter(
    (company) =>
      searchValue === '' ||
      company.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      company.domain?.toLowerCase().includes(searchValue.toLowerCase()) ||
      company.phone?.toLowerCase().includes(searchValue.toLowerCase()) ||
      company.website?.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Ordenar las empresas si hay sortField y onSort
  const sortedCompanies = useMemo(() => {
    if (!sortField || !onSort) {
      return filteredCompanies;
    }

    return [...filteredCompanies].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'domain':
          aVal = (a.domain || '').toLowerCase();
          bVal = (b.domain || '').toLowerCase();
          break;
        case 'phone':
          aVal = (a.phone || '').toLowerCase();
          bVal = (b.phone || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCompanies, sortField, sortOrder, onSort]);

  // Reset to page 1 when search changes or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = sortedCompanies.slice(startIndex, endIndex);

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
          placeholder={companyLabels.searchCompanies}
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
                <Business
                  sx={{
                    mr: 1.5,
                    fontSize: 20,
                    color: taxiMonterricoColors.green,
                  }}
                />
                <Typography variant="body2">
                  Agregar empresa existente
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
                <Typography variant="body2">{companyLabels.createNewCompany}</Typography>
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

      {/* Tabla de empresas */}
      {companies.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
          <Business sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            No hay empresas relacionadas
          </Typography>
        </Box>
      ) : sortedCompanies.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
          <Business sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            No se encontraron empresas
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
                        active={sortField === 'name'}
                        direction={sortField === 'name' ? sortOrder : undefined}
                        onClick={() => onSort('name')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color:
                              sortField === 'name'
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
                  <TableCell sx={{ pl: 3 }}>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === 'domain'}
                        direction={sortField === 'domain' ? sortOrder : undefined}
                        onClick={() => onSort('domain')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color:
                              sortField === 'domain'
                                ? taxiMonterricoColors.green
                                : 'inherit',
                          },
                        }}
                      >
                        DOMINIO
                      </TableSortLabel>
                    ) : (
                      'DOMINIO'
                    )}
                  </TableCell>
                  <TableCell sx={{ pl: 2 }}>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === 'phone'}
                        direction={sortField === 'phone' ? sortOrder : undefined}
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
                    <TableCell align="right" sx={{ width: '110px', minWidth: '110px', pr: 4, pl: 2 }} />
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCompanies.map((company) => (
                <TableRow
                  key={company.id}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>
                    <Box
                      onMouseEnter={() => setHoveredCompanyId(company.id)}
                      onMouseLeave={() => setHoveredCompanyId(null)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography
                        onClick={() => navigate(`/companies/${company.id}`)}
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: taxiMonterricoColors.green,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {company.name}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCompanyId(company.id);
                          setPreviewOpen(true);
                        }}
                        sx={{
                          flexShrink: 0,
                          fontSize: '0.6875rem',
                          py: 0.25,
                          px: 0.75,
                          minWidth: 'auto',
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.secondary,
                          boxShadow: 'none',
                          visibility: hoveredCompanyId === company.id ? 'visible' : 'hidden',
                          '&:hover': {
                            borderColor: theme.palette.divider,
                            bgcolor: 'transparent',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        Vista previa
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ pl: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {company.domain && company.domain !== '--' ? (
                        <Link
                          onClick={(e) => {
                            e.stopPropagation();
                            if (company.domain && company.domain !== '--') {
                              const domainUrl = company.domain.startsWith('http')
                                ? company.domain
                                : `https://${company.domain}`;
                              window.open(domainUrl, '_blank');
                            }
                          }}
                          sx={{
                            color: taxiMonterricoColors.green,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {company.domain}
                        </Link>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                            color: taxiMonterricoColors.green,
                          }}
                        >
                          {company.domain || company.website || '--'}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {company.phone || '--'}
                    </Typography>
                  </TableCell>
                  {showActions && onRemove && (
                    <TableCell align="right" sx={{ pr: 4, pl: 2 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(company.id, company.name);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': {
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.dark,
                          },
                        }}
                        title="Eliminar empresa"
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

        {/* Paginación - Solo se muestra si hay más de 5 empresas */}
        {sortedCompanies.length > itemsPerPage && (
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

      <EntityPreviewDrawer
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewCompanyId(null);
        }}
        entityType="company"
        entityId={previewCompanyId}
      />
    </Card>
  );
};

export default FullCompaniesTableCard;