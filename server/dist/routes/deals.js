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
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        res.json(transformDeal(deal));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
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
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
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
