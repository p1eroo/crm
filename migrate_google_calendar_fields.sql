-- Script de migración para agregar campos de Google Calendar
-- Este script agrega los campos necesarios para la integración con Google Calendar

-- 1. Agregar campo googleCalendarEventId a la tabla tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "googleCalendarEventId" VARCHAR(255);

-- 2. Agregar campos de tokens de Google a la tabla users (opcional, ya que se usa user_google_tokens)
-- Estos campos se mantienen por compatibilidad pero se recomienda usar la tabla user_google_tokens
ALTER TABLE users ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT;

-- 3. Crear índice para mejorar búsquedas por googleCalendarEventId
CREATE INDEX IF NOT EXISTS idx_tasks_googleCalendarEventId ON tasks("googleCalendarEventId");

-- Verificar la migración
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' 
    AND column_name = 'googleCalendarEventId'
UNION ALL
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
    AND (column_name = 'googleAccessToken' OR column_name = 'googleRefreshToken')
ORDER BY column_name;

