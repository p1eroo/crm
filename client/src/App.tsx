import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppearanceProvider } from './context/AppearanceContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import { taxiMonterricoColors } from './theme/colors';
import { logWarn } from './utils/logger';
import { NotificationProvider } from './context/NotificationContext';
import { InactivityLogoutProvider } from './components/InactivityLogout/InactivityLogoutProvider';

// Importar fuente Inter con todos los pesos necesarios
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Lazy loading de todas las páginas para code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const Companies = lazy(() => import('./pages/Companies'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));
const Deals = lazy(() => import('./pages/Deals'));
const DealDetail = lazy(() => import('./pages/DealDetail'));
const Tasks = lazy(() => import('./pages/Tasks'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Emails = lazy(() => import('./pages/Emails'));
const MassEmail = lazy(() => import('./pages/MassEmail'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/Users'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));
const RolesAndPermissions = lazy(() => import('./pages/RolesAndPermissions'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Landing = lazy(() => import('./pages/Landing'));

const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: taxiMonterricoColors.green || '#22C55E', // Verde vibrante Taxi Monterrico o fallback
      light: taxiMonterricoColors.greenLight,
      dark: taxiMonterricoColors.greenDark,
    },
    secondary: {
      main: taxiMonterricoColors.orangeDark, // Naranja/Amarillo dorado Taxi Monterrico
      light: taxiMonterricoColors.orange,
      dark: taxiMonterricoColors.orangeDark,
    },
    success: {
      main: taxiMonterricoColors.green,
      light: taxiMonterricoColors.greenLight,
      dark: taxiMonterricoColors.greenDark,
    },
    warning: {
      main: taxiMonterricoColors.orange,
      light: taxiMonterricoColors.orangeLight,
      dark: taxiMonterricoColors.orangeDark,
    },
    background: {
      default: mode === 'light' ? '#f2f2f2' : '#1A2027', // Gris azulado muy oscuro, más cercano al negro
      paper: mode === 'light' ? '#fafafa' : '#1c252e', // Contenido, cards, tablas en modo claro
    },
    text: {
      primary: mode === 'light' ? '#1F2937' : '#E5E7EB', // Gris claro premium
      secondary: mode === 'light' ? '#6B7280' : '#94A3B8', // Gris medio premium
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)', // Divider que combina con el nuevo esquema oscuro
    action: {
      active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(229, 231, 235, 0.7)',
      hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
      selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : '#1c252e',
      disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(148, 163, 184, 0.3)',
      disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(148, 163, 184, 0.12)',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(', '),
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '1rem', // 16px (antes 14px por defecto)
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  components: {
    // MuiPaper: borderRadius 16, border none, background paper (mismo #1c252e que tablas en dark)
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 0,
          border: 'none',
          backgroundColor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }),
      },
    },
    // MuiDialog: forzar Paper del modal al mismo tono que tablas/drawer en dark (!important para ganar a PaperProps.sx)
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }: { theme: Theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: '#1c252e !important',
            background: '#1c252e !important',
          }),
        }),
      },
    },
    // Popover: Paper con mismo look que Calendar (#1c252e, misma sombra) — aplica a todos los Popovers
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }: { theme: Theme }) => ({
          backgroundColor: `${theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper} !important`,
          border: 'none',
          borderRadius: 8,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        }),
      },
    },
    // MuiTableContainer: fondo #fafafa en modo claro para tablas
    MuiTableContainer: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          ...(theme.palette.mode === 'light' && {
            backgroundColor: '#fafafa',
          }),
        }),
      },
    },
    // MuiCard: mismo color que Reportes (#1c252ea6) para Dashboard y Reportes
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 16,
          border: 'none',
          backgroundColor: theme.palette.mode === 'dark' ? '#1c252ea6' : theme.palette.background.paper,
          boxShadow: 'none',
          // Deshabilitar transiciones solo para propiedades relacionadas con el tema
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }),
      },
    },
    // MuiAppBar: background paper, border-bottom divider, sin transparencia
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          // Sin transiciones para propiedades relacionadas con el tema
          transition: 'none',
        }),
      },
    },
    // MuiDrawer: permitir animación (slide en temporary, width en permanent/sidebar)
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: 'transform 225ms cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }),
      },
    },
    // MuiButton: textTransform none
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          // Mantener transiciones solo para efectos hover (transform, box-shadow)
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
      },
    },
    // MuiTabs: indicator suave, tabs estilo pill en dark (opcional)
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          textTransform: 'none',
          ...(theme.palette.mode === 'dark' && {
            borderRadius: 8,
            margin: '0 4px',
            minHeight: 36,
            '&.Mui-selected': {
              backgroundColor: 'rgba(148, 163, 184, 0.12)',
            },
          }),
        }),
      },
    },
    // CssBaseline: setear body background según theme
    MuiCssBaseline: {
      styleOverrides: {
        body: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.background.default,
        }),
      },
    },
  },
});


