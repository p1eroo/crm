#!/bin/bash

echo "🚀 Iniciando CRM HubSpot..."
echo ""

# Verificar si PostgreSQL está corriendo
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL no está corriendo o no está disponible."
    echo "   Por favor, asegúrate de que PostgreSQL esté instalado y corriendo."
    echo "   En macOS puedes usar: brew services start postgresql"
    echo ""
fi

# Verificar si la base de datos existe
if psql -U postgres -h localhost -lqt | cut -d \| -f 1 | grep -qw crm_db; then
    echo "✅ Base de datos 'crm_db' existe"
else
    echo "📦 Creando base de datos 'crm_db'..."
    createdb -U postgres -h localhost crm_db 2>/dev/null || echo "⚠️  No se pudo crear la base de datos. Asegúrate de que PostgreSQL esté configurado correctamente."
fi

echo ""
echo "🔧 Iniciando servidores..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""

# Iniciar en segundo plano
cd server && npm run dev &
SERVER_PID=$!

# Esperar a que el servidor esté listo
sleep 3

# Iniciar el cliente
cd ../client && npm start &
CLIENT_PID=$!

echo "✅ Servidores iniciados"
echo "   Backend PID: $SERVER_PID"
echo "   Frontend PID: $CLIENT_PID"
echo ""
echo "Para detener los servidores, presiona Ctrl+C o ejecuta:"
echo "   kill $SERVER_PID $CLIENT_PID"

wait








