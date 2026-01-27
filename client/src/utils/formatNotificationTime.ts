// Utilidad para formatear el tiempo de las notificaciones de manera inteligente

/**
 * Formatea la fecha de una notificación de manera inteligente:
 * - Si es reciente (hoy): muestra la hora (ej. 14:32)
 * - Si fue ayer: muestra "Ayer"
 * - Si es más antigua: muestra la fecha completa
 */
export const formatNotificationTime = (date: Date | string): string => {
  const notificationDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const notificationDay = new Date(
    notificationDate.getFullYear(),
    notificationDate.getMonth(),
    notificationDate.getDate()
  );

  // Si es hoy, mostrar solo la hora
  if (notificationDay.getTime() === today.getTime()) {
    return notificationDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Si fue ayer
  if (notificationDay.getTime() === yesterday.getTime()) {
    return 'Ayer';
  }

  // Si es más antigua, mostrar fecha completa
  return notificationDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Obtiene la fecha y hora exacta formateada para mostrar en el detalle
 */
export const formatNotificationDateTime = (date: Date | string): string => {
  const notificationDate = typeof date === 'string' ? new Date(date) : date;
  return notificationDate.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
