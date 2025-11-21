-- Script de migración para mover roles a una tabla separada (PostgreSQL)
-- Este script crea la tabla roles y migra los datos existentes

-- 1. Crear la tabla roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar los roles existentes
INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrador del sistema'),
    ('user', 'Usuario estándar'),
    ('manager', 'Gerente'),
    ('jefe_comercial', 'Jefe Comercial')
ON CONFLICT (name) DO NOTHING;

-- 3. Agregar columna roleId a la tabla users (temporalmente nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "roleId" INTEGER;

-- 4. Migrar los datos existentes de role a roleId
UPDATE users u
SET "roleId" = r.id
FROM roles r
WHERE u.role::text = r.name;

-- 5. Establecer un valor por defecto para usuarios que no tengan roleId
UPDATE users
SET "roleId" = (SELECT id FROM roles WHERE name = 'user')
WHERE "roleId" IS NULL;

-- 6. Hacer roleId NOT NULL
ALTER TABLE users ALTER COLUMN "roleId" SET NOT NULL;

-- 7. Agregar foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_role FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT;

-- 8. Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_roleId ON users("roleId");

-- 9. (Opcional) Eliminar la columna role antigua después de verificar que todo funciona
-- Descomentar estas líneas solo después de verificar que la migración fue exitosa:
-- ALTER TABLE users DROP COLUMN IF EXISTS role;
-- DROP TYPE IF EXISTS user_role_enum;

-- Verificar la migración
SELECT 
    u.id,
    u.usuario,
    u.email,
    u."firstName",
    u."lastName",
    r.name as role,
    r.description as role_description,
    u."isActive"
FROM users u
JOIN roles r ON u."roleId" = r.id
ORDER BY r.name, u.usuario;

