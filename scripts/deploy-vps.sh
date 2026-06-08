#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# ATB AgriTrace — Déploiement VPS Production
# Utilisation :
#   1. Créer un VPS Ubuntu 22.04 chez OVH/DigitalOcean
#   2. Définir les DNS : api.agritrace.bj → IP du VPS
#   3. Lancer ce script SUR le VPS
#
#   Prérequis : git, docker, docker-compose
# ─────────────────────────────────────────────────────────────

DOMAIN="${DOMAIN:-api.agritrace.bj}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@agritrace.bj}"
REPO_URL="${REPO_URL:-https://github.com/ton-compte/atb-platform.git}"
BRANCH="${BRANCH:-main}"

echo "━━━ ATB AgriTrace — Déploiement VPS ━━━"
echo "  Domaine : $DOMAIN"
echo "  Email   : $ADMIN_EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── 1. Mise à jour système ──────────────────────────────────
apt update && apt upgrade -y
apt install -y docker.io docker-compose git curl ufw fail2ban

# ─── 2. Firewall ─────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 3. Cloner le projet ─────────────────────────────────────
cd /opt
if [ -d atb-platform ]; then
  cd atb-platform && git pull origin $BRANCH
else
  git clone $REPO_URL -b $BRANCH
  cd atb-platform
fi

# ─── 4. Fichier .env de production ───────────────────────────
if [ ! -f .env ]; then
  cat > .env <<- EOF
# ─── ATB AgriTrace — Production ──────────────────────────
NODE_ENV=production
API_PORT=4000
API_PUBLIC_URL=https://$DOMAIN
CORS_ORIGINS=https://$DOMAIN
WEBAPP_URL=https://buyer.agritrace.bj

# ─── PostgreSQL ──────────────────────────────────────────
POSTGRES_USER=atb_admin
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=atb_agritrace

# ─── API Database ────────────────────────────────────────
DB_HOST=postgres
DB_PORT=5432
DB_USER=atb_admin
DB_PASS=\${POSTGRES_PASSWORD}
DB_NAME=atb_agritrace

# ─── JWT ─────────────────────────────────────────────────
JWT_SECRET=$(openssl rand -base64 64)

# ─── Satellite (Sentinel Hub) ────────────────────────────
SENTINEL_MODE=live
SENTINEL_CLIENT_ID=
SENTINEL_CLIENT_SECRET=

# ─── FedaPay ─────────────────────────────────────────────
FEDAPAY_API_KEY=
FEDAPAY_WEBHOOK_SECRET=$(openssl rand -hex 32)
FEDAPAY_SANDBOX=false

# ─── MTN MoMo ────────────────────────────────────────────
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_SANDBOX=false

# ─── CinetPay ────────────────────────────────────────────
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SANDBOX=false

# ─── Mansa API ──────────────────────────────────────────
MANSA_API_KEY=
MANSA_EMAIL=api@atb.bj
EOF

  echo "✅ .env généré — ÉDITE-LE pour ajouter les clés API (FedaPay, MTN MoMo, CinetPay, Sentinel)"
  echo "   nano /opt/atb-platform/.env"
fi

# ─── 5. Démarrer les services ────────────────────────────────
docker compose up -d --build

echo "━━━ ✅ DÉPLOIEMENT TERMINÉ ━━━"
echo "  API   : https://$DOMAIN"
echo "  Health: https://$DOMAIN/health"
echo ""
echo "━━━ PROCHAINES ÉTAPES ━━━"
echo "  1. Éditer .env avec les clés API : nano /opt/atb-platform/.env"
echo "  2. Redémarrer : docker compose restart api"
echo "  3. Vérifier : docker compose ps"
echo "  4. Configurer Cloudflare (SSL Full) pointant vers $(curl -s ifconfig.me)"
echo "  5. Lancer : docker compose exec api node dist/seed.js (si première fois)"
echo ""
echo "━━━ CLÉS API À OBTENIR ━━━"
echo "  • FedaPay     : https://dashboard.fedapay.com"
echo "  • MTN MoMo    : https://momodeveloper.mtn.com"
echo "  • CinetPay    : https://cinetpay.com"
echo "  • Sentinel Hub: https://dataspace.copernicus.eu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
