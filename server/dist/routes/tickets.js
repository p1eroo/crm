"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Ticket_1 = require("../models/Ticket");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const auth_1 = require("../middleware/auth");
const rolePermissions_1 = require("../utils/rolePermissions");
const systemLogger_1 = require("../utils/systemLogger");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función para limpiar tickets eliminando campos null y objetos relacionados null
const cleanTicket = (ticket) => {
    const ticketData = ticket.toJSON ? ticket.toJSON() : ticket;
    const cleaned = {
        id: ticketData.id,
        subject: ticketData.subject,
        status: ticketData.status,
        priority: ticketData.priority,
        assignedToId: ticketData.assignedToId,
        createdById: ticketData.createdById,
        createdAt: ticketData.createdAt,
        updatedAt: ticketData.updatedAt,
    };
    // Solo incluir campos opcionales si no son null
    if (ticketData.description != null)
        cleaned.description = ticketData.description;
    if (ticketData.contactId != null)
        cleaned.contactId = ticketData.contactId;
    if (ticketData.companyId != null)
        cleaned.companyId = ticketData.companyId;
    if (ticketData.dealId != null)
        cleaned.dealId = ticketData.dealId;
    // Solo incluir relaciones si existen
    if (ticketData.AssignedTo)
        cleaned.AssignedTo = ticketData.AssignedTo;
    if (ticketData.CreatedBy)
        cleaned.CreatedBy = ticketData.CreatedBy;
    if (ticketData.Contact)
        cleaned.Contact = ticketData.Contact;
    if (ticketData.Company)
        cleaned.Company = ticketData.Company;
    if (ticketData.Deal)
        cleaned.Deal = ticketData.Deal;
    return cleaned;
};
// Obtener todos los tickets
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit: limitParam = 50, status, priority, assignedToId, contactId, companyId, search, sortBy = 'newest', // newest, oldest, name, nameDesc
        // Filtros por columna
        filterAsunto, filterEstado, filterPrioridad, } = req.query;
        // Limitar el tamaño máximo de página para evitar sobrecarga
        const maxLimit = 100;
        const requestedLimit = Number(limitParam);
        const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
        const pageNum = Number(page) < 1 ? 1 : Number(page);
        const offset = (pageNum - 1) * limit;
        const where = {};
        // ⭐ Aplicar filtro automático según rol del usuario
        // Tickets usa assignedToId en lugar de ownerId
        const roleFilter = (0, rolePermissions_1.getRoleBasedDataFilter)(req.userRole, req.userId);
        if (roleFilter.ownerId !== undefined) {
            where.assignedToId = roleFilter.ownerId;
        }
        // Búsqueda general
        if (search) {
            where.subject = { [sequelize_1.Op.iLike]: `%${search}%` };
        }
        // Solo agregar filtros de status y priority si las columnas existen
        try {
            if (status) {
                where.status = status;
            }
            if (priority) {
                where.priority = priority;
            }
        }
        catch (e) {
            // Ignorar errores de filtros de status/priority
        }
        if (assignedToId) {
            where.assignedToId = assignedToId;
        }
        if (contactId) {
            where.contactId = contactId;
        }
        if (companyId) {
            // Solo filtrar por companyId si se proporciona, y debe ser exactamente ese ID (no null)
            where.companyId = companyId;
        }
        // Filtros por columna
        if (filterAsunto) {
            if (where.subject) {
                where.subject = { [sequelize_1.Op.and]: [
                        where.subject,
                        { [sequelize_1.Op.iLike]: `%${filterAsunto}%` }
                    ] };
            }
            else {
                where.subject = { [sequelize_1.Op.iLike]: `%${filterAsunto}%` };
            }
        }
        if (filterEstado) {
            try {
                if (where.status) {
                    // Si ya existe filtro por status, verificar si coincide
                    if (String(where.status).toLowerCase() !== String(filterEstado).toLowerCase()) {
                        where.status = { [sequelize_1.Op.in]: [] }; // No hay coincidencias
                    }
                }
                else {
                    where.status = { [sequelize_1.Op.iLike]: `%${String(filterEstado)}%` };
                }
            }
            catch (e) {
                // Ignorar si la columna no existe
            }
        }
        if (filterPrioridad) {
            try {
                if (where.priority) {
                    // Si ya existe filtro por priority, verificar si coincide
                    if (String(where.priority).toLowerCase() !== String(filterPrioridad).toLowerCase()) {
                        where.priority = { [sequelize_1.Op.in]: [] }; // No hay coincidencias
                    }
                }
                else {
                    where.priority = { [sequelize_1.Op.iLike]: `%${String(filterPrioridad)}%` };
                }
            }
            catch (e) {
                // Ignorar si la columna no existe
            }
        }
        // Ordenamiento
        let order = [['createdAt', 'DESC']];
        switch (sortBy) {
            case 'newest':
                order = [['createdAt', 'DESC']];
                break;
            case 'oldest':
                order = [['createdAt', 'ASC']];
                break;
            case 'name':
                order = [['subject', 'ASC']];
                break;
            case 'nameDesc':
                order = [['subject', 'DESC']];
                break;
        }
        const tickets = await Ticket_1.Ticket.findAndCountAll({
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
            tickets: tickets.rows.map(cleanTicket),
            total: tickets.count,
            page: pageNum,
            limit,
            totalPages: Math.ceil(tickets.count / limit),
        });
    }
    catch (error) {
        console.error('❌ Error al obtener tickets:', error);
        console.error('Stack:', error.stack);
        // Si el error es por columna faltante, intentar sin filtros de status/priority y sin esas columnas en el SELECT
        if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
            console.warn('⚠️  Columna faltante detectada, intentando sin filtros de status/priority...');
            try {
                const { assignedToId: fallbackAssignedToId, contactId: fallbackContactId, companyId: fallbackCompanyId, page: fallbackPage = 1, limit: fallbackLimit = 50 } = req.query;
                const fallbackOffset = (Number(fallbackPage) - 1) * Number(fallbackLimit);
                const simpleWhere = {};
                if (fallbackAssignedToId)
                    simpleWhere.assignedToId = fallbackAssignedToId;
                if (fallbackContactId)
                    simpleWhere.contactId = fallbackContactId;
                if (fallbackCompanyId)
                    simpleWhere.companyId = fallbackCompanyId;
                // Usar attributes para excluir status y priority si no existen
                const tickets = await Ticket_1.Ticket.findAndCountAll({
                    where: simpleWhere,
                    attributes: ['id', 'subject', 'description', 'assignedToId', 'createdById', 'contactId', 'companyId', 'dealId', 'createdAt', 'updatedAt'],
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
                    tickets: tickets.rows.map(cleanTicket),
                    total: tickets.count,
                    page: Number(fallbackPage),
                    totalPages: Math.ceil(tickets.count / Number(fallbackLimit)),
                });
            }
            catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
                // Si el fallback también falla, devolver array vacío
                return res.json({
                    tickets: [],
                    total: 0,
                    page: Number(req.query.page || 1),
                    totalPages: 0,
                });
            }
        }
        res.status(500).json({ error: error.message });
    }
});
// Obtener un ticket por ID
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket_1.Ticket.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo' },
                { model: User_1.User, as: 'CreatedBy' },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(cleanTicket(ticket));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear ticket
