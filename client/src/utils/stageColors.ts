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

/** IDs de etapa válidos (enum del backend) */
const VALID_STAGE_IDS = new Set<string>(Object.keys(STAGE_PROGRESS));

/** Etapas con progreso positivo ordenadas por porcentaje (para mapeo inverso) */
const STAGE_BY_PERCENT = (() => {
  const entries = Object.entries(STAGE_PROGRESS).filter(([, p]) => p >= 0 && p <= 100);
  entries.sort((a, b) => a[1] - b[1]);
  return entries as [string, number][];
})();

/**
 * Dado un porcentaje (0-100 o negativo), devuelve el id de etapa más cercano.
 * Negativos: -5 → lead_inactivo, -1 → cierre_perdido.
 */
export function getStageFromProgress(percent: number): string {
  if (percent <= -2) return 'lead_inactivo';   // -5, etc.
  if (percent < 0) return 'cierre_perdido';   // -1
  if (percent >= 100) return 'activo';
  let best = STAGE_BY_PERCENT[0];
  let minDist = Math.abs(best[1] - percent);
  for (let i = 1; i < STAGE_BY_PERCENT.length; i++) {
    const d = Math.abs(STAGE_BY_PERCENT[i][1] - percent);
    if (d < minDist) {
      minDist = d;
      best = STAGE_BY_PERCENT[i];
    }
  }
  return best[0];
}

/**
 * Normaliza el valor de la columna "Etapa" en importación Excel.
 * Acepta: id de etapa (lead, activo, ...), número (50, 0.5) o porcentaje ("50%", "10%").
 * Si Excel devuelve 0.1 para una celda 10%, se traduce a la etapa correspondiente (contacto).
 * Solo se aceptan los porcentajes definidos en las etapas; cualquier otro valor cae en 'lead'.
 */
export function normalizeStageFromExcel(value: unknown): string {
  const trimmed = (value !== undefined && value !== null ? String(value) : '').trim();
  if (!trimmed) return 'lead';
  const lower = trimmed.toLowerCase();
  if (VALID_STAGE_IDS.has(lower)) return lower;
  const numStr = trimmed.replace(/%/g, '').trim();
  const num = parseFloat(numStr);
  if (!Number.isNaN(num)) {
    const percent = num <= 1 && num >= 0 ? num * 100 : num;
    const stage = getStageFromProgress(percent);
    return VALID_STAGE_IDS.has(stage) ? stage : 'lead';
  }
  return 'lead';
}

/**
 * Colores de etapa unificados (más claros) para Contactos, Empresas y Negocios.
 * Retorna { bg, color } con tonos más claros y listos para usar con fontWeight: 600.
 * En modo claro usa fondos más saturados y texto más oscuro para mejor contraste.
 */
export function getStageColor(theme: Theme, stage: string): { bg: string; color: string } {
  const dark = theme.palette.mode === 'dark';
  const bgAlpha = dark ? '40' : '4D'; // dark: ~25%, light: ~30% para mayor visibilidad

  if (['cierre_ganado', 'firma_contrato', 'activo', 'won', 'closed won'].includes(stage)) {
    return {
      bg: dark ? `${taxiMonterricoColors.greenLight}${bgAlpha}` : taxiMonterricoColors.successLight,
      color: dark ? taxiMonterricoColors.greenLight : taxiMonterricoColors.greenDark,
    };
  }
  if (['cierre_perdido', 'cliente_perdido', 'lost', 'closed lost'].includes(stage)) {
    return {
      bg: dark ? `${theme.palette.error.main}${bgAlpha}` : taxiMonterricoColors.errorLight,
      color: dark ? (theme.palette.error.light || theme.palette.error.main) : taxiMonterricoColors.errorDark,
    };
  }
  if (['reunion_agendada', 'reunion_efectiva', 'propuesta_economica', 'negociacion'].includes(stage)) {
    return {
      bg: dark ? `${taxiMonterricoColors.orange}${bgAlpha}` : taxiMonterricoColors.warningMedium,
      color: dark ? taxiMonterricoColors.orangeLight : taxiMonterricoColors.warningDark,
    };
  }
  if (stage === 'licitacion_etapa_final' || stage === 'licitacion') {
    return {
      bg: dark ? `${theme.palette.secondary.main}${bgAlpha}` : taxiMonterricoColors.amberLight,
      color: dark ? (theme.palette.secondary.light || theme.palette.secondary.main) : taxiMonterricoColors.amberDark,
    };
  }
  if (['lead', 'contacto'].includes(stage)) {
    return {
      bg: dark ? `${theme.palette.primary.main}${bgAlpha}` : taxiMonterricoColors.successLight,
      color: dark ? (theme.palette.primary.light || theme.palette.primary.main) : taxiMonterricoColors.greenDark,
    };
  }
  if (stage === 'lead_inactivo') {
    return {
      bg: theme.palette.action.hover,
      color: theme.palette.text.secondary,
    };
  }
  return {
    bg: dark ? `${theme.palette.primary.main}${bgAlpha}` : taxiMonterricoColors.successLight,
    color: dark ? (theme.palette.primary.light || theme.palette.primary.main) : taxiMonterricoColors.greenDark,
  };
}
