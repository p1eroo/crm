import React, { useState } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  Typography,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  Assignment,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { taxiMonterricoColors } from "../../theme/colors";

interface ActivitiesTabContentProps {
  activities: any[];
  activitySearch: string;
  onSearchChange: (value: string) => void;
  onCreateActivity: (type: string) => void;
  onActivityClick: (activity: any) => void;
  onToggleComplete: (activityId: number, completed: boolean) => void;
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
  completedActivities,
  getActivityTypeLabel,
  getActivityStatusColor,
  emptyMessage = "No hay actividades registradas. Crea una nueva actividad para comenzar.",
}) => {
  const theme = useTheme();

  // Estados internos para filtros
  const [activityFilterMenuAnchor, setActivityFilterMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [activityFilterSearch, setActivityFilterSearch] = useState("");
  const [timeRangeMenuAnchor, setTimeRangeMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<string>("Todo hasta ahora");
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    []
  );
  const [selectedActivityType, setSelectedActivityType] = useState("all");

  // Calcular el número de actividades filtradas para el botón
  const getFilteredCount = () => {
    let filtered = activities;
    if (selectedActivityTypes.length > 0) {
      const typeMap: { [key: string]: string[] } = {
        Nota: ["note"],
        Correo: ["email"],
        Llamada: ["call"],
        Tarea: ["task"],
        Reunión: ["meeting"],
      };
      filtered = filtered.filter((activity) => {
        let activityType = activity.type?.toLowerCase() || "";
        if (activity.isTask && !activityType) {
          activityType = "task";
        }
        return selectedActivityTypes.some((selectedType) => {
          const mappedTypes = typeMap[selectedType] || [];
          return mappedTypes.includes(activityType);
        });
      });
    }
    return filtered.length;
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.1)",
        bgcolor: theme.palette.background.paper,
        px: 2,
        py: 2,
        display: "flex",
        flexDirection: "column",
        border: "none",
      }}
    >
      {/* Barra de búsqueda y filtros */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar actividad"
          value={activitySearch}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            minWidth: "250px",
            "& .MuiOutlinedInput-root": {
              height: "36px",
              fontSize: "0.875rem",
              "&:hover": {
                "& fieldset": {
                  borderColor: taxiMonterricoColors.green,
                },
              },
              "&.Mui-focused": {
                "& fieldset": {
                  borderColor: taxiMonterricoColors.green,
                  borderWidth: 2,
                },
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          size="small"
          variant="outlined"
          endIcon={<ExpandMore />}
          onClick={(e) => setActivityFilterMenuAnchor(e.currentTarget)}
          sx={{
            borderColor: taxiMonterricoColors.green,
            color: taxiMonterricoColors.green,
            textTransform: "none",
            "&:hover": {
              borderColor: taxiMonterricoColors.green,
              backgroundColor: "rgba(46, 125, 50, 0.08)",
            },
          }}
        >
          Filtrar actividad ({getFilteredCount()}/{activities.length})
        </Button>
        <Button
          size="small"
          variant="outlined"
          endIcon={<ExpandMore />}
          onClick={(e) => setTimeRangeMenuAnchor(e.currentTarget)}
          sx={{
            borderColor: taxiMonterricoColors.green,
            color: taxiMonterricoColors.green,
            textTransform: "none",
            "&:hover": {
              borderColor: taxiMonterricoColors.green,
              backgroundColor: "rgba(46, 125, 50, 0.08)",
            },
          }}
        >
          {selectedTimeRange}
        </Button>
      </Box>

      {/* Menú de filtro de actividad */}
      <Menu
        anchorEl={activityFilterMenuAnchor}
        open={Boolean(activityFilterMenuAnchor)}
        onClose={() => setActivityFilterMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            borderRadius: 2,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 4px 20px rgba(0,0,0,0.5)"
                : "0 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar"
            fullWidth
            value={activityFilterSearch}
            onChange={(e) => setActivityFilterSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {["Nota", "Correo", "Llamada", "Tarea", "Reunión"]
          .filter((type) =>
            activityFilterSearch
              ? type.toLowerCase().includes(activityFilterSearch.toLowerCase())
              : true
          )
          .map((type) => {
            const isSelected = selectedActivityTypes.includes(type);
            return (
              <MenuItem
                key={type}
                onClick={() => {
                  if (isSelected) {
                    setSelectedActivityTypes(
                      selectedActivityTypes.filter((t) => t !== type)
                    );
                  } else {
                    setSelectedActivityTypes([...selectedActivityTypes, type]);
                  }
                }}
                sx={{
                  py: 1.5,
                  backgroundColor: isSelected
                    ? "rgba(46, 125, 50, 0.08)"
                    : "transparent",
                }}
              >
                <Checkbox
                  checked={isSelected}
                  size="small"
                  sx={{
                    color: taxiMonterricoColors.green,
                    "&.Mui-checked": {
                      color: taxiMonterricoColors.green,
                    },
                  }}
                />
                <Typography variant="body2">{type}</Typography>
              </MenuItem>
            );
          })}
      </Menu>

      {/* Menú de rango de tiempo */}
      <Menu
        anchorEl={timeRangeMenuAnchor}
        open={Boolean(timeRangeMenuAnchor)}
        onClose={() => setTimeRangeMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
          },
        }}
      >
        {[
          "Todo",
          "Hoy",
          "Ayer",
          "Esta semana",
          "Semana pasada",
          "Últimos 7 días",
        ].map((option) => (
          <MenuItem
            key={option}
            onClick={() => {
              setSelectedTimeRange(
                option === "Todo" ? "Todo hasta ahora" : option
              );
              setTimeRangeMenuAnchor(null);
            }}
            sx={{
              backgroundColor:
                selectedTimeRange === option ||
                (option === "Todo" && selectedTimeRange === "Todo hasta ahora")
                  ? theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)"
                  : "transparent",
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>

      {/* Tabs secundarios de tipo de actividad */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          mb: 3,
          borderBottom: `2px solid ${theme.palette.divider}`,
          overflowX: "auto",
        }}
      >
        {[
          { value: "all", label: "Actividad" },
          { value: "note", label: "Notas" },
          { value: "email", label: "Correos" },
          { value: "call", label: "Llamadas" },
          { value: "task", label: "Tareas" },
          { value: "meeting", label: "Reuniones" },
        ].map((tab) => (
          <Button
            key={tab.value}
            size="small"
            onClick={() => setSelectedActivityType(tab.value)}
            sx={{
              color:
                selectedActivityType === tab.value
                  ? taxiMonterricoColors.green
                  : theme.palette.text.secondary,
              textTransform: "none",
              fontWeight: selectedActivityType === tab.value ? 600 : 500,
              borderBottom:
                selectedActivityType === tab.value
                  ? `3px solid ${taxiMonterricoColors.green}`
                  : "3px solid transparent",
              borderRadius: 0,
              minWidth: "auto",
              px: 2.5,
              py: 1.5,
              "&:hover": {
                color: taxiMonterricoColors.green,
                bgcolor: "transparent",
              },
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Contenido de actividades */}
      {(() => {
        // Filtrar por búsqueda
        let filteredActivities = activitySearch
          ? activities.filter((activity) => {
              const searchTerm = activitySearch.toLowerCase();
              const subject = (
                activity.subject || activity.title || ""
              ).toLowerCase();
              const description = (activity.description || "").toLowerCase();
              return (
                subject.includes(searchTerm) || description.includes(searchTerm)
              );
            })
          : activities;

        // Filtrar por tipo de actividad (tab seleccionado)
        if (selectedActivityType !== "all") {
          const typeMap: { [key: string]: string } = {
            note: "note",
            email: "email",
            call: "call",
            task: "task",
            meeting: "meeting",
          };
          filteredActivities = filteredActivities.filter((activity) => {
            let activityType = activity.type?.toLowerCase() || "";
            if (activity.isTask && !activityType) {
              activityType = "task";
            }
            return activityType === typeMap[selectedActivityType];
          });
        }

        // Filtrar por tipos seleccionados en el menú de filtro
        if (selectedActivityTypes.length > 0) {
          const typeMap: { [key: string]: string[] } = {
            Nota: ["note"],
            Correo: ["email"],
            Llamada: ["call"],
            Tarea: ["task"],
            Reunión: ["meeting"],
          };
          filteredActivities = filteredActivities.filter((activity) => {
            let activityType = activity.type?.toLowerCase() || "";
            if (activity.isTask && !activityType) {
              activityType = "task";
            }
            return selectedActivityTypes.some((selectedType) => {
              const mappedTypes = typeMap[selectedType] || [];
              return mappedTypes.includes(activityType);
            });
          });
        }

        // Filtrar por rango de tiempo
        if (selectedTimeRange !== "Todo hasta ahora") {
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const startOfWeek = new Date(today);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
          const endOfLastWeek = new Date(startOfWeek);
          endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          filteredActivities = filteredActivities.filter((activity) => {
            const activityDate = new Date(activity.createdAt);
            const activityDay = new Date(
              activityDate.getFullYear(),
              activityDate.getMonth(),
              activityDate.getDate()
            );

            switch (selectedTimeRange) {
              case "Hoy":
                return activityDay.getTime() === today.getTime();
              case "Ayer":
                return activityDay.getTime() === yesterday.getTime();
              case "Esta semana":
                return activityDay >= startOfWeek && activityDay <= today;
              case "Semana pasada":
                return (
                  activityDay >= startOfLastWeek &&
                  activityDay <= endOfLastWeek
                );
              case "Últimos 7 días":
                return activityDay >= sevenDaysAgo && activityDay <= today;
              default:
                return true;
            }
          });
        }

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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filteredActivities.map((activity) => (
              <Paper
                key={activity.id}
                onClick={() => onActivityClick(activity)}
                sx={{
                  p: 2,
                  ...getActivityStatusColor(activity),
                  borderRadius: 1.5,
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "none",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 2px 8px rgba(0,0,0,0.3)"
                      : "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": {
                    opacity: 0.9,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 2px 8px rgba(0,0,0,0.3)"
                        : "0 2px 8px rgba(0,0,0,0.1)",
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
                  <Typography
                    variant="caption"
                    sx={{
                      color: taxiMonterricoColors.green,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {getActivityTypeLabel(activity.type)}
                  </Typography>
                  {activity.User && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      Por {activity.User.firstName} {activity.User.lastName}
                      {activity.createdAt && (
                        <span>
                          {" "}
                          •{" "}
                          {new Date(activity.createdAt).toLocaleDateString(
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
                  <Checkbox
                    checked={completedActivities[activity.id] || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleComplete(activity.id, e.target.checked);
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
          </Box>
        );
      })()}
    </Card>
  );
};

export default ActivitiesTabContent;
