-- Script para actualizar roles de usuario en SQL Server
-- Ejecutar este script en SQL Server Management Studio

-- 1. Actualizar la restricción CHECK para incluir el nuevo rol 'jefe_comercial'
-- Primero eliminar la restricción existente
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_users_role')
BEGIN
    ALTER TABLE users DROP CONSTRAINT CHK_users_role;
END

-- Crear la nueva restricción con todos los roles
ALTER TABLE users
ADD CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'user', 'manager', 'jefe_comercial'));

-- 2. Asignar rol de administrador a los usuarios 'asistema' y 'jvaldivia'
UPDATE users
SET role = 'admin'
WHERE usuario IN ('asistema', 'jvaldivia');

-- Verificar los cambios
SELECT id, usuario, email, firstName, lastName, role, isActive
FROM users
WHERE usuario IN ('asistema', 'jvaldivia')
ORDER BY usuario;

-- Ver todos los usuarios y sus roles
SELECT id, usuario, email, firstName, lastName, role, isActive
FROM users
ORDER BY role, usuario;

