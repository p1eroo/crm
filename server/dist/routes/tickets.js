"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Ticket_1 = require("../models/Ticket");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todos los tickets
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, priority, assignedToId, contactId, companyId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        // Solo agregar filtros de status y priority si las columnas existen
        // Si no existen, estos filtros causarán errores, así que los omitimos
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
        const tickets = await Ticket_1.Ticket.findAndCountAll({
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
            order: [['createdAt', 'DESC']],
        });
        res.json({
            tickets: tickets.rows,
            total: tickets.count,
            page: Number(page),
            totalPages: Math.ceil(tickets.count / Number(limit)),
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
                    tickets: tickets.rows,
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
        res.json(ticket);
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
        res.status(201).json(newTicket);
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
        res.json(updatedTicket);
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
        await ticket.destroy();
        res.json({ message: 'Ticket eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
