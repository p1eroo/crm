# Script para iniciar el servidor con túnel ngrok
# Requiere tener ngrok instalado y configurado

Write-Host "🚀 Iniciando servidor con túnel..." -ForegroundColor Green

# Verificar si ngrok está instalado
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "❌ ngrok no está instalado." -ForegroundColor Red
    Write-Host "📥 Instala ngrok desde: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "   O con: choco install ngrok" -ForegroundColor Yellow
    exit 1
}

# Iniciar ngrok en segundo plano
Write-Host "🌐 Iniciando túnel ngrok en puerto 5000..." -ForegroundColor Cyan
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", "5000" -PassThru -WindowStyle Hidden

# Esperar un momento para que ngrok se inicie
Start-Sleep -Seconds 3

# Obtener la URL del túnel
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $tunnelUrl = $ngrokApi.tunnels[0].public_url
    Write-Host ""
    Write-Host "✅ Túnel activo: $tunnelUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 IMPORTANTE: Actualiza tu archivo .env con:" -ForegroundColor Yellow
    Write-Host "   GOOGLE_REDIRECT_URI=$tunnelUrl/api/google/callback" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Y en Google Cloud Console, agrega a 'Authorized redirect URIs':" -ForegroundColor Yellow
    Write-Host "   $tunnelUrl/api/google/callback" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "⚠️ No se pudo obtener la URL del túnel automáticamente." -ForegroundColor Yellow
    Write-Host "   Abre http://localhost:4040 en tu navegador para ver la URL." -ForegroundColor Yellow
}

Write-Host "🔄 Iniciando servidor backend..." -ForegroundColor Cyan
Write-Host ""

# Iniciar el servidor
npm run dev

# Al cerrar, terminar ngrok también
Write-Host ""
Write-Host "🛑 Cerrando túnel..." -ForegroundColor Yellow
Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue

