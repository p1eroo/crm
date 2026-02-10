import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Autocomplete } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { taxiMonterricoColors } from '../theme/colors';

export interface DealFormData {
  name: string;
  amount: string;
  stage: string;
  closeDate: string;
  priority: 'baja' | 'media' | 'alta';
  companyId: string;
  contactId: string;
}

export const getInitialDealFormData = (editingDeal: any): DealFormData => {
  if (editingDeal) {
    return {
      name: editingDeal.name || '',
      amount: editingDeal.amount?.toString() || '',
      stage: editingDeal.stage || 'lead',
      closeDate: editingDeal.closeDate ? editingDeal.closeDate.split('T')[0] : '',
      priority: (editingDeal.priority as 'baja' | 'media' | 'alta') || 'baja',
      companyId: editingDeal.Company?.id?.toString() || editingDeal.companyId?.toString() || '',
      contactId: editingDeal.Contact?.id?.toString() || editingDeal.contactId?.toString() || '',
    };
  }
  return {
    name: '',
    amount: '',
    stage: 'lead',
    closeDate: '',
    priority: 'baja',
    companyId: '',
    contactId: '',
  };
};

export const stageOptions = [
  { value: "lead", label: "Lead" },
  { value: "contacto", label: "Contacto" },
  { value: "reunion_agendada", label: "Reunión Agendada" },
  { value: "reunion_efectiva", label: "Reunión Efectiva" },
  { value: "propuesta_economica", label: "Propuesta Económica" },
  { value: "negociacion", label: "Negociación" },
  { value: "licitacion", label: "Licitación" },
  { value: "licitacion_etapa_final", label: "Licitación Etapa Final" },
  { value: "cierre_ganado", label: "Cierre Ganado" },
  { value: "cierre_perdido", label: "Cierre Perdido" },
  { value: "firma_contrato", label: "Firma de Contrato" },
  { value: "activo", label: "Activo" },
  { value: "cliente_perdido", label: "Cliente Perdido" },
  { value: "lead_inactivo", label: "Lead Inactivo" },
];

export type DealFormContentProps = {
  initialData: DealFormData;
  formDataRef: React.MutableRefObject<{ formData: DealFormData; setFormData: React.Dispatch<React.SetStateAction<DealFormData>> }>;
  theme: Theme;
  // Empresa - puede usar Autocomplete (búsqueda asíncrona) o lista completa
  companies: any[];
  companyOptions?: any[]; // Para búsqueda asíncrona
  companySearch?: string;
  setCompanySearch?: (value: string) => void;
  loadingCompanies?: boolean;
  // Contacto - puede usar Autocomplete (filtrado local) o lista completa
  contacts: any[];
  contactSearchInput?: string;
  setContactSearchInput?: (value: string) => void;
  // Para DealDetail - usa select simple
  allCompanies?: any[];
  dealContacts?: any[];
  useSimpleSelect?: boolean; // Si es true, usa TextField select en lugar de Autocomplete
  /** Si es true, el campo Empresa se muestra bloqueado (solo lectura) con la empresa ya establecida */
  companyLocked?: boolean;
};

