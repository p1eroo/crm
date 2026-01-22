"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
async function migrateUsuario() {
    try {
        // Verificar si la columna ya existe
        const columnExists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'usuario'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (columnExists.length === 0) {
            // Agregar la columna como nullable primero
            await database_1.sequelize.query(`
        ALTER TABLE users ADD COLUMN usuario VARCHAR(255);
      `);
            console.log('Columna usuario agregada (nullable)');
        }
        else {
            console.log('Columna usuario ya existe');
        }
        // Actualizar registros existentes: usar email sin @ para crear usuario único
        const users = await database_1.sequelize.query(`
      SELECT id, email FROM users WHERE usuario IS NULL OR usuario = ''
    `, { type: sequelize_1.QueryTypes.SELECT });
        for (const user of users) {
            // Crear usuario basado en email (parte antes del @)
            const emailPart = user.email.split('@')[0];
            let usuario = emailPart;
            let counter = 1;
            // Asegurar que el usuario sea único
            while (true) {
                const existing = await database_1.sequelize.query(`
          SELECT 1 FROM users WHERE usuario = :usuario
        `, {
                    replacements: { usuario },
                    type: sequelize_1.QueryTypes.SELECT
                });
                if (existing.length === 0) {
                    break;
                }
                usuario = `${emailPart}${counter}`;
                counter++;
            }
            await database_1.sequelize.query(`
        UPDATE users SET usuario = :usuario WHERE id = :id
      `, {
                replacements: { usuario, id: user.id }
            });
            console.log(`Usuario actualizado: ${user.email} -> ${usuario}`);
        }
        // Verificar si la constraint UNIQUE ya existe
        const constraintExists = await database_1.sequelize.query(`
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'users_usuario_unique'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (constraintExists.length === 0) {
            // Ahora hacer la columna NOT NULL y agregar constraint UNIQUE
            await database_1.sequelize.query(`
        ALTER TABLE users 
        ALTER COLUMN usuario SET NOT NULL;
      `);
            await database_1.sequelize.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_usuario_unique UNIQUE (usuario);
      `);
            console.log('Constraint UNIQUE agregada y columna marcada como NOT NULL');
        }
        else {
            console.log('Constraint UNIQUE ya existe');
        }
        console.log('Migración completada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}
migrateUsuario();
