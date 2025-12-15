"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // Logging mejorado para debug
    console.log('🔐 Autenticación - Path:', req.path);
    console.log('🔐 Autenticación - Origin:', req.headers.origin);
    console.log('🔐 Autenticación - Host:', req.headers.host);
    console.log('🔐 Autenticación - Authorization header presente:', !!authHeader);
    console.log('🔐 Autenticación - Token presente:', !!token);
    if (!token) {
        console.error('❌ No token provided in request to:', req.path);
        console.error('❌ Headers recibidos:', {
            authorization: req.headers.authorization ? 'Presente' : 'Ausente',
            origin: req.headers.origin,
            host: req.headers.host,
        });
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
            console.error('❌ Token verification failed:', err.message, 'for path:', req.path);
            console.error('❌ Token recibido:', token.substring(0, 20) + '...');
            console.error('❌ Error completo:', err);
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        // Verificar que decoded tenga userId
        if (!decoded.userId) {
            console.error('❌ Token decoded but no userId found:', decoded);
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
        // Solo loguear en desarrollo para no saturar los logs
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Token válido para usuario:', decoded.userId, 'en path:', req.path);
        }
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        }
        next();
    };
};
exports.requireRole = requireRole;
