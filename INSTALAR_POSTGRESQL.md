# 🐘 Instalación de PostgreSQL para macOS

## Opción 1: Instalación con Homebrew (Recomendado)

### Paso 1: Instalar Homebrew (si no lo tienes)

Abre Terminal y ejecuta:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Sigue las instrucciones en pantalla. Te pedirá tu contraseña de administrador.

### Paso 2: Instalar PostgreSQL

```bash
brew install postgresql@15
```

### Paso 3: Iniciar PostgreSQL

```bash
brew services start postgresql@15
```

### Paso 4: Verificar la instalación

```bash
psql --version
```

Deberías ver algo como: `psql (PostgreSQL) 15.x`

## Opción 2: Instalación con el instalador oficial

1. Ve a: https://www.postgresql.org/download/macosx/
2. Descarga el instalador de EnterpriseDB
3. Ejecuta el instalador y sigue las instrucciones
4. Durante la instalación, guarda la contraseña del usuario `postgres`

## Configuración después de la instalación

### Crear la base de datos para el CRM

```bash
createdb -U postgres crm_db
```

Si te pide contraseña y no la recuerdas, puedes:
- Usar la contraseña que configuraste durante la instalación
- O cambiar la contraseña:

```bash
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
\q
```

### Verificar que PostgreSQL está corriendo

```bash
pg_isready -h localhost
```

Deberías ver: `localhost:5432 - accepting connections`

## Configurar variables de entorno (Opcional)

Si quieres que `psql` esté disponible desde cualquier lugar, agrega esto a tu `~/.zshrc`:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

O si usas Homebrew en `/usr/local`:

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Comandos útiles de PostgreSQL

```bash
# Iniciar PostgreSQL
brew services start postgresql@15

# Detener PostgreSQL
brew services stop postgresql@15

# Reiniciar PostgreSQL
brew services restart postgresql@15

# Ver estado
brew services list

# Conectar a PostgreSQL
psql -U postgres

# Listar bases de datos
psql -U postgres -l
```

## Después de instalar PostgreSQL

Una vez instalado, continúa con la inicialización del CRM:

```bash
cd /Users/jqck/Documents/CRM_TM/server
npm run init-db
```

Esto creará:
- Todas las tablas necesarias
- Usuario admin: `admin@crm.com` / `admin123`

## Solución de problemas

### Error: "psql: command not found"
- Asegúrate de que PostgreSQL esté en tu PATH
- Ejecuta: `export PATH="/opt/homebrew/bin:$PATH"` (o `/usr/local/bin` según tu instalación)

### Error: "could not connect to server"
- Verifica que PostgreSQL esté corriendo: `brew services list`
- Inicia PostgreSQL: `brew services start postgresql@15`

### Error: "password authentication failed"
- Verifica la contraseña del usuario postgres
- O cambia la contraseña en `server/.env` si usas otra diferente

### Error: "database crm_db does not exist"
- Crea la base de datos: `createdb -U postgres crm_db`








