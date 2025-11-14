import express from 'express';
import { Op } from 'sequelize';
import { Deal } from '../models/Deal';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todos los deals
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search, stage, ownerId, pipelineId, contactId, companyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (stage) {
      where.stage = stage;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }
    if (pipelineId) {
      where.pipelineId = pipelineId;
    }
    if (contactId) {
      where.contactId = contactId;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    const deals = await Deal.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      deals: deals.rows,
      total: deals.count,
      page: Number(page),
      totalPages: Math.ceil(deals.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un deal por ID
router.get('/:id', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    res.json(deal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear deal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const dealData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId,
    };

    const deal = await Deal.create(dealData);
    const newDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
    });

    res.status(201).json(newDeal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar deal
router.put('/:id', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    await deal.update(req.body);
    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
    });

    res.json(updatedDeal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar deal
router.delete('/:id', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    await deal.destroy();
    res.json({ message: 'Deal eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener deals por pipeline/stage
router.get('/pipeline/:pipelineId', async (req, res) => {
  try {
    const deals = await Deal.findAll({
      where: { pipelineId: req.params.pipelineId },
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(deals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

