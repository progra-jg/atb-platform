if ($PSScriptRoot) { $root = Split-Path -Parent $PSScriptRoot } else { $root = Get-Location }
$authDir = "$root\packages\backend\services\auth"
$apiDir = "$root\packages\backend\services\api"
$adminDir = "$root\packages\web-admin"

# Build NestJS if needed
if (-not (Test-Path "$authDir\dist\main.js")) {
  Write-Host "Construction du serveur Auth..." -ForegroundColor Yellow
  Push-Location $authDir; npm install --silent | Out-Null; npx nest build; Pop-Location
}
if (-not (Test-Path "$apiDir\dist\main.js")) {
  Write-Host "Construction du serveur API..." -ForegroundColor Yellow
  Push-Location $apiDir; npm install --silent | Out-Null; npx nest build; Pop-Location
}
if (-not (Test-Path "$adminDir\node_modules\.package-lock.json")) {
  Write-Host "Installation des dépendances Web-admin..." -ForegroundColor Yellow
  Push-Location $adminDir; npm install --silent | Out-Null; Pop-Location
}

Write-Host "Démarrage des services backend..." -ForegroundColor Green

$authJob = Start-Job -ScriptBlock { Set-Location $args[0]; node dist/main.js 2>&1 } -ArgumentList $authDir
$apiJob = Start-Job -ScriptBlock { Set-Location $args[0]; node dist/main.js 2>&1 } -ArgumentList $apiDir

Start-Sleep -Seconds 5

$failed = @()
if ($authJob.State -ne "Running") { $failed += "Auth" }
if ($apiJob.State -ne "Running") { $failed += "API" }

if ($failed.Count -gt 0) {
  Write-Host "ERREUR: Services non démarrés: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}

Write-Host "Démarrage du Web-admin (Vite)..." -ForegroundColor Green
$adminJob = Start-Job -ScriptBlock { Set-Location $args[0]; npm run dev 2>&1 } -ArgumentList $adminDir

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Auth (NestJS)    : http://localhost:3002" -ForegroundColor Cyan
Write-Host "  API  (NestJS)    : http://localhost:4000" -ForegroundColor Cyan
Write-Host "  Web-admin (Vite) : http://localhost:5173/login" -ForegroundColor Cyan
Write-Host "  Identifiants     : superadmin / admin123" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
  while ($authJob.State -eq "Running" -or $apiJob.State -eq "Running" -or $adminJob.State -eq "Running") {
    foreach ($pair in @(@{Name="Auth";Job=$authJob}, @{Name="API";Job=$apiJob}, @{Name="Admin";Job=$adminJob})) {
      $result = Receive-Job $pair.Job.Id -ErrorAction SilentlyContinue
      if ($result) { Write-Host "[$($pair.Name)] $result" }
    }
    Start-Sleep -Seconds 3
  }
} finally {
  Write-Host "Arrêt des services..." -ForegroundColor Yellow
  Stop-Job $authJob.Id -ErrorAction SilentlyContinue
  Stop-Job $apiJob.Id -ErrorAction SilentlyContinue
  Stop-Job $adminJob.Id -ErrorAction SilentlyContinue
  Remove-Job $authJob.Id -ErrorAction SilentlyContinue
  Remove-Job $apiJob.Id -ErrorAction SilentlyContinue
  Remove-Job $adminJob.Id -ErrorAction SilentlyContinue
}
