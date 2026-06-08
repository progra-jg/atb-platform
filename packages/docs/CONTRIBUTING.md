# Contribuer à ATB AgriTrace

## Convention de code
- **TypeScript/NestJS**: ESLint + Prettier
- **Go**: `golangci-lint`
- **Python**: `ruff check`
- **Solidity**: `solhint`
- **Kotlin**: ktlint

## Git Flow
- `main` → Production
- `develop` → Intégration
- `feature/*` → Nouvelles fonctionnalités
- `fix/*` → Corrections

## PR Review
- Minimum 1 approve
- Tests passent
- Lint pass

## Commits
Convention `type(scope): message`
- `feat(auth): add OAuth2`
- `fix(parcelle): validate polygon`
- `docs(api): update endpoints`
