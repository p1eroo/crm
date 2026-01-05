import express from 'express';
import { Op } from 'sequelize';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las actividades
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, type, contactId, companyId, dealId, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (contactId) {
      where.contactId = contactId;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (dealId) {
      where.dealId = dealId;
    }
    if (userId) {
      where.userId = userId;
    }

    const activities = await Activity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
        { model: Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      activities: activities.rows,
      total: activities.count,
      page: Number(page),
      totalPages: Math.ceil(activities.count / Number(limit)),
    });
  } catch (error: any) {
    console.error('❌ Error al obtener actividades:', error);
    console.error('Stack:', error.stack);
    // Si el error es por columna faltante o problema de schema, devolver array vacío
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
      console.warn('⚠️  Error de schema detectado, devolviendo array vacío');
      return res.json({
        activities: [],
        total: 0,
        page: Number(req.query.page || 1),
        totalPages: 0,
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Helper function para crear actividad con includes
const createActivityWithIncludes = async (activity: Activity) => {
  return await Activity.findByPk(activity.id, {
    include: [
      { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Contact, as: 'Contact' },
      { model: Company, as: 'Company' },
      { model: Deal, as: 'Deal' },
    ],
  });
};

// Crear nota
router.post('/notes', async (req: AuthRequest, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.userId,
      type: 'note', // Tipo fijo para notas
    };

    const activity = await Activity.create(activityData);
    const newActivity = await createActivityWithIncludes(activity);

    res.status(201).json(newActivity);
  } catch (error: any) {
    console.error('❌ Error al crear nota:', error);
    console.error('Stack:', error.stack);
    
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
      console.error('⚠️  Error de schema detectado. Ejecuta: npm run create-activity-columns');
      return res.status(500).json({ 
        error: 'Error de configuración de base de datos. Por favor, contacta al administrador.',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Crear email
router.post('/emails', async (req: AuthRequest, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.userId,
      type: 'email', // Tipo fijo para emails
    };

    const activity = await Activity.create(activityData);
    const newActivity = await createActivityWithIncludes(activity);

    res.status(201).json(newActivity);
  } catch (error: any) {
    console.error('❌ Error al crear email:', error);
    console.error('Stack:', error.stack);
    
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
      console.error('⚠️  Error de schema detectado. Ejecuta: npm run create-activity-columns');
      return res.status(500).json({ 
        error: 'Error de configuración de base de datos. Por favor, contacta al administrador.',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Crear llamada
router.post('/calls', async (req: AuthRequest, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.userId,
      type: 'call', // Tipo fijo para llamadas
    };

    const activity = await Activity.create(activityData);
    const newActivity = await createActivityWithIncludes(activity);

    res.status(201).json(newActivity);
  } catch (error: any) {
    console.error('❌ Error al crear llamada:', error);
    console.error('Stack:', error.stack);
    
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
      console.error('⚠️  Error de schema detectado. Ejecuta: npm run create-activity-columns');
      return res.status(500).json({ 
        error: 'Error de configuración de base de datos. Por favor, contacta al administrador.',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Crear actividad (endpoint genérico - mantener para compatibilidad pero con validación)
router.post('/', async (req: AuthRequest, res) => {
  try {
    // Validar que el tipo esté presente y sea válido
    const validTypes = ['call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company'];
    if (!req.body.type || !validTypes.includes(req.body.type)) {
      return res.status(400).json({ 
        error: 'El campo "type" es requerido y debe ser uno de: ' + validTypes.join(', ')
      });
    }

    const activityData = {
      ...req.body,
      userId: req.userId,
      type: req.body.type,
    };

    const activity = await Activity.create(activityData);
    const newActivity = await createActivityWithIncludes(activity);

    res.status(201).json(newActivity);
  } catch (error: any) {
    console.error('❌ Error al crear actividad:', error);
    console.error('Stack:', error.stack);
    
    // Si el error es por columna faltante, dar un mensaje más claro
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist') || error.message.includes('column'))) {
      console.error('⚠️  Error de schema detectado. Ejecuta: npm run create-activity-columns');
      return res.status(500).json({ 
        error: 'Error de configuración de base de datos. Por favor, contacta al administrador.',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Obtener actividad por ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar actividad
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Verificar que el usuario sea el propietario o admin
    if (activity.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta actividad' });
    }

    await activity.update(req.body);
    const updatedActivity = await Activity.findByPk(activity.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.json(updatedActivity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar actividad
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Verificar que el usuario sea el propietario o admin
    if (activity.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });
    }

    await activity.destroy();
    res.status(200).json({ message: 'Actividad eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;




