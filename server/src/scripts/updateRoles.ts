// Script para actualizar roles de usuario en PostgreSQL
// Ejecutar con: npm run update-roles o ts-node src/scripts/updateRoles.ts

import { sequelize } from '../config/database';
import { User } from '../models/User';

async function updateRoles() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');

    // 1. Actualizar el ENUM en PostgreSQL si es necesario
    console.log('Actualizando el ENUM de roles en PostgreSQL...');
    try {
      await sequelize.query(`
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum 
                    WHERE enumlabel = 'jefe_comercial' 
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
                ) THEN
                    ALTER TYPE user_role_enum ADD VALUE 'jefe_comercial';
                END IF;
            END IF;
        END $$;
      `);
      console.log('✓ ENUM actualizado (si era necesario).\n');
    } catch (error: any) {
      console.log('⚠ El ENUM puede no existir o ya estar actualizado. Continuando...\n');
    }

    // 2. Asignar rol de administrador a los usuarios especificados
    console.log('Asignando roles de administrador...');
    const usuarios = ['asistema', 'jvaldivia'];
    let updatedCount = 0;

    for (const usuario of usuarios) {
      const user = await User.findOne({ where: { usuario } });
      
      if (user) {
        if (user.role !== 'admin') {
          await user.update({ role: 'admin' });
          console.log(`✓ Rol de administrador asignado a: ${usuario} (${user.firstName} ${user.lastName})`);
          updatedCount++;
        } else {
          console.log(`- ${usuario} ya tiene rol de administrador`);
        }
      } else {
        console.log(`✗ Usuario no encontrado: ${usuario}`);
      }
    }

    // 3. Verificar los cambios
    console.log('\n--- Usuarios con rol de administrador ---');
    const admins = await User.findAll({ 
      where: { role: 'admin' },
      attributes: ['id', 'usuario', 'email', 'firstName', 'lastName', 'role', 'isActive'],
      order: [['usuario', 'ASC']]
    });
    
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(`  - ${admin.usuario} (${admin.firstName} ${admin.lastName}) - ${admin.email}`);
      });
    } else {
      console.log('  No se encontraron administradores.');
    }

    // 4. Mostrar resumen de todos los roles
    console.log('\n--- Resumen de roles ---');
    const roleCounts = await sequelize.query(`
      SELECT role, COUNT(*)::text as count
      FROM users
      GROUP BY role
      ORDER BY role;
    `, { type: 'SELECT' }) as Array<{ role: string; count: string }>;

    roleCounts.forEach((row) => {
      console.log(`  ${row.role}: ${row.count} usuario(s)`);
    });

    console.log(`\n✓ Proceso completado. ${updatedCount} usuario(s) actualizado(s).`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateRoles();

