import tempfile
import os
import pytest
from fastapi.testclient import TestClient

# Use an isolated test database
temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
temp_db.close()
os.environ["SQLITE_DB_PATH"] = temp_db.name

from backend.db.repository import MediSenseRepository, get_repository
import backend.db.repository as repo_module
repo_module._repo_instance = MediSenseRepository(temp_db.name)

from backend.app import app
from backend.db.database import init_and_seed_database
from backend.ml.pipeline import get_model, CLINICAL_ZERO_COLS
from backend.schemas.models import ScreeningInput

# Seed test database
init_and_seed_database()

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["kpis"]["total_patients_loaded"] == 768
    assert data["kpis"]["positive_historical_outcomes"] == 268
    assert data["kpis"]["callback_queue_capacity"] == 100
    assert len(data["insights"]) >= 3
    assert "distribution" in data

def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "logistic_regression" in data["models"]
    assert "random_forest" in data["models"]
    lr = data["models"]["logistic_regression"]
    # Verify expected ROC-AUC is within expected range (0.80 - 0.85)
    assert 0.80 <= lr["roc_auc_mean"] <= 0.85
    # Verify capacity metrics
    assert lr["capacity_metrics"]["queue_capacity"] == 100
    assert lr["capacity_metrics"]["precision_at_100"] > 0.75
    # Verify hidden data traps documentation
    assert len(data["hidden_data_traps_handled"]) >= 3

def test_patients_list_and_pagination():
    response = client.get("/api/patients?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 768
    assert len(data["patients"]) == 10
    first = data["patients"][0]
    assert "estimated_risk" in first
    assert "risk_band" in first
    assert len(first["top_factors"]) == 3

def test_callback_queue_capacity_limit():
    response = client.get("/api/callback-queue?page=1&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert data["capacity_limit"] == 100
    assert data["total_in_queue"] == 100
    assert len(data["patients"]) == 20
    # Check that rank 1 has highest risk
    assert data["patients"][0]["queue_rank"] == 1

def test_single_screening_inference():
    payload = {
        "pregnancies": 2,
        "glucose": 160.0,
        "blood_pressure": 80.0,
        "skin_thickness": 28.0,
        "insulin": 150.0,
        "bmi": 34.5,
        "diabetes_pedigree_function": 0.55,
        "age": 45
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_band"] in ["High Risk", "Moderate Risk", "Low Risk"]
    assert 0.0 <= data["estimated_risk_probability"] <= 1.0
    assert len(data["top_risk_factors"]) == 3
    assert "clinical_disclaimer" in data
    assert "suggested_nurse_note" in data
    assert data["approval_status"] == "PENDING_APPROVAL"

def test_screening_validation_errors():
    # Test invalid negative age
    response = client.post("/api/predict", json={
        "pregnancies": 0, "glucose": 120, "blood_pressure": 70,
        "skin_thickness": 20, "insulin": 80, "bmi": 25,
        "diabetes_pedigree_function": 0.5, "age": -5
    })
    assert response.status_code == 422

def test_top_10_nurse_notes_and_update():
    # Fetch top 10 notes
    response = client.get("/api/nurse-notes")
    assert response.status_code == 200
    notes = response.json()
    assert len(notes) == 10
    top_note = notes[0]
    assert top_note["approval_status"] == "PENDING_APPROVAL"
    patient_id = top_note["patient_id"]

    # Update note and approval
    update_payload = {
        "note_text": "Updated by Head Nurse: Confirmed fasting glucose retest scheduled.",
        "review_status": "Contacted",
        "approval_status": "APPROVED",
        "reviewed_by": "Nurse Sarah Jenkins, RN"
    }
    patch_resp = client.patch(f"/api/nurse-notes/{patient_id}", json=update_payload)
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["approval_status"] == "APPROVED"
    assert updated["review_status"] == "Contacted"
    assert updated["reviewed_by"] == "Nurse Sarah Jenkins, RN"
    assert "fasting glucose retest" in updated["note_text"]

def test_export_callback_queue_csv():
    response = client.get("/api/export/callback-queue")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    content = response.text
    lines = content.strip().split("\n")
    # Header + 100 rows = 101 lines
    assert len(lines) == 101
    assert "Priority Rank" in lines[0]
    assert "Estimated Risk (%)" in lines[0]

def test_no_target_outcome_leakage():
    model = get_model()
    # Ensure Outcome is not in feature names
    assert "Outcome" not in model.feature_names
    assert "outcome" not in [f.lower() for f in model.feature_names]
    # Ensure zeros in CLINICAL_ZERO_COLS were identified
    for col in CLINICAL_ZERO_COLS:
        assert f"{col}_missing" in model.feature_names
