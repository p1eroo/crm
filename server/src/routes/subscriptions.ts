import express from 'express';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las suscripciones
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { contactId, companyId, status } = req.query;
    const where: any = {};
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (status) where.status = status;

    const subscriptions = await Subscription.findAll({
      where,
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ subscriptions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear suscripción
router.post('/', async (req: AuthRequest, res) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      createdById: req.userId,
    });
    const newSubscription = await Subscription.findByPk(subscription.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
    });
    res.status(201).json(newSubscription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar suscripción
router.put('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }
    await subscription.update(req.body);
    const updatedSubscription = await Subscription.findByPk(subscription.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
    });
    res.json(updatedSubscription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar suscripción
router.delete('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }
    await subscription.destroy();
    res.json({ message: 'Suscripción eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





