"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskEvent = createTaskEvent;
exports.updateTaskEvent = updateTaskEvent;
exports.deleteTaskEvent = deleteTaskEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
exports.createMeetingEvent = createMeetingEvent;
const googleapis_1 = require("googleapis");
const UserGoogleToken_1 = require("../models/UserGoogleToken");
/**
 * Obtiene un cliente OAuth2 autenticado para un usuario
 */
async function getAuthenticatedClient(userId) {
    const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
        where: { userId },
    });
    if (!userToken) {
        throw new Error('No hay token de Google Calendar configurado. Por favor, conecta tu cuenta primero.');
    }
    // Verificar si el token expiró
    const isExpired = userToken.tokenExpiry && new Date(userToken.tokenExpiry) < new Date();
    if (isExpired && !userToken.refreshToken) {
        throw new Error('Token expirado. Por favor, reconecta tu cuenta de Google Calendar.');
    }
    // Crear cliente OAuth2
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret) {
        throw new Error('Google OAuth no está configurado en el servidor.');
    }
    const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({
        access_token: userToken.accessToken,
        refresh_token: userToken.refreshToken || undefined,
    });
    // Si el token expiró y hay refresh token, intentar refrescarlo
    if (isExpired && userToken.refreshToken) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            // Actualizar token en la BD
            await userToken.update({
                accessToken: credentials.access_token || userToken.accessToken,
                tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : userToken.tokenExpiry,
            });
        }
        catch (refreshError) {
            console.error('Error refrescando token:', refreshError);
            throw new Error('Error refrescando token. Por favor, reconecta tu cuenta.');
        }
    }
    return oauth2Client;
}
/**
 * Crea una tarea en Google Tasks a partir de una tarea del CRM
 */
async function createTaskEvent(task, assignedUser) {
    try {
        // Solo crear tarea si tiene fecha límite
        if (!task.dueDate) {
            console.log('Tarea sin fecha límite, no se creará tarea en Google Tasks');
            return null;
        }
        // Asegurar que las relaciones estén cargadas
        if (!task.Contact && task.contactId) {
            const { Contact } = await Promise.resolve().then(() => __importStar(require('../models/Contact')));
            task.Contact = await Contact.findByPk(task.contactId) || undefined;
        }
        if (!task.Company && task.companyId) {
            const { Company } = await Promise.resolve().then(() => __importStar(require('../models/Company')));
            task.Company = await Company.findByPk(task.companyId) || undefined;
        }
        if (!task.Deal && task.dealId) {
            const { Deal } = await Promise.resolve().then(() => __importStar(require('../models/Deal')));
            task.Deal = await Deal.findByPk(task.dealId) || undefined;
        }
        // Usar el usuario asignado o el creador
        const userId = task.assignedToId || task.createdById;
        // Verificar si el usuario tiene token de Google Calendar
        const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
            where: { userId },
        });
        if (!userToken) {
            console.log(`Usuario ${userId} no tiene Google Calendar conectado, omitiendo creación de tarea`);
            return null;
        }
        // Obtener cliente autenticado
        const oauth2Client = await getAuthenticatedClient(userId);
        // Crear cliente de Tasks
        const tasks = googleapis_1.google.tasks({ version: 'v1', auth: oauth2Client });
        // Obtener la lista de tareas por defecto
        let taskListId = '@default';
        try {
            const taskLists = await tasks.tasklists.list();
            const defaultList = taskLists.data.items?.find(list => list.id === '@default') || taskLists.data.items?.[0];
            if (defaultList?.id) {
                taskListId = defaultList.id;
            }
        }
        catch (error) {
            console.warn('No se pudo obtener la lista de tareas, usando @default:', error.message);
        }
        // Preparar fecha límite
        const dueDate = new Date(task.dueDate);
        // Google Tasks requiere la fecha en formato RFC3339 sin hora (solo fecha)
        const dueDateStr = dueDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
        // Preparar notas/descripción
        let notes = task.description || '';
        if (task.Contact) {
            notes += `\n\nContacto: ${task.Contact.firstName} ${task.Contact.lastName}`;
        }
        if (task.Company) {
            notes += `\n\nEmpresa: ${task.Company.name}`;
            if (task.Company.address) {
                notes += `\nDirección: ${task.Company.address}`;
            }
        }
        if (task.Deal) {
            notes += `\n\nOportunidad: ${task.Deal.name}`;
        }
        // Mapear prioridad a emoji
        const priorityEmoji = {
            'urgent': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢',
        };
        const priorityIcon = priorityEmoji[task.priority] || '📋';
        // Preparar tarea de Google Tasks
        const googleTask = {
            title: `${priorityIcon} ${task.title}`,
            notes: notes.trim(),
            due: dueDateStr,
            status: task.status === 'completed' ? 'completed' : 'needsAction',
        };
        // Crear tarea en Google Tasks
        const response = await tasks.tasks.insert({
            tasklist: taskListId,
            requestBody: googleTask,
        });
        console.log(`✅ Tarea creada en Google Tasks: ${response.data.id} para tarea ${task.id}`);
        return response.data.id || null;
    }
    catch (error) {
        console.error('Error creando tarea en Google Tasks:', error.message);
        // No lanzar error, solo registrar para no interrumpir la creación de la tarea
        return null;
    }
}
/**
 * Actualiza una tarea en Google Tasks
 */
