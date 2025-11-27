# Configurar Redirect URI para Google OAuth

## URLs de los túneles:

### Frontend (puerto 3000):
**https://crm-tm.loca.lt**

### Backend (puerto 5000):
**https://crm-tm-api.loca.lt**

**Nota:** Ambos túneles deben estar corriendo para que la aplicación funcione desde dispositivos móviles.

## Pasos para agregar en Google Cloud Console:

### 1. Ir a Credenciales
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Asegúrate de estar en el proyecto correcto (CRM-TM)

### 2. Editar el OAuth Client ID
1. En la sección "IDs de clientes de OAuth 2.0", haz clic en tu Client ID (el que creaste para el CRM)

### 3. Eliminar la IP privada (si existe)
1. Busca `http://10.10.10.14:3000` en "URI de redirección autorizados"
2. Si existe, elimínala (haz clic en el icono de basura o X)

### 4. Agregar la URL del túnel
1. En "URI de redirección autorizados":
   - Haz clic en "+ Agregar URI"
   - Agrega: `https://crm-tm.loca.lt`
   
2. En "Orígenes de JavaScript autorizados":
   - Haz clic en "+ Agregar URI"
   - Agrega: `https://crm-tm.loca.lt`

### 5. Guardar
1. Haz clic en "Guardar" (o "Save") al final de la página
2. Espera unos segundos para que los cambios se apliquen

### 6. Probar
1. Desde tu celular o cualquier dispositivo en tu red, abre: `https://crm-tm.loca.lt`
2. **IMPORTANTE - Primera vez:** La primera vez que accedes, localtunnel mostrará una página de confirmación con un botón "Click to Continue" o "Request Access". Debes hacer clic en ese botón para autorizar el acceso.
3. Si ves "Error 511", significa que necesitas autorizar el acceso. Busca el botón de confirmación en la página.
4. Una vez autorizado, deberías poder acceder a tu CRM normalmente.
5. Repite el proceso para el backend si es necesario: `https://crm-tm-api.loca.lt`
6. Luego deberías poder usar el botón "Correo" sin errores

## Notas importantes:
- Si la URL `crm-tm` no está disponible, localtunnel generará una aleatoria. Verifica en la terminal qué URL te dio.
- Cada vez que reinicies localtunnel, verifica que la URL sea la misma. Si cambia, actualiza Google Cloud Console.
- El túnel debe estar corriendo mientras uses la aplicación desde dispositivos móviles.

