import { AuthRequest } from '../middleware/auth';

// Jerarquía de roles (de menor a mayor privilegio)
const ROLE_HIERARCHY: { [key: string]: number } = {
  'user': 1,
  'manager': 2,
  'jefe_comercial': 3,
  'admin': 4,
};

/**
 * Verifica si un rol tiene permisos sobre otro rol
 */
export function hasRolePermission(userRole: string | undefined, requiredRole: string): boolean {
  if (!userRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Verifica si un usuario puede realizar una acción basada en su rol
 */
export function canPerformAction(userRole: string | undefined, action: string): boolean {
  if (!userRole) return false;

  const permissions: { [key: string]: string[] } = {
    'view_all_data': ['admin', 'jefe_comercial'],
    'edit_all_data': ['admin'],
    'delete_data': ['admin'],
    'manage_users': ['admin'],
    'view_reports': ['admin', 'jefe_comercial', 'manager'],
    'manage_settings': ['admin'],
  };

  const allowedRoles = permissions[action] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Obtiene el filtro WHERE para datos basado en el rol del usuario
 */
export function getRoleBasedDataFilter(userRole: string | undefined, userId: number | undefined): any {
  if (!userRole || !userId) {
    return { ownerId: userId || null };
  }

  // Admin ve todo (sin filtro)
  if (userRole === 'admin') {
    return {};
  }

  // Jefe comercial ve todos los datos (como admin)
  if (userRole === 'jefe_comercial') {
    return {};
  }

  // Manager ve sus datos y datos de su equipo (por ahora, solo sus datos)
  if (userRole === 'manager') {
    return { ownerId: userId };
  }

  // User solo ve sus propios datos
  return { ownerId: userId };
}

/**
 * Verifica si un usuario puede modificar un recurso
 */
export function canModifyResource(
  userRole: string | undefined,
  userId: number | undefined,
  resourceOwnerId: number | null | undefined
): boolean {
  if (!userRole || !userId) return false;

  // Admin puede modificar todo
  if (userRole === 'admin') return true;

  // Solo puede modificar si es el propietario
  return resourceOwnerId === userId;
}

/**
 * Verifica si un usuario puede eliminar un recurso
 */
export function canDeleteResource(
  userRole: string | undefined,
  userId: number | undefined,
  resourceOwnerId: number | null | undefined
): boolean {
  if (!userRole || !userId) return false;

  // Admin puede eliminar todo
  if (userRole === 'admin') return true;

  // Solo puede eliminar si es el propietario
  return resourceOwnerId === userId;
}
