"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Búsqueda global
router.get('/global', rateLimiter_1.searchLimiter, async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return res.json({
                contacts: [],
                companies: [],
                deals: [],
                tasks: [],
            });
        }
        const searchTerm = q.trim();
        const searchLimit = Math.min(Number(limit) || 10, 20); // Máximo 20 resultados por tipo
        // Búsqueda en contactos
        const contacts = await Contact_1.Contact.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { firstName: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { lastName: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { email: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { phone: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                ],
            },
            include: [
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false },
            ],
            limit: searchLimit,
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'lifecycleStage'],
        });
        // Búsqueda en empresas
        const companies = await Company_1.Company.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { domain: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { companyname: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { phone: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                ],
            },
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'], required: false },
            ],
            limit: searchLimit,
            attributes: ['id', 'name', 'domain', 'companyname', 'phone', 'lifecycleStage'],
        });
        // Búsqueda en negocios
        const deals = await Deal_1.Deal.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                ],
            },
            include: [
                { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false },
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'], required: false },
            ],
            limit: searchLimit,
            attributes: ['id', 'name', 'amount', 'stage'],
        });
        // Búsqueda en tareas
        const tasks = await Task_1.Task.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { title: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                    { description: { [sequelize_1.Op.iLike]: `%${searchTerm}%` } },
                ],
            },
            include: [
                { model: User_1.User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName'], required: false },
            ],
            limit: searchLimit,
            attributes: ['id', 'title', 'description', 'status', 'priority', 'dueDate'],
        });
        res.json({
            contacts: contacts.map(c => ({
                id: c.id,
                type: 'contact',
                title: `${c.firstName} ${c.lastName}`,
                subtitle: c.email || c.phone || 'Sin información',
                company: c.Company?.name,
                stage: c.lifecycleStage,
                url: `/contacts/${c.id}`,
            })),
            companies: companies.map(c => ({
                id: c.id,
                type: 'company',
                title: c.name,
                subtitle: c.companyname || c.domain || 'Sin información',
                owner: c.Owner ? `${c.Owner.firstName} ${c.Owner.lastName}` : null,
                stage: c.lifecycleStage,
                url: `/companies/${c.id}`,
            })),
            deals: deals.map(d => ({
                id: d.id,
                type: 'deal',
                title: d.name,
                subtitle: d.Contact ? `${d.Contact.firstName} ${d.Contact.lastName}` : d.Company?.name || 'Sin información',
                amount: d.amount,
                stage: d.stage,
                url: `/deals/${d.id}`, // Navegar a la página de detalle del negocio
            })),
            tasks: tasks.map(t => ({
                id: t.id,
                type: 'task',
                title: t.title,
                subtitle: t.description || 'Sin descripción',
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                url: `/tasks`,
            })),
        });
    }
    catch (error) {
        console.error('Error en búsqueda global:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
