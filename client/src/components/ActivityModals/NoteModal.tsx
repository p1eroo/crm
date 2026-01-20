import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Popover,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  InputBase,
  CircularProgress,
  DialogActions,
  useTheme,
} from "@mui/material";
import {
  Close,
  ArrowDropDown,
  Search,
  Business,
  Person,
} from "@mui/icons-material";
import RichTextEditor from "../RichTextEditor";
import { taxiMonterricoColors } from "../../theme/colors";
import api from "../../config/api";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newActivity: any) => void;
  // Opcional: entidades relacionadas para mostrar en asociaciones
  relatedEntities?: {
    companies?: any[];
    contacts?: any[];
    deals?: any[];
    tickets?: any[];
  };
}

const NoteModal: React.FC<NoteModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
  relatedEntities = {},
}) => {
  const theme = useTheme();
  const [noteData, setNoteData] = useState({ subject: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [noteAssociatePopoverAnchor, setNoteAssociatePopoverAnchor] =
    useState<HTMLElement | null>(null);
  const [noteSelectedCategory, setNoteSelectedCategory] = useState("empresas");
  const [noteAssociateSearch, setNoteAssociateSearch] = useState("");
  const [noteModalCompanies, setNoteModalCompanies] = useState<any[]>([]);
  const [noteModalContacts, setNoteModalContacts] = useState<any[]>([]);
  const [noteModalDeals, setNoteModalDeals] = useState<any[]>([]);
  const [noteModalTickets, setNoteModalTickets] = useState<any[]>([]);
  const [noteSelectedAssociations, setNoteSelectedAssociations] = useState<{
    [key: string]: number[];
  }>({
    companies: [],
    contacts: [],
    deals: [],
    tickets: [],
  });
  const [noteLoadingAssociations, setNoteLoadingAssociations] = useState(false);
  const [selectedCompaniesForNote, setSelectedCompaniesForNote] = useState<
    number[]
  >([]);
  const [selectedContactsForNote, setSelectedContactsForNote] = useState<
    number[]
  >([]);
  const [selectedAssociationsForNote, setSelectedAssociationsForNote] =
    useState<number[]>([]);
  const [excludedCompaniesForNote, setExcludedCompaniesForNote] = useState<
    number[]
  >([]);
  const [excludedContactsForNote, setExcludedContactsForNote] = useState<
    number[]
  >([]);

  const fetchAssociationsForNote = useCallback(
    async (searchTerm?: string) => {
      setNoteLoadingAssociations(true);
      try {
        if (searchTerm && searchTerm.trim().length > 0) {
          const [companiesRes, contactsRes, dealsRes, ticketsRes] =
            await Promise.all([
              api.get("/companies", {
                params: { limit: 1000, search: searchTerm },
              }),
              api.get("/contacts", {
                params: { limit: 1000, search: searchTerm },
              }),
              api.get("/deals", { params: { limit: 1000, search: searchTerm } }),
              api.get("/tickets", {
                params: { limit: 1000, search: searchTerm },
              }),
            ]);
          setNoteModalCompanies(
            companiesRes.data.companies || companiesRes.data || []
          );
          setNoteModalContacts(
            contactsRes.data.contacts || contactsRes.data || []
          );
          setNoteModalDeals(dealsRes.data.deals || dealsRes.data || []);
          setNoteModalTickets(ticketsRes.data.tickets || ticketsRes.data || []);
        } else {
          // Cargar elementos relacionados desde props o entidades relacionadas
          const associatedItems: {
            companies: any[];
            contacts: any[];
            deals: any[];
            tickets: any[];
          } = {
            companies: relatedEntities.companies || [],
            contacts: relatedEntities.contacts || [],
            deals: relatedEntities.deals || [],
            tickets: relatedEntities.tickets || [],
          };

          setNoteModalCompanies(associatedItems.companies);
          setNoteModalContacts(associatedItems.contacts);
          setNoteModalDeals(associatedItems.deals);
          setNoteModalTickets(associatedItems.tickets);
        }
      } catch (error) {
        console.error("Error fetching associations:", error);
      } finally {
        setNoteLoadingAssociations(false);
      }
    },
    [relatedEntities]
  );

  // Resetear estados cuando se abre/cierra el modal
  useEffect(() => {
    if (!open) {
      setNoteData({ subject: "", description: "" });
      setSelectedCompaniesForNote([]);
      setSelectedContactsForNote([]);
      setSelectedAssociationsForNote([]);
      setExcludedCompaniesForNote([]);
      setExcludedContactsForNote([]);
      setNoteAssociatePopoverAnchor(null);
      setNoteAssociateSearch("");
      setNoteSelectedCategory("empresas");
    } else {
      // Cargar asociaciones disponibles al abrir el modal
      fetchAssociationsForNote();
    }
  }, [open, fetchAssociationsForNote]);

  const handleSaveNote = useCallback(async () => {
    if (!noteData.description.trim()) {
      return;
    }
    setSaving(true);

    try {
      // Obtener empresas seleccionadas
      const companiesToAssociate = selectedCompaniesForNote.filter(
        (companyId) => !excludedCompaniesForNote.includes(companyId)
      );

      // Obtener contactos seleccionados
      const contactsToAssociate = selectedContactsForNote.filter(
        (contactId) => !excludedContactsForNote.includes(contactId)
      );

      // Obtener negocios seleccionados (de selectedAssociationsForNote, donde deals están en el rango 1000-2000)
      const dealsToAssociate = selectedAssociationsForNote
        .filter((id: number) => id > 1000 && id < 2000)
        .map((id) => id - 1000);

      // Obtener tickets seleccionados (de selectedAssociationsForNote, donde tickets están en el rango 2000+)
      const ticketsToAssociate = selectedAssociationsForNote
        .filter((id: number) => id > 2000)
        .map((id) => id - 2000);

      const activityPromises: Promise<any>[] = [];

      // Lógica diferente según el tipo de entidad
      if (entityType === "company") {
        // Si es una empresa, crear una nota por cada empresa seleccionada (o usar la empresa actual)
        const finalCompanyIds =
          companiesToAssociate.length > 0
            ? companiesToAssociate
            : entityId
            ? [Number(entityId)]
            : [];

        if (finalCompanyIds.length === 0) {
          console.error("Error: No hay empresas seleccionadas");
          setSaving(false);
          return;
        }

        for (const companyId of finalCompanyIds) {
          // Obtener información de la empresa para el subject
          let companyName = entityName;
          try {
            const companyResponse = await api.get(`/companies/${companyId}`);
            const companyData = companyResponse.data;
            companyName = companyData.name || companyName;
          } catch (e) {
            console.error(`Error fetching company ${companyId}:`, e);
          }

          // Si hay negocios seleccionados, crear una nota por cada combinación
          if (dealsToAssociate.length > 0) {
            for (const dealId of dealsToAssociate) {
              if (contactsToAssociate.length > 0) {
                // Crear una nota para cada combinación de empresa, negocio y contacto
                for (const contactId of contactsToAssociate) {
                  activityPromises.push(
                    api.post("/activities/notes", {
                      subject: noteData.subject || `Nota para ${companyName}`,
                      description: noteData.description,
                      companyId: companyId,
                      dealId: dealId,
                      contactId: contactId,
                    })
                  );
                }
              } else {
                // Crear nota con empresa y negocio (sin contacto)
                activityPromises.push(
                  api.post("/activities/notes", {
                    subject: noteData.subject || `Nota para ${companyName}`,
                    description: noteData.description,
                    companyId: companyId,
                    dealId: dealId,
                  })
                );
              }
            }
          } else if (contactsToAssociate.length > 0) {
            // Si hay contactos pero no negocios, crear una nota para cada combinación de empresa y contacto
            for (const contactId of contactsToAssociate) {
              activityPromises.push(
                api.post("/activities/notes", {
                  subject: noteData.subject || `Nota para ${companyName}`,
                  description: noteData.description,
                  companyId: companyId,
                  contactId: contactId,
                })
              );
            }
          } else {
            // Crear nota solo con la empresa (sin contacto ni negocio)
            activityPromises.push(
              api.post("/activities/notes", {
                subject: noteData.subject || `Nota para ${companyName}`,
                description: noteData.description,
                companyId: companyId,
              })
            );
          }

          // Si hay tickets seleccionados, crear una nota por cada ticket
          if (ticketsToAssociate.length > 0) {
            for (const ticketId of ticketsToAssociate) {
              activityPromises.push(
                api.post("/activities/notes", {
                  subject: noteData.subject || `Nota para ${companyName}`,
                  description: noteData.description,
                  companyId: companyId,
                  ticketId: ticketId,
                })
              );
            }
          }
        }
      } else if (entityType === "contact") {
        // Si es un contacto, crear una nota por cada contacto seleccionado (o usar el contacto actual)
        const finalContactIds =
          contactsToAssociate.length > 0
            ? contactsToAssociate
            : entityId
            ? [Number(entityId)]
            : [];

        if (finalContactIds.length === 0) {
          console.error("Error: No hay contactos seleccionados");
          setSaving(false);
          return;
        }

        for (const contactId of finalContactIds) {
          // Obtener información del contacto para el subject
          let contactName = entityName;
          try {
            const contactResponse = await api.get(`/contacts/${contactId}`);
            const contactData = contactResponse.data;
            contactName =
              `${contactData.firstName || ""} ${contactData.lastName || ""}`.trim() ||
              contactName;
          } catch (e) {
            console.error(`Error fetching contact ${contactId}:`, e);
          }

          if (companiesToAssociate.length > 0) {
            // Crear una nota para cada combinación de contacto y empresa
            for (const companyId of companiesToAssociate) {
              activityPromises.push(
                api.post("/activities/notes", {
                  subject: noteData.subject || `Nota para ${contactName}`,
                  description: noteData.description,
                  contactId: contactId,
                  companyId: companyId,
                })
              );
            }
          } else {
            // Crear nota solo con el contacto (sin empresa)
            activityPromises.push(
              api.post("/activities/notes", {
                subject: noteData.subject || `Nota para ${contactName}`,
                description: noteData.description,
                contactId: contactId,
              })
            );
          }
        }
      } else {
        // Para deal, task, ticket: crear múltiples notas cuando hay múltiples asociaciones
        const primaryEntityId = Number(entityId);
        
        // Si hay empresas seleccionadas, crear una nota por cada empresa
        if (companiesToAssociate.length > 0) {
          for (const companyId of companiesToAssociate) {
            // Obtener información de la empresa para el subject
            let companyName = entityName;
            try {
              const companyResponse = await api.get(`/companies/${companyId}`);
              const companyData = companyResponse.data;
              companyName = companyData.name || companyName;
            } catch (e) {
              console.error(`Error fetching company ${companyId}:`, e);
            }

            if (contactsToAssociate.length > 0) {
              // Crear una nota para cada combinación de empresa y contacto
              for (const contactId of contactsToAssociate) {
                const activityData: any = {
                  subject: noteData.subject || `Nota para ${companyName}`,
                  description: noteData.description,
                  [`${entityType}Id`]: primaryEntityId,
                  companyId: companyId,
                  contactId: contactId,
                };
                activityPromises.push(api.post("/activities/notes", activityData));
              }
            } else {
              // Crear nota solo con la empresa (sin contacto)
              const activityData: any = {
                subject: noteData.subject || `Nota para ${companyName}`,
                description: noteData.description,
                [`${entityType}Id`]: primaryEntityId,
                companyId: companyId,
              };
              activityPromises.push(api.post("/activities/notes", activityData));
            }
          }
        } else if (contactsToAssociate.length > 0) {
          // Si hay contactos seleccionados pero no empresas, crear una nota por cada contacto
          // Incluir el dealId/taskId/ticketId para mantener el contexto completo (será deduplicado en la UI)
          for (const contactId of contactsToAssociate) {
            // Obtener información del contacto para el subject
            let contactName = entityName;
            try {
              const contactResponse = await api.get(`/contacts/${contactId}`);
              const contactData = contactResponse.data;
              contactName =
                `${contactData.firstName || ""} ${contactData.lastName || ""}`.trim() ||
                contactName;
            } catch (e) {
              console.error(`Error fetching contact ${contactId}:`, e);
            }

            const activityData: any = {
              subject: noteData.subject || `Nota para ${contactName}`,
              description: noteData.description,
              [`${entityType}Id`]: primaryEntityId,
              contactId: contactId,
            };
            activityPromises.push(api.post("/activities/notes", activityData));
          }
        } else {
          // Si no hay asociaciones, crear una nota solo con la entidad principal
          const activityData: any = {
            subject: noteData.subject || `Nota para ${entityName}`,
            description: noteData.description,
            [`${entityType}Id`]: primaryEntityId,
          };
          activityPromises.push(api.post("/activities/notes", activityData));
        }
      }

      // Ejecutar todas las creaciones en paralelo
      const responses = await Promise.all(activityPromises);
      const newActivities = responses.map((res) => res.data);

      // Llamar al callback con todas las actividades creadas
      // Si solo hay una, llamar onSave una vez; si hay múltiples, llamar para cada una
      newActivities.forEach((activity) => {
        onSave(activity);
      });

      // Cerrar modal y resetear estados
      onClose();
      setNoteData({ subject: "", description: "" });
      setSelectedCompaniesForNote([]);
      setSelectedContactsForNote([]);
      setSelectedAssociationsForNote([]);
      setExcludedCompaniesForNote([]);
      setExcludedContactsForNote([]);
    } catch (error: any) {
      console.error("Error saving note:", error);
    } finally {
      setSaving(false);
    }
  }, [
    noteData,
    selectedCompaniesForNote,
    selectedContactsForNote,
    selectedAssociationsForNote,
    excludedCompaniesForNote,
    excludedContactsForNote,
    entityType,
    entityId,
    entityName,
    onSave,
    onClose,
  ]);

  // Atajos de teclado para el modal de nota
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter para guardar desde cualquier lugar
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!saving && noteData.description.trim()) {
          handleSaveNote();
        }
      }
      // Esc para cancelar (solo si no hay un popover abierto)
      if (e.key === "Escape" && !noteAssociatePopoverAnchor) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    open,
    saving,
    noteData.description,
    noteAssociatePopoverAnchor,
    handleSaveNote,
    onClose,
  ]);

  const getEntityTypeLabel = () => {
    const typeMap: { [key: string]: string } = {
      deal: "Negocio",
      company: "Empresa",
      contact: "Contacto",
      task: "Tarea",
      ticket: "Ticket",
    };
    return typeMap[entityType] || "Entidad";
  };

  if (!open) return null;

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95vw", sm: "1100px", md: "1200px" },
          maxWidth: { xs: "95vw", sm: "95vw" },
          height: { xs: "85vh", sm: "80vh" },
          maxHeight: { xs: "85vh", sm: "800px" },
          backgroundColor:
            theme.palette.mode === "dark"
              ? "#1F2937"
              : theme.palette.background.paper,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 60px rgba(0,0,0,0.5)"
              : "0 20px 60px rgba(0,0,0,0.12)",
          zIndex: 1500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 1,
          animation: "fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes fadeInScale": {
            "0%": {
              opacity: 0,
              transform: "translate(-50%, -50%) scale(0.95)",
            },
            "100%": {
              opacity: 1,
              transform: "translate(-50%, -50%) scale(1)",
            },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado personalizado */}
        <Box
          sx={{
            px: 3,
            py: 2,
            backgroundColor: "transparent",
            color: theme.palette.text.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              Nota
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor: theme.palette.error.main + "15",
                  color: theme.palette.error.main,
                },
                transition: "all 0.2s ease",
              }}
              size="small"
              onClick={onClose}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Campo de título/asunto */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.875rem",
              mb: 0.5,
              fontWeight: 400,
            }}
          >
            para: {getEntityTypeLabel()} · {entityName}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
              mb: 1.5,
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: "0.875rem",
                opacity: 0.6,
              }}
            >
              📄
            </Box>
            {(() => {
              const now = new Date();
              const peruDate = new Date(
                now.toLocaleString("en-US", { timeZone: "America/Lima" })
              );
              const months = [
                "enero",
                "febrero",
                "marzo",
                "abril",
                "mayo",
                "junio",
                "julio",
                "agosto",
                "septiembre",
                "octubre",
                "noviembre",
                "diciembre",
              ];
              const day = peruDate.getDate();
              const month = months[peruDate.getMonth()];
              const hours = String(peruDate.getHours()).padStart(2, "0");
              const minutes = String(peruDate.getMinutes()).padStart(2, "0");
              const userName =
                user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "Usuario";
              return `Hoy, ${day} de ${month}, ${hours}:${minutes} • ${userName} •`;
            })()}
          </Typography>
          <TextField
            fullWidth
            placeholder="Título de la nota (opcional)"
            value={noteData.subject}
            onChange={(e) =>
              setNoteData({ ...noteData, subject: e.target.value })
            }
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "transparent",
                "& fieldset": {
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : theme.palette.divider,
                },
                "&.Mui-focused fieldset": {
                  borderColor: taxiMonterricoColors.green,
                },
              },
              "& .MuiInputBase-input": {
                fontSize: "1rem",
                fontWeight: 500,
                py: 1.5,
              },
            }}
            onKeyDown={(e) => {
              // Enter para guardar (solo en el campo de título)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!saving && noteData.description.trim()) {
                  handleSaveNote();
                }
              }
              // Esc para cancelar
              if (e.key === "Escape") {
                onClose();
              }
            }}
          />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Columna Izquierda: Editor */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              p: 3,
              pt: 0,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {/* Editor de texto enriquecido con barra de herramientas integrada */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : theme.palette.divider
                }`,
                borderRadius: 2,
                overflow: "hidden",
                minHeight: 0,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "#1F2937"
                    : theme.palette.background.paper,
                transition: "all 0.2s ease",
              }}
            >
              <RichTextEditor
                value={noteData.description}
                onChange={(value: string) =>
                  setNoteData({ ...noteData, description: value })
                }
                placeholder="Empieza a escribir para dejar una nota..."
              />
            </Box>
          </Box>

          {/* Área de asociados debajo del editor, arriba de la línea */}
          <Box
            sx={{
              px: 3,
              py: 1,
              display: "flex",
              alignItems: "center",
              mt: -2,
              gap: 0,
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            <Box
              data-asociado-con
              onClick={(e) => {
                setNoteAssociatePopoverAnchor(e.currentTarget);
                setNoteSelectedCategory("empresas");
                setNoteAssociateSearch("");
                setNoteSelectedAssociations({
                  companies: selectedCompaniesForNote,
                  contacts: selectedContactsForNote,
                  deals: selectedAssociationsForNote
                    .filter((id: number) => id > 1000 && id < 2000)
                    .map((id) => id - 1000),
                  tickets: selectedAssociationsForNote
                    .filter((id: number) => id > 2000)
                    .map((id) => id - 2000),
                });
                fetchAssociationsForNote();
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  mr: 0.5,
                }}
              >
                Asociado con:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  mr: 0.5,
                }}
              >
                {selectedCompaniesForNote.length +
                  selectedContactsForNote.length +
                  selectedAssociationsForNote.length}{" "}
                registro
                {selectedCompaniesForNote.length +
                  selectedContactsForNote.length +
                  selectedAssociationsForNote.length !==
                1
                  ? "s"
                  : ""}
              </Typography>
              <ArrowDropDown
                sx={{ fontSize: 16, color: theme.palette.text.secondary }}
              />
            </Box>
            {(selectedCompaniesForNote.length > 0 ||
              selectedContactsForNote.length > 0 ||
              selectedAssociationsForNote.length > 0) && (
              <>
                {selectedCompaniesForNote
                  .filter((id) => !excludedCompaniesForNote.includes(id))
                  .map((companyId) => {
                    const company = noteModalCompanies.find(
                      (c: any) => c.id === companyId
                    );
                    return company ? (
                      <Chip
                        key={`company-${companyId}`}
                        label={company.name}
                        size="small"
                        icon={<Business sx={{ fontSize: 14 }} />}
                        sx={{
                          height: "24px",
                          fontSize: "0.7rem",
                          "& .MuiChip-icon": {
                            fontSize: "14px",
                          },
                        }}
                      />
                    ) : null;
                  })}
                {selectedContactsForNote
                  .filter((id) => !excludedContactsForNote.includes(id))
                  .map((contactId) => {
                    const contact = noteModalContacts.find(
                      (c: any) => c.id === contactId
                    );
                    return contact ? (
                      <Chip
                        key={`contact-${contactId}`}
                        label={`${contact.firstName} ${contact.lastName}`}
                        size="small"
                        icon={<Person sx={{ fontSize: 14 }} />}
                        sx={{
                          height: "24px",
                          fontSize: "0.7rem",
                          "& .MuiChip-icon": {
                            fontSize: "14px",
                          },
                        }}
                      />
                    ) : null;
                  })}
                {selectedAssociationsForNote
                  .filter((id: number) => id > 1000 && id < 2000)
                  .map((dealId) => {
                    const dealIdActual = dealId - 1000;
                    const dealItem = noteModalDeals.find(
                      (d: any) => d.id === dealIdActual
                    );
                    return dealItem ? (
                      <Chip
                        key={`deal-${dealId}`}
                        label={dealItem.name}
                        size="small"
                        sx={{
                          height: "24px",
                          fontSize: "0.7rem",
                        }}
                      />
                    ) : null;
                  })}
                {selectedAssociationsForNote
                  .filter((id: number) => id > 2000)
                  .map((ticketId) => {
                    const ticketIdActual = ticketId - 2000;
                    const ticket = noteModalTickets.find(
                      (t: any) => t.id === ticketIdActual
                    );
                    return ticket ? (
                      <Chip
                        key={`ticket-${ticketId}`}
                        label={ticket.subject}
                        size="small"
                        sx={{
                          height: "24px",
                          fontSize: "0.7rem",
                        }}
                      />
                    ) : null;
                  })}
              </>
            )}
          </Box>
        </Box>

        {/* Footer con botones */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : theme.palette.divider
            }`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "#1F2937"
                : theme.palette.background.paper,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Button
            onClick={handleSaveNote}
            variant="contained"
            disabled={saving || !noteData.description.trim()}
            sx={{
              textTransform: "none",
              px: 4,
              py: 1.25,
              backgroundColor: saving
                ? theme.palette.action.disabledBackground
                : taxiMonterricoColors.green,
              color: "white",
              fontWeight: 600,
              borderRadius: 0.5,
              boxShadow: saving
                ? "none"
                : `0 4px 12px ${taxiMonterricoColors.green}40`,
              "&:hover": {
                backgroundColor: saving
                  ? theme.palette.action.disabledBackground
                  : taxiMonterricoColors.greenDark,
                boxShadow: saving
                  ? "none"
                  : `0 6px 16px ${taxiMonterricoColors.green}50`,
                transform: "translateY(-2px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
                boxShadow: "none",
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {saving ? "Guardando..." : "Crear nota"}
          </Button>
        </Box>
      </Box>
      {/* Overlay de fondo cuando la ventana está abierta */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.5)",
          zIndex: 1499,
          animation: "fadeIn 0.3s ease-out",
          "@keyframes fadeIn": {
            "0%": {
              opacity: 0,
            },
            "100%": {
              opacity: 1,
            },
          },
        }}
        onClick={onClose}
      />

      {/* Popover de Asociados para Nota */}
      <Popover
        open={Boolean(noteAssociatePopoverAnchor)}
        anchorEl={noteAssociatePopoverAnchor}
        onClose={() => setNoteAssociatePopoverAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          zIndex: 1600,
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "520px",
            width: "700px",
            maxWidth: "90vw",
            backgroundColor: theme.palette.background.paper,
            mt: -5,
            pb: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            height: "440px",
          }}
        >
          {/* Panel izquierdo - Categorías */}
          <Box
            sx={{
              width: 160,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              overflowY: "auto",
            }}
          >
            <List sx={{ p: 0 }}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === "seleccionados"}
                  onClick={() => setNoteSelectedCategory("seleccionados")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Seleccionados"
                    secondary={
                      Object.values(noteSelectedAssociations).flat().length
                    }
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === "empresas"}
                  onClick={() => setNoteSelectedCategory("empresas")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Empresas"
                    secondary={noteModalCompanies.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === "contactos"}
                  onClick={() => setNoteSelectedCategory("contactos")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Contactos"
                    secondary={noteModalContacts.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === "negocios"}
                  onClick={() => setNoteSelectedCategory("negocios")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Negocios"
                    secondary={noteModalDeals.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={noteSelectedCategory === "tickets"}
                  onClick={() => setNoteSelectedCategory("tickets")}
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.15)",
                      color:
                        theme.palette.mode === "dark" ? "#ffffff" : "inherit",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary="Tickets"
                    secondary={noteModalTickets.length}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{ fontSize: "0.75rem" }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

          {/* Panel derecho - Contenido */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            {/* Búsqueda */}
            <Box
              sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Search
                  sx={{
                    color: theme.palette.text.secondary,
                    mr: 1,
                    fontSize: 20,
                  }}
                />
                <InputBase
                  placeholder="Buscar asociaciones actuales"
                  value={noteAssociateSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNoteAssociateSearch(value);
                    if (value.trim().length > 0) {
                      fetchAssociationsForNote(value);
                    } else {
                      fetchAssociationsForNote();
                    }
                  }}
                  sx={{
                    flex: 1,
                    fontSize: "0.875rem",
                    "& input": {
                      py: 0.5,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Contenido */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
              {noteLoadingAssociations ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {noteSelectedCategory === "empresas" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Empresas
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalCompanies
                          .filter(
                            (company: any) =>
                              !noteAssociateSearch ||
                              company.name
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase()) ||
                              company.domain
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((company: any) => (
                            <ListItem key={company.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.companies || [];
                                  if (current.includes(company.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      companies: current.filter(
                                        (id) => id !== company.id
                                      ),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      companies: [...current, company.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={
                                    noteSelectedAssociations.companies?.includes(
                                      company.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={company.name}
                                  secondary={company.domain}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === "contactos" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Contactos
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalContacts
                          .filter(
                            (contactItem: any) =>
                              !noteAssociateSearch ||
                              `${contactItem.firstName} ${contactItem.lastName}`
                                .toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase()) ||
                              contactItem.email
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((contactItem: any) => (
                            <ListItem key={contactItem.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.contacts || [];
                                  if (current.includes(contactItem.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      contacts: current.filter(
                                        (id) => id !== contactItem.id
                                      ),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      contacts: [...current, contactItem.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={
                                    noteSelectedAssociations.contacts?.includes(
                                      contactItem.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={`${contactItem.firstName} ${contactItem.lastName}`}
                                  secondary={contactItem.email}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === "negocios" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Negocios
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalDeals
                          .filter(
                            (dealItem: any) =>
                              !noteAssociateSearch ||
                              dealItem.name
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((dealItem: any) => (
                            <ListItem key={dealItem.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.deals || [];
                                  if (current.includes(dealItem.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: current.filter(
                                        (id) => id !== dealItem.id
                                      ),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals: [...current, dealItem.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={
                                    noteSelectedAssociations.deals?.includes(
                                      dealItem.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={dealItem.name}
                                  secondary={`${
                                    dealItem.amount
                                      ? `S/ ${dealItem.amount.toLocaleString("es-ES")}`
                                      : ""
                                  } ${dealItem.stage || ""}`}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === "tickets" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Tickets
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {noteModalTickets
                          .filter(
                            (ticket: any) =>
                              !noteAssociateSearch ||
                              ticket.subject
                                ?.toLowerCase()
                                .includes(noteAssociateSearch.toLowerCase())
                          )
                          .map((ticket: any) => (
                            <ListItem key={ticket.id} disablePadding>
                              <ListItemButton
                                sx={{ py: 0.75, px: 1 }}
                                onClick={() => {
                                  const current =
                                    noteSelectedAssociations.tickets || [];
                                  if (current.includes(ticket.id)) {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets: current.filter(
                                        (id) => id !== ticket.id
                                      ),
                                    });
                                  } else {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets: [...current, ticket.id],
                                    });
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={
                                    noteSelectedAssociations.tickets?.includes(
                                      ticket.id
                                    ) || false
                                  }
                                  size="small"
                                  sx={{ p: 0.5, mr: 1 }}
                                />
                                <ListItemText
                                  primary={ticket.subject}
                                  secondary={ticket.description}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                  secondaryTypographyProps={{
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}

                  {noteSelectedCategory === "seleccionados" && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                      >
                        Seleccionados (
                        {Object.values(noteSelectedAssociations).flat().length})
                      </Typography>
                      {Object.values(noteSelectedAssociations).flat().length ===
                      0 ? (
                        <Typography
                          variant="body2"
                          sx={{ color: theme.palette.text.secondary, py: 2 }}
                        >
                          No hay elementos seleccionados
                        </Typography>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {noteSelectedAssociations.companies?.map(
                            (companyId) => {
                              const company = noteModalCompanies.find(
                                (c: any) => c.id === companyId
                              );
                              if (!company) return null;
                              return (
                                <ListItem key={companyId} disablePadding>
                                  <ListItemButton
                                    sx={{ py: 0.75, px: 1 }}
                                    onClick={() => {
                                      setNoteSelectedAssociations({
                                        ...noteSelectedAssociations,
                                        companies:
                                          noteSelectedAssociations.companies.filter(
                                            (id) => id !== companyId
                                          ),
                                      });
                                    }}
                                  >
                                    <Checkbox
                                      checked={true}
                                      size="small"
                                      sx={{ p: 0.5, mr: 1 }}
                                    />
                                    <Business
                                      sx={{
                                        fontSize: 18,
                                        mr: 1,
                                        color: theme.palette.text.secondary,
                                      }}
                                    />
                                    <ListItemText
                                      primary={company.name}
                                      secondary={company.domain}
                                      primaryTypographyProps={{
                                        fontSize: "0.875rem",
                                      }}
                                      secondaryTypographyProps={{
                                        fontSize: "0.75rem",
                                      }}
                                    />
                                  </ListItemButton>
                                </ListItem>
                              );
                            }
                          )}
                          {noteSelectedAssociations.contacts?.map(
                            (contactId) => {
                              const contactItem = noteModalContacts.find(
                                (c: any) => c.id === contactId
                              );
                              if (!contactItem) return null;
                              return (
                                <ListItem key={contactId} disablePadding>
                                  <ListItemButton
                                    sx={{ py: 0.75, px: 1 }}
                                    onClick={() => {
                                      setNoteSelectedAssociations({
                                        ...noteSelectedAssociations,
                                        contacts:
                                          noteSelectedAssociations.contacts.filter(
                                            (id) => id !== contactId
                                          ),
                                      });
                                    }}
                                  >
                                    <Checkbox
                                      checked={true}
                                      size="small"
                                      sx={{ p: 0.5, mr: 1 }}
                                    />
                                    <Person
                                      sx={{
                                        fontSize: 18,
                                        mr: 1,
                                        color: theme.palette.text.secondary,
                                      }}
                                    />
                                    <ListItemText
                                      primary={`${contactItem.firstName} ${contactItem.lastName}`}
                                      secondary={contactItem.email}
                                      primaryTypographyProps={{
                                        fontSize: "0.875rem",
                                      }}
                                      secondaryTypographyProps={{
                                        fontSize: "0.75rem",
                                      }}
                                    />
                                  </ListItemButton>
                                </ListItem>
                              );
                            }
                          )}
                          {noteSelectedAssociations.deals?.map((dealId) => {
                            const dealItem = noteModalDeals.find(
                              (d: any) => d.id === dealId
                            );
                            if (!dealItem) return null;
                            return (
                              <ListItem key={dealId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      deals:
                                        noteSelectedAssociations.deals.filter(
                                          (id) => id !== dealId
                                        ),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <ListItemText
                                    primary={dealItem.name}
                                    secondary={`${
                                      dealItem.amount
                                        ? `S/ ${dealItem.amount.toLocaleString("es-ES")}`
                                        : ""
                                    } ${dealItem.stage || ""}`}
                                    primaryTypographyProps={{
                                      fontSize: "0.875rem",
                                    }}
                                    secondaryTypographyProps={{
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                          {noteSelectedAssociations.tickets?.map((ticketId) => {
                            const ticket = noteModalTickets.find(
                              (t: any) => t.id === ticketId
                            );
                            if (!ticket) return null;
                            return (
                              <ListItem key={ticketId} disablePadding>
                                <ListItemButton
                                  sx={{ py: 0.75, px: 1 }}
                                  onClick={() => {
                                    setNoteSelectedAssociations({
                                      ...noteSelectedAssociations,
                                      tickets:
                                        noteSelectedAssociations.tickets.filter(
                                          (id) => id !== ticketId
                                        ),
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={true}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                  />
                                  <ListItemText
                                    primary={ticket.subject}
                                    secondary={ticket.description}
                                    primaryTypographyProps={{
                                      fontSize: "0.875rem",
                                    }}
                                    secondaryTypographyProps={{
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>
        <DialogActions
          sx={{
            p: 1,
            pt: 1.5,
            pb: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Button
            onClick={() => setNoteAssociatePopoverAnchor(null)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              // Aplicar las selecciones a los estados principales
              setSelectedCompaniesForNote(
                noteSelectedAssociations.companies || []
              );
              setSelectedContactsForNote(
                noteSelectedAssociations.contacts || []
              );
              // Convertir deals y tickets a la estructura esperada
              const dealIds = (noteSelectedAssociations.deals || []).map(
                (id) => 1000 + id
              );
              const ticketIds = (noteSelectedAssociations.tickets || []).map(
                (id) => 2000 + id
              );
              setSelectedAssociationsForNote([...dealIds, ...ticketIds]);

              // Cargar los datos de las asociaciones seleccionadas si no están disponibles
              const missingCompanyIds = (
                noteSelectedAssociations.companies || []
              ).filter((id) => !noteModalCompanies.find((c: any) => c.id === id));
              const missingContactIds = (
                noteSelectedAssociations.contacts || []
              ).filter((id) => !noteModalContacts.find((c: any) => c.id === id));
              const missingDealIds = (noteSelectedAssociations.deals || []).filter(
                (id) => !noteModalDeals.find((d: any) => d.id === id)
              );
              const missingTicketIds = (
                noteSelectedAssociations.tickets || []
              ).filter((id) => !noteModalTickets.find((t: any) => t.id === id));

              // Cargar datos faltantes desde la API
              if (missingCompanyIds.length > 0) {
                try {
                  const companiesPromises = missingCompanyIds.map((id) =>
                    api.get(`/companies/${id}`).catch(() => null)
                  );
                  const companiesResults = await Promise.all(companiesPromises);
                  const newCompanies = companiesResults
                    .filter(Boolean)
                    .map((res: any) => res?.data)
                    .filter(Boolean);
                  setNoteModalCompanies((prev) => [...prev, ...newCompanies]);
                } catch (error) {
                  console.error("Error loading companies:", error);
                }
              }

              if (missingContactIds.length > 0) {
                try {
                  const contactsPromises = missingContactIds.map((id) =>
                    api.get(`/contacts/${id}`).catch(() => null)
                  );
                  const contactsResults = await Promise.all(contactsPromises);
                  const newContacts = contactsResults
                    .filter(Boolean)
                    .map((res: any) => res?.data)
                    .filter(Boolean);
                  setNoteModalContacts((prev) => [...prev, ...newContacts]);
                } catch (error) {
                  console.error("Error loading contacts:", error);
                }
              }

              if (missingDealIds.length > 0) {
                try {
                  const dealsPromises = missingDealIds.map((id) =>
                    api.get(`/deals/${id}`).catch(() => null)
                  );
                  const dealsResults = await Promise.all(dealsPromises);
                  const newDeals = dealsResults
                    .filter(Boolean)
                    .map((res: any) => res?.data)
                    .filter(Boolean);
                  setNoteModalDeals((prev) => [...prev, ...newDeals]);
                } catch (error) {
                  console.error("Error loading deals:", error);
                }
              }

              if (missingTicketIds.length > 0) {
                try {
                  const ticketsPromises = missingTicketIds.map((id) =>
                    api.get(`/tickets/${id}`).catch(() => null)
                  );
                  const ticketsResults = await Promise.all(ticketsPromises);
                  const newTickets = ticketsResults
                    .filter(Boolean)
                    .map((res: any) => res?.data)
                    .filter(Boolean);
                  setNoteModalTickets((prev) => [...prev, ...newTickets]);
                } catch (error) {
                  console.error("Error loading tickets:", error);
                }
              }

              setNoteAssociatePopoverAnchor(null);
            }}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: taxiMonterricoColors.green,
              "&:hover": {
                backgroundColor: taxiMonterricoColors.greenDark,
              },
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Popover>
    </>
  );
};

export default NoteModal;
