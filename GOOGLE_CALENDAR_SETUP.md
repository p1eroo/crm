# Configuración de Google Calendar API con Refresh Token

## Pasos para configurar

### 1. Habilitar Google Calendar API en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a "APIs & Services" > "Library"
4. Busca "Google Calendar API"
5. Haz clic en "Enable"

### 2. Configurar OAuth 2.0 (si aún no lo has hecho)

1. Ve a "APIs & Services" > "Credentials"
2. Si ya tienes un OAuth Client ID, úsalo. Si no, crea uno:
   - Haz clic en "Create Credentials" > "OAuth client ID"
   - Tipo: "Web application"
   - Nombre: "CRM Web Client"
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (desarrollo)
     - `https://tudominio.com` (producción)
   - **Authorized redirect URIs:**
     - `http://localhost:5000/api/calendar/callback` (desarrollo - IMPORTANTE: puerto del backend)
     - `https://tudominio.com/api/calendar/callback` (producción)

### 3. Configurar variables de entorno

#### Backend (.env en `/server`)

Agrega estas variables:

```env
# Google OAuth (necesarias para obtener refresh_token)
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
FRONTEND_URL=http://localhost:3000
```

**Nota importante:** 
- `GOOGLE_CLIENT_SECRET` es necesario para el flujo de autorización que obtiene el `refresh_token`
- El `GOOGLE_REDIRECT_URI` debe coincidir EXACTAMENTE con el que configuraste en Google Cloud Console
- En producción, cambia las URLs a tu dominio real

#### Frontend (.env en `/client`)

Mantén la variable existente (aunque ahora el flujo usa el backend):

```env
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

### 4. Reiniciar servidores

Después de agregar las variables de entorno:

```bash
# Backend
cd server
npm run dev

# Frontend (en otra terminal)
cd client
npm start
```

## Cómo funciona el flujo con refresh_token

1. **Usuario hace clic en "Conectar Google"** en el Dashboard
2. **Frontend llama a** `/api/calendar/auth` (con autenticación)
3. **Backend genera URL de autorización** con:
   - `access_type=offline` → Para obtener refresh_token
   - `prompt=consent` → Para forzar pantalla de consentimiento
4. **Usuario autoriza** en Google
5. **Google redirige a** `/api/calendar/callback` con código de autorización
6. **Backend intercambia código por tokens** (access_token + refresh_token)
7. **Backend guarda tokens** en la base de datos
8. **Backend redirige al frontend** con parámetro de éxito
9. **Frontend detecta éxito** y actualiza el estado

## Ventajas del refresh_token

- ✅ **Renovación automática**: Los tokens se renuevan automáticamente cuando expiran
- ✅ **Mejor experiencia**: El usuario no necesita reconectarse constantemente
- ✅ **Funciona en segundo plano**: La renovación es transparente

## Verificar que funciona

1. Conecta Google Calendar desde el Dashboard
2. Verifica en la base de datos que `user_google_tokens` tiene:
   - `access_token` (no nulo)
   - `refresh_token` (no nulo) ← Esto es lo importante
   - `token_expiry` (fecha futura)

## Troubleshooting

### Error: "Google OAuth no está configurado en el servidor"
- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén en `.env` del servidor
- Reinicia el servidor después de agregar las variables

### Error: "redirect_uri_mismatch"
- Verifica que `GOOGLE_REDIRECT_URI` en el backend coincida EXACTAMENTE con el configurado en Google Cloud Console
- El redirect URI debe ser: `http://localhost:5000/api/calendar/callback` (puerto del backend, no del frontend)

### No se obtiene refresh_token
- Asegúrate de que `access_type=offline` y `prompt=consent` estén en la configuración (ya están en el código)
- Si el usuario ya autorizó antes, Google puede no mostrar la pantalla de consentimiento. En ese caso, el usuario debe revocar permisos y volver a autorizar

### Error en el callback
- Verifica que el redirect URI esté correctamente configurado en Google Cloud Console
- Verifica que `FRONTEND_URL` esté configurado correctamente en el backend

