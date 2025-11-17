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

const Login: React.FC = () => {
  const [usuario, setUsuario] = useState('');
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
      console.log('Intentando iniciar sesión con:', { usuario });
      console.log('API Monterrico: https://rest.monterrico.app/api/Licencias/Login');
      
      await login(usuario, password);
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
        background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenLight} 50%, ${colors.orangeLight} 100%)`,
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logo/Título con estilo Taxi Monterrico */}
          <Box
            sx={{
              mb: 4,
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
                width: 120,
                height: 120,
                filter: 'drop-shadow(0 4px 20px rgba(46, 125, 50, 0.4))',
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
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: colors.white,
                mb: 0.5,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              CRM Taxi Monterrico
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.white,
                opacity: 0.9,
              }}
            >
              Inicia sesión para continuar
            </Typography>
          </Box>

          <Paper
            elevation={8}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 3,
              backgroundColor: colors.white,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
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
                id="usuario"
                label="Usuario"
                name="usuario"
                autoComplete="username"
                autoFocus
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: colors.grayLight,
                    },
                    '&:hover fieldset': {
                      borderColor: colors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.green,
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
                    },
                    '&:hover fieldset': {
                      borderColor: colors.green,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.green,
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
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.orangeLight} 100%)`,
                  boxShadow: `0 4px 15px rgba(255, 152, 0, 0.4)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colors.orangeLight} 0%, ${colors.orange} 100%)`,
                    boxShadow: `0 6px 20px rgba(255, 152, 0, 0.6)`,
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: colors.grayLight,
                    color: colors.gray,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: colors.white }} />
                    <span>Iniciando sesión...</span>
                  </Box>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>
          </Paper>

          {/* Información de credenciales (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: colors.white, opacity: 0.9 }}>
                Usuario: admin / Contraseña: admin123
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Login;

