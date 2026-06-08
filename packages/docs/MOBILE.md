# Guide Mobile

## Farmer App (Android)

### Build
```bash
cd packages/mobile/farmer-app
./gradlew assembleDebug
```

### Architecture
- **MVVM** avec Jetpack Compose
- **Room** pour le stockage offline
- **WorkManager** pour la sync automatique (30 min)
- **CameraX** + **ML Kit** pour le scan QR
- **Hilt** pour l'injection de dépendances

### Offline First
1. Données sauvegardées localement (Room)
2. Sync background (WorkManager)
3. Conflits résolus par timestamp

### Traductions
- Français (fr)
- Fon (fon)
- Anglais (en)

## USSD Gateway

### Build
```bash
cd packages/mobile/ussd
go build -o ussd-gateway
./ussd-gateway
```

### Flows
- `*123#` → Menu principal
- `*123*1#` → Enregistrement
- `*123*2#` → Déclaration récolte
- `*123*3#` → Solde prime
