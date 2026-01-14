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

// Función para limpiar tareas eliminando campos null y objetos relacionados null
const cleanTask = (task: any): any => {
  const taskData = task.toJSON ? task.toJSON() : task;
  const cleaned: any = {
    id: taskData.id,
    title: taskData.title,
    type: taskData.type,
    status: taskData.status,
    priority: taskData.priority,
    assignedToId: taskData.assignedToId,
    createdById: taskData.createdById,
    createdAt: taskData.createdAt,
    updatedAt: taskData.updatedAt,
  };

  // Solo incluir campos opcionales si no son null
  if (taskData.description != null) cleaned.description = taskData.description;
  if (taskData.dueDate != null) cleaned.dueDate = taskData.dueDate;
  if (taskData.contactId != null) cleaned.contactId = taskData.contactId;
  if (taskData.companyId != null) cleaned.companyId = taskData.companyId;
  if (taskData.dealId != null) cleaned.dealId = taskData.dealId;
  if (taskData.googleCalendarEventId != null) cleaned.googleCalendarEventId = taskData.googleCalendarEventId;

  // Solo incluir relaciones si existen
  if (taskData.AssignedTo) cleaned.AssignedTo = taskData.AssignedTo;
  if (taskData.CreatedBy) cleaned.CreatedBy = taskData.CreatedBy;
  if (taskData.Contact) cleaned.Contact = taskData.Contact;
  if (taskData.Company) cleaned.Company = taskData.Company;
  if (taskData.Deal) cleaned.Deal = taskData.Deal;

  return cleaned;
};

// Obtener todas las tareas
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = 1, 
      limit: limitParam = 50, 
      status, 
      priority, 
      assignedToId, 
      type, 
      contactId, 
      companyId, 
      dealId,
      search,
      sortBy = 'newest', // newest, oldest, name, nameDesc, dueDate
      // Filtros por columna
      filterTitulo,
      filterEstado,
      filterPrioridad,
    } = req.query;
    
    // Limitar el tamaño máximo de página para evitar sobrecarga
    const maxLimit = 100;
    const requestedLimit = Number(limitParam);
    const limit = requestedLimit > maxLimit ? maxLimit : (requestedLimit < 1 ? 50 : requestedLimit);
    const pageNum = Number(page) < 1 ? 1 : Number(page);
    const offset = (pageNum - 1) * limit;

    const where: any = {};
    
    // Búsqueda general
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    
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
    if (dealId) {
      where.dealId = dealId;
    }
    
    // Filtros por columna
    if (filterTitulo) {
      if (where.title) {
        where.title = { [Op.and]: [
          where.title,
          { [Op.iLike]: `%${filterTitulo}%` }
        ]};
      } else {
        where.title = { [Op.iLike]: `%${filterTitulo}%` };
      }
    }
    
    if (filterEstado) {
      if (where.status) {
        // Si ya existe filtro por status, verificar si coincide
        if (String(where.status).toLowerCase() !== filterEstado.toLowerCase()) {
          where.status = { [Op.in]: [] }; // No hay coincidencias
        }
      } else {
        where.status = { [Op.iLike]: `%${filterEstado}%` };
      }
    }
    
    if (filterPrioridad) {
      if (where.priority) {
        // Si ya existe filtro por priority, verificar si coincide
        if (String(where.priority).toLowerCase() !== filterPrioridad.toLowerCase()) {
          where.priority = { [Op.in]: [] }; // No hay coincidencias
        }
      } else {
        where.priority = { [Op.iLike]: `%${filterPrioridad}%` };
      }
    }
    
    // Ordenamiento
    let order: [string, string][] = [['dueDate', 'ASC'], ['createdAt', 'DESC']];
    switch (sortBy) {
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'name':
        order = [['title', 'ASC']];
        break;
      case 'nameDesc':
        order = [['title', 'DESC']];
        break;
      case 'dueDate':
        order = [['dueDate', 'ASC'], ['createdAt', 'DESC']];
        break;
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
      distinct: true, // Importante para contar correctamente con includes
      limit,
      offset,
      order,
    });

    res.json({
      tasks: tasks.rows.map(cleanTask),
      total: tasks.count,
      page: pageNum,
      limit,
      totalPages: Math.ceil(tasks.count / limit),
    });
  } catch (error: any) {
    console.error('❌ Error al obtener tareas:', error);
    console.error('Stack:', error.stack);
    // Si el error es por columna faltante, intentar sin filtros de status/priority
    if (error.message && (error.message.includes('no existe la columna') || error.message.includes('does not exist'))) {
      console.warn('⚠️  Columna faltante detectada, intentando sin filtros de status/priority...');
      try {
        const { assignedToId: fallbackAssignedToId, contactId: fallbackContactId, companyId: fallbackCompanyId, dealId: fallbackDealId, page: fallbackPage = 1, limit: fallbackLimit = 50 } = req.query;
        const fallbackOffset = (Number(fallbackPage) - 1) * Number(fallbackLimit);
        const simpleWhere: any = {};
        if (fallbackAssignedToId) simpleWhere.assignedToId = fallbackAssignedToId;
        if (fallbackContactId) simpleWhere.contactId = fallbackContactId;
        if (fallbackCompanyId) simpleWhere.companyId = fallbackCompanyId;
        if (fallbackDealId) simpleWhere.dealId = fallbackDealId;
        
        const tasks = await Task.findAndCountAll({
          where: simpleWhere,
          include: [
            { model: User, as: 'AssignedTo', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: User, as: 'CreatedBy', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: Contact, as: 'Contact', attributes: ['id', 'firstName', 'lastName'], required: false },
            { model: Company, as: 'Company', attributes: ['id', 'name'], required: false },
            { model: Deal, as: 'Deal', attributes: ['id', 'name'], required: false },
          ],
          limit: Number(fallbackLimit),
          offset: fallbackOffset,
          order: [['createdAt', 'DESC']],
        });
        
        return res.json({
          tasks: tasks.rows.map(cleanTask),
          total: tasks.count,
          page: Number(fallbackPage),
          totalPages: Math.ceil(tasks.count / Number(fallbackLimit)),
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

    res.json(cleanTask(task));
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

    res.status(201).json(cleanTask(newTask));
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
        await task.update({ googleCalendarEventId: undefined });
        await task.reload();
      } catch (calendarError: any) {
        console.error('Error eliminando de Google Calendar:', calendarError.message);
      }
    }

    res.json(cleanTask(task));
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








