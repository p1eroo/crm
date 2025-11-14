import express from 'express';
import { Op } from 'sequelize';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las actividades
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, type, contactId, companyId, dealId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
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

    const activities = await Activity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
        { model: Deal, as: 'Deal', attributes: ['id', 'name'] },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      activities: activities.rows,
      total: activities.count,
      page: Number(page),
      totalPages: Math.ceil(activities.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear actividad
router.post('/', async (req: AuthRequest, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.userId,
    };

    const activity = await Activity.create(activityData);
    const newActivity = await Activity.findByPk(activity.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.status(201).json(newActivity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener actividad por ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar actividad
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Verificar que el usuario sea el propietario o admin
    if (activity.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta actividad' });
    }

    await activity.update(req.body);
    const updatedActivity = await Activity.findByPk(activity.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.json(updatedActivity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar actividad
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Verificar que el usuario sea el propietario o admin
    if (activity.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });
    }

    await activity.destroy();
    res.status(200).json({ message: 'Actividad eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;




