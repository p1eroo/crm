import express from 'express';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Subscription } from '../models/Subscription';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todos los pagos
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { contactId, companyId, subscriptionId, status } = req.query;
    const where: any = {};
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status) where.status = status;

    const payments = await Payment.findAll({
      where,
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Subscription, as: 'Subscription' },
      ],
      order: [['paymentDate', 'DESC']],
    });

    res.json({ payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear pago
router.post('/', async (req: AuthRequest, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      createdById: req.userId,
    });
    const newPayment = await Payment.findByPk(payment.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Subscription, as: 'Subscription' },
      ],
    });
    res.status(201).json(newPayment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar pago
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    await payment.update(req.body);
    const updatedPayment = await Payment.findByPk(payment.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Subscription, as: 'Subscription' },
      ],
    });
    res.json(updatedPayment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar pago
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    await payment.destroy();
    res.json({ message: 'Pago eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





