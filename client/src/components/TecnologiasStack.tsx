/**
 * 🚀 Componente de Visualización del Stack Tecnológico
 * 
 * Muestra de forma visual y organizada todas las tecnologías
 * utilizadas en el proyecto CRM Monterrico
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Link as LinkIcon,
  CheckCircle,
  Build,
  Schedule,
  Science,
  FilterList as FilterListIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

// Importar tecnologías (ajustar la ruta según sea necesario)
// import { tecnologiasPorCategoria, categoriasConfig, obtenerEstadisticas } from '../../../tecnologias';

// Datos de ejemplo (reemplazar con import real)
const categoriasConfig: Record<string, { icono: string; color: string; nombre: string }> = {
  frontend: { icono: '⚛️', color: '#61DAFB', nombre: 'Frontend' },
  backend: { icono: '🖥️', color: '#339933', nombre: 'Backend' },
  database: { icono: '🗄️', color: '#336791', nombre: 'Base de Datos' },
  cloud: { icono: '☁️', color: '#4285F4', nombre: 'Cloud & APIs' },
  devops: { icono: '🔧', color: '#2496ED', nombre: 'DevOps & Tools' },
  seguridad: { icono: '🔒', color: '#FF6B6B', nombre: 'Seguridad' },
  uiux: { icono: '🎨', color: '#9C27B0', nombre: 'UI/UX' },
  testing: { icono: '🧪', color: '#FFA726', nombre: 'Testing' },
  arquitectura: { icono: '🏗️', color: '#607D8B', nombre: 'Arquitectura' },
  performance: { icono: '⚡', color: '#FFD700', nombre: 'Performance' },
  integracion: { icono: '🔗', color: '#00BCD4', nombre: 'Integración' },
  futuro: { icono: '🚀', color: '#E91E63', nombre: 'Tecnologías Futuras' }
};

interface Tecnologia {
  nombre: string;
  version?: string;
  categoria: string;
  descripcion?: string;
  icono?: string;
  estado: 'activa' | 'en-desarrollo' | 'planificada' | 'experimental';
  url?: string;
}

interface TecnologiasStackProps {
  tecnologiasPorCategoria?: Record<string, Tecnologia[]>;
  mostrarBusqueda?: boolean;
  mostrarEstadisticas?: boolean;
}

const TecnologiasStack: React.FC<TecnologiasStackProps> = ({
  tecnologiasPorCategoria = {},
  mostrarBusqueda = true,
  mostrarEstadisticas = true
}) => {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('frontend');
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({});
  const [filtroEstado, setFiltroEstado] = useState<Tecnologia['estado'] | 'todos'>('todos');
  const [vista, setVista] = useState<'grid' | 'list'>('grid');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'estado' | 'categoria'>('nombre');
  const [anchorElFiltro, setAnchorElFiltro] = useState<null | HTMLElement>(null);
  const [anchorElOrden, setAnchorElOrden] = useState<null | HTMLElement>(null);
  const [contadoresAnimados, setContadoresAnimados] = useState({
    total: 0,
    activas: 0,
    enDesarrollo: 0,
    experimentales: 0
  });

  // Obtener todas las tecnologías
  const todasLasTecnologias = useMemo(() => {
    return Object.values(tecnologiasPorCategoria).flat();
  }, [tecnologiasPorCategoria]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const porEstado = todasLasTecnologias.reduce((acc, tech) => {
      acc[tech.estado] = (acc[tech.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: todasLasTecnologias.length,
      activas: porEstado['activa'] || 0,
      enDesarrollo: porEstado['en-desarrollo'] || 0,
      planificadas: porEstado['planificada'] || 0,
      experimentales: porEstado['experimental'] || 0
    };
  }, [todasLasTecnologias]);

  // Animación de contadores
  useEffect(() => {
    const duracion = 2000;
    const pasos = 60;
    const intervalo = duracion / pasos;
    
    const animarContador = (valorFinal: number, setter: (val: number) => void) => {
      let paso = 0;
      const incremento = valorFinal / pasos;
      const timer = setInterval(() => {
        paso++;
        const valorActual = Math.min(Math.round(incremento * paso), valorFinal);
        setter(valorActual);
        if (paso >= pasos) {
          clearInterval(timer);
        }
      }, intervalo);
    };

    animarContador(estadisticas.total, (val) => setContadoresAnimados(prev => ({ ...prev, total: val })));
    animarContador(estadisticas.activas, (val) => setContadoresAnimados(prev => ({ ...prev, activas: val })));
    animarContador(estadisticas.enDesarrollo + estadisticas.planificadas, (val) => setContadoresAnimados(prev => ({ ...prev, enDesarrollo: val })));
    animarContador(estadisticas.experimentales, (val) => setContadoresAnimados(prev => ({ ...prev, experimentales: val })));
  }, [estadisticas]);

  // Filtrar y ordenar tecnologías
  const tecnologiasFiltradas = useMemo(() => {
    let filtradas = todasLasTecnologias;

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      filtradas = filtradas.filter(tech =>
        tech.nombre.toLowerCase().includes(termino) ||
        tech.descripcion?.toLowerCase().includes(termino) ||
        tech.categoria.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(tech => tech.estado === filtroEstado);
    }

    // Ordenamiento
    filtradas = [...filtradas].sort((a, b) => {
      switch (ordenamiento) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'estado':
          return a.estado.localeCompare(b.estado);
        case 'categoria':
          return a.categoria.localeCompare(b.categoria);
        default:
          return 0;
      }
    });

    return filtradas;
  }, [busqueda, todasLasTecnologias, filtroEstado, ordenamiento]);

  // Agrupar por categoría
  const tecnologiasAgrupadas = useMemo(() => {
    const agrupadas: Record<string, Tecnologia[]> = {};
    tecnologiasFiltradas.forEach(tech => {
      if (!agrupadas[tech.categoria]) {
        agrupadas[tech.categoria] = [];
      }
      agrupadas[tech.categoria].push(tech);
    });
    return agrupadas;
  }, [tecnologiasFiltradas]);

  const toggleCategoria = (categoria: string) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const getEstadoIcon = (estado: Tecnologia['estado']): React.ReactElement => {
    switch (estado) {
      case 'activa':
        return <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />;
      case 'en-desarrollo':
        return <Build sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
      case 'planificada':
        return <Schedule sx={{ fontSize: 16, color: theme.palette.info.main }} />;
      case 'experimental':
        return <Science sx={{ fontSize: 16, color: theme.palette.error.main }} />;
      default:
        return <CheckCircle sx={{ fontSize: 16, color: theme.palette.grey[500] }} />;
    }
  };

  const getEstadoColor = (estado: Tecnologia['estado']) => {
    switch (estado) {
      case 'activa':
        return theme.palette.success.main;
      case 'en-desarrollo':
        return theme.palette.warning.main;
      case 'planificada':
        return theme.palette.info.main;
      case 'experimental':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const categorias = Object.keys(categoriasConfig);

  return (
    <Box 
      sx={{ 
        p: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'radial-gradient(circle at 50% 0%, rgba(97, 218, 251, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      {/* Encabezado */}
      <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: { xs: '2rem', md: '3rem' },
            textShadow: theme.palette.mode === 'dark' 
              ? '0 0 30px rgba(102, 126, 234, 0.5)' 
              : 'none',
            animation: 'gradientShift 3s ease infinite',
            '@keyframes gradientShift': {
              '0%, 100%': {
                backgroundPosition: '0% 50%'
              },
              '50%': {
                backgroundPosition: '100% 50%'
              }
            }
          }}
        >
          🚀 Stack Tecnológico
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'text.secondary',
            fontSize: '1.2rem',
            fontWeight: 500,
            mt: 1
          }}
        >
          Tecnologías utilizadas en CRM Monterrico
        </Typography>
      </Box>

      {/* Estadísticas */}
      {mostrarEstadisticas && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 3,
            mb: 4,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.4s ease'
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 16px 48px rgba(102, 126, 234, 0.5)',
                '&::before': {
                  opacity: 1
                }
              }
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {contadoresAnimados.total}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                Total de Tecnologías
              </Typography>
            </CardContent>
          </Card>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)',
              boxShadow: '0 8px 32px rgba(17, 153, 142, 0.3)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.4s ease'
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 16px 48px rgba(17, 153, 142, 0.5)',
                '&::before': {
                  opacity: 1
                }
              }
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {contadoresAnimados.activas}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                Activas
              </Typography>
            </CardContent>
          </Card>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)',
              boxShadow: '0 8px 32px rgba(245, 87, 108, 0.3)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.4s ease'
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 16px 48px rgba(245, 87, 108, 0.5)',
                '&::before': {
                  opacity: 1
                }
              }
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {contadoresAnimados.enDesarrollo}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                En Desarrollo
              </Typography>
            </CardContent>
          </Card>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)',
              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.3)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                opacity: 0,
                transition: 'opacity 0.4s ease'
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 16px 48px rgba(250, 112, 154, 0.5)',
                '&::before': {
                  opacity: 1
                }
              }
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {contadoresAnimados.experimentales}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                Experimentales
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Búsqueda y Filtros */}
      {mostrarBusqueda && (
        <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Buscar tecnologías..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                  '&.Mui-focused': {
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.4)}`
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  py: 1.5
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                  </InputAdornment>
                )
              }}
            />
            <ButtonGroup variant="outlined" sx={{ borderRadius: 3 }}>
              <Button
                onClick={(e) => setAnchorElFiltro(e.currentTarget)}
                startIcon={<FilterListIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                    border: `2px solid ${theme.palette.primary.main}`
                  }
                }}
              >
                {filtroEstado === 'todos' ? 'Todos' : filtroEstado}
              </Button>
              <Button
                onClick={(e) => setAnchorElOrden(e.currentTarget)}
                startIcon={<SortIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    border: `2px solid ${theme.palette.secondary.main}`
                  }
                }}
              >
                Ordenar
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="outlined" sx={{ borderRadius: 3 }}>
              <IconButton
                onClick={() => setVista('grid')}
                sx={{
                  background: vista === 'grid' 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`
                    : 'transparent',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`
                  }
                }}
              >
                <ViewModuleIcon />
              </IconButton>
              <IconButton
                onClick={() => setVista('list')}
                sx={{
                  background: vista === 'list' 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`
                    : 'transparent',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`
                  }
                }}
              >
                <ViewListIcon />
              </IconButton>
            </ButtonGroup>
          </Box>

          {/* Menú de Filtros */}
          <Menu
            anchorEl={anchorElFiltro}
            open={Boolean(anchorElFiltro)}
            onClose={() => setAnchorElFiltro(null)}
            TransitionComponent={Fade}
          >
            <MenuItem onClick={() => { setFiltroEstado('todos'); setAnchorElFiltro(null); }}>
              Todos
            </MenuItem>
            <MenuItem onClick={() => { setFiltroEstado('activa'); setAnchorElFiltro(null); }}>
              Activas
            </MenuItem>
            <MenuItem onClick={() => { setFiltroEstado('en-desarrollo'); setAnchorElFiltro(null); }}>
              En Desarrollo
            </MenuItem>
            <MenuItem onClick={() => { setFiltroEstado('planificada'); setAnchorElFiltro(null); }}>
              Planificadas
            </MenuItem>
            <MenuItem onClick={() => { setFiltroEstado('experimental'); setAnchorElFiltro(null); }}>
              Experimentales
            </MenuItem>
          </Menu>

          {/* Menú de Ordenamiento */}
          <Menu
            anchorEl={anchorElOrden}
            open={Boolean(anchorElOrden)}
            onClose={() => setAnchorElOrden(null)}
            TransitionComponent={Fade}
          >
            <MenuItem onClick={() => { setOrdenamiento('nombre'); setAnchorElOrden(null); }}>
              Por Nombre
            </MenuItem>
            <MenuItem onClick={() => { setOrdenamiento('estado'); setAnchorElOrden(null); }}>
              Por Estado
            </MenuItem>
            <MenuItem onClick={() => { setOrdenamiento('categoria'); setAnchorElOrden(null); }}>
              Por Categoría
            </MenuItem>
          </Menu>
        </Box>
      )}

      {/* Tabs de Categorías */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Categorías
          </Typography>
          {tecnologiasFiltradas.length > 0 && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => {
                const dataStr = JSON.stringify(tecnologiasFiltradas, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'tecnologias-stack.json';
                link.click();
              }}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                color: theme.palette.success.main,
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`
                }
              }}
            >
              Exportar
            </Button>
          )}
        </Box>
        <Tabs
          value={categoriaActiva}
          onChange={(_, newValue) => setCategoriaActiva(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: theme.palette.primary.main,
                transform: 'translateY(-2px)'
              }
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 700
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          {categorias.map((cat) => {
            const config = categoriasConfig[cat];
            const count = tecnologiasAgrupadas[cat]?.length || 0;
            return (
              <Tab
                key={cat}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>{config.icono}</Typography>
                    <span>{config.nombre}</span>
                    {count > 0 && (
                      <Badge 
                        badgeContent={count} 
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            background: `linear-gradient(135deg, ${config.color} 0%, ${alpha(config.color, 0.7)} 100%)`,
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            minWidth: 24,
                            height: 24
                          }
                        }}
                      />
                    )}
                  </Box>
                }
                value={cat}
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Lista de Tecnologías */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', zIndex: 1 }}>
        {Object.entries(tecnologiasAgrupadas).map(([categoria, tecnologias]) => {
          const config = categoriasConfig[categoria];
          const expandida = categoriasExpandidas[categoria] ?? true;

          return (
            <Card
              key={categoria}
              sx={{
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(config.color, 0.1)} 0%, ${alpha(config.color, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${alpha(config.color, 0.15)} 0%, ${alpha('#fff', 0.9)} 100%)`,
                borderLeft: `6px solid ${config.color}`,
                border: `1px solid ${alpha(config.color, 0.3)}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(config.color, 0.1)} 0%, transparent 100%)`,
                  opacity: 0,
                  transition: 'opacity 0.4s ease'
                },
                '&:hover': {
                  transform: 'translateX(8px)',
                  boxShadow: `0 12px 40px ${alpha(config.color, 0.3)}`,
                  borderColor: config.color,
                  '&::before': {
                    opacity: 1
                  }
                }
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    mb: expandida ? 2 : 0,
                    py: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                  onClick={() => toggleCategoria(categoria)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${config.color} 0%, ${alpha(config.color, 0.7)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        boxShadow: `0 4px 20px ${alpha(config.color, 0.4)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'rotate(10deg) scale(1.1)',
                          boxShadow: `0 8px 30px ${alpha(config.color, 0.6)}`
                        }
                      }}
                    >
                      {config.icono}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {config.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {tecnologias.length} tecnologías
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    size="large"
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(config.color, 0.2)} 0%, ${alpha(config.color, 0.1)} 100%)`,
                      color: config.color,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(config.color, 0.3)} 0%, ${alpha(config.color, 0.2)} 100%)`,
                        transform: 'rotate(180deg)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {expandida ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={expandida}>
                  <Box
                    sx={{
                      display: vista === 'grid' ? 'grid' : 'flex',
                      flexDirection: vista === 'list' ? 'column' : 'row',
                      gridTemplateColumns: vista === 'grid' ? {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)'
                      } : undefined,
                      gap: 2.5,
                      mt: 2
                    }}
                  >
                    {tecnologias.map((tech, index) => (
                      <Fade in={true} timeout={300 + index * 50} key={index}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: '100%',
                            width: vista === 'list' ? '100%' : 'auto',
                            background: theme.palette.mode === 'dark'
                              ? `linear-gradient(135deg, ${alpha(getEstadoColor(tech.estado), 0.1)} 0%, ${alpha(getEstadoColor(tech.estado), 0.05)} 100%)`
                              : `linear-gradient(135deg, ${alpha('#fff', 0.9)} 0%, ${alpha(getEstadoColor(tech.estado), 0.05)} 100%)`,
                            border: `2px solid ${alpha(getEstadoColor(tech.estado), 0.2)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(10px)',
                            animation: `slideIn 0.5s ease-out ${index * 0.05}s both`,
                            '@keyframes slideIn': {
                              '0%': {
                                opacity: 0,
                                transform: 'translateY(20px)'
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
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, transparent, ${alpha(getEstadoColor(tech.estado), 0.2)}, transparent)`,
                              transition: 'left 0.5s ease'
                            },
                            '&:hover': {
                              transform: vista === 'list' ? 'translateX(8px)' : 'translateY(-8px) scale(1.03)',
                              boxShadow: `0 12px 40px ${alpha(getEstadoColor(tech.estado), 0.4)}`,
                              borderColor: getEstadoColor(tech.estado),
                              '&::before': {
                                left: '100%'
                              }
                            }
                          }}
                        >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                              {tech.icono && (
                                <Box
                                  sx={{
                                    fontSize: '2rem',
                                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'scale(1.2) rotate(10deg)'
                                    }
                                  }}
                                >
                                  {tech.icono}
                                </Box>
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {tech.nombre}
                                </Typography>
                                {tech.version && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      fontWeight: 600,
                                      px: 1,
                                      py: 0.25,
                                      borderRadius: 1,
                                      bgcolor: alpha(getEstadoColor(tech.estado), 0.1)
                                    }}
                                  >
                                    v{tech.version}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Tooltip title={tech.estado} arrow>
                              <Box 
                                component="span"
                                sx={{
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.3) rotate(15deg)'
                                  }
                                }}
                              >
                                {getEstadoIcon(tech.estado)}
                              </Box>
                            </Tooltip>
                          </Box>

                          {tech.descripcion && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 1.5,
                                lineHeight: 1.6,
                                minHeight: '3.2em'
                              }}
                            >
                              {tech.descripcion}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                            <Chip
                              label={tech.estado}
                              size="small"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(getEstadoColor(tech.estado), 0.2)} 0%, ${alpha(getEstadoColor(tech.estado), 0.1)} 100%)`,
                                color: getEstadoColor(tech.estado),
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                border: `1px solid ${alpha(getEstadoColor(tech.estado), 0.3)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  background: `linear-gradient(135deg, ${alpha(getEstadoColor(tech.estado), 0.3)} 0%, ${alpha(getEstadoColor(tech.estado), 0.2)} 100%)`
                                }
                              }}
                            />
                            {tech.url && (
                              <Chip
                                icon={<LinkIcon sx={{ fontSize: 16 }} />}
                                label="Docs"
                                size="small"
                                clickable
                                onClick={() => window.open(tech.url, '_blank')}
                                sx={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                                  color: theme.palette.primary.main,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                      </Fade>
                    ))}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {tecnologiasFiltradas.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 12,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box
            sx={{
              display: 'inline-block',
              fontSize: '5rem',
              mb: 2,
              animation: 'bounce 2s ease infinite',
              '@keyframes bounce': {
                '0%, 100%': {
                  transform: 'translateY(0)'
                },
                '50%': {
                  transform: 'translateY(-20px)'
                }
              }
            }}
          >
            🔍
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold',
              mb: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            No se encontraron tecnologías
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Intenta con otros términos de búsqueda
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TecnologiasStack;
