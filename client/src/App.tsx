import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Deals from './pages/Deals';
import Tasks from './pages/Tasks';
import Tickets from './pages/Tickets';
import Campaigns from './pages/Campaigns';
import Automations from './pages/Automations';
import Profile from './pages/Profile';
import Users from './pages/Users';

import { taxiMonterricoColors } from './theme/colors';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Inter',
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
  palette: {
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
  },
});

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SidebarProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Contacts />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts/:id"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ContactDetail />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Companies />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/companies/:id"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <CompanyDetail />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/deals"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Deals />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Tasks />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Tickets />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            {/* <Route
              path="/campaigns"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Campaigns />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/automations"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Automations />
                  </MainLayout>
                </PrivateRoute>
              }
            /> */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Users />
                  </MainLayout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
