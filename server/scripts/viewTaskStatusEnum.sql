-- Consulta para ver los valores del ENUM task_status_enum

-- Opción 1: Ver todos los valores del ENUM en orden
SELECT 
    e.enumlabel AS estado,
    e.enumsortorder AS orden
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'task_status_enum'
ORDER BY e.enumsortorder;

-- Opción 2: Ver solo los valores del ENUM (más simple)
SELECT unnest(enum_range(NULL::task_status_enum)) AS estados;

-- Opción 3: Ver información completa del tipo ENUM
SELECT 
    t.typname AS nombre_tipo,
    e.enumlabel AS valor,
    e.enumsortorder AS orden
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'task_status_enum'
ORDER BY e.enumsortorder;
