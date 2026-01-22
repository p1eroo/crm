"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLimiter = exports.sensitiveUserOperationLimiter = exports.deleteLimiter = exports.writeLimiter = exports.heavyOperationLimiter = exports.apiLimiter = exports.registerLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiter para endpoints de autenticación (más restrictivo)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 requests por ventana
    message: {
        error: 'Demasiados intentos de autenticación. Por favor, intenta nuevamente en 15 minutos.',
    },
    standardHeaders: true, // Retorna información de rate limit en headers `RateLimit-*`
    legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
    skipSuccessfulRequests: false, // Contar todos los requests, incluso los exitosos
});
// Rate limiter para registro (un poco menos restrictivo que login)
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 requests por ventana
    message: {
        error: 'Demasiados intentos de registro. Por favor, intenta nuevamente en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter para endpoints autenticados (menos restrictivo)
exports.apiLimiter = (0, express_rate_limit_1.default)({
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
exports.heavyOperationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // máximo 5 requests por hora
    message: {
        error: 'Demasiadas operaciones pesadas. Por favor, intenta nuevamente en 1 hora.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter para operaciones de escritura (POST, PUT, DELETE)
exports.writeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // máximo 50 requests por ventana
    message: {
        error: 'Demasiadas operaciones de escritura. Por favor, intenta nuevamente en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter para operaciones de eliminación (más restrictivo)
exports.deleteLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // máximo 20 requests por ventana
    message: {
        error: 'Demasiadas operaciones de eliminación. Por favor, intenta nuevamente en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter para operaciones sensibles de usuarios (cambios de rol, etc.)
exports.sensitiveUserOperationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 requests por ventana (muy restrictivo)
    message: {
        error: 'Demasiadas operaciones sensibles. Por favor, intenta nuevamente en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter para búsqueda (más restrictivo porque puede ser abusado)
exports.searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // máximo 50 requests por ventana
    message: {
        error: 'Demasiadas búsquedas. Por favor, intenta nuevamente en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
