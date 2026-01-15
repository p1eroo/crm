import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { taxiMonterricoColors } from "../../theme/colors";
import api from "../../config/api";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newActivity: any) => void;
  // Opcional: IDs de entidades relacionadas para asociar la llamada
  relatedEntityIds?: {
    contactId?: number;
    companyId?: number;
  };
}

const CallModal: React.FC<CallModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
  relatedEntityIds = {},
}) => {
  const theme = useTheme();
  const [callData, setCallData] = useState({
    subject: "",
    description: "",
    duration: "",
  });
  const [saving, setSaving] = useState(false);

  // Resetear estados cuando se abre/cierra el modal
  useEffect(() => {
    if (!open) {
      setCallData({ subject: "", description: "", duration: "" });
    }
  }, [open]);

  const handleSaveCall = useCallback(async () => {
    if (!callData.subject.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Preparar datos de la actividad de llamada
      const activityData: any = {
        subject: callData.subject,
        description: callData.description,
        duration: callData.duration || undefined,
        [`${entityType}Id`]: Number(entityId),
      };

      // Agregar IDs de entidades relacionadas si están disponibles
      if (relatedEntityIds.contactId) {
        activityData.contactId = relatedEntityIds.contactId;
      }
      if (relatedEntityIds.companyId) {
        activityData.companyId = relatedEntityIds.companyId;
      }

      // Crear actividad de llamada
      const response = await api.post("/activities/calls", activityData);
      const newActivity = response.data;

      // Llamar al callback con la actividad creada
      onSave(newActivity);

      // Cerrar modal y resetear estados
      onClose();
      setCallData({ subject: "", description: "", duration: "" });
    } catch (error: any) {
      console.error("Error saving call:", error);
    } finally {
      setSaving(false);
    }
  }, [callData, entityType, entityId, relatedEntityIds, onSave, onClose]);

  // Atajos de teclado para el modal de llamada
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter para guardar desde cualquier lugar
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!saving && callData.subject.trim()) {
          handleSaveCall();
        }
      }
      // Esc para cancelar
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving, callData.subject, handleSaveCall, onClose]);

  if (!open) return null;

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          maxWidth: "95vw",
          height: "52vh",
          maxHeight: "600px",
          backgroundColor:
            theme.palette.mode === "dark"
              ? "#1F2937"
              : theme.palette.background.paper,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          borderRadius: 4,
          zIndex: 1500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes fadeInScale": {
            "0%": {
              opacity: 0,
              transform: "translate(-50%, -50%) scale(0.9)",
            },
            "100%": {
              opacity: 1,
              transform: "translate(-50%, -50%) scale(1)",
            },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "transparent",
            color: theme.palette.text.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: { xs: "64px", md: "72px" },
            px: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: { xs: "1.1rem", md: "1.25rem" },
                letterSpacing: "-0.02em",
              }}
            >
              Llamada
            </Typography>
          </Box>
          <IconButton
            sx={{
              color: theme.palette.text.secondary,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: "rotate(90deg)",
              },
            }}
            size="medium"
            onClick={onClose}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Contenido */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            px: { xs: 3, md: 4 },
            pt: 1,
            pb: { xs: 3, md: 4 },
            overflow: "hidden",
            overflowY: "auto",
            minHeight: 0,
            gap: 3,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.2)",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(0,0,0,0.3)",
              },
              transition: "background-color 0.2s ease",
            },
          }}
        >
          <TextField
            label="Asunto"
            value={callData.subject}
            onChange={(e) =>
              setCallData({ ...callData, subject: e.target.value })
            }
            required
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "& fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: taxiMonterricoColors.green,
                },
                "&.Mui-focused fieldset": {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                "&.Mui-focused": {
                  color: taxiMonterricoColors.green,
                },
              },
            }}
            onKeyDown={(e) => {
              // Enter para guardar (solo en el campo de asunto)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!saving && callData.subject.trim()) {
                  handleSaveCall();
                }
              }
              // Esc para cancelar
              if (e.key === "Escape") {
                onClose();
              }
            }}
          />
          <TextField
            label="Duración (minutos)"
            type="number"
            value={callData.duration}
            onChange={(e) =>
              setCallData({ ...callData, duration: e.target.value })
            }
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "& fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: taxiMonterricoColors.green,
                },
                "&.Mui-focused fieldset": {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                "&.Mui-focused": {
                  color: taxiMonterricoColors.green,
                },
              },
            }}
          />
          <TextField
            label="Notas de la llamada"
            multiline
            rows={8}
            value={callData.description}
            onChange={(e) =>
              setCallData({ ...callData, description: e.target.value })
            }
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "& fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: taxiMonterricoColors.green,
                },
                "&.Mui-focused fieldset": {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 500,
                "&.Mui-focused": {
                  color: taxiMonterricoColors.green,
                },
              },
            }}
          />
        </Box>

        {/* Footer con botones */}
        <Box
          sx={{
            px: 3,
            py: 1,
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
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: theme.palette.action.hover,
                borderColor: theme.palette.text.secondary,
                transform: "translateY(-1px)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveCall}
            variant="contained"
            disabled={saving || !callData.subject.trim()}
            sx={{
              textTransform: "none",
              bgcolor: saving
                ? theme.palette.action.disabledBackground
                : taxiMonterricoColors.green,
              color: "white",
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              boxShadow: saving
                ? "none"
                : `0 4px 12px ${taxiMonterricoColors.green}40`,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: saving
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
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
                boxShadow: "none",
              },
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
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
    </>
  );
};

export default CallModal;
