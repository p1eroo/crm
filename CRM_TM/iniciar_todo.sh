#!/bin/bash

echo "🚀 Iniciando CRM Taxi Monterrico..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar e iniciar PostgreSQL
echo -e "${YELLOW}1. Verificando PostgreSQL...${NC}"
if pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}"
else
    echo "Iniciando PostgreSQL..."
    brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null
    sleep 3
    if pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL iniciado${NC}"
    else
        echo -e "${YELLOW}⚠️ PostgreSQL no está listo, pero continuando...${NC}"
    fi
fi

# 2. Detener procesos anteriores si existen
echo -e "${YELLOW}2. Limpiando procesos anteriores...${NC}"
pkill -f "ts-node-dev" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

# 3. Iniciar servidor backend
echo -e "${YELLOW}3. Iniciando servidor backend...${NC}"
cd "$(dirname "$0")/server"
npm run dev > /tmp/server.log 2>&1 &
BACKEND_PID=$!
sleep 5

# Verificar que el backend esté funcionando
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend iniciado correctamente (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️ Backend aún iniciando...${NC}"
fi

# 4. Iniciar servidor frontend
echo -e "${YELLOW}4. Iniciando servidor frontend...${NC}"
cd "$(dirname "$0")/client"
HOST=0.0.0.0 npm start > /tmp/client.log 2>&1 &
FRONTEND_PID=$!
sleep 8

# Obtener IP de red
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Todo iniciado correctamente!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "📱 Acceso Local:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000/api"
echo ""
echo "🌐 Acceso desde Red Local:"
echo "   Frontend: http://${IP}:3000"
echo "   Backend:  http://${IP}:5000/api"
echo ""
echo "📋 Credenciales:"
echo "   Email: admin@crm.com"
echo "   Contraseña: admin123"
echo ""
echo "📊 Logs:"
echo "   Backend:  tail -f /tmp/server.log"
echo "   Frontend: tail -f /tmp/client.log"
echo ""
echo "🛑 Para detener todo:"
echo "   pkill -f 'ts-node-dev|react-scripts'"
echo ""



