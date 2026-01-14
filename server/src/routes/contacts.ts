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
    const { 
      page = 1, 
      limit: limitParam = 50, 
      search, 
      lifecycleStage, 
      ownerId,
      // Nuevos parámetros de filtro
      stages, // Array de etapas: ["lead", "activo"]
      countries, // Array de países: ["Perú", "Chile"]
      owners, // Array: ["me", "unassigned", "1", "2"]
      sortBy = 'newest', // newest, oldest, name, nameDesc
      // Filtros por columna
      filterNombre,
      filterEmpresa,
      filterTelefono,
      filterPais,
      filterEtapa,
      // Filtros avanzados (JSON string)
      filterRules,
    } = req.query;
    
    // Limitar el tamaño máximo de página para evitar sobrecarga
    const maxLimit = 100;
    const requestedLimit = Number(limitParam);
    const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
    const pageNum = Number(page) < 1 ? 1 : Number(page);
    const offset = (pageNum - 1) * limit;

    const where: any = {};
    
    // Búsqueda general
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
    
    // Filtro por etapas (lifecycleStage) - soporta múltiples valores
    if (lifecycleStage) {
      where.lifecycleStage = lifecycleStage;
    } else if (stages) {
      // Si viene como array en query string: ?stages=lead&stages=activo
      const stagesArray = Array.isArray(stages) ? stages : [stages];
      if (stagesArray.length > 0) {
        where.lifecycleStage = { [Op.in]: stagesArray };
      }
    }
    
    // Filtro por países
    if (countries) {
      const countriesArray = Array.isArray(countries) ? countries : [countries];
      if (countriesArray.length > 0) {
        where.country = { [Op.in]: countriesArray };
      }
    }
    
    // Filtro por propietarios
    if (owners) {
      const ownersArray = Array.isArray(owners) ? owners : [owners];
      const ownerIds: (number | null)[] = [];
      const hasUnassigned = ownersArray.includes('unassigned');
      const hasMe = ownersArray.includes('me');
      
      ownersArray.forEach((owner: string | any) => {
        const ownerStr = String(owner);
        if (ownerStr === 'unassigned') {
          // Se manejará después
        } else if (ownerStr === 'me') {
          if (req.userId) ownerIds.push(req.userId);
        } else if (!isNaN(Number(ownerStr))) {
          ownerIds.push(Number(ownerStr));
        }
      });
      
      if (hasUnassigned && ownerIds.length > 0) {
        where.ownerId = { [Op.or]: [{ [Op.in]: ownerIds }, { [Op.is]: null }] };
      } else if (hasUnassigned) {
        where.ownerId = { [Op.is]: null };
      } else if (hasMe && ownerIds.length > 1) {
        where.ownerId = { [Op.in]: ownerIds };
      } else if (hasMe) {
        where.ownerId = req.userId || null;
      } else if (ownerIds.length > 0) {
        where.ownerId = { [Op.in]: ownerIds };
      }
    } else if (ownerId) {
      // Compatibilidad con el filtro antiguo
      where.ownerId = ownerId === 'me' ? req.userId : ownerId;
    }
    
    // Filtros por columna
    if (filterNombre) {
      const nombreConditions = [
        { firstName: { [Op.iLike]: `%${filterNombre}%` } },
        { lastName: { [Op.iLike]: `%${filterNombre}%` } },
      ];
      if (where[Op.or]) {
        where[Op.or] = [...where[Op.or], ...nombreConditions];
      } else {
        where[Op.or] = nombreConditions;
      }
    }
    
    if (filterTelefono) {
      const telefonoConditions = [
        { phone: { [Op.iLike]: `%${filterTelefono}%` } },
        { mobile: { [Op.iLike]: `%${filterTelefono}%` } },
      ];
      if (where[Op.or]) {
        where[Op.or] = [...where[Op.or], ...telefonoConditions];
      } else {
        where[Op.or] = telefonoConditions;
      }
    }
    
    if (filterPais) {
      where.country = { [Op.iLike]: `%${filterPais}%` };
    }
    
    if (filterEtapa) {
      where.lifecycleStage = { [Op.iLike]: `%${filterEtapa}%` };
    }
    
    // Filtros avanzados (reglas)
    let parsedFilterRules: any[] = [];
    if (filterRules) {
      try {
        parsedFilterRules = typeof filterRules === 'string' 
          ? JSON.parse(filterRules) 
          : filterRules;
      } catch (e) {
        console.warn('Error parsing filterRules:', e);
      }
    }
    
    // Aplicar filtros avanzados
    parsedFilterRules.forEach((rule: any) => {
      if (!rule.value || !rule.column || !rule.operator) return;
      
      const ruleValue = String(rule.value);
      
      switch (rule.column) {
        case 'firstName':
        case 'lastName':
          if (rule.operator === 'contains') {
            where[rule.column] = { [Op.iLike]: `%${rule.value}%` };
          } else if (rule.operator === 'equals') {
            where[rule.column] = { [Op.iLike]: rule.value };
          }
          break;
        case 'email':
          if (rule.operator === 'contains') {
            where.email = { [Op.iLike]: `%${rule.value}%` };
          }
          break;
        case 'phone':
        case 'mobile':
          if (rule.operator === 'contains') {
            where[rule.column] = { [Op.iLike]: `%${rule.value}%` };
          }
          break;
        case 'country':
          if (rule.operator === 'contains') {
            where.country = { [Op.iLike]: `%${rule.value}%` };
          }
          break;
        case 'lifecycleStage':
          if (rule.operator === 'equals') {
            where.lifecycleStage = rule.value;
          }
          break;
        case 'jobTitle':
          if (rule.operator === 'contains') {
            where.jobTitle = { [Op.iLike]: `%${rule.value}%` };
          }
          break;
      }
    });
    
    // Ordenamiento
    let order: [string, string][] = [['createdAt', 'DESC']];
    switch (sortBy) {
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'name':
        order = [['firstName', 'ASC'], ['lastName', 'ASC']];
        break;
      case 'nameDesc':
        order = [['firstName', 'DESC'], ['lastName', 'DESC']];
        break;
    }

    // Configurar includes
    const includes: any[] = [
      { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
    ];
    
    // Si hay filtro por empresa, hacer el include requerido
    if (filterEmpresa) {
      includes.push({
        model: Company,
        as: 'Company',
        attributes: ['id', 'name'],
        required: true,
        where: {
          name: { [Op.iLike]: `%${filterEmpresa}%` },
        },
      });
    } else {
      includes.push({
        model: Company,
        as: 'Company',
        attributes: ['id', 'name'],
        required: false,
      });
    }

    const contacts = await Contact.findAndCountAll({
      where,
      include: includes,
      distinct: true, // Importante para contar correctamente con includes
      limit,
      offset,
      order,
    });

    res.json({
      contacts: contacts.rows.map(cleanContact),
      total: contacts.count,
      page: pageNum,
      limit,
      totalPages: Math.ceil(contacts.count / limit),
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





