from fastapi import APIRouter
from database import fetch_row

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    db_ok = False
    devices = 0
    try:
        row = await fetch_row("SELECT COUNT(*) AS cnt FROM weighings WHERE culture = 'REGISTRATION'")
        if row:
            db_ok = True
            devices = row["cnt"]
    except Exception:
        pass
    return {"service": "iot-bridge", "status": "ok", "database": "connected" if db_ok else "disconnected", "devices_online": devices, "devices_total": devices}
