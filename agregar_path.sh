#!/bin/bash

echo "📝 Agregando PostgreSQL al PATH permanentemente..."

# Verificar si ya existe en .zshrc
if grep -q "postgresql@15/bin" ~/.zshrc 2>/dev/null; then
    echo "✅ PostgreSQL ya está en el PATH"
else
    echo "" >> ~/.zshrc
    echo "# PostgreSQL 15" >> ~/.zshrc
    echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
    echo "✅ Agregado a ~/.zshrc"
    echo ""
    echo "Ejecuta: source ~/.zshrc"
fi








