# Rapport de Test d'Intrusion — ATB AgriTrace

## Résumé
Test d'intrusion manuel effectué le 2024-03-20.

## Tests effectués

### 1. Injection SQL
- **Endpoint testé**: `/parcelles?id=1 OR 1=1`
- **Résultat**: Requête paramétrée via TypeORM — PROTÉGÉ
- **Recommandation**: Utiliser des requêtes paramétrées partout

### 2. JWT Reuse
- **Test**: Réutilisation d'un token expiré
- **Résultat**: JWT avec `exp` vérifié — PROTÉGÉ
- **Recommandation**: Ajouter refresh token rotation

### 3. Access Control
- **Test**: Accès aux endpoints sans token
- **Résultat**: 401 Unauthorized — PROTÉGÉ
- **Recommandation**: Vérifier les rôles sur chaque endpoint sensible

### 4. XSS
- **Test**: Injection `<script>` dans les champs nom
- **Résultat**: Encodage HTML via React — PROTÉGÉ

### 5. Rate Limiting
- **Test**: 1000 requêtes/min sur `/auth/login`
- **Résultat**: Kong rate-limiting bloque à 60/min — PROTÉGÉ

## Score
| Catégorie | Score |
|-----------|-------|
| Injection | 5/5 |
| Auth | 4/5 |
| Access Control | 4/5 |
| XSS | 5/5 |
| Rate Limiting | 5/5 |

**Score global**: 23/25 (92%)
