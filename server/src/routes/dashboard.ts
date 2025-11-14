import express from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Campaign } from '../models/Campaign';
import { Payment } from '../models/Payment';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener estadísticas del dashboard
router.get('/stats', async (req: AuthRequest, res) => {
  try {
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

    // Estadísticas de tareas
    const totalTasks = await Task.count({ where: dateFilter });
    const tasksByStatus = await Task.findAll({
      attributes: [
        'status',
        [Task.sequelize!.fn('COUNT', Task.sequelize!.col('id')), 'count']
      ],
      where: dateFilter,
      group: ['status'],
      raw: true,
    });

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
        stage: 'won',
        createdAt: { [Op.gte]: currentMonthStart }
      }
    });

    const wonDealValue = await Deal.sum('amount', {
      where: {
        stage: 'won',
        createdAt: { [Op.gte]: currentMonthStart }
      }
    }) || 0;

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

    // Pagos por mes (últimos 12 meses)
    const monthlyPayments = [];
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
      
      const monthTotal = await Payment.sum('amount', {
        where: {
          status: 'completed',
          paymentDate: {
            [Op.gte]: monthStart,
            [Op.lt]: monthEnd
          }
        }
      }) || 0;
      
      monthlyPayments.push({
        month: `${monthName} ${year}`,
        amount: Number(monthTotal),
      });
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
    const completedTasks = await Task.count({
      where: { ...dateFilter, status: 'completed' }
    });
    const newTasks = await Task.count({
      where: {
        ...dateFilter,
        status: { [Op.in]: ['pending', 'in_progress'] }
      }
    });

    res.json({
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
    });
  } catch (error: any) {
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








