# 🗄️ Guía: Cómo Configurar Diferentes Bases de Datos

## 📋 Tabla de Contenidos
1. [Métodos para Cambiar de Base de Datos](#métodos-para-cambiar-de-base-de-datos)
2. [Crear Nuevas Bases de Datos](#crear-nuevas-bases-de-datos)
3. [Ejemplos Prácticos](#ejemplos-prácticos)
4. [Verificar Configuración](#verificar-configuración)

---

## 🔄 Métodos para Cambiar de Base de Datos

### **Método 1: Usar Diferentes Entornos (Recomendado)**

El sistema ya está configurado para usar diferentes archivos `.env` según el entorno:

```bash
# Desarrollo - usa .env.development → crm_db_dev
npm run dev

# Pruebas - usa .env.test → crm_db_test
npm run dev:test

# Producción - usa .env.production → crm_db_prod
npm run dev:prod
```

### **Método 2: Modificar el Archivo .env Directamente**

Edita el archivo `.env.development` o `.env.test` y cambia la variable `DB_NAME`:

```env
# En .env.development
DB_NAME=mi_base_datos_personalizada
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### **Método 3: Usar Archivo .env.local (Sobrescribe Todo)**

Crea un archivo `.env.development.local` (o `.env.test.local`) que sobrescribirá los valores:

```env
# .env.development.local
DB_NAME=mi_base_especial
DB_PASSWORD=mi_password_especial
```

Este archivo está en `.gitignore`, así que es perfecto para configuraciones personales.

### **Método 4: Variables de Entorno del Sistema**

Puedes establecer variables de entorno directamente en PowerShell antes de ejecutar:

```powershell
# Windows PowerShell
$env:DB_NAME="mi_base_datos"
$env:DB_USER="postgres"
$env:DB_PASSWORD="postgres"
npm run dev
```

---

## 🆕 Crear Nuevas Bases de Datos

### **Opción 1: Desde la Terminal (PostgreSQL CLI)**

```bash
# Crear base de datos de desarrollo
createdb -U postgres crm_db_dev

# Crear base de datos de pruebas
createdb -U postgres crm_db_test

# Crear base de datos personalizada
createdb -U postgres mi_base_personalizada
```

### **Opción 2: Desde psql (Línea de Comandos de PostgreSQL)**

```bash
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql, crear la base de datos
CREATE DATABASE crm_db_dev;
CREATE DATABASE crm_db_test;
CREATE DATABASE mi_base_personalizada;

# Salir
\q
```

### **Opción 3: Desde pgAdmin (Interfaz Gráfica)**

1. Abre pgAdmin
2. Conéctate a tu servidor PostgreSQL
3. Click derecho en "Databases" → "Create" → "Database"
4. Ingresa el nombre (ej: `crm_db_dev`)
5. Click en "Save"

---

## 💡 Ejemplos Prácticos

### **Ejemplo 1: Base de Datos para Cliente Específico**

Crea un archivo `.env.cliente1` y un script personalizado:

**1. Crear el archivo:**
```env
# .env.cliente1
NODE_ENV=development
DB_NAME=crm_cliente1
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
PORT=5000
JWT_SECRET=cliente1-secret
FRONTEND_URL=http://localhost:3000
```

**2. Agregar script en package.json:**
```json
"dev:cliente1": "cross-env NODE_ENV=cliente1 ts-node-dev --respawn --transpile-only src/index.ts"
```

**3. Crear la base de datos:**
```bash
createdb -U postgres crm_cliente1
```

**4. Usar:**
```bash
npm run dev:cliente1
```

### **Ejemplo 2: Base de Datos en Servidor Remoto**

Edita `.env.production`:

```env
# .env.production
NODE_ENV=production
DB_NAME=crm_produccion
DB_USER=usuario_remoto
DB_PASSWORD=password_seguro
DB_HOST=192.168.1.100  # IP del servidor remoto
DB_PORT=5432
PORT=5000
JWT_SECRET=super-secret-production-key
FRONTEND_URL=https://tu-dominio.com
```

### **Ejemplo 3: Múltiples Bases de Datos Locales**

Puedes tener varias bases de datos locales y cambiar entre ellas:

```env
# .env.development - Base de datos principal
DB_NAME=crm_db_dev

# .env.development.local - Sobrescribe para usar otra base
DB_NAME=crm_db_backup
```

---

## ✅ Verificar Configuración

### **1. Ver qué archivos se están cargando**

Cuando inicies el servidor, verás en la consola:

```
📦 Entorno: development
📄 Archivos .env cargados: .env, .env.development
```

### **2. Verificar conexión a la base de datos**

El servidor mostrará un mensaje al conectarse:

```
Database connection established successfully.
```

Si hay error, verifica:
- Que la base de datos existe
- Que las credenciales son correctas
- Que PostgreSQL está corriendo

### **3. Listar bases de datos existentes**

```bash
# Desde terminal
psql -U postgres -l

# O desde psql
psql -U postgres
\l
```

---

## 🔧 Configuración Actual

### **Archivos .env Creados:**

- ✅ `.env.development` → `crm_db_dev`
- ✅ `.env.test` → `crm_db_test`
- ⚠️ `.env.production` → (crear cuando necesites)

### **Variables de Base de Datos:**

Cada archivo `.env` debe tener estas variables:

```env
DB_HOST=localhost          # Host de PostgreSQL
DB_PORT=5432              # Puerto (por defecto 5432)
DB_NAME=nombre_base       # Nombre de la base de datos
DB_USER=postgres          # Usuario de PostgreSQL
DB_PASSWORD=postgres      # Contraseña
```

---

## 🚀 Flujo de Trabajo Recomendado

1. **Desarrollo diario:**
   ```bash
   npm run dev  # Usa .env.development → crm_db_dev
   ```

2. **Antes de hacer cambios importantes:**
   ```bash
   # Crear backup de la base de datos
   pg_dump -U postgres crm_db_dev > backup.sql
   
   # O usar base de datos de pruebas
   npm run dev:test  # Usa .env.test → crm_db_test
   ```

3. **Para producción:**
   ```bash
   # Crear .env.production con datos de producción
   npm run build:prod
   npm start
   ```

---

## ⚠️ Notas Importantes

1. **Nunca uses la base de datos de producción para desarrollo**
2. **Crea backups antes de hacer cambios importantes**
3. **Los archivos `.env.local` están en `.gitignore`** - úsalos para configuraciones personales
4. **Verifica que la base de datos existe antes de iniciar el servidor**
5. **Usa contraseñas seguras en producción**

---

## 🆘 Solución de Problemas

### **Error: "database does not exist"**
```bash
# Crear la base de datos
createdb -U postgres nombre_base_datos
```

### **Error: "password authentication failed"**
- Verifica `DB_USER` y `DB_PASSWORD` en tu archivo `.env`
- Verifica las credenciales de PostgreSQL

### **Error: "could not connect to server"**
- Verifica que PostgreSQL está corriendo: `pg_isready`
- Verifica `DB_HOST` y `DB_PORT`

### **Quiero usar una base de datos diferente temporalmente**
Crea `.env.development.local` con:
```env
DB_NAME=mi_base_temporal
```
Este archivo sobrescribirá `.env.development` y no se subirá a git.




