import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Monitor,
  Info,
} from '@mui/icons-material';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoTw from '../assets/logo_tm.png';
import imgLogin from '../assets/imglogin.png';
import { crmColors } from '../theme/colors';

const REMEMBER_KEY = 'rememberedUsername';

const getRememberedUsername = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) || '';
  } catch (e) {
    console.error('Error leyendo localStorage:', e);
    return '';
  }
};

const getInputStyles = (isDark: boolean) => ({
  '& .MuiInputLabel-root': {
    color: isDark ? crmColors.textSecondaryDark : '#637381',
    fontSize: '0.9rem',
    transform: 'translate(14px, -9px) scale(0.75)',
    backgroundColor: isDark ? crmColors.formBgDark : crmColors.formBgLight,
    px: 0.75,
    '&.Mui-focused': {
      color: crmColors.primary,
    },
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: isDark ? crmColors.formBgDark : crmColors.formBgLight,
    borderRadius: '8px',
    color: isDark ? crmColors.textSecondaryDark : '#000000',
    '& input': {
      color: isDark ? '#ffffff' : '#000000',
      WebkitTextFillColor: isDark ? '#ffffff' : '#000000',
      fontSize: '0.875rem',
    },
    '& fieldset': {
      borderColor: isDark ? crmColors.borderDark : crmColors.borderLight,
      borderRadius: '8px',
    },
    '&:hover fieldset': {
      borderColor: isDark ? crmColors.borderHoverDark : crmColors.borderHoverLight,
    },
    '&.Mui-focused fieldset': {
      borderColor: crmColors.primary,
      borderWidth: '2px',
    },
  },
});

