import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Typography,
  Card,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Error as ErrorIcon,
  AttachFile,
  FileDownload,
  Description,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faFileExport } from '@fortawesome/free-solid-svg-icons';
import { Trash } from 'lucide-react';
import { taxiMonterricoColors } from '../theme/colors';
import { pageStyles } from '../theme/styles';
import api from '../config/api';

// Mismo color que el fondo de la página del Masivo (unificado, sin card más claro)
const getApiBaseUrl = () => {
  const url = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return url || (window.location.port === '3000' ? 'http://localhost:5000' : '');
};

interface ContactRow {
  id: string;
  email: string;
  nombre: string;
}

const STEPS = ['Cargar contactos', 'Crear email', 'Resultados'];

const processFile = (file: File): Promise<ContactRow[]> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Máximo 10MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let workbook: XLSX.WorkBook;
        if (file.name.toLowerCase().endsWith('.csv')) {
          workbook = XLSX.read(e.target?.result as string, { type: 'string' });
        } else {
          workbook = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' });
        }
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!json.length) {
          reject(new Error('El archivo está vacío'));
          return;
        }
        const headers = (json[0] as string[]).map((h) => String(h || '').toLowerCase());
        const emailIdx = headers.findIndex((h) => /^(email|correo|e-mail|mail)$/.test(h));
        const nombreIdx = headers.findIndex((h) => /^(nombre|name|cliente|client)$/.test(h));
        if (emailIdx === -1) reject(new Error('Falta columna email/correo'));
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rows = json.slice(1) as (string | number)[][];
        const contacts: ContactRow[] = [];
        rows.forEach((row, i) => {
          const email = String(row[emailIdx] ?? '').trim().toLowerCase();
          const nombre = nombreIdx >= 0 ? String(row[nombreIdx] ?? '').trim() : '';
          if (!email) return;
          if (!emailRegex.test(email)) return;
          contacts.push({
            id: `c_${Date.now()}_${i}`,
            email,
            nombre: nombre || '',
          });
        });
        const uniq = contacts.filter((c, i, a) => a.findIndex((x) => x.email === c.email) === i);
        if (uniq.length === 0) reject(new Error('No hay contactos válidos'));
        resolve(uniq);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error al procesar el archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

const processContent = (html: string, contact: ContactRow): string =>
  html
    .replace(/\{\{nombre\}\}/g, contact.nombre || '')
    .replace(/\{\{email\}\}/g, contact.email || '')
    .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString('es-ES'))
    .replace(/\{\{empresa\}\}/g, 'Taxi Monterrico');

interface AttachmentRow {
  name: string;
  data: string;
}

