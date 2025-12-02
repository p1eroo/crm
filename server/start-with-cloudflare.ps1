# Script para iniciar el backend con Cloudflare Tunnel
# Asegúrate de estar en el directorio 'server'

Write-Host "🛑 Deteniendo procesos anteriores..." -ForegroundColor Yellow

# Detener cualquier proceso de túnel existente
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*localtunnel*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 Iniciando Cloudflare Tunnel..." -ForegroundColor Cyan

# Iniciar cloudflared en una nueva ventana
# Cloudflare asignará una URL aleatoria tipo: https://xxxx-xxxx-xxxx.trycloudflare.com
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PWD'
Write-Host '🌐 Cloudflare Tunnel iniciado' -ForegroundColor Cyan
Write-Host 'Esperando asignación de URL...' -ForegroundColor Yellow
Write-Host ''
cloudflared tunnel --url http://localhost:5000
"@ -WindowStyle Normal

Write-Host "⏳ Esperando que Cloudflare asigne la URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Intentar obtener la URL del túnel
# Nota: Cloudflare muestra la URL en la consola, pero no hay API fácil para obtenerla
# El usuario necesitará copiarla manualmente de la ventana

Write-Host ""
Write-Host "✅ Cloudflare Tunnel iniciado" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. Revisa la ventana de PowerShell del túnel" -ForegroundColor White
Write-Host "2. Busca una línea que diga: 'https://xxxx-xxxx-xxxx.trycloudflare.com'" -ForegroundColor White
Write-Host "3. Copia esa URL completa" -ForegroundColor White
Write-Host "4. Ejecuta este comando reemplazando TU_URL:" -ForegroundColor White
Write-Host "   `$url = 'TU_URL'; `$envContent = Get-Content .env; `$newContent = `$envContent | ForEach-Object { if (`$_ -like 'GOOGLE_REDIRECT_URI=*') { `"GOOGLE_REDIRECT_URI=`$url/api/google/callback`" } else { `$_ } }; Set-Content -Path .env -Value `$newContent" -ForegroundColor Cyan
Write-Host ""
Write-Host "O simplemente edita el archivo .env y actualiza GOOGLE_REDIRECT_URI" -ForegroundColor White
Write-Host ""

