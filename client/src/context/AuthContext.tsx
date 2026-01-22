import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../config/api';
import { log, logWarn } from '../utils/logger';

interface User {
  id: number;
  usuario: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (idacceso: string, contraseña: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Verificar con el backend para obtener el rol actualizado
        // Intentar obtener datos actualizados del backend
        api.get('/auth/me')
          .then(response => {
            const userData = response.data;
            // Actualizar el usuario con los datos del backend (especialmente el rol)
            const updatedUser = {
              ...parsedUser,
              ...userData,
              role: userData.role || parsedUser.role || 'user',
            };
            log('👤 Usuario actualizado desde backend:', { id: updatedUser.id, usuario: updatedUser.usuario });
            log('🔑 Rol del usuario:', updatedUser.role);
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          })
          .catch(error => {
            logWarn('No se pudo verificar el usuario con el backend:', error);
            // Continuar con el usuario guardado si falla la verificación
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('idusuario');
        localStorage.removeItem('usuarioimagen');
        localStorage.removeItem('key');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (idacceso: string, contraseña: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    // Detectar automáticamente la URL del backend basándose en el hostname actual
    const getBackendUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
      
      const hostname = window.location.hostname;
      const protocol = window.location.protocol; // 'https:' o 'http:'
      const isHttps = protocol === 'https:';
      
      // Si estamos accediendo desde localhost, usar localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      
      // Si estamos accediendo desde la red (IP), usar la misma IP pero con el protocolo correcto
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(hostname)) {
        return `${isHttps ? 'https' : 'http'}://${hostname}:5000/api`;
      }
      
      // Si es un dominio en producción (HTTPS), usar el subdominio de la API
      // En desarrollo (HTTP), usar el puerto 5000
      if (isHttps) {
        if (hostname === 'crm.taximonterrico.com') {
          return 'https://api-crm.taximonterrico.com/api';
        } else {
          return `https://${hostname}/api`;
        }
      } else {
        return `http://${hostname}:5000/api`;
      }
    };
    
    const apiUrl = getBackendUrl();
    log('🔗 URL del backend detectada:', apiUrl);
    
    try {
      // PASO 1: Intentar login local primero
      try {
        log('🔐 Intentando login local...');
        const localLoginResponse = await api.post('/auth/login', {
          usuario: idacceso,
          password: contraseña,
        }, {
          baseURL: apiUrl,
        });

        const localData = localLoginResponse.data;
        
        if (localData.token && localData.user) {
          // Login local exitoso
          log('✅ Login local exitoso');
          
          // Guardar token y datos del usuario
          localStorage.setItem('token', localData.token);
          localStorage.setItem('user', JSON.stringify(localData.user));
          
          // Limpiar datos de Monterrico si existen
          localStorage.removeItem('idusuario');
          localStorage.removeItem('usuarioimagen');
          localStorage.removeItem('monterricoToken');
          localStorage.removeItem('key');
          
          const userData: User = {
            id: localData.user.id,
            usuario: localData.user.usuario,
            email: localData.user.email || '',
            firstName: localData.user.firstName,
            lastName: localData.user.lastName,
            role: localData.user.role || 'user',
            avatar: localData.user.avatar,
          };
          
          log('👤 Usuario autenticado (local):', { id: userData.id, usuario: userData.usuario });
          log('🔑 Rol asignado:', userData.role);
          
          setTimeout(() => {
            setUser(userData);
            setLoading(false);
          }, 0);
          
          return true;
        }
      } catch (localError: any) {
        // Si el login local falla, continuar con Monterrico
        log('⚠️ Login local falló, intentando con Monterrico...');
        
        // Si es un error 401, significa que las credenciales son incorrectas para usuario local
        // Continuar con Monterrico solo si es un error de autenticación
        if (localError.response?.status === 401) {
          log('🔐 Usuario local no encontrado o credenciales incorrectas, intentando Monterrico...');
        } else {
          // Si es otro error (red, servidor, etc.), también intentar Monterrico como fallback
          log('⚠️ Error en login local (posiblemente de red), intentando Monterrico...');
        }
      }

      // PASO 2: Si el login local falló, intentar con Monterrico
      log('🔐 Intentando login con Monterrico...');
      const monterricoResponse = await fetch('https://rest.monterrico.app/api/Licencias/Login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idacceso,
          contraseña,
          idempresas: 0,
          ipregistro: "0.0.0.0"
        }),
      });

      const monterricoData = await monterricoResponse.json();

      if (monterricoData.estatus !== 200) {
        const errorMessage = monterricoData.message || 'Credenciales incorrectas';
        setError(errorMessage);
        setLoading(false);
        return false;
      }

      // Si Monterrico fue exitoso, obtener JWT local del backend
      let backendData: any = {};
      
      try {
        const backendResponse = await api.post('/auth/login-monterrico', {
          usuario: idacceso,
          password: contraseña,
        }, {
          baseURL: apiUrl,
        });

        backendData = backendResponse.data;

        if (!backendData.token) {
          console.error('Error obteniendo JWT local:', backendData);
        }
      } catch (backendError: any) {
        console.error('Error al conectar con backend:', backendError);
        // Si es un error 401, las credenciales son inválidas
        if (backendError.response?.status === 401) {
          setError('Credenciales incorrectas');
          setLoading(false);
          return false;
        }
        // Continuar sin backend si es otro tipo de error
      }

      // Guardar datos de Monterrico
      localStorage.setItem('idusuario', monterricoData.idusuario.toString());
      localStorage.setItem('usuarioimagen', monterricoData.usuarioimagen || '');
      localStorage.setItem('monterricoToken', monterricoData.token || '');
      localStorage.setItem('key', monterricoData.key || '');

      // Guardar JWT local si se obtuvo correctamente
      if (backendData.token) {
        localStorage.setItem('token', backendData.token);
      }

      // Usar datos del backend si están disponibles, sino usar datos de Monterrico
      const userData: User = backendData.user ? {
        id: backendData.user.id,
        usuario: backendData.user.usuario || idacceso,
        email: backendData.user.email || idacceso,
        firstName: backendData.user.firstName || idacceso.toUpperCase(),
        lastName: backendData.user.lastName || '',
        role: backendData.user.role || 'user',
        avatar: backendData.user.avatar || monterricoData.usuarioimagen
      } : {
        id: parseInt(monterricoData.idusuario.toString()),
        usuario: idacceso,
        email: idacceso,
        firstName: idacceso.toUpperCase(),
        lastName: '',
        role: 'user',
        avatar: monterricoData.usuarioimagen
      };
      
      log('👤 Usuario autenticado (Monterrico):', { id: userData.id, usuario: userData.usuario });
      log('🔑 Rol asignado:', userData.role);
      
      setTimeout(() => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoading(false);
      }, 0);
      
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = 'Error de conexión. Verifica tu internet.';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('idusuario');
    localStorage.removeItem('usuarioimagen');
    localStorage.removeItem('token');
    localStorage.removeItem('key');
    localStorage.removeItem('monterricoData');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      logout, 
      isAuthenticated: !!user, 
      loading,
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


