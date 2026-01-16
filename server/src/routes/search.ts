import express from 'express';
import { Op } from 'sequelize';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Búsqueda global
router.get('/global', async (req: AuthRequest, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({
        contacts: [],
        companies: [],
        deals: [],
        tasks: [],
      });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(Number(limit) || 10, 20); // Máximo 20 resultados por tipo

    // Búsqueda en contactos
    const contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } },
          { phone: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
      ],
      limit: searchLimit,
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'lifecycleStage'],
    });

    // Búsqueda en empresas
    const companies = await Company.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { domain: { [Op.iLike]: `%${searchTerm}%` } },
          { companyname: { [Op.iLike]: `%${searchTerm}%` } },
          { phone: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
      limit: searchLimit,
      attributes: ['id', 'name', 'domain', 'companyname', 'phone', 'lifecycleStage'],
    });

    // Búsqueda en negocios
    const deals = await Deal.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
      limit: searchLimit,
      attributes: ['id', 'name', 'amount', 'stage'],
    });

    // Búsqueda en tareas
    const tasks = await Task.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
      limit: searchLimit,
      attributes: ['id', 'title', 'description', 'status', 'priority', 'dueDate'],
    });

    res.json({
      contacts: contacts.map(c => ({
        id: c.id,
        type: 'contact',
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.email || c.phone || 'Sin información',
        company: c.Company?.name,
        stage: c.lifecycleStage,
        url: `/contacts/${c.id}`,
      })),
      companies: companies.map(c => ({
        id: c.id,
        type: 'company',
        title: c.name,
        subtitle: c.companyname || c.domain || 'Sin información',
        owner: c.Owner ? `${c.Owner.firstName} ${c.Owner.lastName}` : null,
        stage: c.lifecycleStage,
        url: `/companies/${c.id}`,
      })),
      deals: deals.map(d => ({
        id: d.id,
        type: 'deal',
        title: d.name,
        subtitle: d.Contact ? `${d.Contact.firstName} ${d.Contact.lastName}` : d.Company?.name || 'Sin información',
        amount: d.amount,
        stage: d.stage,
        url: `/deals/${d.id}`, // Navegar a la página de detalle del negocio
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: t.description || 'Sin descripción',
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        url: `/tasks`,
      })),
    });
  } catch (error: any) {
    console.error('Error en búsqueda global:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

