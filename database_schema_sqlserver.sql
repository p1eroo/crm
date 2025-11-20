-- ============================================
-- Script SQL para crear todas las tablas del CRM
-- Compatible con SQL Server Management Studio 22
-- ============================================

-- Eliminar tablas si existen (en orden inverso de dependencias)
IF OBJECT_ID('payments', 'U') IS NOT NULL DROP TABLE payments;
IF OBJECT_ID('subscriptions', 'U') IS NOT NULL DROP TABLE subscriptions;
IF OBJECT_ID('activities', 'U') IS NOT NULL DROP TABLE activities;
IF OBJECT_ID('tickets', 'U') IS NOT NULL DROP TABLE tickets;
IF OBJECT_ID('tasks', 'U') IS NOT NULL DROP TABLE tasks;
IF OBJECT_ID('deals', 'U') IS NOT NULL DROP TABLE deals;
IF OBJECT_ID('deal_tags', 'U') IS NOT NULL DROP TABLE deal_tags;
IF OBJECT_ID('company_tags', 'U') IS NOT NULL DROP TABLE company_tags;
IF OBJECT_ID('contact_tags', 'U') IS NOT NULL DROP TABLE contact_tags;
IF OBJECT_ID('contact_companies', 'U') IS NOT NULL DROP TABLE contact_companies;
IF OBJECT_ID('campaigns', 'U') IS NOT NULL DROP TABLE campaigns;
IF OBJECT_ID('automations', 'U') IS NOT NULL DROP TABLE automations;
IF OBJECT_ID('contacts', 'U') IS NOT NULL DROP TABLE contacts;
IF OBJECT_ID('companies', 'U') IS NOT NULL DROP TABLE companies;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;

-- ============================================
-- Tabla: users
-- ============================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    usuario NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    firstName NVARCHAR(255) NOT NULL,
    lastName NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'user',
    avatar NVARCHAR(255),
    phone NVARCHAR(255),
    language NVARCHAR(255) DEFAULT 'es',
    dateFormat NVARCHAR(255) DEFAULT 'es-ES',
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'user', 'manager')),
    CONSTRAINT CHK_users_email CHECK (email LIKE '%@%.%')
);

-- ============================================
-- Tabla: companies
-- ============================================
CREATE TABLE companies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    domain NVARCHAR(255),
    industry NVARCHAR(255),
    type NVARCHAR(255),
    phone NVARCHAR(255),
    ruc NVARCHAR(255),
    address NVARCHAR(255),
    city NVARCHAR(255),
    state NVARCHAR(255),
    country NVARCHAR(255),
    postalCode NVARCHAR(255),
    website NVARCHAR(255),
    numberOfEmployees INT,
    annualRevenue DECIMAL(15, 2),
    description NVARCHAR(MAX),
    ownerId INT,
    lifecycleStage NVARCHAR(100) NOT NULL DEFAULT 'lead',
    notes NVARCHAR(MAX),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_companies_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT CHK_companies_lifecycleStage CHECK (lifecycleStage IN (
        'subscriber', 'lead', 'contacto', 'reunion_agendada', 'reunion_efectiva',
        'propuesta_economica', 'negociacion', 'cierre_ganado', 'cierre_perdido',
        'marketing qualified lead', 'sales qualified lead', 'opportunity', 'customer', 'evangelist'
    ))
);

-- ============================================
-- Tabla: contacts
-- ============================================
CREATE TABLE contacts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    firstName NVARCHAR(255) NOT NULL,
    lastName NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(255),
    mobile NVARCHAR(255),
    jobTitle NVARCHAR(255),
    companyId INT,
    ownerId INT,
    address NVARCHAR(255),
    city NVARCHAR(255),
    state NVARCHAR(255),
    country NVARCHAR(255),
    postalCode NVARCHAR(255),
    website NVARCHAR(255),
    facebook NVARCHAR(255),
    twitter NVARCHAR(255),
    github NVARCHAR(255),
    linkedin NVARCHAR(255),
    youtube NVARCHAR(255),
    lifecycleStage NVARCHAR(100) NOT NULL DEFAULT 'lead',
    leadStatus NVARCHAR(255),
    notes NVARCHAR(MAX),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_contacts_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT FK_contacts_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT CHK_contacts_email CHECK (email LIKE '%@%.%'),
    CONSTRAINT CHK_contacts_lifecycleStage CHECK (lifecycleStage IN (
        'subscriber', 'lead', 'contacto', 'reunion_agendada', 'reunion_efectiva',
        'propuesta_economica', 'negociacion', 'cierre_ganado', 'cierre_perdido',
        'marketing qualified lead', 'sales qualified lead', 'opportunity', 'customer', 'evangelist'
    ))
);

