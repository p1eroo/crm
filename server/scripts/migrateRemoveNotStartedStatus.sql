-- Script de migración para eliminar el estado 'not started' y reemplazarlo por 'pending'
-- Ejecutar este script en la base de datos para actualizar las tareas existentes

-- Paso 1: Actualizar todas las tareas que tienen 'not started' a 'pending'
UPDATE tasks
SET status = 'pending'
WHERE status = 'not started';

-- Paso 2: Eliminar el valor 'not started' del ENUM
-- Nota: PostgreSQL no permite eliminar valores de un ENUM directamente
-- Necesitamos recrear el ENUM sin 'not started'

-- Paso 2.1: Crear un nuevo ENUM sin 'not started'
DO $$
BEGIN
    -- Crear nuevo tipo ENUM sin 'not started'
    CREATE TYPE task_status_enum_new AS ENUM ('pending', 'in progress', 'completed', 'cancelled');
    
    -- Cambiar el tipo de la columna al nuevo ENUM
    ALTER TABLE tasks ALTER COLUMN status TYPE task_status_enum_new USING status::text::task_status_enum_new;
    
    -- Eliminar el tipo antiguo
    DROP TYPE task_status_enum;
    
    -- Renombrar el nuevo tipo al nombre original
    ALTER TYPE task_status_enum_new RENAME TO task_status_enum;
END $$;
