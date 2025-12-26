"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todas las suscripciones
router.get('/', async (req, res) => {
    try {
        const { contactId, companyId, status } = req.query;
        const where = {};
        if (contactId)
            where.contactId = contactId;
        if (companyId)
            where.companyId = companyId;
        if (status)
            where.status = status;
        const subscriptions = await Subscription_1.Subscription.findAll({
            where,
            include: [
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json({ subscriptions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear suscripción
router.post('/', async (req, res) => {
    try {
        const subscription = await Subscription_1.Subscription.create({
            ...req.body,
            createdById: req.userId,
        });
        const newSubscription = await Subscription_1.Subscription.findByPk(subscription.id, {
            include: [
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        res.status(201).json(newSubscription);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar suscripción
router.put('/:id', async (req, res) => {
    try {
        const subscription = await Subscription_1.Subscription.findByPk(req.params.id);
        if (!subscription) {
            return res.status(404).json({ error: 'Suscripción no encontrada' });
        }
        await subscription.update(req.body);
        const updatedSubscription = await Subscription_1.Subscription.findByPk(subscription.id, {
            include: [
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        res.json(updatedSubscription);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar suscripción
router.delete('/:id', async (req, res) => {
    try {
        const subscription = await Subscription_1.Subscription.findByPk(req.params.id);
        if (!subscription) {
            return res.status(404).json({ error: 'Suscripción no encontrada' });
        }
        await subscription.destroy();
        res.json({ message: 'Suscripción eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
