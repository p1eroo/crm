#!/bin/bash

export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

echo "🗄️  EXPLORADOR DE BASE DE DATOS CRM"
echo "===================================="
echo ""

# Función para mostrar menú
show_menu() {
    echo "Selecciona una opción:"
    echo ""
    echo "1) Ver todas las tablas"
    echo "2) Ver estructura de una tabla específica"
    echo "3) Ver usuarios"
    echo "4) Ver contactos"
    echo "5) Ver empresas"
    echo "6) Ver deals"
    echo "7) Ver tareas"
    echo "8) Ver campañas"
    echo "9) Ver automatizaciones"
    echo "10) Ver estadísticas generales"
    echo "11) Abrir consola interactiva de PostgreSQL"
    echo "0) Salir"
    echo ""
    read -p "Opción: " option
}

# Función para ver estructura de tabla
show_table_structure() {
    read -p "Nombre de la tabla: " table_name
    echo ""
    psql -U postgres -d crm_db -c "\d $table_name"
    echo ""
    read -p "Presiona Enter para continuar..."
}

# Función para ver datos de una tabla
show_table_data() {
    table_name=$1
    limit=${2:-10}
    echo ""
    psql -U postgres -d crm_db -c "SELECT * FROM $table_name LIMIT $limit;"
    echo ""
    read -p "Presiona Enter para continuar..."
}

while true; do
    show_menu
    
    case $option in
        1)
            echo ""
            echo "📊 TABLAS EN LA BASE DE DATOS:"
            psql -U postgres -d crm_db -c "\dt"
            echo ""
            read -p "Presiona Enter para continuar..."
            ;;
        2)
            show_table_structure
            ;;
        3)
            echo ""
            echo "👤 USUARIOS:"
            show_table_data "users"
            ;;
        4)
            echo ""
            echo "📇 CONTACTOS:"
            show_table_data "contacts"
            ;;
        5)
            echo ""
            echo "🏢 EMPRESAS:"
            show_table_data "companies"
            ;;
        6)
            echo ""
            echo "💰 DEALS:"
            show_table_data "deals"
            ;;
        7)
            echo ""
            echo "✅ TAREAS:"
            show_table_data "tasks"
            ;;
        8)
            echo ""
            echo "📢 CAMPAÑAS:"
            show_table_data "campaigns"
            ;;
        9)
            echo ""
            echo "⚙️  AUTOMATIZACIONES:"
            show_table_data "automations"
            ;;
        10)
            echo ""
            echo "📈 ESTADÍSTICAS GENERALES:"
            psql -U postgres -d crm_db -c "
            SELECT 
              (SELECT COUNT(*) FROM users) as usuarios,
              (SELECT COUNT(*) FROM contacts) as contactos,
              (SELECT COUNT(*) FROM companies) as empresas,
              (SELECT COUNT(*) FROM deals) as deals,
              (SELECT COUNT(*) FROM tasks) as tareas,
              (SELECT COUNT(*) FROM campaigns) as campañas,
              (SELECT COUNT(*) FROM automations) as automatizaciones,
              (SELECT COUNT(*) FROM activities) as actividades;
            "
            echo ""
            read -p "Presiona Enter para continuar..."
            ;;
        11)
            echo ""
            echo "Abriendo consola interactiva de PostgreSQL..."
            echo "Escribe '\\q' para salir"
            echo ""
            psql -U postgres -d crm_db
            ;;
        0)
            echo "¡Hasta luego!"
            exit 0
            ;;
        *)
            echo "Opción inválida"
            sleep 1
            ;;
    esac
    
    clear
done





