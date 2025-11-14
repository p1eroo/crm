# Debug: Error de Login desde Otro Dispositivo

## ✅ Cambios Realizados

1. **Detección dinámica de IP**: El frontend ahora detecta automáticamente la IP en cada petición
2. **Logs detallados**: Se agregaron logs en la consola del navegador para facilitar el diagnóstico
3. **Timeout aumentado**: Se configuró un timeout de 10 segundos para las peticiones
4. **Manejo mejorado de errores**: Los errores ahora muestran información más detallada

## 🔍 Cómo Diagnosticar el Problema

### Paso 1: Abre la Consola del Navegador

Desde el otro dispositivo:
1. Abre `http://10.10.12.204:3000`
2. Presiona **F12** (o Cmd+Option+I en Mac) para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console**

### Paso 2: Intenta Iniciar Sesión

1. Ingresa las credenciales:
   - Email: `admin@crm.com`
   - Contraseña: `admin123`
2. Haz clic en "INICIAR SESIÓN"

### Paso 3: Revisa los Logs

En la consola deberías ver:

**Si funciona correctamente:**
```
🌐 Detectada IP de red: 10.10.12.204
🔗 URL de API configurada: http://10.10.12.204:5000/api
📤 Petición a: http://10.10.12.204:5000/api/auth/login
✅ Respuesta recibida de: http://10.10.12.204:5000/api/auth/login
```

**Si hay error:**
```
❌ Error en petición: http://10.10.12.204:5000/api/auth/login
❌ Detalles del error: { message: "...", code: "...", ... }
```

## 🛠️ Soluciones Comunes

### Error: "No se pudo conectar al servidor"

**Causa**: El frontend no puede alcanzar el backend

**Verificaciones**:
1. ✅ ¿El servidor backend está corriendo?
   ```bash
   lsof -i :5000 | grep LISTEN
   ```

2. ✅ ¿Puedes acceder al backend desde el otro dispositivo?
   ```bash
   # Desde el otro dispositivo, abre un navegador y ve a:
   http://10.10.12.204:5000/api/health
   ```
   Deberías ver: `{"status":"OK","message":"CRM API is running"}`

3. ✅ ¿El firewall está bloqueando las conexiones?
   - En macOS: Preferencias del Sistema > Seguridad y Privacidad > Firewall
   - Asegúrate de que Node.js tenga permisos

### Error: "Network Error" o "ERR_CONNECTION_REFUSED"

**Causa**: El servidor no está escuchando en todas las interfaces

**Solución**: Ya está configurado para escuchar en `0.0.0.0:5000`

Verifica en los logs del servidor:
```bash
tail -f /tmp/server.log
```

Deberías ver:
```
Server is running on port 5000
Accessible from network at: http://0.0.0.0:5000
```

### Error: "CORS policy"

**Causa**: Problema de CORS

**Solución**: Ya está configurado para permitir todos los orígenes

## 📋 Checklist de Verificación

- [ ] Backend corriendo en puerto 5000
- [ ] Frontend corriendo en puerto 3000
- [ ] Backend escuchando en `0.0.0.0:5000` (todas las interfaces)
- [ ] Frontend accesible desde la red: `http://10.10.12.204:3000`
- [ ] Backend accesible desde la red: `http://10.10.12.204:5000/api/health`
- [ ] Consola del navegador muestra los logs de detección de IP
- [ ] No hay errores de firewall bloqueando los puertos

## 🔄 Si el Problema Persiste

1. **Recarga la página** en el otro dispositivo (Ctrl+R o Cmd+R)
2. **Limpia la caché** del navegador (Ctrl+Shift+R o Cmd+Shift+R)
3. **Verifica la IP actual**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
   ```
4. **Revisa los logs del servidor** mientras intentas iniciar sesión:
   ```bash
   tail -f /tmp/server.log
   ```

## 📞 Información para Reportar el Error

Si el problema persiste, proporciona:
1. Los logs de la consola del navegador (F12 > Console)
2. Los logs del servidor (`tail -20 /tmp/server.log`)
3. El mensaje de error exacto que aparece
4. La IP de tu red local




