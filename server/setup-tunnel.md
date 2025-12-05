# Configuración de Túnel para Desarrollo

## Opción 1: Usar ngrok (Recomendado)

### 1. Instalar ngrok
- Descarga desde: https://ngrok.com/download
- O instala con chocolatey: `choco install ngrok`
- O con npm: `npm install -g ngrok`

### 2. Crear cuenta y obtener token
- Ve a https://dashboard.ngrok.com/get-started/your-authtoken
- Copia tu authtoken

### 3. Configurar ngrok
```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

### 4. Iniciar túnel para el backend
```bash
ngrok http 5000
```

Esto te dará una URL como: `https://abc123.ngrok-free.app`

### 5. Actualizar variables de entorno en server/.env
```
GOOGLE_REDIRECT_URI=https://TU_URL_NGROK.ngrok-free.app/api/google/callback
FRONTEND_URL=http://localhost:3000
```

### 6. Actualizar Google Cloud Console
- Ve a Google Cloud Console > APIs & Services > Credentials
- Edita tu OAuth 2.0 Client ID
- Agrega a "Authorized redirect URIs":
  - `https://TU_URL_NGROK.ngrok-free.app/api/google/callback`

## Opción 2: Usar localtunnel (Más simple, pero menos estable)

### 1. Instalar localtunnel
```bash
npm install -g localtunnel
```

### 2. Iniciar túnel
```bash
lt --port 5000 --subdomain crm-tm-api
```

Esto te dará una URL como: `https://crm-tm-api.loca.lt`

### 3. Actualizar variables de entorno
```
GOOGLE_REDIRECT_URI=https://crm-tm-api.loca.lt/api/google/callback
FRONTEND_URL=http://localhost:3000
```

### 4. Actualizar Google Cloud Console
- Agrega a "Authorized redirect URIs":
  - `https://crm-tm-api.loca.lt/api/google/callback`

## Opción 3: Configurar Firewall de Windows (Sin túnel)

Si prefieres no usar túnel y acceder desde la red local:

### 1. Abrir puerto en Firewall
```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "CRM Backend Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "CRM Frontend Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 2. Para Google OAuth, agregar usuarios de prueba
- Ve a Google Cloud Console > OAuth consent screen
- En "Test users", agrega los emails que pueden usar la app
- La app seguirá en modo de prueba hasta que la publiques





