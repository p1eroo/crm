import express from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models/Contact';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { ContactCompany } from '../models/ContactCompany';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { apiLimiter, writeLimiter, deleteLimiter } from '../middleware/rateLimiter';

const router = express.Router();
router.use(authenticateToken);

// Función para limpiar contactos eliminando campos null y objetos relacionados null
const cleanContact = (contact: any): any => {
  const contactData = contact.toJSON ? contact.toJSON() : contact;
  const cleaned: any = {
    id: contactData.id,
    firstName: contactData.firstName,
    lastName: contactData.lastName,
    email: contactData.email,
    lifecycleStage: contactData.lifecycleStage,
    createdAt: contactData.createdAt,
    updatedAt: contactData.updatedAt,
  };

  // Solo incluir campos opcionales si no son null
  if (contactData.dni != null) cleaned.dni = contactData.dni;
  if (contactData.cee != null) cleaned.cee = contactData.cee;
  if (contactData.phone != null) cleaned.phone = contactData.phone;
  if (contactData.mobile != null) cleaned.mobile = contactData.mobile;
  if (contactData.jobTitle != null) cleaned.jobTitle = contactData.jobTitle;
  if (contactData.companyId != null) cleaned.companyId = contactData.companyId;
  if (contactData.ownerId != null) cleaned.ownerId = contactData.ownerId;
  if (contactData.address != null) cleaned.address = contactData.address;
  if (contactData.city != null) cleaned.city = contactData.city;
  if (contactData.state != null) cleaned.state = contactData.state;
  if (contactData.country != null) cleaned.country = contactData.country;
  if (contactData.postalCode != null) cleaned.postalCode = contactData.postalCode;
  if (contactData.website != null) cleaned.website = contactData.website;
  if (contactData.facebook != null) cleaned.facebook = contactData.facebook;
  if (contactData.twitter != null) cleaned.twitter = contactData.twitter;
  if (contactData.github != null) cleaned.github = contactData.github;
  if (contactData.linkedin != null) cleaned.linkedin = contactData.linkedin;
  if (contactData.youtube != null) cleaned.youtube = contactData.youtube;
  if (contactData.leadStatus != null) cleaned.leadStatus = contactData.leadStatus;
  if (contactData.tags != null && Array.isArray(contactData.tags) && contactData.tags.length > 0) cleaned.tags = contactData.tags;
  if (contactData.notes != null) cleaned.notes = contactData.notes;

  // Solo incluir relaciones si existen
  if (contactData.Owner) cleaned.Owner = contactData.Owner;
  if (contactData.Company) cleaned.Company = contactData.Company;
  if (contactData.Companies && Array.isArray(contactData.Companies) && contactData.Companies.length > 0) {
    cleaned.Companies = contactData.Companies;
  }

  return cleaned;
};

