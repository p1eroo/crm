import { sequelize } from '../config/database';

async function createActivityColumns() {
  try {
    console.log('🔧 Verificando y creando columnas en tabla activities...');

    // 1. Crear el enum activity_type_enum si no existe
    const [enumResults] = await sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum'
    `) as [Array<{ [key: string]: any }>, unknown];

    if (enumResults.length === 0) {
      console.log('📝 Creando enum activity_type_enum...');
      await sequelize.query(`
        CREATE TYPE activity_type_enum AS ENUM (
          'call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company'
        )
      `);
      console.log('✅ Enum activity_type_enum creado');
    } else {
      console.log('✓ Enum activity_type_enum ya existe');
    }

    // 2. Verificar si la columna type existe
    const [columnResults] = await sequelize.query(`
      SELECT column_name, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'type'
    `) as [Array<{ column_name: string; udt_name: string }>, unknown];

    if (columnResults.length === 0) {
      console.log('📝 Creando columna type en activities...');
      await sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN "type" activity_type_enum NOT NULL DEFAULT 'note';
      `);
      console.log('✅ Columna type creada en activities');
    } else {
      const currentType = columnResults[0].udt_name;
      if (currentType !== 'activity_type_enum' && currentType.startsWith('enum_')) {
        console.log(`🔧 Convirtiendo columna type de ${currentType} a activity_type_enum...`);
        try {
          await sequelize.query(`
            ALTER TABLE activities 
            ALTER COLUMN "type" TYPE TEXT USING "type"::text;
          `);
          await sequelize.query(`
            ALTER TABLE activities 
            ALTER COLUMN "type" TYPE activity_type_enum USING "type"::activity_type_enum;
          `);
          console.log('✅ Columna type convertida correctamente');
        } catch (convertError: any) {
          console.error('❌ Error al convertir la columna:', convertError.message);
        }
      } else if (currentType === 'activity_type_enum') {
        console.log('✅ Columna type ya existe con el tipo correcto');
      } else {
        console.log(`⚠️  Columna type existe pero con tipo inesperado: ${currentType}`);
      }
    }

    console.log('✅ Verificación de columnas en activities completada');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createActivityColumns();




