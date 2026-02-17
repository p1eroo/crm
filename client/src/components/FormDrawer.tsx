import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import { taxiMonterricoColors } from '../theme/colors';

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  /** Deshabilita el botón de envío (p. ej. mientras se guarda). */
  submitDisabled?: boolean;
  children: React.ReactNode;
  width?: { xs?: string; sm?: number; md?: number };
  /** Estilo "panel": mismo look que el drawer Nueva Tarea (encabezado simple, botones pill, animación). */
  variant?: 'default' | 'panel';
}

const DARK_PAPER = '#1c252e'; // mismo que tablas/drawer en modo oscuro

const panelPaperProps = (theme: Theme) => ({
  width: { xs: '100%' as const, sm: 720, md: 800 },
  maxWidth: '100%',
  height: '100vh',
  maxHeight: '100vh',
  flex: 'none',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(180deg, ${DARK_PAPER} 0%, ${theme.palette.background.default} 100%)`
    : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  boxShadow: theme.palette.mode === 'dark'
    ? '-8px 0 24px rgba(0,0,0,0.4)'
    : '-8px 0 24px rgba(0,0,0,0.12)',
  border: 'none',
  transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
});

const panelContentSx = (theme: Theme) => ({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  overflowX: 'hidden',
  mx: -3,
  pt: 1.5,
  pb: 4,
  mb: -3,
  maxWidth: 710,
  alignSelf: 'center',
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
      borderWidth: '2px',
      borderRadius: 2,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
      borderWidth: '2px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
    },
  },
});

export const FormDrawer: React.FC<FormDrawerProps> = ({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = 'Crear',
  cancelLabel = 'Cancelar',
  submitDisabled = false,
  children,
  width = { xs: '100%', sm: 380, md: 420 },
  variant = 'default',
}) => {
  const theme = useTheme();
  const isPanel = variant === 'panel';

  const drawerCommon = {
    anchor: 'right' as const,
    open,
    onClose,
    sx: { zIndex: 1600 },
  };

  if (isPanel) {
    return (
      <Drawer
        {...drawerCommon}
        variant="temporary"
        transitionDuration={{ enter: 400, exit: 300 }}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
          transition: { timeout: { enter: 400, exit: 300 } },
        }}
        PaperProps={{ sx: panelPaperProps(theme) }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, pt: 3, pb: 1.5, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#4BB280' }}>
              {title}
            </Typography>
            <IconButton onClick={onClose} size="small" aria-label="Cerrar">
              <Close />
            </IconButton>
          </Box>
          <Box sx={panelContentSx(theme)}>
            {children}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start', px: 5.5, py: 2, flexShrink: 0 }}>
            <Button
              onClick={onClose}
              sx={{
                borderRadius: '5px',
                px: 2.5,
                py: 1.25,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(180, 80, 90, 0.35)' : 'rgba(185, 28, 28, 0.15)',
                color: theme.palette.mode === 'dark' ? '#F87171' : '#DC2626',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? '#D25B5B' : '#E07A7A',
                  color: '#fff',
                },
              }}
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onSubmit}
              variant="contained"
              disabled={submitDisabled}
              sx={{
                borderRadius: '5px',
                px: 2.5,
                py: 1.25,
                bgcolor: taxiMonterricoColors.greenLight,
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: taxiMonterricoColors.green },
              }}
            >
              {submitLabel}
            </Button>
          </Box>
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      {...drawerCommon}
      ModalProps={{
        BackdropProps: {
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? `${theme.palette.common.black}80`
              : `${theme.palette.common.black}66`,
          },
        },
      }}
      PaperProps={{
        sx: {
          width,
          maxWidth: '100%',
          bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 'none',
          border: 'none',
          '& *': {
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': {
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: theme.palette.mode === 'dark'
                ? theme.palette.action.disabledBackground
                : theme.palette.action.disabled,
              borderRadius: '4px',
              '&:hover': { bgcolor: theme.palette.action.hover },
            },
          },
        },
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
        color: theme.palette.text.primary,
        '& *': { color: 'inherit' },
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
          borderBottom: `2px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${taxiMonterricoColors.green}15 0%, ${taxiMonterricoColors.orange}15 100%)`
            : `linear-gradient(135deg, ${taxiMonterricoColors.green}0D 0%, ${taxiMonterricoColors.orange}0D 100%)`,
          bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#4BB280' }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: `${taxiMonterricoColors.orange} !important`,
              borderRadius: 1.5,
              border: '1.5px solid transparent',
              '&:hover': {
                bgcolor: `${taxiMonterricoColors.orange}1A`,
                borderColor: taxiMonterricoColors.orange,
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'visible',
          px: 3,
          py: 2,
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
          color: theme.palette.text.primary,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${DARK_PAPER} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
          '& .MuiPopover-root': {
            zIndex: '2000 !important',
            '& .MuiPaper-root': {
              bgcolor: theme.palette.mode === 'dark' ? DARK_PAPER : theme.palette.background.paper,
              color: theme.palette.text.primary,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0,0,0,0.5) !important'
                : '0 8px 24px rgba(0,0,0,0.15) !important',
            },
          },
          // Estilos globales para TextField dentro del FormDrawer
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover': {
                bgcolor: theme.palette.background.paper,
                '& fieldset': {
                  borderColor: taxiMonterricoColors.green,
                  boxShadow: `0 0 0 2px ${taxiMonterricoColors.green}1A`,
                },
              },
              '&.Mui-focused': {
                bgcolor: theme.palette.background.paper,
                '& fieldset': {
                  borderColor: `${taxiMonterricoColors.green} !important`,
                  borderWidth: '2px',
                  boxShadow: `0 0 0 3px ${taxiMonterricoColors.green}26`,
                },
              },
              '& input': {
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 1,
                },
                '&:-webkit-autofill': {
                  WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
                  WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '&:-webkit-autofill:hover': {
                  WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
                  WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                },
                '&:-webkit-autofill:focus': {
                  WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
                  WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                },
                '&:-webkit-autofill:active': {
                  WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
                  WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                },
              },
              '& textarea': {
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 1,
                },
              },
            },
            '& .MuiInputLabel-root': {
              color: theme.palette.text.secondary,
              fontWeight: 500,
              '&.Mui-focused': {
                color: `${taxiMonterricoColors.green} !important`,
                fontWeight: 600,
              },
            },
            '& .MuiFormHelperText-root': {
              color: theme.palette.text.secondary,
            },
          },
          // Estilos para Select
          '& .MuiSelect-root': {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
          '& .MuiOutlinedInput-root': {
            bgcolor: theme.palette.background.paper,
            '& .MuiSelect-select': {
              color: theme.palette.text.primary,
              bgcolor: theme.palette.background.paper,
            },
            '&:hover': {
              bgcolor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: taxiMonterricoColors.green,
              },
            },
            '&.Mui-focused': {
              bgcolor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: `${taxiMonterricoColors.green} !important`,
                borderWidth: '2px',
                boxShadow: `0 0 0 3px ${taxiMonterricoColors.green}26`,
              },
            },
          },
          '& .MuiSelect-icon': {
            color: taxiMonterricoColors.green,
          },
          // Estilos para Menu (Select dropdown)
          '& .MuiMenu-paper': {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.5) !important'
              : '0 8px 24px rgba(0,0,0,0.15) !important',
            border: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiMenuItem-root': {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            '&:hover': {
              bgcolor: `${taxiMonterricoColors.green}1A !important`,
              color: `${taxiMonterricoColors.green} !important`,
            },
            '&.Mui-selected': {
              bgcolor: `${taxiMonterricoColors.green}26 !important`,
              color: `${taxiMonterricoColors.green} !important`,
              fontWeight: 600,
              '&:hover': {
                bgcolor: `${taxiMonterricoColors.green}33 !important`,
              },
            },
          },
          '& .MuiList-root': {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
          // Estilos para RadioGroup
          '& .MuiFormControlLabel-root': {
            color: theme.palette.text.primary,
          },
          '& .MuiRadio-root': {
            color: theme.palette.text.secondary,
            '&.Mui-checked': {
              color: `${taxiMonterricoColors.green} !important`,
            },
            '&:hover': {
              bgcolor: `${taxiMonterricoColors.green}14`,
            },
          },
          // Estilos para Checkbox
          '& .MuiCheckbox-root': {
            color: theme.palette.text.secondary,
            '&.Mui-checked': {
              color: `${taxiMonterricoColors.green} !important`,
            },
            '&:hover': {
              bgcolor: `${taxiMonterricoColors.green}14`,
            },
          },
          // Estilos para Autocomplete
          '& .MuiAutocomplete-root': {
            '& .MuiOutlinedInput-root': {
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              '& input': {
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
              },
              '&:hover': {
                bgcolor: theme.palette.background.paper,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: taxiMonterricoColors.green,
                },
              },
              '&.Mui-focused': {
                bgcolor: theme.palette.background.paper,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${taxiMonterricoColors.green} !important`,
                  borderWidth: '2px',
                  boxShadow: `0 0 0 3px ${taxiMonterricoColors.green}26`,
                },
              },
            },
            '& .MuiAutocomplete-popper': {
              '& .MuiPaper-root': {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              },
            },
            '& .MuiAutocomplete-listbox': {
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              '& .MuiOption-root': {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.green}1A !important`,
                },
                '&[aria-selected="true"]': {
                  bgcolor: `${taxiMonterricoColors.green}26 !important`,
                },
              },
            },
          },
          // Estilos adicionales para Typography y otros elementos
          '& .MuiTypography-root': {
            color: theme.palette.text.primary,
          },
          '& .MuiChip-root': {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
          },
          '& .MuiDivider-root': {
            borderColor: theme.palette.divider,
          },
          // Estilos para IconButton
          '& .MuiIconButton-root': {
            color: 'inherit',
            '& .MuiSvgIcon-root': {
              color: 'inherit',
            },
          },
          // Estilos para CircularProgress
          '& .MuiCircularProgress-root': {
            color: taxiMonterricoColors.green,
          },
          // Estilos para InputAdornment
          '& .MuiInputAdornment-root': {
            color: theme.palette.text.secondary,
            '& .MuiSvgIcon-root': {
              color: theme.palette.text.secondary,
            },
          },
          // Estilos para Box y otros contenedores
          '& > *': {
            color: theme.palette.text.primary,
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
            <Button 
              onClick={onSubmit} 
              variant="contained"
              disabled={submitDisabled}
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenDark} 100%) !important`,
                color: `${theme.palette.common.white} !important`,
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: `0 4px 12px ${taxiMonterricoColors.green}4D`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%) !important`,
                  boxShadow: `0 6px 20px ${taxiMonterricoColors.green}66`,
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              {submitLabel}
            </Button>
            <Button 
              onClick={onClose}
              variant="outlined"
              sx={{
                color: `${theme.palette.error.main} !important`,
                borderColor: `${theme.palette.error.main} !important`,
                borderWidth: '2px',
                bgcolor: theme.palette.background.paper,
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: `${theme.palette.error.dark} !important`,
                  borderWidth: '2px',
                  backgroundColor: `${theme.palette.error.main}14 !important`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${theme.palette.error.main}33`,
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
