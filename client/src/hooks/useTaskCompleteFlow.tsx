import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { CalendarToday, Schedule } from '@mui/icons-material';
import api from '../config/api';
import { pageStyles } from '../theme/styles';
import { CallModal, MeetingModal, NoteModal } from '../components/ActivityModals';
import EmailComposer from '../components/EmailComposer';

export interface TaskLike {
  id: number;
  title?: string;
  subject?: string;
  type?: string;
  taskSubType?: string;
  status?: string;
  description?: string;
  companyId?: number;
  contactId?: number;
  dealId?: number;
  Company?: { id: number; name: string };
  Contact?: { id: number; firstName: string; lastName: string; email?: string };
  Deal?: { id: number; name: string };
  isActivity?: boolean;
}

function getCompletadaSection(desc: string): string {
  const s = (desc || '').replace(/\r\n/g, '\n');
  let idx = s.indexOf('\n\n--- Completada ---');
  if (idx >= 0) return s.slice(idx);
  idx = s.indexOf('--- Completada ---');
  if (idx >= 0) return s.slice(idx);
  return '';
}

function getCompletedDateAndTime(desc: string): { date: Date | null; time: string | null; observations: string } {
  const completadaSection = getCompletadaSection(desc);
  if (!completadaSection) return { date: null, time: null, observations: '' };

  const dateMatch = completadaSection.match(/Completada el (\d{1,2}\/\d{1,2}\/\d{4}) a las (\d{1,2}:\d{2})/);
  if (dateMatch) {
    const [, dateStr, timeStr] = dateMatch;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const observationsStart = completadaSection.indexOf(dateMatch[0]) + dateMatch[0].length;
    const observations = completadaSection.slice(observationsStart).replace(/^[\r\n]+/, '').trim();
    return { date, time: timeStr, observations };
  }

  const observationsStart = completadaSection.indexOf('--- Completada ---') + '--- Completada ---'.length;
  const observations = completadaSection.slice(observationsStart).replace(/^[\r\n]+/, '').trim();
  return { date: null, time: null, observations };
}

function getEntityForTask(task: TaskLike): { entityType: 'company' | 'contact' | 'deal'; entityId: number; entityName: string } | null {
  // Prioridad: deal > company > contact (para consistencia con el flujo de negocio)
  if (task.dealId) {
    const name = task.Deal?.name ?? 'Negocio';
    return { entityType: 'deal', entityId: task.dealId, entityName: name };
  }
  if (task.companyId) {
    const name = task.Company?.name ?? 'Empresa';
    return { entityType: 'company', entityId: task.companyId, entityName: name };
  }
  if (task.contactId) {
    const name = task.Contact
      ? [task.Contact.firstName, task.Contact.lastName].filter(Boolean).join(' ') || 'Contacto'
      : 'Contacto';
    return { entityType: 'contact', entityId: task.contactId, entityName: name };
  }
  return null;
}

function normalizeActivityForList(activity: any): any {
  if (!activity) return activity;
  return {
    ...activity,
    subject: activity.subject ?? activity.title ?? '',
    title: activity.title ?? activity.subject ?? '',
    User: activity.User ?? activity.CreatedBy ?? activity.AssignedTo,
  };
}

export interface UseTaskCompleteFlowOptions {
  user: { id: number; firstName?: string; lastName?: string } | null;
  onRefresh: () => void | Promise<void>;
  onOpenNewTaskLinkedTo?: (task: TaskLike) => void;
  /** Añadir actividad al listado de forma optimista (aparece al instante) */
  onActivityCreated?: (activity: any) => void;
}

