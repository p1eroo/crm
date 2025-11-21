import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function shareExistingData() {
  try {
    console.log('Iniciando actualización de datos existentes para compartirlos...');

    // Actualizar todos los contactos para que tengan ownerId null (compartidos)
    const contactsResult = await sequelize.query(`
      UPDATE contacts 
      SET "ownerId" = NULL
      WHERE "ownerId" IS NOT NULL;
    `, { type: QueryTypes.UPDATE });
    
    console.log('✅ Contactos actualizados para ser compartidos');

    // Actualizar todas las empresas para que tengan ownerId null (compartidas)
    const companiesResult = await sequelize.query(`
      UPDATE companies 
      SET "ownerId" = NULL
      WHERE "ownerId" IS NOT NULL;
    `, { type: QueryTypes.UPDATE });
    
    console.log('✅ Empresas actualizadas para ser compartidas');

    // Verificar resultados
    const contactsCount = await sequelize.query(`
      SELECT COUNT(*) as total FROM contacts WHERE "ownerId" IS NULL
    `, { type: QueryTypes.SELECT });
    
    const companiesCount = await sequelize.query(`
      SELECT COUNT(*) as total FROM companies WHERE "ownerId" IS NULL
    `, { type: QueryTypes.SELECT });

    console.log(`✅ Total contactos compartidos: ${(contactsCount[0] as any).total}`);
    console.log(`✅ Total empresas compartidas: ${(companiesCount[0] as any).total}`);
    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

shareExistingData();








