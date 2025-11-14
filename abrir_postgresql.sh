#!/bin/bash

export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

echo "🗄️  Abriendo PostgreSQL..."
echo ""
echo "Base de datos: crm_db"
echo "Usuario: postgres"
echo ""
echo "Comandos útiles una vez dentro:"
echo "  \\dt          - Ver todas las tablas"
echo "  \\d tabla     - Ver estructura de una tabla"
echo "  SELECT * FROM users;  - Ver usuarios"
echo "  SELECT * FROM contacts;  - Ver contactos"
echo "  \\q           - Salir"
echo ""
echo "─────────────────────────────────────────"
echo ""

psql -U postgres -d crm_db








