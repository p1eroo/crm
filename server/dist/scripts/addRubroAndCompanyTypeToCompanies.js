"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
async function addRubroAndCompanyType() {
    try {
        console.log('Iniciando migración para agregar rubro y companyType a companies...');
        const rubroExists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'rubro'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (rubroExists.length === 0) {
            await database_1.sequelize.query(`ALTER TABLE companies ADD COLUMN rubro VARCHAR(255);`);
            console.log('✅ Columna rubro agregada');
        }
        else {
            console.log('✅ Columna rubro ya existe');
        }
        const companyTypeExists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'companyType'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (companyTypeExists.length === 0) {
            await database_1.sequelize.query(`ALTER TABLE companies ADD COLUMN "companyType" VARCHAR(255);`);
            console.log('✅ Columna companyType agregada');
        }
        else {
            console.log('✅ Columna companyType ya existe');
        }
        console.log('Migración completada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}
addRubroAndCompanyType();
