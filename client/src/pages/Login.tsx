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
} from '@mui/material';
import { Person, Lock } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/tm_logo.png';
import fondoImage from '../assets/tm_fondo.png';

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
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = getRememberedUsername();
    return !!saved;
  });
  const { login, error: authError, user } = useAuth();
  const mountedRef = useRef(true);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  
  // Usar el error del contexto o el error local
  const error = authError || localError;

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
        backgroundImage: `url(${fondoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          backgroundColor: 'rgba(245, 245, 245, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          width: '90%',
          maxWidth: '450px',
          padding: { xs: '24px 32px', sm: '30px 40px' },
          borderRadius: '16px',
          color: '#fff',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
        }}
      >
        {/* Título */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            textAlign: 'center',
            mb: 4,
            fontWeight: 500,
            color: '#fff',
          }}
        >
          Iniciar Sesión
        </Typography>

        {error && (
          <Alert
            severity="error"
            onClose={() => {
              setLocalError('');
            }}
            sx={{
              mb: 2,
              borderRadius: 1,
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

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Campo Usuario */}
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              height: '60px',
              borderRadius: '40px',
              padding: '0 20px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              '&:focus-within': {
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Person sx={{ color: '#fff', mr: 1.5, fontSize: 24 }} />
            <TextField
              required
              fullWidth
              inputRef={usernameInputRef}
              id="username"
              placeholder="Nombre de usuario"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none',
                  },
                },
                '& input': {
                  color: '#fff',
                  fontSize: '16px',
                  padding: '0',
                  '&::placeholder': {
                    color: '#fff',
                    opacity: 1,
                  },
                  '&::selection': {
                    backgroundColor: 'transparent',
                    color: '#fff',
                  },
                  '&::-moz-selection': {
                    backgroundColor: 'transparent',
                    color: '#fff',
                  },
                },
              }}
            />
          </Box>

          {/* Campo Contraseña */}
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              height: '60px',
              borderRadius: '40px',
              padding: '0 20px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              '&:focus-within': {
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Lock sx={{ color: '#fff', mr: 1.5, fontSize: 24 }} />
            <TextField
              required
              fullWidth
              name="password"
              placeholder="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none',
                  },
                },
                '& input': {
                  color: '#fff',
                  fontSize: '16px',
                  padding: '0',
                  '&::placeholder': {
                    color: '#fff',
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Recordarme y Olvidé contraseña */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              fontSize: '14.5px',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#fff',
                    '&.Mui-checked': {
                      color: '#fff',
                    },
                  }}
                />
              }
              label="Recordarme"
              sx={{
                color: '#fff',
                fontSize: '14.5px',
                '& .MuiFormControlLabel-label': {
                  fontSize: '14.5px',
                },
              }}
            />
            <Typography
              component="a"
              href="https://wa.me/51958921766?text=Hola%20Jack,%20olvidé%20mi%20contraseña"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: '14.5px',
                color: '#fff',
                textDecoration: 'none',
                cursor: 'pointer',
                alignSelf: 'center',
                '&:hover': {
                  textDecoration: 'underline',
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
            sx={{
              borderRadius: '30px',
              border: 0,
              outline: 0,
              fontSize: '15px',
              fontWeight: 500,
              padding: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? 'rgba(255, 255, 255, 0.5)' : '#fff',
              color: loading ? 'rgba(255, 255, 255, 0.7)' : '#000',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: loading ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#fff' }} />
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
              fontSize: '14.5px',
              color: '#fff',
            }}
          >
            ¿Todavía no tienes una cuenta?{' '}
            <Typography
              component="a"
              href="https://wa.me/51958921766?text=Hola%20Jack,%20quiero%20registrar%20una%20nueva%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: '14.5px',
                color: '#fff',
                textDecoration: 'none',
                cursor: 'pointer',
                marginLeft: '8px',
                '&:hover': {
                  textDecoration: 'underline',
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
