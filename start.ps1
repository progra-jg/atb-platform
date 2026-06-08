# Démarre l'API et le frontend en arrière-plan
Write-Host "=== Démarrage de ATB Platform ===" -ForegroundColor Green

# API (port 4000)
Write-Host "[API] Démarrage..." -NoNewline
$apiDir = "packages\backend\services\api"
if (Test-Path "$apiDir\dist\main.js") {
  $apiJob = Start-Job -ScriptBlock { Set-Location $using:apiDir; node dist/main.js }
  Write-Host " OK (PID: $($apiJob.Id))" -ForegroundColor Green
} else {
  Write-Host " dist/main.js introuvable" -ForegroundColor Yellow
  Write-Host "       Exécutez d'abord: cd $apiDir && npm run build" -ForegroundColor Yellow
}

# Web-buyer (port 5174)
Write-Host "[Frontend] Démarrage..." -NoNewline
$webDir = "packages\web-buyer"
$webJob = Start-Job -ScriptBlock { Set-Location $using:webDir; npm run dev }
Write-Host " OK (PID: $($webJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "=== Accès ===" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:5174/" -ForegroundColor White
Write-Host "  API       : http://localhost:4000/" -ForegroundColor White
Write-Host ""
Write-Host "Pour arrêter : Get-Job | Stop-Job" -ForegroundColor Gray
