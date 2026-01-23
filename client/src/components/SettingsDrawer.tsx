import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Close,
  DarkMode,
  LightMode,
  SettingsBrightness,
  Info,
  Refresh,
} from '@mui/icons-material';
import { HugeiconsIcon } from '@hugeicons/react';
// @ts-ignore - TypeScript module resolution issue with @hugeicons/core-free-icons
import { Maximize01Icon, Minimize01Icon } from '@hugeicons/core-free-icons';
import { useTheme as useThemeContext } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { taxiMonterricoColors } from '../theme/colors';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { mode, setMode } = useThemeContext();
  const { collapsed, setOpen: setSidebarOpen, toggleCollapsed, layoutMode, setLayoutMode } = useSidebar();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determinar el layout actual basado en layoutMode
  const getCurrentLayout = useCallback((): number => {
    if (layoutMode === 'horizontal') return 2;
    if (layoutMode === 'collapsed') return 1;
    return 0; // vertical
  }, [layoutMode]);

  const [selectedLayout, setSelectedLayout] = useState(getCurrentLayout());

  // Actualizar selectedLayout cuando cambie layoutMode
  useEffect(() => {
    setSelectedLayout(getCurrentLayout());
  }, [layoutMode, getCurrentLayout]);

  // Función para alternar pantalla completa
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error al cambiar modo pantalla completa:', error);
    }
  };

  // Escuchar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const layouts = [
    { id: 0, label: 'Vertical' },
    { id: 1, label: 'Collapsed' },
    { id: 2, label: 'Horizontal' },
  ];

  const handleLayoutChange = (layoutId: number) => {
    setSelectedLayout(layoutId);
    
    if (layoutId === 0) {
      // Vertical: sidebar expandido
      setLayoutMode('vertical');
      setSidebarOpen(true);
      if (collapsed) {
        toggleCollapsed(); // Expandir si está contraído
      }
    } else if (layoutId === 1) {
      // Collapsed: sidebar contraído
      setLayoutMode('collapsed');
      setSidebarOpen(true);
      if (!collapsed) {
        toggleCollapsed(); // Contraer si está expandido
      }
    } else if (layoutId === 2) {
      // Horizontal: menú en la parte superior
      setLayoutMode('horizontal');
      setSidebarOpen(false); // Ocultar sidebar vertical
    }
  };


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        BackdropProps: {
          sx: {
            backgroundColor: 'transparent',
          },
        },
      }}
      sx={{
        zIndex: 1600,
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 370, md: 410 },
          maxWidth: '100%',
          border: 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.5)'
            : '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.paper,
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
          borderBottom: `2px solid transparent`,
          borderImage: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
          borderImageSlice: 1,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)`
            : `linear-gradient(135deg, rgba(16, 185, 129, 0.01) 0%, transparent 100%)`,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
            opacity: 0.3,
          },
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.mode === 'dark' ? '#10B981' : '#2E7D32'} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Configuraciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              size="small" 
              sx={{ 
                width: 40, 
                height: 40,
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  color: taxiMonterricoColors.green,
                },
              }}
              onClick={toggleFullscreen}
            >
              <HugeiconsIcon 
                icon={isFullscreen ? Minimize01Icon : Maximize01Icon} 
                style={{ 
                  width: 24, 
                  height: 24,
                  color: '#06B6D4',
                }} 
              />
            </IconButton>
            <IconButton 
              size="small" 
              sx={{ 
                width: 40, 
                height: 40,
                color: '#10B981',
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.green}15`,
                  color: '#059669',
                },
              }}
            >
              <Refresh sx={{ fontSize: 24 }} />
            </IconButton>
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{
                color: '#EF4444',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#DC2626',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Contenido con scroll */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          px: 3,
          py: 1,
        }}>
          {/* Mode */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Modo
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Light Mode Button */}
              <Box
                onClick={() => setMode('light')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 2,
                  px: 1,
                  borderRadius: 1.5,
                  border: `2px solid ${
                    mode === 'light'
                      ? taxiMonterricoColors.green
                      : theme.palette.divider
                  }`,
                  bgcolor:
                    mode === 'light'
                      ? theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}20`
                        : `${taxiMonterricoColors.green}10`
                      : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}15`
                        : `${taxiMonterricoColors.green}08`,
                  },
                }}
              >
                <LightMode
                  sx={{
                    fontSize: 28,
                    color:
                      mode === 'light'
                        ? '#F59E0B'
                        : '#FBBF24',
                    transition: 'color 0.2s ease',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: mode === 'light' ? 500 : 400,
                    color: theme.palette.text.primary,
                  }}
                >
                  Light
                </Typography>
              </Box>

              {/* Dark Mode Button */}
              <Box
                onClick={() => setMode('dark')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 2,
                  px: 1,
                  borderRadius: 1.5,
                  border: `2px solid ${
                    mode === 'dark'
                      ? taxiMonterricoColors.green
                      : theme.palette.divider
                  }`,
                  bgcolor:
                    mode === 'dark'
                      ? theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}20`
                        : `${taxiMonterricoColors.green}10`
                      : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}15`
                        : `${taxiMonterricoColors.green}08`,
                  },
                }}
              >
                <DarkMode
                  sx={{
                    fontSize: 28,
                    color:
                      mode === 'dark'
                        ? '#6366F1'
                        : '#818CF8',
                    transition: 'color 0.2s ease',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: mode === 'dark' ? 500 : 400,
                    color: theme.palette.text.primary,
                  }}
                >
                  Dark
                </Typography>
              </Box>

              {/* System Mode Button */}
              <Box
                onClick={() => setMode('system')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 2,
                  px: 1,
                  borderRadius: 1.5,
                  border: `2px solid ${
                    mode === 'system'
                      ? taxiMonterricoColors.green
                      : theme.palette.divider
                  }`,
                  bgcolor:
                    mode === 'system'
                      ? theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}20`
                        : `${taxiMonterricoColors.green}10`
                      : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: taxiMonterricoColors.green,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? `${taxiMonterricoColors.green}15`
                        : `${taxiMonterricoColors.green}08`,
                  },
                }}
              >
                <SettingsBrightness
                  sx={{
                    fontSize: 28,
                    color:
                      mode === 'system'
                        ? '#8B5CF6'
                        : '#A78BFA',
                    transition: 'color 0.2s ease',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: mode === 'system' ? 500 : 400,
                    color: theme.palette.text.primary,
                  }}
                >
                  System
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Nav Section */}
          <Box sx={{ mb: 4 }}>
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Nav
                  </Typography>
                  <Info sx={{ fontSize: 12, color: '#3B82F6' }} />
                </Box>
              }
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#111827',
                color: 'white',
                mb: 2,
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />

            {/* Layout */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Layouts
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {layouts.map((layout) => (
                  <Box
                    key={layout.id}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      onClick={() => handleLayoutChange(layout.id)}
                      sx={{
                        width: '100%',
                        height: 80,
                        borderRadius: 1,
                        border: `2px solid ${
                          selectedLayout === layout.id
                            ? taxiMonterricoColors.green
                            : theme.palette.divider
                        }`,
                        bgcolor:
                          selectedLayout === layout.id
                            ? `${taxiMonterricoColors.green}10`
                            : theme.palette.action.hover,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: taxiMonterricoColors.green,
                        },
                      }}
                    >
                      {/* Icono del layout */}
                      <Box
                        sx={{
                          width: '80%',
                          height: '60%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {layout.id === 0 ? (
                          // Vertical: sidebar vertical expandido a la izquierda
                          <>
                            <Box
                              sx={{
                                width: '30%',
                                height: '100%',
                                bgcolor:
                                  selectedLayout === layout.id
                                    ? taxiMonterricoColors.green
                                    : theme.palette.text.disabled,
                                borderRadius: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                p: 0.5,
                              }}
                            >
                              {/* Logo/Header del sidebar */}
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 8,
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? 'rgba(255, 255, 255, 0.2)'
                                      : theme.palette.text.secondary,
                                  borderRadius: 0.5,
                                  opacity: 0.5,
                                }}
                              />
                              {/* Items del menú */}
                              {[...Array(4)].map((_, i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    width: '100%',
                                    height: 3,
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : theme.palette.text.secondary,
                                    borderRadius: 0.5,
                                    opacity: 0.6,
                                  }}
                                />
                              ))}
                            </Box>
                            {/* Contenido principal */}
                            <Box
                              sx={{
                                flex: 1,
                                height: '100%',
                                ml: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                              }}
                            >
                              {/* Header del contenido */}
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 6,
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? taxiMonterricoColors.green
                                      : theme.palette.text.disabled,
                                  borderRadius: 0.5,
                                  opacity: 0.8,
                                }}
                              />
                              {/* Contenido */}
                              <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '100%',
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? taxiMonterricoColors.green
                                        : theme.palette.text.disabled,
                                    borderRadius: 0.5,
                                    opacity: 0.5,
                                  }}
                                />
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '100%',
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? taxiMonterricoColors.green
                                        : theme.palette.text.disabled,
                                    borderRadius: 0.5,
                                    opacity: 0.5,
                                  }}
                                />
                              </Box>
                              {/* Footer del contenido */}
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 4,
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? taxiMonterricoColors.green
                                      : theme.palette.text.disabled,
                                  borderRadius: 0.5,
                                  opacity: 0.4,
                                }}
                              />
                            </Box>
                          </>
                        ) : layout.id === 1 ? (
                          // Collapsed: sidebar vertical contraído a la izquierda
                          <>
                            <Box
                              sx={{
                                width: '15%',
                                height: '100%',
                                bgcolor:
                                  selectedLayout === layout.id
                                    ? taxiMonterricoColors.green
                                    : theme.palette.text.disabled,
                                borderRadius: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.5,
                                py: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 0.5,
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? 'rgba(255, 255, 255, 0.3)'
                                      : theme.palette.text.secondary,
                                }}
                              />
                              {[...Array(5)].map((_, i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    width: '50%',
                                    height: 2,
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : theme.palette.text.secondary,
                                    borderRadius: 0.5,
                                  }}
                                />
                              ))}
                            </Box>
                            <Box
                              sx={{
                                flex: 1,
                                height: '100%',
                                ml: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  height: 2,
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? taxiMonterricoColors.green
                                      : theme.palette.text.disabled,
                                  borderRadius: 0.5,
                                }}
                              />
                              <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '100%',
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? taxiMonterricoColors.green
                                        : theme.palette.text.disabled,
                                    borderRadius: 0.5,
                                    opacity: 0.6,
                                  }}
                                />
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '100%',
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? taxiMonterricoColors.green
                                        : theme.palette.text.disabled,
                                    borderRadius: 0.5,
                                    opacity: 0.6,
                                  }}
                                />
                              </Box>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '30%',
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? taxiMonterricoColors.green
                                      : theme.palette.text.disabled,
                                  borderRadius: 0.5,
                                  opacity: 0.4,
                                }}
                              />
                            </Box>
                          </>
                        ) : (
                          // Horizontal: header con tabs arriba, contenido abajo
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            {/* Barra superior con tabs */}
                            <Box
                              sx={{
                                width: '100%',
                                height: 5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 0.5,
                              }}
                            >
                              {[...Array(5)].map((_, i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    flex: 1,
                                    height: 3,
                                    bgcolor:
                                      selectedLayout === layout.id
                                        ? i === 0
                                          ? taxiMonterricoColors.green // Primer tab más oscuro (activo)
                                          : 'rgba(46, 125, 50, 0.3)' // Tabs más claros
                                        : i === 0
                                        ? theme.palette.text.secondary
                                        : theme.palette.text.disabled,
                                    borderRadius: 0.5,
                                    opacity: i === 0 ? 1 : 0.6,
                                  }}
                                />
                              ))}
                            </Box>
                            
                            {/* Fila superior: cuadrado pequeño + rectángulo grande */}
                            <Box
                              sx={{
                                width: '100%',
                                flex: 1,
                                display: 'flex',
                                gap: 0.5,
                              }}
                            >
                              {/* Cuadrado pequeño a la izquierda */}
                              <Box
                                sx={{
                                  width: '25%',
                                  aspectRatio: '1',
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? taxiMonterricoColors.green
                                      : theme.palette.text.disabled,
                                  borderRadius: 0.5,
                                  opacity: 0.5,
                                }}
                              />
                              {/* Rectángulo grande a la derecha */}
                              <Box
                                sx={{
                                  flex: 1,
                                  bgcolor:
                                    selectedLayout === layout.id
                                      ? taxiMonterricoColors.green
                                      : theme.palette.text.disabled,
                                  borderRadius: 0.5,
                                  opacity: 0.5,
                                }}
                              />
                            </Box>
                            
                            {/* Fila inferior: rectángulo ancho */}
                            <Box
                              sx={{
                                width: '100%',
                                height: '25%',
                                bgcolor:
                                  selectedLayout === layout.id
                                    ? taxiMonterricoColors.green
                                    : theme.palette.text.disabled,
                                borderRadius: 0.5,
                                opacity: 0.4,
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: theme.palette.text.secondary,
                        fontWeight: selectedLayout === layout.id ? 500 : 400,
                      }}
                    >
                      {layout.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

          </Box>

          {/* Font Section */}
          <Box>
            <Chip
              label="Font"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#111827',
                color: 'white',
                mb: 2,
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Family
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};
