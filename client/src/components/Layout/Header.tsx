import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  InputBase,
  IconButton,
  Badge,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  Search, 
  KeyboardArrowDown,
  Edit,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { taxiMonterricoColors } from '../../theme/colors';
import ProfileModal from '../ProfileModal';

const Header: React.FC = () => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleProfileClick = () => {
    setProfileModalOpen(true);
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
          onClick={handleProfileClick}
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
      </Box>
      <ProfileModal 
        open={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)}
        onSuccess={(message) => setSuccessMessage(message)}
      />
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Header;

