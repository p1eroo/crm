// Datos mockeados de notificaciones para desarrollo y pruebas

import { Notification } from '../types/notification';

const now = new Date();
const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nueva tarea asignada',
    message: 'Tienes una nueva tarea: "Seguimiento con cliente ABC" asignada para hoy.',
    read: false,
    createdAt: oneHourAgo,
    type: 'task',
    actionUrl: '/tasks',
    actionLabel: 'Ver tarea',
    metadata: {
      taskId: 123,
    },
  },
  {
    id: '2',
    title: 'Reunión en 30 minutos',
    message: 'Tienes una reunión programada: "Presentación de propuesta comercial" a las 15:00.',
    read: false,
    createdAt: oneHourAgo,
    type: 'event',
    actionUrl: '/calendar',
    actionLabel: 'Ver calendario',
    metadata: {
      eventId: 456,
    },
  },
  {
    id: '3',
    title: 'Nuevo contacto agregado',
    message: 'Se ha agregado un nuevo contacto: "Juan Pérez" a la empresa "Tech Solutions".',
    read: false,
    createdAt: yesterday,
    type: 'contact',
    actionUrl: '/contacts',
    actionLabel: 'Ver contacto',
    metadata: {
      contactId: 789,
      companyId: 101,
    },
  },
  {
    id: '4',
    title: 'Negocio cerrado',
    message: 'El negocio "Contrato anual con XYZ Corp" ha sido marcado como cerrado exitosamente.',
    read: true,
    archived: true,
    createdAt: yesterday,
    type: 'deal',
    actionUrl: '/deals',
    actionLabel: 'Ver negocio',
    metadata: {
      dealId: 234,
    },
  },
  {
    id: '5',
    title: 'Nuevo correo recibido',
    message: 'Has recibido un nuevo correo de "maria.garcia@example.com" con asunto "Propuesta comercial".',
    read: false,
    createdAt: twoDaysAgo,
    type: 'email',
    actionUrl: '/emails',
    actionLabel: 'Ver correo',
    metadata: {
      emailId: 567,
    },
  },
  {
    id: '6',
    title: 'Recordatorio de seguimiento',
    message: 'Es momento de hacer seguimiento al contacto "Carlos Rodríguez" de la empresa "Innovation Labs".',
    read: true,
    archived: true,
    createdAt: twoDaysAgo,
    type: 'reminder',
    actionUrl: '/contacts',
    actionLabel: 'Ver contacto',
    metadata: {
      contactId: 890,
    },
  },
  {
    id: '7',
    title: 'Actualización del sistema',
    message: 'El sistema ha sido actualizado con nuevas funcionalidades. Revisa las mejoras en la sección de configuración.',
    read: false,
    createdAt: lastWeek,
    type: 'system',
    actionUrl: '/settings',
    actionLabel: 'Ver configuración',
  },
  {
    id: '8',
    title: 'Tarea completada',
    message: 'La tarea "Preparar informe mensual" ha sido completada exitosamente.',
    read: true,
    archived: true,
    createdAt: lastWeek,
    type: 'task',
    actionUrl: '/tasks',
    actionLabel: 'Ver tareas',
    metadata: {
      taskId: 345,
    },
  },
  {
    id: '9',
    title: 'Nuevo negocio creado',
    message: 'Se ha creado un nuevo negocio: "Proyecto de expansión Q1 2026" con un valor estimado de $50,000.',
    read: false,
    createdAt: thirtyMinutesAgo,
    type: 'deal',
    actionUrl: '/deals',
    actionLabel: 'Ver negocio',
    metadata: {
      dealId: 456,
    },
  },
  {
    id: '10',
    title: 'Recordatorio de llamada',
    message: 'Tienes una llamada programada con "Ana Martínez" de "Global Solutions" en 15 minutos.',
    read: false,
    createdAt: twoHoursAgo,
    type: 'reminder',
    actionUrl: '/contacts',
    actionLabel: 'Ver contacto',
    metadata: {
      contactId: 112,
    },
  },
  {
    id: '11',
    title: 'Nueva empresa agregada',
    message: 'Se ha agregado una nueva empresa: "Digital Innovations S.A." al sistema.',
    read: false,
    createdAt: threeDaysAgo,
    type: 'contact',
    actionUrl: '/companies',
    actionLabel: 'Ver empresa',
    metadata: {
      companyId: 223,
    },
  },
  {
    id: '12',
    title: 'Tarea vencida',
    message: 'La tarea "Enviar cotización a cliente VIP" está vencida. Por favor, revisa y completa.',
    read: false,
    createdAt: yesterday,
    type: 'task',
    actionUrl: '/tasks',
    actionLabel: 'Ver tarea',
    metadata: {
      taskId: 567,
    },
  },
  {
    id: '13',
    title: 'Negocio actualizado',
    message: 'El negocio "Contrato de servicios profesionales" ha sido actualizado con nueva información.',
    read: true,
    createdAt: twoDaysAgo,
    type: 'deal',
    actionUrl: '/deals',
    actionLabel: 'Ver negocio',
    metadata: {
      dealId: 678,
    },
  },
  {
    id: '14',
    title: 'Nuevo mensaje de chat',
    message: 'Has recibido un nuevo mensaje de "Luis Fernández" en el chat de equipo.',
    read: false,
    createdAt: oneHourAgo,
    type: 'email',
    actionUrl: '/messages',
    actionLabel: 'Ver mensaje',
    metadata: {
      messageId: 789,
    },
  },
  {
    id: '15',
    title: 'Reunión cancelada',
    message: 'La reunión "Revisión de estrategia Q1" programada para mañana ha sido cancelada.',
    read: true,
    createdAt: yesterday,
    type: 'event',
    actionUrl: '/calendar',
    actionLabel: 'Ver calendario',
    metadata: {
      eventId: 890,
    },
  },
];
