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
        const where = {};
        if (search) {
            where.name = { [sequelize_1.Op.iLike]: `%${search}%` };
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
        if (contactId) {
            where.contactId = contactId;
        }
        if (companyId) {
            where.companyId = companyId;
        }
        const deals = await Deal_1.Deal.findAndCountAll({
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
        const transformedDeals = deals.rows.map(deal => transformDeal(deal));
        res.json({
            deals: transformedDeals,
            total: deals.count,
            page: Number(page),
            totalPages: Math.ceil(deals.count / Number(limit)),
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
