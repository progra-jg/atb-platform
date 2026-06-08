# Arrête tous les processus Node liés à ATB
Write-Host "Arrêt des services ATB..." -ForegroundColor Yellow
Get-Job | Stop-Job
Get-Job | Remove-Job
# Tue les processus node qui écoutent sur les ports ATB
Get-NetTCPConnection -LocalPort 4000,5173,5174 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Write-Host "OK" -ForegroundColor Green
