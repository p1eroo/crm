-- ============================================
-- Script para corregir conflicto de ENUMs en crm_db
-- Ejecutar en pgAdmin conectado a crm_db
-- ============================================

-- 1. Verificar qué enums existen
SELECT typname, typtype 
FROM pg_type 
WHERE typname LIKE '%lifecycle%' OR typname LIKE 'enum_%'
ORDER BY typname;

-- 2. Verificar qué tipo usa la columna lifecycleStage en companies
SELECT 
    table_name,
    column_name,
    udt_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'companies' 
    AND column_name = 'lifecycleStage';

-- 3. Si la columna usa enum_companies_lifecycleStage, convertirla a lifecycle_stage_enum
-- Primero convertir a texto, luego al enum correcto
DO $$ 
BEGIN
    -- Verificar si existe el enum incorrecto
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_lifecycleStage') THEN
        -- Convertir la columna a texto primero
        ALTER TABLE companies 
        ALTER COLUMN "lifecycleStage" TYPE TEXT USING "lifecycleStage"::text;
        
        -- Eliminar el enum incorrecto
        DROP TYPE IF EXISTS enum_companies_lifecycleStage CASCADE;
        
        -- Convertir la columna al enum correcto
        ALTER TABLE companies 
        ALTER COLUMN "lifecycleStage" TYPE lifecycle_stage_enum USING "lifecycleStage"::lifecycle_stage_enum;
        
        RAISE NOTICE '✅ Columna companies.lifecycleStage convertida a lifecycle_stage_enum';
    END IF;
END $$;

-- 4. Hacer lo mismo para contacts si es necesario
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_contacts_lifecycleStage') THEN
        ALTER TABLE contacts 
        ALTER COLUMN "lifecycleStage" TYPE TEXT USING "lifecycleStage"::text;
        
        DROP TYPE IF EXISTS enum_contacts_lifecycleStage CASCADE;
        
        ALTER TABLE contacts 
        ALTER COLUMN "lifecycleStage" TYPE lifecycle_stage_enum USING "lifecycleStage"::lifecycle_stage_enum;
        
        RAISE NOTICE '✅ Columna contacts.lifecycleStage convertida a lifecycle_stage_enum';
    END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
    table_name,
    column_name,
    udt_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('companies', 'contacts') 
    AND column_name = 'lifecycleStage'
ORDER BY table_name;





