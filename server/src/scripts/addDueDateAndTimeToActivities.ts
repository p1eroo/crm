import { sequelize } from '../config/database';

async function addDueDateAndTimeToActivities() {
  try {
    console.log('🔧 Agregando columnas dueDate y time a la tabla activities...');

    // Verificar si la columna dueDate existe
    const [dueDateResults] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'dueDate'
    `) as [Array<{ column_name: string }>, unknown];

    if (dueDateResults.length === 0) {
      console.log('📝 Creando columna dueDate en activities...');
      await sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN "dueDate" TIMESTAMP WITH TIME ZONE;
      `);
      console.log('✅ Columna dueDate creada en activities');
    } else {
      console.log('✓ Columna dueDate ya existe');
    }

    // Verificar si la columna time existe
    const [timeResults] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'time'
    `) as [Array<{ column_name: string }>, unknown];

    if (timeResults.length === 0) {
      console.log('📝 Creando columna time en activities...');
      await sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN "time" VARCHAR(255);
      `);
      console.log('✅ Columna time creada en activities');
    } else {
      console.log('✓ Columna time ya existe');
    }

    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addDueDateAndTimeToActivities();
