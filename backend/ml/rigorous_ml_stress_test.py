"""
ASTID Rigorous Machine Learning Stress Test Suite
Evaluates both Supervised XGBoost (calibrated) and Unsupervised PyTorch Autoencoder (zero-day detector)
across Known Fraud Patterns, Legitimate Baselines, and Unknown Zero-Day Anomaly Vectors.
"""

import os
import sys
import time
import json
import numpy as np
from tabulate import tabulate

from backend.app.services.scoring_service import scoring_instance

def run_ml_stress_tests():
    print("=" * 80)
    print("ASTID ML STRESS TEST: KNOWN PATTERNS & ZERO-DAY ANOMALY VECTORS")
    print("=" * 80)

    print(f"Scoring Service Initialized: {scoring_instance is not None}")
    print(f"Base Model: {'XGBoost Calibrated (Slice 1)' if scoring_instance.model else 'None'}")
    print(f"Zero-Day Autoencoder: {'Loaded' if scoring_instance.ae_scorer else 'None'}")
    if scoring_instance.ae_scorer:
        print(f"AE Threshold Tau (99.9%): {scoring_instance.ae_scorer.error_norm_p99_9:.6f}")
    print(f"Operational Gating Thresholds: REVIEW >= {scoring_instance.tau_review}, ESCALATE >= {scoring_instance.tau_escalate}")
    print("-" * 80)

    test_vectors = [
        # --- KNOWN FRAUD PATTERNS ---
        {
            "category": "KNOWN FRAUD",
            "name": "Script Storm: 100% Balance Drain via TRANSFER",
            "tx": {
                "step": 680,
                "type": "TRANSFER",
                "amount": 500000.0,
                "nameOrig": "C109923812",
                "oldbalanceOrg": 500000.0,
                "nameDest": "C991204812",
                "oldbalanceDest": 0.0,
                "branch": "Kolkata-SaltLake"
            },
            "expected_verdict": ["ESCALATE", "BLOCK"],
            "expected_primary_engine": "XGBoost + Rules"
        },
        {
            "category": "KNOWN FRAUD",
            "name": "Mule Liquidation: Rapid CASH_OUT to Burner Mule",
            "tx": {
                "step": 685,
                "type": "CASH_OUT",
                "amount": 250000.0,
                "nameOrig": "C551209381",
                "oldbalanceOrg": 250000.0,
                "nameDest": "C661029384",
                "oldbalanceDest": 0.0,
                "branch": "Mumbai-BKC"
            },
            "expected_verdict": ["ESCALATE", "BLOCK"],
            "expected_primary_engine": "XGBoost"
        },
        {
            "category": "KNOWN FRAUD",
            "name": "Off-Hours Mule Drain (3:00 AM TRANSFER)",
            "tx": {
                "step": 675, # 675 % 24 = 3 AM
                "type": "TRANSFER",
                "amount": 320000.0,
                "nameOrig": "C771203912",
                "oldbalanceOrg": 340000.0,
                "nameDest": "C881029381",
                "oldbalanceDest": 0.0,
                "branch": "Bengaluru-HSR"
            },
            "expected_verdict": ["REVIEW", "ESCALATE", "BLOCK"],
            "expected_primary_engine": "XGBoost + Rules"
        },
        {
            "category": "KNOWN FRAUD",
            "name": "Blacklisted Counterparty Rule Match",
            "tx": {
                "step": 690,
                "type": "TRANSFER",
                "amount": 15000.0,
                "nameOrig": "C129031203",
                "oldbalanceOrg": 50000.0,
                "nameDest": "M_OFFSHORE_BET", # Blacklisted
                "oldbalanceDest": 0.0,
                "branch": "Delhi-Connaught"
            },
            "expected_verdict": ["ESCALATE", "BLOCK"],
            "expected_primary_engine": "Rules Hard Escalation"
        },
        {
            "category": "KNOWN FRAUD",
            "name": "Impossible Geo-Velocity Travel (1,450 km/h)",
            "prime_geo": {
                "account": "C998123012",
                "coords": (13.0067, 80.2025), # Chennai
                "time_offset_s": 300.0         # 5 mins ago
            },
            "tx": {
                "step": 692,
                "type": "PAYMENT",
                "amount": 4500.0,
                "nameOrig": "C998123012",
                "oldbalanceOrg": 25000.0,
                "nameDest": "M_DELHI_STORE",
                "oldbalanceDest": 0.0,
                "geo_lat": 28.6139, # Delhi
                "geo_lon": 77.2090,
                "branch": "Delhi-Connaught"
            },
            "expected_verdict": ["REVIEW", "ESCALATE", "BLOCK"],
            "expected_primary_engine": "Rule Impossible Travel"
        },

        # --- LEGITIMATE PATTERNS (TRUE NEGATIVES) ---
        {
            "category": "LEGITIMATE BASELINE",
            "name": "Everyday Merchant Coffee UPI (Rs. 180)",
            "tx": {
                "step": 690, # 690 % 24 = 18 (6 PM)
                "type": "PAYMENT",
                "amount": 180.0,
                "nameOrig": "C123891024",
                "oldbalanceOrg": 45000.0,
                "nameDest": "M991823019",
                "oldbalanceDest": 0.0,
                "branch": "Bengaluru-HSR"
            },
            "expected_verdict": ["APPROVE"],
            "expected_primary_engine": "Frictionless Clearance"
        },
        {
            "category": "LEGITIMATE BASELINE",
            "name": "Partial Non-Draining Peer Transfer (Rs. 5,000 / 250,000 bal)",
            "tx": {
                "step": 700,
                "type": "TRANSFER",
                "amount": 5000.0,
                "nameOrig": "C223401923",
                "oldbalanceOrg": 250000.0,
                "nameDest": "C334509123",
                "oldbalanceDest": 150000.0, # Established counterparty
                "branch": "Mumbai-BKC"
            },
            "expected_verdict": ["APPROVE", "REVIEW"],
            "expected_primary_engine": "Non-Escalated Band"
        },
        {
            "category": "LEGITIMATE BASELINE",
            "name": "Salary / Liquidity Injection (CASH_IN Rs. 120,000)",
            "tx": {
                "step": 695,
                "type": "CASH_IN",
                "amount": 120000.0,
                "nameOrig": "C881293812",
                "oldbalanceOrg": 15000.0,
                "nameDest": "C992381203",
                "oldbalanceDest": 50000.0,
                "branch": "Kolkata-SaltLake"
            },
            "expected_verdict": ["APPROVE"],
            "expected_primary_engine": "Frictionless Clearance"
        },

        # --- UNKNOWN / ZERO-DAY ANOMALY VECTORS ---
        {
            "category": "ZERO-DAY ANOMALY",
            "name": "Out-of-Distribution Massive DEBIT (Rs. 892,147)",
            "tx": {
                "step": 705,
                "type": "DEBIT",
                "amount": 892147.23,
                "nameOrig": "C331294812",
                "oldbalanceOrg": 920000.0,
                "nameDest": "C441029481",
                "oldbalanceDest": 4200.0,
                "branch": "Mumbai-BKC"
            },
            "expected_verdict": ["REVIEW", "ESCALATE", "BLOCK"],
            "expected_primary_engine": "Autoencoder Reconstruction Loss"
        },
        {
            "category": "ZERO-DAY ANOMALY",
            "name": "High-Entropy Fractional Flurry (Rs. 99,999.71 at 4 AM via DEBIT)",
            "tx": {
                "step": 676, # 4 AM
                "type": "DEBIT",
                "amount": 99999.71,
                "nameOrig": "C449120391",
                "oldbalanceOrg": 100500.0,
                "nameDest": "C551203918",
                "oldbalanceDest": 15.0,
                "branch": "Delhi-Connaught"
            },
            "expected_verdict": ["REVIEW", "ESCALATE", "BLOCK"],
            "expected_primary_engine": "Autoencoder High MSE"
        },
        {
            "category": "ZERO-DAY ANOMALY",
            "name": "Extreme Wealth Outlier Transfer (Rs. 15,000,000.00)",
            "tx": {
                "step": 710,
                "type": "TRANSFER",
                "amount": 15000000.0,
                "nameOrig": "C990129381",
                "oldbalanceOrg": 15200000.0,
                "nameDest": "C110293812",
                "oldbalanceDest": 0.0,
                "branch": "Mumbai-BKC"
            },
            "expected_verdict": ["ESCALATE", "BLOCK"],
            "expected_primary_engine": "Disjunctive (Both Engines)"
        },
        {
            "category": "ZERO-DAY ANOMALY",
            "name": "Adversarial Structured Transfer with Artificial Counterparty Cushion",
            "tx": {
                "step": 688,
                "type": "TRANSFER",
                "amount": 185000.0,
                "nameOrig": "C661209381",
                "oldbalanceOrg": 190000.0,
                "nameDest": "C771029384",
                "oldbalanceDest": 5000.0, # Tiny cushion to evade dest_zero rule
                "branch": "Chennai-Guindy"
            },
            "expected_verdict": ["REVIEW", "ESCALATE", "BLOCK"],
            "expected_primary_engine": "XGBoost + Autoencoder"
        }
    ]

    results_table = []
    latencies = []
    passed = 0
    total = len(test_vectors)

    for tv in test_vectors:
        if "prime_geo" in tv:
            pg = tv["prime_geo"]
            scoring_instance.cache.set(f"geo:{pg['account']}", (pg["coords"], time.time() - pg["time_offset_s"]), ttl_seconds=86400)

        t0 = time.perf_counter()
        score_res = scoring_instance.score_transaction(tv["tx"])
        t1 = time.perf_counter()
        lat_ms = (t1 - t0) * 1000.0
        latencies.append(lat_ms)

        verdict = score_res["final_verdict"]
        xgb_prob = score_res.get("calibrated_xgb_prob", score_res.get("risk_score", 0.0))
        ae_score = score_res.get("zero_day_ae_score", 0.0)
        ae_mse = score_res.get("ae_raw_mse", 0.0)
        rules_hit = [f"{r['rule_name']}" for r in score_res.get("rule_hits", [])]

        is_match = verdict in tv["expected_verdict"]
        if is_match:
            passed += 1

        results_table.append([
            tv["category"][:12],
            tv["name"][:32],
            f"Rs. {tv['tx']['amount']:,.0f}",
            f"{xgb_prob:.3f}",
            f"{ae_score:.3f} ({ae_mse:.4f})",
            ", ".join(rules_hit) if rules_hit else "None",
            verdict,
            f"{lat_ms:.2f}ms",
            "[PASS]" if is_match else "[FAIL]"
        ])

    headers = [
        "Category", "Scenario Name", "Amount", "XGB Prob",
        "AE Score (MSE)", "Rule Hits", "Verdict", "Latency", "Status"
    ]
    print(tabulate(results_table, headers=headers, tablefmt="fancy_grid"))

    print("\n" + "=" * 80)
    print(f"STRESS TEST SUMMARY: {passed}/{total} scenarios PASSED ({passed/total*100:.1f}%)")
    print(f"Latency Profile: min={min(latencies):.2f}ms, avg={np.mean(latencies):.2f}ms, "
          f"p95={np.percentile(latencies, 95):.2f}ms, max={max(latencies):.2f}ms")
    print("=" * 80)

    # Save results to json for reporting
    summary = {
        "passed": passed,
        "total": total,
        "pass_rate_pct": round(passed / total * 100.0, 2),
        "latencies": {
            "min_ms": round(float(min(latencies)), 2),
            "avg_ms": round(float(np.mean(latencies)), 2),
            "p95_ms": round(float(np.percentile(latencies, 95)), 2),
            "max_ms": round(float(max(latencies)), 2)
        },
        "records": [
            {
                "category": r[0],
                "scenario": r[1],
                "amount": r[2],
                "xgb_prob": r[3],
                "ae_score": r[4],
                "rules": r[5],
                "verdict": r[6],
                "latency": r[7],
                "status": r[8]
            }
            for r in results_table
        ]
    }
    with open("backend/ml/ml_stress_test_report.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("Test report written to backend/ml/ml_stress_test_report.json")
    return passed == total

if __name__ == "__main__":
    success = run_ml_stress_tests()
    sys.exit(0 if success else 1)
