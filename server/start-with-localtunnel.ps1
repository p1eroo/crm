# Script para iniciar el servidor con túnel localtunnel
# Requiere tener localtunnel instalado: npm install -g localtunnel

Write-Host "🚀 Iniciando servidor con túnel localtunnel..." -ForegroundColor Green

# Verificar si localtunnel está instalado
$ltPath = Get-Command lt -ErrorAction SilentlyContinue
if (-not $ltPath) {
    Write-Host "❌ localtunnel no está instalado." -ForegroundColor Red
    Write-Host "📥 Instala con: npm install -g localtunnel" -ForegroundColor Yellow
    exit 1
}

# Iniciar localtunnel en segundo plano
Write-Host "🌐 Iniciando túnel localtunnel en puerto 5000..." -ForegroundColor Cyan
$ltProcess = Start-Process -FilePath "lt" -ArgumentList "--port", "5000", "--subdomain", "crm-tm-api" -PassThru -WindowStyle Hidden

# Esperar un momento para que localtunnel se inicie
Start-Sleep -Seconds 5

$tunnelUrl = "https://crm-tm-api.loca.lt"
Write-Host ""
Write-Host "✅ Túnel activo: $tunnelUrl" -ForegroundColor Green
Write-Host ""
Write-Host "📝 IMPORTANTE: Actualiza tu archivo .env con:" -ForegroundColor Yellow
Write-Host "   GOOGLE_REDIRECT_URI=$tunnelUrl/api/google/callback" -ForegroundColor White
Write-Host ""
Write-Host "📝 Y en Google Cloud Console, agrega a 'Authorized redirect URIs':" -ForegroundColor Yellow
Write-Host "   $tunnelUrl/api/google/callback" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Iniciando servidor backend..." -ForegroundColor Cyan
Write-Host ""

# Iniciar el servidor
npm run dev

# Al cerrar, terminar localtunnel también
Write-Host ""
Write-Host "🛑 Cerrando túnel..." -ForegroundColor Yellow
Stop-Process -Id $ltProcess.Id -Force -ErrorAction SilentlyContinue

