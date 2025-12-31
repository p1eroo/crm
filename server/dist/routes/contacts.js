"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Contact_1 = require("../models/Contact");
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener todos los contactos
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, search, lifecycleStage, ownerId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            const searchStr = typeof search === 'string' ? search : String(search);
            where[sequelize_1.Op.or] = [
                { firstName: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { dni: { [sequelize_1.Op.eq]: searchStr.trim() } }, // Búsqueda exacta por DNI
                { cee: { [sequelize_1.Op.eq]: searchStr.trim().toUpperCase() } }, // Búsqueda exacta por CEE
            ];
        }
        if (lifecycleStage) {
            where.lifecycleStage = lifecycleStage;
        }
        if (ownerId) {
            where.ownerId = ownerId;
        }
        const contacts = await Contact_1.Contact.findAndCountAll({
            where,
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'], required: false },
            ],
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']],
        });
        res.json({
            contacts: contacts.rows,
            total: contacts.count,
            page: Number(page),
            totalPages: Math.ceil(contacts.count / Number(limit)),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener un contacto por ID
router.get('/:id', async (req, res) => {
    try {
        // Intentar obtener contact con todas las relaciones
        let contact;
        try {
            contact = await Contact_1.Contact.findByPk(req.params.id, {
                include: [
                    { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                    { model: Company_1.Company, as: 'Company', required: false }, // Empresa principal (compatibilidad)
                    { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname'], required: false }, // Todas las empresas asociadas
                ],
            });
        }
        catch (includeError) {
            // Si falla por problemas con las relaciones, intentar sin includes
            console.warn('⚠️ Error con relaciones en contact, intentando sin includes:', includeError.message);
            contact = await Contact_1.Contact.findByPk(req.params.id);
            if (!contact) {
                return res.status(404).json({ error: 'Contacto no encontrado' });
            }
            // Agregar relaciones manualmente solo para los que tienen IDs válidos
            const contactData = contact.toJSON();
            // Agregar Owner si existe ownerId
            if (contactData.ownerId) {
                try {
                    const owner = await User_1.User.findByPk(contactData.ownerId, {
                        attributes: ['id', 'firstName', 'lastName', 'email'],
                    });
                    contactData.Owner = owner || null;
                }
                catch (ownerError) {
                    console.warn(`⚠️ No se pudo obtener Owner para contact ${contactData.id}:`, ownerError);
                    contactData.Owner = null;
                }
            }
            else {
                contactData.Owner = null;
            }
            // Agregar Company principal si existe companyId
            if (contactData.companyId) {
                try {
                    const company = await Company_1.Company.findByPk(contactData.companyId, {
                        attributes: ['id', 'name', 'domain', 'phone', 'companyname'],
                    });
                    contactData.Company = company || null;
                }
                catch (companyError) {
                    console.warn(`⚠️ No se pudo obtener Company para contact ${contactData.id}:`, companyError);
                    contactData.Company = null;
                }
            }
            else {
                contactData.Company = null;
            }
            // Agregar Companies asociadas (muchos-a-muchos)
            try {
                const companies = await contact.getCompanies();
                contactData.Companies = companies || [];
            }
            catch (companiesError) {
                console.warn(`⚠️ No se pudieron obtener Companies para contact ${contactData.id}:`, companiesError);
                contactData.Companies = [];
            }
            return res.json(contactData);
        }
        if (!contact) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }
        res.json(contact);
    }
    catch (error) {
        console.error('Error fetching contact:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            original: error.original,
        });
        res.status(500).json({
            error: error.message || 'Error al obtener contacto',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
// Crear contacto
router.post('/', async (req, res) => {
    try {
        // Validar que companyId esté presente
        if (!req.body.companyId) {
            return res.status(400).json({ error: 'La empresa principal es requerida' });
        }
        const contactData = {
            ...req.body,
            // Asignar automáticamente el usuario actual como propietario del contacto
            ownerId: req.body.ownerId || req.userId || null,
        };
        // Validar que no exista un contacto con el mismo email (case-insensitive)
        if (contactData.email) {
            const existingContactByEmail = await Contact_1.Contact.findOne({
                where: {
                    email: {
                        [sequelize_1.Op.iLike]: contactData.email.trim(),
                    },
                },
            });
            if (existingContactByEmail) {
                return res.status(400).json({
                    error: 'Ya existe un contacto con este email',
                    duplicateField: 'email',
                    existingContactId: existingContactByEmail.id,
                });
            }
        }
        // Validar que no exista un contacto con el mismo DNI (si se proporciona)
        if (contactData.dni && contactData.dni.trim() !== '') {
            const existingContactByDni = await Contact_1.Contact.findOne({
                where: {
                    dni: contactData.dni.trim(),
                },
            });
            if (existingContactByDni) {
                return res.status(400).json({
                    error: 'Ya existe un contacto con este DNI',
                    duplicateField: 'dni',
                    existingContactId: existingContactByDni.id,
                });
            }
        }
        // Validar que no exista un contacto con el mismo CEE (si se proporciona)
        if (contactData.cee && contactData.cee.trim() !== '') {
            const existingContactByCee = await Contact_1.Contact.findOne({
                where: {
                    cee: contactData.cee.trim().toUpperCase(),
                },
            });
            if (existingContactByCee) {
                return res.status(400).json({
                    error: 'Ya existe un contacto con este CEE',
                    duplicateField: 'cee',
                    existingContactId: existingContactByCee.id,
                });
            }
        }
        const contact = await Contact_1.Contact.create(contactData);
        const newContact = await Contact_1.Contact.findByPk(contact.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        res.status(201).json(newContact);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar contacto
router.put('/:id', async (req, res) => {
    try {
        // Validar que companyId esté presente si se está enviando en el body
        if (req.body.hasOwnProperty('companyId') && !req.body.companyId) {
            return res.status(400).json({ error: 'La empresa principal es requerida' });
        }
        const contact = await Contact_1.Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }
        const contactData = {
            ...req.body,
            ownerId: req.body.ownerId || req.userId || null,
        };
        // Validar que no exista otro contacto con el mismo email (excluyendo el actual)
        if (contactData.email && contactData.email.trim() !== contact.email) {
            const existingContactByEmail = await Contact_1.Contact.findOne({
                where: {
                    email: {
                        [sequelize_1.Op.iLike]: contactData.email.trim(),
                    },
                    id: {
                        [sequelize_1.Op.ne]: contact.id, // Excluir el contacto actual
                    },
                },
            });
            if (existingContactByEmail) {
                return res.status(400).json({
                    error: 'Ya existe otro contacto con este email',
                    duplicateField: 'email',
                    existingContactId: existingContactByEmail.id,
                });
            }
        }
        // Validar que no exista otro contacto con el mismo DNI (excluyendo el actual)
        if (contactData.dni && contactData.dni.trim() !== '' && contactData.dni.trim() !== (contact.dni || '')) {
            const existingContactByDni = await Contact_1.Contact.findOne({
                where: {
                    dni: contactData.dni.trim(),
                    id: {
                        [sequelize_1.Op.ne]: contact.id,
                    },
                },
            });
            if (existingContactByDni) {
                return res.status(400).json({
                    error: 'Ya existe otro contacto con este DNI',
                    duplicateField: 'dni',
                    existingContactId: existingContactByDni.id,
                });
            }
        }
        // Validar que no exista otro contacto con el mismo CEE (excluyendo el actual)
        if (contactData.cee && contactData.cee.trim() !== '' && contactData.cee.trim().toUpperCase() !== (contact.cee || '')) {
            const existingContactByCee = await Contact_1.Contact.findOne({
                where: {
                    cee: contactData.cee.trim().toUpperCase(),
                    id: {
                        [sequelize_1.Op.ne]: contact.id,
                    },
                },
            });
            if (existingContactByCee) {
                return res.status(400).json({
                    error: 'Ya existe otro contacto con este CEE',
                    duplicateField: 'cee',
                    existingContactId: existingContactByCee.id,
                });
            }
        }
        await contact.update(contactData);
        const updatedContact = await Contact_1.Contact.findByPk(contact.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        res.json(updatedContact);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar contacto
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact_1.Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }
        await contact.destroy();
        res.json({ message: 'Contacto eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Agregar empresas asociadas a un contacto
router.post('/:id/companies', async (req, res) => {
    try {
        const contact = await Contact_1.Contact.findByPk(req.params.id, {
            include: [
                { model: Company_1.Company, as: 'Companies' },
            ],
        });
        if (!contact) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }
        const { companyIds } = req.body;
        if (!Array.isArray(companyIds) || companyIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de companyIds' });
        }
        // Verificar que todas las empresas existan
        const companies = await Company_1.Company.findAll({
            where: { id: { [sequelize_1.Op.in]: companyIds } },
        });
        if (companies.length !== companyIds.length) {
            return res.status(400).json({ error: 'Una o más empresas no existen' });
        }
        // Obtener IDs de empresas ya asociadas
        const existingCompanyIds = (contact.Companies || []).map((c) => c.id);
        // Filtrar solo las empresas nuevas
        const newCompanyIds = companyIds.filter((id) => !existingCompanyIds.includes(id));
        if (newCompanyIds.length > 0) {
            // Usar el método add de Sequelize para relaciones muchos-a-muchos
            await contact.addCompanies(newCompanyIds);
        }
        // Obtener el contacto actualizado con todas sus empresas
        const updatedContact = await Contact_1.Contact.findByPk(contact.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Company_1.Company, as: 'Company' },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname'] },
            ],
        });
        res.json(updatedContact);
    }
    catch (error) {
        console.error('Error adding companies to contact:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al asociar las empresas' });
    }
});
// Eliminar asociación de empresa con contacto
router.delete('/:id/companies/:companyId', async (req, res) => {
    try {
        const contact = await Contact_1.Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }
        const companyId = parseInt(req.params.companyId);
        // Usar el método remove de Sequelize para relaciones muchos-a-muchos
        await contact.removeCompanies([companyId]);
        // Obtener el contacto actualizado
        const updatedContact = await Contact_1.Contact.findByPk(contact.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Company_1.Company, as: 'Company' },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname'] },
            ],
        });
        res.json(updatedContact);
    }
    catch (error) {
        console.error('Error removing company association:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
    }
});
exports.default = router;
