import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import {
  Search,
  ExpandMore,
  AttachMoney,
  Add,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { taxiMonterricoColors } from "../../theme/colors";
import EntityPreviewDrawer from "../EntityPreviewDrawer";
import { formatCurrencyPE } from "../../utils/currencyUtils";

interface Deal {
  id: number;
  name: string;
  amount?: string | number;
  closeDate?: string;
  stage?: string;
}

interface FullDealsTableCardProps {
  title?: string;
  deals: Deal[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd?: () => void; // Para casos simples (ContactDetail, CompanyDetail)
  onAddExisting?: () => void; // Para menú con dos opciones (TaskDetail)
  onAddNew?: () => void; // Para menú con dos opciones (TaskDetail)
  getInitials?: (name: string) => string;
  getStageLabel?: (stage: string) => string;
  sortField?: "name" | "amount" | "closeDate" | "stage";
  sortOrder?: "asc" | "desc";
  onSort?: (field: "name" | "amount" | "closeDate" | "stage") => void;
  onRemove?: (dealId: number, dealName?: string) => void;
  showActions?: boolean;
}

const FullDealsTableCard: React.FC<FullDealsTableCardProps> = ({
  title = "Negocios",
  deals,
  searchValue,
  onSearchChange,
  onAdd,
  onAddExisting,
  onAddNew,
  getInitials,
  getStageLabel,
  sortField,
  sortOrder = "asc",
  onSort,
  onRemove,
  showActions = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDealId, setPreviewDealId] = useState<number | null>(null);
  const [hoveredDealId, setHoveredDealId] = useState<number | null>(null);
  const itemsPerPage = 5;

  const filteredDeals = deals.filter(
    (deal) =>
      searchValue === "" ||
      deal.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      deal.stage?.toLowerCase().includes(searchValue.toLowerCase()) ||
      deal.amount?.toString().includes(searchValue)
  );

  // Ordenar los deals si hay sortField y sortOrder
  const sortedDeals = useMemo(() => {
    if (!sortField || !onSort) {
      return filteredDeals;
    }

    return [...filteredDeals].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "amount":
          aVal = typeof a.amount === "number" ? a.amount : parseFloat(String(a.amount || 0));
          bVal = typeof b.amount === "number" ? b.amount : parseFloat(String(b.amount || 0));
          break;
        case "closeDate":
          aVal = a.closeDate ? new Date(a.closeDate).getTime() : 0;
          bVal = b.closeDate ? new Date(b.closeDate).getTime() : 0;
          break;
        case "stage":
          aVal = (a.stage || "").toLowerCase();
          bVal = (b.stage || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredDeals, sortField, sortOrder, onSort]);

  // Reset to page 1 when search changes or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeals = sortedDeals.slice(startIndex, endIndex);

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
        boxShadow: "none",
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
        backgroundColor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
        background: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
        px: 2,
        py: 2,
        display: "flex",
        flexDirection: "column",
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
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, justifyContent: "space-between" }}>
        <TextField
          size="small"
          placeholder="Buscar negocios"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              width: "320px",
              transition: "all 0.3s ease",
              "& .MuiOutlinedInput-root": {
                height: "40px",
                fontSize: "0.875rem",
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                "& fieldset": { borderRadius: 2 },
                "&:hover": {
                "& fieldset": {
                  borderColor: taxiMonterricoColors.green,
                },
              },
              "&.Mui-focused": {
                "& fieldset": {
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
          <Box sx={{ marginLeft: "auto" }}>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                border: "none",
                boxShadow: "none",
                color: "#13944C",
                fontSize: "0.9375rem",
                "&:hover": {
                  color: "#13944C",
                  backgroundColor: "transparent",
                },
                "& .MuiButton-endIcon svg": { color: "#13944C" },
                "&:hover .MuiButton-endIcon svg": { color: "#13944C" },
              }}
            >
              Agregar
            </Button>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 20px rgba(0,0,0,0.5)"
                      : "0 4px 20px rgba(0,0,0,0.15)",
                  bgcolor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
                  backgroundColor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
                  background: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
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
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(46, 125, 50, 0.15)"
                        : "rgba(46, 125, 50, 0.08)",
                  },
                }}
              >
                <AttachMoney
                  sx={{
                    mr: 1.5,
                    fontSize: 20,
                    color: taxiMonterricoColors.green,
                  }}
                />
                <Typography variant="body2">
                  Agregar negocio existente
                </Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  onAddNew?.();
                }}
                sx={{
                  py: 1.5,
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(46, 125, 50, 0.15)"
                        : "rgba(46, 125, 50, 0.08)",
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
                <Typography variant="body2">Crear nuevo negocio</Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          onAdd && (
            <Box sx={{ marginLeft: "auto" }}>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={onAdd}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                border: "none",
                boxShadow: "none",
                color: "#13944C",
                fontSize: "0.9375rem",
                "&:hover": {
                  color: "#13944C",
                  backgroundColor: "transparent",
                },
                "& .MuiButton-endIcon svg": { color: "#13944C" },
                "&:hover .MuiButton-endIcon svg": { color: "#13944C" },
              }}
            >
              Agregar
            </Button>
            </Box>
          )
        )}
      </Box>

      {/* Tabla de negocios */}
      {deals.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, py: 4 }}>
          <AttachMoney sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            No hay negocios relacionados
          </Typography>
        </Box>
      ) : filteredDeals.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, py: 4 }}>
          <AttachMoney sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            No se encontraron negocios
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              width: "100%",
              border: "1px solid",
              borderColor: theme.palette.divider,
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            <Table
              size="small"
              sx={{
                "& .MuiTableCell-root": {
                  fontSize: "0.75rem",
                  borderBottom: "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                },
                "& .MuiTableBody .MuiTableRow:last-child .MuiTableCell-root": {
                  borderBottom: "none",
                },
                "& .MuiTableHead .MuiTableCell-root": {
                  fontWeight: 600,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(46, 125, 50, 0.18)"
                      : "rgba(46, 125, 50, 0.08)",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "name"}
                        direction={sortField === "name" ? sortOrder : undefined}
                        onClick={() => onSort("name")}
                        sx={{
                          "& .MuiTableSortLabel-icon": {
                            color:
                              sortField === "name"
                                ? taxiMonterricoColors.green
                                : "inherit",
                          },
                        }}
                      >
                        NOMBRE DEL NEGOCIO
                      </TableSortLabel>
                    ) : (
                      "NOMBRE DEL NEGOCIO"
                    )}
                  </TableCell>
                  <TableCell sx={{ pl: 3 }}>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "amount"}
                        direction={sortField === "amount" ? sortOrder : undefined}
                        onClick={() => onSort("amount")}
                        sx={{
                          "& .MuiTableSortLabel-icon": {
                            color:
                              sortField === "amount"
                                ? taxiMonterricoColors.green
                                : "inherit",
                          },
                        }}
                      >
                        VALOR
                      </TableSortLabel>
                    ) : (
                      "VALOR"
                    )}
                  </TableCell>
                  <TableCell sx={{ pl: 2 }}>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "closeDate"}
                        direction={sortField === "closeDate" ? sortOrder : undefined}
                        onClick={() => onSort("closeDate")}
                        sx={{
                          "& .MuiTableSortLabel-icon": {
                            color:
                              sortField === "closeDate"
                                ? taxiMonterricoColors.green
                                : "inherit",
                          },
                        }}
                      >
                        FECHA DE CIERRE
                      </TableSortLabel>
                    ) : (
                      "FECHA DE CIERRE"
                    )}
                  </TableCell>
                  <TableCell sx={{ pl: 2 }}>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "stage"}
                        direction={sortField === "stage" ? sortOrder : undefined}
                        onClick={() => onSort("stage")}
                        sx={{
                          "& .MuiTableSortLabel-icon": {
                            color:
                              sortField === "stage"
                                ? taxiMonterricoColors.green
                                : "inherit",
                          },
                        }}
                      >
                        ETAPA DEL NEGOCIO
                      </TableSortLabel>
                    ) : (
                      "ETAPA DEL NEGOCIO"
                    )}
                  </TableCell>
                  {showActions && (
                    <TableCell align="right" sx={{ width: "110px", minWidth: "110px", pr: 4, pl: 2 }} />
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDeals.map((deal) => (
                <TableRow
                  key={deal.id}
                  sx={{
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell>
                    <Box
                      onMouseEnter={() => setHoveredDealId(deal.id)}
                      onMouseLeave={() => setHoveredDealId(null)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        onClick={() => navigate(`/deals/${deal.id}`)}
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
                        {deal.name}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDealId(deal.id);
                          setPreviewOpen(true);
                        }}
                        sx={{
                          flexShrink: 0,
                          fontSize: "0.6875rem",
                          py: 0.25,
                          px: 0.75,
                          minWidth: "auto",
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.secondary,
                          boxShadow: "none",
                          visibility: hoveredDealId === deal.id ? "visible" : "hidden",
                          "&:hover": {
                            borderColor: theme.palette.divider,
                            bgcolor: "transparent",
                            boxShadow: "none",
                          },
                        }}
                      >
                        Vista previa
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ pl: 3 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem", color: taxiMonterricoColors.green }}>
                      {deal.amount != null
                        ? formatCurrencyPE(typeof deal.amount === "number" ? deal.amount : parseFloat(String(deal.amount)) || 0)
                        : "--"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {deal.closeDate
                        ? new Date(deal.closeDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Lima",
                          })
                        : "--"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {deal.stage
                        ? getStageLabel
                          ? getStageLabel(deal.stage)
                          : deal.stage
                        : "--"}
                    </Typography>
                  </TableCell>
                  {showActions && onRemove && (
                    <TableCell align="right" sx={{ pr: 4, pl: 2 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(deal.id, deal.name);
                        }}
                        sx={{
                          color: theme.palette.error.main,
                          "&:hover": {
                            backgroundColor: theme.palette.error.light,
                            color: theme.palette.error.dark,
                          },
                        }}
                        title="Eliminar negocio"
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

        {/* Paginación - Solo se muestra si hay más de 5 negocios */}
        {filteredDeals.length > itemsPerPage && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(46, 125, 50, 0.1)"
                      : "rgba(46, 125, 50, 0.05)",
                },
                "&.Mui-disabled": {
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
                minWidth: "60px",
                textAlign: "center",
                fontSize: "0.875rem",
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
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(46, 125, 50, 0.1)"
                      : "rgba(46, 125, 50, 0.05)",
                },
                "&.Mui-disabled": {
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
          setPreviewDealId(null);
        }}
        entityType="deal"
        entityId={previewDealId}
      />
    </Card>
  );
};

export default FullDealsTableCard;
