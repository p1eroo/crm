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
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { Search, Close, ChevronLeft, ChevronRight } from "@mui/icons-material";
import axios from "axios";
import api from "../../config/api";
import { taxiMonterricoColors } from "../../theme/colors";
import { companyLabels } from "../../constants/companyLabels";
import { pageStyles } from "../../theme/styles";
import { FormDrawer } from "../FormDrawer";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newContact?: any) => void;
  excludedContactIds?: number[];
  initialTab?: "create" | "existing";
  defaultCompanyId?: number | string;
  associatedContacts?: any[];
  /** Si es true, al crear nuevo contacto se muestra el FormDrawer (panel lateral) en lugar del diálogo */
  useDrawerForCreate?: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
  excludedContactIds = [],
  initialTab = "create",
  defaultCompanyId,
  associatedContacts = [],
  useDrawerForCreate = false,
}) => {
  const theme = useTheme();
  const [contactDialogTab, setContactDialogTab] = useState<"create" | "existing">(initialTab);
  const [existingContactsSearch, setExistingContactsSearch] = useState("");
  const [selectedExistingContacts, setSelectedExistingContacts] = useState<number[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loadingAllContacts, setLoadingAllContacts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const [contactFormData, setContactFormData] = useState({
    identificationType: "dni" as "dni" | "cee",
    dni: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    province: "",
    department: "",
    jobTitle: "",
    lifecycleStage: "lead",
    ownerId: user?.id || null,
  });
  
  const [loadingDni, setLoadingDni] = useState(false);
  const [dniError, setDniError] = useState("");

  // Al abrir con empresa por defecto, usar el propietario de esa empresa (asesor ve sus contactos)
  useEffect(() => {
    if (open && defaultCompanyId) {
      api.get(`/companies/${defaultCompanyId}`)
        .then((res) => {
          const company = res.data;
          const ownerId = company?.ownerId ?? null;
          if (ownerId != null) {
            setContactFormData((prev) => ({ ...prev, ownerId }));
          }
        })
        .catch(() => {});
    }
  }, [open, defaultCompanyId]);

  const capitalizeInitials = (text: string): string => {
    if (!text) return "";
    return text
      .split(" ")
      .map((word) => {
        if (word.length === 0) return word;
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const getAssociationEndpoint = () => {
    switch (entityType) {
      case "deal":
        return `/deals/${entityId}/contacts`;
      case "company":
        return `/companies/${entityId}/contacts`;
      case "contact":
        return `/contacts/${entityId}/contacts`;
      case "task":
        return `/tasks/${entityId}/contacts`;
      case "ticket":
        return `/tickets/${entityId}/contacts`;
      default:
        return `/deals/${entityId}/contacts`;
    }
  };

  const handleSearchDni = async () => {
    if (!contactFormData.dni || contactFormData.dni.length < 8) {
      setDniError("El DNI debe tener al menos 8 dígitos");
      return;
    }

    setLoadingDni(true);
    setDniError("");

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || "";
      
      if (!factilizaToken) {
        setDniError(
          "Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN"
        );
        setLoadingDni(false);
        return;
      }

      const endpoint = contactFormData.identificationType === "dni"
        ? `https://api.factiliza.com/v1/dni/info/${contactFormData.dni}`
        : `https://api.factiliza.com/v1/cee/info/${contactFormData.dni}`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${factilizaToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const nombres = data.nombres || "";
        const apellidoPaterno = data.apellido_paterno || "";
        const apellidoMaterno = data.apellido_materno || "";
        
        const nombresCapitalizados = capitalizeInitials(nombres);
        const apellidosCapitalizados = capitalizeInitials(
          `${apellidoPaterno} ${apellidoMaterno}`.trim()
        );
        const direccionCapitalizada = capitalizeInitials(data.direccion || "");
        const distritoCapitalizado = capitalizeInitials(data.distrito || "");
        const provinciaCapitalizada = capitalizeInitials(data.provincia || "");
        const departamentoCapitalizado = capitalizeInitials(
          data.departamento || ""
        );

        setContactFormData((prev) => ({
          ...prev,
          firstName: nombresCapitalizados,
          lastName: apellidosCapitalizados,
          address: direccionCapitalizada,
          district: distritoCapitalizado,
          province: provinciaCapitalizada,
          department: departamentoCapitalizado || "Perú",
        }));
      } else {
        setDniError("No se encontró información para este DNI/CEE");
      }
    } catch (error: any) {
      console.error("Error searching DNI:", error);
      setDniError(
        error.response?.data?.message ||
        "Error al buscar información del DNI/CEE"
      );
    } finally {
      setLoadingDni(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      setSaving(true);

      if ((entityType === "deal" || entityType === "company") && !defaultCompanyId) {
        alert(
          entityType === "deal"
            ? "El negocio debe tener al menos una empresa asociada para crear un contacto"
            : "Debe especificar una empresa para crear un contacto"
        );
        setSaving(false);
        return;
      }

      const contactData: any = {
        firstName: contactFormData.firstName,
        lastName: contactFormData.lastName,
        email: contactFormData.email,
        phone: contactFormData.phone,
        address: contactFormData.address,
        city: contactFormData.district,
        state: contactFormData.province,
        country: contactFormData.department,
        jobTitle: contactFormData.jobTitle,
        lifecycleStage: contactFormData.lifecycleStage,
        ownerId: contactFormData.ownerId || user?.id,
      };

      if (contactFormData.identificationType === "cee") {
        contactData.cee = contactFormData.dni
          ? contactFormData.dni.toUpperCase()
          : undefined;
      } else {
        contactData.dni = contactFormData.dni || undefined;
      }

      if (defaultCompanyId) {
        contactData.companyId = defaultCompanyId;
      }

      const response = await api.post("/contacts", contactData);

      if (entityId && response.data.id) {
        await api.post(getAssociationEndpoint(), {
          contactIds: [response.data.id],
        });
      }

      onSave(response.data);
      handleClose();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al crear el contacto";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExistingContacts = async () => {
    try {
      setSaving(true);
      
      const newContactIds = selectedExistingContacts.filter(
        (id) => !excludedContactIds.includes(id)
      );
      
      if (entityId && newContactIds.length > 0) {
        await api.post(getAssociationEndpoint(), {
          contactIds: newContactIds,
        });
        
        onSave();
        handleClose();
      } else if (newContactIds.length === 0) {
        handleClose();
      }
    } catch (error: any) {
      console.error("Error adding contacts:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Error al agregar los contactos";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const fetchAllContacts = useCallback(async (page: number = 1, searchTerm: string = "") => {
    setLoadingAllContacts(true);
    try {
      const params: any = {
        page,
        limit: itemsPerPage,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await api.get("/contacts", { params });
      const contacts = response.data.contacts || response.data || [];
      
      setAllContacts(contacts);
      
      const serverTotalPages = response.data.totalPages || Math.ceil((response.data.total || 0) / itemsPerPage);
      setTotalPages(serverTotalPages);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setAllContacts([]);
      setTotalPages(1);
    } finally {
      setLoadingAllContacts(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    if (existingContactsSearch !== undefined) {
      setCurrentPage(1);
    }
  }, [existingContactsSearch]);

  useEffect(() => {
    if (open && contactDialogTab === "existing") {
      fetchAllContacts(currentPage, existingContactsSearch);
    }
  }, [open, contactDialogTab, currentPage, existingContactsSearch, fetchAllContacts]);

  useEffect(() => {
    if (open && contactDialogTab === "existing") {
      const existingContactIds = excludedContactIds.length > 0 
        ? excludedContactIds 
        : (associatedContacts || []).map((c: any) => c.id);
      setSelectedExistingContacts(existingContactIds);
    }
  }, [open, contactDialogTab, excludedContactIds, associatedContacts]);

  useEffect(() => {
    if (open) {
      setContactDialogTab(initialTab);
      setContactFormData({
        identificationType: "dni",
        dni: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        district: "",
        province: "",
        department: "",
        jobTitle: "",
        lifecycleStage: "lead",
        ownerId: user?.id || null,
      });
      setDniError("");
      setExistingContactsSearch("");
      setCurrentPage(1);
      setTotalPages(1);
    }
  }, [open, initialTab, user?.id]);

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

  const handleClose = () => {
    setContactFormData({
      identificationType: "dni",
      dni: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      district: "",
      province: "",
      department: "",
      jobTitle: "",
      lifecycleStage: "lead",
      ownerId: user?.id || null,
    });
    setSelectedExistingContacts([]);
    setExistingContactsSearch("");
    setDniError("");
    setCurrentPage(1);
    setTotalPages(1);
    setContactDialogTab(initialTab);
    onClose();
  };

  const createFormContent = (
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <RadioGroup
                  row
                  value={contactFormData.identificationType}
                  onChange={(e) =>
                    setContactFormData({
                      ...contactFormData,
                      identificationType: e.target.value as "dni" | "cee",
                    })
                  }
                  sx={{ gap: 2, flexShrink: 0 }}
                >
                  <FormControlLabel
                    value="dni"
                    control={
                      <Radio
                        sx={{
                          color: theme.palette.text.secondary,
                          "&.Mui-checked": {
                            color: taxiMonterricoColors.green,
                          },
                        }}
                      />
                    }
                    label="DNI"
                    sx={{
                      m: 0,
                      px: 2,
                      py: 0.75,
                      height: "48px",
                      border: `2px solid ${
                        contactFormData.identificationType === "dni"
                          ? taxiMonterricoColors.green
                          : theme.palette.divider
                      }`,
                      borderRadius: 2,
                      bgcolor:
                        contactFormData.identificationType === "dni"
                          ? theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}20`
                            : `${taxiMonterricoColors.green}10`
                          : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: taxiMonterricoColors.green,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}15`
                            : `${taxiMonterricoColors.green}08`,
                      },
                      "& .MuiFormControlLabel-label": {
                        color: theme.palette.text.primary,
                        fontWeight:
                          contactFormData.identificationType === "dni"
                            ? 500
                            : 400,
                      },
                    }}
                  />
                  <FormControlLabel
                    value="cee"
                    control={
                      <Radio
                        sx={{
                          color: theme.palette.text.secondary,
                          "&.Mui-checked": {
                            color: taxiMonterricoColors.green,
                          },
                        }}
                      />
                    }
                    label="CEE"
                    sx={{
                      m: 0,
                      px: 2,
                      py: 0.75,
                      height: "48px",
                      border: `2px solid ${
                        contactFormData.identificationType === "cee"
                          ? taxiMonterricoColors.green
                          : theme.palette.divider
                      }`,
                      borderRadius: 2,
                      bgcolor:
                        contactFormData.identificationType === "cee"
                          ? theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}20`
                            : `${taxiMonterricoColors.green}10`
                          : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      "&:hover": {
                        borderColor: taxiMonterricoColors.green,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? `${taxiMonterricoColors.green}15`
                            : `${taxiMonterricoColors.green}08`,
                      },
                      "& .MuiFormControlLabel-label": {
                        color: theme.palette.text.primary,
                        fontWeight:
                          contactFormData.identificationType === "cee"
                            ? 500
                            : 400,
                      },
                    }}
                  />
                </RadioGroup>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label={
                      contactFormData.identificationType === "dni"
                        ? "DNI"
                        : "CEE"
                    }
                    value={contactFormData.dni}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        dni: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                    error={!!dniError}
                    helperText={dniError}
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        minHeight: "48px",
                        height: "48px",
                      },
                      "& .MuiInputBase-input": {
                        py: 1.5,
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={handleSearchDni}
                          disabled={
                            loadingDni ||
                            !contactFormData.dni ||
                            contactFormData.dni.length < 8
                          }
                          sx={{
                            color: taxiMonterricoColors.green,
                            "&:hover": {
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                          }}
                        >
                          {loadingDni ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Search />
                          )}
                        </IconButton>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Nombre"
                value={contactFormData.firstName}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    firstName: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Apellido"
                value={contactFormData.lastName}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    lastName: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={contactFormData.email}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    email: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Teléfono"
                value={contactFormData.phone}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    phone: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>

            <TextField
              label="Dirección"
              value={contactFormData.address}
              onChange={(e) =>
                setContactFormData({
                  ...contactFormData,
                  address: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Distrito"
                value={contactFormData.district}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    district: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                label="Provincia"
                value={contactFormData.province}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    province: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
            </Box>

            <TextField
              label="Departamento"
              value={contactFormData.department}
              onChange={(e) =>
                setContactFormData({
                  ...contactFormData,
                  department: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Cargo"
                value={contactFormData.jobTitle}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    jobTitle: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              />
              <TextField
                select
                label="Etapa del Ciclo de Vida"
                value={contactFormData.lifecycleStage}
                onChange={(e) =>
                  setContactFormData({
                    ...contactFormData,
                    lifecycleStage: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  },
                }}
              >
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
                <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
                <MenuItem value="lead_inactivo">Inactivo</MenuItem>
              </TextField>
            </Box>
          </Box>
  );

  const existingFormContent = (
    <Box sx={{ mt: 1 }}>
      <TextField
        size="small"
        placeholder="Buscar contactos"
        value={existingContactsSearch}
        onChange={(e) => setExistingContactsSearch(e.target.value)}
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Search sx={{ color: taxiMonterricoColors.green }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 1.5,
          },
        }}
      />
      <Box>
        {loadingAllContacts ? (
          <Box
            sx={{ display: "flex", justifyContent: "center", py: 4 }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : allContacts.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No se encontraron contactos
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ maxHeight: 560, overflowY: "auto" }}>
              {allContacts.map((contact: any) => {
                const isAlreadyAssociated = excludedContactIds.length > 0
                  ? excludedContactIds.includes(contact.id)
                  : (associatedContacts || []).some(
                      (c: any) => c.id === contact.id
                    );
                const isSelected = selectedExistingContacts.includes(contact.id);

                return (
                  <Box
                    key={contact.id}
                    onClick={() => {
                      if (isAlreadyAssociated) {
                        return;
                      }

                      if (isSelected) {
                        setSelectedExistingContacts(
                          selectedExistingContacts.filter((id) => id !== contact.id)
                        );
                      } else {
                        setSelectedExistingContacts([
                          ...selectedExistingContacts,
                          contact.id,
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
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {contact.firstName} {contact.lastName}
                          {contact.email && (
                            <Typography component="span" variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 400, ml: 0.5 }}>
                              ({contact.email})
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

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
  );

  if (useDrawerForCreate && open && contactDialogTab === "create") {
    return (
      <FormDrawer
        open={open}
        onClose={handleClose}
        title="Nuevo Contacto"
        onSubmit={handleCreateContact}
        submitLabel={saving ? "Guardando..." : "Crear"}
        submitDisabled={saving}
        variant="panel"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {createFormContent}
        </Box>
      </FormDrawer>
    );
  }

  if (useDrawerForCreate && open && contactDialogTab === "existing") {
    return (
      <FormDrawer
        open={open}
        onClose={handleClose}
        title="Agregar contacto existente"
        onSubmit={handleAddExistingContacts}
        submitLabel={saving ? "Guardando..." : "Agregar"}
        submitDisabled={saving}
        variant="panel"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {existingFormContent}
        </Box>
      </FormDrawer>
    );
  }

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
            value={contactDialogTab === "create" ? 0 : 1}
            onChange={(e, newValue) =>
              setContactDialogTab(newValue === 0 ? "create" : "existing")
            }
          >
            <Tab label={companyLabels.createNew} />
            <Tab label={companyLabels.addExisting} />
          </Tabs>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {contactDialogTab === "create" ? createFormContent : existingFormContent}
      </DialogContent>
      <DialogActions sx={pageStyles.dialogActions}>
        <Button
          onClick={
            contactDialogTab === "create"
              ? handleCreateContact
              : handleAddExistingContacts
          }
          variant="contained"
          disabled={saving}
          sx={pageStyles.saveButton}
        >
          {saving
            ? "Guardando..."
            : contactDialogTab === "create"
            ? "Crear"
            : "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactModal;
