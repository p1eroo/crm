import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { Search, Close, Business } from "@mui/icons-material";
import api from "../config/api";
import axios from "axios";
import { taxiMonterricoColors } from "../theme/colors";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface ContactCompanyModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSelect: (company: any) => void; // Callback cuando se selecciona una empresa
  onCreate: (company: any) => void; // Callback cuando se crea una empresa
  mode: "select" | "create"; // Modo del modal
}

const ContactCompanyModal: React.FC<ContactCompanyModalProps> = ({
  open,
  onClose,
  user,
  onSelect,
  onCreate,
  mode = "select",
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState("");
  const [nameError, setNameError] = useState("");
  const [rucValidationError, setRucValidationError] = useState("");
  const rucValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    domain: "",
    companyname: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    ruc: "",
    lifecycleStage: "lead",
    ownerId: user?.id || null,
  });

  // Resetear estados cuando se abre el modal
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setCompanyFormData({
        name: "",
        domain: "",
        companyname: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        ruc: "",
        lifecycleStage: "lead",
        ownerId: user?.id || null,
      });
      setRucError("");
      setNameError("");
      setRucValidationError("");
      setCompanies([]);
    }
  }, [open, user?.id]);

  // Buscar empresas cuando cambia el término de búsqueda
  useEffect(() => {
    if (open && mode === "select" && searchTerm.trim()) {
      const timeout = setTimeout(() => {
        fetchCompanies(searchTerm);
      }, 300);
      return () => clearTimeout(timeout);
    } else if (open && mode === "select" && !searchTerm.trim()) {
      setCompanies([]);
    }
  }, [searchTerm, open, mode]);

  const fetchCompanies = async (search: string) => {
    try {
      setLoading(true);
      const response = await api.get("/companies", {
        params: { search: search.trim(), limit: 10 },
      });
      setCompanies(response.data.companies || response.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRuc = async () => {
    if (!companyFormData.ruc || companyFormData.ruc.length < 11) {
      setRucError("El RUC debe tener 11 dígitos");
      return;
    }

    setLoadingRuc(true);
    setRucError("");

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";

      if (!factilizaToken) {
        setRucError(
          "Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN"
        );
        setLoadingRuc(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/ruc/info/${companyFormData.ruc}`,
        {
          headers: {
            Authorization: `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const currentRuc = companyFormData.ruc;
        const newName = data.nombre_o_razon_social || "";

        // Actualizar el formulario con los datos obtenidos
        setCompanyFormData({
          ...companyFormData,
          name: newName,
          companyname: data.tipo_contribuyente || "",
          address: data.direccion_completa || data.direccion || "",
          city: data.distrito || "",
          state: data.provincia || "",
          country: data.departamento || "Perú",
        });

        // Validar RUC inmediatamente
        if (rucValidationTimeoutRef.current) {
          clearTimeout(rucValidationTimeoutRef.current);
        }

        const validateRucImmediate = async () => {
          if (!currentRuc || currentRuc.trim() === '' || currentRuc.length < 11) {
            setRucValidationError('');
            return;
          }
          try {
            const response = await api.get('/companies', {
              params: { search: currentRuc.trim(), limit: 50 },
            });
            const companies = response.data.companies || response.data || [];
            const exactMatch = companies.find((c: any) => c.ruc === currentRuc.trim());
            if (exactMatch) {
              setRucValidationError('Ya existe una empresa con este RUC');
            } else {
              setRucValidationError('');
            }
          } catch (error) {
            setRucValidationError('');
          }
        };

        await validateRucImmediate();
      } else {
        setRucError("No se encontró información para este RUC");
      }
    } catch (error: any) {
      console.error("Error al buscar RUC:", error);
      if (error.response?.status === 400) {
        setRucError("RUC no válido o no encontrado");
      } else if (error.response?.status === 401) {
        setRucError("Error de autenticación con la API");
      } else {
        setRucError("Error al buscar RUC. Por favor, intente nuevamente");
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!companyFormData.name.trim()) {
      setNameError("El nombre de la empresa es requerido");
      return;
    }

    if (nameError || rucValidationError) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.post("/companies", {
        ...companyFormData,
        ownerId: companyFormData.ownerId || user?.id || null,
      });

      onCreate(response.data);
      handleClose();
    } catch (error: any) {
      console.error("Error creating company:", error);
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        const duplicateField = error.response.data.duplicateField;
        const field = error.response.data.field;
        
        if (field === 'name' || duplicateField === 'name') {
          setNameError(errorMessage);
        } else if (duplicateField === 'ruc') {
          setRucValidationError(errorMessage);
        } else {
          alert(errorMessage);
        }
      } else {
        alert(error.response?.data?.error || "Error al crear la empresa");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    onSelect(company);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: 1700,
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#111a2c',
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {mode === "select" ? "Seleccionar Empresa" : "Crear Nueva Empresa"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {mode === "select" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : companies.length > 0 ? (
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {companies.map((company) => (
                  <ListItem key={company.id} disablePadding>
                    <ListItemButton 
                      onClick={() => handleSelectCompany(company)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        "&:hover": {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Business sx={{ color: taxiMonterricoColors.green }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={company.name}
                        secondary={company.domain || company.ruc || ""}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : searchTerm.trim() ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                No se encontraron empresas
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                Escribe para buscar empresas
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* RUC */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="RUC"
                value={companyFormData.ruc}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const limitedValue = value.slice(0, 11);
                  setCompanyFormData({ ...companyFormData, ruc: limitedValue });
                  setRucError("");
                }}
                error={!!rucError}
                helperText={rucError}
                inputProps={{ maxLength: 11 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSearchRuc}
                        disabled={
                          loadingRuc ||
                          !companyFormData.ruc ||
                          companyFormData.ruc.length < 11
                        }
                        sx={{
                          color: taxiMonterricoColors.green,
                        }}
                      >
                        {loadingRuc ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Search />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>

            {/* Razón social */}
            <TextField
              label="Razón social"
              value={companyFormData.name}
              onChange={(e) => {
                setCompanyFormData({ ...companyFormData, name: e.target.value });
                setNameError("");
              }}
              error={!!nameError}
              helperText={nameError}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            {/* Nombre comercial */}
            <TextField
              label="Nombre comercial"
              value={companyFormData.companyname}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, companyname: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            {/* Teléfono */}
            <TextField
              label="Teléfono"
              value={companyFormData.phone}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, phone: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            {/* Dirección */}
            <TextField
              label="Dirección"
              value={companyFormData.address}
              onChange={(e) =>
                setCompanyFormData({ ...companyFormData, address: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            {/* Distrito, Provincia, Departamento */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Distrito"
                value={companyFormData.city}
                onChange={(e) =>
                  setCompanyFormData({ ...companyFormData, city: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Provincia"
                value={companyFormData.state}
                onChange={(e) =>
                  setCompanyFormData({ ...companyFormData, state: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Departamento"
                value={companyFormData.country}
                onChange={(e) =>
                  setCompanyFormData({ ...companyFormData, country: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>

            {rucValidationError && (
              <Typography variant="caption" color="error" sx={{ mt: -1 }}>
                {rucValidationError}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      {mode === "create" && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            sx={{ 
              color: theme.palette.text.secondary,
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCompany}
            variant="contained"
            disabled={saving || !companyFormData.name.trim() || !!nameError || !!rucValidationError}
            sx={{
              bgcolor: taxiMonterricoColors.green,
              textTransform: "none",
              "&:hover": { 
                bgcolor: taxiMonterricoColors.green, 
                opacity: 0.9 
              },
              "&:disabled": {
                bgcolor: theme.palette.action.disabledBackground,
              },
            }}
          >
            {saving ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ContactCompanyModal;