// Obtener todos los contactos
router.get('/', apiLimiter, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search, lifecycleStage, ownerId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      const searchStr = typeof search === 'string' ? search : String(search);
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchStr}%` } },
        { lastName: { [Op.iLike]: `%${searchStr}%` } },
        { email: { [Op.iLike]: `%${searchStr}%` } },
        { dni: { [Op.eq]: searchStr.trim() } }, // Búsqueda exacta por DNI
        { cee: { [Op.eq]: searchStr.trim().toUpperCase() } }, // Búsqueda exacta por CEE
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
      contacts: contacts.rows.map(cleanContact),
      total: contacts.count,
      page: Number(page),
      totalPages: Math.ceil(contacts.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un contacto por ID
router.get('/:id', apiLimiter, async (req, res) => {
  try {
    // Intentar obtener contact con todas las relaciones
    let contact;
    try {
      contact = await Contact.findByPk(req.params.id, {
        include: [
          { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
          { model: Company, as: 'Company', required: false }, // Empresa principal (compatibilidad)
          { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname'], required: false }, // Todas las empresas asociadas
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
            attributes: ['id', 'name', 'domain', 'phone', 'companyname'],
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

      return res.json(cleanContact(contactData));
    }

    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    res.json(cleanContact(contact));
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
router.post('/', writeLimiter, async (req: AuthRequest, res) => {
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

    // Validar que no exista un contacto con el mismo email (case-insensitive)
    if (contactData.email) {
      const existingContactByEmail = await Contact.findOne({
        where: {
          email: {
            [Op.iLike]: contactData.email.trim(),
          },
        },
      });

      if (existingContactByEmail) {
        return res.status(400).json({ 
          error: 'Ya existe un contacto con este email',
          duplicateField: 'email',
          existingContactId: existingContactByEmail.id,
        });
      }
    }

    // Validar que no exista un contacto con el mismo DNI (si se proporciona)
    if (contactData.dni && contactData.dni.trim() !== '') {
      const existingContactByDni = await Contact.findOne({
        where: {
          dni: contactData.dni.trim(),
        },
      });

      if (existingContactByDni) {
        return res.status(400).json({ 
          error: 'Ya existe un contacto con este DNI',
          duplicateField: 'dni',
          existingContactId: existingContactByDni.id,
        });
      }
    }

    // Validar que no exista un contacto con el mismo CEE (si se proporciona)
    if (contactData.cee && contactData.cee.trim() !== '') {
      const existingContactByCee = await Contact.findOne({
        where: {
          cee: contactData.cee.trim().toUpperCase(),
        },
      });

      if (existingContactByCee) {
        return res.status(400).json({ 
          error: 'Ya existe un contacto con este CEE',
          duplicateField: 'cee',
          existingContactId: existingContactByCee.id,
        });
      }
    }

    const contact = await Contact.create(contactData);
    const newContact = await Contact.findByPk(contact.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
      ],
    });

    res.status(201).json(cleanContact(newContact));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar contacto
router.put('/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    // Validar que companyId esté presente si se está enviando en el body
    if (req.body.hasOwnProperty('companyId') && !req.body.companyId) {
      return res.status(400).json({ error: 'La empresa principal es requerida' });
    }

    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    const contactData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId || null,
    };

    // Validar que no exista otro contacto con el mismo email (excluyendo el actual)
    if (contactData.email && contactData.email.trim() !== contact.email) {
      const existingContactByEmail = await Contact.findOne({
        where: {
          email: {
            [Op.iLike]: contactData.email.trim(),
          },
          id: {
            [Op.ne]: contact.id, // Excluir el contacto actual
          },
        },
      });

      if (existingContactByEmail) {
        return res.status(400).json({ 
          error: 'Ya existe otro contacto con este email',
          duplicateField: 'email',
          existingContactId: existingContactByEmail.id,
        });
      }
    }

    // Validar que no exista otro contacto con el mismo DNI (excluyendo el actual)
    if (contactData.dni && contactData.dni.trim() !== '' && contactData.dni.trim() !== (contact.dni || '')) {
      const existingContactByDni = await Contact.findOne({
        where: {
          dni: contactData.dni.trim(),
          id: {
            [Op.ne]: contact.id,
          },
        },
      });

      if (existingContactByDni) {
        return res.status(400).json({ 
          error: 'Ya existe otro contacto con este DNI',
          duplicateField: 'dni',
          existingContactId: existingContactByDni.id,
        });
      }
    }

    // Validar que no exista otro contacto con el mismo CEE (excluyendo el actual)
    if (contactData.cee && contactData.cee.trim() !== '' && contactData.cee.trim().toUpperCase() !== (contact.cee || '')) {
      const existingContactByCee = await Contact.findOne({
        where: {
          cee: contactData.cee.trim().toUpperCase(),
          id: {
            [Op.ne]: contact.id,
          },
        },
      });

      if (existingContactByCee) {
        return res.status(400).json({ 
          error: 'Ya existe otro contacto con este CEE',
          duplicateField: 'cee',
          existingContactId: existingContactByCee.id,
        });
      }
    }

    await contact.update(contactData);
    const updatedContact = await Contact.findByPk(contact.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Company, as: 'Company' },
      ],
    });

    res.json(cleanContact(updatedContact));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar contacto
router.delete('/:id', deleteLimiter, async (req, res) => {
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
router.post('/:id/companies', writeLimiter, async (req, res) => {
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
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname'] },
      ],
    });

    res.json(cleanContact(updatedContact));
  } catch (error: any) {
    console.error('Error adding companies to contact:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al asociar las empresas' });
  }
});

// Eliminar asociación de empresa con contacto
router.delete('/:id/companies/:companyId', deleteLimiter, async (req, res) => {
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
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname'] },
      ],
    });

    res.json(cleanContact(updatedContact));
  } catch (error: any) {
    console.error('Error removing company association:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
  }
});

export default router;





