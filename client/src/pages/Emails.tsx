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
  Checkbox,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Refresh,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  StarBorder,
  Send,
  ExpandMore,
  ExpandLess,
  Email as EmailIcon,
  LocalOffer,
  Inbox,
  ArrowDropDown,
  MoreVert,
  Add,
  AttachFile,
  InsertDriveFile,
  PictureAsPdf,
  Image as ImageIcon,
  Download,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { Mail } from 'lucide-react';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import api from '../config/api';
import EmailComposer from '../components/EmailComposer';
import RichTextEditor, { AttachmentFile } from '../components/RichTextEditor';

interface EmailMessage {
  id: string;
  draftId?: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labelIds: string[];
  hasAttachments?: boolean;
  attachmentNames?: string[];
}

interface FolderCount {
  id: string;
  count: number;
}

const Emails: React.FC = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectMenuAnchor, setSelectMenuAnchor] = useState<null | HTMLElement>(null);
  const [labelMenuAnchor, setLabelMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [addLabelOpen, setAddLabelOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#4285f4');
  const LABEL_COLORS = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#a142f4'];
  const [customLabels, setCustomLabels] = useState<{ name: string; color: string }[]>([
    { name: 'Personal', color: '#4285f4' },
    { name: 'Trabajo', color: '#1a73e8' },
  ]);
  const emailsPerPage = 13;
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crmEmailCount, setCrmEmailCount] = useState(0);
  const [starredCount, setStarredCount] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'starred'>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [emailDetail, setEmailDetail] = useState<any>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isReplying, setIsReplying] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const [connectingEmail, setConnectingEmail] = useState(false);

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
          const realEmails = response.data.messages || [];
          const mockEmails: EmailMessage[] = [
            { id: 'mock-1', threadId: 't1', from: 'María García <maria.garcia@empresa.com>', to: '', subject: 'Reunión de proyecto', snippet: 'Hola equipo, les confirmo la reunión del martes a las 10am para revisar los avances del proyecto', date: '2026-02-22T14:30:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-2', threadId: 't2', from: 'Carlos López <carlos.lopez@ventas.com>', to: '', subject: 'Propuesta comercial Q1', snippet: 'Adjunto la propuesta comercial actualizada para el primer trimestre con los nuevos precios', date: '2026-02-22T11:15:00Z', labelIds: ['INBOX'] },
            { id: 'mock-3', threadId: 't3', from: 'Ana Torres <ana.torres@rrhh.com>', to: '', subject: 'Actualización de políticas', snippet: 'Estimados, se han actualizado las políticas internas de la empresa. Por favor revisar el documento', date: '2026-02-21T16:45:00Z', labelIds: ['INBOX', 'UNREAD', 'STARRED'] },
            { id: 'mock-4', threadId: 't4', from: 'Pedro Ramírez <pedro@logistica.com>', to: '', subject: 'Envío pendiente #4521', snippet: 'El envío número 4521 se encuentra en tránsito y llegará mañana por la tarde según tracking', date: '2026-02-21T09:20:00Z', labelIds: ['INBOX'] },
            { id: 'mock-5', threadId: 't5', from: 'Sofía Mendoza <sofia.m@marketing.com>', to: '', subject: 'Campaña redes sociales', snippet: 'Los resultados de la campaña de febrero superaron las expectativas con un 35% más de engagement', date: '2026-02-20T18:00:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-6', threadId: 't6', from: 'Roberto Díaz <roberto@finanzas.com>', to: '', subject: 'Reporte mensual de gastos', snippet: 'Aquí les comparto el reporte de gastos del mes de enero para su revisión y aprobación', date: '2026-02-20T10:30:00Z', labelIds: ['INBOX'] },
            { id: 'mock-7', threadId: 't7', from: 'Laura Vega <laura.vega@soporte.com>', to: '', subject: 'Ticket #892 resuelto', snippet: 'El ticket de soporte #892 ha sido resuelto exitosamente. El cliente confirmó la solución', date: '2026-02-19T15:10:00Z', labelIds: ['INBOX', 'STARRED'] },
            { id: 'mock-8', threadId: 't8', from: 'Diego Herrera <diego@desarrollo.com>', to: '', subject: 'Deploy v2.5 completado', snippet: 'El deployment de la versión 2.5 se completó sin errores. Todos los tests pasaron correctamente', date: '2026-02-19T08:45:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-9', threadId: 't9', from: 'Valentina Cruz <vale@diseño.com>', to: '', subject: 'Mockups nueva landing', snippet: 'Les comparto los mockups de la nueva landing page para revisión del equipo de producto', date: '2026-02-18T13:20:00Z', labelIds: ['INBOX'] },
            { id: 'mock-10', threadId: 't10', from: 'Andrés Morales <andres@partners.com>', to: '', subject: 'Alianza estratégica', snippet: 'Nos gustaría explorar una posible alianza estratégica entre nuestras empresas para el 2026', date: '2026-02-18T09:00:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-11', threadId: 't11', from: 'Camila Rojas <camila@contabilidad.com>', to: '', subject: 'Facturas pendientes febrero', snippet: 'Les recuerdo que hay 3 facturas pendientes de aprobación que vencen esta semana', date: '2026-02-17T16:30:00Z', labelIds: ['INBOX'] },
            { id: 'mock-12', threadId: 't12', from: 'Fernando Castillo <fer@tecnologia.com>', to: '', subject: 'Migración base de datos', snippet: 'La migración de la base de datos se programó para el sábado a las 2am con ventana de 4 horas', date: '2026-02-17T11:00:00Z', labelIds: ['INBOX', 'UNREAD', 'STARRED'] },
            { id: 'mock-13', threadId: 't13', from: 'Isabella Vargas <isa@clientes.com>', to: '', subject: 'Feedback cliente VIP', snippet: 'El cliente Premium Solutions dejó un feedback muy positivo sobre el servicio recibido este mes', date: '2026-02-16T14:20:00Z', labelIds: ['INBOX'] },
            { id: 'mock-14', threadId: 't14', from: 'Mateo Jiménez <mateo@legal.com>', to: '', subject: 'Contrato de renovación', snippet: 'Adjunto el borrador del contrato de renovación para revisión antes de enviarlo al cliente', date: '2026-02-16T09:45:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-15', threadId: 't15', from: 'Luciana Peña <lu@eventos.com>', to: '', subject: 'Evento corporativo marzo', snippet: 'Confirmamos el evento corporativo para el 15 de marzo en el Hotel Central con capacidad para 200', date: '2026-02-15T17:10:00Z', labelIds: ['INBOX', 'STARRED'] },
            { id: 'mock-16', threadId: 't16', from: 'Sebastián Ríos <seba@operaciones.com>', to: '', subject: 'Inventario actualizado', snippet: 'Se completó la actualización del inventario. Hay 12 productos con stock bajo que requieren reorden', date: '2026-02-15T10:30:00Z', labelIds: ['INBOX'] },
            { id: 'mock-17', threadId: 't17', from: 'Daniela Ortiz <dani@capacitacion.com>', to: '', subject: 'Taller de liderazgo', snippet: 'Inscripciones abiertas para el taller de liderazgo del próximo viernes. Cupos limitados a 25', date: '2026-02-14T15:50:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-18', threadId: 't18', from: 'Nicolás Salazar <nico@ventas.com>', to: '', subject: 'Meta de ventas superada', snippet: 'El equipo de ventas superó la meta mensual en un 18%. Felicitaciones a todo el equipo', date: '2026-02-14T08:15:00Z', labelIds: ['INBOX'] },
            { id: 'mock-19', threadId: 't19', from: 'Paula Medina <paula@calidad.com>', to: '', subject: 'Auditoría interna Q1', snippet: 'Se programó la auditoría interna del primer trimestre para la segunda semana de marzo', date: '2026-02-13T13:40:00Z', labelIds: ['INBOX', 'UNREAD'] },
            { id: 'mock-20', threadId: 't20', from: 'Gabriel Suárez <gabi@infraestructura.com>', to: '', subject: 'Mantenimiento servidores', snippet: 'Se realizará mantenimiento preventivo en los servidores principales el domingo de 1am a 5am', date: '2026-02-13T07:30:00Z', labelIds: ['INBOX', 'STARRED'] },
          ];
          setEmails([...realEmails, ...mockEmails]);
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

  const handleEmailClick = async (email: EmailMessage) => {
    setSelectedEmail(email);
    setIsReplying(false);
    setReplySubject('');
    setReplyBody('');
    setReplyError('');

    if (email.id.startsWith('mock-')) {
      const mockBody = `<p>Hola,</p><p>${email.snippet}</p><p>Saludos cordiales,<br/>${email.from.split(/[<>]/)[0].trim()}</p>`;
      setEmailDetail({
        id: email.id,
        threadId: email.threadId,
        from: email.from,
        to: email.to,
        subject: email.subject,
        date: email.date,
        body: mockBody,
        snippet: email.snippet,
        labelIds: email.labelIds,
      });
      setThreadMessages([{
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        date: email.date,
        body: mockBody,
        snippet: email.snippet,
        labelIds: email.labelIds,
      }]);
      setLoadingThread(false);
      return;
    }

    setLoadingThread(true);
    try {
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
    setReplyBody('');
    setReplyAttachments([]);
    setIsReplying(true);
    setReplyError('');
  };

  // Función para cancelar respuesta
  const handleCancelReply = () => {
    setIsReplying(false);
    setReplySubject('');
    setReplyBody('');
    setReplyAttachments([]);
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
        attachments: replyAttachments.map(a => ({ name: a.name, type: a.type, data: a.data })),
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
      setReplyAttachments([]);
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

  // Verificar si el error es de cuenta no conectada
  const isNoAccountError = error && (
    error.includes('No hay cuenta de Google conectada') ||
    error.includes('no hay cuenta de Google conectada') ||
    error.includes('conecta tu correo')
  );

  // Función para conectar cuenta de Google
  const handleEmailConnect = async () => {
    setConnectingEmail(true);
    try {
      const response = await api.get("/google/auth", {
        params: {
          returnOrigin: window.location.origin,
          returnPath: window.location.pathname || "/emails",
        },
      });
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error("No se pudo obtener la URL de autorización");
      }
    } catch (err: any) {
      console.error("Error iniciando conexión con Google:", err);
      setError(err.response?.data?.message || "Error al conectar con Google. Por favor, intenta nuevamente.");
      setConnectingEmail(false);
    }
  };

  // Si no hay cuenta conectada, mostrar solo la vista de conexión
  if (isNoAccountError && !loading) {
    return (
      <Box sx={{ flex: 1, pb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
            borderRadius: 2,
            px: 6,
            py: 8,
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: '1500px',
            width: '90%',
            mx: 'auto',
            minHeight: 'calc(100vh - 150px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              py: 10,
              px: 4,
              width: '100%',
            }}
          >
            <Box
              sx={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : theme.palette.grey[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={72} color={theme.palette.text.secondary} strokeWidth={1.5} />
            </Box>
            <Box sx={{ textAlign: 'center', maxWidth: '700px', width: '100%' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                }}
              >
                No hay cuenta conectada
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  lineHeight: 1.6,
                  mb: 4,
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                }}
              >
                Conecta tu cuenta de Google para comenzar a gestionar tus correos electrónicos.
              </Typography>
              <Button
                variant="contained"
                onClick={handleEmailConnect}
                disabled={connectingEmail}
                startIcon={connectingEmail ? <CircularProgress size={20} /> : <Send />}
                sx={{
                  bgcolor: 'transparent',
                  color: taxiMonterricoColors.green,
                  border: `2px solid ${taxiMonterricoColors.green}`,
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? `${taxiMonterricoColors.green}20` : `${taxiMonterricoColors.green}15`,
                    borderColor: taxiMonterricoColors.greenDark,
                    color: taxiMonterricoColors.greenDark,
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    opacity: 0.7,
                  },
                }}
              >
                {connectingEmail ? 'Conectando...' : 'Conectar cuenta de Google'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, pb: 4, display: 'flex', flexDirection: 'column' }}>
      {!selectedEmail && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1.25, md: 1.5 },
            mb: 4,
            bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : '#fafafa',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.1375rem' },
                color: '#828690',
              }}
            >
              Correo
            </Typography>
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.1375rem' },
                color: taxiMonterricoColors.green,
              }}
            >
              /
            </Typography>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: { xs: '1rem', md: '1.1375rem' },
                color: taxiMonterricoColors.green,
              }}
            >
              {selectedFolder === 'inbox' ? 'Buzón' : 'Favoritos'}
            </Typography>
          </Box>
        </Box>
      )}
      <Paper
        elevation={0}
        sx={{
          ...pageStyles.card,
          borderRadius: 2,
          px: 0,
          pt: 0,
          pb: 0,
          flex: 1,
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          width: '100%',
          bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          maxHeight: selectedEmail ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
          minHeight: selectedEmail ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
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
        {/* Botón Componer - único CTA destacado */}
        <Tooltip title="Crear nuevo correo" arrow>
          <Button
            variant="contained"
            onClick={() => setComposeOpen(true)}
            sx={{
              bgcolor: taxiMonterricoColors.green,
              color: 'white',
              textTransform: 'none',
              px: 2,
              py: 0.75,
              mt: 1,
              borderRadius: 1.5,
              width: '85%',
              alignSelf: 'center',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: taxiMonterricoColors.greenDark,
                boxShadow: 'none',
              },
            }}
          >
            Redactar
          </Button>
        </Tooltip>

        {/* Opciones de carpeta - estilo simple como Sidebar principal */}
        <Box sx={{ mt: 2, mx: 2 }}>
          <ListItemButton
            selected={selectedFolder === 'inbox'}
            onClick={() => { setSelectedFolder('inbox'); setCurrentPage(1); setSelectedEmail(null); setEmailDetail(null); setThreadMessages([]); }}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                color: taxiMonterricoColors.green,
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924' },
              },
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              '&:not(.Mui-selected)': {
                color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.secondary,
              },
            }}
          >
            <Inbox sx={{ fontSize: 20, mr: 1, color: selectedFolder === 'inbox' ? taxiMonterricoColors.green : (theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.secondary) }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1 }}>
              Inbox
            </Typography>
            {crmEmailCount > 0 && (
              <Box sx={{ bgcolor: taxiMonterricoColors.green, color: '#ffffff', borderRadius: 1, px: 0.75, py: 0.15, fontSize: '0.75rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                {crmEmailCount}
              </Box>
            )}
          </ListItemButton>
          <ListItemButton
            selected={selectedFolder === 'starred'}
            onClick={() => { setSelectedFolder('starred'); setCurrentPage(1); setSelectedEmail(null); setEmailDetail(null); setThreadMessages([]); }}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924',
                color: taxiMonterricoColors.green,
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#1a2e2a' : '#5cdf9924' },
              },
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              '&:not(.Mui-selected)': {
                color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.secondary,
              },
            }}
          >
            <StarBorder sx={{ fontSize: 20, mr: 1, color: selectedFolder === 'starred' ? taxiMonterricoColors.green : (theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.secondary) }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1 }}>
              Favoritos
            </Typography>
            {starredCount > 0 && (
              <Box sx={{ bgcolor: taxiMonterricoColors.green, color: '#ffffff', borderRadius: 1, px: 0.75, py: 0.15, fontSize: '0.75rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                {starredCount}
              </Box>
            )}
          </ListItemButton>
        </Box>

        <Divider sx={{ my: 2, mx: 2.5 }} />

        <Box sx={{ mx: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: taxiMonterricoColors.green,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
              }}
            >
              Etiquetas
            </Typography>
            <IconButton
              size="small"
              onClick={() => { setNewLabelName(''); setNewLabelColor('#4285f4'); setAddLabelOpen(true); }}
              sx={{
                p: 0.25,
                color: taxiMonterricoColors.green,
                '&:hover': { bgcolor: `${taxiMonterricoColors.green}15` },
              }}
            >
              <Add sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            {customLabels.map((label) => (
              <Box key={label.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 1, borderRadius: 1.5, cursor: 'pointer', '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <LocalOffer sx={{ fontSize: 20, color: label.color }} />
                <Typography variant="body2" sx={{ fontSize: '0.9375rem', color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.secondary }}>
                  {label.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Divider vertical */}
      <Divider orientation="vertical" flexItem />

      {/* Área principal - Vista de lista (sin email seleccionado) */}
      {!selectedEmail && (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* Barra de búsqueda y acciones */}
          <Box
            sx={{
              bgcolor: 'transparent',
              borderRadius: 0,
              pt: 2.5,
              pb: 1.5,
              px: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: `${taxiMonterricoColors.green}15`,
                borderRadius: 1.5,
                px: 0.25,
              }}
            >
              <Checkbox
                size="small"
                checked={emails.length > 0 && selectedEmails.size === emails.length}
                indeterminate={selectedEmails.size > 0 && selectedEmails.size < emails.length}
                onChange={() => {
                  if (selectedEmails.size === emails.length) {
                    setSelectedEmails(new Set());
                  } else {
                    setSelectedEmails(new Set(emails.map((e) => e.id)));
                  }
                }}
                sx={{
                  p: 0.5,
                  color: taxiMonterricoColors.green,
                  '&.Mui-checked': { color: taxiMonterricoColors.green },
                  '&.MuiCheckbox-indeterminate': { color: taxiMonterricoColors.green },
                  '& .MuiSvgIcon-root': { fontSize: 25 },
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => setSelectMenuAnchor(e.currentTarget)}
                sx={{
                  p: 0.25,
                  color: taxiMonterricoColors.green,
                  '&:hover': { bgcolor: 'transparent' },
                }}
              >
                <ArrowDropDown sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
            <Menu
              anchorEl={selectMenuAnchor}
              open={Boolean(selectMenuAnchor)}
              onClose={() => setSelectMenuAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  minWidth: 140,
                  mt: 0.5,
                },
              }}
            >
              <MenuItem onClick={() => setSelectMenuAnchor(null)} sx={{ fontSize: '0.875rem' }}>
                Todos
              </MenuItem>
              <MenuItem onClick={() => setSelectMenuAnchor(null)} sx={{ fontSize: '0.875rem' }}>
                Leídos
              </MenuItem>
              <MenuItem onClick={() => setSelectMenuAnchor(null)} sx={{ fontSize: '0.875rem' }}>
                No leídos
              </MenuItem>
            </Menu>
            <Tooltip title="Actualizar correos" arrow>
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  bgcolor: `${taxiMonterricoColors.green}15`,
                  borderRadius: 1.5,
                  p: 0.75,
                  color: taxiMonterricoColors.green,
                  '&:hover': {
                    bgcolor: `${taxiMonterricoColors.green}25`,
                  },
                  '&:disabled': { opacity: 0.5 },
                }}
              >
                <Refresh sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={(e) => setLabelMenuAnchor(e.currentTarget)}
              disabled={selectedEmails.size === 0}
              sx={{
                bgcolor: `${taxiMonterricoColors.green}15`,
                borderRadius: 1.5,
                p: 0.75,
                color: taxiMonterricoColors.green,
                '&:hover': {
                  bgcolor: `${taxiMonterricoColors.green}25`,
                },
                '&:disabled': { opacity: 0.4 },
              }}
            >
              <MoreVert sx={{ fontSize: 22 }} />
            </IconButton>
            <Menu
              anchorEl={labelMenuAnchor}
              open={Boolean(labelMenuAnchor)}
              onClose={() => setLabelMenuAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  minWidth: 180,
                  mt: 0.5,
                },
              }}
            >
              <MenuItem disabled sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, opacity: '1 !important', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Etiquetar como
              </MenuItem>
              {customLabels.map((label) => (
                <MenuItem key={label.name} onClick={() => setLabelMenuAnchor(null)} sx={{ fontSize: '0.875rem', gap: 1.5 }}>
                  <LocalOffer sx={{ fontSize: 18, color: label.color }} />
                  {label.name}
                </MenuItem>
              ))}
            </Menu>
            <Box sx={{ flex: 1 }} />
            <TextField
              placeholder="Buscar correo"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.text.secondary, fontSize: 22 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 320,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                  borderRadius: 1.5,
                  '& input': { py: '13px' },
                  bgcolor: theme.palette.background.paper,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.text.secondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: 1,
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Box>

          {/* Lista de emails - vista de línea */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              p: 1,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : emails.length === 0 ? (
              <Box sx={{ ...pageStyles.emptyState, bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper, py: 8, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
                      lineHeight: 1,
                    }}
                  >
                    <EmailIcon sx={{ fontSize: 64, color: theme.palette.text.secondary }} />
                  </Box>
                  <Box sx={{ textAlign: 'center', maxWidth: '400px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: theme.palette.text.secondary,
                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                      }}
                    >
                      No hay correos para mostrar
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                      }}
                    >
                      No hay correos en esta carpeta. Usa el botón "Redactar" para crear un nuevo correo.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <List sx={{ 
                p: 0, 
                overflow: 'auto', 
                flex: 1, 
                minHeight: 0,
                '& .MuiListItem-root': { px: 0 },
              }}>
                {emails.slice((currentPage - 1) * emailsPerPage, currentPage * emailsPerPage).map((email) => {
                  const isSent = email.labelIds?.includes('SENT');
                  const displayEmail = isSent ? email.to : email.from;
                  const displayName = displayEmail.split(/[<>]/)[0].trim() || displayEmail;

                  return (
                    <ListItem
                      key={email.id}
                      disablePadding
                      sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:last-child': { borderBottom: 'none' },
                        bgcolor: 'transparent',
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        cursor: 'pointer',
                      }}
                      onClick={() => handleEmailClick(email)}
                    >
                      <ListItemButton
                        sx={{
                          py: 0.75,
                          px: 1.5,
                          '&:hover': { bgcolor: 'transparent' },
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%',
                          gap: 0.5,
                          minWidth: 0,
                        }}>
                          <Checkbox
                            checked={selectedEmails.has(email.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => {
                              setSelectedEmails((prev) => {
                                const next = new Set(prev);
                                if (next.has(email.id)) {
                                  next.delete(email.id);
                                } else {
                                  next.add(email.id);
                                }
                                return next;
                              });
                            }}
                            sx={{
                              p: 0.5,
                              color: theme.palette.text.disabled,
                              '&.Mui-checked': { color: taxiMonterricoColors.green },
                              '& .MuiSvgIcon-root': { fontSize: 25 },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); }}
                            sx={{ p: 0.5 }}
                          >
                            {isStarred(email.labelIds) ? (
                              <Star sx={{ fontSize: 25, color: '#f4b400' }} />
                            ) : (
                              <StarBorder sx={{ fontSize: 25, color: theme.palette.text.disabled }} />
                            )}
                          </IconButton>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isUnread(email.labelIds) ? 600 : 400,
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#333',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              fontSize: '0.9375rem',
                              minWidth: 180,
                              maxWidth: 250,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              ml: 0.5,
                              mr: 8,
                            }}
                          >
                            {displayName}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              fontWeight: isUnread(email.labelIds) ? 600 : 400,
                              color: '#828690',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.9375rem',
                              flexShrink: 0,
                              maxWidth: 300,
                            }}
                          >
                            {email.subject || '(Sin asunto)'}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              color: '#828690',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.9375rem',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {' - '}{email.snippet}
                          </Typography>
                          {email.hasAttachments && (
                            <AttachFile sx={{ fontSize: 16, color: '#828690', flexShrink: 0, ml: 0.5, transform: 'rotate(45deg)' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#828690',
                              whiteSpace: 'nowrap',
                              fontSize: '0.875rem',
                              flexShrink: 0,
                              ml: 1,
                            }}
                          >
                            {formatDate(email.date)}
                          </Typography>
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
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: 'transparent',
                  flexShrink: 0,
                  mt: 'auto',
                  gap: 0.5,
                }}
              >
                {(() => {
                  const totalPages = Math.ceil(emails.length / emailsPerPage);
                  const isFirstPage = currentPage === 1;
                  const isLastPage = currentPage >= totalPages;
                  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                  return (
                    <>
                      <IconButton
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={isFirstPage}
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: isFirstPage ? 'transparent' : `${taxiMonterricoColors.green}15`,
                          border: `1px solid ${isFirstPage ? theme.palette.divider : taxiMonterricoColors.green}`,
                          color: isFirstPage ? theme.palette.action.disabled : taxiMonterricoColors.green,
                          '&:hover': { bgcolor: `${taxiMonterricoColors.green}25` },
                        }}
                      >
                        <ChevronLeft sx={{ fontSize: 20 }} />
                      </IconButton>
                      {pages.map((page) => (
                        <Box
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: page === currentPage ? 600 : 400,
                            bgcolor: page === currentPage ? taxiMonterricoColors.green : 'transparent',
                            color: page === currentPage ? '#ffffff' : theme.palette.text.secondary,
                            '&:hover': {
                              bgcolor: page === currentPage ? taxiMonterricoColors.green : theme.palette.action.hover,
                            },
                          }}
                        >
                          {page}
                        </Box>
                      ))}
                      <IconButton
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={isLastPage}
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: isLastPage ? 'transparent' : `${taxiMonterricoColors.green}15`,
                          border: `1px solid ${isLastPage ? theme.palette.divider : taxiMonterricoColors.green}`,
                          color: isLastPage ? theme.palette.action.disabled : taxiMonterricoColors.green,
                          '&:hover': { bgcolor: `${taxiMonterricoColors.green}25` },
                        }}
                      >
                        <ChevronRight sx={{ fontSize: 20 }} />
                      </IconButton>
                    </>
                  );
                })()}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Vista de detalle - columna central (lista card) + columna derecha (detalle) */}
      {selectedEmail && (
        <>
          {/* Columna central - lista de emails en formato card */}
          <Box sx={{
            width: 340,
            minWidth: 300,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: `1px solid ${theme.palette.divider}`,
          }}>
            {/* Header con búsqueda */}
            <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {selectedFolder === 'inbox' ? 'Inbox' : 'Favoritos'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedEmail(null);
                    setEmailDetail(null);
                    setThreadMessages([]);
                    setIsReplying(false);
                    setReplySubject('');
                    setReplyBody('');
                    setCollapsedMessages(new Set());
                  }}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <ChevronLeft sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
              <TextField
                placeholder="Buscar correo..."
                value={searchTerm}
                onChange={handleSearch}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8125rem',
                    borderRadius: 1.5,
                    '& input': { py: '8px' },
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: theme.palette.divider },
                    '&.Mui-focused fieldset': { borderWidth: 1, borderColor: theme.palette.primary.main },
                  },
                }}
              />
            </Box>

            {/* Lista de emails en card */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
              {emails.slice((currentPage - 1) * emailsPerPage, currentPage * emailsPerPage).map((email) => {
                const isSent = email.labelIds?.includes('SENT');
                const displayEmail = isSent ? email.to : email.from;
                const displayName = displayEmail.split(/[<>]/)[0].trim() || displayEmail;
                const isActive = selectedEmail?.id === email.id;

                return (
                  <Box
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      borderRadius: 2,
                      mb: 0.5,
                      borderLeft: isActive ? `3px solid ${taxiMonterricoColors.green}` : '3px solid transparent',
                      bgcolor: isActive
                        ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : `${taxiMonterricoColors.green}08`)
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isActive
                          ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : `${taxiMonterricoColors.green}12`)
                          : theme.palette.action.hover,
                      },
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{
                        fontWeight: isUnread(email.labelIds) ? 600 : 500,
                        fontSize: '0.875rem',
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        mr: 1,
                      }}>
                        {displayName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        {email.hasAttachments && (
                          <AttachFile sx={{ fontSize: 14, color: '#828690', transform: 'rotate(45deg)' }} />
                        )}
                        {isStarred(email.labelIds) && (
                          <Star sx={{ fontSize: 16, color: '#f4b400' }} />
                        )}
                        <Typography sx={{ fontSize: '0.75rem', color: '#828690', whiteSpace: 'nowrap' }}>
                          {formatDate(email.date)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{
                      fontWeight: isUnread(email.labelIds) ? 600 : 400,
                      fontSize: '0.8125rem',
                      color: taxiMonterricoColors.green,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 0.25,
                    }}>
                      {email.subject || '(Sin asunto)'}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.78125rem',
                      color: '#828690',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4,
                    }}>
                      {email.snippet}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Columna derecha - detalle del email */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            {emailDetail ? (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
                {/* Mensajes del thread */}
                <Box
                  sx={{
                    overflow: 'auto',
                    mb: isReplying ? 2 : 0,
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
                        <Box key={msg.id} sx={{ mb: 3 }}>
                          {/* Fila: Avatar + Nombre (izq) | Botón Responder (der) */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  bgcolor: taxiMonterricoColors.green,
                                  width: 40,
                                  height: 40,
                                  fontSize: '0.9rem',
                                  color: 'white',
                                  flexShrink: 0,
                                }}
                              >
                                {senderInitials}
                              </Avatar>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                                {senderName}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              {!isReplying && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Send sx={{ fontSize: 14 }} />}
                                  onClick={handleReply}
                                  sx={{
                                    bgcolor: taxiMonterricoColors.green,
                                    textTransform: 'none',
                                    fontSize: '0.8125rem',
                                    py: 0.5,
                                    px: 1.5,
                                    '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
                                  }}
                                >
                                  Responder
                                </Button>
                              )}
                              {threadMessages.length > 3 && index < threadMessages.length - 3 && (
                                <IconButton
                                  size="small"
                                  onClick={() => toggleMessageCollapse(msg.id)}
                                  sx={{ flexShrink: 0 }}
                                >
                                  {isCollapsed ? <ExpandMore sx={{ fontSize: 18 }} /> : <ExpandLess sx={{ fontSize: 18 }} />}
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          {/* Fecha debajo, alineada a la derecha */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                              {new Date(msg.date).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>

                          {/* Contenido del mensaje */}
                          {!isCollapsed && (
                            <Box
                              sx={{
                                fontSize: '0.9375rem',
                                lineHeight: 1.7,
                                '& p': { marginBottom: 1 },
                                '& *': { maxWidth: '100%' },
                                wordBreak: 'break-word',
                              }}
                              dangerouslySetInnerHTML={{ __html: msg.body || msg.snippet }}
                            />
                          )}
                          {isCollapsed && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8125rem' }}>
                              Mensaje colapsado
                            </Typography>
                          )}

                          {/* Adjuntos del mensaje */}
                          {!isCollapsed && msg.attachments && msg.attachments.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {msg.attachments.map((att: any, attIdx: number) => {
                                const getAttIcon = () => {
                                  if ((att.mimeType || '').startsWith('image/')) return <ImageIcon sx={{ fontSize: 20 }} />;
                                  if (att.mimeType === 'application/pdf') return <PictureAsPdf sx={{ fontSize: 20, color: '#e53935' }} />;
                                  return <InsertDriveFile sx={{ fontSize: 20 }} />;
                                };
                                const formatAttSize = (bytes: number) => {
                                  if (!bytes || bytes === 0) return '';
                                  if (bytes < 1024) return `${bytes} B`;
                                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
                                  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                                };
                                const handleDownload = async () => {
                                  try {
                                    const response = await api.get(`/emails/attachment/${msg.id}/${att.attachmentId}`);
                                    const base64 = (response.data.data || '').replace(/-/g, '+').replace(/_/g, '/');
                                    const byteCharacters = atob(base64);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: att.mimeType || 'application/octet-stream' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = att.name || 'attachment';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Error descargando adjunto:', err);
                                  }
                                };
                                return (
                                  <Box
                                    key={`${att.attachmentId}-${attIdx}`}
                                    onClick={handleDownload}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 2,
                                      px: 1.5,
                                      py: 1,
                                      cursor: 'pointer',
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
                                      maxWidth: 260,
                                      '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#eeeeee',
                                      },
                                      transition: 'background-color 0.15s',
                                    }}
                                  >
                                    {getAttIcon()}
                                    <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                      <Typography noWrap sx={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.3 }}>
                                        {att.name}
                                      </Typography>
                                      {formatAttSize(att.size) && (
                                        <Typography sx={{ fontSize: '0.6875rem', color: theme.palette.text.secondary, lineHeight: 1.2 }}>
                                          {formatAttSize(att.size)}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Download sx={{ fontSize: 18, color: theme.palette.text.secondary, flexShrink: 0 }} />
                                  </Box>
                                );
                              })}
                            </Box>
                          )}

                          {!isLastMessage && <Divider sx={{ mt: 3 }} />}
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
                      <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.9375rem' }}>
                        Responder a {extractEmail(emailDetail.from)}
                      </Typography>
                      <TextField
                        label="Asunto"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      <Box
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          minHeight: '180px',
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
                          attachments={replyAttachments}
                          onAttachmentsChange={setReplyAttachments}
                        />
                      </Box>
                      {replyError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReplyError('')}>
                          {replyError}
                        </Alert>
                      )}
                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                        <Button
                          onClick={handleCancelReply}
                          disabled={sendingReply}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'none' }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSendReply}
                          size="small"
                          variant="contained"
                          startIcon={sendingReply ? <CircularProgress size={14} /> : <Send sx={{ fontSize: 16 }} />}
                          disabled={sendingReply || !replySubject.trim() || !replyBody.trim() || replyBody === '<p><br></p>' || replyBody === '<br>'}
                          sx={{
                            bgcolor: taxiMonterricoColors.green,
                            textTransform: 'none',
                            '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
                          }}
                        >
                          {sendingReply ? 'Enviando...' : 'Enviar'}
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Email Composer - solo registra actividad (sin envío por Gmail) */}
      <EmailComposer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        recipientEmail=""
        registerOnly
        onSave={() => {
          handleRefresh();
        }}
      />
      </Paper>

      <Dialog
        open={addLabelOpen}
        onClose={() => setAddLabelOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 360,
            p: 3,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', mb: 2.5 }}>
          Nueva etiqueta
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Nombre de la etiqueta"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
            },
          }}
        />
        <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary, mb: 1.5 }}>
          Color
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          {LABEL_COLORS.map((color) => (
            <Box
              key={color}
              onClick={() => setNewLabelColor(color)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: color,
                cursor: 'pointer',
                border: newLabelColor === color ? `3px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#333'}` : '3px solid transparent',
                transition: 'border 0.15s ease',
                '&:hover': { opacity: 0.85 },
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={() => setAddLabelOpen(false)}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!newLabelName.trim()}
            onClick={() => {
              if (newLabelName.trim()) {
                setCustomLabels((prev) => [...prev, { name: newLabelName.trim(), color: newLabelColor }]);
                setAddLabelOpen(false);
              }
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: taxiMonterricoColors.green,
              '&:hover': { bgcolor: taxiMonterricoColors.greenDark },
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            Crear
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Emails;
