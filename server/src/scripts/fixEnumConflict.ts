// Script para corregir conflicto de ENUMs en la base de datos
// Ejecutar con: ts-node src/scripts/fixEnumConflict.ts

import { sequelize } from '../config/database';

async function fixEnumConflict() {
  try {
    console.log('🔧 Corrigiendo conflicto de ENUMs...\n');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');
    
    // 1. Verificar qué enums existen relacionados con lifecycle
    const [enums] = await sequelize.query(`
      SELECT typname, typtype 
      FROM pg_type 
      WHERE typname LIKE '%lifecycle%' OR typname LIKE 'enum_%lifecycle%'
      ORDER BY typname;
    `) as [Array<{ typname: string; typtype: string }>, unknown];
    
    console.log('📋 ENUMs encontrados:');
    enums.forEach(e => console.log(`  - ${e.typname}`));
    console.log('');
    
    // 2. Verificar qué tipo usa la columna lifecycleStage en companies y contacts
    const [columns] = await sequelize.query(`
      SELECT 
        table_name,
        column_name,
        udt_name,
        data_type
      FROM information_schema.columns
      WHERE table_name IN ('companies', 'contacts') 
        AND column_name = 'lifecycleStage'
      ORDER BY table_name;
    `) as [Array<{ table_name: string; column_name: string; udt_name: string; data_type: string }>, unknown];
    
    console.log('📋 Columnas lifecycleStage:');
    columns.forEach(c => console.log(`  - ${c.table_name}.${c.column_name}: ${c.udt_name}`));
    console.log('');
    
    // 3. Asegurar que el enum correcto existe
    console.log('🔧 Creando/verificando enum lifecycle_stage_enum...');
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_stage_enum') THEN
          CREATE TYPE lifecycle_stage_enum AS ENUM (
            'lead_inactivo', 'cliente_perdido', 'cierre_perdido', 'lead',
            'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica',
            'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado',
            'firma_contrato', 'activo'
          );
          RAISE NOTICE '✅ Enum lifecycle_stage_enum creado';
        ELSE
          RAISE NOTICE '✅ Enum lifecycle_stage_enum ya existe';
        END IF;
      END $$;
    `);
    console.log('✓ Enum lifecycle_stage_enum verificado.\n');
    
    // 4. Corregir companies si es necesario
    for (const table of ['companies', 'contacts']) {
      const column = columns.find(c => c.table_name === table);
      
      if (column) {
        const currentType = column.udt_name;
        
        if (currentType !== 'lifecycle_stage_enum' && currentType.startsWith('enum_')) {
          console.log(`🔧 Corrigiendo ${table}.lifecycleStage de ${currentType} a lifecycle_stage_enum...`);
          
          try {
            // Convertir a texto primero
            await sequelize.query(`
              ALTER TABLE ${table} 
              ALTER COLUMN "lifecycleStage" TYPE TEXT USING "lifecycleStage"::text;
            `);
            
            // Eliminar el enum incorrecto si no está en uso
            try {
              await sequelize.query(`DROP TYPE IF EXISTS ${currentType} CASCADE;`);
              console.log(`  ✓ Enum ${currentType} eliminado`);
            } catch (e: any) {
              console.log(`  ⚠️  No se pudo eliminar ${currentType} (puede estar en uso): ${e.message}`);
            }
            
            // Convertir al enum correcto
            await sequelize.query(`
              ALTER TABLE ${table} 
              ALTER COLUMN "lifecycleStage" TYPE lifecycle_stage_enum USING "lifecycleStage"::lifecycle_stage_enum;
            `);
            
            // Restaurar NOT NULL y DEFAULT
            await sequelize.query(`
              ALTER TABLE ${table} 
              ALTER COLUMN "lifecycleStage" SET NOT NULL,
              ALTER COLUMN "lifecycleStage" SET DEFAULT 'lead';
            `);
            
            console.log(`✅ ${table}.lifecycleStage corregido correctamente\n`);
          } catch (error: any) {
            console.error(`❌ Error al corregir ${table}.lifecycleStage:`, error.message);
          }
        } else if (currentType === 'lifecycle_stage_enum') {
          console.log(`✅ ${table}.lifecycleStage ya tiene el tipo correcto\n`);
        } else {
          console.log(`⚠️  ${table}.lifecycleStage tiene tipo inesperado: ${currentType}\n`);
        }
      } else {
        // La columna no existe, crearla
        console.log(`🔧 Creando columna lifecycleStage en ${table}...`);
        try {
          await sequelize.query(`
            ALTER TABLE ${table} 
            ADD COLUMN "lifecycleStage" lifecycle_stage_enum NOT NULL DEFAULT 'lead';
          `);
          console.log(`✅ Columna lifecycleStage creada en ${table}\n`);
        } catch (error: any) {
          console.error(`❌ Error al crear columna en ${table}:`, error.message);
        }
      }
    }
    
    // 5. Eliminar cualquier enum incorrecto restante
    console.log('🔧 Limpiando enums incorrectos...');
    await sequelize.query(`
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN 
          SELECT typname FROM pg_type 
          WHERE typname LIKE 'enum_%lifecycle%'
          AND typname != 'lifecycle_stage_enum'
        LOOP
          BEGIN
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            RAISE NOTICE 'Eliminado enum incorrecto: %', r.typname;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END LOOP;
      END $$;
    `);
    console.log('✓ Limpieza completada.\n');
    
    // 6. Verificar resultado final
    const [finalColumns] = await sequelize.query(`
      SELECT 
        table_name,
        column_name,
        udt_name,
        data_type
      FROM information_schema.columns
      WHERE table_name IN ('companies', 'contacts') 
        AND column_name = 'lifecycleStage'
      ORDER BY table_name;
    `) as [Array<{ table_name: string; udt_name: string }>, unknown];
    
    console.log('📊 RESULTADO FINAL:');
    finalColumns.forEach(c => {
      const status = c.udt_name === 'lifecycle_stage_enum' ? '✅' : '❌';
      console.log(`  ${status} ${c.table_name}.lifecycleStage: ${c.udt_name}`);
    });
    
    await sequelize.close();
    console.log('\n✅ Proceso completado. Reinicia el servidor.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

fixEnumConflict();




