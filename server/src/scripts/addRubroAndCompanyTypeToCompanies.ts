import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function addRubroAndCompanyType() {
  try {
    console.log('Iniciando migración para agregar rubro y companyType a companies...');

    const rubroExists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'rubro'
    `, { type: QueryTypes.SELECT });
    if ((rubroExists as any[]).length === 0) {
      await sequelize.query(`ALTER TABLE companies ADD COLUMN rubro VARCHAR(255);`);
      console.log('✅ Columna rubro agregada');
    } else {
      console.log('✅ Columna rubro ya existe');
    }

    const companyTypeExists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'companyType'
    `, { type: QueryTypes.SELECT });
    if ((companyTypeExists as any[]).length === 0) {
      await sequelize.query(`ALTER TABLE companies ADD COLUMN "companyType" VARCHAR(255);`);
      console.log('✅ Columna companyType agregada');
    } else {
      console.log('✅ Columna companyType ya existe');
    }

    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

addRubroAndCompanyType();
