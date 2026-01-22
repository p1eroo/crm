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
          py: { xs: 2, md: 2.5 },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
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
                  height: { xs: 45, md: 50 },
                  objectFit: 'contain',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: taxiMonterricoColors.green,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                CRM Taxi Monterrico
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: taxiMonterricoColors.green,
                color: '#fff',
                px: { xs: 2.5, md: 3 },
                py: { xs: 1, md: 1.25 },
                fontSize: { xs: '0.875rem', md: '1rem' },
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: taxiMonterricoColors.greenDark,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}40`,
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
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(46, 125, 50, 0.02) 100%)`,
          py: { xs: 6, md: 10 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: `radial-gradient(circle at center, ${taxiMonterricoColors.green}08 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 4, md: 6 },
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  color: theme.palette.text.primary,
                  mb: 3,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                Gestiona tus relaciones comerciales de manera{' '}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  eficiente
                </Box>
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                paragraph
                sx={{ 
                  mb: 4,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  maxWidth: '600px',
                }}
              >
                Plataforma CRM completa para gestionar empresas, contactos, negocios y tareas.
                Optimiza tus procesos comerciales y aumenta tu productividad.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                    color: '#fff',
                    px: { xs: 3, md: 4 },
                    py: { xs: 1.25, md: 1.5 },
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: `0 4px 14px ${taxiMonterricoColors.green}30`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${taxiMonterricoColors.green}40`,
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
                  opacity: 0.95,
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box 
        sx={{ 
          py: { xs: 6, md: 10 },
          backgroundColor: theme.palette.background.default,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 800,
                mb: 2,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Características Principales
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ 
                maxWidth: '700px',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
              }}
            >
              Todo lo que necesitas para gestionar tus relaciones comerciales
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: { xs: 3, md: 4 },
            }}
          >
            {features.map((feature, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: index % 3 === 2 
                      ? `linear-gradient(90deg, ${taxiMonterricoColors.orange} 0%, ${taxiMonterricoColors.orangeDark} 100%)`
                      : `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                      : '0 12px 40px rgba(46, 125, 50, 0.15)',
                    borderColor: index % 3 === 2 ? taxiMonterricoColors.orange : taxiMonterricoColors.green,
                    '&::before': {
                      transform: 'scaleX(1)',
                    },
                    '& .feature-icon-wrapper': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
              >
                <Box 
                  className="feature-icon-wrapper"
                  sx={{ 
                    mb: 3,
                    p: 2,
                    borderRadius: '16px',
                    background: index % 3 === 2
                      ? `linear-gradient(135deg, ${taxiMonterricoColors.orange}15 0%, ${taxiMonterricoColors.orange}05 100%)`
                      : `linear-gradient(135deg, ${taxiMonterricoColors.green}15 0%, ${taxiMonterricoColors.green}05 100%)`,
                    display: 'inline-flex',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    mb: 1.5,
                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                    color: theme.palette.text.primary,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    lineHeight: 1.7,
                    fontSize: { xs: '0.9rem', md: '0.95rem' },
                  }}
                >
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
          position: 'relative',
          py: { xs: 6, md: 10 },
          background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              ¿Listo para comenzar?
            </Typography>
            <Typography 
              variant="h6" 
              paragraph 
              sx={{ 
                mb: 5,
                fontSize: { xs: '1rem', md: '1.25rem' },
                opacity: 0.95,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Accede a tu cuenta y comienza a gestionar tus relaciones comerciales hoy mismo.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: 'white',
                color: taxiMonterricoColors.green,
                px: { xs: 4, md: 5 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : '#f8f9fa',
          borderTop: `2px solid ${theme.palette.divider}`,
          py: { xs: 5, md: 6 },
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: { xs: 4, md: 6 },
              mb: 4,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  component="img"
                  src={logoImage}
                  alt="Taxi Monterrico"
                  sx={{
                    height: { xs: 45, md: 50 },
                    objectFit: 'contain',
                  }}
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${taxiMonterricoColors.orange} 0%, ${taxiMonterricoColors.green} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                  }}
                >
                  CRM Taxi Monterrico
                </Typography>
              </Box>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  maxWidth: '500px',
                  lineHeight: 1.7,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                Plataforma de gestión de relaciones comerciales diseñada para optimizar tus procesos
                y aumentar tu productividad empresarial.
              </Typography>
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700, 
                  mb: 3,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  color: theme.palette.text.primary,
                }}
              >
                Información Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Link
                  to="/privacy"
                  style={{
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    display: 'inline-block',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = taxiMonterricoColors.green;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.palette.text.secondary;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  Política de Privacidad
                </Link>
                <Link
                  to="/terms"
                  style={{
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    display: 'inline-block',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = taxiMonterricoColors.green;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.palette.text.secondary;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  Términos de Servicio
                </Link>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              pt: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.85rem', md: '0.9rem' },
              }}
            >
              © {new Date().getFullYear()} Taxi Monterrico. Todos los derechos reservados.
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.85rem', md: '0.9rem' },
                opacity: 0.7,
              }}
            >
              Desarrollado con tecnología empresarial
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;

