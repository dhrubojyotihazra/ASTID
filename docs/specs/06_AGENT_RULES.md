# 06 — AI Coding Agent Rules & Project Guardrails (`.cursorrules`)

You are an expert Full-Stack FinTech & ML Systems Engineer working on **PROJ-CSD782 (Fraud Detection in Digital Payment Systems Using Machine Learning)** for Brainware University. Strictly enforce these architectural and domain constraints on every file you create, edit, or refactor:

---

### 1. Non-Negotiable Architectural & Machine Learning Rules

1. **Single Shared Feature Module (`backend/ml/features.py`):**
   * Never implement duplicate feature engineering logic across batch training, offline evaluation, and live scoring.
   * Features must be written as pure functions accepting raw values and state.
   * State providers must remain cleanly separated: window aggregations for batch; Redis (with in-memory dictionary fallback) for live serving.
2. **Strict Data-Leakage Ban in Production Inference:**
   * In PaySim, `oldbalanceDest + amount - newbalanceDest` (`errorBalanceDest`) leaks the target label because the synthetic simulator emptied origin accounts without crediting destination accounts during fraud simulation, creating an artificial, indefensible `PR-AUC = 1.0000`.
   * **Rule:** Never pass `errorBalanceDest` or `errorBalanceOrig` into production feature vectors. These columns are strictly reserved for the educational `/warehouse/leakage-audit` endpoint to demonstrate ML maturity during viva defense.
3. **Preserve Verified Ground Truth Metrics & Dynamic Artifact Loading:**
   * Never invent evaluation metrics. All UI dashboards and API responses must read directly from `backend/ml/artifacts/metrics.json` generated during training.
   * **Verified Empirical Ground Truth:**
     * Full PaySim: **6,362,620 rows**, **8,213 total frauds** (~0.1290% class imbalance).
     * `CASH_OUT`: 2,237,500 txns, 4,116 frauds (0.1840%).
     * `TRANSFER`: 532,909 txns, 4,097 frauds (0.7688%).
     * Other types (`CASH_IN`, `PAYMENT`, `DEBIT`): Exactly 0 frauds.
     * Naive `isFlaggedFraud` rule: Flags only **16 transactions** across 6.36M rows (Recall = **0.1948% (~0.2%)**, Precision = 100%).
     * Production Model Benchmark: Calibrated XGBoost achieves **PR-AUC = 0.8842**, **Recall = 94.21%** on behavioral features.
     * Autoencoder Benchmark: PyTorch `Dense(N->100->20->100->N)` converges from **MSE = 0.286 to 0.004** on legitimate transactions.
4. **Score Aggregation Contract with Disjunctive Gating:**
   * Combine normalized scores using: `0.60 * xgb_calibrated + 0.40 * ae_normalized + soft_flag_boost + geo_velocity_boost`.
   * **Mandatory Override Escapes:**
     * `xgb_prob >= 0.85` MUST force `ESCALATE` (high-confidence supervised fraud signature).
     * `ae_norm >= 0.90` MUST force `ESCALATE` (severe zero-day novelty spike).
   * **Decision Routing Bands:**
     * `< 0.30` (or `< tau*(x)` in cost-sensitive mode) → `APPROVE` (auto straight-through)
     * `0.30 <= Score < 0.70` (or `>= tau*(x)` and `< 0.70`) → `REVIEW` (Branch Analyst queue)
     * `>= 0.70` → `ESCALATE` (Senior Analyst queue, 15-minute SLA)
5. **Narrow Auto-Block Policy:**
   * Never autonomously `BLOCK` a transaction based solely on an ML score. High ML scores route to `ESCALATE` for human confirmation.
   * Only an exact match against an already-confirmed blacklisted entity (card ID, merchant ID, or VPA handle) triggers an autonomous `BLOCK`.
6. **Crash-Proof Demo Fallbacks:**
   * Upstash Redis calls in `cache.py` must be wrapped in `try/except` with automatic, silent fallback to an in-memory Python dictionary so local offline demos never crash.
   * If model artifacts fail to load, the API must degrade gracefully to the deterministic rules engine and route flagged transactions to `REVIEW`.
7. **Idempotency & Safe Database Mutations:**
   * Every transaction insertion must compute `ingestion_hash`.
   * Live scoring insertions must support the `Idempotency-Key` header with Redis distributed locking, backed by `ON CONFLICT (ingestion_hash) DO UPDATE SET updated_at = now() RETURNING *`.
8. **Row-Level Security & Helper Functions:**
   * All queries on Supabase Postgres must respect 3-tier branch scoping.
   * Never query `users` recursively inside RLS policies; always invoke `SECURITY DEFINER` helper functions (`get_auth_role()`, `get_auth_default_branch()`, `get_auth_assigned_branches()`).
9. **Explainability via Base Estimator Extraction:**
   * When passing calibrated models to SHAP `TreeExplainer`, extract the underlying base tree estimator via `calibrated_model.calibrated_classifiers_[0].estimator` to prevent wrapper runtime errors.
10. **Cost-Sensitive Bayes Thresholding Contract:**
    * Dynamic Bayes cutoffs $\tau^*(x)$ act as an operational decision overlay; they never alter raw model probabilities or calibrated scores.
11. **Model Governance & Frozen Reference Deciles:**
    * `ref_score_dist.npy` must be generated once from the training validation split. Live PSI calculations compare streaming batches against this frozen reference baseline.
12. **Delayed Feedback Maturation Window:**
    * Retraining datasets must enforce a 60-day observation blackout window ($[T-60\text{d}, T]$) to prevent unconfirmed chargeback data from corrupting ground-truth training labels.

---

### 2. The Graveyard (Explicitly Banned Ideas — DO NOT BUILD OR SUGGEST)

* **NO Kafka / RabbitMQ:** Supabase Realtime (Postgres logical replication) provides push-based WebSocket streams without infrastructure bloat.
* **NO SaaS Marketing Landing Page / Pricing / Public Sign-Up:** This is an internal enterprise B2B RiskOps platform for a bank. Start directly at `/login` with the Evaluator Quick-Switch Drawer.
* **NO Isolation Forest:** The PyTorch Autoencoder replaced Isolation Forest as the sole unsupervised model. The ensemble contains exactly 2 ML models (XGBoost + Autoencoder) plus deterministic parallel rules.
* **NO Claims of Real-Time Online Learning (Per-Transaction Weight Updates):** This induces catastrophic forgetting. Retraining is strictly implemented as **Periodic Warm-Start Fine-Tuning** on confirmed normal transactions.
* **NO Fake Cross-Bank Network Effects or PCI-DSS Claims:** Scoped out honestly.
