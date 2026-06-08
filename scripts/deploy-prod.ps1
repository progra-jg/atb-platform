param(
  [string]$Region = "eu-west-3",
  [string]$ValuesFile = "..\packages\infra\helm\atb-platform\values-prod.yaml",
  [string]$HelmRelease = "atb-platform",
  [string]$Namespace = "atb-prod",
  [switch]$SkipBuild,
  [switch]$SkipTerraform,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { Get-Location }

function Step($title) {
  Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

function Run($desc, $cmd) {
  Write-Host "▶ $desc" -ForegroundColor Yellow
  if (-not $DryRun) {
    Invoke-Expression $cmd
    if (-not $?) { throw "Échec: $desc" }
  } else {
    Write-Host "  (dry-run) $cmd" -ForegroundColor Gray
  }
}

# ─── Vérifications ──────────────────────────────────────────────────
Step "Vérifications"

$tools = @{aws="AWS CLI"; terraform="Terraform"; docker="Docker"; helm="Helm"; kubectl="kubectl"}
$missing = @()
foreach ($t in $tools.Keys) {
  if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { $missing += $tools[$t] }
}
if ($missing.Count -gt 0) {
  Write-Host "OUTILS MANQUANTS : $($missing -join ', ')" -ForegroundColor Red
  exit 1
}
Write-Host "✓ Tous les outils sont installés" -ForegroundColor Green

if (-not (Test-Path $ValuesFile)) {
  Write-Host "ATTENTION: $ValuesFile introuvable. Déploiement avec values.yaml uniquement." -ForegroundColor Yellow
  $ValuesFile = ""
}

# ─── 1. Terraform Infrastructure ────────────────────────────────────
if (-not $SkipTerraform) {
  Step "1/5 — Infrastructure Terraform"
  Push-Location "$root\packages\infra"
  try {
    Run "Terraform init" "terraform init -reconfigure 2>&1"
    Run "Terraform validate" "terraform validate 2>&1"
    Run "Terraform plan" "terraform plan -var-file=prod.tfvars -out=tfplan 2>&1"
    if (-not $DryRun) {
      $confirm = Read-Host "Appliquer le plan Terraform ? (o/N)"
      if ($confirm -eq "o") {
        Run "Terraform apply" "terraform apply tfplan 2>&1"
        Write-Host "✓ Infrastructure déployée" -ForegroundColor Green
      } else {
        Write-Host "⏸ Terraform apply annulé" -ForegroundColor Yellow
      }
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "⏩ Terraform ignoré (--SkipTerraform)" -ForegroundColor Gray
}

# ─── 2. Docker Images ───────────────────────────────────────────────
if (-not $SkipBuild) {
  Step "2/5 — Images Docker"
  $images = @(
    @{dir="packages\backend\services\api"; tag="api:latest"; buildArgs=""},
    @{dir="packages\web-buyer"; tag="web-buyer:latest"; buildArgs="--build-arg VITE_API_URL=/api"}
  )
  foreach ($img in $images) {
    $path = "$root\$($img.dir)"
    if (Test-Path "$path\Dockerfile") {
      Run "Build $($img.tag)" "docker build -t $($img.tag) $($img.buildArgs) `"$path`" 2>&1"
    } else {
      Write-Host "  ⏩ $($img.dir) — pas de Dockerfile" -ForegroundColor Gray
    }
  }
  Write-Host "✓ Images construites" -ForegroundColor Green
} else {
  Write-Host "⏩ Build ignoré (--SkipBuild)" -ForegroundColor Gray
}

# ─── 3. Push Images (optionnel) ────────────────────────────────────
$registry = if (Test-Path $ValuesFile) {
  $content = Get-Content $ValuesFile -Raw
  if ($content -match 'imageRegistry: (.+)') { $matches[1] }
} else { $null }

if ($registry) {
  Step "3/5 — Push Images vers $registry"
  Run "Push api" "docker tag api:latest $registry/api:latest && docker push $registry/api:latest 2>&1"
  Run "Push web-buyer" "docker tag web-buyer:latest $registry/web-buyer:latest && docker push $registry/web-buyer:latest 2>&1"
  Write-Host "✓ Images poussées" -ForegroundColor Green
} else {
  Write-Host "⏩ Push ignoré (pas de registry configurée)" -ForegroundColor Gray
}

# ─── 4. Helm Deploy ─────────────────────────────────────────────────
Step "4/5 — Helm Deploy"

$helmArgs = @(
  "upgrade --install $HelmRelease",
  "$root\packages\infra\helm\atb-platform",
  "--namespace $Namespace",
  "--create-namespace"
)

if ($ValuesFile) {
  $helmArgs += "-f `"$ValuesFile`""
}

$helmCmd = "helm $($helmArgs -join ' ') 2>&1"
Run "Helm deploy" $helmCmd

Write-Host "✓ Helm déployé" -ForegroundColor Green

# ─── 5. Raw K8s Manifests ──────────────────────────────────────────
Step "5/5 — Manifests K8s supplémentaires"

$k8sDir = "$root\packages\infra\k8s"
if (Test-Path $k8sDir) {
  $files = Get-ChildItem "$k8sDir\*.yaml" | Where-Object { $_.Name -ne "ingress.yaml" }
  foreach ($f in $files) {
    Run "Apply $($f.Name)" "kubectl apply -f `"$($f.FullName)`" --namespace $Namespace 2>&1"
  }
  Write-Host "✓ Manifests K8s appliqués" -ForegroundColor Green
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  DÉPLOIEMENT TERMINÉ" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