-- ============================================
-- Tabla: contact_companies (relación muchos-a-muchos)
-- ============================================
CREATE TABLE contact_companies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contactId INT NOT NULL,
    companyId INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_contact_companies_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT FK_contact_companies_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT UQ_contact_company UNIQUE (contactId, companyId)
);

-- ============================================
-- Tabla: deals
-- ============================================
CREATE TABLE deals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    stage NVARCHAR(255) NOT NULL,
    closeDate DATETIME2,
    probability INT,
    ownerId INT NOT NULL,
    contactId INT,
    companyId INT,
    pipelineId INT NOT NULL DEFAULT 1,
    description NVARCHAR(MAX),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_deals_owner FOREIGN KEY (ownerId) REFERENCES users(id),
    CONSTRAINT FK_deals_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT FK_deals_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT CHK_deals_probability CHECK (probability >= 0 AND probability <= 100)
);

-- ============================================
-- Tabla: tasks
-- ============================================
CREATE TABLE tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    type NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'not started',
    priority NVARCHAR(50) NOT NULL DEFAULT 'medium',
    dueDate DATETIME2,
    assignedToId INT NOT NULL,
    createdById INT NOT NULL,
    contactId INT,
    companyId INT,
    dealId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_tasks_assigned FOREIGN KEY (assignedToId) REFERENCES users(id),
    CONSTRAINT FK_tasks_created FOREIGN KEY (createdById) REFERENCES users(id),
    CONSTRAINT FK_tasks_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT FK_tasks_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT FK_tasks_deal FOREIGN KEY (dealId) REFERENCES deals(id) ON DELETE SET NULL,
    CONSTRAINT CHK_tasks_type CHECK (type IN ('call', 'email', 'meeting', 'note', 'todo', 'other')),
    CONSTRAINT CHK_tasks_status CHECK (status IN ('not started', 'in progress', 'completed', 'cancelled')),
    CONSTRAINT CHK_tasks_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- ============================================
-- Tabla: tickets
-- ============================================
CREATE TABLE tickets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    subject NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'new',
    priority NVARCHAR(50) NOT NULL DEFAULT 'medium',
    assignedToId INT NOT NULL,
    createdById INT NOT NULL,
    contactId INT,
    companyId INT,
    dealId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_tickets_assigned FOREIGN KEY (assignedToId) REFERENCES users(id),
    CONSTRAINT FK_tickets_created FOREIGN KEY (createdById) REFERENCES users(id),
    CONSTRAINT FK_tickets_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT FK_tickets_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT FK_tickets_deal FOREIGN KEY (dealId) REFERENCES deals(id) ON DELETE SET NULL,
    CONSTRAINT CHK_tickets_status CHECK (status IN ('new', 'open', 'pending', 'resolved', 'closed')),
    CONSTRAINT CHK_tickets_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- ============================================
-- Tabla: campaigns
-- ============================================
CREATE TABLE campaigns (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    startDate DATETIME2,
    endDate DATETIME2,
    budget DECIMAL(15, 2),
    spent DECIMAL(15, 2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    ownerId INT NOT NULL,
    description NVARCHAR(MAX),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_campaigns_owner FOREIGN KEY (ownerId) REFERENCES users(id),
    CONSTRAINT CHK_campaigns_type CHECK (type IN ('email', 'social', 'advertising', 'other')),
    CONSTRAINT CHK_campaigns_status CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'))
);

-- ============================================
-- Tabla: automations
-- ============================================
CREATE TABLE automations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    [trigger] NVARCHAR(255) NOT NULL,
    conditions NVARCHAR(MAX),
    actions NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    ownerId INT NOT NULL,
    description NVARCHAR(MAX),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_automations_owner FOREIGN KEY (ownerId) REFERENCES users(id),
    CONSTRAINT CHK_automations_status CHECK (status IN ('active', 'inactive', 'draft'))
);

-- ============================================
-- Tabla: activities
-- ============================================
CREATE TABLE activities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(50) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    userId INT NOT NULL,
    contactId INT,
    companyId INT,
    dealId INT,
    taskId INT,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_activities_user FOREIGN KEY (userId) REFERENCES users(id),
    CONSTRAINT FK_activities_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT FK_activities_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT FK_activities_deal FOREIGN KEY (dealId) REFERENCES deals(id) ON DELETE SET NULL,
    CONSTRAINT FK_activities_task FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT CHK_activities_type CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company'))
);

-- ============================================
-- Tabla: subscriptions
-- ============================================
CREATE TABLE subscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    startDate DATETIME2 NOT NULL,
    endDate DATETIME2,
    renewalDate DATETIME2,
    amount DECIMAL(15, 2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    billingCycle NVARCHAR(50) NOT NULL DEFAULT 'monthly',
    contactId INT,
    companyId INT,
    createdById INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_subscriptions_created FOREIGN KEY (createdById) REFERENCES users(id),
    CONSTRAINT FK_subscriptions_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT FK_subscriptions_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT CHK_subscriptions_status CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    CONSTRAINT CHK_subscriptions_billingCycle CHECK (billingCycle IN ('monthly', 'quarterly', 'yearly', 'one-time'))
);

