-- Script de migración para mover roles a una tabla separada (SQL Server)
-- Este script crea la tabla roles y migra los datos existentes

-- 1. Crear la tabla roles
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255),
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END

-- 2. Insertar los roles existentes
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin')
    INSERT INTO roles (name, description) VALUES ('admin', 'Administrador del sistema');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'user')
    INSERT INTO roles (name, description) VALUES ('user', 'Usuario estándar');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'manager')
    INSERT INTO roles (name, description) VALUES ('manager', 'Gerente');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'jefe_comercial')
    INSERT INTO roles (name, description) VALUES ('jefe_comercial', 'Jefe Comercial');

-- 3. Agregar columna roleId a la tabla users (temporalmente nullable)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'roleId')
BEGIN
    ALTER TABLE users ADD roleId INT NULL;
END

-- 4. Migrar los datos existentes de role a roleId
UPDATE u
SET roleId = r.id
FROM users u
INNER JOIN roles r ON u.role = r.name;

-- 5. Establecer un valor por defecto para usuarios que no tengan roleId
UPDATE users
SET roleId = (SELECT id FROM roles WHERE name = 'user')
WHERE roleId IS NULL;

-- 6. Hacer roleId NOT NULL
ALTER TABLE users ALTER COLUMN roleId INT NOT NULL;

-- 7. Agregar foreign key constraint
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_users_role')
BEGIN
    ALTER TABLE users
    ADD CONSTRAINT FK_users_role FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE NO ACTION;
END

-- 8. Crear índice para mejorar el rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_roleId' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE INDEX idx_users_roleId ON users(roleId);
END

-- 9. (Opcional) Eliminar la columna role antigua después de verificar que todo funciona
-- Descomentar estas líneas solo después de verificar que la migración fue exitosa:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS CHK_users_role;
-- ALTER TABLE users DROP COLUMN role;

-- Verificar la migración
SELECT 
    u.id,
    u.usuario,
    u.email,
    u.firstName,
    u.lastName,
    r.name as role,
    r.description as role_description,
    u.isActive
FROM users u
INNER JOIN roles r ON u.roleId = r.id
ORDER BY r.name, u.usuario;

