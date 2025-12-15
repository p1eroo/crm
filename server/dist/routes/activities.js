"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Activity_1 = require("../models/Activity");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todas las actividades
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, type, contactId, companyId, dealId, userId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (type) {
            where.type = type;
        }
        if (contactId) {
            where.contactId = contactId;
        }
        if (companyId) {
            where.companyId = companyId;
        }
        if (dealId) {
            where.dealId = dealId;
        }
        if (userId) {
            where.userId = userId;
        }
        const activities = await Activity_1.Activity.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false },
                { model: Deal_1.Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
            ],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']],
        });
        res.json({
            activities: activities.rows,
            total: activities.count,
            page: Number(page),
            totalPages: Math.ceil(activities.count / Number(limit)),
        });
    }
    catch (error) {
        console.error('❌ Error al obtener actividades:', error);
        console.error('Stack:', error.stack);
        // Si el error es por columna faltante o problema de schema, devolver array vacío
        if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
            console.warn('⚠️  Error de schema detectado, devolviendo array vacío');
            return res.json({
                activities: [],
                total: 0,
                page: Number(req.query.page || 1),
                totalPages: 0,
            });
        }
        res.status(500).json({ error: error.message });
    }
});
// Crear actividad
router.post('/', async (req, res) => {
    try {
        const activityData = {
            ...req.body,
            userId: req.userId,
        };
        const activity = await Activity_1.Activity.create(activityData);
        const newActivity = await Activity_1.Activity.findByPk(activity.id, {
            include: [
                { model: User_1.User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        res.status(201).json(newActivity);
    }
    catch (error) {
        console.error('❌ Error al crear actividad:', error);
        console.error('Stack:', error.stack);
        // Si el error es por columna faltante, dar un mensaje más claro
        if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
            console.error('⚠️  Error de schema detectado. Ejecuta: npm run create-activity-columns');
            return res.status(500).json({
                error: 'Error de configuración de base de datos. Por favor, contacta al administrador.',
                details: error.message
            });
        }
        res.status(500).json({ error: error.message });
    }
});
// Obtener actividad por ID
router.get('/:id', async (req, res) => {
    try {
        const activity = await Activity_1.Activity.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        if (!activity) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar actividad
router.put('/:id', async (req, res) => {
    try {
        const activity = await Activity_1.Activity.findByPk(req.params.id);
        if (!activity) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }
        // Verificar que el usuario sea el propietario o admin
        if (activity.userId !== req.userId) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar esta actividad' });
        }
        await activity.update(req.body);
        const updatedActivity = await Activity_1.Activity.findByPk(activity.id, {
            include: [
                { model: User_1.User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Deal_1.Deal, as: 'Deal' },
            ],
        });
        res.json(updatedActivity);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar actividad
router.delete('/:id', async (req, res) => {
    try {
        const activity = await Activity_1.Activity.findByPk(req.params.id);
        if (!activity) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }
        // Verificar que el usuario sea el propietario o admin
        if (activity.userId !== req.userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });
        }
        await activity.destroy();
        res.status(200).json({ message: 'Actividad eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
