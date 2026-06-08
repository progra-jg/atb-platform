from fastapi import FastAPI
from api.health import router as health_router
from api.weighings import router as weighings_router
from api.devices import router as devices_router
from mqtt.listener import MQTTListener
from database import init_db, close_db
import threading

app = FastAPI(title="ATB AgriTrace — IoT Bridge", version="1.0.0")
app.include_router(health_router)
app.include_router(weighings_router)
app.include_router(devices_router)

@app.on_event("startup")
async def startup():
    await init_db()
    listener = MQTTListener()
    thread = threading.Thread(target=listener.start, daemon=True)
    thread.start()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

@app.get("/")
async def root():
    return {"service": "iot-bridge", "status": "running"}
