import axios from 'axios';
import { log, logWarn, logError } from '../utils/logger';

// Detectar automáticamente la URL de la API
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla
  if (process.env.REACT_APP_API_URL) {
    log('🌐 Usando REACT_APP_API_URL del .env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  log('🌐 No se encontró REACT_APP_API_URL, detectando automáticamente...');
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // 'https:' o 'http:'
  const isHttps = protocol === 'https:';
  
  // Si estamos accediendo desde localhost, usar localhost con HTTP
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Si estamos accediendo desde un túnel (localtunnel, ngrok, etc.), usar el túnel del backend
  // El backend debe estar expuesto en un túnel separado
  if (hostname.includes('.loca.lt')) {
    // Si el frontend está en crm-tm.loca.lt, el backend debería estar en crm-tm-api.loca.lt
    const backendHostname = hostname.replace('crm-tm', 'crm-tm-api');
    return `https://${backendHostname}/api`;
  }
  if (hostname.includes('.ngrok.io') || hostname.includes('.ngrok-free.app')) {
    // Para ngrok, usar la misma URL pero con el puerto 5000 (si está configurado)
    // O crear un segundo túnel para el backend
    return 'http://localhost:5000/api';
  }
  
  // Si estamos accediendo desde la red (IP), usar la misma IP pero con el protocolo correcto
  // Detectar si es una IP (IPv4)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(hostname)) {
    const url = `${isHttps ? 'https' : 'http'}://${hostname}:5000/api`;
    log('🌐 Detectada IP de red:', hostname);
    log('🔗 URL de API configurada:', url);
    return url;
  }
  
  // Si es un dominio en producción (HTTPS), usar el subdominio de la API
  // Si es desarrollo (HTTP), usar el puerto 5000
  if (isHttps) {
    // En producción con HTTPS, usar el subdominio api-crm.taximonterrico.com
    if (hostname === 'crm.taximonterrico.com') {
      const url = 'https://api-crm.taximonterrico.com/api';
      log('🌐 Detectado dominio en producción:', hostname);
      log('🔒 Protocolo: HTTPS');
      log('🔗 URL de API configurada:', url);
      return url;
    } else {
      // Para otros dominios HTTPS, usar el mismo dominio sin puerto
      const url = `https://${hostname}/api`;
      log('🌐 Detectado dominio en producción:', hostname);
      log('🔒 Protocolo: HTTPS');
      log('🔗 URL de API configurada:', url);
      return url;
    }
  } else {
    // En desarrollo, usar el puerto 5000
    const url = `http://${hostname}:5000/api`;
    log('🌐 Detectado dominio en desarrollo:', hostname);
    log('🔒 Protocolo: HTTP');
    log('🔗 URL de API configurada:', url);
    return url;
  }
};

// URL inicial
const API_URL = getApiUrl();
log('🔗 URL base de la API configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // Timeout de 10 minutos para operaciones largas (bulk imports)
});

