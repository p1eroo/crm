import express from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models/Contact';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todos los contactos
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search, lifecycleStage, ownerId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (lifecycleStage) {
      where.lifecycleStage = lifecycleStage;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const contacts = await Contact.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      contacts: contacts.rows,
      total: contacts.count,
      page: Number(page),
      totalPages: Math.ceil(contacts.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un contacto por ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
      ],
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear contacto
router.post('/', async (req: AuthRequest, res) => {
  try {
    const contactData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId,
    };

    const contact = await Contact.create(contactData);
    const newContact = await Contact.findByPk(contact.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
      ],
    });

    res.status(201).json(newContact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar contacto
router.put('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    await contact.update(req.body);
    const updatedContact = await Contact.findByPk(contact.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
      ],
    });

    res.json(updatedContact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar contacto
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    await contact.destroy();
    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





