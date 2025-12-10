import express from 'express';
import cors from 'cors';
import os from 'os';
import './config/env'; // Cargar configuración de entorno (debe ser lo primero)
import { sequelize } from './config/database';
import './models'; // Import models to register associations
import { Role } from './models/Role';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import contactRoutes from './routes/contacts';
import companyRoutes from './routes/companies';
import dealRoutes from './routes/deals';
import taskRoutes from './routes/tasks';
import ticketRoutes from './routes/tickets';
import subscriptionRoutes from './routes/subscriptions';
import paymentRoutes from './routes/payments';
import activityRoutes from './routes/activities';
import campaignRoutes from './routes/campaigns';
import dashboardRoutes from './routes/dashboard';
import automationRoutes from './routes/automations';
import emailRoutes from './routes/emails';
import googleRoutes from './routes/calendar';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Función para obtener la IP local
const getLocalIP = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (nets) {
      for (const net of nets) {
        // Ignorar direcciones IPv6 y direcciones internas (no enlazadas)
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
};

// Middleware CORS - Permitir todas las conexiones desde la red
app.use(cors({
  origin: true, // Permitir cualquier origen (localhost, IPs locales, etc.)
  credentials: true, // Permitir cookies y credenciales
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
}));

// Aumentar el límite del body parser para permitir imágenes en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging para debug de conexiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/google', googleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM API is running' });
});

// Función para manejar la migración de todos los ENUMs antes de sync
async function ensureAllEnumsMigration() {
  try {
    console.log('🔧 Verificando y migrando ENUMs...');
    
    // Mapeo de tipos ENUM existentes en la base de datos
    const enumMappings: { [key: string]: { table: string; column: string; enumType: string }[] } = {
      'lifecycle_stage_enum': [
        { table: 'companies', column: 'lifecycleStage', enumType: 'lifecycle_stage_enum' },
        { table: 'contacts', column: 'lifecycleStage', enumType: 'lifecycle_stage_enum' }
      ],
      'task_type_enum': [
        { table: 'tasks', column: 'type', enumType: 'task_type_enum' }
      ],
      'task_status_enum': [
        { table: 'tasks', column: 'status', enumType: 'task_status_enum' }
      ],
      'task_priority_enum': [
        { table: 'tasks', column: 'priority', enumType: 'task_priority_enum' }
      ],
      'ticket_status_enum': [
        { table: 'tickets', column: 'status', enumType: 'ticket_status_enum' }
      ],
      'ticket_priority_enum': [
        { table: 'tickets', column: 'priority', enumType: 'ticket_priority_enum' }
      ],
      'campaign_type_enum': [
        { table: 'campaigns', column: 'type', enumType: 'campaign_type_enum' }
      ],
      'campaign_status_enum': [
        { table: 'campaigns', column: 'status', enumType: 'campaign_status_enum' }
      ],
      'automation_status_enum': [
        { table: 'automations', column: 'status', enumType: 'automation_status_enum' }
      ],
      'activity_type_enum': [
        { table: 'activities', column: 'type', enumType: 'activity_type_enum' }
      ],
      'payment_status_enum': [
        { table: 'payments', column: 'status', enumType: 'payment_status_enum' }
      ],
      'payment_method_enum': [
        { table: 'payments', column: 'method', enumType: 'payment_method_enum' }
      ],
      'subscription_status_enum': [
        { table: 'subscriptions', column: 'status', enumType: 'subscription_status_enum' }
      ],
      'billing_cycle_enum': [
        { table: 'subscriptions', column: 'billingCycle', enumType: 'billing_cycle_enum' }
      ]
    };

    // Migrar cada ENUM
    for (const [enumType, mappings] of Object.entries(enumMappings)) {
      for (const mapping of mappings) {
        try {
          const [results] = await sequelize.query(`
            SELECT column_name, udt_name
            FROM information_schema.columns 
            WHERE table_name = '${mapping.table}' AND column_name = '${mapping.column}'
          `) as [Array<{ column_name: string; udt_name: string }>, unknown];

          if (results.length > 0) {
            const currentType = results[0].udt_name;
            
            // Si la columna no está usando el tipo ENUM correcto, convertirla
            if (currentType !== enumType && currentType.startsWith('enum_')) {
              console.log(`🔧 Migrando ${mapping.table}.${mapping.column} de ${currentType} a ${enumType}...`);
              
              await sequelize.query(`
                ALTER TABLE ${mapping.table} 
                ALTER COLUMN "${mapping.column}" TYPE ${enumType} 
                USING "${mapping.column}"::text::${enumType};
              `);
              
              console.log(`✓ Migración de ${mapping.table}.${mapping.column} completada.`);
            }
          }
        } catch (error: any) {
          // Ignorar errores si la columna no existe o el tipo no existe
          if (!error.message.includes('does not exist') && !error.message.includes('no existe')) {
            console.warn(`⚠️  Advertencia al migrar ${mapping.table}.${mapping.column}:`, error.message);
          }
        }
      }
    }

    // Eliminar cualquier ENUM que Sequelize pueda intentar crear (que empiecen con enum_ pero no sean los correctos)
    await sequelize.query(`
      DO $$ 
      DECLARE
        r RECORD;
        validEnums TEXT[] := ARRAY[
          'lifecycle_stage_enum', 'task_type_enum', 'task_status_enum', 'task_priority_enum',
          'ticket_status_enum', 'ticket_priority_enum', 'campaign_type_enum', 'campaign_status_enum',
          'automation_status_enum', 'activity_type_enum', 'payment_status_enum', 'payment_method_enum',
          'subscription_status_enum', 'billing_cycle_enum'
        ];
      BEGIN
        FOR r IN 
          SELECT typname FROM pg_type 
          WHERE typname LIKE 'enum_%'
          AND NOT (typname = ANY(validEnums))
        LOOP
          -- Solo eliminar si no está siendo usado por ninguna columna
          BEGIN
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
          EXCEPTION WHEN OTHERS THEN
            -- Ignorar errores al eliminar
            NULL;
          END;
        END LOOP;
      END $$;
    `);

    console.log('✓ Migración de ENUMs completada.');
  } catch (error: any) {
    console.error('Error durante la migración de ENUMs:', error.message);
  }
}

