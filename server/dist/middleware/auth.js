"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const rolePermissions_1 = require("../utils/rolePermissions");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // Logging solo en desarrollo y solo cuando hay problemas
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && !token) {
        console.log('🔐 Autenticación - Path:', req.path);
        console.log('🔐 Autenticación - Origin:', req.headers.origin);
        console.log('🔐 Autenticación - Host:', req.headers.host);
        console.log('🔐 Autenticación - Authorization header presente:', !!authHeader);
        console.log('🔐 Autenticación - Token presente:', !!token);
    }
    if (!token) {
        // Solo loguear errores en desarrollo o en rutas que no deberían estar sin token
        if (isDevelopment) {
            console.error('❌ No token provided in request to:', req.path);
            console.error('❌ Headers recibidos:', {
                authorization: req.headers.authorization ? 'Presente' : 'Ausente',
                origin: req.headers.origin,
                host: req.headers.host,
            });
        }
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        try {
            if (err) {
                // Solo loguear errores en desarrollo
                if (isDevelopment) {
                    console.error('❌ Token verification failed:', err.message, 'for path:', req.path);
                    console.error('❌ Token recibido:', token.substring(0, 20) + '...');
                    console.error('❌ Error completo:', err);
                }
                return res.status(403).json({ error: 'Token inválido o expirado' });
            }
            // Verificar que decoded tenga userId
            if (!decoded.userId) {
                if (isDevelopment) {
                    console.error('❌ Token decoded but no userId found:', decoded);
                }
                return res.status(403).json({ error: 'Token inválido: falta userId' });
            }
            req.userId = decoded.userId;
            req.userRole = decoded.role;
            req.user = {
                id: decoded.userId,
                usuario: decoded.usuario,
                email: decoded.email,
                role: decoded.role,
            };
            console.log(`[AUTH] Después de establecer req.userRole desde token:`, req.userRole, 'para userId:', req.userId, 'en path:', req.path);
            // Si el token no tiene role, obtenerlo de la base de datos
            if (!decoded.role && decoded.userId) {
                try {
                    const user = await User_1.User.findByPk(decoded.userId, {
                        include: [{ model: Role_1.Role, as: 'Role' }],
                    });
                    if (user && user.Role) {
                        req.userRole = user.Role.name;
                        req.user.role = user.Role.name;
                        if (isDevelopment) {
                            console.log('⚠️ Role obtenido de BD para usuario:', decoded.userId, 'Role:', user.Role.name);
                        }
                    }
                    else {
                        // Si no se encuentra el usuario o el rol, usar 'user' por defecto
                        req.userRole = 'user';
                        req.user.role = 'user';
                        if (isDevelopment) {
                            console.warn('⚠️ Usuario o rol no encontrado, usando "user" por defecto para userId:', decoded.userId);
                        }
                    }
                }
                catch (dbError) {
                    // Si hay error al obtener el rol, usar 'user' por defecto
                    req.userRole = 'user';
                    req.user.role = 'user';
                    if (isDevelopment) {
                        console.error('❌ Error al obtener rol de BD:', dbError);
                    }
                }
            }
            // Asegurar que siempre haya un rol asignado antes de continuar
            if (!req.userRole) {
                req.userRole = 'user';
                req.user.role = 'user';
                if (isDevelopment) {
                    console.warn('⚠️ req.userRole era undefined, usando "user" por defecto');
                }
            }
            // Solo loguear en desarrollo para no saturar los logs
            if (isDevelopment) {
                console.log('✅ Token válido para usuario:', decoded.userId, 'rol:', req.userRole, 'en path:', req.path);
            }
            console.log(`[AUTH] Antes de next(), req.userRole final:`, req.userRole, 'req.userId:', req.userId, 'en path:', req.path);
            // Asegurar que siempre se llame a next() o se retorne una respuesta
            next();
        }
        catch (error) {
            // Manejar cualquier error inesperado en el callback
            console.error('❌ Error inesperado en authenticateToken:', error);
            // Asegurar que el usuario tenga un rol por defecto incluso si hay error
            if (!req.userRole) {
                req.userRole = 'user';
                if (req.user) {
                    req.user.role = 'user';
                }
            }
            // Continuar con la petición con rol por defecto en lugar de bloquearla
            // Esto permite que el sistema funcione incluso si hay problemas menores
            if (isDevelopment) {
                console.warn('⚠️ Continuando con rol por defecto debido a error:', error.message);
            }
            next();
        }
    });
};
exports.authenticateToken = authenticateToken;
// Middleware mejorado con soporte de jerarquía de roles
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        }
        // Verificar si el usuario tiene alguno de los roles requeridos o un rol superior
        const hasPermission = roles.some(role => (0, rolePermissions_1.hasRolePermission)(req.userRole, role));
        if (!hasPermission) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        }
        next();
    };
};
exports.requireRole = requireRole;
