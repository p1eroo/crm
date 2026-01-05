import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Business,
  People,
  AttachMoney,
  Assignment,
  Security,
  Speed,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { taxiMonterricoColors } from '../theme/colors';
import logoImage from '../assets/tm_login.png';

const Landing: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Business sx={{ fontSize: 40, color: taxiMonterricoColors.green }} />,
      title: 'Gestión de Empresas',
      description: 'Administra toda la información de tus clientes y empresas en un solo lugar.',
    },
    {
      icon: <People sx={{ fontSize: 40, color: taxiMonterricoColors.green }} />,
      title: 'Contactos',
      description: 'Mantén un registro completo de todos tus contactos comerciales.',
    },
    {
      icon: <AttachMoney sx={{ fontSize: 40, color: taxiMonterricoColors.orange }} />,
      title: 'Pipeline de Ventas',
      description: 'Gestiona tus negocios y oportunidades de venta de manera eficiente.',
    },
    {
      icon: <Assignment sx={{ fontSize: 40, color: taxiMonterricoColors.green }} />,
      title: 'Tareas y Seguimiento',
      description: 'Organiza tus actividades y nunca pierdas una oportunidad.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: taxiMonterricoColors.green }} />,
      title: 'Seguro y Confiable',
      description: 'Tus datos están protegidos con las mejores prácticas de seguridad.',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: taxiMonterricoColors.orange }} />,
      title: 'Fácil de Usar',
      description: 'Interfaz intuitiva diseñada para aumentar tu productividad.',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={logoImage}
                alt="Taxi Monterrico"
                sx={{
                  height: 50,
                  objectFit: 'contain',
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700, color: taxiMonterricoColors.green }}>
                CRM Taxi Monterrico
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: taxiMonterricoColors.green,
                '&:hover': {
                  backgroundColor: taxiMonterricoColors.greenDark,
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          py: 8,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 3,
                }}
              >
                Gestiona tus relaciones comerciales de manera eficiente
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                paragraph
                sx={{ mb: 4 }}
              >
                Plataforma CRM completa para gestionar empresas, contactos, negocios y tareas.
                Optimiza tus procesos comerciales y aumenta tu productividad.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    backgroundColor: taxiMonterricoColors.green,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': {
                      backgroundColor: taxiMonterricoColors.greenDark,
                    },
                  }}
                >
                  Comenzar Ahora
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={logoImage}
                alt="CRM Taxi Monterrico"
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  opacity: 0.9,
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: theme.palette.background.default }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Características Principales
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 6 }}
          >
            Todo lo que necesitas para gestionar tus relaciones comerciales
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 4,
            }}
          >
            {features.map((feature, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                      : '0 8px 16px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          py: 6,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              backgroundColor: taxiMonterricoColors.green,
              color: 'white',
            }}
          >
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              ¿Listo para comenzar?
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              Accede a tu cuenta y comienza a gestionar tus relaciones comerciales hoy mismo.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: 'white',
                color: taxiMonterricoColors.green,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 4,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  component="img"
                  src={logoImage}
                  alt="Taxi Monterrico"
                  sx={{
                    height: 40,
                    objectFit: 'contain',
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  CRM Taxi Monterrico
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Plataforma de gestión de relaciones comerciales diseñada para optimizar tus procesos
                y aumentar tu productividad.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Información Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  to="/privacy"
                  style={{
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = taxiMonterricoColors.green;
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.palette.text.secondary;
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  Política de Privacidad
                </Link>
                <Link
                  to="/terms"
                  style={{
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = taxiMonterricoColors.green;
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.palette.text.secondary;
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  Términos de Servicio
                </Link>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                © {new Date().getFullYear()} Taxi Monterrico. Todos los derechos reservados.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;

