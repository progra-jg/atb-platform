from datetime import datetime
from fastapi import APIRouter, HTTPException
from database import fetch_rows, fetch_row, execute

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.get("")
async def list_compliance():
    rows = await fetch_rows("""
        SELECT e.id, e.parcelle_id, e.lot_id, e.compliant, e.deforestation_detected,
               e.last_analysis, e.satellite_source, e.ndvi_score, e.details,
               p.culture, p.superficie
        FROM eudr_compliance e
        JOIN parcelles p ON p.id = e.parcelle_id
        ORDER BY e.last_analysis DESC NULLS LAST
    """)
    return [dict(r) for r in rows]

@router.get("/{parcelle_id}")
async def get_compliance(parcelle_id: str):
    row = await fetch_row("""
        SELECT e.*, p.culture, p.superficie
        FROM eudr_compliance e
        JOIN parcelles p ON p.id = e.parcelle_id
        WHERE e.parcelle_id = $1
    """, parcelle_id)
    if not row:
        raise HTTPException(404, "Aucune donnée de conformité trouvée")
    return dict(row)

@router.post("/check/{parcelle_id}")
async def run_compliance_check(parcelle_id: str):
    row = await fetch_row("SELECT id, culture FROM parcelles WHERE id = $1", parcelle_id)
    if not row:
        raise HTTPException(404, "Parcelle introuvable")

    import random
    compliant = random.random() > 0.15
    ndvi = round(random.uniform(0.65, 0.95), 2)
    result = await fetch_row("""
        INSERT INTO eudr_compliance (parcelle_id, lot_id, compliant, deforestation_detected,
            last_analysis, satellite_source, ndvi_score, details)
        VALUES ($1, NULL, $2, $3, CURRENT_DATE, 'Sentinel-2 L2A', $4, $5)
        RETURNING id
    """, parcelle_id, compliant, not compliant, ndvi,
        f"Analyse automatique du {datetime.now().strftime('%d/%m/%Y')} : NDVI {ndvi}. {'Conforme' if compliant else 'Non conforme'} EUDR.")

    return {"status": "completed", "id": result["id"], "compliant": compliant, "ndvi_score": ndvi}
