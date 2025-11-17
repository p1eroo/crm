import { sequelize } from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');

    // Crear usuario admin por defecto si no existe
    const adminExists = await User.findOne({ where: { usuario: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        usuario: 'admin',
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
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








