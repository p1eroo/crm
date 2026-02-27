import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Checkbox,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { Info, Search } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';

interface Permission {
  key: string;
  name: string;
  granted: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Administrador',
  jefe_comercial: 'Jefe Comercial',
  manager: 'Gerente',
  user: 'Usuario',
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  view_all_data: 'Permite ver todos los datos del sistema incluyendo los de otros usuarios',
  edit_all_data: 'Permite editar cualquier registro del sistema',
  delete_data: 'Permite eliminar registros del sistema',
  manage_users: 'Permite crear, editar y desactivar usuarios',
  view_reports: 'Permite acceder a la sección de reportes',
  manage_settings: 'Permite modificar la configuración del sistema',
  view_system_logs: 'Permite ver los logs de actividad del sistema',
};

interface ModulePermission {
  key: string;
  label: string;
}

interface ModuleSection {
  module: string;
  perms: ModulePermission[];
}

const MODULE_SECTIONS: ModuleSection[] = [
  { module: 'Dashboard', perms: [
    { key: 'view_all_data', label: 'Ver dashboard' },
  ]},
  { module: 'Contactos', perms: [
    { key: 'view_all_data', label: 'Ver contactos' },
    { key: 'edit_all_data', label: 'Editar contactos' },
    { key: 'delete_data', label: 'Eliminar contactos' },
  ]},
  { module: 'Empresas', perms: [
    { key: 'view_all_data', label: 'Ver empresas' },
    { key: 'edit_all_data', label: 'Editar empresas' },
    { key: 'delete_data', label: 'Eliminar empresas' },
  ]},
  { module: 'Negocios', perms: [
    { key: 'view_all_data', label: 'Ver negocios' },
    { key: 'edit_all_data', label: 'Editar negocios' },
    { key: 'delete_data', label: 'Eliminar negocios' },
  ]},
  { module: 'Tareas', perms: [
    { key: 'view_all_data', label: 'Ver tareas' },
    { key: 'edit_all_data', label: 'Editar tareas' },
    { key: 'delete_data', label: 'Eliminar tareas' },
  ]},
  { module: 'Calendario', perms: [
    { key: 'view_all_data', label: 'Ver calendario' },
  ]},
  { module: 'Correo', perms: [
    { key: 'view_all_data', label: 'Ver correos' },
  ]},
  { module: 'Reportes', perms: [
    { key: 'view_reports', label: 'Ver reportes' },
  ]},
  { module: 'Usuarios', perms: [
    { key: 'manage_users', label: 'Gestionar usuarios' },
  ]},
  { module: 'Configuración', perms: [
    { key: 'manage_settings', label: 'Gestionar configuración' },
  ]},
  { module: 'Logs del Sistema', perms: [
    { key: 'view_system_logs', label: 'Ver logs del sistema' },
  ]},
];

