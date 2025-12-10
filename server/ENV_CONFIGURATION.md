# Configuración de Variables de Entorno

Este proyecto soporta múltiples archivos `.env` para diferentes entornos (desarrollo, pruebas, producción).

## ⚙️ Instalación

Primero, instala la dependencia necesaria para que los scripts funcionen en Windows, Linux y macOS:

```bash
cd server
npm install
```

Esto instalará `cross-env` que permite establecer variables de entorno de forma multiplataforma.

## 📁 Archivos de Entorno

Puedes crear los siguientes archivos en la carpeta `server/`:

- **`.env`** - Valores por defecto/comunes (se carga siempre)
- **`.env.development`** - Configuración para desarrollo local
- **`.env.test`** - Configuración para base de datos de pruebas
- **`.env.production`** - Configuración para producción
- **`.env.local`** - Configuración local (ignorado por git, sobrescribe todo)
- **`.env.{NODE_ENV}.local`** - Configuración local específica del entorno (ignorado por git)

## 🔄 Orden de Carga

Los archivos se cargan en este orden (los últimos sobrescriben a los primeros):

1. `.env` (base)
2. `.env.{NODE_ENV}` (según el entorno)
3. `.env.{NODE_ENV}.local` (local, específico del entorno)

## 🚀 Uso

### Desarrollo (por defecto)
```bash
npm run dev
# O explícitamente:
npm run dev:dev
```

### Pruebas (base de datos de pruebas)
```bash
npm run dev:test
```

### Producción
```bash
npm run dev:prod
# O para ejecutar la versión compilada:
npm run build:prod
npm start
```

## 📝 Ejemplo de Archivos

### `.env` (valores comunes)
```env
PORT=5000
JWT_SECRET=tu-secret-key-aqui
FRONTEND_URL=http://localhost:3000
```

### `.env.development` (desarrollo)
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db_dev
DB_USER=postgres
DB_PASSWORD=postgres
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
```

### `.env.test` (pruebas)
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db_test
DB_USER=postgres
DB_PASSWORD=postgres
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
```

### `.env.production` (producción)
```env
NODE_ENV=production
DB_HOST=tu-servidor-produccion
DB_PORT=5432
DB_NAME=crm_db_prod
DB_USER=usuario_prod
DB_PASSWORD=password_seguro_prod
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/google/callback
FRONTEND_URL=https://tu-dominio.com
```

## ⚠️ Importante

- **NUNCA** subas archivos `.env*` con información sensible a git
- Usa `.env.example` como plantilla para documentar las variables necesarias
- Los archivos `.env.local` y `.env.*.local` están en `.gitignore` por defecto
- Siempre verifica qué entorno estás usando antes de ejecutar comandos

## 🔍 Verificar Entorno Actual

Cuando inicies el servidor, verás en la consola:
```
📦 Entorno cargado: development
📄 Archivos .env cargados: .env, .env.development
```

