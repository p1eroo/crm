import express from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Campaign } from '../models/Campaign';
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
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
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





