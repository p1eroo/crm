import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Tabs,
  Tab,
  Checkbox,
  InputAdornment,
  CircularProgress,
  useTheme,
  Autocomplete,
} from "@mui/material";
import { Search, Close, ChevronLeft, ChevronRight } from "@mui/icons-material";
import api from "../../config/api";
import { taxiMonterricoColors } from "../../theme/colors";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newDeal?: any) => void; // Callback cuando se crea/agrega un negocio
  defaultCompanyId?: number | string;
  defaultContactId?: number | string;
  excludedDealIds?: number[]; // IDs de negocios ya asociados (para filtrarlos)
  getStageLabel?: (stage: string) => string;
  initialTab?: "create" | "existing"; // Tab inicial
}

const DealModal: React.FC<DealModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
  defaultCompanyId,
  defaultContactId,
  excludedDealIds = [],
  getStageLabel,
  initialTab = "create",
}) => {
  const theme = useTheme();
  const [dealDialogTab, setDealDialogTab] = useState<"create" | "existing">(
    initialTab
  );
  const [existingDealsSearch, setExistingDealsSearch] = useState("");
  const [selectedExistingDeals, setSelectedExistingDeals] = useState<number[]>(
    []
  );
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [loadingAllDeals, setLoadingAllDeals] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  
  // Estados para búsqueda asíncrona de empresas y contactos
  const [companySearch, setCompanySearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [contactOptions, setContactOptions] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [dealFormData, setDealFormData] = useState({
    name: "",
    amount: "",
    stage: "lead",
    closeDate: "",
    priority: "baja" as "baja" | "media" | "alta",
    companyId: defaultCompanyId?.toString() || "",
    contactId: defaultContactId?.toString() || "",
    ownerId: user?.id || null,
  });

  const stageOptions = [
    { value: "lead", label: "Lead" },
    { value: "contacto", label: "Contacto" },
    { value: "reunion_agendada", label: "Reunión Agendada" },
    { value: "reunion_efectiva", label: "Reunión Efectiva" },
    { value: "propuesta_economica", label: "Propuesta Económica" },
    { value: "negociacion", label: "Negociación" },
    { value: "licitacion", label: "Licitación" },
    { value: "licitacion_etapa_final", label: "Licitación Etapa Final" },
    { value: "cierre_ganado", label: "Cierre Ganado" },
    { value: "cierre_perdido", label: "Cierre Perdido" },
    { value: "firma_contrato", label: "Firma de Contrato" },
    { value: "activo", label: "Activo" },
    { value: "cliente_perdido", label: "Cliente Perdido" },
    { value: "lead_inactivo", label: "Lead Inactivo" },
  ];

  const getStageLabelDefault = (stage: string) => {
    const option = stageOptions.find((opt) => opt.value === stage);
    return option ? option.label : stage;
  };

  const stageLabelFn = getStageLabel || getStageLabelDefault;

  // Resetear estados cuando se abre el modal o cambia initialTab
  useEffect(() => {
    if (open) {
      setDealDialogTab(initialTab);
      setExistingDealsSearch("");
      // Inicializar con los deals ya asociados (marcados pero deshabilitados)
      setSelectedExistingDeals([...excludedDealIds]);
      setCurrentPage(1);
      setTotalPages(1);
      setCompanySearch("");
      setContactSearch("");
      setCompanyOptions([]);
      setContactOptions([]);
      setDealFormData({
        name: "",
        amount: "",
        stage: "lead",
        closeDate: "",
        priority: "baja" as "baja" | "media" | "alta",
        companyId: defaultCompanyId?.toString() || "",
        contactId: defaultContactId?.toString() || "",
        ownerId: user?.id || null,
      });
    }
  }, [open, initialTab, defaultCompanyId, defaultContactId, user?.id, excludedDealIds]);

  // Actualizar el tab cuando cambia initialTab mientras el modal está abierto
  useEffect(() => {
    if (open) {
      setDealDialogTab(initialTab);
    }
  }, [initialTab, open]);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    if (existingDealsSearch !== undefined) {
      setCurrentPage(1);
    }
  }, [existingDealsSearch]);

  const fetchAllDeals = useCallback(async (page: number = 1, searchTerm: string = "") => {
    try {
      setLoadingAllDeals(true);
      const params: any = {
        page,
        limit: itemsPerPage, // 5 items por página
      };
      
      // Si hay búsqueda, agregarla al parámetro
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await api.get("/deals", { params });
      const deals = response.data.deals || response.data || [];
      
      // Filtrar los deals excluidos localmente (ya que el servidor no sabe cuáles excluir)
      // Pero ahora NO los excluimos, solo los marcamos como ya asociados
      setAllDeals(deals);
      
      // Usar el totalPages del servidor
      const serverTotalPages = response.data.totalPages || Math.ceil((response.data.total || 0) / itemsPerPage);
      setTotalPages(serverTotalPages);
    } catch (error) {
      console.error("Error fetching deals:", error);
      setAllDeals([]);
      setTotalPages(1);
    } finally {
      setLoadingAllDeals(false);
    }
  }, [itemsPerPage]);

  // Función para buscar empresas de forma asíncrona
  const searchCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCompanyOptions([]);
      return;
    }
    
    try {
      setLoadingCompanies(true);
      const response = await api.get("/companies", {
        params: {
          search: searchTerm,
          limit: 20, // Solo 20 resultados
        },
      });
      setCompanyOptions(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error searching companies:", error);
      setCompanyOptions([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // Función para buscar contactos de forma asíncrona
  const searchContacts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setContactOptions([]);
      return;
    }
    
    try {
      setLoadingContacts(true);
      const response = await api.get("/contacts", {
        params: {
          search: searchTerm,
          limit: 20, // Solo 20 resultados
        },
      });
      setContactOptions(response.data.contacts || response.data || []);
    } catch (error) {
      console.error("Error searching contacts:", error);
      setContactOptions([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Cargar datos cuando se abre el modal y cambia el tab, página o búsqueda
  useEffect(() => {
    if (open && dealDialogTab === "existing") {
      fetchAllDeals(currentPage, existingDealsSearch);
    }
  }, [open, dealDialogTab, currentPage, existingDealsSearch, fetchAllDeals]);

  // Debounce para búsqueda de empresas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (companySearch) {
        searchCompanies(companySearch);
      } else {
        setCompanyOptions([]);
      }
    }, 300); // Espera 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [companySearch, searchCompanies]);

  // Debounce para búsqueda de contactos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contactSearch) {
        searchContacts(contactSearch);
      } else {
        setContactOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [contactSearch, searchContacts]);

  // Cargar empresa por defecto si existe
  useEffect(() => {
    if (open && defaultCompanyId && dealFormData.companyId === defaultCompanyId.toString()) {
      api.get(`/companies/${defaultCompanyId}`)
        .then((response) => {
          if (response.data) {
            setCompanyOptions([response.data]);
          }
        })
        .catch(console.error);
    }
  }, [open, defaultCompanyId, dealFormData.companyId]);

  // Cargar contacto por defecto si existe
  useEffect(() => {
    if (open && defaultContactId && dealFormData.contactId === defaultContactId.toString()) {
      api.get(`/contacts/${defaultContactId}`)
        .then((response) => {
          if (response.data) {
            setContactOptions([response.data]);
          }
        })
        .catch(console.error);
    }
  }, [open, defaultContactId, dealFormData.contactId]);

  const handleCreateDeal = async () => {
    try {
      setSaving(true);
      const dealData = {
        ...dealFormData,
        amount: dealFormData.amount ? parseFloat(dealFormData.amount) : 0,
        companyId: dealFormData.companyId ? parseInt(dealFormData.companyId) : null,
        contactId: dealFormData.contactId ? parseInt(dealFormData.contactId) : null,
        ownerId: dealFormData.ownerId || user?.id,
      };
      const response = await api.post("/deals", dealData);
      
      // Asociar el negocio recién creado a la entidad actual
      if (entityId && response.data.id) {
        const associationEndpoint = getAssociationEndpoint();
        if (associationEndpoint) {
          await api.post(associationEndpoint, {
            dealIds: [response.data.id],
          });
        }
      }
      
      onSave(response.data);
      handleClose();
    } catch (error: any) {
      console.error("Error creating deal:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al crear el negocio";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingDeals = async () => {
    try {
      setSaving(true);
      // Filtrar solo los deals nuevos (no los que ya estaban asociados)
      const newDealIds = selectedExistingDeals.filter(
        (id) => !excludedDealIds.includes(id)
      );
      
      if (entityId && newDealIds.length > 0) {
        const associationEndpoint = getAssociationEndpoint();
        if (associationEndpoint) {
          await api.post(associationEndpoint, {
            dealIds: newDealIds, // Solo enviar los nuevos
          });
        }
        onSave();
        handleClose();
      } else if (newDealIds.length === 0) {
        // Si no hay deals nuevos, solo cerrar el modal
        handleClose();
      }
    } catch (error: any) {
      console.error("Error adding deals:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar los negocios";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getAssociationEndpoint = () => {
    switch (entityType) {
      case "deal":
        return `/deals/${entityId}/deals`;
      case "company":
        return `/companies/${entityId}/deals`;
      case "contact":
        return `/contacts/${entityId}/deals`;
      case "task":
        return `/tasks/${entityId}/deals`;
      case "ticket":
        return `/tickets/${entityId}/deals`;
      default:
        return null;
    }
  };

  const handleClose = () => {
    setDealDialogTab(initialTab);
    setExistingDealsSearch("");
    setSelectedExistingDeals([]);
    setCurrentPage(1);
    setTotalPages(1);
    setCompanySearch("");
    setContactSearch("");
    setCompanyOptions([]);
    setContactOptions([]);
    setDealFormData({
      name: "",
      amount: "",
      stage: "lead",
      closeDate: "",
      priority: "baja" as "baja" | "media" | "alta",
      companyId: defaultCompanyId?.toString() || "",
      contactId: defaultContactId?.toString() || "",
      ownerId: user?.id || null,
    });
    onClose();
  };

  // Ya no filtramos los excludedDealIds, solo los mostramos marcados
  // La búsqueda y paginación se hace del lado del servidor
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: "divider", 
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Tabs
            value={dealDialogTab === "create" ? 0 : 1}
            onChange={(e, newValue) =>
              setDealDialogTab(newValue === 0 ? "create" : "existing")
            }
          >
            <Tab label="Crear nuevo" />
            <Tab label="Agregar existente" />
          </Tabs>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {dealDialogTab === "create" ? (
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <TextField
              label="Nombre"
              value={dealFormData.name}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, name: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              label="Monto"
              type="number"
              value={dealFormData.amount}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, amount: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              select
              label="Etapa"
              value={dealFormData.stage}
              onChange={(e) =>
                setDealFormData({ ...dealFormData, stage: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            >
              {stageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha de Cierre"
              type="date"
              value={dealFormData.closeDate}
              onChange={(e) =>
                setDealFormData({
                  ...dealFormData,
                  closeDate: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              select
              label="Prioridad"
              value={dealFormData.priority}
              onChange={(e) =>
                setDealFormData({
                  ...dealFormData,
                  priority: e.target.value as "baja" | "media" | "alta",
                })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            >
              <MenuItem value="baja">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#20B2AA",
                    }}
                  />
                  Baja
                </Box>
              </MenuItem>
              <MenuItem value="media">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#F59E0B",
                    }}
                  />
                  Media
                </Box>
              </MenuItem>
              <MenuItem value="alta">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#EF4444",
                    }}
                  />
                  Alta
                </Box>
              </MenuItem>
            </TextField>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Autocomplete
                options={companyOptions}
                getOptionLabel={(option: any) => option.name || ""}
                value={
                  companyOptions.find((c: any) => c.id.toString() === dealFormData.companyId) || null
                }
                onChange={(event, newValue: any) => {
                  setDealFormData({
                    ...dealFormData,
                    companyId: newValue ? newValue.id.toString() : "",
                  });
                }}
                onInputChange={(event, newInputValue) => {
                  setCompanySearch(newInputValue);
                }}
                loading={loadingCompanies}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empresa"
                    placeholder="Buscar empresa..."
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                )}
                renderOption={(props, option: any) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.name}
                      </Typography>
                      {option.ruc && (
                        <Typography variant="caption" color="text.secondary">
                          RUC: {option.ruc}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                fullWidth
                noOptionsText={companySearch ? "No se encontraron empresas" : "Escribe para buscar"}
                loadingText="Buscando..."
              />

              <Autocomplete
                options={contactOptions}
                getOptionLabel={(option: any) => 
                  `${option.firstName || ""} ${option.lastName || ""}`.trim() || ""
                }
                value={
                  contactOptions.find((c: any) => c.id.toString() === dealFormData.contactId) || null
                }
                onChange={(event, newValue: any) => {
                  setDealFormData({
                    ...dealFormData,
                    contactId: newValue ? newValue.id.toString() : "",
                  });
                }}
                onInputChange={(event, newInputValue) => {
                  setContactSearch(newInputValue);
                }}
                loading={loadingContacts}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contacto"
                    placeholder="Buscar contacto..."
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                )}
                renderOption={(props, option: any) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.firstName} {option.lastName}
                      </Typography>
                      {option.email && (
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                fullWidth
                noOptionsText={contactSearch ? "No se encontraron contactos" : "Escribe para buscar"}
                loadingText="Buscando..."
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar negocios"
              value={existingDealsSearch}
              onChange={(e) => setExistingDealsSearch(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Box>
              {loadingAllDeals ? (
                <Box
                  sx={{ display: "flex", justifyContent: "center", py: 4 }}
                >
                  <CircularProgress size={24} />
                </Box>
              ) : allDeals.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron negocios
                  </Typography>
                </Box>
              ) : (
                <>
                  {allDeals.map((deal: any) => {
                    const isAlreadyAssociated = excludedDealIds.includes(deal.id);
                    const isSelected = selectedExistingDeals.includes(deal.id);
                    
                    return (
                      <Box
                        key={deal.id}
                        onClick={() => {
                          // Si el deal ya está asociado, no permitir deseleccionarlo
                          if (isAlreadyAssociated) {
                            return; // No hacer nada si ya está asociado
                          }
                          
                          // Para los demás deals, permitir seleccionar/deseleccionar normalmente
                          if (isSelected) {
                            setSelectedExistingDeals(
                              selectedExistingDeals.filter((id) => id !== deal.id)
                            );
                          } else {
                            setSelectedExistingDeals([
                              ...selectedExistingDeals,
                              deal.id,
                            ]);
                          }
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: isAlreadyAssociated ? "not-allowed" : "pointer",
                          bgcolor: isSelected
                            ? theme.palette.mode === "dark"
                              ? "rgba(46, 125, 50, 0.2)"
                              : "rgba(46, 125, 50, 0.1)"
                            : "transparent",
                          border: `1px solid ${
                            isSelected
                              ? taxiMonterricoColors.green
                              : theme.palette.divider
                          }`,
                          opacity: isAlreadyAssociated ? 0.7 : 1,
                          "&:hover": {
                            bgcolor: isAlreadyAssociated
                              ? "transparent"
                              : theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Checkbox
                            checked={isSelected}
                            disabled={isAlreadyAssociated}
                            size="small"
                            sx={{
                              p: 0,
                              color: taxiMonterricoColors.green,
                              "&.Mui-checked": {
                                color: taxiMonterricoColors.green,
                              },
                              "&.Mui-disabled": {
                                color: theme.palette.text.disabled,
                                opacity: 0.6,
                              },
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {deal.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {deal.amount
                                ? `S/ ${deal.amount.toLocaleString("es-ES")}`
                                : "Sin monto"}{" "}
                              • {deal.stage ? stageLabelFn(deal.stage) : "Sin etapa"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  
                  {/* Paginación - Solo se muestra si hay más de 1 página */}
                  {totalPages > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        mt: 2,
                        pb: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`,
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
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5, justifyContent: "flex-start" }}>
        <Button
          onClick={
            dealDialogTab === "create"
              ? handleCreateDeal
              : handleAddExistingDeals
          }
          variant="contained"
          disabled={
            saving ||
            (dealDialogTab === "existing" &&
              selectedExistingDeals.filter((id) => !excludedDealIds.includes(id)).length === 0) ||
            (dealDialogTab === "create" &&
              (!dealFormData.name.trim() || !dealFormData.amount.trim()))
          }
          sx={{
            textTransform: "none",
            fontWeight: 500,
            px: 2,
            py: 0.875,
            fontSize: "0.75rem",
            borderRadius: 0.5,
            bgcolor: taxiMonterricoColors.green,
            color: "white",
            "&:hover": {
              bgcolor: taxiMonterricoColors.green,
              opacity: 0.9,
            },
            "&:disabled": {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }}
        >
          {saving
            ? "Guardando..."
            : dealDialogTab === "create"
            ? "Crear"
            : "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DealModal;
