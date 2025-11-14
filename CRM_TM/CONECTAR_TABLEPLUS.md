# 🔌 Conectar TablePlus a tu Base de Datos CRM

## Pasos para Conectar

### 1. Abrir TablePlus
- TablePlus ya está instalado en tu Mac
- Ábrelo desde **Aplicaciones** o busca "TablePlus" en Spotlight

### 2. Crear Nueva Conexión

Cuando se abra TablePlus:

1. **Clic en "Create a new connection"** o el botón **"+"**

2. **Selecciona "PostgreSQL"** de la lista

3. **Completa los siguientes datos:**

   ```
   Name: CRM Taxi Monterrico
   Host: localhost
   Port: 5432
   User: postgres
   Password: postgres
   Database: crm_db
   ```

4. **Clic en "Test"** para verificar la conexión

5. Si todo está bien, **clic en "Connect"**

## ✅ Ya Estás Conectado!

Una vez conectado, podrás:

- ✅ Ver todas las tablas en el panel izquierdo
- ✅ Explorar datos haciendo clic en cada tabla
- ✅ Ejecutar consultas SQL
- ✅ Editar datos directamente
- ✅ Ver la estructura de las tablas

## Tablas que Verás

- **users** - Usuarios del sistema
- **contacts** - Contactos
- **companies** - Empresas  
- **deals** - Oportunidades/Deals
- **tasks** - Tareas
- **activities** - Actividades
- **campaigns** - Campañas
- **automations** - Automatizaciones

## Consejos

- **Ver datos:** Haz doble clic en cualquier tabla
- **Ejecutar SQL:** Usa el botón "SQL" en la parte superior
- **Filtrar:** Usa la barra de búsqueda en cada tabla
- **Exportar:** Clic derecho en cualquier tabla → "Export"

## Si Tienes Problemas

**Error de conexión:**
- Verifica que PostgreSQL esté corriendo: `pg_isready -h localhost`
- Verifica que la contraseña sea "postgres"

**No encuentra PostgreSQL:**
- Asegúrate de que PostgreSQL esté instalado y corriendo
- Verifica el puerto 5432

¡Disfruta explorando tu base de datos con una interfaz gráfica! 🎉





