-- ============================================
-- Script para agregar columna lifecycleStage a crm_mont
-- Ejecutar en pgAdmin conectado a la base de datos crm_mont
-- ============================================

-- 1. Crear el enum si no existe
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
    END IF;
END $$;

-- 2. Agregar columna lifecycleStage a contacts si no existe
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
        
        RAISE NOTICE 'Columna lifecycleStage agregada a contacts';
    ELSE
        RAISE NOTICE 'La columna lifecycleStage ya existe en contacts';
    END IF;
END $$;

-- 3. Agregar columna lifecycleStage a companies si no existe
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
        
        RAISE NOTICE 'Columna lifecycleStage agregada a companies';
    ELSE
        RAISE NOTICE 'La columna lifecycleStage ya existe en companies';
    END IF;
END $$;

-- 4. Verificar que las columnas se crearon correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_name IN ('contacts', 'companies') 
    AND column_name = 'lifecycleStage'
ORDER BY table_name;

