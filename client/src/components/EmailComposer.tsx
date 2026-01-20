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
          borderRadius: 1,
          width: { xs: '95vw', sm: '1100px', md: '1200px' },
          maxWidth: { xs: '95vw', sm: '95vw' },
          height: { xs: '85vh', sm: '80vh' },
          maxHeight: { xs: '85vh', sm: '800px' },
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 20px 60px rgba(0,0,0,0.5)' 
            : '0 20px 60px rgba(0,0,0,0.12)',
          border: 'none',
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
          py: 2,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{
            fontWeight: 600,
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
          }}
        >
          Nuevo Mensaje
        </Typography>
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.error.main + '15',
              color: theme.palette.error.main,
            },
            transition: 'all 0.2s ease',
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
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
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
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.2)'
                      : theme.palette.divider,
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
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.2)'
                      : theme.palette.divider,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: taxiMonterricoColors.green,
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  fontWeight: 500,
                  py: 1.5,
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
                bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
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
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Correo enviado exitosamente
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: `1px solid ${
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : theme.palette.divider
          }`,
          justifyContent: 'flex-start',
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
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
            py: 1.25,
            bgcolor: taxiMonterricoColors.green,
            fontWeight: 600,
            borderRadius: 0.5,
            boxShadow: sending
              ? 'none'
              : `0 4px 12px ${taxiMonterricoColors.green}40`,
            '&:hover': { 
              bgcolor: taxiMonterricoColors.greenDark,
              boxShadow: sending
                ? 'none'
                : `0 6px 16px ${taxiMonterricoColors.green}50`,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
              boxShadow: 'none',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;

