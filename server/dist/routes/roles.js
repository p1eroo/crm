"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Role_1 = require("../models/Role");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const rolePermissions_1 = require("../utils/rolePermissions");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)('admin')); // Solo admin puede ver roles y permisos
// Definir todos los permisos disponibles
const ALL_PERMISSIONS = {
    'view_all_data': 'Ver todos los datos',
    'edit_all_data': 'Editar todos los datos',
    'delete_data': 'Eliminar datos',
    'manage_users': 'Gestionar usuarios',
    'view_reports': 'Ver reportes',
    'manage_settings': 'Gestionar configuración',
    'view_system_logs': 'Ver logs del sistema',
};
// Obtener todos los roles con sus permisos
router.get('/', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const roles = await Role_1.Role.findAll({
            order: [['name', 'ASC']],
        });
        // Obtener conteo de usuarios por rol
        const rolesWithPermissions = await Promise.all(roles.map(async (role) => {
            const userCount = await User_1.User.count({ where: { roleId: role.id, isActive: true } });
            // Calcular permisos para cada rol
            const permissions = Object.keys(ALL_PERMISSIONS).map((permissionKey) => {
                const hasPermission = (0, rolePermissions_1.canPerformAction)(role.name, permissionKey);
                return {
                    key: permissionKey,
                    name: ALL_PERMISSIONS[permissionKey],
                    granted: hasPermission,
                };
            });
            return {
                id: role.id,
                name: role.name,
                description: role.description || '',
                userCount,
                permissions,
            };
        }));
        res.json({ roles: rolesWithPermissions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
