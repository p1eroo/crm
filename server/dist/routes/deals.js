"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Deal_1 = require("../models/Deal");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const DealContact_1 = require("../models/DealContact");
const DealCompany_1 = require("../models/DealCompany");
const DealDeal_1 = require("../models/DealDeal");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función helper para transformar deals y asegurar que amount sea un número
const transformDeal = (deal) => {
    const dealJson = deal.toJSON ? deal.toJSON() : deal;
    return {
        ...dealJson,
        amount: typeof dealJson.amount === 'string' ? parseFloat(dealJson.amount) : (Number(dealJson.amount) || 0),
    };
};
// Obtener todos los deals
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, search, stage, ownerId, pipelineId, contactId, companyId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const whereConditions = [];
        // Solo mostrar negocios relacionados (con empresa o contacto)
        // A menos que se especifique un contactId o companyId específico
        if (!contactId && !companyId) {
            whereConditions.push({
                [sequelize_1.Op.or]: [
                    { contactId: { [sequelize_1.Op.ne]: null } },
                    { companyId: { [sequelize_1.Op.ne]: null } },
                ],
            });
        }
        if (search) {
            whereConditions.push({ name: { [sequelize_1.Op.iLike]: `%${search}%` } });
        }
        if (stage) {
            whereConditions.push({ stage: stage });
        }
        if (ownerId) {
            whereConditions.push({ ownerId: ownerId });
        }
        if (pipelineId) {
            whereConditions.push({ pipelineId: pipelineId });
        }
        if (contactId) {
            whereConditions.push({ contactId: contactId });
        }
        if (companyId) {
            whereConditions.push({ companyId: companyId });
        }
        const where = whereConditions.length > 0 ? { [sequelize_1.Op.and]: whereConditions } : {};
        // Obtener todos los deals relacionados (con companyId o contactId)
        const dealsWithRelations = await Deal_1.Deal.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'] },
            ],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']],
        });
        // También obtener deals que tienen relaciones muchos-a-muchos a través de DealCompany o DealContact
        // PERO solo si no tienen contactId o companyId directos (para evitar duplicados)
        const dealIdsWithManyToMany = new Set();
        // Buscar deals con relaciones en DealCompany
        const dealsWithCompanies = await DealCompany_1.DealCompany.findAll({
            attributes: ['dealId'],
            group: ['dealId'],
        });
        dealsWithCompanies.forEach((dc) => {
            dealIdsWithManyToMany.add(dc.dealId);
        });
        // Buscar deals con relaciones en DealContact
        const dealsWithContacts = await DealContact_1.DealContact.findAll({
            attributes: ['dealId'],
            group: ['dealId'],
        });
        dealsWithContacts.forEach((dc) => {
            dealIdsWithManyToMany.add(dc.dealId);
        });
        // Si hay deals con relaciones muchos-a-muchos que no están en los resultados, agregarlos
        // PERO solo si no tienen contactId o companyId (para evitar duplicados y mantener el filtro)
        if (dealIdsWithManyToMany.size > 0) {
            const existingDealIds = new Set(dealsWithRelations.rows.map((d) => d.id));
            const missingDealIds = Array.from(dealIdsWithManyToMany).filter(id => !existingDealIds.has(id));
            if (missingDealIds.length > 0) {
                // Verificar que estos deals no tengan contactId ni companyId directos
                // Si los tienen, ya deberían estar en los resultados anteriores
                // Solo incluir deals que tienen relaciones muchos-a-muchos pero NO relaciones directas
                const additionalWhereConditions = [
                    {
                        id: { [sequelize_1.Op.in]: missingDealIds },
                        contactId: null,
                        companyId: null,
                    },
                ];
                if (search) {
                    additionalWhereConditions.push({ name: { [sequelize_1.Op.iLike]: `%${search}%` } });
                }
                if (stage) {
                    additionalWhereConditions.push({ stage: stage });
                }
                if (ownerId) {
                    additionalWhereConditions.push({ ownerId: ownerId });
                }
                if (pipelineId) {
                    additionalWhereConditions.push({ pipelineId: pipelineId });
                }
                const additionalWhere = { [sequelize_1.Op.and]: additionalWhereConditions };
                const additionalDeals = await Deal_1.Deal.findAll({
                    where: additionalWhere,
                    include: [
                        { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                        { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
                        { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'] },
                    ],
                    order: [['createdAt', 'DESC']],
                });
                dealsWithRelations.rows.push(...additionalDeals);
                dealsWithRelations.count += additionalDeals.length;
            }
        }
        const transformedDeals = dealsWithRelations.rows.map(deal => transformDeal(deal));
        res.json({
            deals: transformedDeals,
            total: dealsWithRelations.count,
            page: Number(page),
            totalPages: Math.ceil(dealsWithRelations.count / Number(limit)),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener un deal por ID
router.get('/:id', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
            ],
        });
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        res.json(transformDeal(deal));
    }
    catch (error) {
        console.error('Error fetching deal:', error);
        // Si el error es porque la tabla deal_contacts no existe, intentar sin la relación Contacts
        if (error.message && (error.message.includes('deal_contacts') || error.message.includes('does not exist'))) {
            try {
                const deal = await Deal_1.Deal.findByPk(req.params.id, {
                    include: [
                        { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                        { model: Contact_1.Contact, as: 'Contact', required: false },
                        { model: Company_1.Company, as: 'Company', required: false },
                        { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
                    ],
                });
                if (!deal) {
                    return res.status(404).json({ error: 'Deal no encontrado' });
                }
                res.json(transformDeal(deal));
            }
            catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
                res.status(500).json({ error: fallbackError.message });
            }
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
// Crear deal
router.post('/', async (req, res) => {
    try {
        const dealData = {
            ...req.body,
            ownerId: req.body.ownerId || req.userId,
        };
        const deal = await Deal_1.Deal.create(dealData);
        const newDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        res.status(201).json(transformDeal(newDeal));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar deal
router.put('/:id', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        await deal.update(req.body);
        // Si se están actualizando los contactos relacionados
        if (req.body.contactIds && Array.isArray(req.body.contactIds)) {
            const dealInstance = await Deal_1.Deal.findByPk(deal.id);
            if (dealInstance) {
                await dealInstance.setContacts(req.body.contactIds);
            }
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar deal
router.delete('/:id', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        await deal.destroy();
        res.json({ message: 'Deal eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Agregar contactos a un deal
router.post('/:id/contacts', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const { contactIds } = req.body;
        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de contactIds' });
        }
        // Usar la relación muchos a muchos
        const currentContacts = await deal.getContacts();
        const currentContactIds = currentContacts.map((c) => c.id);
        // Agregar solo los contactos que no están ya asociados
        const newContactIds = contactIds.filter((id) => !currentContactIds.includes(id));
        if (newContactIds.length > 0) {
            await deal.addContacts(newContactIds);
        }
        // Obtener el deal actualizado
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error adding contacts to deal:', error);
        res.status(500).json({ error: error.message || 'Error al agregar contactos al negocio' });
    }
});
// Eliminar contactos de un deal
router.delete('/:id/contacts/:contactId', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const contactId = parseInt(req.params.contactId);
        // Intentar usar la relación muchos a muchos
        try {
            await deal.removeContact(contactId);
        }
        catch (relationError) {
            // Si falla, eliminar directamente de la tabla de asociación
            if (relationError.message && (relationError.message.includes('deal_contacts') || relationError.message.includes('does not exist'))) {
                await DealContact_1.DealContact.destroy({
                    where: {
                        dealId: deal.id,
                        contactId: contactId
                    }
                });
            }
            else {
                throw relationError;
            }
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error removing contact from deal:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar el contacto del negocio' });
    }
});
// Agregar empresas a un deal
router.post('/:id/companies', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const { companyIds } = req.body;
        if (!Array.isArray(companyIds) || companyIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de companyIds' });
        }
        const currentCompanies = await deal.getCompanies();
        const currentCompanyIds = currentCompanies.map((c) => c.id);
        const newCompanyIds = companyIds.filter((id) => !currentCompanyIds.includes(id));
        if (newCompanyIds.length > 0) {
            await deal.addCompanies(newCompanyIds);
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
            ],
        });
        res.status(200).json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error adding companies to deal:', error);
        res.status(500).json({ error: error.message || 'Error al agregar empresas al negocio' });
    }
});
// Eliminar empresa de un deal
router.delete('/:id/companies/:companyId', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const companyIdToRemove = parseInt(req.params.companyId);
        try {
            await deal.removeCompany(companyIdToRemove);
        }
        catch (sequelizeError) {
            console.warn(`⚠️  Sequelize removeCompany failed, attempting direct deletion from DealCompany: ${sequelizeError.message}`);
            await DealCompany_1.DealCompany.destroy({
                where: {
                    dealId: deal.id,
                    companyId: companyIdToRemove,
                },
            });
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error removing company from deal:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar la empresa del negocio' });
    }
});
// Agregar negocios relacionados a un deal
router.post('/:id/related-deals', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const { dealIds } = req.body;
        if (!Array.isArray(dealIds) || dealIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de dealIds' });
        }
        // Evitar relacionar el deal consigo mismo
        const validDealIds = dealIds.filter((id) => id !== deal.id);
        if (validDealIds.length === 0) {
            return res.status(400).json({ error: 'No se puede relacionar un negocio consigo mismo' });
        }
        const currentRelatedDeals = await deal.getRelatedDeals();
        const currentRelatedDealIds = currentRelatedDeals.map((d) => d.id);
        const newDealIds = validDealIds.filter((id) => !currentRelatedDealIds.includes(id));
        if (newDealIds.length > 0) {
            await deal.addRelatedDeals(newDealIds);
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'website'], required: false },
                { model: Deal_1.Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'closeDate', 'stage'], required: false },
            ],
        });
        res.status(200).json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error adding related deals to deal:', error);
        res.status(500).json({ error: error.message || 'Error al agregar negocios relacionados al negocio' });
    }
});
// Eliminar negocio relacionado de un deal
router.delete('/:id/related-deals/:relatedDealId', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const relatedDealIdToRemove = parseInt(req.params.relatedDealId);
        try {
            await deal.removeRelatedDeal(relatedDealIdToRemove);
        }
        catch (sequelizeError) {
            console.warn(`⚠️  Sequelize removeRelatedDeal failed, attempting direct deletion from DealDeal: ${sequelizeError.message}`);
            await DealDeal_1.DealDeal.destroy({
                where: {
                    dealId: deal.id,
                    relatedDealId: relatedDealIdToRemove,
                },
            });
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'website'], required: false },
                { model: Deal_1.Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'closeDate', 'stage'], required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error removing related deal from deal:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar el negocio relacionado del negocio' });
    }
});
// Obtener deals por pipeline/stage
router.get('/pipeline/:pipelineId', async (req, res) => {
    try {
        const deals = await Deal_1.Deal.findAll({
            where: { pipelineId: req.params.pipelineId },
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        const transformedDeals = deals.map(deal => transformDeal(deal));
        res.json(transformedDeals);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
