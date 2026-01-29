-- Script de migración para agregar el estado 'pending' al ENUM task_status_enum
-- Ejecutar este script en la base de datos para actualizar el ENUM sin perder datos

-- Agregar el valor 'pending' al ENUM task_status_enum
-- Nota: En PostgreSQL, solo se puede agregar valores al final del ENUM
-- El orden en el ENUM no afecta la funcionalidad, solo afecta el orden cuando se consulta el tipo
DO $$ 
BEGIN
    -- Verificar si el valor ya existe antes de agregarlo
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status_enum')
    ) THEN
        ALTER TYPE task_status_enum ADD VALUE 'pending';
    END IF;
END $$;
