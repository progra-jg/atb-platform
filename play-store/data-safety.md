# ATB AgriTrace — Data Safety (Play Console)

## Données collectées

| Catégorie | Donnée | Collectée | Partagée | Obligatoire | Usage |
|-----------|--------|-----------|----------|-------------|-------|
| Identité | Email | Oui | Non | Oui | Compte utilisateur, connexion |
| Identité | Nom / entreprise | Oui | Oui (visible aux partenaires) | Oui | Profil public, réputation |
| Contacts | Téléphone | Oui | Non | Oui | Paiement Mobile Money, notifications |
| Financière | Transactions | Oui | Non | Oui | Séquestre, historique paiements |
| Financière | Score de crédit | Oui (calculé) | Oui (visible aux partenaires) | Oui | Évaluation de confiance |
| Localisation | GPS lots | Oui | Oui | Non | Traçabilité parcelles |
| Photos/Vidéo | Documents KYC | Oui | Non | Non (selon niveau) | Vérification identité |
| Audio | Messages vocaux | Oui | Oui (destinataire) | Non | Talkie communication |
| Journal | Logs d'audit | Oui | Non | Oui | Traçabilité conformité |

## Données NON collectées
- ❌ Position précise en arrière-plan
- ❌ Contacts de l'appareil
- ❌ Fichiers de l'appareil (hors sélection utilisateur)
- ❌ Identifiants publicitaires (Google Ads ID)
- ❌ Historique de navigation

## Sécurité des données
- Chiffrement en transit : TLS/HTTPS
- Chiffrement au repos : non (données dans PostgreSQL, tokens dans SecureStore)
- Authentification : JWT avec refresh token
- Suppression de compte : disponible dans Paramètres
- Conservation : les données sont conservées jusqu'à suppression du compte

## Contact RGPD / Privacy
- Email : privacy@agritrace.bj
- DPO : dpo@atb.bj

## Catégorisation Play Store > Data Safety
```
✅ Compte et profil (email, nom, téléphone) — requis pour le fonctionnement
✅ Transactions financières — requis pour le fonctionnement
✅ Messages (voix) — fonctionnalité optionnelle
✅ Photos (KYC) — fonctionnalité optionnelle  
❌ Localisation — non collectée en arrière-plan
❌ Identifiants publicitaires — non collectés
```
