"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Automation_1 = require("../models/Automation");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todas las automatizaciones
router.get('/', async (req, res) => {
    try {
        const { status, ownerId } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (ownerId) {
            where.ownerId = ownerId;
        }
        const automations = await Automation_1.Automation.findAll({
            where,
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(automations);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener una automatización por ID
router.get('/:id', async (req, res) => {
    try {
        const automation = await Automation_1.Automation.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        if (!automation) {
            return res.status(404).json({ error: 'Automatización no encontrada' });
        }
        res.json(automation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear automatización
router.post('/', async (req, res) => {
    try {
        const automationData = {
            ...req.body,
            ownerId: req.body.ownerId || req.userId,
        };
        const automation = await Automation_1.Automation.create(automationData);
        const newAutomation = await Automation_1.Automation.findByPk(automation.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.status(201).json(newAutomation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar automatización
router.put('/:id', async (req, res) => {
    try {
        const automation = await Automation_1.Automation.findByPk(req.params.id);
        if (!automation) {
            return res.status(404).json({ error: 'Automatización no encontrada' });
        }
        await automation.update(req.body);
        const updatedAutomation = await Automation_1.Automation.findByPk(automation.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.json(updatedAutomation);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar automatización
router.delete('/:id', async (req, res) => {
    try {
        const automation = await Automation_1.Automation.findByPk(req.params.id);
        if (!automation) {
            return res.status(404).json({ error: 'Automatización no encontrada' });
        }
        await automation.destroy();
        res.json({ message: 'Automatización eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
