import { sequelize } from '../config/database';
import { Role } from '../models/Role';

async function initDatabase() {
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');

    // Asegurar que existan los roles
    const roles = await Role.findAll();
    if (roles.length === 0) {
      await Role.bulkCreate([
        { name: 'admin', description: 'Administrador del sistema' },
        { name: 'user', description: 'Usuario estándar' },
        { name: 'manager', description: 'Gerente' },
        { name: 'jefe_comercial', description: 'Jefe Comercial' },
      ]);
      console.log('Roles por defecto creados.');
    }

    // Nota: Los usuarios deben crearse manualmente desde la interfaz de administración
    // o mediante la base de datos. No se crean usuarios automáticamente.

    console.log('Base de datos inicializada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

initDatabase();








