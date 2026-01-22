import express from 'express';
import { Op } from 'sequelize';
import { Deal } from '../models/Deal';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { DealContact } from '../models/DealContact';
import { DealCompany } from '../models/DealCompany';
import { DealDeal } from '../models/DealDeal';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sequelize } from '../config/database';
import { getRoleBasedDataFilter, canModifyResource, canDeleteResource } from '../utils/rolePermissions';
import { logSystemAction, SystemActions, EntityTypes } from '../utils/systemLogger';

const router = express.Router();
router.use(authenticateToken);

// Función para limpiar deals eliminando campos null y objetos relacionados null
const cleanDeal = (deal: any): any => {
  const dealJson = deal.toJSON ? deal.toJSON() : deal;
  const cleaned: any = {
    id: dealJson.id,
    name: dealJson.name,
    amount: typeof dealJson.amount === 'string' ? parseFloat(dealJson.amount) : (Number(dealJson.amount) || 0),
    stage: dealJson.stage,
    ownerId: dealJson.ownerId,
    pipelineId: dealJson.pipelineId,
    createdAt: dealJson.createdAt,
    updatedAt: dealJson.updatedAt,
  };

  // Solo incluir campos opcionales si no son null
  if (dealJson.closeDate != null) cleaned.closeDate = dealJson.closeDate;
  if (dealJson.probability != null) cleaned.probability = dealJson.probability;
  if (dealJson.priority != null) cleaned.priority = dealJson.priority;
  if (dealJson.contactId != null) cleaned.contactId = dealJson.contactId;
  if (dealJson.companyId != null) cleaned.companyId = dealJson.companyId;
  if (dealJson.description != null) cleaned.description = dealJson.description;
  if (dealJson.tags != null && Array.isArray(dealJson.tags) && dealJson.tags.length > 0) cleaned.tags = dealJson.tags;

  // Solo incluir relaciones si existen
  if (dealJson.Owner) cleaned.Owner = dealJson.Owner;
  if (dealJson.Contact) cleaned.Contact = dealJson.Contact;
  if (dealJson.Company) cleaned.Company = dealJson.Company;
  if (dealJson.Contacts && Array.isArray(dealJson.Contacts) && dealJson.Contacts.length > 0) {
    cleaned.Contacts = dealJson.Contacts;
  }
  if (dealJson.Companies && Array.isArray(dealJson.Companies) && dealJson.Companies.length > 0) {
    cleaned.Companies = dealJson.Companies;
  }
  if (dealJson.Deals && Array.isArray(dealJson.Deals) && dealJson.Deals.length > 0) {
    cleaned.Deals = dealJson.Deals;
  }

  return cleaned;
};

// Función helper para transformar deals y asegurar que amount sea un número (mantener compatibilidad)
const transformDeal = (deal: any) => {
  return cleanDeal(deal);
};

