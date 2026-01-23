"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const sequelize_1 = require("sequelize");
const auth_1 = require("../middleware/auth");
const UserGoogleToken_1 = require("../models/UserGoogleToken");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Helper function para obtener cliente Gmail autenticado
async function getAuthenticatedGmailClient(userId) {
    const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
        where: { userId },
    });
    if (!userToken) {
        const error = new Error('No hay cuenta de Google conectada. Por favor, conecta tu correo desde Configuración > Perfil > Correo');
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
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
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
        }
        catch (refreshError) {
            console.error('Error refrescando token:', refreshError);
            throw new Error('Token expirado. Por favor, reconecta tu cuenta desde Configuración > Perfil > Correo');
        }
    }
    else if (isExpired && !userToken.refreshToken) {
        throw new Error('Token expirado. Por favor, reconecta tu cuenta desde Configuración > Perfil > Correo');
    }
    // Crear cliente OAuth2 con el token del usuario
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: tokenToUse });
    // Crear cliente de Gmail
    return googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
}
// Endpoint para listar emails
router.get('/list', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { folder = 'inbox', page = 1, limit = 20, search = '' } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const maxResults = limitNumber;
        const pageToken = req.query.pageToken;
        const gmail = await getAuthenticatedGmailClient(userId);
        // Mapear carpetas a queries de Gmail
        let query = '';
        if (folder === 'inbox') {
            query = 'in:inbox';
        }
        else if (folder === 'sent') {
            query = 'in:sent';
        }
        else if (folder === 'draft') {
            query = 'in:drafts';
        }
        else if (folder === 'starred') {
            query = 'is:starred';
        }
        else if (folder === 'spam') {
            query = 'in:spam';
        }
        else if (folder === 'trash') {
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
        const messagesWithDetails = await Promise.all(messages.map(async (msg) => {
            try {
                const messageDetail = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'metadata',
                    metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                });
                const headers = messageDetail.data.payload?.headers || [];
                const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';
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
            }
            catch (error) {
                console.error(`Error obteniendo mensaje ${msg.id}:`, error);
                return null;
            }
        }));
        const validMessages = messagesWithDetails.filter(msg => msg !== null);
        res.json({
            messages: validMessages,
            nextPageToken,
            resultSizeEstimate: response.data.resultSizeEstimate || 0,
        });
    }
    catch (error) {
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
router.get('/message/:id', async (req, res) => {
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
        const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';
        // Extraer el cuerpo del mensaje
        let body = '';
        const extractBody = (part) => {
            if (!part)
                return '';
            // Si tiene partes, buscar en ellas
            if (part.parts && part.parts.length > 0) {
                // Buscar primero la parte HTML, luego texto plano
                const htmlPart = part.parts.find((p) => p.mimeType === 'text/html');
                const textPart = part.parts.find((p) => p.mimeType === 'text/plain');
                if (htmlPart?.body?.data) {
                    return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
                }
                if (textPart?.body?.data) {
                    return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
                // Si no encuentra, buscar recursivamente
                return part.parts.map((p) => extractBody(p)).join('');
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
    }
    catch (error) {
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
router.post('/message/:id/read', async (req, res) => {
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
            }
            else {
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
        }
        catch (gmailError) {
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
    }
    catch (error) {
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
// Endpoint para obtener todo el thread (hilo completo) de un email
router.get('/thread/:threadId', async (req, res) => {
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
        const extractBody = (part) => {
            if (!part)
                return '';
            if (part.parts && part.parts.length > 0) {
                const htmlPart = part.parts.find((p) => p.mimeType === 'text/html');
                const textPart = part.parts.find((p) => p.mimeType === 'text/plain');
                if (htmlPart?.body?.data) {
                    return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
                }
                if (textPart?.body?.data) {
                    return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
                return part.parts.map((p) => extractBody(p)).join('');
            }
            if (part.mimeType === 'text/html' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            if (part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            return '';
        };
        // Procesar cada mensaje del thread
        const messagesWithDetails = await Promise.all(messages.map(async (msg) => {
            try {
                const headers = msg.payload?.headers || [];
                const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';
                let body = '';
                if (msg.payload) {
                    body = extractBody(msg.payload);
                }
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
                };
            }
            catch (error) {
                console.error(`Error procesando mensaje ${msg.id}:`, error);
                return null;
            }
        }));
        // Filtrar mensajes nulos y ordenar por fecha (más antiguo primero para mostrar cronológicamente)
        const validMessages = messagesWithDetails
            .filter(msg => msg !== null)
            .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB; // Orden cronológico ascendente
        });
        res.json({
            threadId,
            messages: validMessages,
        });
    }
    catch (error) {
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
// Endpoint para obtener emails del CRM (enviados desde el CRM y sus respuestas)
router.get('/crm', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { page = 1, limit = 20, search = '' } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const maxResults = limitNumber;
        const pageToken = req.query.pageToken;
        const gmail = await getAuthenticatedGmailClient(userId);
        // Obtener todos los threadIds de las actividades de tipo email del usuario
        const { Activity } = await Promise.resolve().then(() => __importStar(require('../models/Activity')));
        const activities = await Activity.findAll({
            where: {
                userId,
                type: 'email',
                gmailThreadId: { [sequelize_1.Op.ne]: null },
            },
            attributes: ['gmailThreadId'],
            raw: true,
        });
        // Obtener threadIds únicos usando Set para evitar duplicados
        const threadIds = Array.from(new Set(activities
            .map((a) => a.gmailThreadId)
            .filter((id) => id !== null && id !== undefined)));
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
        const allMessages = [];
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
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                    });
                    const headers = messageDetail.data.payload?.headers || [];
                    const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';
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
            }
            catch (error) {
                console.error(`Error obteniendo thread ${threadId}:`, error);
            }
        }
        // Eliminar mensajes duplicados por id (por si acaso)
        const uniqueMessages = Array.from(new Map(allMessages.map(msg => [msg.id, msg])).values());
        // Ordenar por fecha (más reciente primero)
        uniqueMessages.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
        // Aplicar búsqueda si existe
        let filteredMessages = uniqueMessages;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredMessages = uniqueMessages.filter((msg) => msg.subject.toLowerCase().includes(searchLower) ||
                msg.from.toLowerCase().includes(searchLower) ||
                msg.to.toLowerCase().includes(searchLower) ||
                msg.snippet.toLowerCase().includes(searchLower));
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
    }
    catch (error) {
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
router.get('/crm/starred', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { page = 1, limit = 20, search = '' } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const maxResults = limitNumber;
        const pageToken = req.query.pageToken;
        const gmail = await getAuthenticatedGmailClient(userId);
        // Obtener todos los threadIds de las actividades de tipo email del usuario
        const { Activity } = await Promise.resolve().then(() => __importStar(require('../models/Activity')));
        const activities = await Activity.findAll({
            where: {
                userId,
                type: 'email',
                gmailThreadId: { [sequelize_1.Op.ne]: null },
            },
            attributes: ['gmailThreadId'],
            raw: true,
        });
        // Obtener threadIds únicos usando Set para evitar duplicados
        const threadIds = Array.from(new Set(activities
            .map((a) => a.gmailThreadId)
            .filter((id) => id !== null && id !== undefined)));
        if (threadIds.length === 0) {
            return res.json({
                messages: [],
                nextPageToken: undefined,
                resultSizeEstimate: 0,
            });
        }
        // Obtener mensajes de cada thread y filtrar solo los favoritos
        const allMessages = [];
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
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                    });
                    // Filtrar solo los mensajes que tienen el label STARRED
                    const labelIds = messageDetail.data.labelIds || [];
                    if (!labelIds.includes('STARRED')) {
                        continue; // Saltar mensajes que no están marcados como favoritos
                    }
                    const headers = messageDetail.data.payload?.headers || [];
                    const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';
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
            }
            catch (error) {
                console.error(`Error obteniendo thread ${threadId}:`, error);
            }
        }
        // Eliminar mensajes duplicados por id (por si acaso)
        const uniqueMessages = Array.from(new Map(allMessages.map(msg => [msg.id, msg])).values());
        // Ordenar por fecha (más reciente primero)
        uniqueMessages.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
        // Aplicar búsqueda si existe
        let filteredMessages = uniqueMessages;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredMessages = uniqueMessages.filter((msg) => msg.subject.toLowerCase().includes(searchLower) ||
                msg.from.toLowerCase().includes(searchLower) ||
                msg.to.toLowerCase().includes(searchLower) ||
                msg.snippet.toLowerCase().includes(searchLower));
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
    }
    catch (error) {
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
router.get('/folders/counts', async (req, res) => {
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
        const counts = await Promise.all(folders.map(async (folder) => {
            try {
                if (folder.id === 'crm') {
                    // Para CRM, contar los threads únicos de actividades
                    const { Activity } = await Promise.resolve().then(() => __importStar(require('../models/Activity')));
                    const activities = await Activity.findAll({
                        where: {
                            userId,
                            type: 'email',
                            gmailThreadId: { [sequelize_1.Op.ne]: null },
                        },
                        attributes: ['gmailThreadId'],
                        raw: true,
                    });
                    const uniqueThreads = new Set(activities
                        .map((a) => a.gmailThreadId)
                        .filter((id) => id !== null && id !== undefined));
                    return {
                        id: folder.id,
                        count: uniqueThreads.size,
                    };
                }
                else if (folder.id === 'starred') {
                    // Para favoritos, contar solo los del CRM que están marcados como favoritos
                    const { Activity } = await Promise.resolve().then(() => __importStar(require('../models/Activity')));
                    const activities = await Activity.findAll({
                        where: {
                            userId,
                            type: 'email',
                            gmailThreadId: { [sequelize_1.Op.ne]: null },
                        },
                        attributes: ['gmailThreadId'],
                        raw: true,
                    });
                    const threadIds = Array.from(new Set(activities
                        .map((a) => a.gmailThreadId)
                        .filter((id) => id !== null && id !== undefined)));
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
                                    id: msg.id,
                                    format: 'metadata',
                                });
                                const labelIds = messageDetail.data.labelIds || [];
                                if (labelIds.includes('STARRED')) {
                                    starredCount++;
                                }
                            }
                        }
                        catch (error) {
                            console.error(`Error obteniendo thread ${threadId}:`, error);
                        }
                    }
                    return {
                        id: folder.id,
                        count: starredCount,
                    };
                }
                else {
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
            }
            catch (error) {
                console.error(`Error obteniendo conteo para ${folder.id}:`, error);
                return {
                    id: folder.id,
                    count: 0,
                };
            }
        }));
        res.json({ counts });
    }
    catch (error) {
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
router.post('/send', async (req, res) => {
    try {
        const { to, subject, body, threadId: replyThreadId, messageId: replyMessageId } = req.body;
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
                const messageId = headers.find((h) => h.name === 'Message-ID')?.value || '';
                if (messageId) {
                    inReplyTo = messageId;
                    references = messageId;
                }
            }
            catch (error) {
                console.error('Error obteniendo Message-ID del email original:', error);
            }
        }
        // Crear el mensaje en formato RFC 2822
        const messageHeaders = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/html; charset=utf-8',
        ];
        // Agregar headers de respuesta si es una respuesta
        if (inReplyTo) {
            messageHeaders.push(`In-Reply-To: ${inReplyTo}`);
            messageHeaders.push(`References: ${references}`);
        }
        messageHeaders.push(''); // Línea vacía antes del body
        messageHeaders.push(body);
        const message = messageHeaders.join('\n');
        // Codificar el mensaje en base64url
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        // Enviar el email con threadId si es una respuesta
        const sendRequest = {
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
        let threadId;
        try {
            const messageDetail = await gmail.users.messages.get({
                userId: 'me',
                id: response.data.id,
                format: 'metadata',
            });
            threadId = messageDetail.data.threadId;
        }
        catch (error) {
            console.error('Error obteniendo threadId:', error);
        }
        res.json({
            success: true,
            messageId: response.data.id,
            threadId: threadId,
            message: 'Email enviado exitosamente',
        });
    }
    catch (error) {
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
exports.default = router;
