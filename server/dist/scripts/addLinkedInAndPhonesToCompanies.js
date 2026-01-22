"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
async function addLinkedInAndPhonesToCompanies() {
    try {
        console.log('Iniciando migración para agregar campos linkedin, phone2 y phone3 a companies...');
        // Verificar y agregar columna linkedin
        const linkedinExists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'linkedin'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (linkedinExists.length === 0) {
            await database_1.sequelize.query(`
        ALTER TABLE companies ADD COLUMN linkedin VARCHAR(255);
      `);
            console.log('✅ Columna linkedin agregada a la tabla companies');
        }
        else {
            console.log('✅ Columna linkedin ya existe en la tabla companies');
        }
        // Verificar y agregar columna phone2
        const phone2Exists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'phone2'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (phone2Exists.length === 0) {
            await database_1.sequelize.query(`
        ALTER TABLE companies ADD COLUMN phone2 VARCHAR(255);
      `);
            console.log('✅ Columna phone2 agregada a la tabla companies');
        }
        else {
            console.log('✅ Columna phone2 ya existe en la tabla companies');
        }
        // Verificar y agregar columna phone3
        const phone3Exists = await database_1.sequelize.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'phone3'
    `, { type: sequelize_1.QueryTypes.SELECT });
        if (phone3Exists.length === 0) {
            await database_1.sequelize.query(`
        ALTER TABLE companies ADD COLUMN phone3 VARCHAR(255);
      `);
            console.log('✅ Columna phone3 agregada a la tabla companies');
        }
        else {
            console.log('✅ Columna phone3 ya existe en la tabla companies');
        }
        console.log('Migración completada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}
addLinkedInAndPhonesToCompanies();
