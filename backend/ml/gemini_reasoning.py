"""
Gemini AI Clinical Reasoning Engine
Generates patient-specific prioritization reasoning and nurse call scripts
using Gemini models (gemini-2.5-flash / gemini-1.5-flash) with seamless
fallback to transparent ML rule-based attribution when an API key is not set.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

from backend.config import BASE_DIR

def get_gemini_api_key() -> str:
    """Retrieves GEMINI_API_KEY from environment or .env file."""
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    if not key:
        env_file = BASE_DIR.parent / ".env"
        if env_file.exists():
            with open(env_file, "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        key = line.strip().split("=", 1)[1].strip('"').strip("'")
                        break
                    elif line.startswith("GOOGLE_API_KEY="):
                        key = line.strip().split("=", 1)[1].strip('"').strip("'")
                        break
    return key


def generate_patient_ai_reasoning(
    patient_data: Dict[str, Any],
    custom_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates clinical reasoning for patient prioritization using Gemini API.
    Falls back gracefully to transparent ML feature deviation when API key is unavailable.
    """
    api_key = custom_api_key or get_gemini_api_key()

    # Fallback reasoning if no key is configured
    fallback_reasoning = (
        f"Prioritized at Rank #{patient_data.get('queue_rank', 'N/A')} with an estimated risk of "
        f"{float(patient_data.get('estimated_risk', 0)) * 100:.1f}%. "
        f"Primary risk drivers: Glucose ({patient_data.get('glucose')} mg/dL) and "
        f"BMI ({patient_data.get('bmi')} kg/m²) elevate diabetes odds relative to community clinic medians."
    )

    if not api_key:
        return {
            "source": "ML_RULE_BASED",
            "model": "MediSense-Explainability-Engine",
            "reasoning": fallback_reasoning,
            "nurse_call_script": patient_data.get("nurse_note") or "Contact patient for in-clinic glycemic assessment.",
            "api_key_configured": False,
            "message": "GEMINI_API_KEY not configured. Set GEMINI_API_KEY in .env or provide it in the UI to enable live Gemini AI synthesis."
        }

    # Prompt constructing strict clinical decision-support reasoning
    prompt = f"""You are a clinical decision-support AI assisting a community health clinic nurse.
Patient Profile:
- Patient Code: {patient_data.get('patient_code', 'Unknown')}
- Priority Rank: #{patient_data.get('queue_rank', 'N/A')} (out of 100 prioritized calls)
- Model Estimated Risk: {float(patient_data.get('estimated_risk', 0)) * 100:.1f}% ({patient_data.get('risk_band', 'High Risk')})
- Glucose: {patient_data.get('glucose')} mg/dL (Clinic median: 117 mg/dL)
- BMI: {patient_data.get('bmi')} kg/m² (Clinic median: 32 kg/m²)
- Age: {patient_data.get('age')} years (Clinic median: 29 years)
- Blood Pressure: {patient_data.get('blood_pressure')} mmHg (0 means unrecorded)
- Serum Insulin: {patient_data.get('insulin')} µU/mL (0 means unrecorded)
- Diabetes Pedigree Function: {patient_data.get('diabetes_pedigree_function')} (Family history score)
- Pregnancies: {patient_data.get('pregnancies')}

Clinical Guardrails:
1. Do NOT diagnose the patient. Use neutral language ('elevated estimated risk; clinical evaluation recommended').
2. Explain specifically WHY this patient appears at their priority rank based on their actual numbers.
3. Provide a concise 1-line nurse follow-up outreach note (what topic to discuss on the call).
4. Do not hallucinate symptoms, medications, or medical history.

Respond in strict JSON format:
{{
  "prioritization_reasoning": "2-3 sentences explaining why this patient is prioritized at this rank",
  "nurse_call_script": "1-sentence patient-specific call prompt for the nurse to discuss"
}}
"""

    models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash"]
    last_error = ""

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                result = json.loads(response.read().decode("utf-8"))
                text_content = result["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)

                return {
                    "source": "GEMINI_AI",
                    "model": model_name,
                    "reasoning": parsed.get("prioritization_reasoning", fallback_reasoning),
                    "nurse_call_script": parsed.get("nurse_call_script", patient_data.get("nurse_note")),
                    "api_key_configured": True,
                    "message": f"Generated successfully via Gemini AI ({model_name})."
                }
        except Exception as e:
            last_error = str(e)
            continue

    # Fallback if API fails
    return {
        "source": "FALLBACK_ML",
        "model": "MediSense-Explainability-Engine",
        "reasoning": fallback_reasoning,
        "nurse_call_script": patient_data.get("nurse_note") or "Contact patient for in-clinic glycemic assessment.",
        "api_key_configured": True,
        "error": f"Gemini API request failed: {last_error}",
        "message": "Fell back to transparent ML explainability engine."
    }
