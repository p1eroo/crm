import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  useTheme,
  Chip,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Close,
  DarkMode,
  Contrast,
  FormatTextdirectionRToL,
  ViewCompact,
  Info,
  Refresh,
  Palette,
} from '@mui/icons-material';
import { HugeiconsIcon } from '@hugeicons/react';
// @ts-ignore - TypeScript module resolution issue with @hugeicons/core-free-icons
import { Maximize01Icon, Minimize01Icon } from '@hugeicons/core-free-icons';
import { useTheme as useThemeContext } from '../context/ThemeContext';
import { taxiMonterricoColors } from '../theme/colors';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeContext();
  const [contrast, setContrast] = useState(false);
  const [rightToLeft, setRightToLeft] = useState(false);
  const [compact, setCompact] = useState(true);
  const [selectedLayout, setSelectedLayout] = useState(2);
  const [selectedColor, setSelectedColor] = useState('integrate');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    { id: 0, label: 'Layout 1' },
    { id: 1, label: 'Layout 2' },
    { id: 2, label: 'Layout 3' },
  ];

  const colors = [
    { id: 'integrate', label: 'Integrate', color: taxiMonterricoColors.green },
    { id: 'apparent', label: 'Apparent', color: '#637381' },
  ];

  const presets = [
    { id: 0, color: taxiMonterricoColors.green },
    { id: 1, color: '#2196F3' },
    { id: 2, color: '#9C27B0' },
    { id: 3, color: '#2196F3' },
    { id: 4, color: '#FF9800' },
    { id: 5, color: '#F44336' },
  ];

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
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              size="small" 
              sx={{ width: 40, height: 40 }}
              onClick={toggleFullscreen}
            >
              <HugeiconsIcon 
                icon={isFullscreen ? Minimize01Icon : Maximize01Icon} 
                style={{ width: 24, height: 24, color: '#637381' }} 
              />
            </IconButton>
            <IconButton size="small" sx={{ width: 40, height: 40 }}>
              <Refresh sx={{ fontSize: 24, color: theme.palette.text.secondary }} />
            </IconButton>
            <IconButton onClick={onClose} size="small">
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
              <DarkMode sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Mode
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleTheme}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: taxiMonterricoColors.green,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: taxiMonterricoColors.green,
                    },
                  }}
                />
              }
              label=""
              sx={{ ml: 0 }}
            />
          </Box>

          {/* Contrast */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Contrast sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Contrast
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={contrast}
                  onChange={(e) => setContrast(e.target.checked)}
                />
              }
              label=""
              sx={{ ml: 0 }}
            />
          </Box>

          {/* Right to left */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FormatTextdirectionRToL sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Right to left
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={rightToLeft}
                  onChange={(e) => setRightToLeft(e.target.checked)}
                />
              }
              label=""
              sx={{ ml: 0 }}
            />
          </Box>

          {/* Compact */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ViewCompact sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Compact
              </Typography>
              <Tooltip title="Información">
                <Info sx={{ fontSize: 14, color: theme.palette.text.secondary, ml: 0.5 }} />
              </Tooltip>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={compact}
                  onChange={(e) => setCompact(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: taxiMonterricoColors.green,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: taxiMonterricoColors.green,
                    },
                  }}
                />
              }
              label=""
              sx={{ ml: 0 }}
            />
          </Box>

          {/* Nav Section */}
          <Box sx={{ mb: 4 }}>
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Nav
                  </Typography>
                  <Info sx={{ fontSize: 12 }} />
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
                <Refresh sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Layout
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {layouts.map((layout) => (
                  <Box
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout.id)}
                    sx={{
                      flex: 1,
                      height: 60,
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
                    <Box
                      sx={{
                        width: '80%',
                        height: '60%',
                        bgcolor:
                          selectedLayout === layout.id
                            ? taxiMonterricoColors.green
                            : theme.palette.text.disabled,
                        borderRadius: 0.5,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Color */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Palette sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Color
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {colors.map((color) => (
                  <Button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    variant={selectedColor === color.id ? 'contained' : 'outlined'}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      borderRadius: 1,
                      borderColor: color.color,
                      bgcolor: selectedColor === color.id ? color.color : 'transparent',
                      color: selectedColor === color.id ? 'white' : color.color,
                      '&:hover': {
                        bgcolor: selectedColor === color.id ? color.color : `${color.color}10`,
                        borderColor: color.color,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: selectedColor === color.id ? 'white' : color.color,
                        borderRadius: 0.5,
                        mr: 1,
                      }}
                    />
                    {color.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Presets Section */}
          <Box sx={{ mb: 4 }}>
            <Chip
              label="Presets"
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
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {presets.map((preset) => (
                <Box
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 1,
                    border: `2px solid ${
                      selectedPreset === preset.id
                        ? preset.color
                        : theme.palette.divider
                    }`,
                    bgcolor:
                      selectedPreset === preset.id
                        ? `${preset.color}20`
                        : theme.palette.background.paper,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: preset.color,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: '60%',
                      height: 3,
                      bgcolor: preset.color,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      width: '60%',
                      height: 3,
                      bgcolor: preset.color,
                      borderRadius: 1,
                    }}
                  />
                  {preset.id === 0 && (
                    <Box
                      sx={{
                        width: '60%',
                        height: 3,
                        bgcolor: preset.color,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Box>
              ))}
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
