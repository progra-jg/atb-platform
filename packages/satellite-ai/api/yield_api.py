from fastapi import APIRouter
from models.yield.api import router as yield_router

router = APIRouter()
router.include_router(yield_router)
