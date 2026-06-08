# ATB Agri-Trace Bénin

Plateforme de traçabilité agricole blockchain pour le Bénin.

## Architecture

```
atb-platform/
├── packages/
│   ├── backend/          # API (NestJS + Go + Python)
│   ├── blockchain/       # Smart contracts Solidity + Hyperledger Besu
│   ├── mobile/           # Android Kotlin + USSD Gateway
│   ├── web-buyer/        # React Buyer Portal
│   ├── web-admin/        # React Admin Dashboard
│   ├── satellite-ai/     # Python/TensorFlow
│   ├── iot-bridge/       # Python MQTT
│   ├── docs/             # Documentation
│   └── infra/            # Terraform + K8s
├── docker-compose.yml
├── Makefile
├── .gitlab-ci.yml
└── README.md
```

## Quick Start

```bash
make dev
```

## Modules

| Module | Stack | Description |
|--------|-------|-------------|
| Auth | NestJS | JWT, OAuth2, profils |
| Parcelle | NestJS + PostGIS | Gestion parcellaire |
| Traçabilité | Go + Gin | Lots, transferts, QR |
| Blockchain | Solidity + Besu | LotNFT, certificats |
| Mobile | Kotlin | App producteur + offline |
| Web Buyer | React | Portail acheteur |
| Web Admin | React/ MUI | Dashboard admin |
| Satellite AI | Python/TF | Déforestation, rendement |
| IoT Bridge | Python/MQTT | Balances, drones |
| Certification | Python | EUDR, GlobalGAP |
| Marketplace | NestJS | Intrants agricoles |
| Carbone | Python + Solidity | Crédits carbone |
