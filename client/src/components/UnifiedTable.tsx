import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

// Valor por defecto para itemsPerPage en todas las tablas
export const DEFAULT_ITEMS_PER_PAGE = 10;

interface UnifiedTableProps {
  title: string;
  /** Color del título. Si no se pasa, en dark mode es white y en light mode text.primary. */
  titleColor?: string;
  actions?: React.ReactNode;
  header: React.ReactNode;
  rows: React.ReactNode;
  pagination?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export const UnifiedTable: React.FC<UnifiedTableProps> = ({
  title,
  titleColor,
  actions,
  header,
  rows,
  pagination,
  emptyState,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          mb: 2,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Fila superior con título y acciones */}
        {(title || actions) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: { xs: 1.5, md: 2 },
              py: { xs: 1.25, md: 1.5 },
              borderBottom: `2px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
            }}
          >
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '1rem', md: '1.1375rem' },
              color: titleColor ?? (theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary),
            }}>
              {title}
            </Typography>
            {actions && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                {actions}
              </Box>
            )}
          </Box>
        )}

        {/* Header de la tabla */}
        {header}

        {/* Filas de datos */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rows}
          {emptyState}
        </Box>

        {/* Paginación */}
        {pagination && (
          <Box
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
              borderRadius: '0 0 8px 8px',
              boxShadow: 'none',
              border: 'none',
              borderTop: theme.palette.mode === 'light' 
                ? `1px solid ${theme.palette.divider}` 
                : `1px solid ${theme.palette.divider}`,
              px: { xs: 1.5, md: 2 },
              py: { xs: 1.25, md: 1.5 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 1.5, md: 2 },
            }}
          >
            {pagination}
          </Box>
        )}
      </Box>
    </Box>
  );
};
