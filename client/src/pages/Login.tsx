import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  LightMode,
  DarkMode,
  Monitor,
  Contacts,
  TrendingUp,
  BarChart,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/tm_login.png';
import logoIcon from '../assets/logo.png';
import logoTw from '../assets/logo_tm.png';
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
  '& .MuiOutlinedInput-root': {
    backgroundColor: isDark ? crmColors.formBgDark : crmColors.formBgLight,
    borderRadius: '12px',
    color: isDark ? crmColors.textSecondaryDark : crmColors.slate,
    '& input': {
      color: isDark ? crmColors.textSecondaryDark : crmColors.slate,
      WebkitTextFillColor: isDark ? crmColors.textSecondaryDark : crmColors.slate,
      '&::placeholder': {
        color: isDark ? crmColors.textSecondaryDark : crmColors.slateLight,
        opacity: 1,
      },
    },
    '& fieldset': {
      borderColor: isDark ? crmColors.borderDark : crmColors.borderLight,
      borderRadius: '12px',
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
          background: `linear-gradient(165deg, ${crmColors.darkBg} 0%, ${crmColors.panelDark} 40%, ${crmColors.panelGradient} 100%)`,
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <Box
              component="img"
              src={logoTw}
              alt="Taxi Monterrico"
              sx={{
                height: 100,
                width: 'auto',
                maxWidth: 320,
                objectFit: 'contain',
                mb: -1,
              }}
            />
          </Box>

          <Box sx={{ width: '100%', textAlign: 'left' }}>
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                mb: 2,
                fontSize: { md: '2rem', lg: '2.25rem' },
              }}
            >
              Todo tu equipo,
              <br />
              <Box component="span" sx={{ color: crmColors.primaryLight }}>
                una sola plataforma
              </Box>
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.78)',
                fontSize: '1.0625rem',
                lineHeight: 1.7,
              }}
            >
              Centraliza contactos, oportunidades y seguimientos. Accede desde cualquier lugar y mantén tu equipo alineado.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {[
              { label: 'Contactos', desc: 'Base de datos unificada', icon: Contacts },
              { label: 'Oportunidades', desc: 'Pipeline de ventas', icon: TrendingUp },
              { label: 'Reportes', desc: 'Métricas en tiempo real', icon: BarChart },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  py: 2.5,
                  px: 3,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.28)',
                    borderColor: 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    backgroundColor: 'rgba(76, 175, 80, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <item.icon sx={{ fontSize: 28, color: crmColors.primaryLight }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: 'white', fontSize: '1.0625rem', fontWeight: 600, mb: 0.4 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9375rem', lineHeight: 1.45 }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: '-15%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${crmColors.primary}25 0%, transparent 65%)`,
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
            background: `radial-gradient(circle, ${crmColors.accent}15 0%, transparent 65%)`,
            zIndex: 1,
          }}
        />
      </Box>

      {/* Panel derecho - Formulario */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 900px' },
          minHeight: { xs: 'auto', md: '100vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', sm: 'center' },
          padding: { xs: 3, sm: 6 },
          paddingTop: { xs: 15, sm: 6 },
          backgroundColor: isDark ? crmColors.formBgDark : crmColors.formBgLight,
          position: 'relative',
          zIndex: 2,
          borderTopLeftRadius: { xs: 0, md: '48px' },
          borderBottomLeftRadius: { xs: 0, md: '48px' },
          boxShadow: { xs: 'none', md: '-4px 0 24px rgba(0,0,0,0.15)' },
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
            gap: 0.5,
            p: 0.5,
            borderRadius: '9999px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <IconButton
            onClick={() => setMode('light')}
            size="small"
            sx={{
              p: 1,
              color: mode === 'light' ? '#F59E0B' : (isDark ? crmColors.textSecondaryDark : crmColors.slate),
              backgroundColor: mode === 'light' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)') : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: mode === 'light' ? undefined : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              },
            }}
            aria-label="Modo claro"
          >
            <LightMode sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            onClick={() => setMode('dark')}
            size="small"
            sx={{
              p: 1,
              color: mode === 'dark' ? crmColors.primaryLight : (isDark ? crmColors.textSecondaryDark : crmColors.slate),
              backgroundColor: mode === 'dark' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)') : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: mode === 'dark' ? undefined : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              },
            }}
            aria-label="Modo oscuro"
          >
            <DarkMode sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            onClick={() => setMode('system')}
            size="small"
            sx={{
              p: 1,
              color: mode === 'system' ? crmColors.primary : (isDark ? crmColors.textSecondaryDark : crmColors.slate),
              backgroundColor: mode === 'system' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)') : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: mode === 'system' ? undefined : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              },
            }}
            aria-label="Modo sistema"
          >
            <Monitor sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            maxWidth: 480,
            mx: 'auto',
            width: '100%',
            p: { xs: 3, sm: 4.5 },
            borderRadius: { xs: '16px', sm: '24px' },
            backgroundColor: isDark ? '#11182799' : crmColors.formCardLight,
            boxShadow: isDark
              ? '0 4px 6px rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.15)'
              : '0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box component="img" src={logoIcon} alt="TM" sx={{ width: 64, height: 64, objectFit: 'contain' }} />
            <Box component="img" src={logoImage} alt="CRM Monterrico" sx={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          </Box>

          {error && (
            <Alert
              severity="error"
              onClose={() => setLocalError('')}
              sx={{ mb: 3, borderRadius: '12px', '& .MuiAlert-message': { width: '100%' } }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.75 }}>
            <Box>
              <Typography
                component="label"
                htmlFor="username"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: muiTheme.palette.text.primary,
                  mb: 1,
                }}
              >
                Usuario
              </Typography>
              <TextField
                required
                fullWidth
                id="username"
                name="username"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => { setUsername(e.target.value); setLocalError(''); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: crmColors.slateLight, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={getInputStyles(isDark)}
              />
            </Box>

            <Box>
              <Typography
                component="label"
                htmlFor="password"
                sx={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: muiTheme.palette.text.primary,
                  mb: 1,
                }}
              >
                Contraseña
              </Typography>
              <TextField
                required
                fullWidth
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: crmColors.slateLight, fontSize: 20 }} />
                    </InputAdornment>
                  ),
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
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{ color: crmColors.slate, '&.Mui-checked': { color: crmColors.primary } }}
                  />
                }
                label={
                  <Typography sx={{ color: muiTheme.palette.text.secondary, fontSize: '0.875rem' }}>
                    Recordarme
                  </Typography>
                }
              />
              <Typography
                component="a"
                href="https://wa.me/51958921766?text=Hola%20Jack,%20olvidé%20mi%20contraseña"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: '0.875rem',
                  color: crmColors.primary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                ¿Olvidaste tu contraseña?
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              size="large"
              startIcon={
                loading ? (
                  <CircularProgress size={22} sx={{ color: 'white' }} />
                ) : (
                  <LoginIcon sx={{ fontSize: 22 }} />
                )
              }
              sx={{
                height: 52,
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                background: `linear-gradient(135deg, ${crmColors.primary} 0%, ${crmColors.primaryDark} 100%)`,
                boxShadow: `0 4px 16px ${crmColors.primaryGlow}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${crmColors.primaryLight} 0%, ${crmColors.primary} 100%)`,
                  boxShadow: `0 6px 24px ${crmColors.primaryGlow}`,
                },
                transition: 'all 0.25s ease',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: muiTheme.palette.text.secondary, mt: 1 }}>
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
