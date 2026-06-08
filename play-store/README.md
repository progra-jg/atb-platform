# ATB AgriTrace — Checklist de soumission Play Store

## Avant le build
- [ ] `app.json` : version incrémentée si mise à jour (versionCode +1)
- [ ] `app.json` : `extra.apiUrl` pointe bien vers `https://api.agritrace.bj/api`
- [ ] Assets icon/adaptive-icon/splash générés (`scripts/generate-assets.sh`)
- [ ] Icônes remplacées par des vraies (pas les placeholders "ATB")

## Build EAS
```bash
npm install -g eas-cli
eas login
cd packages/mobile
npm run build:prod
```
→ URL de téléchargement du `.aab` fournie par Expo

## Play Console — Fiche listing

### Informations
- **Titre** : ATB AgriTrace
- **Description courte** (80 car.) : Suivez vos lots, négociez les prix et sécurisez vos paiements
- **Description longue** : voir `play-store/descriptions.txt`
- **Catégorie** : Finance
- **Pays** : BJ, BF, CI, SN, ML, NE, TG, CM (Ajouter progressivement)

### Graphismes
- [ ] Icône 512×512 (remplacer `assets/icon.png` par une vraie)
- [ ] Feature graphic 1024×500 (bannière Play Store)
- [ ] 8 screenshots téléphone (1080×1920) → guide dans `play-store/screenshots-guide.md`
- [ ] 3 screenshots tablette (2024×1440) — optionnel mais recommandé

### Data Safety → voir `play-store/data-safety.md`
- [ ] Email, nom, téléphone, transactions financières
- [ ] Audio, photos (KYC), logs
- [ ] Aucune donnée partagée avec des tiers

### Content Rating
- [ ] Questionnaire Google → "Tout public" (pas de contenu sensible)

## Après soumission

### Tests
- [ ] Compte test pour l'équipe de validation Google (email + mot de passe)
- [ ] Serveur de staging accessible depuis l'extérieur (pas de localhost)

### Production
- [ ] Clés API réelles FedaPay / MTN MoMo / CinetPay → dans `.env` du VPS
- [ ] Sentinel Hub en mode `live` (plus `mock`)
- [ ] Monitoring et alerting (healthcheck API)

## Fichiers dans ce dossier

| Fichier | Rôle |
|---------|------|
| `store-listing.json` | Infos générales (catégorie, pays, prix) |
| `descriptions.txt` | Description courte + longue (FR/EN) |
| `screenshots-guide.md` | Quels écrans capturer et comment |
| `data-safety.md` | Déclaration des données (Data Safety) |
| `privacy-policy.html` | Politique de confidentialité (FR/EN) |
