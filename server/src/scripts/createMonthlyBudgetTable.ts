import { sequelize } from '../config/database';
import { MonthlyBudget } from '../models/MonthlyBudget';

async function createMonthlyBudgetTable() {
  try {
    console.log('📡 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');

    console.log('📋 Creando tabla monthly_budgets...');
    await MonthlyBudget.sync({ alter: true });
    console.log('✓ Tabla monthly_budgets creada/actualizada correctamente.\n');

    console.log('✅ Proceso completado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear la tabla:', error);
    process.exit(1);
  }
}

createMonthlyBudgetTable();

