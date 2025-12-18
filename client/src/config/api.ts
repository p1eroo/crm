import axios from 'axios';

// Detectar automáticamente la URL de la API
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
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
    console.log('🌐 Detectada IP de red:', hostname);
    console.log('🔗 URL de API configurada:', url);
    return url;
  }
  
  // Si es un dominio en producción (HTTPS), usar el mismo dominio sin puerto
  // (el proxy reverso maneja el enrutamiento al backend)
  // Si es desarrollo (HTTP), usar el puerto 5000
  if (isHttps) {
    // En producción con HTTPS, el proxy reverso maneja el enrutamiento
    const url = `https://${hostname}/api`;
    console.log('🌐 Detectado dominio en producción:', hostname);
    console.log('🔒 Protocolo: HTTPS');
    console.log('🔗 URL de API configurada:', url);
    return url;
  } else {
    // En desarrollo, usar el puerto 5000
    const url = `http://${hostname}:5000/api`;
    console.log('🌐 Detectado dominio en desarrollo:', hostname);
    console.log('🔒 Protocolo: HTTP');
    console.log('🔗 URL de API configurada:', url);
    return url;
  }
};

// URL inicial
const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout de 10 segundos
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
        // Para dominios en producción (HTTPS), usar el mismo dominio sin puerto
        // En desarrollo (HTTP), usar el puerto 5000
        if (isHttps) {
          config.baseURL = `https://${currentHostname}/api`;
        } else {
          config.baseURL = `http://${currentHostname}:5000/api`;
        }
      }
    }
    
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token agregado a petición:', config.url);
    } else {
      console.warn('⚠️ No hay token disponible para petición:', config.url);
    }
    
    console.log('📤 Petición a:', config.baseURL + (config.url || ''), 'con token:', token ? 'Sí' : 'No');
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y red
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta recibida de:', response.config.baseURL + (response.config.url || ''));
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // Solo manejar errores 401/403, ignorar 404 (normal si no hay datos)
    if (status === 401 || status === 403) {
      // No redirigir si estamos en la página de login o si la petición es al endpoint de login
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = url.includes('/auth/login') || url.includes('/auth/login-monterrico');
      const isAuthMeRequest = url.includes('/auth/me'); // No redirigir si falla /auth/me
      const isGoogleTokenRequest = url.includes('/google/token'); // No redirigir si falla /google/token
      
      // Solo redirigir si NO es una petición de verificación y NO estamos en login
      if (!isLoginPage && !isLoginRequest && !isAuthMeRequest && !isGoogleTokenRequest) {
        const token = localStorage.getItem('token');
        // Si no hay token O si hay token pero la petición falló con 401/403 (token inválido/expirado)
        if (!token || (token && (status === 401 || status === 403))) {
          console.log('🔒 Token inválido o expirado, redirigiendo a login');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          // No rechazar el error para evitar que aparezca en la consola
          return Promise.resolve({ data: null, status: 401 });
        }
      }
      // Para errores 401/403 en peticiones de verificación, no mostrar error en consola
      return Promise.resolve({ data: null, status });
    }
    
    // Para otros errores, mostrar información en consola solo si no es 404
    if (status !== 404) {
      console.error('❌ Error en petición:', error.config?.baseURL + (error.config?.url || ''));
      console.error('❌ Detalles del error:', {
        message: error.message,
        code: error.code,
        response: status,
        responseData: error.response?.data,
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
