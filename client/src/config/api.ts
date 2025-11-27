import axios from 'axios';

// Detectar automáticamente la URL de la API
const getApiUrl = () => {
  // Si hay una variable de entorno, usarla
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // Si estamos accediendo desde localhost, usar localhost
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
  
  // Si estamos accediendo desde la red (IP), usar la misma IP pero puerto 5000
  // Detectar si es una IP (IPv4)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(hostname)) {
    const url = `http://${hostname}:5000/api`;
    console.log('🌐 Detectada IP de red:', hostname);
    console.log('🔗 URL de API configurada:', url);
    return url;
  }
  
  // Si es un dominio, usar el mismo dominio pero puerto 5000
  const url = `http://${hostname}:5000/api`;
  console.log('🌐 Detectado dominio:', hostname);
  console.log('🔗 URL de API configurada:', url);
  return url;
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
    
    // Si estamos accediendo desde un túnel localtunnel, usar el túnel del backend
    if (currentHostname.includes('.loca.lt')) {
      const backendHostname = currentHostname.replace('crm-tm', 'crm-tm-api');
      config.baseURL = `https://${backendHostname}/api`;
    } else if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      config.baseURL = 'http://localhost:5000/api';
    } else {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(currentHostname)) {
        config.baseURL = `http://${currentHostname}:5000/api`;
      } else {
        config.baseURL = `http://${currentHostname}:5000/api`;
      }
    }
    
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Petición a:', config.baseURL + (config.url || ''));
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
    console.error('❌ Error en petición:', error.config?.baseURL + (error.config?.url || ''));
    console.error('❌ Detalles del error:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      responseData: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
