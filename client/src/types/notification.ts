// Tipos para el sistema de notificaciones

export type NotificationType = 'task' | 'event' | 'deal' | 'contact' | 'company' | 'email' | 'system' | 'reminder' | 'activity';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  archived?: boolean;
  createdAt: Date | string;
  type: NotificationType;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    contactId?: number;
    companyId?: number;
    dealId?: number;
    taskId?: number;
    [key: string]: any;
  };
}
