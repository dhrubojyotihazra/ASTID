"""
ASTID Real-Time Scoring Service (Sub-15ms Pre-Authorization SLA)
Orchestrates Fast-Path Rules, Single Shared Feature Extractor, Calibrated GBDT,
and selective TreeSHAP badge generation (Review/Escalate only).
"""

import os
import json
import time
import uuid
import joblib
import numpy as np
from typing import Dict, Any, Tuple, Optional

from backend.ml.features import extract_live_features
from backend.ml.explain import explainer_instance
from backend.ml.autoencoder import ae_scorer_instance
from backend.app.services.rules_engine import RulesEngine
from backend.app.services.cache import cache_instance
from backend.app.services.geo_velocity import GeoVelocityChecker, BRANCH_COORDINATES

class ScoringService:
    def __init__(self, artifacts_dir: str = "backend/ml/artifacts"):
        self.artifacts_dir = os.path.abspath(artifacts_dir)
        self.rules_engine = RulesEngine()
        self.geo_checker = GeoVelocityChecker()
        self.cache = cache_instance
        self.ae_scorer = ae_scorer_instance

        # Load Calibrated XGBoost
        xgb_path = os.path.join(self.artifacts_dir, "xgb_calibrated.joblib")
        if os.path.exists(xgb_path):
            self.model = joblib.load(xgb_path)
        else:
            self.model = None

        # Load Tuned Thresholds
        thresh_path = os.path.join(self.artifacts_dir, "thresholds.json")
        if os.path.exists(thresh_path):
            with open(thresh_path, "r") as f:
                thresh_data = json.load(f)
                self.tau_review = float(thresh_data.get("tau_review", 0.05))
                self.tau_escalate = float(thresh_data.get("tau_escalate", 0.60))
        else:
            self.tau_review = 0.05
            self.tau_escalate = 0.60

    def score_transaction(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        start_t = time.time()
        tx_id = tx.get("transaction_id") or str(uuid.uuid4())
        orig = str(tx.get("nameOrig", ""))
        amount = float(tx.get("amount", 0.0))

        # 1. Update in-memory sliding velocity window
        velocity_state = self.cache.increment_velocity(orig)

        # 2. Check Geo-Velocity Anomaly (Impossible Travel)
        geo_lat = tx.get("geo_lat")
        geo_lon = tx.get("geo_lon")
        geo_boost = 0.0
        geo_badge = ""

        if geo_lat is not None and geo_lon is not None:
            last_geo_key = f"geo:{orig}"
            prev_geo = self.cache.get(last_geo_key)
            if prev_geo:
                prev_coords, prev_t = prev_geo
                hours_diff = (start_t - prev_t) / 3600.0
                is_geo_anom, speed, geo_boost, geo_badge = self.geo_checker.check(
                    (float(geo_lat), float(geo_lon)),
                    prev_coords,
                    hours_diff
                )
            self.cache.set(last_geo_key, ((float(geo_lat), float(geo_lon)), start_t), ttl_seconds=86400)

        # 3. Deterministic Rules Layer
        rule_res = self.rules_engine.evaluate(tx, account_state=velocity_state)

        # Immediate Autonomous Hard Block on confirmed blacklist
        if rule_res.is_blacklisted:
            duration_ms = (time.time() - start_t) * 1000.0
            return {
                "transaction_id": tx_id,
                "amount": amount,
                "final_verdict": "BLOCK",
                "risk_score": 1.0,
                "confidence_tier": "CRITICAL",
                "primary_reason": rule_res.primary_reason,
                "whitebox_insights": [{"badge": "Blacklist Match", "explanation": rule_res.primary_reason, "impact_score": "+1.00"}],
                "matched_rules": rule_res.matched_rules,
                "scoring_latency_ms": round(duration_ms, 2)
            }

        # 4. Single Shared Feature Extraction (11 Causal Pre-Auth Features)
        feat_vec = extract_live_features(tx)

        # 5. Supervised Model Inference
        if self.model is not None:
            raw_prob = float(self.model.predict_proba(feat_vec.reshape(1, -1))[0, 1])
        else:
            raw_prob = 0.01

        # Apply rule/geo boosts
        combined_score = min(1.0, max(0.0, raw_prob + rule_res.soft_flag_boost + geo_boost))
        combined_score = round(combined_score, 4)

        # 6. Zero-Day Autoencoder Inference (Slice 2)
        ae_score, ae_mse, ae_severity = self.ae_scorer.score(feat_vec)

        # 7. Map to Decision Bands with Disjunctive Gating
        insights = []
        ae_escalated = False

        if rule_res.critical_hit:
            verdict = "ESCALATE"
            primary_reason = f"Critical Rule: {rule_res.primary_reason}"
        elif combined_score >= self.tau_escalate:
            verdict = "ESCALATE"
            primary_reason = f"Severe Risk Signature (Score {combined_score:.2f} >= {self.tau_escalate:.2f})"
        elif ae_severity == "SEVERE_ZERO_DAY":
            verdict = "ESCALATE"
            ae_escalated = True
            primary_reason = f"Zero-Day Anomaly: Extreme Manifold Deviation (AE Score {ae_score:.2f} >= 0.90)"
        elif combined_score >= self.tau_review:
            verdict = "REVIEW"
            primary_reason = f"Elevated Risk Anomaly (Score {combined_score:.2f} >= {self.tau_review:.2f})"
        elif ae_severity == "NOVEL_PATTERN":
            verdict = "REVIEW"
            ae_escalated = True
            primary_reason = f"Novel Anomaly Pattern: Reconstruction Outlier (AE Score {ae_score:.2f} >= 0.70)"
        else:
            verdict = "APPROVE"
            primary_reason = "Transaction Cleared Within Normal Parameters"

        # 8. TreeSHAP Top-3 Badges: Generated ONLY on REVIEW or ESCALATE (Fast Path optimization!)
        if verdict in ("REVIEW", "ESCALATE"):
            insights = explainer_instance.explain(feat_vec, top_k=3)
            if geo_badge:
                insights.insert(0, {"badge": "Impossible Travel", "explanation": geo_badge, "impact_score": "+0.35"})
            if ae_escalated or ae_score >= 0.50:
                insights.insert(0, {
                    "badge": "Zero-Day Anomaly",
                    "explanation": f"Autoencoder reconstruction error ({ae_mse:.3f}) deviates from normal banking baseline",
                    "impact_score": f"+{ae_score:.2f}"
                })

        duration_ms = (time.time() - start_t) * 1000.0

        return {
            "transaction_id": tx_id,
            "amount": amount,
            "name_orig": orig,
            "name_dest": str(tx.get("nameDest", "")),
            "final_verdict": verdict,
            "risk_score": combined_score,
            "zero_day_ae_score": ae_score,
            "ae_raw_mse": ae_mse,
            "confidence_tier": "HIGH" if verdict == "ESCALATE" else "MODERATE" if verdict == "REVIEW" else "LOW",
            "primary_reason": primary_reason,
            "whitebox_insights": insights,
            "matched_rules": rule_res.matched_rules,
            "scoring_latency_ms": round(duration_ms, 2)
        }

# Singleton instance
scoring_instance = ScoringService()
