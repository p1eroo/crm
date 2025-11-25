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
  Link,
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

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
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

  useEffect(() => {
    if (user) {
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
  }, [user]);

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

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
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

  const handleEmailConnect = () => {
    setMessage({ type: 'success', text: 'Funcionalidad de conexión de correo en desarrollo' });
    // Aquí se implementaría la lógica de conexión de correo
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Aquí se implementaría la subida de imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#1a1a1a' }}>
          General
        </Typography>
        <Typography variant="body1" sx={{ color: '#757575', fontSize: '0.9375rem' }}>
          Estas preferencias solo se aplican a ti.
        </Typography>
      </Box>

      <Paper 
        sx={{ 
          mb: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
              minHeight: 64,
              px: 3,
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
          <Tab icon={<Person />} iconPosition="start" label="Perfil" />
          <Tab icon={<Email />} iconPosition="start" label="Correo" />
          <Tab icon={<Phone />} iconPosition="start" label="Llamadas" />
          <Tab icon={<CalendarToday />} iconPosition="start" label="Calendario" />
          <Tab icon={<Assignment />} iconPosition="start" label="Tareas" />
          <Tab icon={<Security />} iconPosition="start" label="Seguridad" />
          <Tab icon={<Timeline />} iconPosition="start" label="Automatización" />
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
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: { xs: 2.5, sm: 3 },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  flex: { md: '0 0 280px' },
                  p: 3,
                  bgcolor: '#f8f9fa',
                  borderRadius: 2,
                  border: '1px solid #e9ecef',
                }}
              >
                <Avatar
                  src={profileData.avatar}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2,
                    fontSize: '2.5rem',
                    bgcolor: taxiMonterricoColors.green,
                  }}
                >
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Edit />}
                  size="medium"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    borderColor: '#d0d0d0',
                    color: '#1a1a1a',
                    '&:hover': {
                      borderColor: taxiMonterricoColors.green,
                      bgcolor: `${taxiMonterricoColors.green}10`,
                    },
                  }}
                >
                  Cambiar imagen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
                <Typography variant="caption" sx={{ mt: 1.5, color: '#9e9e9e' }}>
                  Imagen de perfil
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      bgcolor: taxiMonterricoColors.green,
                      fontWeight: 600,
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
        </TabPanel>

        {/* Pestaña Correo */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1a1a1a' }}>
                Correo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, color: '#757575' }}>
                Conecta tus cuentas personales de correo electrónico para registrar, hacer seguimiento, enviar y recibir correos. Para administrar los correos de cualquier equipo, ve a la{' '}
                <Link 
                  href="#" 
                  underline="hover"
                  sx={{ 
                    color: taxiMonterricoColors.green,
                    fontWeight: 500,
                    '&:hover': {
                      color: taxiMonterricoColors.greenDark,
                    }
                  }}
                >
                  configuración de bandeja de entrada
                </Link>
                .
              </Typography>
            </Box>

            <Box 
              sx={{ 
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                p: 3,
                mb: 3,
                border: '1px solid #e9ecef',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckCircle 
                    sx={{ 
                      color: taxiMonterricoColors.green, 
                      fontSize: 20, 
                      mt: 0.25,
                      flexShrink: 0,
                    }} 
                  />
                  <Typography variant="body2" sx={{ color: '#1a1a1a', lineHeight: 1.6 }}>
                    Enviar y programar correos desde el CRM
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckCircle 
                    sx={{ 
                      color: taxiMonterricoColors.green, 
                      fontSize: 20, 
                      mt: 0.25,
                      flexShrink: 0,
                    }} 
                  />
                  <Typography variant="body2" sx={{ color: '#1a1a1a', lineHeight: 1.6 }}>
                    Registrar respuestas a correos automáticamente
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckCircle 
                    sx={{ 
                      color: taxiMonterricoColors.green, 
                      fontSize: 20, 
                      mt: 0.25,
                      flexShrink: 0,
                    }} 
                  />
                  <Typography variant="body2" sx={{ color: '#1a1a1a', lineHeight: 1.6 }}>
                    Sugerir tareas de seguimiento y capturar detalles de contactos desde tu correo
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="caption" sx={{ color: '#9e9e9e', fontStyle: 'italic' }}>
                  Requiere automatización de la bandeja de entrada
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleEmailConnect}
              disabled={emailConnected}
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
              {emailConnected ? 'Correo conectado' : 'Conectar correo personal'}
            </Button>
          </Box>
        </TabPanel>

        {/* Pestaña Llamadas */}
        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 4,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1a1a1a' }}>
                Llamadas
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.7 }}>
                Configura tus preferencias de llamadas telefónicas.
              </Typography>
            </Box>
            <Alert 
              severity="info"
              sx={{
                borderRadius: 2,
                bgcolor: '#e3f2fd',
              }}
            >
              La configuración de llamadas estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>

        {/* Pestaña Calendario */}
        <TabPanel value={tabValue} index={3}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 4,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1a1a1a' }}>
                Calendario
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.7 }}>
                Conecta tu calendario para sincronizar eventos y reuniones.
              </Typography>
            </Box>
            <Alert 
              severity="info"
              sx={{
                borderRadius: 2,
                bgcolor: '#e3f2fd',
              }}
            >
              La configuración de calendario estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>

        {/* Pestaña Tareas */}
        <TabPanel value={tabValue} index={4}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 4,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1a1a1a' }}>
                Tareas
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.7 }}>
                Configura tus preferencias de tareas y recordatorios.
              </Typography>
            </Box>
            <Alert 
              severity="info"
              sx={{
                borderRadius: 2,
                bgcolor: '#e3f2fd',
              }}
            >
              La configuración de tareas estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>

        {/* Pestaña Seguridad */}
        <TabPanel value={tabValue} index={5}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 4,
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1a1a1a' }}>
                Seguridad
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.7 }}>
                Establece preferencias relacionadas con el inicio de sesión y la seguridad de tu cuenta personal.
              </Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
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
                  borderColor: '#d0d0d0',
                  color: '#1a1a1a',
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
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Contraseña
              </Typography>
              {passwordLastReset && (
                <Typography variant="body2" sx={{ mb: 2, color: '#757575' }}>
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

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Retirada
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5, color: '#757575', lineHeight: 1.7 }}>
                Si no usas una contraseña para iniciar sesión en más de 90 días, el sistema la eliminará.
              </Typography>
              <TableContainer
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>ESTADO</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>FECHA DE RETIRADA</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Chip label="Inelegible" size="small" sx={{ bgcolor: '#e0e0e0', color: '#1a1a1a' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#757575' }}>Ninguna</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Número de teléfono de confianza
              </Typography>
              <Link 
                href="#" 
                underline="hover" 
                sx={{ 
                  display: 'inline-block', 
                  mb: 1.5,
                  color: taxiMonterricoColors.green,
                  fontWeight: 500,
                  '&:hover': {
                    color: taxiMonterricoColors.greenDark,
                  }
                }}
              >
                Agrega un número de teléfono de confianza
              </Link>
              <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.7 }}>
                Agrega un número de teléfono utilizado para verificar ocasionalmente tu identidad y recibir otras alertas relacionadas con la seguridad. Este número de teléfono nunca se utilizará para fines de ventas o marketing.
              </Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Claves de acceso
              </Typography>
              <Link 
                href="#" 
                underline="hover"
                sx={{
                  color: taxiMonterricoColors.green,
                  fontWeight: 500,
                  '&:hover': {
                    color: taxiMonterricoColors.greenDark,
                  }
                }}
              >
                Configurar claves de acceso
              </Link>
            </Box>
          </Box>
        </TabPanel>

        {/* Pestaña Automatización */}
        <TabPanel value={tabValue} index={6}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 4,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600, color: '#1a1a1a' }}>
                Automatización
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.7 }}>
                Configura tus preferencias de automatización y flujos de trabajo.
              </Typography>
            </Box>
            <Alert 
              severity="info"
              sx={{
                borderRadius: 2,
                bgcolor: '#e3f2fd',
              }}
            >
              La configuración de automatización estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Profile;