const MassEmail: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [fileError, setFileError] = useState('');
  const [sending, setSending] = useState(false);
  const [progressSent, setProgressSent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressCurrentEmail, setProgressCurrentEmail] = useState('');
  const [result, setResult] = useState<{
    total: number;
    successful: number;
    failed: number;
    results?: Array<{ email: string; success: boolean; error?: string }>;
  } | null>(null);
  const [apiError, setApiError] = useState('');

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['email', 'nombre']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    XLSX.writeFile(wb, 'Plantilla_masivo_contactos.xlsx');
  };

  const handleExportContacts = () => {
    if (contacts.length === 0) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(contacts.map((c) => ({ email: c.email, nombre: c.nombre })));
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    XLSX.writeFile(wb, `contactos_masivo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    try {
      const list = await processFile(file);
      setContacts(list);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Error al procesar');
    }
    e.target.value = '';
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const canNext =
    activeStep === 0 ? contacts.length > 0 : activeStep === 1 ? subject.trim() && body.trim() : true;

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    setActiveStep((s) => Math.max(0, s - 1));
  };

  const buildEmails = () => {
    const baseAttachments = attachments.length > 0
      ? attachments.map((a) => ({ filename: a.name, content: a.data.replace(/^data:[^;]+;base64,/, ''), encoding: 'base64' as const }))
      : undefined;
    return contacts.map((c) => ({
      to: c.email,
      subject: subject.trim(),
      html: processContent(body, c),
      attachments: baseAttachments,
      recipientName: c.nombre || '',
    }));
  };

  const handleSend = async () => {
    setSending(true);
    setApiError('');
    setResult(null);
    setProgressSent(0);
    setProgressTotal(contacts.length);
    setProgressCurrentEmail('');
    const emails = buildEmails();
    const token = localStorage.getItem('token');
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/mass-email/send-bulk-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emails }),
      });
      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (!match) continue;
          try {
            const data = JSON.parse(match[1]);
            if (data.type === 'progress') {
              setProgressSent(data.sent ?? 0);
              setProgressTotal(data.total ?? emails.length);
              setProgressCurrentEmail(data.currentEmail ?? '');
            } else if (data.type === 'done') {
              setResult({
                total: data.total ?? emails.length,
                successful: data.successful ?? 0,
                failed: data.failed ?? 0,
                results: data.results,
              });
              setActiveStep(STEPS.length - 1);
            } else if (data.type === 'error') {
              setApiError(data.error || 'Error al enviar');
            }
          } catch (_) {}
        }
      }
      const remaining = buffer.split('\n\n').filter((s) => s.trim());
      for (const line of remaining) {
        const m = line.match(/data:\s*(.+)/);
        if (!m) continue;
        try {
          const data = JSON.parse(m[1].trim());
          if (data.type === 'done') {
            setResult({
              total: data.total ?? emails.length,
              successful: data.successful ?? 0,
              failed: data.failed ?? 0,
              results: data.results,
            });
            setActiveStep(STEPS.length - 1);
          }
        } catch (_) {}
      }
    } catch (err: any) {
      setApiError(err?.message || 'Error al enviar');
    } finally {
      setSending(false);
      setProgressCurrentEmail('');
    }
  };

  const handleExportExcel = () => {
    if (!result?.results) return;
    const rows = result.results.map((r) => ({
      Email: r.email,
      Estado: r.success ? 'Exitoso' : 'Fallido',
      Error: r.error || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, `resultados-masivo-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const addAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = (reader.result as string) || '';
      setAttachments((prev) => [...prev, { name: file.name, data }]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        pb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, p: 2, mb: 0 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' } }}
          style={{
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : taxiMonterricoColors.green} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Masivo
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          backgroundColor: theme.palette.mode === 'dark' ? '#1c252e' : theme.palette.background.paper,
          p: 3,
        }}
      >
        <Stepper activeStep={activeStep} sx={{ mb: 0 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Divider sx={{ my: 3, mx: -3 }} />

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError('')}>
            {apiError}
          </Alert>
        )}

        {/* Paso 1: Cargar contactos */}
        {activeStep === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button
                size="small"
                startIcon={<Description sx={{ fontSize: 16, color: theme.palette.mode === 'dark' ? '#fff' : '#6A1B9A' }} />}
                onClick={handleDownloadTemplate}
                sx={{
                  border: theme.palette.mode === 'light' ? '1px solid #7B1FA2' : 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? '#7B1FA2' : '#F3E5F5',
                  color: theme.palette.mode === 'dark' ? '#fff' : '#6A1B9A',
                  px: 1.5,
                  py: 0.875,
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#9C27B0' : '#E1BEE7',
                    color: theme.palette.mode === 'dark' ? '#fff' : '#4A148C',
                    borderColor: theme.palette.mode === 'light' ? '#4A148C' : undefined,
                    boxShadow: '0 4px 12px rgba(123, 31, 162, 0.25)',
                  },
                }}
              >
                Plantilla
              </Button>
              <Button
                size="small"
                startIcon={<FontAwesomeIcon icon={faFileImport} style={{ fontSize: 16, color: theme.palette.mode === 'dark' ? '#fff' : taxiMonterricoColors.greenDark }} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: theme.palette.mode === 'light' ? `1px solid ${taxiMonterricoColors.green}` : 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? taxiMonterricoColors.green : '#E8F5E9',
                  color: theme.palette.mode === 'dark' ? '#fff' : taxiMonterricoColors.greenDark,
                  px: 1.5,
                  py: 0.875,
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? taxiMonterricoColors.greenLight : '#C8E6C9',
                    color: theme.palette.mode === 'dark' ? '#fff' : taxiMonterricoColors.greenDark,
                    borderColor: theme.palette.mode === 'light' ? taxiMonterricoColors.greenDark : undefined,
                    boxShadow: `0 4px 12px ${taxiMonterricoColors.green}30`,
                  },
                }}
              >
                Importar
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <Button
                size="small"
                startIcon={<FontAwesomeIcon icon={faFileExport} style={{ fontSize: 16, color: theme.palette.mode === 'dark' ? '#fff' : '#455A64' }} />}
                onClick={handleExportContacts}
                disabled={contacts.length === 0}
                sx={{
                  border: theme.palette.mode === 'light' ? '1px solid #546E7A' : 'none',
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark' ? '#546E7A' : '#ECEFF1',
                  color: theme.palette.mode === 'dark' ? '#fff' : '#37474F',
                  px: 1.5,
                  py: 0.875,
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#607D8B' : '#CFD8DC',
                    color: theme.palette.mode === 'dark' ? '#fff' : '#263238',
                    borderColor: theme.palette.mode === 'light' ? '#37474F' : undefined,
                    boxShadow: '0 4px 12px rgba(84, 110, 122, 0.25)',
                  },
                  '&:disabled': {
                    bgcolor: theme.palette.mode === 'dark' ? '#455A64' : '#ECEFF1',
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : theme.palette.text.disabled,
                    borderColor: theme.palette.mode === 'light' ? 'rgba(84, 110, 122, 0.4)' : undefined,
                    opacity: 1,
                  },
                }}
              >
                Exportar
              </Button>
            </Box>
            {fileError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFileError('')}>
                {fileError}
              </Alert>
            )}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                maxHeight: 320,
                overflow: 'auto',
                bgcolor: 'transparent',
                border: 'none',
                boxShadow: 'none',
                '& .MuiTableCell-root': {
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderTop: 'none',
                  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
                },
                '& .MuiTableRow-root:last-child .MuiTableCell-root': { borderBottom: 'none' },
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : theme.palette.text.secondary, fontWeight: 500, fontSize: '15px', py: 1.5 }}>Nombre</TableCell>
                    <TableCell sx={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : theme.palette.text.secondary, fontWeight: 500, fontSize: '15px', py: 1.5 }}>Email</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.mode === 'dark' ? '#A0AEC0' : theme.palette.text.secondary, fontWeight: 500, fontSize: '15px', py: 1.5 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                        sx={{
                          py: 6,
                          color: theme.palette.mode === 'dark' ? '#A0AEC0' : theme.palette.text.secondary,
                          fontSize: '15px',
                          borderBottom: 'none',
                        }}
                      >
                        No hay contactos agregados. Importa un archivo XLSX o agrega contactos manualmente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell sx={{ color: theme.palette.text.primary, fontSize: '15px' }}>{c.nombre}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontSize: '15px' }}>{c.email}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => removeContact(c.id)} sx={pageStyles.actionButtonDelete(theme)}>
                            <Trash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Paso 2: Crear email */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Asunto
              </Typography>
              <TextField
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                size="small"
                placeholder="Escribe el asunto del correo"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined } }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Contenido
              </Typography>
              <TextField
                value={body}
                onChange={(e) => setBody(e.target.value)}
                fullWidth
                multiline
                rows={10}
                size="small"
                placeholder="Puedes usar {{nombre}}, {{email}}, {{fecha}}, {{empresa}} para personalizar."
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined } }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Adjuntos (opcional)
              </Typography>
              <Button variant="outlined" size="small" component="label" startIcon={<AttachFile />} sx={{ mr: 1 }}>
                Añadir archivo
                <input type="file" hidden multiple onChange={(e) => { const files = e.target.files; if (files) for (let i = 0; i < files.length; i++) addAttachment(files[i]); e.target.value = ''; }} />
              </Button>
              {attachments.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attachments.map((a) => (
                    <Chip key={a.name} label={a.name} onDelete={() => removeAttachment(a.name)} size="small" />
                  ))}
                </Box>
              )}
            </Box>
            {sending && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressTotal > 0 ? Math.round((progressSent / progressTotal) * 100) : 0}
                  sx={{ mb: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Enviando {progressSent} de {progressTotal} {progressCurrentEmail ? `· ${progressCurrentEmail}` : ''}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Paso 3: Resultados */}
        {activeStep === 2 && result && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <CheckCircle sx={{ color: taxiMonterricoColors.green, fontSize: 32 }} />
              <Typography variant="h6">Envío completado</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownload />}
                onClick={handleExportExcel}
                sx={{ ml: 1 }}
              >
                Exportar a Excel
              </Button>
            </Box>
            <Typography variant="body1">
              Total: {result.total} · Exitosos: {result.successful} · Fallidos: {result.failed}
            </Typography>
            {result.results && result.results.filter((r) => !r.success).length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 200, borderRadius: 1.5, overflow: 'hidden', bgcolor: theme.palette.mode === 'dark' ? '#1c252e' : undefined }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.results.filter((r) => !r.success).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ErrorIcon color="error" fontSize="small" />
                            {r.error || 'Error'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBack />}>
            Atrás
          </Button>
          {activeStep === 1 ? (
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              sx={{
                background: `linear-gradient(135deg, ${taxiMonterricoColors.green} 0%, ${taxiMonterricoColors.greenLight} 100%)`,
                color: 'white',
              }}
            >
              {sending ? 'Enviando…' : 'Enviar correos'}
            </Button>
          ) : activeStep < STEPS.length - 1 ? (
            <Button variant="contained" onClick={handleNext} disabled={!canNext} endIcon={<ArrowForward />}>
              Siguiente
            </Button>
          ) : (
            <Button variant="outlined" onClick={() => { setActiveStep(0); setResult(null); setContacts([]); setSubject(''); setBody(''); setAttachments([]); }}>
              Nuevo envío
            </Button>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default MassEmail;
