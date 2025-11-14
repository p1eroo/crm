#!/bin/bash

echo "🐘 Instalando PostgreSQL..."
echo ""

# Verificar si Homebrew está instalado
if ! command -v brew &> /dev/null; then
    echo "📦 Homebrew no está instalado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Agregar Homebrew al PATH
    if [ -f "/opt/homebrew/bin/brew" ]; then
        echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
        export PATH="/opt/homebrew/bin:$PATH"
    elif [ -f "/usr/local/bin/brew" ]; then
        echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
        export PATH="/usr/local/bin:$PATH"
    fi
else
    echo "✅ Homebrew ya está instalado"
fi

echo ""
echo "📦 Instalando PostgreSQL..."
brew install postgresql@15

echo ""
echo "🚀 Iniciando PostgreSQL..."
brew services start postgresql@15

echo ""
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 5

# Verificar instalación
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL instalado correctamente"
    psql --version
    
    echo ""
    echo "📊 Creando base de datos crm_db..."
    createdb -U postgres crm_db 2>/dev/null || echo "⚠️  La base de datos ya existe o hubo un error"
    
    echo ""
    echo "✅ Instalación completada!"
    echo ""
    echo "Próximos pasos:"
    echo "1. cd server"
    echo "2. npm run init-db"
    echo "3. npm run dev"
else
    echo "⚠️  PostgreSQL instalado pero psql no está en el PATH"
    echo "Ejecuta: export PATH=\"/opt/homebrew/bin:\$PATH\""
fi
