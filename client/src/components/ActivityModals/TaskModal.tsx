import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Divider,
  Popover,
  Checkbox,
  FormControlLabel,
  useTheme,
} from "@mui/material";
import {
  Close,
  CalendarToday,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  TableChart,
  AttachFile,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
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

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "deal" | "company" | "contact" | "task" | "ticket";
  entityId: number | string;
  entityName: string;
  user: User | null;
  onSave: (newTask: any) => void;
  taskType?: "todo" | "meeting"; // "todo" para tarea, "meeting" para reunión
}

const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  user,
  onSave,
  taskType = "todo",
}) => {
  const theme = useTheme();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    type: taskType,
  });
  const [saving, setSaving] = useState(false);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
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
        priority: "medium",
        dueDate: "",
        type: taskType,
      });
      setLinkDialogOpen(false);
      setTableDialogOpen(false);
      setDatePickerAnchorEl(null);
      setSelectedDate(null);
      setLinkText("");
      setLinkUrl("");
      setTableRows("3");
      setTableCols("3");
    } else {
      // Actualizar el tipo cuando el modal se abre o cuando taskType cambia
      setTaskData((prev) => ({
        ...prev,
        type: taskType,
      }));
    }
  }, [open, taskType]);

  useEffect(() => {
    if (descriptionEditorRef.current && open) {
      if (taskData.description !== descriptionEditorRef.current.innerHTML) {
        descriptionEditorRef.current.innerHTML = taskData.description || "";
      }
    }
  }, [taskData.description, open]);

  const updateActiveFormats = useCallback(() => {
    if (descriptionEditorRef.current) {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
      });
    }
  }, []);

  useEffect(() => {
    const editor = descriptionEditorRef.current;
    if (!editor || !open) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "Shift" ||
          e.key === "Control" ||
          e.key === "Meta")
      ) {
        updateActiveFormats();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    editor.addEventListener("mouseup", handleMouseUp);
    editor.addEventListener("keyup", handleKeyUp as EventListener);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      editor.removeEventListener("mouseup", handleMouseUp);
      editor.removeEventListener("keyup", handleKeyUp as EventListener);
    };
  }, [updateActiveFormats, open]);


  const handleOpenLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      const selectedText = selection.toString().trim();
      if (selectedText) {
        setLinkText(selectedText);
      } else {
        setLinkText("");
      }
    } else {
      if (descriptionEditorRef.current) {
        const range = document.createRange();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        } else {
          range.selectNodeContents(descriptionEditorRef.current);
          range.collapse(false);
          savedSelectionRef.current = range;
        }
      }
      setLinkText("");
    }
    setLinkUrl("");
    setLinkDialogOpen(true);
  };

  const handleCloseLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkText("");
    setLinkUrl("");
    setOpenInNewTab(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim() || !descriptionEditorRef.current) return;

    descriptionEditorRef.current.focus();

    let range: Range | null = null;
    const selection = window.getSelection();

    if (savedSelectionRef.current) {
      try {
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
          range = selection.getRangeAt(0);
        }
      } catch (e) {
        console.error("Error restoring selection:", e);
      }
    }

    if (!range && selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }

    if (!range && descriptionEditorRef.current) {
      range = document.createRange();
      range.selectNodeContents(descriptionEditorRef.current);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    if (range) {
      try {
        const textToLink = linkText.trim() || linkUrl;
        const link = document.createElement("a");
        link.href = linkUrl.trim();
        link.textContent = textToLink;
        if (openInNewTab) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }

        if (range.toString().trim()) {
          range.deleteContents();
        }

        range.insertNode(link);
        range.setStartAfter(link);
        range.collapse(true);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        if (descriptionEditorRef.current) {
          setTaskData({
            ...taskData,
            description: descriptionEditorRef.current.innerHTML,
          });
        }
      } catch (e) {
        console.error("Error inserting link:", e);
        if (linkText.trim()) {
          document.execCommand("insertText", false, linkText);
        }
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const r = sel.getRangeAt(0);
          r.selectNodeContents(r.commonAncestorContainer);
          sel.removeAllRanges();
          sel.addRange(r);
        }
        document.execCommand("createLink", false, linkUrl.trim());
        if (descriptionEditorRef.current) {
          setTaskData({
            ...taskData,
            description: descriptionEditorRef.current.innerHTML,
          });
        }
      }
    } else {
      if (linkText.trim()) {
        document.execCommand("insertText", false, linkText);
      }
      document.execCommand("createLink", false, linkUrl.trim());
      if (descriptionEditorRef.current) {
        setTaskData({
          ...taskData,
          description: descriptionEditorRef.current.innerHTML,
        });
      }
    }

    handleCloseLinkDialog();
  };

  const handleOpenTableDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    } else if (descriptionEditorRef.current) {
      const range = document.createRange();
      range.selectNodeContents(descriptionEditorRef.current);
      range.collapse(false);
      savedSelectionRef.current = range;
    }
    setTableRows("3");
    setTableCols("3");
    setTableDialogOpen(true);
  };

  const handleCloseTableDialog = () => {
    setTableDialogOpen(false);
    setTableRows("3");
    setTableCols("3");
  };

  const handleInsertTable = () => {
    const rows = parseInt(tableRows);
    const cols = parseInt(tableCols);

    if (
      rows > 0 &&
      cols > 0 &&
      !isNaN(rows) &&
      !isNaN(cols) &&
      descriptionEditorRef.current
    ) {
      const table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.width = "100%";
      table.style.border = `1px solid ${
        theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "#ccc"
      }`;
      table.style.marginTop = "8px";
      table.style.marginBottom = "8px";

      for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
          const td = document.createElement("td");
          td.style.border = `1px solid ${
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "#ccc"
          }`;
          td.style.padding = "8px";
          td.style.minWidth = "50px";
          td.innerHTML = "&nbsp;";
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }

      const selection = window.getSelection();
      let range: Range | null = null;

      if (savedSelectionRef.current && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
          range = selection.getRangeAt(0);
        } catch (e) {
          console.error("Error restoring selection for table:", e);
        }
      }

      if (range) {
        range.deleteContents();
        range.insertNode(table);
        range.setStartAfter(table);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);

        if (descriptionEditorRef.current) {
          setTaskData({
            ...taskData,
            description: descriptionEditorRef.current.innerHTML,
          });
        }
      } else if (descriptionEditorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(descriptionEditorRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        range.insertNode(table);
        setTaskData({
          ...taskData,
          description: descriptionEditorRef.current.innerHTML,
        });
      }

      handleCloseTableDialog();
    }
  };

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
      // Si es una reunión, guardar en /activities
      if (taskData.type === 'meeting') {
        const response = await api.post("/activities", {
          type: "meeting",
          subject: taskData.title,
          description: taskData.description,
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
      } else {
        // Si es una tarea (todo), guardar en /tasks
        const response = await api.post("/tasks", {
          title: taskData.title,
          description: taskData.description,
          type: 'todo',
          status: "pending",
          priority: taskData.priority || "medium",
          dueDate: taskData.dueDate || undefined,
          [`${entityType}Id`]: Number(entityId),
        });
        const newTask = response.data;
        onSave(newTask);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
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
          height: { xs: "85vh", sm: "90vh" },
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
            {taskData.type === "meeting" ? "Reunión" : "Tarea"}
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

          {/* Prioridad y Fecha límite */}
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
                Prioridad
              </Typography>
              <TextField
                select
                value={taskData.priority}
                onChange={(e) =>
                  setTaskData({ ...taskData, priority: e.target.value })
                }
                fullWidth
                SelectProps={{
                  MenuProps: {
                    disablePortal: false,
                    disableScrollLock: true,
                    style: {
                      zIndex: 1600,
                    },
                    slotProps: {
                      root: {
                        style: {
                          zIndex: 1600,
                        },
                      },
                    },
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        zIndex: "1600 !important",
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: theme.palette.mode === "dark" 
                          ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                          : "0 8px 32px rgba(0, 0, 0, 0.15)",
                        maxHeight: 300,
                        border: `1px solid ${theme.palette.divider}`,
                        "& .MuiMenuItem-root": {
                          color: theme.palette.text.primary,
                          py: 1,
                          "&:hover": {
                            backgroundColor: theme.palette.action.hover,
                          },
                          "&.Mui-selected": {
                            backgroundColor: `${taxiMonterricoColors.green}20`,
                            color: taxiMonterricoColors.green,
                            "&:hover": {
                              backgroundColor: `${taxiMonterricoColors.green}30`,
                            },
                          },
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  },
                }}
                sx={{
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
              >
                <MenuItem value="low" sx={{ py: 0.75 }}>
                  Baja
                </MenuItem>
                <MenuItem value="medium" sx={{ py: 0.75 }}>
                  Media
                </MenuItem>
                <MenuItem value="high" sx={{ py: 0.75 }}>
                  Alta
                </MenuItem>
              </TextField>
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
                {taskType === "meeting" ? "Fecha" : "Fecha límite"}
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

          {/* Editor de texto enriquecido */}
          <Box sx={{ position: "relative", flex: 1, minHeight: 0, maxHeight: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                borderRadius: "8px 8px 0 0",
                border: `2px solid ${theme.palette.divider}`,
                borderBottom: "none",
                outline: "none",
                lineHeight: 1.5,
                color: theme.palette.text.primary,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:focus": {
                  borderColor: theme.palette.divider,
                },
                "&:empty:before": {
                  content: '"Descripción"',
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
            {/* Toolbar */}
            <Box
              sx={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.25,
                backgroundColor: "transparent",
                borderRadius: "0 0 8px 8px",
                p: 0.75,
                borderLeft: `2px solid ${theme.palette.divider}`,
                borderRight: `2px solid ${theme.palette.divider}`,
                borderBottom: `2px solid ${theme.palette.divider}`,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                  flexWrap: "nowrap",
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    backgroundColor: activeFormats.bold
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("bold");
                    updateActiveFormats();
                  }}
                  title="Negrita"
                >
                  <FormatBold fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    backgroundColor: activeFormats.italic
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("italic");
                    updateActiveFormats();
                  }}
                  title="Cursiva"
                >
                  <FormatItalic fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    backgroundColor: activeFormats.underline
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("underline");
                    updateActiveFormats();
                  }}
                  title="Subrayado"
                >
                  <FormatUnderlined fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    backgroundColor: activeFormats.strikeThrough
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("strikeThrough");
                    updateActiveFormats();
                  }}
                  title="Tachado"
                >
                  <FormatStrikethrough fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={() => {
                    document.execCommand("justifyLeft");
                    updateActiveFormats();
                  }}
                  title="Alinear izquierda"
                >
                  <FormatAlignLeft fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={() => {
                    document.execCommand("justifyCenter");
                    updateActiveFormats();
                  }}
                  title="Alinear centro"
                >
                  <FormatAlignCenter fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={() => {
                    document.execCommand("justifyRight");
                    updateActiveFormats();
                  }}
                  title="Alinear derecha"
                >
                  <FormatAlignRight fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={() => {
                    document.execCommand("justifyFull");
                    updateActiveFormats();
                  }}
                  title="Justificar"
                >
                  <FormatAlignJustify fontSize="small" />
                </IconButton>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    mx: 0.25,
                    height: "18px",
                    borderColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                  }}
                />
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    backgroundColor: activeFormats.unorderedList
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("insertUnorderedList");
                    updateActiveFormats();
                  }}
                  title="Lista con viñetas"
                >
                  <FormatListBulleted fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    backgroundColor: activeFormats.orderedList
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                  onClick={() => {
                    document.execCommand("insertOrderedList");
                    updateActiveFormats();
                  }}
                  title="Lista numerada"
                >
                  <FormatListNumbered fontSize="small" />
                </IconButton>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    mx: 0.25,
                    height: "18px",
                    borderColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                  }}
                />
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    backgroundColor: linkDialogOpen
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={handleOpenLinkDialog}
                  title="Insertar enlace"
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={handleOpenTableDialog}
                  title="Insertar tabla"
                >
                  <TableChart fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.5,
                    minWidth: 32,
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      color: theme.palette.text.primary,
                    },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Adjuntar archivo"
                >
                  <AttachFile fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Input oculto para adjuntar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !descriptionEditorRef.current) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  descriptionEditorRef.current?.focus();

                  const selection = window.getSelection();
                  let range: Range | null = null;

                  if (selection && selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                  } else if (descriptionEditorRef.current) {
                    range = document.createRange();
                    range.selectNodeContents(descriptionEditorRef.current);
                    range.collapse(false);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }

                  if (range) {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = file.name;
                    link.textContent = `📎 ${file.name}`;
                    link.style.display = "inline-block";
                    link.style.margin = "4px";
                    link.style.padding = "4px 8px";
                    link.style.backgroundColor =
                      theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5";
                    link.style.borderRadius = "4px";
                    link.style.textDecoration = "none";
                    link.style.color = theme.palette.text.primary;

                    range.insertNode(link);
                    range.setStartAfter(link);
                    range.collapse(true);
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }

                    if (descriptionEditorRef.current) {
                      setTaskData({
                        ...taskData,
                        description: descriptionEditorRef.current.innerHTML,
                      });
                    }
                  }
                }
              };

              reader.onerror = () => {
                alert("Error al leer el archivo.");
              };

              reader.readAsDataURL(file);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
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

      {/* Popup flotante para insertar enlace */}
      {linkDialogOpen && (
          <>
            {/* Overlay para cerrar al hacer clic fuera */}
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1300,
              }}
              onClick={handleCloseLinkDialog}
            />
            {/* Popup flotante */}
            <Box
              sx={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1301,
                backgroundColor:
                  theme.palette.mode === "dark" ? "#2a2a2a" : "white",
                borderRadius: "8px",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 24px rgba(0,0,0,0.6)"
                    : "0 8px 24px rgba(0,0,0,0.2)",
                border: `1px solid ${
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "#e0e0e0"
                }`,
                minWidth: "400px",
                maxWidth: "500px",
                p: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* Campo de texto */}
                <TextField
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto"
                  fullWidth
                  variant="outlined"
                  size="small"
                  autoFocus
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
                      "& fieldset": {
                        borderColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.2)"
                            : "#e0e0e0",
                      },
                      "&:hover fieldset": {
                        borderColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.3)"
                            : "#bdbdbd",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main,
                        borderWidth: "2px",
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        <FormatBold fontSize="small" />
                      </Box>
                    ),
                  }}
                />
                {/* Campo de URL */}
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                  <TextField
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Escribe o pega un vínculo"
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
                        "& fieldset": {
                          borderColor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.2)"
                              : "#e0e0e0",
                        },
                        "&:hover fieldset": {
                          borderColor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.3)"
                              : "#bdbdbd",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.primary.main,
                          borderWidth: "2px",
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Box
                          sx={{
                            mr: 1,
                            display: "flex",
                            alignItems: "center",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          <LinkIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                  {/* Botón Aplicar */}
                  <Button
                    onClick={handleApplyLink}
                    variant="contained"
                    disabled={!linkUrl.trim()}
                    sx={{
                      textTransform: "none",
                      minWidth: "80px",
                      height: "40px",
                      backgroundColor: linkUrl.trim()
                        ? theme.palette.primary.main
                        : theme.palette.action.disabledBackground,
                      color: linkUrl.trim()
                        ? "white"
                        : theme.palette.action.disabled,
                      "&:hover": {
                        backgroundColor: linkUrl.trim()
                          ? theme.palette.primary.dark
                          : theme.palette.action.disabledBackground,
                      },
                      "&:disabled": {
                        backgroundColor: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                    }}
                  >
                    Aplicar
                  </Button>
                </Box>
                {/* Checkbox para abrir en nueva pestaña */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                      size="small"
                      sx={{
                        color: theme.palette.primary.main,
                        "&.Mui-checked": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  }
                  label={
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Abrir en una nueva pestaña
                    </Box>
                  }
                  sx={{ mt: -0.5 }}
                />
              </Box>
            </Box>
          </>
      )}

      {/* Dialog para insertar tabla */}
      <Dialog
          open={tableDialogOpen}
          onClose={handleCloseTableDialog}
          maxWidth="xs"
          fullWidth
          sx={{ zIndex: 1700 }}
          PaperProps={{
            sx: {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 1.5,
              fontSize: "1.125rem",
              fontWeight: 600,
            }}
          >
            Insertar tabla
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Número de filas"
                type="number"
                value={tableRows}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    value === "" ||
                    (parseInt(value) > 0 && parseInt(value) <= 50)
                  ) {
                    setTableRows(value);
                  }
                }}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
                variant="outlined"
                size="small"
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
                  },
                }}
              />
              <TextField
                label="Número de columnas"
                type="number"
                value={tableCols}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    value === "" ||
                    (parseInt(value) > 0 && parseInt(value) <= 50)
                  ) {
                    setTableCols(value);
                  }
                }}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleCloseTableDialog}
              sx={{
                textTransform: "none",
                color: theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInsertTable}
              variant="contained"
              disabled={
                !tableRows ||
                !tableCols ||
                parseInt(tableRows) <= 0 ||
                parseInt(tableCols) <= 0
              }
              sx={{
                textTransform: "none",
                backgroundColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              Aceptar
            </Button>
          </DialogActions>
        </Dialog>

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

export default TaskModal;
