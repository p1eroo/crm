import React, { useState, useEffect } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebar } from "../../context/SidebarContext";
import { LoginWelcomeModal } from "../Notifications/LoginWelcomeModal";
import { NotificationDetail } from "../Notifications/NotificationDetail";
import { Notification } from "../../types/notification";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotificationPanel } from "../../context/NotificationContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { open, collapsed, layoutMode } = useSidebar();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isHorizontal = layoutMode === "horizontal";
  const drawerWidth = collapsed ? (isMobile ? 0 : 90) : 300;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isReportsPage = location.pathname === "/reports";
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const { markAsRead } = useNotificationPanel();

  // Detectar si el usuario acaba de hacer login
  useEffect(() => {
    if (user) {
      const showLoginWelcome = localStorage.getItem('showLoginWelcome');
      if (showLoginWelcome === 'true') {
        // Esperar un poco para que las notificaciones se carguen
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    // Marcar que ya se mostró el modal para no mostrarlo de nuevo
    localStorage.removeItem('showLoginWelcome');
  };

  const handleNotificationClick = (notification: Notification) => {
    // Si es la notificación de empresas inactivas, abrir el drawer de detalles
    if (notification.id === 'inactivity-alert') {
      setSelectedNotification(notification);
      setDetailDrawerOpen(true);
      handleCloseWelcomeModal();
      // Marcar como leída
      markAsRead(notification.id);
    } else if (notification.type === 'task' || notification.type === 'event') {
      // Por ahora, tareas/reuniones no llevan a ninguna vista: solo marcar como leída
      markAsRead(notification.id);
      handleCloseWelcomeModal();
    } else if (notification.actionUrl) {
      // Para otras notificaciones, navegar normalmente
      navigate(notification.actionUrl);
      handleCloseWelcomeModal();
    }
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification({ ...selectedNotification, read: true });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Header sticky */}
      <Box
        sx={{
          width: {
            xs: "100vw",
            sm: isHorizontal ? "100vw" : open ? `calc(100vw - ${drawerWidth}px)` : "100vw",
          },
          position: "sticky",
          top: 0,
          left: { xs: 0, sm: isHorizontal ? 0 : open ? `${drawerWidth}px` : 0 },
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

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            marginLeft: { xs: 0, sm: isHorizontal ? 0 : open ? `${drawerWidth}px` : 0 },
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.background.default,
            minWidth: 0,
            boxSizing: "border-box",
            overflowY: "auto",
            paddingTop: { xs: "64px", sm: 0 },
            transition: "margin-left 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Box
            sx={{
              flex: 1,
              bgcolor: theme.palette.background.default,
              pl: isReportsPage ? { xs: 2, sm: 2.5, md: 3 } : { xs: 3.5, sm: 5, md: 6, lg: 5, xl: 8 },
              pr: isReportsPage ? { xs: 2, sm: 2.5, md: 3 } : { xs: 4.5, sm: 6, md: 7, lg: 6, xl: 9 },
              pt: isHorizontal ? { xs: 3, sm: 4 } : { xs: 1.5, sm: 2.5 },
              pb: 0,
              width: "100%",
              maxWidth: isReportsPage ? "none" : { lg: "1680px", xl: "1680px" },
              marginLeft: "auto",
              marginRight: "auto",
              boxSizing: "border-box",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* Modal de bienvenida después del login */}
      <LoginWelcomeModal
        open={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        onNotificationClick={handleNotificationClick}
      />

      {/* Drawer de detalles de notificación */}
      <NotificationDetail
        open={detailDrawerOpen}
        notification={selectedNotification}
        onClose={handleCloseDetailDrawer}
        onMarkAsRead={handleMarkAsRead}
      />
    </Box>
  );
};

export default MainLayout;
