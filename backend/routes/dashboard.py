from fastapi import APIRouter
import numpy as np
import pandas as pd
from backend.schemas.models import DashboardSummary, KPICards
from backend.ml.insights import calculate_dataset_insights
from backend.ml.pipeline import get_model
from backend.config import IS_DEMO_MODE, DEMO_STORAGE_NOTICE

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    model = get_model()
    df = model.historical_df
    total_patients = len(df)
    positive_outcomes = int(df["Outcome"].sum())
    insights = calculate_dataset_insights(df)

    # Compute dynamic model metrics from cross-validation
    from backend.routes.model_metrics import get_model_metrics
    metrics = get_model_metrics()
    lr_metrics = metrics["models"]["logistic_regression"]

    kpis = KPICards(
        total_patients_loaded=total_patients,
        positive_historical_outcomes=positive_outcomes,
        patients_in_callback_queue=100,
        callback_queue_capacity=100,
        model_recall=lr_metrics["recall_mean"],
        model_roc_auc=lr_metrics["roc_auc_mean"],
        precision_at_100=lr_metrics["capacity_metrics"]["precision_at_100"],
        recall_at_100=lr_metrics["capacity_metrics"]["recall_at_100"]
    )

    # Distribution histograms for charts
    glucose_bins = [0, 99, 125, 139, 199, 300]
    glucose_labels = ["<100 (Normal)", "100-125 (Impaired)", "126-139 (Elevated)", "140-199 (High)", "200+ (Critical)"]
    glucose_counts = pd.cut(df["Glucose"], bins=glucose_bins, labels=glucose_labels, include_lowest=True).value_counts().to_dict()

    bmi_bins = [0, 18.5, 24.9, 29.9, 34.9, 39.9, 100]
    bmi_labels = ["<18.5 (Underweight)", "18.5-24.9 (Normal)", "25-29.9 (Overweight)", "30-34.9 (Obese I)", "35-39.9 (Obese II)", "40+ (Severe)"]
    bmi_counts = pd.cut(df["BMI"], bins=bmi_bins, labels=bmi_labels, include_lowest=True).value_counts().to_dict()

    age_bins = [20, 29, 39, 49, 59, 100]
    age_labels = ["21-29", "30-39", "40-49", "50-59", "60+"]
    age_counts = pd.cut(df["Age"], bins=age_bins, labels=age_labels, include_lowest=True).value_counts().to_dict()

    # Risk band distribution across scored patients
    scored_df = model.historical_predictions
    risk_counts = scored_df["risk_band"].value_counts().to_dict()

    distribution = {
        "glucose_distribution": [{"range": k, "count": int(v)} for k, v in glucose_counts.items()],
        "bmi_distribution": [{"range": k, "count": int(v)} for k, v in bmi_counts.items()],
        "age_distribution": [{"range": k, "count": int(v)} for k, v in age_counts.items()],
        "risk_band_distribution": [{"band": k, "count": int(v)} for k, v in risk_counts.items()],
        "outcome_distribution": [
            {"label": "Negative (Non-diabetic)", "count": int(total_patients - positive_outcomes), "percentage": round((total_patients - positive_outcomes) / total_patients * 100, 1)},
            {"label": "Positive (Confirmed)", "count": positive_outcomes, "percentage": round(positive_outcomes / total_patients * 100, 1)}
        ]
    }

    return DashboardSummary(
        kpis=kpis,
        insights=insights,
        distribution=distribution,
        demo_mode=IS_DEMO_MODE,
        storage_notice=DEMO_STORAGE_NOTICE,
        disclaimer=(
            "Estimated risk scores are statistical decision-support probabilities, not clinical diagnoses. "
            "All model indicators prioritize outreach follow-up under clinic monthly capacity constraints."
        )
    )
