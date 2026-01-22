/**
 * Utilidades para el componente Calendar
 */

export interface CalendarEvent {
  id: number | string;
  title: string;
  time: string;
  color: string;
  type: 'task' | 'event' | 'note' | 'meeting';
  dueDate?: string;
  isGoogleEvent?: boolean;
  isNote?: boolean;
  isMeeting?: boolean;
  description?: string;
  location?: string;
  priority?: string;
  status?: string;
}

export interface CalendarDay {
  day: number | null;
  isCurrentMonth: boolean;
  date: Date;
}

/**
 * Obtiene la fecha de un evento de Google Calendar
 */
export const getEventDate = (event: any): Date => {
  if (event.start?.dateTime) {
    const dateTime = new Date(event.start.dateTime);
    const year = dateTime.getUTCFullYear();
    const month = dateTime.getUTCMonth();
    const day = dateTime.getUTCDate();
    return new Date(year, month, day);
  } else if (event.start?.date) {
    const dateStr = event.start.date;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

/**
 * Obtiene la hora formateada de un evento
 */
export const getEventTime = (event: any): string => {
  if (event.start?.dateTime) {
    return new Date(event.start.dateTime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (event.dueDate) {
    return new Date(event.dueDate).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (event.createdAt) {
    return new Date(event.createdAt).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
};

/**
 * Formatea una fecha como string YYYY-MM-DD
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene todos los días del calendario (mes anterior, actual, siguiente)
 */
export const getCalendarDays = (
  year: number,
  month: number
): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = (firstDay.getDay() + 6) % 7; // Lunes = 0

  // Días del mes anterior
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();

  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    days.push({
      day,
      isCurrentMonth: false,
      date: new Date(year, month - 1, day),
    });
  }

  // Días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Días del mes siguiente para completar la cuadrícula (6 semanas * 7 días = 42)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  return days;
};

/**
 * Verifica si una fecha es hoy
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Obtiene el color según el tipo de evento
 */
export const getEventColor = (type: 'task' | 'event' | 'note' | 'meeting'): string => {
  const colors = {
    task: '#F97316', // Naranja
    event: '#1976d2', // Azul
    note: '#10B981', // Verde
    meeting: '#FF6B6B', // Rojo/Rosa para reuniones
  };
  return colors[type] || '#757575';
};

/**
 * Obtiene la etiqueta de un tipo de tarea
 */
export const getTaskTypeLabel = (type: string): string => {
  const labels: { [key: string]: string } = {
    todo: 'Tarea',
    call: 'Llamada',
    email: 'Email',
    meeting: 'Reunión',
    note: 'Nota',
  };
  return labels[type] || type;
};

/**
 * Combina tareas, eventos, notas y reuniones de un día en un array unificado
 */
export const getAllEventsForDay = (
  day: number,
  year: number,
  month: number,
  tasks: any[],
  googleEvents: any[],
  notes: any[],
  meetings: any[] = []
): CalendarEvent[] => {
  const dateStr = formatDateString(new Date(year, month, day));

  // Filtrar tareas del día
  const dayTasks = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return formatDateString(taskDate) === dateStr;
    })
    .map((task) => {
      // Si la tarea es de tipo 'meeting', usar el color de reunión
      const isMeetingTask = task.type === 'meeting';
      return {
        id: task.id,
        title: task.title || 'Sin título',
        time: getEventTime(task),
        color: isMeetingTask ? getEventColor('meeting') : getEventColor('task'),
        type: (isMeetingTask ? 'meeting' : 'task') as 'task' | 'meeting',
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        isMeeting: isMeetingTask,
      };
    });

  // Filtrar eventos de Google del día
  const dayEvents = googleEvents
    .filter((event) => {
      if (!event.start) return false;
      const eventDate = getEventDate(event);
      return formatDateString(eventDate) === dateStr;
    })
    .map((event) => ({
      id: event.id,
      title: event.summary || 'Sin título',
      time: getEventTime(event),
      color: getEventColor('event'),
      type: 'event' as const,
      isGoogleEvent: true,
      description: event.description,
      location: event.location,
    }));

  // Filtrar notas del día
  const dayNotes = notes
    .filter((note) => {
      if (!note.createdAt) return false;
      const noteDate = new Date(note.createdAt);
      return formatDateString(noteDate) === dateStr;
    })
    .map((note) => ({
      id: note.id,
      title: note.subject || note.description || 'Sin título',
      time: getEventTime(note),
      color: getEventColor('note'),
      type: 'note' as const,
      isNote: true,
      description: note.description,
    }));

  // Filtrar reuniones del día
  const dayMeetings = meetings
    .filter((meeting) => {
      // Las reuniones pueden tener dueDate o createdAt
      if (meeting.dueDate) {
        const meetingDate = new Date(meeting.dueDate);
        return formatDateString(meetingDate) === dateStr;
      }
      if (meeting.createdAt) {
        const meetingDate = new Date(meeting.createdAt);
        return formatDateString(meetingDate) === dateStr;
      }
      return false;
    })
    .map((meeting) => ({
      id: meeting.id,
      title: meeting.subject || meeting.description || 'Sin título',
      time: getEventTime(meeting),
      color: getEventColor('meeting'),
      type: 'meeting' as const,
      isMeeting: true,
      description: meeting.description,
      dueDate: meeting.dueDate,
    }));

  // Combinar y ordenar por hora
  const allEvents = [...dayTasks, ...dayEvents, ...dayNotes, ...dayMeetings];
  return allEvents.sort((a, b) => {
    if (!a.time || !b.time) return 0;
    return a.time.localeCompare(b.time);
  });
};

/**
 * Trunca el título de un evento si es muy largo
 */
export const truncateEventTitle = (title: string, maxLength: number = 20): string => {
  if (title.length <= maxLength) return title;
  return `${title.substring(0, maxLength)}...`;
};

/**
 * Obtiene tareas para un día específico
 */
export const getTasksForDay = (
  day: number,
  year: number,
  month: number,
  tasks: any[]
): any[] => {
  const dateStr = formatDateString(new Date(year, month, day));
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return formatDateString(taskDate) === dateStr;
  });
};

/**
 * Obtiene eventos de Google Calendar para un día específico
 */
export const getEventsForDay = (
  day: number,
  year: number,
  month: number,
  googleEvents: any[]
): any[] => {
  const dateStr = formatDateString(new Date(year, month, day));
  return googleEvents.filter((event) => {
    if (!event.start) return false;
    const eventDate = getEventDate(event);
    return formatDateString(eventDate) === dateStr;
  });
};

/**
 * Obtiene notas para un día específico
 */
export const getNotesForDay = (
  day: number,
  year: number,
  month: number,
  notes: any[]
): any[] => {
  const dateStr = formatDateString(new Date(year, month, day));
  return notes.filter((note) => {
    if (!note.createdAt) return false;
    const noteDate = new Date(note.createdAt);
    return formatDateString(noteDate) === dateStr;
  });
};

