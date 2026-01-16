import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
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
  Mail,
  Send,
  Drafts,
  Star,
  Report,
  Delete,
  Refresh,
  MoreVert,
  Search,
  Add,
  Close,
  ChevronLeft,
  ChevronRight,
  Business,
} from '@mui/icons-material';
import { taxiMonterricoColors } from '../theme/colors';
import api from '../config/api';
import EmailComposer from '../components/EmailComposer';

interface Email {
  id: string;
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
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [folderCounts, setFolderCounts] = useState<FolderCount[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailDetail, setEmailDetail] = useState<any>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [tokenHistory, setTokenHistory] = useState<(string | undefined)[]>([undefined]);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const emailsPerPage = 20;

  const folders = [
    { id: 'inbox', label: 'Bandeja de entrada', icon: <Mail /> },
    { id: 'sent', label: 'Enviados', icon: <Send /> },
    { id: 'draft', label: 'Borradores', icon: <Drafts /> },
    { id: 'starred', label: 'Destacados', icon: <Star /> },
    { id: 'crm', label: 'CRM', icon: <Business /> },
    { id: 'spam', label: 'Spam', icon: <Report /> },
    { id: 'trash', label: 'Papelera', icon: <Delete /> },
  ];

  const getFolderCount = (folderId: string): number => {
    const folder = folderCounts.find(f => f.id === folderId);
    return folder?.count || 0;
  };


  const fetchFolderCounts = useCallback(async () => {
    try {
      const response = await api.get('/emails/folders/counts');
      setFolderCounts(response.data.counts || []);
    } catch (err: any) {
      console.error('Error fetching folder counts:', err);
    }
  }, []);

