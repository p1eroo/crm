"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const auth_1 = require("../middleware/auth");
const googleCalendar_1 = require("../services/googleCalendar");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todas las tareas
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, priority, assignedToId, type, contactId, companyId, dealId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status) {
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }
        if (assignedToId) {
            where.assignedToId = assignedToId;
        }
        if (type) {
            where.type = type;
        }
        if (contactId) {
            where.contactId = contactId;
        }
        if (companyId) {
            where.companyId = companyId;
        }
        if (dealId) {
            where.dealId = dealId;
        }
        const tasks = await Task_1.Task.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false },
                { model: Deal_1.Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
            ],
            limit: Number(limit),
            offset,
            order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
        });
        res.json({
            tasks: tasks.rows,
            total: tasks.count,
            page: Number(page),
            totalPages: Math.ceil(tasks.count / Number(limit)),
        });
    }
    catch (error) {
        console.error('❌ Error al obtener tareas:', error);
        console.error('Stack:', error.stack);
        // Si el error es por columna faltante, intentar sin filtros de status/priority
        if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist'))) {
            console.warn('⚠️  Columna faltante detectada, intentando sin filtros de status/priority...');
            try {
                const { assignedToId: fallbackAssignedToId, contactId: fallbackContactId, companyId: fallbackCompanyId, dealId: fallbackDealId, page: fallbackPage = 1, limit: fallbackLimit = 50 } = req.query;
                const fallbackOffset = (Number(fallbackPage) - 1) * Number(fallbackLimit);
                const simpleWhere = {};
                if (fallbackAssignedToId)
                    simpleWhere.assignedToId = fallbackAssignedToId;
                if (fallbackContactId)
                    simpleWhere.contactId = fallbackContactId;
                if (fallbackCompanyId)
                    simpleWhere.companyId = fallbackCompanyId;
                if (fallbackDealId)
                    simpleWhere.dealId = fallbackDealId;
                const tasks = await Task_1.Task.findAndCountAll({
                    where: simpleWhere,
                    include: [
                        { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                        { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                        { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
                        { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false },
                        { model: Deal_1.Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
                    ],
                    limit: Number(fallbackLimit),
                    offset: fallbackOffset,
                    order: [['createdAt', 'DESC']],
                });
                return res.json({
                    tasks: tasks.rows,
                    total: tasks.count,
                    page: Number(fallbackPage),
                    totalPages: Math.ceil(tasks.count / Number(fallbackLimit)),
                });
            }
            catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
            }
        }
        res.status(500).json({ error: error.message });
    }
});
// Obtener una tarea por ID
router.get('/:id', async (req, res) => {
    try {
        const task = await Task_1.Task.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo' },
                { model: User_1.User, as: 'CreatedBy' },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear tarea
router.post('/', async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            createdById: req.userId,
            assignedToId: req.body.assignedToId || req.userId,
        };
        const task = await Task_1.Task.create(taskData);
        const newTask = await Task_1.Task.findByPk(task.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        // Intentar crear en Google Calendar si la tarea tiene fecha límite
        if (newTask && newTask.dueDate) {
            try {
                let calendarId = null;
                // Si es una reunión, crear evento en Google Calendar
                if (newTask.type === 'meeting') {
                    calendarId = await (0, googleCalendar_1.createMeetingEvent)(newTask, newTask.AssignedTo);
                }
                else {
                    // Para otros tipos, crear tarea en Google Tasks
                    calendarId = await (0, googleCalendar_1.createTaskEvent)(newTask, newTask.AssignedTo);
                }
                if (calendarId) {
                    // Actualizar la tarea con el ID del evento/tarea de Google Calendar
                    await newTask.update({ googleCalendarEventId: calendarId });
                    // Recargar para incluir el campo actualizado
                    await newTask.reload();
                }
            }
            catch (calendarError) {
                // No fallar la creación de la tarea si hay error con Google Calendar
                console.error('Error creando en Google Calendar:', calendarError.message);
            }
        }
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar tarea
router.put('/:id', async (req, res) => {
    try {
        const task = await Task_1.Task.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        const hadEventId = !!task.googleCalendarEventId;
        const hadDueDate = !!task.dueDate;
        const willHaveDueDate = !!req.body.dueDate;
        await task.update(req.body);
        await task.reload({
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        // Actualizar o crear en Google Calendar
        if (task.dueDate) {
            try {
                if (task.googleCalendarEventId) {
                    // Si es una reunión, actualizar evento (por ahora solo actualizamos tareas)
                    // Las reuniones como eventos necesitarían una función updateMeetingEvent
                    if (task.type !== 'meeting') {
                        await (0, googleCalendar_1.updateTaskEvent)(task, task.googleCalendarEventId);
                    }
                }
                else {
                    // Crear nuevo evento/tarea si no existía
                    let calendarId = null;
                    if (task.type === 'meeting') {
                        calendarId = await (0, googleCalendar_1.createMeetingEvent)(task, task.AssignedTo);
                    }
                    else {
                        calendarId = await (0, googleCalendar_1.createTaskEvent)(task, task.AssignedTo);
                    }
                    if (calendarId) {
                        await task.update({ googleCalendarEventId: calendarId });
                        await task.reload();
                    }
                }
            }
            catch (calendarError) {
                console.error('Error actualizando en Google Calendar:', calendarError.message);
            }
        }
        else if (hadDueDate && !willHaveDueDate && task.googleCalendarEventId) {
            // Si se eliminó la fecha límite y había un evento/tarea, eliminarlo
            try {
                const userId = task.assignedToId || task.createdById;
                // Si es una reunión, eliminar evento de Google Calendar, sino eliminar tarea de Google Tasks
                if (task.type === 'meeting') {
                    await (0, googleCalendar_1.deleteCalendarEvent)(userId, task.googleCalendarEventId);
                }
                else {
                    await (0, googleCalendar_1.deleteTaskEvent)(userId, task.googleCalendarEventId);
                }
                await task.update({ googleCalendarEventId: undefined });
                await task.reload();
            }
            catch (calendarError) {
                console.error('Error eliminando de Google Calendar:', calendarError.message);
            }
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar tarea
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task_1.Task.findByPk(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        // Eliminar tarea de Google Tasks si existe
        if (task.googleCalendarEventId) {
            try {
                const userId = task.assignedToId || task.createdById;
                await (0, googleCalendar_1.deleteTaskEvent)(userId, task.googleCalendarEventId);
            }
            catch (calendarError) {
                console.error('Error eliminando tarea de Google Tasks:', calendarError.message);
                // Continuar con la eliminación de la tarea aunque falle la eliminación en Google Tasks
            }
        }
        await task.destroy();
        res.json({ message: 'Tarea eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
