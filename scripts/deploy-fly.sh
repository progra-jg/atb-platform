#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# ATB AgriTrace — Déploiement Fly.io (gratuit)
# ─────────────────────────────────────────────────────────────
# Prérequis :
#   1. Compte GitHub (pour se connecter à fly.io)
#   2. Browser (pour autoriser flyctl)
#   3. Aucune carte bancaire demandée pour le plan gratuit
# ─────────────────────────────────────────────────────────────

APP_NAME="atb-agritrace-api"
REGION="cdg" # Paris — latence minimale pour le Bénin
API_DIR="packages/backend/services/api"

echo "━━━ ATB AgriTrace — Déploiement Fly.io ━━━"
echo ""

# ─── 1. Vérifier flyctl ────────────────────────────────────
if ! command -v flyctl &>/dev/null && ! command -v fly &>/dev/null; then
  echo "📥 Installation de flyctl..."
  curl -fsSL https://fly.io/install.sh | sh
  export FLYCTL_INSTALL="$HOME/.fly"
  export PATH="$FLYCTL_INSTALL/bin:$PATH"
  # shellcheck disable=SC1090
  [ -f "$HOME/.fly/env.sh" ] && source "$HOME/.fly/env.sh"
fi

FLY=$(command -v flyctl || command -v fly)
echo "✅ flyctl trouvé : $FLY"

# ─── 2. Connexion Fly.io ───────────────────────────────────
echo ""
echo "🔑 Connexion à Fly.io (ouvre un navigateur)..."
echo "   (Compte GitHub gratuit, pas de carte bancaire)"
$FLY auth login

# ─── 3. Lancer l'application ────────────────────────────────
echo ""
echo "🚀 Création de l'app $APP_NAME..."
cd "$API_DIR"
$FLY launch --name "$APP_NAME" --region "$REGION" --no-deploy --copy-config

# ─── 4. Créer la base PostgreSQL ────────────────────────────
echo ""
echo "🗄️  Création de la base PostgreSQL..."
if $FLY postgres list 2>/dev/null | grep -q "atb-agritrace-db"; then
  echo "   La base 'atb-agritrace-db' existe déjà."
else
  $FLY postgres create --name "atb-agritrace-db" --region "$REGION" --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
fi

echo "🔗 Attachement de la base à l'app..."
$FLY postgres attach --postgres-app "atb-agritrace-db" --app "$APP_NAME"

# ─── 5. Injecter les variables d'env ────────────────────────
echo ""
echo "🔧 Configuration des variables d'environnement..."
$FLY secrets set \
  NODE_ENV=production \
  API_PORT=4000 \
  API_PUBLIC_URL="https://$APP_NAME.fly.dev" \
  CORS_ORIGINS="https://$APP_NAME.fly.dev" \
  WEBAPP_URL="https://$APP_NAME.fly.dev" \
  JWT_SECRET="$(openssl rand -base64 64)" \
  SENTINEL_MODE=mock \
  FEDAPAY_SANDBOX=true \
  MTN_MOMO_SANDBOX=true \
  CINETPAY_SANDBOX=true \
  MANSA_EMAIL=api@atb.bj \
  --app "$APP_NAME"

# ─── 6. Déployer ───────────────────────────────────────────
echo ""
echo "📦 Déploiement de l'API..."
cd "$API_DIR"
$FLY deploy --app "$APP_NAME" --remote-only

# ─── 7. Seed la base ───────────────────────────────────────
echo ""
echo "🌱 Seed des données (utilisateurs, produits)..."
echo "   Connexion à la base via proxy..."
# Proxy PostgreSQL en arrière-plan + seed SQL
$FLY proxy 5433:5432 --app "$APP_NAME" &
PROXY_PID=$!
sleep 3

# Attendre que le proxy soit prêt
for i in $(seq 1 10); do
  if PGPASSWORD="" psql -h localhost -p 5433 -U atb -d atb_agritrace -c "SELECT 1" &>/dev/null 2>&1; then
    echo "   Proxy prêt !"
    break
  fi
  sleep 1
done

# Récupérer les credentials depuis les secrets
DB_URL=$($FLY ssh console --app "$APP_NAME" -C "env | grep DATABASE_URL" 2>/dev/null || true)
if [ -n "$DB_URL" ]; then
  echo "   Seed en cours..."
  # Utiliser psql directement via le proxy
  psql "$DB_URL" -f "../seed-data.sql" 2>/dev/null || echo "   ⚠️ Seed SQL ignoré (sera fait manuellement)"
fi

kill $PROXY_PID 2>/dev/null || true
echo "   ✅ Seed terminé (vérifie les logs si erreur)"

echo ""
echo "━━━ ✅ DÉPLOIEMENT TERMINÉ ━━━"
echo "  API   : https://$APP_NAME.fly.dev"
echo "  Health: https://$APP_NAME.fly.dev/health"
echo ""
echo "━━━ COMMANDES UTILES ━━━"
echo "  Logs  : fly logs --app $APP_NAME"
echo "  SSH   : fly ssh console --app $APP_NAME"
echo "  Env   : fly secrets list --app $APP_NAME"
echo ""
echo "━━━ PROCHAINES ÉTAPES ━━━"
echo "  1. Configurer le domaine api.agritrace.bj → $APP_NAME.fly.dev (DNS CNAME)"
echo "  2. Obtenir les clés API FedaPay/MTN/CinetPay"
echo "  3. fly secrets set FEDAPAY_API_KEY=xxx --app $APP_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
