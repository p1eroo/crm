"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const MonthlyBudget_1 = require("../models/MonthlyBudget");
async function createMonthlyBudgetTable() {
    try {
        console.log('📡 Conectando a la base de datos...');
        await database_1.sequelize.authenticate();
        console.log('✓ Conexión establecida.\n');
        console.log('📋 Creando tabla monthly_budgets...');
        await MonthlyBudget_1.MonthlyBudget.sync({ alter: true });
        console.log('✓ Tabla monthly_budgets creada/actualizada correctamente.\n');
        console.log('✅ Proceso completado exitosamente.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error al crear la tabla:', error);
        process.exit(1);
    }
}
createMonthlyBudgetTable();
