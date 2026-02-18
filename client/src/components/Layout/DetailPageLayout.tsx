import React, { ReactNode, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
  Drawer,
} from "@mui/material";
import { taxiMonterricoColors } from "../../theme/colors";
import {
  History,
  Dashboard,
  Info,
  Timeline,
  Note,
  Email,
  Phone,
  Event,
  TaskAlt,
  Business,
  Close,
  Menu
} from "@mui/icons-material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNoteSticky,
  faPhone,
  faThumbtack,
  faCalendarWeek,
} from "@fortawesome/free-solid-svg-icons";

// Mapeo de nombres de iconos a objetos de FontAwesome
const iconMap: { [key: string]: any } = {
  "note-sticky": faNoteSticky,
  phone: faPhone,
  thumbtack: faThumbtack,
  "calendar-week": faCalendarWeek,
};

interface DetailField {
  label: string;
  value: string | ReactNode;
  show?: boolean;
}

interface ActivityLog {
  id: string | number;
  description: string;
  iconType?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  timestamp?: string;
}

interface DetailPageLayoutProps {
  // Header
  pageTitle?: string;
  breadcrumbItems: Array<{ label: string; path?: string }>;
  onBack: () => void;

  // Sidebar izquierdo
  avatarIcon: ReactNode;
  avatarBgColor?: string;
  /** Si se proporciona, el avatar muestra esta imagen (ej. logo de empresa) en lugar del icono */
  avatarSrc?: string | null;
  /** Si se proporciona, el avatar es clickeable (ej. para cambiar logo) */
  onAvatarClick?: () => void;
  entityName: string;
  entitySubtitle?: string;

  // Botones de actividades
  activityButtons?: Array<{
    icon: any;
    tooltip: string;
    onClick: () => void;
  }>;
  /** Contenido extra bajo el subtítulo (ej. botón Subir logo) */
  headerExtra?: ReactNode;

  // Detalles
  detailFields: DetailField[];
  onEditDetails?: () => void;
  editButtonText?: string;
  editDialog?: ReactNode;

  // Historial
  activityLogs?: ActivityLog[];
  loadingLogs?: boolean;

  // Contenido de tabs
  tab0Content: ReactNode;
  tab1Content: ReactNode;
  tab2Content: ReactNode;

  // Loading
  loading?: boolean;
}

