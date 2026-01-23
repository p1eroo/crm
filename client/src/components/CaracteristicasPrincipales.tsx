/**
 * 🚀 Componente de Características Principales
 * 
 * Sección profesional y moderna que muestra las características
 * principales del CRM con diseño avanzado y efectos visuales
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  Container
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  Mouse as MouseIcon
} from '@mui/icons-material';

interface Caracteristica {
  id: string;
  icono: React.ReactElement;
  titulo: string;
  descripcion: string;
  colorIcono: string;
  gradiente: string;
}

const caracteristicas: Caracteristica[] = [
  {
    id: 'empresas',
    icono: <BusinessIcon sx={{ fontSize: 48 }} />,
    titulo: 'Gestión de Empresas',
    descripcion: 'Administra toda la información de tus clientes y empresas en un solo lugar.',
    colorIcono: '#4CAF50',
    gradiente: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
  },
  {
    id: 'contactos',
    icono: <PeopleIcon sx={{ fontSize: 48 }} />,
    titulo: 'Contactos',
    descripcion: 'Mantén un registro completo de todos tus contactos comerciales.',
    colorIcono: '#4CAF50',
    gradiente: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
  },
  {
    id: 'pipeline',
    icono: <AttachMoneyIcon sx={{ fontSize: 48 }} />,
    titulo: 'Pipeline de Ventas',
    descripcion: 'Gestiona tus negocios y oportunidades de venta de manera eficiente.',
    colorIcono: '#FF9800',
    gradiente: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
  },
  {
    id: 'tareas',
    icono: <AssignmentIcon sx={{ fontSize: 48 }} />,
    titulo: 'Tareas y Seguimiento',
    descripcion: 'Organiza tus actividades y nunca pierdas una oportunidad.',
    colorIcono: '#4CAF50',
    gradiente: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
  },
  {
    id: 'seguridad',
    icono: <SecurityIcon sx={{ fontSize: 48 }} />,
    titulo: 'Seguro y Confiable',
    descripcion: 'Tus datos están protegidos con las mejores prácticas de seguridad.',
    colorIcono: '#4CAF50',
    gradiente: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
  },
  {
    id: 'facil',
    icono: <MouseIcon sx={{ fontSize: 48 }} />,
    titulo: 'Fácil de Usar',
    descripcion: 'Interfaz intuitiva diseñada para aumentar tu productividad.',
    colorIcono: '#FF9800',
    gradiente: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
  }
];

const CaracteristicasPrincipales: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Helvetica está disponible por defecto en la mayoría de sistemas
  // No necesitamos cargar fuentes externas

  return (
    <Box
      sx={{
        position: 'relative',
        py: { xs: 8, md: 12 },
        px: { xs: 2, md: 4 },
        background: isDark
          ? 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(180deg, #f5f7fa 0%, #c3cfe2 100%)',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'radial-gradient(circle at 30% 20%, rgba(76, 175, 80, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 152, 0, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 30% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255, 152, 0, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(76, 175, 80, 0.03) 0%, transparent 70%)',
          animation: 'pulse 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
              opacity: 1
            },
            '50%': {
              transform: 'scale(1.1)',
              opacity: 0.8
            }
          }
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Encabezado */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 6, md: 8 },
            animation: 'fadeInDown 0.8s ease-out',
            '@keyframes fadeInDown': {
              '0%': {
                opacity: 0,
                transform: 'translateY(-30px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            }
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              fontWeight: 700,
              fontSize: { xs: '2.8rem', md: '4.2rem', lg: '4.8rem' },
              mb: 2,
              background: isDark
                ? 'linear-gradient(135deg, #ffffff 0%, #4CAF50 50%, #FF9800 100%)'
                : 'linear-gradient(135deg, #1a1a2e 0%, #4CAF50 50%, #FF9800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: isDark
                ? '0 0 40px rgba(76, 175, 80, 0.3)'
                : 'none',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              textTransform: 'none',
              fontStyle: 'normal',
              fontVariant: 'normal'
            }}
          >
            Características Principales
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
              color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
              fontWeight: 300,
              fontSize: { xs: '1.2rem', md: '1.45rem' },
              maxWidth: '750px',
              mx: 'auto',
              lineHeight: 1.75,
              letterSpacing: '0.01em',
              fontStyle: 'normal',
              fontVariant: 'normal'
            }}
          >
            Todo lo que necesitas para gestionar tus relaciones comerciales
          </Typography>
        </Box>

        {/* Grid de Características */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 4
          }}
        >
          {caracteristicas.map((caracteristica, index) => (
            <Card
              key={caracteristica.id}
                sx={{
                  height: '100%',
                  position: 'relative',
                  background: isDark
                    ? `linear-gradient(135deg, ${alpha('#1a1a2e', 0.9)} 0%, ${alpha('#16213e', 0.7)} 100%)`
                    : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f5f7fa', 0.9)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? alpha('#4CAF50', 0.2) : alpha('#4CAF50', 0.1)}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(40px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: caracteristica.gradiente,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle, ${alpha(caracteristica.colorIcono, 0.1)} 0%, transparent 70%)`,
                    opacity: 0,
                    transition: 'opacity 0.4s ease',
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: `0 20px 60px ${alpha(caracteristica.colorIcono, 0.3)}, 0 0 40px ${alpha(caracteristica.colorIcono, 0.1)}`,
                    borderColor: caracteristica.colorIcono,
                    '&::before': {
                      opacity: 1
                    },
                    '&::after': {
                      opacity: 1
                    },
                    '& .icono-container': {
                      transform: 'scale(1.1) rotate(5deg)',
                      boxShadow: `0 10px 30px ${alpha(caracteristica.colorIcono, 0.4)}`
                    },
                    '& .titulo-caracteristica': {
                      color: caracteristica.colorIcono,
                      transform: 'translateX(4px)'
                    }
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                  {/* Icono */}
                  <Box
                    className="icono-container"
                    sx={{
                      width: { xs: 80, md: 100 },
                      height: { xs: 80, md: 100 },
                      borderRadius: 3,
                      background: isDark
                        ? `linear-gradient(135deg, ${alpha('#1a1a2e', 0.8)} 0%, ${alpha('#16213e', 0.6)} 100%)`
                        : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f5f7fa', 0.7)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      mx: 'auto',
                      border: `2px solid ${alpha(caracteristica.colorIcono, 0.3)}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: `radial-gradient(circle, ${alpha(caracteristica.colorIcono, 0.2)} 0%, transparent 70%)`,
                        opacity: 0,
                        transition: 'opacity 0.4s ease'
                      },
                      '&:hover::before': {
                        opacity: 1
                      },
                      '& svg': {
                        color: caracteristica.colorIcono,
                        filter: `drop-shadow(0 4px 8px ${alpha(caracteristica.colorIcono, 0.4)})`,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 1
                      }
                    }}
                  >
                    {caracteristica.icono}
                  </Box>

                  {/* Título */}
                  <Typography
                    className="titulo-caracteristica"
                    variant="h5"
                    component="h3"
                    sx={{
                      fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                      fontWeight: 600,
                      mb: 2,
                      textAlign: 'center',
                      color: isDark ? '#ffffff' : '#1a1a2e',
                      fontSize: { xs: '1.5rem', md: '1.75rem' },
                      transition: 'all 0.3s ease',
                      letterSpacing: '0.02em',
                      textTransform: 'none',
                      fontStyle: 'normal',
                      lineHeight: 1.35,
                      fontVariant: 'normal'
                    }}
                  >
                    {caracteristica.titulo}
                  </Typography>

                  {/* Descripción */}
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                      color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                      textAlign: 'center',
                      lineHeight: 1.8,
                      fontSize: { xs: '1.05rem', md: '1.1rem' },
                      px: { xs: 1, md: 2 },
                      fontWeight: 300,
                      letterSpacing: '0.015em',
                      fontStyle: 'normal',
                      fontVariant: 'normal'
                    }}
                  >
                    {caracteristica.descripcion}
                  </Typography>

                  {/* Efecto de brillo animado */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${alpha(caracteristica.colorIcono, 0.1)}, transparent)`,
                      transition: 'left 0.6s ease',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                    className="brillo-animado"
                  />
                </CardContent>
              </Card>
          ))}
        </Box>

        {/* Efectos decorativos adicionales */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '-100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha('#4CAF50', 0.1)} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translateY(0) rotate(0deg)'
              },
              '50%': {
                transform: 'translateY(-20px) rotate(180deg)'
              }
            },
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '-150px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha('#FF9800', 0.1)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            animation: 'float 8s ease-in-out infinite reverse',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
      </Container>

      {/* Estilos adicionales para efectos hover */}
      <style>{`
        .brillo-animado {
          animation: brillo 3s ease-in-out infinite;
        }
        @keyframes brillo {
          0%, 100% {
            left: -100%;
          }
          50% {
            left: 100%;
          }
        }
      `}</style>
    </Box>
  );
};

export default CaracteristicasPrincipales;
