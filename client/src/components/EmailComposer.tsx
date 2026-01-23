import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Close,
  Send,
} from '@mui/icons-material';
import RichTextEditor from './RichTextEditor';
import { taxiMonterricoColors } from '../theme/colors';

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  recipientEmail?: string;
  recipientName?: string;
  initialSubject?: string;
  initialBody?: string;
  onSend?: (emailData: { to: string; subject: string; body: string }) => Promise<void>;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  open,
  onClose,
  recipientEmail,
  recipientName,
  initialSubject,
  initialBody,
  onSend,
}) => {
  const theme = useTheme();
  const [to, setTo] = useState(recipientEmail || '');
  const [subject, setSubject] = useState(initialSubject || '');
  const [body, setBody] = useState(initialBody || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Actualizar 'to' cuando recipientEmail cambia
  useEffect(() => {
    if (recipientEmail) {
      setTo(recipientEmail);
    }
  }, [recipientEmail]);

  // Actualizar subject cuando initialSubject cambia
  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  const handleSend = async () => {
    if (!to.trim()) {
      setError('El destinatario es requerido');
      return;
    }

    if (!subject.trim()) {
      setError('El asunto es requerido');
      return;
    }

    if (!body.trim() || body === '<p><br></p>' || body === '<br>' || body === '') {
      setError('El mensaje es requerido');
      return;
    }

    setError('');
    setSending(true);

    try {
      if (onSend) {
        await onSend({
          to: to.trim(),
          subject: subject.trim(),
          body: body,
        });
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el correo');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setTo(recipientEmail || '');
    setSubject(initialSubject || '');
    setBody(initialBody || '');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: { xs: '95vw', sm: '1100px', md: '1200px' },
          maxWidth: { xs: '95vw', sm: '95vw' },
          height: { xs: '85vh', sm: '80vh' },
          maxHeight: { xs: '85vh', sm: '800px' },
          bgcolor: `${theme.palette.background.paper} !important`,
          color: `${theme.palette.text.primary} !important`,
          boxShadow: `0 8px 32px ${taxiMonterricoColors.greenLight}30`,
          border: '1px solid',
          borderColor: theme.palette.divider,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes fadeInScale': {
            '0%': {
              opacity: 0,
              transform: 'scale(0.95)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1)',
            },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2.5,
          pb: 2.5,
          background: `linear-gradient(135deg, ${taxiMonterricoColors.green}15 0%, ${taxiMonterricoColors.orange}15 100%)`,
          borderBottom: `2px solid transparent`,
          borderImage: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
          borderImageSlice: 1,
          bgcolor: `${theme.palette.background.paper} !important`,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{
            fontWeight: 700,
            fontSize: '1.375rem',
            letterSpacing: '-0.02em',
            background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.orange} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: `${theme.palette.text.primary} !important`,
          }}
        >
          Nuevo Mensaje
        </Typography>
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{
            color: taxiMonterricoColors.orange,
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: `${taxiMonterricoColors.orange}15`,
              transform: 'rotate(90deg)',
            },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 0, 
        '&.MuiDialogContent-root': { 
          pt: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        } 
      }}>
        <Box sx={{ 
          px: 3,
          py: 2,
          bgcolor: `${theme.palette.background.paper} !important`,
          background: `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}>
          {/* Campo Para */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Para"
              value={recipientEmail && !recipientName ? recipientEmail : (recipientName ? `${recipientName} <${recipientEmail}>` : to)}
              onChange={(e) => {
                if (!recipientEmail) {
                  setTo(e.target.value);
                }
              }}
              fullWidth
              disabled={!!recipientEmail}
              size="small"
              placeholder="correo@ejemplo.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: `${theme.palette.background.paper} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderWidth: 2,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: `${taxiMonterricoColors.greenLight} !important`,
                    boxShadow: `0 0 0 2px ${taxiMonterricoColors.greenLight}30`,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: `${taxiMonterricoColors.green} !important`,
                    boxShadow: `0 0 0 3px ${taxiMonterricoColors.greenLight}30`,
                  },
                  '& input': {
                    color: `${theme.palette.text.primary} !important`,
                    '&::placeholder': {
                      color: `${theme.palette.text.secondary} !important`,
                      opacity: 1,
                    },
                  },
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                    WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: `${theme.palette.text.secondary} !important`,
                  '&.Mui-focused': {
                    color: `${taxiMonterricoColors.green} !important`,
                    fontWeight: 600,
                  },
                },
              }}
            />
          </Box>

          {/* Campo Asunto */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              size="small"
              placeholder="Escribe el asunto..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: `${theme.palette.background.paper} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  borderWidth: 2,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: `${taxiMonterricoColors.greenLight} !important`,
                    boxShadow: `0 0 0 2px ${taxiMonterricoColors.greenLight}30`,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: `${taxiMonterricoColors.green} !important`,
                    boxShadow: `0 0 0 3px ${taxiMonterricoColors.greenLight}30`,
                  },
                  '& input': {
                    color: `${theme.palette.text.primary} !important`,
                    fontSize: '1rem',
                    fontWeight: 500,
                    py: 1.5,
                    '&::placeholder': {
                      color: `${theme.palette.text.secondary} !important`,
                      opacity: 1,
                    },
                  },
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                    WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: `${theme.palette.text.secondary} !important`,
                  '&.Mui-focused': {
                    color: `${taxiMonterricoColors.green} !important`,
                    fontWeight: 600,
                  },
                },
              }}
            />
          </Box>

          {/* Editor de texto enriquecido */}
          <Box sx={{ mb: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box
              sx={{
                border: `1px solid ${
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : theme.palette.divider
                }`,
                borderRadius: 2,
                overflow: 'hidden',
                flex: 1,
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: theme.palette.background.paper,
                transition: 'all 0.2s ease',
              }}
            >
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Escribe tu mensaje..."
              />
            </Box>
          </Box>

          {/* Mensajes de error/éxito */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.error.main,
                boxShadow: `0 4px 12px ${theme.palette.error.main}33`,
                bgcolor: theme.palette.background.paper,
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                },
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: taxiMonterricoColors.green,
                boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}30`,
                bgcolor: theme.palette.background.paper,
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                },
              }}
            >
              Correo enviado exitosamente
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          justifyContent: 'flex-start',
          bgcolor: `${theme.palette.background.paper} !important`,
        }}
      >
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={sending ? <CircularProgress size={16} /> : <Send />}
          disabled={sending || !subject.trim() || !body.trim() || body === '<p><br></p>' || body === '<br>' || body === ''}
          sx={{
            textTransform: 'none',
            px: 4,
            py: 1.5,
            background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
            color: theme.palette.common.white,
            fontWeight: 700,
            borderRadius: 2,
            boxShadow: sending
              ? 'none'
              : `0 4px 12px ${taxiMonterricoColors.greenLight}40`,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}4D, transparent)`,
              transition: 'left 0.5s ease',
            },
            '&:hover': { 
              background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`,
              boxShadow: sending
                ? 'none'
                : `0 8px 20px ${taxiMonterricoColors.greenLight}60`,
              transform: 'translateY(-2px)',
              '&::before': {
                left: '100%',
              },
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
              boxShadow: 'none',
              background: theme.palette.action.disabledBackground,
            },
          }}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;

