/**
 * Servicio de correo masivo integrado en el CRM.
 * Usa Nodemailer con SMTP configurado por variables de entorno.
 * Misma lógica que el proyecto mail taximonterrico (lotes, delays).
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailItem {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string; encoding?: string }>;
}

export interface BulkResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}

const BATCH_SIZE = parseInt(process.env.MASS_EMAIL_BATCH_SIZE || '10', 10);
const DELAY_BETWEEN_BATCHES_MS = parseInt(process.env.MASS_EMAIL_DELAY_BETWEEN_BATCHES || '2000', 10);
const DELAY_BETWEEN_EMAILS_MS = parseInt(process.env.MASS_EMAIL_DELAY_BETWEEN_EMAILS || '100', 10);

function getSMTPConfig(): { host: string; port: number; secure: boolean; auth: { user: string; pass: string }; tls?: object } | null {
  const host = process.env.SMTP_HOST || process.env.MASS_EMAIL_SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.MASS_EMAIL_SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.MASS_EMAIL_SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.MASS_EMAIL_SMTP_PASS;
  const secure = (process.env.SMTP_SECURE || process.env.MASS_EMAIL_SMTP_SECURE || '') === 'true';

  if (!host || !user || !pass) return null;
  return {
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  };
}

export function isMassEmailConfigured(): boolean {
  return getSMTPConfig() !== null;
}

function createTransporter(): Transporter | null {
  const config = getSMTPConfig();
  if (!config) return null;
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: config.tls,
  });
}

export async function sendBulkEmails(emails: EmailItem[]): Promise<BulkResult> {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Correo masivo no configurado. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor.');
  }

  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  const fromUser = process.env.SMTP_USER || process.env.MASS_EMAIL_SMTP_USER || 'noreply@taximonterrico.pe';
  const fromName = process.env.MASS_EMAIL_FROM_NAME || 'Taxi Monterrico';

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    for (const emailData of batch) {
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${fromUser}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          attachments: emailData.attachments || [],
        });
        results.push({ email: emailData.to, success: true });
        successful++;
      } catch (err: any) {
        const message = err?.message || 'Error al enviar';
        results.push({ email: emailData.to, success: false, error: message });
        failed++;
      }

      if (DELAY_BETWEEN_EMAILS_MS > 0) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_EMAILS_MS));
      }
    }

    if (i + BATCH_SIZE < emails.length && DELAY_BETWEEN_BATCHES_MS > 0) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  return {
    success: true,
    total: emails.length,
    successful,
    failed,
    results,
  };
}

export type ProgressCallback = (sent: number, total: number, currentEmail: string) => void;
export type ResultCallback = (r: { email: string; success: boolean; error?: string }) => void;

/**
 * Envío masivo con callbacks para progreso en tiempo real (streaming).
 */
export async function sendBulkEmailsWithCallbacks(
  emails: EmailItem[],
  callbacks: { onProgress?: ProgressCallback; onResult?: ResultCallback }
): Promise<BulkResult> {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Correo masivo no configurado. Configura SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor.');
  }

  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let successful = 0;
  let failed = 0;
  const fromUser = process.env.SMTP_USER || process.env.MASS_EMAIL_SMTP_USER || 'noreply@taximonterrico.pe';
  const fromName = process.env.MASS_EMAIL_FROM_NAME || 'Taxi Monterrico';

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    for (const emailData of batch) {
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${fromUser}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          attachments: emailData.attachments || [],
        });
        const r = { email: emailData.to, success: true };
        results.push(r);
        successful++;
        callbacks.onResult?.(r);
      } catch (err: any) {
        const r = { email: emailData.to, success: false, error: err?.message || 'Error al enviar' };
        results.push(r);
        failed++;
        callbacks.onResult?.(r);
      }
      const sent = results.length;
      callbacks.onProgress?.(sent, emails.length, emailData.to);
      if (DELAY_BETWEEN_EMAILS_MS > 0) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_EMAILS_MS));
      }
    }
    if (i + BATCH_SIZE < emails.length && DELAY_BETWEEN_BATCHES_MS > 0) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  return { success: true, total: emails.length, successful, failed, results };
}

export async function validateSMTP(): Promise<{ valid: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { valid: false, error: 'SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS)' };
  }
  try {
    await transporter.verify();
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Error al verificar SMTP' };
  }
}
