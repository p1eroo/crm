import express from 'express';
import { google } from 'googleapis';
import { Op } from 'sequelize';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { UserGoogleToken } from '../models/UserGoogleToken';

const router = express.Router();
router.use(authenticateToken);

// Helper function para obtener cliente Gmail autenticado
async function getAuthenticatedGmailClient(userId: number): Promise<any> {
      const userToken = await UserGoogleToken.findOne({
        where: { userId },
      });

      if (!userToken) {
        const error: any = new Error('No hay cuenta de Google conectada. Por favor, conecta tu correo desde Configuración > Perfil > Correo');
        error.isNoGoogleAccount = true; // Marcar como error de falta de cuenta de Google
        throw error;
      }

      // Verificar si el token expiró
      const isExpired = userToken.tokenExpiry && new Date(userToken.tokenExpiry) < new Date();
  
  let tokenToUse = userToken.accessToken;
      
      if (isExpired && userToken.refreshToken) {
        // Refrescar el token
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        if (!clientId || !clientSecret) {
      throw new Error('Google OAuth no está configurado en el servidor');
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        oauth2Client.setCredentials({
          refresh_token: userToken.refreshToken,
        });

        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          tokenToUse = credentials.access_token || userToken.accessToken;
          
          // Actualizar token en la BD
          await userToken.update({
            accessToken: credentials.access_token || userToken.accessToken,
            tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : userToken.tokenExpiry,
          });
        } catch (refreshError) {
          console.error('Error refrescando token:', refreshError);
      throw new Error('Token expirado. Por favor, reconecta tu cuenta desde Configuración > Perfil > Correo');
        }
      } else if (isExpired && !userToken.refreshToken) {
    throw new Error('Token expirado. Por favor, reconecta tu cuenta desde Configuración > Perfil > Correo');
    }

    // Crear cliente OAuth2 con el token del usuario
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: tokenToUse });

    // Crear cliente de Gmail
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Endpoint para listar emails
router.get('/list', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { folder = 'inbox', page = 1, limit = 20, search = '' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const maxResults = limitNumber;
    const pageToken = req.query.pageToken as string | undefined;

    const gmail = await getAuthenticatedGmailClient(userId);

    // Mapear carpetas a queries de Gmail
    let query = '';
    if (folder === 'inbox') {
      query = 'in:inbox';
    } else if (folder === 'sent') {
      query = 'in:sent';
    } else if (folder === 'draft') {
      query = 'in:drafts';
    } else if (folder === 'starred') {
      query = 'is:starred';
    } else if (folder === 'spam') {
      query = 'in:spam';
    } else if (folder === 'trash') {
      query = 'in:trash';
    }

    // Agregar búsqueda si existe
    if (search) {
      query += ` ${search}`;
    }

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
      pageToken,
    });

    const messages = response.data.messages || [];
    const nextPageToken = response.data.nextPageToken;

    // Función para recolectar adjuntos de las partes MIME
    const collectAttachmentNames = (part: any): string[] => {
      const names: string[] = [];
      if (!part) return names;
      if (part.filename && part.filename.length > 0) {
        names.push(part.filename);
      }
      if (part.parts) {
        for (const p of part.parts) {
          names.push(...collectAttachmentNames(p));
        }
      }
      return names;
    };

    // Obtener detalles de cada mensaje
    const messagesWithDetails = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          });

          const headers = messageDetail.data.payload?.headers || [];
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name === name)?.value || '';

          const attachmentNames = collectAttachmentNames(messageDetail.data.payload);

          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: messageDetail.data.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            labelIds: messageDetail.data.labelIds || [],
            hasAttachments: attachmentNames.length > 0,
            attachmentNames,
          };
        } catch (error) {
          console.error(`Error obteniendo mensaje ${msg.id}:`, error);
          return null;
        }
      })
    );

    const validMessages = messagesWithDetails.filter(msg => msg !== null);

    res.json({
      messages: validMessages,
      nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate || 0,
    });
  } catch (error: any) {
    console.error('Error al listar emails:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    
    if (error.code === 403) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a los emails' });
    }

    res.status(500).json({
      message: 'Error al listar los emails',
      error: error.message,
    });
  }
});

