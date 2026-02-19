"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const os_1 = __importDefault(require("os"));
require("./config/env"); // Cargar configuración de entorno (debe ser lo primero)
// Configurar zona horaria de Perú (America/Lima, UTC-5)
process.env.TZ = 'America/Lima';
// Validar variables de entorno críticas antes de continuar
if (!process.env.JWT_SECRET) {
    console.error('❌ ERROR CRÍTICO: JWT_SECRET no está configurado');
    console.error('❌ Configura JWT_SECRET en tu archivo .env o .env.production');
    console.error('❌ Ejemplo: JWT_SECRET=tu-secret-key-super-seguro-aqui');
    process.exit(1);
}
const database_1 = require("./config/database");
require("./models"); // Import models to register associations
const Role_1 = require("./models/Role");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const companies_1 = __importDefault(require("./routes/companies"));
const deals_1 = __importDefault(require("./routes/deals"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const payments_1 = __importDefault(require("./routes/payments"));
const activities_1 = __importDefault(require("./routes/activities"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const automations_1 = __importDefault(require("./routes/automations"));
const emails_1 = __importDefault(require("./routes/emails"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const reports_1 = __importDefault(require("./routes/reports"));
const search_1 = __importDefault(require("./routes/search"));
const systemLogs_1 = __importDefault(require("./routes/systemLogs"));
const roles_1 = __importDefault(require("./routes/roles"));
const massEmail_1 = __importDefault(require("./routes/massEmail"));
const cacheHeaders_1 = require("./middleware/cacheHeaders");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// Función para obtener la IP local
const getLocalIP = () => {
    const interfaces = os_1.default.networkInterfaces();
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
// Middleware CORS - Permitir conexiones desde la URL de producción y desarrollo
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como Postman, mobile apps, etc.)
        if (!origin) {
            console.log('🌐 [CORS] Request sin origin, permitido');
            return callback(null, true);
        }
        // URLs permitidas
        const allowedOrigins = [
            'https://crm.taximonterrico.com',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
        ];
        // Permitir también cualquier IP local para desarrollo
        const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
        const isAllowed = allowedOrigins.includes(origin) || isLocalhost;
        if (isAllowed) {
            console.log('✅ [CORS] Origen permitido:', origin);
            callback(null, true);
        }
        else {
            console.error('❌ [CORS] Origen NO permitido:', origin);
            console.error('📋 [CORS] Orígenes permitidos:', allowedOrigins);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true, // Permitir cookies y credenciales
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Authorization'],
}));
// Aumentar el límite del body parser para permitir imágenes en base64
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100mb' }));
// Logging para debug de conexiones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    next();
});
// Middleware para agregar headers de caché HTTP
app.use('/api', cacheHeaders_1.setCacheHeaders);
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/contacts', contacts_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/deals', deals_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/tickets', tickets_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/activities', activities_1.default);
app.use('/api/campaigns', campaigns_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/automations', automations_1.default);
app.use('/api/emails', emails_1.default);
app.use('/api/google', calendar_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/search', search_1.default);
app.use('/api/system-logs', systemLogs_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/mass-email', massEmail_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CRM API is running' });
});
// Función para manejar la migración de todos los ENUMs antes de sync
async function ensureAllEnumsMigration() {
    try {
        console.log('🔧 Verificando y migrando ENUMs...');
        // Función auxiliar para crear enums si no existen
        const ensureEnum = async (enumName, values) => {
            try {
                // Verificar si el enum ya existe
                const [results] = await database_1.sequelize.query(`
          SELECT 1 FROM pg_type WHERE typname = '${enumName}'
        `);
                if (results.length === 0) {
                    // El enum no existe, crearlo
                    const valuesList = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
                    await database_1.sequelize.query(`CREATE TYPE ${enumName} AS ENUM (${valuesList})`);
                    console.log(`✅ Enum ${enumName} creado`);
                }
                else {
                    console.log(`✓ Enum ${enumName} ya existe`);
                }
            }
            catch (error) {
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
        const ensureColumnWithEnum = async (table, column, enumType, defaultValue) => {
            try {
                const [results] = await database_1.sequelize.query(`
          SELECT column_name, udt_name
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = '${column}'
        `);
                if (results.length === 0) {
                    // La columna no existe, crearla
                    console.log(`🔧 Creando columna ${column} en ${table}...`);
                    await database_1.sequelize.query(`
            ALTER TABLE ${table} 
            ADD COLUMN "${column}" ${enumType} NOT NULL DEFAULT '${defaultValue}';
          `);
                    console.log(`✅ Columna ${column} creada en ${table}`);
                }
                else {
                    const currentType = results[0].udt_name;
                    if (currentType !== enumType && currentType.startsWith('enum_')) {
                        // Tiene un enum incorrecto, convertirlo al correcto
                        console.log(`🔧 Convirtiendo columna ${column} en ${table} de ${currentType} a ${enumType}...`);
                        try {
                            await database_1.sequelize.query(`
                ALTER TABLE ${table} 
                ALTER COLUMN "${column}" TYPE TEXT USING "${column}"::text;
              `);
                            await database_1.sequelize.query(`
                ALTER TABLE ${table} 
                ALTER COLUMN "${column}" TYPE ${enumType} USING "${column}"::${enumType};
              `);
                            console.log(`✅ Columna ${column} convertida en ${table}`);
                        }
                        catch (convertError) {
                            console.warn(`⚠️  No se pudo convertir la columna:`, convertError.message);
                        }
                    }
                    else if (currentType === enumType) {
                        console.log(`✅ Columna ${column} en ${table} ya tiene el tipo correcto`);
                    }
                }
            }
            catch (error) {
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
            const [results] = await database_1.sequelize.query(`
        SELECT column_name, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'priority'
      `);
            if (results.length === 0) {
                console.log('🔧 Creando columna priority en deals...');
                await database_1.sequelize.query(`
          ALTER TABLE deals 
          ADD COLUMN "priority" deal_priority_enum;
        `);
                console.log('✅ Columna priority creada en deals');
            }
            else {
                const currentType = results[0].udt_name;
                // Si la columna existe pero tiene un tipo ENUM incorrecto (enum_deals_priority), convertirla
                if (currentType === 'enum_deals_priority' || currentType.startsWith('enum_')) {
                    console.log(`🔧 Convirtiendo columna priority en deals de ${currentType} a deal_priority_enum...`);
                    try {
                        // Convertir a TEXT primero
                        await database_1.sequelize.query(`
              ALTER TABLE deals 
              ALTER COLUMN "priority" TYPE TEXT USING "priority"::text;
            `);
                        // Luego convertir al ENUM correcto
                        await database_1.sequelize.query(`
              ALTER TABLE deals 
              ALTER COLUMN "priority" TYPE deal_priority_enum USING "priority"::deal_priority_enum;
            `);
                        console.log('✅ Columna priority convertida en deals');
                    }
                    catch (convertError) {
                        console.warn(`⚠️  No se pudo convertir la columna priority:`, convertError.message);
                    }
                }
                else if (currentType === 'deal_priority_enum') {
                    console.log('✓ Columna priority ya tiene el tipo correcto en deals');
                }
            }
        }
        catch (error) {
            console.warn('⚠️  Error al crear/verificar columna priority en deals:', error.message);
        }
        // Mapeo de tipos ENUM existentes en la base de datos
        const enumMappings = {
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
                    const [results] = await database_1.sequelize.query(`
            SELECT column_name, udt_name
            FROM information_schema.columns 
            WHERE table_name = '${mapping.table}' AND column_name = '${mapping.column}'
          `);
                    if (results.length > 0) {
                        const currentType = results[0].udt_name;
                        // Si la columna está usando un enum incorrecto (que empieza con enum_ pero no es el correcto), convertirla
                        if (currentType !== enumType && currentType.startsWith('enum_')) {
                            console.log(`🔧 Migrando ${mapping.table}.${mapping.column} de ${currentType} a ${enumType}...`);
                            try {
                                // Primero convertir a texto, luego al enum correcto
                                await database_1.sequelize.query(`
                  ALTER TABLE ${mapping.table} 
                  ALTER COLUMN "${mapping.column}" TYPE TEXT USING "${mapping.column}"::text;
                `);
                                await database_1.sequelize.query(`
                  ALTER TABLE ${mapping.table} 
                  ALTER COLUMN "${mapping.column}" TYPE ${enumType} USING "${mapping.column}"::${enumType};
                `);
                                console.log(`✓ Migración de ${mapping.table}.${mapping.column} completada.`);
                            }
                            catch (convertError) {
                                console.warn(`⚠️  No se pudo migrar ${mapping.table}.${mapping.column}:`, convertError.message);
                            }
                        }
                        else if (currentType === enumType) {
                            // Ya tiene el tipo correcto, no hacer nada
                            console.log(`✓ ${mapping.table}.${mapping.column} ya tiene el tipo correcto (${enumType})`);
                        }
                    }
                }
                catch (error) {
                    // Ignorar errores si la columna no existe o el tipo no existe
                    if (!error.message.includes('does not exist') && !error.message.includes('no existe')) {
                        console.warn(`⚠️  Advertencia al verificar ${mapping.table}.${mapping.column}:`, error.message);
                    }
                }
            }
        }
        // Eliminar cualquier ENUM incorrecto que Sequelize pueda haber creado
        // Especialmente enum_companies_lifecycleStage y enum_contacts_lifecycleStage
        await database_1.sequelize.query(`
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
    }
    catch (error) {
        console.error('Error durante la migración de ENUMs:', error.message);
    }
}
// Función para manejar la migración de columnas gmailMessageId y gmailThreadId en activities
async function ensureActivityGmailColumnsMigration() {
    try {
        // Verificar si las columnas existen
        const [results] = await database_1.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
      AND column_name IN ('gmailMessageId', 'gmailThreadId')
    `);
        const existingColumns = results.map((r) => r.column_name);
        const hasGmailMessageId = existingColumns.includes('gmailMessageId');
        const hasGmailThreadId = existingColumns.includes('gmailThreadId');
        if (!hasGmailMessageId) {
            console.log('🔧 Agregando columna gmailMessageId a activities...');
            await database_1.sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN IF NOT EXISTS "gmailMessageId" VARCHAR(255);
      `);
            console.log('✅ Columna gmailMessageId agregada a activities');
        }
        else {
            console.log('✓ Columna gmailMessageId ya existe en activities');
        }
        if (!hasGmailThreadId) {
            console.log('🔧 Agregando columna gmailThreadId a activities...');
            await database_1.sequelize.query(`
        ALTER TABLE activities 
        ADD COLUMN IF NOT EXISTS "gmailThreadId" VARCHAR(255);
      `);
            console.log('✅ Columna gmailThreadId agregada a activities');
        }
        else {
            console.log('✓ Columna gmailThreadId ya existe en activities');
        }
    }
    catch (error) {
        console.error('❌ Error en migración de columnas Gmail de activities:', error.message);
        // No lanzar error, solo registrar
    }
}
// Función para manejar la migración de roleId antes de sync
async function ensureRoleIdMigration() {
    try {
        // Verificar si la columna roleId existe
        const [results] = await database_1.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'roleId'
    `);
        const hasRoleId = results.length > 0;
        if (!hasRoleId) {
            console.log('🔧 Migrando columna roleId...');
            // 1. Sincronizar tabla de roles primero
            await Role_1.Role.sync({ alter: true });
            // 2. Asegurar que existan roles
            const roleCount = await Role_1.Role.count();
            if (roleCount === 0) {
                await Role_1.Role.bulkCreate([
                    { name: 'admin', description: 'Administrador del sistema' },
                    { name: 'user', description: 'Usuario estándar' },
                    { name: 'manager', description: 'Gerente' },
                    { name: 'jefe_comercial', description: 'Jefe Comercial' },
                ]);
            }
            // 3. Agregar columna roleId como nullable primero
            await database_1.sequelize.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "roleId" INTEGER;
      `);
            // 4. Asignar roleId por defecto a usuarios existentes
            const defaultRole = await Role_1.Role.findOne({ where: { name: 'user' } });
            if (defaultRole) {
                await database_1.sequelize.query(`
          UPDATE users
          SET "roleId" = ${defaultRole.id}
          WHERE "roleId" IS NULL;
        `);
            }
            // 5. Hacer roleId NOT NULL
            await database_1.sequelize.query(`
        ALTER TABLE users ALTER COLUMN "roleId" SET NOT NULL;
      `);
            // 6. Agregar foreign key constraint si no existe
            try {
                await database_1.sequelize.query(`
          ALTER TABLE users
          ADD CONSTRAINT fk_users_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT;
        `);
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
            // 7. Crear índice si no existe
            await database_1.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_users_roleId ON users("roleId");
      `);
            console.log('✓ Migración de roleId completada.');
        }
    }
    catch (error) {
        console.error('Error durante la migración de roleId:', error.message);
        throw error;
    }
}
// Initialize database and start server
database_1.sequelize.authenticate()
    .then(async () => {
    console.log('Database connection established successfully.');
    // Manejar migración de todos los ENUMs antes de sync
    await ensureAllEnumsMigration();
    // Manejar migración de roleId antes de sync
    await ensureRoleIdMigration();
    // Manejar migración de columnas gmailMessageId y gmailThreadId en activities
    await ensureActivityGmailColumnsMigration();
    // Sincronizar tablas que tienen ENUMs
    // NO usar alter: true porque puede causar conflictos cuando la columna ya existe con un enum diferente
    // Las columnas se crean manualmente en ensureAllEnumsMigration() si no existen
    const { Company, Contact, Task, TaskComment, Ticket, Campaign, Automation, Activity, Payment, Subscription } = await Promise.resolve().then(() => __importStar(require('./models')));
    // Solo hacer sync sin alter para evitar conflictos de tipos ENUM
    await Company.sync({ alter: false });
    await Contact.sync({ alter: false });
    await Task.sync({ alter: false });
    if (TaskComment && typeof TaskComment.sync === 'function') {
        await TaskComment.sync({ alter: true });
    }
    await Ticket.sync({ alter: false });
    await Campaign.sync({ alter: false });
    await Automation.sync({ alter: false });
    // Activity: las columnas gmailMessageId y gmailThreadId se crean manualmente en ensureActivityGmailColumnsMigration()
    await Activity.sync({ alter: false });
    await Payment.sync({ alter: false });
    await Subscription.sync({ alter: false });
    // Sincronizar el resto de las tablas con alter (excepto Deal que tiene columnas ENUM manuales)
    const { Deal, User, Role, MonthlyBudget, UserGoogleToken, DealContact, DealCompany, ContactCompany, CompanyCompany, ContactContact, SystemLog, ...rest } = await Promise.resolve().then(() => __importStar(require('./models')));
    // Sincronizar Deal sin alter para evitar conflictos con ENUMs
    if (Deal && typeof Deal.sync === 'function') {
        await Deal.sync({ alter: false });
    }
    // Sincronizar tablas de asociación (muchos a muchos)
    if (DealContact && typeof DealContact.sync === 'function') {
        try {
            await DealContact.sync({ alter: true });
        }
        catch (error) {
            // Si falla por restricciones, intentar sin alter
            if (error.name === 'SequelizeUnknownConstraintError' || error.code === '42704') {
                console.warn('⚠️  Advertencia al sincronizar DealContact con alter, intentando sin alter...');
                await DealContact.sync({ alter: false });
            }
            else {
                throw error;
            }
        }
    }
    if (DealCompany && typeof DealCompany.sync === 'function') {
        try {
            await DealCompany.sync({ alter: true });
        }
        catch (error) {
            // Si falla por restricciones que no existen, intentar sin alter
            if (error.name === 'SequelizeUnknownConstraintError' || error.code === '42704') {
                console.warn('⚠️  Advertencia al sincronizar DealCompany con alter, intentando sin alter...');
                await DealCompany.sync({ alter: false });
            }
            else {
                throw error;
            }
        }
    }
    if (ContactCompany && typeof ContactCompany.sync === 'function') {
        try {
            await ContactCompany.sync({ alter: true });
        }
        catch (error) {
            // Si falla por restricciones, intentar sin alter
            if (error.name === 'SequelizeUnknownConstraintError' || error.code === '42704') {
                console.warn('⚠️  Advertencia al sincronizar ContactCompany con alter, intentando sin alter...');
                await ContactCompany.sync({ alter: false });
            }
            else {
                throw error;
            }
        }
    }
    if (CompanyCompany && typeof CompanyCompany.sync === 'function') {
        try {
            await CompanyCompany.sync({ alter: true });
        }
        catch (error) {
            // Si falla por restricciones que no existen, intentar sin alter
            if (error.name === 'SequelizeUnknownConstraintError' || error.code === '42704') {
                console.warn('⚠️  Advertencia al sincronizar CompanyCompany con alter, intentando sin alter...');
                await CompanyCompany.sync({ alter: false });
            }
            else {
                throw error;
            }
        }
    }
    if (ContactContact && typeof ContactContact.sync === 'function') {
        try {
            await ContactContact.sync({ alter: true });
        }
        catch (error) {
            // Si falla por restricciones que no existen, intentar sin alter
            if (error.name === 'SequelizeUnknownConstraintError' || error.code === '42704') {
                console.warn('⚠️  Advertencia al sincronizar ContactContact con alter, intentando sin alter...');
                await ContactContact.sync({ alter: false });
            }
            else {
                throw error;
            }
        }
    }
    // Sincronizar User con manejo de errores para restricciones faltantes
    if (User && typeof User.sync === 'function') {
        try {
            await User.sync({ alter: true });
        }
        catch (error) {
            // Si el error es por una restricción que no existe, reintentar sin alter
            if (error.name === 'SequelizeUnknownConstraintError' || error.parent?.code === '42704') {
                console.warn(`⚠️  Restricción 'users_roleId_fkey' no encontrada. Reintentando User.sync sin alter: true.`);
                await User.sync({ alter: false });
            }
            else {
                throw error; // Re-lanzar otros errores
            }
        }
    }
    // Sincronizar el resto de modelos con alter
    const modelsToSync = [Role, MonthlyBudget, UserGoogleToken, SystemLog].filter(Boolean);
    for (const Model of modelsToSync) {
        if (Model && typeof Model.sync === 'function') {
            await Model.sync({ alter: true });
        }
    }
    // Ejecutar migración de ENUMs nuevamente después del sync para asegurar que todo esté correcto
    await ensureAllEnumsMigration();
    return Promise.resolve();
})
    .then(() => {
    const localIP = getLocalIP();
    const server = app.listen(PORT, '0.0.0.0', () => {
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
    // Aumentar timeout para operaciones largas (importaciones masivas)
    server.timeout = 600000; // 10 minutos
})
    .catch((error) => {
    console.error('Unable to connect to the database:', error);
});
exports.default = app;
