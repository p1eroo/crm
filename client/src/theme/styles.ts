// client/src/theme/styles.ts
import { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { taxiMonterricoColors } from './colors';

const actionButtonBase = {
  padding: 0.5,
  borderRadius: 1,
  border: 'none',
  '&:hover': {
    border: 'none',
  },
} as const;

/**
 * Estilos reutilizables para componentes de página
 * Centraliza estilos comunes para mantener consistencia y reducir código duplicado
 */
export const pageStyles = {
  /**
   * Estilo estándar para títulos de página
   */
  pageTitle: {
    fontWeight: 500,
    color: (theme: Theme) => theme.palette.text.primary,
    mb: 0.25,
    fontSize: { 
      xs: '0.9375rem', 
      sm: '1.125rem', 
      md: '1.25rem' 
    },
  } as SxProps<Theme>,

  /**
   * Estilo para cards principales con sombra estándar
   */
  card: {
    borderRadius: (theme: Theme) => theme.palette.mode === 'dark' ? 2 : 1,
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
      : { xs: 1, md: 2 },
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    border: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '1px solid rgba(255, 255, 255, 0.15)' 
      : 'none',
  } as SxProps<Theme>,

  /**
   * Estilo para cards con efecto hover
   */
  cardHover: {
    borderRadius: (theme: Theme) => theme.palette.mode === 'dark' ? 2 : 1,
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '0 1px 3px rgba(0,0,0,0.2)' 
      : '0 1px 3px rgba(0,0,0,0.05)',
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    border: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
        ? '0 2px 6px rgba(0,0,0,0.3)' 
        : '0 2px 6px rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
    },
  } as SxProps<Theme>,

  /**
   * Estilo para filas de tabla con hover
   */
  tableRow: {
    bgcolor: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '#152030' 
      : theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: 0,
    border: 'none',
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '0 1px 3px rgba(0,0,0,0.2)' 
      : '0 1px 3px rgba(0,0,0,0.05)',
    '&:hover': {
      bgcolor: (theme: Theme) => theme.palette.mode === 'dark' 
        ? '#1A2740' 
        : theme.palette.background.paper,
      boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
        ? '0 2px 6px rgba(0,0,0,0.3)' 
        : '0 2px 6px rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
    },
  } as SxProps<Theme>,

  /**
   * Estilo para botones con borde redondeado estándar
   */
  buttonRounded: {
    borderRadius: 1.5,
  } as SxProps<Theme>,

  /**
   * Estilo para inputs y selects con borde redondeado
   */
  inputRounded: {
    borderRadius: 1.5,
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
    },
  } as SxProps<Theme>,

  /**
   * Estilo para diálogos: mismo fondo que drawer/tablas en dark (#1c252e).
   * Valor fijo en dark para que no dependa de caché ni de theme.palette.background.paper.
   */
  dialog: {
    borderRadius: 2,
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0,0,0,0.3)'
      : '0 8px 24px rgba(0,0,0,0.12)',
    bgcolor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
  } as SxProps<Theme>,

  /**
   * Estilo para headers de tabla
   */
  tableHeader: {
    fontWeight: 600,
    color: (theme: Theme) => theme.palette.text.primary,
    fontSize: { xs: '0.75rem', md: '0.8125rem' },
  } as SxProps<Theme>,

  /**
   * Estilo para texto de cuerpo estándar
   */
  bodyText: {
    fontSize: { xs: '0.75rem', md: '0.875rem' },
    color: (theme: Theme) => theme.palette.text.primary,
  } as SxProps<Theme>,

  /**
   * Estilo para texto secundario
   */
  secondaryText: {
    fontSize: { xs: '0.625rem', md: '0.6875rem' },
    color: (theme: Theme) => theme.palette.text.secondary,
  } as SxProps<Theme>,

  /**
   * Estilo para iconos de acción (ver, eliminar, etc.)
   */
  actionIcon: {
    color: (theme: Theme) => theme.palette.text.secondary,
    padding: { xs: 0.5, md: 1 },
    '&:hover': {
      color: '#20B2AA',
      bgcolor: 'rgba(32, 178, 170, 0.1)',
    },
  } as SxProps<Theme>,

  /**
   * Estilo para iconos de acción destructiva (eliminar)
   */
  deleteIcon: {
    color: (theme: Theme) => theme.palette.text.secondary,
    padding: { xs: 0.5, md: 1 },
    '&:hover': {
      color: '#d32f2f',
      bgcolor: (theme: Theme) => theme.palette.mode === 'dark' 
        ? 'rgba(211, 47, 47, 0.15)' 
        : '#ffebee',
    },
  } as SxProps<Theme>,

  /** Botón Ver: solo icono blanco/gris claro, sin borde */
  actionButtonView: (theme: Theme): SxProps<Theme> => ({
    ...actionButtonBase,
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : theme.palette.text.secondary,
    bgcolor: 'transparent',
    '&:hover': {
      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 1)' : theme.palette.text.primary,
      bgcolor: alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.06 : 0.04),
    },
  }),

  /** Botón Editar: solo icono azul, sin borde */
  actionButtonEdit: (theme: Theme): SxProps<Theme> => ({
    ...actionButtonBase,
    color: theme.palette.info.main,
    bgcolor: 'transparent',
    '&:hover': {
      color: theme.palette.info.main,
      bgcolor: alpha(theme.palette.info.main, 0.08),
    },
  }),

  /** Botón Eliminar: solo icono rojo, sin borde */
  actionButtonDelete: (theme: Theme): SxProps<Theme> => ({
    ...actionButtonBase,
    color: theme.palette.error.main,
    bgcolor: 'transparent',
    '&:hover': {
      color: theme.palette.error.main,
      bgcolor: alpha(theme.palette.error.main, 0.08),
    },
  }),

  /**
   * Estilo para contenedores de página
   */
  pageContainer: {
    bgcolor: (theme: Theme) => theme.palette.background.default,
    minHeight: '100vh',
    pb: { xs: 2, sm: 3, md: 4 },
  } as SxProps<Theme>,

  /**
   * Estilo para paneles de filtros laterales
   */
  filterPanel: {
    borderRadius: 2,
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
  } as SxProps<Theme>,

  /**
   * Botón principal verde (contained)
   */
  primaryButton: {
    bgcolor: '#13944C',
    color: 'white',
    textTransform: 'none' as const,
    fontWeight: 500,
    borderRadius: 1.5,
    px: 2.5,
    py: 1,
    '&:hover': {
      bgcolor: '#0f7039',
    },
  } as SxProps<Theme>,

  /**
   * Botón verde circular (IconButton con Add)
   */
  primaryIconButton: {
    bgcolor: taxiMonterricoColors.green,
    color: 'white',
    '&:hover': {
      bgcolor: taxiMonterricoColors.greenDark,
    },
    borderRadius: '50%',
    width: 40,
    height: 40,
    boxShadow: `0 2px 8px ${taxiMonterricoColors.green}30`,
  } as SxProps<Theme>,

  /**
   * IconButton con borde verde (Importar/Exportar)
   */
  outlinedIconButton: {
    border: `1px solid ${taxiMonterricoColors.green}`,
    color: taxiMonterricoColors.green,
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    borderRadius: 1.5,
    p: 0.875,
    '&:hover': {
      borderColor: taxiMonterricoColors.greenDark,
      bgcolor: `${taxiMonterricoColors.green}10`,
    },
    '&.Mui-disabled': {
      borderColor: (theme: Theme) => theme.palette.divider,
      color: (theme: Theme) => theme.palette.text.disabled,
      bgcolor: (theme: Theme) => theme.palette.background.paper,
    },
  } as SxProps<Theme>,

  /**
   * Select/FormControl estándar
   */
  select: {
    borderRadius: 1.5,
    bgcolor: (theme: Theme) => theme.palette.mode === 'dark' 
      ? theme.palette.background.default 
      : theme.palette.background.paper,
    fontSize: '0.8125rem',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: (theme: Theme) => theme.palette.divider,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: (theme: Theme) => theme.palette.text.secondary,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#64B5F6' : '#1976d2',
    },
  } as SxProps<Theme>,

  /**
   * Botón de cancelar en diálogos (estilo estándar)
   */
  cancelButton: {
    borderRadius: '8px',
    px: 2.5,
    py: 1.25,
    bgcolor: '#5A2C30',
    color: '#F08B8B',
    textTransform: 'none' as const,
    fontWeight: 600,
    border: 'none',
    boxShadow: 'none',
    '&:hover': {
      bgcolor: '#D25B5B',
      color: '#fff',
    },
  } as SxProps<Theme>,

  /**
   * Botón de eliminar en diálogos
   */
  deleteButton: {
    textTransform: 'none' as const,
    fontWeight: 500,
    borderRadius: 1.5,
    px: 2.5,
    bgcolor: '#d32f2f',
    '&:hover': {
      bgcolor: '#b71c1c',
    },
    '&.Mui-disabled': {
      bgcolor: '#ffcdd2',
      color: '#ffffff',
    },
  } as SxProps<Theme>,

  /**
   * Botón de guardar/crear/actualizar en diálogos (estilo estándar)
   */
  saveButton: {
    borderRadius: '8px',
    px: 2.5,
    py: 1.25,
    bgcolor: '#4CAF50',
    color: '#FFFFFF',
    textTransform: 'none' as const,
    fontWeight: 600,
    '&:hover': {
      bgcolor: '#45a049',
      color: '#FFFFFF',
    },
    '&.Mui-disabled': {
      bgcolor: '#81C784',
      color: '#FFFFFF',
      opacity: 0.6,
    },
  } as SxProps<Theme>,

  /**
   * Contenedor de acciones de diálogo (alineado a la izquierda por defecto)
   */
  dialogActions: {
    px: 3,
    py: 2,
    borderTop: (theme: Theme) => `1px solid ${theme.palette.divider}`,
    gap: 1,
    justifyContent: 'flex-start',
  } as SxProps<Theme>,

  /**
   * Contenido de diálogo de confirmación
   */
  dialogContent: {
    pt: 3,
  } as SxProps<Theme>,

  /**
   * Header de tabla estándar (celda)
   */
  tableHeaderCell: {
    fontWeight: 600,
    color: (theme: Theme) => theme.palette.text.primary,
    fontSize: { xs: '0.75rem', md: '0.8125rem' },
    display: 'flex',
    alignItems: 'center',
  } as SxProps<Theme>,

  /**
   * Contenedor de header de tabla
   */
  tableHeaderContainer: {
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '0 2px 8px rgba(0,0,0,0.3)' 
      : '0 2px 8px rgba(0,0,0,0.08)',
    px: { xs: 1, md: 1.5 },
    py: { xs: 1.5, md: 2 },
    mb: 2,
  } as SxProps<Theme>,

  /**
   * Botón de filtro (outlined)
   */
  filterButton: {
    borderColor: taxiMonterricoColors.green,
    color: taxiMonterricoColors.green,
    bgcolor: (theme: Theme) => theme.palette.background.paper,
    fontSize: '0.8125rem',
    textTransform: 'none' as const,
    borderRadius: 1.5,
    px: 1.5,
    py: 0.75,
    fontWeight: 500,
    '&:hover': {
      borderColor: taxiMonterricoColors.greenDark,
      bgcolor: `${taxiMonterricoColors.green}10`,
    },
  } as SxProps<Theme>,

  /**
   * Estado vacío (empty state)
   */
  emptyState: {
    textAlign: 'center',
    py: 8,
    bgcolor: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '#152030' 
      : theme.palette.background.paper,
    borderRadius: 0,
    border: 'none',
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark' 
      ? '0 1px 3px rgba(0,0,0,0.2)' 
      : '0 1px 3px rgba(0,0,0,0.05)',
  } as SxProps<Theme>,

  /**
   * IconButton de acción verde (ver/preview)
   */
  previewIconButton: {
    color: (theme: Theme) => theme.palette.text.secondary,
    padding: { xs: 0.5, md: 1 },
    '&:hover': {
      color: taxiMonterricoColors.green,
      bgcolor: `${taxiMonterricoColors.green}15`,
    },
  } as SxProps<Theme>,

  /**
   * Paginación estándar
   */
  pagination: {
    '& .MuiPaginationItem-root': {
      color: (theme: Theme) => theme.palette.text.primary,
      fontSize: '0.875rem',
      '&.Mui-selected': {
        bgcolor: taxiMonterricoColors.green,
        color: 'white',
        '&:hover': {
          bgcolor: taxiMonterricoColors.greenDark,
        },
      },
      '&:hover': {
        bgcolor: (theme: Theme) => theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(0, 0, 0, 0.04)',
      },
    },
  } as SxProps<Theme>,
};

