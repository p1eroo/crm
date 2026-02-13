"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
async function addLogoColumn() {
    try {
        console.log('Añadiendo columna logo a companies...');
        const exists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'logo'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (exists.length === 0) {
            await database_1.sequelize.query(`ALTER TABLE companies ADD COLUMN logo VARCHAR(512);`);
            console.log('✅ Columna logo agregada');
        }
        else {
            console.log('✅ Columna logo ya existe');
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
addLogoColumn();
