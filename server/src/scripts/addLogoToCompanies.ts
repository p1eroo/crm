import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function addLogoColumn() {
  try {
    console.log('Añadiendo columna logo a companies...');
    const exists = await sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'logo'
    `, { type: QueryTypes.SELECT });
    if ((exists as any[]).length === 0) {
      await sequelize.query(`ALTER TABLE companies ADD COLUMN logo VARCHAR(512);`);
      console.log('✅ Columna logo agregada');
    } else {
      console.log('✅ Columna logo ya existe');
    }
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addLogoColumn();
