import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  InputAdornment,
  IconButton,
  Alert,
  Dialog,
  DialogContent,
  useTheme,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close,
  ExpandMore,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';



interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, onSuccess }) => {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Perfil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'es',
    dateFormat: 'es-ES',
    avatar: '',
  });
  const [countryCode, setCountryCode] = useState('+51');

  const countries = [
    { code: '+51', iso: 'PE', name: 'Perú' },
    { code: '+1', iso: 'US', name: 'Estados Unidos' },
    { code: '+52', iso: 'MX', name: 'México' },
    { code: '+54', iso: 'AR', name: 'Argentina' },
    { code: '+55', iso: 'BR', name: 'Brasil' },
    { code: '+56', iso: 'CL', name: 'Chile' },
    { code: '+57', iso: 'CO', name: 'Colombia' },
  ];

  const getCountryByCode = (code: string) => {
    return countries.find(c => c.code === code) || countries[0];
  };


  useEffect(() => {
    if (user && open) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '',
        language: 'es',
        dateFormat: 'es-ES',
        avatar: user.avatar || '',
      });
      fetchUserProfile();
    }
  }, [user, open]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        language: userData.language || 'es',
        dateFormat: userData.dateFormat || 'es-ES',
        avatar: userData.avatar || '',
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    }
  };


  const handleProfileUpdate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await api.put('/auth/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        language: profileData.language,
        dateFormat: profileData.dateFormat,
        avatar: profileData.avatar,
      });

      const updatedUser = response.data;
      setUser({
        ...user!,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
      });

      localStorage.setItem('user', JSON.stringify({
        ...user!,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
      }));

      // Cerrar el modal inmediatamente
      onClose();
      // Mostrar mensaje de éxito fuera del modal
      if (onSuccess) {
        setTimeout(() => {
          onSuccess('Perfil actualizado correctamente');
        }, 100);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };


  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.' });
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor, selecciona un archivo de imagen válido.' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Comprimir imagen si es necesario
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          
          let width = img.width;
          let height = img.height;
          
          // Redimensionar si es necesario
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convertir a base64 con calidad reducida (0.8 = 80% calidad)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setProfileData({ ...profileData, avatar: compressedBase64 });
            setMessage({ type: 'success', text: 'Imagen cargada correctamente' });
            setTimeout(() => setMessage(null), 3000);
          }
        };
        
        img.onerror = () => {
          setMessage({ type: 'error', text: 'Error al procesar la imagen' });
        };
        
        img.src = result;
      };
      
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Error al leer el archivo' });
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarDelete = () => {
    setProfileData({ ...profileData, avatar: '' });
    setMessage({ type: 'success', text: 'Foto eliminada correctamente' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '85vh',
          maxWidth: 500,
          bgcolor: theme.palette.background.paper,
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: theme.palette.background.paper }}>
        <Box 
          sx={{ 
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{ px: 3, pt: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.125rem' }}>
                  Mi perfil
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {message && message.type === 'success' && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                  }}>
                    <CheckCircle sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: '0.8125rem' }}>
                      Guardado
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setMessage(null)}
                      sx={{
                        ml: 0.5,
                        p: 0.25,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Close sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    </IconButton>
                  </Box>
                )}
                <IconButton
                  size="small"
                  onClick={onClose}
                  sx={{
                    p: 0.5,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {message && message.type === 'error' && (
            <Box sx={{ px: 4, pt: 3 }}>
              <Alert 
                severity="error" 
                onClose={() => setMessage(null)}
                sx={{
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.8125rem',
                  },
                  '& .MuiAlert-icon': {
                    fontSize: '1.125rem',
                  }
                }}
              >
                {message.text}
              </Alert>
            </Box>
          )}

          {/* Contenido del Perfil */}
          <Box>
            <Box sx={{ bgcolor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', px: 2, pt: 2, pb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: 500,
                  gap: 1.5,
                }}
              >
                <Avatar
                  src={profileData.avatar}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    fontSize: '2rem',
                    bgcolor: taxiMonterricoColors.green,
                    flexShrink: 0,
                  }}
                >
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </Avatar>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  sx={{
                    bgcolor: 'transparent',
                    color: taxiMonterricoColors.green,
                    borderColor: theme.palette.divider,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    minWidth: 120,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? `${taxiMonterricoColors.green}15` 
                        : `${taxiMonterricoColors.green}08`,
                      borderColor: taxiMonterricoColors.green,
                    },
                  }}
                >
                  Cambiar foto
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAvatarDelete}
                  sx={{
                    bgcolor: 'transparent',
                    color: '#ef4444',
                    borderColor: theme.palette.divider,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.8125rem',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    minWidth: 120,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(239, 68, 68, 0.15)' 
                        : 'rgba(239, 68, 68, 0.08)',
                      borderColor: '#ef4444',
                    },
                  }}
                >
                  Eliminar
                </Button>
              </Box>
              <Box sx={{ width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: 400 }}>
                  <Box sx={{ display: 'flex', gap: 2.5, width: '100%' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nombre"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          fontSize: '0.875rem',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.875rem',
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Apellidos"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          fontSize: '0.875rem',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.875rem',
                        }
                      }}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Correo electrónico"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        fontSize: '0.875rem',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Número de teléfono"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="900 000 000"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment 
                          position="start" 
                          sx={{ 
                            mr: 0,
                            borderRight: 1,
                            borderColor: theme.palette.divider,
                            pr: 1.5,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Select
                            id="country-code-select"
                            name="country-code"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            size="small"
                            variant="standard"
                            disableUnderline
                            renderValue={(value) => {
                              const country = getCountryByCode(value);
                              return (
                                <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.primary }}>
                                  {country.code}
                                </Typography>
                              );
                            }}
                            sx={{
                              minWidth: 'auto',
                              width: 'fit-content',
                              fontSize: '0.875rem',
                              color: theme.palette.text.primary,
                              '& .MuiSelect-select': {
                                py: 0,
                                px: 0.5,
                                pr: 2.5,
                                display: 'flex',
                                alignItems: 'center',
                                minWidth: 'auto',
                              },
                              '& .MuiSelect-icon': {
                                color: theme.palette.text.secondary,
                                right: 0,
                                fontSize: '1rem',
                              },
                            }}
                            IconComponent={ExpandMore}
                          >
                            {countries.map((country) => (
                              <MenuItem key={country.code} value={country.code}>
                                <Typography sx={{ fontSize: '0.875rem' }}>
                                  {country.code}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        fontSize: '0.875rem',
                        pl: 0,
                        '& .MuiInputBase-input': {
                          pl: 2,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    size="small"
                    sx={{ 
                      mt: 2,
                      mb: 2,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2.5,
                      py: 1,
                      bgcolor: taxiMonterricoColors.green,
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      alignSelf: 'center',
                      minWidth: 180,
                      '&:hover': {
                        bgcolor: taxiMonterricoColors.greenDark,
                      },
                    }}
                  >
                    Guardar cambios
                  </Button>
                </Box>
              </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

