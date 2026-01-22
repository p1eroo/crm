"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function migrateOwnerId() {
    try {
        console.log('Iniciando migración de ownerId a nullable...');
        // Hacer ownerId nullable en la tabla contacts
        await database_1.sequelize.query(`
      ALTER TABLE contacts 
      ALTER COLUMN "ownerId" DROP NOT NULL;
    `);
        console.log('✅ Columna ownerId en contacts ahora es nullable');
        // Hacer ownerId nullable en la tabla companies
        await database_1.sequelize.query(`
      ALTER TABLE companies 
      ALTER COLUMN "ownerId" DROP NOT NULL;
    `);
        console.log('✅ Columna ownerId en companies ahora es nullable');
        console.log('Migración completada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}
migrateOwnerId();
