"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const Deal_1 = require("../models/Deal");
const User_1 = require("../models/User");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const DealContact_1 = require("../models/DealContact");
const DealCompany_1 = require("../models/DealCompany");
const DealDeal_1 = require("../models/DealDeal");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const rolePermissions_1 = require("../utils/rolePermissions");
const systemLogger_1 = require("../utils/systemLogger");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Función para limpiar deals eliminando campos null y objetos relacionados null
const cleanDeal = (deal) => {
    const dealJson = deal.toJSON ? deal.toJSON() : deal;
    const cleaned = {
        id: dealJson.id,
        name: dealJson.name,
        amount: typeof dealJson.amount === 'string' ? parseFloat(dealJson.amount) : (Number(dealJson.amount) || 0),
        stage: dealJson.stage,
        ownerId: dealJson.ownerId,
        pipelineId: dealJson.pipelineId,
        createdAt: dealJson.createdAt,
        updatedAt: dealJson.updatedAt,
    };
    // Solo incluir campos opcionales si no son null
    if (dealJson.closeDate != null)
        cleaned.closeDate = dealJson.closeDate;
    if (dealJson.probability != null)
        cleaned.probability = dealJson.probability;
    if (dealJson.priority != null)
        cleaned.priority = dealJson.priority;
    if (dealJson.contactId != null)
        cleaned.contactId = dealJson.contactId;
    if (dealJson.companyId != null)
        cleaned.companyId = dealJson.companyId;
    if (dealJson.description != null)
        cleaned.description = dealJson.description;
    if (dealJson.tags != null && Array.isArray(dealJson.tags) && dealJson.tags.length > 0)
        cleaned.tags = dealJson.tags;
    // Solo incluir relaciones si existen
    if (dealJson.Owner)
        cleaned.Owner = dealJson.Owner;
    if (dealJson.Contact)
        cleaned.Contact = dealJson.Contact;
    if (dealJson.Company)
        cleaned.Company = dealJson.Company;
    if (dealJson.Contacts && Array.isArray(dealJson.Contacts) && dealJson.Contacts.length > 0) {
        cleaned.Contacts = dealJson.Contacts;
    }
    if (dealJson.Companies && Array.isArray(dealJson.Companies) && dealJson.Companies.length > 0) {
        cleaned.Companies = dealJson.Companies;
    }
    if (dealJson.Deals && Array.isArray(dealJson.Deals) && dealJson.Deals.length > 0) {
        cleaned.Deals = dealJson.Deals;
    }
    return cleaned;
};
// Función helper para transformar deals y asegurar que amount sea un número (mantener compatibilidad)
const transformDeal = (deal) => {
    return cleanDeal(deal);
};
// Obtener todos los deals
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit: limitParam = 50, search, stage, ownerId, pipelineId, contactId, companyId, 
        // Nuevos parámetros de filtro
        stages, // Array de etapas
        owners, // Array: ["me", "unassigned", "1", "2"]
        sortBy = 'newest', // newest, oldest, name, nameDesc
        // Filtros por columna
        filterNombre, filterContacto, filterEmpresa, filterEtapa, filterPropietario, } = req.query;
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
            where.name = { [sequelize_1.Op.iLike]: `%${search}%` };
        }
        // Filtro por etapas (stage) - soporta múltiples valores
        if (stage) {
            where.stage = stage;
        }
        else if (stages) {
            const stagesArray = Array.isArray(stages) ? stages : [stages];
            if (stagesArray.length > 0) {
                where.stage = { [sequelize_1.Op.in]: stagesArray };
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
        if (pipelineId) {
            where.pipelineId = pipelineId;
        }
        // Filtros por columna
        if (filterNombre) {
            if (where.name) {
                // Si ya existe búsqueda por nombre, combinarla
                where.name = { [sequelize_1.Op.and]: [
                        where.name,
                        { [sequelize_1.Op.iLike]: `%${filterNombre}%` }
                    ] };
            }
            else {
                where.name = { [sequelize_1.Op.iLike]: `%${filterNombre}%` };
            }
        }
        if (filterEtapa) {
            const filterEtapaStr = String(filterEtapa);
            // Si ya existe filtro por stage, combinarlo
            if (where.stage) {
                if (typeof where.stage === 'object' && where.stage[sequelize_1.Op.in]) {
                    // Ya es un array, filtrar los que coincidan
                    const stagesArray = Array.isArray(where.stage[sequelize_1.Op.in]) ? where.stage[sequelize_1.Op.in] : [where.stage[sequelize_1.Op.in]];
                    where.stage = { [sequelize_1.Op.in]: stagesArray.filter((s) => s.toLowerCase().includes(filterEtapaStr.toLowerCase())) };
                }
                else {
                    // Es un valor único, verificar si coincide
                    if (!String(where.stage).toLowerCase().includes(filterEtapaStr.toLowerCase())) {
                        where.stage = { [sequelize_1.Op.in]: [] }; // No hay coincidencias
                    }
                }
            }
            else {
                where.stage = { [sequelize_1.Op.iLike]: `%${filterEtapaStr}%` };
            }
        }
        // Manejar contactId: buscar tanto en relación uno-a-muchos como muchos-a-muchos
        if (contactId) {
            const contactIdNum = Number(contactId);
            // Obtener dealIds de la relación muchos-a-muchos (deal_contacts)
            const dealContacts = await DealContact_1.DealContact.findAll({
                where: { contactId: contactIdNum },
                attributes: ['dealId'],
            });
            const dealIdsFromManyToMany = dealContacts.map(dc => dc.dealId);
            // Construir condición OR para buscar en ambas relaciones
            const contactConditions = [
                { contactId: contactIdNum }
            ];
            // Si hay deals en la relación muchos-a-muchos, agregarlos a la búsqueda
            if (dealIdsFromManyToMany.length > 0) {
                contactConditions.push({
                    id: { [sequelize_1.Op.in]: dealIdsFromManyToMany }
                });
            }
            where[sequelize_1.Op.or] = contactConditions;
        }
        // Manejar companyId: buscar tanto en relación uno-a-muchos como muchos-a-muchos
        if (companyId) {
            const companyIdNum = Number(companyId);
            // Obtener dealIds de la relación muchos-a-muchos (deal_companies)
            const dealCompanies = await DealCompany_1.DealCompany.findAll({
                where: { companyId: companyIdNum },
                attributes: ['dealId'],
            });
            const dealIdsFromManyToMany = dealCompanies.map(dc => dc.dealId);
            const companyConditions = [
                { companyId: companyIdNum }
            ];
            // Si hay deals en la relación muchos-a-muchos, agregarlos a la búsqueda
            if (dealIdsFromManyToMany.length > 0) {
                companyConditions.push({
                    id: { [sequelize_1.Op.in]: dealIdsFromManyToMany }
                });
            }
            // Si ya existe Op.or para contactId, combinarlo con AND
            if (where[sequelize_1.Op.or]) {
                where[sequelize_1.Op.and] = [
                    { [sequelize_1.Op.or]: where[sequelize_1.Op.or] },
                    { [sequelize_1.Op.or]: companyConditions }
                ];
                delete where[sequelize_1.Op.or];
            }
            else {
                where[sequelize_1.Op.or] = companyConditions;
            }
        }
        // Filtro por propietario (búsqueda por nombre) - DEBE IR ANTES DE LA PAGINACIÓN
        if (filterPropietario) {
            const filterPropietarioStr = String(filterPropietario).trim();
            if (filterPropietarioStr) {
                try {
                    // Buscar usuarios que coincidan con el texto del filtro
                    const matchingUsers = await User_1.User.findAll({
                        where: {
                            [sequelize_1.Op.or]: [
                                { firstName: { [sequelize_1.Op.iLike]: `%${filterPropietarioStr}%` } },
                                { lastName: { [sequelize_1.Op.iLike]: `%${filterPropietarioStr}%` } },
                                database_1.sequelize.where(database_1.sequelize.fn('CONCAT', database_1.sequelize.col('firstName'), ' ', database_1.sequelize.col('lastName')), { [sequelize_1.Op.iLike]: `%${filterPropietarioStr}%` })
                            ]
                        },
                        attributes: ['id']
                    });
                    const ownerIds = matchingUsers.map(user => user.id);
                    if (ownerIds.length > 0) {
                        // Aplicar el filtro ANTES de la paginación
                        // Si hay Op.and, necesitamos agregar el filtro dentro del Op.and
                        if (where[sequelize_1.Op.and]) {
                            // Buscar si ya existe un filtro ownerId en Op.and
                            const ownerIndex = where[sequelize_1.Op.and].findIndex((cond) => cond.ownerId !== undefined);
                            if (ownerIndex !== -1) {
                                // Si ya existe, combinarlo con AND usando Op.in
                                const existingOwnerFilter = where[sequelize_1.Op.and][ownerIndex].ownerId;
                                if (existingOwnerFilter && existingOwnerFilter[sequelize_1.Op.in]) {
                                    // Combinar los arrays de IDs (intersección)
                                    const existingIds = existingOwnerFilter[sequelize_1.Op.in];
                                    const combinedIds = existingIds.filter((id) => ownerIds.includes(id));
                                    where[sequelize_1.Op.and][ownerIndex] = { ownerId: { [sequelize_1.Op.in]: combinedIds.length > 0 ? combinedIds : [-1] } };
                                }
                                else {
                                    where[sequelize_1.Op.and][ownerIndex] = { ownerId: { [sequelize_1.Op.in]: ownerIds } };
                                }
                            }
                            else {
                                where[sequelize_1.Op.and].push({ ownerId: { [sequelize_1.Op.in]: ownerIds } });
                            }
                        }
                        else if (where.ownerId) {
                            // Si ya hay un ownerId en el nivel superior, hacer intersección
                            const existingOwnerFilter = where.ownerId;
                            if (existingOwnerFilter && existingOwnerFilter[sequelize_1.Op.in]) {
                                const existingIds = existingOwnerFilter[sequelize_1.Op.in];
                                const combinedIds = existingIds.filter((id) => ownerIds.includes(id));
                                where.ownerId = { [sequelize_1.Op.in]: combinedIds.length > 0 ? combinedIds : [-1] };
                            }
                            else {
                                where.ownerId = { [sequelize_1.Op.in]: ownerIds };
                            }
                        }
                        else {
                            where.ownerId = { [sequelize_1.Op.in]: ownerIds };
                        }
                    }
                    else {
                        // Si no hay usuarios que coincidan, filtrar para que no haya resultados
                        where.ownerId = { [sequelize_1.Op.in]: [-1] }; // ID que no existe = ningún resultado
                    }
                }
                catch (error) {
                    console.warn('[WARN] Error al buscar usuarios para filterPropietario:', error);
                }
            }
        }
        // Configurar includes
        const includes = [
            { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ];
        // Si hay filtro por contacto, hacer el include requerido
        if (filterContacto) {
            includes.push({
                model: Contact_1.Contact,
                as: 'Contact',
                attributes: ['id', 'firstName', 'lastName', 'email'],
                required: true,
                where: {
                    [sequelize_1.Op.or]: [
                        { firstName: { [sequelize_1.Op.iLike]: `%${filterContacto}%` } },
                        { lastName: { [sequelize_1.Op.iLike]: `%${filterContacto}%` } },
                    ],
                },
            });
        }
        else {
            includes.push({
                model: Contact_1.Contact,
                as: 'Contact',
                attributes: ['id', 'firstName', 'lastName', 'email'],
                required: false,
            });
        }
        // Si hay filtro por empresa, hacer el include requerido
        if (filterEmpresa) {
            includes.push({
                model: Company_1.Company,
                as: 'Company',
                attributes: ['id', 'name'],
                required: true,
                where: {
                    name: { [sequelize_1.Op.iLike]: `%${filterEmpresa}%` },
                },
            });
        }
        else {
            includes.push({
                model: Company_1.Company,
                as: 'Company',
                attributes: ['id', 'name'],
                required: false,
            });
        }
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
        const deals = await Deal_1.Deal.findAndCountAll({
            where,
            include: includes,
            distinct: true, // Importante para contar correctamente con includes
            limit,
            offset,
            order,
        });
        const transformedDeals = deals.rows.map(deal => transformDeal(deal));
        res.json({
            deals: transformedDeals,
            total: deals.count,
            page: pageNum,
            limit,
            totalPages: Math.ceil(deals.count / limit),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Obtener un deal por ID
router.get('/:id', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
                { model: Deal_1.Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
                { model: Deal_1.Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
            ],
        });
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        // Combinar ambas direcciones de la relación (bidireccional)
        const dealJson = deal.toJSON ? deal.toJSON() : deal;
        const allRelatedDeals = [
            ...(dealJson.Deals || []),
            ...(dealJson.RelatedDeals || []),
        ];
        // Eliminar duplicados por ID
        const uniqueDeals = allRelatedDeals.filter((deal, index, self) => index === self.findIndex((d) => d.id === deal.id));
        // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
        dealJson.Deals = uniqueDeals;
        delete dealJson.RelatedDeals;
        res.json(transformDeal(dealJson));
    }
    catch (error) {
        console.error('Error fetching deal:', error);
        // Si el error es porque la tabla deal_contacts no existe, intentar sin la relación Contacts
        if (error.message && (error.message.includes('deal_contacts') || error.message.includes('does not exist'))) {
            try {
                const deal = await Deal_1.Deal.findByPk(req.params.id, {
                    include: [
                        { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                        { model: Contact_1.Contact, as: 'Contact', required: false },
                        { model: Company_1.Company, as: 'Company', required: false },
                        { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
                        { model: Deal_1.Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
                        { model: Deal_1.Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
                    ],
                });
                if (!deal) {
                    return res.status(404).json({ error: 'Deal no encontrado' });
                }
                // Combinar ambas direcciones de la relación (bidireccional)
                const dealJson = deal.toJSON ? deal.toJSON() : deal;
                const allRelatedDeals = [
                    ...(dealJson.Deals || []),
                    ...(dealJson.RelatedDeals || []),
                ];
                // Eliminar duplicados por ID
                const uniqueDeals = allRelatedDeals.filter((deal, index, self) => index === self.findIndex((d) => d.id === deal.id));
                // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
                dealJson.Deals = uniqueDeals;
                delete dealJson.RelatedDeals;
                res.json(transformDeal(dealJson));
            }
            catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
                res.status(500).json({ error: fallbackError.message });
            }
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
// Crear deal
router.post('/', async (req, res) => {
    try {
        const dealData = {
            ...req.body,
            ownerId: req.body.ownerId || req.userId,
        };
        const deal = await Deal_1.Deal.create(dealData);
        const newDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.CREATE, systemLogger_1.EntityTypes.DEAL, deal.id, { name: deal.name, amount: deal.amount, stage: deal.stage }, req);
        }
        res.status(201).json(transformDeal(newDeal));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Actualizar deal
router.put('/:id', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        // Verificar permisos: solo el propietario o admin puede modificar
        if (!(0, rolePermissions_1.canModifyResource)(req.userRole, req.userId, deal.ownerId)) {
            return res.status(403).json({ error: 'No tienes permisos para modificar este deal' });
        }
        await deal.update(req.body);
        // Si se están actualizando los contactos relacionados
        if (req.body.contactIds && Array.isArray(req.body.contactIds)) {
            const dealInstance = await Deal_1.Deal.findByPk(deal.id);
            if (dealInstance) {
                await dealInstance.setContacts(req.body.contactIds);
            }
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact' },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
                { model: Company_1.Company, as: 'Company' },
            ],
        });
        // Registrar log
        if (req.userId && updatedDeal) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.UPDATE, systemLogger_1.EntityTypes.DEAL, deal.id, { name: updatedDeal.name, changes: req.body }, req);
        }
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Eliminar deal
router.delete('/:id', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        // Verificar permisos: solo el propietario o admin puede eliminar
        if (!(0, rolePermissions_1.canDeleteResource)(req.userRole, req.userId, deal.ownerId)) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar este deal' });
        }
        const dealName = deal.name;
        await deal.destroy();
        // Registrar log
        if (req.userId) {
            await (0, systemLogger_1.logSystemAction)(req.userId, systemLogger_1.SystemActions.DELETE, systemLogger_1.EntityTypes.DEAL, parseInt(req.params.id), { name: dealName }, req);
        }
        res.json({ message: 'Deal eliminado exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Agregar contactos a un deal
router.post('/:id/contacts', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const { contactIds } = req.body;
        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de contactIds' });
        }
        // Usar la relación muchos a muchos
        const currentContacts = await deal.getContacts();
        const currentContactIds = currentContacts.map((c) => c.id);
        // Agregar solo los contactos que no están ya asociados
        const newContactIds = contactIds.filter((id) => !currentContactIds.includes(id));
        if (newContactIds.length > 0) {
            await deal.addContacts(newContactIds);
        }
        // Obtener el deal actualizado
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error adding contacts to deal:', error);
        res.status(500).json({ error: error.message || 'Error al agregar contactos al negocio' });
    }
});
// Eliminar contactos de un deal
router.delete('/:id/contacts/:contactId', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const contactId = parseInt(req.params.contactId);
        // Intentar usar la relación muchos a muchos
        try {
            await deal.removeContact(contactId);
        }
        catch (relationError) {
            // Si falla, eliminar directamente de la tabla de asociación
            if (relationError.message && (relationError.message.includes('deal_contacts') || relationError.message.includes('does not exist'))) {
                await DealContact_1.DealContact.destroy({
                    where: {
                        dealId: deal.id,
                        contactId: contactId
                    }
                });
            }
            else {
                throw relationError;
            }
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error removing contact from deal:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar el contacto del negocio' });
    }
});
// Agregar empresas a un deal
router.post('/:id/companies', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const { companyIds } = req.body;
        if (!Array.isArray(companyIds) || companyIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de companyIds' });
        }
        const currentCompanies = await deal.getCompanies();
        const currentCompanyIds = currentCompanies.map((c) => c.id);
        const newCompanyIds = companyIds.filter((id) => !currentCompanyIds.includes(id));
        if (newCompanyIds.length > 0) {
            await deal.addCompanies(newCompanyIds);
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
            ],
        });
        res.status(200).json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error adding companies to deal:', error);
        res.status(500).json({ error: error.message || 'Error al agregar empresas al negocio' });
    }
});
// Eliminar empresa de un deal
router.delete('/:id/companies/:companyId', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const companyIdToRemove = parseInt(req.params.companyId);
        try {
            await deal.removeCompany(companyIdToRemove);
        }
        catch (sequelizeError) {
            console.warn(`⚠️  Sequelize removeCompany failed, attempting direct deletion from DealCompany: ${sequelizeError.message}`);
            await DealCompany_1.DealCompany.destroy({
                where: {
                    dealId: deal.id,
                    companyId: companyIdToRemove,
                },
            });
        }
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
            ],
        });
        res.json(transformDeal(updatedDeal));
    }
    catch (error) {
        console.error('Error removing company from deal:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar la empresa del negocio' });
    }
});
// Agregar negocios relacionados a un deal
router.post('/:id/deals', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const { dealIds } = req.body;
        if (!Array.isArray(dealIds) || dealIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de dealIds' });
        }
        // Obtener los negocios relacionados actuales (buscar en ambas direcciones para evitar duplicados)
        const currentDeals = await deal.getDeals();
        const currentRelatedDeals = await deal.getRelatedDeals();
        const currentDealIds = [
            ...currentDeals.map((d) => d.id),
            ...currentRelatedDeals.map((d) => d.id),
        ];
        // Agregar solo los negocios que no están ya asociados
        const newDealIds = dealIds.filter((id) => !currentDealIds.includes(id));
        if (newDealIds.length > 0) {
            // Agregar la relación en una dirección (dealId -> relatedDealId)
            // La consulta bidireccional se maneja en el GET
            await deal.addDeals(newDealIds);
        }
        // Obtener el deal actualizado
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contact', required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
                { model: Deal_1.Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
                { model: Deal_1.Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
            ],
        });
        // Combinar ambas direcciones de la relación (bidireccional)
        const updatedDealJson = updatedDeal?.toJSON ? updatedDeal.toJSON() : updatedDeal;
        if (updatedDealJson) {
            const allRelatedDeals = [
                ...(updatedDealJson.Deals || []),
                ...(updatedDealJson.RelatedDeals || []),
            ];
            // Eliminar duplicados por ID
            const uniqueDeals = allRelatedDeals.filter((deal, index, self) => index === self.findIndex((d) => d.id === deal.id));
            // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
            updatedDealJson.Deals = uniqueDeals;
            delete updatedDealJson.RelatedDeals;
        }
        res.json(transformDeal(updatedDealJson || updatedDeal));
    }
    catch (error) {
        console.error('Error adding deals to deal:', error);
        res.status(500).json({ error: error.message || 'Error al agregar negocios relacionados' });
    }
});
// Eliminar negocio relacionado de un deal
router.delete('/:id/deals/:dealId', async (req, res) => {
    try {
        const deal = await Deal_1.Deal.findByPk(req.params.id);
        if (!deal) {
            return res.status(404).json({ error: 'Deal no encontrado' });
        }
        const dealIdToRemove = parseInt(req.params.dealId);
        try {
            // Intentar eliminar usando Sequelize (solo elimina en una dirección)
            await deal.removeDeal(dealIdToRemove);
        }
        catch (sequelizeError) {
            console.warn(`⚠️  Sequelize removeDeal failed, attempting direct deletion from DealDeal: ${sequelizeError.message}`);
        }
        // Eliminar la relación en ambas direcciones (bidireccional)
        await DealDeal_1.DealDeal.destroy({
            where: {
                [sequelize_1.Op.or]: [
                    { dealId: deal.id, relatedDealId: dealIdToRemove },
                    { dealId: dealIdToRemove, relatedDealId: deal.id },
                ],
            },
        });
        const updatedDeal = await Deal_1.Deal.findByPk(deal.id, {
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
                { model: Contact_1.Contact, as: 'Contacts', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'], required: false },
                { model: Company_1.Company, as: 'Company', required: false },
                { model: Company_1.Company, as: 'Companies', attributes: ['id', 'name', 'domain', 'phone'], required: false },
                { model: Deal_1.Deal, as: 'Deals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
                { model: Deal_1.Deal, as: 'RelatedDeals', attributes: ['id', 'name', 'amount', 'stage', 'closeDate'], required: false },
            ],
        });
        // Combinar ambas direcciones de la relación (bidireccional)
        const updatedDealJson = updatedDeal?.toJSON ? updatedDeal.toJSON() : updatedDeal;
        if (updatedDealJson) {
            const allRelatedDeals = [
                ...(updatedDealJson.Deals || []),
                ...(updatedDealJson.RelatedDeals || []),
            ];
            // Eliminar duplicados por ID
            const uniqueDeals = allRelatedDeals.filter((deal, index, self) => index === self.findIndex((d) => d.id === deal.id));
            // Reemplazar Deals con la lista combinada y eliminar RelatedDeals
            updatedDealJson.Deals = uniqueDeals;
            delete updatedDealJson.RelatedDeals;
        }
        res.json(transformDeal(updatedDealJson || updatedDeal));
    }
    catch (error) {
        console.error('Error removing deal from deal:', error);
        res.status(500).json({ error: error.message || 'Error al eliminar el negocio relacionado' });
    }
});
// Obtener deals por pipeline/stage
router.get('/pipeline/:pipelineId', async (req, res) => {
    try {
        const deals = await Deal_1.Deal.findAll({
            where: { pipelineId: req.params.pipelineId },
            include: [
                { model: User_1.User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Contact_1.Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
                { model: Company_1.Company, as: 'Company', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        const transformedDeals = deals.map(deal => transformDeal(deal));
        res.json(transformedDeals);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
