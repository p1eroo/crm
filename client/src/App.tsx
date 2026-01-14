import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import { taxiMonterricoColors } from './theme/colors';

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
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/Users'));
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
      default: mode === 'light' ? '#fafafa' : '#0B1220', // Gris muy claro (casi blanco) como minimals.cc
      paper: mode === 'light' ? '#ffffff' : '#111A2C', // Blanco puro para los cards
    },
    text: {
      primary: mode === 'light' ? '#1F2937' : '#E5E7EB', // Gris claro premium
      secondary: mode === 'light' ? '#6B7280' : '#94A3B8', // Gris medio premium
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(148, 163, 184, 0.16)', // Divider premium
    action: {
      active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(229, 231, 235, 0.7)',
      hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(148, 163, 184, 0.08)',
      selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(148, 163, 184, 0.16)',
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
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    body2: {
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
    // MuiPaper: borderRadius 16, border 1px con divider, background paper
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          // Deshabilitar transiciones solo para propiedades relacionadas con el tema
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }),
      },
    },
    // MuiCard: misma lógica + sombra suave
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 16,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
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
    // MuiDrawer: background default/paper, border-right divider
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
          // Sin transiciones para propiedades relacionadas con el tema
          transition: 'none',
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
  const theme = React.useMemo(() => getTheme(mode), [mode]);
  const { user, loading } = useAuth();

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
    console.warn('REACT_APP_GOOGLE_CLIENT_ID no está configurado. La funcionalidad de email no estará disponible.');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'dummy-client-id'}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
