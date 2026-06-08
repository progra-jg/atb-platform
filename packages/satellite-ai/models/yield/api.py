from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import fetch_rows, fetch_row

router = APIRouter(prefix="/yield", tags=["yield"])

class YieldRequest(BaseModel):
    parcelle_id: str
    time_series: list

class BatchYieldRequest(BaseModel):
    parcelles: list[YieldRequest]

@router.get("/predictions/{parcelle_id}")
async def get_predictions(parcelle_id: str):
    row = await fetch_row("""
        SELECT predicted, unit, confidence, confidence_interval, model_version, history, last_updated
        FROM yield_predictions
        WHERE parcelle_id = $1
        ORDER BY last_updated DESC NULLS LAST
        LIMIT 1
    """, parcelle_id)
    if not row:
        raise HTTPException(404, "Aucune prédiction trouvée pour cette parcelle")
    return dict(row)

@router.get("/history/{parcelle_id}")
async def get_yield_history(parcelle_id: str):
    rows = await fetch_rows("""
        SELECT predicted, unit, confidence, last_updated
        FROM yield_predictions
        WHERE parcelle_id = $1
        ORDER BY last_updated DESC
    """, parcelle_id)
    return [dict(r) for r in rows]

@router.post("/predict")
async def predict_yield(request: YieldRequest):
    # In production: load TensorFlow model and run inference
    # For now: return mock prediction stored in DB or a default
    row = await fetch_row("SELECT culture FROM parcelles WHERE id = $1", request.parcelle_id)
    if not row:
        raise HTTPException(404, "Parcelle introuvable")
    return {"parcelle_id": request.parcelle_id, "predicted_yield_kg_per_ha": 1200.0, "confidence": 0.85}
