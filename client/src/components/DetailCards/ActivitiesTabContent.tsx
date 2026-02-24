import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Card,
  Checkbox,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Assignment } from "@mui/icons-material";
import { Trash } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { taxiMonterricoColors } from "../../theme/colors";

const TAB_OPTIONS = [
  { value: "all", label: "Actividades" },
  { value: "note", label: "Nota" },
  { value: "email", label: "Correo" },
  { value: "call", label: "Llamada" },
  { value: "task", label: "Tarea" },
  { value: "meeting", label: "Reunión" },
] as const;

const TAB_TO_TYPES: Record<string, string[]> = {
  note: ["note"],
  email: ["email"],
  call: ["call"],
  task: ["task", "todo", "other"],
  meeting: ["meeting"],
};

const ITEMS_PER_PAGE = 5;

interface ActivitiesTabContentProps {
  activities: any[];
  activitySearch: string;
  onSearchChange: (value: string) => void;
  onCreateActivity: (type: string) => void;
  onActivityClick: (activity: any) => void;
  onToggleComplete: (activity: any, completed: boolean) => void;
  onDelete?: (activity: any) => void | Promise<void>;
  completedActivities: { [key: number]: boolean };
  getActivityTypeLabel: (type: string) => string;
  getActivityStatusColor: (activity: any) => any;
  emptyMessage?: string;
}

