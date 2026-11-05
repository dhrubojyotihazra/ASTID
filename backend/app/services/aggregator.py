"""
ASTID Disjunctive Gating Score Aggregator
Eliminates zero-day dilution by allowing high-confidence detectors to escape to ESCALATE.
"""

from typing import Tuple
from backend.app.services.rules_engine import RuleResult

def aggregate_score(
    rules_result: RuleResult,
    xgb_prob: float,
    ae_mse: float,
    ae_min: float,
    ae_max: float,
    geo_velocity_boost: float = 0.0
) -> Tuple[str, float, str]:
    """
    Combines rule signals, supervised GBDT, and unsupervised Autoencoder.
    Returns: (verdict: str, combined_score: float, primary_reason: str)
    """
    # 1. Critical Hard Rule: Confirmed Blacklist Match -> Autonomous BLOCK
    if rules_result.is_blacklisted:
        return "BLOCK", 1.0, rules_result.primary_reason

    # 2. Critical Rule Override -> Immediate ESCALATE
    if rules_result.critical_hit:
        return "ESCALATE", 0.95, f"Critical Rule Override: {rules_result.primary_reason}"

    # 3. Normalize Autoencoder MSE onto [0, 1] scale
    ae_norm = max(0.0, min(1.0, (ae_mse - ae_min) / max(1e-6, (ae_max - ae_min))))

    # 4. Disjunctive Model Gating (Specialized Detector Escapes)
    # If supervised model has extreme confidence in known fraud pattern:
    if xgb_prob >= 0.85:
        combined = max(0.75, float(xgb_prob))
        return "ESCALATE", round(combined, 4), f"Supervised High Confidence Fraud Signature (p={xgb_prob:.2f})"

    # If unsupervised autoencoder detects severe zero-day reconstruction novelty:
    if ae_norm >= 0.90:
        combined = max(0.75, float(ae_norm))
        return "ESCALATE", round(combined, 4), f"Unsupervised Severe Zero-Day Anomaly (AE Norm={ae_norm:.2f})"

    # 5. Weighted Combination for moderate multi-signal cases
    combined = (0.60 * float(xgb_prob)) + (0.40 * ae_norm) + rules_result.soft_flag_boost + geo_velocity_boost
    combined = round(min(1.0, max(0.0, combined)), 4)

    # 6. Final Decision Routing Bands
    if combined < 0.30:
        verdict = "APPROVE"
    elif combined < 0.70:
        verdict = "REVIEW"
    else:
        verdict = "ESCALATE"

    return verdict, combined, rules_result.primary_reason
