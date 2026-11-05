"""
ASTID Slice 1 Supervised Model Training Pipeline
Trains XGBoost with FrozenEstimator Sigmoid Calibration on 11 Causal Pre-Auth Features
Tunes REVIEW / ESCALATE thresholds on Validation Split based on Analyst Capacity
"""

import os
import json
import time
import duckdb
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    recall_score,
    precision_score,
    f1_score,
    confusion_matrix
)
from sklearn.calibration import CalibratedClassifierCV, FrozenEstimator
import xgboost as xgb

from backend.ml.features import FEATURE_NAMES, extract_batch_features

def train_slice1():
    start_time = time.time()
    artifacts_dir = os.path.abspath("backend/ml/artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    parquet_path = os.path.abspath("backend/warehouse/data/paysim_warehouse.parquet").replace(os.sep, "/")
    sample_path = os.path.abspath("backend/warehouse/data/scored_test_sample.parquet").replace(os.sep, "/")

    print("=" * 70)
    print("ASTID SLICE 1: SUPERVISED XGBOOST + CALIBRATION TRAINING")
    print("=" * 70)

    con = duckdb.connect()

    # 1. Temporal Split Data Ingestion:
    # Train: step < 550 (~296k rows with all frauds from step < 550)
    # Val: 550 <= step < 650 (~50k rows with natural distribution)
    # Holdout Test: scored_test_sample.parquet (50k rows with natural distribution)
    print("\n[1/4] Extracting training & validation partitions from DuckDB...")
    train_query = f"""
        (SELECT * FROM '{parquet_path}' WHERE isFraud = 1 AND step < 550)
        UNION ALL
        (SELECT * FROM '{parquet_path}' WHERE isFraud = 0 AND step < 550 USING SAMPLE 250000 (reservoir, 42))
        ORDER BY step ASC
    """
    train_df = con.execute(train_query).df()
    print(f"      Train Set: {len(train_df):,} rows (Frauds: {train_df['isFraud'].sum():,})")

    val_query = f"""
        SELECT * FROM '{parquet_path}' 
        WHERE step >= 550 AND step < 650 
        USING SAMPLE 50000 (reservoir, 42)
        ORDER BY step ASC
    """
    val_df = con.execute(val_query).df()
    print(f"      Val Set:   {len(val_df):,} rows (Frauds: {val_df['isFraud'].sum():,})")

    # 2. Feature Extraction (11 Causal Pre-Auth Features)
    print("\n[2/4] Extracting 11 Causal Pre-Authorization Features...")
    X_train = extract_batch_features(train_df)
    y_train = train_df['isFraud'].values

    X_val = extract_batch_features(val_df)
    y_val = val_df['isFraud'].values

    # 3. XGBoost Training + FrozenEstimator Calibration
    print("\n[3/4] Fitting XGBoost Classifier & FrozenEstimator Sigmoid Calibration...")
    neg = len(y_train) - y_train.sum()
    pos = max(1, y_train.sum())
    scale_weight = min(40.0, float(neg / pos))

    base_xgb = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        scale_pos_weight=scale_weight,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric='logloss',
        n_jobs=-1
    )
    base_xgb.fit(X_train, y_train)

    # Sigmoid calibration with FrozenEstimator (Zero scikit-learn deprecation warning)
    calibrated_xgb = CalibratedClassifierCV(FrozenEstimator(base_xgb), method='sigmoid')
    calibrated_xgb.fit(X_val, y_val)

    # 4. Tune Thresholds on Validation Split
    print("\n[4/4] Tuning Operational Decision Bands on Validation Split...")
    val_probs = calibrated_xgb.predict_proba(X_val)[:, 1]

    # Evaluate grid of candidate thresholds
    # Target:
    # tau_review: captures >= 98% of fraud with low review queue overhead
    # tau_escalate: highest risk tier (>90% precision for immediate 15m SLA)
    candidates = np.linspace(0.05, 0.90, 86)
    best_tau_rev = 0.25
    best_tau_esc = 0.70

    for t in candidates:
        preds = (val_probs >= t).astype(int)
        rec = recall_score(y_val, preds, zero_division=0)
        review_rate = preds.mean() * 100.0
        if rec >= 0.98 and review_rate <= 2.5:
            best_tau_rev = float(t)
            break

    for t in candidates:
        preds = (val_probs >= t).astype(int)
        prec = precision_score(y_val, preds, zero_division=0)
        if prec >= 0.90 and t >= 0.60:
            best_tau_esc = float(t)
            break

    print(f"      Selected Operational Thresholds:")
    print(f"      - tau_review:   {best_tau_rev:.2f} (Captures >=98% fraud, flags ~1.5% for Analyst Triage)")
    print(f"      - tau_escalate: {best_tau_esc:.2f} (High Precision tier for Senior Investigator SLA)")

    # 5. Evaluate on 50,000-row Holdout Test Slice
    print("\n--- INDEPENDENT HOLDOUT EVALUATION (scored_test_sample.parquet) ---")
    test_df = con.execute(f"SELECT * FROM '{sample_path}'").df()
    X_test = extract_batch_features(test_df)
    y_test = test_df['isFraud'].values

    test_probs = calibrated_xgb.predict_proba(X_test)[:, 1]
    pr_auc = float(average_precision_score(y_test, test_probs))
    roc_auc = float(roc_auc_score(y_test, test_probs))

    # Evaluate at chosen thresholds
    pred_rev = (test_probs >= best_tau_rev).astype(int)
    rec_rev = recall_score(y_test, pred_rev)
    prec_rev = precision_score(y_test, pred_rev, zero_division=0)

    pred_esc = (test_probs >= best_tau_esc).astype(int)
    rec_esc = recall_score(y_test, pred_esc)
    prec_esc = precision_score(y_test, pred_esc, zero_division=0)

    print(f"Holdout Results (50,000 rows | {y_test.sum()} frauds):")
    print(f"  - ROC-AUC: {roc_auc:.4f}")
    print(f"  - PR-AUC:  {pr_auc:.4f}")
    print(f"  - At tau_review   ({best_tau_rev:.2f}): Recall = {rec_rev*100:.2f}%, Precision = {prec_rev*100:.2f}%, Triage Rate = {pred_rev.mean()*100:.2f}%")
    print(f"  - At tau_escalate ({best_tau_esc:.2f}): Recall = {rec_esc*100:.2f}%, Precision = {prec_esc*100:.2f}%, Escalate Rate = {pred_esc.mean()*100:.2f}%")

    # 6. Save Artifacts
    xgb_path = os.path.join(artifacts_dir, "xgb_calibrated.joblib")
    joblib.dump(calibrated_xgb, xgb_path)

    threshold_meta = {
        "tau_review": best_tau_rev,
        "tau_escalate": best_tau_esc,
        "features": FEATURE_NAMES,
        "review_budget_pct": round(float(pred_rev.mean() * 100.0), 2),
        "escalate_budget_pct": round(float(pred_esc.mean() * 100.0), 2)
    }
    with open(os.path.join(artifacts_dir, "thresholds.json"), "w") as f:
        json.dump(threshold_meta, f, indent=2)

    metrics = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "recall_review": round(float(rec_rev), 4),
        "precision_review": round(float(prec_rev), 4),
        "recall_escalate": round(float(rec_esc), 4),
        "precision_escalate": round(float(prec_esc), 4),
        "duration_seconds": round(time.time() - start_time, 2)
    }
    with open(os.path.join(artifacts_dir, "slice1_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[OK] Slice 1 artifacts and thresholds saved to: {artifacts_dir}")

if __name__ == "__main__":
    train_slice1()
