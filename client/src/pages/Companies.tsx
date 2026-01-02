import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Divider,
  Avatar,
  FormControl,
  Select,
  Tooltip,
  InputAdornment,
  Menu,
  useTheme,
  Collapse,
  Pagination,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Add, Delete, Search, Visibility, UploadFile, FileDownload, Warning, CheckCircle, FilterList, Close, ExpandMore, Remove, Bolt, Edit, Business } from '@mui/icons-material';
import api from '../config/api';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import empresaLogo from '../assets/empresa.png';

interface Company {
  id: number;
  name: string;
  domain?: string;
  companyname?: string;
  phone?: string;
  email?: string;
  leadSource?: string;
  ruc?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lifecycleStage: string;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: number;
  Owner?: { firstName: string; lastName: string };
}

const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    linkedin: '',
    companyname: '',
    phone: '',
    phone2: '',
    phone3: '',
    email: '',
    leadSource: '',
    lifecycleStage: 'lead',
    ruc: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [loadingRuc, setLoadingRuc] = useState(false);
  const [rucError, setRucError] = useState('');
  const [nameError, setNameError] = useState('');
  const [rucValidationError, setRucValidationError] = useState('');
  const [, setRucInfo] = useState<any>(null);
  const [rucDebts, setRucDebts] = useState<any>(null);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{ [key: number]: HTMLElement | null }>({});
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importProgressOpen, setImportProgressOpen] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    errors: 0,
  });
  const nameValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const rucValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedOwnerFilters, setSelectedOwnerFilters] = useState<(string | number)[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stagesExpanded, setStagesExpanded] = useState(false);
  const [ownerFilterExpanded, setOwnerFilterExpanded] = useState(false);
  const [countryFilterExpanded, setCountryFilterExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Función para obtener iniciales
  const getInitials = (name: string) => {
    if (!name) return '--';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  // Función para obtener iniciales de nombre y apellido separados
  const getInitialsFromNames = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first && last ? `${first}${last}` : first || last || '--';
  };

  // Función para obtener el label del origen de lead
  const getLeadSourceLabel = (source?: string) => {
    const labels: { [key: string]: string } = {
      'referido': 'Referido',
      'base': 'Base',
      'entorno': 'Entorno',
      'feria': 'Feria',
      'masivo': 'Masivo',
    };
    return source && labels[source] ? labels[source] : (source || '--');
  };

  // Función auxiliar para normalizar el origen de lead en la importación
  const normalizeLeadSource = (source: string): string | undefined => {
    if (!source || source.trim() === '') return undefined;
    
    const normalized = source.trim().toLowerCase();
    const mapping: { [key: string]: string } = {
      'referido': 'referido',
      'base': 'base',
      'entorno': 'entorno',
      'feria': 'feria',
      'masivo': 'masivo',
    };
    
    return mapping[normalized] || normalized;
  };

  // Validar nombre en tiempo real con debounce
  const validateCompanyName = async (name: string) => {
    // Limpiar timeout anterior
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }

    // Si el campo está vacío, limpiar error
    if (!name || name.trim() === '') {
      setNameError('');
      return;
    }

    // Si estamos editando, no validar contra la misma empresa
    if (editingCompany && editingCompany.name.toLowerCase() === name.trim().toLowerCase()) {
      setNameError('');
      return;
    }

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    nameValidationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/companies', {
          params: { search: name.trim(), limit: 50 },
        });
        
        const companies = response.data.companies || response.data || [];
        const exactMatch = companies.find((c: Company) => 
          c.name.toLowerCase().trim() === name.toLowerCase().trim()
        );

        if (exactMatch) {
          setNameError('Ya existe una empresa con este nombre');
        } else {
          setNameError('');
        }
      } catch (error) {
        // Si hay error en la validación, no mostrar error al usuario
        setNameError('');
      }
    }, 500);
  };

  // Validar RUC en tiempo real con debounce
  const validateCompanyRuc = async (ruc: string) => {
    // Limpiar timeout anterior
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }

    // Si el campo está vacío o tiene menos de 11 dígitos, limpiar error
    if (!ruc || ruc.trim() === '' || ruc.length < 11) {
      setRucValidationError('');
      return;
    }

    // Si estamos editando, no validar contra la misma empresa
    if (editingCompany && editingCompany.ruc === ruc.trim()) {
      setRucValidationError('');
      return;
    }

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    rucValidationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get('/companies', {
          params: { search: ruc.trim(), limit: 50 },
        });
        
        const companies = response.data.companies || response.data || [];
        const exactMatch = companies.find((c: Company) => c.ruc === ruc.trim());

        if (exactMatch) {
          setRucValidationError('Ya existe una empresa con este RUC');
        } else {
          setRucValidationError('');
        }
      } catch (error) {
        // Si hay error en la validación, no mostrar error al usuario
        setRucValidationError('');
      }
    }, 500);
  };

  // Función para validar ambos campos en paralelo
  const validateAllFields = async (name: string, ruc: string) => {
    // Limpiar timeouts anteriores
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }

    // Si el RUC tiene 11 dígitos, validar inmediatamente sin debounce
    if (ruc && ruc.trim().length === 11) {
      // Ejecutar validación del RUC inmediatamente (sin debounce)
      if (rucValidationTimeoutRef.current) {
        clearTimeout(rucValidationTimeoutRef.current);
      }
      
      // Validar RUC inmediatamente
      if (!editingCompany || editingCompany.ruc !== ruc.trim()) {
        try {
          const response = await api.get('/companies', {
            params: { search: ruc.trim(), limit: 50 },
          });
          
          const companies = response.data.companies || response.data || [];
          const exactMatch = companies.find((c: Company) => c.ruc === ruc.trim());

          if (exactMatch) {
            setRucValidationError('Ya existe una empresa con este RUC');
          } else {
            setRucValidationError('');
          }
        } catch (error) {
          setRucValidationError('');
        }
      } else {
        setRucValidationError('');
      }
      
      // Validar nombre con debounce solo si tiene contenido
      if (name && name.trim() !== '') {
        validateCompanyName(name);
      } else {
        setNameError('');
      }
    } else {
      // Si el RUC no tiene 11 dígitos, usar las funciones de validación con debounce
      validateCompanyName(name);
      validateCompanyRuc(ruc);
    }
  };

  // Función para vista previa
  const handlePreview = (company: Company) => {
    navigate(`/companies/${company.id}`);
  };

  const fetchCompanies = useCallback(async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/companies', { params });
      setCompanies(response.data.companies || response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error: any) {
      // Si es un error 403, el usuario no tiene permisos para ver usuarios (no es admin)
      // Esto es normal y no debería mostrar un error
      if (error.response?.status === 403) {
        console.log('Usuario no tiene permisos para ver usuarios (no es admin)');
        setUsers([]);
      } else {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, [fetchCompanies, fetchUsers]);

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      if (nameValidationTimeoutRef.current) {
        clearTimeout(nameValidationTimeoutRef.current);
      }
      if (rucValidationTimeoutRef.current) {
        clearTimeout(rucValidationTimeoutRef.current);
      }
    };
  }, []);

  const handleExportToExcel = () => {
    // Preparar los datos para exportar
    const exportData = companies.map((company) => ({
      'Nombre': company.name || '--',
      'Dominio': company.domain || '--',
      'Razón social': company.companyname || '--',
      'Teléfono': company.phone || '--',
      'Correo': (company as any).email || '--',
      'Origen de lead': getLeadSourceLabel((company as any).leadSource),
      'RUC': company.ruc || '--',
      'Propietario': company.Owner ? `${company.Owner.firstName} ${company.Owner.lastName}` : 'Sin asignar',
      'Dirección': company.address || '--',
      'Ciudad': company.city || '--',
      'Estado/Provincia': company.state || '--',
      'País': company.country || '--',
      'Etapa': company.lifecycleStage || '--',
      'Estado': company.lifecycleStage === 'cierre_ganado' ? 'Activo' : 'Inactivo',
      'Fecha de Creación': (company as any).createdAt ? new Date((company as any).createdAt).toLocaleDateString('es-ES') : '--',
    }));

    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 25 }, // Dominio
      { wch: 20 }, // Razón social
      { wch: 15 }, // Teléfono
      { wch: 25 }, // Correo
      { wch: 20 }, // Origen de lead
      { wch: 15 }, // RUC
      { wch: 20 }, // Propietario
      { wch: 30 }, // Dirección
      { wch: 15 }, // Ciudad
      { wch: 18 }, // Estado/Provincia
      { wch: 15 }, // País
      { wch: 15 }, // Etapa
      { wch: 12 }, // Estado
      { wch: 18 }, // Fecha de Creación
    ];
    ws['!cols'] = colWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');

    // Generar el nombre del archivo con la fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Empresas_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  const handleImportFromExcel = () => {
    fileInputRef.current?.click();
  };

  // Función auxiliar para buscar usuario por nombre completo (más flexible)
  const findUserByName = (fullName: string): number | null => {
    if (!fullName || fullName.trim() === '' || fullName.toLowerCase() === 'sin asignar') {
      return null;
    }
    
    // Normalizar: eliminar espacios extra y convertir a minúsculas
    const normalizedInput = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
    const nameParts = normalizedInput.split(' ');
    
    if (nameParts.length < 2) {
      return null;
    }
    
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    // Primero intentar coincidencia exacta (case-insensitive)
    let foundUser = users.find(
      (user) =>
        user.firstName?.toLowerCase().trim() === firstName &&
        user.lastName?.toLowerCase().trim() === lastName
    );
    
    // Si no encuentra coincidencia exacta, buscar coincidencia parcial
    // Esto maneja casos como "Jack Valdivia Faustino" vs "Jack Valdivia"
    if (!foundUser) {
      foundUser = users.find((user) => {
        const userFirstName = user.firstName?.toLowerCase().trim() || '';
        const userLastName = user.lastName?.toLowerCase().trim() || '';
        
        // Coincidencia exacta del nombre
        if (userFirstName !== firstName) {
          return false;
        }
        
        // El lastName del usuario debe empezar con el lastName del input
        // O el lastName del input debe empezar con el lastName del usuario
        return userLastName.startsWith(lastName) || lastName.startsWith(userLastName);
      });
    }
    
    return foundUser ? foundUser.id : null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgressOpen(true);
    setImportProgress({ current: 0, total: 0, success: 0, errors: 0 });
    
    try {
      // Asegurar que los usuarios estén cargados antes de procesar
      if (users.length === 0) {
        await fetchUsers();
      }

      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      // Procesar cada fila y crear empresas
      const companiesToCreate = jsonData.map((row) => {
        const propietarioName = (row['Propietario'] || '').toString().trim();
        const ownerId = propietarioName ? findUserByName(propietarioName) : null;

        return {
          name: (row['Nombre'] || '').toString().trim() || 'Sin nombre',
          domain: (row['Dominio'] || '').toString().trim() || undefined,
          companyname: (row['Razón social'] || '').toString().trim() || undefined,
          phone: (row['Teléfono'] || '').toString().trim() || undefined,
          email: (row['Correo'] || '').toString().trim() || undefined,
          leadSource: normalizeLeadSource((row['Origen de lead'] || '').toString()),
          ruc: (row['RUC'] || '').toString().trim() || undefined,
          address: (row['Dirección'] || '').toString().trim() || undefined,
          city: (row['Ciudad'] || '').toString().trim() || undefined,
          state: (row['Estado/Provincia'] || '').toString().trim() || undefined,
          country: (row['País'] || '').toString().trim() || undefined,
          lifecycleStage: (row['Etapa'] || 'lead').toString().trim() || 'lead',
          ownerId: ownerId || undefined,
        };
      }).filter(company => company.name !== 'Sin nombre'); // Filtrar filas vacías

      // Inicializar el progreso total
      setImportProgress(prev => ({ ...prev, total: companiesToCreate.length }));

      // Crear empresas en el backend con progreso
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < companiesToCreate.length; i++) {
        const companyData = companiesToCreate[i];
        try {
          await api.post('/companies', companyData);
          successCount++;
          setImportProgress({
            current: i + 1,
            total: companiesToCreate.length,
            success: successCount,
            errors: errorCount,
          });
        } catch (error) {
          console.error('Error creating company:', error);
          errorCount++;
          setImportProgress({
            current: i + 1,
            total: companiesToCreate.length,
            success: successCount,
            errors: errorCount,
          });
        }
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Recargar la lista de empresas
      fetchCompanies();
    } catch (error) {
      console.error('Error importing file:', error);
      setImportProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
    } finally {
      setImporting(false);
    }
  };

  const handleOpen = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        domain: company.domain || '',
        linkedin: (company as any).linkedin || '',
        companyname: company.companyname || '',
        phone: company.phone || '',
        phone2: (company as any).phone2 || '',
        phone3: (company as any).phone3 || '',
        email: (company as any).email || '',
        leadSource: (company as any).leadSource || '',
        lifecycleStage: company.lifecycleStage,
        ruc: company.ruc || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        domain: '',
        linkedin: '',
        companyname: '',
        phone: '',
        phone2: '',
        phone3: '',
        email: '',
        leadSource: '',
        lifecycleStage: 'lead',
        ruc: '',
        address: '',
        city: '',
        state: '',
        country: '',
      });
    }
    setRucError('');
    setRucInfo(null);
    setRucDebts(null);
    setOpen(true);
  };

  const handleSearchRuc = async () => {
    if (!formData.ruc || formData.ruc.length < 11) {
      setRucError('El RUC debe tener 11 dígitos');
      return;
    }

    setLoadingRuc(true);
    setRucError('');

    try {
      // Obtener el token de la API de Factiliza desde variables de entorno
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setRucError('Token de API no configurado. Por favor, configure REACT_APP_FACTILIZA_TOKEN');
        setLoadingRuc(false);
        return;
      }

      const response = await axios.get(
        `https://api.factiliza.com/v1/ruc/info/${formData.ruc}`,
        {
          headers: {
            'Authorization': `Bearer ${factilizaToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Guardar el RUC actual antes de actualizar el formulario
        const currentRuc = formData.ruc;
        const newName = data.nombre_o_razon_social || '';
        
        // Guardar toda la información para mostrarla en el panel lateral
        setRucInfo(data);
        
        // Actualizar el formulario con los datos obtenidos
        const updatedFormData = {
          ...formData,
          name: newName,
          companyname: data.tipo_contribuyente || '',
          address: data.direccion_completa || data.direccion || '',
          city: data.distrito || '',
          state: data.provincia || '',
          country: data.departamento || 'Perú',
        };
        setFormData(updatedFormData);

        // Consultar deudas automáticamente después de obtener la información del RUC
        await handleSearchDebts(currentRuc);

        // Validar ambos campos inmediatamente después de autocompletar
        // Limpiar timeouts anteriores para evitar conflictos
        if (nameValidationTimeoutRef.current) {
          clearTimeout(nameValidationTimeoutRef.current);
        }
        if (rucValidationTimeoutRef.current) {
          clearTimeout(rucValidationTimeoutRef.current);
        }
        
        // Ejecutar validaciones inmediatamente sin debounce cuando se autocompleta
        const validateNameImmediate = async () => {
          if (!newName || newName.trim() === '') {
            setNameError('');
            return;
          }

          if (editingCompany && editingCompany.name.toLowerCase() === newName.trim().toLowerCase()) {
            setNameError('');
            return;
          }

          try {
            const response = await api.get('/companies', {
              params: { search: newName.trim(), limit: 50 },
            });
            
            const companies = response.data.companies || response.data || [];
            const exactMatch = companies.find((c: Company) => 
              c.name.toLowerCase().trim() === newName.toLowerCase().trim()
            );

            if (exactMatch) {
              setNameError('Ya existe una empresa con este nombre');
            } else {
              setNameError('');
            }
          } catch (error) {
            setNameError('');
          }
        };

        const validateRucImmediate = async () => {
          if (!currentRuc || currentRuc.trim() === '' || currentRuc.length < 11) {
            setRucValidationError('');
            return;
          }

          if (editingCompany && editingCompany.ruc === currentRuc.trim()) {
            setRucValidationError('');
            return;
          }

          try {
            const response = await api.get('/companies', {
              params: { search: currentRuc.trim(), limit: 50 },
            });
            
            const companies = response.data.companies || response.data || [];
            const exactMatch = companies.find((c: Company) => c.ruc === currentRuc.trim());

            if (exactMatch) {
              setRucValidationError('Ya existe una empresa con este RUC');
            } else {
              setRucValidationError('');
            }
          } catch (error) {
            setRucValidationError('');
          }
        };

        // Ejecutar ambas validaciones inmediatamente en paralelo
        await Promise.all([validateNameImmediate(), validateRucImmediate()]);
      } else {
        setRucError('No se encontró información para este RUC');
        setRucInfo(null);
        setRucDebts(null);
      }
    } catch (error: any) {
      console.error('Error al buscar RUC:', error);
      setRucInfo(null);
      setRucDebts(null);
      if (error.response?.status === 400) {
        setRucError('RUC no válido o no encontrado');
      } else if (error.response?.status === 401) {
        setRucError('Error de autenticación con la API');
      } else {
        setRucError('Error al consultar el RUC. Por favor, intente nuevamente');
      }
    } finally {
      setLoadingRuc(false);
    }
  };

  const handleSearchDebts = async (ruc: string) => {
    if (!ruc || ruc.length < 11) return;

    setLoadingDebts(true);
    setRucDebts(null);

    try {
      const factilizaToken = process.env.REACT_APP_FACTILIZA_TOKEN || '';
      
      if (!factilizaToken) {
        setLoadingDebts(false);
        return;
      }

      // Intentar con diferentes endpoints posibles de Factiliza
      // Nota: Verifica la documentación oficial de Factiliza para el endpoint correcto
      // Documentación: https://docs.factiliza.com
      const endpoints = [
        `https://api.factiliza.com/v1/deudas/${ruc}`, // Endpoint según documentación
        `https://api.factiliza.com/v1/ruc/${ruc}/deudas`, // Formato alternativo
        `https://api.factiliza.com/v1/sunat/ruc/${ruc}/deudas`, // Formato con sunat
        `https://api.factiliza.com/v1/ruc/deudas/${ruc}`,
        `https://api.factiliza.com/v1/ruc/deuda/${ruc}`,
        `https://api.factiliza.com/v1/sunat/deudas/${ruc}`,
        `https://api.factiliza.com/v1/consulta/deudas/${ruc}`, // Formato alternativo
      ];

      let debtsFound = false;

      console.log('🔍 Consultando deudas en Factiliza para RUC:', ruc);
      console.log('📋 Endpoints a probar:', endpoints);

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Probando endpoint: ${endpoint}`);
          const debtsResponse = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${factilizaToken}`,
            },
            timeout: 5000,
          });

          console.log(`✅ Respuesta exitosa de ${endpoint}:`, debtsResponse.data);

          if (debtsResponse.data && (debtsResponse.data.success || debtsResponse.data.data)) {
            const debtsData = debtsResponse.data.data || debtsResponse.data;
            
            console.log('📊 Datos de deudas recibidos:', debtsData);
            
            // Normalizar los datos a un formato común
            const normalizedDebts = {
              tiene_deudas: debtsData.tiene_deudas !== undefined 
                ? debtsData.tiene_deudas 
                : (debtsData.deudas && debtsData.deudas.length > 0) 
                  ? true 
                  : false,
              total_deuda: debtsData.total_deuda || debtsData.total || debtsData.monto_total || null,
              deudas: debtsData.deudas || debtsData.deuda || debtsData.detalle || [],
            };

            console.log('✅ Deudas normalizadas:', normalizedDebts);
            setRucDebts(normalizedDebts);
            debtsFound = true;
            break;
          } else {
            console.log(`⚠️ Respuesta sin datos válidos de ${endpoint}`);
          }
        } catch (endpointError: any) {
          // Mostrar errores detallados
          const errorStatus = endpointError.response?.status;
          const errorData = endpointError.response?.data;
          
          console.error(`❌ Error en endpoint ${endpoint}:`, {
            status: errorStatus,
            statusText: endpointError.response?.statusText,
            message: endpointError.message,
            data: errorData,
          });
          
          // Si es 401, el token puede ser inválido o el endpoint requiere autenticación diferente
          if (errorStatus === 401) {
            console.warn(`🔐 Error de autenticación (401) en ${endpoint}`);
            console.warn('💡 Verifica que tu token sea válido y tenga permisos para consultar deudas');
          }
          
          // Si es 403, el plan puede no incluir este servicio
          if (errorStatus === 403) {
            console.warn(`🚫 Acceso denegado (403) en ${endpoint}`);
            console.warn('💡 Tu plan de Factiliza puede no incluir el servicio de consulta de deudas');
            console.warn('💡 Contacta a soporte de Factiliza para verificar qué servicios incluye tu plan');
          }
          
          // Si es 404, el endpoint no existe
          if (errorStatus === 404) {
            console.log(`📍 Endpoint no encontrado (404): ${endpoint}`);
          }
          
          // Continuar con el siguiente endpoint si este falla
          if (errorStatus !== 404 && errorStatus !== 400) {
            console.log(`⚠️ Error no crítico en ${endpoint}, probando siguiente...`);
          }
        }
      }

      // Si no se encontró información en Factiliza
      if (!debtsFound) {
        console.log('⚠️ No se encontró información de deudas en Factiliza');
      } else {
        console.log('✅ Deudas obtenidas exitosamente de Factiliza');
      }
    } catch (error: any) {
      console.error('Error al buscar deudas:', error);
    } finally {
      setLoadingDebts(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompany(null);
    setRucInfo(null);
    setRucDebts(null);
    setRucError('');
    setNameError('');
    setRucValidationError('');
    setErrorMessage(null);
    
    // Limpiar timeouts pendientes
    if (nameValidationTimeoutRef.current) {
      clearTimeout(nameValidationTimeoutRef.current);
    }
    if (rucValidationTimeoutRef.current) {
      clearTimeout(rucValidationTimeoutRef.current);
    }
  };

  const handleSubmit = async () => {
    // Validar antes de enviar
    if (nameError) {
      setErrorMessage('Por favor, corrige el error en el nombre antes de guardar.');
      return;
    }

    if (rucValidationError) {
      setErrorMessage('Por favor, corrige el error en el RUC antes de guardar.');
      return;
    }

    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, formData);
      } else {
        await api.post('/companies', formData);
      }
      handleClose();
      fetchCompanies();
    } catch (error: any) {
      console.error('Error saving company:', error);
      
      // Manejar error de empresa duplicada del servidor
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        const duplicateField = error.response.data.duplicateField;
        
        if (duplicateField === 'name') {
          setNameError(errorMessage);
          // El error ya se muestra en el campo, no necesitamos Snackbar adicional
        } else if (duplicateField === 'ruc') {
          setRucValidationError(errorMessage);
          // El error ya se muestra en el campo, no necesitamos Snackbar adicional
        } else {
          setErrorMessage(errorMessage);
        }
      } else {
        setErrorMessage('Error al guardar la empresa. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleDelete = (id: number) => {
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    
    setDeleting(true);
    try {
      await api.delete(`/companies/${companyToDelete}`);
      fetchCompanies();
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar la empresa. Por favor, intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setStatusMenuAnchor({ ...statusMenuAnchor, [companyId]: event.currentTarget });
  };

  const handleStatusMenuClose = (companyId: number) => {
    setStatusMenuAnchor({ ...statusMenuAnchor, [companyId]: null });
  };

  const handleStatusChange = async (event: React.MouseEvent<HTMLElement>, companyId: number, newStage: string) => {
    event.stopPropagation();
    event.preventDefault();
    setUpdatingStatus({ ...updatingStatus, [companyId]: true });
    try {
      await api.put(`/companies/${companyId}`, { lifecycleStage: newStage });
      // Actualizar la empresa en la lista
      setCompanies(companies.map(company => 
        company.id === companyId 
          ? { ...company, lifecycleStage: newStage }
          : company
      ));
      handleStatusMenuClose(companyId);
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('Error al actualizar la etapa. Por favor, intenta nuevamente.');
    } finally {
      setUpdatingStatus({ ...updatingStatus, [companyId]: false });
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'lead': 'error', // Rojo para 0%
      'contacto': 'warning', // Naranja para 10%
      'reunion_agendada': 'warning', // Naranja para 30%
      'reunion_efectiva': 'warning', // Amarillo para 40%
      'propuesta_economica': 'info', // Verde claro para 50%
      'negociacion': 'success', // Verde para 70%
      'licitacion': 'success', // Verde para 75%
      'licitacion_etapa_final': 'success', // Verde oscuro para 85%
      'cierre_ganado': 'success', // Verde oscuro para 90%
      'cierre_perdido': 'error', // Rojo para -1%
      'firma_contrato': 'success', // Verde oscuro para 95%
      'activo': 'success', // Verde más oscuro para 100%
      'cliente_perdido': 'error', // Rojo para -1%
      'lead_inactivo': 'error', // Rojo para -5%
    };
    return colors[stage] || 'default';
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': '0% Lead',
      'contacto': '10% Contacto',
      'reunion_agendada': '30% Reunión Agendada',
      'reunion_efectiva': '40% Reunión Efectiva',
      'propuesta_economica': '50% Propuesta Económica',
      'negociacion': '70% Negociación',
      'licitacion': '75% Licitación',
      'licitacion_etapa_final': '85% Licitación Etapa Final',
      'cierre_ganado': '90% Cierre Ganado',
      'cierre_perdido': '-1% Cierre Perdido',
      'firma_contrato': '95% Firma de Contrato',
      'activo': '100% Activo',
      'cliente_perdido': '-1% Cliente perdido',
      'lead_inactivo': '-5% Lead Inactivo',
    };
    return labels[stage] || stage;
  };

  const getStageLabelWithoutPercentage = (stage: string) => {
    return getStageLabel(stage).replace(/\s*\d+%/, '').trim();
  };

  const stageOptions = [
    { value: 'lead_inactivo', label: '-5% Lead Inactivo' },
    { value: 'cliente_perdido', label: '-1% Cliente perdido' },
    { value: 'cierre_perdido', label: '-1% Cierre Perdido' },
    { value: 'lead', label: '0% Lead' },
    { value: 'contacto', label: '10% Contacto' },
    { value: 'reunion_agendada', label: '30% Reunión Agendada' },
    { value: 'reunion_efectiva', label: '40% Reunión Efectiva' },
    { value: 'propuesta_economica', label: '50% Propuesta Económica' },
    { value: 'negociacion', label: '70% Negociación' },
    { value: 'licitacion', label: '75% Licitación' },
    { value: 'licitacion_etapa_final', label: '85% Licitación Etapa Final' },
    { value: 'cierre_ganado', label: '90% Cierre Ganado' },
    { value: 'firma_contrato', label: '95% Firma de Contrato' },
    { value: 'activo', label: '100% Activo' },
  ];

  // Orden de las etapas según porcentaje
  const stageOrder = [
    'lead_inactivo', // -5%
    'cliente_perdido', // -1%
    'cierre_perdido', // -1%
    'lead', // 0%
    'contacto', // 10%
    'reunion_agendada', // 30%
    'reunion_efectiva', // 40%
    'propuesta_economica', // 50%
    'negociacion', // 70%
    'licitacion', // 75%
    'licitacion_etapa_final', // 85%
    'cierre_ganado', // 90%
    'firma_contrato', // 95%
    'activo', // 100%
  ];

  // Filtrar y ordenar empresas
  const filteredCompanies = companies
    .filter((company) => {
      // Filtro por etapas
      if (selectedStages.length > 0) {
        if (!selectedStages.includes(company.lifecycleStage || 'lead')) {
          return false;
        }
      }
      
      // Filtro por países
      if (selectedCountries.length > 0) {
        if (!company.country || !selectedCountries.includes(company.country)) {
          return false;
        }
      }
      
      // Filtro por propietarios
      if (selectedOwnerFilters.length > 0) {
        let matches = false;
        for (const filter of selectedOwnerFilters) {
          if (filter === 'me') {
            if (company.ownerId === user?.id) {
              matches = true;
              break;
            }
          } else if (filter === 'unassigned') {
            if (!company.ownerId) {
              matches = true;
              break;
            }
          } else {
            if (company.ownerId === filter) {
              matches = true;
              break;
            }
          }
        }
        if (!matches) return false;
      }
      
      // Filtro por búsqueda
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        company.name.toLowerCase().includes(searchLower) ||
        company.companyname?.toLowerCase().includes(searchLower) ||
        company.phone?.toLowerCase().includes(searchLower) ||
        company.domain?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  // Calcular paginación
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  // Resetear a la página 1 cuando cambien los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedStages, selectedCountries, selectedOwnerFilters, search, sortBy]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Header principal - fuera del contenedor */}
      <Box sx={{ pt: 0, pb: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={pageStyles.pageTitle}>
                Empresas
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select
                  id="companies-sort-select"
                  name="companies-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: theme.palette.background.paper,
                    fontSize: '0.8125rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.text.secondary,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                    },
                  }}
                >
                  <MenuItem value="newest">Ordenar por: Más recientes</MenuItem>
                  <MenuItem value="oldest">Ordenar por: Más antiguos</MenuItem>
                  <MenuItem value="name">Ordenar por: Nombre A-Z</MenuItem>
                  <MenuItem value="nameDesc">Ordenar por: Nombre Z-A</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={importing ? 'Importando...' : 'Importar'}>
                <IconButton
                size="small"
                  onClick={handleImportFromExcel}
                  disabled={importing}
                  sx={pageStyles.outlinedIconButton}
                >
                <UploadFile sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" style={{ display: 'none' }} />
              <Tooltip title="Exportar">
                <IconButton
                size="small"
                  onClick={handleExportToExcel}
                  sx={pageStyles.outlinedIconButton}
                >
                <FileDownload sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filtros">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    if (!filterDrawerOpen) {
                      // Al abrir el drawer, asegurar que todas las secciones estén colapsadas
                      setStagesExpanded(false);
                      setOwnerFilterExpanded(false);
                      setCountryFilterExpanded(false);
                    }
                    setFilterDrawerOpen(!filterDrawerOpen);
                  }}
                  sx={pageStyles.filterButton}
              >
                Filter
              </Button>
              </Tooltip>
              <Tooltip title="Nueva Empresa">
                <IconButton
                  size="small"
                  onClick={() => handleOpen()}
                  sx={{
                    bgcolor: taxiMonterricoColors.green,
                    color: 'white',
                    '&:hover': {
                      bgcolor: taxiMonterricoColors.greenDark,
                    },
                    borderRadius: 1.5,
                    p: 0.875,
                    boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
                  }}
                >
                  <Add sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

      {/* Contenedor principal con layout flex para tabla y panel de filtros */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Contenido principal (tabla completa con header y filas) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header de la tabla */}
          <Box
            component="div"
          sx={{ 
              bgcolor: theme.palette.background.paper,
              borderRadius: '8px 8px 0 0',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(9, minmax(0, 1fr))', md: '1.5fr 1fr 1fr 1fr 0.9fr 1fr 1fr 1.2fr 0.7fr' },
              columnGap: { xs: 1, md: 1.5 },
              minWidth: { xs: 800, md: 'auto' },
            maxWidth: '100%',
              width: '100%',
              px: { xs: 1, md: 1.5 },
              py: { xs: 1.5, md: 2 },
              mb: 2,
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={pageStyles.tableHeaderCell}>
                  Nombre de Empresa
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Última Actividad
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Propietario
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Razón Social
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Teléfono
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Correo
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Origen de lead
            </Box>
            <Box sx={pageStyles.tableHeaderCell}>
                  Etapa
            </Box>
            <Box sx={{ 
              ...pageStyles.tableHeaderCell, 
              px: { xs: 0.75, md: 1 },
              justifyContent: 'flex-start'
            }}>
                  Acciones
            </Box>
          </Box>

          {/* Filas de empresas */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedCompanies.map((company) => (
            <Box
                  key={company.id}
              component="div"
              onClick={() => navigate(`/companies/${company.id}`)}
                  sx={{ 
                bgcolor: theme.palette.background.paper,
                    cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(9, minmax(0, 1fr))', md: '1.5fr 1fr 1fr 1fr 0.9fr 1fr 1fr 1.2fr 0.7fr' },
                columnGap: { xs: 1, md: 1.5 },
                minWidth: { xs: 800, md: 'auto' },
                maxWidth: '100%',
                width: '100%',
                borderRadius: 0,
                border: 'none',
                boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                px: { xs: 1, md: 1.5 },
                py: { xs: 1, md: 1.25 },
                '&:hover': {
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.palette.mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
                <Box sx={{ py: { xs: 1, md: 1.25 }, px: { xs: 0.75, md: 1 }, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, width: '100%' }}>
                      <Avatar
                        src={empresaLogo}
                        sx={{
                          width: { xs: 32, md: 40 },
                          height: { xs: 32, md: 40 },
                          bgcolor: empresaLogo ? 'transparent' : taxiMonterricoColors.green,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          fontWeight: 600,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          flexShrink: 0,
                        }}
                      >
                        {!empresaLogo && getInitials(company.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.6875rem', md: '0.75rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: 0.25,
                          maxWidth: { xs: '150px', md: '200px' },
                        }}
                        title={company.name}
                      >
                        {company.name}
                      </Typography>
                        {company.domain && company.domain !== '--' ? (
                          <Typography 
                            variant="caption" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (company.domain && company.domain !== '--') {
                                const domainUrl = company.domain.startsWith('http') ? company.domain : `https://${company.domain}`;
                                window.open(domainUrl, '_blank');
                              }
                            }}
                            sx={{ 
                              color: theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
                            fontSize: { xs: '0.5625rem', md: '0.625rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            display: 'block',
                            cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {company.domain}
                          </Typography>
                        ) : (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                            fontSize: { xs: '0.5625rem', md: '0.625rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            --
                          </Typography>
                        )}
                      </Box>
                    </Box>
                </Box>
                {/* Nueva columna: Fecha de última actividad */}
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.625rem', md: '0.6875rem' },
                      fontWeight: 400,
                    }}
                  >
                    {company.updatedAt 
                      ? new Date(company.updatedAt).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      : '--'}
                  </Typography>
                </Box>
                {/* Nueva columna: Propietario */}
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  {company.Owner ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Avatar
                        sx={{
                          width: { xs: 20, md: 24 },
                          height: { xs: 20, md: 24 },
                          fontSize: { xs: '0.5625rem', md: '0.625rem' },
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {getInitialsFromNames(company.Owner.firstName || '', company.Owner.lastName || '')}
                      </Avatar>
                      <Typography
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: { xs: '0.625rem', md: '0.6875rem' },
                          fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: { xs: '80px', md: '120px' },
                        }}
                        title={`${company.Owner.firstName} ${company.Owner.lastName}`}
                      >
                        {company.Owner.firstName} {company.Owner.lastName}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.disabled,
                        fontSize: { xs: '0.625rem', md: '0.6875rem' },
                        fontWeight: 400,
                      }}
                    >
                      Sin asignar
                    </Typography>
                  )}
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                    {company.companyname ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                        fontSize: { xs: '0.625rem', md: '0.6875rem' },
                        fontWeight: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        }}
                      >
                        {company.companyname}
                      </Typography>
                    ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: { xs: '0.625rem', md: '0.6875rem' }, fontWeight: 400 }}>
                        --
                      </Typography>
                    )}
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.text.primary,
                      fontSize: { xs: '0.625rem', md: '0.6875rem' },
                      fontWeight: 400,
                        }}
                      >
                    {company.phone || '--'}
                      </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.625rem', md: '0.6875rem' },
                      fontWeight: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: '120px', md: '150px' },
                    }}
                    title={(company as any).email || '--'}
                  >
                    {(company as any).email || '--'}
                  </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.625rem', md: '0.6875rem' },
                      fontWeight: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: '120px', md: '150px' },
                    }}
                    title={getLeadSourceLabel((company as any).leadSource)}
                  >
                    {getLeadSourceLabel((company as any).leadSource)}
                  </Typography>
                </Box>
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                    <Chip
                    label={getStageLabel(company.lifecycleStage || 'lead')}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStatusMenuOpen(e, company.id);
                      }}
                      disabled={updatingStatus[company.id]}
                    color={getStageColor(company.lifecycleStage || 'lead')}
                      sx={{ 
                        fontWeight: 500,
                      fontSize: { xs: '0.5625rem', md: '0.625rem' },
                      height: { xs: 16, md: 18 },
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                    <Menu
                      anchorEl={statusMenuAnchor[company.id]}
                      open={Boolean(statusMenuAnchor[company.id])}
                      onClose={(e, reason) => {
                        if (e && 'stopPropagation' in e) {
                          (e as React.MouseEvent).stopPropagation();
                        }
                        handleStatusMenuClose(company.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      PaperProps={{
                        sx: {
                        minWidth: 220,
                        maxHeight: 400,
                          mt: 0.5,
                          borderRadius: 1.5,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        overflow: 'auto',
                        }
                      }}
                    >
                    {stageOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        onClick={(e) => handleStatusChange(e, company.id, option.value)}
                        disabled={updatingStatus[company.id] || company.lifecycleStage === option.value}
                        selected={company.lifecycleStage === option.value}
                        sx={{
                          fontSize: '0.875rem',
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                          '&.Mui-selected': {
                            bgcolor: theme.palette.action.selected,
                          '&:hover': {
                              bgcolor: theme.palette.action.selected,
                            },
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5,
                          }
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                    </Menu>
                </Box>
                
                <Box sx={{ px: { xs: 0.75, md: 1 }, py: { xs: 1, md: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(company);
                          }}
                          sx={{
                            color: theme.palette.text.secondary,
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: taxiMonterricoColors.green,
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                          }}
                        >
                          <Edit sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Vista previa">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(company);
                          }}
                          sx={{
                            color: theme.palette.text.secondary,
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: taxiMonterricoColors.green,
                              bgcolor: `${taxiMonterricoColors.green}15`,
                            },
                          }}
                        >
                          <Visibility sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                          }}
                          sx={{
                            color: theme.palette.text.secondary,
                            padding: { xs: 0.5, md: 1 },
                            '&:hover': {
                              color: '#d32f2f',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : '#ffebee',
                            },
                          }}
                        >
                          <Delete sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                </Box>
            </Box>
          ))}
          {paginatedCompanies.length === 0 && (
            <Box sx={pageStyles.emptyState}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Business sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                  No hay empresas para mostrar
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Crea tu primera empresa para comenzar
                </Typography>
              </Box>
            </Box>
          )}
          </Box>

          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
                sx={pageStyles.pagination}
              />
            </Box>
          )}

          {/* Información de paginación */}
          {filteredCompanies.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} de {filteredCompanies.length} empresas
              </Typography>
            </Box>
          )}
        </Box>

        {/* Panel de Filtros Lateral */}
        {filterDrawerOpen && (
        <Box
          sx={{
            width: { xs: '100%', md: 400 },
            bgcolor: theme.palette.background.paper,
            borderLeft: { xs: 'none', md: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` },
            borderTop: { xs: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, md: 'none' },
            borderRadius: 2,
            height: 'fit-content',
            maxHeight: { xs: 'none', md: 'calc(100vh - 120px)' },
            position: { xs: 'relative', md: 'sticky' },
            top: { xs: 0, md: 0 },
            mt: { xs: 2, md: 2.5 },
            alignSelf: 'flex-start',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header del Panel */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
              px: 2,
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
              }}
            >
              Filter
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                onClick={() => {
                  setSelectedStages([]);
                  setSelectedOwnerFilters([]);
                  setSelectedCountries([]);
                }}
                sx={{
                  color: '#d32f2f',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 0.75,
                  py: 0.25,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
                  },
                }}
              >
                Clear
              </Button>
              <IconButton
                size="small"
                onClick={() => setFilterDrawerOpen(false)}
                sx={{
                  color: theme.palette.text.secondary,
                  padding: '2px',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Contenido del Panel */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {/* Sección Etapas */}
            <Box>
              <Box
                onClick={() => setStagesExpanded(!stagesExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Etapas
                </Typography>
                {stagesExpanded ? (
                  <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary, transform: 'rotate(180deg)' }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={stagesExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {stageOrder.map((stage) => {
                      const stageColor = getStageColor(stage);
                      const isSelected = selectedStages.includes(stage);
                      
                      return (
                        <Chip
                          key={stage}
                          label={getStageLabelWithoutPercentage(stage)}
                          size="small"
                          color={isSelected ? stageColor : undefined}
                          variant={isSelected ? 'filled' : 'outlined'}
                          onClick={() => {
                            setSelectedStages((prev) =>
                              prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
                            );
                          }}
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '24px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: 'auto',
                            py: 0.25,
                            px: 1,
                            opacity: isSelected ? 1 : 0.8,
                            '&:hover': {
                              opacity: 1,
                              transform: 'scale(1.02)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiChip-label': {
                              padding: '0 4px',
                            },
                            ...(!isSelected && {
                              borderColor: stageColor === 'error' 
                                ? theme.palette.error.main 
                                : stageColor === 'warning'
                                ? theme.palette.warning.main
                                : stageColor === 'info'
                                ? theme.palette.info.main
                                : stageColor === 'success'
                                ? theme.palette.success.main
                                : theme.palette.divider,
                              color: theme.palette.text.primary,
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              '& .MuiChip-label': {
                                color: theme.palette.text.primary,
                                padding: '0 4px',
                              },
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>

            {/* Sección Propietario de la Empresa */}
            <Box>
              <Box
                onClick={() => setOwnerFilterExpanded(!ownerFilterExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Propietario del Registro
                </Typography>
                {ownerFilterExpanded ? (
                  <Remove sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                ) : (
                  <Add sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={ownerFilterExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {/* Opción "Yo" */}
                    <Chip
                      icon={<Bolt sx={{ fontSize: 14, color: 'inherit' }} />}
                      label="Yo"
                      size="small"
                      onClick={() => {
                        setSelectedOwnerFilters((prev) =>
                          prev.includes('me') ? prev.filter((o) => o !== 'me') : [...prev, 'me']
                        );
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: '24px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        opacity: selectedOwnerFilters.includes('me') ? 1 : 0.8,
                        variant: selectedOwnerFilters.includes('me') ? 'filled' : 'outlined',
                        color: selectedOwnerFilters.includes('me') ? 'primary' : undefined,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          padding: '0 4px',
                        },
                        ...(!selectedOwnerFilters.includes('me') && {
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.primary,
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          '& .MuiChip-label': {
                            color: theme.palette.text.primary,
                            padding: '0 4px',
                          },
                        }),
                      }}
                    />

                    {/* Opción "Sin asignar" */}
                    <Chip
                      label="Sin asignar"
                      size="small"
                      onClick={() => {
                        setSelectedOwnerFilters((prev) =>
                          prev.includes('unassigned') ? prev.filter((o) => o !== 'unassigned') : [...prev, 'unassigned']
                        );
                      }}
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: '24px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: 'auto',
                        py: 0.25,
                        px: 1,
                        opacity: selectedOwnerFilters.includes('unassigned') ? 1 : 0.8,
                        variant: selectedOwnerFilters.includes('unassigned') ? 'filled' : 'outlined',
                        color: selectedOwnerFilters.includes('unassigned') ? 'primary' : undefined,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease',
                        '& .MuiChip-label': {
                          padding: '0 4px',
                        },
                        ...(!selectedOwnerFilters.includes('unassigned') && {
                          borderColor: theme.palette.divider,
                          color: theme.palette.text.primary,
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                          '& .MuiChip-label': {
                            color: theme.palette.text.primary,
                            padding: '0 4px',
                          },
                        }),
                      }}
                    />

                    {/* Lista de usuarios */}
                    {users.map((userItem) => {
                      const isSelected = selectedOwnerFilters.includes(userItem.id);
                      return (
                        <Chip
                          key={userItem.id}
                          avatar={
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: '0.625rem',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              {userItem.firstName?.[0]?.toUpperCase() || userItem.email?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                          }
                          label={`${userItem.firstName} ${userItem.lastName}`}
                          size="small"
                          onClick={() => {
                            setSelectedOwnerFilters((prev) =>
                              prev.includes(userItem.id) ? prev.filter((o) => o !== userItem.id) : [...prev, userItem.id]
                            );
                          }}
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '24px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: 'auto',
                            py: 0.25,
                            px: 1,
                            opacity: isSelected ? 1 : 0.8,
                            variant: isSelected ? 'filled' : 'outlined',
                            color: isSelected ? 'primary' : undefined,
                            '&:hover': {
                              opacity: 1,
                              transform: 'scale(1.02)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiChip-label': {
                              padding: '0 4px',
                            },
                            ...(!isSelected && {
                              borderColor: theme.palette.divider,
                              color: theme.palette.text.primary,
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                              '& .MuiChip-label': {
                                color: theme.palette.text.primary,
                                padding: '0 4px',
                              },
                            }),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>

            {/* Sección País */}
            <Box>
              <Box
                onClick={() => setCountryFilterExpanded(!countryFilterExpanded)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  px: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  País
                </Typography>
                {countryFilterExpanded ? (
                  <Remove sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                ) : (
                  <Add sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                )}
              </Box>
              <Collapse in={countryFilterExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
                    {Array.from(new Set(companies.map(c => c.country).filter((c): c is string => typeof c === 'string' && c.length > 0))).sort().map((country: string) => (
                      <Chip
                        key={country}
                        label={country}
                        size="small"
                        onClick={() => {
                          setSelectedCountries((prev: string[]) =>
                            prev.includes(country) ? prev.filter((c: string) => c !== country) : [...prev, country]
                          );
                        }}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.8125rem',
                          height: '28px',
                          cursor: 'pointer',
                          width: 'fit-content',
                          minWidth: 'auto',
                          opacity: selectedCountries.includes(country) ? 1 : 0.8,
                          variant: selectedCountries.includes(country) ? 'filled' : 'outlined',
                          color: selectedCountries.includes(country) ? 'primary' : undefined,
                          '&:hover': {
                            opacity: 1,
                            transform: 'scale(1.02)',
                          },
                          transition: 'all 0.2s ease',
                          ...(!selectedCountries.includes(country) && {
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.primary,
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                            '& .MuiChip-label': {
                              color: theme.palette.text.primary,
                            },
                          }),
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
              <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            </Box>
          </Box>
        </Box>
      )}
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle>
          {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* RUC y Tipo de Contribuyente en la primera fila */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="RUC"
                value={formData.ruc}
                onChange={async (e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Solo números
                  // Limitar a 11 dígitos
                  const limitedValue = value.slice(0, 11);
                  const currentName = formData.name; // Obtener el nombre actual del estado
                  setFormData({ ...formData, ruc: limitedValue });
                  setRucError('');
                  
                  // Si el RUC tiene exactamente 11 dígitos, validar inmediatamente
                  if (limitedValue.length === 11) {
                    // NO limpiar el error aquí, dejar que la validación lo maneje
                    // Validar RUC inmediatamente sin esperar debounce
                    if (editingCompany && editingCompany.ruc === limitedValue.trim()) {
                      setRucValidationError('');
                    } else {
                      try {
                        const response = await api.get('/companies', {
                          params: { search: limitedValue.trim(), limit: 50 },
                        });
                        
                        const companies = response.data.companies || response.data || [];
                        // Buscar coincidencia exacta por RUC
                        const exactMatch = companies.find((c: Company) => c.ruc === limitedValue.trim());

                        if (exactMatch) {
                          setRucValidationError('Ya existe una empresa con este RUC');
                        } else {
                          setRucValidationError('');
                        }
                      } catch (error: any) {
                        console.error('Error validando RUC:', error);
                        setRucValidationError('');
                      }
                    }
                    
                    // Validar nombre con debounce si tiene contenido
                    if (currentName && currentName.trim() !== '') {
                      validateAllFields(currentName, limitedValue);
                    }
                  } else {
                    // Si tiene menos de 11 dígitos, limpiar el error y usar validación normal
                    setRucValidationError('');
                    validateAllFields(currentName, limitedValue);
                  }
                }}
                error={!!rucError || !!rucValidationError}
                helperText={rucError || rucValidationError}
                inputProps={{ maxLength: 11 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSearchRuc}
                        disabled={loadingRuc || !formData.ruc || formData.ruc.length < 11}
                        sx={{
                          color: taxiMonterricoColors.green,
                          '&:hover': {
                            bgcolor: `${taxiMonterricoColors.green}15`,
                          },
                          '&.Mui-disabled': {
                            color: theme.palette.text.disabled,
                          },
                        }}
                      >
                        {loadingRuc ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Search />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: '2 1 0%',
                  minWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Razón social"
                value={formData.companyname}
                onChange={(e) => setFormData({ ...formData, companyname: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: '3 1 0%',
                  minWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <TextField
              label="Nombre comercial"
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                const currentRuc = formData.ruc; // Obtener el RUC actual del estado
                setFormData({ ...formData, name: newName });
                // Limpiar el error del nombre cuando el usuario empieza a escribir
                if (!newName.trim()) {
                  setNameError('');
                }
                // Validar ambos campos con los valores actuales
                validateAllFields(newName, currentRuc);
              }}
              error={!!nameError}
              helperText={nameError}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Dominio"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="LinkedIn"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                placeholder="https://www.linkedin.com/company/..."
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Teléfono 2"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Teléfono 3"
                value={formData.phone3}
                onChange={(e) => setFormData({ ...formData, phone3: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <TextField
              label="Correo"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <TextField
              select
              label="Origen de lead"
              value={formData.leadSource || ''}
              onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              <MenuItem value="referido">Referido</MenuItem>
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="entorno">Entorno</MenuItem>
              <MenuItem value="feria">Feria</MenuItem>
              <MenuItem value="masivo">Masivo</MenuItem>
            </TextField>
            <TextField
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Distrito"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Provincia"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                label="Departamento"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Box>
            <TextField
              select
              label="Etapa del Ciclo de Vida"
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="lead_inactivo">-5% Lead Inactivo</MenuItem>
              <MenuItem value="cliente_perdido">-1% Cliente perdido</MenuItem>
              <MenuItem value="cierre_perdido">-1% Cierre Perdido</MenuItem>
              <MenuItem value="lead">0% Lead</MenuItem>
              <MenuItem value="contacto">10% Contacto</MenuItem>
              <MenuItem value="reunion_agendada">30% Reunión Agendada</MenuItem>
              <MenuItem value="reunion_efectiva">40% Reunión Efectiva</MenuItem>
              <MenuItem value="propuesta_economica">50% Propuesta Económica</MenuItem>
              <MenuItem value="negociacion">70% Negociación</MenuItem>
              <MenuItem value="licitacion">75% Licitación</MenuItem>
              <MenuItem value="licitacion_etapa_final">85% Licitación Etapa Final</MenuItem>
              <MenuItem value="cierre_ganado">90% Cierre Ganado</MenuItem>
              <MenuItem value="firma_contrato">95% Firma de Contrato</MenuItem>
              <MenuItem value="activo">100% Activo</MenuItem>
            </TextField>
            
            {/* Mensaje de deuda SUNAT */}
            {rucDebts !== null && (
              <Box sx={{ 
                mt: 1.5, 
                p: 1.5, 
                borderRadius: 1,
                bgcolor: rucDebts.tiene_deudas 
                  ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.08)')
                  : (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)'),
                border: `1px solid ${rucDebts.tiene_deudas 
                  ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)')
                  : (theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)')}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                {loadingDebts ? (
                  <>
                    <CircularProgress size={16} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Consultando deudas...
                    </Typography>
                  </>
                ) : (
                  <>
                    {rucDebts.tiene_deudas ? (
                      <>
                        <Warning sx={{ color: '#f44336', fontSize: 20 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336', mb: 0.5 }}>
                            La empresa presenta deuda en SUNAT
                          </Typography>
                          {rucDebts.total_deuda && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Total: S/ {rucDebts.total_deuda.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          )}
                        </Box>
                      </>
                    ) : (
                      <>
                        <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          La empresa no presenta deuda en SUNAT
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCompany ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: pageStyles.dialog
        }}
      >
          <DialogContent sx={pageStyles.dialogContent}>
          <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            ¿Estás seguro de que deseas eliminar esta empresa?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Esta acción no se puede deshacer. La empresa será eliminada permanentemente del sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={pageStyles.dialogActions}>
          <Button 
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={pageStyles.cancelButton}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            sx={pageStyles.deleteButton}
            startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <Delete />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensajes de error */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setErrorMessage(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Modal de Progreso de Importación */}
      <Dialog
        open={importProgressOpen}
        onClose={() => {
          if (!importing && importProgress.current === importProgress.total) {
            setImportProgressOpen(false);
            setImportProgress({ current: 0, total: 0, success: 0, errors: 0 });
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          {importing ? 'Importando...' : 'Importación Completada'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {importing ? (
              <>
                <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  Procesando {importProgress.current} de {importProgress.total} empresas...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                    ✓ Exitosos: {importProgress.success}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                    ✗ Errores: {importProgress.errors}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {importProgress.success > 0 || importProgress.errors > 0
                    ? `Importación completada`
                    : 'Error al procesar el archivo'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                    ✓ {importProgress.success} empresas creadas exitosamente
                  </Typography>
                  {importProgress.errors > 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                      ✗ {importProgress.errors} empresas con errores
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {!importing && (
            <Button 
              onClick={() => {
                setImportProgressOpen(false);
                setImportProgress({ current: 0, total: 0, success: 0, errors: 0 });
              }}
              variant="contained"
              sx={{
                bgcolor: taxiMonterricoColors.green,
                '&:hover': {
                  bgcolor: taxiMonterricoColors.greenDark,
                },
              }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;





