// Hook personalizado para manejar el estado de las notificaciones

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { Notification } from '../types/notification';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Función helper para determinar el mensaje según la urgencia
  const getUrgencyMessage = (dueDate: Date, now: Date, isMeeting: boolean = false): string => {
    const date = new Date(dueDate);
    date.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return isMeeting ? 'Reunión hoy' : 'Tarea vence hoy';
    } else if (diffDays === 1) {
      return isMeeting ? 'Reunión mañana' : 'Tarea vence mañana';
    } else {
      return isMeeting ? 'Reunión esta semana' : 'Tarea vence esta semana';
    }
  };

  // Cargar notificaciones desde el backend
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Obtener tareas
      const tasksResponse = await api.get('/tasks', {
        params: {
          limit: 100,
          assignedToId: user.id,
        },
      });

      let tasks: any[] = [];
      if (Array.isArray(tasksResponse.data)) {
        tasks = tasksResponse.data;
      } else if (tasksResponse.data?.tasks && Array.isArray(tasksResponse.data.tasks)) {
        tasks = tasksResponse.data.tasks;
      }

      // Filtrar tareas próximas
      const upcomingTasks = tasks.filter((task: any) => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= now && dueDate <= nextWeek;
      });

      // Obtener eventos de Google Calendar
      let upcomingEvents: any[] = [];
      try {
        const calendarResponse = await api.get('/google/events');
        if (calendarResponse.data && Array.isArray(calendarResponse.data)) {
          upcomingEvents = calendarResponse.data.filter((event: any) => {
            if (!event.start?.dateTime && !event.start?.date) return false;
            const eventDate = new Date(event.start.dateTime || event.start.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= now && eventDate <= nextWeek;
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.log('Error obteniendo eventos de Google Calendar:', error.message);
        }
      }

      // Obtener contactos recientes (últimas 24 horas)
      let recentContacts: any[] = [];
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const contactsResponse = await api.get('/contacts', {
          params: {
            limit: 20,
            sortBy: 'newest',
            page: 1,
          },
        });
        if (contactsResponse.data?.contacts && Array.isArray(contactsResponse.data.contacts)) {
          recentContacts = contactsResponse.data.contacts.filter((contact: any) => {
            const contactDate = new Date(contact.createdAt);
            return contactDate >= yesterday;
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.log('Error obteniendo contactos recientes:', error.message);
        }
      }

      // Obtener empresas recientes (últimas 24 horas)
      let recentCompanies: any[] = [];
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const companiesResponse = await api.get('/companies', {
          params: {
            limit: 20,
            sortBy: 'newest',
            page: 1,
          },
        });
        if (companiesResponse.data?.companies && Array.isArray(companiesResponse.data.companies)) {
          recentCompanies = companiesResponse.data.companies.filter((company: any) => {
            const companyDate = new Date(company.createdAt);
            return companyDate >= yesterday;
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.log('Error obteniendo empresas recientes:', error.message);
        }
      }

      // Obtener negocios recientes (últimas 24 horas)
      let recentDeals: any[] = [];
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dealsResponse = await api.get('/deals', {
          params: {
            limit: 20,
            sortBy: 'newest',
            page: 1,
          },
        });
        if (dealsResponse.data?.deals && Array.isArray(dealsResponse.data.deals)) {
          recentDeals = dealsResponse.data.deals.filter((deal: any) => {
            const dealDate = new Date(deal.createdAt);
            return dealDate >= yesterday;
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.log('Error obteniendo negocios recientes:', error.message);
        }
      }

      // Obtener actividades recientes (llamadas, emails, notas - últimas 24 horas)
      let recentActivities: any[] = [];
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const activitiesResponse = await api.get('/activities', {
          params: {
            limit: 20,
            page: 1,
          },
        });
        let activities: any[] = [];
        if (Array.isArray(activitiesResponse.data)) {
          activities = activitiesResponse.data;
        } else if (activitiesResponse.data?.activities && Array.isArray(activitiesResponse.data.activities)) {
          activities = activitiesResponse.data.activities;
        }
        recentActivities = activities.filter((activity: any) => {
          const activityDate = new Date(activity.createdAt);
          return activityDate >= yesterday && 
                 ['call', 'email', 'note'].includes(activity.type);
        });
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.log('Error obteniendo actividades recientes:', error.message);
        }
      }

      // Obtener empresas inactivas
      let inactiveCompaniesCount = 0;
      try {
        const inactivityResponse = await api.get('/companies/inactivity-stats');
        inactiveCompaniesCount = inactivityResponse.data?.inactiveCount || 0;
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.log('Error obteniendo empresas inactivas:', error.message);
        }
      }

      // Convertir a formato Notification
      const allNotifications: Notification[] = [
        ...upcomingTasks.map((task: any) => {
          // Verificar si es una reunión para clasificarla como evento
          const isMeeting = task.type === 'meeting';
          const notificationType: 'task' | 'event' = isMeeting ? 'event' : 'task';
          return {
            id: `task-${task.id}`,
            type: notificationType,
            title: task.title,
            message: getUrgencyMessage(new Date(task.dueDate), now, isMeeting),
            read: false,
            archived: false,
            createdAt: task.createdAt || new Date().toISOString(),
            actionUrl: `/tasks/${task.id}`,
            actionLabel: isMeeting ? 'Ver reunión' : 'Ver tarea',
            metadata: {
              taskId: task.id,
              contactId: task.contactId || null,
              companyId: task.companyId || null,
              dealId: task.dealId || null,
            },
          };
        }),
        ...upcomingEvents.map((event: any) => {
          const eventDate = new Date(event.start?.dateTime || event.start?.date);
          return {
            id: `event-${event.id}`,
            type: 'event' as const,
            title: event.summary || 'Evento sin título',
            message: getUrgencyMessage(eventDate, now, true),
            read: false,
            archived: false,
            createdAt: event.created || new Date().toISOString(),
            actionUrl: undefined,
          };
        }),
        // Notificaciones de contactos recientes
        ...recentContacts.map((contact: any) => ({
          id: `contact-${contact.id}`,
          type: 'contact' as const,
          title: `${contact.firstName} ${contact.lastName}`,
          message: 'Contacto creado recientemente',
          read: false,
          archived: false,
          createdAt: contact.createdAt || new Date().toISOString(),
          actionUrl: `/contacts/${contact.id}`,
          actionLabel: 'Ver contacto',
          metadata: {
            contactId: contact.id,
            companyId: contact.companyId || null,
          },
        })),
        // Notificaciones de empresas recientes
        ...recentCompanies.map((company: any) => ({
          id: `company-${company.id}`,
          type: 'company' as const,
          title: company.name,
          message: 'Empresa creada recientemente',
          read: false,
          archived: false,
          createdAt: company.createdAt || new Date().toISOString(),
          actionUrl: `/companies/${company.id}`,
          actionLabel: 'Ver empresa',
          metadata: {
            companyId: company.id,
          },
        })),
        // Notificaciones de negocios recientes
        ...recentDeals.map((deal: any) => ({
          id: `deal-${deal.id}`,
          type: 'deal' as const,
          title: deal.name,
          message: 'Negocio creado recientemente',
          read: false,
          archived: false,
          createdAt: deal.createdAt || new Date().toISOString(),
          actionUrl: `/deals/${deal.id}`,
          actionLabel: 'Ver negocio',
          metadata: {
            dealId: deal.id,
            contactId: deal.contactId || null,
            companyId: deal.companyId || null,
          },
        })),
        // Notificaciones de actividades recientes (llamadas, emails, notas)
        ...recentActivities.map((activity: any) => {
          const activityTypeMap: { [key: string]: 'activity' | 'email' } = {
            'call': 'activity',
            'email': 'email',
            'note': 'activity',
          };
          const typeLabels: { [key: string]: string } = {
            'call': 'Llamada',
            'email': 'Correo',
            'note': 'Nota',
          };
          return {
            id: `activity-${activity.id}`,
            type: activityTypeMap[activity.type] || 'activity',
            title: activity.subject || activity.title || `${typeLabels[activity.type] || 'Actividad'} creada`,
            message: `${typeLabels[activity.type] || 'Actividad'} creada recientemente`,
            read: false,
            archived: false,
            createdAt: activity.createdAt || new Date().toISOString(),
            actionUrl: activity.contactId ? `/contacts/${activity.contactId}` : 
                      activity.companyId ? `/companies/${activity.companyId}` : 
                      activity.dealId ? `/deals/${activity.dealId}` : undefined,
            actionLabel: activity.contactId ? 'Ver contacto' : 
                        activity.companyId ? 'Ver empresa' : 
                        activity.dealId ? 'Ver negocio' : undefined,
            metadata: {
              contactId: activity.contactId || null,
              companyId: activity.companyId || null,
              dealId: activity.dealId || null,
            },
          };
        }),
      ];

      // Notificación de empresas inactivas
      if (inactiveCompaniesCount > 0) {
        allNotifications.push({
          id: 'inactivity-alert',
          type: 'system' as const,
          title: 'Empresas inactivas',
          message: `${inactiveCompaniesCount} ${inactiveCompaniesCount === 1 ? 'empresa sin contacto' : 'empresas sin contacto'} en los últimos 5 días`,
          read: false,
          archived: false,
          createdAt: new Date().toISOString(),
          actionUrl: '/companies',
          actionLabel: 'Ver empresas',
          metadata: {
            inactiveCount: inactiveCompaniesCount,
          },
        });
      }

      // Ordenar por fecha
      allNotifications.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Más recientes primero
      });

      // Cargar estado guardado en localStorage
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        try {
          const saved = JSON.parse(savedNotifications);
          // Combinar con las nuevas notificaciones, manteniendo solo el estado guardado (read, archived)
          // pero preservando el tipo y mensaje actualizados de la nueva notificación
          const merged = allNotifications.map(notif => {
            // Para la notificación de inactividad, mantener el contenido actualizado pero respetar el estado de lectura
            if (notif.id === 'inactivity-alert') {
              const savedNotif = saved.find((s: Notification) => s.id === 'inactivity-alert');
              if (savedNotif) {
                // Mantener el contenido actualizado (mensaje, fecha) pero preservar el estado de lectura
                return { 
                  ...notif, 
                  read: savedNotif.read ?? notif.read,
                  archived: false // Nunca archivada
                };
              }
              return notif;
            }
            
            const savedNotif = saved.find((s: Notification) => s.id === notif.id);
            if (savedNotif) {
              // Preservar el tipo y mensaje de la nueva notificación (puede haber cambiado)
              // pero mantener el estado de lectura/archivado guardado
              return { 
                ...notif, 
                read: savedNotif.read ?? notif.read,
                archived: savedNotif.archived ?? notif.archived
                // No sobrescribir type, message, actionLabel ya que pueden haber cambiado
              };
            }
            return notif;
          });
          setNotifications(merged);
        } catch (error) {
          setNotifications(allNotifications);
        }
      } else {
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar notificaciones al montar y cuando cambie el usuario
  useEffect(() => {
    fetchNotifications();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    // Escuchar eventos de actividad completada
    const handleActivityCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { title, timestamp } = customEvent.detail;
      
      const newNotification: Notification = {
        id: `activity-${Date.now()}`,
        type: 'activity',
        title: title,
        message: 'Actividad completada',
        read: false,
        archived: false,
        createdAt: timestamp || new Date().toISOString(),
      };
      
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === newNotification.id);
        if (exists) return prev;
        return [newNotification, ...prev];
      });
    };
    
    window.addEventListener('activityCompleted', handleActivityCompleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener('activityCompleted', handleActivityCompleted);
    };
  }, [fetchNotifications]);

  // Guardar estado en localStorage cuando cambien las notificaciones
  useEffect(() => {
    if (notifications.length > 0) {
      // Guardar notificaciones, pero asegurar que la de inactividad nunca esté archivada
      const notificationsToSave = notifications.map(notif => {
        if (notif.id === 'inactivity-alert') {
          return { ...notif, archived: false };
        }
        return notif;
      });
      localStorage.setItem('notifications', JSON.stringify(notificationsToSave));
    }
  }, [notifications]);

  // Marcar notificación como leída
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Archivar notificación
  const archiveNotification = useCallback((id: string) => {
    // La notificación de inactividad no se puede archivar
    if (id === 'inactivity-alert') {
      return;
    }
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, archived: true, read: true } : notif
      )
    );
  }, []);

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    removeNotification,
    refreshNotifications: fetchNotifications,
  };
};
