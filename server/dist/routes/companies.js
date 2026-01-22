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
const rolePermissions_1 = require("../utils/rolePermissions");
const systemLogger_1 = require("../utils/systemLogger");
const database_1 = require("../config/database");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función para limpiar empresas eliminando campos null y objetos relacionados null
const cleanCompany = (company, includeSensitive = false) => {
    const companyData = company.toJSON ? company.toJSON() : company;
    const cleaned = {
        id: companyData.id,
        name: companyData.name || '',
        lifecycleStage: companyData.lifecycleStage || 'lead',
        createdAt: companyData.createdAt,
        updatedAt: companyData.updatedAt,
    };
    // Solo incluir campos opcionales si no son null
    if (companyData.domain != null)
        cleaned.domain = companyData.domain;
    if (companyData.companyname != null)
        cleaned.companyname = companyData.companyname;
    if (companyData.phone != null)
        cleaned.phone = companyData.phone;
    if (companyData.leadSource != null)
        cleaned.leadSource = companyData.leadSource;
    if (companyData.city != null)
        cleaned.city = companyData.city;
    if (companyData.state != null)
        cleaned.state = companyData.state;
    if (companyData.country != null)
        cleaned.country = companyData.country;
    if (companyData.estimatedRevenue != null)
        cleaned.estimatedRevenue = companyData.estimatedRevenue;
    if (companyData.isRecoveredClient != null)
        cleaned.isRecoveredClient = companyData.isRecoveredClient;
    if (companyData.ownerId != null)
        cleaned.ownerId = companyData.ownerId;
    if (companyData.linkedin != null)
        cleaned.linkedin = companyData.linkedin;
    if (companyData.numberOfEmployees != null)
        cleaned.numberOfEmployees = companyData.numberOfEmployees;
    // Solo incluir datos sensibles si se solicita explícitamente (para detalle completo)
    if (includeSensitive) {
        if (companyData.email != null)
            cleaned.email = companyData.email;
        if (companyData.ruc != null)
            cleaned.ruc = companyData.ruc;
        if (companyData.address != null)
            cleaned.address = companyData.address;
        if (companyData.idClienteEmpresa != null)
            cleaned.idClienteEmpresa = companyData.idClienteEmpresa;
    }
    // Solo incluir relaciones si existen
    if (companyData.Owner) {
        cleaned.Owner = {
            id: companyData.Owner.id,
            firstName: companyData.Owner.firstName || '',
            lastName: companyData.Owner.lastName || '',
        };
        // Solo incluir email del Owner si se solicita explícitamente
        if (includeSensitive && companyData.Owner.email) {
            cleaned.Owner.email = companyData.Owner.email;
        }
    }
    if (companyData.Contacts && Array.isArray(companyData.Contacts) && companyData.Contacts.length > 0) {
        cleaned.Contacts = companyData.Contacts;
    }
    // Incluir empresas relacionadas si existen
    if (companyData.Companies && Array.isArray(companyData.Companies) && companyData.Companies.length > 0) {
        cleaned.Companies = companyData.Companies;
    }
    return cleaned;
};
// Función para transformar empresa para lista (sin datos sensibles)
const transformCompanyForList = (company) => {
    return cleanCompany(company, false);
};
// Función para extraer el dominio del email si no está definido
const extractDomainFromEmail = (companyData) => {
    // Solo extraer dominio si no está definido y hay un email válido
    if (!companyData.domain && companyData.email && typeof companyData.email === 'string') {
        const emailMatch = companyData.email.match(/@(.+)/);
        if (emailMatch && emailMatch[1]) {
            companyData.domain = emailMatch[1].toLowerCase().trim();
        }
    }
};
// Obtener todas las empresas
router.get('/', async (req, res) => {
    try {
        // Validar que el usuario esté autenticado
        if (!req.userId) {
            console.error('[ERROR] req.userId es undefined en GET /companies');
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (!req.userRole) {
            console.error('[ERROR] req.userRole es undefined en GET /companies para userId:', req.userId);
            // No retornar error aquí, solo loguear - el middleware debería haber establecido el rol
        }
        // El middleware authenticateToken ya establece req.userRole correctamente
        // No necesitamos código adicional aquí, igual que en contacts.ts y deals.ts
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
        // Aplicar filtro RBAC primero (igual que en contacts y deals)
        const roleFilter = (0, rolePermissions_1.getRoleBasedDataFilter)(req.userRole, req.userId);
        // Construir el objeto where empezando con el filtro RBAC
        const where = {};
        Object.assign(where, roleFilter);
        // Búsqueda general
        if (search) {
            const searchStr = typeof search === 'string' ? search : String(search);
            const searchConditions = [
                { name: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { domain: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
                { companyname: { [sequelize_1.Op.iLike]: `%${searchStr}%` } },
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
        // Helper function para agregar condiciones al where (maneja Op.and si existe)
        const addCondition = (condition) => {
            if (where[sequelize_1.Op.and]) {
                where[sequelize_1.Op.and].push(condition);
            }
            else {
                Object.assign(where, condition);
            }
        };
        // Filtro por etapas (lifecycleStage) - soporta múltiples valores
        if (lifecycleStage) {
            addCondition({ lifecycleStage });
        }
        else if (stages) {
            const stagesArray = Array.isArray(stages) ? stages : [stages];
            if (stagesArray.length > 0) {
                addCondition({ lifecycleStage: { [sequelize_1.Op.in]: stagesArray } });
            }
        }
        // Filtro por países
        if (countries) {
            const countriesArray = Array.isArray(countries) ? countries : [countries];
            if (countriesArray.length > 0) {
                addCondition({ country: { [sequelize_1.Op.in]: countriesArray } });
            }
        }
        // Filtro por propietarios (solo para admin y jefe_comercial)
        // Si el usuario NO es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se sobrescribe
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
            let newOwnerFilter;
            if (hasUnassigned && ownerIds.length > 0) {
                newOwnerFilter = { [sequelize_1.Op.or]: [{ [sequelize_1.Op.in]: ownerIds }, { [sequelize_1.Op.is]: null }] };
            }
            else if (hasUnassigned) {
                newOwnerFilter = { [sequelize_1.Op.is]: null };
            }
            else if (hasMe && ownerIds.length > 1) {
                newOwnerFilter = { [sequelize_1.Op.in]: ownerIds };
            }
            else if (hasMe) {
                newOwnerFilter = req.userId || null;
            }
            else if (ownerIds.length > 0) {
                newOwnerFilter = { [sequelize_1.Op.in]: ownerIds };
            }
            if (newOwnerFilter !== undefined) {
                // Si hay Op.and, necesitamos reemplazar el ownerId dentro del Op.and
                if (where[sequelize_1.Op.and]) {
                    // Buscar y reemplazar el ownerId en el array Op.and
                    const ownerIndex = where[sequelize_1.Op.and].findIndex((cond) => cond.ownerId !== undefined);
                    if (ownerIndex !== -1) {
                        where[sequelize_1.Op.and][ownerIndex] = { ownerId: newOwnerFilter };
                    }
                    else {
                        where[sequelize_1.Op.and].push({ ownerId: newOwnerFilter });
                    }
                }
                else {
                    where.ownerId = newOwnerFilter;
                }
            }
        }
        else if ((req.userRole === 'admin' || req.userRole === 'jefe_comercial') && ownerId) {
            // Compatibilidad con el filtro antiguo (solo para admin y jefe_comercial)
            const newOwnerFilter = ownerId === 'me' ? req.userId : ownerId;
            if (where[sequelize_1.Op.and]) {
                const ownerIndex = where[sequelize_1.Op.and].findIndex((cond) => cond.ownerId !== undefined);
                if (ownerIndex !== -1) {
                    where[sequelize_1.Op.and][ownerIndex] = { ownerId: newOwnerFilter };
                }
                else {
                    where[sequelize_1.Op.and].push({ ownerId: newOwnerFilter });
                }
            }
            else {
                where.ownerId = newOwnerFilter;
            }
        }
        // Si no es admin ni jefe_comercial, el filtro RBAC ya está aplicado y no se sobrescribe
        // Filtros por columna
        if (companyname) {
            addCondition({ companyname });
        }
        if (filterNombre) {
            addCondition({ name: { [sequelize_1.Op.iLike]: `%${filterNombre}%` } });
        }
        if (filterTelefono) {
            addCondition({ phone: { [sequelize_1.Op.iLike]: `%${filterTelefono}%` } });
        }
        if (filterCorreo) {
            addCondition({ email: { [sequelize_1.Op.iLike]: `%${filterCorreo}%` } });
        }
        if (filterOrigenLead) {
            addCondition({ leadSource: { [sequelize_1.Op.iLike]: `%${filterOrigenLead}%` } });
        }
        if (filterEtapa) {
            addCondition({ lifecycleStage: { [sequelize_1.Op.iLike]: `%${filterEtapa}%` } });
        }
        if (filterCR !== undefined) {
            const filterCRValue = String(filterCR).toLowerCase().trim();
            const buscaSi = ['sí', 'si', 'yes', 's', '1', 'x', '✓', 'true'].includes(filterCRValue);
            const buscaNo = ['no', 'not', '0', 'false', 'n'].includes(filterCRValue);
            if (buscaSi) {
                addCondition({ isRecoveredClient: true });
            }
            else if (buscaNo) {
                addCondition({ isRecoveredClient: false });
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
            let condition = {};
            switch (rule.column) {
                case 'name':
                    if (rule.operator === 'contains') {
                        condition = { name: { [sequelize_1.Op.iLike]: `%${rule.value}%` } };
                    }
                    else if (rule.operator === 'equals') {
                        condition = { name: { [sequelize_1.Op.iLike]: rule.value } };
                    }
                    else if (rule.operator === 'startsWith') {
                        condition = { name: { [sequelize_1.Op.iLike]: `${rule.value}%` } };
                    }
                    else if (rule.operator === 'endsWith') {
                        condition = { name: { [sequelize_1.Op.iLike]: `%${rule.value}` } };
                    }
                    else if (rule.operator === 'notEquals') {
                        condition = { name: { [sequelize_1.Op.notILike]: rule.value } };
                    }
                    break;
                case 'companyname':
                    if (rule.operator === 'contains') {
                        condition = { companyname: { [sequelize_1.Op.iLike]: `%${rule.value}%` } };
                    }
                    else if (rule.operator === 'equals') {
                        condition = { companyname: { [sequelize_1.Op.iLike]: rule.value } };
                    }
                    break;
                case 'phone':
                    if (rule.operator === 'contains') {
                        condition = { phone: { [sequelize_1.Op.iLike]: `%${rule.value}%` } };
                    }
                    break;
                case 'leadSource':
                    if (rule.operator === 'contains') {
                        condition = { leadSource: { [sequelize_1.Op.iLike]: `%${rule.value}%` } };
                    }
                    break;
                case 'country':
                    if (rule.operator === 'contains') {
                        condition = { country: { [sequelize_1.Op.iLike]: `%${rule.value}%` } };
                    }
                    break;
                case 'lifecycleStage':
                    if (rule.operator === 'equals') {
                        condition = { lifecycleStage: rule.value };
                    }
                    break;
            }
            if (Object.keys(condition).length > 0) {
                addCondition(condition);
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
            console.error('[ERROR] Error en Company.findAndCountAll:', includeError);
            console.error('[ERROR] Stack:', includeError.stack);
            console.error('[ERROR] Message:', includeError.message);
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
        console.error('❌ Error completo al obtener empresas:', error);
        console.error('❌ Stack trace:', error.stack);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error original:', error.original);
        if (error.errors) {
            console.error('❌ Error errors:', error.errors);
        }
        // No exponer detalles del error en producción
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : 'Error al obtener empresas';
        res.status(500).json({
            error: errorMessage,
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
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname', 'ruc'] }, // Empresas relacionadas muchos-a-muchos
            ],
        });
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        // Obtener también los contactos vinculados por companyId (relación uno-a-muchos)
        const contactsByCompanyId = await Contact_1.Contact.findAll({
            where: { companyId: req.params.id },
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        });
        // Combinar ambos tipos de contactos, eliminando duplicados
        const companyData = company.toJSON(); // Usar 'any' para permitir propiedades de relaciones
        const manyToManyContacts = companyData.Contacts || [];
        const oneToManyContacts = contactsByCompanyId.map(c => c.toJSON());
        // Crear un Map para eliminar duplicados por ID
        const contactsMap = new Map();
        // Primero agregar los de muchos-a-muchos
        manyToManyContacts.forEach((contact) => {
            contactsMap.set(contact.id, contact);
        });
        // Luego agregar los de uno-a-muchos (sobrescribirán si hay duplicados)
        oneToManyContacts.forEach((contact) => {
            contactsMap.set(contact.id, contact);
        });
        // Convertir el Map a array
        companyData.Contacts = Array.from(contactsMap.values());
        res.json(cleanCompany(companyData, true));
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
        // Validar que el nombre sea requerido
        if (!companyData.name || !companyData.name.trim()) {
            return res.status(400).json({
                error: 'El nombre de la empresa es requerido',
                field: 'name',
            });
        }
        // Validar y convertir estimatedRevenue si viene como string vacío o null
        if (companyData.estimatedRevenue !== undefined) {
            if (companyData.estimatedRevenue === '' || companyData.estimatedRevenue === null) {
                companyData.estimatedRevenue = null;
            }
            else if (typeof companyData.estimatedRevenue === 'string') {
                const parsed = parseFloat(companyData.estimatedRevenue);
                companyData.estimatedRevenue = isNaN(parsed) ? null : parsed;
            }
        }
        // Extraer dominio del email si no está definido
        extractDomainFromEmail(companyData);
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
        // Validar que no exista una empresa con el mismo dominio (case-insensitive)
        if (companyData.domain && companyData.domain.trim() !== '') {
            const existingCompanyByDomain = await Company_1.Company.findOne({
                where: {
                    domain: {
                        [sequelize_1.Op.iLike]: companyData.domain.trim(), // Case-insensitive
                    },
                },
            });
            if (existingCompanyByDomain) {
                return res.status(400).json({
                    error: 'Ya existe una empresa con este dominio',
                    duplicateField: 'domain',
                    existingCompanyId: existingCompanyByDomain.id,
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
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.COMPANY, company.id, { name: company.name }, req);
        }
        res.status(201).json(cleanCompany(newCompany, true));
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
        // Verificar permisos: solo el propietario o admin puede modificar
        if (!(0, rolePermissions_1.canModifyResource)(req.userRole, req.userId, company.ownerId)) {
            return res.status(403).json({ error: 'No tienes permisos para modificar esta empresa' });
        }
        // Preparar los datos para actualizar, manejando campos especiales
        const updateData = { ...req.body };
        // Validar que el nombre sea requerido si se está actualizando
        if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
            return res.status(400).json({
                error: 'El nombre de la empresa es requerido',
                field: 'name',
            });
        }
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
        if (!updatedCompany) {
            return res.status(404).json({ error: 'Empresa no encontrada después de la actualización' });
        }
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.UPDATE, systemLogger_1.EntityTypes.COMPANY, company.id, { name: updatedCompany.name, changes: updateData }, req);
        }
        res.json(cleanCompany(updatedCompany, true));
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
        // Verificar permisos: solo el propietario o admin puede eliminar
        if (!(0, rolePermissions_1.canDeleteResource)(req.userRole, req.userId, company.ownerId)) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar esta empresa' });
        }
        const companyName = company.name;
        await company.destroy();
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.DELETE, systemLogger_1.EntityTypes.COMPANY, parseInt(req.params.id), { name: companyName }, req);
        }
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
        res.json(cleanCompany(updatedCompany, true));
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
        res.json(cleanCompany(updatedCompany, true));
    }
    catch (error) {
        console.error('Error removing contact association:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
    }
});
// Agregar empresas asociadas a una empresa
router.post('/:id/companies', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id, {
            include: [
                { model: Company_1.Company, as: 'Companies' },
            ],
        });
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
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
        const existingCompanyIds = (company.Companies || []).map((c) => c.id);
        // Filtrar solo las empresas nuevas
        const newCompanyIds = companyIds.filter((id) => !existingCompanyIds.includes(id));
        if (newCompanyIds.length > 0) {
            // Usar el método add de Sequelize para relaciones muchos-a-muchos
            await company.addCompanies(newCompanyIds);
        }
        // Obtener la empresa actualizada con todas sus empresas relacionadas
        const updatedCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname', 'ruc'] },
            ],
        });
        res.json(cleanCompany(updatedCompany, true));
    }
    catch (error) {
        console.error('Error adding companies to company:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al asociar las empresas' });
    }
});
// Eliminar asociación de empresa con empresa
router.delete('/:id/companies/:companyId', async (req, res) => {
    try {
        const company = await Company_1.Company.findByPk(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }
        const relatedCompanyId = parseInt(req.params.companyId);
        // Usar el método remove de Sequelize para relaciones muchos-a-muchos
        await company.removeCompanies([relatedCompanyId]);
        // Obtener la empresa actualizada
        const updatedCompany = await Company_1.Company.findByPk(company.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone', 'companyname', 'ruc'] },
            ],
        });
        res.json(cleanCompany(updatedCompany, true));
    }
    catch (error) {
        console.error('Error removing company association:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message || 'Error al eliminar la asociación' });
    }
});
// Importación masiva de empresas (bulk)
router.post('/bulk', async (req, res) => {
    try {
        const { companies, batchSize = 1000 } = req.body;
        if (!Array.isArray(companies) || companies.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de empresas' });
        }
        if (batchSize > 5000) {
            return res.status(400).json({ error: 'El tamaño de lote máximo es 5000' });
        }
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let updateCount = 0;
        // Procesar en lotes
        const totalBatches = Math.ceil(companies.length / batchSize);
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchSize, companies.length);
            const batch = companies.slice(startIndex, endIndex);
            // Usar transacción para cada lote
            await database_1.sequelize.transaction(async (t) => {
                for (let i = 0; i < batch.length; i++) {
                    const companyData = batch[i];
                    const globalIndex = startIndex + i;
                    try {
                        // Preparar datos de la empresa
                        const processedData = {
                            ...companyData,
                            ownerId: companyData.ownerId || req.userId || null,
                        };
                        // Validar nombre requerido
                        if (!processedData.name || !processedData.name.trim()) {
                            results.push({
                                success: false,
                                error: 'El nombre de la empresa es requerido',
                                index: globalIndex,
                                name: companyData.name || 'Sin nombre',
                            });
                            errorCount++;
                            continue;
                        }
                        // Validar y convertir estimatedRevenue
                        if (processedData.estimatedRevenue !== undefined) {
                            if (processedData.estimatedRevenue === '' || processedData.estimatedRevenue === null) {
                                processedData.estimatedRevenue = null;
                            }
                            else if (typeof processedData.estimatedRevenue === 'string') {
                                const parsed = parseFloat(processedData.estimatedRevenue);
                                processedData.estimatedRevenue = isNaN(parsed) ? null : parsed;
                            }
                        }
                        // Si email viene como string vacío, convertirlo a null (igual que en el endpoint PUT)
                        if (processedData.email !== undefined && processedData.email === '') {
                            processedData.email = null;
                        }
                        // Extraer dominio del email si no está definido
                        extractDomainFromEmail(processedData);
                        // Verificar si existe empresa con el mismo nombre (case-insensitive)
                        const existingCompanyByName = await Company_1.Company.findOne({
                            where: {
                                name: {
                                    [sequelize_1.Op.iLike]: processedData.name.trim(),
                                },
                            },
                            transaction: t,
                        });
                        if (existingCompanyByName) {
                            // Siempre mostrar error cuando ya existe una empresa con el mismo nombre
                            // (comportamiento consistente con el endpoint POST individual)
                            results.push({
                                success: false,
                                error: 'Ya existe una empresa con este nombre',
                                index: globalIndex,
                                name: processedData.name,
                            });
                            errorCount++;
                            continue;
                        }
                        // Verificar si existe empresa con el mismo dominio (case-insensitive)
                        if (processedData.domain && processedData.domain.trim() !== '') {
                            const existingCompanyByDomain = await Company_1.Company.findOne({
                                where: {
                                    domain: {
                                        [sequelize_1.Op.iLike]: processedData.domain.trim(),
                                    },
                                },
                                transaction: t,
                            });
                            if (existingCompanyByDomain) {
                                results.push({
                                    success: false,
                                    error: 'Ya existe una empresa con este dominio',
                                    index: globalIndex,
                                    name: processedData.name,
                                });
                                errorCount++;
                                continue;
                            }
                        }
                        // Verificar si existe empresa con el mismo RUC (si se proporciona)
                        if (processedData.ruc && processedData.ruc.trim() !== '') {
                            const existingCompanyByRuc = await Company_1.Company.findOne({
                                where: {
                                    ruc: processedData.ruc.trim(),
                                },
                                transaction: t,
                            });
                            if (existingCompanyByRuc) {
                                results.push({
                                    success: false,
                                    error: 'Ya existe una empresa con este RUC',
                                    index: globalIndex,
                                    name: processedData.name,
                                });
                                errorCount++;
                                continue;
                            }
                        }
                        // Crear nueva empresa
                        const newCompany = await Company_1.Company.create(processedData, { transaction: t });
                        const createdCompany = await Company_1.Company.findByPk(newCompany.id, {
                            include: [
                                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                            ],
                            transaction: t,
                        });
                        results.push({
                            success: true,
                            data: cleanCompany(createdCompany, true),
                            index: globalIndex,
                            name: processedData.name,
                        });
                        successCount++;
                        // Registrar log de creación (fuera de la transacción para no afectarla)
                        if (req.userId) {
                            try {
                                await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.COMPANY, newCompany.id, { name: newCompany.name }, req);
                            }
                            catch (logError) {
                                console.error('Error al registrar log de creación:', logError);
                                // No afectar la transacción si falla el log
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error procesando empresa ${globalIndex}:`, error);
                        results.push({
                            success: false,
                            error: error.message || 'Error desconocido',
                            index: globalIndex,
                            name: companyData.name || 'Sin nombre',
                        });
                        errorCount++;
                    }
                }
            });
        }
        res.status(200).json({
            success: true,
            total: companies.length,
            successCount: successCount || 0,
            errorCount: errorCount || 0,
            updateCount: updateCount || 0,
            createCount: (successCount || 0) - (updateCount || 0),
            results: results || [],
        });
    }
    catch (error) {
        console.error('Error en importación masiva:', error);
        res.status(500).json({
            error: error.message || 'Error al procesar la importación masiva',
            success: false,
        });
    }
});
exports.default = router;
