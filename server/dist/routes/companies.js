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
        const { page = 1, limit = 50, search, lifecycleStage, ownerId, companyname } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            const searchStr = typeof search === 'string' ? search : String(search);
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { domain: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { ruc: { [sequelize_1.Op.eq]: searchStr.trim() } }, // Búsqueda exacta por RUC
            ];
        }
        if (lifecycleStage) {
            where.lifecycleStage = lifecycleStage;
        }
        if (ownerId) {
            where.ownerId = ownerId;
        }
        if (companyname) {
            where.companyname = companyname;
        }
        // Intentar obtener companies con la relación Owner
        let companies;
        try {
            companies = await Company_1.Company.findAndCountAll({
                where,
                include: [
                    {
                        model: User_1.User,
                        as: 'Owner',
                        attributes: ['id', 'firstName', 'lastName', 'email'],
                        required: false
                    },
                ],
                limit: Number(limit),
                offset,
                order: [['createdAt', 'DESC']],
                distinct: true, // Importante para contar correctamente con includes
            });
        }
        catch (includeError) {
            // Si falla por problemas con la relación Owner, intentar sin el include
            console.warn('⚠️ Error con relación Owner, intentando sin include:', includeError.message);
            companies = await Company_1.Company.findAndCountAll({
                where,
                limit: Number(limit),
                offset,
                order: [['createdAt', 'DESC']],
            });
            // Agregar Owner manualmente solo para los que tienen ownerId válido
            const companiesWithOwner = await Promise.all(companies.rows.map(async (company) => {
                const companyData = company.toJSON();
                if (companyData.ownerId) {
                    try {
                        const owner = await User_1.User.findByPk(companyData.ownerId, {
                            attributes: ['id', 'firstName', 'lastName', 'email'],
                        });
                        companyData.Owner = owner || null;
                    }
                    catch (ownerError) {
                        console.warn(`⚠️ No se pudo obtener Owner para company ${companyData.id}:`, ownerError);
                        companyData.Owner = null;
                    }
                }
                else {
                    companyData.Owner = null;
                }
                return companyData;
            }));
            return res.json({
                companies: companiesWithOwner,
                total: companies.count,
                page: Number(page),
                totalPages: Math.ceil(companies.count / Number(limit)),
            });
        }
        res.json({
            companies: companies.rows,
            total: companies.count,
            page: Number(page),
            totalPages: Math.ceil(companies.count / Number(limit)),
        });
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            original: error.original,
        });
        res.status(500).json({
            error: error.message || 'Error al obtener empresas',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
        // Validar que no exista una empresa con el mismo nombre (case-insensitive)
        if (companyData.name) {
            const existingCompanyByName = await Company_1.Company.findOne({
                where: {
                    name: {
                        [sequelize_1.Op.iLike]: companyData.name.trim(), // Case-insensitive
                    },
                },
            });
            if (existingCompanyByName) {
                return res.status(400).json({
                    error: 'Ya existe una empresa con este nombre',
                    duplicateField: 'name',
                    existingCompanyId: existingCompanyByName.id,
                });
            }
        }
        // Validar que no exista una empresa con el mismo RUC (si se proporciona)
        if (companyData.ruc && companyData.ruc.trim() !== '') {
            const existingCompanyByRuc = await Company_1.Company.findOne({
                where: {
                    ruc: companyData.ruc.trim(),
                },
            });
            if (existingCompanyByRuc) {
                return res.status(400).json({
                    error: 'Ya existe una empresa con este RUC',
                    duplicateField: 'ruc',
                    existingCompanyId: existingCompanyByRuc.id,
                });
            }
        }
        const company = await Company_1.Company.create(companyData);
        const newCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.status(201).json(newCompany);
    }
    catch (error) {
        console.error('Error creating company:', error);
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
        // Preparar los datos para actualizar, manejando campos especiales
        const updateData = { ...req.body };
        // Si leadSource viene, asegurarse de que se mapee correctamente
        if (updateData.leadSource !== undefined) {
            updateData.leadSource = updateData.leadSource || null;
        }
        // Si estimatedRevenue viene como string vacío o null, convertirlo a null
        if (updateData.estimatedRevenue !== undefined) {
            if (updateData.estimatedRevenue === '' || updateData.estimatedRevenue === null) {
                updateData.estimatedRevenue = null;
            }
            else if (typeof updateData.estimatedRevenue === 'string') {
                const parsed = parseFloat(updateData.estimatedRevenue);
                updateData.estimatedRevenue = isNaN(parsed) ? null : parsed;
            }
        }
        // Si email viene como string vacío, convertirlo a null
        if (updateData.email !== undefined && updateData.email === '') {
            updateData.email = null;
        }
        await company.update(updateData);
        const updatedCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
        });
        res.json(updatedCompany);
    }
    catch (error) {
        console.error('Error updating company:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
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
