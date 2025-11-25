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
        backgroundColor: '#E8F5E9', // Verde claro pastel
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
            border: '1px solid #000000',
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
          </Box>

          {/* Formulario */}
          <Box sx={{ p: 3 }}>
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
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      borderColor: '#000000',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '1px',
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
                    borderRadius: 1,
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      borderColor: '#000000',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '1px',
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
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    borderColor: '#000000',
                    borderWidth: '1px',
                    '&:hover': {
                      backgroundColor: '#F5F5F5',
                      borderColor: '#000000',
                      borderWidth: '1px',
                    },
                    '&:disabled': {
                      backgroundColor: '#F5F5F5',
                      color: '#9E9E9E',
                      borderColor: '#9E9E9E',
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
                  component={Link}
                  to="#"
                  sx={{
                    fontSize: '0.875rem',
                    color: '#757575',
                    textDecoration: 'none',
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
                  component={Link}
                  to="#"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#000000',
                    textDecoration: 'none',
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

