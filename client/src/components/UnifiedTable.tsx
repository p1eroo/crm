import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

// Valor por defecto para itemsPerPage en todas las tablas
export const DEFAULT_ITEMS_PER_PAGE = 10;

interface UnifiedTableProps {
  title: string;
  actions?: React.ReactNode;
  header: React.ReactNode;
  rows: React.ReactNode;
  pagination?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export const UnifiedTable: React.FC<UnifiedTableProps> = ({
  title,
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
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${theme.palette.divider}`,
          mb: 2,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 30px rgba(0, 0, 0, 0.4)' 
              : '0 8px 30px rgba(0, 0, 0, 0.12)',
          },
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
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, transparent 100%)`
                : `linear-gradient(135deg, rgba(16, 185, 129, 0.01) 0%, transparent 100%)`,
            }}
          >
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.mode === 'dark' ? '#10B981' : '#2E7D32'} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
              bgcolor: theme.palette.background.paper,
              borderRadius: '0 0 8px 8px',
              boxShadow: 'none',
              border: 'none',
              borderTop: theme.palette.mode === 'light' 
                ? '1px solid rgba(0, 0, 0, 0.08)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
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
