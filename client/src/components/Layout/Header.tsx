import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  InputBase,
  IconButton,
} from '@mui/material';
import { 
  Search, 
  AccountCircle, 
  Logout, 
  Settings,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { taxiMonterricoColors } from '../../theme/colors';

// Mapeo de rutas a títulos
const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/contacts': 'Contactos',
  '/companies': 'Empresas',
  '/deals': 'Negocios',
  '/tasks': 'Tareas',
  '/tickets': 'Tickets',
  '/campaigns': 'Campañas',
  '/automations': 'Automatizaciones',
  '/settings': 'Configuración',
  '/profile': 'Perfil',
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Obtener el título basado en la ruta actual
  const getPageTitle = () => {
    const path = location.pathname;
    // Si es una ruta con ID, obtener el título base
    const basePath = path.split('/').slice(0, 2).join('/');
    return routeTitles[path] || routeTitles[basePath] || 'Dashboard';
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'transparent',
        px: { xs: 3, sm: 6, md: 8 },
        pt: { xs: 4, sm: 6, md: 7 },
        pb: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 3,
      }}
    >
      {/* Barra de búsqueda */}
      <Box
        sx={{
          flex: '0 1 400px',
          position: 'relative',
          bgcolor: '#e9ecef',
          borderRadius: '50px',
          px: 2.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          '&:focus-within': {
            bgcolor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Search 
          sx={{ 
            fontSize: 20, 
            color: '#6c757d',
            mr: 1.5,
          }} 
        />
        <InputBase
          placeholder="Search here..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          sx={{
            flex: 1,
            fontSize: '0.875rem',
            color: '#1a1a1a',
            '&::placeholder': {
              color: '#6c757d',
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Título centrado */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Typography
          sx={{
            fontSize: '1.5rem',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#1a1a1a',
            letterSpacing: '0.02em',
            fontFamily: '"Georgia", "Times New Roman", serif',
          }}
        >
          {getPageTitle()}
        </Typography>
      </Box>

      {/* Información del usuario */}
      <Box 
        sx={{ 
          flex: '0 1 auto',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={handleMenu}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#1a1a1a',
              lineHeight: 1.2,
            }}
          >
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: '#6c757d',
              lineHeight: 1.2,
            }}
          >
            {user?.email}
          </Typography>
        </Box>

        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: user?.avatar ? 'transparent' : taxiMonterricoColors.green,
            fontSize: '0.875rem',
            fontWeight: 600,
            border: '2px solid #e9ecef',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          src={user?.avatar}
        >
          {!user?.avatar && getInitials(user?.firstName, user?.lastName)}
        </Avatar>

        <KeyboardArrowDown
          sx={{
            fontSize: 20,
            color: '#6c757d',
            transition: 'transform 0.2s ease',
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0',
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                py: 1.25,
                px: 2,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                fontSize: '0.875rem',
              }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              sx={{
                color: '#757575',
                fontSize: '0.75rem',
              }}
            >
              {user?.email}
            </Typography>
          </Box>

          <MenuItem
            onClick={() => {
              navigate('/profile');
              handleClose();
            }}
          >
            <AccountCircle sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} />
            Perfil
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate('/settings');
              handleClose();
            }}
          >
            <Settings sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} />
            Configuración
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              color: '#d32f2f',
              '&:hover': {
                bgcolor: '#ffebee',
              },
            }}
          >
            <Logout sx={{ mr: 1.5, fontSize: 20 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