// Endpoint para obtener un email específico (debe ir después de rutas específicas como /crm)
router.get('/message/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const gmail = await getAuthenticatedGmailClient(userId);

    const message = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    const headers = message.data.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name === name)?.value || '';

    // Extraer el cuerpo del mensaje
    let body = '';
    
    const extractBody = (part: any): string => {
      if (!part) return '';

      const mime = (part.mimeType || '') as string;

      if (mime.startsWith('application/') || mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')) {
        return '';
      }

      if (part.parts && part.parts.length > 0) {
        const htmlPart = part.parts.find((p: any) => p.mimeType === 'text/html');
        const textPart = part.parts.find((p: any) => p.mimeType === 'text/plain');

        if (htmlPart?.body?.data) {
          return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        }
        if (textPart?.body?.data) {
          return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }

        const textParts = part.parts.filter((p: any) => {
          const m = (p.mimeType || '') as string;
          return m.startsWith('text/') || m.startsWith('multipart/');
        });
        return textParts.map((p: any) => extractBody(p)).join('');
      }

      if (mime === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (mime === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      return '';
    };

    if (message.data.payload) {
      body = extractBody(message.data.payload);
    }

    res.json({
      id: message.data.id,
      threadId: message.data.threadId,
      snippet: message.data.snippet || '',
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      body,
      labelIds: message.data.labelIds || [],
    });
  } catch (error: any) {
    console.error('Error al obtener email:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    
    if (error.code === 404) {
      return res.status(404).json({ message: 'Email no encontrado' });
    }

    res.status(500).json({
      message: 'Error al obtener el email',
      error: error.message,
    });
  }
});

// Endpoint para marcar email como leído/no leído
router.post('/message/:id/read', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const { read } = req.body; // true para marcar como leído, false para no leído

    if (read === undefined || read === null) {
      return res.status(400).json({ message: 'El parámetro "read" es requerido' });
    }

    const gmail = await getAuthenticatedGmailClient(userId);

    try {
      if (read) {
        // Marcar como leído (remover label UNREAD)
        await gmail.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
      } else {
        // Marcar como no leído (agregar label UNREAD)
        await gmail.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: ['UNREAD'],
          },
        });
      }

      // Devolver respuesta exitosa con el estado actualizado
      return res.status(200).json({ 
        success: true,
        message: `Email marcado como ${read ? 'leído' : 'no leído'}`,
        read: read
      });
    } catch (gmailError: any) {
      // Si el error es porque el label ya está/no está presente, considerarlo éxito
      if (gmailError.message?.includes('Invalid label') || 
          gmailError.message?.includes('Label not found')) {
        return res.status(200).json({ 
          success: true,
          message: `Email ya estaba marcado como ${read ? 'leído' : 'no leído'}`,
          read: read
        });
      }
      throw gmailError; // Re-lanzar si es otro tipo de error
    }
  } catch (error: any) {
    console.error('Error al marcar email como leído/no leído:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }

    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }

    if (error.code === 404) {
      return res.status(404).json({ message: 'Email no encontrado' });
    }

    return res.status(500).json({
      message: 'Error al marcar el email',
      error: error.message || 'Error desconocido',
    });
  }
});

