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
  Badge,
} from '@mui/material';
import { 
  Search, 
  AccountCircle, 
  Logout, 
  Settings,
  KeyboardArrowDown,
  Edit,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { taxiMonterricoColors } from '../../theme/colors';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleProfileMenuClose();
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

      {/* Título centrado - Oculto */}
      <Box sx={{ flex: 1 }} />

      {/* Elementos del lado derecho */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Notificaciones */}
        <IconButton 
          size="medium"
          sx={{ 
            bgcolor: '#F3F4F6', 
            borderRadius: 1.5, 
            width: 40, 
            height: 40,
            '&:hover': {
              bgcolor: '#E5E7EB',
            },
          }}
        >
          <Badge badgeContent={3} color="error">
            <Notifications sx={{ fontSize: 20, color: '#1F2937' }} />
          </Badge>
        </IconButton>

        {/* Profile Text */}
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600, 
            color: '#1F2937', 
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          Profile
        </Typography>

        {/* Edit Button */}
        <IconButton 
          size="medium"
          onClick={handleProfileMenuOpen}
          sx={{ 
            bgcolor: '#F3F4F6', 
            borderRadius: 1.5, 
            width: 40, 
            height: 40,
            '&:hover': {
              bgcolor: '#E5E7EB',
            },
          }}
        >
          <Edit sx={{ fontSize: 20, color: '#1F2937' }} />
        </IconButton>

        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
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
              mt: 1,
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
          <MenuItem onClick={handleProfileClick}>
            <AccountCircle sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} />
            Perfil
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
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
