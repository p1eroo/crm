"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Task_1 = require("../models/Task");
const TaskComment_1 = require("../models/TaskComment");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const auth_1 = require("../middleware/auth");
const googleCalendar_1 = require("../services/googleCalendar");
const rolePermissions_1 = require("../utils/rolePermissions");
const systemLogger_1 = require("../utils/systemLogger");
const whatsapp_1 = require("../services/whatsapp");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función para limpiar tareas eliminando campos null y objetos relacionados null
const cleanTask = (task) => {
    const taskData = task.toJSON ? task.toJSON() : task;
    const cleaned = {
        id: taskData.id,
        title: taskData.title,
        type: taskData.type != null ? taskData.type : 'todo',
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
        const { page = 1, limit: limitParam = 50, status, priority, assignedToId, contactId, companyId, dealId, search, sortBy = 'newest', // newest, oldest, name, nameDesc, dueDate
        // Filtros por columna
        filterTitulo, filterEstado, filterPrioridad, filterTipo, filterFechaInicio, filterFechaVencimiento, filterAsignadoA, filterEmpresa, filterContacto, } = req.query;
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
        // Filtros por columna (tienen prioridad absoluta sobre los filtros simples)
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
        // Filtro de estado por columna (prioridad sobre status)
        if (filterEstado) {
            const filterEstadoStr = String(filterEstado).trim().toLowerCase();
            // Mapear valores comunes a los valores exactos del ENUM
            const statusMap = {
                'pending': 'pending',
                'pendiente': 'pending',
                'in progress': 'in progress',
                'en progreso': 'in progress',
                'completed': 'completed',
                'completada': 'completed',
                'cancelled': 'cancelled',
                'cancelada': 'cancelled',
            };
            const mappedStatus = statusMap[filterEstadoStr] || filterEstadoStr;
            // Usar igualdad exacta para ENUMs, no Op.iLike
            where.status = mappedStatus;
        }
        else if (status) {
            // Solo aplicar filtro de status si no hay filtro de columna para estado
            where.status = status;
        }
        // Filtro de prioridad por columna (prioridad sobre priority)
        if (filterPrioridad) {
            const filterPrioridadStr = String(filterPrioridad).trim().toLowerCase();
            // Mapear valores comunes a los valores exactos del ENUM
            const priorityMap = {
                'low': 'low',
                'baja': 'low',
                'medium': 'medium',
                'media': 'medium',
                'high': 'high',
                'alta': 'high',
                'urgent': 'urgent',
                'urgente': 'urgent',
            };
            const mappedPriority = priorityMap[filterPrioridadStr] || filterPrioridadStr;
            // Usar igualdad exacta para ENUMs
            where.priority = mappedPriority;
        }
        else if (priority) {
            // Solo aplicar filtro de priority si no hay filtro de columna para prioridad
            where.priority = priority;
        }
        // Filtro de tipo por columna
        if (filterTipo) {
            const filterTipoStr = String(filterTipo).trim().toLowerCase();
            const typeMap = {
                email: 'email',
                correo: 'email',
                meeting: 'meeting',
                reunión: 'meeting',
                reunion: 'meeting',
                call: 'call',
                llamada: 'call',
                note: 'note',
                nota: 'note',
                todo: 'todo',
                tarea: 'todo',
                other: 'other',
                otro: 'other',
            };
            const mappedType = typeMap[filterTipoStr] || filterTipoStr;
            where.type = mappedType;
        }
        // Filtro fecha de inicio (por createdAt, un solo día)
        if (filterFechaInicio) {
            const dateStr = String(filterFechaInicio).trim();
            const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
            const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
            where.createdAt = { [sequelize_1.Op.gte]: startOfDay, [sequelize_1.Op.lte]: endOfDay };
        }
        // Filtro fecha de vencimiento (un solo día)
        if (filterFechaVencimiento) {
            const dateStr = String(filterFechaVencimiento).trim();
            const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
            const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
            where.dueDate = { [sequelize_1.Op.gte]: startOfDay, [sequelize_1.Op.lte]: endOfDay };
        }
        // Otros filtros que no tienen conflictos con filtros de columna
        if (assignedToId) {
            where.assignedToId = assignedToId;
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
        const filterAsignadoAStr = filterAsignadoA ? String(filterAsignadoA).trim() : '';
        const filterEmpresaStr = filterEmpresa ? String(filterEmpresa).trim() : '';
        const filterContactoStr = filterContacto ? String(filterContacto).trim() : '';
        const includeAssignedTo = { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'], required: false };
        if (filterAsignadoAStr) {
            includeAssignedTo.required = true;
            includeAssignedTo.where = {
                [sequelize_1.Op.or]: [
                    { firstName: { [sequelize_1.Op.iLike]: `%${filterAsignadoAStr}%` } },
                    { lastName: { [sequelize_1.Op.iLike]: `%${filterAsignadoAStr}%` } },
                ],
            };
        }
        const includeContact = { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false };
        if (filterContactoStr) {
            includeContact.required = true;
            includeContact.where = {
                [sequelize_1.Op.or]: [
                    { firstName: { [sequelize_1.Op.iLike]: `%${filterContactoStr}%` } },
                    { lastName: { [sequelize_1.Op.iLike]: `%${filterContactoStr}%` } },
                ],
            };
        }
        const includeCompany = { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false };
        if (filterEmpresaStr) {
            includeCompany.required = true;
            includeCompany.where = { name: { [sequelize_1.Op.iLike]: `%${filterEmpresaStr}%` } };
        }
        const tasks = await Task_1.Task.findAndCountAll({
            where,
            include: [
                includeAssignedTo,
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'], required: false },
                includeContact,
                includeCompany,
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
// Listar comentarios de una tarea (debe ir antes de GET /:id)
router.get('/:id/comments', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        if (Number.isNaN(taskId)) {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }
        const task = await Task_1.Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        const comments = await TaskComment_1.TaskComment.findAll({
            where: { taskId },
            include: [{ model: User_1.User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
            order: [['createdAt', 'ASC']],
        });
        res.json(comments.map((c) => ({
            id: c.id,
            taskId: c.taskId,
            userId: c.userId,
            content: c.content,
            createdAt: c.createdAt,
            User: c.User,
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear comentario en una tarea
router.post('/:id/comments', async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        const taskId = parseInt(req.params.id, 10);
        if (Number.isNaN(taskId)) {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }
        const task = await Task_1.Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
        if (!content) {
            return res.status(400).json({ error: 'El contenido del comentario es requerido' });
        }
        const comment = await TaskComment_1.TaskComment.create({
            taskId,
            userId: req.userId,
            content,
        });
        const withUser = await TaskComment_1.TaskComment.findByPk(comment.id, {
            include: [{ model: User_1.User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        });
        res.status(201).json(withUser);
    }
    catch (error) {
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
        // Si no se proporciona startDate, establecerlo con la fecha actual
        const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
        const taskData = {
            ...req.body,
            createdById: req.userId,
            assignedToId: req.body.assignedToId || req.userId,
            startDate: startDate,
        };
        const task = await Task_1.Task.create(taskData);
        const newTask = await Task_1.Task.findByPk(task.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'] },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        // Intentar crear en Google Calendar si la tarea tiene fecha límite
        if (newTask && newTask.dueDate) {
            try {
                // Crear tarea en Google Tasks (ya que solo permitimos tipo 'todo')
                const calendarId = await (0, googleCalendar_1.createTaskEvent)(newTask, newTask.AssignedTo);
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
        // Enviar notificación de WhatsApp
        if (newTask && newTask.AssignedTo) {
            try {
                await (0, whatsapp_1.sendTaskNotification)(newTask, newTask.AssignedTo);
            }
            catch (whatsappError) {
                // No fallar la creación de la tarea si hay error con WhatsApp
                console.error('Error enviando WhatsApp:', whatsappError.message);
            }
        }
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.TASK, task.id, { title: task.title, status: task.status }, req);
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
                    // Actualizar tarea en Google Tasks
                    await (0, googleCalendar_1.updateTaskEvent)(task, task.googleCalendarEventId);
                }
                else {
                    // Crear nueva tarea en Google Tasks si no existía
                    const calendarId = await (0, googleCalendar_1.createTaskEvent)(task, task.AssignedTo);
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
            // Si se eliminó la fecha límite y había una tarea, eliminarla
            try {
                const userId = task.assignedToId || task.createdById;
                await (0, googleCalendar_1.deleteTaskEvent)(userId, task.googleCalendarEventId);
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
