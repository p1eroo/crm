import express from 'express';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import { Contact } from '../models/Contact';
import { Deal } from '../models/Deal';
import { Company } from '../models/Company';
import { Activity } from '../models/Activity';
import { Task } from '../models/Task';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Empresas por etapa, agrupadas por asesor (ownerId). Solo usuarios con rol "user".
// Query params opcionales: userId, leadSource, period (day|week|month|year = últimas 24h, 7d, 30d, 365d).
router.get('/companies-by-user', async (req: AuthRequest, res) => {
  try {
    const userId = req.query.userId != null ? Number(req.query.userId) : null;
    const leadSourceParam = req.query.leadSource as string | undefined;
    const periodParam = req.query.period as string | undefined;

    let leadSourceCondition = '';
    const replacements: Record<string, unknown> = {};
    if (leadSourceParam !== undefined && leadSourceParam !== null) {
      if (leadSourceParam === '' || leadSourceParam === '__null__') {
        leadSourceCondition = ' AND c."leadSource" IS NULL';
      } else {
        leadSourceCondition = ' AND c."leadSource" IS NOT NULL AND c."leadSource" ILIKE :leadSource';
        replacements.leadSource = leadSourceParam;
      }
    }
    let userIdCondition = '';
    if (userId != null && !Number.isNaN(userId)) {
      userIdCondition = ' AND c."ownerId" = :userId';
      replacements.userId = userId;
    }
    let periodCondition = '';
    if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year') {
      const now = new Date();
      let fromDate: Date;
      if (periodParam === 'day') {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (periodParam === 'week') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (periodParam === 'month') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
      periodCondition = ' AND c."createdAt" >= :fromDate';
      replacements.fromDate = fromDate.toISOString();
    }

    const results = await Company.sequelize!.query(`
      SELECT c."ownerId" as "userId", c."lifecycleStage" as stage, COUNT(c.id)::integer as count
      FROM companies c
      INNER JOIN users u ON u.id = c."ownerId"
      INNER JOIN roles r ON r.id = u."roleId"
      WHERE r.name = 'user' AND c."ownerId" IS NOT NULL
      ${userIdCondition}
      ${leadSourceCondition}
      ${periodCondition}
      GROUP BY c."ownerId", c."lifecycleStage"
      ORDER BY c."ownerId", c."lifecycleStage"
    `, { replacements: Object.keys(replacements).length ? replacements : undefined, type: QueryTypes.SELECT }) as Array<{ userId: number; stage: string; count: number }>;

    const byUser: Record<number, Array<{ stage: string; count: number }>> = {};
    (results || []).forEach((row) => {
      const uid = row.userId;
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push({ stage: row.stage || 'lead', count: row.count || 0 });
    });

    res.json({ byUser });
  } catch (error: any) {
    console.error('Error en /reports/companies-by-user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar empresas por etapa (mismos filtros que companies-by-user). Query: stage, userId, leadSource, period, page, limit.
router.get('/companies-list', async (req: AuthRequest, res) => {
  try {
    const stageParam = req.query.stage as string;
    if (!stageParam || typeof stageParam !== 'string') {
      return res.status(400).json({ error: 'Falta el parámetro stage' });
    }
    const userId = req.query.userId != null ? Number(req.query.userId) : null;
    const leadSourceParam = req.query.leadSource as string | undefined;
    const periodParam = req.query.period as string | undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const offset = (page - 1) * limit;

    let leadSourceCondition = '';
    const replacements: Record<string, unknown> = {
      stage: stageParam.trim().toLowerCase(),
      limit,
      offset,
    };
    if (leadSourceParam !== undefined && leadSourceParam !== null) {
      if (leadSourceParam === '' || leadSourceParam === '__null__') {
        leadSourceCondition = ' AND c."leadSource" IS NULL';
      } else {
        leadSourceCondition = ' AND c."leadSource" IS NOT NULL AND c."leadSource" ILIKE :leadSource';
        replacements.leadSource = leadSourceParam;
      }
    }
    let userIdCondition = '';
    if (userId != null && !Number.isNaN(userId)) {
      userIdCondition = ' AND c."ownerId" = :userId';
      replacements.userId = userId;
    }
    let periodCondition = '';
    if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year') {
      const now = new Date();
      let fromDate: Date;
      if (periodParam === 'day') fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (periodParam === 'week') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (periodParam === 'month') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      periodCondition = ' AND c."createdAt" >= :fromDate';
      replacements.fromDate = fromDate.toISOString();
    }

    const countResult = await Company.sequelize!.query(`
      SELECT COUNT(c.id)::integer as total
      FROM companies c
      INNER JOIN users u ON u.id = c."ownerId"
      INNER JOIN roles r ON r.id = u."roleId"
      WHERE r.name = 'user' AND c."ownerId" IS NOT NULL AND c."lifecycleStage" = :stage
      ${userIdCondition}
      ${leadSourceCondition}
      ${periodCondition}
    `, { replacements, type: QueryTypes.SELECT }) as Array<{ total: number }>;
    const total = (countResult && countResult[0] && countResult[0].total != null) ? countResult[0].total : 0;

    const rows = await Company.sequelize!.query(`
      SELECT c.id, c.name, c."companyname", c."lifecycleStage", c."ownerId", c."estimatedRevenue"
      FROM companies c
      INNER JOIN users u ON u.id = c."ownerId"
      INNER JOIN roles r ON r.id = u."roleId"
      WHERE r.name = 'user' AND c."ownerId" IS NOT NULL AND c."lifecycleStage" = :stage
      ${userIdCondition}
      ${leadSourceCondition}
      ${periodCondition}
      ORDER BY c.name ASC
      LIMIT :limit OFFSET :offset
    `, { replacements, type: QueryTypes.SELECT }) as Array<{ id: number; name: string; companyname: string | null; lifecycleStage: string; ownerId: number | null; estimatedRevenue: number | null }>;

    res.json({
      companies: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error en /reports/companies-list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conteo de actividades por tipo. Query params opcionales: userId (asesor), period (day|week|month|year).
router.get('/activities-by-type', async (req: AuthRequest, res) => {
  try {
    const userId = req.query.userId != null ? Number(req.query.userId) : null;
    const periodParam = req.query.period as string | undefined;
    const replacements: Record<string, unknown> = {};
    let userIdCondition = '';
    if (userId != null && !Number.isNaN(userId)) {
      userIdCondition = ' AND a."userId" = :userId';
      replacements.userId = userId;
    }
    let periodCondition = '';
    if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year') {
      const now = new Date();
      let fromDate: Date;
      if (periodParam === 'day') {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (periodParam === 'week') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (periodParam === 'month') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
      periodCondition = ' AND a."createdAt" >= :fromDate';
      replacements.fromDate = fromDate.toISOString();
    }

    const results = await Activity.sequelize!.query(`
      SELECT a.type as type, COUNT(a.id)::integer as count
      FROM activities a
      WHERE 1=1
      ${userIdCondition}
      ${periodCondition}
      GROUP BY a.type
      ORDER BY a.type
    `, { replacements: Object.keys(replacements).length ? replacements : undefined, type: QueryTypes.SELECT }) as Array<{ type: string; count: number }>;

    const byType: Record<string, number> = {};
    (results || []).forEach((row) => {
      byType[row.type] = row.count || 0;
    });

    // Incluir tareas de la tabla tasks (mismo asesor = assignedToId, mismo período = createdAt)
    const taskUserIdCondition = userId != null && !Number.isNaN(userId)
      ? ' AND t."assignedToId" = :taskUserId'
      : '';
    const taskPeriodCondition = periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year'
      ? ' AND t."createdAt" >= :taskFromDate'
      : '';
    const taskReplacements: Record<string, unknown> = {};
    if (userId != null && !Number.isNaN(userId)) taskReplacements.taskUserId = userId;
    if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year') {
      const now = new Date();
      let fromDate: Date;
      if (periodParam === 'day') fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (periodParam === 'week') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (periodParam === 'month') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      taskReplacements.taskFromDate = fromDate.toISOString();
    }
    const taskCountResult = await Task.sequelize!.query(`
      SELECT COUNT(t.id)::integer as count
      FROM tasks t
      WHERE 1=1
      ${taskUserIdCondition}
      ${taskPeriodCondition}
    `, { replacements: Object.keys(taskReplacements).length ? taskReplacements : undefined, type: QueryTypes.SELECT }) as Array<{ count: number }>;
    const taskCount = (taskCountResult && taskCountResult[0] && taskCountResult[0].count) ? taskCountResult[0].count : 0;
    byType['task'] = (byType['task'] || 0) + taskCount;

    res.json({ byType });
  } catch (error: any) {
    console.error('Error en /reports/activities-by-type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar empresas, contactos y negocios vinculados a un tipo de actividad. Query: activityType (call|email|meeting|note|task), userId, period, page, limit.
router.get('/activities-entities-list', async (req: AuthRequest, res) => {
  try {
    const activityTypeParam = (req.query.activityType as string)?.trim()?.toLowerCase();
    const validTypes = ['call', 'email', 'meeting', 'note', 'task'];
    if (!activityTypeParam || !validTypes.includes(activityTypeParam)) {
      return res.status(400).json({ error: 'Falta o es inválido el parámetro activityType (call|email|meeting|note|task)' });
    }
    const userId = req.query.userId != null ? Number(req.query.userId) : null;
    const periodParam = req.query.period as string | undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const offset = (page - 1) * limit;

    const replacements: Record<string, unknown> = { limit, offset };
    let userIdCondition = '';
    if (userId != null && !Number.isNaN(userId)) {
      userIdCondition = ' AND a."userId" = :userId';
      replacements.userId = userId;
    }
    let periodCondition = '';
    if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year') {
      const now = new Date();
      let fromDate: Date;
      if (periodParam === 'day') fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (periodParam === 'week') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (periodParam === 'month') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      periodCondition = ' AND a."createdAt" >= :fromDate';
      replacements.fromDate = fromDate.toISOString();
    }

    type Row = { entityType: string; id: number };
    const rows: Row[] = [];

    if (activityTypeParam === 'task') {
      const taskUserIdCondition = userId != null && !Number.isNaN(userId) ? ' AND t."assignedToId" = :taskUserId' : '';
      const taskPeriodCondition = periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year' ? ' AND t."createdAt" >= :taskFromDate' : '';
      const taskRepl: Record<string, unknown> = {};
      if (userId != null && !Number.isNaN(userId)) taskRepl.taskUserId = userId;
      if (periodParam === 'day' || periodParam === 'week' || periodParam === 'month' || periodParam === 'year') {
        const now = new Date();
        let fromDate: Date;
        if (periodParam === 'day') fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        else if (periodParam === 'week') fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (periodParam === 'month') fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        else fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        taskRepl.taskFromDate = fromDate.toISOString();
      }
      const companyRows = await Task.sequelize!.query(`
        SELECT 'company' as "entityType", t."companyId" as id FROM tasks t WHERE t."companyId" IS NOT NULL ${taskUserIdCondition} ${taskPeriodCondition}
        UNION
        SELECT 'contact', t."contactId" FROM tasks t WHERE t."contactId" IS NOT NULL ${taskUserIdCondition} ${taskPeriodCondition}
        UNION
        SELECT 'deal', t."dealId" FROM tasks t WHERE t."dealId" IS NOT NULL ${taskUserIdCondition} ${taskPeriodCondition}
      `, { replacements: Object.keys(taskRepl).length ? taskRepl : undefined, type: QueryTypes.SELECT }) as Row[];
      const seen = new Set<string>();
      companyRows.forEach((r) => {
        const key = `${r.entityType}-${r.id}`;
        if (!seen.has(key)) { seen.add(key); rows.push(r); }
      });
    } else {
      replacements.activityType = activityTypeParam;
      const activityRows = await Activity.sequelize!.query(`
        SELECT 'company' as "entityType", a."companyId" as id FROM activities a WHERE a.type = :activityType AND a."companyId" IS NOT NULL ${userIdCondition} ${periodCondition}
        UNION
        SELECT 'contact', a."contactId" FROM activities a WHERE a.type = :activityType AND a."contactId" IS NOT NULL ${userIdCondition} ${periodCondition}
        UNION
        SELECT 'deal', a."dealId" FROM activities a WHERE a.type = :activityType AND a."dealId" IS NOT NULL ${userIdCondition} ${periodCondition}
      `, { replacements: Object.keys(replacements).length ? replacements : undefined, type: QueryTypes.SELECT }) as Row[];
      const seen = new Set<string>();
      activityRows.forEach((r) => {
        const key = `${r.entityType}-${r.id}`;
        if (!seen.has(key)) { seen.add(key); rows.push(r); }
      });
    }

    const total = rows.length;
    const byType: { company: number[]; contact: number[]; deal: number[] } = { company: [], contact: [], deal: [] };
    rows.forEach((r) => {
      if (r.entityType === 'company') byType.company.push(r.id);
      else if (r.entityType === 'contact') byType.contact.push(r.id);
      else if (r.entityType === 'deal') byType.deal.push(r.id);
    });

    const companies = byType.company.length ? await Company.findAll({ where: { id: byType.company }, attributes: ['id', 'name', 'companyname'] }) : [];
    const contacts = byType.contact.length ? await Contact.findAll({ where: { id: byType.contact }, attributes: ['id', 'firstName', 'lastName'] }) : [];
    const deals = byType.deal.length ? await Deal.findAll({ where: { id: byType.deal }, attributes: ['id', 'name'] }) : [];

    const nameById: Record<string, string> = {};
    companies.forEach((c) => { nameById[`company-${c.id}`] = (c.name || c.companyname || '—') as string; });
    contacts.forEach((c) => { nameById[`contact-${c.id}`] = `${(c.firstName || '').trim()} ${(c.lastName || '').trim()}`.trim() || '—'; });
    deals.forEach((d) => { nameById[`deal-${d.id}`] = d.name || '—'; });

    const items = rows
      .map((r) => ({ entityType: r.entityType as 'company' | 'contact' | 'deal', id: r.id, name: nameById[`${r.entityType}-${r.id}`] || '—' }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    const paginated = items.slice(offset, offset + limit);

    res.json({
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error en /reports/activities-entities-list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Negocios (deals) por etapa, agrupados por asesor (ownerId). Solo usuarios con rol "user".
router.get('/deals-by-user', async (req: AuthRequest, res) => {
  try {
    const results = await Deal.sequelize!.query(`
      SELECT d."ownerId" as "userId", d.stage as stage, COUNT(d.id)::integer as count
      FROM deals d
      INNER JOIN users u ON u.id = d."ownerId"
      INNER JOIN roles r ON r.id = u."roleId"
      WHERE r.name = 'user'
      GROUP BY d."ownerId", d.stage
      ORDER BY d."ownerId", d.stage
    `, { type: QueryTypes.SELECT }) as Array<{ userId: number; stage: string; count: number }>;

    const byUser: Record<number, Array<{ stage: string; count: number }>> = {};
    (results || []).forEach((row) => {
      const uid = row.userId;
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push({ stage: row.stage || 'lead', count: row.count || 0 });
    });

    res.json({ byUser });
  } catch (error: any) {
    console.error('Error en /reports/deals-by-user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función para calcular la semana del año (ISO 8601)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Devuelve lunes 00:00:00 y lunes siguiente 00:00:00 (exclusivo) para la semana ISO dada
function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayJan4 = jan4.getUTCDay() || 7; // 1 = lunes, 7 = domingo
  const mondayWeek1 = new Date(Date.UTC(year, 0, 4 - (dayJan4 - 1)));
  const start = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

// Movimiento semanal de empresas: nuevo ingreso, avance, retroceso, sin cambios (por semana ISO)
// Query: year, week (opcionales; por defecto semana actual), userId (opcional)
router.get('/companies-weekly-movement', async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const year = req.query.year != null ? Number(req.query.year) : now.getFullYear();
    const weekParam = req.query.week;
    const week = weekParam != null ? Number(weekParam) : getWeekNumber(now);
    const userId = req.query.userId != null ? Number(req.query.userId) : null;
    const { start: weekStart, end: weekEnd } = getWeekRange(year, week);

    const advanceStages = [
      'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion',
      'licitacion_etapa_final', 'firma_contrato', 'activo', 'cierre_ganado',
    ];
    const retroStages = ['cierre_perdido', 'cliente_perdido', 'lead_inactivo'];

    const baseWhere: Record<string, unknown> = {};
    if (userId != null && !Number.isNaN(userId)) {
      baseWhere.ownerId = userId;
    }

    const [nuevoIngreso, avance, retroceso, sinCambios] = await Promise.all([
      Company.count({
        where: {
          ...baseWhere,
          createdAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
        },
      }),
      Company.count({
        where: {
          ...baseWhere,
          createdAt: { [Op.lt]: weekStart },
          updatedAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
          lifecycleStage: { [Op.in]: advanceStages },
        },
      }),
      Company.count({
        where: {
          ...baseWhere,
          createdAt: { [Op.lt]: weekStart },
          updatedAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
          lifecycleStage: { [Op.in]: retroStages },
        },
      }),
      Company.count({
        where: {
          ...baseWhere,
          [Op.or]: [
            { createdAt: { [Op.lt]: weekStart }, updatedAt: { [Op.lt]: weekStart } },
            {
              createdAt: { [Op.lt]: weekStart },
              updatedAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
              lifecycleStage: { [Op.notIn]: [...advanceStages, ...retroStages] },
            },
          ],
        },
      }),
    ]);

    const total = nuevoIngreso + avance + retroceso + sinCambios;
    res.json({
      year,
      week,
      nuevoIngreso,
      avance,
      retroceso,
      sinCambios,
      total,
    });
  } catch (error: any) {
    console.error('Error en /reports/companies-weekly-movement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Movimiento semanal por varias semanas (para gráfico stacked bar por semana, números absolutos)
// Query: weeks (número de semanas hacia atrás, default 5), userId (opcional)
router.get('/companies-weekly-movement-range', async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    const numWeeks = Math.min(12, Math.max(1, parseInt(String(req.query.weeks), 10) || 5));
    const userId = req.query.userId != null ? Number(req.query.userId) : null;

    const advanceStages = [
      'reunion_efectiva', 'propuesta_economica', 'negociacion', 'licitacion',
      'licitacion_etapa_final', 'firma_contrato', 'activo', 'cierre_ganado',
    ];
    const retroStages = ['cierre_perdido', 'cliente_perdido', 'lead_inactivo'];

    const baseWhere: Record<string, unknown> = {};
    if (userId != null && !Number.isNaN(userId)) {
      baseWhere.ownerId = userId;
    }

    const rows: Array<{ year: number; week: number; nuevoIngreso: number; avance: number; retroceso: number; sinCambios: number }> = [];

    for (let i = numWeeks - 1; i >= 0; i--) {
      let w = currentWeek - i;
      let y = currentYear;
      if (w < 1) {
        w += 52;
        y -= 1;
      }
      const { start: weekStart, end: weekEnd } = getWeekRange(y, w);

      const [nuevoIngreso, avance, retroceso, sinCambios] = await Promise.all([
        Company.count({
          where: {
            ...baseWhere,
            createdAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
          },
        }),
        Company.count({
          where: {
            ...baseWhere,
            createdAt: { [Op.lt]: weekStart },
            updatedAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
            lifecycleStage: { [Op.in]: advanceStages },
          },
        }),
        Company.count({
          where: {
            ...baseWhere,
            createdAt: { [Op.lt]: weekStart },
            updatedAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
            lifecycleStage: { [Op.in]: retroStages },
          },
        }),
        Company.count({
          where: {
            ...baseWhere,
            [Op.or]: [
              { createdAt: { [Op.lt]: weekStart }, updatedAt: { [Op.lt]: weekStart } },
              {
                createdAt: { [Op.lt]: weekStart },
                updatedAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
                lifecycleStage: { [Op.notIn]: [...advanceStages, ...retroStages] },
              },
            ],
          },
        }),
      ]);

      rows.push({ year: y, week: w, nuevoIngreso, avance, retroceso, sinCambios });
    }

    res.json({ weeks: rows });
  } catch (error: any) {
    console.error('Error en /reports/companies-weekly-movement-range:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas por etapa y semana del año para un usuario
router.get('/user/:userId/stage-stats', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { weeks } = req.query; // Opcional: array de semanas, ej: "44,45,46,47"

    // Obtener semanas a mostrar (por defecto, últimas 4 semanas)
    let targetWeeks: number[] = [];
    if (weeks) {
      targetWeeks = (weeks as string).split(',').map(w => parseInt(w.trim()));
    } else {
      // Por defecto, últimas 4 semanas
      const currentWeek = getWeekNumber(new Date());
      for (let i = 3; i >= 0; i--) {
        targetWeeks.push(currentWeek - i);
      }
    }

    // Obtener contactos del usuario
    const contacts = await Contact.findAll({
      where: {
        ownerId: userId,
      },
      attributes: ['id', 'lifecycleStage', 'createdAt', 'updatedAt'],
    });

    // Obtener deals asociados a contactos del usuario
    const deals = await Deal.findAll({
      where: {
        ownerId: userId,
      },
      include: [
        {
          model: Contact,
          as: 'Contact',
          attributes: ['id', 'lifecycleStage'],
          required: false,
        },
      ],
      attributes: ['id', 'amount', 'contactId', 'createdAt', 'updatedAt'],
    });

    // Definir todas las etapas posibles con sus porcentajes
    const stages = [
      { value: 'lead', label: 'Lead', percentage: 0 },
      { value: 'contacto', label: 'Contacto', percentage: 10 },
      { value: 'reunion_agendada', label: 'Reunión Agendada', percentage: 30 },
      { value: 'reunion_efectiva', label: 'Reunión Efectiva', percentage: 40 },
      { value: 'propuesta_economica', label: 'Propuesta Económica', percentage: 50 },
      { value: 'negociacion', label: 'Negociación', percentage: 70 },
      { value: 'licitacion', label: 'Licitación', percentage: 75 },
      { value: 'licitacion_etapa_final', label: 'Licitación Etapa Final', percentage: 85 },
      { value: 'cierre_ganado', label: 'Cierre Ganado', percentage: 90 },
      { value: 'firma_contrato', label: 'Firma de Contrato', percentage: 95 },
      { value: 'activo', label: 'Activo', percentage: 100 },
      { value: 'cierre_perdido', label: 'Cierre Perdido', percentage: -1 },
      { value: 'lead_inactivo', label: 'Inactivo', percentage: -5 },
    ];

    // Inicializar estructuras de datos
    const contactCounts: { [stage: string]: { [week: number]: number } } = {};
    const contactValues: { [stage: string]: { [week: number]: number } } = {};

    stages.forEach(stage => {
      contactCounts[stage.value] = {};
      contactValues[stage.value] = {};
      targetWeeks.forEach(week => {
        contactCounts[stage.value][week] = 0;
        contactValues[stage.value][week] = 0;
      });
    });

    // Procesar contactos por semana
    contacts.forEach(contact => {
      const stage = contact.lifecycleStage || 'lead';
      // Usar updatedAt si está disponible, sino createdAt
      const date = contact.updatedAt || contact.createdAt;
      if (date) {
        const week = getWeekNumber(new Date(date));
        if (targetWeeks.includes(week) && contactCounts[stage]) {
          contactCounts[stage][week] = (contactCounts[stage][week] || 0) + 1;
        }
      }
    });

    // Procesar deals por semana y etapa del contacto asociado
    deals.forEach(deal => {
      const contact = deal.Contact;
      if (contact && contact.lifecycleStage) {
        const stage = contact.lifecycleStage;
        const amount = parseFloat(deal.amount?.toString() || '0');
        // Usar updatedAt si está disponible, sino createdAt
        const date = deal.updatedAt || deal.createdAt;
        if (date) {
          const week = getWeekNumber(new Date(date));
          if (targetWeeks.includes(week) && contactValues[stage]) {
            contactValues[stage][week] = (contactValues[stage][week] || 0) + amount;
          }
        }
      }
    });

    // Construir respuesta
    const result = stages.map(stage => {
      const counts = targetWeeks.map(week => contactCounts[stage.value][week] || 0);
      const values = targetWeeks.map(week => contactValues[stage.value][week] || 0);
      
      // Calcular totales sumando todos los valores de las semanas
      const totalCount = counts.reduce((sum, count) => sum + count, 0);
      const totalValue = values.reduce((sum, value) => sum + value, 0);
      
      return {
        stage: stage.value,
        label: stage.label,
        percentage: stage.percentage,
        counts: counts,
        values: values,
        totalCount: totalCount,
        totalValue: totalValue,
      };
    });

    res.json({
      weeks: targetWeeks,
      data: result,
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas por etapa:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;




