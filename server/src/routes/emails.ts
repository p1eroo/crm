import express from 'express';
import { google } from 'googleapis';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Endpoint para enviar email usando Gmail API
router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { accessToken, to, subject, body } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Token de acceso requerido' });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Destinatario, asunto y cuerpo son requeridos' });
    }

    // Crear cliente OAuth2 con el token del usuario
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Crear cliente de Gmail
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

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

