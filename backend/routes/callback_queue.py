from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from backend.db.repository import get_repository
from backend.schemas.models import PatientListResponse

router = APIRouter(tags=["Callback Queue"])

@router.get("/callback-queue")
def get_callback_queue(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(None, description="Search patient ID"),
    risk_band: Optional[str] = Query(None, description="Filter by risk category"),
    sort_by: str = Query("queue_rank", description="Sort field"),
    sort_order: str = Query("ASC", description="Sort direction")
) -> Dict[str, Any]:
    repo = get_repository()
    patients, total_matching = repo.get_patients(
        page=page,
        page_size=page_size,
        search=search,
        risk_band=risk_band,
        callback_only=True,
        sort_by=sort_by,
        sort_order=sort_order
    )

    # Get summary stats across the entire top 100 queue
    all_queue_patients, total_in_queue = repo.get_patients(
        page=1,
        page_size=100,
        callback_only=True
    )

    high_risk_count = sum(1 for p in all_queue_patients if p.risk_band == "High Risk")
    moderate_risk_count = sum(1 for p in all_queue_patients if p.risk_band == "Moderate Risk")
    contacted_count = sum(1 for p in all_queue_patients if p.review_status in ["Contacted", "Completed"])
    pending_count = total_in_queue - contacted_count

    return {
        "capacity_limit": 100,
        "total_in_queue": total_in_queue,
        "capacity_utilization_pct": round(total_in_queue / 100 * 100, 1),
        "high_risk_count": high_risk_count,
        "moderate_risk_count": moderate_risk_count,
        "contacted_count": contacted_count,
        "pending_count": pending_count,
        "page": page,
        "page_size": page_size,
        "total_matching": total_matching,
        "total_pages": (total_matching + page_size - 1) // page_size if total_matching > 0 else 1,
        "patients": [p.model_dump() for p in patients]
    }
