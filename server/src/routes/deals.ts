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
import { apiLimiter, writeLimiter, deleteLimiter } from '../middleware/rateLimiter';

const router = express.Router();
router.use(authenticateToken);

// Función helper para transformar deals y asegurar que amount sea un número
const transformDeal = (deal: any) => {
  const dealJson = deal.toJSON ? deal.toJSON() : deal;
  return {
    ...dealJson,
    amount: typeof dealJson.amount === 'string' ? parseFloat(dealJson.amount) : (Number(dealJson.amount) || 0),
  };
};

// Obtener todos los deals
router.get('/', apiLimiter, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search, stage, ownerId, pipelineId, contactId, companyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (stage) {
      where.stage = stage;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }
    if (pipelineId) {
      where.pipelineId = pipelineId;
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

    const deals = await Deal.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    const transformedDeals = deals.rows.map(deal => transformDeal(deal));
    
    res.json({
      deals: transformedDeals,
      total: deals.count,
      page: Number(page),
      totalPages: Math.ceil(deals.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un deal por ID
router.get('/:id', apiLimiter, async (req, res) => {
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
router.post('/', writeLimiter, async (req: AuthRequest, res) => {
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

    res.status(201).json(transformDeal(newDeal));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar deal
router.put('/:id', writeLimiter, async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
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

    res.json(transformDeal(updatedDeal));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar deal
router.delete('/:id', deleteLimiter, async (req, res) => {
  try {
    const deal = await Deal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal no encontrado' });
    }

    await deal.destroy();
    res.json({ message: 'Deal eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contactos a un deal
router.post('/:id/contacts', writeLimiter, async (req, res) => {
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
router.delete('/:id/contacts/:contactId', deleteLimiter, async (req, res) => {
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
router.post('/:id/companies', writeLimiter, async (req, res) => {
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
router.delete('/:id/companies/:companyId', deleteLimiter, async (req, res) => {
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

