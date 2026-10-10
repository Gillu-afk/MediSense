from fastapi import APIRouter, HTTPException
import uuid
import datetime
from backend.schemas.models import ScreeningInput, ScreeningResult
from backend.ml.pipeline import get_model
from backend.db.repository import get_repository

router = APIRouter(tags=["Screening"])

@router.post("/predict", response_model=ScreeningResult)
def screen_patient(input_data: ScreeningInput):
    # Additional domain validations
    if input_data.glucose < 0 or input_data.glucose > 350:
        raise HTTPException(status_code=422, detail="Glucose must be between 0 and 350 mg/dL.")
    if input_data.blood_pressure < 0 or input_data.blood_pressure > 250:
        raise HTTPException(status_code=422, detail="Blood pressure must be between 0 and 250 mmHg.")
    if input_data.bmi < 0 or input_data.bmi > 80:
        raise HTTPException(status_code=422, detail="BMI must be between 0 and 80 kg/m².")
    if input_data.age < 1 or input_data.age > 120:
        raise HTTPException(status_code=422, detail="Age must be between 1 and 120 years.")

    patient_id = f"NEW-{uuid.uuid4().hex[:6].upper()}"

    model = get_model()
    result = model.predict_single_patient(input_data, patient_id=patient_id)

    # Persist the screening to repository
    repo = get_repository()
    repo.record_new_screening({
        "patient_id": patient_id,
        "pregnancies": input_data.pregnancies,
        "glucose": input_data.glucose,
        "blood_pressure": input_data.blood_pressure,
        "skin_thickness": input_data.skin_thickness,
        "insulin": input_data.insulin,
        "bmi": input_data.bmi,
        "diabetes_pedigree_function": input_data.diabetes_pedigree_function,
        "age": input_data.age,
        "estimated_risk_probability": result.estimated_risk_probability,
        "risk_band": result.risk_band,
        "top_risk_factors": result.top_risk_factors,
        "recommended_action": result.recommended_action,
        "suggested_nurse_note": result.suggested_nurse_note,
        "approval_status": result.approval_status,
        "created_at": result.created_at
    })

    return result
