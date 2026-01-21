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
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/tm_login.png';
import logoIcon from '../assets/logo.png';
import { taxiMonterricoColors } from '../theme/colors';
import { log } from '../utils/logger';

const Login: React.FC = () => {
  // Cargar usuario recordado al inicializar el estado
  const getRememberedUsername = () => {
    try {
      return localStorage.getItem('rememberedUsername') || '';
    } catch (e) {
      console.error('Error leyendo localStorage:', e);
      return '';
    }
  };

  const [username, setUsername] = useState(() => getRememberedUsername());
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = getRememberedUsername();
    return !!saved;
  });
  const { login, error: authError, user } = useAuth();
  const mountedRef = useRef(true);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  
  // Usar el error del contexto o el error local
  const error = authError || localError;
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    mountedRef.current = true;
    // Cargar credenciales guardadas si existen (por si acaso no se cargaron en el estado inicial)
    const savedUsername = getRememberedUsername();
    log('🔍 [useEffect] Verificando usuario recordado:', savedUsername);
    if (savedUsername && savedUsername !== username) {
      setUsername(savedUsername);
      setRememberMe(true);
      log('✅ [useEffect] Usuario recordado cargado:', savedUsername);
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar usuario recordado cuando el usuario se desautentica (después del logout)
  useEffect(() => {
    if (!user) {
      const savedUsername = getRememberedUsername();
      log('🔍 [useEffect user] Usuario desautenticado, verificando usuario recordado:', savedUsername);
      if (savedUsername && savedUsername !== username) {
        setUsername(savedUsername);
        setRememberMe(true);
        log('✅ [useEffect user] Usuario recordado cargado después del logout:', savedUsername);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  // Si el usuario ya está autenticado, no renderizar nada
  // Esto evita que el componente intente actualizar el estado después del desmontaje
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountedRef.current) return;
    
    setLocalError('');
    setLoading(true);

    // Guardar el estado de "Recordarme" ANTES de hacer login
    // para asegurarnos de que se guarde incluso si el componente se desmonta
    if (rememberMe && username) {
      localStorage.setItem('rememberedUsername', username);
      log('✅ Usuario guardado para recordar (antes del login):', username);
      log('🔍 Verificando guardado:', localStorage.getItem('rememberedUsername'));
    } else {
      localStorage.removeItem('rememberedUsername');
      log('🗑️ Usuario eliminado de recordar');
    }

    const success = await login(username, password);
    
    // Solo actualizar el estado si el componente todavía está montado
    if (mountedRef.current) {
      if (!success) {
        // El error ya está manejado en AuthContext
        setLocalError('Credenciales incorrectas o error de conexión');
      }
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: { xs: 2, sm: 3 },
      }}
    >
      {/* Fondo corporativo con gradientes y blobs sutiles */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0B1220',
          backgroundAttachment: 'fixed',
          backgroundImage: `
            radial-gradient(ellipse 1200px 900px at 10% 20%, rgba(255, 193, 7, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 1400px 1000px at 90% 80%, rgba(46, 125, 50, 0.18) 0%, transparent 65%),
            radial-gradient(ellipse 1600px 1200px at 50% 50%, rgba(46, 125, 50, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 1000px 800px at 0% 90%, rgba(255, 152, 0, 0.16) 0%, transparent 55%),
            radial-gradient(ellipse 1100px 850px at 100% 10%, rgba(46, 125, 50, 0.14) 0%, transparent 60%),
            radial-gradient(ellipse 900px 700px at 75% 35%, rgba(255, 193, 7, 0.13) 0%, transparent 50%)
          `,
          backgroundSize: '100% 100%',
          backgroundPosition: '0% 0%',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(ellipse 800px 600px at 25% 55%, rgba(46, 125, 50, 0.10) 0%, transparent 45%),
              radial-gradient(ellipse 600px 500px at 65% 25%, rgba(255, 183, 77, 0.12) 0%, transparent 45%)
            `,
            backgroundAttachment: 'fixed',
            zIndex: 1,
          },
        }}
      />
      
      {/* Card Glass Premium */}
      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 2,
          width: { xs: '92%', sm: '480px' },
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          background: 'rgba(17, 24, 39, 0.60)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          color: '#fff',
        }}
      >
        {/* Header de marca */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          {/* Contenedor de logos */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            <Box
              component="img"
              src={logoIcon}
              alt="TM Logo"
              sx={{
                maxWidth: { xs: '60px', sm: '70px' },
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
            <Box
              component="img"
              src={logoImage}
              alt="CRM Monterrico"
              sx={{
                maxWidth: { xs: '140px', sm: '160px' },
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          {/* Texto debajo de los logos */}
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              textAlign: 'center',
              fontWeight: 400,
            }}
          >
            Iniciar sesión
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => {
              setLocalError('');
            }}
            sx={{
              mb: 3,
              borderRadius: '8px',
              backgroundColor: 'rgba(211, 47, 47, 0.9)',
              color: '#fff',
              '& .MuiAlert-icon': {
                color: '#fff',
              },
            }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, marginTop: -2 }}>
          {/* Campo Usuario */}
          <TextField
            required
            fullWidth
            inputRef={usernameInputRef}
            id="username"
            placeholder="Usuario"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setLocalError('');
              // Deseleccionar el texto después de un pequeño delay para evitar la selección del autocompletado
              setTimeout(() => {
                if (usernameInputRef.current) {
                  const length = e.target.value.length;
                  usernameInputRef.current.setSelectionRange(length, length);
                }
              }, 0);
            }}
            onSelect={(e) => {
              // Deseleccionar el texto cuando se selecciona desde el autocompletado
              setTimeout(() => {
                if (usernameInputRef.current) {
                  const length = usernameInputRef.current.value.length;
                  usernameInputRef.current.setSelectionRange(length, length);
                }
              }, 0);
            }}
            onBlur={(e) => {
              // Deseleccionar el texto cuando el campo pierde el foco
              setTimeout(() => {
                if (usernameInputRef.current) {
                  const length = usernameInputRef.current.value.length;
                  usernameInputRef.current.setSelectionRange(length, length);
                }
              }, 0);
            }}
            onInput={(e) => {
              // Deseleccionar el texto inmediatamente cuando hay un cambio de input
              setTimeout(() => {
                if (usernameInputRef.current) {
                  const length = (e.target as HTMLInputElement).value.length;
                  usernameInputRef.current.setSelectionRange(length, length);
                }
              }, 0);
            }}
            error={!!error}
            helperText={error ? '' : undefined}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: error ? 'error.main' : 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                borderRadius: '25px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '25px',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: taxiMonterricoColors.green,
                },
                '&.Mui-error fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& input': {
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                  WebkitTextFillColor: '#fff',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '&:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                  WebkitTextFillColor: '#fff',
                },
                '&:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                  WebkitTextFillColor: '#fff',
                },
                '&:-webkit-autofill:active': {
                  WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.05) inset',
                  WebkitTextFillColor: '#fff',
                },
              },
              '& .MuiInputLabel-root': {
                display: 'none', // Ocultar el label
              },
              '& input::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1,
              },
              '& .MuiFormHelperText-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                '&.Mui-error': {
                  color: 'error.main',
                },
              },
            }}
          />

          {/* Campo Contraseña */}
          <TextField
            required
            fullWidth
            name="password"
            placeholder="Contraseña"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLocalError('');
            }}
            error={!!error}
            helperText={error ? '' : undefined}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: error ? 'error.main' : 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                borderRadius: '25px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius:'25px',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: taxiMonterricoColors.green,
                },
                '&.Mui-error fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& .MuiInputLabel-root': {
                display: 'none', // Ocultar el label
              },
              '& input::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1,
              },
              '& .MuiFormHelperText-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                '&.Mui-error': {
                  color: 'error.main',
                },
              },
            }}
          />

          {/* Recordarme y Olvidé contraseña */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: { xs: 1, sm: 2 },
              alignItems: 'center',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-checked': {
                      color: taxiMonterricoColors.green,
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                />
              }
              label={
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
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
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                  color: '#fff',
                },
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: taxiMonterricoColors.green,
                  outlineOffset: '2px',
                  borderRadius: '4px',
                },
              }}
            >
              ¿Olvidaste tu contraseña?
            </Typography>
          </Box>

          {/* Botón Ingresar */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              height: '48px',
              borderRadius: '15px',
              fontSize: '1.1rem',
              fontWeight: 400,
              textTransform: 'none',
              backgroundColor: taxiMonterricoColors.green,
              color: '#fff',
              '&:hover': {
                backgroundColor: taxiMonterricoColors.greenDark,
              },
              '&:disabled': {
                backgroundColor: 'rgba(46, 125, 50, 0.5)',
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '&:focus': {
                outline: '2px solid',
                outlineColor: taxiMonterricoColors.greenLight,
                outlineOffset: '2px',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: '#fff' }} />
                <span>Cargando...</span>
              </Box>
            ) : (
              'Ingresar'
            )}
          </Button>

          {/* Link de registro */}
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              color: 'rgba(255, 255, 255, 0.8)',
              mt: 1,
            }}
          >
            ¿Todavía no tienes una cuenta?{' '}
            <Typography
              component="a"
              href="https://wa.me/51958921766?text=Hola%20Jack,%20quiero%20registrar%20una%20nueva%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: 'inherit',
                color: taxiMonterricoColors.greenLight,
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                  color: taxiMonterricoColors.green,
                },
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: taxiMonterricoColors.green,
                  outlineOffset: '2px',
                  borderRadius: '4px',
                },
              }}
            >
              Regístrate
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;