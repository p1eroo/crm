import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para agregar headers de caché HTTP a las respuestas GET
 * Esto permite que el navegador cachee automáticamente las respuestas
 */
export const setCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Solo aplicar a peticiones GET
  if (req.method !== 'GET') {
    return next();
  }

  const url = req.url || '';
  
  // Endpoints que cambian frecuentemente - no cachear
  const noCacheEndpoints = [
    '/auth/me',
    '/dashboard/stats',
    '/tasks',
    '/events',
    '/tickets',
  ];
  
  const shouldNotCache = noCacheEndpoints.some(endpoint => url.includes(endpoint));
  
  if (shouldNotCache) {
    // No cachear - siempre obtener datos frescos
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return next();
  }

  // Endpoints con datos que cambian poco - cachear por más tiempo
  const longCacheEndpoints = [
    '/users',
    '/companies',
    '/contacts',
    '/deals',
  ];
  
  const shouldLongCache = longCacheEndpoints.some(endpoint => url.includes(endpoint));
  
  if (shouldLongCache) {
    // Cachear por 2 minutos (120 segundos)
    // private: solo el navegador puede cachear (no proxies compartidos)
    // max-age: tiempo en segundos que el navegador puede usar la respuesta cacheada
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.setHeader('Vary', 'Authorization'); // Variar según el token de autorización
  } else {
    // Cachear por 30 segundos para otros endpoints
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.setHeader('Vary', 'Authorization');
  }

  next();
};