// Obtener todos los deals
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = 1, 
      limit: limitParam = 50, 
      search, 
      stage, 
      ownerId, 
      pipelineId, 
      contactId, 
      companyId,
      // Nuevos parámetros de filtro
      stages, // Array de etapas
      owners, // Array: ["me", "unassigned", "1", "2"]
      sortBy = 'newest', // newest, oldest, name, nameDesc
      // Filtros por columna
      filterNombre,
      filterContacto,
      filterEmpresa,
      filterEtapa,
    } = req.query;
    
    // Limitar el tamaño máximo de página para evitar sobrecarga
    const maxLimit = 100;
    const requestedLimit = Number(limitParam);
    const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
    const pageNum = Number(page) < 1 ? 1 : Number(page);
    const offset = (pageNum - 1) * limit;

    const where: any = {};
    
    // ⭐ Aplicar filtro automático según rol del usuario
    const roleFilter = getRoleBasedDataFilter(req.userRole, req.userId);
    Object.assign(where, roleFilter);
    
    // Búsqueda general
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    
    // Filtro por etapas (stage) - soporta múltiples valores
    if (stage) {
      where.stage = stage;
    } else if (stages) {
      const stagesArray = Array.isArray(stages) ? stages : [stages];
      if (stagesArray.length > 0) {
        where.stage = { [Op.in]: stagesArray };
      }
    }
    
    // Filtro por propietarios (solo para admin y jefe_comercial, otros roles ya tienen filtro RBAC)
    // Si el usuario NO es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se debe sobrescribir
    if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && owners) {
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
    } else if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && ownerId) {
      // Compatibilidad con el filtro antiguo (solo para admin y jefe_comercial)
      where.ownerId = ownerId === 'me' ? req.userId : ownerId;
    }
    // Si no es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se sobrescribe
    
    if (pipelineId) {
      where.pipelineId = pipelineId;
    }
    
    // Filtros por columna
    if (filterNombre) {
      if (where.name) {
        // Si ya existe búsqueda por nombre, combinarla
        where.name = { [Op.and]: [
          where.name,
          { [Op.iLike]: `%${filterNombre}%` }
        ]};
      } else {
        where.name = { [Op.iLike]: `%${filterNombre}%` };
      }
    }
    
    if (filterEtapa) {
      const filterEtapaStr = String(filterEtapa);
      // Si ya existe filtro por stage, combinarlo
      if (where.stage) {
        if (typeof where.stage === 'object' && where.stage[Op.in]) {
          // Ya es un array, filtrar los que coincidan
          const stagesArray = Array.isArray(where.stage[Op.in]) ? where.stage[Op.in] : [where.stage[Op.in]];
          where.stage = { [Op.in]: stagesArray.filter((s: string) => s.toLowerCase().includes(filterEtapaStr.toLowerCase())) };
        } else {
          // Es un valor único, verificar si coincide
          if (!String(where.stage).toLowerCase().includes(filterEtapaStr.toLowerCase())) {
            where.stage = { [Op.in]: [] }; // No hay coincidencias
          }
        }
      } else {
        where.stage = { [Op.iLike]: `%${filterEtapaStr}%` };
      }
    }

    // Manejar contactId: buscar tanto en relación uno-a-muchos como muchos-a-muchos
    if (contactId) {
      const contactIdNum = Number(contactId);
      
      // Obtener dealIds de la relación muchos-a-muchos (deal_contacts)
      const dealContacts = await DealContact.findAll({
        where: { contactId: contactIdNum },
        attributes: ['dealId'],
      });
      const dealIdsFromManyToMany = dealContacts.map(dc => dc.dealId);
      
      // Construir condición OR para buscar en ambas relaciones
      const contactConditions: any[] = [
        { contactId: contactIdNum }
      ];
      
      // Si hay deals en la relación muchos-a-muchos, agregarlos a la búsqueda
      if (dealIdsFromManyToMany.length > 0) {
        contactConditions.push({
          id: { [Op.in]: dealIdsFromManyToMany }
        });
      }
      
      where[Op.or] = contactConditions;
    }

    // Manejar companyId: buscar tanto en relación uno-a-muchos como muchos-a-muchos
    if (companyId) {
      const companyIdNum = Number(companyId);
      
      // Obtener dealIds de la relación muchos-a-muchos (deal_companies)
      const dealCompanies = await DealCompany.findAll({
        where: { companyId: companyIdNum },
        attributes: ['dealId'],
      });
      const dealIdsFromManyToMany = dealCompanies.map(dc => dc.dealId);
      
      const companyConditions: any[] = [
        { companyId: companyIdNum }
      ];
      
      // Si hay deals en la relación muchos-a-muchos, agregarlos a la búsqueda
      if (dealIdsFromManyToMany.length > 0) {
        companyConditions.push({
          id: { [Op.in]: dealIdsFromManyToMany }
        });
      }

      // Si ya existe Op.or para contactId, combinarlo con AND
      if (where[Op.or]) {
        where[Op.and] = [
          { [Op.or]: where[Op.or] },
          { [Op.or]: companyConditions }
        ];
        delete where[Op.or];
      } else {
        where[Op.or] = companyConditions;
      }
    }

    // Configurar includes
    const includes: any[] = [
      { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
    ];
    
    // Si hay filtro por contacto, hacer el include requerido
    if (filterContacto) {
      includes.push({
        model: Contact,
        as: 'Contact',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: true,
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${filterContacto}%` } },
            { lastName: { [Op.iLike]: `%${filterContacto}%` } },
          ],
        },
      });
    } else {
      includes.push({
        model: Contact,
        as: 'Contact',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      });
    }
    
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

    const deals = await Deal.findAndCountAll({
      where,
      include: includes,
      distinct: true, // Importante para contar correctamente con includes
      limit,
      offset,
      order,
    });

    const transformedDeals = deals.rows.map(deal => transformDeal(deal));
    
    res.json({
      deals: transformedDeals,
      total: deals.count,
      page: pageNum,
      limit,
      totalPages: Math.ceil(deals.count / limit),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un deal por ID
router.get('/:id', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
        { model: Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
        { model: Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
      ],
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    // Combinar ambas direcciones de la relación (bidireccional)
    const dealJson: any = deal.toJSON ? deal.toJSON() : deal;
    const allRelatedDeals = [
      ...(dealJson.Deals || []),
      ...(dealJson.RelatedDeals || []),
    ];

    // Eliminar duplicados por ID
    const uniqueDeals = allRelatedDeals.filter((deal: any, index: number, self: any[]) =>
      index === self.findIndex((d: any) => d.id === deal.id)
    );

    // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
    dealJson.Deals = uniqueDeals;
    delete dealJson.RelatedDeals;

    res.json(transformDeal(dealJson));
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    // Si el error es porque la tabla deal_contacts no existe, intentar sin la relación Contacts
    if (error.message && (error.message.includes('deal_contacts') || error.message.includes('does not exist'))) {
      try {
        const deal = await Deal.findByPk(req.params.id, {
          include: [
            { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: Contact, as: 'Contact', required: false },
            { model: Company, as: 'Company', required: false },
            { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
            { model: Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
            { model: Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
          ],
        });

        if (!deal) {
          return res.status(404).json({ error: 'Deal no encontrado' });
        }

        // Combinar ambas direcciones de la relación (bidireccional)
        const dealJson: any = deal.toJSON ? deal.toJSON() : deal;
        const allRelatedDeals = [
          ...(dealJson.Deals || []),
          ...(dealJson.RelatedDeals || []),
        ];

        // Eliminar duplicados por ID
        const uniqueDeals = allRelatedDeals.filter((deal: any, index: number, self: any[]) =>
          index === self.findIndex((d: any) => d.id === deal.id)
        );

        // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
        dealJson.Deals = uniqueDeals;
        delete dealJson.RelatedDeals;

        res.json(transformDeal(dealJson));
      } catch (fallbackError: any) {
        console.error('Error en fallback:', fallbackError);
        res.status(500).json({ error: fallbackError.message });
      }
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Crear deal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const dealData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId,
    };

    const deal = await Deal.create(dealData);
    const newDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
      ],
    });

    // Registrar log
    if (req.userId) {
      await logSystemAction(
        req.userId,
        SystemActions.CREATE,
        EntityTypes.DEAL,
        deal.id,
        { name: deal.name, amount: deal.amount, stage: deal.stage },
        req
      );
    }

    res.status(201).json(transformDeal(newDeal));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar deal
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    // Verificar permisos: solo el propietario o admin puede modificar
    if (!canModifyResource(req.userRole, req.userId, deal.ownerId)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este deal' });
    }

    await deal.update(req.body);
    // Si se están actualizando los contactos relacionados
    if (req.body.contactIds && Array.isArray(req.body.contactIds)) {
      const dealInstance = await Deal.findByPk(deal.id);
      if (dealInstance) {
        await (dealInstance as any).setContacts(req.body.contactIds);
      }
    }

    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Company, as: 'Company' },
      ],
    });

    // Registrar log
    if (req.userId && updatedDeal) {
      await logSystemAction(
        req.userId,
        SystemActions.UPDATE,
        EntityTypes.DEAL,
        deal.id,
        { name: updatedDeal.name, changes: req.body },
        req
      );
    }

    res.json(transformDeal(updatedDeal));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar deal
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    // Verificar permisos: solo el propietario o admin puede eliminar
    if (!canDeleteResource(req.userRole, req.userId, deal.ownerId)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este deal' });
    }

    const dealName = deal.name;
    await deal.destroy();

    // Registrar log
    if (req.userId) {
      await logSystemAction(
        req.userId,
        SystemActions.DELETE,
        EntityTypes.DEAL,
        parseInt(req.params.id),
        { name: dealName },
        req
      );
    }

    res.json({ message: 'Deal eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contactos a un deal
router.post('/:id/contacts', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de contactIds' });
    }

    // Usar la relación muchos a muchos
    const currentContacts = await (deal as any).getContacts();
    const currentContactIds = currentContacts.map((c: any) => c.id);

    // Agregar solo los contactos que no están ya asociados
    const newContactIds = contactIds.filter((id: number) => !currentContactIds.includes(id));
    if (newContactIds.length > 0) {
      await (deal as any).addContacts(newContactIds);
    }

    // Obtener el deal actualizado
    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
      ],
    });
    res.json(transformDeal(updatedDeal));
  } catch (error: any) {
    console.error('Error adding contacts to deal:', error);
    res.status(500).json({ error: error.message || 'Error al agregar contactos al negocio' });
  }
});

// Eliminar contactos de un deal
router.delete('/:id/contacts/:contactId', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    const contactId = parseInt(req.params.contactId);
    
    // Intentar usar la relación muchos a muchos
    try {
      await (deal as any).removeContact(contactId);
    } catch (relationError: any) {
      // Si falla, eliminar directamente de la tabla de asociación
      if (relationError.message && (relationError.message.includes('deal_contacts') || relationError.message.includes('does not exist'))) {
        await DealContact.destroy({
          where: {
            dealId: deal.id,
            contactId: contactId
          }
        });
      } else {
        throw relationError;
      }
    }

    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
      ],
    });

    res.json(transformDeal(updatedDeal));
  } catch (error: any) {
    console.error('Error removing contact from deal:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar el contacto del negocio' });
  }
});

// Agregar empresas a un deal
router.post('/:id/companies', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    const { companyIds } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de companyIds' });
    }

    const currentCompanies = await (deal as any).getCompanies();
    const currentCompanyIds = currentCompanies.map((c: any) => c.id);

    const newCompanyIds = companyIds.filter((id: number) => !currentCompanyIds.includes(id));
    if (newCompanyIds.length > 0) {
      await (deal as any).addCompanies(newCompanyIds);
    }

    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
      ],
    });

    res.status(200).json(transformDeal(updatedDeal));
  } catch (error: any) {
    console.error('Error adding companies to deal:', error);
    res.status(500).json({ error: error.message || 'Error al agregar empresas al negocio' });
  }
});

// Eliminar empresa de un deal
router.delete('/:id/companies/:companyId', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    const companyIdToRemove = parseInt(req.params.companyId);

    try {
      await (deal as any).removeCompany(companyIdToRemove);
    } catch (sequelizeError: any) {
      console.warn(`⚠️  Sequelize removeCompany failed, attempting direct deletion from DealCompany: ${sequelizeError.message}`);
      await DealCompany.destroy({
        where: {
          dealId: deal.id,
          companyId: companyIdToRemove,
        },
      });
    }

    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
      ],
    });

    res.json(transformDeal(updatedDeal));
  } catch (error: any) {
    console.error('Error removing company from deal:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar la empresa del negocio' });
  }
});

// Agregar negocios relacionados a un deal
router.post('/:id/deals', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    const { dealIds } = req.body;
    if (!Array.isArray(dealIds) || dealIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de dealIds' });
    }

    // Obtener los negocios relacionados actuales (buscar en ambas direcciones para evitar duplicados)
    const currentDeals = await (deal as any).getDeals();
    const currentRelatedDeals = await (deal as any).getRelatedDeals();
    const currentDealIds = [
      ...currentDeals.map((d: any) => d.id),
      ...currentRelatedDeals.map((d: any) => d.id),
    ];

    // Agregar solo los negocios que no están ya asociados
    const newDealIds = dealIds.filter((id: number) => !currentDealIds.includes(id));
    if (newDealIds.length > 0) {
      // Agregar la relación en una dirección (dealId -> relatedDealId)
      // La consulta bidireccional se maneja en el GET
      await (deal as any).addDeals(newDealIds);
    }

    // Obtener el deal actualizado
    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
        { model: Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
        { model: Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
      ],
    });

    // Combinar ambas direcciones de la relación (bidireccional)
    const updatedDealJson: any = updatedDeal?.toJSON ? updatedDeal.toJSON() : updatedDeal;
    if (updatedDealJson) {
      const allRelatedDeals = [
        ...(updatedDealJson.Deals || []),
        ...(updatedDealJson.RelatedDeals || []),
      ];

      // Eliminar duplicados por ID
      const uniqueDeals = allRelatedDeals.filter((deal: any, index: number, self: any[]) =>
        index === self.findIndex((d: any) => d.id === deal.id)
      );

      // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
      updatedDealJson.Deals = uniqueDeals;
      delete updatedDealJson.RelatedDeals;
    }

    res.json(transformDeal(updatedDealJson || updatedDeal));
  } catch (error: any) {
    console.error('Error adding deals to deal:', error);
    res.status(500).json({ error: error.message || 'Error al agregar negocios relacionados' });
  }
});

// Eliminar negocio relacionado de un deal
router.delete('/:id/deals/:dealId', async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    const dealIdToRemove = parseInt(req.params.dealId);
    
    try {
      // Intentar eliminar usando Sequelize (solo elimina en una dirección)
      await (deal as any).removeDeal(dealIdToRemove);
    } catch (sequelizeError: any) {
      console.warn(`⚠️  Sequelize removeDeal failed, attempting direct deletion from DealDeal: ${sequelizeError.message}`);
    }
    
    // Eliminar la relación en ambas direcciones (bidireccional)
    await DealDeal.destroy({
      where: {
        [Op.or]: [
          { dealId: deal.id, relatedDealId: dealIdToRemove },
          { dealId: dealIdToRemove, relatedDealId: deal.id },
        ],
      },
    });

    const updatedDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
        { model: Company, as: 'Company', required: false },
        { model: Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
        { model: Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
        { model: Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
      ],
    });

    // Combinar ambas direcciones de la relación (bidireccional)
    const updatedDealJson: any = updatedDeal?.toJSON ? updatedDeal.toJSON() : updatedDeal;
    if (updatedDealJson) {
      const allRelatedDeals = [
        ...(updatedDealJson.Deals || []),
        ...(updatedDealJson.RelatedDeals || []),
      ];

      // Eliminar duplicados por ID
      const uniqueDeals = allRelatedDeals.filter((deal: any, index: number, self: any[]) =>
        index === self.findIndex((d: any) => d.id === deal.id)
      );

      // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
      updatedDealJson.Deals = uniqueDeals;
      delete updatedDealJson.RelatedDeals;
    }

    res.json(transformDeal(updatedDealJson || updatedDeal));
  } catch (error: any) {
    console.error('Error removing deal from deal:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar el negocio relacionado' });
  }
});

// Obtener deals por pipeline/stage
router.get('/pipeline/:pipelineId', async (req, res) => {
  try {
    const deals = await Deal.findAll({
      where: { pipelineId: req.params.pipelineId },
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const transformedDeals = deals.map(deal => transformDeal(deal));
    res.json(transformedDeals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

