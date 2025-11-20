# Instrucciones para Actualizar Roles de Usuario

## Roles Disponibles

Se han configurado los siguientes roles:
- **admin** (Administrador)
- **jefe_comercial** (Jefe Comercial)
- **user** (Usuario)
- **manager** (Manager)

## Pasos para Actualizar

### 1. Actualizar el Modelo en la Base de Datos

#### Para SQL Server:
Ejecuta el script `update_user_roles.sql` en SQL Server Management Studio.

Este script:
- Actualiza la restricción CHECK para incluir el nuevo rol 'jefe_comercial'
- Asigna el rol de administrador a los usuarios 'asistema' y 'jvaldivia'

#### Para PostgreSQL:
Ejecuta el script `update_user_roles_postgresql.sql` en tu cliente de PostgreSQL.

### 2. Verificar los Cambios

Después de ejecutar el script SQL, verifica que los usuarios tengan los roles correctos:

```sql
SELECT id, usuario, email, firstName, lastName, role, isActive
FROM users
WHERE usuario IN ('asistema', 'jvaldivia')
ORDER BY usuario;
```

### 3. Reiniciar el Servidor Backend

Después de actualizar la base de datos, reinicia el servidor backend para que los cambios en el modelo se apliquen.

## Notas

- El modelo de TypeScript ya está actualizado con el nuevo rol 'jefe_comercial'
- Los usuarios 'asistema' y 'jvaldivia' serán asignados automáticamente como administradores al ejecutar el script SQL
- El middleware de autenticación ya está preparado para trabajar con cualquier rol

