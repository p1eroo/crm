# CRM Monterrico

Un sistema CRM completo tipo HubSpot con todas las funcionalidades principales para gestión de ventas, marketing y relaciones con clientes.

## 🚀 Características

### Módulos Principales

1. **Dashboard**
   - Estadísticas en tiempo real
   - Gráficos y métricas clave
   - Resumen de actividades recientes

2. **Gestión de Contactos**
   - CRUD completo de contactos
   - Etapas del ciclo de vida (Lifecycle Stages)
   - Búsqueda y filtrado avanzado
   - Asignación de propietarios

3. **Gestión de Empresas**
   - CRUD completo de empresas
   - Información detallada (industria, tamaño, ingresos)
   - Relación con contactos

4. **Deals (Oportunidades)**
   - Gestión completa de oportunidades de venta
   - Pipeline de ventas personalizable
   - Seguimiento de probabilidades y montos
   - Fechas de cierre

5. **Tareas y Actividades**
   - Creación y seguimiento de tareas
   - Tipos: llamadas, emails, reuniones, notas
   - Prioridades y estados
   - Asignación a usuarios

6. **Campañas de Marketing**
   - Gestión de campañas
   - Seguimiento de métricas (impresiones, clics, conversiones)
   - Presupuestos y gastos

7. **Automatizaciones**
   - Creación de workflows
   - Triggers y acciones personalizables
   - Automatización de procesos

## 🛠️ Tecnologías

### Backend
- **Node.js** con Express
- **TypeScript**
- **PostgreSQL** con Sequelize ORM
- **JWT** para autenticación
- **bcryptjs** para encriptación de contraseñas

### Frontend
- **React** con TypeScript
- **Material-UI** para componentes
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **Recharts** para gráficos

## 📦 Instalación

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
cd CRM_TM
```

2. **Instalar dependencias**
```bash
npm run install-all
```

3. **Configurar base de datos**
   - Crear una base de datos PostgreSQL llamada `crm_db`
   - Copiar `.env.example` a `.env` en la carpeta `server`
   - Configurar las variables de entorno en `server/.env`:
```env
PORT=5000
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=tu_password_postgres
```

4. **Inicializar la base de datos** (opcional, crea usuario admin por defecto)
```bash
cd server
npm run init-db
```
Esto creará las tablas y un usuario admin por defecto:
- Email: `admin@crm.com`
- Password: `admin123`

5. **Iniciar el servidor**
```bash
npm run dev
```

Esto iniciará tanto el backend (puerto 5000) como el frontend (puerto 3000).

## 📝 Uso

1. Accede a `http://localhost:3000`
2. Inicia sesión con tus credenciales (primero necesitas crear un usuario mediante el endpoint de registro)
3. Explora los diferentes módulos desde el menú lateral

## 🔐 Autenticación

### Usuario por defecto
Después de ejecutar `npm run init-db`, puedes usar:
- Email: `admin@crm.com`
- Password: `admin123`

### Crear nuevos usuarios
También puedes crear usuarios mediante el endpoint de registro:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "role": "user"
}
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Contactos
- `GET /api/contacts` - Listar contactos
- `GET /api/contacts/:id` - Obtener contacto
- `POST /api/contacts` - Crear contacto
- `PUT /api/contacts/:id` - Actualizar contacto
- `DELETE /api/contacts/:id` - Eliminar contacto

### Empresas
- `GET /api/companies` - Listar empresas
- `GET /api/companies/:id` - Obtener empresa
- `POST /api/companies` - Crear empresa
- `PUT /api/companies/:id` - Actualizar empresa
- `DELETE /api/companies/:id` - Eliminar empresa

### Deals
- `GET /api/deals` - Listar deals
- `GET /api/deals/:id` - Obtener deal
- `POST /api/deals` - Crear deal
- `PUT /api/deals/:id` - Actualizar deal
- `DELETE /api/deals/:id` - Eliminar deal

### Tareas
- `GET /api/tasks` - Listar tareas
- `GET /api/tasks/:id` - Obtener tarea
- `POST /api/tasks` - Crear tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

### Campañas
- `GET /api/campaigns` - Listar campañas
- `GET /api/campaigns/:id` - Obtener campaña
- `POST /api/campaigns` - Crear campaña
- `PUT /api/campaigns/:id` - Actualizar campaña
- `DELETE /api/campaigns/:id` - Eliminar campaña

### Dashboard
- `GET /api/dashboard/stats` - Obtener estadísticas
- `GET /api/dashboard/recent-activities` - Actividades recientes

### Automatizaciones
- `GET /api/automations` - Listar automatizaciones
- `GET /api/automations/:id` - Obtener automatización
- `POST /api/automations` - Crear automatización
- `PUT /api/automations/:id` - Actualizar automatización
- `DELETE /api/automations/:id` - Eliminar automatización

## 🎨 Características de Diseño

- Interfaz moderna y limpia inspirada en HubSpot
- Diseño responsive
- Tema personalizable con Material-UI
- Navegación intuitiva con sidebar
- Gráficos interactivos para visualización de datos

## 🔒 Seguridad

- Autenticación JWT
- Contraseñas encriptadas con bcrypt
- Middleware de autenticación en todas las rutas protegidas
- Validación de datos en el backend

## 📈 Próximas Mejoras

- [ ] Pipeline visual drag-and-drop
- [ ] Integración con email
- [ ] Reportes avanzados y exportación
- [ ] Chat en vivo
- [ ] Landing pages builder
- [ ] Blog CMS
- [ ] Integraciones con terceros (Google, Facebook, etc.)
- [ ] Mobile app

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para cualquier mejora.

# crm2
