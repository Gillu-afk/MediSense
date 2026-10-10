from fastapi import APIRouter, HTTPException, Path
from typing import List
from backend.db.repository import get_repository
from backend.schemas.models import TopNurseNote, NurseNoteUpdate

router = APIRouter(tags=["Nurse Notes"])

@router.get("/nurse-notes", response_model=List[TopNurseNote])
def get_top_nurse_notes():
    repo = get_repository()
    return repo.get_top_nurse_notes()

@router.patch("/nurse-notes/{patient_id}", response_model=TopNurseNote)
def update_nurse_note(
    patient_id: int = Path(..., description="ID of patient in top-10 queue"),
    update_data: NurseNoteUpdate = ...
):
    repo = get_repository()
    updated = repo.update_nurse_note(patient_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Patient {patient_id} not found in top-10 queue."
        )
    return updated
