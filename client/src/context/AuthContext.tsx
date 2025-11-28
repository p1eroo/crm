import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../config/api';

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Configurar token
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Establecer usuario desde localStorage inmediatamente
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setLoading(false);
          
          // NO verificar el token aquí para evitar problemas de timing
          // El token se validará cuando se hagan las peticiones reales
          // Si el token es inválido, las peticiones fallarán y el interceptor manejará el error
        } catch (error: any) {
          console.error('Error parseando usuario:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('AuthContext: Intentando login con API de Monterrico');
      
      // Llamar al endpoint del backend que maneja la autenticación con Monterrico
      const response = await api.post('/auth/login-monterrico', {
        usuario: username,
        password,
      });

      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }
      
      if (!userData) {
        throw new Error('No se recibieron datos del usuario');
      }
      
      console.log('✅ Login exitoso, guardando token y usuario');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      // Verificar que el token funcione haciendo una petición de prueba
      try {
        const testResponse = await api.get('/auth/me');
        console.log('✅ Verificación de token exitosa:', testResponse.data);
        // Actualizar usuario con datos del servidor
        if (testResponse.data) {
          setUser(testResponse.data);
          localStorage.setItem('user', JSON.stringify(testResponse.data));
        }
      } catch (verifyError: any) {
        console.error('⚠️ Error verificando token después del login:', verifyError);
        // No lanzar error aquí, el login fue exitoso
        // El token podría estar bien pero hay un problema de red o timing
      }
    } catch (error: any) {
      console.error('AuthContext: Error en login:', error);
      
      // Propagar el error completo para mejor manejo
      if (error.response) {
        throw new Error(error.response.data?.error || error.response.data?.message || `Error ${error.response.status}`);
      } else if (error.request) {
        throw new Error('No se pudo conectar al servidor. Verifica la conexión de red.');
      } else {
        throw new Error(error.message || 'Error al iniciar sesión');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('monterricoData');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user, loading }}>
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


