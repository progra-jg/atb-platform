import os
from fastapi import APIRouter
from database import fetch_row

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    db_ok = False
    try:
        row = await fetch_row("SELECT 1 AS ok")
        db_ok = row and row["ok"] == 1
    except Exception:
        pass

    model_files = []
    for root, dirs, files in os.walk("models"):
        for f in files:
            if f.endswith(".h5"):
                model_files.append(os.path.join(root, f))

    gpu_info = None
    try:
        import GPUtil
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu = gpus[0]
            gpu_info = {"name": gpu.name, "memory_total_mb": gpu.memoryTotal, "memory_free_mb": gpu.memoryFree}
    except Exception:
        pass

    return {
        "service": "satellite-ai",
        "status": "ok",
        "database": "connected" if db_ok else "disconnected",
        "models": model_files,
        "gpu": gpu_info,
        "tensorflow": __import__("tensorflow").__version__,
    }
