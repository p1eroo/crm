"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Payment_1 = require("../models/Payment");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Subscription_1 = require("../models/Subscription");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todos los pagos
router.get('/', async (req, res) => {
    try {
        const { contactId, companyId, subscriptionId, status } = req.query;
        const where = {};
        if (contactId)
            where.contactId = contactId;
        if (companyId)
            where.companyId = companyId;
        if (subscriptionId)
            where.subscriptionId = subscriptionId;
        if (status)
            where.status = status;
        const payments = await Payment_1.Payment.findAll({
            where,
            include: [
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Subscription_1.Subscription, as: 'Subscription' },
            ],
            order: [['paymentDate', 'DESC']],
        });
        res.json({ payments });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear pago
router.post('/', async (req, res) => {
    try {
        const payment = await Payment_1.Payment.create({
            ...req.body,
            createdById: req.userId,
        });
        const newPayment = await Payment_1.Payment.findByPk(payment.id, {
            include: [
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Subscription_1.Subscription, as: 'Subscription' },
            ],
        });
        res.status(201).json(newPayment);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar pago
router.put('/:id', async (req, res) => {
    try {
        const payment = await Payment_1.Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        await payment.update(req.body);
        const updatedPayment = await Payment_1.Payment.findByPk(payment.id, {
            include: [
                { model: User_1.User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
                { model: Subscription_1.Subscription, as: 'Subscription' },
            ],
        });
        res.json(updatedPayment);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar pago
router.delete('/:id', async (req, res) => {
    try {
        const payment = await Payment_1.Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        await payment.destroy();
        res.json({ message: 'Pago eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
