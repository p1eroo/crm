-- ============================================
-- Script SQL para crear todas las tablas del CRM
-- ============================================

-- Eliminar tablas si existen (en orden inverso de dependencias)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS contact_companies CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS automations CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar tipos ENUM si existen
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS lifecycle_stage_enum CASCADE;
DROP TYPE IF EXISTS task_type_enum CASCADE;
DROP TYPE IF EXISTS task_status_enum CASCADE;
DROP TYPE IF EXISTS task_priority_enum CASCADE;
DROP TYPE IF EXISTS ticket_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_priority_enum CASCADE;
DROP TYPE IF EXISTS campaign_type_enum CASCADE;
DROP TYPE IF EXISTS campaign_status_enum CASCADE;
DROP TYPE IF EXISTS automation_status_enum CASCADE;
DROP TYPE IF EXISTS activity_type_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS payment_method_enum CASCADE;
DROP TYPE IF EXISTS subscription_status_enum CASCADE;
DROP TYPE IF EXISTS billing_cycle_enum CASCADE;

-- Crear tipos ENUM
CREATE TYPE user_role_enum AS ENUM ('admin', 'user', 'manager');
CREATE TYPE lifecycle_stage_enum AS ENUM (
    'subscriber', 
    'lead', 
    'contacto',
    'reunion_agendada',
    'reunion_efectiva',
    'propuesta_economica',
    'negociacion',
    'cierre_ganado',
    'cierre_perdido',
    'marketing qualified lead', 
    'sales qualified lead', 
    'opportunity', 
    'customer', 
    'evangelist'
);
CREATE TYPE task_type_enum AS ENUM ('call', 'email', 'meeting', 'note', 'todo', 'other');
CREATE TYPE task_status_enum AS ENUM ('not started', 'in progress', 'completed', 'cancelled');
CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status_enum AS ENUM ('new', 'open', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE campaign_type_enum AS ENUM ('email', 'social', 'advertising', 'other');
CREATE TYPE campaign_status_enum AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE automation_status_enum AS ENUM ('active', 'inactive', 'draft');
CREATE TYPE activity_type_enum AS ENUM ('call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'pending');
CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'quarterly', 'yearly', 'one-time');

-- ============================================
-- Tabla: users
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    usuario VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'user',
    avatar VARCHAR(255),
    phone VARCHAR(255),
    language VARCHAR(255) DEFAULT 'es',
    "dateFormat" VARCHAR(255) DEFAULT 'es-ES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================
-- Tabla: companies
-- ============================================
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(255),
    type VARCHAR(255),
    phone VARCHAR(255),
    ruc VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    "postalCode" VARCHAR(255),
    website VARCHAR(255),
    "numberOfEmployees" INTEGER,
    "annualRevenue" DECIMAL(15, 2),
    description TEXT,
    "ownerId" INTEGER,
    "lifecycleStage" lifecycle_stage_enum NOT NULL DEFAULT 'lead',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_companies_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla: contacts
-- ============================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    mobile VARCHAR(255),
    "jobTitle" VARCHAR(255),
    "companyId" INTEGER,
    "ownerId" INTEGER,
    address VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    "postalCode" VARCHAR(255),
    website VARCHAR(255),
    facebook VARCHAR(255),
    twitter VARCHAR(255),
    github VARCHAR(255),
    linkedin VARCHAR(255),
    youtube VARCHAR(255),
    "lifecycleStage" lifecycle_stage_enum NOT NULL DEFAULT 'lead',
    "leadStatus" VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contacts_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT fk_contacts_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================
-- Tabla: contact_companies (relación muchos-a-muchos)
-- ============================================
CREATE TABLE contact_companies (
    id SERIAL PRIMARY KEY,
    "contactId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_companies_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_companies_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT unique_contact_company UNIQUE ("contactId", "companyId")
);

-- ============================================
-- Tabla: deals
-- ============================================
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    stage VARCHAR(255) NOT NULL,
    "closeDate" TIMESTAMP WITH TIME ZONE,
    probability INTEGER,
    "ownerId" INTEGER NOT NULL,
    "contactId" INTEGER,
    "companyId" INTEGER,
    "pipelineId" INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deals_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_deals_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_deals_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT probability_check CHECK (probability >= 0 AND probability <= 100)
);

