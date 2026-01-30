import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Popover,
  useTheme,
} from "@mui/material";
import {
  Close,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { taxiMonterricoColors } from "../../theme/colors";
import api from "../../config/api";
import { formatDatePeru } from "../../utils/dateUtils";

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface MeetingModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newTask: any) => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
}) => {
  const theme = useTheme();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    time: "",
    dueDate: "",
    type: "meeting",
  });
  const [saving, setSaving] = useState(false);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Resetear estados cuando se abre/cierra el modal
  useEffect(() => {
    if (!open) {
      setTaskData({
        title: "",
        description: "",
        time: "",
        dueDate: "",
        type: "meeting",
      });
      setDatePickerAnchorEl(null);
      setSelectedDate(null);
    } else {
      // Asegurar que siempre sea "meeting"
      setTaskData((prev) => ({
        ...prev,
        type: "meeting",
      }));
    }
  }, [open]);

  useEffect(() => {
    if (descriptionEditorRef.current && open) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || "";
      }
    }
  }, [taskData.description, open]);

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    if (taskData.dueDate) {
      const dateMatch = taskData.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const day = parseInt(dateMatch[3], 10);
        const date = new Date(year, month, day);
        setSelectedDate(date);
        setCurrentMonth(date);
      } else {
        const date = new Date(taskData.dueDate);
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
    setTaskData({ ...taskData, dueDate: formattedDate });
    setDatePickerAnchorEl(null);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setTaskData({ ...taskData, dueDate: "" });
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

  const handleSaveTask = useCallback(async () => {
    if (!taskData.title.trim()) {
      return;
    }
    setSaving(true);
    try {
      // Siempre guardar como reunión
      const response = await api.post("/activities", {
        type: "meeting",
        subject: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate || undefined,
        time: taskData.time || undefined,
        [`${entityType}Id`]: Number(entityId),
      });
      const newActivity = response.data;
      // Convertir a formato compatible con onSave para la UI de donde se llama
      const taskAsActivity = {
        id: newActivity.id,
        type: "meeting",
        title: newActivity.subject,
        description: newActivity.description,
        dueDate: taskData.dueDate || undefined,
        createdAt: newActivity.createdAt,
        CreatedBy: newActivity.User,
        AssignedTo: newActivity.User,
        companyId: newActivity.companyId,
        contactId: newActivity.contactId,
        dealId: newActivity.dealId,
      };
      onSave(taskAsActivity);
      onClose();
    } catch (error) {
      console.error("Error saving meeting:", error);
    } finally {
      setSaving(false);
    }
  }, [taskData, entityType, entityId, onSave, onClose]);

  // Atajos de teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter para guardar desde cualquier lugar
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!saving && taskData.title.trim()) {
          handleSaveTask();
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
  }, [open, saving, taskData.title, handleSaveTask, onClose]);

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

  if (!open) return null;

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "50vw", sm: "700px", md: "550px" },
          maxWidth: { xs: "95vw", sm: "95vw" },
          height: { xs: "85vh", sm: "60vh" },
          maxHeight: { xs: "85vh", sm: "680px" },
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
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              fontSize: { xs: "1.1rem", md: "1.25rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Reunión
          </Typography>
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

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            px: { xs: 3, md: 4 },
            pt: 2,
            pb: { xs: 3, md: 4 },
            overflow: "hidden",
            minHeight: 0,
            gap: 2,
          }}
        >
          {/* Título */}
          <Box sx={{ mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 0.75,
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              Título
            </Typography>
            <TextField
              value={taskData.title}
              onChange={(e) =>
                setTaskData({ ...taskData, title: e.target.value })
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
                "& .MuiInputBase-input": {
                  py: 1,
                },
              }}
              onKeyDown={(e) => {
                // Enter para guardar (solo en el campo de título)
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!saving && taskData.title.trim()) {
                    handleSaveTask();
                  }
                }
                // Esc para cancelar
                if (e.key === "Escape") {
                  onClose();
                }
              }}
            />
          </Box>

          {/* Hora y Fecha */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.75,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                Hora
              </Typography>
              <TextField
                type="time"
                value={taskData.time}
                onChange={(e) =>
                  setTaskData({ ...taskData, time: e.target.value })
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
                  "& .MuiInputBase-input": {
                    py: 1,
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.75,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                Fecha
              </Typography>
              <TextField
                value={
                  taskData.dueDate ? formatDateDisplay(taskData.dueDate) : ""
                }
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
                          color: taxiMonterricoColors.orange,
                        },
                      }}
                    >
                      <CalendarToday sx={{ fontSize: 18 }} />
                    </IconButton>
                  ),
                }}
                sx={{
                  cursor: "pointer",
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
                  "& .MuiInputBase-input": {
                    py: 1,
                    cursor: "pointer",
                  },
                }}
              />
            </Box>
          </Box>

          {/* Editor de texto */}
          <Box
            ref={descriptionEditorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const html = (e.target as HTMLElement).innerHTML;
              if (html !== taskData.description) {
                setTaskData({ ...taskData, description: html });
              }
            }}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              pt: 1.5,
              pb: 1.5,
              px: 1.5,
              borderRadius: 2,
              border: `2px solid ${theme.palette.divider}`,
              outline: "none",
              lineHeight: 1.5,
              color: theme.palette.text.primary,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:focus": {
                borderColor: theme.palette.divider,
              },
              "&:empty:before": {
                content: '"Observaciones"',
                color: theme.palette.text.secondary,
                opacity: 1,
              },
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)",
                borderRadius: "3px",
              },
            }}
          />

        </Box>

        {/* Footer con botones */}
        <Box
          sx={{
            px: 4,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: `${theme.palette.background.paper} !important`,
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
              px: 1.5,
              py: 0.5,
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                borderColor: theme.palette.error.dark,
                bgcolor: `${theme.palette.error.main}15`,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTask}
            variant="contained"
            disabled={saving || !taskData.title.trim()}
            sx={{
              textTransform: "none",
              px: 2,
              py: 0.5,
              bgcolor: saving
                ? theme.palette.action.disabledBackground
                : taxiMonterricoColors.green,
              color: "white",
              fontWeight: 600,
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
    </>
  );
};

export default MeetingModal;
