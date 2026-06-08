# Pipeline Satellite & AI

## Ingestion
| Source | Fréquence | Résolution |
|--------|-----------|------------|
| Sentinel-2 (ESA) | 5 jours | 10m |
| PlanetScope | Quotidien | 3m |
| Sentinel-1 (SAR) | 12 jours | 10m |

## Modèles

### Déforestation
- **Architecture**: U-Net + ResNet50
- **Entrée**: Image satellite 256×256×4 (RGBN)
- **Sortie**: Masque binaire forêt/déforestation
- **Métriques**: IoU > 0.75

### Prédiction Rendement
- **Architecture**: LSTM + Attention
- **Entrée**: Séries temporelles 60 pas × 10 features (NDVI + météo)
- **Sortie**: kg/ha prédit
- **MAPE**: < 15%

## API
```bash
# Vérifier déforestation
GET /ai/deforestation/check/{parcelle_id}

# Prédire rendement
POST /ai/yield/predict
{"parcelle_id": "P-001", "time_series": [[...]]}
```
