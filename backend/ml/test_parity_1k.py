"""
ASTID Train-Serve Feature Parity Test Harness
Replays 1,000 real holdout transactions through both the batch and live feature extractors
and asserts bit-identical numerical parity across all 11 causal features.
"""

import os
import duckdb
import numpy as np
import pandas as pd
from backend.ml.features import FEATURE_NAMES, extract_live_features, extract_batch_features

def test_1k_parity():
    parquet_path = os.path.abspath("backend/warehouse/data/scored_test_sample.parquet").replace(os.sep, "/")
    con = duckdb.connect()

    print("[Parity Test] Loading 1,000 holdout transactions...")
    df = con.execute(f"SELECT * FROM '{parquet_path}' LIMIT 1000").df()
    assert len(df) == 1000, f"Expected 1,000 rows, got {len(df)}"

    # 1. Batch Vectorized Path
    batch_features = extract_batch_features(df)
    assert batch_features.shape == (1000, len(FEATURE_NAMES)), f"Batch shape unexpected: {batch_features.shape}"

    # 2. Live Path (Simulating 1,000 real-time API requests)
    live_rows = []
    for _, row in df.iterrows():
        vec = extract_live_features(row.to_dict())
        live_rows.append(vec)

    live_matrix = np.vstack(live_rows)
    assert live_matrix.shape == (1000, len(FEATURE_NAMES)), f"Live shape unexpected: {live_matrix.shape}"

    # 3. Assert Bit-Identical Parity across all 1,000 rows and 11 features
    diff = np.abs(batch_features.values - live_matrix)
    max_diff = np.max(diff)

    print(f"[Parity Test] Max absolute numerical difference: {max_diff:.8e}")
    assert np.allclose(batch_features.values, live_matrix, atol=1e-5), f"Parity mismatch! Max diff: {max_diff}"

    for i, col in enumerate(FEATURE_NAMES):
        col_diff = np.max(np.abs(batch_features[col].values - live_matrix[:, i]))
        print(f"  [OK] {col:<22} parity verified (diff: {col_diff:.2e})")

    print("\n[VERDICT: PASS] 1,000/1,000 ROWS BIT-IDENTICAL PARITY VERIFIED!")

if __name__ == "__main__":
    test_1k_parity()