const RolesAndPermissions: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRoles();
    }
  }, [user?.role]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar roles y permisos');
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = searchTerm.trim()
    ? MODULE_SECTIONS.map((section) => {
        const term = searchTerm.toLowerCase();
        const moduleMatches = section.module.toLowerCase().includes(term);
        if (moduleMatches) return section;
        const matchedPerms = section.perms.filter((p) => p.label.toLowerCase().includes(term));
        if (matchedPerms.length > 0) return { ...section, perms: matchedPerms };
        return null;
      }).filter(Boolean) as ModuleSection[]
    : MODULE_SECTIONS;

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ 
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <Alert 
          severity="error" 
          sx={{ borderRadius: 2, maxWidth: '600px', width: '100%' }}
        >
          No tienes permisos para ver roles y permisos
        </Alert>
      </Box>
    );
  }

  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#1c252e' : '#fafafa';
  const headerBg = cardBg;
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
  const stickyColBg = cardBg;

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, pb: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          px: { xs: 2, md: 3 },
          py: { xs: 1.25, md: 1.5 },
          mb: 4,
          bgcolor: cardBg,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.1375rem' },
            color: '#828690',
          }}
        >
          Roles y Permisos
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: taxiMonterricoColors.green }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mx: { xs: 2, md: 3 } }}>{error}</Alert>
      ) : (
        <Box
          sx={{
            mx: 0,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: cardBg,
          }}
        >
          <Box sx={{ overflowX: 'auto', px: { xs: 2.5, md: 3 }, py: { xs: 2, md: 2.5 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `300px repeat(${roles.length}, minmax(160px, 1fr))`,
                minWidth: `${300 + roles.length * 160}px`,
              }}
            >
              {/* Header row with search */}
              <Box
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  bgcolor: headerBg,
                  pl: { xs: 2, md: 2.5 },
                  pr: 2,
                  py: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <TextField
                  size="small"
                  placeholder="Buscar módulo o permiso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      borderRadius: 2,
                      bgcolor: 'transparent',
                      '& fieldset': { border: 'none' },
                      '& input::placeholder': {
                        color: theme.palette.text.secondary,
                        opacity: 0.7,
                      },
                    },
                  }}
                />
              </Box>
              {roles.map((role) => (
                <Box
                  key={role.id}
                  sx={{
                    bgcolor: headerBg,
                    px: 2,
                    py: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    borderLeft: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography sx={{ fontWeight: 400, fontSize: '0.9375rem', color: theme.palette.text.primary, textAlign: 'center' }}>
                    {ROLE_DISPLAY_NAMES[role.name] || role.name}
                  </Typography>
                  <Chip
                    label={`${role.userCount} ${role.userCount === 1 ? 'usuario' : 'usuarios'}`}
                    size="small"
                    sx={{
                      bgcolor: `${taxiMonterricoColors.green}15`,
                      color: taxiMonterricoColors.green,
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Box>
              ))}

              {/* Module sections with permission rows */}
              {filteredSections.map((section) => (
                <React.Fragment key={section.module}>
                  {/* Module header row */}
                  <Box
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      pl: { xs: 3, md: 4 },
                      pr: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: isDark ? theme.palette.text.primary : '#333' }}>
                      {section.module}
                    </Typography>
                  </Box>
                  {roles.map((role, idx) => (
                    <Box
                      key={`${section.module}-header-${role.id}`}
                      sx={{
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        ...(idx === 0 && { borderLeft: `1px solid ${theme.palette.divider}` }),
                      }}
                    />
                  ))}

                  {/* Permission rows under this module */}
                  {section.perms.map((perm) => (
                    <React.Fragment key={`${section.module}-${perm.key}`}>
                      <Box
                        sx={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          bgcolor: stickyColBg,
                          pl: { xs: 5, md: 6 },
                          pr: 2,
                          py: 1.75,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:hover': { bgcolor: rowHoverBg },
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.875rem', color: isDark ? theme.palette.text.primary : '#444', fontWeight: 400 }}>
                          {perm.label}
                        </Typography>
                        {PERMISSION_DESCRIPTIONS[perm.key] && (
                          <Tooltip title={PERMISSION_DESCRIPTIONS[perm.key]} arrow placement="right">
                            <Info sx={{ fontSize: 15, color: theme.palette.text.disabled, cursor: 'help', flexShrink: 0 }} />
                          </Tooltip>
                        )}
                      </Box>
                      {roles.map((role) => {
                        const granted = role.permissions.find(p => p.key === perm.key)?.granted || false;
                        return (
                          <Box
                            key={`${role.id}-${section.module}-${perm.key}`}
                            sx={{
                              px: 2,
                              py: 1.75,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              borderLeft: `1px solid ${theme.palette.divider}`,
                              '&:hover': { bgcolor: rowHoverBg },
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <Checkbox
                              checked={granted}
                              disabled
                              size="small"
                              sx={{
                                p: 0,
                                color: theme.palette.divider,
                                '&.Mui-checked': {
                                  color: taxiMonterricoColors.green,
                                },
                                '&.Mui-disabled': {
                                  color: granted ? taxiMonterricoColors.green : theme.palette.divider,
                                },
                              }}
                            />
                          </Box>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RolesAndPermissions;
