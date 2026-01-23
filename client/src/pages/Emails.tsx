import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  Dialog,
} from '@mui/material';
import {
  Refresh,
  Search,
  Close,
  ChevronLeft,
  ChevronRight,
  Star,
  Send,
  ExpandMore,
  ExpandLess,
  MarkEmailRead,
  MarkEmailUnread,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { taxiMonterricoColors } from '../theme/colors';
import api from '../config/api';
import EmailComposer from '../components/EmailComposer';
import RichTextEditor from '../components/RichTextEditor';

interface Email {
  id: string;
  draftId?: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labelIds: string[];
}

interface FolderCount {
  id: string;
  count: number;
}

const Emails: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crmEmailCount, setCrmEmailCount] = useState(0);
  const [starredCount, setStarredCount] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'starred'>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailDetail, setEmailDetail] = useState<any>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const emailsPerPage = 20;

  const fetchFolderCounts = useCallback(async () => {
    try {
      const response = await api.get('/emails/folders/counts');
      const counts = response.data.counts || [];
      const crmCount = counts.find((f: FolderCount) => f.id === 'crm');
      const starredCount = counts.find((f: FolderCount) => f.id === 'starred');
      setCrmEmailCount(crmCount?.count || 0);
      setStarredCount(starredCount?.count || 0);
    } catch (err: any) {
      console.error('Error fetching folder counts:', err);
    }
  }, []);

  // Cargar emails según la carpeta seleccionada
  useEffect(() => {
    const loadEmails = async () => {
      setLoading(true);
      setError('');
      try {
        let response;
        if (selectedFolder === 'inbox') {
          response = await api.get('/emails/crm', {
            params: {
              page: currentPage,
              limit: emailsPerPage,
              search: searchTerm,
            },
          });
        } else if (selectedFolder === 'starred') {
          response = await api.get('/emails/crm/starred', {
            params: {
              page: currentPage,
              limit: emailsPerPage,
              search: searchTerm,
            },
          });
        }
        if (response) {
          setEmails(response.data.messages || []);
          setHasNextPage(!!response.data.nextPageToken);
        }
      } catch (err: any) {
        console.error('Error fetching emails:', err);
        setError(err.response?.data?.message || 'Error al cargar los correos');
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };
    loadEmails();
  }, [currentPage, searchTerm, selectedFolder]);

  useEffect(() => {
    fetchFolderCounts();
    // Refrescar conteo cada 30 segundos
    const interval = setInterval(fetchFolderCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchFolderCounts]);

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (selectedFolder === 'inbox') {
        response = await api.get('/emails/crm', {
          params: {
            page: currentPage,
            limit: emailsPerPage,
            search: searchTerm,
          },
        });
      } else if (selectedFolder === 'starred') {
        response = await api.get('/emails/crm/starred', {
          params: {
            page: currentPage,
            limit: emailsPerPage,
            search: searchTerm,
          },
        });
      }
      if (response) {
        setEmails(response.data.messages || []);
        setHasNextPage(!!response.data.nextPageToken);
      }
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err.response?.data?.message || 'Error al cargar los correos');
      setEmails([]);
    } finally {
      setLoading(false);
    }
    fetchFolderCounts();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Resetear a página 1 cuando se busca
    
    // Debounce: esperar 500ms antes de buscar
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      // La búsqueda se ejecutará automáticamente cuando searchTerm cambie en el useEffect
    }, 500);
    
    setSearchDebounce(timeout);
  };

  const handleEmailClick = async (email: Email) => {
    // Mostrar el diálogo de detalle
    setSelectedEmail(email);
    setIsReplying(false);
    setReplySubject('');
    setReplyBody('');
    setReplyError('');
    setLoadingThread(true);
    try {
      // Cargar el detalle del email y el thread completo
      const [detailResponse, threadResponse] = await Promise.all([
        api.get(`/emails/message/${email.id}`),
        api.get(`/emails/thread/${email.threadId}`),
      ]);
      setEmailDetail(detailResponse.data);
      setThreadMessages(threadResponse.data.messages || []);
    } catch (err: any) {
      console.error('Error fetching email detail:', err);
      setError(err.response?.data?.message || 'Error al cargar el correo');
    } finally {
      setLoadingThread(false);
    }
  };

  // Función para extraer email del remitente
  const extractEmail = (emailString: string): string => {
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString.trim();
  };

  // Función para manejar responder (inline)
  const handleReply = () => {
    if (!selectedEmail || !emailDetail) return;
    const subject = emailDetail.subject || selectedEmail.subject || '';
    setReplySubject(subject.startsWith('Re: ') ? subject : `Re: ${subject}`);
    
    // Citar el mensaje original
    const borderColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
    const textColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    const quotedMessage = `
      <div style="border-left: 3px solid ${borderColor}; padding-left: 10px; margin-top: 10px; color: ${textColor};">
        <div style="margin-bottom: 5px;">
          <strong>${extractEmail(emailDetail.from)}</strong> escribió:
        </div>
        <div style="white-space: pre-wrap;">${emailDetail.body || emailDetail.snippet}</div>
      </div>
    `;
    setReplyBody(quotedMessage);
    setIsReplying(true);
    setReplyError('');
  };

  // Función para cancelar respuesta
  const handleCancelReply = () => {
    setIsReplying(false);
    setReplySubject('');
    setReplyBody('');
    setReplyError('');
  };

  // Función para enviar respuesta directamente desde el diálogo
  const handleSendReply = async () => {
    if (!selectedEmail || !emailDetail) return;

    if (!replySubject.trim()) {
      setReplyError('El asunto es requerido');
      return;
    }

    if (!replyBody.trim() || replyBody === '<p><br></p>' || replyBody === '<br>' || replyBody === '') {
      setReplyError('El mensaje es requerido');
      return;
    }

    setReplyError('');
    setSendingReply(true);

    try {
      const payload: any = {
        to: extractEmail(emailDetail.from),
        subject: replySubject.trim(),
        body: replyBody,
        threadId: selectedEmail.threadId,
        messageId: selectedEmail.id,
      };

      const emailResponse = await api.post('/emails/send', payload);
      const { messageId, threadId } = emailResponse.data;

      // Registrar como actividad
      try {
        await api.post('/activities/emails', {
          subject: replySubject.trim(),
          description: replyBody.replace(/<[^>]*>/g, ''),
          gmailMessageId: messageId,
          gmailThreadId: threadId || selectedEmail.threadId,
        });
      } catch (err) {
        console.error('Error registrando respuesta como actividad:', err);
      }

      // Recargar el thread para mostrar la nueva respuesta
      try {
        const threadResponse = await api.get(`/emails/thread/${selectedEmail.threadId}`);
        setThreadMessages(threadResponse.data.messages || []);
      } catch (err) {
        console.error('Error recargando thread:', err);
      }

      // Cerrar el modo de respuesta
      setIsReplying(false);
      setReplySubject('');
      setReplyBody('');
      handleRefresh();
    } catch (err: any) {
      setReplyError(err.response?.data?.message || 'Error al enviar la respuesta');
    } finally {
      setSendingReply(false);
    }
  };

  // Función para colapsar/expandir mensajes
  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleSendEmail = async (emailData: { to: string; subject: string; body: string }) => {
    try {
      const emailResponse = await api.post('/emails/send', emailData);
      
      // Registrar como actividad
      try {
        await api.post('/activities/emails', {
          subject: emailData.subject,
          description: emailData.body.replace(/<[^>]*>/g, ''),
          gmailMessageId: emailResponse.data.messageId,
          gmailThreadId: emailResponse.data.threadId,
        });
      } catch (err) {
        console.error('Error registrando email como actividad:', err);
      }

      setComposeOpen(false);
      handleRefresh();
    } catch (err: any) {
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      } else if (days === 1) {
        return 'Ayer';
      } else if (days < 7) {
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(/[<>]/)[0].trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isUnread = (labelIds: string[]) => labelIds.includes('UNREAD'); // Si tiene UNREAD, no está leído
  const isStarred = (labelIds: string[]) => labelIds.includes('STARRED');

  const handleToggleRead = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el email al hacer clic en el icono
    
    const isCurrentlyUnread = isUnread(email.labelIds);
    const newReadState = !isCurrentlyUnread;

    // Optimistic update: actualizar el estado local inmediatamente
    setEmails(prevEmails =>
      prevEmails.map(e =>
        e.id === email.id
          ? {
              ...e,
              labelIds: newReadState
                ? e.labelIds.filter(id => id !== 'UNREAD')
                : [...e.labelIds, 'UNREAD'],
            }
          : e
      )
    );

    try {
      const response = await api.post(`/emails/message/${email.id}/read`, { read: newReadState });
      
      // Verificar que la respuesta sea exitosa
      if (response.data && response.data.success !== false) {
        // Actualizar el conteo si es necesario
        if (selectedFolder === 'inbox') {
          fetchFolderCounts();
        }
      } else {
        // Si la respuesta indica error, revertir
        throw new Error(response.data?.message || 'Error al cambiar estado');
      }
    } catch (error: any) {
      console.error('Error al cambiar estado de lectura:', error);
      
      // Revertir el cambio si hay error
      setEmails(prevEmails =>
        prevEmails.map(e =>
          e.id === email.id
            ? {
                ...e,
                labelIds: isCurrentlyUnread
                  ? e.labelIds.filter(id => id !== 'UNREAD')
                  : [...e.labelIds, 'UNREAD'],
              }
            : e
        )
      );
      
      // Solo mostrar error si es un error real (no un error de red menor)
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage && !errorMessage.includes('Network Error')) {
        setError('Error al cambiar el estado de lectura del correo');
      }
    }
  };

  return (
    <Box sx={{ flex: 1, pb: 1, display: 'flex' }}>
      <Paper
        sx={{
          bgcolor: 'transparent',
          borderRadius: 2,
          px: 0,
          pt: 0,
          pb: 0,
          flex: 1,
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          width: '100%',
          maxWidth: '1400px',
          mx: 'auto',
          minHeight: 'calc(100vh - 200px)',
        }}
      >
      {/* Sidebar izquierdo */}
      <Box
        sx={{
          width: 260,
          bgcolor: 'transparent',
          borderRadius: 2,
          p: 0,
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {/* Botón Componer */}
        <Tooltip title="Crear nuevo correo" arrow>
          <Button
            variant="contained"
            onClick={() => setComposeOpen(true)}
            startIcon={<Send />}
            sx={{
              background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
              color: 'white',
              textTransform: 'none',
              px: 2.5,
              py: 1.5,
              mt: 1,
              borderRadius: 2,
              width: '85%',
              alignSelf: 'center',
              fontWeight: 700,
              boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}40`,
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
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                transition: 'left 0.5s ease',
              },
              '&:hover': {
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: `0 8px 20px ${taxiMonterricoColors.greenLight}60`,
                background: `linear-gradient(135deg, ${taxiMonterricoColors.greenDark} 0%, ${taxiMonterricoColors.green} 100%)`,
                '&::before': {
                  left: '100%',
                },
              },
              '&:active': {
                transform: 'translateY(0) scale(1)',
              },
            }}
          >
            Redactar
          </Button>
        </Tooltip>

        {/* Opciones de carpeta */}
        <Box sx={{ mt: 2 }}>
          {/* Inbox */}
          <Box
            onClick={() => {
              setSelectedFolder('inbox');
              setCurrentPage(1);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 2,
              cursor: 'pointer',
              mb: 1,
              bgcolor: selectedFolder === 'inbox' 
                ? `linear-gradient(135deg, ${taxiMonterricoColors.green}15 0%, ${taxiMonterricoColors.greenLight}10 100%)`
                : 'transparent',
              border: selectedFolder === 'inbox' 
                ? `2px solid ${taxiMonterricoColors.green}`
                : '1px solid transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: selectedFolder === 'inbox'
                  ? `linear-gradient(135deg, ${taxiMonterricoColors.green}20 0%, ${taxiMonterricoColors.greenLight}15 100%)`
                  : theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : `${taxiMonterricoColors.greenLight}10`,
                borderColor: selectedFolder === 'inbox' 
                  ? taxiMonterricoColors.green
                  : taxiMonterricoColors.greenLight,
                transform: 'translateX(4px)',
              },
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: selectedFolder === 'inbox' 
                  ? taxiMonterricoColors.green
                  : theme.palette.text.secondary,
                fontWeight: selectedFolder === 'inbox' ? 700 : 500,
                transition: 'all 0.3s ease',
              }}
            >
              Inbox
            </Typography>
            {crmEmailCount > 0 && (
              <Box
                sx={{
                  bgcolor: selectedFolder === 'inbox'
                    ? taxiMonterricoColors.green
                    : theme.palette.mode === 'dark' 
                      ? 'rgba(144, 202, 249, 0.16)' 
                      : 'rgba(144, 202, 249, 0.12)',
                  color: selectedFolder === 'inbox'
                    ? 'white'
                    : theme.palette.mode === 'dark'
                      ? 'rgb(144, 202, 249)'
                      : 'rgb(25, 118, 210)',
                  borderRadius: '12px',
                  minWidth: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: selectedFolder === 'inbox' 
                    ? `0 2px 8px ${taxiMonterricoColors.greenLight}40`
                    : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {crmEmailCount}
              </Box>
            )}
          </Box>

          {/* Favoritos */}
          <Box
            onClick={() => {
              setSelectedFolder('starred');
              setCurrentPage(1);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 2,
              cursor: 'pointer',
              mb: 1,
              bgcolor: selectedFolder === 'starred' 
                ? `linear-gradient(135deg, ${taxiMonterricoColors.orange}15 0%, ${taxiMonterricoColors.orangeLight}10 100%)`
                : 'transparent',
              border: selectedFolder === 'starred' 
                ? `2px solid ${taxiMonterricoColors.orange}`
                : '1px solid transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: selectedFolder === 'starred'
                  ? `linear-gradient(135deg, ${taxiMonterricoColors.orange}20 0%, ${taxiMonterricoColors.orangeLight}15 100%)`
                  : theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : `${taxiMonterricoColors.orange}10`,
                borderColor: selectedFolder === 'starred' 
                  ? taxiMonterricoColors.orange
                  : taxiMonterricoColors.orangeLight,
                transform: 'translateX(4px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star 
                sx={{ 
                  fontSize: 18,
                  color: selectedFolder === 'starred' 
                    ? taxiMonterricoColors.orange
                    : theme.palette.text.secondary,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.2) rotate(15deg)',
                  },
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: selectedFolder === 'starred' 
                    ? taxiMonterricoColors.orange
                    : theme.palette.text.secondary,
                  fontWeight: selectedFolder === 'starred' ? 700 : 500,
                  transition: 'all 0.3s ease',
                }}
              >
                Favoritos
              </Typography>
            </Box>
            {starredCount > 0 && (
              <Box
                sx={{
                  bgcolor: selectedFolder === 'starred'
                    ? taxiMonterricoColors.orange
                    : theme.palette.mode === 'dark' 
                      ? 'rgba(144, 202, 249, 0.16)' 
                      : 'rgba(144, 202, 249, 0.12)',
                  color: selectedFolder === 'starred'
                    ? 'white'
                    : theme.palette.mode === 'dark'
                      ? 'rgb(144, 202, 249)'
                      : 'rgb(25, 118, 210)',
                  borderRadius: '12px',
                  minWidth: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: selectedFolder === 'starred' 
                    ? `0 2px 8px ${taxiMonterricoColors.orange}40`
                    : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {starredCount}
              </Box>
            )}
          </Box>

        </Box>
      </Box>

      {/* Divider vertical */}
      <Divider orientation="vertical" flexItem />

      {/* Área principal */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        minWidth: 0,
        overflow: 'hidden',
      }}>
        {/* Barra de búsqueda y acciones */}
        <Box
          sx={{
            bgcolor: 'transparent',
            borderRadius: 0,
            pt: 1,
            mb: -1,
            px: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <TextField
            placeholder="Buscar correo"
            value={searchTerm}
            onChange={handleSearch}
            size="medium"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: 38,
                    transition: 'color 0.3s ease',
                  }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '1.4rem',
                borderRadius: 2,
                borderWidth: 2,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: `${taxiMonterricoColors.greenLight} !important`,
                  boxShadow: `0 0 0 2px ${taxiMonterricoColors.greenLight}30`,
                  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                    color: taxiMonterricoColors.greenLight,
                  },
                },
                '& input::placeholder': {
                  fontSize: '1.4rem',
                  opacity: 0.7,
                },
                '&.Mui-focused': {
                  borderColor: `${taxiMonterricoColors.green} !important`,
                  boxShadow: `0 0 0 3px ${taxiMonterricoColors.greenLight}30`,
                  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                    color: taxiMonterricoColors.green,
                  },
                },
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          />
          <Tooltip title="Actualizar correos" arrow>
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading}
              sx={{
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: taxiMonterricoColors.greenLight,
                  color: 'white',
                  borderColor: taxiMonterricoColors.greenLight,
                  transform: 'rotate(180deg)',
                  boxShadow: `0 4px 12px ${taxiMonterricoColors.greenLight}40`,
                },
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Divider horizontal */}
        <Divider />

        {/* Lista de emails */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: 1,
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                m: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.error.main,
                boxShadow: `0 4px 12px ${theme.palette.error.main}33`,
                '& .MuiAlert-icon': {
                  fontSize: 28,
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                },
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : emails.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 2,
                py: 6,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : theme.palette.grey[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  fontSize: '64px',
                  lineHeight: 1,
                }}
              >
                📧
              </Box>
              <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                  }}
                >
                  No hay correos para mostrar
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    lineHeight: 1.6,
                    fontSize: { xs: '0.875rem', md: '0.9375rem' },
                  }}
                >
                  {error 
                    ? 'Conecta tu cuenta de Google para comenzar a gestionar tus correos electrónicos.'
                    : 'No hay correos en esta carpeta. Usa el botón "Redactar" para crear un nuevo correo.'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <List sx={{ 
              p: 1, 
              overflow: 'auto', 
              flex: 1, 
              minHeight: 0,
              '& .MuiListItem-root': {
                px: 0,
              },
            }}>
              {emails.map((email) => {
                // Si el email fue enviado (tiene label SENT), mostrar el destinatario
                // Si fue recibido, mostrar el remitente
                const isSent = email.labelIds?.includes('SENT');
                const displayEmail = isSent ? email.to : email.from;
                const displayName = displayEmail.split(/[<>]/)[0].trim() || displayEmail;

                return (
                  <ListItem
                    key={email.id}
                    disablePadding
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                      bgcolor: isUnread(email.labelIds) ? theme.palette.action.hover : 'transparent',
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleEmailClick(email)}
                  >
                    <ListItemButton
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        width: '100%',
                        py: 0.5,
                      }}>
                        <Avatar
                          sx={{
                            bgcolor: taxiMonterricoColors.green,
                            width: 40,
                            height: 40,
                            fontSize: '0.875rem',
                            color: 'white',
                          }}
                        >
                          {getInitials(displayEmail)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isUnread(email.labelIds) ? 600 : 400,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {displayName}
                            </Typography>
                            {isStarred(email.labelIds) && (
                              <Star sx={{ fontSize: 16, color: taxiMonterricoColors.green }} />
                            )}
                          </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isUnread(email.labelIds) ? 600 : 400,
                            color: theme.palette.text.primary,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {email.subject || '(Sin asunto)'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                        >
                          {email.snippet}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        {/* Icono de leído/no leído */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleRead(email, e)}
                          sx={{
                            position: 'relative',
                            '&:hover': {
                              bgcolor: theme.palette.action.hover,
                            },
                          }}
                        >
                          {isUnread(email.labelIds) ? (
                            <MarkEmailUnread 
                              sx={{ 
                                fontSize: 20,
                                color: theme.palette.text.secondary,
                              }} 
                            />
                          ) : (
                            <MarkEmailRead 
                              sx={{ 
                                fontSize: 20,
                                color: theme.palette.mode === 'dark' 
                                  ? 'rgba(144, 202, 249, 0.6)' 
                                  : 'rgba(25, 118, 210, 0.6)',
                              }} 
                            />
                          )}
                          {/* Punto indicador para correos leídos */}
                          {!isUnread(email.labelIds) && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgb(144, 202, 249)' 
                                  : 'rgb(25, 118, 210)',
                              }}
                            />
                          )}
                        </IconButton>
                        
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDate(email.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
                );
              })}
            </List>
          )}

          {/* Controles de paginación */}
          {emails.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: 'transparent',
                flexShrink: 0,
                mt: 'auto',
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Página {currentPage}
                {hasNextPage && ' (más disponible)'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  size="small"
                  sx={{
                    color: currentPage === 1 ? theme.palette.action.disabled : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: currentPage === 1 ? 'transparent' : theme.palette.action.hover,
                    },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  size="small"
                  sx={{
                    color: !hasNextPage ? theme.palette.action.disabled : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: !hasNextPage ? 'transparent' : theme.palette.action.hover,
                    },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        {/* Dialog para ver detalles del email con thread completo */}
        {selectedEmail && emailDetail && (
          <Dialog
            open={!!selectedEmail}
            onClose={() => {
              if (!isReplying) {
                setSelectedEmail(null);
                setEmailDetail(null);
                setThreadMessages([]);
                setIsReplying(false);
                setReplySubject('');
                setReplyBody('');
                setCollapsedMessages(new Set());
              }
            }}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Header del thread */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexShrink: 0 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {emailDetail.subject || '(Sin asunto)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {threadMessages.length} {threadMessages.length === 1 ? 'mensaje' : 'mensajes'} en esta conversación
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {!isReplying && (
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={handleReply}
                      sx={{
                        bgcolor: taxiMonterricoColors.green,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: taxiMonterricoColors.green,
                          opacity: 0.9,
                        },
                      }}
                    >
                      Responder
                    </Button>
                  )}
                  <IconButton
                    onClick={() => {
                      if (!isReplying) {
                        setSelectedEmail(null);
                        setEmailDetail(null);
                        setThreadMessages([]);
                        setIsReplying(false);
                        setReplySubject('');
                        setReplyBody('');
                        setCollapsedMessages(new Set());
                      } else {
                        handleCancelReply();
                      }
                    }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>
              <Divider sx={{ mb: 2, flexShrink: 0 }} />
              
              {/* Área de scroll para los mensajes del thread */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  mb: isReplying ? 2 : 0,
                  minHeight: 0,
                }}
              >
                {loadingThread ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  threadMessages.map((msg: any, index: number) => {
                    const isCollapsed = collapsedMessages.has(msg.id);
                    const isLastMessage = index === threadMessages.length - 1;
                    const senderName = msg.from.split(/[<>]/)[0].trim() || extractEmail(msg.from);
                    const senderInitials = getInitials(msg.from);

                    return (
                      <Box key={msg.id} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.03)' 
                              : 'rgba(0, 0, 0, 0.02)',
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          {/* Avatar */}
                          <Avatar
                            sx={{
                              bgcolor: taxiMonterricoColors.green,
                              width: 40,
                              height: 40,
                              color: 'white',
                              flexShrink: 0,
                            }}
                          >
                            {senderInitials}
                          </Avatar>

                          {/* Contenido del mensaje */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Header del mensaje */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {senderName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(msg.date).toLocaleString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              </Box>
                              {threadMessages.length > 3 && index < threadMessages.length - 3 && (
                                <IconButton
                                  size="small"
                                  onClick={() => toggleMessageCollapse(msg.id)}
                                  sx={{ flexShrink: 0 }}
                                >
                                  {isCollapsed ? <ExpandMore /> : <ExpandLess />}
                                </IconButton>
                              )}
                            </Box>

                            {/* Cuerpo del mensaje */}
                            {!isCollapsed && (
                              <Box
                                sx={{
                                  mt: 1,
                                  '& p': {
                                    marginBottom: 1,
                                  },
                                  '& *': {
                                    maxWidth: '100%',
                                  },
                                }}
                                dangerouslySetInnerHTML={{ __html: msg.body || msg.snippet }}
                              />
                            )}
                            {isCollapsed && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Mensaje colapsado
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {!isLastMessage && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* Área de respuesta inline */}
              {isReplying && (
                <>
                  <Divider sx={{ my: 2, flexShrink: 0 }} />
                  <Box sx={{ flexShrink: 0 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Responder a {extractEmail(emailDetail.from)}
                    </Typography>
                    
                    {/* Campo Asunto */}
                    <TextField
                      label="Asunto"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    {/* Editor de respuesta */}
                    <Box
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                        minHeight: '200px',
                        maxHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        mb: 2,
                      }}
                    >
                      <RichTextEditor
                        value={replyBody}
                        onChange={setReplyBody}
                        placeholder="Escribe tu respuesta..."
                      />
                    </Box>

                    {/* Mensaje de error */}
                    {replyError && (
                      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReplyError('')}>
                        {replyError}
                      </Alert>
                    )}

                    {/* Botones de acción */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        onClick={handleCancelReply}
                        disabled={sendingReply}
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSendReply}
                        variant="contained"
                        startIcon={sendingReply ? <CircularProgress size={16} /> : <Send />}
                        disabled={sendingReply || !replySubject.trim() || !replyBody.trim() || replyBody === '<p><br></p>' || replyBody === '<br>'}
                        sx={{
                          bgcolor: taxiMonterricoColors.green,
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: taxiMonterricoColors.green,
                            opacity: 0.9,
                          },
                        }}
                      >
                        {sendingReply ? 'Enviando...' : 'Enviar'}
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Dialog>
        )}
      </Box>

      {/* Email Composer para correos nuevos */}
      <EmailComposer
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
        }}
        recipientEmail=""
        onSend={handleSendEmail}
      />
      </Paper>
    </Box>
  );
};

export default Emails;
