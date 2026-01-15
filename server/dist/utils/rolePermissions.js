"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRolePermission = hasRolePermission;
exports.canPerformAction = canPerformAction;
exports.getRoleBasedDataFilter = getRoleBasedDataFilter;
exports.canModifyResource = canModifyResource;
exports.canDeleteResource = canDeleteResource;
// Jerarquía de roles (de menor a mayor privilegio)
const ROLE_HIERARCHY = {
    'user': 1,
    'manager': 2,
    'jefe_comercial': 3,
    'admin': 4,
};
/**
 * Verifica si un rol tiene permisos sobre otro rol
 */
function hasRolePermission(userRole, requiredRole) {
    if (!userRole)
        return false;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
}
/**
 * Verifica si un usuario puede realizar una acción basada en su rol
 */
function canPerformAction(userRole, action) {
    if (!userRole)
        return false;
    const permissions = {
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
function getRoleBasedDataFilter(userRole, userId) {
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
function canModifyResource(userRole, userId, resourceOwnerId) {
    if (!userRole || !userId)
        return false;
    // Admin puede modificar todo
    if (userRole === 'admin')
        return true;
    // Solo puede modificar si es el propietario
    return resourceOwnerId === userId;
}
/**
 * Verifica si un usuario puede eliminar un recurso
 */
function canDeleteResource(userRole, userId, resourceOwnerId) {
    if (!userRole || !userId)
        return false;
    // Admin puede eliminar todo
    if (userRole === 'admin')
        return true;
    // Solo puede eliminar si es el propietario
    return resourceOwnerId === userId;
}
