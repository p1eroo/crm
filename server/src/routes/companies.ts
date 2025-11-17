import express from 'express';
import { Op } from 'sequelize';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las empresas
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search, lifecycleStage, ownerId, industry } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { domain: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (lifecycleStage) {
      where.lifecycleStage = lifecycleStage;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }
    if (industry) {
      where.industry = industry;
    }

    const companies = await Company.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      companies: companies.rows,
      total: companies.count,
      page: Number(page),
      totalPages: Math.ceil(companies.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }, // Contactos asociados muchos-a-muchos
      ],
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear empresa
router.post('/', async (req: AuthRequest, res) => {
  try {
    const companyData = {
      ...req.body,
      // No asignar ownerId automáticamente para que todos los usuarios vean los mismos datos
      ownerId: req.body.ownerId || null,
    };

    const company = await Company.create(companyData);
    const newCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json(newCompany);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    await company.update(req.body);
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json(updatedCompany);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar empresa
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    await company.destroy();
    res.json({ message: 'Empresa eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contactos asociados a una empresa
router.post('/:id/contacts', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: Contact, as: 'Contacts' },
      ],
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de contactIds' });
    }

    // Verificar que todos los contactos existan
    const contacts = await Contact.findAll({
      where: { id: { [Op.in]: contactIds } },
    });

    if (contacts.length !== contactIds.length) {
      return res.status(400).json({ error: 'Uno o más contactos no existen' });
    }

    // Obtener IDs de contactos ya asociados
    const existingContactIds = ((company as any).Contacts || []).map((c: any) => c.id);
    
    // Filtrar solo los contactos nuevos
    const newContactIds = contactIds.filter((id: number) => !existingContactIds.includes(id));

    if (newContactIds.length > 0) {
      // Usar el método add de Sequelize para relaciones muchos-a-muchos
      await (company as any).addContacts(newContactIds);
    }

    // Obtener la empresa actualizada con todos sus contactos
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    res.json(updatedCompany);
  } catch (error: any) {
    console.error('Error adding contacts to company:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al asociar los contactos' });
  }
});

// Eliminar asociación de contacto con empresa
router.delete('/:id/contacts/:contactId', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const contactId = parseInt(req.params.contactId);
    
    // Usar el método remove de Sequelize para relaciones muchos-a-muchos
    await (company as any).removeContacts([contactId]);

    // Obtener la empresa actualizada
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });

    res.json(updatedCompany);
  } catch (error: any) {
    console.error('Error removing contact association:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
  }
});

export default router;





