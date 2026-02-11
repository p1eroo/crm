import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Search } from '@mui/icons-material';
import { taxiMonterricoColors } from '../theme/colors';

export interface CompanyFormData {
  name: string;
  domain: string;
  linkedin: string;
  companyname: string;
  phone: string;
  email: string;
  leadSource: string;
  lifecycleStage: string;
  estimatedRevenue: string | number;
  ruc: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isRecoveredClient: boolean;
  ownerId: string;
}

export const getInitialFormData = (editingCompany: any): CompanyFormData => {
  if (editingCompany) {
    return {
      name: editingCompany.name || '',
      domain: editingCompany.domain || '',
      linkedin: editingCompany.linkedin || '',
      companyname: editingCompany.companyname || '',
      phone: editingCompany.phone || '',
      email: editingCompany.email || '',
      leadSource: editingCompany.leadSource || '',
      lifecycleStage: editingCompany.lifecycleStage || 'lead',
      estimatedRevenue: editingCompany.estimatedRevenue || '',
      ruc: editingCompany.ruc || '',
      address: editingCompany.address || '',
      city: editingCompany.city || '',
      state: editingCompany.state || '',
      country: editingCompany.country || '',
      isRecoveredClient: editingCompany.isRecoveredClient || false,
      ownerId: editingCompany.ownerId?.toString() || '',
    };
  }
  return {
    name: '', domain: '', linkedin: '', companyname: '', phone: '', email: '',
    leadSource: '', lifecycleStage: 'lead', estimatedRevenue: '', ruc: '',
    address: '', city: '', state: '', country: '', isRecoveredClient: false, ownerId: '',
  };
};

export type CompanyFormContentProps = {
  initialData: CompanyFormData;
  formDataRef: React.MutableRefObject<{ formData: CompanyFormData; setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>> }>;
  user: any;
  users: any[];
  editingCompany: any;
  theme: Theme;
  rucError: string;
  nameError: string;
  rucValidationError: string;
  loadingRuc: boolean;
  setRucError: (v: string) => void;
  setNameError: (v: string) => void;
  setRucValidationError: (v: string) => void;
  setLoadingRuc: (v: boolean) => void;
  onRucChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formData: CompanyFormData) => void;
  onCompanyNameChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formData: CompanyFormData) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCityChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStateChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCountryChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDomainChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSearchRuc: () => void;
  onFormDataChange: (updates: Partial<CompanyFormData>) => void;
};

