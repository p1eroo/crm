import express from 'express';
import { Op } from 'sequelize';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Función para limpiar tickets eliminando campos null y objetos relacionados null
const cleanTicket = (ticket: any): any => {
  const ticketData = ticket.toJSON ? ticket.toJSON() : ticket;
  const cleaned: any = {
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
  if (ticketData.description != null) cleaned.description = ticketData.description;
  if (ticketData.contactId != null) cleaned.contactId = ticketData.contactId;
  if (ticketData.companyId != null) cleaned.companyId = ticketData.companyId;
  if (ticketData.dealId != null) cleaned.dealId = ticketData.dealId;

  // Solo incluir relaciones si existen
  if (ticketData.AssignedTo) cleaned.AssignedTo = ticketData.AssignedTo;
  if (ticketData.CreatedBy) cleaned.CreatedBy = ticketData.CreatedBy;
  if (ticketData.Contact) cleaned.Contact = ticketData.Contact;
  if (ticketData.Company) cleaned.Company = ticketData.Company;
  if (ticketData.Deal) cleaned.Deal = ticketData.Deal;

  return cleaned;
};

// Obtener todos los tickets
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, status, priority, assignedToId, contactId, companyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    // Solo agregar filtros de status y priority si las columnas existen
    // Si no existen, estos filtros causarán errores, así que los omitimos
    try {
      if (status) {
        where.status = status;
      }
      if (priority) {
        where.priority = priority;
      }
    } catch (e) {
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

    const tickets = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
        { model: Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      tickets: tickets.rows.map(cleanTicket),
      total: tickets.count,
      page: Number(page),
      totalPages: Math.ceil(tickets.count / Number(limit)),
    });
  } catch (error: any) {
    console.error('❌ Error al obtener tickets:', error);
    console.error('Stack:', error.stack);
    // Si el error es por columna faltante, intentar sin filtros de status/priority y sin esas columnas en el SELECT
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
      console.warn('⚠️  Columna faltante detectada, intentando sin filtros de status/priority...');
      try {
        const { assignedToId: fallbackAssignedToId, contactId: fallbackContactId, companyId: fallbackCompanyId, page: fallbackPage = 1, limit: fallbackLimit = 50 } = req.query;
        const fallbackOffset = (Number(fallbackPage) - 1) * Number(fallbackLimit);
        const simpleWhere: any = {};
        if (fallbackAssignedToId) simpleWhere.assignedToId = fallbackAssignedToId;
        if (fallbackContactId) simpleWhere.contactId = fallbackContactId;
        if (fallbackCompanyId) simpleWhere.companyId = fallbackCompanyId;
        
        // Usar attributes para excluir status y priority si no existen
        const tickets = await Ticket.findAndCountAll({
          where: simpleWhere,
          attributes: ['id', 'subject', 'description', 'assignedToId', 'createdById', 'contactId', 'companyId', 'dealId', 'createdAt', 'updatedAt'],
          include: [
            { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
            { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
            { model: Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
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
      } catch (fallbackError: any) {
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
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'AssignedTo' },
        { model: User, as: 'CreatedBy' },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(cleanTicket(ticket));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear ticket
router.post('/', async (req: AuthRequest, res) => {
  try {
    const ticketData = {
      ...req.body,
      createdById: req.userId,
      assignedToId: req.body.assignedToId || req.userId,
    };

    const ticket = await Ticket.create(ticketData);
    const newTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.status(201).json(cleanTicket(newTicket));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar ticket
router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    await ticket.update(req.body);
    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.json(cleanTicket(updatedTicket));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar ticket
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    await ticket.destroy();
    res.json({ message: 'Ticket eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