// Función para manejar la migración de roleId antes de sync
async function ensureRoleIdMigration() {
  try {
    // Verificar si la columna roleId existe
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'roleId'
    `) as [Array<{ column_name: string }>, unknown];

    const hasRoleId = results.length > 0;

    if (!hasRoleId) {
      console.log('🔧 Migrando columna roleId...');
      
      // 1. Sincronizar tabla de roles primero
      await Role.sync({ alter: true });
      
      // 2. Asegurar que existan roles
      const roleCount = await Role.count();
      if (roleCount === 0) {
        await Role.bulkCreate([
          { name: 'admin', description: 'Administrador del sistema' },
          { name: 'user', description: 'Usuario estándar' },
          { name: 'manager', description: 'Gerente' },
          { name: 'jefe_comercial', description: 'Jefe Comercial' },
        ]);
      }

      // 3. Agregar columna roleId como nullable primero
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "roleId" INTEGER;
      `);

      // 4. Asignar roleId por defecto a usuarios existentes
      const defaultRole = await Role.findOne({ where: { name: 'user' } });
      if (defaultRole) {
        await sequelize.query(`
          UPDATE users
          SET "roleId" = ${defaultRole.id}
          WHERE "roleId" IS NULL;
        `);
      }

      // 5. Hacer roleId NOT NULL
      await sequelize.query(`
        ALTER TABLE users ALTER COLUMN "roleId" SET NOT NULL;
      `);

      // 6. Agregar foreign key constraint si no existe
      try {
        await sequelize.query(`
          ALTER TABLE users
          ADD CONSTRAINT fk_users_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT;
        `);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }

      // 7. Crear índice si no existe
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_users_roleId ON users("roleId");
      `);

      console.log('✓ Migración de roleId completada.');
    }
  } catch (error: any) {
    console.error('Error durante la migración de roleId:', error.message);
    throw error;
  }
}

// Initialize database and start server
sequelize.authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');
    
    // Manejar migración de todos los ENUMs antes de sync
    await ensureAllEnumsMigration();
    
    // Manejar migración de roleId antes de sync
    await ensureRoleIdMigration();
    
    // Sincronizar tablas que tienen ENUMs sin alter para evitar conflictos
    const { Company, Contact, Task, Ticket, Campaign, Automation, Activity, Payment, Subscription } = await import('./models');
    
    await Company.sync({ alter: false });
    await Contact.sync({ alter: false });
    await Task.sync({ alter: false });
    await Ticket.sync({ alter: false });
    await Campaign.sync({ alter: false });
    await Automation.sync({ alter: false });
    await Activity.sync({ alter: false });
    await Payment.sync({ alter: false });
    await Subscription.sync({ alter: false });
    
    // Sincronizar el resto de las tablas con alter
    const { Deal, User, Role, MonthlyBudget, UserGoogleToken, ...rest } = await import('./models');
    
    const modelsToSync = [Deal, User, Role, MonthlyBudget, UserGoogleToken].filter(Boolean);
    for (const Model of modelsToSync) {
      if (Model && typeof (Model as any).sync === 'function') {
        await (Model as any).sync({ alter: true });
      }
    }
    
    // Ejecutar migración de ENUMs nuevamente después del sync para asegurar que todo esté correcto
    await ensureAllEnumsMigration();
    
    return Promise.resolve();
  })
  .then(() => {
    const localIP = getLocalIP();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n========================================');
      console.log(`✅ Servidor iniciado correctamente`);
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`\n🌐 Acceso desde otros dispositivos en la red:`);
      console.log(`   http://${localIP}:${PORT}/api`);
      console.log(`\n💻 Acceso local:`);
      console.log(`   http://localhost:${PORT}/api`);
      console.log(`   http://127.0.0.1:${PORT}/api`);
      console.log(`\n📱 Frontend debe acceder desde:`);
      console.log(`   http://${localIP}:3000`);
      console.log(`========================================\n`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

export default app;

