"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const axios_1 = __importDefault(require("axios"));
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Registro
router.post('/register', [
    (0, express_validator_1.body)('usuario').notEmpty().trim(),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').notEmpty().trim(),
    (0, express_validator_1.body)('lastName').notEmpty().trim(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { usuario, email, password, firstName, lastName, role } = req.body;
        const existingUser = await User_1.User.findOne({
            where: {
                [sequelize_1.Op.or]: [
                    { usuario },
                    { email }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
        }
        // Obtener el roleId basado en el nombre del rol
        const roleName = role || 'user';
        const userRole = await Role_1.Role.findOne({ where: { name: roleName } });
        if (!userRole) {
            return res.status(400).json({ error: `Rol '${roleName}' no encontrado` });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.User.create({
            usuario,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            roleId: userRole.id,
        });
        // Cargar la relación con Role para acceder a user.role
        await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        // Obtener el nombre del rol directamente de la relación
        const userRoleName = user.Role?.name || user.role || 'user';
        const token = jsonwebtoken_1.default.sign({ userId: user.id, usuario: user.usuario, email: user.email, role: userRoleName }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: userRoleName,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Login con API de Monterrico
router.post('/login-monterrico', [
    (0, express_validator_1.body)('usuario').notEmpty().trim(),
    (0, express_validator_1.body)('password').notEmpty(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { usuario, password } = req.body;
        // Llamar a la API de Monterrico
        let monterricoData;
        try {
            const monterricoResponse = await axios_1.default.post('https://rest.monterrico.app/api/Licencias/Login', {
                idacceso: usuario,
                contraseña: password,
                idempresas: 0,
                ipregistro: "0.0.0.0"
            }, {
                timeout: 10000, // 10 segundos de timeout
                validateStatus: () => true, // Aceptar todos los status codes para validar manualmente
            });
            console.log('Monterrico API Status:', monterricoResponse.status);
            console.log('Monterrico API Response:', JSON.stringify(monterricoResponse.data, null, 2));
            // Validar que la respuesta sea exitosa (200-299)
            if (monterricoResponse.status < 200 || monterricoResponse.status >= 300) {
                console.error('Monterrico API retornó status no exitoso:', monterricoResponse.status);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            monterricoData = monterricoResponse.data;
            // Validar que la respuesta no sea null o undefined
            if (!monterricoData) {
                console.error('Monterrico API retornó datos vacíos');
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            // Validar errores explícitos en la respuesta
            // Si es un string que contiene "error", rechazar
            if (typeof monterricoData === 'string') {
                const lowerData = monterricoData.toLowerCase();
                if (lowerData.includes('error') || lowerData.includes('invalid') || lowerData.includes('incorrecto') || lowerData.includes('incorrecta')) {
                    console.error('Monterrico API retornó error en string:', monterricoData);
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
            }
            // Si es un objeto, validar propiedades de error
            if (typeof monterricoData === 'object' && monterricoData !== null) {
                // Si tiene una propiedad 'error' con valor truthy, rechazar
                if (monterricoData.error !== undefined && monterricoData.error !== null && monterricoData.error !== false) {
                    console.error('Monterrico API retornó error explícito:', monterricoData.error);
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                // Si tiene 'mensajeError' con contenido, rechazar
                if (monterricoData.mensajeError && typeof monterricoData.mensajeError === 'string' && monterricoData.mensajeError.trim() !== '') {
                    console.error('Monterrico API retornó mensajeError:', monterricoData.mensajeError);
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                // Si tiene 'success' explícitamente en false, rechazar
                if (monterricoData.success === false) {
                    console.error('Monterrico API retornó success: false');
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                // Validar que la respuesta contenga al menos algún dato que indique éxito
                // La API de Monterrico debería retornar algún identificador o token cuando es exitoso
                // Si no hay ningún campo que indique éxito, rechazar
                const hasValidData = monterricoData.idacceso ||
                    monterricoData.id ||
                    monterricoData.usuario ||
                    monterricoData.token ||
                    monterricoData.accessToken ||
                    monterricoData.nombre ||
                    monterricoData.firstName ||
                    monterricoData.email ||
                    (Array.isArray(monterricoData) && monterricoData.length > 0);
                if (!hasValidData) {
                    console.error('Monterrico API no retornó datos válidos de autenticación:', monterricoData);
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
            }
            // Si llegamos aquí, la respuesta parece válida
            console.log('Monterrico API autenticación exitosa');
        }
        catch (error) {
            console.error('Error al llamar a API de Monterrico:', error.message);
            console.error('Error details:', {
                code: error.code,
                response: error.response?.data,
                status: error.response?.status
            });
            // Si es un error de timeout o conexión
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                return res.status(503).json({ error: 'No se pudo conectar con el servidor de autenticación. Intenta nuevamente.' });
            }
            // Si es un error de red con respuesta
            if (error.response) {
                // Si Monterrico retorna un error 401 o 403, las credenciales son inválidas
                if (error.response.status === 401 || error.response.status === 403) {
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                // Si es otro error 4xx, también rechazar
                if (error.response.status >= 400 && error.response.status < 500) {
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                return res.status(503).json({ error: 'Error al validar credenciales con el servidor de autenticación' });
            }
            // Si no hay respuesta pero hay error, rechazar
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Solo si la autenticación con Monterrico fue exitosa, proceder con el usuario local
        // Buscar o crear usuario local
        let user = await User_1.User.findOne({
            where: { usuario },
            include: [{ model: Role_1.Role, as: 'Role' }]
        });
        if (!user) {
            // Obtener el roleId basado en el nombre del rol
            const roleName = monterricoData.rol || monterricoData.role || 'user';
            const userRole = await Role_1.Role.findOne({ where: { name: roleName } });
            const defaultRole = userRole || await Role_1.Role.findOne({ where: { name: 'user' } });
            if (!defaultRole) {
                return res.status(500).json({ error: 'No se pudo asignar un rol al usuario' });
            }
            // Crear usuario local basado en datos de Monterrico
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            user = await User_1.User.create({
                usuario,
                email: monterricoData.email || `${usuario}@monterrico.app`,
                password: hashedPassword,
                firstName: monterricoData.nombre || monterricoData.firstName || usuario,
                lastName: monterricoData.apellido || monterricoData.lastName || '',
                roleId: defaultRole.id,
                isActive: true,
            });
            // Cargar la relación con Role
            await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        }
        else {
            // Si el usuario existe pero está inactivo, no permitir login
            if (!user.isActive) {
                return res.status(401).json({ error: 'Usuario inactivo' });
            }
            // Asegurar que la relación Role esté cargada
            if (!user.Role) {
                await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
            }
        }
        // Asegurar que el Role esté cargado antes de generar el token
        if (!user.Role) {
            await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        }
        // Obtener el nombre del rol directamente de la relación
        const roleName = user.Role?.name || user.role || 'user';
        // Generar JWT válido para el backend local
        const token = jsonwebtoken_1.default.sign({ userId: user.id, usuario: user.usuario, email: user.email, role: roleName }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: roleName,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error('Error en login-monterrico:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});
// Login local (mantener para compatibilidad)
router.post('/login', [
    (0, express_validator_1.body)('usuario').notEmpty().trim(),
    (0, express_validator_1.body)('password').notEmpty(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { usuario, password } = req.body;
        const user = await User_1.User.findOne({
            where: { usuario },
            include: [{ model: Role_1.Role, as: 'Role' }]
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Asegurar que el Role esté cargado antes de generar el token
        if (!user.Role) {
            await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        }
        // Obtener el nombre del rol directamente de la relación
        const roleName = user.Role?.name || user.role || 'user';
        const token = jsonwebtoken_1.default.sign({ userId: user.id, usuario: user.usuario, email: user.email, role: roleName }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: roleName,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener usuario actual
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await User_1.User.findByPk(req.userId, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Asegurar que el Role esté cargado
        if (!user.Role) {
            await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        }
        // Formatear respuesta para que sea consistente con el login
        // Usar user.Role?.name directamente para asegurar que el rol esté presente
        res.json({
            id: user.id,
            usuario: user.usuario,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.Role?.name || user.role || '',
            avatar: user.avatar,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar perfil de usuario
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phone, language, dateFormat, avatar } = req.body;
        const user = await User_1.User.findByPk(req.userId);
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
        if (language !== undefined)
            updateData.language = language;
        if (dateFormat !== undefined)
            updateData.dateFormat = dateFormat;
        if (avatar !== undefined)
            updateData.avatar = avatar;
        await user.update(updateData);
        const updatedUser = await User_1.User.findByPk(req.userId, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Cambiar contraseña
router.put('/change-password', auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Se requiere la contraseña actual y la nueva contraseña' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const user = await User_1.User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await user.update({ password: hashedPassword });
        res.json({ message: 'Contraseña actualizada correctamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
