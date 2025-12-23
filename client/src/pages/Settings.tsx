import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  CalendarToday,
  Assignment,
  Security,
  Timeline,
  CheckCircle,
  CloudOff,
  ChevronLeft,
  ChevronRight,
  Close,
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0, bgcolor: theme.palette.background.paper }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Correo
  const [emailConnected, setEmailConnected] = useState(false);
  const [connectingEmail, setConnectingEmail] = useState(false);

  // Seguridad
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLastReset, setPasswordLastReset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    email: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || '',
      });
      checkGoogleConnection();
      fetchUserProfile();
    }
  }, [user]);

  const checkGoogleConnection = async () => {
    try {
      const response = await api.get('/google/token');
      const isConnected = response.data.hasToken && !response.data.isExpired;
      setEmailConnected(isConnected);
    } catch (error: any) {
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
        email: userData.email || '',
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMessage(null);
  };

  const checkScrollButtons = React.useCallback(() => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      const hasScroll = scrollWidth > clientWidth;
      setCanScrollLeft(hasScroll && scrollLeft > 0);
      setCanScrollRight(hasScroll && scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = tabsContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      tabsContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    const timer1 = setTimeout(() => {
      checkScrollButtons();
    }, 50);
    const timer2 = setTimeout(() => {
      checkScrollButtons();
    }, 200);
    const timer3 = setTimeout(() => {
      checkScrollButtons();
    }, 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [tabValue, checkScrollButtons]);

  React.useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  const handleEmailConnect = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Usuario no identificado' });
      return;
    }

    setConnectingEmail(true);
    try {
      const response = await api.get('/google/auth');
      if (response.data.authUrl) {
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
    } catch (error: any) {
      console.error('Error desconectando correo:', error);
      const errorMessage = error.response?.data?.message || 'Error al desconectar el correo';
      setMessage({ type: 'error', text: errorMessage });
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

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', py: 3 }}>
      <Paper
        sx={{
          boxShadow: 'none',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5, fontSize: '1.125rem' }}>
                Configuración
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
                Gestiona tus preferencias y configuraciones
              </Typography>
            </Box>
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
                  {message.text}
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
          </Box>
        </Box>

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', borderTop: 1, borderBottom: 1, borderColor: 'divider', width: '100%', overflow: 'hidden' }}>
          {canScrollLeft && (
            <IconButton
              onClick={() => scrollTabs('left')}
              size="small"
              sx={{
                position: 'absolute',
                left: 4,
                zIndex: 2,
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}
          <Box
            ref={tabsContainerRef}
            sx={{
              flex: 1,
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollBehavior: 'smooth',
              width: '100%',
              minWidth: 0,
            }}
            onScroll={checkScrollButtons}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="standard"
              sx={{
                px: 2,
                minHeight: 44,
                '& .MuiTabs-flexContainer': {
                  gap: 0,
                  width: 'max-content',
                },
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  minHeight: 44,
                  px: 2,
                  color: theme.palette.text.secondary,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  gap: 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '& .MuiTab-iconWrapper': {
                    marginRight: '6px',
                    '& svg': {
                      fontSize: '1rem',
                      color: theme.palette.text.secondary,
                    },
                  },
                  '&.Mui-selected': {
                    color: taxiMonterricoColors.green,
                    bgcolor: 'transparent',
                    '& .MuiTab-iconWrapper': {
                      '& svg': {
                        color: taxiMonterricoColors.green,
                      },
                    },
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: taxiMonterricoColors.green,
                  height: 3,
                },
              }}
            >
              <Tab 
                icon={<Email />}
                iconPosition="start"
                label="Correo"
              />
              <Tab 
                icon={<CalendarToday />}
                iconPosition="start"
                label="Calendario"
              />
              <Tab 
                icon={<Assignment />}
                iconPosition="start"
                label="Tareas"
              />
              <Tab 
                icon={<Security />}
                iconPosition="start"
                label="Seguridad"
              />
              <Tab 
                icon={<Timeline />}
                iconPosition="start"
                label="Automatización"
              />
            </Tabs>
          </Box>
          {canScrollRight && (
            <IconButton
              onClick={() => scrollTabs('right')}
              size="small"
              sx={{
                position: 'absolute',
                right: 4,
                zIndex: 2,
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <ChevronRight />
            </IconButton>
          )}
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

        {/* Pestaña Correo */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.125rem' }}>
                Correo
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
                Conecta tus cuentas personales de correo electrónico para registrar, hacer seguimiento, enviar y recibir correos.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleEmailConnect}
                disabled={emailConnected || connectingEmail}
                startIcon={emailConnected ? <CheckCircle sx={{ fontSize: 18 }} /> : <Email sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: emailConnected ? taxiMonterricoColors.green : '#FF6B35',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  px: 2.5,
                  py: 1,
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
                  size="small"
                  onClick={handleEmailDisconnect}
                  startIcon={<CloudOff sx={{ fontSize: 18 }} />}
                  sx={{
                    fontSize: '0.875rem',
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#c62828',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : '#ffebee',
                    },
                  }}
                >
                  Desconectar
                </Button>
              )}
            </Box>
          </Box>
        </TabPanel>

        {/* Pestaña Calendario */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.125rem' }}>
                Calendario
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, fontSize: '0.8125rem' }}>
                Conecta tu calendario para sincronizar eventos y reuniones.
              </Typography>
            </Box>
            <Alert 
              severity="info"
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
              La configuración de calendario estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>

        {/* Pestaña Tareas */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.125rem' }}>
                Tareas
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, fontSize: '0.8125rem' }}>
                Configura tus preferencias de tareas y recordatorios.
              </Typography>
            </Box>
            <Alert 
              severity="info"
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
              La configuración de tareas estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>

        {/* Pestaña Seguridad */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.875rem' }}>
                Dirección de correo electrónico
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={profileData.email}
                disabled
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  }
                }}
              />
              <Button 
                variant="outlined" 
                size="small"
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
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
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.875rem' }}>
                Contraseña
              </Typography>
              {passwordLastReset && (
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
                  Restablecido por última vez el {passwordLastReset}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
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
                  size="small"
                  type={showNewPassword ? 'text' : 'password'}
                  label="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
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
                  size="small"
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.875rem',
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
                  size="small"
                  onClick={handlePasswordChange}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    py: 1,
                    bgcolor: taxiMonterricoColors.green,
                    fontWeight: 600,
                    fontSize: '0.875rem',
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
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3, pt: 4, pb: 1, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.125rem' }}>
                Automatización
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, fontSize: '0.8125rem' }}>
                Configura tus preferencias de automatización y flujos de trabajo.
              </Typography>
            </Box>
            <Alert 
              severity="info"
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
              La configuración de automatización estará disponible próximamente.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;

