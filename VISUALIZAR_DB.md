# 🗄️ Visualizar Base de Datos PostgreSQL

## Resumen de la Base de Datos CRM

### ✅ Tablas Creadas (8 tablas)

1. **users** - Usuarios del sistema
2. **contacts** - Contactos
3. **companies** - Empresas
4. **deals** - Oportunidades/Deals
5. **tasks** - Tareas
6. **activities** - Actividades
7. **campaigns** - Campañas de marketing
8. **automations** - Automatizaciones

### 👤 Usuario Admin Creado

- **Email:** admin@crm.com
- **Nombre:** Admin User
- **Rol:** admin
- **Estado:** Activo

## Formas de Explorar la Base de Datos

### Opción 1: Script Interactivo (Recomendado)

```bash
cd /Users/jqck/Documents/CRM_TM
./explorar_db.sh
```

Este script te permite:
- Ver todas las tablas
- Explorar datos de cada tabla
- Ver estadísticas
- Abrir consola interactiva

### Opción 2: Consola Interactiva de PostgreSQL

```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
psql -U postgres -d crm_db
```

**Comandos útiles en psql:**
- `\dt` - Listar todas las tablas
- `\d nombre_tabla` - Ver estructura de una tabla
- `SELECT * FROM users;` - Ver usuarios
- `SELECT * FROM contacts;` - Ver contactos
- `\q` - Salir

### Opción 3: Comandos Directos

**Ver todas las tablas:**
```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
psql -U postgres -d crm_db -c "\dt"
```

**Ver usuarios:**
```bash
psql -U postgres -d crm_db -c "SELECT * FROM users;"
```

**Ver contactos:**
```bash
psql -U postgres -d crm_db -c "SELECT * FROM contacts;"
```

**Ver estadísticas:**
```bash
psql -U postgres -d crm_db -c "
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM contacts) as contactos,
  (SELECT COUNT(*) FROM companies) as empresas,
  (SELECT COUNT(*) FROM deals) as deals;
"
```

## Estructura de las Tablas Principales

### users
- id, email, password, firstName, lastName, role, avatar, isActive

### contacts
- id, firstName, lastName, email, phone, jobTitle, companyId, ownerId, lifecycleStage, tags, notes

### companies
- id, name, domain, industry, phone, address, ownerId, lifecycleStage, tags, notes

### deals
- id, name, amount, stage, closeDate, probability, ownerId, contactId, companyId, pipelineId

### tasks
- id, title, description, type, status, priority, dueDate, assignedToId, createdById

## Estado Actual

- ✅ Base de datos creada: `crm_db`
- ✅ 8 tablas creadas
- ✅ 1 usuario admin creado
- ⚪ Sin datos de prueba aún (puedes agregarlos desde la interfaz web)

## Próximos Pasos

1. Inicia sesión en http://localhost:3000
2. Crea contactos, empresas y deals desde la interfaz
3. Los datos se guardarán automáticamente en PostgreSQL
4. Puedes verlos usando cualquiera de los métodos arriba








