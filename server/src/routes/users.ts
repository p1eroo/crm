import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(requireRole('admin'));

// Listar todos los usuarios
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario por ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar rol de usuario
router.put('/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'user', 'manager', 'jefe_comercial'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Rol inválido. Roles válidos: ${validRoles.join(', ')}` 
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir cambiar el rol del último administrador
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el último administrador del sistema' 
        });
      }
    }

    await user.update({ role });

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado activo/inactivo de usuario
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive debe ser un valor booleano' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir desactivar el último administrador activo
    if (user.role === 'admin' && !isActive) {
      const activeAdminCount = await User.count({ 
        where: { role: 'admin', isActive: true } 
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ 
          error: 'No se puede desactivar el último administrador activo del sistema' 
        });
      }
    }

    await user.update({ isActive });

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar información de usuario
router.put('/:id', async (req: AuthRequest, res: Response) => {
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
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar el último administrador
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el último administrador del sistema' 
        });
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

