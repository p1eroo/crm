"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
async function addRucToCompanies() {
    try {
        console.log('Iniciando migración para agregar campo RUC a companies...');
        // Verificar si la columna ya existe
        const columnExists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'ruc'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (columnExists.length === 0) {
            // Agregar la columna como nullable
            await database_1.sequelize.query(`
        ALTER TABLE companies ADD COLUMN ruc VARCHAR(255);
      `);
            console.log('✅ Columna ruc agregada a la tabla companies');
        }
        else {
            console.log('✅ Columna ruc ya existe en la tabla companies');
        }
        console.log('Migración completada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}
addRucToCompanies();
