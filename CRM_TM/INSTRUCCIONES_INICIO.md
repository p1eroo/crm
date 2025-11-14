# 🚀 Instrucciones para Iniciar el CRM en Localhost

## Prerrequisitos

1. **PostgreSQL instalado y corriendo**
   - En macOS: `brew install postgresql && brew services start postgresql`
   - En Linux: `sudo apt-get install postgresql postgresql-contrib`
   - En Windows: Descargar desde https://www.postgresql.org/download/windows/

2. **Node.js instalado** (v16 o superior)
   - Verificar: `node --version`

## Pasos para Iniciar

### Opción 1: Inicio Automático (Recomendado)

```bash
# Desde la raíz del proyecto
./start.sh
```

### Opción 2: Inicio Manual

1. **Configurar variables de entorno**

   El archivo `.env` ya está creado en `server/.env` con valores por defecto.
   Si necesitas cambiarlos, edita el archivo:
   ```bash
   # server/.env
   DB_PASSWORD=tu_password_postgres
   ```

2. **Crear la base de datos** (si no existe)
   ```bash
   createdb -U postgres crm_db
   ```

3. **Inicializar la base de datos** (crea tablas y usuario admin)
   ```bash
   cd server
   npm run init-db
   ```
   
   Esto creará:
   - Todas las tablas necesarias
   - Usuario admin: `admin@crm.com` / `admin123`

4. **Iniciar el servidor backend**
   ```bash
   cd server
   npm run dev
   ```
   
   El backend estará disponible en: http://localhost:5000

5. **Iniciar el cliente frontend** (en otra terminal)
   ```bash
   cd client
   npm start
   ```
   
   El frontend estará disponible en: http://localhost:3000

## Acceso al Sistema

1. Abre tu navegador en: http://localhost:3000
2. Inicia sesión con:
   - **Email:** `admin@crm.com`
   - **Password:** `admin123`

## Solución de Problemas

### Error: "Unable to connect to the database"
- Verifica que PostgreSQL esté corriendo: `pg_isready -h localhost`
- Verifica las credenciales en `server/.env`
- Asegúrate de que la base de datos `crm_db` exista

### Error: "Port 5000 already in use"
- Cambia el puerto en `server/.env`: `PORT=5001`
- O mata el proceso: `lsof -ti:5000 | xargs kill`

### Error: "Port 3000 already in use"
- El frontend te preguntará si quieres usar otro puerto
- O mata el proceso: `lsof -ti:3000 | xargs kill`

### PostgreSQL no está en el PATH
- En macOS con Homebrew: `export PATH="/opt/homebrew/bin:$PATH"`
- O usa la ruta completa: `/usr/local/bin/psql`

## Comandos Útiles

```bash
# Verificar estado de PostgreSQL
pg_isready -h localhost

# Conectar a PostgreSQL
psql -U postgres -h localhost

# Listar bases de datos
psql -U postgres -h localhost -l

# Reiniciar PostgreSQL (macOS)
brew services restart postgresql

# Ver logs del servidor
# Los logs aparecen en la terminal donde ejecutaste npm run dev
```

## Estructura de URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Próximos Pasos

Una vez iniciado el sistema:
1. Explora el Dashboard para ver las métricas
2. Crea contactos y empresas
3. Configura deals y pipeline de ventas
4. Crea tareas y actividades
5. Configura campañas de marketing
6. Crea automatizaciones

¡Disfruta usando tu CRM! 🎉





