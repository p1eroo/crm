import express, { Response } from 'express';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { canPerformAction } from '../utils/rolePermissions';

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('admin')); // Solo admin puede ver roles y permisos

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
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']],
    });

    // Obtener conteo de usuarios por rol
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.count({ where: { roleId: role.id, isActive: true } });
        
        // Calcular permisos para cada rol
        const permissions = Object.keys(ALL_PERMISSIONS).map((permissionKey) => {
          const hasPermission = canPerformAction(role.name, permissionKey);
          return {
            key: permissionKey,
            name: ALL_PERMISSIONS[permissionKey as keyof typeof ALL_PERMISSIONS],
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
      })
    );

    res.json({ roles: rolesWithPermissions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
