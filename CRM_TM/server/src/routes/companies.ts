import express from 'express';
import { Op } from 'sequelize';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Obtener todas las empresas
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50, search, lifecycleStage, ownerId, industry } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { domain: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (lifecycleStage) {
      where.lifecycleStage = lifecycleStage;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }
    if (industry) {
      where.industry = industry;
    }

    const companies = await Company.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      companies: companies.rows,
      total: companies.count,
      page: Number(page),
      totalPages: Math.ceil(companies.count / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear empresa
router.post('/', async (req: AuthRequest, res) => {
  try {
    const companyData = {
      ...req.body,
      ownerId: req.body.ownerId || req.userId,
    };

    const company = await Company.create(companyData);
    const newCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json(newCompany);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    await company.update(req.body);
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json(updatedCompany);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar empresa
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    await company.destroy();
    res.json({ message: 'Empresa eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





