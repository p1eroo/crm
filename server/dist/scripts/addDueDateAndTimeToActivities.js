"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function addDueDateAndTimeToActivities() {
    try {
        console.log('🔧 Agregando columnas dueDate y time a la tabla activities...');
        // Verificar si la columna dueDate existe
        const [dueDateResults] = await database_1.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'dueDate'
    `);
        if (dueDateResults.length === 0) {
            console.log('📝 Creando columna dueDate en activities...');
            await database_1.sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN "dueDate" TIMESTAMP WITH TIME ZONE;
      `);
            console.log('✅ Columna dueDate creada en activities');
        }
        else {
            console.log('✓ Columna dueDate ya existe');
        }
        // Verificar si la columna time existe
        const [timeResults] = await database_1.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'time'
    `);
        if (timeResults.length === 0) {
            console.log('📝 Creando columna time en activities...');
            await database_1.sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN "time" VARCHAR(255);
      `);
            console.log('✅ Columna time creada en activities');
        }
        else {
            console.log('✓ Columna time ya existe');
        }
        console.log('✅ Migración completada');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
addDueDateAndTimeToActivities();
