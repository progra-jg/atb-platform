# Architecture ATB AgriTrace Bénin

## Diagramme C4 — Niveau 1 (Contexte)

```
[Producteur] ──→ [App Mobile / USSD]
     │
[Acheteur]  ──→ [Portail Web Buyer]
     │
[Admin]     ──→ [Dashboard Admin]
     │
[Satellite] ──→ [Pipeline IA]
     │
[IoT]       ──→ [MQTT Bridge]
     │
     └────────→ [API Gateway (Kong)]
                      │
              ┌───────┼────────┐
              │       │        │
         [Auth]  [Traçabilité]  [Certification]
              │       │        │
         [PostGIS]  [Blockchain]  [MinIO]
```

## Stack Technique

| Composant | Technologie |
|-----------|------------|
| API Gateway | Kong 3.5 |
| Auth & Profils | NestJS + TypeORM |
| Traçabilité | Go + Gin |
| Parcelles | NestJS + PostGIS |
| Blockchain | Hyperledger Besu |
| Smart Contracts | Solidity 0.8.20 |
| Mobile | Android Kotlin + Jetpack Compose |
| Web Buyer | React + TypeScript |
| Admin | React + Material UI |
| Satellite AI | Python + TensorFlow |
| IoT Bridge | Python + MQTT + Arduino |
| Certification | Python + XML/PDF |
| Base de données | PostgreSQL + PostGIS |
| Cache | Redis |
| Stockage | MinIO / S3 |
| Message Queue | RabbitMQ / Kafka |
| CI/CD | GitLab CI |
| Infrastructure | Terraform + AWS EKS |
