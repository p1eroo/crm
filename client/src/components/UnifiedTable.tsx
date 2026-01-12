import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

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
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 4px rgba(0,0,0,0.1)' 
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: theme.palette.mode === 'light' 
            ? '1px solid rgba(0, 0, 0, 0.04)' 
            : '1px solid rgba(255, 255, 255, 0.05)',
          mb: 2,
        }}
      >
        {/* Fila superior con título y acciones */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 1.5, md: 2 },
            py: { xs: 1.25, md: 1.5 },
            borderBottom: theme.palette.mode === 'light' 
              ? '1px solid rgba(0, 0, 0, 0.08)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1rem', md: '1.25rem' },
            color: theme.palette.text.primary,
          }}>
            {title}
          </Typography>
          {actions && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {actions}
            </Box>
          )}
        </Box>

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
