import React from "react";
import { Box, useTheme, useMediaQuery, IconButton } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebar } from "../../context/SidebarContext";
import { useNotificationPanel } from "../../context/NotificationContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { open, collapsed, toggleCollapsed, toggleSidebar, layoutMode } =
    useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isHorizontal = layoutMode === "horizontal";
  const drawerWidth = collapsed ? (isMobile ? 0 : 90) : 300;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header sticky - debe estar fuera del contenedor con overflow */}
      <Box
        sx={{
          width: {
            xs: "100vw",
            sm: isHorizontal
              ? "100vw"
              : open
                ? `calc(100vw - ${drawerWidth}px)`
                : "100vw",
          },
          position: "sticky",
          top: 0,
          left: {
            xs: 0,
            sm: isHorizontal ? 0 : open ? `${drawerWidth}px` : 0,
          },
          zIndex: 1300,
        }}
      >
        <Header />
      </Box>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          width: "100vw",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        {/* Sidebar solo visible cuando no es horizontal */}
        {!isHorizontal && <Sidebar />}

        {/* Botón para expandir/contraer sidebar - solo cuando no es horizontal */}
        {!isMobile && !isHorizontal && (
          <IconButton
            onClick={() => {
              if (open) {
                toggleCollapsed();
              } else {
                toggleSidebar();
              }
            }}
            sx={{
              position: "fixed",
              left: open ? (collapsed ? 89 - 14 : 299 - 14) : -14, // Centrado en el borde: drawerWidth - mitad del ancho del botón (28px)
              top: { xs: 0, sm: 22 },
              zIndex: 1300, // Por encima del sidebar
              width: 28,
              height: 28,
              bgcolor: theme.palette.background.default,
              border:
                theme.palette.mode === "light"
                  ? "1px solid rgba(0, 0, 0, 0.05)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "light"
                    ? "rgba(0, 0, 0, 0.08)" // Gris más sólido
                    : "rgba(255, 255, 255, 0.12)",
                border:
                  theme.palette.mode === "light"
                    ? "1px solid rgba(0, 0, 0, 0.08)" // Borde más visible en hover para que se integre mejor
                    : "1px solid rgba(255, 255, 255, 0.12)",
              },
              transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {open && !collapsed ? (
              <KeyboardArrowLeft sx={{ fontSize: 18, color: "#637381" }} />
            ) : (
              <KeyboardArrowRight sx={{ fontSize: 18, color: "#637381" }} />
            )}
          </IconButton>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            marginLeft: {
              xs: 0,
              sm: isHorizontal ? 0 : open ? `${drawerWidth}px` : 0,
            },
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.background.default,
            minWidth: 0,
            boxSizing: "border-box",
            overflowY: "auto",
            paddingTop: { xs: "60px", sm: 0 },
            transition: "margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Box
            sx={{
              flex: 1,
              bgcolor: theme.palette.background.default,
              px: { xs: 3.5, sm: 5, md: 6, lg: 5, xl: 8 },
              pt: isHorizontal ? { xs: 3, sm: 4 } : { xs: 1.5, sm: 2.5 },
              pb: 0,
              width: "100%",
              maxWidth: { lg: "1400px", xl: "1600px" },
              mx: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
