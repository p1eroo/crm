"use strict";
// Script para verificar y corregir el rol de un usuario
// Ejecutar con: ts-node src/scripts/checkUserRole.ts
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
async function checkUserRole() {
    try {
        console.log('🔍 Verificando usuarios y roles...\n');
        // Conectar a la base de datos
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.\n');
        // Obtener todos los usuarios con sus roles
        const users = await User_1.User.findAll({
            include: [{ model: Role_1.Role, as: 'Role' }],
            order: [['usuario', 'ASC']],
        });
        console.log(`📊 Total de usuarios: ${users.length}\n`);
        for (const user of users) {
            const roleName = user.Role?.name || 'sin rol';
            console.log(`👤 Usuario: ${user.usuario}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Rol: ${roleName}`);
            console.log(`   RoleId: ${user.roleId || 'null'}`);
            console.log(`   Activo: ${user.isActive ? 'Sí' : 'No'}`);
            console.log('');
        }
        // Buscar usuarios admin
        const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
        if (adminRole) {
            const adminUsers = await User_1.User.findAll({
                where: { roleId: adminRole.id },
                include: [{ model: Role_1.Role, as: 'Role' }],
            });
            console.log(`\n👑 Usuarios con rol admin: ${adminUsers.length}`);
            adminUsers.forEach(admin => {
                console.log(`   - ${admin.usuario} (${admin.email})`);
            });
        }
        await database_1.sequelize.close();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await database_1.sequelize.close();
        process.exit(1);
    }
}
checkUserRole();
