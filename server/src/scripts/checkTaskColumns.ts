import { sequelize } from '../config/database';
import '../config/env';

async function checkTaskColumns() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');

    const [results] = await sequelize.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `) as [Array<{ column_name: string; data_type: string; udt_name: string; is_nullable: string; column_default: string | null }>, unknown];

    console.log('📋 Columnas en la tabla tasks:');
    console.log('─'.repeat(80));
    results.forEach(r => {
      const type = r.udt_name || r.data_type;
      const nullable = r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultValue = r.column_default ? ` DEFAULT ${r.column_default}` : '';
      console.log(`  ${r.column_name.padEnd(25)} ${type.padEnd(25)} ${nullable}${defaultValue}`);
    });
    console.log('─'.repeat(80));
    console.log(`\nTotal: ${results.length} columnas`);

    // Verificar columnas específicas
    const requiredColumns = ['type', 'status', 'priority'];
    const existingColumns = results.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Columnas faltantes: ${missingColumns.join(', ')}`);
    } else {
      console.log(`\n✅ Todas las columnas requeridas existen: ${requiredColumns.join(', ')}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTaskColumns();




