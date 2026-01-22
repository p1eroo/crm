import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function addRucToCompanies() {
  try {
    console.log('Iniciando migración para agregar campo RUC a companies...');

    // Verificar si la columna ya existe
    const columnExists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'ruc'
    `, { type: QueryTypes.SELECT });

    if (columnExists.length === 0) {
      // Agregar la columna como nullable
      await sequelize.query(`
        ALTER TABLE companies ADD COLUMN ruc VARCHAR(255);
      `);
      console.log('✅ Columna ruc agregada a la tabla companies');
    } else {
      console.log('✅ Columna ruc ya existe en la tabla companies');
    }

    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

addRucToCompanies();

