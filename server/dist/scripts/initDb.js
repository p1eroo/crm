"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function initDatabase() {
    try {
        // Sincronizar modelos con la base de datos
        await database_1.sequelize.sync({ alter: true });
        console.log('Base de datos sincronizada correctamente.');
        // Asegurar que existan los roles
        const roles = await Role_1.Role.findAll();
        if (roles.length === 0) {
            await Role_1.Role.bulkCreate([
                { name: 'admin', description: 'Administrador del sistema' },
                { name: 'user', description: 'Usuario estándar' },
                { name: 'manager', description: 'Gerente' },
                { name: 'jefe_comercial', description: 'Jefe Comercial' },
            ]);
            console.log('Roles por defecto creados.');
        }
        // Crear usuario admin por defecto si no existe
        const adminExists = await User_1.User.findOne({ where: { usuario: 'admin' } });
        if (!adminExists) {
            const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
            if (!adminRole) {
                throw new Error('No se pudo encontrar el rol de administrador');
            }
            const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
            await User_1.User.create({
                usuario: 'admin',
                email: 'admin@crm.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                roleId: adminRole.id,
            });
            console.log('Usuario admin creado: usuario=admin / contraseña=admin123');
        }
        console.log('Base de datos inicializada correctamente.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        process.exit(1);
    }
}
initDatabase();
