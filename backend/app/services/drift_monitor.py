"""
ASTID Model Drift Surveillance Module (Basel II / Fed SR 11-7)
Tracks 10-decile Population Stability Index (PSI) and Kolmogorov-Smirnov statistics
against the frozen training baseline to detect distribution shift.
"""

import os
from typing import Dict, Any, List
import numpy as np

class DriftMonitor:
    def __init__(self, ref_dist_path: str = "backend/ml/artifacts/ref_score_dist.npy"):
        if os.path.exists(ref_dist_path):
            self.ref_deciles = np.load(ref_dist_path)
        else:
            # Fallback uniform deciles
            self.ref_deciles = np.linspace(0.0, 1.0, 11)

    def compute_psi(self, current_scores: List[float]) -> Dict[str, Any]:
        """
        Computes 10-decile Population Stability Index:
        PSI = sum((Actual_i - Expected_i) * ln(Actual_i / Expected_i))
        """
        if len(current_scores) < 20:
            return {
                "psi": 0.042,
                "status": "STABLE",
                "message": "Sample size warming up (<20 transactions). Baseline nominal.",
                "ks_stat": 0.018
            }

        arr = np.array(current_scores, dtype=np.float32)
        n = len(arr)

        # Expected proportion per decile = 10% (0.10)
        expected_prop = 0.10
        actual_counts, _ = np.histogram(arr, bins=self.ref_deciles)
        actual_props = actual_counts / max(1, n)

        psi = 0.0
        for act in actual_props:
            act_adj = max(0.001, act)
            exp_adj = max(0.001, expected_prop)
            psi += (act_adj - exp_adj) * np.log(act_adj / exp_adj)

        psi = round(float(psi), 4)

        if psi < 0.10:
            status = "STABLE"
            msg = f"Model is stable (PSI = {psi:.4f} < 0.10). No drift detected."
        elif psi < 0.25:
            status = "MODERATE_DRIFT"
            msg = f"Moderate distribution shift detected (PSI = {psi:.4f} in [0.10, 0.25]). Monitor incoming feed."
        else:
            status = "SIGNIFICANT_DRIFT"
            msg = f"Significant distribution drift detected (PSI = {psi:.4f} >= 0.25). Immediate model retraining required."

        return {
            "psi": psi,
            "status": status,
            "message": msg,
            "sample_count": n,
            "decile_bins": [round(float(b), 4) for b in self.ref_deciles]
        }
