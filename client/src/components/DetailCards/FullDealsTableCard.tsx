import React, { useState, useEffect } from "react";
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
  useTheme,
  TableSortLabel,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  AttachMoney,
  Add,
  Delete,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { taxiMonterricoColors } from "../../theme/colors";

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
  const itemsPerPage = 5;

  const filteredDeals = deals.filter(
    (deal) =>
      searchValue === "" ||
      deal.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      deal.stage?.toLowerCase().includes(searchValue.toLowerCase()) ||
      deal.amount?.toString().includes(searchValue)
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeals = filteredDeals.slice(startIndex, endIndex);

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
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.1)",
        bgcolor: theme.palette.background.paper,
        px: 2,
        py: 2,
        display: "flex",
        flexDirection: "column",
        mt: 2,
        border: "none",
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
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar negocios"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            width: "250px",
            transition: "all 0.3s ease",
            "& .MuiOutlinedInput-root": {
              height: "32px",
              fontSize: "0.875rem",
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
          <>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                borderColor: taxiMonterricoColors.green,
                color: taxiMonterricoColors.green,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: taxiMonterricoColors.green,
                  backgroundColor: "rgba(46, 125, 50, 0.08)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.2)",
                },
                "&:active": {
                  transform: "translateY(0)",
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
          </>
        ) : (
          onAdd && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMore />}
              onClick={onAdd}
              sx={{
                borderColor: taxiMonterricoColors.green,
                color: taxiMonterricoColors.green,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: taxiMonterricoColors.green,
                  backgroundColor: "rgba(46, 125, 50, 0.08)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(46, 125, 50, 0.2)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
            >
              Agregar
            </Button>
          )
        )}
      </Box>

      {/* Tabla de negocios */}
      {deals.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay negocios relacionados
          </Typography>
        </Box>
      ) : filteredDeals.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron negocios
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ width: "100%" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "name"}
                        direction={sortField === "name" ? sortOrder : "asc"}
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
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "amount"}
                        direction={sortField === "amount" ? sortOrder : "asc"}
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
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "closeDate"}
                        direction={sortField === "closeDate" ? sortOrder : "asc"}
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
                        FECHA DE CIERRE (GMT-5)
                      </TableSortLabel>
                    ) : (
                      "FECHA DE CIERRE (GMT-5)"
                    )}
                  </TableCell>
                  <TableCell>
                    {onSort ? (
                      <TableSortLabel
                        active={sortField === "stage"}
                        direction={sortField === "stage" ? sortOrder : "asc"}
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
                    <TableCell align="right" sx={{ width: "80px" }}>
                      ACCIONES
                    </TableCell>
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
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: taxiMonterricoColors.green,
                          fontSize: "0.875rem",
                        }}
                      >
                        {getInitials
                          ? getInitials(deal.name || "")
                          : deal.name
                          ? deal.name.split(" ").length >= 2
                            ? `${deal.name.split(" ")[0][0]}${
                                deal.name.split(" ")[1][0]
                              }`.toUpperCase()
                            : deal.name.substring(0, 2).toUpperCase()
                          : "--"}
                      </Avatar>
                      <Typography
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        variant="body2"
                        sx={{ 
                          fontWeight: 500, 
                          color: "#2E7D32",
                          cursor: 'pointer',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {deal.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "#2E7D32" }}>
                      {deal.amount
                        ? typeof deal.amount === "number"
                          ? `S/ ${deal.amount.toLocaleString("es-ES")}`
                          : `S/ ${parseFloat(
                              String(deal.amount)
                            ).toLocaleString("es-ES")}`
                        : "--"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {deal.closeDate
                        ? new Date(deal.closeDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Lima",
                          }) + " GMT-5"
                        : "--"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {deal.stage
                        ? getStageLabel
                          ? getStageLabel(deal.stage)
                          : deal.stage
                        : "--"}
                    </Typography>
                  </TableCell>
                  {showActions && onRemove && (
                    <TableCell align="right">
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
                        <Delete fontSize="small" />
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
    </Card>
  );
};

export default FullDealsTableCard;
