#!/usr/bin/env bash
set -euo pipefail

REGION="${REGION:-eu-west-3}"
VALUES="${VALUES:-packages/infra/helm/atb-platform/values-prod.yaml}"
RELEASE="${RELEASE:-atb-platform}"
NAMESPACE="${NAMESPACE:-atb-prod}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_TERRAFORM="${SKIP_TERRAFORM:-false}"
DRY_RUN="${DRY_RUN:-false}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

step() { echo -e "\n=== $1 ==="; }
run() {
  echo "▶ $1"
  if [ "$DRY_RUN" = "false" ]; then
    eval "$2"
  else
    echo "  (dry-run) $2"
  fi
}

# ─── Vérifications ──────────────────────────────────────────────────
step "Vérifications"
for cmd in aws terraform docker helm kubectl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Manquant: $cmd"; exit 1; }
done
echo "✓ Tous les outils sont installés"

if [ ! -f "$ROOT/$VALUES" ]; then
  echo "ATTENTION: $VALUES introuvable" >&2
  VALUES=""
fi

# ─── 1. Terraform ──────────────────────────────────────────────────
if [ "$SKIP_TERRAFORM" = "false" ]; then
  step "1/5 — Infrastructure Terraform"
  cd "$ROOT/packages/infra"
  run "Terraform init" "terraform init -reconfigure"
  run "Terraform validate" "terraform validate"
  run "Terraform plan" "terraform plan -var-file=prod.tfvars -out=tfplan"
  if [ "$DRY_RUN" = "false" ]; then
    read -rp "Appliquer le plan Terraform ? (o/N) " confirm
    if [ "$confirm" = "o" ]; then
      run "Terraform apply" "terraform apply tfplan"
    else
      echo "⏸ Terraform annulé"
    fi
  fi
  cd "$ROOT"
else
  echo "⏩ Terraform ignoré"
fi

# ─── 2. Docker Build ───────────────────────────────────────────────
if [ "$SKIP_BUILD" = "false" ]; then
  step "2/5 — Images Docker"
  run "Build api" "docker build -t api:latest $ROOT/packages/backend/services/api"
  run "Build web-buyer" "docker build --build-arg VITE_API_URL=/api -t web-buyer:latest $ROOT/packages/web-buyer"
  echo "✓ Images construites"
else
  echo "⏩ Build ignoré"
fi

# ─── 4. Helm Deploy ─────────────────────────────────────────────────
step "4/5 — Helm Deploy"

HELM_ARGS="upgrade --install $RELEASE $ROOT/packages/infra/helm/atb-platform --namespace $NAMESPACE --create-namespace"
[ -n "$VALUES" ] && HELM_ARGS="$HELM_ARGS -f $ROOT/$VALUES"

run "Helm deploy" "helm $HELM_ARGS"
echo "✓ Helm déployé"

# ─── 5. Raw K8s Manifests ──────────────────────────────────────────
step "5/5 — Manifests K8s supplémentaires"
K8S_DIR="$ROOT/packages/infra/k8s"
if [ -d "$K8S_DIR" ]; then
  for f in "$K8S_DIR"/*.yaml; do
    [ "$(basename "$f")" = "ingress.yaml" ] && continue
    run "Apply $(basename "$f")" "kubectl apply -f $f --namespace $NAMESPACE"
  done
fi

echo -e "\n============================================"
echo "  DÉPLOIEMENT TERMINÉ"
echo "============================================"
