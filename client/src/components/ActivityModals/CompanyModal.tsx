import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "@mui/material";
import { Search, Close, ChevronLeft, ChevronRight } from "@mui/icons-material";
import api from "../../config/api";
import axios from "axios";
import { taxiMonterricoColors } from "../../theme/colors";
import { companyLabels } from "../../constants/companyLabels";
import { pageStyles } from "../../theme/styles";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newCompany?: any) => void; // Callback cuando se crea/agrega una empresa
  excludedCompanyIds?: number[]; // IDs de empresas ya asociadas (para marcarlas pero no excluirlas)
  initialTab?: "create" | "existing"; // Tab inicial
}

const CompanyModal: React.FC<CompanyModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
  excludedCompanyIds = [],
  initialTab = "create",
}) => {
  const theme = useTheme();
  const [companyDialogTab, setCompanyDialogTab] = useState<"create" | "existing">(
    initialTab
  );
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [existingCompaniesSearch, setExistingCompaniesSearch] = useState("");
  const [selectedExistingCompanies, setSelectedExistingCompanies] = useState<number[]>(
    []
  );
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loadingAllCompanies, setLoadingAllCompanies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState("");
  const [nameError, setNameError] = useState("");
  const [rucValidationError, setRucValidationError] = useState("");
  const [domainError, setDomainError] = useState("");
  const nameValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rucValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    domain: "",
    linkedin: "",
    companyname: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    ruc: "",
    lifecycleStage: "lead",
    leadSource: "",
    estimatedRevenue: "",
    isRecoveredClient: false,
    ownerId: user?.id || null,
  });

  // Resetear estados cuando se abre el modal
  useEffect(() => {
    if (open) {
      setCompanyDialogTab(initialTab);
      setFormStep(1);
      setExistingCompaniesSearch("");
      // Inicializar con las empresas ya asociadas (marcadas pero deshabilitadas)
      setSelectedExistingCompanies([...excludedCompanyIds]);
      setCurrentPage(1);
      setTotalPages(1);
      setCompanyFormData({
        name: "",
        domain: "",
        linkedin: "",
        companyname: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        country: "",
        ruc: "",
        lifecycleStage: "lead",
        leadSource: "",
        estimatedRevenue: "",
        isRecoveredClient: false,
        ownerId: user?.id || null,
      });
      setRucError("");
      setNameError("");
      setRucValidationError("");
      setDomainError("");
    }
  }, [open, initialTab, user?.id, excludedCompanyIds]);

  // Actualizar el tab cuando cambia initialTab mientras el modal está abierto
  useEffect(() => {
    if (open) {
      setCompanyDialogTab(initialTab);
    }
  }, [initialTab, open]);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    if (existingCompaniesSearch !== undefined) {
      setCurrentPage(1);
    }
  }, [existingCompaniesSearch]);

  const fetchAllCompanies = useCallback(async (page: number = 1, searchTerm: string = "") => {
    try {
      setLoadingAllCompanies(true);
      const params: any = {
        page,
        limit: itemsPerPage, // 5 items por página
      };
      
      // Si hay búsqueda, agregarla al parámetro
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await api.get("/companies", { params });
      const companies = response.data.companies || response.data || [];
      
      setAllCompanies(companies);
      
      // Usar el totalPages del servidor
      const serverTotalPages = response.data.totalPages || Math.ceil((response.data.total || 0) / itemsPerPage);
      setTotalPages(serverTotalPages);
    } catch (error) {
      console.error("Error fetching companies:", error);
      setAllCompanies([]);
      setTotalPages(1);
    } finally {
      setLoadingAllCompanies(false);
    }
  }, [itemsPerPage]);

  // Cargar datos cuando se abre el modal y cambia el tab, página o búsqueda
  useEffect(() => {
    if (open && companyDialogTab === "existing") {
      fetchAllCompanies(currentPage, existingCompaniesSearch);
    }
  }, [open, companyDialogTab, currentPage, existingCompaniesSearch, fetchAllCompanies]);

  // Cargar usuarios cuando se abre el modal (para el campo Propietario)
  useEffect(() => {
    if (open && (user?.role === 'admin' || user?.role === 'jefe_comercial')) {
      const fetchUsers = async () => {
        try {
          const response = await api.get('/users');
          setUsers(response.data || []);
        } catch (error: any) {
          if (error.response?.status !== 403) {
            console.error("Error fetching users:", error);
          }
          setUsers([]);
        }
      };
      fetchUsers();
    }
  }, [open, user?.role]);

  // Validar nombre en tiempo real con debounce
  const validateCompanyName = useCallback(async (name: string) => {
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (!name || name.trim() === '') {
      setNameError('');
      return;
    }
    nameValidationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/companies', {
          params: { search: name.trim(), limit: 50 },
        });
        const companies = response.data.companies || response.data || [];
        const exactMatch = companies.find((c: any) => 
          c.name.toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (exactMatch) {
          setNameError('Ya existe una empresa con este nombre');
        } else {
          setNameError('');
        }
      } catch (error) {
        setNameError('');
      }
    }, 1500);
  }, []);

  // Validar RUC en tiempo real con debounce
  const validateCompanyRuc = useCallback(async (ruc: string) => {
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }
    if (!ruc || ruc.trim() === '' || ruc.length < 11) {
      setRucValidationError('');
      return;
    }
    if (ruc.length === 11) {
      rucValidationTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get('/companies', {
            params: { search: ruc.trim(), limit: 50 },
          });
          const companies = response.data.companies || response.data || [];
          const exactMatch = companies.find((c: any) => c.ruc === ruc.trim());
          if (exactMatch) {
            setRucValidationError('Ya existe una empresa con este RUC');
          } else {
            setRucValidationError('');
          }
        } catch (error) {
          setRucValidationError('');
        }
      }, 1000);
    } else {
      setRucValidationError('');
    }
  }, []);

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
        const updatedFormData = {
          ...companyFormData,
          name: newName,
          companyname: data.tipo_contribuyente || "",
          address: data.direccion_completa || data.direccion || "",
          city: data.distrito || "",
          state: data.provincia || "",
          country: data.departamento || "Perú",
        };
        setCompanyFormData(updatedFormData);

        // Validar ambos campos inmediatamente después de autocompletar
        if (nameValidationTimeoutRef.current) {
          clearTimeout(nameValidationTimeoutRef.current);
        }
        if (rucValidationTimeoutRef.current) {
          clearTimeout(rucValidationTimeoutRef.current);
        }

        // Ejecutar validaciones inmediatamente sin debounce cuando se autocompleta
        const validateNameImmediate = async () => {
          if (!newName || newName.trim() === '') {
            setNameError('');
            return;
          }
          try {
            const response = await api.get('/companies', {
              params: { search: newName.trim(), limit: 50 },
            });
            const companies = response.data.companies || response.data || [];
            const exactMatch = companies.find((c: any) => 
              c.name.toLowerCase().trim() === newName.toLowerCase().trim()
            );
            if (exactMatch) {
              setNameError('Ya existe una empresa con este nombre');
            } else {
              setNameError('');
            }
          } catch (error) {
            setNameError('');
          }
        };

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

        // Ejecutar ambas validaciones inmediatamente en paralelo
        await Promise.all([validateNameImmediate(), validateRucImmediate()]);
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

  const getAssociationEndpoint = () => {
    switch (entityType) {
      case "deal":
        return `/deals/${entityId}/companies`;
      case "company":
        return `/companies/${entityId}/companies`;
      case "contact":
        return `/contacts/${entityId}/companies`;
      case "task":
        return `/tasks/${entityId}/companies`;
      case "ticket":
        return `/tickets/${entityId}/companies`;
      default:
        return null;
    }
  };

  const handleCreateCompany = async () => {
    // Validar nombre requerido
    if (!companyFormData.name || !companyFormData.name.trim()) {
      setNameError('El nombre de la empresa es requerido');
      return;
    }

    // Validar errores de validación antes de guardar
    if (nameError || rucValidationError) {
      return;
    }

    try {
      setSaving(true);
      const submitData: any = {
        ...companyFormData,
      };

      // Manejar ownerId solo si el usuario tiene permisos (admin o jefe_comercial)
      if (user && (user.role === 'admin' || user.role === 'jefe_comercial')) {
        if (companyFormData.ownerId) {
          submitData.ownerId = Number(companyFormData.ownerId);
        } else {
          submitData.ownerId = null;
        }
      } else {
        submitData.ownerId = user?.id || null;
      }

      // Manejar estimatedRevenue
      if (submitData.estimatedRevenue === '' || submitData.estimatedRevenue === null || submitData.estimatedRevenue === undefined) {
        submitData.estimatedRevenue = null;
      } else {
        const parsed = parseFloat(submitData.estimatedRevenue as string);
        submitData.estimatedRevenue = isNaN(parsed) ? null : parsed;
      }

      // Manejar leadSource
      submitData.leadSource = submitData.leadSource === '' ? null : submitData.leadSource;

      // Manejar email
      submitData.email = submitData.email === '' ? null : submitData.email;

      // Asegurarse de que isRecoveredClient sea boolean
      submitData.isRecoveredClient = Boolean(submitData.isRecoveredClient);

      const response = await api.post("/companies", submitData);
      
      // Asociar la empresa recién creada a la entidad actual
      if (entityId && response.data.id) {
        const associationEndpoint = getAssociationEndpoint();
        if (associationEndpoint) {
          await api.post(associationEndpoint, {
            companyIds: [response.data.id],
          });
        }
      }
      
      onSave(response.data);
      handleClose();
    } catch (error: any) {
      console.error("Error creating company:", error);
      
      // Manejar errores del servidor
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        const duplicateField = error.response.data.duplicateField;
        const field = error.response.data.field;
        
        if (field === 'name' || duplicateField === 'name') {
          setNameError(errorMessage);
        } else if (duplicateField === 'ruc') {
          setRucValidationError(errorMessage);
        } else if (duplicateField === 'domain') {
          setDomainError(errorMessage);
        } else {
          alert(errorMessage);
        }
      } else {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Error al crear la empresa";
        alert(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingCompanies = async () => {
    try {
      setSaving(true);
      // Filtrar solo las empresas nuevas (no las que ya estaban asociadas)
      const newCompanyIds = selectedExistingCompanies.filter(
        (id) => !excludedCompanyIds.includes(id)
      );
      
      if (newCompanyIds.length === 0) {
        // Si no hay empresas nuevas, solo cerrar el modal
        handleClose();
        return;
      }

      // Si hay entityId válido, asociar las empresas a la entidad
      if (entityId && entityId !== 0) {
        const associationEndpoint = getAssociationEndpoint();
        if (associationEndpoint) {
          await api.post(associationEndpoint, {
            companyIds: newCompanyIds, // Solo enviar las nuevas
          });
        }
        onSave();
        handleClose();
      } else {
        // Si no hay entityId válido (ej: creando contacto nuevo), pasar la primera empresa seleccionada
        const firstSelectedId = newCompanyIds[0];
        const selectedCompany = allCompanies.find((c: any) => c.id === firstSelectedId);
        if (selectedCompany) {
          onSave(selectedCompany);
        } else {
          // Si no está en allCompanies, buscarla
          try {
            const response = await api.get(`/companies/${firstSelectedId}`);
            onSave(response.data);
          } catch (error) {
            console.error("Error fetching company:", error);
            onSave();
          }
        }
        handleClose();
      }
    } catch (error: any) {
      console.error("Error adding companies:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar las empresas";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCompanyDialogTab(initialTab);
    setExistingCompaniesSearch("");
    setSelectedExistingCompanies([]);
    setCurrentPage(1);
    setTotalPages(1);
    setCompanyFormData({
      name: "",
      domain: "",
      linkedin: "",
      companyname: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "",
      ruc: "",
      lifecycleStage: "lead",
      leadSource: "",
      estimatedRevenue: "",
      isRecoveredClient: false,
      ownerId: user?.id || null,
    });
    setRucError("");
    setNameError("");
    setRucValidationError("");
    setDomainError("");
    
    // Limpiar timeouts pendientes
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }
    
    onClose();
  };

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
      sx={{
        zIndex: 1700, // Mayor que FormDrawer (1600) para que aparezca por encima
      }}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogContent sx={{ 
        pt: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        // Estilos globales para TextField dentro del Dialog
        '& .MuiTextField-root': {
          '& .MuiOutlinedInput-root': {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            '& fieldset': {
              borderColor: theme.palette.divider,
            },
            '&:hover fieldset': {
              borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: `${taxiMonterricoColors.green} !important`,
              borderWidth: '2px',
            },
            '& input': {
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1,
              },
              '&:-webkit-autofill': {
                WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
                WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                transition: 'background-color 5000s ease-in-out 0s',
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
            '&.Mui-focused': {
              color: `${taxiMonterricoColors.green} !important`,
            },
          },
        },
      }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: "divider", 
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Tabs
            value={companyDialogTab === "create" ? 0 : 1}
            onChange={(e, newValue) =>
              setCompanyDialogTab(newValue === 0 ? "create" : "existing")
            }
          >
            <Tab label={companyLabels.createNew} />
            <Tab label={companyLabels.addExisting} />
          </Tabs>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {companyDialogTab === "create" ? (
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            {formStep === 1 ? (
              <>
            {/* RUC */}
            <TextField
              label={companyLabels.ruc}
              value={companyFormData.ruc || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                const limitedValue = value.slice(0, 11);
                setCompanyFormData({
                  ...companyFormData,
                  ruc: limitedValue,
                });
                setRucError("");
                if (limitedValue.length === 11) {
                  validateCompanyRuc(limitedValue);
                  if (companyFormData.name && companyFormData.name.trim() !== '') {
                    validateCompanyName(companyFormData.name);
                  }
                } else {
                  setRucValidationError('');
                  if (companyFormData.name && companyFormData.name.trim() !== '') {
                    validateCompanyName(companyFormData.name);
                  }
                }
              }}
              onKeyPress={(e) => {
                if (
                  e.key === "Enter" &&
                  companyFormData.ruc &&
                  companyFormData.ruc.length === 11
                ) {
                  handleSearchRuc();
                }
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: 11 }}
              error={!!rucError || !!rucValidationError}
              helperText={rucError || rucValidationError}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSearchRuc}
                      disabled={
                        loadingRuc ||
                        !companyFormData.ruc ||
                        companyFormData.ruc.length !== 11
                      }
                      sx={{
                        color: taxiMonterricoColors.green,
                        '&:hover': {
                          bgcolor: `${taxiMonterricoColors.green}15`,
                        },
                        '&.Mui-disabled': {
                          color: theme.palette.text.disabled,
                        },
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
            />
            {/* Razón social */}
            <TextField
              label={companyLabels.legalName}
              value={companyFormData.companyname}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  companyname: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Nombre comercial */}
            <TextField
              label={companyLabels.tradeName}
              value={companyFormData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setCompanyFormData({
                  ...companyFormData,
                  name: newName,
                });
                if (!newName.trim()) {
                  setNameError('');
                } else {
                  validateCompanyName(newName);
                  if (companyFormData.ruc && companyFormData.ruc.length === 11) {
                    validateCompanyRuc(companyFormData.ruc);
                  }
                }
              }}
              error={!!nameError}
              helperText={nameError}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Teléfono */}
            <TextField
              label={companyLabels.phone}
              value={companyFormData.phone}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  phone: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Dirección */}
            <TextField
              label={companyLabels.address}
              value={companyFormData.address}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  address: e.target.value,
                })
              }
              multiline
              rows={2}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Distrito */}
            <TextField
              label={companyLabels.district}
              value={companyFormData.city}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  city: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Provincia */}
            <TextField
              label={companyLabels.province}
              value={companyFormData.state}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  state: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Departamento */}
            <TextField
              label={companyLabels.department}
              value={companyFormData.country}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  country: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
              </>
            ) : (
              <>
                {/* Botón Atrás */}
                <Button
                  onClick={() => setFormStep(1)}
                  startIcon={<ChevronLeft />}
                  sx={{
                    textTransform: "none",
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    alignSelf: "flex-start",
                    mb: 1,
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  Atrás
                </Button>
            {/* Dominio */}
            <TextField
              label="Dominio"
              value={companyFormData.domain}
              onChange={(e) => {
                setCompanyFormData({
                  ...companyFormData,
                  domain: e.target.value,
                });
                setDomainError("");
              }}
              error={!!domainError}
              helperText={domainError}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* LinkedIn */}
            <TextField
              label="LinkedIn"
              value={companyFormData.linkedin}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  linkedin: e.target.value,
                })
              }
              placeholder="https://www.linkedin.com/company/..."
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Correo */}
            <TextField
              label="Correo"
              type="email"
              value={companyFormData.email}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  email: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Origen de lead */}
            <TextField
              select
              label="Origen de lead"
              value={companyFormData.leadSource || ''}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  leadSource: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              <MenuItem value="referido">Referido</MenuItem>
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="entorno">Entorno</MenuItem>
              <MenuItem value="feria">Feria</MenuItem>
              <MenuItem value="masivo">Masivo</MenuItem>
            </TextField>
            {/* Etapa del Ciclo de Vida */}
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={companyFormData.lifecycleStage}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  lifecycleStage: e.target.value,
                })
              }
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            >
              <MenuItem value="lead_inactivo">Lead Inactivo</MenuItem>
              <MenuItem value="cliente_perdido">Cliente perdido</MenuItem>
              <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="contacto">Contacto</MenuItem>
              <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
              <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
              <MenuItem value="propuesta_economica">
                Propuesta Económica
              </MenuItem>
              <MenuItem value="negociacion">Negociación</MenuItem>
              <MenuItem value="licitacion">Licitación</MenuItem>
              <MenuItem value="licitacion_etapa_final">
                Licitación Etapa Final
              </MenuItem>
              <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
              <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
              <MenuItem value="activo">Activo</MenuItem>
            </TextField>
            {/* Facturación */}
            <TextField
              fullWidth
              type="number"
              label="Facturación"
              value={companyFormData.estimatedRevenue}
              onChange={(e) =>
                setCompanyFormData({
                  ...companyFormData,
                  estimatedRevenue: e.target.value,
                })
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">S/</InputAdornment>,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
            {/* Propietario - Solo visible para jefe_comercial y admin */}
            {(user?.role === 'admin' || user?.role === 'jefe_comercial') && (
              <TextField
                select
                label="Propietario"
                value={companyFormData.ownerId || ''}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    ownerId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {users
                  .filter((userOption) => userOption.role === 'user')
                  .map((userOption) => (
                    <MenuItem key={userOption.id} value={userOption.id.toString()}>
                      {userOption.firstName} {userOption.lastName}
                    </MenuItem>
                  ))}
              </TextField>
            )}
            {/* Cliente Recuperado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={companyFormData.isRecoveredClient}
                onChange={(e) =>
                  setCompanyFormData({
                    ...companyFormData,
                    isRecoveredClient: e.target.checked,
                  })
                }
                sx={{
                  color: taxiMonterricoColors.green,
                  '&.Mui-checked': {
                    color: taxiMonterricoColors.green,
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                Cliente Recuperado
              </Typography>
            </Box>
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <TextField
              size="small"
              placeholder={companyLabels.searchCompanies}
              value={existingCompaniesSearch}
              onChange={(e) => setExistingCompaniesSearch(e.target.value)}
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
            <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
              {loadingAllCompanies ? (
                <Box
                  sx={{ display: "flex", justifyContent: "center", py: 4 }}
                >
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  {allCompanies.map((company: any) => {
                    // Verificar si la empresa ya está asociada
                    const isAlreadyAdded = excludedCompanyIds.includes(company.id);
                    const isSelected = selectedExistingCompanies.includes(company.id);
                    
                    return (
                      <Box
                        key={company.id}
                        onClick={() => {
                          // Si la empresa ya está asociada, no permitir deseleccionarla
                          if (isAlreadyAdded) {
                            return; // No hacer nada si ya está asociada
                          }
                          
                          // Para las demás empresas, permitir seleccionar/deseleccionar normalmente
                          if (isSelected) {
                            setSelectedExistingCompanies(
                              selectedExistingCompanies.filter(
                                (id) => id !== company.id
                              )
                            );
                          } else {
                            setSelectedExistingCompanies([
                              ...selectedExistingCompanies,
                              company.id,
                            ]);
                          }
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          cursor: isAlreadyAdded ? "not-allowed" : "pointer",
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
                          opacity: isAlreadyAdded ? 0.7 : 1,
                          "&:hover": {
                            bgcolor: isAlreadyAdded
                              ? "transparent"
                              : theme.palette.action.hover,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Checkbox
                            checked={isSelected}
                            disabled={isAlreadyAdded}
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
                                {company.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {company.ruc || company.companyname}
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
      <DialogActions sx={pageStyles.dialogActions}>
        {companyDialogTab === "create" && formStep === 1 ? (
          <Button
            onClick={() => setFormStep(2)}
            variant="contained"
            disabled={!companyFormData.name.trim() || !!nameError || !!rucValidationError}
            endIcon={<ChevronRight />}
            sx={pageStyles.saveButton}
          >
            {companyLabels.next}
          </Button>
        ) : (
          <Button
            onClick={
              companyDialogTab === "create"
                ? handleCreateCompany
                : handleAddExistingCompanies
            }
            variant="contained"
            disabled={
              saving ||
              (companyDialogTab === "existing" &&
                selectedExistingCompanies.filter((id) => !excludedCompanyIds.includes(id)).length === 0) ||
              (companyDialogTab === "create" && (!companyFormData.name.trim() || !!nameError || !!rucValidationError || !!domainError))
            }
            sx={pageStyles.saveButton}
          >
            {saving
              ? companyLabels.saving
              : companyDialogTab === "create"
              ? companyLabels.create
              : companyLabels.add}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CompanyModal;
