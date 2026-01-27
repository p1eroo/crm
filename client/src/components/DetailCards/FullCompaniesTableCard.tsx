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
  Avatar,
  IconButton,
  Link,
  useTheme,
  TableSortLabel,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  Delete,
  Business,
  Add,
  OpenInNew,
  ContentCopy,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { taxiMonterricoColors } from '../../theme/colors';
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
          placeholder={companyLabels.searchCompanies}
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
        {hasAddMenu ? (
          <>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
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
                  bgcolor: theme.palette.background.paper,
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
          </>
        ) : (
          onAddNew && (
            <Button
              size="small"
              variant="outlined"
              onClick={onAddNew}
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
          )
        )}
      </Box>

      {/* Tabla de empresas */}
      {companies.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay empresas relacionadas
          </Typography>
        </Box>
      ) : sortedCompanies.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron empresas
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ width: '100%' }}>
            <Table size="small">
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
                  <TableCell>
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
                  <TableCell>
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
                    <TableCell align="right">ACCIONES</TableCell>
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
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Avatar
                        src={empresaLogo}
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: empresaLogo
                            ? 'transparent'
                            : taxiMonterricoColors.green,
                          fontSize: '0.875rem',
                          color: empresaLogo ? 'inherit' : 'white',
                        }}
                      >
                        {!empresaLogo &&
                          (getCompanyInitials
                            ? getCompanyInitials(company.name || '')
                            : `${company.name?.[0] || ''}${company.name?.[1] || ''}`)}
                      </Avatar>
                      <Typography
                        onClick={() => navigate(`/companies/${company.id}`)}
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: taxiMonterricoColors.green,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {company.name}
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
                      {company.domain && company.domain !== '--' ? (
                        <>
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
                              color:
                                theme.palette.mode === 'dark'
                                  ? '#64B5F6'
                                  : '#1976d2',
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {company.domain}
                          </Link>
                          {onCopyToClipboard && (
                            <>
                              <IconButton
                                size="small"
                                sx={{ p: 0.5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `http://${company.domain}`,
                                    '_blank'
                                  );
                                }}
                                title="Abrir dominio"
                              >
                                <OpenInNew
                                  fontSize="small"
                                  sx={{
                                    color: taxiMonterricoColors.green,
                                  }}
                                />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ p: 0.5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCopyToClipboard(company.domain || '');
                                }}
                                title="Copiar dominio"
                              >
                                <ContentCopy
                                  fontSize="small"
                                  sx={{
                                    color: taxiMonterricoColors.green,
                                  }}
                                />
                              </IconButton>
                            </>
                          )}
                        </>
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
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {company.phone || '--'}
                    </Typography>
                  </TableCell>
                  {showActions && onRemove && (
                    <TableCell align="right">
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
                        <Delete fontSize="small" />
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
    </Card>
  );
};

export default FullCompaniesTableCard;