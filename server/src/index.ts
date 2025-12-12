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
import reportRoutes from './routes/reports';
import searchRoutes from './routes/search';

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
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM API is running' });
});

// Función para manejar la migración de todos los ENUMs antes de sync
async function ensureAllEnumsMigration() {
  try {
    console.log('🔧 Verificando y migrando ENUMs...');
    
    // Función auxiliar para crear enums si no existen
    const ensureEnum = async (enumName: string, values: string[]) => {
      try {
        // Verificar si el enum ya existe
        const [results] = await sequelize.query(`
          SELECT 1 FROM pg_type WHERE typname = '${enumName}'
        `) as [Array<{ [key: string]: any }>, unknown];
        
        if (results.length === 0) {
          // El enum no existe, crearlo
          const valuesList = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
          await sequelize.query(`CREATE TYPE ${enumName} AS ENUM (${valuesList})`);
          console.log(`✅ Enum ${enumName} creado`);
        } else {
          console.log(`✓ Enum ${enumName} ya existe`);
        }
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️  Advertencia al crear enum ${enumName}:`, error.message);
        }
      }
    };
    
    // Crear todos los enums necesarios
    await ensureEnum('lifecycle_stage_enum', [
      'lead_inactivo', 'cliente_perdido', 'cierre_perdido', 'lead',
      'contacto', 'reunion_agendada', 'reunion_efectiva', 'propuesta_economica',
      'negociacion', 'licitacion', 'licitacion_etapa_final', 'cierre_ganado',
      'firma_contrato', 'activo'
    ]);
    
    await ensureEnum('task_type_enum', ['call', 'email', 'meeting', 'note', 'todo', 'other']);
    await ensureEnum('task_status_enum', ['not started', 'in progress', 'completed', 'cancelled']);
    await ensureEnum('task_priority_enum', ['low', 'medium', 'high', 'urgent']);
    await ensureEnum('campaign_status_enum', ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']);
    await ensureEnum('payment_status_enum', ['pending', 'completed', 'failed', 'refunded', 'cancelled']);
    await ensureEnum('activity_type_enum', ['call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company']);
    await ensureEnum('deal_priority_enum', ['baja', 'media', 'alta']);
    
    // Función auxiliar para crear/verificar columnas con ENUMs
    const ensureColumnWithEnum = async (
      table: string, 
      column: string, 
      enumType: string, 
      defaultValue: string
    ) => {
      try {
        const [results] = await sequelize.query(`
          SELECT column_name, udt_name
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = '${column}'
        `) as [Array<{ column_name: string; udt_name: string }>, unknown];
        
        if (results.length === 0) {
          // La columna no existe, crearla
          console.log(`🔧 Creando columna ${column} en ${table}...`);
          await sequelize.query(`
            ALTER TABLE ${table} 
            ADD COLUMN "${column}" ${enumType} NOT NULL DEFAULT '${defaultValue}';
          `);
          console.log(`✅ Columna ${column} creada en ${table}`);
        } else {
          const currentType = results[0].udt_name;
          if (currentType !== enumType && currentType.startsWith('enum_')) {
            // Tiene un enum incorrecto, convertirlo al correcto
            console.log(`🔧 Convirtiendo columna ${column} en ${table} de ${currentType} a ${enumType}...`);
            try {
              await sequelize.query(`
                ALTER TABLE ${table} 
                ALTER COLUMN "${column}" TYPE TEXT USING "${column}"::text;
              `);
              await sequelize.query(`
                ALTER TABLE ${table} 
                ALTER COLUMN "${column}" TYPE ${enumType} USING "${column}"::${enumType};
              `);
              console.log(`✅ Columna ${column} convertida en ${table}`);
            } catch (convertError: any) {
              console.warn(`⚠️  No se pudo convertir la columna:`, convertError.message);
            }
          } else if (currentType === enumType) {
            console.log(`✅ Columna ${column} en ${table} ya tiene el tipo correcto`);
          }
        }
      } catch (error: any) {
        console.warn(`⚠️  Advertencia al verificar/crear columna ${column} en ${table}:`, error.message);
      }
    };
    
    // Verificar y crear columnas lifecycleStage
    await ensureColumnWithEnum('contacts', 'lifecycleStage', 'lifecycle_stage_enum', 'lead');
    await ensureColumnWithEnum('companies', 'lifecycleStage', 'lifecycle_stage_enum', 'lead');
    
    // Verificar y crear columnas en tasks
    await ensureColumnWithEnum('tasks', 'type', 'task_type_enum', 'other');
    await ensureColumnWithEnum('tasks', 'status', 'task_status_enum', 'not started');
    await ensureColumnWithEnum('tasks', 'priority', 'task_priority_enum', 'medium');
    // Verificar y crear columnas status en campaigns y payments
    await ensureColumnWithEnum('campaigns', 'status', 'campaign_status_enum', 'draft');
    await ensureColumnWithEnum('payments', 'status', 'payment_status_enum', 'pending');
    
    // Verificar y crear columna type en activities
    await ensureColumnWithEnum('activities', 'type', 'activity_type_enum', 'note');
    
    // Crear columna priority en deals si no existe (sin valor por defecto, nullable)
    try {
      const [results] = await sequelize.query(`
        SELECT column_name, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'priority'
      `) as [Array<{ column_name: string; udt_name: string }>, unknown];
      
      if (results.length === 0) {
        console.log('🔧 Creando columna priority en deals...');
        await sequelize.query(`
          ALTER TABLE deals 
          ADD COLUMN "priority" deal_priority_enum;
        `);
        console.log('✅ Columna priority creada en deals');
      } else {
        const currentType = results[0].udt_name;
        // Si la columna existe pero tiene un tipo ENUM incorrecto (enum_deals_priority), convertirla
        if (currentType === 'enum_deals_priority' || currentType.startsWith('enum_')) {
          console.log(`🔧 Convirtiendo columna priority en deals de ${currentType} a deal_priority_enum...`);
          try {
            // Convertir a TEXT primero
            await sequelize.query(`
              ALTER TABLE deals 
              ALTER COLUMN "priority" TYPE TEXT USING "priority"::text;
            `);
            // Luego convertir al ENUM correcto
            await sequelize.query(`
              ALTER TABLE deals 
              ALTER COLUMN "priority" TYPE deal_priority_enum USING "priority"::deal_priority_enum;
            `);
            console.log('✅ Columna priority convertida en deals');
          } catch (convertError: any) {
            console.warn(`⚠️  No se pudo convertir la columna priority:`, convertError.message);
          }
        } else if (currentType === 'deal_priority_enum') {
          console.log('✓ Columna priority ya tiene el tipo correcto en deals');
        }
      }
    } catch (error: any) {
      console.warn('⚠️  Error al crear/verificar columna priority en deals:', error.message);
    }
    
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

    // Migrar cada ENUM - convertir columnas que usan enums incorrectos al enum correcto
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
            
            // Si la columna está usando un enum incorrecto (que empieza con enum_ pero no es el correcto), convertirla
            if (currentType !== enumType && currentType.startsWith('enum_')) {
              console.log(`🔧 Migrando ${mapping.table}.${mapping.column} de ${currentType} a ${enumType}...`);
              
              try {
                // Primero convertir a texto, luego al enum correcto
                await sequelize.query(`
                  ALTER TABLE ${mapping.table} 
                  ALTER COLUMN "${mapping.column}" TYPE TEXT USING "${mapping.column}"::text;
                `);
                
                await sequelize.query(`
                  ALTER TABLE ${mapping.table} 
                  ALTER COLUMN "${mapping.column}" TYPE ${enumType} USING "${mapping.column}"::${enumType};
                `);
                
                console.log(`✓ Migración de ${mapping.table}.${mapping.column} completada.`);
              } catch (convertError: any) {
                console.warn(`⚠️  No se pudo migrar ${mapping.table}.${mapping.column}:`, convertError.message);
              }
            } else if (currentType === enumType) {
              // Ya tiene el tipo correcto, no hacer nada
              console.log(`✓ ${mapping.table}.${mapping.column} ya tiene el tipo correcto (${enumType})`);
            }
          }
        } catch (error: any) {
          // Ignorar errores si la columna no existe o el tipo no existe
          if (!error.message.includes('does not exist') && !error.message.includes('no existe')) {
            console.warn(`⚠️  Advertencia al verificar ${mapping.table}.${mapping.column}:`, error.message);
          }
        }
      }
    }

    // Eliminar cualquier ENUM incorrecto que Sequelize pueda haber creado
    // Especialmente enum_companies_lifecycleStage y enum_contacts_lifecycleStage
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
        -- Eliminar enums incorrectos de Sequelize que empiezan con enum_ pero no son válidos
        FOR r IN 
          SELECT typname FROM pg_type 
          WHERE typname LIKE 'enum_%'
          AND NOT (typname = ANY(validEnums))
        LOOP
          -- Verificar si el enum está siendo usado
          BEGIN
            -- Intentar eliminar, si está en uso fallará pero lo ignoramos
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            RAISE NOTICE 'Eliminado enum incorrecto: %', r.typname;
          EXCEPTION WHEN OTHERS THEN
            -- Ignorar errores si el enum está en uso
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
    
    // Sincronizar tablas que tienen ENUMs
    // NO usar alter: true porque puede causar conflictos cuando la columna ya existe con un enum diferente
    // Las columnas se crean manualmente en ensureAllEnumsMigration() si no existen
    const { Company, Contact, Task, Ticket, Campaign, Automation, Activity, Payment, Subscription } = await import('./models');
    
    // Solo hacer sync sin alter para evitar conflictos de tipos ENUM
    await Company.sync({ alter: false });
    await Contact.sync({ alter: false });
    await Task.sync({ alter: false });
    await Ticket.sync({ alter: false });
    await Campaign.sync({ alter: false });
    await Automation.sync({ alter: false });
    await Activity.sync({ alter: false });
    await Payment.sync({ alter: false });
    await Subscription.sync({ alter: false });
    
    // Sincronizar el resto de las tablas con alter (excepto Deal que tiene columnas ENUM manuales)
    const { Deal, User, Role, MonthlyBudget, UserGoogleToken, ...rest } = await import('./models');
    
    // Sincronizar Deal sin alter para evitar conflictos con ENUMs
    if (Deal && typeof (Deal as any).sync === 'function') {
      await (Deal as any).sync({ alter: false });
    }
    
    // Sincronizar el resto de modelos con alter
    const modelsToSync = [User, Role, MonthlyBudget, UserGoogleToken].filter(Boolean);
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

