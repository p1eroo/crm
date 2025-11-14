# 🖥️ Aplicaciones Gráficas para PostgreSQL

## Opciones Disponibles

### 1. TablePlus (⭐ Recomendado para macOS)

**Características:**
- ✅ Interfaz moderna y elegante
- ✅ Muy rápido y ligero
- ✅ Gratis para uso básico
- ✅ Perfecto para macOS

**Instalación:**
```bash
brew install --cask tableplus
```

**Uso:**
1. Abre TablePlus
2. Clic en "Create a new connection"
3. Selecciona "PostgreSQL"
4. Configuración:
   - **Name:** CRM Taxi Monterrico
   - **Host:** localhost
   - **Port:** 5432
   - **User:** postgres
   - **Password:** postgres
   - **Database:** crm_db
5. Clic en "Connect"

### 2. pgAdmin (Oficial de PostgreSQL)

**Características:**
- ✅ Herramienta oficial de PostgreSQL
- ✅ Muy completa y potente
- ✅ Completamente gratuita
- ⚠️ Puede ser pesada

**Instalación:**
```bash
brew install --cask pgadmin4
```

**Uso:**
1. Abre pgAdmin
2. Clic derecho en "Servers" → "Create" → "Server"
3. En la pestaña "General":
   - **Name:** CRM Taxi Monterrico
4. En la pestaña "Connection":
   - **Host:** localhost
   - **Port:** 5432
   - **Maintenance database:** postgres
   - **Username:** postgres
   - **Password:** postgres
5. Guardar contraseña
6. Clic en "Save"

### 3. DBeaver (Universal)

**Características:**
- ✅ Soporta múltiples bases de datos
- ✅ Completamente gratuita
- ✅ Muy completa
- ⚠️ Interfaz menos moderna

**Instalación:**
```bash
brew install --cask dbeaver-community
```

### 4. Postico (Específica para macOS)

**Características:**
- ✅ Diseñada específicamente para macOS
- ✅ Interfaz muy limpia
- ⚠️ Versión gratuita limitada
- ⚠️ Versión completa de pago

**Instalación:**
```bash
brew install --cask postico
```

## Configuración de Conexión

Para todas las aplicaciones, usa estos datos:

```
Tipo: PostgreSQL
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: postgres
Base de datos: crm_db
```

## Recomendación

Para macOS, recomiendo **TablePlus** porque:
- Es rápido y moderno
- Tiene una versión gratuita muy completa
- Interfaz intuitiva
- Perfectamente integrado con macOS

## Instalación Rápida de TablePlus

```bash
brew install --cask tableplus
```

Luego abre TablePlus desde Aplicaciones y crea la conexión con los datos de arriba.

## Alternativa: Abrir desde Terminal

Si prefieres abrir TablePlus directamente desde terminal después de instalarlo:

```bash
open -a TablePlus
```





