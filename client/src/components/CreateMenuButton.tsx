import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add,
  TaskAltRounded,
  TrendingUpRounded,
  ConfirmationNumberRounded,
  NoteAltRounded,
  PersonAddAltRounded,
  BusinessRounded,
  DescriptionRounded,
  ReceiptLongRounded,
  PaidRounded,
  ReportProblemRounded,
} from '@mui/icons-material';

export interface CreateMenuOption {
  key: string;
  label: string;
  icon: React.ReactElement;
  color: string;
}

export interface CreateMenuButtonProps {
  onSelect: (key: string) => void;
}

const CREATE_OPTIONS: CreateMenuOption[] = [
  {
    key: 'task',
    label: 'Tarea',
    icon: <TaskAltRounded />,
    color: '#F59E0B',
  },
  {
    key: 'opportunity',
    label: 'Oportunidad',
    icon: <TrendingUpRounded />,
    color: '#3B82F6',
  },
  {
    key: 'ticket',
    label: 'Ticket',
    icon: <ConfirmationNumberRounded />,
    color: '#14B8A6',
  },
  {
    key: 'note',
    label: 'Nota',
    icon: <NoteAltRounded />,
    color: '#8B5CF6',
  },
  {
    key: 'contact',
    label: 'Contacto',
    icon: <PersonAddAltRounded />,
    color: '#22C55E',
  },
  {
    key: 'company',
    label: 'Empresa',
    icon: <BusinessRounded />,
    color: '#64748B',
  },
  {
    key: 'contract',
    label: 'Contrato/Suscripción',
    icon: <DescriptionRounded />,
    color: '#EAB308',
  },
  {
    key: 'invoice',
    label: 'Factura',
    icon: <ReceiptLongRounded />,
    color: '#10B981',
  },
  {
    key: 'payment',
    label: 'Pago',
    icon: <PaidRounded />,
    color: '#16A34A',
  },
  {
    key: 'incident',
    label: 'Incidencia',
    icon: <ReportProblemRounded />,
    color: '#EF4444',
  },
];

const CreateMenuButton: React.FC<CreateMenuButtonProps> = ({ onSelect }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (key: string) => {
    onSelect(key);
    handleClose();
  };

  // Función helper para convertir hex a rgba con alpha
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add sx={{ fontSize: 18 }} />}
        onClick={handleClick}
        sx={{
          bgcolor: '#5F9EA0',
          color: 'white',
          borderRadius: 2,
          px: 2.5,
          py: 0.875,
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(95, 158, 160, 0.3)',
          '&:hover': {
            bgcolor: '#4a8a8c',
            boxShadow: '0 4px 12px rgba(95, 158, 160, 0.4)',
          },
        }}
      >
        Crear
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            borderRadius: 3, // 12px equivalente
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            py: 0.5,
            overflow: 'hidden',
          },
        }}
        MenuListProps={{
          sx: {
            py: 0.5,
          },
        }}
      >
        {CREATE_OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            onClick={() => handleSelect(option.key)}
            sx={{
              py: 1.5,
              px: 2,
              gap: 1.5,
              borderRadius: 1,
              mx: 0.5,
              my: 0.25,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {/* Sticker container para el ícono */}
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2, // 12px equivalente
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: hexToRgba(option.color, 0.12),
                border: `1px solid ${hexToRgba(option.color, 0.2)}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 2px 8px ${hexToRgba(option.color, 0.2)}`
                  : `0 2px 4px ${hexToRgba(option.color, 0.15)}`,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  color: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': {
                    fontSize: 20,
                  },
                }}
              >
                {option.icon}
              </Box>
            </Box>

            {/* Texto */}
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 400,
                textTransform: 'none',
                flex: 1,
              }}
            >
              {option.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CreateMenuButton;

