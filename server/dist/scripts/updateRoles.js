"use strict";
// Script para actualizar roles de usuario
// Ejecutar con: npm run update-roles o ts-node src/scripts/updateRoles.ts
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Role_1 = require("../models/Role");
async function updateRoles() {
    try {
        console.log('Conectando a la base de datos...');
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.\n');
        // 1. Verificar que existan los roles necesarios
        console.log('Verificando roles en la base de datos...');
        const adminRole = await Role_1.Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            console.log('⚠ El rol "admin" no existe. Creando roles...');
            await Role_1.Role.bulkCreate([
                { name: 'admin', description: 'Administrador del sistema' },
                { name: 'user', description: 'Usuario estándar' },
                { name: 'manager', description: 'Gerente' },
                { name: 'jefe_comercial', description: 'Jefe Comercial' },
            ], { ignoreDuplicates: true });
            console.log('✓ Roles creados.\n');
        }
        else {
            console.log('✓ Roles verificados.\n');
        }
        // 2. Los roles de usuario deben asignarse desde la interfaz de administración
        // o mediante la base de datos. No se asignan roles automáticamente desde este script.
        console.log('Nota: Los roles deben asignarse manualmente desde la interfaz de administración.');
        const updatedCount = 0;
        // 3. Verificar los cambios
        console.log('\n--- Usuarios con rol de administrador ---');
        const adminRoleForQuery = await Role_1.Role.findOne({ where: { name: 'admin' } });
        if (adminRoleForQuery) {
            const admins = await User_1.User.findAll({
                where: { roleId: adminRoleForQuery.id },
                attributes: ['id', 'usuario', 'email', 'firstName', 'lastName', 'isActive'],
                include: [{ model: Role_1.Role, as: 'Role' }],
                order: [['usuario', 'ASC']]
            });
            if (admins.length > 0) {
                admins.forEach(admin => {
                    console.log(`  - ${admin.usuario} (${admin.firstName} ${admin.lastName}) - ${admin.email}`);
                });
            }
            else {
                console.log('  No se encontraron administradores.');
            }
        }
        // 4. Mostrar resumen de todos los roles
        console.log('\n--- Resumen de roles ---');
        const roleCounts = await database_1.sequelize.query(`
      SELECT r.name as role, COUNT(u.id)::text as count
      FROM roles r
      LEFT JOIN users u ON r.id = u."roleId"
      GROUP BY r.id, r.name
      ORDER BY r.name;
    `, { type: 'SELECT' });
        roleCounts.forEach((row) => {
            console.log(`  ${row.role}: ${row.count} usuario(s)`);
        });
        console.log(`\n✓ Proceso completado. ${updatedCount} usuario(s) actualizado(s).`);
        await database_1.sequelize.close();
        process.exit(0);
    }
    catch (error) {
        console.error('✗ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}
updateRoles();
