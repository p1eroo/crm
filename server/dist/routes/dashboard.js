"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Contact_1 = require("../models/Contact");
const Company_1 = require("../models/Company");
const Deal_1 = require("../models/Deal");
const Task_1 = require("../models/Task");
const Campaign_1 = require("../models/Campaign");
const Payment_1 = require("../models/Payment");
const MonthlyBudget_1 = require("../models/MonthlyBudget");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
// Obtener estadísticas del dashboard
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas del dashboard...');
        console.log('📅 Filtros de fecha:', req.query);
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate)
                dateFilter.createdAt[sequelize_1.Op.gte] = new Date(startDate);
            if (endDate)
                dateFilter.createdAt[sequelize_1.Op.lte] = new Date(endDate);
        }
        // Estadísticas de contactos
        let totalContacts = 0;
        try {
            totalContacts = await Contact_1.Contact.count({ where: dateFilter });
        }
        catch (error) {
            console.warn('⚠️  Error al contar contactos:', error.message);
            totalContacts = 0;
        }
        let contactsByStage = [];
        try {
            contactsByStage = await Contact_1.Contact.findAll({
                attributes: [
                    'lifecycleStage',
                    [Contact_1.Contact.sequelize.fn('COUNT', Contact_1.Contact.sequelize.col('id')), 'count']
                ],
                where: dateFilter,
                group: ['lifecycleStage'],
                raw: true,
            });
        }
        catch (error) {
            console.warn('⚠️  Error al obtener contactos por etapa (columna puede no existir):', error.message);
            // Si la columna no existe, usar array vacío
            contactsByStage = [];
        }
        // Estadísticas de empresas
        let totalCompanies = 0;
        try {
            totalCompanies = await Company_1.Company.count({ where: dateFilter });
        }
        catch (error) {
            console.warn('⚠️  Error al contar empresas:', error.message);
            totalCompanies = 0;
        }
        let companiesByStage = [];
        try {
            companiesByStage = await Company_1.Company.findAll({
                attributes: [
                    'lifecycleStage',
                    [Company_1.Company.sequelize.fn('COUNT', Company_1.Company.sequelize.col('id')), 'count']
                ],
                where: dateFilter,
                group: ['lifecycleStage'],
                raw: true,
            });
        }
        catch (error) {
            console.warn('⚠️  Error al obtener empresas por etapa (columna puede no existir):', error.message);
            // Si la columna no existe, usar array vacío
            companiesByStage = [];
        }
        // Estadísticas de deals
        let totalDeals = 0;
        let totalDealValue = 0;
        try {
            totalDeals = await Deal_1.Deal.count({ where: dateFilter });
            totalDealValue = (await Deal_1.Deal.sum('amount', { where: dateFilter })) || 0;
        }
        catch (error) {
            console.warn('⚠️  Error al contar deals:', error.message);
            totalDeals = 0;
            totalDealValue = 0;
        }
        let dealsByStage = [];
        try {
            dealsByStage = await Deal_1.Deal.findAll({
                attributes: [
                    'stage',
                    [Deal_1.Deal.sequelize.fn('COUNT', Deal_1.Deal.sequelize.col('id')), 'count'],
                    [Deal_1.Deal.sequelize.fn('SUM', Deal_1.Deal.sequelize.col('amount')), 'total']
                ],
                where: dateFilter,
                group: ['stage'],
                raw: true,
            });
            // Log para depuración
            console.log('Deals por etapa:', JSON.stringify(dealsByStage, null, 2));
        }
        catch (error) {
            console.warn('⚠️  Error al obtener deals por etapa:', error.message);
            dealsByStage = [];
        }
        // Estadísticas de tareas
        // Usar una consulta SQL directa para evitar problemas con ENUMs
        let totalTasks = 0;
        let tasksByStatus = [];
        try {
            totalTasks = await Task_1.Task.count({ where: dateFilter });
            // Construir la consulta SQL con filtros de fecha si existen
            let whereClause = '';
            const replacements = {};
            if (dateFilter.createdAt) {
                whereClause = 'WHERE "createdAt" >= :startDate';
                replacements.startDate = dateFilter.createdAt[sequelize_1.Op.gte];
                if (dateFilter.createdAt[sequelize_1.Op.lte]) {
                    whereClause += ' AND "createdAt" <= :endDate';
                    replacements.endDate = dateFilter.createdAt[sequelize_1.Op.lte];
                }
            }
            // Usar consulta SQL directa para agrupar por status, evitando problemas con ENUMs
            const tasksByStatusQuery = await database_1.sequelize.query(`
        SELECT status, COUNT(id)::integer as count
        FROM tasks
        ${whereClause}
        GROUP BY status
      `, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            tasksByStatus = tasksByStatusQuery;
        }
        catch (error) {
            console.error('Error al obtener estadísticas de tareas:', error);
            // Si falla, usar array vacío para que el dashboard siga funcionando
            tasksByStatus = [];
        }
        // Estadísticas de campañas
        let totalCampaigns = 0;
        let activeCampaigns = 0;
        try {
            totalCampaigns = await Campaign_1.Campaign.count({ where: dateFilter });
            activeCampaigns = await Campaign_1.Campaign.count({
                where: { ...dateFilter, status: 'active' }
            });
        }
        catch (error) {
            console.warn('⚠️  Error al obtener estadísticas de campañas (columna status puede no existir):', error.message);
            // Si la columna no existe, solo contar total sin filtrar por status
            try {
                totalCampaigns = await Campaign_1.Campaign.count({ where: dateFilter });
                activeCampaigns = 0;
            }
            catch (countError) {
                totalCampaigns = 0;
                activeCampaigns = 0;
            }
        }
        // Deals ganados este mes
        let wonDeals = 0;
        let wonDealValue = 0;
        try {
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            currentMonthStart.setHours(0, 0, 0, 0);
            wonDeals = await Deal_1.Deal.count({
                where: {
                    stage: { [sequelize_1.Op.in]: ['won', 'closed won', 'cierre_ganado'] },
                    createdAt: { [sequelize_1.Op.gte]: currentMonthStart }
                }
            });
            wonDealValue = (await Deal_1.Deal.sum('amount', {
                where: {
                    stage: { [sequelize_1.Op.in]: ['won', 'closed won', 'cierre_ganado'] },
                    createdAt: { [sequelize_1.Op.gte]: currentMonthStart }
                }
            })) || 0;
        }
        catch (error) {
            console.warn('⚠️  Error al contar deals ganados:', error.message);
            wonDeals = 0;
            wonDealValue = 0;
        }
        // Estadísticas de desempeño por usuario (cierres ganados)
        // Usar consulta SQL directa para obtener estadísticas por usuario
        let userPerformance = [];
        try {
            let whereClause = '';
            const replacements = {};
            if (dateFilter.createdAt) {
                whereClause = 'WHERE d."createdAt" >= :startDate';
                replacements.startDate = dateFilter.createdAt[sequelize_1.Op.gte];
                if (dateFilter.createdAt[sequelize_1.Op.lte]) {
                    whereClause += ' AND d."createdAt" <= :endDate';
                    replacements.endDate = dateFilter.createdAt[sequelize_1.Op.lte];
                }
                whereClause += ' AND r.name = \'user\'';
            }
            else {
                whereClause = 'WHERE r.name = \'user\'';
            }
            const userPerformanceQuery = await database_1.sequelize.query(`
        SELECT 
          u.id as "userId",
          u."firstName",
          u."lastName",
          COUNT(d.id)::integer as "totalDeals",
          COUNT(CASE WHEN d.stage IN ('won', 'closed won', 'cierre_ganado') THEN 1 END)::integer as "wonDeals",
          COALESCE(SUM(CASE WHEN d.stage IN ('won', 'closed won', 'cierre_ganado') THEN d.amount ELSE 0 END), 0)::numeric as "wonDealsValue"
        FROM users u
        INNER JOIN roles r ON u."roleId" = r.id
        INNER JOIN deals d ON u.id = d."ownerId"
        ${whereClause}
        GROUP BY u.id, u."firstName", u."lastName"
        HAVING COUNT(d.id) > 0
        ORDER BY "wonDeals" DESC, "totalDeals" DESC
      `, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
            });
            // Procesar estadísticas por usuario
            userPerformance = userPerformanceQuery.map((item) => {
                const totalDeals = parseInt(item.totalDeals) || 0;
                const wonDeals = parseInt(item.wonDeals) || 0;
                const wonDealsValue = parseFloat(item.wonDealsValue) || 0;
                const performance = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
                return {
                    userId: item.userId,
                    firstName: item.firstName || 'Sin nombre',
                    lastName: item.lastName || '',
                    totalDeals,
                    wonDeals,
                    wonDealsValue,
                    performance: Math.round(performance * 100) / 100, // Redondear a 2 decimales
                };
            });
        }
        catch (error) {
            console.warn('⚠️  Error al obtener estadísticas de desempeño por usuario:', error.message);
            userPerformance = [];
        }
        // Estadísticas de pagos
        let totalPayments = 0;
        let pendingPayments = 0;
        let completedPayments = 0;
        let failedPayments = 0;
        try {
            totalPayments = await Payment_1.Payment.count({ where: dateFilter });
            pendingPayments = await Payment_1.Payment.count({
                where: { ...dateFilter, status: 'pending' }
            });
            completedPayments = await Payment_1.Payment.count({
                where: { ...dateFilter, status: 'completed' }
            });
            failedPayments = await Payment_1.Payment.count({
                where: { ...dateFilter, status: 'failed' }
            });
        }
        catch (error) {
            console.warn('⚠️  Error al obtener estadísticas de pagos (columna status puede no existir):', error.message);
            // Si la columna no existe, solo contar total sin filtrar por status
            try {
                totalPayments = await Payment_1.Payment.count({ where: dateFilter });
                pendingPayments = 0;
                completedPayments = 0;
                failedPayments = 0;
            }
            catch (countError) {
                totalPayments = 0;
                pendingPayments = 0;
                completedPayments = 0;
                failedPayments = 0;
            }
        }
        let pendingAmount = 0;
        let completedAmount = 0;
        let failedAmount = 0;
        let totalRevenue = 0;
        try {
            pendingAmount = (await Payment_1.Payment.sum('amount', {
                where: { ...dateFilter, status: 'pending' }
            })) || 0;
            completedAmount = (await Payment_1.Payment.sum('amount', {
                where: { ...dateFilter, status: 'completed' }
            })) || 0;
            failedAmount = (await Payment_1.Payment.sum('amount', {
                where: { ...dateFilter, status: 'failed' }
            })) || 0;
            totalRevenue = (await Payment_1.Payment.sum('amount', {
                where: { ...dateFilter, status: 'completed' }
            })) || 0;
        }
        catch (error) {
            console.warn('⚠️  Error al obtener montos de pagos (columna status puede no existir):', error.message);
            // Si falla, usar valores en 0
            pendingAmount = 0;
            completedAmount = 0;
            failedAmount = 0;
            totalRevenue = 0;
        }
        // Ventas por mes basadas en deals ganados - Si hay filtro de fecha, usar ese rango, sino últimos 12 meses
        let monthlyPayments = [];
        try {
            if (dateFilter.createdAt && dateFilter.createdAt[sequelize_1.Op.gte] && dateFilter.createdAt[sequelize_1.Op.lte]) {
                const startDate = new Date(dateFilter.createdAt[sequelize_1.Op.gte]);
                const endDate = new Date(dateFilter.createdAt[sequelize_1.Op.lte]);
                const year = startDate.getFullYear();
                const startMonth = startDate.getMonth();
                const endMonth = endDate.getMonth();
                // Si el rango es de un solo mes (mismo mes de inicio y fin), mostrar solo ese mes
                if (startMonth === endMonth && startDate.getFullYear() === endDate.getFullYear()) {
                    const monthStart = new Date(year, startMonth, 1);
                    monthStart.setHours(0, 0, 0, 0);
                    const monthEnd = new Date(year, startMonth + 1, 1);
                    monthEnd.setHours(0, 0, 0, 0);
                    const monthName = monthStart.toLocaleString('es-ES', { month: 'short' });
                    // Sumar el valor de los deals ganados en este mes
                    // Usar closeDate si existe, sino usar updatedAt cuando el stage cambió a ganado
                    const monthTotal = await Deal_1.Deal.sum('amount', {
                        where: {
                            stage: { [sequelize_1.Op.in]: ['won', 'closed won', 'cierre_ganado'] },
                            [sequelize_1.Op.or]: [
                                {
                                    closeDate: {
                                        [sequelize_1.Op.gte]: monthStart,
                                        [sequelize_1.Op.lt]: monthEnd
                                    }
                                },
                                {
                                    // Si no hay closeDate, usar updatedAt cuando el stage es ganado
                                    updatedAt: {
                                        [sequelize_1.Op.gte]: monthStart,
                                        [sequelize_1.Op.lt]: monthEnd
                                    },
                                    closeDate: { [sequelize_1.Op.is]: null }
                                }
                            ]
                        }
                    }) || 0;
                    monthlyPayments.push({
                        month: `${monthName} ${year}`,
                        amount: Number(monthTotal),
                    });
                }
                else {
                    // Si es un rango de meses (año completo o varios meses), mostrar todos los meses del rango
                    const currentDate = new Date(startDate);
                    while (currentDate <= endDate) {
                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        monthStart.setHours(0, 0, 0, 0);
                        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                        monthEnd.setHours(0, 0, 0, 0);
                        const monthName = monthStart.toLocaleString('es-ES', { month: 'short' });
                        const monthYear = monthStart.getFullYear();
                        // Sumar el valor de los deals ganados en este mes
                        const monthTotal = await Deal_1.Deal.sum('amount', {
                            where: {
                                stage: { [sequelize_1.Op.in]: ['won', 'closed won', 'cierre_ganado'] },
                                [sequelize_1.Op.or]: [
                                    {
                                        closeDate: {
                                            [sequelize_1.Op.gte]: monthStart,
                                            [sequelize_1.Op.lt]: monthEnd
                                        }
                                    },
                                    {
                                        // Si no hay closeDate, usar updatedAt cuando el stage es ganado
                                        updatedAt: {
                                            [sequelize_1.Op.gte]: monthStart,
                                            [sequelize_1.Op.lt]: monthEnd
                                        },
                                        closeDate: { [sequelize_1.Op.is]: null }
                                    }
                                ]
                            }
                        }) || 0;
                        monthlyPayments.push({
                            month: `${monthName} ${monthYear}`,
                            amount: Number(monthTotal),
                        });
                        // Avanzar al siguiente mes
                        currentDate.setMonth(currentDate.getMonth() + 1);
                    }
                }
            }
            else {
                // Sin filtro: mostrar últimos 12 meses
                for (let i = 11; i >= 0; i--) {
                    const monthStart = new Date();
                    monthStart.setMonth(monthStart.getMonth() - i);
                    monthStart.setDate(1);
                    monthStart.setHours(0, 0, 0, 0);
                    const monthEnd = new Date(monthStart);
                    monthEnd.setMonth(monthEnd.getMonth() + 1);
                    monthEnd.setHours(0, 0, 0, 0);
                    const monthName = monthStart.toLocaleString('es-ES', { month: 'short' });
                    const year = monthStart.getFullYear();
                    // Sumar el valor de los deals ganados en este mes
                    const monthTotal = await Deal_1.Deal.sum('amount', {
                        where: {
                            stage: { [sequelize_1.Op.in]: ['won', 'closed won', 'cierre_ganado'] },
                            [sequelize_1.Op.or]: [
                                {
                                    closeDate: {
                                        [sequelize_1.Op.gte]: monthStart,
                                        [sequelize_1.Op.lt]: monthEnd
                                    }
                                },
                                {
                                    // Si no hay closeDate, usar updatedAt cuando el stage es ganado
                                    updatedAt: {
                                        [sequelize_1.Op.gte]: monthStart,
                                        [sequelize_1.Op.lt]: monthEnd
                                    },
                                    closeDate: { [sequelize_1.Op.is]: null }
                                }
                            ]
                        }
                    }) || 0;
                    monthlyPayments.push({
                        month: `${monthName} ${year}`,
                        amount: Number(monthTotal),
                    });
                }
            }
        }
        catch (error) {
            console.warn('⚠️  Error al obtener ventas por mes:', error.message);
            monthlyPayments = [];
        }
        // Leads convertidos (contactos que pasaron de lead a estados finales)
        let convertedLeads = 0;
        let totalLeads = 0;
        try {
            convertedLeads = await Contact_1.Contact.count({
                where: {
                    lifecycleStage: { [sequelize_1.Op.in]: ['activo', 'firma_contrato', 'cierre_ganado'] }
                }
            });
            totalLeads = await Contact_1.Contact.count({
                where: {
                    lifecycleStage: 'lead'
                }
            });
        }
        catch (error) {
            console.warn('⚠️  Error al contar leads (columna lifecycleStage puede no existir):', error.message);
            // Si la columna no existe, usar 0
            convertedLeads = 0;
            totalLeads = 0;
        }
        // Tareas completadas vs nuevas
        // Usar valores correctos del enum: 'pending', 'in progress', 'completed', 'cancelled'
        let completedTasks = 0;
        let newTasks = 0;
        try {
            completedTasks = await Task_1.Task.count({
                where: { ...dateFilter, status: 'completed' }
            });
            // Las tareas nuevas son las que están 'pending' o 'in progress'
            newTasks = await Task_1.Task.count({
                where: {
                    ...dateFilter,
                    status: { [sequelize_1.Op.in]: ['pending', 'in progress'] }
                }
            });
        }
        catch (error) {
            console.error('Error al contar tareas completadas/nuevas:', error);
            // Si falla, usar consulta SQL directa
            try {
                let whereClause = '';
                const replacements = {};
                if (dateFilter.createdAt) {
                    whereClause = 'AND "createdAt" >= :startDate';
                    replacements.startDate = dateFilter.createdAt[sequelize_1.Op.gte];
                    if (dateFilter.createdAt[sequelize_1.Op.lte]) {
                        whereClause += ' AND "createdAt" <= :endDate';
                        replacements.endDate = dateFilter.createdAt[sequelize_1.Op.lte];
                    }
                }
                const completedResult = await database_1.sequelize.query(`
          SELECT COUNT(id)::integer as count
          FROM tasks
          WHERE status = 'completed' ${whereClause}
        `, {
                    replacements,
                    type: sequelize_1.QueryTypes.SELECT,
                });
                const newResult = await database_1.sequelize.query(`
          SELECT COUNT(id)::integer as count
          FROM tasks
          WHERE status IN ('pending', 'in progress') ${whereClause}
        `, {
                    replacements,
                    type: sequelize_1.QueryTypes.SELECT,
                });
                completedTasks = completedResult[0]?.count || 0;
                newTasks = newResult[0]?.count || 0;
            }
            catch (sqlError) {
                console.error('Error en consulta SQL de tareas:', sqlError);
            }
        }
        const responseData = {
            contacts: {
                total: totalContacts,
                byStage: contactsByStage,
            },
            companies: {
                total: totalCompanies,
                byStage: companiesByStage,
            },
            deals: {
                total: totalDeals,
                totalValue: totalDealValue,
                byStage: dealsByStage,
                wonThisMonth: wonDeals,
                wonValueThisMonth: wonDealValue,
                userPerformance: userPerformance,
            },
            tasks: {
                total: totalTasks,
                byStatus: tasksByStatus,
                completed: completedTasks,
                new: newTasks,
            },
            campaigns: {
                total: totalCampaigns,
                active: activeCampaigns,
            },
            payments: {
                total: totalPayments,
                pending: {
                    count: pendingPayments,
                    amount: Number(pendingAmount),
                },
                completed: {
                    count: completedPayments,
                    amount: Number(completedAmount),
                },
                failed: {
                    count: failedPayments,
                    amount: Number(failedAmount),
                },
                revenue: Number(totalRevenue),
                monthly: monthlyPayments,
            },
            leads: {
                total: totalLeads,
                converted: convertedLeads,
            },
        };
        // Obtener presupuestos guardados para los meses en el rango
        let formattedBudgets = [];
        try {
            // Verificar que el modelo MonthlyBudget esté disponible
            if (MonthlyBudget_1.MonthlyBudget) {
                let budgets = [];
                if (dateFilter.createdAt && dateFilter.createdAt[sequelize_1.Op.gte] && dateFilter.createdAt[sequelize_1.Op.lte]) {
                    const startDate = new Date(dateFilter.createdAt[sequelize_1.Op.gte]);
                    const endDate = new Date(dateFilter.createdAt[sequelize_1.Op.lte]);
                    const startYear = startDate.getFullYear();
                    const endYear = endDate.getFullYear();
                    const startMonth = startDate.getMonth();
                    const endMonth = endDate.getMonth();
                    budgets = await MonthlyBudget_1.MonthlyBudget.findAll({
                        where: {
                            [sequelize_1.Op.or]: [
                                {
                                    year: startYear,
                                    month: { [sequelize_1.Op.gte]: startMonth },
                                },
                                {
                                    year: endYear,
                                    month: { [sequelize_1.Op.lte]: endMonth },
                                },
                                {
                                    year: { [sequelize_1.Op.gt]: startYear, [sequelize_1.Op.lt]: endYear },
                                },
                            ],
                        },
                    });
                }
                else {
                    // Sin filtro: obtener presupuestos de los últimos 12 meses
                    const currentYear = new Date().getFullYear();
                    budgets = await MonthlyBudget_1.MonthlyBudget.findAll({
                        where: {
                            year: { [sequelize_1.Op.gte]: currentYear - 1 },
                        },
                    });
                }
                // Formatear presupuestos para que coincidan con el formato de monthlyPayments
                formattedBudgets = budgets.map((budget) => {
                    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                    const monthName = monthNames[budget.month] || 'ene';
                    return {
                        month: `${monthName} ${budget.year}`,
                        amount: Number(budget.amount) || 0,
                    };
                });
            }
        }
        catch (budgetError) {
            console.error('Error al obtener presupuestos (continuando sin ellos):', budgetError?.message || budgetError);
            // Continuar sin presupuestos si hay un error
            formattedBudgets = [];
        }
        // Agregar budgets a la respuesta
        responseData.payments.budgets = formattedBudgets;
        console.log('✅ Estadísticas enviadas correctamente');
        console.log('📊 Resumen de datos:', {
            contactos: totalContacts,
            empresas: totalCompanies,
            deals: totalDeals,
            tareas: totalTasks,
            campañas: totalCampaigns,
            pagos: totalPayments,
        });
        res.json(responseData);
    }
    catch (error) {
        console.error('❌ Error en endpoint /stats:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
});
// Guardar presupuesto mensual
router.post('/budget', async (req, res) => {
    try {
        const { month, year, amount } = req.body;
        if (month === undefined || year === undefined || amount === undefined) {
            return res.status(400).json({ error: 'Mes, año y monto son requeridos' });
        }
        if (month < 0 || month > 11) {
            return res.status(400).json({ error: 'Mes debe estar entre 0 y 11' });
        }
        // Buscar o crear el presupuesto
        const [budget, created] = await MonthlyBudget_1.MonthlyBudget.findOrCreate({
            where: {
                month: parseInt(month),
                year: parseInt(year),
            },
            defaults: {
                month: parseInt(month),
                year: parseInt(year),
                amount: parseFloat(amount),
            },
        });
        // Si ya existe, actualizarlo
        if (!created) {
            budget.amount = parseFloat(amount);
            await budget.save();
        }
        res.json({
            success: true,
            budget: {
                id: budget.id,
                month: budget.month,
                year: budget.year,
                amount: Number(budget.amount),
            },
        });
    }
    catch (error) {
        console.error('Error al guardar presupuesto:', error);
        res.status(500).json({ error: error.message });
    }
});
// Obtener presupuesto mensual
router.get('/budget', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (month === undefined || year === undefined) {
            return res.status(400).json({ error: 'Mes y año son requeridos' });
        }
        const budget = await MonthlyBudget_1.MonthlyBudget.findOne({
            where: {
                month: parseInt(month),
                year: parseInt(year),
            },
        });
        if (!budget) {
            return res.json({
                success: true,
                budget: null,
            });
        }
        res.json({
            success: true,
            budget: {
                id: budget.id,
                month: budget.month,
                year: budget.year,
                amount: Number(budget.amount),
            },
        });
    }
    catch (error) {
        console.error('Error al obtener presupuesto:', error);
        res.status(500).json({ error: error.message });
    }
});
// Obtener actividades recientes
router.get('/recent-activities', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const recentContacts = await Contact_1.Contact.findAll({
            limit: Number(limit),
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
        });
        const recentDeals = await Deal_1.Deal.findAll({
            limit: Number(limit),
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'amount', 'stage', 'createdAt'],
        });
        let recentTasks = [];
        try {
            recentTasks = await Task_1.Task.findAll({
                limit: Number(limit),
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'createdAt'],
            });
        }
        catch (error) {
            console.warn('⚠️  Error al obtener tareas recientes (columna status puede no existir):', error.message);
            // Si falla, intentar sin la columna status
            try {
                recentTasks = await Task_1.Task.findAll({
                    limit: Number(limit),
                    order: [['createdAt', 'DESC']],
                    attributes: ['id', 'title', 'priority', 'dueDate', 'createdAt'],
                });
            }
            catch (fallbackError) {
                console.warn('⚠️  Error al obtener tareas recientes (sin status):', fallbackError.message);
                recentTasks = [];
            }
        }
        res.json({
            contacts: recentContacts,
            deals: recentDeals,
            tasks: recentTasks,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
