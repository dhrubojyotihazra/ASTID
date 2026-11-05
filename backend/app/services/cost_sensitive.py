"""
ASTID Cost-Sensitive Dynamic Threshold Evaluator
Applies Bayes Minimum Risk Theory to compute amount-weighted optimal cutoffs tau*(x).
High-value transfers trigger review at lower thresholds; low-value payments clear friction-free.
"""

from typing import Tuple

class CostSensitiveEvaluator:
    def __init__(
        self,
        cost_review: float = 150.0,
        cost_friction: float = 200.0,
        chargeback_fee: float = 1500.0,
        interchange_margin: float = 0.015
    ):
        """
        Default banking parameters in INR (₹):
        - cost_review: Cost of manual analyst triage per transaction (~₹150)
        - cost_friction: Goodwill loss when legitimate customer gets blocked (~₹200)
        - chargeback_fee: Bank penalty paid on confirmed chargeback (~₹1,500)
        - interchange_margin: Lost interchange fee rate (1.5%)
        """
        self.c_review = cost_review
        self.c_friction = cost_friction
        self.c_fee = chargeback_fee
        self.interchange = interchange_margin

    def get_dynamic_threshold(self, amount: float) -> float:
        """
        Computes Bayes optimal cutoff tau*(x):
        C_FP = c_review + c_friction + (interchange * amount)
        C_FN = amount + c_fee
        tau*(x) = C_FP / (C_FP + C_FN)
        """
        amt = max(0.0, float(amount))
        c_fp = self.c_review + self.c_friction + (self.interchange * amt)
        c_fn = amt + self.c_fee
        optimal_tau = c_fp / (c_fp + c_fn)

        # Bound cutoff between 0.01 and 0.85
        return round(max(0.01, min(0.85, optimal_tau)), 4)

    def apply(self, amount: float, combined_score: float, static_verdict: str) -> Tuple[str, float]:
        """
        Applies economic cutoff to transaction.
        If combined_score >= tau*(x) but static band said APPROVE, overrides to REVIEW.
        """
        tau = self.get_dynamic_threshold(amount)
        if static_verdict == "APPROVE" and combined_score >= tau:
            return "REVIEW", tau
        return static_verdict, tau
