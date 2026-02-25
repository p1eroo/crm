import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Box,
  Card,
  IconButton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Chip,
  CircularProgress,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Close,
  Person,
  CalendarToday,
  Flag,
  DonutSmall,
} from "@mui/icons-material";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import {
  getCalendarDays,
  isToday as isTodayUtil,
  getAllEventsForDay,
  truncateEventTitle,
} from "../utils/calendarUtils";
import type { Theme } from "@mui/material/styles";

interface Task {
  id: number;
  title: string;
  type?: string;
  status: string;
  dueDate?: string;
  priority?: string;
}

const TIME_SLOTS = [
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
];

const getEventHour = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10);
};

const WeekView: React.FC<{
  calendarDate: Date;
  allTasksWithDates: Task[];
  meetings: any[];
  onEventClick: (event: any) => void;
  theme: Theme;
}> = ({ calendarDate, allTasksWithDates, meetings, onEventClick, theme }) => {
  const mon = new Date(calendarDate);
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <Box
      sx={{
        pb: 2,
        overflowX: "auto",
        bgcolor: theme.palette.mode === "dark" ? "#1c252e" : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          minWidth: 700,
          width: "100%",
          bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
          borderTop:
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.08)"
              : `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header: empty + day headers */}
        <Box
          sx={{
            borderBottom:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : `1px solid ${theme.palette.divider}`,
          }}
        />
        {weekDays.map((d, i) => (
          <Box
            key={i}
            sx={{
              py: 1,
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
              borderBottom:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.08)"
                  : `1px solid ${theme.palette.divider}`,
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: theme.palette.text.primary,
            }}
          >
            {dayNames[(d.getDay() + 6) % 7]} {d.getDate()}/
            {d.getMonth() + 1}
          </Box>
        ))}
        {/* Time rows */}
        {TIME_SLOTS.map((slot, slotIdx) => (
          <React.Fragment key={slot}>
            <Box
              sx={{
                py: 0.5,
                pr: 1,
                pl: 1,
                fontSize: "0.875rem",
                color: theme.palette.text.secondary,
                bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
                borderBottom:
                  theme.palette.mode === "dark"
                    ? "1px dashed rgba(255,255,255,0.06)"
                    : "1px dashed rgba(0,0,0,0.06)",
                borderRight:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : `1px solid ${theme.palette.divider}`,
              }}
            >
              {slot}
            </Box>
            {weekDays.map((d, dayIdx) => {
              const events = getAllEventsForDay(
                d.getDate(),
                d.getFullYear(),
                d.getMonth(),
                allTasksWithDates,
                [],
                [],
                meetings
              ).filter((ev) => {
                const h = getEventHour(ev.time || "");
                if (h === null) return false;
                const slotHour = slotIdx + 8;
                return h >= slotHour && h < slotHour + 1;
              });
              return (
                <Box
                  key={dayIdx}
                  sx={{
                    minHeight: 40,
                    bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
                    borderBottom:
                      theme.palette.mode === "dark"
                        ? "1px dashed rgba(255,255,255,0.06)"
                        : "1px dashed rgba(0,0,0,0.06)",
                    borderRight:
                      dayIdx < 6
                        ? theme.palette.mode === "dark"
                          ? "1px solid rgba(255,255,255,0.08)"
                          : `1px solid ${theme.palette.divider}`
                        : "none",
                    p: 0.25,
                  }}
                >
                  {events.map((ev, ei) => (
                    <Box
                      key={ei}
                      onClick={() => onEventClick(ev)}
                      sx={{
                        bgcolor: ev.color,
                        color: "#fff",
                        borderRadius: 0.5,
                        px: 0.5,
                        py: 0.25,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        mb: 0.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ev.time && `${ev.time} `}
                      {truncateEventTitle(ev.title, 18)}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

const DayView: React.FC<{
  calendarDate: Date;
  allTasksWithDates: Task[];
  meetings: any[];
  onEventClick: (event: any) => void;
  theme: Theme;
}> = ({ calendarDate, allTasksWithDates, meetings, onEventClick, theme }) => {
  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const dayName = dayNames[calendarDate.getDay()];

  return (
    <Box
      sx={{
        pb: 2,
        bgcolor: theme.palette.mode === "dark" ? "#1c252e" : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          py: 1,
          px: 1,
          textAlign: "center",
          bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
          borderTop:
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.08)"
              : `1px solid ${theme.palette.divider}`,
          borderBottom:
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.08)"
              : `1px solid ${theme.palette.divider}`,
          mb: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: theme.palette.text.primary,
          }}
        >
          {dayName}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "60px 1fr",
          minWidth: 300,
          width: "100%",
          bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
        }}
      >
        {TIME_SLOTS.map((slot, slotIdx) => {
          const events = getAllEventsForDay(
            calendarDate.getDate(),
            calendarDate.getFullYear(),
            calendarDate.getMonth(),
            allTasksWithDates,
            [],
            [],
            meetings
          ).filter((ev) => {
            const h = getEventHour(ev.time || "");
            if (h === null) return false;
            const slotHour = slotIdx + 8;
            return h >= slotHour && h < slotHour + 1;
          });
          return (
            <React.Fragment key={slot}>
              <Box
                sx={{
                  py: 0.5,
                  pr: 1,
                  pl: 1,
                  fontSize: "0.875rem",
                  color: theme.palette.text.secondary,
                  bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
                  borderBottom:
                    theme.palette.mode === "dark"
                      ? "1px dashed rgba(255,255,255,0.06)"
                      : "1px dashed rgba(0,0,0,0.06)",
                  borderRight:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255,255,255,0.08)"
                      : `1px solid ${theme.palette.divider}`,
                }}
              >
                {slot}
              </Box>
              <Box
                sx={{
                  minHeight: 48,
                  bgcolor: theme.palette.mode === "dark" ? "#1c252e" : "transparent",
                  borderBottom:
                    theme.palette.mode === "dark"
                      ? "1px dashed rgba(255,255,255,0.06)"
                      : "1px dashed rgba(0,0,0,0.06)",
                  p: 0.5,
                }}
              >
                {events.map((ev, ei) => (
                  <Box
                    key={ei}
                    onClick={() => onEventClick(ev)}
                    sx={{
                      bgcolor: ev.color,
                      color: "#fff",
                      borderRadius: 0.75,
                      px: 1,
                      py: 0.75,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      mb: 0.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {ev.time && `${ev.time} - `}
                      {ev.title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
};

const Calendar: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [allTasksWithDates, setAllTasksWithDates] = useState<Task[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Estados para Google Calendar
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [, setGoogleCalendarEvents] = useState<any[]>([]);
  const [, setNotes] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  // Estados para el modal de detalles del evento
  const [eventModalOpen, setEventModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loadingEventDetails, setLoadingEventDetails] = useState(false);

  const fetchGoogleCalendarEvents = useCallback(async () => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem("token");
    if (!user || !token) {
      console.log(
        "⚠️ Usuario no autenticado, omitiendo fetchGoogleCalendarEvents",
      );
      setGoogleCalendarEvents([]);
      return;
    }

    if (!googleCalendarConnected) {
      setGoogleCalendarEvents([]);
      return;
    }

    try {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const response = await api.get("/google/events", {
        params: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
        },
      });

      setGoogleCalendarEvents(response.data.events || []);
    } catch (error: any) {
      console.error("Error obteniendo eventos de Google Calendar:", error);
      setGoogleCalendarEvents([]);
    }
  }, [googleCalendarConnected, calendarDate, user]);

  const checkGoogleCalendarConnection = useCallback(async () => {
    // Verificar autenticación antes de hacer la llamada
    const token = localStorage.getItem("token");
    if (!user || !token) {
      console.log(
        "⚠️ Usuario no autenticado, omitiendo checkGoogleCalendarConnection",
      );
      setGoogleCalendarConnected(false);
      setGoogleCalendarEvents([]);
      return;
    }

    try {
      const response = await api.get("/google/token");
      const isConnected = response.data.hasToken && !response.data.isExpired;
      setGoogleCalendarConnected(isConnected);
      // NO llamar fetchGoogleCalendarEvents aquí, el otro useEffect lo hará cuando cambie googleCalendarConnected
    } catch (error: any) {
      if (error.response?.status === 404) {
        setGoogleCalendarConnected(false);
        setGoogleCalendarEvents([]);
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        return;
      } else {
        console.error("Error verificando conexión de Google Calendar:", error);
        setGoogleCalendarConnected(false);
        setGoogleCalendarEvents([]);
      }
    }
  }, [user]);

  useEffect(() => {
    if (googleCalendarConnected) {
      fetchGoogleCalendarEvents();
    }
  }, [calendarDate, googleCalendarConnected, fetchGoogleCalendarEvents]);

  // Función combinada para obtener todas las actividades de una vez
  const fetchAllActivities = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!user || !token) {
      console.log("⚠️ Usuario no autenticado, omitiendo fetchAllActivities");
      setNotes([]);
      setMeetings([]);
      return [];
    }

    try {
      // Una sola llamada obteniendo todas las actividades sin filtrar por tipo
      const response = await api.get("/activities", {
        params: { limit: 1000 },
      });

      const allActivities = response.data.activities || response.data || [];

      // Separar por tipo en el frontend
      const notesData = allActivities.filter((a: any) => a.type === "note");
      const meetingsData = allActivities.filter(
        (a: any) => a.type === "meeting",
      );
      const taskActivities = allActivities.filter(
        (a: any) => a.type === "task",
      );

      setNotes(notesData);
      setMeetings(meetingsData);

      return taskActivities; // Retornar actividades tipo task para usar en fetchAllTasksWithDates
    } catch (error: any) {
      console.error("Error obteniendo actividades:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      setNotes([]);
      setMeetings([]);
      return [];
    }
  }, [user]);

  const fetchAllTasksWithDates = useCallback(
    async (taskActivities: any[] = []) => {
      // Verificar autenticación antes de hacer la llamada
      const token = localStorage.getItem("token");
      if (!user || !token) {
        console.log(
          "⚠️ Usuario no autenticado, omitiendo fetchAllTasksWithDates",
        );
        setAllTasksWithDates([]);
        return;
      }

      try {
        // Obtener tareas desde /tasks
        const tasksResponse = await api.get("/tasks?limit=1000");
        const tasksFromTasks = (
          tasksResponse.data.tasks ||
          tasksResponse.data ||
          []
        ).map((task: Task) => ({
          ...task,
          isActivity: false,
        }));

        // Usar las actividades tipo task ya obtenidas de fetchAllActivities
        const tasksFromActivities = taskActivities.map((activity: any) => ({
          id: activity.id,
          title: activity.subject || activity.description || "Sin título",
          type: activity.type,
          status: "pending",
          priority: "medium",
          dueDate: activity.dueDate,
          isActivity: true,
        }));

        const allTasks = [...tasksFromTasks, ...tasksFromActivities];
        const tasksWithDates = allTasks.filter((task: Task) => task.dueDate);
        setAllTasksWithDates(tasksWithDates);
      } catch (error: any) {
        console.error("Error fetching tasks with dates:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }
        setAllTasksWithDates([]);
      }
    },
    [user],
  );

  useEffect(() => {
    // Solo hacer llamadas si el usuario está autenticado
    if (!user) return;

    // Primero obtener todas las actividades (que también actualiza notes y meetings)
    fetchAllActivities().then((taskActivities) => {
      // Luego obtener las tareas (que usa las actividades ya obtenidas)
      fetchAllTasksWithDates(taskActivities);
    });

    checkGoogleCalendarConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Solo depender de user, las funciones son estables y no necesitan estar en dependencias

  // Función para obtener detalles completos del evento
  const fetchEventDetails = useCallback(async (event: any) => {
    if (!event.id) return;

    setLoadingEventDetails(true);
    try {
      // Si es una nota o reunión de activities (tiene isNote o isMeeting explícito)
      if (event.isNote || (event.isMeeting && !event.type)) {
        // Para notas y reuniones, obtener desde activities
        const response = await api.get(`/activities/${event.id}`);
        setEventDetails(response.data);
      } else if (event.type === "task" || event.type === "meeting") {
        // Si es una tarea (incluyendo tareas de tipo meeting), obtener desde /tasks
        const response = await api.get(`/tasks/${event.id}`);
        setEventDetails(response.data);
      } else if (event.isGoogleEvent) {
        // Para eventos de Google Calendar, usar la información que ya tenemos
        setEventDetails(event);
      } else {
        // Por defecto, intentar obtener desde activities
        try {
          const response = await api.get(`/activities/${event.id}`);
          setEventDetails(response.data);
        } catch {
          // Si falla, usar la información básica del evento
          setEventDetails(event);
        }
      }
    } catch (error) {
      console.error("Error obteniendo detalles del evento:", error);
      setEventDetails(event); // Usar información básica si falla
    } finally {
      setLoadingEventDetails(false);
    }
  }, []);

  // Función para abrir el modal
  const handleEventClick = async (event: any) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
    await fetchEventDetails(event);
  };

  // Función para obtener el label de prioridad
  const getPriorityLabel = (priority?: string) => {
    const labels: { [key: string]: string } = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority || "medium"] || "Media";
  };

  // Función para obtener el color de prioridad
  const getPriorityColor = (priority?: string) => {
    const isDark = theme.palette.mode === "dark";
    const colors: { [key: string]: { bg: string; color: string } } = {
      low: {
        bg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        color: isDark ? "rgba(255,255,255,0.85)" : theme.palette.text.secondary,
      },
      medium: {
        bg: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        color: theme.palette.text.primary,
      },
      high: {
        bg: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
        color: theme.palette.text.primary,
      },
      urgent: {
        bg: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
        color: theme.palette.text.primary,
      },
    };
    return colors[priority || "medium"] || colors.medium;
  };

  // Función para obtener el label de estado
  const getStatusLabel = (status?: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendiente",
      "in progress": "En progreso",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return labels[status || "pending"] || "Pendiente";
  };

  const modalMonth = calendarDate.getMonth();
  const modalYear = calendarDate.getFullYear();
  const calendarDays = getCalendarDays(modalYear, modalMonth);

  // Meses en español
  const mesesEnEspanol = [
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

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        pb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        maxWidth: 1600,
        mx: "auto",
      }}
    >
      {/* Barra de título - misma estructura que Deals / Negocios */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          pt: 0,
          mx: -1,
          pb: 2,
          pl: 1,
          mb: 0,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1rem", md: "1.1375rem" },
            color:
              theme.palette.mode === "dark"
                ? "white"
                : theme.palette.text.primary,
          }}
        >
          Calendario
        </Typography>
      </Box>
      {/* Card principal del calendario */}
      <Card
        sx={{
          bgcolor:
            theme.palette.mode === "dark"
              ? "#1c252e"
              : theme.palette.background.paper,
          borderRadius: 2,
          p: 0,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "none",
        }}
      >
        {/* Barra superior dentro del Card */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            mb: { xs: 2, sm: 2.5, md: 0 },
            pb: 2,
            px: { xs: 1.5, md: 2 },
            pt: { xs: 1.5, md: 2 },
            bgcolor: theme.palette.mode === "dark" ? "#1c252e" : undefined,
            borderRadius: "8px 8px 0 0",
          }}
        >
          {/* Tabs Mes / Semana / Día */}
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
            sx={{
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.06)"
                  : "#E9EDF5",
              p: 0.25,
              borderRadius: "8px",
              border: "none",
              "& .MuiToggleButtonGroup-grouped": {
                border: "none",
                "&:not(:first-of-type)": {
                  border: "none",
                  marginLeft: 0,
                },
              },
              "& .MuiToggleButton-root": {
                px: 1.5,
                py: 0.5,
                fontSize: "0.8125rem",
                textTransform: "none",
                border: "none",
                borderRadius: "6px",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.6)"
                    : "#606470",
                "&.Mui-selected": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.14)"
                      : "#fff",
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : "#1A1A1A",
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.18)"
                        : "#fff",
                  },
                },
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.5)",
                },
              },
            }}
          >
            <ToggleButton value="month">Mes</ToggleButton>
            <ToggleButton value="week">Semana</ToggleButton>
            <ToggleButton value="day">Día</ToggleButton>
          </ToggleButtonGroup>
          </Box>

          {/* Navegación y fecha (centro) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              alignItems: "center",
            }}
          >
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(calendarDate);
                if (view === "month") {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (view === "week") {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setCalendarDate(newDate);
                setSelectedDate(null);
              }}
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: 1.5,
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                minWidth: 180,
                textAlign: "center",
                fontWeight: 550,
                fontSize: { xs: "1.2rem", md: "1.5rem" },
                color: theme.palette.text.primary,
                letterSpacing: "-0.03em",
                textTransform: "capitalize",
              }}
            >
              {view === "month" &&
                `${mesesEnEspanol[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`}
              {view === "week" && (() => {
                const mon = new Date(calendarDate);
                mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
                const sun = new Date(mon);
                sun.setDate(sun.getDate() + 6);
                const fmt = (d: Date) =>
                  `${mesesEnEspanol[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
                return `${fmt(mon)} - ${fmt(sun)}, ${sun.getFullYear()}`;
              })()}
              {view === "day" &&
                `${mesesEnEspanol[calendarDate.getMonth()]} ${calendarDate.getDate()}, ${calendarDate.getFullYear()}`}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                const newDate = new Date(calendarDate);
                if (view === "month") {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (view === "week") {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setCalendarDate(newDate);
                setSelectedDate(null);
              }}
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: 1.5,
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Espaciador derecho para balancear el grid */}
          <Box />
        </Box>

        {/* Vista Mes */}
        {view === "month" && (
          <>
        {/* Días de la semana */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0,
            mb: 0,
            px: { xs: 1.5, md: 2 },
            py: 1,
            bgcolor: theme.palette.mode === "dark" ? "#1c252e" : undefined,
            borderTop:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : `1px solid ${theme.palette.divider}`,
            borderBottom:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.08)"
                : `1px solid ${theme.palette.divider}`,
          }}
        >
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <Typography
              key={day}
              variant="caption"
              sx={{
                textAlign: "center",
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "0.9375rem",
                py: 0.25,
                position: "relative",
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Días del calendario */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0,
            borderRadius: 0,
            overflow: "hidden",
          }}
        >
          {calendarDays.map((calendarDay, index) => {
            if (!calendarDay.day) {
              return (
                <Box
                  key={index}
                  sx={{
                    minHeight: 48,
                    borderRight:
                      index % 7 !== 6
                        ? theme.palette.mode === "dark"
                          ? "1px solid rgba(255,255,255,0.08)"
                          : `1px solid ${theme.palette.divider}`
                        : "none",
                    borderBottom:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.08)"
                        : `1px solid ${theme.palette.divider}`,
                    bgcolor:
                      theme.palette.mode === "dark" ? "#1c252e" : undefined,
                  }}
                />
              );
            }

            // Solo reuniones y tareas (sin eventos de Google ni notas)
            const allDayEvents = getAllEventsForDay(
              calendarDay.day,
              modalYear,
              modalMonth,
              allTasksWithDates,
              [], // sin eventos de Google Calendar
              [], // sin notas
              meetings,
            );

            const dayIsToday = isTodayUtil(calendarDay.date);

            // Limitar eventos visibles (mostrar máximo 3)
            const maxVisibleEvents = 3;
            const visibleEvents = allDayEvents.slice(0, maxVisibleEvents);
            const remainingEvents = allDayEvents.length - maxVisibleEvents;

            return (
              <Box
                key={index}
                onClick={() => {
                  if (calendarDay.isCurrentMonth) {
                    setSelectedDate(calendarDay.date);
                  }
                }}
                sx={{
                  minHeight: allDayEvents.length === 0 ? 48 : 110,
                  minWidth: 0,
                  borderRight:
                    index % 7 !== 6
                      ? theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.08)"
                        : `1px solid ${theme.palette.divider}`
                      : "none",
                  borderBottom:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255,255,255,0.08)"
                      : `1px solid ${theme.palette.divider}`,
                  borderRadius: 0,
                  p: 0.5,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "#1c252e"
                      : calendarDay.isCurrentMonth
                        ? theme.palette.background.paper
                        : "rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: calendarDay.isCurrentMonth ? "pointer" : "default",
                  position: "relative",
                }}
              >
                {/* Número del día */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mb: 0.25,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: dayIsToday
                        ? 800
                        : calendarDay.isCurrentMonth
                          ? 600
                          : 400,
                      fontSize: "0.875rem",
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: dayIsToday ? 32 : "auto",
                      height: dayIsToday ? 32 : "auto",
                      borderRadius: dayIsToday ? "50%" : 0,
                      background: dayIsToday ? "#FF6B35" : "transparent",
                      color: dayIsToday
                        ? "#fff"
                        : calendarDay.isCurrentMonth
                          ? theme.palette.text.primary
                          : theme.palette.text.disabled,
                      boxShadow: "none",
                    }}
                  >
                    {calendarDay.day}
                  </Typography>
                </Box>

                {/* Eventos */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.35,
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {visibleEvents.map((event, eventIndex) => (
                    <Box
                      key={event.id || eventIndex}
                      sx={{
                        bgcolor: event.color,
                        color: "#fff",
                        borderRadius: 0.75,
                        px: 0.75,
                        py: 0.5,
                        fontSize: "0.75rem",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        fontWeight: 500,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 2px 4px rgba(0,0,0,0.25)"
                            : "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      {event.time && (
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            mr: 0.5,
                          }}
                        >
                          {event.time}
                        </Typography>
                      )}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "0.8125rem",
                          fontWeight: 400,
                        }}
                      >
                        {truncateEventTitle(event.title, 32)}
                      </Typography>
                    </Box>
                  ))}

                  {/* "+X more" si hay más eventos */}
                  {remainingEvents > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(calendarDay.date);
                      }}
                    >
                      +{remainingEvents} more
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
          </>
        )}

        {/* Vista Semana */}
        {view === "week" && (
          <WeekView
            calendarDate={calendarDate}
            allTasksWithDates={allTasksWithDates}
            meetings={meetings}
            onEventClick={handleEventClick}
            theme={theme}
          />
        )}

        {/* Vista Día */}
        {view === "day" && (
          <DayView
            calendarDate={calendarDate}
            allTasksWithDates={allTasksWithDates}
            meetings={meetings}
            onEventClick={handleEventClick}
            theme={theme}
          />
        )}
      </Card>

      {/* Modal de detalles del evento */}
      <Dialog
        open={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
          setEventDetails(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            pt: 3,
            px: 3,
            mb: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {eventDetails?.isNote
              ? "Nota"
              : eventDetails?.isMeeting || eventDetails?.type === "meeting"
                ? "Reunión"
                : eventDetails?.type === "task"
                  ? "Tarea"
                  : eventDetails?.isGoogleEvent
                    ? "Evento de Google Calendar"
                    : "Evento"}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setEventModalOpen(false);
              setSelectedEvent(null);
              setEventDetails(null);
            }}
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{ pt: 4, px: 3, pb: 2, "&.MuiDialogContent-root": { pt: 4 } }}
        >
          {loadingEventDetails ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : eventDetails ? (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0 }}
            >
              {/* Título */}
              <TextField
                label="Título"
                value={
                  eventDetails.title || eventDetails.subject || "Sin título"
                }
                fullWidth
                disabled
                variant="outlined"
                sx={{
                  "& .MuiInputBase-input": {
                    fontWeight: 500,
                  },
                }}
              />

              {/* Descripción */}
              <TextField
                label="Descripción"
                value={eventDetails.description || "Sin descripción"}
                fullWidth
                multiline
                rows={4}
                disabled
                variant="outlined"
              />

              {/* Fecha de vencimiento */}
              {eventDetails.dueDate && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday
                    sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Fecha de vencimiento:{" "}
                    {(() => {
                      const fecha = new Date(eventDetails.dueDate);
                      return `${fecha.getDate()} de ${mesesEnEspanol[fecha.getMonth()]} de ${fecha.getFullYear()}`;
                    })()}
                  </Typography>
                </Box>
              )}

              {/* Prioridad y Estado */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {eventDetails.priority && (
                  <Chip
                    icon={<Flag sx={{ fontSize: 16 }} />}
                    label={getPriorityLabel(eventDetails.priority)}
                    size="small"
                    sx={{
                      bgcolor: getPriorityColor(eventDetails.priority).bg,
                      color: getPriorityColor(eventDetails.priority).color,
                      fontWeight: 500,
                    }}
                  />
                )}
                {eventDetails.status && (
                  <Chip
                    icon={<DonutSmall sx={{ fontSize: 16 }} />}
                    label={getStatusLabel(eventDetails.status)}
                    size="small"
                    sx={{
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.1)"
                          : "#F3F4F6",
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>

              {/* Asignado a */}
              {eventDetails.AssignedTo && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Person
                    sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Asignado a: {eventDetails.AssignedTo.firstName}{" "}
                    {eventDetails.AssignedTo.lastName}
                  </Typography>
                </Box>
              )}

              {/* Fecha de creación */}
              {eventDetails.createdAt && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday
                    sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Fecha de creación:{" "}
                    {new Date(eventDetails.createdAt).toLocaleDateString(
                      "es-ES",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </Typography>
                </Box>
              )}

              {/* Ubicación (para eventos de Google Calendar) */}
              {eventDetails.location && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    📍 {eventDetails.location}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Calendar;
