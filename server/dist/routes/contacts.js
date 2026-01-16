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
const rolePermissions_1 = require("../utils/rolePermissions");
const systemLogger_1 = require("../utils/systemLogger");
const database_1 = require("../config/database");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función para limpiar contactos eliminando campos null y objetos relacionados null
const cleanContact = (contact) => {
    const contactData = contact.toJSON ? contact.toJSON() : contact;
    const cleaned = {
        id: contactData.id,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        lifecycleStage: contactData.lifecycleStage,
        createdAt: contactData.createdAt,
        updatedAt: contactData.updatedAt,
    };
    // Solo incluir campos opcionales si no son null
    if (contactData.dni != null)
        cleaned.dni = contactData.dni;
    if (contactData.cee != null)
        cleaned.cee = contactData.cee;
    if (contactData.phone != null)
        cleaned.phone = contactData.phone;
    if (contactData.mobile != null)
        cleaned.mobile = contactData.mobile;
    if (contactData.jobTitle != null)
        cleaned.jobTitle = contactData.jobTitle;
    if (contactData.companyId != null)
        cleaned.companyId = contactData.companyId;
    if (contactData.ownerId != null)
        cleaned.ownerId = contactData.ownerId;
    if (contactData.address != null)
        cleaned.address = contactData.address;
    if (contactData.city != null)
        cleaned.city = contactData.city;
    if (contactData.state != null)
        cleaned.state = contactData.state;
    if (contactData.country != null)
        cleaned.country = contactData.country;
    if (contactData.postalCode != null)
        cleaned.postalCode = contactData.postalCode;
    if (contactData.website != null)
        cleaned.website = contactData.website;
    if (contactData.facebook != null)
        cleaned.facebook = contactData.facebook;
    if (contactData.twitter != null)
        cleaned.twitter = contactData.twitter;
    if (contactData.github != null)
        cleaned.github = contactData.github;
    if (contactData.linkedin != null)
        cleaned.linkedin = contactData.linkedin;
    if (contactData.youtube != null)
        cleaned.youtube = contactData.youtube;
    if (contactData.leadStatus != null)
        cleaned.leadStatus = contactData.leadStatus;
    if (contactData.tags != null && Array.isArray(contactData.tags) && contactData.tags.length > 0)
        cleaned.tags = contactData.tags;
    if (contactData.notes != null)
        cleaned.notes = contactData.notes;
    // Solo incluir relaciones si existen
    if (contactData.Owner)
        cleaned.Owner = contactData.Owner;
    if (contactData.Company)
        cleaned.Company = contactData.Company;
    if (contactData.Companies && Array.isArray(contactData.Companies) && contactData.Companies.length > 0) {
        cleaned.Companies = contactData.Companies;
    }
    return cleaned;
};
// Obtener todos los contactos
router.get('/', async (req, res) => {
    try {
        console.log('📥 Iniciando GET /contacts');
        console.log('📥 Query params:', req.query);
        const { page = 1, limit: limitParam = 50, search, lifecycleStage, ownerId, 
        // Nuevos parámetros de filtro
        stages, // Array de etapas: ["lead", "activo"]
        countries, // Array de países: ["Perú", "Chile"]
        owners, // Array: ["me", "unassigned", "1", "2"]
        sortBy = 'newest', // newest, oldest, name, nameDesc
        // Filtros por columna
        filterNombre, filterEmpresa, filterTelefono, filterPais, filterEtapa, 
        // Filtros avanzados (JSON string)
        filterRules, } = req.query;
        console.log('📥 Parámetros procesados:', { page, limitParam, search, sortBy });
        // Limitar el tamaño máximo de página para evitar sobrecarga
        const maxLimit = 100;
        const requestedLimit = Number(limitParam);
        const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
        const pageNum = Number(page) < 1 ? 1 : Number(page);
        const offset = (pageNum - 1) * limit;
        const where = {};
        // ⭐ Aplicar filtro automático según rol del usuario
        const roleFilter = (0, rolePermissions_1.getRoleBasedDataFilter)(req.userRole, req.userId);
        Object.assign(where, roleFilter);
        // Búsqueda general
        if (search) {
            const searchStr = typeof search === 'string' ? search : String(search);
            const searchConditions = [
                { firstName: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { email: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { dni: { [sequelize_1.Op.eq]: searchStr.trim() } }, // Búsqueda exacta por DNI
                { cee: { [sequelize_1.Op.eq]: searchStr.trim().toUpperCase() } }, // Búsqueda exacta por CEE
            ];
            // Si ya hay un filtro ownerId (filtro RBAC), combinarlo con AND
            if (where.ownerId) {
                where[sequelize_1.Op.and] = [
                    { ownerId: where.ownerId },
                    { [sequelize_1.Op.or]: searchConditions }
                ];
                delete where.ownerId; // Eliminar el ownerId del nivel superior
            }
            else {
                where[sequelize_1.Op.or] = searchConditions;
            }
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
        // Filtro por propietarios (solo para admin y jefe_comercial, otros roles ya tienen filtro RBAC)
        // Si el usuario NO es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se debe sobrescribir
        if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && owners) {
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
        else if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && ownerId) {
            // Compatibilidad con el filtro antiguo (solo para admin y jefe_comercial)
            where.ownerId = ownerId === 'me' ? req.userId : ownerId;
        }
        // Si no es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se sobrescribe
        // Filtros por columna
        if (filterNombre) {
            const nombreConditions = [
                { firstName: { [sequelize_1.Op.iLike]: `%${filterNombre}%` } },
                { lastName: { [sequelize_1.Op.iLike]: `%${filterNombre}%` } },
            ];
            if (where[sequelize_1.Op.or]) {
                where[sequelize_1.Op.or] = [...where[sequelize_1.Op.or], ...nombreConditions];
            }
            else {
                where[sequelize_1.Op.or] = nombreConditions;
            }
        }
        if (filterTelefono) {
            const telefonoConditions = [
                { phone: { [sequelize_1.Op.iLike]: `%${filterTelefono}%` } },
                { mobile: { [sequelize_1.Op.iLike]: `%${filterTelefono}%` } },
            ];
            if (where[sequelize_1.Op.or]) {
                where[sequelize_1.Op.or] = [...where[sequelize_1.Op.or], ...telefonoConditions];
            }
            else {
                where[sequelize_1.Op.or] = telefonoConditions;
            }
        }
        if (filterPais) {
            where.country = { [sequelize_1.Op.iLike]: `%${filterPais}%` };
        }
        if (filterEtapa) {
            where.lifecycleStage = { [sequelize_1.Op.iLike]: `%${filterEtapa}%` };
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
                case 'firstName':
                case 'lastName':
                    if (rule.operator === 'contains') {
                        where[rule.column] = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    else if (rule.operator === 'equals') {
                        where[rule.column] = { [sequelize_1.Op.iLike]: rule.value };
                    }
                    break;
                case 'email':
                    if (rule.operator === 'contains') {
                        where.email = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
                    }
                    break;
                case 'phone':
                case 'mobile':
                    if (rule.operator === 'contains') {
                        where[rule.column] = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
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
                case 'jobTitle':
                    if (rule.operator === 'contains') {
                        where.jobTitle = { [sequelize_1.Op.iLike]: `%${rule.value}%` };
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
                order = [['firstName', 'ASC'], ['lastName', 'ASC']];
                break;
            case 'nameDesc':
                order = [['firstName', 'DESC'], ['lastName', 'DESC']];
                break;
        }
        // Configurar includes - solo Owner, Company se carga manualmente para evitar problemas con NULL
        const includes = [
            { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ];
        // Si hay filtro por empresa, agregar condición al where en lugar de usar include
        if (filterEmpresa) {
            // Buscar IDs de empresas que coincidan con el filtro
            const matchingCompanies = await Company_1.Company.findAll({
                where: {
                    name: { [sequelize_1.Op.iLike]: `%${filterEmpresa}%` },
                },
                attributes: ['id'],
            });
            const companyIds = matchingCompanies.map(c => c.id);
            if (companyIds.length > 0) {
                where.companyId = { [sequelize_1.Op.in]: companyIds };
            }
            else {
                // Si no hay empresas que coincidan, devolver lista vacía
                return res.json({
                    contacts: [],
                    total: 0,
                    page: pageNum,
                    limit,
                    totalPages: 0,
                });
            }
        }
        let contacts;
        try {
            contacts = await Contact_1.Contact.findAndCountAll({
                where,
                include: includes,
                distinct: true,
                limit,
                offset,
                order,
            });
            console.log(`✅ Consulta exitosa, ${contacts.rows.length} contactos encontrados`);
            // Cargar Company manualmente para cada contacto que tenga companyId
            const contactsWithCompany = await Promise.all(contacts.rows.map(async (contact) => {
                const contactData = contact.toJSON();
                if (contactData.companyId) {
                    try {
                        const company = await Company_1.Company.findByPk(contactData.companyId, {
                            attributes: ['id', 'name'],
                        });
                        contactData.Company = company;
                    }
                    catch (companyError) {
                        console.warn(`⚠️ No se pudo cargar Company para contacto ${contactData.id}:`, companyError);
                        contactData.Company = null;
                    }
                }
                else {
                    contactData.Company = null;
                }
                return contactData;
            }));
            contacts.rows = contactsWithCompany;
        }
        catch (queryError) {
            console.error('❌ Error en consulta de contactos:', queryError);
            console.error('❌ Stack trace:', queryError.stack);
            console.error('❌ Error name:', queryError.name);
            console.error('❌ Error message:', queryError.message);
            console.error('❌ Error original:', queryError.original);
            throw queryError;
        }
        console.log('📤 Preparando respuesta, total contactos:', contacts.count);
        // Limpiar contactos uno por uno con manejo de errores
        const cleanedContacts = [];
        for (const contact of contacts.rows) {
            try {
                cleanedContacts.push(cleanContact(contact));
            }
            catch (cleanError) {
                console.error(`⚠️ Error al limpiar contacto ${contact.id}:`, cleanError);
                // Si falla la limpieza, intentar devolver el contacto sin limpiar
                try {
                    cleanedContacts.push(contact.toJSON ? contact.toJSON() : contact);
                }
                catch (e) {
                    console.error(`❌ Error crítico al procesar contacto ${contact.id}:`, e);
                }
            }
        }
        console.log('✅ Respuesta lista, enviando', cleanedContacts.length, 'contactos');
        res.json({
            contacts: cleanedContacts,
            total: contacts.count,
            page: pageNum,
            limit,
            totalPages: Math.ceil(contacts.count / limit),
        });
    }
    catch (error) {
        console.error('❌ Error completo al obtener contactos:', error);
        console.error('❌ Stack trace:', error.stack);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error original:', error.original);
        if (error.errors) {
            console.error('❌ Error errors:', error.errors);
        }
        res.status(500).json({
            error: error.message || 'Error al obtener contactos',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
            return res.json(cleanContact(contactData));
        }
        if (!contact) {
            return res.status(404).json({ error: 'Contacto no encontrado' });
        }
        res.json(cleanContact(contact));
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
        console.log('📥 Datos recibidos para crear contacto:', {
            companyId: req.body.companyId,
            companyIdType: typeof req.body.companyId,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
        });
        // Validar que companyId esté presente y sea un número válido
        if (!req.body.companyId) {
            return res.status(400).json({ error: 'La empresa principal es requerida' });
        }
        const companyId = Number(req.body.companyId);
        if (isNaN(companyId)) {
            return res.status(400).json({ error: `El ID de empresa "${req.body.companyId}" no es válido` });
        }
        // Verificar que la empresa existe
        const company = await Company_1.Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ error: `La empresa con ID ${companyId} no existe en la base de datos` });
        }
        const contactData = {
            ...req.body,
            companyId: companyId, // Asegurar que sea un número
            // Asignar automáticamente el usuario actual como propietario del contacto
            ownerId: req.body.ownerId || req.userId || null,
        };
        // Validar campos requeridos
        if (!contactData.firstName || !contactData.firstName.trim()) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        if (!contactData.lastName || !contactData.lastName.trim()) {
            return res.status(400).json({ error: 'El apellido es requerido' });
        }
        if (!contactData.email || !contactData.email.trim()) {
            return res.status(400).json({ error: 'El email es requerido' });
        }
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
        console.log('✅ Creando contacto con datos:', {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            companyId: contactData.companyId,
        });
        const contact = await Contact_1.Contact.create(contactData);
        console.log('✅ Contacto creado con ID:', contact.id);
        // Intentar obtener el contacto con relaciones, pero manejar errores
        let newContact;
        try {
            newContact = await Contact_1.Contact.findByPk(contact.id, {
                include: [
                    { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                    { model: Company_1.Company, as: 'Company', required: false },
                ],
            });
        }
        catch (includeError) {
            console.error('⚠️ Error al cargar relaciones del contacto:', includeError);
            // Si falla el include, devolver el contacto sin relaciones
            newContact = contact;
        }
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.CONTACT, contact.id, { firstName: contact.firstName, lastName: contact.lastName, email: contact.email }, req);
        }
        res.status(201).json(cleanContact(newContact));
    }
    catch (error) {
        console.error('❌ Error completo al crear contacto:', error);
        console.error('❌ Stack trace:', error.stack);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        // Si es un error de validación de Sequelize, devolver mensaje más claro
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map((e) => e.message).join(', ');
            return res.status(400).json({ error: `Error de validación: ${messages}` });
        }
        // Si es un error de foreign key, la empresa no existe
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'La empresa especificada no existe o hay un problema con la relación' });
        }
        // Si es un error de base de datos
        if (error.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                error: 'Error en la base de datos',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        res.status(500).json({
            error: error.message || 'Error al crear contacto',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
        // Registrar log
        if (req.userId && updatedContact) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.UPDATE, systemLogger_1.EntityTypes.CONTACT, contact.id, { firstName: updatedContact.firstName, lastName: updatedContact.lastName, changes: contactData }, req);
        }
        res.json(cleanContact(updatedContact));
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
        // Verificar permisos: solo el propietario o admin puede eliminar
        if (!(0, rolePermissions_1.canDeleteResource)(req.userRole, req.userId, contact.ownerId)) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este contacto' });
        }
        const contactName = `${contact.firstName} ${contact.lastName}`;
        await contact.destroy();
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.DELETE, systemLogger_1.EntityTypes.CONTACT, parseInt(req.params.id), { name: contactName, email: contact.email }, req);
        }
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
        res.json(cleanContact(updatedContact));
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
        res.json(cleanContact(updatedContact));
    }
    catch (error) {
        console.error('Error removing company association:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
    }
});
// Importación masiva de contactos (bulk)
router.post('/bulk', async (req, res) => {
    try {
        const { contacts, batchSize = 1000 } = req.body;
        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de contactos' });
        }
        if (batchSize > 5000) {
            return res.status(400).json({ error: 'El tamaño de lote máximo es 5000' });
        }
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        // Función helper para buscar o crear empresa
        const getOrCreateCompany = async (companyName, transaction) => {
            if (!companyName || !companyName.trim()) {
                return null;
            }
            try {
                // Buscar empresa existente (case-insensitive)
                const existingCompany = await Company_1.Company.findOne({
                    where: {
                        name: {
                            [sequelize_1.Op.iLike]: companyName.trim(),
                        },
                    },
                    transaction,
                });
                if (existingCompany) {
                    return existingCompany.id;
                }
                // Si no existe, crear la empresa
                const newCompany = await Company_1.Company.create({
                    name: companyName.trim(),
                    lifecycleStage: 'lead',
                    ownerId: req.userId || null,
                }, { transaction });
                return newCompany.id;
            }
            catch (error) {
                console.error('Error al buscar/crear empresa:', error);
                return null;
            }
        };
        // Procesar en lotes
        const totalBatches = Math.ceil(contacts.length / batchSize);
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchSize, contacts.length);
            const batch = contacts.slice(startIndex, endIndex);
            // Usar transacción para cada lote
            await database_1.sequelize.transaction(async (t) => {
                for (let i = 0; i < batch.length; i++) {
                    const contactData = batch[i];
                    const globalIndex = startIndex + i;
                    try {
                        // Preparar datos del contacto
                        const processedData = {
                            ...contactData,
                            ownerId: contactData.ownerId || req.userId || null,
                        };
                        // Validar campos requeridos
                        if (!processedData.firstName || !processedData.firstName.trim()) {
                            results.push({
                                success: false,
                                error: 'El nombre es requerido',
                                index: globalIndex,
                                name: contactData.firstName || 'Sin nombre',
                            });
                            errorCount++;
                            continue;
                        }
                        if (!processedData.lastName || !processedData.lastName.trim()) {
                            results.push({
                                success: false,
                                error: 'El apellido es requerido',
                                index: globalIndex,
                                name: `${processedData.firstName} Sin apellido`,
                            });
                            errorCount++;
                            continue;
                        }
                        if (!processedData.email || !processedData.email.trim()) {
                            results.push({
                                success: false,
                                error: 'El email es requerido',
                                index: globalIndex,
                                name: `${processedData.firstName} ${processedData.lastName}`,
                            });
                            errorCount++;
                            continue;
                        }
                        // Manejar companyId: si viene como nombre de empresa, buscar o crear
                        let companyId = processedData.companyId;
                        if (companyId && typeof companyId === 'string' && isNaN(Number(companyId))) {
                            // Es un nombre de empresa, buscar o crear
                            companyId = await getOrCreateCompany(companyId, t);
                            if (!companyId) {
                                results.push({
                                    success: false,
                                    error: 'No se pudo crear o encontrar la empresa',
                                    index: globalIndex,
                                    name: `${processedData.firstName} ${processedData.lastName}`,
                                });
                                errorCount++;
                                continue;
                            }
                        }
                        else if (companyId) {
                            // Es un ID numérico, verificar que existe
                            companyId = Number(companyId);
                            if (isNaN(companyId)) {
                                results.push({
                                    success: false,
                                    error: 'El ID de empresa no es válido',
                                    index: globalIndex,
                                    name: `${processedData.firstName} ${processedData.lastName}`,
                                });
                                errorCount++;
                                continue;
                            }
                            const companyExists = await Company_1.Company.findByPk(companyId, { transaction: t });
                            if (!companyExists) {
                                results.push({
                                    success: false,
                                    error: 'La empresa especificada no existe',
                                    index: globalIndex,
                                    name: `${processedData.firstName} ${processedData.lastName}`,
                                });
                                errorCount++;
                                continue;
                            }
                        }
                        else {
                            // No hay companyId, es un error
                            results.push({
                                success: false,
                                error: 'La empresa es requerida',
                                index: globalIndex,
                                name: `${processedData.firstName} ${processedData.lastName}`,
                            });
                            errorCount++;
                            continue;
                        }
                        processedData.companyId = companyId;
                        // Validar que no exista un contacto con el mismo email (case-insensitive)
                        const existingContactByEmail = await Contact_1.Contact.findOne({
                            where: {
                                email: {
                                    [sequelize_1.Op.iLike]: processedData.email.trim(),
                                },
                            },
                            transaction: t,
                        });
                        if (existingContactByEmail) {
                            results.push({
                                success: false,
                                error: 'Ya existe un contacto con este email',
                                index: globalIndex,
                                name: `${processedData.firstName} ${processedData.lastName}`,
                            });
                            errorCount++;
                            continue;
                        }
                        // Validar que no exista un contacto con el mismo DNI (si se proporciona)
                        if (processedData.dni && processedData.dni.trim() !== '') {
                            const existingContactByDni = await Contact_1.Contact.findOne({
                                where: {
                                    dni: processedData.dni.trim(),
                                },
                                transaction: t,
                            });
                            if (existingContactByDni) {
                                results.push({
                                    success: false,
                                    error: 'Ya existe un contacto con este DNI',
                                    index: globalIndex,
                                    name: `${processedData.firstName} ${processedData.lastName}`,
                                });
                                errorCount++;
                                continue;
                            }
                        }
                        // Validar que no exista un contacto con el mismo CEE (si se proporciona)
                        if (processedData.cee && processedData.cee.trim() !== '') {
                            const existingContactByCee = await Contact_1.Contact.findOne({
                                where: {
                                    cee: processedData.cee.trim().toUpperCase(),
                                },
                                transaction: t,
                            });
                            if (existingContactByCee) {
                                results.push({
                                    success: false,
                                    error: 'Ya existe un contacto con este CEE',
                                    index: globalIndex,
                                    name: `${processedData.firstName} ${processedData.lastName}`,
                                });
                                errorCount++;
                                continue;
                            }
                        }
                        // Crear nuevo contacto
                        const newContact = await Contact_1.Contact.create(processedData, { transaction: t });
                        const createdContact = await Contact_1.Contact.findByPk(newContact.id, {
                            include: [
                                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                                { model: Company_1.Company, as: 'Company', required: false },
                            ],
                            transaction: t,
                        });
                        results.push({
                            success: true,
                            data: cleanContact(createdContact),
                            index: globalIndex,
                            name: `${processedData.firstName} ${processedData.lastName}`,
                        });
                        successCount++;
                        // Registrar log de creación (fuera de la transacción para no afectarla)
                        if (req.userId) {
                            try {
                                await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.CONTACT, newContact.id, { firstName: newContact.firstName, lastName: newContact.lastName, email: newContact.email }, req);
                            }
                            catch (logError) {
                                console.error('Error al registrar log de creación:', logError);
                                // No afectar la transacción si falla el log
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error procesando contacto ${globalIndex}:`, error);
                        results.push({
                            success: false,
                            error: error.message || 'Error desconocido',
                            index: globalIndex,
                            name: contactData.firstName && contactData.lastName
                                ? `${contactData.firstName} ${contactData.lastName}`
                                : 'Sin nombre',
                        });
                        errorCount++;
                    }
                }
            });
        }
        console.log('[BULK IMPORT CONTACTS] Resumen final:', {
            total: contacts.length,
            successCount,
            errorCount,
            resultsCount: results.length,
        });
        res.status(200).json({
            success: true,
            total: contacts.length,
            successCount: successCount || 0,
            errorCount: errorCount || 0,
            results: results || [],
        });
    }
    catch (error) {
        console.error('Error en importación masiva de contactos:', error);
        res.status(500).json({
            error: error.message || 'Error al procesar la importación masiva',
            success: false,
        });
    }
});
exports.default = router;
