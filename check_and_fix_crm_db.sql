-- ============================================
-- Script para verificar y corregir crm_db
-- Ejecutar en pgAdmin conectado a la base de datos crm_db
-- ============================================

-- 1. Verificar si el enum existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_stage_enum') 
        THEN '✅ El enum lifecycle_stage_enum existe'
        ELSE '❌ El enum lifecycle_stage_enum NO existe'
    END as enum_status;

-- 2. Verificar si la columna lifecycleStage existe en contacts
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'contacts' 
            AND column_name = 'lifecycleStage'
        ) 
        THEN '✅ La columna lifecycleStage existe en contacts'
        ELSE '❌ La columna lifecycleStage NO existe en contacts'
    END as contacts_column_status;

-- 3. Verificar si la columna lifecycleStage existe en companies
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'companies' 
            AND column_name = 'lifecycleStage'
        ) 
        THEN '✅ La columna lifecycleStage existe en companies'
        ELSE '❌ La columna lifecycleStage NO existe en companies'
    END as companies_column_status;

-- 4. Contar registros en las tablas principales
SELECT 
    'contacts' as tabla, COUNT(*) as total FROM contacts
UNION ALL
SELECT 
    'companies' as tabla, COUNT(*) as total FROM companies
UNION ALL
SELECT 
    'deals' as tabla, COUNT(*) as total FROM deals
UNION ALL
SELECT 
    'users' as tabla, COUNT(*) as total FROM users;

-- ============================================
-- Si falta el enum o las columnas, ejecuta esto:
-- ============================================

-- Crear el enum si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_stage_enum') THEN
        CREATE TYPE lifecycle_stage_enum AS ENUM (
            'lead_inactivo',
            'cliente_perdido',
            'cierre_perdido',
            'lead',
            'contacto',
            'reunion_agendada',
            'reunion_efectiva',
            'propuesta_economica',
            'negociacion',
            'licitacion',
            'licitacion_etapa_final',
            'cierre_ganado',
            'firma_contrato',
            'activo'
        );
        RAISE NOTICE '✅ Enum lifecycle_stage_enum creado';
    END IF;
END $$;

-- Agregar columna a contacts si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'lifecycleStage'
    ) THEN
        ALTER TABLE contacts 
        ADD COLUMN "lifecycleStage" lifecycle_stage_enum NOT NULL DEFAULT 'lead';
        RAISE NOTICE '✅ Columna lifecycleStage agregada a contacts';
    END IF;
END $$;

-- Agregar columna a companies si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'lifecycleStage'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN "lifecycleStage" lifecycle_stage_enum NOT NULL DEFAULT 'lead';
        RAISE NOTICE '✅ Columna lifecycleStage agregada a companies';
    END IF;
END $$;





