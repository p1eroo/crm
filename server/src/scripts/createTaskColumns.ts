import { sequelize } from '../config/database';
import '../config/env'; // Asegurar que las variables de entorno estén cargadas

async function createTaskColumns() {
  console.log('🔧 Creando columnas faltantes en tabla tasks...');

  try {
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.');

    // Crear enums si no existen
    const enums = [
      {
        name: 'task_type_enum',
        values: ['call', 'email', 'meeting', 'note', 'todo', 'other']
      },
      {
        name: 'task_status_enum',
        values: ['not started', 'in progress', 'completed', 'cancelled']
      },
      {
        name: 'task_priority_enum',
        values: ['low', 'medium', 'high', 'urgent']
      }
    ];

    for (const enumDef of enums) {
      try {
        // Verificar si el enum existe
        const [enumResults] = await sequelize.query(`
          SELECT 1 FROM pg_type WHERE typname = '${enumDef.name}'
        `) as [Array<{ [key: string]: any }>, unknown];
        
        if (enumResults.length === 0) {
          // El enum no existe, crearlo directamente
          const valuesList = enumDef.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
          await sequelize.query(`CREATE TYPE ${enumDef.name} AS ENUM (${valuesList})`);
          console.log(`✅ Enum ${enumDef.name} creado`);
        } else {
          console.log(`✓ Enum ${enumDef.name} ya existe`);
        }
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️  Error al crear enum ${enumDef.name}:`, error.message);
        } else {
          console.log(`✓ Enum ${enumDef.name} ya existe`);
        }
      }
    }

    // Verificar y crear columnas
    const columns = [
      { name: 'type', enumType: 'task_type_enum', defaultValue: 'other' },
      { name: 'status', enumType: 'task_status_enum', defaultValue: 'not started' },
      { name: 'priority', enumType: 'task_priority_enum', defaultValue: 'medium' }
    ];

    for (const col of columns) {
      try {
        // Verificar si la columna existe
        const [results] = await sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'tasks' AND column_name = '${col.name}'
        `) as [Array<{ column_name: string }>, unknown];

        if (results.length === 0) {
          console.log(`🔧 Creando columna ${col.name} en tasks...`);
          await sequelize.query(`
            ALTER TABLE tasks
            ADD COLUMN "${col.name}" ${col.enumType} NOT NULL DEFAULT '${col.defaultValue}';
          `);
          console.log(`✅ Columna ${col.name} creada en tasks`);
        } else {
          console.log(`✓ Columna ${col.name} ya existe en tasks`);
        }
      } catch (error: any) {
        console.error(`❌ Error al crear columna ${col.name}:`, error.message);
      }
    }

    console.log('\n✅ Proceso completado. Las columnas deberían estar creadas ahora.');
    console.log('📋 PRÓXIMOS PASOS:');
    console.log('1. Reinicia el servidor: npm run dev');
    console.log('2. Verifica en pgAdmin que las columnas aparezcan');

  } catch (error: any) {
    console.error('❌ Error durante la creación de columnas:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

createTaskColumns();

