"""
MediSense Production ML Pipeline & Explainability Engine
Handles zero-handling, imputation, model inference,
transparent feature attribution, and queue ranking.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

from backend.schemas.models import RiskFactorDetail, ScreeningInput, ScreeningResult
from backend.ml.nurse_notes import generate_nurse_note

CLINICAL_ZERO_COLS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
FEATURE_COLS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age"
]

# Clinical Population Medians and Normal Benchmarks
CLINICAL_BENCHMARKS = {
    "Glucose": {
        "unit": "mg/dL",
        "median": 117.0,
        "normal_threshold": 100.0,
        "elevated_threshold": 126.0,
        "high_threshold": 140.0,
        "meaning": "Elevated fasting plasma glucose is strongly associated with glycemic dysregulation and metabolic risk."
    },
    "BMI": {
        "unit": "kg/m²",
        "median": 32.0,
        "normal_threshold": 25.0,
        "elevated_threshold": 30.0,
        "high_threshold": 35.0,
        "meaning": "Higher body mass index reflects adiposity associated with reduced insulin sensitivity."
    },
    "Age": {
        "unit": "years",
        "median": 29.0,
        "normal_threshold": 35.0,
        "elevated_threshold": 45.0,
        "high_threshold": 55.0,
        "meaning": "Advancing age is a recognized risk modifier correlated with gradual beta-cell function decline."
    },
    "DiabetesPedigreeFunction": {
        "unit": "score",
        "median": 0.37,
        "normal_threshold": 0.50,
        "elevated_threshold": 0.70,
        "high_threshold": 1.00,
        "meaning": "Higher pedigree score estimates familial and genetic predisposition to type-2 diabetes."
    },
    "Pregnancies": {
        "unit": "count",
        "median": 3.0,
        "normal_threshold": 4.0,
        "elevated_threshold": 6.0,
        "high_threshold": 8.0,
        "meaning": "Higher parity history associates with past gestational glycemic stress and hormonal shifts."
    },
    "BloodPressure": {
        "unit": "mmHg",
        "median": 72.0,
        "normal_threshold": 80.0,
        "elevated_threshold": 85.0,
        "high_threshold": 90.0,
        "meaning": "Elevated diastolic pressure often co-occurs in cardiometabolic symptom clusters."
    },
    "Insulin": {
        "unit": "mu U/ml",
        "median": 125.0,
        "normal_threshold": 100.0,
        "elevated_threshold": 150.0,
        "high_threshold": 200.0,
        "meaning": "Serum insulin shifts can indicate pancreatic compensation or early resistance."
    },
    "SkinThickness": {
        "unit": "mm",
        "median": 23.0,
        "normal_threshold": 25.0,
        "elevated_threshold": 32.0,
        "high_threshold": 40.0,
        "meaning": "Subcutaneous fat fold depth provides physical anthropometric estimate of body composition."
    }
}


class MediSenseModel:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.is_fitted = False
        self.imputer: SimpleImputer = None
        self.scaler: StandardScaler = None
        self.model: LogisticRegression = None
        self.feature_names: List[str] = []
        self.historical_df: pd.DataFrame = None
        self.historical_predictions: pd.DataFrame = None
        self.population_means: Dict[str, float] = {}
        self.population_stds: Dict[str, float] = {}

    def fit(self):
        """
        Fits preprocessing and model on the entire historical dataset.
        Outcome is strictly excluded from features to prevent leakage.
        """
        df = pd.read_csv(self.data_path)
        self.historical_df = df.copy()

        # Step 1: Replace physiologically impossible zeros with NaN
        df_clean = df[FEATURE_COLS].copy()
        for col in CLINICAL_ZERO_COLS:
            df_clean[col] = df_clean[col].replace(0, np.nan)

        # Step 2: Build missingness indicators
        missing_indicators = pd.DataFrame(index=df.index)
        for col in CLINICAL_ZERO_COLS:
            missing_indicators[f"{col}_missing"] = df_clean[col].isna().astype(float)

        # Step 3: Median imputer
        self.imputer = SimpleImputer(strategy="median")
        df_clean[CLINICAL_ZERO_COLS] = self.imputer.fit_transform(df_clean[CLINICAL_ZERO_COLS])

        # Step 4: Combine features
        feature_df = pd.concat([df_clean, missing_indicators], axis=1)
        self.feature_names = list(feature_df.columns)

        # Record population statistics for feature deviation explainability
        for col in self.feature_names:
            self.population_means[col] = float(feature_df[col].mean())
            self.population_stds[col] = float(feature_df[col].std()) if feature_df[col].std() > 0 else 1.0

        # Step 5: Standard Scaler
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(feature_df)

        # Step 6: Logistic Regression (balanced class weight)
        y = df["Outcome"].values
        self.model = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
        self.model.fit(X_scaled, y)
        self.is_fitted = True

        # Generate predictions for all historical records
        self._score_historical_dataset()

    def _prepare_features(self, input_df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
        """
        Prepares raw input data for inference using fitted imputer and scaler.
        """
        df_clean = input_df[FEATURE_COLS].copy()
        for col in CLINICAL_ZERO_COLS:
            df_clean[col] = df_clean[col].replace(0, np.nan)

        missing_indicators = pd.DataFrame(index=input_df.index)
        for col in CLINICAL_ZERO_COLS:
            missing_indicators[f"{col}_missing"] = df_clean[col].isna().astype(float)

        df_clean[CLINICAL_ZERO_COLS] = self.imputer.transform(df_clean[CLINICAL_ZERO_COLS])
        feature_df = pd.concat([df_clean, missing_indicators], axis=1)
        scaled_features = self.scaler.transform(feature_df)
        return scaled_features, feature_df

    def _score_historical_dataset(self):
        """
        Scores all historical records, assigns risk bands, ranks queue,
        computes top factors, and prepares top-10 nurse notes.
        """
        scaled_features, feature_df = self._prepare_features(self.historical_df)
        probabilities = self.model.predict_proba(scaled_features)[:, 1]

        scored_records = []
        for idx in range(len(self.historical_df)):
            prob = float(probabilities[idx])
            risk_band = self._get_risk_band(prob)
            row_dict = self.historical_df.iloc[idx].to_dict()

            top_factors = self._compute_patient_top_factors(
                row_dict,
                feature_df.iloc[idx].to_dict()
            )

            rec_action = self._determine_action(risk_band, prob)

            scored_records.append({
                "patient_id": idx + 1,
                "patient_code": f"PID-{idx + 1:03d}",
                "pregnancies": int(row_dict["Pregnancies"]),
                "glucose": float(row_dict["Glucose"]),
                "blood_pressure": float(row_dict["BloodPressure"]),
                "skin_thickness": float(row_dict["SkinThickness"]),
                "insulin": float(row_dict["Insulin"]),
                "bmi": float(row_dict["BMI"]),
                "diabetes_pedigree_function": float(row_dict["DiabetesPedigreeFunction"]),
                "age": int(row_dict["Age"]),
                "outcome": int(row_dict["Outcome"]),
                "estimated_risk": round(prob, 4),
                "risk_band": risk_band,
                "top_factors": top_factors,
                "recommended_action": rec_action,
                "is_historical": True
            })

        # Rank all patients by risk probability descending
        scored_records.sort(key=lambda x: x["estimated_risk"], reverse=True)

        for rank, rec in enumerate(scored_records, 1):
            rec["queue_rank"] = rank
            rec["is_in_callback_queue"] = rank <= 100

            # Generate rule-based note for top-10 patients
            if rank <= 10:
                rec["nurse_note"] = generate_nurse_note(
                    glucose=rec["glucose"],
                    bmi=rec["bmi"],
                    age=rec["age"],
                    blood_pressure=rec["blood_pressure"],
                    pedigree=rec["diabetes_pedigree_function"],
                    pregnancies=rec["pregnancies"],
                    insulin=rec["insulin"],
                    skin_thickness=rec["skin_thickness"],
                    risk_band=rec["risk_band"]
                )
                rec["approval_status"] = "PENDING_APPROVAL"
                rec["review_status"] = "Pending"
            else:
                rec["nurse_note"] = None
                rec["approval_status"] = "PENDING_APPROVAL"
                rec["review_status"] = "Pending"

        self.historical_predictions = pd.DataFrame(scored_records)

    def _get_risk_band(self, probability: float) -> str:
        if probability >= 0.60:
            return "High Risk"
        elif probability >= 0.35:
            return "Moderate Risk"
        else:
            return "Low Risk"

    def _determine_action(self, risk_band: str, prob: float) -> str:
        if risk_band == "High Risk":
            return "Schedule nurse telephone callback; offer in-clinic confirmatory evaluation"
        elif risk_band == "Moderate Risk":
            return "Secondary callback tier; offer preventive wellness counseling & lifestyle intake"
        else:
            return "Routine preventive checkup; provide community health educational resources"

    def _compute_patient_top_factors(
        self,
        raw_row: Dict[str, Any],
        imputed_row: Dict[str, Any]
    ) -> List[RiskFactorDetail]:
        """
        Computes the top 3 contributing factors for this specific patient
        based on standardized deviation from clinic reference median
        weighted by the logistic model coefficient.
        """
        coef_dict = dict(zip(self.feature_names, self.model.coef_[0]))
        contributions = []

        for feat in FEATURE_COLS:
            val_raw = float(raw_row[feat])
            is_missing = (val_raw == 0 and feat in CLINICAL_ZERO_COLS)
            val_used = float(imputed_row[feat])

            w = coef_dict.get(feat, 0.0)
            mean_val = self.population_means[feat]
            std_val = self.population_stds[feat]

            z_score = (val_used - mean_val) / std_val
            linear_contrib = w * z_score

            # If missing, factor in the missing indicator contribution
            if is_missing:
                miss_feat = f"{feat}_missing"
                miss_w = coef_dict.get(miss_feat, 0.0)
                linear_contrib += miss_w

            benchmark_info = CLINICAL_BENCHMARKS.get(feat, {})
            unit = benchmark_info.get("unit", "")
            median = benchmark_info.get("median", 0.0)
            meaning = benchmark_info.get("meaning", "")

            # Determine clinical level and explanation
            if is_missing:
                level = "missing"
                display_val = "0 (Unrecorded)"
                clinical_note = (
                    f"Measurement unrecorded (zero) at baseline; imputed to clinic median {median:.1f} {unit}."
                )
            elif val_used > median:
                level = "high" if linear_contrib > 0.4 else "moderate"
                display_val = f"{val_used:.1f} {unit}" if feat != "Age" and feat != "Pregnancies" else f"{int(val_used)} {unit}"
                clinical_note = f"{val_used:.1f} vs clinic median {median:.1f} {unit}. {meaning}"
            else:
                level = "normal"
                display_val = f"{val_used:.1f} {unit}" if feat != "Age" and feat != "Pregnancies" else f"{int(val_used)} {unit}"
                clinical_note = f"Within standard clinic baseline ({val_used:.1f} {unit})."

            contributions.append({
                "factor": feat,
                "value": display_val,
                "unit": unit,
                "level": level,
                "benchmark": f"Clinic median: {median:.1f} {unit}",
                "clinical_note": clinical_note,
                "score": linear_contrib
            })

        # Sort by highest positive risk score contribution descending
        contributions.sort(key=lambda x: x["score"], reverse=True)

        # Select top 3
        top_3 = []
        for item in contributions[:3]:
            top_3.append(RiskFactorDetail(
                factor=item["factor"],
                value=item["value"],
                unit=item["unit"],
                level=item["level"],
                benchmark=item["benchmark"],
                clinical_note=item["clinical_note"]
            ))

        return top_3

    def predict_single_patient(self, inp: ScreeningInput, patient_id: str = "NEW-001") -> ScreeningResult:
        """
        Computes estimated diabetes risk probability for newly submitted patient values.
        Uses neutral, non-diagnostic clinical language.
        """
        if not self.is_fitted:
            self.fit()

        raw_dict = {
            "Pregnancies": inp.pregnancies,
            "Glucose": inp.glucose,
            "BloodPressure": inp.blood_pressure,
            "SkinThickness": inp.skin_thickness,
            "Insulin": inp.insulin,
            "BMI": inp.bmi,
            "DiabetesPedigreeFunction": inp.diabetes_pedigree_function,
            "Age": inp.age
        }
        df_single = pd.DataFrame([raw_dict])

        scaled_features, feature_df = self._prepare_features(df_single)
        prob = float(self.model.predict_proba(scaled_features)[0, 1])
        risk_band = self._get_risk_band(prob)

        top_factors = self._compute_patient_top_factors(
            raw_dict,
            feature_df.iloc[0].to_dict()
        )

        rec_action = self._determine_action(risk_band, prob)
        note = generate_nurse_note(
            glucose=inp.glucose,
            bmi=inp.bmi,
            age=inp.age,
            blood_pressure=inp.blood_pressure,
            pedigree=inp.diabetes_pedigree_function,
            pregnancies=inp.pregnancies,
            insulin=inp.insulin,
            skin_thickness=inp.skin_thickness,
            risk_band=risk_band
        )

        import datetime
        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        return ScreeningResult(
            patient_id=patient_id,
            estimated_risk_probability=round(prob, 4),
            risk_percentage=round(prob * 100, 1),
            risk_band=risk_band,
            top_risk_factors=top_factors,
            recommended_action=rec_action,
            suggested_nurse_note=note,
            approval_status="PENDING_APPROVAL",
            created_at=now_str
        )


# Global singleton instance
_model_instance = None

def get_model() -> MediSenseModel:
    global _model_instance
    if _model_instance is None:
        from backend.config import DATASET_PATH
        _model_instance = MediSenseModel(str(DATASET_PATH))
        _model_instance.fit()
    return _model_instance