export const DealFormContent: React.FC<DealFormContentProps> = (props) => {
  const {
    initialData,
    formDataRef,
    theme,
    companies,
    companyOptions = [],
    companySearch = '',
    setCompanySearch,
    loadingCompanies = false,
    contacts,
    contactSearchInput = '',
    setContactSearchInput,
    allCompanies = [],
    dealContacts = [],
    useSimpleSelect = false,
    companyLocked = false,
  } = props;
  
  const [formData, setFormData] = useState(initialData);
  
  useEffect(() => {
    formDataRef.current = { formData, setFormData };
  }, [formDataRef, formData]);

  // Actualizar formData cuando initialData cambia (cuando se abre un negocio diferente)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Para empresa: usar companyOptions si tiene elementos (resultados de búsqueda), 
  // de lo contrario usar companies (lista completa cargada al inicio)
  // Pero siempre buscar en ambas listas para encontrar la empresa seleccionada
  const companyList = companyOptions.length > 0 ? companyOptions : companies;
  
  // Buscar la empresa seleccionada en ambas listas (companyOptions y companies)
  // Esto asegura que la empresa vinculada aparezca cuando se abre el drawer
  let selectedCompany = null;
  if (formData.companyId) {
    // Buscar primero en companyOptions (resultados de búsqueda)
    if (companyOptions.length > 0) {
      selectedCompany = companyOptions.find((c: any) => c.id.toString() === formData.companyId) || null;
    }
    // Si no se encontró en companyOptions, buscar en companies (lista completa)
    // Esto es importante cuando se abre un negocio con empresa vinculada
    if (!selectedCompany && companies.length > 0) {
      selectedCompany = companies.find((c: any) => c.id.toString() === formData.companyId) || null;
    }
  }
  
  // Si hay una empresa seleccionada pero companyList está vacío, usar companies directamente
  // Esto asegura que la empresa aparezca incluso si companyOptions está vacío
  const finalCompanyList = selectedCompany && companyList.length === 0 && companies.length > 0 
    ? companies 
    : companyList;

  // Para contacto: usar lista completa o dealContacts si está disponible
  const contactList = dealContacts.length > 0 ? dealContacts : contacts;
  const selectedContact = contactList.find((c: any) => c.id.toString() === formData.contactId) || null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 4,
          rowGap: 1,
          alignItems: 'start',
        }}
      >
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>
          Nombre <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
        </Typography>
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 }}>
          Monto <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
        </Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            size="small"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
            placeholder="Nombre"
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            size="small"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            fullWidth
            placeholder="Monto"
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Etapa</Typography>
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Fecha de Cierre</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            select
            size="small"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            fullWidth
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
            SelectProps={{
              MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
            }}
          >
            {stageOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            size="small"
            type="date"
            value={formData.closeDate}
            onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Prioridad</Typography>
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Empresa</Typography>
        <Box sx={{ minWidth: 0 }}>
          <TextField
            select
            size="small"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'baja' | 'media' | 'alta' })}
            fullWidth
            inputProps={{ style: { fontSize: '1rem' } }}
            InputProps={{ sx: { '& input': { py: 1.05 } } }}
            SelectProps={{
              MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
            }}
          >
            <MenuItem value="baja">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: taxiMonterricoColors.green }} />
                Baja
              </Box>
            </MenuItem>
            <MenuItem value="media">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: taxiMonterricoColors.orange }} />
                Media
              </Box>
            </MenuItem>
            <MenuItem value="alta">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.error.main }} />
                Alta
              </Box>
            </MenuItem>
          </TextField>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          {companyLocked ? (
            // Empresa fija (desde detalle de empresa): solo lectura
            <TextField
              size="small"
              value={selectedCompany ? selectedCompany.name : (formData.companyId ? 'Cargando...' : '')}
              fullWidth
              disabled
              inputProps={{ style: { fontSize: '1rem' } }}
              InputProps={{ sx: { '& input': { py: 1.05 }, '&.Mui-disabled': { opacity: 1 } } }}
            />
          ) : useSimpleSelect ? (
            // Modo simple para DealDetail
            <TextField
              select
              size="small"
              value={formData.companyId || ''}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              fullWidth
              inputProps={{ style: { fontSize: '1rem' } }}
              InputProps={{ sx: { '& input': { py: 1.05 } } }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (v) => {
                  if (!v) return '';
                  const c = allCompanies.find((x: any) => x.id.toString() === v);
                  return c?.name || '';
                },
                MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
              }}
            >
              <MenuItem value="">
                <em>Ninguna</em>
              </MenuItem>
              {allCompanies.map((company: any) => (
                <MenuItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            // Modo Autocomplete para Deals.tsx
            <Autocomplete
              size="small"
              options={finalCompanyList}
              getOptionLabel={(option: any) => option.name || ''}
              value={selectedCompany}
              onChange={(event, newValue: any) => {
                setFormData({ ...formData, companyId: newValue ? newValue.id.toString() : '' });
                // Limpiar el input cuando se selecciona
                if (setCompanySearch) {
                  setCompanySearch('');
                }
              }}
              onInputChange={(event, newInputValue, reason) => {
                if (setCompanySearch) {
                  if (reason === 'reset') {
                    // Cuando se resetea (selección de opción), limpiar el input
                    setCompanySearch('');
                  } else {
                    // Cuando el usuario escribe, actualizar el input
                    setCompanySearch(newInputValue);
                  }
                }
              }}
              inputValue={companySearch || ''}
              open={companySearch.length > 0 && companySearch.trim().length > 0}
              openOnFocus={false}
              onClose={() => {
                if (setCompanySearch) {
                  setCompanySearch('');
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingCompanies}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar empresa..."
                  inputProps={{ ...params.inputProps, style: { fontSize: '1rem' } }}
                  InputProps={{ 
                    ...params.InputProps, 
                    sx: { '& input': { py: 1.05 } } 
                  }}
                />
              )}
              renderOption={(props, option: any) => (
                <Box component="li" {...props} key={option.id}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                </Box>
              )}
              fullWidth
              noOptionsText={companySearch && companySearch.trim().length > 0 ? "No se encontraron empresas" : null}
              loadingText="Buscando..."
              slotProps={{
                popper: {
                  sx: { zIndex: 1700 },
                },
              }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5, mt: 3 }}>Contacto</Typography>
        <Box />
        <Box sx={{ minWidth: 0 }}>
          {useSimpleSelect ? (
            // Modo simple para DealDetail
            <TextField
              select
              size="small"
              value={formData.contactId || ''}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              fullWidth
              inputProps={{ style: { fontSize: '1rem' } }}
              InputProps={{ sx: { '& input': { py: 1.05 } } }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (v) => {
                  if (!v) return '';
                  const c = dealContacts.find((x: any) => x.id.toString() === v);
                  return c ? `${c.firstName} ${c.lastName}` : '';
                },
                MenuProps: { sx: { zIndex: 1700 }, slotProps: { root: { sx: { zIndex: 1700 } } }, PaperProps: { sx: { zIndex: 1700 } } },
              }}
            >
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
              {dealContacts.map((contact: any) => (
                <MenuItem key={contact.id} value={contact.id.toString()}>
                  {contact.firstName} {contact.lastName}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            // Modo Autocomplete para Deals.tsx
            <Autocomplete
              size="small"
              options={contactList}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`.trim() || ''}
              value={selectedContact}
              onChange={(_, newValue) => {
                setFormData({ 
                  ...formData, 
                  contactId: newValue ? newValue.id.toString() : '' 
                });
                if (setContactSearchInput) {
                  setContactSearchInput('');
                }
              }}
              onInputChange={(_, newInputValue, reason) => {
                if (setContactSearchInput) {
                  if (reason === 'reset') {
                    setContactSearchInput('');
                  } else {
                    setContactSearchInput(newInputValue);
                  }
                }
              }}
              inputValue={contactSearchInput}
              open={contactSearchInput.length > 0 && contactSearchInput.trim().length > 0}
              openOnFocus={false}
              onClose={() => {
                if (setContactSearchInput) {
                  setContactSearchInput('');
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue || inputValue.trim().length === 0) return [];
                const searchTerm = inputValue.toLowerCase().trim();
                const filtered = options.filter((option) =>
                  `${option.firstName} ${option.lastName}`.toLowerCase().includes(searchTerm)
                );
                return filtered;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar contacto..."
                  inputProps={{ ...params.inputProps, style: { fontSize: '1rem' } }}
                  InputProps={{ 
                    ...params.InputProps,
                    sx: { 
                      '& input': { py: 1.05 },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? '#3B3E48' : undefined,
                        borderWidth: '1px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? '#3B3E48' : undefined,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? '#3B3E48' : undefined,
                        borderWidth: '1px',
                      },
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.firstName} {option.lastName}
                    </Typography>
                    {option.email && (
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              ListboxProps={{
                sx: { maxHeight: 300 },
              }}
              slotProps={{
                popper: {
                  sx: { zIndex: 1700 },
                },
              }}
              fullWidth
              noOptionsText={contactSearchInput.trim().length > 0 ? "No se encontraron contactos" : null}
            />
          )}
        </Box>
        <Box />
      </Box>
    </Box>
  );
};
