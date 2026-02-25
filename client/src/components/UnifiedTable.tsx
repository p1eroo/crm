import React, { useState } from 'react';
import { Box, Typography, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// Valor por defecto para itemsPerPage en todas las tablas
export const DEFAULT_ITEMS_PER_PAGE = 10;

interface UnifiedTableProps {
  title: string;
  /** Icono opcional a la izquierda del título (ej. icono de documento/lista). */
  titleIcon?: React.ReactNode;
  /** Color del título. Si no se pasa, en dark mode es white y en light mode text.primary. */
  titleColor?: string;
  /** Si true, muestra botón para expandir/contraer el contenido de la tabla. */
  collapsible?: boolean;
  /** Estado inicial cuando collapsible es true. Por defecto false (expandido). */
  defaultCollapsed?: boolean;
  actions?: React.ReactNode;
  header: React.ReactNode;
  rows: React.ReactNode;
  pagination?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export const UnifiedTable: React.FC<UnifiedTableProps> = ({
  title,
  titleIcon,
  titleColor,
  collapsible = false,
  defaultCollapsed = false,
  actions,
  header,
  rows,
  pagination,
  emptyState,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      <Box
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
          borderRadius: 3,
          boxShadow: 'none',
          mb: 2,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Fila superior con título y acciones */}
        {(title || actions || collapsible) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: { xs: 1.5, md: 2 },
              py: { xs: 1.25, md: 1.5 },
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
              borderBottom: !collapsed ? `1px solid ${theme.palette.divider}` : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {titleIcon && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : theme.palette.text.secondary }}>
                  {titleIcon}
                </Box>
              )}
              <Typography variant="h5" sx={{ 
                fontWeight: 600, 
                fontSize: { xs: '1rem', md: '1.1375rem' },
                color: titleColor ?? (theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary),
              }}>
                {title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {collapsible && (
                <IconButton
                  size="small"
                  onClick={() => setCollapsed(!collapsed)}
                  sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : theme.palette.text.secondary }}
                  aria-label={collapsed ? 'Expandir' : 'Contraer'}
                >
                  {collapsed ? <ExpandMore /> : <ExpandLess />}
                </IconButton>
              )}
              {actions}
            </Box>
          </Box>
        )}

        {/* Móvil: contenedor con scroll horizontal DENTRO de la tabla */}
        {!collapsed && (isMobile ? (
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              overflowX: 'auto',
              overflowY: 'visible',
              WebkitOverflowScrolling: 'touch',
              // Forzar scrollbar visible en móvil (algunos navegadores la ocultan)
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-track': { 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                },
              },
            }}
          >
            <Box component="div" sx={{ minWidth: 800, width: 800 }}>
              {header}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {rows}
                {emptyState}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Box sx={{ minWidth: 800 }}>
              {header}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {rows}
                {emptyState}
              </Box>
            </Box>
          </Box>
        ))}

        {/* Paginación */}
        {!collapsed && pagination && (
          <Box
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
              borderRadius: '0 0 8px 8px',
              boxShadow: 'none',
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
