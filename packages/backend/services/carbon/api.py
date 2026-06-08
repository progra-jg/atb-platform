from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from calculator import CarbonCalculator
from aggregator import CarbonAggregator

router = APIRouter(prefix="/carbon", tags=["carbon"])
calculator = CarbonCalculator()
aggregator = CarbonAggregator()

class ParcelleInput(BaseModel):
    area_ha: float
    culture: str
    years: int = 1

@router.get("/balance/{cooperative_id}")
async def get_cooperative_balance(cooperative_id: str):
    return {
        "cooperative_id": cooperative_id,
        "total_avoided_tco2": 1250.5,
        "credits_minted": 1000,
        "credits_sold": 800,
        "credits_available": 200,
    }

@router.post("/mint")
async def mint_credits(parcelles: list[ParcelleInput]):
    total = calculator.calculate_cooperative_total([p.dict() for p in parcelles])
    return {
        "message": "Credits calculated",
        "total_avoided_tco2": total["total_avoided_tco2"],
        "estimated_credits": int(total["total_avoided_tco2"]),
        "status": "pending_registry_verification",
    }

@router.get("/marketplace")
async def get_credit_marketplace():
    return {
        "credits_available": [
            {"seller": "Coop Zou", "quantity_tco2": 500, "price_per_tco2_usd": 15, "registry": "Verra VCS"},
            {"seller": "Coop Mono", "quantity_tco2": 300, "price_per_tco2_usd": 14, "registry": "Gold Standard"},
        ]
    }
