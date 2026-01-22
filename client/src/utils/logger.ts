// Sistema de logging para la aplicación CRM
// Proporciona funciones de logging consistentes en toda la aplicación

/**
 * Log de información general
 * @param message Mensaje a loguear
 * @param data Datos adicionales opcionales
 */
export const log = (message: string, ...data: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[INFO] ${message}`, ...data);
  }
};

/**
 * Log de advertencias
 * @param message Mensaje de advertencia
 * @param data Datos adicionales opcionales
 */
export const logWarn = (message: string, ...data: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[WARN] ${message}`, ...data);
  }
};

/**
 * Log de errores
 * @param message Mensaje de error
 * @param error Objeto de error opcional
 * @param data Datos adicionales opcionales
 */
export const logError = (message: string, error?: Error | unknown, ...data: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${message}`, error || '', ...data);
  }
};
