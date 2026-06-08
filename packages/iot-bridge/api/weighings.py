from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import fetch_rows, fetch_row, execute

router = APIRouter(prefix="/weighings", tags=["weighings"])

class WeighingCreate(BaseModel):
    lot_id: str
    producteur_id: str
    weight_kg: float
    culture: str
    device_id: str
    battery_level: int | None = None

@router.post("")
async def create_weighing(data: WeighingCreate):
    result = await execute("""
        INSERT INTO weighings (lot_id, producteur_id, weight_kg, culture, date, device_id, battery_level)
        VALUES ($1, $2, $3, $4, NOW(), $5, $6)
    """, data.lot_id, data.producteur_id, data.weight_kg, data.culture, data.device_id, data.battery_level)
    return {"status": "created", "weight_kg": data.weight_kg, "lot_id": data.lot_id}

@router.get("")
async def list_weighings(limit: int = 20):
    rows = await fetch_rows("""
        SELECT w.*, f.display_name AS producteur
        FROM weighings w
        JOIN farmer_profiles f ON f.id = w.producteur_id
        ORDER BY w.date DESC
        LIMIT $1
    """, limit)
    return [dict(r) for r in rows]

@router.get("/{lot_id}")
async def get_weighings_by_lot(lot_id: str):
    rows = await fetch_rows("""
        SELECT * FROM weighings WHERE lot_id = $1 ORDER BY date DESC
    """, lot_id)
    return [dict(r) for r in rows]