export const CompanyFormContent: React.FC<CompanyFormContentProps> = (props) => {
  const {
    initialData,
    formDataRef,
    user,
    users,
    theme,
    rucError,
    nameError,
    rucValidationError,
    loadingRuc,
    onRucChange,
    onCompanyNameChange,
    onNameChange,
    onPhoneChange,
    onAddressChange,
    onCityChange,
    onStateChange,
    onCountryChange,
    onDomainChange,
    onSearchRuc,
    onFormDataChange,
  } = props;
  const [formData, setFormData] = useState(initialData);
  useEffect(() => {
    formDataRef.current = { formData, setFormData };
  }, [formDataRef, formData]);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4, rowGap: 0.5, alignItems: 'start' }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>
          RUC <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>Razón social</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            size="small"
            value={formData.ruc}
            onChange={(e) => onRucChange(e, formData)}
            error={!!rucError || !!rucValidationError}
            helperText={rucError || rucValidationError}
            inputProps={{ maxLength: 11, style: { fontSize: '1rem' } }}
            InputProps={{
              sx: { '& input': { py: 1.05 } },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onSearchRuc}
                    disabled={loadingRuc || !formData.ruc || formData.ruc.length < 11}
                    sx={{ color: taxiMonterricoColors.green, '&:hover': { bgcolor: `${taxiMonterricoColors.green}15` }, '&.Mui-disabled': { color: theme.palette.text.disabled } }}
                  >
                    {loadingRuc ? <CircularProgress size={20} /> : <Search />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.companyname} onChange={onCompanyNameChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>
          Nombre comercial <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Teléfono</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.name} onChange={(e) => onNameChange(e, formData)} error={!!nameError} helperText={nameError} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.phone} onChange={onPhoneChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Distrito</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Provincia</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.city} onChange={onCityChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.state} onChange={onStateChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Departamento</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Dirección</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.country} onChange={onCountryChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.address} onChange={onAddressChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Dominio</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>LinkedIn</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.domain} onChange={onDomainChange} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" value={formData.linkedin} onChange={(e) => onFormDataChange({ linkedin: e.target.value })} placeholder="https://www.linkedin.com/company/..." fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Correo</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Origen de lead</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField size="small" type="email" value={formData.email} onChange={(e) => onFormDataChange({ email: e.target.value })} fullWidth inputProps={{ style: { fontSize: '1rem' } }} InputProps={{ sx: { '& input': { py: 1.05 } } }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            select
            size="small"
            value={formData.leadSource || ''}
            onChange={(e) => onFormDataChange({ leadSource: e.target.value })}
            fullWidth
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
            SelectProps={{ MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } } }}
          >
            <MenuItem value="">-- Seleccionar --</MenuItem>
            <MenuItem value="referido">Referido</MenuItem>
            <MenuItem value="base">Base</MenuItem>
            <MenuItem value="entorno">Entorno</MenuItem>
            <MenuItem value="feria">Feria</MenuItem>
            <MenuItem value="masivo">Masivo</MenuItem>
          </TextField>
        </Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Etapa del Ciclo de Vida</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Facturación</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            select
            size="small"
            value={formData.lifecycleStage}
            onChange={(e) => onFormDataChange({ lifecycleStage: e.target.value })}
            fullWidth
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
            SelectProps={{ MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } } }}
          >
            <MenuItem value="lead_inactivo">Lead Inactivo</MenuItem>
            <MenuItem value="cliente_perdido">Cliente perdido</MenuItem>
            <MenuItem value="cierre_perdido">Cierre Perdido</MenuItem>
            <MenuItem value="lead">Lead</MenuItem>
            <MenuItem value="contacto">Contacto</MenuItem>
            <MenuItem value="reunion_agendada">Reunión Agendada</MenuItem>
            <MenuItem value="reunion_efectiva">Reunión Efectiva</MenuItem>
            <MenuItem value="propuesta_economica">Propuesta Económica</MenuItem>
            <MenuItem value="negociacion">Negociación</MenuItem>
            <MenuItem value="licitacion">Licitación</MenuItem>
            <MenuItem value="licitacion_etapa_final">Licitación Etapa Final</MenuItem>
            <MenuItem value="cierre_ganado">Cierre Ganado</MenuItem>
            <MenuItem value="firma_contrato">Firma de Contrato</MenuItem>
            <MenuItem value="activo">Activo</MenuItem>
          </TextField>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            size="small"
            type="number"
            value={formData.estimatedRevenue}
            onChange={(e) => onFormDataChange({ estimatedRevenue: e.target.value })}
            fullWidth
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ startAdornment: <InputAdornment position="start">S/</InputAdornment>, sx: { '& input': { py: 1.05 } } }}
          />
        </Box>
        {(user?.role === 'admin' || user?.role === 'jefe_comercial') ? (
          <>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Propietario</Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5 }}>Cliente Recuperado</Typography>
            <Box sx={{ minWidth: 0 }}>
              <TextField
                select
                size="small"
                value={formData.ownerId || ''}
                onChange={(e) => onFormDataChange({ ownerId: e.target.value })}
                fullWidth
                inputProps={{ style: { fontSize: '1rem' } }}
                InputProps={{ sx: { '& input': { py: 1.05 } } }}
                SelectProps={{ MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } } }}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {users.filter((u) => u.role === 'user').map((userOption) => (
                  <MenuItem key={userOption.id} value={userOption.id.toString()}>{userOption.firstName} {userOption.lastName}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <TextField
                select
                size="small"
                value={formData.isRecoveredClient ? 'si' : 'no'}
                onChange={(e) => onFormDataChange({ isRecoveredClient: e.target.value === 'si' })}
                fullWidth
                inputProps={{ style: { fontSize: '1rem' } }}
                InputProps={{ sx: { '& input': { py: 1.05 } } }}
                SelectProps={{ MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } } }}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="si">Sí</MenuItem>
              </TextField>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 1.5, gridColumn: '1 / -1' }}>Cliente Recuperado</Typography>
            <Box sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
              <TextField
                select
                size="small"
                value={formData.isRecoveredClient ? 'si' : 'no'}
                onChange={(e) => onFormDataChange({ isRecoveredClient: e.target.value === 'si' })}
                fullWidth
                inputProps={{ style: { fontSize: '1rem' } }}
                InputProps={{ sx: { '& input': { py: 1.05 } } }}
                SelectProps={{ MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } } }}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="si">Sí</MenuItem>
              </TextField>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
