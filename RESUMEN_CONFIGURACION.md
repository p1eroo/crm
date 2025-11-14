# ✅ Configuración Completada

## Estado Actual

✅ **PostgreSQL 15** - Instalado y corriendo
✅ **Base de datos `crm_db`** - Creada e inicializada
✅ **Usuario admin** - Creado exitosamente
✅ **Tablas del CRM** - Todas creadas

## Credenciales de Acceso

**Usuario Admin:**
- Email: `admin@crm.com`
- Password: `admin123`

## Comandos Importantes

### Iniciar PostgreSQL (si se detiene)
```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
pg_ctl -D /usr/local/var/postgresql@15 -l /usr/local/var/postgresql@15/server.log start
```

### Verificar que PostgreSQL está corriendo
```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
pg_isready -h localhost
```

### Iniciar el servidor backend
```bash
cd server
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
npm run dev
```

### Iniciar el frontend (en otra terminal)
```bash
cd client
npm start
```

## PATH Permanente

PostgreSQL ha sido agregado a tu `~/.zshrc`. Para aplicarlo en esta sesión:

```bash
source ~/.zshrc
```

O simplemente abre una nueva terminal.

## URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Próximos Pasos

1. Asegúrate de que PostgreSQL esté corriendo
2. Inicia el servidor backend: `cd server && npm run dev`
3. Inicia el frontend: `cd client && npm start`
4. Accede a http://localhost:3000
5. Inicia sesión con: `admin@crm.com` / `admin123`

## Solución de Problemas

### Si PostgreSQL no inicia:
```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
pg_ctl -D /usr/local/var/postgresql@15 -l /usr/local/var/postgresql@15/server.log start
```

### Si el backend no conecta:
- Verifica que PostgreSQL esté corriendo: `pg_isready -h localhost`
- Revisa el archivo `server/.env` para las credenciales correctas

### Si necesitas reinicializar la base de datos:
```bash
cd server
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
npm run init-db
```

¡Todo listo para usar tu CRM! 🎉








