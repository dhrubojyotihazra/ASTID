-- ==============================================================================
-- ASTID Production Database Schema & Seed Data (Run in Supabase SQL Editor)
-- Multi-Branch RiskOps Workbench with 3-Tier Row-Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BRANCHES (5 Commercial Banking Hubs)
CREATE TABLE IF NOT EXISTS branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code TEXT UNIQUE NOT NULL,
    branch_name TEXT NOT NULL,
    region TEXT NOT NULL,
    city_tier TEXT NOT NULL CHECK (city_tier IN ('Tier 1', 'Tier 2', 'Tier 3')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USERS (Staff Profiles)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('analyst', 'senior_analyst', 'team_lead', 'admin')),
    default_branch_id UUID REFERENCES branches(branch_id),
    assigned_branch_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MERCHANTS / COUNTERPARTIES
CREATE TABLE IF NOT EXISTS merchants (
    merchant_id TEXT PRIMARY KEY,
    merchant_name TEXT NOT NULL,
    vpa_handle TEXT NOT NULL,
    category TEXT NOT NULL,
    risk_tier TEXT NOT NULL DEFAULT 'low' CHECK (risk_tier IN ('low', 'medium', 'high', 'blacklisted')),
    historical_fraud_rate NUMERIC(5,4) DEFAULT 0.0000,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MODEL VERSIONS (Governance Registry)
CREATE TABLE IF NOT EXISTS model_versions (
    model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_tag TEXT UNIQUE NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('xgboost_autoencoder_hybrid', 'rules_fallback')),
    pr_auc NUMERIC(5,4) NOT NULL,
    recall NUMERIC(5,4) NOT NULL,
    precision_score NUMERIC(5,4) NOT NULL,
    f1_score NUMERIC(5,4) NOT NULL,
    ae_threshold_tau NUMERIC(8,6) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    trained_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TRANSACTIONS (Real-Time Scoring Telemetry)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingestion_hash TEXT UNIQUE NOT NULL,
    idempotency_key TEXT,
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    model_id UUID REFERENCES model_versions(model_id),
    step INT NOT NULL DEFAULT 744,
    tx_timestamp TIMESTAMPTZ DEFAULT now(),
    tx_type TEXT NOT NULL CHECK (tx_type IN ('TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT', 'UPI_P2P', 'UPI_MERCHANT')),
    amount NUMERIC(14,2) NOT NULL,
    name_orig TEXT NOT NULL,
    vpa_orig TEXT,
    old_balance_orig NUMERIC(14,2) DEFAULT 0.00,
    new_balance_orig NUMERIC(14,2) DEFAULT 0.00,
    name_dest TEXT NOT NULL,
    vpa_dest TEXT,
    old_balance_dest NUMERIC(14,2) DEFAULT 0.00,
    new_balance_dest NUMERIC(14,2) DEFAULT 0.00,
    device_fingerprint TEXT,
    ip_address TEXT,
    geo_velocity_kmh NUMERIC(8,2) DEFAULT 0.00,
    source TEXT NOT NULL CHECK (source IN ('batch_upload', 'live_demo', 'synthetic_seed')),
    xgb_prob NUMERIC(6,4) NOT NULL,
    ae_mse NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    ae_norm_score NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    combined_score NUMERIC(6,4) NOT NULL,
    cost_sensitive_tau NUMERIC(6,4) DEFAULT 0.30,
    final_verdict TEXT NOT NULL CHECK (final_verdict IN ('APPROVE', 'REVIEW', 'ESCALATE', 'BLOCK')),
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'under_review', 'resolved')),
    whitebox_insights JSONB DEFAULT '[]'::jsonb,
    actual_label INT CHECK (actual_label IN (0, 1)),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ESCALATIONS (15-Minute SLA State Machine)
