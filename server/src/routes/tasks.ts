import express from 'express';
import { Op } from 'sequelize';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createTaskEvent, updateTaskEvent, deleteTaskEvent, createMeetingEvent, deleteCalendarEvent } from '../services/googleCalendar';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las tareas
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, status, priority, assignedToId, type, contactId, companyId } = req.query;
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
    if (contactId) {
      where.contactId = contactId;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    const tasks = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
        { model: Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
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
    console.error('❌ Error al obtener tareas:', error);
    console.error('Stack:', error.stack);
    // Si el error es por columna faltante, intentar sin filtros de status/priority
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist'))) {
      console.warn('⚠️  Columna faltante detectada, intentando sin filtros de status/priority...');
      try {
        const { assignedToId: fallbackAssignedToId, contactId: fallbackContactId, companyId: fallbackCompanyId } = req.query;
        const simpleWhere: any = {};
        if (fallbackAssignedToId) simpleWhere.assignedToId = fallbackAssignedToId;
        if (fallbackContactId) simpleWhere.contactId = fallbackContactId;
        if (fallbackCompanyId) simpleWhere.companyId = fallbackCompanyId;
        
        const tasks = await Task.findAndCountAll({
          where: simpleWhere,
          include: [
            { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
            { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
            { model: Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
          ],
          limit: Number(limit),
          offset,
          order: [['createdAt', 'DESC']],
        });
        
        return res.json({
          tasks: tasks.rows,
          total: tasks.count,
          page: Number(page),
          totalPages: Math.ceil(tasks.count / Number(limit)),
        });
      } catch (fallbackError: any) {
        console.error('❌ Error en fallback:', fallbackError);
      }
    }
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

    // Intentar crear en Google Calendar si la tarea tiene fecha límite
    if (newTask && newTask.dueDate) {
      try {
        let calendarId: string | null = null;
        
        // Si es una reunión, crear evento en Google Calendar
        if (newTask.type === 'meeting') {
          calendarId = await createMeetingEvent(newTask, newTask.AssignedTo);
        } else {
          // Para otros tipos, crear tarea en Google Tasks
          calendarId = await createTaskEvent(newTask, newTask.AssignedTo);
        }
        
        if (calendarId) {
          // Actualizar la tarea con el ID del evento/tarea de Google Calendar
          await newTask.update({ googleCalendarEventId: calendarId });
          // Recargar para incluir el campo actualizado
          await newTask.reload();
        }
      } catch (calendarError: any) {
        // No fallar la creación de la tarea si hay error con Google Calendar
        console.error('Error creando en Google Calendar:', calendarError.message);
      }
    }

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar tarea
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const hadEventId = !!task.googleCalendarEventId;
    const hadDueDate = !!task.dueDate;
    const willHaveDueDate = !!req.body.dueDate;

    await task.update(req.body);
    await task.reload({
      include: [
        { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Contact, as: 'Contact' },
        { model: Company, as: 'Company' },
        { model: Deal, as: 'Deal' },
      ],
    });

    // Actualizar o crear en Google Calendar
    if (task.dueDate) {
      try {
        if (task.googleCalendarEventId) {
          // Si es una reunión, actualizar evento (por ahora solo actualizamos tareas)
          // Las reuniones como eventos necesitarían una función updateMeetingEvent
          if (task.type !== 'meeting') {
            await updateTaskEvent(task, task.googleCalendarEventId);
          }
        } else {
          // Crear nuevo evento/tarea si no existía
          let calendarId: string | null = null;
          
          if (task.type === 'meeting') {
            calendarId = await createMeetingEvent(task, task.AssignedTo);
          } else {
            calendarId = await createTaskEvent(task, task.AssignedTo);
          }
          
          if (calendarId) {
            await task.update({ googleCalendarEventId: calendarId });
            await task.reload();
          }
        }
      } catch (calendarError: any) {
        console.error('Error actualizando en Google Calendar:', calendarError.message);
      }
    } else if (hadDueDate && !willHaveDueDate && task.googleCalendarEventId) {
      // Si se eliminó la fecha límite y había un evento/tarea, eliminarlo
      try {
        const userId = task.assignedToId || task.createdById;
        // Si es una reunión, eliminar evento de Google Calendar, sino eliminar tarea de Google Tasks
        if (task.type === 'meeting') {
          await deleteCalendarEvent(userId, task.googleCalendarEventId);
        } else {
          await deleteTaskEvent(userId, task.googleCalendarEventId);
        }
        await task.update({ googleCalendarEventId: null });
        await task.reload();
      } catch (calendarError: any) {
        console.error('Error eliminando de Google Calendar:', calendarError.message);
      }
    }

    res.json(task);
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

    // Eliminar tarea de Google Tasks si existe
    if (task.googleCalendarEventId) {
      try {
        const userId = task.assignedToId || task.createdById;
        await deleteTaskEvent(userId, task.googleCalendarEventId);
      } catch (calendarError: any) {
        console.error('Error eliminando tarea de Google Tasks:', calendarError.message);
        // Continuar con la eliminación de la tarea aunque falle la eliminación en Google Tasks
      }
    }

    await task.destroy();
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;








