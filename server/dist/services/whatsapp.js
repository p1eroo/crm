"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTaskNotification = sendTaskNotification;
const axios_1 = __importDefault(require("axios"));
/**
 * Envía una notificación de WhatsApp cuando se crea una tarea
 */
async function sendTaskNotification(task, assignedUser) {
    try {
        console.log(`[WhatsApp] Iniciando envío de notificación para tarea #${task.id}`);
        // Verificar que el usuario tenga teléfono
        if (!assignedUser?.phone) {
            console.log(`[WhatsApp] ⚠️ Usuario ${assignedUser?.id} (${assignedUser?.firstName} ${assignedUser?.lastName}) no tiene teléfono configurado, omitiendo WhatsApp`);
            return;
        }
        // Verificar que estén configuradas las variables de entorno
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://api-wsp.3w.pe';
        let apiToken = process.env.WHATSAPP_API_TOKEN;
        if (!apiToken) {
            console.log('[WhatsApp] ⚠️ WHATSAPP_API_TOKEN no configurado, omitiendo envío de WhatsApp');
            return;
        }
        // Limpiar el token (quitar "Bearer " si está presente)
        apiToken = apiToken.replace(/^Bearer\s+/i, '');
        // Formatear el mensaje
        const message = formatTaskMessage(task);
        // Limpiar el teléfono (quitar espacios, guiones, etc.)
        const phone = assignedUser.phone.replace(/\D/g, ''); // Solo números
        console.log(`[WhatsApp] Enviando a ${phone} (Usuario: ${assignedUser.firstName} ${assignedUser.lastName})`);
        // Enviar mensaje a la API con timeout y headers apropiados
        const response = await axios_1.default.post(`${apiUrl}/instances/${apiToken}/messages/text`, {
            phone: phone,
            message: message
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 segundos
            validateStatus: (status) => status < 500,
        });
        if (response.status >= 200 && response.status < 300) {
            console.log(`[WhatsApp] ✅ Enviado exitosamente a ${phone}`);
            console.log(`[WhatsApp] Respuesta:`, JSON.stringify(response.data, null, 2));
            // Verificar si la respuesta indica desconexión
            if (response.data && typeof response.data === 'object') {
                if (response.data.status === 'disconnected' || response.data.connected === false) {
                    console.warn('[WhatsApp] ⚠️ La instancia se desconectó después del envío (comportamiento normal de la API)');
                }
            }
        }
        else {
            console.warn(`[WhatsApp] ⚠️ Respuesta con status ${response.status}:`, JSON.stringify(response.data, null, 2));
        }
    }
    catch (error) {
        // No fallar la creación de la tarea si hay error con WhatsApp
        console.error('[WhatsApp] ❌ Error enviando WhatsApp:');
        console.error('[WhatsApp] Mensaje:', error.message);
        if (error.code === 'ECONNABORTED') {
            console.error('[WhatsApp] ⏱️ Timeout: La petición tardó más de 30 segundos');
        }
        else if (error.code === 'ECONNREFUSED') {
            console.error('[WhatsApp] 🔌 Conexión rechazada: El servidor de WhatsApp no está disponible');
        }
        if (error.response) {
            console.error('[WhatsApp] Status:', error.response.status);
            console.error('[WhatsApp] Data:', JSON.stringify(error.response.data, null, 2));
            // Si el error es por instancia desconectada, avisar claramente
            if (error.response.status === 400 || error.response.status === 404) {
                const errorData = error.response.data;
                if (errorData?.message?.toLowerCase().includes('not connected') ||
                    errorData?.message?.toLowerCase().includes('desconectada') ||
                    errorData?.error?.toLowerCase().includes('not connected')) {
                    console.error('[WhatsApp] 💡 La instancia está desconectada. Reconecta escaneando el QR en el panel de la API.');
                }
            }
        }
    }
}
/**
 * Formatea el mensaje de la tarea para WhatsApp (formato simple sin emojis ni markdown)
 */
function formatTaskMessage(task) {
    const typeMap = {
        'call': 'Llamada',
        'email': 'Email',
        'meeting': 'Reunión',
        'note': 'Nota',
        'todo': 'Tarea',
        'other': 'Otra'
    };
    const priorityMap = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta',
        'urgent': 'Urgente'
    };
    let message = `Nueva Tarea Asignada\n\n`;
    message += `Titulo: ${task.title}\n`;
    message += `Tipo: ${typeMap[task.type] || task.type}\n`;
    message += `Prioridad: ${priorityMap[task.priority] || task.priority}\n`;
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        message += `Fecha limite: ${dueDate}\n`;
    }
    if (task.description) {
        message += `\nDescripcion:\n${task.description}`;
    }
    return message;
}
