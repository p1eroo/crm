import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('idusuario');
        localStorage.removeItem('usuarioimagen');
        localStorage.removeItem('key');
      }
    }
    setLoading(false);
  }, []);

  const login = async (idacceso: string, contraseña: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Primero autenticar con Monterrico
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
      // Detectar automáticamente la URL del backend basándose en el hostname actual
      const getBackendUrl = () => {
        if (process.env.REACT_APP_API_URL) {
          return process.env.REACT_APP_API_URL;
        }
        
        const hostname = window.location.hostname;
        
        // Si estamos accediendo desde localhost, usar localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:5000/api';
        }
        
        // Si estamos accediendo desde la red (IP), usar la misma IP pero puerto 5000
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipRegex.test(hostname)) {
          return `http://${hostname}:5000/api`;
        }
        
        // Si es un dominio, usar el mismo dominio pero puerto 5000
        return `http://${hostname}:5000/api`;
      };
      
      const apiUrl = getBackendUrl();
      console.log('🔗 URL del backend detectada:', apiUrl);
      let backendData: any = {};
      
      try {
        const backendResponse = await fetch(`${apiUrl}/auth/login-monterrico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario: idacceso,
            password: contraseña,
          }),
        });

        backendData = await backendResponse.json();

        if (!backendResponse.ok || !backendData.token) {
          console.error('Error obteniendo JWT local:', backendData);
          // Continuar con el login aunque falle el backend, pero sin JWT local
          // Esto permite usar la app aunque el backend esté caído
        }
      } catch (backendError) {
        console.error('Error al conectar con backend:', backendError);
        // Continuar sin backend
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
        role: backendData.user.role || 'admin',
        avatar: backendData.user.avatar || monterricoData.usuarioimagen
      } : {
        id: parseInt(monterricoData.idusuario.toString()),
        usuario: idacceso,
        email: idacceso,
        firstName: idacceso.toUpperCase(),
        lastName: '',
        role: 'admin',
        avatar: monterricoData.usuarioimagen
      };
      
      // Usar setTimeout para asegurar que el estado se actualice en el siguiente tick
      // Esto evita conflictos con el desmontaje del componente Login
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


