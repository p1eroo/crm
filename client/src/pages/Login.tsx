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
  alpha,
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/tm_login.png';
import logoIcon from '../assets/logo.png';
import { taxiMonterricoColors } from '../theme/colors';

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
    console.log('🔍 [useEffect] Verificando usuario recordado:', savedUsername);
    if (savedUsername && savedUsername !== username) {
      setUsername(savedUsername);
      setRememberMe(true);
      console.log('✅ [useEffect] Usuario recordado cargado:', savedUsername);
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
      console.log('🔍 [useEffect user] Usuario desautenticado, verificando usuario recordado:', savedUsername);
      if (savedUsername && savedUsername !== username) {
        setUsername(savedUsername);
        setRememberMe(true);
        console.log('✅ [useEffect user] Usuario recordado cargado después del logout:', savedUsername);
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
      console.log('✅ Usuario guardado para recordar (antes del login):', username);
      console.log('🔍 Verificando guardado:', localStorage.getItem('rememberedUsername'));
    } else {
      localStorage.removeItem('rememberedUsername');
      console.log('🗑️ Usuario eliminado de recordar');
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
            animation: 'pulse 8s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.8,
              },
            },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(46, 125, 50, 0.05) 0%, transparent 70%)',
            animation: 'rotate 20s linear infinite',
            zIndex: 1,
            '@keyframes rotate': {
              '0%': {
                transform: 'rotate(0deg)',
              },
              '100%': {
                transform: 'rotate(360deg)',
              },
            },
          },
        }}
      />
      
      {/* Card Glass Premium */}
      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 2,
          width: { xs: '92%', sm: '500px' },
          padding: { xs: '32px', sm: '48px' },
          border: `1px solid ${alpha('#fff', 0.2)}`,
          borderRadius: '28px',
          background: `linear-gradient(135deg, ${alpha('#111827', 0.85)} 0%, ${alpha('#1a1a2e', 0.75)} 100%)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: `
            0 25px 70px rgba(0, 0, 0, 0.5),
            0 0 50px ${alpha(taxiMonterricoColors.green, 0.15)},
            inset 0 1px 0 ${alpha('#fff', 0.1)}
          `,
          color: '#fff',
          animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transition: 'all 0.4s ease',
          overflow: 'hidden',
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(40px) scale(0.95)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0) scale(1)'
            }
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle, ${alpha(taxiMonterricoColors.green, 0.1)} 0%, transparent 70%)`,
            animation: 'rotate 15s linear infinite',
            pointerEvents: 'none',
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }
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
              gap: 2.5,
              mb: 3,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box
              component="img"
              src={logoIcon}
              alt="TM Logo"
              sx={{
                maxWidth: { xs: '65px', sm: '75px' },
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(46, 125, 50, 0.4))',
                transition: 'all 0.3s ease',
                animation: 'logoFloat 3s ease-in-out infinite',
                '@keyframes logoFloat': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-5px)' }
                },
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  filter: 'drop-shadow(0 6px 16px rgba(46, 125, 50, 0.6))',
                }
              }}
            />
            <Box
              component="img"
              src={logoImage}
              alt="CRM Monterrico"
              sx={{
                maxWidth: { xs: '150px', sm: '170px' },
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
                }
              }}
            />
          </Box>
          {/* Texto debajo de los logos */}
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              color: 'white',
              fontSize: { xs: '1.6rem', sm: '1.9rem' },
              textAlign: 'center',
              fontWeight: 600,
              letterSpacing: '0.03em',
              mt: 1,
              position: 'relative',
              zIndex: 1,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
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
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              mb: 3,
              borderRadius: '12px',
              backgroundColor: alpha('#d32f2f', 0.95),
              color: '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#d32f2f', 0.3)}`,
              boxShadow: '0 4px 20px rgba(211, 47, 47, 0.3)',
              animation: 'shake 0.5s ease-in-out',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-5px)' },
                '75%': { transform: 'translateX(5px)' },
              },
              '& .MuiAlert-icon': {
                color: '#fff',
              },
              '& .MuiAlert-message': {
                fontWeight: 500,
                fontSize: '0.95rem',
              },
            }}
          >
            {error}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3, 
            marginTop: 1,
            position: 'relative',
            zIndex: 1
          }}
        >
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
                  <Person sx={{ color: error ? 'error.main' : alpha('#fff', 0.7), fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                backgroundColor: alpha('#fff', 0.08),
                color: '#fff',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderColor: alpha('#fff', 0.25),
                  borderWidth: '2px',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                },
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.12),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.4),
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: alpha('#fff', 0.1),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(taxiMonterricoColors.green, 0.3)}`,
                  '& fieldset': {
                    borderColor: taxiMonterricoColors.green,
                    borderWidth: '2px',
                    boxShadow: `0 0 0 3px ${alpha(taxiMonterricoColors.green, 0.1)}`,
                  },
                },
                '&.Mui-error': {
                  '& fieldset': {
                    borderColor: '#d32f2f',
                    borderWidth: '2px',
                  },
                },
              },
              '& input': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontSize: '1.05rem',
                fontWeight: 400,
                padding: '16px 18px',
                letterSpacing: '0.01em',
                '&:-webkit-autofill': {
                  WebkitBoxShadow: `0 0 0 1000px ${alpha('#fff', 0.08)} inset`,
                  WebkitTextFillColor: '#fff',
                  transition: 'background-color 5000s ease-in-out 0s',
                  borderRadius: '18px',
                },
                '&:-webkit-autofill:hover': {
                  WebkitBoxShadow: `0 0 0 1000px ${alpha('#fff', 0.12)} inset`,
                  WebkitTextFillColor: '#fff',
                },
                '&:-webkit-autofill:focus': {
                  WebkitBoxShadow: `0 0 0 1000px ${alpha('#fff', 0.1)} inset`,
                  WebkitTextFillColor: '#fff',
                },
                '&:-webkit-autofill:active': {
                  WebkitBoxShadow: `0 0 0 1000px ${alpha('#fff', 0.08)} inset`,
                  WebkitTextFillColor: '#fff',
                },
              },
              '& .MuiInputLabel-root': {
                display: 'none', // Ocultar el label
              },
              '& input::placeholder': {
                color: alpha('#fff', 0.6),
                opacity: 1,
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 300,
              },
              '& .MuiFormHelperText-root': {
                color: alpha('#fff', 0.6),
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
                  <Lock sx={{ color: error ? 'error.main' : alpha('#fff', 0.7), fontSize: '1.2rem' }} />
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
                      color: alpha('#fff', 0.7),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#fff',
                        backgroundColor: alpha('#fff', 0.2),
                        transform: 'scale(1.15) rotate(5deg)',
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
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                backgroundColor: alpha('#fff', 0.1),
                color: '#fff',
                borderRadius: '18px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${alpha(taxiMonterricoColors.green, 0.1)}, transparent)`,
                  transition: 'left 0.5s ease',
                },
                '& fieldset': {
                  borderColor: alpha('#fff', 0.3),
                  borderWidth: '2px',
                  borderRadius: '18px',
                  transition: 'all 0.3s ease',
                },
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.15),
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                  '& fieldset': {
                    borderColor: alpha('#fff', 0.5),
                  },
                  '&::before': {
                    left: '100%',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: alpha('#fff', 0.12),
                  transform: 'translateY(-3px)',
                  boxShadow: `0 10px 30px ${alpha(taxiMonterricoColors.green, 0.4)}`,
                  '& fieldset': {
                    borderColor: taxiMonterricoColors.green,
                    borderWidth: '2px',
                    boxShadow: `0 0 0 4px ${alpha(taxiMonterricoColors.green, 0.15)}`,
                  },
                  '&::before': {
                    left: '100%',
                  },
                },
                '&.Mui-error': {
                  '& fieldset': {
                    borderColor: '#d32f2f',
                    borderWidth: '2px',
                    boxShadow: `0 0 0 3px ${alpha('#d32f2f', 0.1)}`,
                  },
                },
              },
              '& input': {
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontSize: '1.05rem',
                fontWeight: 400,
                padding: '16px 18px',
                letterSpacing: '0.01em',
              },
              '& .MuiInputLabel-root': {
                display: 'none', // Ocultar el label
              },
              '& input::placeholder': {
                color: alpha('#fff', 0.6),
                opacity: 1,
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 300,
              },
              '& .MuiFormHelperText-root': {
                color: alpha('#fff', 0.6),
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
              mt: 1,
            }}
          >
            <FormControlLabel
              control={
                  <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: alpha('#fff', 0.7),
                    transition: 'all 0.2s ease',
                    '&.Mui-checked': {
                      color: taxiMonterricoColors.green,
                      transform: 'scale(1.1)',
                    },
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.1),
                      transform: 'scale(1.05)',
                    },
                  }}
                />
              }
              label={
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    color: alpha('#fff', 0.95),
                    fontWeight: 400,
                    letterSpacing: '0.01em',
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
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                color: alpha('#fff', 0.95),
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: 400,
                letterSpacing: '0.01em',
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  color: '#fff',
                  transform: 'translateX(2px)',
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
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              height: '56px',
              borderRadius: '18px',
              fontSize: '1.15rem',
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.03em',
              background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
              color: '#fff',
              boxShadow: `
                0 6px 25px ${alpha(taxiMonterricoColors.green, 0.45)},
                0 0 20px ${alpha(taxiMonterricoColors.green, 0.2)},
                inset 0 1px 0 ${alpha('#fff', 0.2)}
              `,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                transition: 'left 0.6s ease',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '0',
                height: '0',
                borderRadius: '50%',
                background: alpha('#fff', 0.2),
                transform: 'translate(-50%, -50%)',
                transition: 'width 0.6s ease, height 0.6s ease',
              },
              '&:hover': {
                background: `linear-gradient(135deg, ${taxiMonterricoColors.greenLight} 0%, ${taxiMonterricoColors.green} 100%)`,
                transform: 'translateY(-4px) scale(1.02)',
                boxShadow: `
                  0 12px 40px ${alpha(taxiMonterricoColors.green, 0.6)},
                  0 0 30px ${alpha(taxiMonterricoColors.green, 0.3)},
                  inset 0 1px 0 ${alpha('#fff', 0.3)}
                `,
                '&::before': {
                  left: '100%',
                },
                '&::after': {
                  width: '300px',
                  height: '300px',
                },
              },
              '&:active': {
                transform: 'translateY(-2px) scale(1)',
              },
              '&:disabled': {
                background: alpha(taxiMonterricoColors.green, 0.4),
                color: alpha('#fff', 0.7),
                boxShadow: 'none',
                transform: 'none',
                '&::before': {
                  display: 'none',
                },
                '&::after': {
                  display: 'none',
                },
              },
              '&:focus': {
                outline: '3px solid',
                outlineColor: taxiMonterricoColors.greenLight,
                outlineOffset: '4px',
                borderRadius: '18px',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={22} sx={{ color: '#fff' }} />
                <span style={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>Cargando...</span>
              </Box>
            ) : (
              'Ingresar'
            )}
          </Button>

          {/* Link de registro */}
          <Typography
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              textAlign: 'center',
              fontSize: { xs: '0.9rem', sm: '0.95rem' },
              color: alpha('#fff', 0.85),
              mt: 2,
              fontWeight: 300,
              letterSpacing: '0.01em',
            }}
          >
            ¿Todavía no tienes una cuenta?{' '}
            <Typography
              component="a"
              href="https://wa.me/51958921766?text=Hola%20Jack,%20quiero%20registrar%20una%20nueva%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                fontSize: 'inherit',
                color: taxiMonterricoColors.greenLight,
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.01em',
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  color: taxiMonterricoColors.green,
                  transform: 'translateX(2px)',
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