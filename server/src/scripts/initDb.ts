import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';
import bcrypt from 'bcryptjs';

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

    // Crear usuario admin por defecto si no existe
    const adminExists = await User.findOne({ where: { usuario: 'admin' } });
    if (!adminExists) {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (!adminRole) {
        throw new Error('No se pudo encontrar el rol de administrador');
      }

      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        usuario: 'admin',
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        roleId: adminRole.id,
      });
      console.log('Usuario admin creado: usuario=admin / contraseña=admin123');
    }

    console.log('Base de datos inicializada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

initDatabase();








