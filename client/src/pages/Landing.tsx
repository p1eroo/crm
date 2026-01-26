import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Groups,
  People,
  CheckCircle,
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
                color: theme.palette.common.white,
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
                    color: theme.palette.common.white,
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

      {/* Stats Section */}
      <Box
        sx={{
          pt: { xs: 6, md: 8 },
          pb: 0,
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: { xs: 3, md: 4 },
            }}
          >
            {[
              {
                icon: <Groups sx={{ fontSize: 40, color: taxiMonterricoColors.green }} />,
                number: '500+',
                label: 'Empresas Activas',
                color: taxiMonterricoColors.green,
              },
              {
                icon: <People sx={{ fontSize: 40, color: taxiMonterricoColors.orange }} />,
                number: '10K+',
                label: 'Contactos Gestionados',
                color: taxiMonterricoColors.orange,
              },
              {
                icon: <TrendingUp sx={{ fontSize: 40, color: taxiMonterricoColors.green }} />,
                number: '99.9%',
                label: 'Uptime Garantizado',
                color: taxiMonterricoColors.green,
              },
              {
                icon: <CheckCircle sx={{ fontSize: 40, color: taxiMonterricoColors.orange }} />,
                number: '24/7',
                label: 'Soporte Disponible',
                color: taxiMonterricoColors.orange,
              },
            ].map((stat, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: 'center',
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  border: `2px solid ${theme.palette.divider}`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: 0,
                  animation: `fadeInUp 0.6s ease forwards ${index * 0.1 + 0.3}s`,
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${stat.color} 0%, ${stat.color}80 100%)`,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.4s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? `0 15px 40px rgba(0, 0, 0, 0.4), 0 0 30px ${stat.color}30`
                      : `0 15px 40px rgba(46, 125, 50, 0.15), 0 0 30px ${stat.color}20`,
                    borderColor: stat.color,
                    '&::before': {
                      transform: 'scaleX(1)',
                    },
                    '& .stat-icon': {
                      transform: 'scale(1.15) rotate(5deg)',
                    },
                    '& .stat-number': {
                      color: stat.color,
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              >
                <Box
                  className="stat-icon"
                  sx={{
                    mb: 2,
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  className="stat-number"
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: theme.palette.text.primary,
                    transition: 'all 0.3s ease',
                    background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}80 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Video Section */}
      <Box
        id="video-section"
        sx={{
          pt: { xs: -40, md: -50 },
          pb: { xs: 3, md: 4 },
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : '#f8f9fa',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 1, md: 1.5 } }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Ve el CRM en Acción
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: '700px',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.6,
                mb: 1,
              }}
            >
              Descubre cómo nuestra plataforma puede transformar la gestión de tus relaciones comerciales
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'relative',
              maxWidth: '800px',
              mx: 'auto',
              mt: 0,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 50px rgba(0, 0, 0, 0.5)'
                : '0 20px 50px rgba(0, 0, 0, 0.15)',
              border: `2px solid ${theme.palette.divider}`,
              transition: 'all 0.4s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 25px 60px rgba(0, 0, 0, 0.6)'
                  : '0 25px 60px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%', // 16:9 aspect ratio
                background: `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? '#0a0a0a' : '#000'} 0%, ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#111'} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at center, ${taxiMonterricoColors.green}10 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  zIndex: 0,
                },
              }}
            >
              {/* Placeholder para video - Reemplazar con iframe o componente de video real */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: '70px', md: '85px' },
                    height: { xs: '70px', md: '85px' },
                    mb: 1.5,
                    cursor: 'pointer',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${taxiMonterricoColors.green}40, ${taxiMonterricoColors.orange}40)`,
                      animation: 'ripple 2s infinite',
                      '@keyframes ripple': {
                        '0%': {
                          transform: 'scale(1)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'scale(1.5)',
                          opacity: 0,
                        },
                      },
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${taxiMonterricoColors.green}30, ${taxiMonterricoColors.orange}30)`,
                      animation: 'ripple 2s infinite 0.5s',
                    },
                  }}
                  onClick={() => {
                    // Aquí puedes agregar la lógica para abrir el video
                    // Por ejemplo, abrir un modal con el video o redirigir a YouTube/Vimeo
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.25)',
                        transform: 'scale(1.1)',
                        boxShadow: `0 0 40px ${taxiMonterricoColors.green}50`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 0,
                        height: 0,
                        borderLeft: { xs: '18px solid white', md: '22px solid white' },
                        borderTop: { xs: '14px solid transparent', md: '17px solid transparent' },
                        borderBottom: { xs: '14px solid transparent', md: '17px solid transparent' },
                        marginLeft: { xs: '4px', md: '6px' },
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                      }}
                    />
                  </Box>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '1rem', md: '1.15rem' },
                    textAlign: 'center',
                    px: 2,
                    mb: 0.5,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  Ver Video Demostrativo
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: '0.85rem', md: '0.9rem' },
                    textAlign: 'center',
                    px: 2,
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  Haz clic para reproducir
                </Typography>
              </Box>
              {/* 
                Para agregar un video real, descomenta y reemplaza con tu URL:
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/TU_VIDEO_ID"
                  title="Video demostrativo CRM"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
              */}
            </Box>
          </Box>
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: taxiMonterricoColors.green,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                      transform: 'scale(1)',
                    },
                    '50%': {
                      opacity: 0.6,
                      transform: 'scale(1.3)',
                    },
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                Duración: 3 minutos
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.orange}30`,
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: taxiMonterricoColors.orange,
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                HD Quality
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 8, md: 12 },
          background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%)`,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translateY(0) rotate(0deg)',
              },
              '50%': {
                transform: 'translateY(-20px) rotate(5deg)',
              },
            },
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
                fontSize: { xs: '2rem', md: '2.75rem' },
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                animation: 'fadeInUp 0.8s ease',
                '@keyframes fadeInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
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
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              Accede a tu cuenta y comienza a gestionar tus relaciones comerciales hoy mismo.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  backgroundColor: 'white',
                  color: taxiMonterricoColors.green,
                  px: { xs: 4, md: 6 },
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 700,
                  borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
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
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    transition: 'left 0.5s ease',
                  },
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(-2px) scale(0.98)',
                  },
                }}
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  const videoSection = document.getElementById('video-section');
                  if (videoSection) {
                    videoSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  px: { xs: 4, md: 6 },
                  py: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 600,
                  borderRadius: 3,
                  textTransform: 'none',
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                Ver Demo
              </Button>
            </Box>
            <Box
              sx={{
                mt: 5,
                display: 'flex',
                gap: 3,
                justifyContent: 'center',
                flexWrap: 'wrap',
                opacity: 0.9,
              }}
            >
              {[
                { icon: '✓', text: 'Sin tarjeta de crédito' },
                { icon: '✓', text: 'Configuración en minutos' },
                { icon: '✓', text: 'Soporte 24/7' },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '0.875rem', md: '0.95rem' },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="body2" sx={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}>
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : theme.palette.grey[50],
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

