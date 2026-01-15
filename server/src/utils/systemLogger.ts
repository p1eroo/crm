import { SystemLog } from '../models/SystemLog';
import { Request } from 'express';

/**
 * Registra una acción en el sistema de logs
 */
export async function logSystemAction(
  userId: number,
  action: string,
  entityType: string,
  entityId?: number,
  details?: any, // Acepta cualquier tipo, se convierte a JSON string internamente
  req?: Request
): Promise<void> {
  try {
    await SystemLog.create({
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress: req?.ip || req?.socket?.remoteAddress || undefined,
      userAgent: req?.headers['user-agent'] || undefined,
    });
  } catch (error) {
    // No fallar si el log falla, solo registrar en consola
    console.error('Error al registrar log del sistema:', error);
  }
}

/**
 * Acciones comunes para usar en los logs
 */
export const SystemActions = {
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
} as const;

/**
 * Tipos de entidades comunes
 */
export const EntityTypes = {
  USER: 'user',
  CONTACT: 'contact',
  COMPANY: 'company',
  DEAL: 'deal',
  TASK: 'task',
  TICKET: 'ticket',
  CAMPAIGN: 'campaign',
  AUTOMATION: 'automation',
} as const;
