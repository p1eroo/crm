// Script Node.js para asignar roles de administrador
// Ejecutar con: node assign_admin_roles.js

const { sequelize } = require('./server/src/config/database');
const { User } = require('./server/src/models/User');

async function assignAdminRoles() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // Buscar usuarios por nombre de usuario
    const usuarios = ['asistema', 'jvaldivia'];
    
    for (const usuario of usuarios) {
      const user = await User.findOne({ where: { usuario } });
      
      if (user) {
        await user.update({ role: 'admin' });
        console.log(`✓ Rol de administrador asignado a: ${usuario} (${user.firstName} ${user.lastName})`);
      } else {
        console.log(`✗ Usuario no encontrado: ${usuario}`);
      }
    }

    // Verificar los cambios
    console.log('\n--- Usuarios con rol de administrador ---');
    const admins = await User.findAll({ 
      where: { role: 'admin' },
      attributes: ['id', 'usuario', 'email', 'firstName', 'lastName', 'role']
    });
    
    admins.forEach(admin => {
      console.log(`- ${admin.usuario} (${admin.firstName} ${admin.lastName}) - ${admin.email}`);
    });

    await sequelize.close();
    console.log('\n✓ Proceso completado.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignAdminRoles();

