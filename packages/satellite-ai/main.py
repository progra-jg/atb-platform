from fastapi import FastAPI
from api.deforestation import router as deforestation_router
from api.yield_api import router as yield_router
from api.health import router as health_router
from api.compliance import router as compliance_router
from database import init_db, close_db

app = FastAPI(title="ATB AgriTrace — Satellite AI API", version="1.0.0")

app.include_router(health_router)
app.include_router(deforestation_router)
app.include_router(yield_router)
app.include_router(compliance_router)

@app.on_event("startup")
async def startup():
    await init_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()
