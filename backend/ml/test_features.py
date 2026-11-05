import numpy as np
import pandas as pd
from backend.ml.features import (
    FEATURE_NAMES,
    extract_live_features,
    extract_batch_features
)

def test_feature_parity():
    test_tx = {
        'step': 14,
        'type': 'TRANSFER',
        'amount': 250000.0,
        'nameOrig': 'C123456',
        'oldbalanceOrg': 250000.0,
        'newbalanceOrig': 0.0,
        'nameDest': 'C987654',
        'oldbalanceDest': 0.0,
        'newbalanceDest': 0.0
    }

    # Live extraction
    live_feat = extract_live_features(test_tx, account_state={
        'hist_mean': 15000.0,
        'hist_std': 40000.0,
        'velocity_1h': 1.0,
        'velocity_24h': 1.0,
        'had_recent_transfer': False
    })

    assert len(live_feat) == len(FEATURE_NAMES), f"Length mismatch: {len(live_feat)} vs {len(FEATURE_NAMES)}"
    print(f"[Feature Test] Live vector shape: {live_feat.shape}")

    # Batch extraction
    df = pd.DataFrame([test_tx])
    batch_feat = extract_batch_features(df).values[0]

    assert len(batch_feat) == len(FEATURE_NAMES), "Batch vector length mismatch"
    print(f"[Feature Test] Batch vector shape: {batch_feat.shape}")

    # Check key causal invariants:
    # 1. Drain ratio on full liquidation (250000 / 250001) should be ~0.999996
    drain_idx = FEATURE_NAMES.index('balance_drain_ratio')
    assert np.isclose(live_feat[drain_idx], 250000.0 / 250001.0, atol=1e-3)
    assert np.isclose(batch_feat[drain_idx], 250000.0 / 250001.0, atol=1e-3)

    # 2. Type transfer should be 1.0
    trans_idx = FEATURE_NAMES.index('type_TRANSFER')
    assert live_feat[trans_idx] == 1.0
    assert batch_feat[trans_idx] == 1.0

    print("[Feature Test] ALL FEATURE INVARIANTS PASSED!")

if __name__ == "__main__":
    test_feature_parity()
