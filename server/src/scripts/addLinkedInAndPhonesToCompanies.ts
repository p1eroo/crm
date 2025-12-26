import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function addLinkedInAndPhonesToCompanies() {
  try {
    console.log('Iniciando migración para agregar campos linkedin, phone2 y phone3 a companies...');

    // Verificar y agregar columna linkedin
    const linkedinExists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'linkedin'
    `, { type: QueryTypes.SELECT });

    if (linkedinExists.length === 0) {
      await sequelize.query(`
        ALTER TABLE companies ADD COLUMN linkedin VARCHAR(255);
      `);
      console.log('✅ Columna linkedin agregada a la tabla companies');
    } else {
      console.log('✅ Columna linkedin ya existe en la tabla companies');
    }

    // Verificar y agregar columna phone2
    const phone2Exists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'phone2'
    `, { type: QueryTypes.SELECT });

    if (phone2Exists.length === 0) {
      await sequelize.query(`
        ALTER TABLE companies ADD COLUMN phone2 VARCHAR(255);
      `);
      console.log('✅ Columna phone2 agregada a la tabla companies');
    } else {
      console.log('✅ Columna phone2 ya existe en la tabla companies');
    }

    // Verificar y agregar columna phone3
    const phone3Exists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'phone3'
    `, { type: QueryTypes.SELECT });

    if (phone3Exists.length === 0) {
      await sequelize.query(`
        ALTER TABLE companies ADD COLUMN phone3 VARCHAR(255);
      `);
      console.log('✅ Columna phone3 agregada a la tabla companies');
    } else {
      console.log('✅ Columna phone3 ya existe en la tabla companies');
    }

    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

addLinkedInAndPhonesToCompanies();


