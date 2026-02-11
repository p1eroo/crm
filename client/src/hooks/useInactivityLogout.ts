import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TIMEOUT_MINUTES = 30;
const DEFAULT_WARNING_MINUTES = 2;

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

export interface UseInactivityLogoutOptions {
  /** Minutos sin actividad antes de cerrar sesión (por defecto 30) */
  timeoutMinutes?: number;
  /** Minutos antes del cierre en que se muestra el aviso "¿Seguir conectado?" (por defecto 2) */
  warningMinutes?: number;
  /** Si false, no se activa el temporizador (ej. en /login) */
  enabled?: boolean;
}

export interface UseInactivityLogoutReturn {
  /** Si true, mostrar el modal de aviso */
  showWarning: boolean;
  /** Segundos restantes antes del cierre (para mostrar en el modal) */
  remainingSeconds: number;
  /** Llamar cuando el usuario elige "Seguir conectado" */
  stayLoggedIn: () => void;
  /** Llamar cuando el usuario elige "Cerrar sesión" desde el modal */
  logoutNow: () => void;
}

export function useInactivityLogout(
  onLogout: () => void,
  options: UseInactivityLogoutOptions = {}
): UseInactivityLogoutReturn {
  const {
    timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
    warningMinutes = DEFAULT_WARNING_MINUTES,
    enabled = true,
  } = options;

  const location = useLocation();
  const skipBecauseLogin = location.pathname === '/login';

  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;
  const mainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (mainTimerRef.current) {
      clearTimeout(mainTimerRef.current);
      mainTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowWarning(false);
  }, []);

  const startTimers = useCallback(() => {
    if (!enabled || skipBecauseLogin) return;

    clearAllTimers();

    const timeUntilWarning = timeoutMs - warningMs;

    mainTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(warningMinutes * 60);
      mainTimerRef.current = null;

      const countdownEnd = Date.now() + warningMs;
      countdownIntervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((countdownEnd - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left <= 0 && countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }, 1000);

      warningTimerRef.current = setTimeout(() => {
        warningTimerRef.current = null;
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setShowWarning(false);
        onLogout();
      }, warningMs);
    }, timeUntilWarning);
  }, [enabled, skipBecauseLogin, timeoutMs, warningMs, warningMinutes, clearAllTimers, onLogout]);

  const handleActivity = useCallback(() => {
    if (!enabled || skipBecauseLogin) return;
    startTimers();
  }, [enabled, skipBecauseLogin, startTimers]);

  const stayLoggedIn = useCallback(() => {
    clearAllTimers();
    startTimers();
  }, [clearAllTimers, startTimers]);

  const logoutNow = useCallback(() => {
    clearAllTimers();
    onLogout();
  }, [clearAllTimers, onLogout]);

  useEffect(() => {
    if (!enabled || skipBecauseLogin) return;
    startTimers();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity));
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearAllTimers();
    };
  }, [enabled, skipBecauseLogin, startTimers, handleActivity, clearAllTimers]);

  return {
    showWarning,
    remainingSeconds,
    stayLoggedIn,
    logoutNow,
  };
}
