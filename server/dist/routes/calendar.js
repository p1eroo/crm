"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const auth_1 = require("../middleware/auth");
const UserGoogleToken_1 = require("../models/UserGoogleToken");
const router = express_1.default.Router();
// Endpoint para iniciar el flujo de OAuth (requiere autenticación para obtener userId)
router.get('/auth', auth_1.authenticateToken, (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        // El redirect_uri DEBE estar configurado explícitamente en .env y coincidir EXACTAMENTE con Google Cloud Console
        if (!process.env.GOOGLE_REDIRECT_URI) {
            return res.status(500).json({
                message: 'GOOGLE_REDIRECT_URI no está configurado. Por favor, agrega GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback en tu archivo .env'
            });
        }
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        if (!clientId || !clientSecret) {
            return res.status(500).json({ message: 'Google OAuth no está configurado en el servidor. Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno.' });
        }
        console.log('🔗 Redirect URI configurado:', redirectUri);
        console.log('🔗 Client ID:', clientId?.substring(0, 20) + '...');
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        // Generar URL de autorización con access_type=offline y prompt=consent para obtener refresh_token
        // Incluye scopes para Gmail, Calendar y Tasks
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // Fuerza mostrar la pantalla de consentimiento para obtener refresh_token
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/tasks',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.compose',
                'https://www.googleapis.com/auth/gmail.readonly',
            ],
            state: userId.toString(), // Pasar userId en el state para identificarlo después
        });
        console.log('🔗 URL de autorización generada (primeros 200 caracteres):', authUrl.substring(0, 200));
        console.log('🔗 Redirect URI en la URL:', authUrl.includes('redirect_uri=') ? authUrl.split('redirect_uri=')[1]?.split('&')[0] : 'No encontrado');
        res.json({ authUrl });
    }
    catch (error) {
        console.error('Error generando URL de autorización:', error);
        res.status(500).json({ message: 'Error generando URL de autorización', error: error.message });
    }
});
// Callback de OAuth (sin autenticación requerida inicialmente)
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const userId = state ? parseInt(state) : null;
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_error=no_code`);
        }
        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_error=no_user`);
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        // El redirect_uri DEBE estar configurado explícitamente en .env y coincidir EXACTAMENTE con Google Cloud Console
        if (!process.env.GOOGLE_REDIRECT_URI) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_error=redirect_uri_not_configured`);
        }
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        if (!clientId || !clientSecret) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_error=config`);
        }
        console.log('🔗 Redirect URI usado en callback:', redirectUri);
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        // Intercambiar código por tokens (incluyendo refresh_token)
        const { tokens } = await oauth2Client.getToken(code);
        // Guardar tokens en la base de datos
        await UserGoogleToken_1.UserGoogleToken.upsert({
            userId,
            accessToken: tokens.access_token || '',
            refreshToken: tokens.refresh_token || undefined,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
            scope: tokens.scope || 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
        });
        // Redirigir al frontend con éxito
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_connected=true`);
    }
    catch (error) {
        console.error('Error en callback de OAuth:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google_error=callback_error`);
    }
});
// Rutas que requieren autenticación
const authRouter = express_1.default.Router();
authRouter.use(auth_1.authenticateToken);
// Guardar token de Google Calendar del usuario (método alternativo - mantiene compatibilidad)
authRouter.post('/save-token', async (req, res) => {
    try {
        const { accessToken, refreshToken, expiryDate, scope } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        if (!accessToken) {
            return res.status(400).json({ message: 'Token de acceso requerido' });
        }
        // Guardar o actualizar token en la base de datos
        await UserGoogleToken_1.UserGoogleToken.upsert({
            userId,
            accessToken,
            refreshToken: refreshToken || undefined,
            tokenExpiry: expiryDate ? new Date(expiryDate) : undefined,
            scope: scope || 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
        });
        res.json({ success: true, message: 'Token guardado correctamente' });
    }
    catch (error) {
        console.error('Error guardando token:', error);
        res.status(500).json({ message: 'Error guardando token', error: error.message });
    }
});
// Obtener token del usuario
authRouter.get('/token', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
            where: { userId },
        });
        if (!userToken) {
            // Devolver 200 con hasToken: false en lugar de 404 para evitar errores en el frontend
            return res.json({
                hasToken: false,
                isExpired: false,
                message: 'No hay token de Google Calendar configurado'
            });
        }
        // Verificar si el token expiró
        const isExpired = userToken.tokenExpiry && new Date(userToken.tokenExpiry) < new Date();
        res.json({
            hasToken: true,
            isExpired,
            scope: userToken.scope,
        });
    }
    catch (error) {
        console.error('Error obteniendo token:', error);
        res.status(500).json({ message: 'Error obteniendo token', error: error.message });
    }
});
// Crear evento en Google Calendar
authRouter.post('/create-event', async (req, res) => {
    try {
        const { summary, description, start, end, attendees, location, calendarId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        if (!summary || !start || !end) {
            return res.status(400).json({ message: 'Resumen, inicio y fin son requeridos' });
        }
        // Obtener token del usuario desde la BD
        const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
            where: { userId },
        });
        if (!userToken) {
            return res.status(404).json({ message: 'No hay token de Google Calendar configurado. Por favor, conecta tu cuenta primero.' });
        }
        // Verificar si el token expiró
        const isExpired = userToken.tokenExpiry && new Date(userToken.tokenExpiry) < new Date();
        if (isExpired && !userToken.refreshToken) {
            return res.status(401).json({ message: 'Token expirado. Por favor, reconecta tu cuenta de Google Calendar.' });
        }
        // Crear cliente OAuth2
        const oauth2Client = new googleapis_1.google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: userToken.accessToken,
            refresh_token: userToken.refreshToken || undefined,
        });
        // Si el token expiró y hay refresh token, intentar refrescarlo
        if (isExpired && userToken.refreshToken) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                oauth2Client.setCredentials(credentials);
                // Actualizar token en la BD
                await userToken.update({
                    accessToken: credentials.access_token || userToken.accessToken,
                    tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : userToken.tokenExpiry,
                });
            }
            catch (refreshError) {
                console.error('Error refrescando token:', refreshError);
                return res.status(401).json({ message: 'Error refrescando token. Por favor, reconecta tu cuenta.' });
            }
        }
        // Crear cliente de Calendar
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        // Preparar evento
        const event = {
            summary,
            description: description || '',
            start: {
                dateTime: start,
                timeZone: 'America/Lima',
            },
            end: {
                dateTime: end,
                timeZone: 'America/Lima',
            },
        };
        if (attendees && attendees.length > 0) {
            event.attendees = attendees.map((email) => ({ email }));
        }
        if (location) {
            event.location = location;
        }
        // Crear evento en el calendario
        const response = await calendar.events.insert({
            calendarId: calendarId || 'primary',
            requestBody: event,
        });
        res.json({
            success: true,
            event: {
                id: response.data.id,
                htmlLink: response.data.htmlLink,
                summary: response.data.summary,
                start: response.data.start,
                end: response.data.end,
            },
        });
    }
    catch (error) {
        console.error('Error creando evento:', error);
        res.status(500).json({
            message: 'Error creando evento en Google Calendar',
            error: error.message,
        });
    }
});
// Obtener eventos del calendario
authRouter.get('/events', async (req, res) => {
    try {
        const { timeMin, timeMax, maxResults } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Obtener token del usuario
        const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
            where: { userId },
        });
        if (!userToken) {
            return res.status(404).json({ message: 'No hay token de Google Calendar configurado' });
        }
        // Verificar si el token expiró
        const isExpired = userToken.tokenExpiry && new Date(userToken.tokenExpiry) < new Date();
        // Crear cliente OAuth2
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        // El redirect_uri DEBE estar configurado explícitamente en .env
        if (!process.env.GOOGLE_REDIRECT_URI) {
            throw new Error('GOOGLE_REDIRECT_URI no está configurado en .env');
        }
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        oauth2Client.setCredentials({
            access_token: userToken.accessToken,
            refresh_token: userToken.refreshToken || undefined,
        });
        // Si el token expiró y hay refresh token, intentar refrescarlo
        if (isExpired && userToken.refreshToken) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                oauth2Client.setCredentials(credentials);
                // Actualizar token en la BD
                await userToken.update({
                    accessToken: credentials.access_token || userToken.accessToken,
                    tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : userToken.tokenExpiry,
                });
            }
            catch (refreshError) {
                console.error('Error refrescando token:', refreshError);
                return res.status(401).json({ message: 'Error refrescando token. Por favor, reconecta tu cuenta.' });
            }
        }
        // Crear cliente de Calendar
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        // Obtener eventos
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax,
            maxResults: maxResults ? parseInt(maxResults) : 250, // Aumentar límite para obtener más eventos
            singleEvents: true,
            orderBy: 'startTime',
        });
        console.log(`📅 Eventos obtenidos de Google Calendar: ${response.data.items?.length || 0}`);
        res.json({
            success: true,
            events: response.data.items || [],
        });
    }
    catch (error) {
        console.error('Error obteniendo eventos:', error);
        res.status(500).json({
            message: 'Error obteniendo eventos de Google Calendar',
            error: error.message,
        });
    }
});
// Eliminar token (desconectar Google Calendar)
authRouter.delete('/disconnect', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        await UserGoogleToken_1.UserGoogleToken.destroy({
            where: { userId },
        });
        res.json({ success: true, message: 'Google Calendar desconectado correctamente' });
    }
    catch (error) {
        console.error('Error desconectando:', error);
        res.status(500).json({ message: 'Error desconectando Google Calendar', error: error.message });
    }
});
// Combinar rutas públicas y autenticadas
router.use('/', authRouter);
exports.default = router;
