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
  PersonAddAltRounded,
  BusinessRounded,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../theme/colors';

export interface CreateMenuOption {
  key: string;
  label: string;
  icon: React.ReactElement;
  color: string;
}

export interface CreateMenuButtonProps {
  onSelect: (key: string) => void;
}

const getCreateOptions = (theme: any): CreateMenuOption[] => [
  {
    key: 'task',
    label: 'Tarea',
    icon: <TaskAltRounded />,
    color: taxiMonterricoColors.orange,
  },
  {
    key: 'opportunity',
    label: 'Negocio',
    icon: <TrendingUpRounded />,
    color: theme.palette.primary.main,
  },
  {
    key: 'ticket',
    label: 'Ticket',
    icon: <ConfirmationNumberRounded />,
    color: taxiMonterricoColors.green,
  },
  {
    key: 'contact',
    label: 'Contacto',
    icon: <PersonAddAltRounded />,
    color: taxiMonterricoColors.greenLight,
  },
  {
    key: 'company',
    label: 'Empresa',
    icon: <BusinessRounded />,
    color: theme.palette.text.secondary,
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
          bgcolor: taxiMonterricoColors.green,
          color: theme.palette.common.white,
          borderRadius: 2,
          px: 2.5,
          py: 0.875,
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: `0 2px 8px ${taxiMonterricoColors.green}4D`,
          '&:hover': {
            bgcolor: taxiMonterricoColors.greenDark,
            boxShadow: `0 4px 12px ${taxiMonterricoColors.green}66`,
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
        {getCreateOptions(theme).map((option) => (
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

