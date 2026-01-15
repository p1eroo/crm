import rateLimit from 'express-rate-limit';

// Rate limiter para endpoints de autenticación (más restrictivo)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 20 : 5, // Más permisivo en producción (20 vs 5)
  message: {
    error: 'Demasiados intentos de autenticación. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true, // Retorna información de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
  skipSuccessfulRequests: true, // Solo contar intentos fallidos, no los exitosos
});

// Rate limiter para registro (un poco menos restrictivo que login)
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requests por ventana
  message: {
    error: 'Demasiados intentos de registro. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para endpoints autenticados (menos restrictivo)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por ventana (aumentado para permitir navegación fluida)
  message: {
    error: 'Demasiadas solicitudes. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Solo contar peticiones fallidas, no las exitosas
});

// Rate limiter para operaciones pesadas (importación, etc.)
export const heavyOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 requests por hora
  message: {
    error: 'Demasiadas operaciones pesadas. Por favor, intenta nuevamente en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para operaciones de escritura (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por ventana
  message: {
    error: 'Demasiadas operaciones de escritura. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para operaciones de eliminación (más restrictivo)
export const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 requests por ventana
  message: {
    error: 'Demasiadas operaciones de eliminación. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para operaciones sensibles de usuarios (cambios de rol, etc.)
export const sensitiveUserOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requests por ventana (muy restrictivo)
  message: {
    error: 'Demasiadas operaciones sensibles. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para búsqueda (más restrictivo porque puede ser abusado)
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por ventana
  message: {
    error: 'Demasiadas búsquedas. Por favor, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
