import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { taxiMonterricoColors } from '../../theme/colors';

const TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2;

interface InactivityLogoutProviderProps {
  children?: React.ReactNode;
}

/**
 * Activa el cierre de sesión por inactividad y muestra un aviso antes de cerrar.
 * Solo activo cuando hay usuario y no se está en /login.
 * Puede usarse con o sin children (ej. como sibling de Routes solo renderiza el modal).
 */
export const InactivityLogoutProvider: React.FC<InactivityLogoutProviderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = React.useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const {
    showWarning,
    remainingSeconds,
    stayLoggedIn,
    logoutNow,
  } = useInactivityLogout(handleLogout, {
    timeoutMinutes: TIMEOUT_MINUTES,
    warningMinutes: WARNING_MINUTES,
    enabled: !!user,
  });

  return (
    <>
      {children ?? null}
      <Dialog
        open={showWarning}
        onClose={stayLoggedIn}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Sesión inactiva
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Llevas un tiempo sin actividad. ¿Deseas seguir conectado?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            La sesión se cerrará en <strong>{remainingSeconds}</strong> segundos si no respondes.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={logoutNow}
            color="inherit"
            variant="outlined"
          >
            Cerrar sesión
          </Button>
          <Button
            onClick={stayLoggedIn}
            variant="contained"
            sx={{
              bgcolor: taxiMonterricoColors.green,
              '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
            }}
          >
            Seguir conectado
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
