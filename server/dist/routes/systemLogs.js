"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const SystemLog_1 = require("../models/SystemLog");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)('admin')); // Solo admin puede ver logs
// Listar logs con paginación
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const where = {};
        // Filtros opcionales
        if (req.query.action) {
            where.action = { [sequelize_1.Op.iLike]: `%${req.query.action}%` };
        }
        if (req.query.entityType) {
            where.entityType = req.query.entityType;
        }
        if (req.query.userId) {
            where.userId = req.query.userId;
        }
        const { count, rows } = await SystemLog_1.SystemLog.findAndCountAll({
            where,
            include: [
                {
                    model: User_1.User,
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