-- ============================================
-- Tabla: tasks
-- ============================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type task_type_enum NOT NULL,
    status task_status_enum NOT NULL DEFAULT 'not started',
    priority task_priority_enum NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "assignedToId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "contactId" INTEGER,
    "companyId" INTEGER,
    "dealId" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_assigned FOREIGN KEY ("assignedToId") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tasks_created FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tasks_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_deal FOREIGN KEY ("dealId") REFERENCES deals(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla: tickets
-- ============================================
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status ticket_status_enum NOT NULL DEFAULT 'new',
    priority ticket_priority_enum NOT NULL DEFAULT 'medium',
    "assignedToId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "contactId" INTEGER,
    "companyId" INTEGER,
    "dealId" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_assigned FOREIGN KEY ("assignedToId") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_created FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_deal FOREIGN KEY ("dealId") REFERENCES deals(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla: campaigns
-- ============================================
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type campaign_type_enum NOT NULL,
    status campaign_status_enum NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(15, 2),
    spent DECIMAL(15, 2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    "ownerId" INTEGER NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campaigns_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================
-- Tabla: automations
-- ============================================
CREATE TABLE automations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger VARCHAR(255) NOT NULL,
    conditions TEXT,
    actions TEXT,
    status automation_status_enum NOT NULL DEFAULT 'draft',
    "ownerId" INTEGER NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_automations_owner FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================
-- Tabla: activities
-- ============================================
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    type activity_type_enum NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    "userId" INTEGER NOT NULL,
    "contactId" INTEGER,
    "companyId" INTEGER,
    "dealId" INTEGER,
    "taskId" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activities_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_activities_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_activities_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT fk_activities_deal FOREIGN KEY ("dealId") REFERENCES deals(id) ON DELETE SET NULL,
    CONSTRAINT fk_activities_task FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla: subscriptions
-- ============================================
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status subscription_status_enum NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE,
    "renewalDate" TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(255) DEFAULT 'USD',
    "billingCycle" billing_cycle_enum NOT NULL DEFAULT 'monthly',
    "contactId" INTEGER,
    "companyId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscriptions_created FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_subscriptions_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_subscriptions_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla: payments
-- ============================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(255) DEFAULT 'USD',
    status payment_status_enum NOT NULL DEFAULT 'pending',
    "paymentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "paymentMethod" payment_method_enum NOT NULL DEFAULT 'credit_card',
    reference VARCHAR(255),
    description TEXT,
    "contactId" INTEGER,
    "companyId" INTEGER,
    "subscriptionId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_created FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_company FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_subscription FOREIGN KEY ("subscriptionId") REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- ============================================
-- Índices para mejorar el rendimiento
-- ============================================

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_usuario ON users(usuario);

-- Índices para contacts
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company_id ON contacts("companyId");
CREATE INDEX idx_contacts_owner_id ON contacts("ownerId");
CREATE INDEX idx_contacts_lifecycle_stage ON contacts("lifecycleStage");

-- Índices para companies
CREATE INDEX idx_companies_owner_id ON companies("ownerId");
CREATE INDEX idx_companies_lifecycle_stage ON companies("lifecycleStage");

-- Índices para deals
CREATE INDEX idx_deals_owner_id ON deals("ownerId");
CREATE INDEX idx_deals_contact_id ON deals("contactId");
CREATE INDEX idx_deals_company_id ON deals("companyId");
CREATE INDEX idx_deals_stage ON deals(stage);

-- Índices para tasks
CREATE INDEX idx_tasks_assigned_to_id ON tasks("assignedToId");
CREATE INDEX idx_tasks_created_by_id ON tasks("createdById");
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks("dueDate");

-- Índices para tickets
CREATE INDEX idx_tickets_assigned_to_id ON tickets("assignedToId");
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);

-- Índices para campaigns
CREATE INDEX idx_campaigns_owner_id ON campaigns("ownerId");
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Índices para automations
CREATE INDEX idx_automations_owner_id ON automations("ownerId");
CREATE INDEX idx_automations_status ON automations(status);

-- Índices para activities
CREATE INDEX idx_activities_user_id ON activities("userId");
CREATE INDEX idx_activities_contact_id ON activities("contactId");
CREATE INDEX idx_activities_company_id ON activities("companyId");
CREATE INDEX idx_activities_type ON activities(type);

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_contact_id ON subscriptions("contactId");
CREATE INDEX idx_subscriptions_company_id ON subscriptions("companyId");
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Índices para payments
CREATE INDEX idx_payments_contact_id ON payments("contactId");
CREATE INDEX idx_payments_company_id ON payments("companyId");
CREATE INDEX idx_payments_subscription_id ON payments("subscriptionId");
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments("paymentDate");

-- ============================================
-- Comentarios en las tablas
-- ============================================
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
COMMENT ON TABLE companies IS 'Tabla de empresas/clientes';
COMMENT ON TABLE contacts IS 'Tabla de contactos';
COMMENT ON TABLE contact_companies IS 'Tabla intermedia para relación muchos-a-muchos entre contactos y empresas';
COMMENT ON TABLE deals IS 'Tabla de negocios/oportunidades';
COMMENT ON TABLE tasks IS 'Tabla de tareas';
COMMENT ON TABLE tickets IS 'Tabla de tickets de soporte';
COMMENT ON TABLE campaigns IS 'Tabla de campañas de marketing';
COMMENT ON TABLE automations IS 'Tabla de automatizaciones';
COMMENT ON TABLE activities IS 'Tabla de actividades/registro de acciones';
COMMENT ON TABLE subscriptions IS 'Tabla de suscripciones';
COMMENT ON TABLE payments IS 'Tabla de pagos';

