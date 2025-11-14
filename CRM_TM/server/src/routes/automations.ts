import express from 'express';
import { Automation } from '../models/Automation';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las automatizaciones
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, ownerId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const automations = await Automation.findAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(automations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una automatización por ID
router.get('/:id', async (req, res) => {
  try {
    const automation = await Automation.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    res.json(automation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear automatización
router.post('/', async (req: AuthRequest, res) => {
  try {
    const automationData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId,
    };

    const automation = await Automation.create(automationData);
    const newAutomation = await Automation.findByPk(automation.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json(newAutomation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar automatización
router.put('/:id', async (req, res) => {
  try {
    const automation = await Automation.findByPk(req.params.id);
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    await automation.update(req.body);
    const updatedAutomation = await Automation.findByPk(automation.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json(updatedAutomation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar automatización
router.delete('/:id', async (req, res) => {
  try {
    const automation = await Automation.findByPk(req.params.id);
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada' });
    }

    await automation.destroy();
    res.json({ message: 'Automatización eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





