-- Script para actualizar roles de usuario en PostgreSQL
-- Ejecutar este script en PostgreSQL

-- 1. Agregar el nuevo valor 'jefe_comercial' al ENUM existente
-- Nota: En PostgreSQL, no se puede agregar directamente un valor a un ENUM existente
-- Si el ENUM ya existe, necesitarás recrearlo o usar ALTER TYPE

-- Opción 1: Si el ENUM ya existe, agregar el nuevo valor
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'jefe_comercial' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
    ) THEN
        ALTER TYPE user_role_enum ADD VALUE 'jefe_comercial';
    END IF;
END $$;

-- 2. Asignar rol de administrador a los usuarios 'asistema' y 'jvaldivia'
UPDATE users
SET role = 'admin'
WHERE usuario IN ('asistema', 'jvaldivia');

-- Verificar los cambios
SELECT id, usuario, email, "firstName", "lastName", role, "isActive"
FROM users
WHERE usuario IN ('asistema', 'jvaldivia')
ORDER BY usuario;

-- Ver todos los usuarios y sus roles
SELECT id, usuario, email, "firstName", "lastName", role, "isActive"
FROM users
ORDER BY role, usuario;

