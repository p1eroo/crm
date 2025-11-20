-- Script para actualizar la columna avatar de VARCHAR(255) a TEXT/NVARCHAR(MAX)
-- Ejecutar este script en SQL Server Management Studio

-- Para SQL Server
ALTER TABLE users
ALTER COLUMN avatar NVARCHAR(MAX);

-- Verificar el cambio
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar';

