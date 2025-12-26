import express from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models/Contact';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { ContactCompany } from '../models/ContactCompany';
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
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
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
    // Intentar obtener contact con todas las relaciones
    let contact;
    try {
      contact = await Contact.findByPk(req.params.id, {
        include: [
          { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
          { model: Company, as: 'Company', required: false }, // Empresa principal (compatibilidad)
          { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'industry'], required: false }, // Todas las empresas asociadas
        ],
      });
    } catch (includeError: any) {
      // Si falla por problemas con las relaciones, intentar sin includes
      console.warn('⚠️ Error con relaciones en contact, intentando sin includes:', includeError.message);
      contact = await Contact.findByPk(req.params.id);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contacto no encontrado' });
      }

      // Agregar relaciones manualmente solo para los que tienen IDs válidos
      const contactData: any = contact.toJSON();
      
      // Agregar Owner si existe ownerId
      if (contactData.ownerId) {
        try {
          const owner = await User.findByPk(contactData.ownerId, {
            attributes: ['id', 'firstName', 'lastName', 'email'],
          });
          contactData.Owner = owner || null;
        } catch (ownerError) {
          console.warn(`⚠️ No se pudo obtener Owner para contact ${contactData.id}:`, ownerError);
          contactData.Owner = null;
        }
      } else {
        contactData.Owner = null;
      }

      // Agregar Company principal si existe companyId
      if (contactData.companyId) {
        try {
          const company = await Company.findByPk(contactData.companyId, {
            attributes: ['id', 'name', 'domain', 'phone', 'industry'],
          });
          contactData.Company = company || null;
        } catch (companyError) {
          console.warn(`⚠️ No se pudo obtener Company para contact ${contactData.id}:`, companyError);
          contactData.Company = null;
        }
      } else {
        contactData.Company = null;
      }

      // Agregar Companies asociadas (muchos-a-muchos)
      try {
        const companies = await (contact as any).getCompanies();
        contactData.Companies = companies || [];
      } catch (companiesError) {
        console.warn(`⚠️ No se pudieron obtener Companies para contact ${contactData.id}:`, companiesError);
        contactData.Companies = [];
      }

      return res.json(contactData);
    }

    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    res.json(contact);
  } catch (error: any) {
    console.error('Error fetching contact:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      original: error.original,
    });
    res.status(500).json({ 
      error: error.message || 'Error al obtener contacto',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Crear contacto
router.post('/', async (req: AuthRequest, res) => {
  try {
    // Validar que companyId esté presente
    if (!req.body.companyId) {
      return res.status(400).json({ error: 'La empresa principal es requerida' });
    }

    const contactData = {
      ...req.body,
      // Asignar automáticamente el usuario actual como propietario del contacto
      ownerId: req.body.ownerId || req.userId || null,
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
    // Validar que companyId esté presente si se está enviando en el body
    if (req.body.hasOwnProperty('companyId') && !req.body.companyId) {
      return res.status(400).json({ error: 'La empresa principal es requerida' });
    }

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

// Agregar empresas asociadas a un contacto
router.post('/:id/companies', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'Companies' },
      ],
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    const { companyIds } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de companyIds' });
    }

    // Verificar que todas las empresas existan
    const companies = await Company.findAll({
      where: { id: { [Op.in]: companyIds } },
    });

    if (companies.length !== companyIds.length) {
      return res.status(400).json({ error: 'Una o más empresas no existen' });
    }

    // Obtener IDs de empresas ya asociadas
    const existingCompanyIds = ((contact as any).Companies || []).map((c: any) => c.id);
    
    // Filtrar solo las empresas nuevas
    const newCompanyIds = companyIds.filter((id: number) => !existingCompanyIds.includes(id));

    if (newCompanyIds.length > 0) {
      // Usar el método add de Sequelize para relaciones muchos-a-muchos
      await (contact as any).addCompanies(newCompanyIds);
    }

    // Obtener el contacto actualizado con todas sus empresas
    const updatedContact = await Contact.findByPk(contact.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'industry'] },
      ],
    });

    res.json(updatedContact);
  } catch (error: any) {
    console.error('Error adding companies to contact:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al asociar las empresas' });
  }
});

// Eliminar asociación de empresa con contacto
router.delete('/:id/companies/:companyId', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    const companyId = parseInt(req.params.companyId);
    
    // Usar el método remove de Sequelize para relaciones muchos-a-muchos
    await (contact as any).removeCompanies([companyId]);

    // Obtener el contacto actualizado
    const updatedContact = await Contact.findByPk(contact.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'industry'] },
      ],
    });

    res.json(updatedContact);
  } catch (error: any) {
    console.error('Error removing company association:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
  }
});

export default router;





