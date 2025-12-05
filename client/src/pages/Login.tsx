import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/TM.png';
import loginImage from '../assets/img.login.png';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error: authError, user } = useAuth();
  const mountedRef = useRef(true);
  
  // Usar el error del contexto o el error local
  const error = authError || localError;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
      className="form-body form-left"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: { xs: 1, md: 1 },
        paddingLeft: { xs: 0, md: 0 },
        paddingRight: { xs: 0, md: 0 },
        backgroundColor: '#FFFFFF',
      }}
    >
      <Box
        className="iofrm-layout"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', md: 'center', lg: 'center' },
          gap: 0,
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: { md: '1400px', lg: '1600px', xl: '1800px' },
          margin: '0 auto',
          paddingLeft: { md: 0, lg: 0 },
          paddingRight: { md: 0, lg: 0 },
        }}
      >
        {/* Formulario de Login */}
        <Box
          className="form-holder"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: { md: 20, lg: 25 },
            maxWidth: '450px',
          }}
        >
          <Box
            className="form-content justify-content-end"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: 400,
            }}
          >
          {/* Header con logo */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 2,
            }}
          >
            <Box
              sx={{
                width: 96,
                height: 96,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={logo}
                alt="Taxi Monterrico Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>

          {/* Formulario */}
          <Box sx={{ p: 3, pt: 0, pb: 1.5 }}>
            {error && (
              <Alert
                severity="error"
                onClose={() => {
                  setLocalError('');
                }}
                sx={{
                  mb: 2,
                  borderRadius: 1,
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 0.5 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  placeholder="Usuario"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: username ? '#E8E8E8' : '#F7F7F7',
                      padding: '6px 14px',
                      '& input': {
                        padding: '6px 0',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#E8E8E8',
                        '& fieldset': {
                          border: 'none',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#757575',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#000000',
                    },
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  margin="normal"
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
                      borderRadius: 2,
                      backgroundColor: password ? '#E8E8E8' : '#F7F7F7',
                      padding: '6px 14px',
                      '& input': {
                        padding: '6px 0',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#E8E8E8',
                        '& fieldset': {
                          border: 'none',
                        },
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#757575',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#000000',
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.25,
                    px: 3,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    backgroundColor: '#FFC107',
                    color: '#FFFFFF',
                    border: 'none',
                    boxShadow: 'none',
                    flex: 1,
                    '&:hover': {
                      backgroundColor: '#FFB300',
                      border: 'none',
                      boxShadow: 'none',
                    },
                    '&:disabled': {
                      backgroundColor: '#FFE082',
                      color: '#FFFFFF',
                      border: 'none',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} sx={{ color: '#FFFFFF' }} />
                      <span>Loading...</span>
                    </Box>
                  ) : (
                    'Ingresar'
                  )}
                </Button>
                <Button
                  component="a"
                  href="https://wa.me/51958921766?text=Hola%20Jack,%20quiero%20registrar%20una%20nueva%20cuenta"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  sx={{
                    py: 1.25,
                    px: 3,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#FFC107',
                    borderColor: '#FFC107',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    flex: 1,
                    '&:hover': {
                      backgroundColor: '#FFF9E6',
                      borderColor: '#FFB300',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    },
                  }}
                >
                  Registrar
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  component="a"
                  href="https://wa.me/51958921766?text=Hola%20Jack,%20olvidé%20mi%20contraseña"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '0.875rem',
                    color: '#757575',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Olvidaste tu contraseña?
                </Typography>
              </Box>
            </Box>
          </Box>
          </Box>
        </Box>

        {/* Imagen a la derecha */}
        <Box
          className="img-holder text-start"
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            width: { md: '500px', lg: '600px' },
            marginLeft: { md: 0, lg: 0 },
          }}
        >
          <Box className="bg" sx={{ display: 'none' }} />
          <Box className="info-holder">
            <img
              src={loginImage}
              alt="Login illustration"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '700px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
