# ATB AgriTrace — Capture d'écran pour le Play Store

## Format requis
- 2 types : téléphone (portrait) et tablette (landscape)
- Min 8 screenshots, max 10
- Résolution téléphone : 1080 × 1920px ou 1440 × 2560px
- Résolution tablette : 2024 × 1440px ou 2560 × 1600px
- Format PNG (pas de JPEG)
- Pas de barre de statut Android — capturer en fullscreen
- Texte en français pour la version française

## Screenshots recommandés (8)

### 1. Tableau de bord (DashboardScreen)
```
Contexte : Vue d'ensemble des lots, commandes et scores
À capturer : écran d'accueil avec le profil utilisateur + scores
Texte FR : "Votre tableau de bord en un coup d'œil"
Texte EN : "Your dashboard at a glance"
```

### 2. Marché / Prix (MarketScreen)
```
Contexte : Listing des produits avec prix spot et corridor
À capturer : la liste des produits avec les prix
Texte FR : "Prix du marché en temps réel"
Texte EN : "Real-time market prices"
```

### 3. Transaction sécurisée (EscrowScreen)
```
Contexte : Création d'un dépôt séquestre
À capturer : le formulaire de dépôt avec le récapitulatif
Texte FR : "Transactions sécurisées et tracées"
Texte EN : "Secure & traceable transactions"
```

### 4. Lots (LotsScreen)
```
Contexte : Liste des lots de production
À capturer : la flatlist des lots avec statuts
Texte FR : "Gérez vos lots de production"
Texte EN : "Manage your production lots"
```

### 5. Talkie / Communication vocale (TalkieScreen)
```
Contexte : Messagerie vocale terrain
À capturer : l'interface d'enregistrement/lecture audio
Texte FR : "Communication vocale instantanée"
Texte EN : "Instant voice messaging"
```

### 6. Financement (FinancingScreen)
```
Contexte : Offres de financement disponibles
À capturer : la liste des offres avec montants
Texte FR : "Financement basé sur votre réputation"
Texte EN : "Financing based on your reputation"
```

### 7. Certificats (CertificatesScreen)
```
Contexte : Suivi des certifications (GlobalGAP, Bio, EUDR)
À capturer : la liste des certificats avec statuts
Texte FR : "Certifications et conformité"
Texte EN : "Certifications & compliance"
```

### 8. KYC (KycScreen) [ou Confiance/TrustScreen]
```
Contexte : Vérification d'identité / score de confiance
À capturer : l'écran KYC ou l'écran de confiance
Texte FR : "Identité numérique vérifiée"
Texte EN : "Verified digital identity"
```

## Fonctionnalités bonus à montrer si possible
- 🔄 Scanner QR code (ScanScreen)
- 🌤 Météo agricole (AlertMeteoScreen)
- 📊 Spread corridor (MarketScreen — detail panel)
- 🤝 Parrainage (ParrainageScreen)

## Comment capturer
1. Lancer l'app en mode développement : `npm start`
2. Activer le mode fullscreen dans les options développeur Android
3. Utiliser `adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png`
4. Ou utiliser l'émulateur Android Studio (Capture button)

## Retouche minimale (optionnel mais recommandé)
- Ajouter le texte FR/EN en bas du screenshot (pas sur l'interface)
- Garder le fond vert émeraude (#059669) si pas de capture possible → créer une mockup
