import React from 'react';
import { Box, Chip, LinearProgress, Typography, useTheme } from '@mui/material';
import { getStageProgress } from '../utils/stageColors';
import type { ChipProps } from '@mui/material/Chip';

interface StageChipWithProgressProps extends Omit<ChipProps, 'label'> {
  stage: string;
  label: string;
  /** Color de fondo del chip (de getStageColor) */
  chipBg?: string;
  /** Color de texto del chip (de getStageColor) */
  chipColor?: string;
  /** Ancho de la barra de progreso (por defecto 100% del contenedor) */
  barWidth?: number | string;
}

/**
 * Chip de etapa con barra de progreso debajo.
 * Usa getStageProgress(stage) para el porcentaje de la barra.
 */
export const StageChipWithProgress: React.FC<StageChipWithProgressProps> = ({
  stage,
  label,
  chipBg,
  chipColor,
  barWidth = '100%',
  sx,
  ...chipProps
}) => {
  const theme = useTheme();
  const progress = getStageProgress(stage);
  const showValue = Math.max(0, Math.min(100, progress));
  const isNegative = progress < 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, width: barWidth, alignItems: 'flex-start', ...sx }}>
      <Chip
        label={label}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: { xs: '0.6875rem', md: '0.8125rem' },
          height: { xs: 20, md: 24 },
          cursor: chipProps.onClick ? 'pointer' : 'default',
          bgcolor: chipBg,
          color: chipColor,
          '&:hover': chipProps.onClick ? { opacity: 0.8 } : undefined,
        }}
        {...chipProps}
      />
      <Box sx={{ position: 'relative', width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: theme.palette.action.hover }}>
        <LinearProgress
          variant="determinate"
          value={showValue}
          sx={{
            height: '100%',
            borderRadius: 4,
            bgcolor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              bgcolor: isNegative ? theme.palette.text.disabled : theme.palette.primary.main,
            },
          }}
        />
        <Typography
          component="span"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '0.625rem',
            fontWeight: 600,
            color: showValue > 40 ? 'common.white' : theme.palette.text.primary,
            textShadow: showValue > 40 ? '0 0 1px rgba(0,0,0,0.5)' : 'none',
            pointerEvents: 'none',
          }}
        >
          {isNegative ? `${progress}%` : `${showValue}%`}
        </Typography>
      </Box>
    </Box>
  );
};

export default StageChipWithProgress;
