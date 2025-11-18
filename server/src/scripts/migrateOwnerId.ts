import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function migrateOwnerId() {
  try {
    console.log('Iniciando migración de ownerId a nullable...');

    // Hacer ownerId nullable en la tabla contacts
    await sequelize.query(`
      ALTER TABLE contacts 
      ALTER COLUMN "ownerId" DROP NOT NULL;
    `);
    console.log('✅ Columna ownerId en contacts ahora es nullable');

    // Hacer ownerId nullable en la tabla companies
    await sequelize.query(`
      ALTER TABLE companies 
      ALTER COLUMN "ownerId" DROP NOT NULL;
    `);
    console.log('✅ Columna ownerId en companies ahora es nullable');

    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

migrateOwnerId();



