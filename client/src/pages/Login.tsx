import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-taxi-monterrico.svg';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Log para debug
      console.log('Intentando iniciar sesión con:', { username });
      console.log('API Monterrico: https://rest.monterrico.app/api/Licencias/Login');
      
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      console.error('Error en login:', err);
      let errorMessage = 'Error al iniciar sesión';
      
      // Manejar errores de la API de Monterrico
      if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'No se pudo conectar al servidor. Verifica la conexión de red.';
      }
      
      setError(errorMessage);
    } finally {
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
        padding: 2,
        backgroundColor: '#E1E7DC',
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
            backgroundColor: '#FFFFFF',
            border: '2px solid #000000',
            overflow: 'hidden',
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
            
            {/* Rectángulo con texto */}
            <Box
              sx={{
                width: 'calc(100% + 32px)',
                marginLeft: -2,
                marginRight: -2,
                backgroundColor: '#587565',
                borderTop: '2px solid #000000',
                borderBottom: '2px solid #000000',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: 0,
                p: 2,
                textAlign: 'center',
                mt: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontSize: '1.125rem',
                }}
              >
                Bienvenido
              </Typography>
            </Box>
          </Box>

          {/* Formulario */}
          <Box sx={{ p: 3, pt: 0, pb: 1.5 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 1,
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  mb: 0.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
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
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Button
                  type="submit"
                  variant="outlined"
                  disabled={loading}
                  sx={{
                    py: 1.25,
                    px: 3,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    borderColor: '#000000',
                    borderWidth: '2px',
                    '&:hover': {
                      backgroundColor: '#F5F5F5',
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                    '&:disabled': {
                      backgroundColor: '#F5F5F5',
                      color: '#9E9E9E',
                      borderColor: '#9E9E9E',
                      borderWidth: '2px',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} sx={{ color: '#9E9E9E' }} />
                      <span>Loading...</span>
                    </Box>
                  ) : (
                    'Login'
                  )}
                </Button>
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
                  Forget password?
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  component="a"
                  href="https://wa.me/51958921766?text=Hola%20Jack,%20quiero%20registrar%20una%20nueva%20cuenta"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#000000',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Register new account
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

