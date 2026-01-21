/**
 * Utilidades de logging condicional
 * Solo muestra logs en desarrollo, nunca en producción
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log normal - solo en desarrollo
 */
export const log = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Warning - solo en desarrollo
 */
export const logWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Info - solo en desarrollo
 */
export const logInfo = (...args: any[]) => {
  if (isDevelopment) {
    console.info(...args);
  }
};

/**
 * Debug - solo en desarrollo
 */
export const logDebug = (...args: any[]) => {
  if (isDevelopment) {
    console.debug(...args);
  }
};

/**
 * Error - siempre se muestra (incluso en producción)
 * Los errores son críticos y deben ser visibles
 */
export const logError = (...args: any[]) => {
  console.error(...args);
};

/**
 * Objeto con todas las funciones para uso conveniente
 */
const logger = {
  log,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  error: logError,
};

export default logger;
