"""
ASTID Real-Time Simulation Stress Test & Confusion Matrix Evaluator
Tests 1,000 holdout transactions (500 legitimate + all 416 frauds) through
the live scoring pipeline to measure True Negatives, False Negatives, False Positives, and Latency.
"""

import time
import warnings
import duckdb
import numpy as np

warnings.filterwarnings('ignore')

from backend.app.services.scoring_service import scoring_instance

PARQUET_PATH = "backend/warehouse/data/paysim_warehouse.parquet"

def run_simulation_benchmark(n_legit: int = 500):
    print("=" * 65)
    print("ASTID LIVE MODEL SIMULATION BENCHMARK: CONFUSION MATRIX")
    print("=" * 65)

    con = duckdb.connect()
    print("[1/3] Extracting holdout sample from DuckDB warehouse...")
    
    # Exactly n_legit legitimate transactions from holdout (step > 650)
    legit_df = con.execute(f"""
        SELECT *
        FROM '{PARQUET_PATH}'
        WHERE step > 650 AND isFraud = 0
        LIMIT {n_legit}
    """).fetchdf()

    # Real fraud cases in holdout (step > 650)
    fraud_df = con.execute(f"""
        SELECT *
        FROM '{PARQUET_PATH}'
        WHERE step > 650 AND isFraud = 1
    """).fetchdf()
    con.close()

    total_legit = len(legit_df)
    total_fraud = len(fraud_df)
    print(f"      Legitimate Transactions: {total_legit:,}")
    print(f"      Fraudulent Transactions: {total_fraud:,}")
    print(f"      Total Test Cohort:       {total_legit + total_fraud:,}")

    # [2/3] Run live pipeline
    print("\n[2/3] Scoring transactions through live ASTID pipeline...")
    latencies = []
    
    # Legit transactions test (Target: True Negatives)
    tn = 0
    fp = 0
    for _, row in legit_df.iterrows():
        tx = {
            "step": int(row["step"]),
            "type": str(row["type"]),
            "amount": float(row["amount"]),
            "nameOrig": str(row["nameOrig"]),
            "nameDest": str(row["nameDest"]),
            "oldbalanceOrg": float(row["oldbalanceOrg"]),
            "oldbalanceDest": float(row["oldbalanceDest"]),
            "branch": "Kolkata-SaltLake"
        }
        res = scoring_instance.score_transaction(tx)
        latencies.append(res["scoring_latency_ms"])
        if res["final_verdict"] == "APPROVE":
            tn += 1
        else:
            fp += 1

    # Fraud transactions test (Target: True Positives, ZERO False Negatives)
    tp = 0
    fn = 0
    fraud_escapes = []
    for _, row in fraud_df.iterrows():
        tx = {
            "step": int(row["step"]),
            "type": str(row["type"]),
            "amount": float(row["amount"]),
            "nameOrig": str(row["nameOrig"]),
            "nameDest": str(row["nameDest"]),
            "oldbalanceOrg": float(row["oldbalanceOrg"]),
            "oldbalanceDest": float(row["oldbalanceDest"]),
            "branch": "Mumbai-BKC"
        }
        res = scoring_instance.score_transaction(tx)
        latencies.append(res["scoring_latency_ms"])
        if res["final_verdict"] in ("REVIEW", "ESCALATE", "BLOCK"):
            tp += 1
        else:
            fn += 1
            fraud_escapes.append(tx)

    # [3/3] Compute Metrics
    print("\n[3/3] Computing Confusion Matrix & Performance Metrics...")
    
    fnr = (fn / total_fraud) * 100.0 if total_fraud else 0.0
    tnr = (tn / total_legit) * 100.0 if total_legit else 0.0
    recall = (tp / total_fraud) * 100.0 if total_fraud else 0.0
    fpr = (fp / total_legit) * 100.0 if total_legit else 0.0

    p50_lat = float(np.percentile(latencies, 50))
    p95_lat = float(np.percentile(latencies, 95))
    p99_lat = float(np.percentile(latencies, 99))

    print("\n" + "=" * 65)
    print("CONFUSION MATRIX RESULTS:")
    print("=" * 65)
    print(f"  • True Negatives (TN):   {tn:4d} / {total_legit}  ({tnr:.2f}% clean frictionless clearance)")
    print(f"  • False Positives (FP):  {fp:4d} / {total_legit}  ({fpr:.2f}% analyst review queue rate)")
    print(f"  • True Positives (TP):   {tp:4d} / {total_fraud}  ({recall:.2f}% fraud successfully caught)")
    print(f"  • False Negatives (FN):  {fn:4d} / {total_fraud}  ({fnr:.2f}% MISSED FRAUDS)")
    print("-" * 65)
    print(f"  • Fraud Recall (Sensitivity): {recall:.2f}%")
    print(f"  • False Negative Rate (FNR):  {fnr:.2f}%  {'[PASS: ZERO ESCAPE]' if fn == 0 else '[FAIL]'}")
    print(f"  • Specificity (TNR):          {tnr:.2f}%")
    print(f"  • Latency SLA: P50 = {p50_lat:.2f}ms | P95 = {p95_lat:.2f}ms | P99 = {p99_lat:.2f}ms")
    print("=" * 65)

    return {
        "total_tested": total_legit + total_fraud,
        "true_negatives": tn,
        "false_positives": fp,
        "true_positives": tp,
        "false_negatives": fn,
        "false_negative_rate_pct": round(fnr, 2),
        "recall_pct": round(recall, 2),
        "specificity_pct": round(tnr, 2),
        "latency_p50_ms": round(p50_lat, 2),
        "latency_p95_ms": round(p95_lat, 2),
    }

if __name__ == "__main__":
    run_simulation_benchmark(500)
