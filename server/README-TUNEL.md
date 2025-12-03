# Configuración con Túnel

## Cambios necesarios al usar túnel

### ✅ Lo que NO cambia:
- **Código fuente**: No necesitas modificar ningún archivo `.ts` o `.tsx`
- **Estructura del proyecto**: Todo sigue igual
- **Base de datos**: Sigue siendo local
- **Frontend**: Sigue corriendo en `localhost:3000`

### ⚙️ Lo que SÍ cambia (solo variables de entorno):

#### 1. Archivo `server/.env`

**Sin túnel (local):**
```env
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
FRONTEND_URL=http://localhost:3000
```

**Con túnel (ngrok):**
```env
GOOGLE_REDIRECT_URI=https://abc123.ngrok-free.app/api/google/callback
FRONTEND_URL=http://localhost:3000
```

**Con túnel (localtunnel):**
```env
GOOGLE_REDIRECT_URI=https://crm-tm-api.loca.lt/api/google/callback
FRONTEND_URL=http://localhost:3000
```

#### 2. Google Cloud Console

Necesitas agregar la URL del túnel a "Authorized redirect URIs":
- Ve a: https://console.cloud.google.com/apis/credentials
- Edita tu OAuth 2.0 Client ID
- En "Authorized redirect URIs", agrega:
  - `https://tu-url-tunel/api/google/callback`

## Cómo cambiar entre túnel y local

### Opción 1: Comentar/Descomentar en `.env`
Simplemente comenta una línea y descomenta la otra:

```env
# Modo LOCAL
# GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback

# Modo TÚNEL
GOOGLE_REDIRECT_URI=https://abc123.ngrok-free.app/api/google/callback
```

### Opción 2: Usar archivos `.env` separados
- `.env.local` - Para desarrollo local
- `.env.tunnel` - Para desarrollo con túnel

Y cambiar el nombre del archivo según necesites.

## Flujo de trabajo recomendado

1. **Desarrollo local normal**: Usa `localhost` (sin túnel)
2. **Cuando necesites probar Google OAuth**: 
   - Inicia el túnel
   - Actualiza `.env` con la URL del túnel
   - Actualiza Google Cloud Console
   - Reinicia el servidor

## Nota importante

- El túnel solo expone el **backend** (puerto 5000)
- El **frontend** sigue siendo `localhost:3000` (no necesita túnel)
- Los **dispositivos en tu red** pueden seguir accediendo a `http://10.10.10.14:3000` para el frontend
- El backend será accesible vía túnel para Google OAuth, pero también puedes mantener acceso local



