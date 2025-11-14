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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
        General
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Estas preferencias solo se aplican a ti.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
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
          <Box sx={{ p: 2 }}>
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          </Box>
        )}

        {/* Pestaña Perfil */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Global
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Esto se aplica a todas las cuentas que tienes.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, flex: { md: '0 0 300px' } }}>
              <Avatar
                src={profileData.avatar}
                sx={{ width: 100, height: 100, mb: 2 }}
              >
                {profileData.firstName?.[0]}{profileData.lastName?.[0]}
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Edit />}
                size="small"
              >
                Cambiar imagen
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Imagen de perfil
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Apellidos"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Idioma</InputLabel>
                <Select
                  value={profileData.language}
                  label="Idioma"
                  onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                  endAdornment={
                    <InputAdornment position="end">
                      <Info fontSize="small" color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Formato de hora, fecha y número</InputLabel>
                <Select
                  value={profileData.dateFormat}
                  label="Formato de hora, fecha y número"
                  onChange={(e) => setProfileData({ ...profileData, dateFormat: e.target.value })}
                  endAdornment={
                    <InputAdornment position="end">
                      <Info fontSize="small" color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="es-ES">España</MenuItem>
                  <MenuItem value="en-US">Estados Unidos</MenuItem>
                  <MenuItem value="pt-BR">Brasil</MenuItem>
                </Select>
                <FormHelperText>
                  Formato: {new Date().toLocaleDateString(profileData.dateFormat)} y {new Date().toLocaleTimeString(profileData.dateFormat)}
                </FormHelperText>
              </FormControl>
              <TextField
                fullWidth
                label="Número de teléfono"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                helperText="Podríamos usar este número de teléfono para contactarte en referencia a eventos de seguridad. Consulta nuestra política de privacidad para obtener más información."
              />
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
                disabled={loading}
                sx={{ mt: 3 }}
              >
                Guardar cambios
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Pestaña Correo */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Correo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Conecta tus cuentas personales de correo electrónico para registrar, hacer seguimiento, enviar y recibir correos. Para administrar los correos de cualquier equipo, ve a la{' '}
            <Link href="#" underline="hover">
              configuración de bandeja de entrada
            </Link>
            .
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✓ Enviar y programar correos desde HubSpot
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✓ Registrar respuestas a correos en HubSpot automáticamente
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✓ Sugerir tareas de seguimiento y capturar detalles de contactos desde tu correo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Requiere automatización de la bandeja de entrada
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleEmailConnect}
              disabled={emailConnected}
            >
              {emailConnected ? 'Correo conectado' : 'Conectar correo personal'}
            </Button>
          </Box>
        </TabPanel>

        {/* Pestaña Llamadas */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Llamadas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configura tus preferencias de llamadas telefónicas.
          </Typography>
          <Alert severity="info">
            La configuración de llamadas estará disponible próximamente.
          </Alert>
        </TabPanel>

        {/* Pestaña Calendario */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Calendario
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Conecta tu calendario para sincronizar eventos y reuniones.
          </Typography>
          <Alert severity="info">
            La configuración de calendario estará disponible próximamente.
          </Alert>
        </TabPanel>

        {/* Pestaña Tareas */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Tareas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configura tus preferencias de tareas y recordatorios.
          </Typography>
          <Alert severity="info">
            La configuración de tareas estará disponible próximamente.
          </Alert>
        </TabPanel>

        {/* Pestaña Seguridad */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Seguridad
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Establece preferencias relacionadas con el inicio de sesión y la seguridad de tu cuenta personal.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Dirección de correo electrónico
            </Typography>
            <TextField
              fullWidth
              value={profileData.email}
              disabled
              sx={{ mb: 2 }}
            />
            <Button variant="outlined" size="small">
              Editar dirección de correo
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Contraseña
            </Typography>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTabValue(5);
              }}
              underline="hover"
              sx={{ display: 'block', mb: 1 }}
            >
              Cambiar contraseña
            </Link>
            {passwordLastReset && (
              <Typography variant="body2" color="text.secondary">
                Restablecido por última vez el {passwordLastReset}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                type={showCurrentPassword ? 'text' : 'password'}
                label="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={{ mb: 2 }}
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
                sx={{ mb: 2 }}
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
                sx={{ mb: 2 }}
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
              >
                Cambiar contraseña
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Retirada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Si no usas una contraseña para iniciar sesión en más de 90 días, HubSpot la eliminará.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ESTADO</TableCell>
                    <TableCell>FECHA DE RETIRADA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Chip label="Inelegible" size="small" color="default" />
                    </TableCell>
                    <TableCell>Ninguna</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Número de teléfono de confianza
            </Typography>
            <Link href="#" underline="hover" sx={{ display: 'block', mb: 1 }}>
              Agrega un número de teléfono de confianza
            </Link>
            <Typography variant="body2" color="text.secondary">
              Agrega un número de teléfono utilizado para verificar ocasionalmente tu identidad y recibir otras alertas relacionadas con la seguridad. Este número de teléfono nunca se utilizará para fines de ventas o marketing.
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Claves de acceso
            </Typography>
            <Link href="#" underline="hover">
              Configurar claves de acceso
            </Link>
          </Box>
        </TabPanel>

        {/* Pestaña Automatización */}
        <TabPanel value={tabValue} index={6}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Automatización
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configura tus preferencias de automatización y flujos de trabajo.
          </Typography>
          <Alert severity="info">
            La configuración de automatización estará disponible próximamente.
          </Alert>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Profile;

