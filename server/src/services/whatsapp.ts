import axios from 'axios';
import { Task } from '../models/Task';
import { User } from '../models/User';

/**
 * Envía una notificación de WhatsApp cuando se crea una tarea
 */
export async function sendTaskNotification(task: Task, assignedUser?: User): Promise<void> {
  try {
    // Verificar que el usuario tenga teléfono
    if (!assignedUser?.phone) {
      console.log(`Usuario ${assignedUser?.id} no tiene teléfono configurado, omitiendo WhatsApp`);
      return;
    }

    // Verificar que estén configuradas las variables de entorno
    const apiUrl = process.env.WHATSAPP_API_URL || 'https://api-wsp.3w.pe';
    const apiToken = process.env.WHATSAPP_API_TOKEN;

    if (!apiToken) {
      console.log('WHATSAPP_API_TOKEN no configurado, omitiendo envío de WhatsApp');
      return;
    }

    // Formatear el mensaje
    const message = formatTaskMessage(task);

    // Limpiar el teléfono (quitar espacios, guiones, etc.)
    const phone = assignedUser.phone.replace(/\D/g, ''); // Solo números

    // Enviar mensaje a la API
    const response = await axios.post(
      `${apiUrl}/instances/${apiToken}/messages/text`,
      {
        phone: phone,
        message: message
      }
    );

    console.log('WhatsApp enviado exitosamente:', response.data);
  } catch (error: any) {
    // No fallar la creación de la tarea si hay error con WhatsApp
    console.error('Error enviando WhatsApp:', error.message);
  }
}

/**
 * Formatea el mensaje de la tarea para WhatsApp
 */
function formatTaskMessage(task: Task): string {
  const typeMap: Record<string, string> = {
    'call': '📞 Llamada',
    'email': '📧 Email',
    'meeting': '🤝 Reunión',
    'note': '📝 Nota',
    'todo': '✅ Tarea',
    'other': '📋 Otra'
  };

  const priorityMap: Record<string, string> = {
    'low': '🟢 Baja',
    'medium': '🟡 Media',
    'high': '🟠 Alta',
    'urgent': '🔴 Urgente'
  };

  let message = `📋 *Nueva Tarea Asignada*\n\n`;
  message += `*Título:* ${task.title}\n`;
  message += `*Tipo:* ${typeMap[task.type] || task.type}\n`;
  message += `*Prioridad:* ${priorityMap[task.priority] || task.priority}\n`;
  
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    message += `*Fecha límite:* ${dueDate}\n`;
  }
  
  if (task.description) {
    message += `\n*Descripción:*\n${task.description}`;
  }

  return message;
}