"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Campaign_1 = require("../models/Campaign");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todas las campañas
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, type, ownerId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status) {
            where.status = status;
        }
        if (type) {
            where.type = type;
        }
        if (ownerId) {
            where.ownerId = ownerId;
        }
        const campaigns = await Campaign_1.Campaign.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']],
        });
        res.json({
            campaigns: campaigns.rows,
            total: campaigns.count,
            page: Number(page),
            totalPages: Math.ceil(campaigns.count / Number(limit)),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener una campaña por ID
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign_1.Campaign.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaña no encontrada' });
        }
        res.json(campaign);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear campaña
router.post('/', async (req, res) => {
    try {
        const campaignData = {
            ...req.body,
            ownerId: req.body.ownerId || req.userId,
        };
        const campaign = await Campaign_1.Campaign.create(campaignData);
        const newCampaign = await Campaign_1.Campaign.findByPk(campaign.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.status(201).json(newCampaign);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar campaña
router.put('/:id', async (req, res) => {
    try {
        const campaign = await Campaign_1.Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaña no encontrada' });
        }
        await campaign.update(req.body);
        const updatedCampaign = await Campaign_1.Campaign.findByPk(campaign.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.json(updatedCampaign);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar campaña
router.delete('/:id', async (req, res) => {
    try {
        const campaign = await Campaign_1.Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaña no encontrada' });
        }
        await campaign.destroy();
        res.json({ message: 'Campaña eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
