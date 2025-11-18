import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { keyframes } from '@mui/system';

// Paleta de colores Taxi Monterrico (basada en el logo)
const colors = {
  green: '#2E7D32', // Verde vibrante del círculo y letra "m"
  greenLight: '#4CAF50',
  greenDark: '#1B5E20',
  orange: '#FFA726', // Amarillo/Naranja dorado de la letra "t"
  orangeLight: '#FFB74D',
  orangeDark: '#FF9800',
  white: '#FFFFFF',
  gray: '#757575',
  grayLight: '#E0E0E0',
};

// Animación de movimiento del fondo
const gradientMove = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
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
      console.log('Intentando iniciar sesión con:', { email });
      console.log('API URL:', process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`);
      
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Error en login:', err);
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.response) {
        // Error de respuesta del servidor
        errorMessage = err.response.data?.error || err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        // Error de red (no se recibió respuesta)
        errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.';
        console.error('Detalles del error de red:', err.request);
      } else {
        // Otro tipo de error
        errorMessage = err.message || 'Error desconocido al iniciar sesión';
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
        backgroundColor: '#f5f5f5',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `linear-gradient(45deg, ${colors.greenLight}08 0%, transparent 25%, ${colors.green}10 50%, transparent 75%, ${colors.greenLight}08 100%)`,
          backgroundSize: '400% 400%',
          animation: `${gradientMove} 15s ease infinite`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at center, ${colors.greenLight}15 0%, ${colors.green}08 30%, transparent 70%)`,
          backgroundSize: '200% 200%',
          animation: `${gradientMove} 20s ease infinite reverse`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 4,
            backgroundColor: colors.white,
            border: `1px solid ${colors.grayLight}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Logo dentro del recuadro */}
            <Box
              sx={{
                mb: 3,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  width: 96,
                  height: 96,
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
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.75rem',
                  color: colors.green,
                  mb: 0.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                CRM
              </Typography>
            </Box>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  '& .MuiAlert-icon': {
                    color: '#C62828',
                  },
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
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: colors.grayLight,
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: colors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.green,
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: colors.green,
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: colors.grayLight,
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: colors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.green,
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: colors.green,
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.25,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  backgroundColor: colors.orange,
                  '&:hover': {
                    backgroundColor: colors.orangeDark,
                  },
                  '&:disabled': {
                    backgroundColor: colors.grayLight,
                    color: colors.gray,
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                    <span>Iniciando sesión...</span>
                  </Box>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

