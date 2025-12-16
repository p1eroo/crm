import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import { taxiMonterricoColors } from './theme/colors';

// Lazy loading de todas las páginas para code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const Companies = lazy(() => import('./pages/Companies'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));
const Deals = lazy(() => import('./pages/Deals'));
const DealDetail = lazy(() => import('./pages/DealDetail'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/Users'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Calendar = lazy(() => import('./pages/Calendar'));

const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: taxiMonterricoColors.green, // Verde vibrante Taxi Monterrico
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
      default: mode === 'light' ? '#f5f7fa' : '#0a0a0a',
      paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
    },
    text: {
      primary: mode === 'light' ? '#1F2937' : '#e5e5e5',
      secondary: mode === 'light' ? '#6B7280' : '#a0a0a0',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    action: {
      active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
      hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
      selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
      disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: [
      'General Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
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
          backgroundColor: '#E1E7DC',
        }}>
          <CircularProgress />
        </Box>
      </MUIThemeProvider>
    );
  }

  // Si no hay usuario, mostrar Login (sin Router para evitar problemas de navegación)
  if (!user) {
    return (
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <Login />
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

  // Si hay usuario, mostrar la aplicación con Router
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      <SidebarProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/contacts"
                element={
                  <MainLayout>
                    <Contacts />
                  </MainLayout>
                }
              />
              <Route
                path="/contacts/:id"
                element={
                  <MainLayout>
                    <ContactDetail />
                  </MainLayout>
                }
              />
              <Route
                path="/companies"
                element={
                  <MainLayout>
                    <Companies />
                  </MainLayout>
                }
              />
              <Route
                path="/companies/:id"
                element={
                  <MainLayout>
                    <CompanyDetail />
                  </MainLayout>
                }
              />
              <Route
                path="/deals"
                element={
                  <MainLayout>
                    <Deals />
                  </MainLayout>
                }
              />
              <Route
                path="/deals/:id"
                element={
                  <MainLayout>
                    <DealDetail />
                  </MainLayout>
                }
              />
              <Route
                path="/tasks"
                element={
                  <MainLayout>
                    <Tasks />
                  </MainLayout>
                }
              />
              <Route
                path="/tickets"
                element={
                  <MainLayout>
                    <Tickets />
                  </MainLayout>
                }
              />
              <Route
                path="/calendar"
                element={
                  <MainLayout>
                    <Calendar />
                  </MainLayout>
                }
              />
              <Route
                path="/pipeline"
                element={
                  <MainLayout>
                    <Pipeline />
                  </MainLayout>
                }
              />
              <Route
                path="/profile"
                element={
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                }
              />
              <Route
                path="/users"
                element={
                  <MainLayout>
                    <Users />
                  </MainLayout>
                }
              />
              <Route
                path="/reports"
                element={
                  (() => {
                    const userRole = user?.role;
                    if (userRole === 'admin' || userRole === 'jefe_comercial') {
                      return (
                        <MainLayout>
                          <Reports />
                        </MainLayout>
                      );
                    }
                    return <Navigate to="/" replace />;
                  })()
                }
              />
              <Route
                path="/reports/:id"
                element={
                  (() => {
                    const userRole = user?.role;
                    if (userRole === 'admin' || userRole === 'jefe_comercial') {
                      return (
                        <MainLayout>
                          <ReportDetail />
                        </MainLayout>
                      );
                    }
                    return <Navigate to="/" replace />;
                  })()
                }
              />
              <Route path="*" element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } />
            </Routes>
          </Suspense>
        </Router>
      </SidebarProvider>
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
