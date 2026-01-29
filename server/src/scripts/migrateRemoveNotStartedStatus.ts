import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function migrateRemoveNotStartedStatus() {
  try {
    console.log('🔄 Iniciando migración para eliminar estado "not started"...\n');

    // Paso 1: Verificar si hay tareas con estado 'not started'
    const [tasksWithNotStarted] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status = 'not started'
    `, { type: QueryTypes.SELECT }) as [{ count: string }[]];

    const count = parseInt(tasksWithNotStarted[0]?.count || '0');
    
    if (count > 0) {
      console.log(`📊 Encontradas ${count} tarea(s) con estado 'not started'`);
      console.log('🔄 Actualizando tareas a estado "pending"...\n');
      
      // Actualizar todas las tareas que tienen 'not started' a 'pending'
      await sequelize.query(`
        UPDATE tasks
        SET status = 'pending'
        WHERE status = 'not started'
      `);
      
      console.log('✅ Tareas actualizadas exitosamente\n');
    } else {
      console.log('✅ No hay tareas con estado "not started" para actualizar\n');
    }

    // Paso 2: Verificar si el ENUM tiene 'not started'
    const enumValues = await sequelize.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'task_status_enum'
      ORDER BY e.enumsortorder
    `, { type: QueryTypes.SELECT }) as { enumlabel: string }[];

    const hasNotStarted = enumValues.some(v => v.enumlabel === 'not started');
    
    if (hasNotStarted) {
      console.log('🔄 Eliminando "not started" del ENUM...\n');
      
      // Recrear el ENUM sin 'not started'
      await sequelize.query(`
        DO $$
        BEGIN
            -- Paso 1: Eliminar el valor por defecto temporalmente
            ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;
            
            -- Paso 2: Crear nuevo tipo ENUM sin 'not started'
            CREATE TYPE task_status_enum_new AS ENUM ('pending', 'in progress', 'completed', 'cancelled');
            
            -- Paso 3: Cambiar el tipo de la columna al nuevo ENUM, convirtiendo 'not started' a 'pending'
            ALTER TABLE tasks ALTER COLUMN status TYPE task_status_enum_new 
            USING CASE 
                WHEN status::text = 'not started' THEN 'pending'::task_status_enum_new
                ELSE status::text::task_status_enum_new
            END;
            
            -- Paso 4: Establecer el nuevo valor por defecto
            ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'pending'::task_status_enum_new;
            
            -- Paso 5: Eliminar el tipo antiguo
            DROP TYPE task_status_enum;
            
            -- Paso 6: Renombrar el nuevo tipo al nombre original
            ALTER TYPE task_status_enum_new RENAME TO task_status_enum;
        END $$;
      `);
      
      console.log('✅ ENUM actualizado exitosamente\n');
    } else {
      console.log('✅ El ENUM ya no contiene "not started"\n');
    }

    // Verificar los valores finales del ENUM
    const finalEnumValues = await sequelize.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'task_status_enum'
      ORDER BY e.enumsortorder
    `, { type: QueryTypes.SELECT }) as { enumlabel: string }[];

    console.log('📋 Valores finales del ENUM task_status_enum:');
    finalEnumValues.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.enumlabel}`);
    });
    console.log('');

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error en la migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateRemoveNotStartedStatus();
