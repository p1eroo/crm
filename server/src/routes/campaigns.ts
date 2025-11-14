import express from 'express';
import { Op } from 'sequelize';
import { Campaign } from '../models/Campaign';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las campañas
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, status, type, ownerId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const campaigns = await Campaign.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      campaigns: campaigns.rows,
      total: campaigns.count,
      page: Number(page),
      totalPages: Math.ceil(campaigns.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una campaña por ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear campaña
router.post('/', async (req: AuthRequest, res) => {
  try {
    const campaignData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId,
    };

    const campaign = await Campaign.create(campaignData);
    const newCampaign = await Campaign.findByPk(campaign.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json(newCampaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar campaña
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    await campaign.update(req.body);
    const updatedCampaign = await Campaign.findByPk(campaign.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json(updatedCampaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar campaña
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    await campaign.destroy();
    res.json({ message: 'Campaña eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;








