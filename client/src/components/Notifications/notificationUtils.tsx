// Utilidades compartidas para los componentes de notificaciones
// Archivo TSX para permitir JSX - NO USAR .ts

import React from 'react';
import {
  Assignment,
  Event,
  Person,
  AttachMoney,
  Email,
  Notifications,
  Schedule,
  CheckCircle,
  Business,
} from '@mui/icons-material';
import { RiAlarmWarningFill } from 'react-icons/ri';
import { Notification } from '../../types/notification';
import { taxiMonterricoColors } from '../../theme/colors';

// Componente wrapper para el ícono de alarma
const AlarmIcon = () => {
  // Usar React.createElement para evitar problemas de tipos con React 19
  return React.createElement(RiAlarmWarningFill as any);
};

export const getNotificationIcon = (type: Notification['type'], notificationId?: string) => {
  // Si es la notificación de inactividad, usar el ícono de alarma
  if (notificationId === 'inactivity-alert') {
    return <AlarmIcon />;
  }

  switch (type) {
    case 'task':
      return <Assignment />;
    case 'event':
      return <Event />;
    case 'contact':
      return <Person />;
    case 'company':
      return <Business />;
    case 'deal':
      return <AttachMoney />;
    case 'email':
      return <Email />;
    case 'reminder':
      return <Schedule />;
    case 'system':
      return <Notifications />;
    case 'activity':
      return <CheckCircle />;
    default:
      return <Notifications />;
  }
};

export const getNotificationColor = (type: Notification['type'], notificationId?: string): string => {
  // Si es la notificación de inactividad, usar color de advertencia (naranja)
  if (notificationId === 'inactivity-alert') {
    return '#FF9800'; // Naranja de advertencia
  }

  switch (type) {
    case 'task':
      return taxiMonterricoColors.green;
    case 'event':
      return '#2196F3';
    case 'contact':
      return '#9C27B0';
    case 'company':
      return '#673AB7';
    case 'deal':
      return taxiMonterricoColors.orange;
    case 'email':
      return '#00BCD4';
    case 'reminder':
      return '#FF9800';
    case 'system':
      return '#607D8B';
    case 'activity':
      return taxiMonterricoColors.green;
    default:
      return taxiMonterricoColors.green;
  }
};

export const getNotificationTypeLabel = (type: Notification['type']): string => {
  switch (type) {
    case 'task':
      return 'Tarea';
    case 'event':
      return 'Evento';
    case 'contact':
      return 'Contacto';
    case 'company':
      return 'Empresa';
    case 'deal':
      return 'Negocio';
    case 'email':
      return 'Correo';
    case 'reminder':
      return 'Recordatorio';
    case 'system':
      return 'Sistema';
    case 'activity':
      return 'Actividad';
    default:
      return 'Notificación';
  }
};
