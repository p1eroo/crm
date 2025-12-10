// Script para verificar y corregir el rol de un usuario
// Ejecutar con: ts-node src/scripts/checkUserRole.ts

import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';

async function checkUserRole() {
  try {
    console.log('🔍 Verificando usuarios y roles...\n');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');

    // Obtener todos los usuarios con sus roles
    const users = await User.findAll({
      include: [{ model: Role, as: 'Role' }],
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
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (adminRole) {
      const adminUsers = await User.findAll({
        where: { roleId: adminRole.id },
        include: [{ model: Role, as: 'Role' }],
      });
      console.log(`\n👑 Usuarios con rol admin: ${adminUsers.length}`);
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.usuario} (${admin.email})`);
      });
    }

    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

checkUserRole();