const Login: React.FC = () => {
  const muiTheme = useMuiTheme();
  const { mode, setMode } = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const [username, setUsername] = useState(() => getRememberedUsername());
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!getRememberedUsername());

  const { login, error: authError, user } = useAuth();
  const mountedRef = useRef(true);
  const usernameRef = useRef(username);
  usernameRef.current = username;

  const error = authError || localError;

  useEffect(() => {
    mountedRef.current = true;
    const saved = getRememberedUsername();
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      const saved = getRememberedUsername();
      if (saved && saved !== usernameRef.current) {
        setUsername(saved);
        setRememberMe(true);
      }
    }
  }, [user]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountedRef.current) return;
    setLocalError('');
    setLoading(true);

    const usernameNorm = username.trim().toLowerCase();
    if (rememberMe && usernameNorm) {
      localStorage.setItem(REMEMBER_KEY, usernameNorm);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    const success = await login(usernameNorm, password);
    if (mountedRef.current) {
      if (!success) setLocalError('Credenciales incorrectas o error de conexión');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'auto', md: '100vh' },
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Fondo completo - panel izquierdo */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'linear-gradient(165deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)'
            : 'linear-gradient(165deg, #ffffff 0%, #f1f5f9 40%, #e2e8f0 100%)',
          zIndex: 0,
        }}
      />

      {/* Contenido izquierdo - Branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Logo esquina superior izquierda */}
        <Box
          sx={{
            position: 'absolute',
            top: 24,
            left: 32,
            zIndex: 3,
          }}
        >
          <Box
            component="img"
            src={logoTw}
            alt="Taxi Monterrico"
            sx={{
              height: 42,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Box>

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 560,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 6,
          }}
        >
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                color: isDark ? 'white' : '#1a2e1a',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                mb: 2,
                fontSize: { md: '1.5rem', lg: '1.75rem' },
              }}
            >
              Todo tu equipo,
              <br />
              <Box component="span" sx={{ color: crmColors.primaryLight }}>
                una sola plataforma
              </Box>
            </Typography>
          </Box>

          <Box
            component="img"
            src={imgLogin}
            alt="CRM Preview"
            sx={{
              width: '110%',
              maxWidth: 'none',
              height: 'auto',
              objectFit: 'contain',
              alignSelf: 'flex-start',
              ml: -4,
            }}
          />

          <Typography
            sx={{
              color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(30,60,30,0.7)',
              fontSize: '0.9rem',
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            Centraliza contactos, oportunidades y seguimientos. Accede desde cualquier lugar y mantén tu equipo alineado.
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: '-15%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: isDark
              ? `radial-gradient(circle, ${crmColors.primary}25 0%, transparent 65%)`
              : `radial-gradient(circle, ${crmColors.primary}18 0%, transparent 65%)`,
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '5%',
            left: '-8%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: isDark
              ? `radial-gradient(circle, ${crmColors.accent}15 0%, transparent 65%)`
              : `radial-gradient(circle, ${crmColors.accent}12 0%, transparent 65%)`,
            zIndex: 1,
          }}
        />
      </Box>

      {/* Panel derecho - Formulario */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 1400px' },
          minHeight: { xs: 'auto', md: '100vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', sm: 'center' },
          padding: { xs: 3, sm: 6 },
          paddingTop: { xs: 15, sm: 6 },
          backgroundColor: isDark ? crmColors.formBgDark : crmColors.formBgLight,
          position: 'relative',
          zIndex: 2,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          boxShadow: 'none',
        }}
      >
        {/* Selector de tema - pill */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            p: 0.5,
            borderRadius: '40px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <IconButton
            onClick={() => setMode('light')}
            size="small"
            sx={{
              p: 0.85,
              color: mode === 'light' ? '#F59E0B' : (isDark ? crmColors.textSecondaryDark : crmColors.slate),
              backgroundColor: mode === 'light' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)') : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: mode === 'light' ? undefined : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              },
            }}
            aria-label="Modo claro"
          >
            <Sun size={18} color="currentColor" />
          </IconButton>
          <IconButton
            onClick={() => setMode('dark')}
            size="small"
            sx={{
              p: 0.85,
              color: mode === 'dark' ? crmColors.primaryLight : (isDark ? crmColors.textSecondaryDark : crmColors.slate),
              backgroundColor: mode === 'dark' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)') : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: mode === 'dark' ? undefined : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              },
            }}
            aria-label="Modo oscuro"
          >
            <Moon size={18} color="currentColor" />
          </IconButton>
          <IconButton
            onClick={() => setMode('system')}
            size="small"
            sx={{
              p: 0.85,
              color: mode === 'system' ? crmColors.primary : (isDark ? crmColors.textSecondaryDark : crmColors.slate),
              backgroundColor: mode === 'system' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)') : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: mode === 'system' ? undefined : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              },
            }}
            aria-label="Modo sistema"
          >
            <Monitor sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            maxWidth: 480,
            mx: 'auto',
            width: '100%',
            p: { xs: 3, sm: 4.5 },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              color: muiTheme.palette.text.primary,
              textAlign: 'left',
              mb: 1.5,
            }}
          >
            Iniciar sesión
          </Typography>
          <Typography sx={{ textAlign: 'left', fontSize: '0.875rem', color: muiTheme.palette.text.secondary, mb: 5 }}>
            ¿Todavía no tienes una cuenta?{' '}
            <Typography
              component="a"
              href="https://wa.me/51958921766?text=Hola%20Jack,%20quiero%20registrar%20una%20nueva%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: 'inherit',
                color: crmColors.primary,
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Regístrate
            </Typography>
          </Typography>

          {error && (
            <Alert
              severity="error"
              onClose={() => setLocalError('')}
              sx={{ mb: 3, borderRadius: '8px', '& .MuiAlert-message': { width: '100%' } }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.75 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                mb: 1,
                borderRadius: '8px',
                backgroundColor: isDark ? '#003768' : '#cafdf5',
                border: 'none',
              }}
            >
              <Info sx={{ fontSize: 24, color: isDark ? '#cafdf5' : '#003768', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.85rem', color: isDark ? '#cafdf5' : '#003768' }}>
                Usa tu cuenta del <strong>tmsystem</strong>
              </Typography>
            </Box>
            <TextField
              required
              fullWidth
              id="username"
              name="username"
              label="Usuario"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => { setUsername(e.target.value); setLocalError(''); }}
              sx={getInputStyles(isDark)}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1.5 }}>
              <Typography
                component="a"
                href="https://wa.me/51958921766?text=Hola%20Jack,%20olvidé%20mi%20contraseña"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: '0.8125rem',
                  color: isDark ? '#ffffff' : '#000000',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                ¿Olvidaste tu contraseña?
              </Typography>
            </Box>
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                      sx={{ color: crmColors.slateLight }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={getInputStyles(isDark)}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              size="large"
              startIcon={
                loading ? (
                  <CircularProgress size={22} sx={{ color: isDark ? '#1a1a1a' : '#ffffff' }} />
                ) : undefined
              }
              sx={{
                height: 48,
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                backgroundColor: isDark ? '#ffffff' : '#1a1a1a',
                color: isDark ? '#1a1a1a' : '#ffffff',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: isDark ? '#e0e0e0' : '#333333',
                  boxShadow: 'none',
                },
                transition: 'all 0.25s ease',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>

          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
