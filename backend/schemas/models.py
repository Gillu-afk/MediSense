from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any

class RiskFactorDetail(BaseModel):
    factor: str
    value: Any
    unit: str
    level: str  # "high", "moderate", "normal", "missing"
    benchmark: str
    clinical_note: str

class ScreeningInput(BaseModel):
    pregnancies: int = Field(ge=0, le=25, default=0, description="Number of pregnancies (0 is medically valid)")
    glucose: float = Field(ge=0.0, le=350.0, default=120.0, description="Fasting/plasma glucose (mg/dL). 0 indicates unmeasured.")
    blood_pressure: float = Field(ge=0.0, le=250.0, default=70.0, description="Diastolic blood pressure (mmHg). 0 indicates unmeasured.")
    skin_thickness: float = Field(ge=0.0, le=120.0, default=20.0, description="Triceps skin fold thickness (mm). 0 indicates unmeasured.")
    insulin: float = Field(ge=0.0, le=1000.0, default=80.0, description="2-Hour serum insulin (mu U/ml). 0 indicates unmeasured.")
    bmi: float = Field(ge=0.0, le=80.0, default=28.0, description="Body Mass Index (weight in kg/(height in m)^2). 0 indicates unmeasured.")
    diabetes_pedigree_function: float = Field(ge=0.01, le=3.0, default=0.45, description="Diabetes pedigree function (genetic score).")
    age: int = Field(ge=1, le=120, default=35, description="Age in years.")

    @field_validator("age")
    @classmethod
    def check_age(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Age must be at least 1 year.")
        return v

class ScreeningResult(BaseModel):
    patient_id: str
    estimated_risk_probability: float
    risk_percentage: float
    risk_band: str  # "High Risk", "Moderate Risk", "Low Risk"
    top_risk_factors: List[RiskFactorDetail]
    recommended_action: str
    suggested_nurse_note: str
    approval_status: str = "PENDING_APPROVAL"
    clinical_disclaimer: str = (
        "Decision-support estimate only. This screening result is not a medical diagnosis. "
        "Elevated risk estimates require formal clinical evaluation by a healthcare provider."
    )
    created_at: str

class PatientRecord(BaseModel):
    id: int
    patient_code: str
    pregnancies: int
    glucose: float
    blood_pressure: float
    skin_thickness: float
    insulin: float
    bmi: float
    diabetes_pedigree_function: float
    age: int
    outcome: Optional[int] = None
    estimated_risk: float
    risk_band: str
    queue_rank: Optional[int] = None
    is_in_callback_queue: bool = False
    is_historical: bool = True
    top_factors: List[RiskFactorDetail]
    recommended_action: str
    nurse_note: Optional[str] = None
    review_status: str = "Pending"  # "Pending", "Contacted", "Escalated", "Completed"
    approval_status: str = "PENDING_APPROVAL"  # "PENDING_APPROVAL", "APPROVED"
    reviewed_by: Optional[str] = None
    updated_at: Optional[str] = None

class PatientListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    patients: List[PatientRecord]

class NurseNoteUpdate(BaseModel):
    note_text: Optional[str] = None
    review_status: Optional[str] = None  # "Pending", "Contacted", "Escalated", "Completed"
    approval_status: Optional[str] = None  # "PENDING_APPROVAL", "APPROVED"
    reviewed_by: Optional[str] = "Staff Nurse"

class TopNurseNote(BaseModel):
    patient_id: int
    patient_code: str
    queue_rank: int
    estimated_risk: float
    risk_band: str
    glucose: float
    bmi: float
    age: int
    note_text: str
    review_status: str
    approval_status: str
    top_factors: List[RiskFactorDetail]
    reviewed_by: Optional[str] = None
    updated_at: Optional[str] = None

class KPICards(BaseModel):
    total_patients_loaded: int
    total_patients_loaded_label: str = "Historical Labelled Dataset"
    positive_historical_outcomes: int
    positive_historical_outcomes_label: str = "Historical Ground Truth (34.9% Base Rate)"
    patients_in_callback_queue: int
    callback_queue_capacity: int = 100
    callback_queue_capacity_label: str = "Clinic Monthly Capacity Constraint"
    model_recall: float
    model_recall_label: str = "5-Fold Cross-Validation Recall"
    model_roc_auc: float
    model_roc_auc_label: str = "5-Fold Cross-Validation ROC-AUC"
    precision_at_100: float
    precision_at_100_label: str = "Evaluated on Top-100 Capacity Cutoff"
    recall_at_100: float
    recall_at_100_label: str = "Positives Captured in Top 100 Calls"

class InsightItem(BaseModel):
    id: str
    title: str
    category: str
    finding: str
    clinical_relevance: str
    trap_addressed: str

class DashboardSummary(BaseModel):
    kpis: KPICards
    insights: List[InsightItem]
    distribution: Dict[str, Any]
    demo_mode: bool
    storage_notice: str
    disclaimer: str
