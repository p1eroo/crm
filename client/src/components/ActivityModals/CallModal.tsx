import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  Popover,
  DialogActions,
} from "@mui/material";
import {
  Close,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { taxiMonterricoColors } from "../../theme/colors";
import { pageStyles } from "../../theme/styles";
import { formatDatePeru } from "../../utils/dateUtils";
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
  // Opcional: valores iniciales al completar tarea desde Tasks
  initialSubject?: string;
  initialDate?: string;
  initialTime?: string;
  initialDescription?: string;
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
  initialSubject,
  initialDate,
  initialTime,
  initialDescription,
}) => {
  const theme = useTheme();
  const [callData, setCallData] = useState({
    subject: "",
    description: "",
    duration: "",
    date: "",
    time: "",
  });
  const [saving, setSaving] = useState(false);
  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Resetear estados cuando se abre/cierra el modal; pre-llenar si hay valores iniciales
  useEffect(() => {
    if (!open) {
      setCallData({ subject: "", description: "", duration: "", date: "", time: "" });
      setDatePickerAnchorEl(null);
      setSelectedDate(null);
    } else if (initialSubject || initialDate || initialTime || initialDescription) {
      setCallData({
        subject: initialSubject || "",
        description: initialDescription || "",
        duration: "",
        date: initialDate || "",
        time: initialTime || "",
      });
    }
  }, [open, initialSubject, initialDate, initialTime, initialDescription]);

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
        date: callData.date || undefined,
        time: callData.time || undefined,
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
      setCallData({ subject: "", description: "", duration: "", date: "", time: "" });
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

  const formatDateDisplay = (dateString: string) => {
    return formatDatePeru(dateString);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNumber = prevMonthLastDay - startingDayOfWeek + i + 1;
      days.push({ day: dayNumber, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const weekDays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (callData.date) {
      const dateMatch = callData.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const day = parseInt(dateMatch[3], 10);
        const date = new Date(year, month, day);
        setSelectedDate(date);
        setCurrentMonth(date);
      } else {
        const date = new Date(callData.date);
        setSelectedDate(date);
        setCurrentMonth(date);
      }
    } else {
      const today = new Date();
      setSelectedDate(null);
      setCurrentMonth(today);
    }
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    setSelectedDate(date);
    const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    setCallData({ ...callData, date: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setCallData({ ...callData, date: "" });
    setDatePickerAnchorEl(null);
  };

  const handleToday = () => {
    const today = new Date();
    const peruToday = new Date(
      today.toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const year = peruToday.getFullYear();
    const month = peruToday.getMonth() + 1;
    const day = peruToday.getDate();
    handleDateSelect(year, month, day);
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
          width: { xs: "50vw", sm: "500px", md: "500px" },
          maxWidth: { xs: "95vw", sm: "95vw" },
          height: { xs: "85vh", sm: "80vh" },
          maxHeight: { xs: "85vh", sm: "720px" },
          bgcolor: `${theme.palette.background.paper} !important`,
          color: `${theme.palette.text.primary} !important`,
          border: "none",
          borderRadius: 3,
          zIndex: 1500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "transparent",
            color: theme.palette.text.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: { xs: "64px", md: "60px" },
            px: { xs: 3, md: 4 },
            borderBottom: `1px solid ${theme.palette.divider}`, // Agregar esta línea
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
            pt: 2,
            pb: { xs: 3, md: 4 },
            overflow: "hidden",
            overflowY: "auto",
            minHeight: 0,
            gap: 2,
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
            placeholder="Asunto"
            value={callData.subject}
            onChange={(e) =>
              setCallData({ ...callData, subject: e.target.value })
            }
            required
            fullWidth
            sx={{
              "& input": {
                color: `${theme.palette.text.primary} !important`,
                "&::placeholder": {
                  color: `${theme.palette.text.secondary} !important`,
                  opacity: 1,
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "& fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.divider,
                  borderWidth: "2px",
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
            placeholder="Fecha"
            value={callData.date ? formatDateDisplay(callData.date) : ""}
            onClick={handleOpenDatePicker}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={handleOpenDatePicker}
                  sx={{
                    color: theme.palette.text.secondary,
                    mr: 0.5,
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: taxiMonterricoColors.green,
                    },
                  }}
                >
                  <CalendarToday sx={{ fontSize: 18 }} />
                </IconButton>
              ),
            }}
            sx={{
              cursor: "pointer",
              "& input": {
                color: `${theme.palette.text.primary} !important`,
                "&::placeholder": {
                  color: `${theme.palette.text.secondary} !important`,
                  opacity: 1,
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "& fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.divider,
                  borderWidth: "2px",
                },
              },
            }}
          />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              width: "100%",
            }}
          >
            <TextField
              placeholder="Hora"
              type="time"
              value={callData.time}
              onChange={(e) =>
                setCallData({ ...callData, time: e.target.value })
              }
              fullWidth
              sx={{
                "& input": {
                  color: `${theme.palette.text.primary} !important`,
                  "&::placeholder": {
                    color: `${theme.palette.text.secondary} !important`,
                    opacity: 1,
                  },
                  "&::-webkit-calendar-picker-indicator": {
                    filter: theme.palette.mode === "dark" ? "invert(1)" : "none",
                    cursor: "pointer",
                  },
                  "&::-webkit-datetime-edit-text": {
                    color: `${theme.palette.text.primary} !important`,
                  },
                  "&::-webkit-datetime-edit-hour-field": {
                    color: `${theme.palette.text.primary} !important`,
                  },
                  "&::-webkit-datetime-edit-minute-field": {
                    color: `${theme.palette.text.primary} !important`,
                  },
                  "&::-webkit-datetime-edit-ampm-field": {
                    color: `${theme.palette.text.primary} !important`,
                  },
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "& fieldset": {
                    borderWidth: "2px",
                    borderColor: theme.palette.divider,
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.divider,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.divider,
                    borderWidth: "2px",
                  },
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    color: theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.text.secondary,
                  },
                },
              }}
            />
            <TextField
              placeholder="Duración (minutos)"
              type="number"
              value={callData.duration}
              onChange={(e) =>
                setCallData({ ...callData, duration: e.target.value })
              }
              fullWidth
              sx={{
                "& input": {
                  color: `${theme.palette.text.primary} !important`,
                  "&::placeholder": {
                    color: `${theme.palette.text.secondary} !important`,
                    opacity: 1,
                  },
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "& fieldset": {
                    borderWidth: "2px",
                    borderColor: theme.palette.divider,
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.divider,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.divider,
                    borderWidth: "2px",
                  },
                },
              }}
            />
          </Box>
          <TextField
            placeholder="Notas de la llamada"
            multiline
            rows={8}
            value={callData.description}
            onChange={(e) =>
              setCallData({ ...callData, description: e.target.value })
            }
            fullWidth
            sx={{
              "& textarea": {
                color: `${theme.palette.text.primary} !important`,
                paddingTop: "0px",
                "&::placeholder": {
                  color: `${theme.palette.text.secondary} !important`,
                  opacity: 1,
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                minHeight: "300px",
                "& .MuiInputBase-input": {
                  paddingTop: "4px !important",
                  paddingLeft: "0px !important",
                  paddingRight: "14px !important",
                  paddingBottom: "8px !important",
                },
                "& fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.divider,
                  borderWidth: "2px",
                },
              },
            }}
          />
        </Box>

        {/* Footer con botones */}
        <DialogActions sx={pageStyles.dialogActions}>
          <Button
            onClick={onClose}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveCall}
            variant="contained"
            disabled={saving || !callData.subject.trim()}
            sx={pageStyles.saveButton}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Box>

      {/* Date Picker Popover */}
      <Popover
        open={Boolean(datePickerAnchorEl)}
        anchorEl={datePickerAnchorEl}
        onClose={() => setDatePickerAnchorEl(null)}
        disablePortal={false}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          root: {
            style: {
              zIndex: 1600,
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0,0,0,0.4)"
                : "0 8px 32px rgba(0,0,0,0.12)",
            mt: 0.5,
            maxWidth: 280,
            zIndex: "1600 !important",
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
          {/* Header con mes y año */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              pb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentMonth(newDate);
              }}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: theme.palette.text.primary,
                letterSpacing: "-0.01em",
              }}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentMonth(newDate);
              }}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  borderColor: taxiMonterricoColors.green,
                  color: taxiMonterricoColors.green,
                },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Días de la semana */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 0.5,
              mb: 1.5,
            }}
          >
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="caption"
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  fontSize: "0.7rem",
                  py: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendario */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 0.5,
              mb: 1.5,
            }}
          >
            {getDaysInMonth(currentMonth).map((item, index) => {
              let year = currentMonth.getFullYear();
              let month = currentMonth.getMonth();

              if (!item.isCurrentMonth) {
                if (index < 7) {
                  month = month - 1;
                  if (month < 0) {
                    month = 11;
                    year = year - 1;
                  }
                } else {
                  month = month + 1;
                  if (month > 11) {
                    month = 0;
                    year = year + 1;
                  }
                }
              }

              const date = new Date(year, month, item.day);

              const isSelected =
                selectedDate &&
                item.isCurrentMonth &&
                date.toDateString() === selectedDate.toDateString();
              const isToday =
                item.isCurrentMonth &&
                date.toDateString() === new Date().toDateString();

              return (
                <Box
                  key={`${item.isCurrentMonth ? "current" : "other"}-${
                    item.day
                  }-${index}`}
                  onClick={() => {
                    if (item.isCurrentMonth) {
                      handleDateSelect(year, month + 1, item.day);
                    }
                  }}
                  sx={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    cursor: item.isCurrentMonth ? "pointer" : "default",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    bgcolor: isSelected
                      ? taxiMonterricoColors.green
                      : isToday
                      ? `${taxiMonterricoColors.green}20`
                      : "transparent",
                    color: isSelected
                      ? "white"
                      : isToday
                      ? taxiMonterricoColors.green
                      : item.isCurrentMonth
                      ? theme.palette.text.primary
                      : theme.palette.text.disabled,
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    fontSize: "0.75rem",
                    position: "relative",
                    minHeight: "28px",
                    minWidth: "28px",
                    "&:hover": {
                      bgcolor: item.isCurrentMonth
                        ? isSelected
                          ? taxiMonterricoColors.green
                          : `${taxiMonterricoColors.green}15`
                        : "transparent",
                      transform:
                        item.isCurrentMonth && !isSelected
                          ? "scale(1.05)"
                          : "none",
                    },
                    opacity: item.isCurrentMonth ? 1 : 0.35,
                  }}
                >
                  {item.day}
                </Box>
              );
            })}
          </Box>

          {/* Botones de acción */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 1.5,
              pt: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              gap: 1,
            }}
          >
            <Button
              onClick={handleClearDate}
              sx={{
                textTransform: "none",
                color: theme.palette.text.secondary,
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                },
              }}
            >
              Borrar
            </Button>
            <Button
              onClick={handleToday}
              sx={{
                textTransform: "none",
                color: taxiMonterricoColors.green,
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                "&:hover": {
                  bgcolor: `${taxiMonterricoColors.green}15`,
                },
              }}
            >
              Hoy
            </Button>
          </Box>
        </Box>
      </Popover>

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
