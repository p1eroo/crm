-- ============================================
-- Script SQL completo para CRM Database
-- PostgreSQL Database Schema
-- ============================================

-- Eliminar tablas existentes si es necesario (descomentar si necesitas limpiar)
-- DROP TABLE IF EXISTS deal_deals CASCADE;
-- DROP TABLE IF EXISTS deal_contacts CASCADE;
-- DROP TABLE IF EXISTS deal_companies CASCADE;
-- DROP TABLE IF EXISTS contact_contacts CASCADE;
-- DROP TABLE IF EXISTS contact_companies CASCADE;
-- DROP TABLE IF EXISTS company_companies CASCADE;
-- DROP TABLE IF EXISTS systemLogs CASCADE;
-- DROP TABLE IF EXISTS user_google_tokens CASCADE;
-- DROP TABLE IF EXISTS monthly_budgets CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS automations CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS tickets CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS deals CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- Eliminar tipos ENUM si existen
DROP TYPE IF EXISTS lifecycle_stage_enum CASCADE;
DROP TYPE IF EXISTS deal_priority_enum CASCADE;
DROP TYPE IF EXISTS task_type_enum CASCADE;
DROP TYPE IF EXISTS task_status_enum CASCADE;
DROP TYPE IF EXISTS task_priority_enum CASCADE;
DROP TYPE IF EXISTS ticket_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_priority_enum CASCADE;
DROP TYPE IF EXISTS activity_type_enum CASCADE;
DROP TYPE IF EXISTS campaign_type_enum CASCADE;
DROP TYPE IF EXISTS campaign_status_enum CASCADE;
DROP TYPE IF EXISTS automation_status_enum CASCADE;
DROP TYPE IF EXISTS subscription_status_enum CASCADE;
DROP TYPE IF EXISTS subscription_billing_cycle_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS payment_method_enum CASCADE;

-- ============================================
-- CREAR TIPOS ENUM
-- ============================================

CREATE TYPE lifecycle_stage_enum AS ENUM (
  'lead', 
  'contacto', 
  'reunion_agendada', 
  'reunion_efectiva', 
  'propuesta_economica', 
  'negociacion', 
  'licitacion', 
  'licitacion_etapa_final', 
  'cierre_ganado', 
  'cierre_perdido', 
  'firma_contrato', 
  'activo', 
  'cliente_perdido', 
  'lead_inactivo'
);

CREATE TYPE deal_priority_enum AS ENUM ('baja', 'media', 'alta');

CREATE TYPE task_type_enum AS ENUM ('call', 'email', 'meeting', 'note', 'todo', 'other');

CREATE TYPE task_status_enum AS ENUM ('not started', 'in progress', 'completed', 'cancelled');

CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE ticket_status_enum AS ENUM ('new', 'open', 'pending', 'resolved', 'closed');

CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE activity_type_enum AS ENUM ('call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company');

CREATE TYPE campaign_type_enum AS ENUM ('email', 'social', 'advertising', 'other');

CREATE TYPE campaign_status_enum AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

CREATE TYPE automation_status_enum AS ENUM ('active', 'inactive', 'draft');

CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'pending');

CREATE TYPE subscription_billing_cycle_enum AS ENUM ('monthly', 'quarterly', 'yearly', 'one-time');

CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

CREATE TYPE payment_method_enum AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other');

-- ============================================
-- CREAR TABLAS
-- ============================================

-- Tabla: roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "roleId" INTEGER NOT NULL REFERENCES roles(id),
  avatar TEXT,
  phone VARCHAR(255),
  language VARCHAR(255) DEFAULT 'es',
  "dateFormat" VARCHAR(255) DEFAULT 'es-ES',
  "googleAccessToken" TEXT,
  "googleRefreshToken" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: companies
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  companyname VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  "leadSource" VARCHAR(255),
  ruc VARCHAR(255),
  "idClienteEmpresa" VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  linkedin VARCHAR(255),
  "numberOfEmployees" INTEGER,
  "ownerId" INTEGER REFERENCES users(id),
  "estimatedRevenue" DECIMAL(15, 2),
  "isRecoveredClient" BOOLEAN DEFAULT false,
  "lifecycleStage" lifecycle_stage_enum DEFAULT 'lead',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: contacts
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  dni VARCHAR(255),
  cee VARCHAR(255),
  phone VARCHAR(255),
  mobile VARCHAR(255),
  "jobTitle" VARCHAR(255),
  "companyId" INTEGER NOT NULL REFERENCES companies(id),
  "ownerId" INTEGER REFERENCES users(id),
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
  "lifecycleStage" lifecycle_stage_enum DEFAULT 'lead',
  "leadStatus" VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: deals
CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  stage VARCHAR(255) NOT NULL,
  "closeDate" TIMESTAMP WITH TIME ZONE,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  priority deal_priority_enum,
  "ownerId" INTEGER NOT NULL REFERENCES users(id),
  "contactId" INTEGER REFERENCES contacts(id),
  "companyId" INTEGER REFERENCES companies(id),
  "pipelineId" INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type task_type_enum NOT NULL,
  status task_status_enum DEFAULT 'not started',
  priority task_priority_enum DEFAULT 'medium',
  "dueDate" TIMESTAMP WITH TIME ZONE,
  "assignedToId" INTEGER NOT NULL REFERENCES users(id),
  "createdById" INTEGER NOT NULL REFERENCES users(id),
  "contactId" INTEGER REFERENCES contacts(id),
  "companyId" INTEGER REFERENCES companies(id),
  "dealId" INTEGER REFERENCES deals(id),
  "googleCalendarEventId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status ticket_status_enum DEFAULT 'new',
  priority ticket_priority_enum DEFAULT 'medium',
  "assignedToId" INTEGER NOT NULL REFERENCES users(id),
  "createdById" INTEGER NOT NULL REFERENCES users(id),
  "contactId" INTEGER REFERENCES contacts(id),
  "companyId" INTEGER REFERENCES companies(id),
  "dealId" INTEGER REFERENCES deals(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: activities
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  type activity_type_enum NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "contactId" INTEGER REFERENCES contacts(id),
  "companyId" INTEGER REFERENCES companies(id),
  "dealId" INTEGER REFERENCES deals(id),
  "taskId" INTEGER REFERENCES tasks(id),
  completed BOOLEAN DEFAULT false,
  "gmailMessageId" VARCHAR(255),
  "gmailThreadId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: campaigns
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type campaign_type_enum NOT NULL,
  status campaign_status_enum DEFAULT 'draft',
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(15, 2),
  spent DECIMAL(15, 2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  "ownerId" INTEGER NOT NULL REFERENCES users(id),
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: automations
CREATE TABLE automations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trigger VARCHAR(255) NOT NULL,
  conditions TEXT,
  actions TEXT,
  status automation_status_enum DEFAULT 'draft',
  "ownerId" INTEGER NOT NULL REFERENCES users(id),
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status subscription_status_enum DEFAULT 'active',
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "renewalDate" TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(255) DEFAULT 'PEN',
  "billingCycle" subscription_billing_cycle_enum DEFAULT 'monthly',
  "contactId" INTEGER REFERENCES contacts(id),
  "companyId" INTEGER REFERENCES companies(id),
  "createdById" INTEGER NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(255) DEFAULT 'PEN',
  status payment_status_enum DEFAULT 'pending',
  "paymentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "dueDate" TIMESTAMP WITH TIME ZONE,
  "paymentMethod" payment_method_enum DEFAULT 'credit_card',
  reference VARCHAR(255),
  description TEXT,
  "contactId" INTEGER REFERENCES contacts(id),
  "companyId" INTEGER REFERENCES companies(id),
  "subscriptionId" INTEGER REFERENCES subscriptions(id),
  "createdById" INTEGER NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: monthly_budgets
CREATE TABLE monthly_budgets (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

-- Tabla: user_google_tokens
CREATE TABLE user_google_tokens (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenExpiry" TIMESTAMP WITH TIME ZONE,
  scope TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: systemLogs
CREATE TABLE "systemLogs" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(255) NOT NULL,
  "entityId" INTEGER,
  details TEXT,
  "ipAddress" VARCHAR(255),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tablas de relación muchos-a-muchos

-- Tabla: contact_companies
CREATE TABLE contact_companies (
  id SERIAL PRIMARY KEY,
  "contactId" INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  "companyId" INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("contactId", "companyId")
);

-- Tabla: contact_contacts
CREATE TABLE contact_contacts (
  "contactId" INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  "relatedContactId" INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("contactId", "relatedContactId"),
  UNIQUE("contactId", "relatedContactId")
);

-- Tabla: company_companies
CREATE TABLE company_companies (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "relatedCompanyId" INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("companyId", "relatedCompanyId")
);

-- Tabla: deal_contacts
CREATE TABLE deal_contacts (
  id SERIAL PRIMARY KEY,
  "dealId" INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  "contactId" INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("dealId", "contactId")
);

-- Tabla: deal_companies
CREATE TABLE deal_companies (
  id SERIAL PRIMARY KEY,
  "dealId" INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  "companyId" INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("dealId", "companyId")
);

-- Tabla: deal_deals
CREATE TABLE deal_deals (
  "dealId" INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  "relatedDealId" INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("dealId", "relatedDealId"),
  UNIQUE("dealId", "relatedDealId")
);

-- ============================================
-- CREAR ÍNDICES
-- ============================================

-- Índices para users
CREATE INDEX idx_users_roleId ON users("roleId");
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_usuario ON users(usuario);

-- Índices para companies
CREATE INDEX idx_companies_ownerId ON companies("ownerId");
CREATE INDEX idx_companies_lifecycleStage ON companies("lifecycleStage");

-- Índices para contacts
CREATE INDEX idx_contacts_companyId ON contacts("companyId");
CREATE INDEX idx_contacts_ownerId ON contacts("ownerId");
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_lifecycleStage ON contacts("lifecycleStage");

-- Índices para deals
CREATE INDEX idx_deals_ownerId ON deals("ownerId");
CREATE INDEX idx_deals_contactId ON deals("contactId");
CREATE INDEX idx_deals_companyId ON deals("companyId");
CREATE INDEX idx_deals_stage ON deals(stage);

-- Índices para tasks
CREATE INDEX idx_tasks_assignedToId ON tasks("assignedToId");
CREATE INDEX idx_tasks_createdById ON tasks("createdById");
CREATE INDEX idx_tasks_contactId ON tasks("contactId");
CREATE INDEX idx_tasks_companyId ON tasks("companyId");
CREATE INDEX idx_tasks_dealId ON tasks("dealId");
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_dueDate ON tasks("dueDate");

-- Índices para tickets
CREATE INDEX idx_tickets_assignedToId ON tickets("assignedToId");
CREATE INDEX idx_tickets_createdById ON tickets("createdById");
CREATE INDEX idx_tickets_contactId ON tickets("contactId");
CREATE INDEX idx_tickets_companyId ON tickets("companyId");
CREATE INDEX idx_tickets_dealId ON tickets("dealId");
CREATE INDEX idx_tickets_status ON tickets(status);

-- Índices para activities
CREATE INDEX idx_activities_userId ON activities("userId");
CREATE INDEX idx_activities_contactId ON activities("contactId");
CREATE INDEX idx_activities_companyId ON activities("companyId");
CREATE INDEX idx_activities_dealId ON activities("dealId");
CREATE INDEX idx_activities_taskId ON activities("taskId");
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_createdAt ON activities("createdAt");

-- Índices para campaigns
CREATE INDEX idx_campaigns_ownerId ON campaigns("ownerId");
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Índices para automations
CREATE INDEX idx_automations_ownerId ON automations("ownerId");
CREATE INDEX idx_automations_status ON automations(status);

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_contactId ON subscriptions("contactId");
CREATE INDEX idx_subscriptions_companyId ON subscriptions("companyId");
CREATE INDEX idx_subscriptions_createdById ON subscriptions("createdById");
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Índices para payments
CREATE INDEX idx_payments_contactId ON payments("contactId");
CREATE INDEX idx_payments_companyId ON payments("companyId");
CREATE INDEX idx_payments_subscriptionId ON payments("subscriptionId");
CREATE INDEX idx_payments_createdById ON payments("createdById");
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paymentDate ON payments("paymentDate");

-- Índices para monthly_budgets
CREATE INDEX idx_monthly_budgets_month_year ON monthly_budgets(month, year);

-- Índices para user_google_tokens
CREATE INDEX idx_user_google_tokens_userId ON user_google_tokens("userId");

-- Índices para systemLogs
CREATE INDEX idx_systemLogs_userId ON "systemLogs"("userId");
CREATE INDEX idx_systemLogs_entityType ON "systemLogs"("entityType");
CREATE INDEX idx_systemLogs_createdAt ON "systemLogs"("createdAt");

-- Índices para tablas de relación
CREATE INDEX idx_contact_companies_contactId ON contact_companies("contactId");
CREATE INDEX idx_contact_companies_companyId ON contact_companies("companyId");

CREATE INDEX idx_contact_contacts_contactId ON contact_contacts("contactId");
CREATE INDEX idx_contact_contacts_relatedContactId ON contact_contacts("relatedContactId");

CREATE INDEX idx_company_companies_companyId ON company_companies("companyId");
CREATE INDEX idx_company_companies_relatedCompanyId ON company_companies("relatedCompanyId");

CREATE INDEX idx_deal_contacts_dealId ON deal_contacts("dealId");
CREATE INDEX idx_deal_contacts_contactId ON deal_contacts("contactId");

CREATE INDEX idx_deal_companies_dealId ON deal_companies("dealId");
CREATE INDEX idx_deal_companies_companyId ON deal_companies("companyId");

CREATE INDEX idx_deal_deals_dealId ON deal_deals("dealId");
CREATE INDEX idx_deal_deals_relatedDealId ON deal_deals("relatedDealId");

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar roles por defecto
INSERT INTO roles (name, description, "createdAt", "updatedAt") VALUES
  ('admin', 'Administrador del sistema con acceso completo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user', 'Usuario estándar con permisos limitados', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manager', 'Gerente con permisos de gestión', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCIONES Y TRIGGERS PARA ACTUALIZAR updatedAt
-- ============================================

-- Función para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updatedAt automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_budgets_updated_at BEFORE UPDATE ON monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_google_tokens_updated_at BEFORE UPDATE ON user_google_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_companies_updated_at BEFORE UPDATE ON contact_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_contacts_updated_at BEFORE UPDATE ON contact_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_companies_updated_at BEFORE UPDATE ON company_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_contacts_updated_at BEFORE UPDATE ON deal_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_companies_updated_at BEFORE UPDATE ON deal_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_deals_updated_at BEFORE UPDATE ON deal_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
