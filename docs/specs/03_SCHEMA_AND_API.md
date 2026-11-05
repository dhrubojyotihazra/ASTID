# 03 — Database Schema (Supabase Postgres), Complete RLS & FastAPI Contracts

### 1. Supabase PostgreSQL DDL (`supabase/migrations/001_init_schema_and_rls.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. BRANCHES (5 Simulated Indian Bank Branches)
-- ============================================================================
CREATE TABLE branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code TEXT UNIQUE NOT NULL,
    branch_name TEXT NOT NULL,
    region TEXT NOT NULL,
    city_tier TEXT NOT NULL CHECK (city_tier IN ('Tier 1', 'Tier 2', 'Tier 3')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. USERS (Profiles extending auth.users)
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('analyst', 'senior_analyst', 'team_lead', 'admin')),
    default_branch_id UUID REFERENCES branches(branch_id),
    assigned_branch_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. MERCHANTS / COUNTERPARTIES
-- ============================================================================
CREATE TABLE merchants (
    merchant_id TEXT PRIMARY KEY,
    merchant_name TEXT NOT NULL,
    vpa_handle TEXT NOT NULL,
    category TEXT NOT NULL,
    risk_tier TEXT NOT NULL DEFAULT 'low' CHECK (risk_tier IN ('low', 'medium', 'high', 'blacklisted')),
    historical_fraud_rate NUMERIC(5,4) DEFAULT 0.0000,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. MODEL VERSIONS (Registry & Champion/Shadow Governance)
-- ============================================================================
CREATE TABLE model_versions (
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

-- ============================================================================
-- 5. TRANSACTIONS (Unified Operational Store with FinTech Telemetry)
-- ============================================================================
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingestion_hash TEXT UNIQUE NOT NULL, -- SHA256(source || branch_id || step || nameOrig || nameDest || amount)
    idempotency_key TEXT,               -- IETF Idempotency-Key header for duplicate request protection
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    model_id UUID REFERENCES model_versions(model_id),
    step INT NOT NULL,
    tx_timestamp TIMESTAMPTZ DEFAULT now(),
    tx_type TEXT NOT NULL CHECK (tx_type IN ('TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT', 'UPI_P2P', 'UPI_MERCHANT')),
    amount NUMERIC(14,2) NOT NULL,
    name_orig TEXT NOT NULL,
    vpa_orig TEXT,
    old_balance_orig NUMERIC(14,2) DEFAULT 0.00, -- Nullable/defaulted for UPI feeds lacking bank ledger access
    new_balance_orig NUMERIC(14,2) DEFAULT 0.00,
    name_dest TEXT NOT NULL,
    vpa_dest TEXT,
    old_balance_dest NUMERIC(14,2) DEFAULT 0.00,
    new_balance_dest NUMERIC(14,2) DEFAULT 0.00,
    device_fingerprint TEXT,                     -- Simulated client canvas/device hash
    ip_address TEXT,                             -- Client IP for geo-velocity calculations
    geo_velocity_kmh NUMERIC(8,2) DEFAULT 0.00,  -- Calculated Haversine speed between successive txns
    source TEXT NOT NULL CHECK (source IN ('batch_upload', 'live_demo', 'synthetic_seed')),
    xgb_prob NUMERIC(6,4) NOT NULL,
    ae_mse NUMERIC(10,6) NOT NULL,
    ae_norm_score NUMERIC(6,4) NOT NULL,
    combined_score NUMERIC(6,4) NOT NULL,
    cost_sensitive_tau NUMERIC(6,4) DEFAULT 0.30, -- Dynamic Bayes cutoff τ*(x)
    final_verdict TEXT NOT NULL CHECK (final_verdict IN ('APPROVE', 'REVIEW', 'ESCALATE', 'BLOCK')),
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'under_review', 'resolved')),
    whitebox_insights JSONB DEFAULT '[]'::jsonb, -- Array of plain-English badges
    actual_label INT CHECK (actual_label IN (0, 1)),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. ESCALATIONS (High-Risk SLA State Machine)
