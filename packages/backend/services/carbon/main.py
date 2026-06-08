from fastapi import FastAPI
from api import router as carbon_router

app = FastAPI(title="ATB Carbon Credit Service", version="1.0.0")
app.include_router(carbon_router)

@app.get("/")
async def root():
    return {"service": "carbon-credit", "status": "running"}
