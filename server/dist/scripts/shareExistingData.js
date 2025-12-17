"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
async function shareExistingData() {
    try {
        console.log('Iniciando actualización de datos existentes para compartirlos...');
        // Actualizar todos los contactos para que tengan ownerId null (compartidos)
        const contactsResult = await database_1.sequelize.query(`
      UPDATE contacts 
      SET "ownerId" = NULL
      WHERE "ownerId" IS NOT NULL;
    `, { type: sequelize_1.QueryTypes.UPDATE });
        console.log('✅ Contactos actualizados para ser compartidos');
        // Actualizar todas las empresas para que tengan ownerId null (compartidas)
        const companiesResult = await database_1.sequelize.query(`
      UPDATE companies 
      SET "ownerId" = NULL
      WHERE "ownerId" IS NOT NULL;
    `, { type: sequelize_1.QueryTypes.UPDATE });
        console.log('✅ Empresas actualizadas para ser compartidas');
        // Verificar resultados
        const contactsCount = await database_1.sequelize.query(`
      SELECT COUNT(*) as total FROM contacts WHERE "ownerId" IS NULL
    `, { type: sequelize_1.QueryTypes.SELECT });
        const companiesCount = await database_1.sequelize.query(`
      SELECT COUNT(*) as total FROM companies WHERE "ownerId" IS NULL
    `, { type: sequelize_1.QueryTypes.SELECT });
        console.log(`✅ Total contactos compartidos: ${contactsCount[0].total}`);
        console.log(`✅ Total empresas compartidas: ${companiesCount[0].total}`);
        console.log('Migración completada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('Error en la migración:', error);
        process.exit(1);
    }
}
shareExistingData();