-- ============================================================================
CREATE TABLE escalations (
    escalation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(branch_id),
    raised_by UUID REFERENCES users(user_id), -- NULL if auto-escalated by scoring engine
    assigned_to UUID REFERENCES users(user_id),
    severity TEXT NOT NULL CHECK (severity IN ('high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'overdue', 'assigned', 'resolved')),
    sla_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    raised_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_verdict TEXT CHECK (resolution_verdict IN ('confirmed_fraud', 'false_positive')),
    resolution_notes TEXT
);

-- Dynamic View for SLA Monitoring (Prevents Cron Dependency for 'overdue' status)
CREATE OR REPLACE VIEW v_escalations_with_sla AS
SELECT 
    e.*,
    CASE 
        WHEN e.status = 'open' AND now() > e.sla_deadline THEN 'overdue'
        ELSE e.status 
    END AS live_status
FROM escalations e;

-- ============================================================================
-- 7. ANALYST ACTIONS (Auditable Feedback Loop for Warm-Start Retraining)
-- ============================================================================
CREATE TABLE analyst_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    analyst_id UUID NOT NULL REFERENCES users(user_id),
    decision TEXT NOT NULL CHECK (decision IN ('confirmed_fraud', 'false_positive', 'escalated')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. MODEL DRIFT LOGS (Basel II / Fed SR 11-7 Compliance Governance)
-- ============================================================================
CREATE TABLE model_drift_logs (
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
```

---

### 2. Complete 3-Tier Row-Level Security (RLS) Specification

```sql
-- Enable RLS across ALL operational tables to prevent public anon key data leakage
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_drift_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY DEFINER Helper Functions (Eliminates Recursive RLS Subqueries on users)
-- ============================================================================
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

-- ============================================================================
-- POLICIES: branches, merchants, model_versions
-- ============================================================================
CREATE POLICY "Branches are readable by authenticated staff"
ON branches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Branches editable only by admins"
ON branches FOR ALL TO authenticated USING (get_auth_role() = 'admin');

CREATE POLICY "Merchants readable by authenticated staff"
ON merchants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Merchants editable by team leads and admins"
ON merchants FOR ALL TO authenticated USING (get_auth_role() IN ('team_lead', 'admin'));

CREATE POLICY "Model versions readable by authenticated staff"
ON model_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Model versions manageable by admins"
ON model_versions FOR ALL TO authenticated USING (get_auth_role() = 'admin');

-- ============================================================================
-- POLICIES: users
-- ============================================================================
CREATE POLICY "Users can view own profile or leadership can view all"
ON users FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR get_auth_role() IN ('team_lead', 'admin')
);

CREATE POLICY "Users can update own name/email"
ON users FOR UPDATE TO authenticated USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins have full control over user profiles"
ON users FOR ALL TO authenticated USING (get_auth_role() = 'admin');

-- ============================================================================
-- POLICIES: transactions (3-Tier Branch Isolation)
-- ============================================================================
CREATE POLICY "3-Tier role-based branch visibility on transactions"
ON transactions FOR SELECT TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
    OR (get_auth_role() = 'senior_analyst' AND branch_id = ANY(get_auth_assigned_branches()))
    OR (get_auth_role() = 'analyst' AND branch_id = get_auth_default_branch())
);

CREATE POLICY "Authorized backend or demo testing can insert transactions"
ON transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Analysts can update transaction review_status"
ON transactions FOR UPDATE TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
    OR (get_auth_role() = 'senior_analyst' AND branch_id = ANY(get_auth_assigned_branches()))
    OR (get_auth_role() = 'analyst' AND branch_id = get_auth_default_branch())
);

-- ============================================================================
-- POLICIES: escalations
-- ============================================================================
CREATE POLICY "Branch-scoped visibility on escalations"
ON escalations FOR SELECT TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
    OR (get_auth_role() = 'senior_analyst' AND branch_id = ANY(get_auth_assigned_branches()))
    OR (get_auth_role() = 'analyst' AND branch_id = get_auth_default_branch())
);

CREATE POLICY "Staff can raise escalations"
ON escalations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Senior analysts and leadership can claim and resolve escalations"
ON escalations FOR UPDATE TO authenticated USING (
    get_auth_role() IN ('senior_analyst', 'team_lead', 'admin')
);

-- ============================================================================
-- POLICIES: analyst_actions
-- ============================================================================
CREATE POLICY "Audit trail readable by all authenticated staff"
ON analyst_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Analysts can log own review actions"
ON analyst_actions FOR INSERT TO authenticated WITH CHECK (analyst_id = auth.uid());

-- ============================================================================
-- POLICIES: model_drift_logs
-- ============================================================================
CREATE POLICY "Drift logs readable by leadership and admins"
ON model_drift_logs FOR SELECT TO authenticated USING (
    get_auth_role() IN ('team_lead', 'admin')
);

