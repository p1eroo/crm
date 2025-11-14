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

// Obtener todos los tickets
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, status, priority, assignedToId, contactId, companyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
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
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
        { model: Deal, as: 'Deal', attributes: ['id', 'name'] },
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
  } catch (error: any) {
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

    res.json(ticket);
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

    res.status(201).json(newTicket);
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

    res.json(updatedTicket);
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


