import express, { Response } from 'express';
import { Op } from 'sequelize';
import { SystemLog } from '../models/SystemLog';
import { User } from '../models/User';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('admin')); // Solo admin puede ver logs

// Listar logs con paginación
router.get('/', apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const where: any = {};

    // Filtros opcionales
    if (req.query.action) {
      where.action = { [Op.iLike]: `%${req.query.action}%` };
    }
    if (req.query.entityType) {
      where.entityType = req.query.entityType;
    }
    if (req.query.userId) {
      where.userId = req.query.userId;
    }

    const { count, rows } = await SystemLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'usuario', 'email', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      logs: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
