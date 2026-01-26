import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Slider,
  useTheme,
} from '@mui/material';
import { Palette } from '@mui/icons-material';
import { taxiMonterricoColors } from '../theme/colors';
import { useAppearance, colorPresets, fonts } from '../context/AppearanceContext';

interface AppearanceSettingsProps {
  showTitle?: boolean;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ showTitle = true }) => {
  const theme = useTheme();
  const {
    selectedColorPreset,
    selectedFont,
    fontSize,
    setColorPreset,
    setFont,
    setFontSize,
  } = useAppearance();

  const handleColorPresetChange = (presetId: string) => {
    setColorPreset(presetId);
  };

  const handleFontChange = (fontId: string) => {
    setFont(fontId);
  };

  const handleFontSizeChange = (_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const size = Array.isArray(newValue) ? newValue[0] : newValue;
    // Aplicar cambio inmediatamente:
    // 1. Actualiza el estado en AppearanceContext
    // 2. Guarda en localStorage automáticamente
    // 3. El useEffect en AppearanceContext aplica los estilos CSS
    // 4. El useMemo en App.tsx recrea el tema de MUI con el nuevo fontSize
    // 5. Toda la UI se actualiza en tiempo real
    setFontSize(size);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {showTitle && (
        <Chip
          label="Apariencia"
          icon={<Palette sx={{ fontSize: 14 }} />}
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
      )}

      {/* Selector de Color */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '0.875rem',
              opacity: 0.9,
            }}
          >
            Color
          </Typography>
          {selectedColorPreset && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {colorPresets.find(p => p.id === selectedColorPreset)?.name || 'Verde'}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 1.5 
        }}>
          {colorPresets.map((preset) => {
            const isActive = selectedColorPreset === preset.id;
            return (
              <Box
                key={preset.id}
                onClick={() => handleColorPresetChange(preset.id)}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 2,
                  px: 1.5,
                  borderRadius: '14px',
                  border: `1.5px solid ${
                    isActive
                      ? preset.color
                      : theme.palette.divider
                  }`,
                  bgcolor:
                    isActive
                      ? theme.palette.mode === 'dark'
                        ? `${preset.color}20`
                        : `${preset.color}10`
                      : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive 
                    ? theme.palette.mode === 'dark'
                      ? `0 2px 8px ${preset.color}30, 0 1px 3px rgba(0, 0, 0, 0.1)`
                      : `0 2px 8px ${preset.color}25, 0 1px 3px rgba(0, 0, 0, 0.05)`
                    : 'none',
                  '&:hover': {
                    borderColor: preset.color,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? `${preset.color}15`
                        : `${preset.color}08`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? `0 4px 12px ${preset.color}25, 0 2px 6px rgba(0, 0, 0, 0.1)`
                      : `0 4px 12px ${preset.color}20, 0 2px 6px rgba(0, 0, 0, 0.05)`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: preset.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 4px ${preset.color}40`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#fff',
                      }}
                    />
                  </Box>
                )}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: preset.color,
                    border: `2px solid ${
                      isActive
                        ? '#fff'
                        : 'transparent'
                    }`,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive 
                      ? `0 0 0 2px ${preset.color}`
                      : 'none',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive 
                      ? preset.color 
                      : theme.palette.text.primary,
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                >
                  {preset.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Selector de Fuente */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '0.875rem',
              opacity: 0.9,
            }}
          >
            Fuente
          </Typography>
          {selectedFont && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 500,
                fontFamily: fonts.find(f => f.id === selectedFont)?.value || 'Inter',
              }}
            >
              {fonts.find(f => f.id === selectedFont)?.name || 'Inter'}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {fonts.map((font) => {
            const isActive = selectedFont === font.id;
            const activeColor = colorPresets.find(p => p.id === selectedColorPreset)?.color || taxiMonterricoColors.green;
            return (
              <Box
                key={font.id}
                onClick={() => handleFontChange(font.id)}
                sx={{
                  position: 'relative',
                  py: 1.5,
                  px: 2,
                  borderRadius: '12px',
                  border: `1.5px solid ${
                    isActive
                      ? activeColor
                      : theme.palette.divider
                  }`,
                  bgcolor:
                    isActive
                      ? theme.palette.mode === 'dark'
                        ? `${activeColor}20`
                        : `${activeColor}10`
                      : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive 
                    ? theme.palette.mode === 'dark'
                      ? `0 2px 8px ${activeColor}30, 0 1px 3px rgba(0, 0, 0, 0.1)`
                      : `0 2px 8px ${activeColor}25, 0 1px 3px rgba(0, 0, 0, 0.05)`
                    : 'none',
                  '&:hover': {
                    borderColor: activeColor,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? `${activeColor}15`
                        : `${activeColor}08`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? `0 4px 12px ${activeColor}25, 0 2px 6px rgba(0, 0, 0, 0.1)`
                      : `0 4px 12px ${activeColor}20, 0 2px 6px rgba(0, 0, 0, 0.05)`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: activeColor,
                      boxShadow: `0 0 0 2px ${activeColor}30`,
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive 
                      ? activeColor 
                      : theme.palette.text.primary,
                    fontFamily: font.value,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {font.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Control de Tamaño de Fuente */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '0.875rem',
              opacity: 0.9,
            }}
          >
            Tamaño de fuente
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colorPresets.find(p => p.id === selectedColorPreset)?.color || taxiMonterricoColors.green,
              fontWeight: 600,
              fontSize: '0.875rem',
              fontFamily: fonts.find(f => f.id === selectedFont)?.value || 'Inter',
            }}
          >
            {fontSize}px
          </Typography>
        </Box>
        <Slider
          value={fontSize}
          onChange={handleFontSizeChange}
          min={12}
          max={20}
          step={1}
          sx={{
            color: colorPresets.find(p => p.id === selectedColorPreset)?.color || taxiMonterricoColors.green,
            '& .MuiSlider-thumb': {
              width: 18,
              height: 18,
              border: `2px solid ${theme.palette.background.paper}`,
              '&:hover': {
                boxShadow: `0 0 0 8px ${(colorPresets.find(p => p.id === selectedColorPreset)?.color || taxiMonterricoColors.green)}20`,
              },
            },
            '& .MuiSlider-track': {
              height: 4,
              borderRadius: 2,
            },
            '& .MuiSlider-rail': {
              height: 4,
              borderRadius: 2,
              opacity: 0.3,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
            Pequeño
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
            Grande
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
