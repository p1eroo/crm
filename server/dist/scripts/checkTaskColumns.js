"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
require("../config/env");
async function checkTaskColumns() {
    try {
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.\n');
        const [results] = await database_1.sequelize.query(`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);
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
        }
        else {
            console.log(`\n✅ Todas las columnas requeridas existen: ${requiredColumns.join(', ')}`);
        }
    }
    catch (error) {
        console.error('❌ Error:', error.message);
    }
    finally {
        await database_1.sequelize.close();
    }
}
checkTaskColumns();
