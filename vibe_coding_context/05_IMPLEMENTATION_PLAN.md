# 05 — Step-by-Step Implementation Plan & Team Allocation

### 1. Project Roadmap & Milestone Timeline (8-Week Delivery Schedule)

```text
Week 1-2: Core ML Artifacts, Feature Parity & In-Process DuckDB Warehouse (Phase 1)
Week 3-4: Supabase PostgreSQL DDL, 3-Tier RLS Policies & Seed Ingestion (Phase 2)
Week 5-6: FastAPI Async Engine, FinTech Services (Idempotency, Cost, Geo, PSI) & XAI (Phase 3)
Week 7:   Next.js 14 Dashboard Screens, Evaluator Drawer & Live Simulator (Phase 4)
Week 8:   End-to-End Parity Testing, Offline-First Build & Viva Presentation Defense (Phase 5)
```

---

### 2. Task Allocation by Engineering Vertical

#### Phase 1: Machine Learning Pipeline, Leakage Audit & OLAP Warehouse
**Primary Owners: Isheeka Mukhopadhyay & Tiyasha Baidya**
* [ ] **Task 1.1 (Isheeka):** Implement `backend/ml/features.py` as pure mathematical functions. Compute behavioral signals: `amount`, `type_encoded`, `hour_of_day`, `tx_velocity_1h`, `tx_velocity_24h`, `amount_zscore`, `balance_drain_ratio`, and `is_transfer_to_cashout_chain`. Strictly ban `errorBalanceDest` and `errorBalanceOrig`.
* [ ] **Task 1.2 (Isheeka):** Execute `notebooks/Review2_Reproducible_Benchmark.ipynb` to train Calibrated XGBoost (calibrated on untouched validation split) and PyTorch Autoencoder (`Dense(N->100->20->100->N)` on normal transactions). Export artifacts:
  * `xgb_calibrated.joblib`
  * `autoencoder.pt`
  * `ae_minmax.json` (`ae_min`, `ae_max`, `tau`)
  * `metrics.json` (PR-AUC: 0.884, Recall: 94.2%, AE MSE: 0.286 → 0.004)
  * `ref_score_dist.npy` (reference validation score distribution for PSI drift monitoring)
* [ ] **Task 1.3 (Isheeka):** Build `backend/ml/warm_start.py` to support periodic 3-epoch fine-tuning on analyst-confirmed normal transactions with automated `ae_minmax.json` recomputation, enforcing the **60-day Observation Blackout Window** (delayed feedback protection).
* [ ] **Task 1.4 (Tiyasha):** Implement `backend/warehouse/duckdb_manager.py`. Ingest the 6.36M PaySim CSV into `paysim_warehouse.parquet` and the 20K UPI dataset into `upi_india_20k.parquet`. Generate the 50,000-row held-out `scored_test.parquet` for the Threshold Simulator. Implement sub-second analytical queries and execution telemetry tracking (`execution_ms`, `rows_scanned`).

#### Phase 2: Database Architecture, Security & Seed Data
**Primary Owners: Tiyasha Baidya & Samprikta Dey**
*(Dependency: Task 2.2 depends on Phase 1 model artifacts to generate pre-scored rows)*
* [ ] **Task 2.1 (Tiyasha):** Execute `001_init_schema_and_rls.sql` in Supabase Postgres:
  * Create all 8 tables: `branches`, `users`, `merchants`, `model_versions`, `transactions`, `escalations`, `analyst_actions`, and `model_drift_logs`.
  * Create `SECURITY DEFINER` helper functions (`get_auth_role()`, `get_auth_default_branch()`, `get_auth_assigned_branches()`).
  * Enforce 3-tier RLS policies across all tables and register `transactions` and `escalations` in `supabase_realtime`.
  * Create the dynamic view `v_escalations_with_sla` for cron-free SLA tracking.
* [ ] **Task 2.2 (Tiyasha & Samprikta):** Implement `supabase/seed.sql`:
  * Seed the 5 Indian branches (Kolkata-SaltLake, Mumbai-BKC, Bengaluru-HSR, Delhi-Connaught, Chennai-Guindy).
  * Seed 4 demo accounts (one for each role: Analyst, Senior Analyst, Team Lead, Admin) linked to Supabase Auth.
  * Seed 200 pre-scored transactions (with complete `whitebox_insights` JSON, `cost_sensitive_tau`, and geo-telemetry) and 3 injected demo mule rings (`MULE_RING_BKC_01`).

