"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Company_1 = require("../models/Company");
const Contact_1 = require("../models/Contact");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todas las empresas
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, search, lifecycleStage, ownerId, industry } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { domain: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        if (lifecycleStage) {
            where.lifecycleStage = lifecycleStage;
        }
        if (ownerId) {
            where.ownerId = ownerId;
        }
        if (industry) {
            where.industry = industry;
        }
        const companies = await Company_1.Company.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            ],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']],
        });
        res.json({
            companies: companies.rows,
            total: companies.count,
            page: Number(page),
            totalPages: Math.ceil(companies.count / Number(limit)),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener una empresa por ID
router.get('/:id', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }, // Contactos asociados muchos-a-muchos
            ],
        });
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        res.json(company);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Crear empresa
router.post('/', async (req, res) => {
    try {
        const companyData = {
            ...req.body,
            // Asignar automáticamente el usuario actual como propietario del registro
            ownerId: req.body.ownerId || req.userId || null,
        };
        const company = await Company_1.Company.create(companyData);
        const newCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.status(201).json(newCompany);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar empresa
router.put('/:id', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        await company.update(req.body);
        const updatedCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.json(updatedCompany);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar empresa
router.delete('/:id', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        await company.destroy();
        res.json({ message: 'Empresa eliminada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Agregar contactos asociados a una empresa
router.post('/:id/contacts', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id, {
            include: [
                { model: Contact_1.Contact, as: 'Contacts' },
            ],
        });
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        const { contactIds } = req.body;
        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de contactIds' });
        }
        // Verificar que todos los contactos existan
        const contacts = await Contact_1.Contact.findAll({
            where: { id: { [sequelize_1.Op.in]: contactIds } },
        });
        if (contacts.length !== contactIds.length) {
            return res.status(400).json({ error: 'Uno o más contactos no existen' });
        }
        // Obtener IDs de contactos ya asociados
        const existingContactIds = (company.Contacts || []).map((c) => c.id);
        // Filtrar solo los contactos nuevos
        const newContactIds = contactIds.filter((id) => !existingContactIds.includes(id));
        if (newContactIds.length > 0) {
            // Usar el método add de Sequelize para relaciones muchos-a-muchos
            await company.addContacts(newContactIds);
        }
        // Obtener la empresa actualizada con todos sus contactos
        const updatedCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
            ],
        });
        res.json(updatedCompany);
    }
    catch (error) {
        console.error('Error adding contacts to company:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al asociar los contactos' });
    }
});
// Eliminar asociación de contacto con empresa
router.delete('/:id/contacts/:contactId', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        const contactId = parseInt(req.params.contactId);
        // Usar el método remove de Sequelize para relaciones muchos-a-muchos
        await company.removeContacts([contactId]);
        // Obtener la empresa actualizada
        const updatedCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
            ],
        });
        res.json(updatedCompany);
    }
    catch (error) {
        console.error('Error removing contact association:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
    }
});
exports.default = router;
