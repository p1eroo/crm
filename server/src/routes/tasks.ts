import express from 'express';
import { Op } from 'sequelize';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las tareas
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, status, priority, assignedToId, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    if (type) {
      where.type = type;
    }

    const tasks = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'Company', attributes: ['id', 'name'] },
        { model: Deal, as: 'Deal', attributes: ['id', 'name'] },
      ],
      limit: Number(limit),
      offset,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({
      tasks: tasks.rows,
      total: tasks.count,
      page: Number(page),
      totalPages: Math.ceil(tasks.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una tarea por ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'AssignedTo' },
        { model: User, as: 'CreatedBy' },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear tarea
router.post('/', async (req: AuthRequest, res) => {
  try {
    const taskData = {
      ...req.body,
      createdById: req.userId,
      assignedToId: req.body.assignedToId || req.userId,
    };

    const task = await Task.create(taskData);
    const newTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar tarea
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    await task.update(req.body);
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar tarea
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    await task.destroy();
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;








