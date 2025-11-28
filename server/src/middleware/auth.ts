import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

  if (!token) {
    console.error('❌ No token provided in request to:', req.path);
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
    if (err) {
      console.error('❌ Token verification failed:', err.message, 'for path:', req.path);
      console.error('❌ Token recibido:', token.substring(0, 20) + '...');
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

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
};








