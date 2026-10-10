from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.db.repository import get_repository
from backend.schemas.models import PatientListResponse, PatientRecord

router = APIRouter(tags=["Patients"])

@router.get("/patients", response_model=PatientListResponse)
def list_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(None, description="Search by patient ID or code"),
    risk_band: Optional[str] = Query(None, description="Filter by risk band (High Risk, Moderate Risk, Low Risk)"),
    sort_by: str = Query("queue_rank", description="Field to sort by"),
    sort_order: str = Query("ASC", description="Sort order ASC or DESC")
):
    repo = get_repository()
    patients, total = repo.get_patients(
        page=page,
        page_size=page_size,
        search=search,
        risk_band=risk_band,
        callback_only=False,
        sort_by=sort_by,
        sort_order=sort_order
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PatientListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        patients=patients
    )

@router.get("/patients/{patient_id}", response_model=PatientRecord)
def get_patient_detail(patient_id: int):
    repo = get_repository()
    patient = repo.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found.")
    return patient