  // Resetear y cargar cuando cambia la carpeta o búsqueda
  useEffect(() => {
    setTokenHistory([undefined]);
    setCurrentTokenIndex(0);
    const loadEmails = async () => {
      setLoading(true);
      setError('');
      try {
        // Si es la carpeta CRM, usar endpoint especial
        const endpoint = selectedFolder === 'crm' ? '/emails/crm' : '/emails/list';
        const response = await api.get(endpoint, {
          params: {
            folder: selectedFolder,
            page: 1,
            limit: emailsPerPage,
            search: searchTerm,
          },
        });
        setEmails(response.data.messages || []);
        // Para CRM, la paginación es diferente (usa números de página)
        if (selectedFolder === 'crm') {
          setHasNextPage(!!response.data.nextPageToken);
        } else {
          setHasNextPage(!!response.data.nextPageToken);
          const newHistory = [undefined];
          if (response.data.nextPageToken) {
            newHistory.push(response.data.nextPageToken);
          }
          setTokenHistory(newHistory);
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
  }, [selectedFolder, searchTerm]);
  
  // Cargar emails cuando cambia el índice del token (navegación manual)
  useEffect(() => {
    if (currentTokenIndex > 0 && tokenHistory.length > currentTokenIndex && selectedFolder !== 'crm') {
      const loadEmails = async () => {
        setLoading(true);
        setError('');
        try {
          const token = tokenHistory[currentTokenIndex];
          const response = await api.get('/emails/list', {
            params: {
              folder: selectedFolder,
              page: 1,
              limit: emailsPerPage,
              search: searchTerm,
              pageToken: token,
            },
          });
          setEmails(response.data.messages || []);
          setHasNextPage(!!response.data.nextPageToken);
          // Si hay un nuevo token y estamos al final del historial, agregarlo
          if (response.data.nextPageToken && currentTokenIndex === tokenHistory.length - 1) {
            setTokenHistory(prev => [...prev, response.data.nextPageToken]);
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
    } else if (selectedFolder === 'crm' && currentTokenIndex > 0) {
      // Para CRM, usar paginación numérica
      const loadEmails = async () => {
        setLoading(true);
        setError('');
        try {
          const page = currentTokenIndex + 1; // currentTokenIndex 0 = página 1
          const response = await api.get('/emails/crm', {
            params: {
              page,
              limit: emailsPerPage,
              search: searchTerm,
            },
          });
          setEmails(response.data.messages || []);
          setHasNextPage(!!response.data.nextPageToken);
        } catch (err: any) {
          console.error('Error fetching emails:', err);
          setError(err.response?.data?.message || 'Error al cargar los correos');
          setEmails([]);
        } finally {
          setLoading(false);
        }
      };
      loadEmails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTokenIndex]);

  useEffect(() => {
    fetchFolderCounts();
    // Refrescar conteos cada 30 segundos
    const interval = setInterval(fetchFolderCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchFolderCounts]);

  const handleFolderChange = (folderId: string) => {
    setSelectedFolder(folderId);
    setSearchTerm('');
    // El historial se resetea en el useEffect
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      // Avanzar al siguiente índice
      // Si el token ya existe en el historial, solo avanzamos
      // Si no existe, fetchEmails lo agregará cuando se ejecute
      if (currentTokenIndex < tokenHistory.length - 1) {
        setCurrentTokenIndex(prev => prev + 1);
      } else {
        // Necesitamos esperar a que fetchEmails agregue el token
        // Por ahora avanzamos el índice, y fetchEmails manejará el token
        setCurrentTokenIndex(prev => prev + 1);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentTokenIndex > 0) {
      setCurrentTokenIndex(prev => prev - 1);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      if (selectedFolder === 'crm') {
        // Para CRM, usar paginación numérica
        const page = currentTokenIndex + 1;
        const response = await api.get('/emails/crm', {
          params: {
            page,
            limit: emailsPerPage,
            search: searchTerm,
          },
        });
        setEmails(response.data.messages || []);
        setHasNextPage(!!response.data.nextPageToken);
      } else {
        // Para otras carpetas, usar tokens
        const token = currentTokenIndex > 0 && tokenHistory.length > currentTokenIndex 
          ? tokenHistory[currentTokenIndex] 
          : undefined;
        
        const response = await api.get('/emails/list', {
          params: {
            folder: selectedFolder,
            page: 1,
            limit: emailsPerPage,
            search: searchTerm,
            pageToken: token,
          },
        });
        
        setEmails(response.data.messages || []);
        setHasNextPage(!!response.data.nextPageToken);
        
        // Actualizar el historial si estamos en la primera página
        if (currentTokenIndex === 0) {
          const newHistory = [undefined];
          if (response.data.nextPageToken) {
            newHistory.push(response.data.nextPageToken);
          }
          setTokenHistory(newHistory);
        } else if (response.data.nextPageToken && currentTokenIndex === tokenHistory.length - 1) {
          // Si avanzamos y hay un nuevo token, agregarlo al historial
          setTokenHistory(prev => [...prev, response.data.nextPageToken]);
        }
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
    setSelectedEmail(email);
    try {
      const response = await api.get(`/emails/message/${email.id}`);
      setEmailDetail(response.data);
    } catch (err: any) {
      console.error('Error fetching email detail:', err);
      setError(err.response?.data?.message || 'Error al cargar el correo');
    }
  };

  const handleSendEmail = async (emailData: { to: string; subject: string; body: string }) => {
    try {
      await api.post('/emails/send', emailData);
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

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100%', 
      gap: 2,
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* Sidebar izquierdo */}
      <Box
        sx={{
          width: 320,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {/* Botón Componer */}
        <Button
          variant="contained"
          startIcon={<Add />}
          fullWidth
          onClick={() => setComposeOpen(true)}
          sx={{
            bgcolor: taxiMonterricoColors.green,
            textTransform: 'none',
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              bgcolor: taxiMonterricoColors.green,
              opacity: 0.9,
            },
          }}
        >
          Redactar
        </Button>

        <Divider />

        {/* Lista de carpetas */}
        <List sx={{ flex: 1, p: 0 }}>
          {folders.map((folder) => {
            const count = getFolderCount(folder.id);
            return (
              <ListItem key={folder.id} disablePadding>
                <ListItemButton
                  selected={selectedFolder === folder.id}
                  onClick={() => handleFolderChange(folder.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: `${taxiMonterricoColors.green}10`,
                      borderLeft: `3px solid ${taxiMonterricoColors.green}`,
                      '&:hover': {
                        bgcolor: `${taxiMonterricoColors.green}15`,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: selectedFolder === folder.id ? taxiMonterricoColors.green : theme.palette.text.secondary,
                      minWidth: 40,
                    }}
                  >
                    {folder.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: selectedFolder === folder.id ? 600 : 400,
                    }}
                  />
                  {count > 0 && (
                    <Badge
                      badgeContent={count}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.75rem',
                          minWidth: 18,
                          height: 18,
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

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
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <TextField
            placeholder="Buscar correo"
            value={searchTerm}
            onChange={handleSearch}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
          <IconButton>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Lista de emails */}
        <Paper
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
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
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No hay correos para mostrar
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, overflow: 'auto', flex: 1 }}>
              {emails.map((email) => {
                // Determinar qué mostrar según la carpeta
                // En "sent" y "crm" mostramos el destinatario, en otras carpetas el remitente
                const displayEmail = (selectedFolder === 'sent' || selectedFolder === 'crm') ? email.to : email.from;
                const displayName = displayEmail.split(/[<>]/)[0].trim() || displayEmail;

                return (
                  <ListItem
                    key={email.id}
                    disablePadding
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      bgcolor: isUnread(email.labelIds) ? theme.palette.action.hover : 'transparent',
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleEmailClick(email)}
                  >
                    <ListItemButton>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar
                          sx={{
                            bgcolor: taxiMonterricoColors.green,
                            width: 40,
                            height: 40,
                            fontSize: '0.875rem',
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
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Página {currentTokenIndex + 1}
                {hasNextPage && ' (más disponible)'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handlePreviousPage}
                  disabled={currentTokenIndex === 0}
                  size="small"
                  sx={{
                    color: currentTokenIndex === 0 ? theme.palette.action.disabled : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: currentTokenIndex === 0 ? 'transparent' : theme.palette.action.hover,
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
        </Paper>

        {/* Dialog para ver detalles del email */}
        {selectedEmail && emailDetail && (
          <Dialog
            open={!!selectedEmail}
            onClose={() => {
              setSelectedEmail(null);
              setEmailDetail(null);
            }}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                maxHeight: '90vh',
              },
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {emailDetail.subject || '(Sin asunto)'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>De:</strong> {emailDetail.from}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Para:</strong> {emailDetail.to}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(emailDetail.date).toLocaleString('es-ES')}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setSelectedEmail(null);
                    setEmailDetail(null);
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  maxHeight: '60vh',
                  overflow: 'auto',
                  '& p': {
                    marginBottom: 1,
                  },
                }}
                dangerouslySetInnerHTML={{ __html: emailDetail.body || emailDetail.snippet }}
              />
            </Box>
          </Dialog>
        )}
      </Box>

      {/* Email Composer */}
      <EmailComposer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        recipientEmail=""
        onSend={handleSendEmail}
      />
    </Box>
  );
};

export default Emails;