CREATE POLICY "Drift logs insertable by system services"
ON model_drift_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- Supabase Realtime Publication Registration
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE transactions, escalations;
```

---

### 3. FastAPI REST Endpoints Contract & Specifications

All API endpoints are mounted under `/api/v1` and validate incoming JWT tokens against Supabase Auth secret.

#### 1. `POST /api/v1/score/live` (Live Transaction Scoring)
* **Description:** Scores a single transaction from the Live Simulator. Enforces the IETF `Idempotency-Key` header with distributed Redis locking to ensure duplicate requests return cached results in <2 ms. Uses `ON CONFLICT (ingestion_hash) DO UPDATE ... RETURNING *` for database-level idempotency.
* **Request Headers:**
  * `Idempotency-Key` (Optional, UUID string): Client-generated deduplication token.
  * `X-Device-Fingerprint` (Optional, string): Client canvas/hardware hash.
  * `X-Geo-Location` (Optional, string): Lat/long coordinates (e.g. `22.5726,88.3639` for Kolkata).
  * `X-Forwarded-For` (Optional, string): Client IP address.
* **Request Schema (Pydantic):**
  ```python
  class LiveScoreRequest(BaseModel):
      step: int = 744
      tx_type: Literal['TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT', 'UPI_P2P', 'UPI_MERCHANT']
      amount: float = Field(gt=0)
      name_orig: str
      name_dest: str
      vpa_orig: str | None = None
      vpa_dest: str | None = None
      old_balance_orig: float = 0.0
      new_balance_orig: float = 0.0
      old_balance_dest: float = 0.0
      new_balance_dest: float = 0.0
      device_fingerprint: str | None = None
      geo_lat: float | None = None
      geo_lon: float | None = None
      branch_id: str | None = None # If omitted, deterministically assigned via crc32(name_orig) % 5
  ```
* **Response Body (`<80 ms` latency):** Returns the full inserted `transactions` record plus computed `xgb_prob`, `ae_norm_score`, `combined_score`, `cost_sensitive_tau`, `geo_velocity_kmh`, `final_verdict`, and `whitebox_insights` array.

#### 2. `POST /api/v1/score/batch` (Asynchronous Parquet/CSV Ingestion)
* **Description:** Ingests large transaction files asynchronously via FastAPI `BackgroundTasks`. Validates schema, batches insertions into Supabase, and runs inference. Returns `{"job_id": "...", "status": "processing"}` for frontend progress tracking.

#### 3. `GET /api/v1/warehouse/metrics` (DuckDB Telemetry & Analytics)
* **Description:** Queries `paysim_warehouse.parquet` via DuckDB in-process engine.
* **Response Body:**
  ```json
  {
    "telemetry": {
      "execution_ms": 118,
      "rows_scanned": 6362620,
      "engine": "DuckDB In-Process Columnar OLAP"
    },
    "fraud_summary": {
      "total_transactions": 6362620,
      "total_frauds": 8213,
      "overall_fraud_rate_pct": 0.1290,
      "by_type": [
        {"type": "CASH_OUT", "transactions": 2237500, "frauds": 4116, "pct": 0.1840},
        {"type": "TRANSFER", "transactions": 532909, "frauds": 4097, "pct": 0.7688},
        {"type": "PAYMENT", "transactions": 2151495, "frauds": 0, "pct": 0.0000},
        {"type": "CASH_IN", "transactions": 1399284, "frauds": 0, "pct": 0.0000},
        {"type": "DEBIT", "transactions": 41432, "frauds": 0, "pct": 0.0000}
      ]
    }
  }
  ```

#### 4. `GET /api/v1/warehouse/leakage-audit` (Data Leakage Educational Audit)
* **Description:** Returns comparative metrics demonstrating the PaySim `errorBalanceDest` data leakage artifact vs. our production behavioral model.
* **Response Body:**
  ```json
  {
    "leaked_model": {
      "features": ["amount", "type", "errorBalanceDest", "errorBalanceOrig"],
      "pr_auc": 1.0000,
      "recall": 1.0000,
      "false_positive_rate": 0.0000,
      "verdict": "UNSAFE - Simulator Zeroing Artifact Leakage"
    },
    "behavioral_production_model": {
      "features": ["amount", "type_encoded", "hour_of_day", "tx_velocity_1h", "amount_zscore", "balance_drain_ratio"],
      "pr_auc": 0.8842,
      "recall": 0.9421,
      "precision": 0.9180,
      "verdict": "PRODUCTION READY - Zero Target Leakage"
    },
    "naive_rule_baseline": {
      "rule": "amount > 200000 AND type = 'TRANSFER' (PaySim isFlaggedFraud)",
      "recall": 0.001948,
      "cases_flagged": 16,
      "total_fraud_cases": 8213,
      "verdict": "FAIL - Detects <0.2% of Enterprise Fraud"
    }
  }
  ```

#### 5. `GET /api/v1/graph/ego/{account_id}` (1-Hop Mule Ring Graph)
* **Description:** Returns nodes (accounts) and directed edges (transfers) in the trailing 24 hours around `account_id` to render the PayPal "Igor" network visualization in the Analyst Drawer.

#### 6. `GET /api/v1/drift/psi` (Model Drift PSI & KS Monitor)
* **Description:** Evaluates recent scoring distribution against frozen reference training deciles (`ref_score_dist.npy`) conforming to Basel II / Fed SR 11-7 standards.
* **Response Body:**
  ```json
  {
    "psi_value": 0.0421,
    "ks_statistic": 0.0312,
    "ks_pvalue": 0.2841,
    "status": "GREEN",
    "evaluated_sample_size": 5000,
    "recommended_action": "No action required. Score distribution is stable.",
    "decile_comparison": [
      {"decile": 1, "expected_pct": 10.0, "actual_pct": 9.8},
      {"decile": 2, "expected_pct": 10.0, "actual_pct": 10.2},
      {"decile": 10, "expected_pct": 10.0, "actual_pct": 9.9}
    ]
  }
  ```

#### 7. `GET /api/v1/health`
* **Description:** Health check reporting status of Supabase Postgres connection, Upstash Redis (or in-memory fallback), DuckDB Parquet file access, and loaded ML model memory status.
