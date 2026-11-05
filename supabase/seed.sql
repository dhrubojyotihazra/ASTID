-- ==============================================================================
-- ASTID Production Seed Data (Branches, Demo Users, Merchants, Champion Model)
-- ==============================================================================

-- 1. Insert 5 Commercial Branches
INSERT INTO branches (branch_id, branch_code, branch_name, region, city_tier)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'BR-KOL-01', 'Kolkata-SaltLake', 'Eastern', 'Tier 1'),
    ('b2222222-2222-2222-2222-222222222222', 'BR-MUM-02', 'Mumbai-BKC', 'Western', 'Tier 1'),
    ('b3333333-3333-3333-3333-333333333333', 'BR-BLR-03', 'Bengaluru-HSR', 'Southern', 'Tier 1'),
    ('b4444444-4444-4444-4444-444444444444', 'BR-DEL-04', 'Delhi-Connaught', 'Northern', 'Tier 1'),
    ('b5555555-5555-5555-5555-555555555555', 'BR-CHE-05', 'Chennai-Guindy', 'Southern', 'Tier 1')
ON CONFLICT (branch_code) DO NOTHING;

-- 2. Insert Champion Model Version
INSERT INTO model_versions (model_id, version_tag, model_type, pr_auc, recall, precision_score, f1_score, ae_threshold_tau, is_active)
VALUES (
    'm0000000-0000-0000-0000-000000000001',
    'v2.4-champion-calibrated',
    'xgboost_autoencoder_hybrid',
    0.9987,
    1.0000,
    0.9541,
    0.9765,
    0.017605,
    true
)
ON CONFLICT (version_tag) DO NOTHING;

-- 3. Insert Common Merchants
INSERT INTO merchants (merchant_id, merchant_name, vpa_handle, category, risk_tier, historical_fraud_rate)
VALUES 
    ('M_FLIPKART_01', 'Flipkart India Internet Pvt Ltd', 'flipkart@axisbank', 'E-Commerce', 'low', 0.0004),
    ('M_ZOMATO_02', 'Zomato Payments Private Limited', 'zomato@icici', 'Food & Dining', 'low', 0.0002),
    ('M_CRYPTO_EXCH', 'Unregistered P2P Crypto Exchange', 'p2pcash@ybl', 'High Risk Escrow', 'high', 0.1420),
    ('M_OFFSHORE_BET', 'Offshore Gaming Portal', 'luckypay@okaxis', 'Gaming / Betting', 'blacklisted', 0.8850)
ON CONFLICT (merchant_id) DO NOTHING;
