/**
 * Formato de moneda peruana (Soles - PEN).
 * Locale es-PE para separadores y símbolo S/.
 */

const PEN_FORMAT = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const PEN_FORMAT_WITH_DECIMALS = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto en Soles (Perú). Sin decimales cuando es entero.
 * Ej: 1500 → "S/ 1,500" (o según convención es-PE)
 */
export function formatCurrencyPE(value: number): string {
  if (value == null || Number.isNaN(value)) return 'S/ 0';
  return PEN_FORMAT.format(value);
}

/**
 * Formatea un monto en Soles con 2 decimales.
 */
export function formatCurrencyPEDecimals(value: number): string {
  if (value == null || Number.isNaN(value)) return 'S/ 0,00';
  return PEN_FORMAT_WITH_DECIMALS.format(value);
}

/**
 * Solo la parte numérica en formato Perú (para usar con prefijo "S/ " manual).
 * Ej: 1500 → "1,500"
 */
export function formatAmountPE(value: number, decimals: 0 | 2 = 0): string {
  if (value == null || Number.isNaN(value)) return decimals === 2 ? '0,00' : '0';
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formato compacto para montos grandes: S/ 1.5k, S/ 2M.
 */
export function formatCurrencyPECompact(value: number): string {
  if (value == null || Number.isNaN(value)) return 'S/ 0';
  if (value >= 1000000) {
    const millions = value / 1000000;
    return millions % 1 === 0 ? `S/ ${millions.toFixed(0)}M` : `S/ ${millions.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return thousands % 1 === 0 ? `S/ ${thousands.toFixed(0)}k` : `S/ ${thousands.toFixed(1)}k`;
  }
  return formatCurrencyPE(value);
}
