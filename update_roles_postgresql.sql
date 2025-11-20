-- Script para actualizar roles de usuario en PostgreSQL
-- Ejecutar este script en PostgreSQL

-- 1. Verificar si existe el ENUM user_role_enum
-- Si Sequelize creó un ENUM, lo actualizamos. Si no, usamos VARCHAR con CHECK

-- Primero, intentar agregar el nuevo valor al ENUM si existe
DO $$ 
BEGIN
    -- Verificar si el tipo ENUM existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        -- Verificar si el valor ya existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'jefe_comercial' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
        ) THEN
            ALTER TYPE user_role_enum ADD VALUE 'jefe_comercial';
            RAISE NOTICE 'Valor jefe_comercial agregado al ENUM user_role_enum';
        ELSE
            RAISE NOTICE 'El valor jefe_comercial ya existe en el ENUM';
        END IF;
    ELSE
        RAISE NOTICE 'El ENUM user_role_enum no existe. Sequelize puede estar usando VARCHAR con CHECK.';
        -- Si no existe el ENUM, probablemente Sequelize usa VARCHAR con CHECK
        -- Verificamos y actualizamos la restricción CHECK si es necesario
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%role%' 
            AND table_name = 'users'
        ) THEN
            -- Eliminar la restricción CHECK existente si existe
            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
            ALTER TABLE users DROP CONSTRAINT IF EXISTS CHK_users_role;
            
            -- Crear nueva restricción con todos los roles
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('admin', 'user', 'manager', 'jefe_comercial'));
            
            RAISE NOTICE 'Restricción CHECK actualizada para incluir jefe_comercial';
        END IF;
    END IF;
END $$;

-- 2. Asignar rol de administrador a los usuarios 'asistema' y 'jvaldivia'
UPDATE users
SET role = 'admin'
WHERE usuario IN ('asistema', 'jvaldivia');

-- Verificar cuántos usuarios fueron actualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Usuarios actualizados a admin: %', updated_count;
END $$;

-- 3. Verificar los cambios
SELECT 
    id, 
    usuario, 
    email, 
    "firstName" as "Nombre", 
    "lastName" as "Apellido", 
    role as "Rol", 
    "isActive" as "Activo"
FROM users
WHERE usuario IN ('asistema', 'jvaldivia')
ORDER BY usuario;

-- 4. Ver todos los usuarios y sus roles
SELECT 
    id, 
    usuario, 
    email, 
    "firstName" as "Nombre", 
    "lastName" as "Apellido", 
    role as "Rol", 
    "isActive" as "Activo"
FROM users
ORDER BY role, usuario;

