from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import io
import csv
from backend.db.repository import get_repository

router = APIRouter(tags=["Export"])

@router.get("/export/callback-queue")
def export_callback_queue():
    repo = get_repository()
    patients, _ = repo.get_patients(page=1, page_size=100, callback_only=True)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Priority Rank",
        "Patient ID",
        "Estimated Risk (%)",
        "Risk Category",
        "Glucose (mg/dL)",
        "BMI (kg/m2)",
        "Age",
        "Blood Pressure (mmHg)",
        "Top Risk Factor 1",
        "Top Risk Factor 2",
        "Top Risk Factor 3",
        "Recommended Next Action",
        "Nurse Outreach Note",
        "Approval Status",
        "Review / Call Status",
        "Reviewed By",
        "Last Updated"
    ])

    for p in patients:
        factor1 = f"{p.top_factors[0].factor}: {p.top_factors[0].value}" if len(p.top_factors) > 0 else ""
        factor2 = f"{p.top_factors[1].factor}: {p.top_factors[1].value}" if len(p.top_factors) > 1 else ""
        factor3 = f"{p.top_factors[2].factor}: {p.top_factors[2].value}" if len(p.top_factors) > 2 else ""

        writer.writerow([
            p.queue_rank,
            p.patient_code,
            f"{p.estimated_risk * 100:.1f}%",
            p.risk_band,
            p.glucose,
            p.bmi,
            p.age,
            p.blood_pressure,
            factor1,
            factor2,
            factor3,
            p.recommended_action,
            p.nurse_note or "N/A",
            p.approval_status,
            p.review_status,
            p.reviewed_by or "N/A",
            p.updated_at or "N/A"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=medisense_callback_queue_top100.csv"}
    )
