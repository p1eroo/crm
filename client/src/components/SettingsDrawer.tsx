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
} from '@mui/icons-material';
import { HugeiconsIcon } from '@hugeicons/react';
// @ts-ignore - TypeScript module resolution issue with @hugeicons/core-free-icons
import { Maximize01Icon, Minimize01Icon } from '@hugeicons/core-free-icons';
import { useTheme as useThemeContext } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { taxiMonterricoColors } from '../theme/colors';
import { AppearanceSettings } from './AppearanceSettings';

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
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(0, 0, 0, 0.5)',
            transition: 'opacity 0.3s ease',
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
          borderRadius: { xs: '0', sm: '20px 12px 14px 18px' },
          boxShadow: theme.palette.mode === 'dark'
            ? '-24px 0 64px rgba(0, 0, 0, 0.35), -12px 0 32px rgba(0, 0, 0, 0.25), -4px 0 12px rgba(0, 0, 0, 0.15)'
            : '-24px 0 64px rgba(0, 0, 0, 0.1), -12px 0 32px rgba(0, 0, 0, 0.06), -4px 0 12px rgba(0, 0, 0, 0.04)',
        },
      }}
      transitionDuration={300}
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
          px: 2.5,
          py: 1.75,
          position: 'relative',
          // Divisor ultra refinado con gradiente corporativo sutil
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(90deg, transparent 0%, ${taxiMonterricoColors.greenLight}12 25%, ${taxiMonterricoColors.orange}18 50%, ${taxiMonterricoColors.greenLight}12 75%, transparent 100%)`
              : `linear-gradient(90deg, transparent 0%, ${taxiMonterricoColors.green}06 25%, ${taxiMonterricoColors.orange}10 50%, ${taxiMonterricoColors.green}06 75%, transparent 100%)`,
          },
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.5rem',
              letterSpacing: '-0.018em',
              lineHeight: 1.3,
            }}
          >
            Settings
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <IconButton 
              sx={{ 
                width: 40, 
                height: 40,
                borderRadius: '8px',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? `${taxiMonterricoColors.greenLight}20` 
                    : `${taxiMonterricoColors.greenLight}15`,
                  color: taxiMonterricoColors.green,
                  border: `1px solid ${taxiMonterricoColors.greenLight}30`,
                },
              }}
              onClick={toggleFullscreen}
            >
              <HugeiconsIcon 
                icon={isFullscreen ? Minimize01Icon : Maximize01Icon} 
                style={{ 
                  width: 20, 
                  height: 20, 
                  color: theme.palette.text.secondary 
                }} 
              />
            </IconButton>
            <IconButton 
              onClick={onClose} 
              sx={{
                width: 40,
                height: 40,
                borderRadius: '8px',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? `${taxiMonterricoColors.greenLight}20` 
                    : `${taxiMonterricoColors.greenLight}15`,
                  color: taxiMonterricoColors.green,
                  border: `1px solid ${taxiMonterricoColors.greenLight}30`,
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Contenido con scroll */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          px: 3,
          py: 3,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(0, 0, 0, 0.15)',
            },
          },
        }}>
          {/* Mode Section */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.75rem',
                color: theme.palette.mode === 'dark' 
                  ? taxiMonterricoColors.greenLight 
                  : taxiMonterricoColors.green,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                mb: 2.5,
                lineHeight: 1.4,
              }}
            >
              Modo
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {/* Light Mode Card */}
              <Box
                onClick={() => setMode('light')}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    py: 2.5,
                    px: 2,
                    borderRadius: '14px',
                    border: `1.5px solid ${
                      mode === 'light'
                        ? taxiMonterricoColors.green
                        : theme.palette.divider
                    }`,
                    bgcolor:
                      mode === 'light'
                        ? theme.palette.mode === 'dark'
                          ? `${taxiMonterricoColors.green}15`
                          : `${taxiMonterricoColors.green}08`
                        : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: mode === 'light' 
                      ? theme.palette.mode === 'dark'
                        ? `0 2px 8px rgba(46, 125, 50, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)`
                        : `0 2px 8px rgba(46, 125, 50, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)`
                      : 'none',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? `${taxiMonterricoColors.green}12`
                          : `${taxiMonterricoColors.green}06`,
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 4px 12px rgba(46, 125, 50, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)`
                        : `0 4px 12px rgba(46, 125, 50, 0.15), 0 2px 6px rgba(0, 0, 0, 0.05)`,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <LightMode
                    sx={{
                      fontSize: 28,
                      color:
                        mode === 'light'
                          ? taxiMonterricoColors.green
                          : theme.palette.text.secondary,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: mode === 'light' ? 600 : 500,
                      color: mode === 'light' 
                        ? taxiMonterricoColors.green 
                        : theme.palette.text.primary,
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    Light
                  </Typography>
              </Box>

              {/* Dark Mode Card */}
              <Box
                onClick={() => setMode('dark')}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    py: 2.5,
                    px: 2,
                    borderRadius: '14px',
                    border: `1.5px solid ${
                      mode === 'dark'
                        ? taxiMonterricoColors.green
                        : theme.palette.divider
                    }`,
                    bgcolor:
                      mode === 'dark'
                        ? theme.palette.mode === 'dark'
                          ? `${taxiMonterricoColors.green}15`
                          : `${taxiMonterricoColors.green}08`
                        : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: mode === 'dark' 
                      ? theme.palette.mode === 'dark'
                        ? `0 2px 8px rgba(46, 125, 50, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)`
                        : `0 2px 8px rgba(46, 125, 50, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)`
                      : 'none',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? `${taxiMonterricoColors.green}12`
                          : `${taxiMonterricoColors.green}06`,
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 4px 12px rgba(46, 125, 50, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)`
                        : `0 4px 12px rgba(46, 125, 50, 0.15), 0 2px 6px rgba(0, 0, 0, 0.05)`,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <DarkMode
                    sx={{
                      fontSize: 28,
                      color:
                        mode === 'dark'
                          ? taxiMonterricoColors.green
                          : theme.palette.text.secondary,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: mode === 'dark' ? 600 : 500,
                      color: mode === 'dark' 
                        ? taxiMonterricoColors.green 
                        : theme.palette.text.primary,
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    Dark
                  </Typography>
              </Box>

              {/* System Mode Card */}
              <Box
                onClick={() => setMode('system')}
                sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    py: 2.5,
                    px: 2,
                    borderRadius: '14px',
                    border: `1.5px solid ${
                      mode === 'system'
                        ? taxiMonterricoColors.green
                        : theme.palette.divider
                    }`,
                    bgcolor:
                      mode === 'system'
                        ? theme.palette.mode === 'dark'
                          ? `${taxiMonterricoColors.green}15`
                          : `${taxiMonterricoColors.green}08`
                        : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: mode === 'system' 
                      ? theme.palette.mode === 'dark'
                        ? `0 2px 8px rgba(46, 125, 50, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)`
                        : `0 2px 8px rgba(46, 125, 50, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)`
                      : 'none',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? `${taxiMonterricoColors.green}12`
                          : `${taxiMonterricoColors.green}06`,
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 4px 12px rgba(46, 125, 50, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)`
                        : `0 4px 12px rgba(46, 125, 50, 0.15), 0 2px 6px rgba(0, 0, 0, 0.05)`,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <SettingsBrightness
                    sx={{
                      fontSize: 28,
                      color:
                        mode === 'system'
                          ? taxiMonterricoColors.green
                          : theme.palette.text.secondary,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: mode === 'system' ? 600 : 500,
                      color: mode === 'system' 
                        ? taxiMonterricoColors.green 
                        : theme.palette.text.primary,
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    System
                  </Typography>
              </Box>
            </Box>
          </Box>

          {/* Nav Section */}
          <Box sx={{ mb: 5 }}>
            <Chip
              label="Nav"
              sx={{
                bgcolor: theme.palette.mode === 'dark' 
                  ? `${taxiMonterricoColors.green}15` 
                  : `${taxiMonterricoColors.green}08`,
                color: theme.palette.mode === 'dark' 
                  ? taxiMonterricoColors.greenLight 
                  : taxiMonterricoColors.green,
                mb: 2.5,
                height: 26,
                borderRadius: '12px',
                border: theme.palette.mode === 'dark'
                  ? `1px solid ${taxiMonterricoColors.greenLight}20`
                  : `1px solid ${taxiMonterricoColors.green}15`,
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 1px 3px rgba(46, 125, 50, 0.1)`
                  : `0 1px 3px rgba(46, 125, 50, 0.08)`,
                '& .MuiChip-label': {
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                },
              }}
            />

            {/* Layout */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {layouts.map((layout) => (
                  <Box
                    key={layout.id}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1.25,
                    }}
                  >
                    <Box
                      onClick={() => handleLayoutChange(layout.id)}
                      sx={{
                        width: '100%',
                        height: 90,
                        borderRadius: '14px',
                        border: `1.5px solid ${
                          selectedLayout === layout.id
                            ? taxiMonterricoColors.green
                            : theme.palette.divider
                        }`,
                        bgcolor:
                          selectedLayout === layout.id
                            ? theme.palette.mode === 'dark'
                              ? `${taxiMonterricoColors.green}12`
                              : `${taxiMonterricoColors.green}08`
                            : theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: selectedLayout === layout.id
                          ? theme.palette.mode === 'dark'
                            ? `0 2px 8px rgba(46, 125, 50, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)`
                            : `0 2px 8px rgba(46, 125, 50, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)`
                          : 'none',
                        '&:hover': {
                          borderColor: taxiMonterricoColors.green,
                          bgcolor: theme.palette.mode === 'dark'
                            ? `${taxiMonterricoColors.green}10`
                            : `${taxiMonterricoColors.green}06`,
                          boxShadow: theme.palette.mode === 'dark'
                            ? `0 4px 12px rgba(46, 125, 50, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)`
                            : `0 4px 12px rgba(46, 125, 50, 0.15), 0 2px 6px rgba(0, 0, 0, 0.05)`,
                          transform: 'translateY(-2px)',
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
                        fontSize: '0.8125rem',
                        color: selectedLayout === layout.id 
                          ? (theme.palette.mode === 'dark' 
                              ? taxiMonterricoColors.greenLight 
                              : taxiMonterricoColors.green)
                          : theme.palette.text.secondary,
                        fontWeight: selectedLayout === layout.id ? 600 : 500,
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}
                    >
                      {layout.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

          </Box>

          {/* Appearance Settings Section */}
          <AppearanceSettings />
        </Box>
      </Box>
    </Drawer>
  );
};
