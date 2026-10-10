from fastapi import APIRouter
import datetime
from backend.config import IS_DEMO_MODE, IS_HOSTED_DB, DEMO_STORAGE_NOTICE

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "MediSense Clinical Decision Support API",
        "version": "1.0.0",
        "is_demo_mode": IS_DEMO_MODE,
        "is_hosted_db": IS_HOSTED_DB,
        "storage_mode": DEMO_STORAGE_NOTICE,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }
