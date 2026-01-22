import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasRolePermission } from '../utils/rolePermissions';
import { User } from '../models/User';
import { Role } from '../models/Role';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  user?: {
    id: number;
    usuario?: string;
    email?: string;
    role?: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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

  jwt.verify(token, process.env.JWT_SECRET!, async (err: any, decoded: any) => {
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
          const user = await User.findByPk(decoded.userId, {
            include: [{ model: Role, as: 'Role' }],
          });
          if (user && (user as any).Role) {
            req.userRole = (user as any).Role.name;
            req.user.role = (user as any).Role.name;
            if (isDevelopment) {
              console.log('⚠️ Role obtenido de BD para usuario:', decoded.userId, 'Role:', (user as any).Role.name);
            }
          } else {
            // Si no se encuentra el usuario o el rol, usar 'user' por defecto
            req.userRole = 'user';
            req.user.role = 'user';
            if (isDevelopment) {
              console.warn('⚠️ Usuario o rol no encontrado, usando "user" por defecto para userId:', decoded.userId);
            }
          }
        } catch (dbError) {
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
    } catch (error: any) {
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

// Middleware mejorado con soporte de jerarquía de roles
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }

    // Verificar si el usuario tiene alguno de los roles requeridos o un rol superior
    const hasPermission = roles.some(role => hasRolePermission(req.userRole, role));
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }
    
    next();
  };
};








