// Hook personalizado para manejar el estado de las notificaciones

import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/notification';
import { mockNotifications } from '../data/mockNotifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar notificaciones (mockeadas por ahora, preparado para backend)
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        // Simular carga asíncrona
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Aquí se conectaría al backend en el futuro
        // const response = await api.get('/notifications');
        // setNotifications(response.data);
        
        // Por ahora usar datos mockeados
        setNotifications(mockNotifications);
        
        // Log de cantidad de notificaciones
        const totalNotifications = mockNotifications.length;
        const unreadNotifications = mockNotifications.filter(n => !n.read).length;
        console.log(`📬 Notificaciones cargadas: ${totalNotifications} totales, ${unreadNotifications} no leídas`);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        console.log('📬 Notificaciones cargadas: 0 totales, 0 no leídas');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Marcar notificación como leída
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      const unreadCount = updated.filter(n => !n.read).length;
      console.log(`📬 Notificación marcada como leída. Total: ${updated.length}, No leídas: ${unreadCount}`);
      return updated;
    });
    
    // Aquí se haría la llamada al backend en el futuro
    // await api.patch(`/notifications/${id}/read`);
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      console.log(`📬 Todas las notificaciones marcadas como leídas. Total: ${updated.length}, No leídas: 0`);
      return updated;
    });
    
    // Aquí se haría la llamada al backend en el futuro
    // await api.patch('/notifications/read-all');
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id);
      const unreadCount = updated.filter(n => !n.read).length;
      console.log(`📬 Notificación eliminada. Total: ${updated.length}, No leídas: ${unreadCount}`);
      return updated;
    });
    
    // Aquí se haría la llamada al backend en el futuro
    // await api.delete(`/notifications/${id}`);
  }, []);

  // Archivar notificación
  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, archived: true, read: true } : notif
      );
      const totalCount = updated.filter(n => !n.archived).length;
      const unreadCount = updated.filter(n => !n.read && !n.archived).length;
      const archivedCount = updated.filter(n => n.archived).length;
      console.log(`📬 Notificación archivada. Todas: ${totalCount}, No leídas: ${unreadCount}, Archivadas: ${archivedCount}`);
      return updated;
    });
    
    // Aquí se haría la llamada al backend en el futuro
    // await api.patch(`/notifications/${id}/archive`);
  }, []);

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Log cuando cambia el conteo de notificaciones
  useEffect(() => {
    if (!loading && notifications.length > 0) {
      console.log(`📬 Estado actual de notificaciones: ${notifications.length} totales, ${unreadCount} no leídas`);
    }
  }, [notifications.length, unreadCount, loading]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    archiveNotification,
  };
};
