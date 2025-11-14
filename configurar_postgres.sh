#!/bin/bash

echo "🔧 Configurando PostgreSQL..."

# Agregar PostgreSQL al PATH
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# Crear directorio de datos si no existe
if [ ! -d "/usr/local/var/postgresql@15" ]; then
    echo "📦 Creando directorio de datos..."
    mkdir -p /usr/local/var/postgresql@15
    initdb -D /usr/local/var/postgresql@15 --locale=en_US.UTF-8
fi

# Iniciar PostgreSQL
echo "🚀 Iniciando PostgreSQL..."
pg_ctl -D /usr/local/var/postgresql@15 -l /usr/local/var/postgresql@15/server.log start

# Esperar a que esté listo
sleep 3

# Verificar estado
if pg_isready -h localhost > /dev/null 2>&1; then
    echo "✅ PostgreSQL está corriendo"
    
    # Crear base de datos
    echo "📊 Creando base de datos crm_db..."
    createdb -U $(whoami) crm_db 2>/dev/null || echo "⚠️  La base de datos ya existe"
    
    echo ""
    echo "✅ Configuración completada!"
    echo ""
    echo "Agrega esto a tu ~/.zshrc para que PostgreSQL esté siempre disponible:"
    echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"'
else
    echo "❌ PostgreSQL no está respondiendo. Revisa los logs:"
    echo "tail -f /usr/local/var/postgresql@15/server.log"
fi








