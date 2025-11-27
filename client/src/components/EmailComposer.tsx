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
  AttachFile,
  InsertPhoto,
  Link as LinkIcon,
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
          borderRadius: 2,
          maxHeight: '90vh',
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Nuevo Mensaje
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, '&.MuiDialogContent-root': { pt: 0 } }}>
        <Box sx={{ p: 2 }}>
          {/* Campo Para */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Para"
              value={recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail}
              fullWidth
              disabled
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F5F5F5',
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
            />
          </Box>

          {/* Editor de texto enriquecido */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                overflow: 'hidden',
                minHeight: '300px',
                maxHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: theme.palette.background.paper,
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
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            disabled
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            }}
          >
            <AttachFile fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            disabled
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            }}
          >
            <InsertPhoto fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            disabled
            sx={{
              color: theme.palette.text.secondary,
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={sending}
            sx={{
              color: theme.palette.text.primary,
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
              bgcolor: taxiMonterricoColors.green,
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

