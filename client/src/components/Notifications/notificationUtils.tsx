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
} from '@mui/icons-material';
import { Notification } from '../../types/notification';
import { taxiMonterricoColors } from '../../theme/colors';

export const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'task':
      return <Assignment />;
    case 'event':
      return <Event />;
    case 'contact':
      return <Person />;
    case 'deal':
      return <AttachMoney />;
    case 'email':
      return <Email />;
    case 'reminder':
      return <Schedule />;
    case 'system':
      return <Notifications />;
    default:
      return <Notifications />;
  }
};

export const getNotificationColor = (type: Notification['type']): string => {
  switch (type) {
    case 'task':
      return taxiMonterricoColors.green;
    case 'event':
      return '#2196F3';
    case 'contact':
      return '#9C27B0';
    case 'deal':
      return taxiMonterricoColors.orange;
    case 'email':
      return '#00BCD4';
    case 'reminder':
      return '#FF9800';
    case 'system':
      return '#607D8B';
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
    case 'deal':
      return 'Negocio';
    case 'email':
      return 'Correo';
    case 'reminder':
      return 'Recordatorio';
    case 'system':
      return 'Sistema';
    default:
      return 'Notificación';
  }
};
