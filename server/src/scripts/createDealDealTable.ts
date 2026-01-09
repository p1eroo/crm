import { sequelize } from '../config/database';
import { DealDeal } from '../models/DealDeal';

async function createDealDealTable() {
  try {
    console.log('📡 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión establecida.\n');

    console.log('📋 Creando tabla deal_deals...');
    await DealDeal.sync({ alter: true });
    console.log('✓ Tabla deal_deals creada/actualizada correctamente.\n');

    console.log('✅ Proceso completado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear la tabla:', error);
    process.exit(1);
  }
}

createDealDealTable();
