# Configuración de Google OAuth para Gmail API

## Pasos para configurar

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Gmail API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Gmail API"
   - Haz clic en "Enable"

### 2. Crear credenciales OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Tipo de aplicación: Externa
   - Nombre de la aplicación: Tu CRM
   - Email de soporte: tu email
   - Dominios autorizados: tu dominio (o localhost para desarrollo)
   - Guarda y continúa
4. Crea el OAuth client ID:
   - Tipo de aplicación: "Web application"
   - Nombre: "CRM Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (desarrollo)
     - `https://tudominio.com` (producción)
   - Authorized redirect URIs:
     - `http://localhost:3000` (desarrollo)
     - `https://tudominio.com` (producción)
5. Copia el **Client ID**

### 3. Configurar variables de entorno

#### Frontend (.env en `/client`)
```
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

#### Backend (.env en `/server`)
```
GOOGLE_CLIENT_ID=tu_client_id_aqui (opcional, solo si necesitas validar en backend)
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui (opcional)
```

### 4. Reiniciar servidores

Después de agregar las variables de entorno, reinicia:
- Frontend: `npm start` en `/client`
- Backend: `npm run dev` en `/server`

## Notas importantes

- El **Client ID** es público y seguro compartirlo en el frontend
- El **Client Secret** NO debe estar en el frontend (solo backend si es necesario)
- Los redirect URIs deben coincidir exactamente con las URLs de tu aplicación
- Para producción, asegúrate de agregar tu dominio real en los redirect URIs

## Cómo funciona

1. Usuario hace clic en "Correo"
2. Se abre el modal de autenticación de Google
3. Usuario autoriza el acceso a Gmail
4. Se obtiene el token de acceso
5. El usuario puede enviar emails desde el modal
6. Los emails se envían desde la cuenta de Gmail del usuario

## Límites

- Gmail personal: 500 emails/día
- Google Workspace: 2,000 emails/día por usuario
- Gmail API: 1 billón de cuotas/día (muy generoso)

## Acceso desde dispositivos en tu red local

Google OAuth no permite IPs privadas como redirect URI. Para acceder desde dispositivos en tu red local, usa un túnel local:

### Opción 1: Usar localtunnel (Recomendado - Sin registro)

1. **Iniciar el túnel** (en una terminal separada, mientras tu servidor está corriendo):
   ```bash
   npx localtunnel --port 3000
   ```
   
   Esto te dará una URL temporal como: `https://abc123.loca.lt`

2. **Agregar la URL en Google Cloud Console:**
   - Ve a "APIs y servicios" > "Credenciales"
   - Haz clic en tu OAuth Client ID
   - En "URI de redirección autorizados", agrega:
     - `https://TU_URL.loca.lt`
   - En "Orígenes de JavaScript autorizados", agrega:
     - `https://TU_URL.loca.lt`
   - Guarda los cambios

3. **Acceder desde tus dispositivos:**
   - Usa la URL de localtunnel (ej: `https://abc123.loca.lt`) desde cualquier dispositivo en tu red
   - La primera vez, localtunnel puede pedirte confirmar en el navegador

**Nota:** La URL cambia cada vez que reinicias localtunnel. Para una URL fija, usa la opción 2.

### Opción 2: Usar ngrok (URL fija con cuenta gratuita)

1. **Instalar ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Crear cuenta gratuita en ngrok.com** y obtener tu token

3. **Autenticar ngrok:**
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

4. **Iniciar túnel:**
   ```bash
   ngrok http 3000
   ```

5. **Agregar la URL en Google Cloud Console** (igual que en la opción 1)

**Nota:** Con ngrok gratuito, la URL cambia al reiniciar. Para URL fija, necesitas el plan de pago.

