-- ==============================================================================
-- ASTID Production Database Schema (Supabase PostgreSQL)
-- Multi-Branch RiskOps Workbench with 3-Tier Row-Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BRANCHES (5 Simulated Indian Commercial Banking Hubs)
CREATE TABLE IF NOT EXISTS branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code TEXT UNIQUE NOT NULL,
    branch_name TEXT NOT NULL,
    region TEXT NOT NULL,
    city_tier TEXT NOT NULL CHECK (city_tier IN ('Tier 1', 'Tier 2', 'Tier 3')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USERS (Profiles extending auth.users)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
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

-- 4. MODEL VERSIONS (Registry & Governance)
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

-- 5. TRANSACTIONS (Unified Operational Store with FinTech Telemetry)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingestion_hash TEXT UNIQUE NOT NULL,
    idempotency_key TEXT,
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    model_id UUID REFERENCES model_versions(model_id),
    step INT NOT NULL,
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
    ae_mse NUMERIC(10,6) NOT NULL,
    ae_norm_score NUMERIC(6,4) NOT NULL,
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

-- Dynamic View for SLA Monitoring
CREATE OR REPLACE VIEW v_escalations_with_sla AS
SELECT 
    e.*,
    CASE 
        WHEN e.status = 'open' AND now() > e.sla_deadline THEN 'overdue'
        ELSE e.status 
    END AS live_status
FROM escalations e;

-- 7. ANALYST ACTIONS (Auditable Feedback Loop)
CREATE TABLE IF NOT EXISTS analyst_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    analyst_id UUID NOT NULL REFERENCES users(user_id),
    decision TEXT NOT NULL CHECK (decision IN ('confirmed_fraud', 'false_positive', 'escalated')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. MODEL DRIFT LOGS (Basel II Compliance)
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
-- 3-TIER ROW-LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_drift_logs ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
    SELECT role FROM users WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_default_branch()
RETURNS UUID AS $$
    SELECT default_branch_id FROM users WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_assigned_branches()
RETURNS UUID[] AS $$
    SELECT assigned_branch_ids FROM users WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies for public reading by authenticated users
CREATE POLICY "Branches readable by authenticated" ON branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Merchants readable by authenticated" ON merchants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Models readable by authenticated" ON model_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users viewable by staff" ON users FOR SELECT TO authenticated USING (true);

-- 3-Tier Branch Isolation for Transactions
CREATE POLICY "3-Tier Branch Transactions Visibility" ON transactions FOR SELECT TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
    OR (get_auth_role() = 'senior_analyst' AND branch_id = ANY(get_auth_assigned_branches()))
    OR (get_auth_role() = 'analyst' AND branch_id = get_auth_default_branch())
);

CREATE POLICY "Transactions insertable by service" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Transactions updatable by branch analysts" ON transactions FOR UPDATE TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
    OR (get_auth_role() = 'senior_analyst' AND branch_id = ANY(get_auth_assigned_branches()))
    OR (get_auth_role() = 'analyst' AND branch_id = get_auth_default_branch())
);

-- Escalations Policies
CREATE POLICY "Escalations branch visibility" ON escalations FOR SELECT TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
    OR (get_auth_role() = 'senior_analyst' AND branch_id = ANY(get_auth_assigned_branches()))
    OR (get_auth_role() = 'analyst' AND branch_id = get_auth_default_branch())
);

CREATE POLICY "Escalations insertable" ON escalations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Senior analysts claim and resolve escalations" ON escalations FOR UPDATE TO authenticated USING (
    get_auth_role() IN ('senior_analyst', 'team_lead', 'admin')
);

-- Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE transactions, escalations;
