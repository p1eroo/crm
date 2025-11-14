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

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Verde vibrante Taxi Monterrico
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#FF9800', // Amarillo/Naranja dorado Taxi Monterrico
      light: '#FFA726',
      dark: '#F57C00',
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
            <Route
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
            />
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
          </Routes>
        </Router>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
