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
          bgcolor: '#FFFFFF !important',
          backgroundColor: '#FFFFFF !important',
          color: '#000000 !important',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          '& *': {
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: '#F5F5F5',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        bgcolor: '#FFFFFF !important',
        backgroundColor: '#FFFFFF !important',
        color: '#000000 !important',
        '& *': {
          color: 'inherit',
        },
      }}>
        {/* Header del Drawer */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 3,
          py: 2,
          borderBottom: '2px solid',
          borderImage: 'linear-gradient(90deg, #2E7D32 0%, #FF6F00 100%) 1',
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(255, 111, 0, 0.05) 100%)',
          bgcolor: '#FFFFFF !important',
          backgroundColor: '#FFFFFF !important',
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2E7D32 0%, #FF6F00 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {title}
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: '#FF6F00 !important',
              borderRadius: 1.5,
              border: '1.5px solid transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 111, 0, 0.1)',
                borderColor: '#FF6F00',
                transform: 'rotate(90deg)',
              },
            }}
          >
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
          bgcolor: '#FFFFFF !important',
          backgroundColor: '#FFFFFF !important',
          color: '#000000 !important',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)',
          '& .MuiPopover-root': {
            zIndex: '2000 !important',
            '& .MuiPaper-root': {
              bgcolor: '#FFFFFF !important',
              color: '#000000 !important',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15) !important',
            },
          },
          // Estilos globales para TextField dentro del FormDrawer
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF !important',
              color: '#000000 !important',
              backgroundColor: '#FFFFFF !important',
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
                backgroundColor: '#FFFFFF !important',
              },
              '&:hover': {
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
                '& fieldset': {
                  borderColor: '#4CAF50',
                  boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.1)',
                },
              },
              '&.Mui-focused': {
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
                '& fieldset': {
                  borderColor: '#2E7D32 !important',
                  borderWidth: '2px',
                  boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
                },
              },
              '& input': {
                color: '#000000 !important',
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
                '&::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6) !important',
                  opacity: 1,
                },
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                  WebkitTextFillColor: '#000000 !important',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '&:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                  WebkitTextFillColor: '#000000 !important',
                },
                '&:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                  WebkitTextFillColor: '#000000 !important',
                },
                '&:-webkit-autofill:active': {
                  WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset !important',
                  WebkitTextFillColor: '#000000 !important',
                },
              },
              '& textarea': {
                color: '#000000 !important',
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
                '&::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6) !important',
                  opacity: 1,
                },
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6) !important',
              fontWeight: 500,
              '&.Mui-focused': {
                color: '#2E7D32 !important',
                fontWeight: 600,
              },
            },
            '& .MuiFormHelperText-root': {
              color: 'rgba(0, 0, 0, 0.6) !important',
            },
          },
          // Estilos para Select
          '& .MuiSelect-root': {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
          },
          '& .MuiOutlinedInput-root': {
            bgcolor: '#FFFFFF !important',
            '& .MuiSelect-select': {
              color: '#000000 !important',
              bgcolor: '#FFFFFF !important',
            },
            '&:hover': {
              bgcolor: '#FFFFFF !important',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4CAF50',
              },
            },
            '&.Mui-focused': {
              bgcolor: '#FFFFFF !important',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2E7D32 !important',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
              },
            },
          },
          '& .MuiSelect-icon': {
            color: '#2E7D32',
          },
          // Estilos para Menu (Select dropdown)
          '& .MuiMenu-paper': {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15) !important',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          },
          '& .MuiMenuItem-root': {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
            '&:hover': {
              bgcolor: 'rgba(46, 125, 50, 0.1) !important',
              color: '#2E7D32 !important',
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(46, 125, 50, 0.15) !important',
              color: '#2E7D32 !important',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(46, 125, 50, 0.2) !important',
              },
            },
          },
          '& .MuiList-root': {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
          },
          // Estilos para RadioGroup
          '& .MuiFormControlLabel-root': {
            color: '#000000 !important',
          },
          '& .MuiRadio-root': {
            color: 'rgba(0, 0, 0, 0.6) !important',
            '&.Mui-checked': {
              color: '#2E7D32 !important',
            },
            '&:hover': {
              bgcolor: 'rgba(46, 125, 50, 0.08)',
            },
          },
          // Estilos para Checkbox
          '& .MuiCheckbox-root': {
            color: 'rgba(0, 0, 0, 0.6) !important',
            '&.Mui-checked': {
              color: '#2E7D32 !important',
            },
            '&:hover': {
              bgcolor: 'rgba(46, 125, 50, 0.08)',
            },
          },
          // Estilos para Autocomplete
          '& .MuiAutocomplete-root': {
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFFFFF !important',
              backgroundColor: '#FFFFFF !important',
              color: '#000000 !important',
              '& input': {
                color: '#000000 !important',
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
              },
              '&:hover': {
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4CAF50',
                },
              },
              '&.Mui-focused': {
                bgcolor: '#FFFFFF !important',
                backgroundColor: '#FFFFFF !important',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2E7D32 !important',
                  borderWidth: '2px',
                  boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
                },
              },
            },
            '& .MuiAutocomplete-popper': {
              '& .MuiPaper-root': {
                bgcolor: '#FFFFFF !important',
                color: '#000000 !important',
              },
            },
            '& .MuiAutocomplete-listbox': {
              bgcolor: '#FFFFFF !important',
              color: '#000000 !important',
              '& .MuiOption-root': {
                bgcolor: '#FFFFFF !important',
                color: '#000000 !important',
                '&:hover': {
                  bgcolor: 'rgba(46, 125, 50, 0.1) !important',
                },
                '&[aria-selected="true"]': {
                  bgcolor: 'rgba(46, 125, 50, 0.15) !important',
                },
              },
            },
          },
          // Estilos adicionales para Typography y otros elementos
          '& .MuiTypography-root': {
            color: '#000000 !important',
          },
          '& .MuiChip-root': {
            bgcolor: '#FFFFFF !important',
            color: '#000000 !important',
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
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
            color: '#2E7D32',
          },
          // Estilos para InputAdornment
          '& .MuiInputAdornment-root': {
            color: 'rgba(0, 0, 0, 0.6)',
            '& .MuiSvgIcon-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            },
          },
          // Estilos para Box y otros contenedores
          '& > *': {
            color: '#000000 !important',
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
              sx={{
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%) !important',
                color: '#FFFFFF !important',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%) !important',
                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
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
                color: '#FF5252 !important',
                borderColor: '#FF5252 !important',
                borderWidth: '2px',
                bgcolor: '#FFFFFF !important',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#FF1744 !important',
                  borderWidth: '2px',
                  backgroundColor: 'rgba(255, 82, 82, 0.08) !important',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(255, 82, 82, 0.2)',
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
