import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Edit,
  Info,
  Email,
  Phone,
  CalendarToday,
  Assignment,
  Security,
  Timeline,
  Person,
  CheckCircle,
  Close,
  CloudOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const theme = useTheme();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0, bgcolor: theme.palette.background.paper }}>{children}</Box>}
    </div>
  );
}


interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, onSuccess }) => {
  const { user, setUser } = useAuth();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
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

  // Seguridad
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLastReset, setPasswordLastReset] = useState<string | null>(null);

  // Correo
  const [emailConnected, setEmailConnected] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);

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
      checkGoogleConnection();
    }
  }, [user, open]);

  // Verificar estado de conexión con Google (Gmail + Calendar + Tasks)
  const checkGoogleConnection = async () => {
    try {
      const response = await api.get('/google/token');
      const isConnected = response.data.hasToken && !response.data.isExpired;
      setEmailConnected(isConnected);
    } catch (error: any) {
      // 404 es normal si el usuario no ha conectado Google aún
      if (error.response?.status === 404) {
        setEmailConnected(false);
      } else {
        console.error('Error verificando conexión de Google:', error);
        setEmailConnected(false);
      }
    }
  };

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMessage(null);
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

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordLastReset(new Date().toLocaleDateString('es-ES'));
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al cambiar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConnect = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuario no identificado' });
      return;
    }

    setConnectingEmail(true);
    try {
      // Obtener URL de autorización del backend (conectará Gmail + Calendar + Tasks)
      const response = await api.get('/google/auth');

      if (response.data.authUrl) {
        // Redirigir al usuario a la URL de autorización de Google
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('No se pudo obtener la URL de autorización');
      }
    } catch (error: any) {
      console.error('Error iniciando conexión con Google:', error);
      const errorMessage = error.response?.data?.message || 'Error al conectar con Google. Por favor, intenta nuevamente.';
      setMessage({ type: 'error', text: errorMessage });
      setConnectingEmail(false);
    }
  };

  const handleEmailDisconnect = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuario no identificado' });
      return;
    }

    try {
      await api.delete('/google/disconnect');
      setEmailConnected(false);
      setMessage({ type: 'success', text: 'Correo desconectado correctamente' });
      // Limpiar localStorage si es necesario
      localStorage.removeItem('monterricoToken');
    } catch (error: any) {
      console.error('Error desconectando correo:', error);
      const errorMessage = error.response?.data?.message || 'Error al desconectar el correo';
      setMessage({ type: 'error', text: errorMessage });
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
        <Paper 
          sx={{ 
            boxShadow: 'none',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              minHeight: 48,
              bgcolor: theme.palette.background.paper,
              '& .MuiTab-root': {
                minWidth: 64,
                minHeight: 48,
                px: 2,
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: taxiMonterricoColors.green,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: taxiMonterricoColors.green,
                height: 3,
              },
            }}
          >
            <Tab 
              icon={
                <Tooltip title="Perfil" placement="bottom">
                  <span><Person /></span>
                </Tooltip>
              } 
            />
            <Tab 
              icon={
                <Tooltip title="Correo" placement="bottom">
                  <span><Email /></span>
                </Tooltip>
              } 
            />
            <Tab 
              icon={
                <Tooltip title="Llamadas" placement="bottom">
                  <span><Phone /></span>
                </Tooltip>
              } 
            />
            <Tab 
              icon={
                <Tooltip title="Calendario" placement="bottom">
                  <span><CalendarToday /></span>
                </Tooltip>
              } 
            />
            <Tab 
              icon={
                <Tooltip title="Tareas" placement="bottom">
                  <span><Assignment /></span>
                </Tooltip>
              } 
            />
            <Tab 
              icon={
                <Tooltip title="Seguridad" placement="bottom">
                  <span><Security /></span>
                </Tooltip>
              } 
            />
            <Tab 
              icon={
                <Tooltip title="Automatización" placement="bottom">
                  <span><Timeline /></span>
                </Tooltip>
              } 
            />
          </Tabs>

          {message && (
            <Box sx={{ px: 4, pt: 3 }}>
              <Alert 
                severity={message.type} 
                onClose={() => setMessage(null)}
                sx={{
                  borderRadius: 2,
                }}
              >
                {message.text}
              </Alert>
            </Box>
          )}

          {/* Pestaña Perfil */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', px: 3, pt: 4, pb: 3, bgcolor: theme.palette.background.paper }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  <Avatar
                    src={profileData.avatar}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      fontSize: '2.5rem',
                      bgcolor: taxiMonterricoColors.green,
                    }}
                  >
                    {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                  </Avatar>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: taxiMonterricoColors.green,
                      color: 'white',
                      width: 36,
                      height: 36,
                      border: '3px solid white',
                      '&:hover': {
                        bgcolor: taxiMonterricoColors.greenDark,
                      },
                    }}
                  >
                    <Edit sx={{ fontSize: 18 }} />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Apellidos"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Número de teléfono"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    sx={{ 
                      mt: 2,
                      mb: 2,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      bgcolor: taxiMonterricoColors.green,
                      fontWeight: 600,
                      alignSelf: 'center',
                      minWidth: 200,
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
          </TabPanel>

          {/* Pestaña Correo */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary }}>
                  Correo
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7, color: theme.palette.text.secondary }}>
                  Conecta tus cuentas personales de correo electrónico para registrar, hacer seguimiento, enviar y recibir correos.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleEmailConnect}
                  disabled={emailConnected || connectingEmail}
                  startIcon={emailConnected ? <CheckCircle /> : <Email />}
                  sx={{
                    bgcolor: emailConnected ? taxiMonterricoColors.green : '#FF6B35',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: emailConnected ? 'none' : '0 4px 12px rgba(255, 107, 53, 0.3)',
                    '&:hover': {
                      bgcolor: emailConnected ? taxiMonterricoColors.greenDark : '#E55A2B',
                      boxShadow: emailConnected ? 'none' : '0 6px 16px rgba(255, 107, 53, 0.4)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: taxiMonterricoColors.green,
                      color: 'white',
                    },
                  }}
                >
                  {connectingEmail ? 'Conectando...' : emailConnected ? 'Correo conectado' : 'Conectar correo personal'}
                </Button>
                
                {emailConnected && (
                  <Button
                    variant="outlined"
                    onClick={handleEmailDisconnect}
                    startIcon={<CloudOff />}
                    sx={{
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#c62828',
                        bgcolor: '#ffebee',
                      },
                    }}
                  >
                    Desconectar
                  </Button>
                )}
              </Box>
            </Box>
          </TabPanel>

          {/* Pestaña Llamadas */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary }}>
                  Llamadas
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                  Configura tus preferencias de llamadas telefónicas.
                </Typography>
              </Box>
              <Alert 
                severity="info"
                sx={{
                  borderRadius: 2,
                }}
              >
                La configuración de llamadas estará disponible próximamente.
              </Alert>
            </Box>
          </TabPanel>

          {/* Pestaña Calendario */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary }}>
                  Calendario
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                  Conecta tu calendario para sincronizar eventos y reuniones.
                </Typography>
              </Box>
              <Alert 
                severity="info"
                sx={{
                  borderRadius: 2,
                }}
              >
                La configuración de calendario estará disponible próximamente.
              </Alert>
            </Box>
          </TabPanel>

          {/* Pestaña Tareas */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary }}>
                  Tareas
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                  Configura tus preferencias de tareas y recordatorios.
                </Typography>
              </Box>
              <Alert 
                severity="info"
                sx={{
                  borderRadius: 2,
                }}
              >
                La configuración de tareas estará disponible próximamente.
              </Alert>
            </Box>
          </TabPanel>

          {/* Pestaña Seguridad */}
          <TabPanel value={tabValue} index={5}>
            <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  Dirección de correo electrónico
                </Typography>
                <TextField
                  fullWidth
                  value={profileData.email}
                  disabled
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <Button 
                  variant="outlined" 
                  size="medium"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor: `${taxiMonterricoColors.green}10`,
                    },
                  }}
                >
                  Editar dirección de correo
                </Button>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  Contraseña
                </Typography>
                {passwordLastReset && (
                  <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                    Restablecido por última vez el {passwordLastReset}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                  <TextField
                    fullWidth
                    type={showCurrentPassword ? 'text' : 'password'}
                    label="Contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handlePasswordChange}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      bgcolor: taxiMonterricoColors.green,
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: taxiMonterricoColors.greenDark,
                      },
                      alignSelf: 'flex-start',
                    }}
                  >
                    Cambiar contraseña
                  </Button>
                </Box>
              </Box>

            </Box>
          </TabPanel>

          {/* Pestaña Automatización */}
          <TabPanel value={tabValue} index={6}>
            <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary }}>
                  Automatización
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                  Configura tus preferencias de automatización y flujos de trabajo.
                </Typography>
              </Box>
              <Alert 
                severity="info"
                sx={{
                  borderRadius: 2,
                }}
              >
                La configuración de automatización estará disponible próximamente.
              </Alert>
            </Box>
          </TabPanel>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