async function updateTaskEvent(task, eventId) {
    try {
        if (!task.dueDate) {
            return false;
        }
        // Asegurar que las relaciones estén cargadas
        if (!task.Contact && task.contactId) {
            const { Contact } = await Promise.resolve().then(() => __importStar(require('../models/Contact')));
            task.Contact = await Contact.findByPk(task.contactId) || undefined;
        }
        if (!task.Company && task.companyId) {
            const { Company } = await Promise.resolve().then(() => __importStar(require('../models/Company')));
            task.Company = await Company.findByPk(task.companyId) || undefined;
        }
        if (!task.Deal && task.dealId) {
            const { Deal } = await Promise.resolve().then(() => __importStar(require('../models/Deal')));
            task.Deal = await Deal.findByPk(task.dealId) || undefined;
        }
        const userId = task.assignedToId || task.createdById;
        const oauth2Client = await getAuthenticatedClient(userId);
        const tasks = googleapis_1.google.tasks({ version: 'v1', auth: oauth2Client });
        // Obtener la lista de tareas por defecto
        let taskListId = '@default';
        try {
            const taskLists = await tasks.tasklists.list();
            const defaultList = taskLists.data.items?.find(list => list.id === '@default') || taskLists.data.items?.[0];
            if (defaultList?.id) {
                taskListId = defaultList.id;
            }
        }
        catch (error) {
            console.warn('No se pudo obtener la lista de tareas, usando @default:', error.message);
        }
        const dueDate = new Date(task.dueDate);
        const dueDateStr = dueDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
        let notes = task.description || '';
        if (task.Contact) {
            notes += `\n\nContacto: ${task.Contact.firstName} ${task.Contact.lastName}`;
        }
        if (task.Company) {
            notes += `\n\nEmpresa: ${task.Company.name}`;
            if (task.Company.address) {
                notes += `\nDirección: ${task.Company.address}`;
            }
        }
        if (task.Deal) {
            notes += `\n\nOportunidad: ${task.Deal.name}`;
        }
        const priorityEmoji = {
            'urgent': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢',
        };
        const priorityIcon = priorityEmoji[task.priority] || '📋';
        const googleTask = {
            title: `${priorityIcon} ${task.title}`,
            notes: notes.trim(),
            due: dueDateStr,
            status: task.status === 'completed' ? 'completed' : 'needsAction',
        };
        await tasks.tasks.update({
            tasklist: taskListId,
            task: eventId,
            requestBody: googleTask,
        });
        console.log(`✅ Tarea actualizada en Google Tasks: ${eventId} para tarea ${task.id}`);
        return true;
    }
    catch (error) {
        console.error('Error actualizando tarea en Google Tasks:', error.message);
        return false;
    }
}
/**
 * Elimina una tarea de Google Tasks
 */
