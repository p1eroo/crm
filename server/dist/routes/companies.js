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
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función helper para sanitizar valores null/undefined
const sanitizeValue = (value) => {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') {
        return null;
    }
    return value;
};
// Función para transformar empresa para lista (sin datos sensibles)
const transformCompanyForList = (company) => {
    const companyData = company.toJSON ? company.toJSON() : company;
    return {
        id: companyData.id,
        name: companyData.name || '',
        domain: sanitizeValue(companyData.domain),
        companyname: sanitizeValue(companyData.companyname),
        phone: sanitizeValue(companyData.phone), // Solo teléfono básico, no datos sensibles
        // NO incluir: email, ruc, address (datos sensibles)
        leadSource: sanitizeValue(companyData.leadSource),
        city: sanitizeValue(companyData.city),
        state: sanitizeValue(companyData.state),
        country: sanitizeValue(companyData.country),
        lifecycleStage: companyData.lifecycleStage || 'lead',
        estimatedRevenue: sanitizeValue(companyData.estimatedRevenue),
        isRecoveredClient: companyData.isRecoveredClient || false,
        ownerId: sanitizeValue(companyData.ownerId),
        createdAt: companyData.createdAt,
        updatedAt: companyData.updatedAt,
        Owner: companyData.Owner ? {
            id: companyData.Owner.id,
            firstName: companyData.Owner.firstName || '',
            lastName: companyData.Owner.lastName || '',
            // NO incluir email del propietario en la lista
        } : null
    };
};
// Obtener todas las empresas
router.get('/', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const { page = 1, limit: limitParam = 50, search, lifecycleStage, ownerId, companyname, 
        // Nuevos parámetros de filtro
        stages, // Array de etapas: ["lead", "activo"]
        countries, // Array de países: ["Perú", "Chile"]
        owners, // Array: ["me", "unassigned", "1", "2"]
        sortBy = 'newest', // newest, oldest, name, nameDesc
        // Filtros por columna
        filterNombre, filterPropietario, filterTelefono, filterCorreo, filterOrigenLead, filterEtapa, filterCR, 
        // Filtros avanzados (JSON string)
        filterRules, } = req.query;
        // Limitar el tamaño máximo de página para evitar sobrecarga
        const maxLimit = 100;
        const requestedLimit = Number(limitParam);
        const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
        const pageNum = Number(page) < 1 ? 1 : Number(page);
        const offset = (pageNum - 1) * limit;
        const where = {};
        // Búsqueda general
        if (search) {
            const searchStr = typeof search === 'string' ? search : String(search);
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { domain: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { companyname: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
            ];
        }
        // Filtro por etapas (lifecycleStage) - soporta múltiples valores
        if (lifecycleStage) {
            where.lifecycleStage = lifecycleStage;
        }
        else if (stages) {
            // Si viene como array en query string: ?stages=lead&stages=activo
            const stagesArray = Array.isArray(stages) ? stages : [stages];
            if (stagesArray.length > 0) {
                where.lifecycleStage = { [sequelize_1.Op.in]: stagesArray };
            }
        }
        // Filtro por países
        if (countries) {
            const countriesArray = Array.isArray(countries) ? countries : [countries];
            if (countriesArray.length > 0) {
                where.country = { [sequelize_1.Op.in]: countriesArray };
            }
        }
        // Filtro por propietarios
        if (owners) {
            const ownersArray = Array.isArray(owners) ? owners : [owners];
            const ownerIds = [];
            const hasUnassigned = ownersArray.includes('unassigned');
            const hasMe = ownersArray.includes('me');
            ownersArray.forEach((owner) => {
                const ownerStr = String(owner);
                if (ownerStr === 'unassigned') {
                    // Se manejará después
                }
                else if (ownerStr === 'me') {
                    if (req.userId)
                        ownerIds.push(req.userId);
                }
                else if (!isNaN(Number(ownerStr))) {
                    ownerIds.push(Number(ownerStr));
                }
            });
            if (hasUnassigned && ownerIds.length > 0) {
                where.ownerId = { [sequelize_1.Op.or]: [{ [sequelize_1.Op.in]: ownerIds }, { [sequelize_1.Op.is]: null }] };
            }
            else if (hasUnassigned) {
                where.ownerId = { [sequelize_1.Op.is]: null };
            }
            else if (hasMe && ownerIds.length > 1) {
                where.ownerId = { [sequelize_1.Op.in]: ownerIds };
            }
            else if (hasMe) {
                where.ownerId = req.userId || null;
            }
            else if (ownerIds.length > 0) {
                where.ownerId = { [sequelize_1.Op.in]: ownerIds };
            }
        }
        else if (ownerId) {
            // Compatibilidad con el filtro antiguo
            where.ownerId = ownerId === 'me' ? req.userId : ownerId;
        }
        if (companyname) {
            where.companyname = companyname;
        }
        // Filtros por columna
        if (filterNombre) {
            where.name = { [sequelize_1.Op.iLike]: `%${filterNombre}%` };
        }
        if (filterTelefono) {
            where.phone = { [sequelize_1.Op.iLike]: `%${filterTelefono}%` };
        }
        if (filterOrigenLead) {
            where.leadSource = { [sequelize_1.Op.iLike]: `%${filterOrigenLead}%` };
        }
        if (filterEtapa) {
            // Buscar por el valor exacto del enum
            where.lifecycleStage = { [sequelize_1.Op.iLike]: `%${filterEtapa}%` };
        }
        if (filterCR !== undefined) {
            const filterCRValue = String(filterCR).toLowerCase().trim();
            const buscaSi = ['sí', 'si', 'yes', 's', '1', 'x', '✓', 'true'].includes(filterCRValue);
            const buscaNo = ['no', 'not', '0', 'false', 'n'].includes(filterCRValue);
            if (buscaSi) {
                where.isRecoveredClient = true;
            }
            else if (buscaNo) {
                where.isRecoveredClient = false;
            }
        }
        // Filtros avanzados (reglas)
        let parsedFilterRules = [];
        if (filterRules) {
            try {
                parsedFilterRules = typeof filterRules === 'string'
                    ? JSON.parse(filterRules)
                    : filterRules;
            }
            catch (e) {
                console.warn('Error parsing filterRules:', e);
            }
        }
        // Aplicar filtros avanzados
        parsedFilterRules.forEach((rule) => {
            if (!rule.value || !rule.column || !rule.operator)
                return;
            const ruleValue = String(rule.value);
            switch (rule.column) {
                case 'name':
                    if (rule.operator === 'contains') {
                        where.name = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    else if (rule.operator === 'equals') {
                        where.name = { [sequelize_1.Op.iLike]: rule.value };
                    }
                    else if (rule.operator === 'startsWith') {
                        where.name = { [sequelize_1.Op.iLike]: `${rule.value}%` };
                    }
                    else if (rule.operator === 'endsWith') {
                        where.name = { [sequelize_1.Op.iLike]: `%${rule.value}` };
                    }
                    else if (rule.operator === 'notEquals') {
                        where.name = { [sequelize_1.Op.notILike]: rule.value };
                    }
                    break;
                case 'companyname':
                    if (rule.operator === 'contains') {
                        where.companyname = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    else if (rule.operator === 'equals') {
                        where.companyname = { [sequelize_1.Op.iLike]: rule.value };
                    }
                    break;
                case 'phone':
                    if (rule.operator === 'contains') {
                        where.phone = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    break;
                case 'leadSource':
                    if (rule.operator === 'contains') {
                        where.leadSource = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    break;
                case 'country':
                    if (rule.operator === 'contains') {
                        where.country = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    break;
                case 'lifecycleStage':
                    if (rule.operator === 'equals') {
                        where.lifecycleStage = rule.value;
                    }
                    break;
            }
        });
        // Ordenamiento
        let order = [['createdAt', 'DESC']];
        switch (sortBy) {
            case 'newest':
                order = [['createdAt', 'DESC']];
                break;
            case 'oldest':
                order = [['createdAt', 'ASC']];
                break;
            case 'name':
                order = [['name', 'ASC']];
                break;
            case 'nameDesc':
                order = [['name', 'DESC']];
                break;
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
                        attributes: ['id', 'firstName', 'lastName'], // NO incluir email del Owner
                        required: false
                    },
                ],
                limit,
                offset,
                order,
                distinct: true, // Importante para contar correctamente con includes
            });
        }
        catch (includeError) {
            // Si falla por problemas con la relación Owner, intentar sin el include
            console.warn('⚠️ Error con relación Owner, intentando sin include:', includeError.message);
            companies = await Company_1.Company.findAndCountAll({
                where,
                limit,
                offset,
                order,
            });
            // Agregar Owner manualmente solo para los que tienen ownerId válido
            const companiesWithOwner = await Promise.all(companies.rows.map(async (company) => {
                const companyData = company.toJSON();
                if (companyData.ownerId) {
                    try {
                        const owner = await User_1.User.findByPk(companyData.ownerId, {
                            attributes: ['id', 'firstName', 'lastName'], // NO incluir email
                        });
                        companyData.Owner = owner ? owner.toJSON() : null;
                    }
                    catch (ownerError) {
                        console.warn(`⚠️ No se pudo obtener Owner para company ${companyData.id}:`, ownerError);
                        companyData.Owner = null;
                    }
                }
                else {
                    companyData.Owner = null;
                }
                return transformCompanyForList(companyData);
            }));
            return res.json({
                companies: companiesWithOwner,
                total: companies.count,
                page: pageNum,
                limit,
                totalPages: Math.ceil(companies.count / limit),
            });
        }
        // Transformar empresas para filtrar datos sensibles
        const transformedCompanies = companies.rows.map(transformCompanyForList);
        res.json({
            companies: transformedCompanies,
            total: companies.count,
            page: pageNum,
            limit,
            totalPages: Math.ceil(companies.count / limit),
        });
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        // No exponer detalles del error en producción
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : 'Error al obtener empresas';
        res.status(500).json({
            error: errorMessage
        });
    }
});
// Obtener una empresa por ID
router.get('/:id', rateLimiter_1.apiLimiter, async (req, res) => {
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
router.post('/', rateLimiter_1.writeLimiter, async (req, res) => {
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
router.put('/:id', rateLimiter_1.writeLimiter, async (req, res) => {
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
router.delete('/:id', rateLimiter_1.deleteLimiter, async (req, res) => {
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
router.post('/:id/contacts', rateLimiter_1.writeLimiter, async (req, res) => {
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
router.delete('/:id/contacts/:contactId', rateLimiter_1.deleteLimiter, async (req, res) => {
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
