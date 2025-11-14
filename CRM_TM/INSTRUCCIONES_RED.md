# Acceso desde la Red Local

## ✅ Configuración Habilitada

El servidor de desarrollo ahora está configurado para aceptar conexiones desde la red local.

## URLs de Acceso

### Desde esta computadora (localhost):
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### Desde otros dispositivos en la misma red:
- **Frontend**: http://10.10.12.204:3000
- **Backend API**: http://10.10.12.204:5000/api

## ✅ Configuración Automática

El frontend ahora detecta automáticamente si estás accediendo desde la red local y se conecta al backend usando la misma IP. **No necesitas configuración adicional**.

## Verificar IP de Red

Para obtener tu IP actual de red local, ejecuta:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

## Firewall

Asegúrate de que tu firewall permita conexiones en los puertos 3000 y 5000.

En macOS, puedes verificar/abrir los puertos con:
```bash
# Verificar reglas de firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Si el firewall está activo, puedes necesitar permitir Node.js
```

## Estado Actual

- ✅ Backend escuchando en 0.0.0.0:5000 (todas las interfaces)
- ✅ Frontend escuchando en 0.0.0.0:3000 (todas las interfaces)
- ✅ Detección automática de IP de red configurada
