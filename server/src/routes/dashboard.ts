import express from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Campaign } from '../models/Campaign';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { MonthlyBudget } from '../models/MonthlyBudget';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener estadísticas del dashboard
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...');
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate as string);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate as string);
    }

    // Estadísticas de contactos
    const totalContacts = await Contact.count({ where: dateFilter });
    const contactsByStage = await Contact.findAll({
      attributes: [
        'lifecycleStage',
        [Contact.sequelize!.fn('COUNT', Contact.sequelize!.col('id')), 'count']
      ],
      where: dateFilter,
      group: ['lifecycleStage'],
      raw: true,
    });

    // Estadísticas de empresas
    const totalCompanies = await Company.count({ where: dateFilter });
    const companiesByStage = await Company.findAll({
      attributes: [
        'lifecycleStage',
        [Company.sequelize!.fn('COUNT', Company.sequelize!.col('id')), 'count']
      ],
      where: dateFilter,
      group: ['lifecycleStage'],
      raw: true,
    });

    // Estadísticas de deals
    const totalDeals = await Deal.count({ where: dateFilter });
    const totalDealValue = await Deal.sum('amount', { where: dateFilter }) || 0;
    const dealsByStage = await Deal.findAll({
      attributes: [
        'stage',
        [Deal.sequelize!.fn('COUNT', Deal.sequelize!.col('id')), 'count'],
        [Deal.sequelize!.fn('SUM', Deal.sequelize!.col('amount')), 'total']
      ],
      where: dateFilter,
      group: ['stage'],
      raw: true,
    });
    
    // Log para depuración
    console.log('Deals por etapa:', JSON.stringify(dealsByStage, null, 2));

    // Estadísticas de tareas
    // Usar una consulta SQL directa para evitar problemas con ENUMs
    let totalTasks = 0;
    let tasksByStatus: any[] = [];
    
    try {
      totalTasks = await Task.count({ where: dateFilter });
      
      // Construir la consulta SQL con filtros de fecha si existen
      let whereClause = '';
      const replacements: any = {};
      
      if (dateFilter.createdAt) {
        whereClause = 'WHERE "createdAt" >= :startDate';
        replacements.startDate = dateFilter.createdAt[Op.gte];
        
        if (dateFilter.createdAt[Op.lte]) {
          whereClause += ' AND "createdAt" <= :endDate';
          replacements.endDate = dateFilter.createdAt[Op.lte];
        }
      }
      
      // Usar consulta SQL directa para agrupar por status, evitando problemas con ENUMs
      const tasksByStatusQuery = await sequelize.query(`
        SELECT status, COUNT(id)::integer as count
        FROM tasks
        ${whereClause}
        GROUP BY status
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });
      
      tasksByStatus = tasksByStatusQuery as any[];
    } catch (error: any) {
      console.error('Error al obtener estadísticas de tareas:', error);
      // Si falla, usar array vacío para que el dashboard siga funcionando
      tasksByStatus = [];
    }

    // Estadísticas de campañas
    const totalCampaigns = await Campaign.count({ where: dateFilter });
    const activeCampaigns = await Campaign.count({ 
      where: { ...dateFilter, status: 'active' } 
    });

    // Deals ganados este mes
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const wonDeals = await Deal.count({
      where: {
        stage: { [Op.in]: ['won', 'closed won', 'cierre_ganado'] },
        createdAt: { [Op.gte]: currentMonthStart }
      }
    });

    const wonDealValue = await Deal.sum('amount', {
      where: {
        stage: { [Op.in]: ['won', 'closed won', 'cierre_ganado'] },
        createdAt: { [Op.gte]: currentMonthStart }
      }
    }) || 0;

    // Estadísticas de desempeño por usuario (cierres ganados)
    // Usar consulta SQL directa para obtener estadísticas por usuario
    let whereClause = '';
    const replacements: any = {};
    
    if (dateFilter.createdAt) {
      whereClause = 'WHERE d."createdAt" >= :startDate';
      replacements.startDate = dateFilter.createdAt[Op.gte];
      
      if (dateFilter.createdAt[Op.lte]) {
        whereClause += ' AND d."createdAt" <= :endDate';
        replacements.endDate = dateFilter.createdAt[Op.lte];
      }
    } else {
      whereClause = 'WHERE 1=1';
    }

    const userPerformanceQuery = await sequelize.query(`
      SELECT 
        u.id as "userId",
        u."firstName",
        u."lastName",
        u.email,
        COUNT(d.id)::integer as "totalDeals",
        COUNT(CASE WHEN d.stage IN ('won', 'closed won', 'cierre_ganado') THEN 1 END)::integer as "wonDeals",
        COALESCE(SUM(CASE WHEN d.stage IN ('won', 'closed won', 'cierre_ganado') THEN d.amount ELSE 0 END), 0)::numeric as "wonDealsValue"
      FROM users u
      INNER JOIN deals d ON u.id = d."ownerId"
      ${whereClause}
      GROUP BY u.id, u."firstName", u."lastName", u.email
      HAVING COUNT(d.id) > 0
      ORDER BY "wonDeals" DESC, "totalDeals" DESC
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    // Procesar estadísticas por usuario
    const userPerformance = (userPerformanceQuery as any[]).map((item: any) => {
      const totalDeals = parseInt(item.totalDeals) || 0;
      const wonDeals = parseInt(item.wonDeals) || 0;
      const wonDealsValue = parseFloat(item.wonDealsValue) || 0;
      const performance = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
      
      return {
        userId: item.userId,
        firstName: item.firstName || 'Sin nombre',
        lastName: item.lastName || '',
        email: item.email || '',
        totalDeals,
        wonDeals,
        wonDealsValue,
        performance: Math.round(performance * 100) / 100, // Redondear a 2 decimales
      };
    });

    // Estadísticas de pagos
    const totalPayments = await Payment.count({ where: dateFilter });
    const pendingPayments = await Payment.count({ 
      where: { ...dateFilter, status: 'pending' } 
    });
    const completedPayments = await Payment.count({ 
      where: { ...dateFilter, status: 'completed' } 
    });
    const failedPayments = await Payment.count({ 
      where: { ...dateFilter, status: 'failed' } 
    });
    
    const pendingAmount = await Payment.sum('amount', { 
      where: { ...dateFilter, status: 'pending' } 
    }) || 0;
    const completedAmount = await Payment.sum('amount', { 
      where: { ...dateFilter, status: 'completed' } 
    }) || 0;
    const failedAmount = await Payment.sum('amount', { 
      where: { ...dateFilter, status: 'failed' } 
    }) || 0;
    const totalRevenue = await Payment.sum('amount', { 
      where: { ...dateFilter, status: 'completed' } 
    }) || 0;

    // Ventas por mes basadas en deals ganados - Si hay filtro de fecha, usar ese rango, sino últimos 12 meses
    const monthlyPayments = [];
    
    if (dateFilter.createdAt && dateFilter.createdAt[Op.gte] && dateFilter.createdAt[Op.lte]) {
      const startDate = new Date(dateFilter.createdAt[Op.gte]);
      const endDate = new Date(dateFilter.createdAt[Op.lte]);
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
        const monthTotal = await Deal.sum('amount', {
          where: {
            stage: { [Op.in]: ['won', 'closed won', 'cierre_ganado'] },
            [Op.or]: [
              {
                closeDate: {
                  [Op.gte]: monthStart,
                  [Op.lt]: monthEnd
                }
              },
              {
                // Si no hay closeDate, usar updatedAt cuando el stage es ganado
                updatedAt: {
                  [Op.gte]: monthStart,
                  [Op.lt]: monthEnd
                },
                closeDate: null
              }
            ]
          }
        }) || 0;
        
        monthlyPayments.push({
          month: `${monthName} ${year}`,
          amount: Number(monthTotal),
        });
      } else {
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
          const monthTotal = await Deal.sum('amount', {
            where: {
              stage: { [Op.in]: ['won', 'closed won', 'cierre_ganado'] },
              [Op.or]: [
                {
                  closeDate: {
                    [Op.gte]: monthStart,
                    [Op.lt]: monthEnd
                  }
                },
                {
                  // Si no hay closeDate, usar updatedAt cuando el stage es ganado
                  updatedAt: {
                    [Op.gte]: monthStart,
                    [Op.lt]: monthEnd
                  },
                  closeDate: null
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
    } else {
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
        const monthTotal = await Deal.sum('amount', {
          where: {
            stage: { [Op.in]: ['won', 'closed won', 'cierre_ganado'] },
            [Op.or]: [
              {
                closeDate: {
                  [Op.gte]: monthStart,
                  [Op.lt]: monthEnd
                }
              },
              {
                // Si no hay closeDate, usar updatedAt cuando el stage es ganado
                updatedAt: {
                  [Op.gte]: monthStart,
                  [Op.lt]: monthEnd
                },
                closeDate: null
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

    // Leads convertidos (contactos que pasaron de lead a customer)
    const convertedLeads = await Contact.count({
      where: {
        lifecycleStage: { [Op.in]: ['customer', 'evangelist', 'cierre_ganado'] }
      }
    });
    const totalLeads = await Contact.count({
      where: {
        lifecycleStage: 'lead'
      }
    });

    // Tareas completadas vs nuevas
    // Usar valores correctos del enum: 'not started', 'in progress', 'completed', 'cancelled'
    let completedTasks = 0;
    let newTasks = 0;
    
    try {
      completedTasks = await Task.count({
        where: { ...dateFilter, status: 'completed' }
      });
      
      // Las tareas nuevas son las que están 'not started' o 'in progress'
      newTasks = await Task.count({
        where: {
          ...dateFilter,
          status: { [Op.in]: ['not started', 'in progress'] }
        }
      });
    } catch (error: any) {
      console.error('Error al contar tareas completadas/nuevas:', error);
      // Si falla, usar consulta SQL directa
      try {
        let whereClause = '';
        const replacements: any = {};
        
        if (dateFilter.createdAt) {
          whereClause = 'AND "createdAt" >= :startDate';
          replacements.startDate = dateFilter.createdAt[Op.gte];
          
          if (dateFilter.createdAt[Op.lte]) {
            whereClause += ' AND "createdAt" <= :endDate';
            replacements.endDate = dateFilter.createdAt[Op.lte];
          }
        }
        
        const completedResult = await sequelize.query(`
          SELECT COUNT(id)::integer as count
          FROM tasks
          WHERE status = 'completed' ${whereClause}
        `, {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        });
        
        const newResult = await sequelize.query(`
          SELECT COUNT(id)::integer as count
          FROM tasks
          WHERE status IN ('not started', 'in progress') ${whereClause}
        `, {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        });
        
        completedTasks = (completedResult[0] as any)?.count || 0;
        newTasks = (newResult[0] as any)?.count || 0;
      } catch (sqlError: any) {
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
    let formattedBudgets: any[] = [];
    try {
      // Verificar que el modelo MonthlyBudget esté disponible
      if (MonthlyBudget) {
        let budgets: any[] = [];
        if (dateFilter.createdAt && dateFilter.createdAt[Op.gte] && dateFilter.createdAt[Op.lte]) {
          const startDate = new Date(dateFilter.createdAt[Op.gte]);
          const endDate = new Date(dateFilter.createdAt[Op.lte]);
          const startYear = startDate.getFullYear();
          const endYear = endDate.getFullYear();
          const startMonth = startDate.getMonth();
          const endMonth = endDate.getMonth();

          budgets = await MonthlyBudget.findAll({
            where: {
              [Op.or]: [
                {
                  year: startYear,
                  month: { [Op.gte]: startMonth },
                },
                {
                  year: endYear,
                  month: { [Op.lte]: endMonth },
                },
                {
                  year: { [Op.gt]: startYear, [Op.lt]: endYear },
                },
              ],
            },
          });
        } else {
          // Sin filtro: obtener presupuestos de los últimos 12 meses
          const currentYear = new Date().getFullYear();
          budgets = await MonthlyBudget.findAll({
            where: {
              year: { [Op.gte]: currentYear - 1 },
            },
          });
        }

        // Formatear presupuestos para que coincidan con el formato de monthlyPayments
        formattedBudgets = budgets.map((budget: any) => {
          const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          const monthName = monthNames[budget.month] || 'ene';
          return {
            month: `${monthName} ${budget.year}`,
            amount: Number(budget.amount) || 0,
          };
        });
      }
    } catch (budgetError: any) {
      console.error('Error al obtener presupuestos (continuando sin ellos):', budgetError?.message || budgetError);
      // Continuar sin presupuestos si hay un error
      formattedBudgets = [];
    }

    // Agregar budgets a la respuesta
    responseData.payments.budgets = formattedBudgets;

    console.log('✅ Estadísticas enviadas correctamente');
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Error en endpoint /stats:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Guardar presupuesto mensual
router.post('/budget', async (req: AuthRequest, res) => {
  try {
    const { month, year, amount } = req.body;

    if (month === undefined || year === undefined || amount === undefined) {
      return res.status(400).json({ error: 'Mes, año y monto son requeridos' });
    }

    if (month < 0 || month > 11) {
      return res.status(400).json({ error: 'Mes debe estar entre 0 y 11' });
    }

    // Buscar o crear el presupuesto
    const [budget, created] = await MonthlyBudget.findOrCreate({
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
  } catch (error: any) {
    console.error('Error al guardar presupuesto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener presupuesto mensual
router.get('/budget', async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;

    if (month === undefined || year === undefined) {
      return res.status(400).json({ error: 'Mes y año son requeridos' });
    }

    const budget = await MonthlyBudget.findOne({
      where: {
        month: parseInt(month as string),
        year: parseInt(year as string),
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
  } catch (error: any) {
    console.error('Error al obtener presupuesto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener actividades recientes
router.get('/recent-activities', async (req: AuthRequest, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentContacts = await Contact.findAll({
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
    });

    const recentDeals = await Deal.findAll({
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'amount', 'stage', 'createdAt'],
    });

    const recentTasks = await Task.findAll({
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'createdAt'],
    });

    res.json({
      contacts: recentContacts,
      deals: recentDeals,
      tasks: recentTasks,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;








