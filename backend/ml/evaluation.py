"""
MediSense ML Evaluation Module
Implements leakage-free Stratified 5-Fold Cross-Validation,
physiologically impossible zero handling, missingness indicators,
and capacity-based evaluation metrics (Precision@100, Recall@100).
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    roc_auc_score,
    recall_score,
    precision_score,
    f1_score,
    average_precision_score,
    confusion_matrix
)

# Medically impossible zero fields in Pima Indians dataset
CLINICAL_ZERO_COLS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
VALID_ZERO_COLS = ["Pregnancies"]
ALL_FEATURE_COLS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age"
]

def preprocess_dataframe(df: pd.DataFrame, imputer=None, scaler=None, is_train: bool = True):
    """
    Transforms clinical columns:
    1. Replaces 0 with NaN only in CLINICAL_ZERO_COLS.
    2. Adds explicit missingness indicator columns.
    3. Imputes missing values using median (fit only on train).
    4. Scales features (fit only on train).
    """
    df_clean = df.copy()

    # 1. Replace 0 with NaN only for physiological metrics
    for col in CLINICAL_ZERO_COLS:
        if col in df_clean.columns:
            df_clean[col] = df_clean[col].replace(0, np.nan)

    # 2. Add missingness indicators
    missing_indicator_df = pd.DataFrame(index=df_clean.index)
    for col in CLINICAL_ZERO_COLS:
        if col in df_clean.columns:
            missing_indicator_df[f"{col}_missing"] = df_clean[col].isna().astype(float)

    # 3. Median imputation
    clinical_data = df_clean[CLINICAL_ZERO_COLS].copy()
    if is_train:
        imputer = SimpleImputer(strategy="median")
        imputed_clinical = imputer.fit_transform(clinical_data)
    else:
        imputed_clinical = imputer.transform(clinical_data)

    df_clean[CLINICAL_ZERO_COLS] = imputed_clinical

    # Combine imputed features + remaining features + missingness indicators
    feature_matrix = pd.concat([df_clean[ALL_FEATURE_COLS], missing_indicator_df], axis=1)

    # 4. Standard Scaler
    if is_train:
        scaler = StandardScaler()
        scaled_matrix = scaler.fit_transform(feature_matrix)
    else:
        scaled_matrix = scaler.transform(feature_matrix)

    scaled_df = pd.DataFrame(scaled_matrix, columns=feature_matrix.columns, index=df_clean.index)
    return scaled_df, feature_matrix, imputer, scaler


def run_cross_validation(data_path: str) -> Dict[str, Any]:
    """
    Executes a 5-fold Stratified Cross-Validation on the dataset.
    Ensures zero data leakage between training and validation folds.
    Returns comprehensive metrics for both Baseline (Logistic Regression)
    and Stronger Model (Random Forest), including capacity-tied Precision@100 and Recall@100.
    """
    df = pd.read_csv(data_path)
    X = df[ALL_FEATURE_COLS].copy()
    y = df["Outcome"].copy()

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    models_config = {
        "logistic_regression": {
            "name": "Logistic Regression (Interpretable Baseline)",
            "estimator": lambda: LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
            "use_scaled": True
        },
        "random_forest": {
            "name": "Random Forest Classifier (Non-linear Ensemble)",
            "estimator": lambda: RandomForestClassifier(n_estimators=100, max_depth=5, min_samples_split=4, class_weight="balanced", random_state=42),
            "use_scaled": False
        }
    }

    results = {
        key: {
            "name": cfg["name"],
            "roc_auc_folds": [],
            "pr_auc_folds": [],
            "recall_folds": [],
            "precision_folds": [],
            "f1_folds": [],
            "oof_probs": np.zeros(len(df)),
            "oof_preds": np.zeros(len(df)),
        }
        for key, cfg in models_config.items()
    }

    fold_details = []

    for fold_num, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_train, X_val = X.iloc[train_idx].copy(), X.iloc[val_idx].copy()
        y_train, y_val = y.iloc[train_idx].copy(), y.iloc[val_idx].copy()

        # Fit preprocessors strictly on training fold
        X_train_scaled, X_train_unscaled, imputer, scaler = preprocess_dataframe(X_train, is_train=True)
        X_val_scaled, X_val_unscaled, _, _ = preprocess_dataframe(X_val, imputer=imputer, scaler=scaler, is_train=False)

        fold_stat = {"fold": fold_num, "train_size": len(train_idx), "val_size": len(val_idx)}

        for key, cfg in models_config.items():
            model = cfg["estimator"]()
            if cfg["use_scaled"]:
                model.fit(X_train_scaled, y_train)
                val_probs = model.predict_proba(X_val_scaled)[:, 1]
            else:
                model.fit(X_train_unscaled, y_train)
                val_probs = model.predict_proba(X_val_unscaled)[:, 1]

            # Classification threshold 0.5 (or tuned for high recall)
            val_preds = (val_probs >= 0.5).astype(int)

            results[key]["oof_probs"][val_idx] = val_probs
            results[key]["oof_preds"][val_idx] = val_preds

            roc_auc = roc_auc_score(y_val, val_probs)
            pr_auc = average_precision_score(y_val, val_probs)
            recall = recall_score(y_val, val_preds)
            precision = precision_score(y_val, val_preds)
            f1 = f1_score(y_val, val_preds)

            results[key]["roc_auc_folds"].append(roc_auc)
            results[key]["pr_auc_folds"].append(pr_auc)
            results[key]["recall_folds"].append(recall)
            results[key]["precision_folds"].append(precision)
            results[key]["f1_folds"].append(f1)

        fold_details.append(fold_stat)

    # Compute aggregate summary
    total_positives = int(y.sum())
    summary = {
        "dataset_size": len(df),
        "total_positive_cases": total_positives,
        "positive_rate_pct": round(float(total_positives / len(df) * 100), 2),
        "k_folds": 5,
        "evaluation_strategy": "5-Fold Stratified Cross-Validation (No Preprocessing Leakage)",
        "models": {}
    }

    for key, cfg in models_config.items():
        oof_probs = results[key]["oof_probs"]
        oof_preds = results[key]["oof_preds"]

        # Capacity-tied metric: Top 100 patients ranked by predicted risk
        ranked_indices = np.argsort(-oof_probs)[:100]
        true_in_top100 = int(y.iloc[ranked_indices].sum())
        p_at_100 = float(true_in_top100 / 100.0)
        r_at_100 = float(true_in_top100 / total_positives)

        # Global out-of-fold confusion matrix at 0.5 threshold
        tn, fp, fn, tp = confusion_matrix(y, oof_preds).ravel()

        summary["models"][key] = {
            "name": cfg["name"],
            "roc_auc_mean": round(float(np.mean(results[key]["roc_auc_folds"])), 4),
            "roc_auc_std": round(float(np.std(results[key]["roc_auc_folds"])), 4),
            "pr_auc_mean": round(float(np.mean(results[key]["pr_auc_folds"])), 4),
            "pr_auc_std": round(float(np.std(results[key]["pr_auc_folds"])), 4),
            "recall_mean": round(float(np.mean(results[key]["recall_folds"])), 4),
            "recall_std": round(float(np.std(results[key]["recall_folds"])), 4),
            "precision_mean": round(float(np.mean(results[key]["precision_folds"])), 4),
            "precision_std": round(float(np.std(results[key]["precision_folds"])), 4),
            "f1_mean": round(float(np.mean(results[key]["f1_folds"])), 4),
            "f1_std": round(float(np.std(results[key]["f1_folds"])), 4),
            "capacity_metrics": {
                "queue_capacity": 100,
                "precision_at_100": round(p_at_100, 4),
                "recall_at_100": round(r_at_100, 4),
                "true_positives_in_top_100": true_in_top100,
                "false_positives_in_top_100": 100 - true_in_top100,
                "base_rate_comparison": f"{round(p_at_100 * 100, 1)}% vs clinic base rate {round(total_positives / len(df) * 100, 1)}% ({round(p_at_100 / (total_positives / len(df)), 2)}x enrichment)"
            },
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp)
            }
        }

    return summary


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(current_dir, "..", "data", "diabetes.csv")
    metrics = run_cross_validation(data_file)
    print(json.dumps(metrics, indent=2))
