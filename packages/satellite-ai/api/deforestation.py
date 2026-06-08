from fastapi import APIRouter, HTTPException
from database import fetch_rows, fetch_row

router = APIRouter(prefix="/deforestation", tags=["deforestation"])

@router.get("/check/{parcelle_id}")
async def check_deforestation(parcelle_id: str):
    row = await fetch_row("""
        SELECT compliant, deforestation_detected, ndvi_score, last_analysis
        FROM eudr_compliance
        WHERE parcelle_id = $1
        ORDER BY last_analysis DESC NULLS LAST
        LIMIT 1
    """, parcelle_id)
    if not row:
        return {"parcelle_id": parcelle_id, "deforestation_detected": False, "overlap_area_ha": 0.0, "overlap_ratio": 0.0, "alert_generated": False}
    return {"parcelle_id": parcelle_id, "deforestation_detected": row["deforestation_detected"], "overlap_area_ha": 0.0, "overlap_ratio": 0.0, "alert_generated": not row["compliant"]}

@router.get("/alerts")
async def get_alerts():
    rows = await fetch_rows("""
        SELECT e.id, e.parcelle_id, e.deforestation_detected, e.last_analysis, e.details,
               p.culture, p.superficie
        FROM eudr_compliance e
        JOIN parcelles p ON p.id = e.parcelle_id
        WHERE e.deforestation_detected = true OR e.compliant = false
        ORDER BY e.last_analysis DESC
    """)
    return {"alerts": [dict(r) for r in rows]}
