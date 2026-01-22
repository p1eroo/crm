"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const auth_1 = require("../middleware/auth");
const googleCalendar_1 = require("../services/googleCalendar");
const rolePermissions_1 = require("../utils/rolePermissions");
const systemLogger_1 = require("../utils/systemLogger");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función para limpiar tareas eliminando campos null y objetos relacionados null
const cleanTask = (task) => {
    const taskData = task.toJSON ? task.toJSON() : task;
    const cleaned = {
        id: taskData.id,
        title: taskData.title,
        type: taskData.type,
        status: taskData.status,
        priority: taskData.priority,
        assignedToId: taskData.assignedToId,
        createdById: taskData.createdById,
        createdAt: taskData.createdAt,
        updatedAt: taskData.updatedAt,
    };
    // Solo incluir campos opcionales si no son null
    if (taskData.description != null)
        cleaned.description = taskData.description;
    if (taskData.dueDate != null)
        cleaned.dueDate = taskData.dueDate;
    if (taskData.contactId != null)
        cleaned.contactId = taskData.contactId;
    if (taskData.companyId != null)
        cleaned.companyId = taskData.companyId;
    if (taskData.dealId != null)
        cleaned.dealId = taskData.dealId;
    if (taskData.googleCalendarEventId != null)
        cleaned.googleCalendarEventId = taskData.googleCalendarEventId;
    // Solo incluir relaciones si existen
    if (taskData.AssignedTo)
        cleaned.AssignedTo = taskData.AssignedTo;
    if (taskData.CreatedBy)
        cleaned.CreatedBy = taskData.CreatedBy;
    if (taskData.Contact)
        cleaned.Contact = taskData.Contact;
    if (taskData.Company)
        cleaned.Company = taskData.Company;
    if (taskData.Deal)
        cleaned.Deal = taskData.Deal;
    return cleaned;
};
// Obtener todas las tareas
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit: limitParam = 50, status, priority, assignedToId, type, contactId, companyId, dealId, search, sortBy = 'newest', // newest, oldest, name, nameDesc, dueDate
        // Filtros por columna
        filterTitulo, filterEstado, filterPrioridad, } = req.query;
        // Limitar el tamaño máximo de página para evitar sobrecarga
        const maxLimit = 100;
        const requestedLimit = Number(limitParam);
        const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
        const pageNum = Number(page) < 1 ? 1 : Number(page);
        const offset = (pageNum - 1) * limit;
        const where = {};
        // ⭐ Aplicar filtro automático según rol del usuario
        // Tasks usa assignedToId en lugar de ownerId
        const roleFilter = (0, rolePermissions_1.getRoleBasedDataFilter)(req.userRole, req.userId);
        if (roleFilter.ownerId !== undefined) {
            where.assignedToId = roleFilter.ownerId;
        }
        // Búsqueda general
        if (search) {
            where.title = { [sequelize_1.Op.iLike]: `%${search}%` };
        }
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
        // Filtros por columna
        if (filterTitulo) {
            if (where.title) {
                where.title = { [sequelize_1.Op.and]: [
                        where.title,
                        { [sequelize_1.Op.iLike]: `%${filterTitulo}%` }
                    ] };
            }
            else {
                where.title = { [sequelize_1.Op.iLike]: `%${filterTitulo}%` };
            }
        }
        if (filterEstado) {
            const filterEstadoStr = String(filterEstado);
            if (where.status) {
                // Si ya existe filtro por status, verificar si coincide
                if (String(where.status).toLowerCase() !== filterEstadoStr.toLowerCase()) {
                    where.status = { [sequelize_1.Op.in]: [] }; // No hay coincidencias
                }
            }
            else {
                where.status = { [sequelize_1.Op.iLike]: `%${filterEstadoStr}%` };
            }
        }
        if (filterPrioridad) {
            const filterPrioridadStr = String(filterPrioridad);
            if (where.priority) {
                // Si ya existe filtro por priority, verificar si coincide
                if (String(where.priority).toLowerCase() !== filterPrioridadStr.toLowerCase()) {
                    where.priority = { [sequelize_1.Op.in]: [] }; // No hay coincidencias
                }
            }
            else {
                where.priority = { [sequelize_1.Op.iLike]: `%${filterPrioridadStr}%` };
            }
        }
        // Ordenamiento
        let order = [['dueDate', 'ASC'], ['createdAt', 'DESC']];
        switch (sortBy) {
            case 'newest':
                order = [['createdAt', 'DESC']];
                break;
            case 'oldest':
                order = [['createdAt', 'ASC']];
                break;
            case 'name':
                order = [['title', 'ASC']];
                break;
            case 'nameDesc':
                order = [['title', 'DESC']];
                break;
            case 'dueDate':
                order = [['dueDate', 'ASC'], ['createdAt', 'DESC']];
                break;
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
            distinct: true, // Importante para contar correctamente con includes
            limit,
            offset,
            order,
        });
        res.json({
            tasks: tasks.rows.map(cleanTask),
            total: tasks.count,
            page: pageNum,
            limit,
            totalPages: Math.ceil(tasks.count / limit),
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
                    tasks: tasks.rows.map(cleanTask),
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
        res.json(cleanTask(task));
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
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.TASK, task.id, { title: task.title, type: task.type, status: task.status }, req);
        }
        res.status(201).json(cleanTask(newTask));
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
        // Verificar permisos: solo el asignado, creador o admin puede modificar
        const canModify = req.userRole === 'admin' ||
            task.assignedToId === req.userId ||
            task.createdById === req.userId;
        if (!canModify) {
            return res.status(403).json({ error: 'No tienes permisos para modificar esta tarea' });
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
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.UPDATE, systemLogger_1.EntityTypes.TASK, task.id, { title: task.title, changes: req.body }, req);
        }
        res.json(cleanTask(task));
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
        // Verificar permisos: solo el asignado, creador o admin puede eliminar
        const canDelete = req.userRole === 'admin' ||
            task.assignedToId === req.userId ||
            task.createdById === req.userId;
        if (!canDelete) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar esta tarea' });
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
        const taskTitle = task.title;
        await task.destroy();
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.DELETE, systemLogger_1.EntityTypes.TASK, parseInt(req.params.id), { title: taskTitle }, req);
        }
        res.json({ message: 'Tarea eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
