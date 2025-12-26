"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function createActivityColumns() {
    try {
        console.log('🔧 Verificando y creando columnas en tabla activities...');
        // 1. Crear el enum activity_type_enum si no existe
        const [enumResults] = await database_1.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum'
    `);
        if (enumResults.length === 0) {
            console.log('📝 Creando enum activity_type_enum...');
            await database_1.sequelize.query(`
        CREATE TYPE activity_type_enum AS ENUM (
          'call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company'
        )
      `);
            console.log('✅ Enum activity_type_enum creado');
        }
        else {
            console.log('✓ Enum activity_type_enum ya existe');
        }
        // 2. Verificar si la columna type existe
        const [columnResults] = await database_1.sequelize.query(`
      SELECT column_name, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'type'
    `);
        if (columnResults.length === 0) {
            console.log('📝 Creando columna type en activities...');
            await database_1.sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN "type" activity_type_enum NOT NULL DEFAULT 'note';
      `);
            console.log('✅ Columna type creada en activities');
        }
        else {
            const currentType = columnResults[0].udt_name;
            if (currentType !== 'activity_type_enum' && currentType.startsWith('enum_')) {
                console.log(`🔧 Convirtiendo columna type de ${currentType} a activity_type_enum...`);
                try {
                    await database_1.sequelize.query(`
            ALTER TABLE activities 
            ALTER COLUMN "type" TYPE TEXT USING "type"::text;
          `);
                    await database_1.sequelize.query(`
            ALTER TABLE activities 
            ALTER COLUMN "type" TYPE activity_type_enum USING "type"::activity_type_enum;
          `);
                    console.log('✅ Columna type convertida correctamente');
                }
                catch (convertError) {
                    console.error('❌ Error al convertir la columna:', convertError.message);
                }
            }
            else if (currentType === 'activity_type_enum') {
                console.log('✅ Columna type ya existe con el tipo correcto');
            }
            else {
                console.log(`⚠️  Columna type existe pero con tipo inesperado: ${currentType}`);
            }
        }
        console.log('✅ Verificación de columnas en activities completada');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
createActivityColumns();
