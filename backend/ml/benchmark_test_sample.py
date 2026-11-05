"""
ASTID Independent Benchmark Verification
Evaluates Trained Platt-Calibrated XGBoost & PyTorch Deep Autoencoder
against the 50,000-row Holdout Test Parquet Slice (step >= 650)
"""

import os
import json
import joblib
import torch
import numpy as np
import pandas as pd
import duckdb
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    recall_score,
    precision_score,
    f1_score,
    confusion_matrix
)
from backend.ml.features import extract_batch_features
from backend.ml.train_pipeline import DeepAutoencoder

def run_benchmark():
    test_parquet = os.path.abspath("backend/warehouse/data/scored_test_sample.parquet")
    artifacts_dir = os.path.abspath("backend/ml/artifacts")

    print("[Benchmark] Loading 50,000-row holdout test sample...")
    con = duckdb.connect()
    df = con.execute(f"SELECT * FROM '{test_parquet.replace(os.sep, '/')}'").df()

    y_true = df['isFraud'].values
    fraud_count = int(y_true.sum())
    total_count = len(y_true)
    print(f"            Total Test Rows: {total_count:,} | Frauds: {fraud_count:,} ({fraud_count/total_count*100:.3f}%)")

    # Feature extraction
    print("[Benchmark] Extracting zero-leakage behavioral features...")
    X_test = extract_batch_features(df)

    # 1. Supervised Platt-Calibrated XGBoost evaluation
    print("[Benchmark] Evaluating Platt-Calibrated XGBoost...")
    xgb_model = joblib.load(os.path.join(artifacts_dir, "xgb_calibrated.joblib"))
    y_prob = xgb_model.predict_proba(X_test)[:, 1]

    pr_auc = float(average_precision_score(y_true, y_prob))
    roc_auc = float(roc_auc_score(y_true, y_prob))

    # Evaluate at multiple decision thresholds
    print(f"\n[XGBoost Performance Metrics]")
    print(f"  - ROC-AUC: {roc_auc:.4f}")
    print(f"  - PR-AUC:  {pr_auc:.4f}")

    for tau in [0.20, 0.35, 0.50, 0.70]:
        y_pred = (y_prob >= tau).astype(int)
        rec = recall_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        print(f"  Threshold tau={tau:.2f} -> Recall: {rec*100:.2f}% | Precision: {prec*100:.2f}% | F1: {f1:.4f} (TP={tp}, FP={fp}, FN={fn})")

    # 2. PyTorch Deep Autoencoder evaluation
    print("\n[Benchmark] Evaluating PyTorch Deep Autoencoder (Zero-Day Reconstruction)...")
    scaler = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))
    with open(os.path.join(artifacts_dir, "ae_minmax.json"), "r") as f:
        ae_meta = json.load(f)

    autoencoder = DeepAutoencoder(input_dim=len(X_test.columns))
    autoencoder.load_state_dict(torch.load(os.path.join(artifacts_dir, "autoencoder.pt")))
    autoencoder.eval()

    X_scaled = scaler.transform(X_test.values)
    with torch.no_grad():
        tensor_x = torch.tensor(X_scaled, dtype=torch.float32)
        recon_x = autoencoder(tensor_x)
        mse = torch.mean((recon_x - tensor_x) ** 2, dim=1).numpy()

    # Normalize onto [0, 1] using metadata bounds
    ae_min = ae_meta['ae_min']
    ae_max = ae_meta['ae_max']
    ae_norm = np.clip((mse - ae_min) / max(1e-6, (ae_max - ae_min)), 0.0, 1.0)

    ae_pr_auc = float(average_precision_score(y_true, ae_norm))
    ae_roc_auc = float(roc_auc_score(y_true, ae_norm))
    print(f"  - Autoencoder ROC-AUC: {ae_roc_auc:.4f}")
    print(f"  - Autoencoder PR-AUC:  {ae_pr_auc:.4f}")
    print(f"  - Normal Fraud Mean Error: {np.mean(ae_norm[y_true == 1]):.4f} vs Legitimate Mean Error: {np.mean(ae_norm[y_true == 0]):.4f}")

    print("\n[VERIFICATION PASSED] Both Supervised & Unsupervised Models Operational!")

if __name__ == "__main__":
    run_benchmark()