const AppContent: React.FC = () => {
  const { mode } = useTheme();
  
  // Detectar preferencia del sistema si el modo es 'system'
  const getSystemPreference = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Obtener el tema efectivo (si es 'system', usar la preferencia del sistema)
  const effectiveMode = mode === 'system' ? getSystemPreference() : mode;
  
  const theme = React.useMemo(() => getTheme(effectiveMode), [effectiveMode]);
  const { user, loading } = useAuth();

  // Sincronizar data-theme en el root para estilos de PrimeReact (Calendar) en modo oscuro
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveMode);
  }, [effectiveMode]);

  // Estado para forzar re-render cuando cambie la preferencia del sistema
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Escuchar cambios en la preferencia del sistema cuando el modo es 'system'
  React.useEffect(() => {
    if (mode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Forzar re-render cuando cambie la preferencia del sistema
        forceUpdate();
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [mode]);

  // Si está cargando, mostrar loading
  if (loading) {
    return (
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
        }}>
          <CircularProgress />
        </Box>
      </MUIThemeProvider>
    );
  }

  // Componente de loading para las páginas lazy
  const PageLoader = () => (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: theme.palette.background.default,
    }}>
      <CircularProgress />
    </Box>
  );

  // Router siempre disponible para rutas públicas y protegidas
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {user ? <InactivityLogoutProvider /> : null}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rutas públicas - accesibles sin autenticación */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Si no hay usuario */}
            {!user ? (
              <>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Navigate to="/login" replace />} />
                <Route path="/contacts" element={<Navigate to="/login" replace />} />
                <Route path="/companies" element={<Navigate to="/login" replace />} />
                <Route path="/deals" element={<Navigate to="/login" replace />} />
                <Route path="/tasks" element={<Navigate to="/login" replace />} />
                <Route path="/tickets" element={<Navigate to="/login" replace />} />
                <Route path="/calendar" element={<Navigate to="/login" replace />} />
                <Route path="/profile" element={<Navigate to="/login" replace />} />
                <Route path="/users" element={<Navigate to="/login" replace />} />
                <Route path="/system-logs" element={<Navigate to="/login" replace />} />
                <Route path="/roles-permissions" element={<Navigate to="/login" replace />} />
                <Route path="/reports" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                {/* Rutas protegidas - requieren autenticación */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Dashboard />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Dashboard />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Contacts />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/contacts/:id"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <ContactDetail />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/companies"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Companies />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/companies/:id"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <CompanyDetail />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/deals"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Deals />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/deals/:id"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <DealDetail />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Tasks />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/tasks/:id"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <TaskDetail />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/tickets"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Tickets />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Calendar />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/emails"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Emails />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/emails/masivo"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <MassEmail />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Profile />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/users"
                  element={
                    (() => {
                      const userRole = user?.role;
                      if (userRole === 'admin') {
                        return (
                          <SidebarProvider>
                            <MainLayout>
                              <Users />
                            </MainLayout>
                          </SidebarProvider>
                        );
                      }
                      return <Navigate to="/" replace />;
                    })()
                  }
                />
                <Route
                  path="/system-logs"
                  element={
                    (() => {
                      const userRole = user?.role;
                      if (userRole === 'admin') {
                        return (
                          <SidebarProvider>
                            <MainLayout>
                              <SystemLogs />
                            </MainLayout>
                          </SidebarProvider>
                        );
                      }
                      return <Navigate to="/" replace />;
                    })()
                  }
                />
                <Route
                  path="/roles-permissions"
                  element={
                    (() => {
                      const userRole = user?.role;
                      if (userRole === 'admin') {
                        return (
                          <SidebarProvider>
                            <MainLayout>
                              <RolesAndPermissions />
                            </MainLayout>
                          </SidebarProvider>
                        );
                      }
                      return <Navigate to="/" replace />;
                    })()
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <SidebarProvider>
                      <MainLayout>
                        <Reports />
                      </MainLayout>
                    </SidebarProvider>
                  }
                />
                <Route
                  path="/reports/:id"
                  element={
                    (() => {
                      const userRole = user?.role;
                      if (userRole === 'admin' || userRole === 'jefe_comercial') {
                        return (
                          <SidebarProvider>
                            <MainLayout>
                              <ReportDetail />
                            </MainLayout>
                          </SidebarProvider>
                        );
                      }
                      return <Navigate to="/" replace />;
                    })()
                  }
                />
                <Route path="*" element={
                  <SidebarProvider>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </SidebarProvider>
                } />
              </>
            )}
            </Routes>
          </Suspense>
        </Router>
    </MUIThemeProvider>
  );
};

const App: React.FC = () => {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  // Siempre envolver con GoogleOAuthProvider, incluso si no hay client_id
  // Esto evita errores cuando los componentes intentan usar useGoogleLogin
  // Si no hay client_id, simplemente no funcionará la autenticación
  if (!googleClientId) {
    logWarn('REACT_APP_GOOGLE_CLIENT_ID no está configurado. La funcionalidad de email no estará disponible.');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'dummy-client-id'}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppearanceProvider>
              <AppContent />
            </AppearanceProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
