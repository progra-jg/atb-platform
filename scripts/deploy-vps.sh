#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# ATB AgriTrace — Déploiement VPS Production
# Utilisation :
#   1. Créer un VPS Ubuntu 22.04 chez OVH/DigitalOcean (min 2GB RAM)
#   2. Définir les DNS : api.agritrace.bj → IP du VPS
#   3. SSH sur le VPS et lancer :
#      curl -fsSL https://raw.githubusercontent.com/progra-jg/atb-platform/main/scripts/deploy-vps.sh | bash
#
#   Prérequis : git, docker, docker-compose
# ─────────────────────────────────────────────────────────────

DOMAIN="${DOMAIN:-api.agritrace.bj}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@agritrace.bj}"
REPO_URL="${REPO_URL:-https://github.com/progra-jg/atb-platform.git}"
BRANCH="${BRANCH:-main}"

echo "━━━ ATB AgriTrace — Déploiement VPS ━━━"
echo "  Domaine : $DOMAIN"
echo "  Email   : $ADMIN_EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── 1. Mise à jour système ──────────────────────────────────
apt update && apt upgrade -y
apt install -y docker.io docker-compose git curl ufw fail2ban certbot python3-certbot-nginx

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
NODE_ENV=production
API_PORT=4000
API_PUBLIC_URL=https://$DOMAIN
CORS_ORIGINS=https://$DOMAIN
WEBAPP_URL=https://buyer.$DOMAIN

DB_USER=atb_admin
DB_PASS=$(openssl rand -base64 32)
DB_NAME=atb_agritrace

JWT_SECRET=$(openssl rand -base64 64)

SENTINEL_CLIENT_ID=
SENTINEL_CLIENT_SECRET=
SENTINEL_MODE=mock

FEDAPAY_API_KEY=
FEDAPAY_WEBHOOK_SECRET=$(openssl rand -hex 32)
FEDAPAY_SANDBOX=false

MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_SANDBOX=false

CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SANDBOX=false

MANSA_API_KEY=
MANSA_EMAIL=api@atb.bj
EOF

  echo "✅ .env généré — ÉDITE-LE pour ajouter les clés API : nano /opt/atb-platform/.env"
fi

# ─── 5. Démarrer les services ────────────────────────────────
docker compose up -d --build

# ─── 6. Attendre que l'API soit prête ─────────────────────────
echo "⏳ Attente de l'API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ API prête !"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ API non disponible après 30 tentatives"
    docker compose logs api --tail=20
    exit 1
  fi
  sleep 2
done

# ─── 7. Certificat SSL Let's Encrypt ──────────────────────────
echo "━━━ Configuration SSL ━━━"
echo "  Assure-toi que les DNS pointent vers $(curl -s ifconfig.me)"
echo "  Sinon, configure Cloudflare ou exécute plus tard :"
echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL"

cat > /etc/nginx/sites-available/atb-proxy <<- NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:4000;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/atb-proxy /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Tentative SSL si DNS déjà en place
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL || true

echo "━━━ ✅ DÉPLOIEMENT TERMINÉ ━━━"
echo "  API   : https://$DOMAIN"
echo "  Health: https://$DOMAIN/health"
echo ""
echo "━━━ PROCHAINES ÉTAPES ━━━"
echo "  1. Éditer .env avec les clés API : nano /opt/atb-platform/.env"
echo "  2. Redémarrer : docker compose restart api"
echo "  3. Vérifier : docker compose ps"
echo "  4. SSL : sudo certbot --nginx -d $DOMAIN"
echo "  5. Seed : docker compose exec api node dist/seed.js"
echo ""
echo "━━━ CLÉS API À OBTENIR ━━━"
echo "  • FedaPay     : https://dashboard.fedapay.com"
echo "  • MTN MoMo    : https://momodeveloper.mtn.com"
echo "  • CinetPay    : https://cinetpay.com"
echo "  • Sentinel Hub: https://dataspace.copernicus.eu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
