import express from 'express';
import { Op, Sequelize } from 'sequelize';
import { Contact } from '../models/Contact';
import { Deal } from '../models/Deal';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Función para calcular la semana del año (ISO 8601)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

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
    const result = stages.map(stage => ({
      stage: stage.value,
      label: stage.label,
      percentage: stage.percentage,
      counts: targetWeeks.map(week => contactCounts[stage.value][week] || 0),
      values: targetWeeks.map(week => contactValues[stage.value][week] || 0),
    }));

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




