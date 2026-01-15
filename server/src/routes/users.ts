import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { apiLimiter, writeLimiter, deleteLimiter, sensitiveUserOperationLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Función para limpiar usuarios eliminando campos null y objetos relacionados null
const cleanUser = (user: any): any => {
  const userJson = user.toJSON ? user.toJSON() : user;
  const cleaned: any = {
    id: userJson.id,
    email: userJson.email,
    usuario: userJson.usuario,
    firstName: userJson.firstName,
    lastName: userJson.lastName,
    roleId: userJson.roleId,
    isActive: userJson.isActive,
    createdAt: userJson.createdAt,
    updatedAt: userJson.updatedAt,
    // Transformar role
    role: userJson.Role?.name || userJson.role || '',
  };

  // Solo incluir campos opcionales si no son null
  if (userJson.avatar != null) cleaned.avatar = userJson.avatar;
  if (userJson.phone != null) cleaned.phone = userJson.phone;
  if (userJson.language != null) cleaned.language = userJson.language;
  if (userJson.dateFormat != null) cleaned.dateFormat = userJson.dateFormat;
  
  // Incluir Role solo si existe (no incluir si es null)
  if (userJson.Role != null) {
    cleaned.Role = userJson.Role;
  }

  // NO incluir googleAccessToken ni googleRefreshToken por seguridad
  // (aunque no se usan en el frontend, es mejor no enviarlos)

  return cleaned;
};

// Función helper para transformar usuarios y asegurar que el campo 'role' esté presente
const transformUser = (user: any) => {
  return cleanUser(user);
};

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(requireRole('admin', 'jefe_comercial'));

// Listar todos los usuarios
router.get('/', apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'Role' }],
      order: [['createdAt', 'DESC']],
    });

    const transformedUsers = users.map(user => transformUser(user));
    res.json(transformedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario por ID
router.get('/:id', apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'Role' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(transformUser(user));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar rol de usuario
router.put('/:id/role', sensitiveUserOperationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Se requiere un rol' });
    }

    // Buscar el rol por nombre
    const userRole = await Role.findOne({ where: { name: role } });
    if (!userRole) {
      return res.status(400).json({ error: `Rol '${role}' no encontrado` });
    }

    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, as: 'Role' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir cambiar el rol del último administrador
    if (user.role === 'admin' && role !== 'admin') {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        const adminCount = await User.count({ where: { roleId: adminRole.id } });
        if (adminCount <= 1) {
          return res.status(400).json({ 
            error: 'No se puede eliminar el último administrador del sistema' 
          });
        }
      }
    }

    await user.update({ roleId: userRole.id });
    await user.reload({ include: [{ model: Role, as: 'Role' }] });

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'Role' }],
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(transformUser(updatedUser));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado activo/inactivo de usuario
router.put('/:id/status', sensitiveUserOperationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive debe ser un valor booleano' });
    }

    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, as: 'Role' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir desactivar el último administrador activo
    if (user.role === 'admin' && !isActive) {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        const activeAdminCount = await User.count({ 
          where: { roleId: adminRole.id, isActive: true } 
        });
        if (activeAdminCount <= 1) {
          return res.status(400).json({ 
            error: 'No se puede desactivar el último administrador activo del sistema' 
          });
        }
      }
    }

    await user.update({ isActive });
    await user.reload({ include: [{ model: Role, as: 'Role' }] });

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'Role' }],
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(transformUser(updatedUser));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar información de usuario
router.put('/:id', writeLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    // Validar email único si se está actualizando
    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: user.id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
      updateData.email = email;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'Role' }],
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(transformUser(updatedUser));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', deleteLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, as: 'Role' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar el último administrador
    if (user.role === 'admin') {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        const adminCount = await User.count({ where: { roleId: adminRole.id } });
        if (adminCount <= 1) {
          return res.status(400).json({ 
            error: 'No se puede eliminar el último administrador del sistema' 
          });
        }
      }
    }

    // No permitir que un usuario se elimine a sí mismo
    if (user.id === req.userId) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu propio usuario' 
      });
    }

    await user.destroy();

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

