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
    throw new Error('No hay cuenta de Google conectada. Por favor, conecta tu correo desde Configuración > Perfil > Correo');
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

    // Obtener detalles de cada mensaje
    const messagesWithDetails = await Promise.all(
      messages.map(async (msg: any) => {
        try {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          const headers = messageDetail.data.payload?.headers || [];
          const getHeader = (name: string) => 
            headers.find((h: any) => h.name === name)?.value || '';

          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: messageDetail.data.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            labelIds: messageDetail.data.labelIds || [],
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
    
    if (error.message?.includes('No hay cuenta')) {
      return res.status(401).json({ message: error.message });
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
      
      // Si tiene partes, buscar en ellas
      if (part.parts && part.parts.length > 0) {
        // Buscar primero la parte HTML, luego texto plano
        const htmlPart = part.parts.find((p: any) => p.mimeType === 'text/html');
        const textPart = part.parts.find((p: any) => p.mimeType === 'text/plain');
        
        if (htmlPart?.body?.data) {
          return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        }
        if (textPart?.body?.data) {
          return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
        
        // Si no encuentra, buscar recursivamente
        return part.parts.map((p: any) => extractBody(p)).join('');
      }
      
      // Si es HTML o texto plano directamente
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      
      // Si tiene body.data directamente
      if (part.body?.data) {
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
    
    if (error.message?.includes('No hay cuenta')) {
      return res.status(401).json({ message: error.message });
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

    const threadIds = activities
      .map((a: any) => a.gmailThreadId)
      .filter((id: string) => id !== null && id !== undefined);

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

    // Ordenar por fecha (más reciente primero)
    allMessages.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Aplicar búsqueda si existe
    let filteredMessages = allMessages;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredMessages = allMessages.filter((msg) =>
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
    
    if (error.message?.includes('No hay cuenta')) {
      return res.status(401).json({ message: error.message });
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
    
    if (error.message?.includes('No hay cuenta')) {
      return res.status(401).json({ message: error.message });
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
    const { to, subject, body } = req.body;
    const userId = req.user?.id;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Destinatario, asunto y cuerpo son requeridos' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const gmail = await getAuthenticatedGmailClient(userId);

    // Crear el mensaje en formato RFC 2822
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ].join('\n');

    // Codificar el mensaje en base64url
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Enviar el email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

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