const ActivitiesTabContent: React.FC<ActivitiesTabContentProps> = ({
  activities,
  activitySearch,
  onSearchChange,
  onCreateActivity,
  onActivityClick,
  onToggleComplete,
  onDelete,
  completedActivities,
  getActivityTypeLabel,
  getActivityStatusColor,
  emptyMessage = "No hay actividades registradas. Crea una nueva actividad para comenzar.",
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const getActivityTypeColor = (type: string) => {
    const t = type?.toLowerCase() || "";
    const colors = {
      note: isDark ? "#BDBDBD" : "#9E9E9E",
      email: "#09ADB4",
      call: "#05AE49",
      meeting: "#A31F9D",
      task: "#F59E00",
    };
    if (["task", "todo", "other"].includes(t)) return colors.task;
    return (colors as Record<string, string>)[t] ?? taxiMonterricoColors.green;
  };
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const isTaskActivity = (activity: any) => {
    const t = (activity.type || '').toLowerCase();
    return ['task', 'todo', 'other'].includes(t) || !!activity.isTask;
  };

  const counts = useMemo(() => {
    const getActivityType = (activity: any) => {
      let t = activity.type?.toLowerCase() || "";
      if (activity.isTask && !t) t = "task";
      return t;
    };
    const all = activities.length;
    const note = activities.filter((a) => getActivityType(a) === "note").length;
    const email = activities.filter((a) => getActivityType(a) === "email").length;
    const call = activities.filter((a) => getActivityType(a) === "call").length;
    const task = activities.filter((a) =>
      ["task", "todo", "other"].includes(getActivityType(a))
    ).length;
    const meeting = activities.filter((a) => getActivityType(a) === "meeting").length;
    return { all, note, email, call, task, meeting };
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (selectedFilter === "all") return activities;
    const allowed = TAB_TO_TYPES[selectedFilter];
    if (!allowed) return activities;
    return activities.filter((activity) => {
      let t = activity.type?.toLowerCase() || "";
      if (activity.isTask && !t) t = "task";
      return allowed.includes(t);
    });
  }, [activities, selectedFilter]);

  useEffect(() => {
    const total = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE) || 1;
    setCurrentPage((p) => Math.min(p, total));
  }, [filteredActivities.length]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedActivities = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActivities, safePage]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        boxShadow: "none",
        bgcolor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
        backgroundColor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
        background: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
        px: 2,
        py: 2,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: theme.palette.divider,
      }}
    >
      {/* Filtros por tipo (estilo pestañas con contador) */}
      <Box sx={{ mb: 3, px: 1, py: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            width: "fit-content",
            maxWidth: "100%",
            px: 0.4,
            py: 0.4,
            borderRadius: 2,
            bgcolor: theme.palette.background.default,
          }}
        >
          {TAB_OPTIONS.map((tab) => {
          const count =
            tab.value === "all"
              ? counts.all
              : counts[tab.value as keyof typeof counts] ?? 0;
          const isActive = selectedFilter === tab.value;
          return (
            <Box
              key={tab.value}
              onClick={() => setSelectedFilter(tab.value)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                cursor: "pointer",
                bgcolor: isActive
                  ? theme.palette.mode === "dark"
                    ? "rgba(46, 125, 50, 0.12)"
                    : "rgba(46, 125, 50, 0.06)"
                  : "transparent",
                boxShadow: isActive
                  ? theme.palette.mode === "dark"
                    ? "0 1px 3px rgba(0,0,0,0.2)"
                    : "0 1px 3px rgba(0,0,0,0.08)"
                  : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isActive
                    ? undefined
                    : theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.03)",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "0.75rem",
                  color: isActive
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                }}
              >
                {tab.label}
              </Typography>
              <Box
                sx={{
                  minWidth: 22,
                  height: 20,
                  px: 1,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.06)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                    color: isActive
                      ? taxiMonterricoColors.green
                      : theme.palette.text.secondary,
                  }}
                >
                  {count}
                </Typography>
              </Box>
            </Box>
          );
        })}
        </Box>
        {/* Línea divisoria: delgada, de borde a borde */}
        <Box
          sx={{
            mt: 3,
            mx: -2,
            width: "calc(100% + 32px)",
            height: 1,
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        />
      </Box>

      {/* Contenido de actividades */}
      {(() => {
        if (filteredActivities.length === 0) {
          return (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <Assignment
                  sx={{
                    fontSize: 48,
                    color: theme.palette.text.secondary,
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: theme.palette.text.primary,
                }}
              >
                No hay actividades registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 1, py: 0 }}>
            {paginatedActivities.map((activity) => (
              <Paper
                key={activity.id}
                onClick={() => onActivityClick(activity)}
                sx={{
                  p: 2,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "#1c252e"
                      : theme.palette.background.paper,
                  borderRadius: 1.5,
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "none",
                  boxShadow: "none",
                  "&:hover": {
                    opacity: 0.9,
                    boxShadow: "none",
                  },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: getActivityTypeColor(((activity as any).isTask || (activity as any).type === 'task') ? 'task' : ((activity as any).taskSubType || activity.type || '')),
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                      }}
                    >
                      {((activity as any).isTask || (activity as any).type === 'task') ? 'Tarea' : getActivityTypeLabel((activity as any).taskSubType || activity.type || '')}
                    </Typography>
                    {onDelete && (
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(activity);
                          }}
                          sx={{
                            p: 0.25,
                            color: theme.palette.error.main,
                            "&:hover": {
                              bgcolor: theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.12)" : "rgba(244, 67, 54, 0.08)",
                            },
                          }}
                        >
                          <Trash size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {activity.User && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      Por {activity.User.firstName} {activity.User.lastName}
                      {(activity.dueDate || activity.createdAt) && (
                        <span>
                          {" "}
                          •{" "}
                          {activity.dueDate ? "Vence: " : ""}
                          {new Date(activity.dueDate || activity.createdAt!).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      )}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {isTaskActivity(activity) && (
                    <Checkbox
                      checked={completedActivities[activity.id] || false}
                      disabled={completedActivities[activity.id] || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleComplete(activity, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{
                        p: 0.5,
                        "& .MuiSvgIcon-root": {
                          fontSize: 20,
                        },
                      }}
                    />
                  )}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      pr: 6,
                      flex: 1,
                      textDecoration: completedActivities[activity.id]
                        ? "line-through"
                        : "none",
                      opacity: completedActivities[activity.id] ? 0.6 : 1,
                    }}
                  >
                    {activity.subject || activity.title}
                  </Typography>
                </Box>
                {activity.description && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#F9FAFB",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        whiteSpace: "pre-wrap",
                        fontSize: "0.875rem",
                      }}
                    >
                      {activity.description
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 200)}
                      {activity.description.length > 200 ? "..." : ""}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 3,
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: theme.palette.divider,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Página {safePage} de {totalPages} ({filteredActivities.length} actividad{filteredActivities.length !== 1 ? "es" : ""})
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    sx={{ color: taxiMonterricoColors.green }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    sx={{ color: taxiMonterricoColors.green }}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        );
      })()}
    </Card>
  );
};

export default ActivitiesTabContent;
