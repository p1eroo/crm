"use strict";
// Script para asignar rol admin a un usuario
// Ejecutar con: ts-node src/scripts/assignAdminRole.ts jvaldivia
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
async function assignAdminRole(username) {
    try {
        console.log(`🔧 Asignando rol admin a usuario: ${username}\n`);
        // Conectar a la base de datos
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.\n');
        // Buscar el usuario
        const user = await User_1.User.findOne({
            where: { usuario: username },
            include: [{ model: Role_1.Role, as: 'Role' }],
        });
        if (!user) {
            console.error(`❌ Usuario '${username}' no encontrado`);
            await database_1.sequelize.close();
            process.exit(1);
        }
        console.log(`👤 Usuario encontrado: ${user.usuario}`);
        console.log(`   Rol actual: ${user.Role?.name || 'sin rol'}`);
        console.log(`   RoleId actual: ${user.roleId || 'null'}\n`);
        // Buscar el rol admin
        const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            console.error('❌ Rol admin no encontrado. Ejecuta primero: npm run init-roles');
            await database_1.sequelize.close();
            process.exit(1);
        }
        console.log(`✅ Rol admin encontrado (ID: ${adminRole.id})\n`);
        // Asignar el rol admin
        await user.update({ roleId: adminRole.id });
        await user.reload({ include: [{ model: Role_1.Role, as: 'Role' }] });
        console.log(`✅ Rol admin asignado correctamente`);
        console.log(`   Nuevo rol: ${user.Role?.name}`);
        console.log(`   Nuevo RoleId: ${user.roleId}\n`);
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
// Obtener el nombre de usuario de los argumentos de línea de comandos
const username = process.argv[2];
if (!username) {
    console.error('❌ Debes proporcionar el nombre de usuario');
    console.log('Uso: ts-node src/scripts/assignAdminRole.ts <nombre_usuario>');
    process.exit(1);
}
assignAdminRole(username);
