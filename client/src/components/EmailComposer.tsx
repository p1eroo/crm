import React, { useState } from 'react';
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
  recipientEmail: string;
  recipientName?: string;
  onSend?: (emailData: { to: string; subject: string; body: string }) => Promise<void>;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  open,
  onClose,
  recipientEmail,
  recipientName,
  onSend,
}) => {
  const theme = useTheme();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
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
          to: recipientEmail,
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
    setSubject('');
    setBody('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 20px 60px rgba(0,0,0,0.5)' 
            : '0 20px 60px rgba(0,0,0,0.12)',
          border: 'none',
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

      <DialogContent sx={{ p: 0, '&.MuiDialogContent-root': { pt: 0 } }}>
        <Box sx={{ 
          px: 3,
          py: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
        }}>
          {/* Campo Para */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Para"
              value={recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail}
              fullWidth
              disabled
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
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
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
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
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                border: `1px solid ${
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : theme.palette.divider
                }`,
                borderRadius: 2,
                overflow: 'hidden',
                minHeight: '300px',
                maxHeight: '400px',
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
          py: 1.5,
          borderTop: `1px solid ${
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : theme.palette.divider
          }`,
          justifyContent: 'flex-end',
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={sending}
            variant="outlined"
            sx={{
              textTransform: 'none',
              px: 3,
              py: 0.75,
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: theme.palette.divider,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(0,0,0,0.02)',
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <Send />}
            disabled={sending || !subject.trim() || !body.trim() || body === '<p><br></p>' || body === '<br>' || body === ''}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 0.75,
              bgcolor: taxiMonterricoColors.green,
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
            }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EmailComposer;

