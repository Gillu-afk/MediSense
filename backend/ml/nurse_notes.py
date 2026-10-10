"""
Rule-Based Nurse Follow-Up Note Generator
Constructs concise, patient-specific 1-line follow-up conversation notes
using exclusively the patient's actual recorded clinical metrics.
Strictly adheres to clinical guardrails: no hallucinated symptoms,
diagnoses, medications, or unverified history.
"""

from typing import Dict, Any

def generate_nurse_note(
    glucose: float,
    bmi: float,
    age: int,
    blood_pressure: float,
    pedigree: float,
    pregnancies: int,
    insulin: float,
    skin_thickness: float,
    risk_band: str = "High Risk"
) -> str:
    """
    Generates a concise, transparent 1-line conversation note for nurse outreach.
    """
    has_missing_glucose = (glucose == 0)
    has_missing_bp = (blood_pressure == 0)

    # 1. Glucose unmeasured / missing
    if has_missing_glucose:
        return (
            f"Glucose unrecorded in baseline intake; schedule in-clinic fasting glucose test "
            f"and review vital signs (BP: {blood_pressure:.0f} mmHg, Age: {age})."
        )

    # 2. Markedly elevated glucose (>= 160)
    if glucose >= 160:
        if bmi >= 32:
            return (
                f"Prioritize clinical follow-up for high glucose ({glucose:.0f} mg/dL) and BMI ({bmi:.1f} kg/m²); "
                f"suggest diagnostic fasting plasma glucose/HbA1c workup and nutrition counseling."
            )
        else:
            return (
                f"Schedule clinician evaluation for markedly elevated glucose ({glucose:.0f} mg/dL); "
                f"recommend formal glycemic testing and metabolic review."
            )

    # 3. Elevated glucose (140 - 159) with high BMI
    if glucose >= 140 and bmi >= 30:
        if pedigree >= 0.6:
            return (
                f"Discuss elevated glucose ({glucose:.0f} mg/dL) and family predisposition score ({pedigree:.2f}); "
                f"propose lab re-check and diabetes prevention lifestyle consultation."
            )
        return (
            f"Discuss borderline/elevated glucose ({glucose:.0f} mg/dL) and BMI ({bmi:.1f} kg/m²); "
            f"suggest appointment with clinic provider for confirmatory testing and dietary support."
        )

    # 4. Moderate glucose (120 - 139) with high BMI or age
    if glucose >= 120 and bmi >= 33:
        return (
            f"Review metabolic risk indicators (BMI: {bmi:.1f} kg/m², Glucose: {glucose:.0f} mg/dL); "
            f"encourage follow-up consultation with primary care clinician."
        )

    if glucose >= 120 and age >= 50:
        return (
            f"Discuss screening indicators (Age {age}, Glucose {glucose:.0f} mg/dL, BP {blood_pressure:.0f} mmHg); "
            f"offer annual metabolic assessment and clinician review."
        )

    # 5. High family history (pedigree)
    if pedigree >= 0.7:
        return (
            f"Confirm family history background (pedigree indicator {pedigree:.2f}, Glucose {glucose:.0f} mg/dL); "
            f"recommend preventive screening protocol with health center team."
        )

    # 6. Default high / moderate risk note
    if risk_band == "High Risk":
        return (
            f"Elevated screening risk profile (Glucose {glucose:.0f} mg/dL, BMI {bmi:.1f} kg/m², Age {age}); "
            f"suggest scheduling provider appointment for comprehensive assessment."
        )
    elif risk_band == "Moderate Risk":
        return (
            f"Moderate screening risk profile (Glucose {glucose:.0f} mg/dL, BMI {bmi:.1f} kg/m²); "
            f"suggest routine follow-up check and lifestyle discussion."
        )
    else:
        return (
            f"Low screening risk profile (Glucose {glucose:.0f} mg/dL, BMI {bmi:.1f} kg/m²); "
            f"recommend standard preventive health maintenance."
        )