const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  pageTitle,
  breadcrumbItems,
  onBack,
  avatarIcon,
  avatarBgColor = "#0d9394",
  avatarSrc,
  onAvatarClick,
  entityName,
  entitySubtitle,
  activityButtons = [],
  headerExtra,
  detailFields,
  onEditDetails,
  editButtonText = "Editar Detalles",
  editDialog,
  activityLogs = [],
  loadingLogs = false,
  tab0Content,
  tab1Content,
  tab2Content,
  loading = false,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [leftColumnOpen, setLeftColumnOpen] = useState(true);

  const renderLogIcon = (iconType?: string) => {
    switch (iconType) {
      case "note":
        return <Note sx={{ fontSize: 16 }} />;
      case "email":
        return <Email sx={{ fontSize: 16 }} />;
      case "call":
        return <Phone sx={{ fontSize: 16 }} />;
      case "meeting":
        return <Event sx={{ fontSize: 16 }} />;
      case "task":
        return <TaskAlt sx={{ fontSize: 16 }} />;
      case "company":
        return <Business sx={{ fontSize: 16 }} />;
      default:
        return <History sx={{ fontSize: 16 }} />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        mt: { xs: 2, sm: 3, md: 0 },
        pb: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Título de la página */}
      <Box
        sx={{
          pt: { xs: 2, sm: 1 },
          pb: 2,
          px: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {/* Breadcrumb */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: theme.palette.text.secondary,
          }}
        >
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    color: theme.palette.text.disabled,
                    mx: 0.25,
                  }}
                >
                  /
                </Typography>
              )}
              {item.path ? (
                <Typography
                  component="span"
                  onClick={() => {
                    if (item.path) window.location.href = item.path;
                  }}
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    cursor: "pointer",
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      color: theme.palette.text.primary,
                      textDecoration: "underline",
                    },
                  }}
                >
                  {item.label}
                </Typography>
              ) : (
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Box>

        {/* Título (solo si se proporciona) */}
        {pageTitle && (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.common.white,
              fontSize: { xs: "1.125rem", sm: "1.375rem", md: "1.5rem" },
            }}
          >
            {pageTitle}
          </Typography>
        )}
      </Box>

      {/* Contenido principal */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          flex: 1,
          overflow: { xs: "visible", md: "visible" },
          minHeight: { xs: "auto", md: 0 },
          gap: 2,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            alignItems: "flex-start",
          }}
        >
          {/* Columna Izquierda: Información del registro */}
          <Box
            sx={{
              width: { xs: "100%", md: leftColumnOpen ? 400 : 0 },
              flexShrink: 0,
              display: { xs: "block", md: leftColumnOpen ? "block" : "none" },
              overflow: "hidden",
              transition: "width 0.3s ease",
            }}
          >
            {/* Header Card */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                px: 2.5,
                pt: 6,
                pb: 2.5,
                mb: 2,
                bgcolor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
                backgroundColor: theme.palette.mode === "dark" ? "#1c252e !important" : theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                position: "relative",
              }}
            >
              {/* Botón de historia en esquina superior derecha */}
              <IconButton
                onClick={() => setHistoryDrawerOpen(true)}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  color: taxiMonterricoColors.green,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: `${taxiMonterricoColors.greenLight}15`,
                    transform: "scale(1.1)",
                  },
                }}
              >
                <History sx={{ fontSize: 27 }} />
              </IconButton>
              <Box
                onClick={onAvatarClick}
                sx={{
                  cursor: onAvatarClick ? "pointer" : "default",
                  position: "relative",
                  "&:hover": onAvatarClick
                    ? { "& .avatar-upload-hint": { opacity: 1 } }
                    : {},
                }}
              >
                <Avatar
                  src={avatarSrc || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    background: avatarSrc ? "transparent" : `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 3,
                    boxShadow: "none",
                    transition: "opacity 0.2s",
                  }}
                >
                  {!avatarSrc && avatarIcon}
                </Avatar>
                {onAvatarClick && (
                  <Box
                    className="avatar-upload-hint"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 3,
                      bgcolor: "rgba(0,0,0,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      pointerEvents: "none",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                      Cambiar
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.375rem",
                    textAlign: "center",
                    color: theme.palette.common.white,
                  }}
                >
                  {entityName}
                </Typography>
                {entitySubtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem", textAlign: "center" }}
                  >
                    {entitySubtitle}
                  </Typography>
                )}
                {headerExtra}
              </Box>

              {activityButtons.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    mt: 1,
                    mb: -1,
                  }}
                >
                  {activityButtons.map((button, index) => (
                    <Tooltip key={index} title={button.tooltip} arrow>
                      <IconButton
                        onClick={button.onClick}
                        sx={{
                          width: 48,
                          height: 48,
                          background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
                          color: "white",
                          boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}40`,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`,
                            boxShadow: `0 8px 20px ${taxiMonterricoColors.greenLight}60`,
                          },
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            typeof button.icon === "string"
                              ? iconMap[button.icon] || faNoteSticky
                              : Array.isArray(button.icon) &&
                                  button.icon.length === 2
                                ? iconMap[button.icon[1]] || faNoteSticky
                                : button.icon || faNoteSticky
                          }
                          style={{ fontSize: 20 }}
                        />
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: theme.palette.text.primary,
                  }}
                >
                  Detalles
                </Typography>

                <Divider
                  sx={{
                    width: "100%",
                    borderColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.08)",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    width: "100%",
                  }}
                >
                  {detailFields
                    .filter((field) => field.show !== false)
                    .map((field, index) => (
                      <Box key={index}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.palette.text.secondary,
                            mb: 0.25,
                          }}
                        >
                          {field.label}:
                        </Typography>
                        {typeof field.value === "string" ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.875rem",
                              color: theme.palette.text.primary,
                            }}
                          >
                            {field.value}
                          </Typography>
                        ) : (
                          field.value
                        )}
                      </Box>
                    ))}
                </Box>
              </Box>

              {onEditDetails && (
                <Box sx={{ display: "flex", gap: 1, width: "100%", mt: 2 }}>
                  <Button
                    onClick={onEditDetails}
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.25,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
                      color: "white",
                      boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}40`,
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                        transition: "left 0.5s ease",
                      },
                      "&:hover": {
                        background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`,
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 20px ${taxiMonterricoColors.greenLight}60`,
                        "&::before": {
                          left: "100%",
                        },
                      },
                    }}
                  >
                    {editButtonText}
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Columna Derecha: Tabs y contenido */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Tabs */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <IconButton
                onClick={() => setLeftColumnOpen(!leftColumnOpen)}
                sx={{
                  display: "flex",
                  borderRadius: 2,
                  px: 1.5,
                  py: 1.25,
                  minHeight: 44,
                  minWidth: 44,
                  color: theme.palette.text.secondary,
                  border: "none",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: `${taxiMonterricoColors.greenLight}15`,
                    borderColor: taxiMonterricoColors.greenLight,
                  },
                }}
              >
                <Menu />
              </IconButton>
              <Button
                onClick={() => setTabValue(0)}
                startIcon={<Dashboard />}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: tabValue === 0 ? 700 : 500,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1.25,
                  minHeight: 44,
                  background:
                    tabValue === 0
                      ? `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`
                      : "transparent",
                  color:
                    tabValue === 0 ? "white" : theme.palette.text.secondary,
                  border: tabValue === 0 ? "none" : "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  boxShadow:
                    tabValue === 0
                      ? `0 4px 12px ${taxiMonterricoColors.greenLight}40`
                      : "none",
                  "&:hover": {
                    background:
                      tabValue === 0
                        ? `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`
                        : `${taxiMonterricoColors.greenLight}15`,
                    borderColor:
                      tabValue === 0
                        ? "transparent"
                        : taxiMonterricoColors.greenLight,
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: 1,
                  },
                }}
              >
                Descripción General
              </Button>
              <Button
                onClick={() => setTabValue(1)}
                startIcon={<Info />}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: tabValue === 1 ? 700 : 500,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1.25,
                  minHeight: 44,
                  background:
                    tabValue === 1
                      ? `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`
                      : "transparent",
                  color:
                    tabValue === 1 ? "white" : theme.palette.text.secondary,
                  border: tabValue === 1 ? "none" : "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  boxShadow:
                    tabValue === 1
                      ? `0 4px 12px ${taxiMonterricoColors.greenLight}40`
                      : "none",
                  "&:hover": {
                    background:
                      tabValue === 1
                        ? `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`
                        : `${taxiMonterricoColors.greenLight}15`,
                    borderColor:
                      tabValue === 1
                        ? "transparent"
                        : taxiMonterricoColors.greenLight,
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: 1,
                  },
                }}
              >
                Información Avanzada
              </Button>
              <Button
                onClick={() => setTabValue(2)}
                startIcon={<Timeline />}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: tabValue === 2 ? 700 : 500,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1.25,
                  minHeight: 44,
                  background:
                    tabValue === 2
                      ? `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`
                      : "transparent",
                  color:
                    tabValue === 2 ? "white" : theme.palette.text.secondary,
                  border: tabValue === 2 ? "none" : "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  boxShadow:
                    tabValue === 2
                      ? `0 4px 12px ${taxiMonterricoColors.greenLight}40`
                      : "none",
                  "&:hover": {
                    background:
                      tabValue === 2
                        ? `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`
                        : `${taxiMonterricoColors.greenLight}15`,
                    borderColor:
                      tabValue === 2
                        ? "transparent"
                        : taxiMonterricoColors.greenLight,
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: 1,
                  },
                }}
              >
                Actividades
              </Button>
            </Box>

            {/* Contenido del tab seleccionado */}
            {tabValue === 0 && tab0Content}
            {tabValue === 1 && tab1Content}
            {tabValue === 2 && tab2Content}
          </Box>
        </Box>
      </Box>

      {/* Dialog de edición */}
      {editDialog}

      {/* Drawer de Historial de Cambios */}
      <Drawer
        anchor="right"
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        ModalProps={{
          BackdropProps: {
            sx: {
              backgroundColor: "transparent",
            },
          },
        }}
        sx={{
          zIndex: 1600,
        }}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 380, md: 420 },
            maxWidth: "100%",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 24px rgba(0,0,0,0.5)"
                : "0 8px 24px rgba(0,0,0,0.15)",
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            borderBottom: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* Header del Drawer */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Historial de Cambios
            </Typography>
            <IconButton
              onClick={() => setHistoryDrawerOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>

          {/* Contenido del historial con scroll */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 3,
              py: 2,
            }}
          >
            {loadingLogs ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : activityLogs.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: "0.75rem",
                  textAlign: "center",
                  py: 2,
                  fontStyle: "italic",
                }}
              >
                No hay registros disponibles
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {activityLogs.map((log, index) => (
                  <Box
                    key={log.id}
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "flex-start",
                      pb: index < activityLogs.length - 1 ? 1.5 : 0,
                      borderBottom:
                        index < activityLogs.length - 1
                          ? `1px solid ${
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.08)"
                            }`
                          : "none",
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.15)"
                            : "rgba(33, 150, 243, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      {renderLogIcon(log.iconType)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          mb: 0.25,
                        }}
                      >
                        {log.description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          flexWrap: "wrap",
                        }}
                      >
                        {log.user && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.6875rem",
                              color: theme.palette.text.secondary,
                            }}
                          >
                            {log.user.firstName} {log.user.lastName}
                          </Typography>
                        )}
                        {log.timestamp && (
                          <>
                            {log.user && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.6875rem",
                                  color: theme.palette.text.disabled,
                                }}
                              >
                                •
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.6875rem",
                                color: theme.palette.text.secondary,
                              }}
                            >
                              {new Date(log.timestamp).toLocaleDateString(
                                "es-ES",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default DetailPageLayout;