router.post('/', async (req, res) => {
    try {
        const ticketData = {
            ...req.body,
            createdById: req.userId,
            assignedToId: req.body.assignedToId || req.userId,
        };
        const ticket = await Ticket_1.Ticket.create(ticketData);
        const newTicket = await Ticket_1.Ticket.findByPk(ticket.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.TICKET, ticket.id, { subject: ticket.subject, status: ticket.status, priority: ticket.priority }, req);
        }
        res.status(201).json(cleanTicket(newTicket));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar ticket
router.put('/:id', async (req, res) => {
    try {
        const ticket = await Ticket_1.Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        // Verificar permisos: solo el asignado, creador o admin puede modificar
        const canModify = req.userRole === 'admin' ||
            ticket.assignedToId === req.userId ||
            ticket.createdById === req.userId;
        if (!canModify) {
            return res.status(403).json({ error: 'No tienes permisos para modificar este ticket' });
        }
        await ticket.update(req.body);
        const updatedTicket = await Ticket_1.Ticket.findByPk(ticket.id, {
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        // Registrar log
        if (req.userId && updatedTicket) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.UPDATE, systemLogger_1.EntityTypes.TICKET, ticket.id, { subject: updatedTicket.subject, changes: req.body }, req);
        }
        if (!updatedTicket) {
            return res.status(404).json({ error: 'Ticket no encontrado después de actualizar' });
        }
        res.json(cleanTicket(updatedTicket));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar ticket
router.delete('/:id', async (req, res) => {
    try {
        const ticket = await Ticket_1.Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        // Verificar permisos: solo el asignado, creador o admin puede eliminar
        const canDelete = req.userRole === 'admin' ||
            ticket.assignedToId === req.userId ||
            ticket.createdById === req.userId;
        if (!canDelete) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este ticket' });
        }
        const ticketSubject = ticket.subject;
        await ticket.destroy();
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.DELETE, systemLogger_1.EntityTypes.TICKET, parseInt(req.params.id), { subject: ticketSubject }, req);
        }
        res.json({ message: 'Ticket eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