export function useTaskCompleteFlow(options: UseTaskCompleteFlowOptions) {
  const { user, onRefresh, onOpenNewTaskLinkedTo, onActivityCreated } = options;
  const theme = useTheme();

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeModalTask, setCompleteModalTask] = useState<TaskLike | null>(null);
  const [completeModalViewOnly, setCompleteModalViewOnly] = useState(false);
  const [completeModalLoading, setCompleteModalLoading] = useState(false);
  const [completeObservations, setCompleteObservations] = useState('');
  const [completeDate, setCompleteDate] = useState('');
  const [completeTime, setCompleteTime] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeAsModalTask, setCompleteAsModalTask] = useState<TaskLike | null>(null);
  const [completeAsModalPayload, setCompleteAsModalPayload] = useState<{ date: string; time: string; observations: string } | null>(null);
  const [contactEmailForComplete, setContactEmailForComplete] = useState<{ email: string; name: string } | null>(null);
  const [linkPromptOpen, setLinkPromptOpen] = useState(false);
  const [taskJustCompletedForLink, setTaskJustCompletedForLink] = useState<TaskLike | null>(null);

  const markTaskCompleted = useCallback(
    async (task: TaskLike, payload?: { date: string; time: string; observations: string }) => {
      let description: string | undefined;
      if (payload) {
        const dateStr = payload.date || new Date().toISOString().slice(0, 10);
        const timeStr = payload.time || new Date().toTimeString().slice(0, 5);
        const completedAtLabel = `Completada el ${dateStr.split('-').reverse().join('/')} a las ${timeStr}\n\n`;
        description = `${(task as any).description || ''}\n\n--- Completada ---\n${completedAtLabel}${(payload.observations || '').trim()}`.trim();
      }
      try {
        if ((task as any).isActivity) {
          await api.put(`/activities/${task.id}`, { status: 'completed', ...(description != null ? { description } : {}) });
        } else {
          await api.put(`/tasks/${task.id}`, { status: 'completed', ...(description != null ? { description } : {}) });
        }
        await onRefresh();
        if ((task as any).companyId != null) {
          setTaskJustCompletedForLink(task);
          setLinkPromptOpen(true);
        }
      } catch (err) {
        console.error('Error al completar la tarea:', err);
        throw err;
      }
    },
    [onRefresh]
  );

  const openCompleteModal = useCallback((task: TaskLike) => {
    setCompleteModalTask(task);
    setCompleteObservations('');
    const now = new Date();
    setCompleteDate(now.toISOString().slice(0, 10));
    setCompleteTime(now.toTimeString().slice(0, 5));
    setCompleteModalViewOnly(false);
    setCompleteModalOpen(true);
  }, []);

  const openCompleteModalView = useCallback(async (task: TaskLike) => {
    setCompleteModalTask(task);
    setCompleteModalViewOnly(true);
    setCompleteModalOpen(true);
    setCompleteDate('');
    setCompleteTime('');
    setCompleteObservations('');
    setCompleteModalLoading(true);
    try {
      const endpoint = (task as any).isActivity ? `/activities/${task.id}` : `/tasks/${task.id}`;
      const res = await api.get(`${endpoint}?_=${Date.now()}`);
      const fullTask = res.data;
      const taskDescription = (fullTask?.description ?? (task as any).description ?? '').replace(/\r\n/g, '\n');
      const { date, time, observations } = getCompletedDateAndTime(taskDescription);
      if (date) setCompleteDate(date.toISOString().slice(0, 10));
      if (time) setCompleteTime(time);
      setCompleteObservations(observations || '');
    } catch (e) {
      console.error('Error al cargar datos de tarea completada:', e);
      const taskDescription = (task as any).description || '';
      const { date, time, observations } = getCompletedDateAndTime(taskDescription);
      if (date) setCompleteDate(date.toISOString().slice(0, 10));
      if (time) setCompleteTime(time);
      setCompleteObservations(observations || '');
    } finally {
      setCompleteModalLoading(false);
    }
  }, []);

  const handleCloseCompleteModal = useCallback(() => {
    setCompleteModalOpen(false);
    setCompleteModalTask(null);
    setCompleteModalViewOnly(false);
    setCompleteModalLoading(false);
    setCompleteObservations('');
    setCompleteDate('');
    setCompleteTime('');
  }, []);

  const handleCompleteWithObservations = useCallback(async () => {
    if (!completeModalTask) return;
    const task = completeModalTask;
    const hasEntity = !!(task.companyId || task.contactId || task.dealId);
    // taskSubType viene de tasksAsActivities; type puede ser "task" (display) o el tipo real si viene de Tasks/API
    const rawType = (task as any).taskSubType || (task as any).type || 'todo';
    let effectiveType = String(rawType).toLowerCase().trim();
    // Si type es "task" (display) pero tenemos taskSubType, usar taskSubType para abrir el modal de actividad correcto
    if (effectiveType === 'task' && (task as any).taskSubType) {
      effectiveType = String((task as any).taskSubType).toLowerCase().trim();
    }
    const dateStr = completeDate || new Date().toISOString().slice(0, 10);
    const timeStr = completeTime || new Date().toTimeString().slice(0, 5);
    const payload = { date: dateStr, time: timeStr, observations: completeObservations };

    if (['call', 'meeting', 'note', 'email'].includes(effectiveType) && hasEntity) {
      handleCloseCompleteModal();
      // Defer para que el modal de completar se cierre antes de abrir el de actividad
      setTimeout(() => {
        setCompleteAsModalTask({ ...task, type: effectiveType });
        setCompleteAsModalPayload(payload);
        if (effectiveType === 'email' && task.contactId) {
          api
            .get(`/contacts/${task.contactId}`)
            .then((res) => {
              const c = res.data;
              if (c?.email) {
                setContactEmailForComplete({
                  email: c.email,
                  name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email,
                });
              }
            })
            .catch(() => {});
        }
      }, 0);
      return;
    }

    setCompleting(true);
    try {
      await markTaskCompleted(task, { date: dateStr, time: timeStr, observations: completeObservations });
      handleCloseCompleteModal();
    } catch {
      // Error ya manejado en markTaskCompleted
    } finally {
      setCompleting(false);
    }
  }, [
    completeModalTask,
    completeDate,
    completeTime,
    completeObservations,
    handleCloseCompleteModal,
    markTaskCompleted,
  ]);

  const handleToggleComplete = useCallback(
    async (activityOrTask: TaskLike, completed: boolean, setCompletedActivities?: React.Dispatch<React.SetStateAction<{ [key: number]: boolean }>>) => {
      const isTask = !!(activityOrTask as any).isTask;
      if (isTask && completed) {
        openCompleteModal(activityOrTask);
        return;
      }
      if (!isTask) {
        try {
          setCompletedActivities?.((prev) => ({ ...prev, [activityOrTask.id]: completed }));
          await api.put(`/activities/${activityOrTask.id}`, { completed });
          await onRefresh();
        } catch (error) {
          console.error('Error al actualizar la actividad:', error);
          setCompletedActivities?.((prev) => ({ ...prev, [activityOrTask.id]: !completed }));
        }
      }
    },
    [openCompleteModal, onRefresh]
  );

  const CompleteModalJSX = (
    <Dialog
      open={completeModalOpen}
      onClose={handleCloseCompleteModal}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          ...pageStyles.dialog,
          border: 'none',
          borderRadius: 4,
          minHeight: '70vh',
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: '#1c252e !important',
            bgcolor: '#1c252e',
          }),
        },
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary }}>{completeModalTask?.title ?? completeModalTask?.subject ?? 'Completar tarea'}</DialogTitle>
      <DialogContent sx={{ ...pageStyles.dialogContent, pt: 5, pb: 3, overflow: 'visible' }}>
        {completeModalViewOnly && completeModalLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Cargando información de completada...
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 }}>
                Fecha completa
              </Typography>
              <TextField
                type="date"
                value={completeDate}
                onChange={(e) => setCompleteDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={completeModalViewOnly}
                InputProps={{
                  readOnly: completeModalViewOnly,
                  endAdornment: (
                    <InputAdornment position="end" sx={{ pointerEvents: 'none', mr: 0.5 }}>
                      <CalendarToday sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { border: '2px solid', borderColor: theme.palette.divider, borderRadius: 2 },
                    '&:hover fieldset': { borderColor: theme.palette.divider },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '2px' },
                  },
                  '& input::-webkit-calendar-picker-indicator': {
                    opacity: 0,
                    position: 'absolute',
                    right: 0,
                    width: '100%',
                    height: '100%',
                    cursor: completeModalViewOnly ? 'default' : 'pointer',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 }}>
                Hora
              </Typography>
              <TextField
                type="time"
                value={completeTime}
                onChange={(e) => setCompleteTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={completeModalViewOnly}
                InputProps={{
                  readOnly: completeModalViewOnly,
                  endAdornment: (
                    <InputAdornment position="end" sx={{ pointerEvents: 'none', mr: 0.5 }}>
                      <Schedule sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { border: '2px solid', borderColor: theme.palette.divider, borderRadius: 2 },
                    '&:hover fieldset': { borderColor: theme.palette.divider },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '2px' },
                  },
                  '& input::-webkit-calendar-picker-indicator': { opacity: 0, position: 'absolute', right: 0, width: '100%', height: '100%', cursor: completeModalViewOnly ? 'default' : 'pointer' },
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 }}>
              Observaciones
            </Typography>
            <TextField
              multiline
              rows={8}
              value={completeObservations}
              onChange={(e) => setCompleteObservations(e.target.value)}
              fullWidth
              disabled={completeModalViewOnly}
              InputProps={completeModalViewOnly ? { readOnly: true } : undefined}
              sx={{
                mb: 2,
                mt: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { border: '2px solid', borderColor: theme.palette.divider, borderRadius: 2 },
                  '&:hover fieldset': { borderColor: theme.palette.divider },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '2px' },
                },
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={pageStyles.dialogActions}>
        {completeModalViewOnly ? (
          <Button onClick={handleCloseCompleteModal} sx={pageStyles.cancelButton}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button onClick={handleCloseCompleteModal} sx={pageStyles.cancelButton}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleCompleteWithObservations} disabled={completing} sx={pageStyles.saveButton}>
              {completing ? 'Completando...' : 'Completar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );

  const entity = completeAsModalTask ? getEntityForTask(completeAsModalTask) : null;

  const ActivityModalsJSX =
    completeAsModalTask && entity ? (
      <>
        {completeAsModalTask.type === 'call' && (
          <CallModal
            open={true}
            onClose={() => {
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
            }}
            entityType={entity.entityType}
            entityId={entity.entityId}
            entityName={entity.entityName}
            user={user}
            onSave={async (newActivity?: any) => {
              if (newActivity && onActivityCreated) onActivityCreated(normalizeActivityForList(newActivity));
              await markTaskCompleted(completeAsModalTask!, completeAsModalPayload || undefined);
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
            }}
            relatedEntityIds={{
              contactId: completeAsModalTask.contactId,
              companyId: completeAsModalTask.companyId,
            }}
            initialSubject={completeAsModalTask.title || completeAsModalTask.subject}
            initialDate={completeAsModalPayload?.date}
            initialTime={completeAsModalPayload?.time}
            initialDescription={completeAsModalPayload?.observations}
          />
        )}
        {completeAsModalTask.type === 'meeting' && (
          <MeetingModal
            open={true}
            onClose={() => {
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
            }}
            entityType={entity.entityType}
            entityId={entity.entityId}
            entityName={entity.entityName}
            user={user}
            onSave={async (newActivity?: any) => {
              if (newActivity && onActivityCreated) onActivityCreated(normalizeActivityForList(newActivity));
              await markTaskCompleted(completeAsModalTask!, completeAsModalPayload || undefined);
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
            }}
            initialTitle={completeAsModalTask.title || completeAsModalTask.subject}
            initialDueDate={completeAsModalPayload?.date}
            initialTime={completeAsModalPayload?.time}
            initialDescription={completeAsModalPayload?.observations}
          />
        )}
        {completeAsModalTask.type === 'note' && (
          <NoteModal
            open={true}
            onClose={() => {
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
            }}
            entityType={entity.entityType}
            entityId={entity.entityId}
            entityName={entity.entityName}
            user={user}
            onSave={async (newActivity?: any) => {
              if (newActivity && onActivityCreated) onActivityCreated(normalizeActivityForList(newActivity));
              await markTaskCompleted(completeAsModalTask!, completeAsModalPayload || undefined);
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
            }}
          />
        )}
        {completeAsModalTask.type === 'email' && (
          <EmailComposer
            open={true}
            onClose={() => {
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
              setContactEmailForComplete(null);
            }}
            recipientEmail={contactEmailForComplete?.email}
            recipientName={contactEmailForComplete?.name}
            initialSubject={completeAsModalTask.title || completeAsModalTask.subject}
            initialBody={completeAsModalPayload?.observations ? `<p>${String(completeAsModalPayload.observations).replace(/\n/g, '<br>')}</p>` : undefined}
            registerOnly
            contactId={completeAsModalTask.contactId ?? undefined}
            companyId={completeAsModalTask.companyId ?? undefined}
            onSave={async (newActivity?: any) => {
              const activities = Array.isArray(newActivity) ? newActivity : (newActivity ? [newActivity] : []);
              activities.forEach((a) => onActivityCreated && onActivityCreated(normalizeActivityForList(a)));
              await markTaskCompleted(completeAsModalTask!, completeAsModalPayload || undefined);
              setCompleteAsModalTask(null);
              setCompleteAsModalPayload(null);
              setContactEmailForComplete(null);
            }}
          />
        )}
      </>
    ) : null;

  const LinkPromptJSX = (
    <Dialog
      open={linkPromptOpen}
      onClose={() => {
        setLinkPromptOpen(false);
        setTaskJustCompletedForLink(null);
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 320,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 2 }}>
          ¿Desea crear una nueva tarea vinculada a la misma empresa?
        </Typography>
      </DialogContent>
      <DialogActions sx={pageStyles.dialogActions}>
        <Button
          onClick={() => {
            setLinkPromptOpen(false);
            setTaskJustCompletedForLink(null);
          }}
          sx={pageStyles.cancelButton}
        >
          No gracias
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            if (taskJustCompletedForLink && onOpenNewTaskLinkedTo) {
              onOpenNewTaskLinkedTo(taskJustCompletedForLink);
            }
            setLinkPromptOpen(false);
            setTaskJustCompletedForLink(null);
          }}
          sx={pageStyles.saveButton}
        >
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );

  return {
    openCompleteModal,
    openCompleteModalView,
    handleToggleComplete,
    CompleteModalJSX,
    ActivityModalsJSX,
    LinkPromptJSX,
  };
}
