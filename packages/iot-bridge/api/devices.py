from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import fetch_rows, fetch_row, execute

router = APIRouter(prefix="/devices", tags=["devices"])

class DeviceCreate(BaseModel):
    device_id: str
    device_type: str
    firmware_version: str = "unknown"
    battery_level: int = 0
    metadata: dict = {}
    lot_id: str | None = None

@router.post("")
async def register_device(data: DeviceCreate):
    row = await fetch_row("SELECT device_id FROM weighings WHERE device_id = $1 LIMIT 1", data.device_id)
    await execute("""
        INSERT INTO weighings (lot_id, producteur_id, weight_kg, culture, date, device_id, device_type, battery_level, raw_payload)
        VALUES ($1, NULL, 0, 'REGISTRATION', NOW(), $2, $3, $4, $5::jsonb)
    """, data.lot_id, data.device_id, data.device_type, data.battery_level, str(data.metadata))
    return {"status": "registered", "device_id": data.device_id}

@router.get("")
async def list_devices():
    rows = await fetch_rows("""
        SELECT device_id, device_type, battery_level, date AS last_seen
        FROM weighings
        WHERE culture = 'REGISTRATION'
        ORDER BY date DESC
    """)
    seen = {}
    for r in rows:
        if r["device_id"] not in seen:
            seen[r["device_id"]] = dict(r)
    return {"devices": list(seen.values()), "total": len(seen)}

@router.get("/{device_id}")
async def get_device(device_id: str):
    rows = await fetch_rows("""
        SELECT w.*, f.display_name AS producteur
        FROM weighings w
        LEFT JOIN farmer_profiles f ON f.id = w.producteur_id
        WHERE w.device_id = $1
        ORDER BY w.date DESC
        LIMIT 20
    """, device_id)
    if not rows:
        raise HTTPException(404, "Appareil introuvable")
    return {"device_id": device_id, "history": [dict(r) for r in rows]}
