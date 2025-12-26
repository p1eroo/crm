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
router.use(auth_1.authenticateToken);
// Endpoint para enviar email usando Gmail API
router.post('/send', async (req, res) => {
    try {
        const { accessToken, to, subject, body } = req.body;
        const userId = req.user?.id;
        if (!to || !subject || !body) {
            return res.status(400).json({ message: 'Destinatario, asunto y cuerpo son requeridos' });
        }
        let tokenToUse = accessToken;
        // Si no se proporciona accessToken, intentar obtenerlo de la base de datos
        if (!tokenToUse && userId) {
            const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
                where: { userId },
            });
            if (!userToken) {
                return res.status(401).json({ message: 'No hay cuenta de Google conectada. Por favor, conecta tu correo desde Configuración > Perfil > Correo' });
            }
            // Verificar si el token expiró
            const isExpired = userToken.tokenExpiry && new Date(userToken.tokenExpiry) < new Date();
            if (isExpired && userToken.refreshToken) {
                // Refrescar el token
                const clientId = process.env.GOOGLE_CLIENT_ID;
                const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
                const redirectUri = process.env.GOOGLE_REDIRECT_URI;
                if (!clientId || !clientSecret) {
                    return res.status(500).json({ message: 'Google OAuth no está configurado en el servidor' });
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
                    return res.status(401).json({ message: 'Token expirado. Por favor, reconecta tu cuenta desde Configuración > Perfil > Correo' });
                }
            }
            else if (isExpired && !userToken.refreshToken) {
                return res.status(401).json({ message: 'Token expirado. Por favor, reconecta tu cuenta desde Configuración > Perfil > Correo' });
            }
            else {
                tokenToUse = userToken.accessToken;
            }
        }
        if (!tokenToUse) {
            return res.status(400).json({ message: 'Token de acceso requerido' });
        }
        // Crear cliente OAuth2 con el token del usuario
        const oauth2Client = new googleapis_1.google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: tokenToUse });
        // Crear cliente de Gmail
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
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
        res.json({
            success: true,
            messageId: response.data.id,
            message: 'Email enviado exitosamente',
        });
    }
    catch (error) {
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
exports.default = router;
