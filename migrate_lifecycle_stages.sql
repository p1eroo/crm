-- Script de migración para actualizar las etapas del ciclo de vida
-- Este script actualiza el ENUM de lifecycle_stage_enum con las nuevas etapas

-- 1. Crear un nuevo tipo ENUM con las nuevas etapas
CREATE TYPE lifecycle_stage_enum_new AS ENUM (
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

-- 2. Actualizar la columna lifecycleStage en contacts para usar el nuevo tipo
ALTER TABLE contacts 
  ALTER COLUMN "lifecycleStage" TYPE lifecycle_stage_enum_new 
  USING "lifecycleStage"::text::lifecycle_stage_enum_new;

-- 3. Actualizar la columna lifecycleStage en companies para usar el nuevo tipo
ALTER TABLE companies 
  ALTER COLUMN "lifecycleStage" TYPE lifecycle_stage_enum_new 
  USING "lifecycleStage"::text::lifecycle_stage_enum_new;

-- 4. Eliminar el tipo antiguo
DROP TYPE lifecycle_stage_enum;

-- 5. Renombrar el nuevo tipo al nombre original
ALTER TYPE lifecycle_stage_enum_new RENAME TO lifecycle_stage_enum;

-- Verificar la migración
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name IN ('contacts', 'companies') 
    AND column_name = 'lifecycleStage';

