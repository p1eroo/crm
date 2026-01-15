"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
// Función para limpiar usuarios eliminando campos null y objetos relacionados null
const cleanUser = (user) => {
    const userJson = user.toJSON ? user.toJSON() : user;
    const cleaned = {
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
    if (userJson.avatar != null)
        cleaned.avatar = userJson.avatar;
    if (userJson.phone != null)
        cleaned.phone = userJson.phone;
    if (userJson.language != null)
        cleaned.language = userJson.language;
    if (userJson.dateFormat != null)
        cleaned.dateFormat = userJson.dateFormat;
    // Incluir Role solo si existe (no incluir si es null)
    if (userJson.Role != null) {
        cleaned.Role = userJson.Role;
    }
    // NO incluir googleAccessToken ni googleRefreshToken por seguridad
    // (aunque no se usan en el frontend, es mejor no enviarlos)
    return cleaned;
};
// Función helper para transformar usuarios y asegurar que el campo 'role' esté presente
const transformUser = (user) => {
    return cleanUser(user);
};
// Todas las rutas requieren autenticación y rol de administrador
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)('admin', 'jefe_comercial'));
// Listar todos los usuarios
router.get('/', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const users = await User_1.User.findAll({
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
            order: [['createdAt', 'DESC']],
        });
        const transformedUsers = users.map(user => transformUser(user));
        res.json(transformedUsers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener un usuario por ID
router.get('/:id', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const user = await User_1.User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(transformUser(user));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar rol de usuario
router.put('/:id/role', rateLimiter_1.sensitiveUserOperationLimiter, async (req, res) => {
    try {
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ error: 'Se requiere un rol' });
        }
        // Buscar el rol por nombre
        const userRole = await Role_1.Role.findOne({ where: { name: role } });
        if (!userRole) {
            return res.status(400).json({ error: `Rol '${role}' no encontrado` });
        }
        const user = await User_1.User.findByPk(req.params.id, {
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // No permitir cambiar el rol del último administrador
        if (user.role === 'admin' && role !== 'admin') {
            const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
            if (adminRole) {
                const adminCount = await User_1.User.count({ where: { roleId: adminRole.id } });
                if (adminCount <= 1) {
                    return res.status(400).json({
                        error: 'No se puede eliminar el último administrador del sistema'
                    });
                }
            }
        }
        await user.update({ roleId: userRole.id });
        await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        const updatedUser = await User_1.User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(transformUser(updatedUser));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar estado activo/inactivo de usuario
router.put('/:id/status', rateLimiter_1.sensitiveUserOperationLimiter, async (req, res) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive debe ser un valor booleano' });
        }
        const user = await User_1.User.findByPk(req.params.id, {
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // No permitir desactivar el último administrador activo
        if (user.role === 'admin' && !isActive) {
            const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
            if (adminRole) {
                const activeAdminCount = await User_1.User.count({
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
        await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        const updatedUser = await User_1.User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(transformUser(updatedUser));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar información de usuario
router.put('/:id', rateLimiter_1.writeLimiter, async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;
        const user = await User_1.User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const updateData = {};
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (phone !== undefined)
            updateData.phone = phone;
        // Validar email único si se está actualizando
        if (email !== undefined && email !== user.email) {
            const existingUser = await User_1.User.findOne({
                where: {
                    email,
                    id: { [sequelize_1.Op.ne]: user.id }
                }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está en uso' });
            }
            updateData.email = email;
        }
        await user.update(updateData);
        const updatedUser = await User_1.User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(transformUser(updatedUser));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar usuario
router.delete('/:id', rateLimiter_1.deleteLimiter, async (req, res) => {
    try {
        const user = await User_1.User.findByPk(req.params.id, {
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // No permitir eliminar el último administrador
        if (user.role === 'admin') {
            const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
            if (adminRole) {
                const adminCount = await User_1.User.count({ where: { roleId: adminRole.id } });
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
