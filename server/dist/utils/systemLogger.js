"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityTypes = exports.SystemActions = void 0;
exports.logSystemAction = logSystemAction;
const SystemLog_1 = require("../models/SystemLog");
/**
 * Registra una acción en el sistema de logs
 */
async function logSystemAction(userId, action, entityType, entityId, details, // Acepta cualquier tipo, se convierte a JSON string internamente
req) {
    try {
        await SystemLog_1.SystemLog.create({
            userId,
            action,
            entityType,
            entityId,
            details: details ? JSON.stringify(details) : undefined,
            ipAddress: req?.ip || req?.socket?.remoteAddress || undefined,
            userAgent: req?.headers['user-agent'] || undefined,
        });
    }
    catch (error) {
        // No fallar si el log falla, solo registrar en consola
        console.error('Error al registrar log del sistema:', error);
    }
}
/**
 * Acciones comunes para usar en los logs
 */
exports.SystemActions = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    VIEW: 'view',
    EXPORT: 'export',
    IMPORT: 'import',
    LOGIN: 'login',
    LOGOUT: 'logout',
    ROLE_CHANGE: 'role_change',
    STATUS_CHANGE: 'status_change',
    PASSWORD_CHANGE: 'password_change',
};
/**
 * Tipos de entidades comunes
 */
exports.EntityTypes = {
    USER: 'user',
    CONTACT: 'contact',
    COMPANY: 'company',
    DEAL: 'deal',
    TASK: 'task',
    TICKET: 'ticket',
    CAMPAIGN: 'campaign',
    AUTOMATION: 'automation',
};