-- ============================================
-- Tabla: payments
-- ============================================
CREATE TABLE payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    amount DECIMAL(15, 2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    paymentDate DATETIME2 NOT NULL,
    dueDate DATETIME2,
    paymentMethod NVARCHAR(50) NOT NULL DEFAULT 'credit_card',
    reference NVARCHAR(255),
    description NVARCHAR(MAX),
    contactId INT,
    companyId INT,
    subscriptionId INT,
    createdById INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_payments_created FOREIGN KEY (createdById) REFERENCES users(id),
    CONSTRAINT FK_payments_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT FK_payments_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
    CONSTRAINT FK_payments_subscription FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id) ON DELETE SET NULL,
    CONSTRAINT CHK_payments_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    CONSTRAINT CHK_payments_paymentMethod CHECK (paymentMethod IN ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other'))
);

-- ============================================
-- Tabla: contact_tags (para almacenar tags de contactos)
-- ============================================
CREATE TABLE contact_tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contactId INT NOT NULL,
    tag NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_contact_tags_contact FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE,
    CONSTRAINT UQ_contact_tag UNIQUE (contactId, tag)
);

-- ============================================
-- Tabla: company_tags (para almacenar tags de empresas)
-- ============================================
CREATE TABLE company_tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    companyId INT NOT NULL,
    tag NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_company_tags_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT UQ_company_tag UNIQUE (companyId, tag)
);

-- ============================================
-- Tabla: deal_tags (para almacenar tags de deals)
-- ============================================
CREATE TABLE deal_tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    dealId INT NOT NULL,
    tag NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_deal_tags_deal FOREIGN KEY (dealId) REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT UQ_deal_tag UNIQUE (dealId, tag)
);

-- ============================================
-- Índices para mejorar el rendimiento
-- ============================================

-- Índices para users
CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_users_usuario ON users(usuario);

-- Índices para contacts
CREATE INDEX IX_contacts_email ON contacts(email);
CREATE INDEX IX_contacts_company_id ON contacts(companyId);
CREATE INDEX IX_contacts_owner_id ON contacts(ownerId);
CREATE INDEX IX_contacts_lifecycle_stage ON contacts(lifecycleStage);

-- Índices para companies
CREATE INDEX IX_companies_owner_id ON companies(ownerId);
CREATE INDEX IX_companies_lifecycle_stage ON companies(lifecycleStage);

-- Índices para deals
CREATE INDEX IX_deals_owner_id ON deals(ownerId);
CREATE INDEX IX_deals_contact_id ON deals(contactId);
CREATE INDEX IX_deals_company_id ON deals(companyId);
CREATE INDEX IX_deals_stage ON deals(stage);

-- Índices para tasks
CREATE INDEX IX_tasks_assigned_to_id ON tasks(assignedToId);
CREATE INDEX IX_tasks_created_by_id ON tasks(createdById);
CREATE INDEX IX_tasks_status ON tasks(status);
CREATE INDEX IX_tasks_due_date ON tasks(dueDate);

-- Índices para tickets
CREATE INDEX IX_tickets_assigned_to_id ON tickets(assignedToId);
CREATE INDEX IX_tickets_status ON tickets(status);
CREATE INDEX IX_tickets_priority ON tickets(priority);

-- Índices para campaigns
CREATE INDEX IX_campaigns_owner_id ON campaigns(ownerId);
CREATE INDEX IX_campaigns_status ON campaigns(status);

-- Índices para automations
CREATE INDEX IX_automations_owner_id ON automations(ownerId);
CREATE INDEX IX_automations_status ON automations(status);

-- Índices para activities
CREATE INDEX IX_activities_user_id ON activities(userId);
CREATE INDEX IX_activities_contact_id ON activities(contactId);
CREATE INDEX IX_activities_company_id ON activities(companyId);
CREATE INDEX IX_activities_type ON activities(type);

-- Índices para subscriptions
CREATE INDEX IX_subscriptions_contact_id ON subscriptions(contactId);
CREATE INDEX IX_subscriptions_company_id ON subscriptions(companyId);
CREATE INDEX IX_subscriptions_status ON subscriptions(status);

-- Índices para payments
CREATE INDEX IX_payments_contact_id ON payments(contactId);
CREATE INDEX IX_payments_company_id ON payments(companyId);
CREATE INDEX IX_payments_subscription_id ON payments(subscriptionId);
CREATE INDEX IX_payments_status ON payments(status);
CREATE INDEX IX_payments_payment_date ON payments(paymentDate);