async function deleteTaskEvent(userId, eventId) {
    try {
        const oauth2Client = await getAuthenticatedClient(userId);
        const tasks = googleapis_1.google.tasks({ version: 'v1', auth: oauth2Client });
        // Obtener la lista de tareas por defecto
        let taskListId = '@default';
        try {
            const taskLists = await tasks.tasklists.list();
            const defaultList = taskLists.data.items?.find(list => list.id === '@default') || taskLists.data.items?.[0];
            if (defaultList?.id) {
                taskListId = defaultList.id;
            }
        }
        catch (error) {
            console.warn('No se pudo obtener la lista de tareas, usando @default:', error.message);
        }
        await tasks.tasks.delete({
            tasklist: taskListId,
            task: eventId,
        });
        console.log(`✅ Tarea eliminada de Google Tasks: ${eventId}`);
        return true;
    }
    catch (error) {
        console.error('Error eliminando tarea de Google Tasks:', error.message);
        return false;
    }
}
/**
 * Elimina un evento de Google Calendar
 */
async function deleteCalendarEvent(userId, eventId) {
    try {
        const oauth2Client = await getAuthenticatedClient(userId);
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        console.log(`✅ Evento eliminado de Google Calendar: ${eventId}`);
        return true;
    }
    catch (error) {
        console.error('Error eliminando evento de Google Calendar:', error.message);
        return false;
    }
}
/**
 * Crea un evento en Google Calendar a partir de una reunión (tarea tipo 'meeting')
 */
async function createMeetingEvent(task, assignedUser) {
    try {
        // Solo crear evento si es una reunión con fecha y hora
        if (task.type !== 'meeting' || !task.dueDate) {
            console.log('No es una reunión o no tiene fecha, no se creará evento en Google Calendar');
            return null;
        }
        // Asegurar que las relaciones estén cargadas
        if (!task.Contact && task.contactId) {
            const { Contact } = await Promise.resolve().then(() => __importStar(require('../models/Contact')));
            task.Contact = await Contact.findByPk(task.contactId) || undefined;
        }
        if (!task.Company && task.companyId) {
            const { Company } = await Promise.resolve().then(() => __importStar(require('../models/Company')));
            task.Company = await Company.findByPk(task.companyId) || undefined;
        }
        if (!task.Deal && task.dealId) {
            const { Deal } = await Promise.resolve().then(() => __importStar(require('../models/Deal')));
            task.Deal = await Deal.findByPk(task.dealId) || undefined;
        }
        // Usar el usuario asignado o el creador
        const userId = task.assignedToId || task.createdById;
        // Verificar si el usuario tiene token de Google Calendar
        const userToken = await UserGoogleToken_1.UserGoogleToken.findOne({
            where: { userId },
        });
        if (!userToken) {
            console.log(`Usuario ${userId} no tiene Google Calendar conectado, omitiendo creación de evento`);
            return null;
        }
        // Obtener cliente autenticado
        const oauth2Client = await getAuthenticatedClient(userId);
        // Crear cliente de Calendar
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        // Preparar fecha y hora de inicio
        const startDate = new Date(task.dueDate);
        // Si no tiene hora específica, usar 9:00 AM por defecto
        if (startDate.getHours() === 0 && startDate.getMinutes() === 0) {
            startDate.setHours(9, 0, 0, 0);
        }
        // Duración por defecto de 1 hora
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
        // Preparar descripción
        let description = task.description || '';
        if (task.Contact) {
            description += `\n\nContacto: ${task.Contact.firstName} ${task.Contact.lastName}`;
            if (task.Contact.email) {
                description += `\nEmail: ${task.Contact.email}`;
            }
        }
        if (task.Company) {
            description += `\n\nEmpresa: ${task.Company.name}`;
            if (task.Company.address) {
                description += `\nDirección: ${task.Company.address}`;
            }
        }
        if (task.Deal) {
            description += `\n\nOportunidad: ${task.Deal.name}`;
        }
        // Preparar evento
        const event = {
            summary: `📅 ${task.title}`,
            description: description.trim(),
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'America/Lima',
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'America/Lima',
            },
        };
        // Agregar ubicación si hay empresa
        if (task.Company?.address) {
            event.location = task.Company.address;
        }
        // Agregar participantes si hay contacto con email
        if (task.Contact?.email) {
            event.attendees = [
                { email: task.Contact.email },
            ];
        }
        // Crear evento en el calendario
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });
        console.log(`✅ Evento de reunión creado en Google Calendar: ${response.data.id} para tarea ${task.id}`);
        return response.data.id || null;
    }
    catch (error) {
        console.error('Error creando evento de reunión en Google Calendar:', error.message);
        // No lanzar error, solo registrar para no interrumpir la creación de la tarea
        return null;
    }
}
