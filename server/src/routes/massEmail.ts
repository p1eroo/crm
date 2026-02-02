/**
 * API de correo masivo integrada en el CRM.
 * Usa el servicio massEmailService (Nodemailer + SMTP desde .env).
 * No depende de ningún servidor externo.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  sendBulkEmails,
  sendBulkEmailsWithCallbacks,
  isMassEmailConfigured,
  validateSMTP,
} from '../services/massEmailService';

const router = express.Router();
router.use(authenticateToken);

function writeSSE(res: express.Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * GET /api/mass-email/health
 * Estado del correo masivo (configuración SMTP en el CRM).
 */
router.get('/health', (_req, res) => {
  const configured = isMassEmailConfigured();
  res.json({
    status: configured ? 'healthy' : 'not_configured',
    massEmailConfigured: configured,
    message: configured
      ? 'Correo masivo disponible'
      : 'Configura SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor para habilitar el envío masivo.',
  });
});

/**
 * GET /api/mass-email/queue-status
 * Estado de cola (en esta implementación no hay cola persistente; cada envío se procesa en la petición).
 */
router.get('/queue-status', (_req, res) => {
  res.json({
    queueLength: 0,
    isProcessing: false,
    massEmailConfigured: isMassEmailConfigured(),
  });
});

/**
 * POST /api/mass-email/validate-smtp
 * Valida la conexión SMTP configurada.
 */
router.post('/validate-smtp', async (_req, res) => {
  try {
    const result = await validateSMTP();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err?.message });
  }
});

/**
 * POST /api/mass-email/send-bulk
 * Envío masivo. Body: { emails: [{ to, subject, html, attachments? }] }.
 * Procesa en lotes con delays (configurables por env).
 */
router.post('/send-bulk', async (req, res) => {
  try {
    if (!isMassEmailConfigured()) {
      return res.status(503).json({
        success: false,
        error:
          'Correo masivo no configurado. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en el .env del servidor.',
      });
    }

    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array "emails" con al menos un destinatario (to, subject, html).',
      });
    }

    const valid = emails.every(
      (e: any) => e && typeof e.to === 'string' && typeof e.subject === 'string' && typeof e.html === 'string'
    );
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: 'Cada email debe tener to, subject y html.',
      });
    }

    const result = await sendBulkEmails(emails);
    res.json(result);
  } catch (err: any) {
    const message = err?.message || 'Error al enviar correos masivos';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/mass-email/send-bulk-stream
 * Envío masivo con progreso en tiempo real (Server-Sent Events).
 * Response: stream de eventos { type: 'progress'|'result'|'done', ... }.
 */
router.post('/send-bulk-stream', async (req, res) => {
  try {
    if (!isMassEmailConfigured()) {
      return res.status(503).json({
        success: false,
        error:
          'Correo masivo no configurado. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en el .env del servidor.',
      });
    }

    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array "emails" con al menos un destinatario (to, subject, html).',
      });
    }

    const valid = emails.every(
      (e: any) => e && typeof e.to === 'string' && typeof e.subject === 'string' && typeof e.html === 'string'
    );
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: 'Cada email debe tener to, subject y html.',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const result = await sendBulkEmailsWithCallbacks(emails, {
      onProgress: (sent, total, currentEmail) => {
        writeSSE(res, { type: 'progress', sent, total, currentEmail });
        if (typeof (res as any).flush === 'function') (res as any).flush();
      },
      onResult: (r) => {
        writeSSE(res, { type: 'result', ...r });
        if (typeof (res as any).flush === 'function') (res as any).flush();
      },
    });

    writeSSE(res, { type: 'done', ...result });
    res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || 'Error al enviar' });
    } else {
      writeSSE(res, { type: 'error', error: err?.message || 'Error al enviar' });
      res.end();
    }
  }
});

export default router;