// Endpoint para marcar email como favorito/no favorito
router.post('/message/:id/star', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const { starred } = req.body;

    if (starred === undefined || starred === null) {
      return res.status(400).json({ message: 'El parámetro "starred" es requerido' });
    }

    const gmail = await getAuthenticatedGmailClient(userId);

    if (starred) {
      await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: { addLabelIds: ['STARRED'] },
      });
    } else {
      await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: { removeLabelIds: ['STARRED'] },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Email ${starred ? 'marcado como favorito' : 'desmarcado de favoritos'}`,
      starred,
    });
  } catch (error: any) {
    console.error('Error al marcar favorito:', error);

    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ message: error.message, code: 'NO_GOOGLE_ACCOUNT' });
    }
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    if (error.code === 404) {
      return res.status(404).json({ message: 'Email no encontrado' });
    }

    return res.status(500).json({ message: 'Error al marcar favorito', error: error.message });
  }
});

// Endpoint para obtener todo el thread (hilo completo) de un email
router.get('/thread/:threadId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { threadId } = req.params;
    const gmail = await getAuthenticatedGmailClient(userId);

    // Obtener el thread completo
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    const messages = thread.data.messages || [];
    
    // Función para extraer el cuerpo del mensaje
    const extractBody = (part: any): string => {
      if (!part) return '';

      const mime = (part.mimeType || '') as string;

      if (mime.startsWith('application/') || mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')) {
        return '';
      }

      if (part.parts && part.parts.length > 0) {
        const htmlPart = part.parts.find((p: any) => p.mimeType === 'text/html');
        const textPart = part.parts.find((p: any) => p.mimeType === 'text/plain');

        if (htmlPart?.body?.data) {
          return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        }
        if (textPart?.body?.data) {
          return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }

        const textParts = part.parts.filter((p: any) => {
          const m = (p.mimeType || '') as string;
          return m.startsWith('text/') || m.startsWith('multipart/');
        });
        return textParts.map((p: any) => extractBody(p)).join('');
      }

      if (mime === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (mime === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      return '';
    };

    // Función para recolectar adjuntos con metadatos
    const collectAttachments = (part: any): { attachmentId: string; name: string; mimeType: string; size: number }[] => {
      const atts: { attachmentId: string; name: string; mimeType: string; size: number }[] = [];
      if (!part) return atts;
      if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
        atts.push({
          attachmentId: part.body.attachmentId,
          name: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        });
      }
      if (part.parts) {
        for (const p of part.parts) {
          atts.push(...collectAttachments(p));
        }
      }
      return atts;
    };

    // Procesar cada mensaje del thread
    const messagesWithDetails = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const headers = msg.payload?.headers || [];
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name === name)?.value || '';

          let body = '';
          if (msg.payload) {
            body = extractBody(msg.payload);
          }

          const attachments = collectAttachments(msg.payload);

          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: msg.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            body,
            labelIds: msg.labelIds || [],
            attachments,
          };
        } catch (error) {
          console.error(`Error procesando mensaje ${msg.id}:`, error);
          return null;
        }
      })
    );

    // Filtrar mensajes nulos y ordenar por fecha (más antiguo primero para mostrar cronológicamente)
    const validMessages = messagesWithDetails
      .filter(msg => msg !== null)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Orden cronológico ascendente
      });

    res.json({
      threadId,
      messages: validMessages,
    });
  } catch (error: any) {
    console.error('Error al obtener thread:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    
    if (error.code === 404) {
      return res.status(404).json({ message: 'Thread no encontrado' });
    }

    res.status(500).json({
      message: 'Error al obtener el thread',
      error: error.message,
    });
  }
});

// Endpoint para listar emails que tienen adjuntos
router.get('/attachments', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { search = '' } = req.query;
    const gmail = await getAuthenticatedGmailClient(userId);

    let query = 'has:attachment';
    if (search) {
      query += ` ${search}`;
    }

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = response.data.messages || [];

    const collectAttachments = (part: any): { attachmentId: string; name: string; mimeType: string; size: number }[] => {
      const atts: { attachmentId: string; name: string; mimeType: string; size: number }[] = [];
      if (!part) return atts;
      if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
        atts.push({
          attachmentId: part.body.attachmentId,
          name: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        });
      }
      if (part.parts) {
        for (const p of part.parts) {
          atts.push(...collectAttachments(p));
        }
      }
      return atts;
    };

    const allAttachments: any[] = [];

    await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          });

          const headers = messageDetail.data.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
          const attachments = collectAttachments(messageDetail.data.payload);

          for (const att of attachments) {
            allAttachments.push({
              messageId: msg.id,
              threadId: msg.threadId,
              from: getHeader('From'),
              to: getHeader('To'),
              subject: getHeader('Subject'),
              date: getHeader('Date'),
              labelIds: messageDetail.data.labelIds || [],
              attachmentId: att.attachmentId,
              name: att.name,
              mimeType: att.mimeType,
              size: att.size,
            });
          }
        } catch (error) {
          console.error(`Error procesando mensaje ${msg.id}:`, error);
        }
      })
    );

    allAttachments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ attachments: allAttachments });
  } catch (error: any) {
    console.error('Error al listar adjuntos:', error);

    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ message: error.message, code: 'NO_GOOGLE_ACCOUNT' });
    }
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }

    res.status(500).json({ message: 'Error al listar adjuntos', error: error.message });
  }
});

// Endpoint para descargar un adjunto específico
router.get('/attachment/:messageId/:attachmentId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { messageId, attachmentId } = req.params;
    const gmail = await getAuthenticatedGmailClient(userId);

    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    const data = attachment.data.data;
    if (!data) {
      return res.status(404).json({ message: 'Adjunto no encontrado' });
    }

    res.json({ data });
  } catch (error: any) {
    console.error('Error al descargar adjunto:', error);

    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ message: error.message, code: 'NO_GOOGLE_ACCOUNT' });
    }
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }

    res.status(500).json({ message: 'Error al descargar el adjunto', error: error.message });
  }
});

// Endpoint para obtener emails del CRM (enviados desde el CRM y sus respuestas)
router.get('/crm', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const maxResults = limitNumber;
    const pageToken = req.query.pageToken as string | undefined;

    const gmail = await getAuthenticatedGmailClient(userId);

    // Obtener todos los threadIds de las actividades de tipo email del usuario
    const { Activity } = await import('../models/Activity');
    const activities = await Activity.findAll({
      where: {
        userId,
        type: 'email',
        gmailThreadId: { [Op.ne]: null } as any,
      },
      attributes: ['gmailThreadId'],
      raw: true,
    });

    // Obtener threadIds únicos usando Set para evitar duplicados
    const threadIds = Array.from(new Set(
      activities
        .map((a: any) => a.gmailThreadId)
        .filter((id: string) => id !== null && id !== undefined)
    ));

    if (threadIds.length === 0) {
      return res.json({
        messages: [],
        nextPageToken: undefined,
        resultSizeEstimate: 0,
      });
    }

    // Construir query de Gmail para buscar emails de esos threads
    // Gmail API no permite buscar directamente por múltiples threadIds en una query
    // Necesitamos obtener los mensajes de cada thread
    const allMessages: any[] = [];
    
    // Obtener mensajes de cada thread (limitado a los primeros para evitar demasiadas llamadas)
    const threadsToFetch = threadIds.slice(0, 50); // Limitar a 50 threads para evitar timeout
    
    for (const threadId of threadsToFetch) {
      try {
        const threadResponse = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });

        const messages = threadResponse.data.messages || [];
        for (const msg of messages) {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          const headers = messageDetail.data.payload?.headers || [];
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name === name)?.value || '';

          allMessages.push({
            id: msg.id,
            threadId: msg.threadId,
            snippet: messageDetail.data.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            labelIds: messageDetail.data.labelIds || [],
          });
        }
      } catch (error) {
        console.error(`Error obteniendo thread ${threadId}:`, error);
      }
    }

    // Eliminar mensajes duplicados por id (por si acaso)
    const uniqueMessages = Array.from(
      new Map(allMessages.map(msg => [msg.id, msg])).values()
    );

    // Ordenar por fecha (más reciente primero)
    uniqueMessages.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Aplicar búsqueda si existe
    let filteredMessages = uniqueMessages;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredMessages = uniqueMessages.filter((msg) =>
        msg.subject.toLowerCase().includes(searchLower) ||
        msg.from.toLowerCase().includes(searchLower) ||
        msg.to.toLowerCase().includes(searchLower) ||
        msg.snippet.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar paginación
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      nextPageToken: endIndex < filteredMessages.length ? `page_${pageNumber + 1}` : undefined,
      resultSizeEstimate: filteredMessages.length,
    });
  } catch (error: any) {
    console.error('Error al obtener emails del CRM:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    
    if (error.code === 403) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a los emails' });
    }

    res.status(500).json({
      message: 'Error al obtener los emails del CRM',
      error: error.message,
    });
  }
});

// Endpoint para obtener emails favoritos del CRM
router.get('/crm/starred', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const maxResults = limitNumber;
    const pageToken = req.query.pageToken as string | undefined;

    const gmail = await getAuthenticatedGmailClient(userId);

    // Obtener todos los threadIds de las actividades de tipo email del usuario
    const { Activity } = await import('../models/Activity');
    const activities = await Activity.findAll({
      where: {
        userId,
        type: 'email',
        gmailThreadId: { [Op.ne]: null } as any,
      },
      attributes: ['gmailThreadId'],
      raw: true,
    });

    // Obtener threadIds únicos usando Set para evitar duplicados
    const threadIds = Array.from(new Set(
      activities
        .map((a: any) => a.gmailThreadId)
        .filter((id: string) => id !== null && id !== undefined)
    ));

    if (threadIds.length === 0) {
      return res.json({
        messages: [],
        nextPageToken: undefined,
        resultSizeEstimate: 0,
      });
    }

    // Obtener mensajes de cada thread y filtrar solo los favoritos
    const allMessages: any[] = [];
    
    // Obtener mensajes de cada thread (limitado a los primeros para evitar demasiadas llamadas)
    const threadsToFetch = threadIds.slice(0, 50); // Limitar a 50 threads para evitar timeout
    
    for (const threadId of threadsToFetch) {
      try {
        const threadResponse = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });

        const messages = threadResponse.data.messages || [];
        for (const msg of messages) {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          // Filtrar solo los mensajes que tienen el label STARRED
          const labelIds = messageDetail.data.labelIds || [];
          if (!labelIds.includes('STARRED')) {
            continue; // Saltar mensajes que no están marcados como favoritos
          }

          const headers = messageDetail.data.payload?.headers || [];
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name === name)?.value || '';

          allMessages.push({
            id: msg.id,
            threadId: msg.threadId,
            snippet: messageDetail.data.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            labelIds: labelIds,
          });
        }
      } catch (error) {
        console.error(`Error obteniendo thread ${threadId}:`, error);
      }
    }

    // Eliminar mensajes duplicados por id (por si acaso)
    const uniqueMessages = Array.from(
      new Map(allMessages.map(msg => [msg.id, msg])).values()
    );

    // Ordenar por fecha (más reciente primero)
    uniqueMessages.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Aplicar búsqueda si existe
    let filteredMessages = uniqueMessages;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredMessages = uniqueMessages.filter((msg) =>
        msg.subject.toLowerCase().includes(searchLower) ||
        msg.from.toLowerCase().includes(searchLower) ||
        msg.to.toLowerCase().includes(searchLower) ||
        msg.snippet.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar paginación
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      nextPageToken: endIndex < filteredMessages.length ? `page_${pageNumber + 1}` : undefined,
      resultSizeEstimate: filteredMessages.length,
    });
  } catch (error: any) {
    console.error('Error al obtener emails favoritos del CRM:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    
    if (error.code === 403) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a los emails' });
    }

    res.status(500).json({
      message: 'Error al obtener los emails favoritos del CRM',
      error: error.message,
    });
  }
});

// Endpoint para obtener conteos por carpeta
router.get('/folders/counts', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const gmail = await getAuthenticatedGmailClient(userId);

    // Obtener conteos para cada carpeta
    const folders = [
      { id: 'inbox', query: 'in:inbox is:unread' },
      { id: 'sent', query: 'in:sent' },
      { id: 'draft', query: 'in:drafts' },
      { id: 'starred', query: 'is:starred' },
      { id: 'spam', query: 'in:spam' },
      { id: 'trash', query: 'in:trash' },
      { id: 'crm', query: 'crm' }, // Se calculará de forma especial
    ];

    const counts = await Promise.all(
      folders.map(async (folder) => {
        try {
          if (folder.id === 'crm') {
            // Para CRM, contar los threads únicos de actividades
            const { Activity } = await import('../models/Activity');
            const activities = await Activity.findAll({
              where: {
                userId,
                type: 'email',
                gmailThreadId: { [Op.ne]: null } as any,
              },
              attributes: ['gmailThreadId'],
              raw: true,
            });
            const uniqueThreads = new Set(
              activities
                .map((a: any) => a.gmailThreadId)
                .filter((id: string) => id !== null && id !== undefined)
            );
            return {
              id: folder.id,
              count: uniqueThreads.size,
            };
          } else if (folder.id === 'starred') {
            // Para favoritos, contar solo los del CRM que están marcados como favoritos
            const { Activity } = await import('../models/Activity');
            const activities = await Activity.findAll({
              where: {
                userId,
                type: 'email',
                gmailThreadId: { [Op.ne]: null } as any,
              },
              attributes: ['gmailThreadId'],
              raw: true,
            });

            const threadIds = Array.from(new Set(
              activities
                .map((a: any) => a.gmailThreadId)
                .filter((id: string) => id !== null && id !== undefined)
            ));

            if (threadIds.length === 0) {
              return {
                id: folder.id,
                count: 0,
              };
            }

            // Contar mensajes favoritos en esos threads
            let starredCount = 0;
            const threadsToCheck = threadIds.slice(0, 50); // Limitar para evitar timeout
            
            for (const threadId of threadsToCheck) {
              try {
                const threadResponse = await gmail.users.threads.get({
                  userId: 'me',
                  id: threadId,
                  format: 'metadata',
                });

                const messages = threadResponse.data.messages || [];
                for (const msg of messages) {
                  const messageDetail = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id!,
                    format: 'metadata',
                  });

                  const labelIds = messageDetail.data.labelIds || [];
                  if (labelIds.includes('STARRED')) {
                    starredCount++;
                  }
                }
              } catch (error) {
                console.error(`Error obteniendo thread ${threadId}:`, error);
              }
            }

            return {
              id: folder.id,
              count: starredCount,
            };
          } else {
            const response = await gmail.users.messages.list({
              userId: 'me',
              q: folder.query,
              maxResults: 1,
            });
            return {
              id: folder.id,
              count: response.data.resultSizeEstimate || 0,
            };
          }
        } catch (error) {
          console.error(`Error obteniendo conteo para ${folder.id}:`, error);
          return {
            id: folder.id,
            count: 0,
          };
        }
      })
    );

    res.json({ counts });
  } catch (error: any) {
    console.error('Error al obtener conteos:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }

    res.status(500).json({
      message: 'Error al obtener los conteos',
      error: error.message,
    });
  }
});

// Endpoint para enviar email usando Gmail API
router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { to, subject, body, threadId: replyThreadId, messageId: replyMessageId, attachments } = req.body;
    const userId = req.user?.id;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Destinatario, asunto y cuerpo son requeridos' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const gmail = await getAuthenticatedGmailClient(userId);

    // Si es una respuesta, obtener el Message-ID del email original
    let inReplyTo = '';
    let references = '';
    if (replyMessageId && replyThreadId) {
      try {
        const originalMessage = await gmail.users.messages.get({
          userId: 'me',
          id: replyMessageId,
          format: 'metadata',
          metadataHeaders: ['Message-ID'],
        });
        const headers = originalMessage.data.payload?.headers || [];
        const messageId = headers.find((h: any) => h.name === 'Message-ID')?.value || '';
        if (messageId) {
          inReplyTo = messageId;
          references = messageId;
        }
      } catch (error) {
        console.error('Error obteniendo Message-ID del email original:', error);
      }
    }

    let rawMessage: string;
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;

    if (hasAttachments) {
      // Construir email MIME multipart con adjuntos reales
      const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const headerLines = [
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ];

      if (inReplyTo) {
        headerLines.push(`In-Reply-To: ${inReplyTo}`);
        headerLines.push(`References: ${references}`);
      }

      const messageParts = [
        headerLines.join('\r\n'),
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(body).toString('base64').match(/.{1,76}/g)!.join('\r\n'),
      ];

      for (const att of attachments) {
        const filename = att.name || 'attachment';
        const mimeType = att.type || 'application/octet-stream';
        const encodedFilename = `=?UTF-8?B?${Buffer.from(filename).toString('base64')}?=`;

        messageParts.push(
          `--${boundary}`,
          `Content-Type: ${mimeType}; name="${encodedFilename}"`,
          `Content-Disposition: attachment; filename="${encodedFilename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          (att.data as string).match(/.{1,76}/g)!.join('\r\n'),
        );
      }

      messageParts.push(`--${boundary}--`);
      rawMessage = messageParts.join('\r\n');
    } else {
      // Email simple sin adjuntos
      const headerLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
      ];

      if (inReplyTo) {
        headerLines.push(`In-Reply-To: ${inReplyTo}`);
        headerLines.push(`References: ${references}`);
      }

      headerLines.push('');
      headerLines.push(body);
      rawMessage = headerLines.join('\n');
    }

    // Codificar el mensaje en base64url
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Enviar el email con threadId si es una respuesta
    const sendRequest: any = {
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    };

    // Si es una respuesta, incluir el threadId para mantener el hilo
    if (replyThreadId) {
      sendRequest.requestBody.threadId = replyThreadId;
    }

    const response = await gmail.users.messages.send(sendRequest);

    // Obtener el threadId del mensaje enviado
    let threadId: string | undefined;
    try {
      const messageDetail = await gmail.users.messages.get({
        userId: 'me',
        id: response.data.id!,
        format: 'metadata',
      });
      threadId = messageDetail.data.threadId;
    } catch (error) {
      console.error('Error obteniendo threadId:', error);
    }

    res.json({
      success: true,
      messageId: response.data.id,
      threadId: threadId,
      message: 'Email enviado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    
    if (error.isNoGoogleAccount || error.message?.includes('No hay cuenta')) {
      return res.status(400).json({ 
        message: error.message,
        code: 'NO_GOOGLE_ACCOUNT'
      });
    }
    
    if (error.code === 401) {
      return res.status(401).json({ message: 'Token de acceso inválido o expirado' });
    }
    
    if (error.code === 403) {
      return res.status(403).json({ message: 'No tienes permisos para enviar emails' });
    }

    res.status(500).json({
      message: 'Error al enviar el email',
      error: error.message,
    });
  }
});

export default router;

