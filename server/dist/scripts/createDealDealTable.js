"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const DealDeal_1 = require("../models/DealDeal");
async function createDealDealTable() {
    try {
        console.log('📡 Conectando a la base de datos...');
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.\n');
        console.log('📋 Creando tabla deal_deals...');
        await DealDeal_1.DealDeal.sync({ alter: true });
        console.log('✓ Tabla deal_deals creada/actualizada correctamente.\n');
        console.log('✅ Proceso completado exitosamente.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error al crear la tabla:', error);
        process.exit(1);
    }
}
createDealDealTable();
