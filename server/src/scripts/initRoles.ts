// Script para inicializar la tabla de roles y migrar datos existentes
// Ejecutar con: npm run init-roles o ts-node src/scripts/initRoles.ts

import { sequelize } from '../config/database';
import { Role } from '../models/Role';
import { User } from '../models/User';
import fs from 'fs';
import path from 'path';

async function initRoles() {
  try {
    console.log('🚀 Inicializando sistema de roles...\n');
    
    // 1. Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');

    // 2. Sincronizar el modelo Role (crear tabla si no existe)
    console.log('📋 Creando tabla de roles...');
    await Role.sync({ alter: true });
    console.log('✓ Tabla de roles lista.\n');

    // 3. Verificar si ya existen roles
    const existingRoles = await Role.count();
    
    if (existingRoles === 0) {
      console.log('➕ Insertando roles por defecto...');
      await Role.bulkCreate([
        { name: 'admin', description: 'Administrador del sistema' },
        { name: 'user', description: 'Usuario estándar' },
        { name: 'manager', description: 'Gerente' },
        { name: 'jefe_comercial', description: 'Jefe Comercial' },
      ]);
      console.log('✓ Roles por defecto creados.\n');
    } else {
      console.log(`✓ Ya existen ${existingRoles} rol(es) en la base de datos.\n`);
    }

    // 4. Verificar si la tabla users tiene la columna roleId
    console.log('🔍 Verificando estructura de la tabla users...');
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'roleId'
    `) as [Array<{ column_name: string }>, unknown];

    const hasRoleId = results.length > 0;
    const [roleColumn] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `) as [Array<{ column_name: string }>, unknown];

    const hasOldRole = roleColumn.length > 0;

    if (!hasRoleId && hasOldRole) {
      console.log('⚠️  Necesita migración: la tabla users tiene "role" pero no "roleId"');
      console.log('📝 Ejecutando migración...\n');
      
      // Ejecutar migración
      await sequelize.query(`
        -- Agregar columna roleId
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "roleId" INTEGER;
      `);

      // Migrar datos existentes
      await sequelize.query(`
        UPDATE users u
        SET "roleId" = r.id
        FROM roles r
        WHERE u.role::text = r.name;
      `);

      // Establecer valor por defecto para usuarios sin roleId
      const defaultRole = await Role.findOne({ where: { name: 'user' } });
      if (defaultRole) {
        await sequelize.query(`
          UPDATE users
          SET "roleId" = ${defaultRole.id}
          WHERE "roleId" IS NULL;
        `);
      }

      // Hacer roleId NOT NULL
      await sequelize.query(`
        ALTER TABLE users ALTER COLUMN "roleId" SET NOT NULL;
      `);

      // Agregar foreign key
      try {
        await sequelize.query(`
          ALTER TABLE users
          ADD CONSTRAINT fk_users_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT;
        `);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      // Crear índice
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_users_roleId ON users("roleId");
      `);

      console.log('✓ Migración completada.\n');
    } else if (hasRoleId) {
      console.log('✓ La tabla users ya tiene la columna roleId.\n');
    } else {
      console.log('⚠️  La tabla users no tiene ni "role" ni "roleId".');
      console.log('   Esto puede indicar que la tabla está vacía o necesita ser creada.\n');
    }

    // 5. Verificar usuarios y sus roles
    console.log('👥 Verificando usuarios y roles...');
    const userCount = await User.count();
    console.log(`   Total de usuarios: ${userCount}`);

    if (userCount > 0) {
      const usersWithRoles = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM users u
        INNER JOIN roles r ON u."roleId" = r.id
      `) as [Array<{ count: string }>, unknown];

      const count = parseInt(usersWithRoles[0][0].count);
      console.log(`   Usuarios con roles asignados: ${count}/${userCount}`);

      if (count < userCount) {
        console.log('   ⚠️  Algunos usuarios no tienen roles asignados.');
        const defaultRole = await Role.findOne({ where: { name: 'user' } });
        if (defaultRole) {
          await sequelize.query(`
            UPDATE users
            SET "roleId" = ${defaultRole.id}
            WHERE "roleId" IS NULL;
          `);
          console.log('   ✓ Roles por defecto asignados a usuarios sin rol.');
        }
      }
    }

    // 6. Mostrar resumen de roles
    console.log('\n📊 Resumen de roles:');
    const roles = await Role.findAll({
      order: [['name', 'ASC']],
    });

    for (const role of roles) {
      const userCount = await User.count({ where: { roleId: role.id } });
      console.log(`   - ${role.name}: ${userCount} usuario(s)`);
      if (role.description) {
        console.log(`     ${role.description}`);
      }
    }

    // 7. Verificar usuarios administradores
    console.log('\n👑 Administradores:');
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (adminRole) {
      const admins = await User.findAll({
        where: { roleId: adminRole.id },
        attributes: ['id', 'usuario', 'email', 'firstName', 'lastName', 'isActive'],
        order: [['usuario', 'ASC']],
      });

      if (admins.length > 0) {
        admins.forEach(admin => {
          const status = admin.isActive ? '✓' : '✗';
          console.log(`   ${status} ${admin.usuario} (${admin.firstName} ${admin.lastName}) - ${admin.email}`);
        });
      } else {
        console.log('   ⚠️  No hay administradores en el sistema.');
      }
    }

    console.log('\n✅ Inicialización de roles completada exitosamente!\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error durante la inicialización:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

initRoles();