#### Phase 3: Real-Time Scoring Engine, Cache & FinTech Services
**Primary Owners: Samprikta Dey, Adhiraj Das & Tiyasha Baidya**
* [ ] **Task 3.1 (Samprikta):** Implement `backend/app/services/cache.py` connecting to Upstash Redis with a crash-proof fallback to an in-memory Python dictionary for velocity tracking. Build `backend/app/middleware/idempotency.py` enforcing the IETF `Idempotency-Key` header with atomic Redis `SETNX` distributed locking.
* [ ] **Task 3.2 (Samprikta):** Build `backend/app/services/rules_engine.py` (blacklist checks, velocity flags, UPI cap) and `backend/app/services/aggregator.py` (`aggregate_score()` with disjunctive override gating). Implement `backend/app/services/cost_sensitive.py` for Bayes dynamic threshold evaluation (`tau*(x)`).
* [ ] **Task 3.3 (Adhiraj):** Implement `backend/app/services/geo_velocity.py` computing Haversine impossible travel speed between consecutive logins/transactions.
* [ ] **Task 3.4 (Tiyasha):** Implement `backend/app/services/drift_monitor.py` calculating the 10-decile Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov test against `ref_score_dist.npy`.
* [ ] **Task 3.5 (Samprikta):** Build FastAPI routing endpoints:
  * `POST /api/v1/score/live` (idempotent scoring via middleware + `ON CONFLICT DO UPDATE ... RETURNING *`).
  * `POST /api/v1/score/batch` (asynchronous `BackgroundTasks` ingestion).
  * `GET /api/v1/warehouse/metrics` and `GET /api/v1/warehouse/leakage-audit`.
  * `GET /api/v1/drift/psi` (real-time Basel II / Fed SR 11-7 model drift status).
  * `GET /api/v1/health` (connectivity check for DB, Redis, DuckDB, ML models).
* [ ] **Task 3.6 (Adhiraj):** Implement `backend/ml/explain.py`:
  * Extract base estimator from `CalibratedClassifierCV` to calculate TreeSHAP values without errors.
  * Compute Autoencoder per-feature squared reconstruction errors.
  * Format output into plain-English `whitebox_insights` badges (including impossible travel alerts).
* [ ] **Task 3.7 (Adhiraj):** Build `GET /api/v1/graph/ego/{account_id}` returning 1-hop nodes and edges for the PayPal "Igor" Mule Ring visualizer.

#### Phase 4: Next.js Frontend Dashboards & Live Simulator
**Primary Owners: Dhrubojyoti Hazra, Adhiraj Das & Samprikta Dey**
* [ ] **Task 4.1 (Dhrubojyoti):** Scaffold `frontend-dashboard` using Next.js 14 App Router, Tailwind CSS, and `shadcn/ui`. Build `/login` with the **Viva Evaluator Quick-Login Drawer** supporting 1-click role authentication.
* [ ] **Task 4.2 (Dhrubojyoti):** Build the **Branch Analyst Workbench** (`/dashboard/analyst`):
  * Supabase Realtime live feed for `REVIEW` queue filtered to analyst's branch via RLS.
  * Sliding Transaction Detail Drawer displaying composite score gauge, Cost-Sensitive Bayes dynamic cutoff pill, Whitebox Risk Insights pills, and Analyst Action buttons (`Mark False Positive`, `Confirm Fraud`).
* [ ] **Task 4.3 (Samprikta & Dhrubojyoti):** Build the **Senior Analyst Escalation Queue** (`/dashboard/escalations`):
  * Priority queue with tabs: `Open`, `Overdue`, `Assigned to Me`, `Resolved`.
  * Dynamic 15-minute SLA countdown timers and `Claim / Resolve` modal.
* [ ] **Task 4.4 (Dhrubojyoti & Tiyasha):** Build the **Team Lead Executive Dashboard** (`/dashboard/team-lead`):
  * Top bar featuring the **Live DuckDB Warehouse Telemetry Pill**.
  * 5-Branch Cross-Regional Matrix.
  * **Model Drift Governance Card** showing live PSI status pill (`GREEN` / `AMBER` / `RED`) and decile comparison chart.
  * **Interactive Financial Impact & Threshold Simulator** with dual sliders querying `scored_test.parquet`.
  * **Model Integrity & Data Leakage Audit Tab** showing the PR-AUC 1.0000 vs 0.8842 educational comparison.
* [ ] **Task 4.5 (Adhiraj):** Build the **1-Hop Mule Ring Ego-Graph Component** inside the Analyst Drawer using SVG node-link rendering.
* [ ] **Task 4.6 (Adhiraj):** Build the **Live Transaction Simulator** (`/simulator`):
  * Form interface with the **5 Preset Attack Scenarios** (Legitimate UPI, Account Takeover Cash-Out, Midnight Zero-Day Anomaly, Blacklisted Mule VPA, and Impossible Travel Geo-Velocity Attack).
  * Toggle for **Standard Scoring Mode** vs. **Cost-Sensitive Bayes Mode**.

#### Phase 5: Verification, Offline Readiness & Viva Defense Preparation
**All Team Members**
* [ ] **Task 5.1 (Samprikta & Isheeka):** Implement and pass `test_feature_parity.py` to ensure batch and live scoring produce identical feature representations, and verify `idempotency.py` caches duplicate requests in <2 ms.
* [ ] **Task 5.2 (Tiyasha & Dhrubojyoti):** Test and verify 100% offline localhost execution (FastAPI + local DuckDB + SQLite/local Postgres) so the presentation is immune to college Wi-Fi dropouts.
* [ ] **Task 5.3 (All):** Complete end-to-end rehearsal using the Evaluator Quick-Login Drawer to demonstrate RLS boundaries, live scoring, escalation workflows, cost-sensitive threshold shifts, and the leakage audit tab.
