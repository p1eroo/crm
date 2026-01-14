import express from 'express';
import { Op } from 'sequelize';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { apiLimiter, writeLimiter, deleteLimiter, heavyOperationLimiter } from '../middleware/rateLimiter';

const router = express.Router();
router.use(authenticateToken);

// Función para limpiar empresas eliminando campos null y objetos relacionados null
const cleanCompany = (company: any, includeSensitive: boolean = false): any => {
  const companyData = company.toJSON ? company.toJSON() : company;
  const cleaned: any = {
    id: companyData.id,
    name: companyData.name || '',
    lifecycleStage: companyData.lifecycleStage || 'lead',
    createdAt: companyData.createdAt,
    updatedAt: companyData.updatedAt,
  };

  // Solo incluir campos opcionales si no son null
  if (companyData.domain != null) cleaned.domain = companyData.domain;
  if (companyData.companyname != null) cleaned.companyname = companyData.companyname;
  if (companyData.phone != null) cleaned.phone = companyData.phone;
  if (companyData.leadSource != null) cleaned.leadSource = companyData.leadSource;
  if (companyData.city != null) cleaned.city = companyData.city;
  if (companyData.state != null) cleaned.state = companyData.state;
  if (companyData.country != null) cleaned.country = companyData.country;
  if (companyData.estimatedRevenue != null) cleaned.estimatedRevenue = companyData.estimatedRevenue;
  if (companyData.isRecoveredClient != null) cleaned.isRecoveredClient = companyData.isRecoveredClient;
  if (companyData.ownerId != null) cleaned.ownerId = companyData.ownerId;
  if (companyData.linkedin != null) cleaned.linkedin = companyData.linkedin;
  if (companyData.numberOfEmployees != null) cleaned.numberOfEmployees = companyData.numberOfEmployees;

  // Solo incluir datos sensibles si se solicita explícitamente (para detalle completo)
  if (includeSensitive) {
    if (companyData.email != null) cleaned.email = companyData.email;
    if (companyData.ruc != null) cleaned.ruc = companyData.ruc;
    if (companyData.address != null) cleaned.address = companyData.address;
    if (companyData.idClienteEmpresa != null) cleaned.idClienteEmpresa = companyData.idClienteEmpresa;
  }

  // Solo incluir relaciones si existen
  if (companyData.Owner) {
    cleaned.Owner = {
      id: companyData.Owner.id,
      firstName: companyData.Owner.firstName || '',
      lastName: companyData.Owner.lastName || '',
    };
    // Solo incluir email del Owner si se solicita explícitamente
    if (includeSensitive && companyData.Owner.email) {
      cleaned.Owner.email = companyData.Owner.email;
    }
  }
  if (companyData.Contacts && Array.isArray(companyData.Contacts) && companyData.Contacts.length > 0) {
    cleaned.Contacts = companyData.Contacts;
  }

  return cleaned;
};

// Función para transformar empresa para lista (sin datos sensibles)
const transformCompanyForList = (company: any): any => {
  return cleanCompany(company, false);
};

