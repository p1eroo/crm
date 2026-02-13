"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
require("../config/env"); // Asegurar que las variables de entorno estén cargadas
async function createTicketColumns() {
    console.log('🔧 Creando columnas faltantes en tabla tickets...');
    try {
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.');
        // Crear enums si no existen
        const enums = [
            {
                name: 'ticket_status_enum',
                values: ['new', 'open', 'pending', 'resolved', 'closed']
            },
            {
                name: 'ticket_priority_enum',
                values: ['low', 'medium', 'high', 'urgent']
            }
        ];
        for (const enumDef of enums) {
            try {
                // Verificar si el enum existe
                const [enumResults] = await database_1.sequelize.query(`
          SELECT 1 FROM pg_type WHERE typname = '${enumDef.name}'
        `);
                if (enumResults.length === 0) {
                    // El enum no existe, crearlo directamente
                    const valuesList = enumDef.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
                    await database_1.sequelize.query(`CREATE TYPE ${enumDef.name} AS ENUM (${valuesList})`);
                    console.log(`✅ Enum ${enumDef.name} creado`);
                }
                else {
                    console.log(`✓ Enum ${enumDef.name} ya existe`);
                }
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    console.warn(`⚠️  Error al crear enum ${enumDef.name}:`, error.message);
                }
                else {
                    console.log(`✓ Enum ${enumDef.name} ya existe`);
                }
            }
        }
        // Verificar y crear columna images (JSONB) para capturas al reportar fallos
        try {
            const [imgResults] = await database_1.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tickets' AND column_name = 'images'
      `);
            if (imgResults.length === 0) {
                await database_1.sequelize.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS images JSONB DEFAULT NULL;`);
                console.log('✅ Columna images creada en tickets');
            }
            else {
                console.log('✓ Columna images ya existe en tickets');
            }
        }
        catch (error) {
            console.warn('⚠️  Error al crear columna images:', error.message);
        }
        // Verificar y crear columnas
        const columns = [
            { name: 'status', enumType: 'ticket_status_enum', defaultValue: 'new' },
            { name: 'priority', enumType: 'ticket_priority_enum', defaultValue: 'medium' }
        ];
        for (const col of columns) {
            try {
                // Verificar si la columna existe
                const [results] = await database_1.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'tickets' AND column_name = '${col.name}'
        `);
                if (results.length === 0) {
                    console.log(`🔧 Creando columna ${col.name} en tickets...`);
                    await database_1.sequelize.query(`
            ALTER TABLE tickets
            ADD COLUMN "${col.name}" ${col.enumType} NOT NULL DEFAULT '${col.defaultValue}';
          `);
                    console.log(`✅ Columna ${col.name} creada en tickets`);
                }
                else {
                    console.log(`✓ Columna ${col.name} ya existe en tickets`);
                }
            }
            catch (error) {
                console.error(`❌ Error al crear columna ${col.name}:`, error.message);
            }
        }
        console.log('\n✅ Proceso completado. Las columnas deberían estar creadas ahora.');
        console.log('📋 PRÓXIMOS PASOS:');
        console.log('1. Reinicia el servidor: npm run dev');
        console.log('2. Verifica en pgAdmin que las columnas aparezcan');
    }
    catch (error) {
        console.error('❌ Error durante la creación de columnas:', error.message);
        console.error(error);
    }
    finally {
        await database_1.sequelize.close();
    }
}
createTicketColumns();
