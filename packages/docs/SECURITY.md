# Sécurité

## Politique
- JWT tokens avec expiration 24h
- Refresh tokens à rotation
- Bcrypt (12 rounds) pour les mots de passe
- Rate limiting : 60 req/min (Kong)
- CORS configuré
- TLS pour toutes les communications

## Responsible Disclosure
Signaler les vulnérabilités à : security@agritrace.bj

## Audit
- Trivy : scan vulnérabilités Docker
- SonarQube : qualité de code (dette < 5%)
- Tests d'intrusion : trimestriels