// Obtener todas las empresas
router.get('/', apiLimiter, async (req: AuthRequest, res) => {
  try {
    const { 
      page = 1, 
      limit: limitParam = 50, 
      search, 
      lifecycleStage, 
      ownerId, 
      companyname,
      // Nuevos parámetros de filtro
      stages, // Array de etapas: ["lead", "activo"]
      countries, // Array de países: ["Perú", "Chile"]
      owners, // Array: ["me", "unassigned", "1", "2"]
      sortBy = 'newest', // newest, oldest, name, nameDesc
      // Filtros por columna
      filterNombre,
      filterPropietario,
      filterTelefono,
      filterCorreo,
      filterOrigenLead,
      filterEtapa,
      filterCR,
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
        { name: { [Op.iLike]: `%${searchStr}%` } },
        { domain: { [Op.iLike]: `%${searchStr}%` } },
        { companyname: { [Op.iLike]: `%${searchStr}%` } },
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
    
    if (companyname) {
      where.companyname = companyname;
    }
    
    // Filtros por columna
    if (filterNombre) {
      where.name = { [Op.iLike]: `%${filterNombre}%` };
    }
    
    if (filterTelefono) {
      where.phone = { [Op.iLike]: `%${filterTelefono}%` };
    }
    
    if (filterOrigenLead) {
      where.leadSource = { [Op.iLike]: `%${filterOrigenLead}%` };
    }
    
    if (filterEtapa) {
      // Buscar por el valor exacto del enum
      where.lifecycleStage = { [Op.iLike]: `%${filterEtapa}%` };
    }
    
    if (filterCR !== undefined) {
      const filterCRValue = String(filterCR).toLowerCase().trim();
      const buscaSi = ['sí', 'si', 'yes', 's', '1', 'x', '✓', 'true'].includes(filterCRValue);
      const buscaNo = ['no', 'not', '0', 'false', 'n'].includes(filterCRValue);
      
      if (buscaSi) {
        where.isRecoveredClient = true;
      } else if (buscaNo) {
        where.isRecoveredClient = false;
      }
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
        case 'name':
          if (rule.operator === 'contains') {
            where.name = { [Op.iLike]: `%${rule.value}%` };
          } else if (rule.operator === 'equals') {
            where.name = { [Op.iLike]: rule.value };
          } else if (rule.operator === 'startsWith') {
            where.name = { [Op.iLike]: `${rule.value}%` };
          } else if (rule.operator === 'endsWith') {
            where.name = { [Op.iLike]: `%${rule.value}` };
          } else if (rule.operator === 'notEquals') {
            where.name = { [Op.notILike]: rule.value };
          }
          break;
        case 'companyname':
          if (rule.operator === 'contains') {
            where.companyname = { [Op.iLike]: `%${rule.value}%` };
          } else if (rule.operator === 'equals') {
            where.companyname = { [Op.iLike]: rule.value };
          }
          break;
        case 'phone':
          if (rule.operator === 'contains') {
            where.phone = { [Op.iLike]: `%${rule.value}%` };
          }
          break;
        case 'leadSource':
          if (rule.operator === 'contains') {
            where.leadSource = { [Op.iLike]: `%${rule.value}%` };
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
        order = [['name', 'ASC']];
        break;
      case 'nameDesc':
        order = [['name', 'DESC']];
        break;
    }

    // Intentar obtener companies con la relación Owner
    let companies;
    try {
      companies = await Company.findAndCountAll({
        where,
        include: [
          { 
            model: User, 
            as: 'Owner', 
            attributes: ['id', 'firstName', 'lastName'], // NO incluir email del Owner
            required: false 
          },
        ],
        limit,
        offset,
        order,
        distinct: true, // Importante para contar correctamente con includes
      });
    } catch (includeError: any) {
      // Si falla por problemas con la relación Owner, intentar sin el include
      console.warn('⚠️ Error con relación Owner, intentando sin include:', includeError.message);
      companies = await Company.findAndCountAll({
        where,
        limit,
        offset,
        order,
      });
      
      // Agregar Owner manualmente solo para los que tienen ownerId válido
      const companiesWithOwner = await Promise.all(
        companies.rows.map(async (company: any) => {
          const companyData = company.toJSON();
          if (companyData.ownerId) {
            try {
              const owner = await User.findByPk(companyData.ownerId, {
                attributes: ['id', 'firstName', 'lastName'], // NO incluir email
              });
              companyData.Owner = owner ? owner.toJSON() : null;
            } catch (ownerError) {
              console.warn(`⚠️ No se pudo obtener Owner para company ${companyData.id}:`, ownerError);
              companyData.Owner = null;
            }
          } else {
            companyData.Owner = null;
          }
          return transformCompanyForList(companyData);
        })
      );
      
      return res.json({
        companies: companiesWithOwner,
        total: companies.count,
        page: pageNum,
        limit,
        totalPages: Math.ceil(companies.count / limit),
      });
    }

    // Transformar empresas para filtrar datos sensibles
    const transformedCompanies = companies.rows.map(transformCompanyForList);

    res.json({
      companies: transformedCompanies,
      total: companies.count,
      page: pageNum,
      limit,
      totalPages: Math.ceil(companies.count / limit),
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    // No exponer detalles del error en producción
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Error al obtener empresas';
    
    res.status(500).json({ 
      error: errorMessage
    });
  }
});

// Obtener una empresa por ID
router.get('/:id', apiLimiter, async (req, res) => {
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

    res.json(cleanCompany(company, true));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear empresa
router.post('/', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const companyData = {
      ...req.body,
      // Asignar automáticamente el usuario actual como propietario del registro
      ownerId: req.body.ownerId || req.userId || null,
    };

    // Validar que no exista una empresa con el mismo nombre (case-insensitive)
    if (companyData.name) {
      const existingCompanyByName = await Company.findOne({
        where: {
          name: {
            [Op.iLike]: companyData.name.trim(), // Case-insensitive
          },
        },
      });

      if (existingCompanyByName) {
        return res.status(400).json({ 
          error: 'Ya existe una empresa con este nombre',
          duplicateField: 'name',
          existingCompanyId: existingCompanyByName.id,
        });
      }
    }

    // Validar que no exista una empresa con el mismo RUC (si se proporciona)
    if (companyData.ruc && companyData.ruc.trim() !== '') {
      const existingCompanyByRuc = await Company.findOne({
        where: {
          ruc: companyData.ruc.trim(),
        },
      });

      if (existingCompanyByRuc) {
        return res.status(400).json({ 
          error: 'Ya existe una empresa con este RUC',
          duplicateField: 'ruc',
          existingCompanyId: existingCompanyByRuc.id,
        });
      }
    }

    const company = await Company.create(companyData);
    const newCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json(cleanCompany(newCompany, true));
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar empresa
router.put('/:id', writeLimiter, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Preparar los datos para actualizar, manejando campos especiales
    const updateData: any = { ...req.body };
    
    // Si leadSource viene, asegurarse de que se mapee correctamente
    if (updateData.leadSource !== undefined) {
      updateData.leadSource = updateData.leadSource || null;
    }
    
    // Si estimatedRevenue viene como string vacío o null, convertirlo a null
    if (updateData.estimatedRevenue !== undefined) {
      if (updateData.estimatedRevenue === '' || updateData.estimatedRevenue === null) {
        updateData.estimatedRevenue = null;
      } else if (typeof updateData.estimatedRevenue === 'string') {
        const parsed = parseFloat(updateData.estimatedRevenue);
        updateData.estimatedRevenue = isNaN(parsed) ? null : parsed;
      }
    }
    
    // Si email viene como string vacío, convertirlo a null
    if (updateData.email !== undefined && updateData.email === '') {
      updateData.email = null;
    }

    await company.update(updateData);
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json(cleanCompany(updatedCompany, true));
  } catch (error: any) {
    console.error('Error updating company:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar empresa
router.delete('/:id', deleteLimiter, async (req, res) => {
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
router.post('/:id/contacts', writeLimiter, async (req, res) => {
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

    res.json(cleanCompany(updatedCompany, true));
  } catch (error: any) {
    console.error('Error adding contacts to company:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al asociar los contactos' });
  }
});

// Eliminar asociación de contacto con empresa
router.delete('/:id/contacts/:contactId', deleteLimiter, async (req, res) => {
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

    res.json(cleanCompany(updatedCompany, true));
  } catch (error: any) {
    console.error('Error removing contact association:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
  }
});

export default router;