// Interceptor para actualizar la URL dinámicamente y agregar el token antes de cada petición
api.interceptors.request.use(
  (config) => {
    // Recalcular la URL en cada petición para asegurar que sea correcta
    const currentHostname = window.location.hostname;
    const protocol = window.location.protocol; // 'https:' o 'http:'
    const isHttps = protocol === 'https:';
    
    // Si estamos accediendo desde un túnel localtunnel, usar el túnel del backend
    if (currentHostname.includes('.loca.lt')) {
      const backendHostname = currentHostname.replace('crm-tm', 'crm-tm-api');
      config.baseURL = `https://${backendHostname}/api`;
    } else if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      config.baseURL = 'http://localhost:5000/api';
    } else {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(currentHostname)) {
        // Para IPs, usar el puerto 5000
        config.baseURL = `${isHttps ? 'https' : 'http'}://${currentHostname}:5000/api`;
      } else {
        // Para dominios en producción (HTTPS), usar el subdominio de la API
        // En desarrollo (HTTP), usar el puerto 5000
        if (isHttps) {
          if (currentHostname === 'crm.taximonterrico.com') {
            config.baseURL = 'https://api-crm.taximonterrico.com/api';
          } else {
            config.baseURL = `https://${currentHostname}/api`;
          }
        } else {
          config.baseURL = `http://${currentHostname}:5000/api`;
        }
      }
    }
    
    // NOTA: La verificación del caché se hace en el interceptor de response
    // para evitar problemas con la estructura de respuestas de axios.
    // El caché se guarda automáticamente y estará disponible en la próxima carga de página.
    
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');

    // Verificar si es un endpoint público que no requiere token
    const isPublicEndpoint = config.url?.includes('/auth/login') || 
                            config.url?.includes('/auth/login-monterrico') ||
                            config.url?.includes('/auth/register');
    
    if (token) {
      // Asegurarse de que el header Authorization esté configurado correctamente
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      log('🔑 Token agregado a petición:', config.url);
    } else if (!isPublicEndpoint) {
      // Solo mostrar warning para endpoints que requieren autenticación
      logWarn('⚠️ No hay token disponible para petición:', config.url);
      logWarn('⚠️ Petición sin token a endpoint que probablemente requiere autenticación:', config.url);
    }
    
    log('📤 Petición a:', config.baseURL + (config.url || ''), 'con token:', token ? 'Sí' : 'No');
    return config;
  },
  (error) => {
    logError('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y red
api.interceptors.response.use(
  (response) => {
    log('✅ Respuesta recibida de:', response.config.baseURL + (response.config.url || ''));
    
    // Validar que la respuesta sea JSON y no HTML
    const contentType = response.headers['content-type'] || '';
    const responseData = response.data;
    
    // Si la respuesta parece ser HTML (común cuando el proxy no está configurado)
    if (
      typeof responseData === 'string' && 
      (responseData.trim().startsWith('<!doctype') || 
       responseData.trim().startsWith('<!DOCTYPE') ||
       responseData.includes('<html'))
    ) {
      console.error('❌ Error: El servidor devolvió HTML en lugar de JSON. Verifica la configuración del proxy reverso.');
      return Promise.reject({
        message: 'Error de configuración del servidor: se recibió HTML en lugar de JSON. Verifica que el proxy reverso esté configurado correctamente para redirigir /api/* al backend.',
        code: 'ERR_HTML_RESPONSE',
        response: {
          status: 500,
          data: 'HTML response received instead of JSON'
        }
      });
    }
    
    // Si el content-type no es JSON pero la respuesta parece ser texto HTML
    if (!contentType.includes('application/json') && typeof responseData === 'string' && responseData.includes('<html')) {
      console.error('❌ Error: Content-Type incorrecto. Se esperaba JSON pero se recibió HTML.');
      return Promise.reject({
        message: 'Error de configuración del servidor: Content-Type incorrecto.',
        code: 'ERR_INVALID_CONTENT_TYPE',
        response: {
          status: 500,
          data: 'Invalid content type'
        }
      });
    }
    
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const errorCode = error.code;
    
    // Filtrar errores esperados que no necesitan logging detallado
    const isGoogleEventsError = url.includes('/google/events') && status === 500;
    const isExpectedError = status === 404 || isGoogleEventsError;
    
    // Solo loguear errores inesperados con un solo log consolidado
    if (!isExpectedError && status !== undefined) {
      console.error('❌ Error en petición:', {
        url: error.config?.baseURL + (error.config?.url || ''),
        status,
        code: errorCode,
        message: error.message,
        responseData: error.response?.data,
        pathname: window.location.pathname
      });
    } else if (errorCode === 'ERR_NETWORK' || errorCode === 'ERR_INTERNET_DISCONNECTED') {
      // Errores de red no deberían cerrar la sesión
      logWarn('⚠️ Error de red (no se cierra sesión):', error.message);
    }
    
    // Manejar errores 401 (siempre token inválido/expirado)
    if (status === 401) {
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = url.includes('/auth/login') || url.includes('/auth/login-monterrico');
      const isAuthMeRequest = url.includes('/auth/me');
      
      if (!isLoginPage && !isLoginRequest && !isAuthMeRequest) {
        log('🔒 [Interceptor] Error 401 - Token inválido o expirado, cerrando sesión');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.resolve({ data: null, status: 401 });
      }
      return Promise.resolve({ data: null, status: 401 });
    }
    
    // Manejar errores 403 (puede ser token inválido O falta de permisos)
    if (status === 403) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '';
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = url.includes('/auth/login') || url.includes('/auth/login-monterrico');
      const isAuthMeRequest = url.includes('/auth/me');
      const isGoogleTokenRequest = url.includes('/google/token');
      const isGoogleCalendarRequest = url.includes('/google-calendar');
      
      // REGLA PRINCIPAL: Solo cerrar sesión si el mensaje EXPLÍCITAMENTE dice que el token es inválido
      // Cualquier otro 403 es por falta de permisos y NO debe cerrar sesión
      const isTokenInvalid = errorMessage.includes('Token inválido') || 
                              errorMessage.includes('Token expirado') || 
                              errorMessage.includes('Token de acceso requerido');
      
      // Si es un 403 en una petición de verificación, no cerrar sesión
      if (isLoginPage || isLoginRequest || isAuthMeRequest || isGoogleTokenRequest || isGoogleCalendarRequest) {
        return Promise.resolve({ data: null, status: 403 });
      }
      
      // Si el mensaje indica explícitamente que el token es inválido, cerrar sesión
      if (isTokenInvalid) {
        log('🔒 [Interceptor] Error 403 - Token inválido según mensaje, cerrando sesión');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.resolve({ data: null, status: 403 });
      }
      
      // PARA CUALQUIER OTRO 403: NO cerrar sesión (es falta de permisos)
      // Rechazar el error para que el componente lo maneje, pero marcarlo como error de permisos
      return Promise.reject({
        ...error,
        isPermissionError: true, // Marcar como error de permisos
        response: {
          ...error.response,
          data: {
            ...error.response?.data,
            isPermissionError: true
          }
        }
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
