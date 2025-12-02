# Script para actualizar GOOGLE_REDIRECT_URI con la URL de Cloudflare Tunnel
# Uso: .\update-cloudflare-url.ps1 -Url "https://xxxx-xxxx-xxxx.trycloudflare.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$Url
)

$envFilePath = Join-Path (Get-Location) ".env"

if (-not (Test-Path $envFilePath)) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

$newRedirectUri = "$Url/api/google/callback"
Write-Host "🔄 Actualizando GOOGLE_REDIRECT_URI..." -ForegroundColor Yellow
Write-Host "   Nueva URL: $newRedirectUri" -ForegroundColor Cyan

$envContent = Get-Content $envFilePath
$updated = $false
$newContent = $envContent | ForEach-Object {
    if ($_ -like "GOOGLE_REDIRECT_URI=*") {
        $updated = $true
        "GOOGLE_REDIRECT_URI=$newRedirectUri"
    } else {
        $_
    }
}

# Si no existía, agregarlo
if (-not $updated) {
    $newContent += "GOOGLE_REDIRECT_URI=$newRedirectUri"
}

Set-Content -Path $envFilePath -Value $newContent
Write-Host "✅ .env actualizado correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Reinicia el servidor backend para que cargue la nueva URL" -ForegroundColor Yellow
Write-Host "   Ejecuta: npm run dev" -ForegroundColor Cyan

