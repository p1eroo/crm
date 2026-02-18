/**
 * API de correo masivo integrada en el CRM.
 * Usa el servicio massEmailService (Nodemailer + SMTP desde .env).
 * Crea contacto por destinatario si no existe (email + nombre opcional).
 */
import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Activity } from '../models/Activity';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import {
  sendBulkEmails,
  sendBulkEmailsWithCallbacks,
  isMassEmailConfigured,
  validateSMTP,
} from '../services/massEmailService';

const router = express.Router();
router.use(authenticateToken);

/** Parsea nombre opcional en firstName/lastName; si no hay nombre, usa parte del email. */
function parseRecipientName(email: string, recipientName?: string | null): { firstName: string; lastName: string } {
  const name = (recipientName || '').trim();
  if (name) {
    const spaceIdx = name.indexOf(' ');
    if (spaceIdx > 0) {
      return { firstName: name.slice(0, spaceIdx).trim(), lastName: name.slice(spaceIdx + 1).trim() || '-' };
    }
    return { firstName: name, lastName: '-' };
  }
  const localPart = email.split('@')[0] || email;
  const fallback = localPart.replace(/[._-]/g, ' ').trim() || 'Sin nombre';
  return { firstName: fallback, lastName: '-' };
}

/** Extrae el dominio del email (parte después de @). Devuelve null si no hay @. */
function getDomainFromEmail(email: string): string | null {
  const match = email.trim().toLowerCase().match(/@(.+)$/);
  return match && match[1] ? match[1] : null;
}

/** Asegura que exista una empresa con ese dominio; si no, la crea. name = domain. Devuelve la empresa o null si no hay dominio. */
async function ensureCompanyByDomain(
  domain: string,
  ownerId?: number | null
): Promise<Company | null> {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return null;
  let company = await Company.findOne({
    where: { domain: { [Op.iLike]: normalized } },
  });
  if (company) return company;
  company = await Company.create({
    name: normalized,
    domain: normalized,
    ownerId: ownerId ?? null,
    lifecycleStage: 'lead',
  });
  return company;
}

/** Asegura que exista una empresa con ese nombre; si no, la crea. Siempre asigna/actualiza domain con el del correo. */
async function ensureCompanyByName(
  name: string,
  domain: string | null,
  ownerId?: number | null
): Promise<Company | null> {
  const normalizedName = name.trim();
  if (!normalizedName) return null;
  let company = await Company.findOne({
    where: { name: { [Op.iLike]: normalizedName } },
  });
  if (company) {
    if (domain && !company.domain) {
      await company.update({ domain: domain.trim().toLowerCase() });
    }
    return company;
  }
  company = await Company.create({
    name: normalizedName,
    domain: domain?.trim().toLowerCase() ?? undefined,
    ownerId: ownerId ?? null,
    lifecycleStage: 'lead',
  });
  return company;
}

/** Asegura que exista un contacto con ese email; si no, lo crea. Si hay companyName usa ese nombre con dominio del correo; si no, empresa por dominio (nombre = dominio). */
async function ensureContactByEmail(
  email: string,
  recipientName?: string | null,
  ownerId?: number | null,
  companyName?: string | null
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const domain = getDomainFromEmail(normalized);
  let company: Company | null = null;
  if (companyName && String(companyName).trim()) {
    company = await ensureCompanyByName(String(companyName).trim(), domain, ownerId);
  } else if (domain) {
    company = await ensureCompanyByDomain(domain, ownerId);
  }
  const companyId = company?.id ?? null;

  const existing = await Contact.findOne({
    where: { email: { [Op.iLike]: normalized } },
  });
  if (existing) {
    if (companyId != null && existing.companyId == null) {
      await existing.update({ companyId });
    }
    return;
  }
  const { firstName, lastName } = parseRecipientName(normalized, recipientName);
  await Contact.create({
    email: normalized,
    firstName: firstName || 'Sin nombre',
    lastName: lastName || '-',
    ownerId: ownerId ?? null,
    companyId: companyId ?? undefined,
    lifecycleStage: 'lead',
  });
}

/** Registra una actividad tipo email para el contacto que recibió el correo masivo. Solo si userId está definido. */
async function registerMassEmailActivity(
  contactEmail: string,
  subject: string,
  userId: number | null
): Promise<void> {
  if (userId == null) return;
  const contact = await Contact.findOne({
    where: { email: { [Op.iLike]: contactEmail.trim() } },
    attributes: ['id'],
  });
  if (!contact) return;
  await Activity.create({
    type: 'email',
    subject: subject || 'Correo masivo',
    description: 'Enviado por correo masivo.',
    userId,
    contactId: contact.id,
  });
}

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

    const userId = (req as AuthRequest).userId ?? null;
    for (const e of emails) {
      await ensureContactByEmail(e.to, e.recipientName, userId, e.companyName ?? e.empresa);
    }

    const result = await sendBulkEmails(emails);
    for (const r of result.results) {
      if (r.success) {
        const item = emails.find((e: any) => String(e.to).toLowerCase() === r.email.toLowerCase());
        await registerMassEmailActivity(r.email, item?.subject ?? 'Correo masivo', userId);
      }
    }
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

    const userId = (req as AuthRequest).userId ?? null;
    for (const e of emails) {
      await ensureContactByEmail(e.to, e.recipientName, userId, e.companyName ?? e.empresa);
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

    for (const r of result.results) {
      if (r.success) {
        const item = emails.find((e: any) => String(e.to).toLowerCase() === r.email.toLowerCase());
        await registerMassEmailActivity(r.email, item?.subject ?? 'Correo masivo', userId);
      }
    }

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
