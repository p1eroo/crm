import type { Theme } from '@mui/material/styles';
import { taxiMonterricoColors } from '../theme/colors';

/** Porcentaje de progreso de cada etapa (0-100 o negativo para terminales) */
const STAGE_PROGRESS: Record<string, number> = {
  lead: 0,
  contacto: 10,
  reunion_agendada: 30,
  reunion_efectiva: 40,
  propuesta_economica: 50,
  negociacion: 70,
  licitacion: 75,
  licitacion_etapa_final: 85,
  cierre_ganado: 90,
  firma_contrato: 95,
  activo: 100,
  cierre_perdido: -1,
  cliente_perdido: -1,
  lead_inactivo: -5,
};

export function getStageProgress(stage: string): number {
  return STAGE_PROGRESS[stage] ?? 0;
}

/**
 * Colores de etapa unificados (más claros) para Contactos, Empresas y Negocios.
 * Retorna { bg, color } con tonos más claros y listos para usar con fontWeight: 600.
 */
export function getStageColor(theme: Theme, stage: string): { bg: string; color: string } {
  const dark = theme.palette.mode === 'dark';
  // Fondos más claros: alpha 40 (~25%) en dark, 28 (~18%) en light
  const bgAlpha = dark ? '40' : '28';

  if (['cierre_ganado', 'firma_contrato', 'activo', 'won', 'closed won'].includes(stage)) {
    return {
      bg: dark ? `${taxiMonterricoColors.greenLight}${bgAlpha}` : `${taxiMonterricoColors.greenLight}${bgAlpha}`,
      color: taxiMonterricoColors.greenLight,
    };
  }
  if (['cierre_perdido', 'cliente_perdido', 'lost', 'closed lost'].includes(stage)) {
    return {
      bg: dark ? `${theme.palette.error.main}${bgAlpha}` : `${theme.palette.error.main}${bgAlpha}`,
      color: theme.palette.error.light || theme.palette.error.main,
    };
  }
  if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
    return {
      bg: dark ? `${taxiMonterricoColors.orange}${bgAlpha}` : `${taxiMonterricoColors.orange}${bgAlpha}`,
      color: taxiMonterricoColors.orangeLight,
    };
  }
  if (stage === 'licitacion_etapa_final' || stage === 'licitacion') {
    return {
      bg: dark ? `${theme.palette.secondary.main}${bgAlpha}` : `${theme.palette.secondary.main}${bgAlpha}`,
      color: theme.palette.secondary.light || theme.palette.secondary.main,
    };
  }
  if (['lead', 'contacto'].includes(stage)) {
    return {
      bg: dark ? `${theme.palette.primary.main}${bgAlpha}` : `${theme.palette.primary.main}${bgAlpha}`,
      color: theme.palette.primary.light || theme.palette.primary.main,
    };
  }
  if (stage === 'lead_inactivo') {
    return {
      bg: theme.palette.action.hover,
      color: theme.palette.text.secondary,
    };
  }
  return {
    bg: dark ? `${theme.palette.primary.main}${bgAlpha}` : `${theme.palette.primary.main}${bgAlpha}`,
    color: theme.palette.primary.light || theme.palette.primary.main,
  };
}