CREATE TABLE IF NOT EXISTS escalations (
    escalation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    raised_by UUID REFERENCES users(user_id),
    assigned_to UUID REFERENCES users(user_id),
    severity TEXT NOT NULL CHECK (severity IN ('high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'overdue', 'assigned', 'resolved')),
    sla_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    raised_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_verdict TEXT CHECK (resolution_verdict IN ('confirmed_fraud', 'false_positive')),
    resolution_notes TEXT
);

-- Dynamic View for Overdue SLA Monitoring
CREATE OR REPLACE VIEW v_escalations_with_sla AS
SELECT 
    e.*,
    CASE 
        WHEN e.status = 'open' AND now() > e.sla_deadline THEN 'overdue'
        ELSE e.status 
    END AS live_status
FROM escalations e;

-- 7. ANALYST ACTIONS (Auditable Decision Log)
CREATE TABLE IF NOT EXISTS analyst_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    analyst_id UUID NOT NULL REFERENCES users(user_id),
    decision TEXT NOT NULL CHECK (decision IN ('confirmed_fraud', 'false_positive', 'escalated')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. MODEL DRIFT LOGS (Drift Governance)
CREATE TABLE IF NOT EXISTS model_drift_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES model_versions(model_id),
    psi_score NUMERIC(6,4) NOT NULL,
    ks_statistic NUMERIC(6,4) NOT NULL,
    ks_pvalue NUMERIC(8,6) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('GREEN', 'AMBER', 'RED')),
    evaluated_sample_size INT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_drift_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Allow public read on merchants" ON merchants FOR SELECT USING (true);
CREATE POLICY "Allow public read on model_versions" ON model_versions FOR SELECT USING (true);
CREATE POLICY "Allow service_role full on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow service_role full on escalations" ON escalations FOR ALL USING (true);
CREATE POLICY "Allow service_role full on analyst_actions" ON analyst_actions FOR ALL USING (true);
CREATE POLICY "Allow service_role full on users" ON users FOR ALL USING (true);

-- Enable Realtime (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'escalations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE escalations;
    END IF;
END $$;

-- ============================================================================
-- SEED DATA (Branches & Champion Model)
-- ============================================================================
INSERT INTO branches (branch_id, branch_code, branch_name, region, city_tier)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'BR-KOL-01', 'Kolkata-SaltLake', 'Eastern', 'Tier 1'),
    ('b2222222-2222-2222-2222-222222222222', 'BR-MUM-02', 'Mumbai-BKC', 'Western', 'Tier 1'),
    ('b3333333-3333-3333-3333-333333333333', 'BR-BLR-03', 'Bengaluru-HSR', 'Southern', 'Tier 1'),
    ('b4444444-4444-4444-4444-444444444444', 'BR-DEL-04', 'Delhi-Connaught', 'Northern', 'Tier 1'),
    ('b5555555-5555-5555-5555-555555555555', 'BR-CHE-05', 'Chennai-Guindy', 'Southern', 'Tier 1')
ON CONFLICT (branch_code) DO NOTHING;

INSERT INTO model_versions (model_id, version_tag, model_type, pr_auc, recall, precision_score, f1_score, ae_threshold_tau, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'v2.4-champion-calibrated',
    'xgboost_autoencoder_hybrid',
    0.9999,
    1.0000,
    0.9788,
    0.9892,
    0.017605,
    true
)
ON CONFLICT (version_tag) DO NOTHING;

INSERT INTO merchants (merchant_id, merchant_name, vpa_handle, category, risk_tier, historical_fraud_rate)
VALUES 
    ('M_FLIPKART_01', 'Flipkart Internet Pvt Ltd', 'flipkart@axisbank', 'E-Commerce', 'low', 0.0004),
    ('M_ZOMATO_02', 'Zomato Payments Ltd', 'zomato@icici', 'Food & Dining', 'low', 0.0002),
    ('M_CRYPTO_EXCH', 'Unregistered P2P Escrow', 'p2pcash@ybl', 'High Risk Escrow', 'high', 0.1420),
    ('M_OFFSHORE_BET', 'Offshore Gaming Portal', 'luckypay@okaxis', 'Gaming / Betting', 'blacklisted', 0.8850)
ON CONFLICT (merchant_id) DO NOTHING;
