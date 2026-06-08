# Obtention des Clés API — Production

## FedaPay (Cartes bancaires)
- **Dashboard** : https://dashboard.fedapay.com
- **Inscription** : Créer un compte, activer le mode live
- **Clés à récupérer** :
  - `FEDAPAY_API_KEY` → Settings → API Keys → Live Secret Key (`fd_live_xxx`)
  - `FEDAPAY_WEBHOOK_SECRET` → Webhooks → Créer un endpoint `https://api.agritrace.bj/api/payment/webhook/fedapay` → copier le signing secret
- **Webhook** : Configurer l'URL `https://api.agritrace.bj/api/payment/webhook/fedapay` avec les événements `transaction.approved`, `transaction.declined`, `transaction.cancelled`
- **Limites** : Variable selon le contrat (contacter support@fedapay.com pour les volumes)

## MTN MoMo (Mobile Money)
- **Dashboard** : https://momodeveloper.mtn.com
- **Inscription** : Créer un compte développeur, s'abonner à "Collection" (API pour recevoir des paiements)
- **Clés à récupérer** :
  - `MTN_MOMO_API_USER` → Abonnement → UUID de l'utilisateur API
  - `MTN_MOMO_API_KEY` → Abonnement → Clé API
  - `MTN_MOMO_SUBSCRIPTION_KEY` → Abonnement → Clé d'abonnement (Ocp-Apim-Subscription-Key)
- **Provider Callback** : Configurer l'URL de notification dans le portail MTN
- **Limites** : Sandbox : 50 requêtes/jour. Production : selon contrat avec MTN

## CinetPay (Mobile Money + Cartes)
- **Dashboard** : https://cinetpay.com
- **Inscription** : Créer un compte, ajouter un site
- **Clés à récupérer** :
  - `CINETPAY_API_KEY` → Paramètres → Site → API Key
  - `CINETPAY_SITE_ID` → Paramètres → Site → Site ID
- **Webhook** : Configurer l'URL de notification dans les paramètres du site vers `https://api.agritrace.bj/api/payment/webhook/cinetpay`
- **Limites** : 1.8% par transaction (moyenne), paiement à l'utilisation

## Mansa API (Données de marché africain)
- **Dashboard** : https://mansaapi.com
- **Inscription** : Créer un compte gratuit (100 req/jour, sans CB)
- **Clés à récupérer** :
  - `MANSA_API_KEY` → Dashboard → API Keys → Copier la clé
- **Alternative** : Si la clé est laissée vide, le service tente une auto-génération au démarrage via l'email configuré
- **Cache** : Résultats mis en cache 1h (pas d'impact sur le quota)

## Sentinel Hub / Copernicus (Imagerie satellite)
- **Dashboard** : https://dataspace.copernicus.eu
- **Inscription** : Créer un compte OAuth
- **Clés à récupérer** :
  - `SENTINEL_CLIENT_ID` → Dashboard → OAuth Client
  - `SENTINEL_CLIENT_SECRET` → Dashboard → OAuth Client
- **Note** : En dev, utiliser `SENTINEL_MODE=mock` pour éviter les appels API
