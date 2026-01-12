import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  width?: { xs?: string; sm?: number; md?: number };
}

export const FormDrawer: React.FC<FormDrawerProps> = ({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = 'Crear',
  children,
  width = { xs: '100%', sm: 380, md: 420 },
}) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        BackdropProps: {
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(76, 82, 76, 0.63)'
              : '#464f4666',
          },
        },
      }}
      sx={{
        zIndex: 1600,
      }}
      PaperProps={{
        sx: {
          width,
          maxWidth: '100%',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.5)'
            : '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        bgcolor: theme.palette.background.paper,
      }}>
        {/* Header del Drawer */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 3,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Contenido del formulario con scroll */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'visible',
          px: 3, 
          py: 2,
          position: 'relative',
          '& .MuiPopover-root': {
            zIndex: '2000 !important',
          },
          '& .MuiMenu-paper': {
            zIndex: '2000 !important',
          },
        }}>
          {children}
          
          {/* Botones dentro del área scrolleable */}
          <Box sx={{ 
            mt: 1,
            pt: 1,
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-start',
          }}>
            <Button onClick={onSubmit} variant="contained">
              {submitLabel}
            </Button>
            <Button 
              onClick={onClose}
              variant="outlined"
              sx={{
                color: '#f44336',
                borderColor: '#f44336',
                '&:hover': {
                  borderColor: '#d32f2f',
                  backgroundColor: 'rgba(244, 67, 54, 0.04)',
                },
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};
