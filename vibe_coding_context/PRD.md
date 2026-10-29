# PRD — Fraud Detection Intelligence Platform

**Course:** PROJ-CSD782 · Project-I · B.Tech. CSE–Data Science, Brainware University
**Title:** Fraud Detection in Digital Payment Systems Using Machine Learning
**Team:** Group 1, Section A — Dhrubojyoti Hazra (Lead), Isheeka Mukhopadhyay, Samprikta Dey, Adhiraj Das, Tiyasha Baidya
**Supervisor:** Rudranath Mitra · **Coordinator:** Dr. Ranadip Kundu
**Doc status:** v1.0 draft, rebuilt clean from the original handoff document
**Audience:** teammates and their AI coding agents. This file defines **WHAT** we build and **WHY**. The **HOW** lives in `ARCHITECTURE.md`, `SCHEMA_API.md`, `DESIGN_SYSTEM.md`, `IMPLEMENTATION_PLAN.md` and `AGENT_RULES.md`.

> **How to read this PRD (for AI agents):** `MUST` = non-negotiable, `SHOULD` = default unless there's a written reason not to, `MAY` = optional. Requirement IDs (e.g. `FR-ESC-03`) are stable, so reference them in commits and PRs. Anything marked **[PROPOSED]** is a default I'm recommending that the team hasn't explicitly confirmed. Don't treat it as locked without confirmation. If this PRD conflicts with another context file, stop and ask, don't guess.

---

## 1. Product summary

An **internal risk-operations platform for a simulated 5-branch bank.** Every digital payment is scored for fraud in near real time by a hybrid engine (rules + supervised ML + unsupervised neural anomaly detection). Anything suspicious lands in a human review workflow. Serious cases escalate to a senior analyst with SLA tracking. A team lead sees all branches at once. **Every flag carries a plain-language reason.**

### Positioning (locked)
- **It IS:** internal B2B/enterprise tooling, the same category as the dashboard a merchant's risk team uses inside Stripe Radar or Razorpay Thirdwatch. Access is provisioned by an Admin.
- **It is NOT:** a SaaS product (no self-signup, no pricing, no billing), a consumer app (the paying customer never sees it), or a marketing site (**no landing page**).
- **Pitch line for viva:** *"We built a system, not just a model."* The differentiators are real roles with database-enforced access, a live-data demo, a human escalation workflow, and explanations for every decision.

---

## 2. Goals, non-goals, success metrics

### 2.1 Goals
| ID | Goal |
|---|---|
| G1 | Score every transaction (batch or live) into APPROVE / REVIEW / ESCALATE with a 0–1 risk score and a human-readable reason |
| G2 | Detect both **known** fraud patterns (supervised) and **novel/zero-day** patterns (unsupervised autoencoder) |
| G3 | Give analysts a complete review → escalate → resolve workflow with ownership, timestamps and SLA visibility |
| G4 | Enforce multi-branch access at the **database level (RLS)**, not just in the UI |
| G5 | Give the Team Lead an aggregate, cross-branch view of fraud, false positives, SLA and model health |
| G6 | Be demoable live, deployed on real hosting, with a simulator that triggers fraud scenarios on demand |
| G7 | Be simple enough for academics to follow and explain, and as close to a production app as that allows, **without breaking any agreed feature or the project objective** |

### 2.2 Non-goals (explicitly out of scope)
| Not building | Why |
|---|---|
| Landing page / marketing site / self-signup / billing | Internal tool, nobody self-serves into it |
| Kafka or any message broker | Supabase Realtime covers push updates at our scale |
| Fully autonomous blocking of customers | A human must confirm blocks. One narrow exception, see `FR-DEC-04` |
| True real-time / per-transaction online learning | Unsolved research problem (catastrophic forgetting). We do periodic warm-start fine-tuning instead |
| Cross-institution "network effect" signals | Structurally impossible without other institutions' data. We name this as a limitation |
| Large DNN as the main classifier | Would overfit at our data volume. XGBoost is the correct choice |
| Sequence/RNN per-card history models | Stretch / future work only (cite Feedzai research). Not in the core build |
| Card-network / PCI-DSS integration, real money movement | Out of reach for an academic prototype |
| Pretrained "fraud foundation models" | None credible exist. We train a small model from scratch |
| Mobile app, public API for third parties | Not required by the objective |

### 2.3 Success metrics (what "done well" means)
| Metric | Target | Notes |
|---|---|---|
| Demo reliability | Full live demo script (Section 10) runs end-to-end on hosted deployment with no manual fixes | Rehearsed on venue-like network |
| Detection quality | Report PR-AUC, precision, recall, F1 on a held-out set. Prototype baseline in Section 9.3 | **Accuracy alone is never reported** (fraud ≈ 0.13% of PaySim) |
| Explanation coverage | **100%** of REVIEW/ESCALATE items show a reason | No unexplained flags |
| Live scoring latency | p95 under ~1 s from INSERT to dashboard appearance on hosted deployment **[PROPOSED target]** | A demo-feel target, not a Stripe-style SLA |
| Access control | An analyst cannot read rows outside their permitted branches even via direct API call | Verified by an RLS test |
| Idempotency | Re-uploading the same file or double-firing the simulator creates **zero** duplicate rows | `FR-ING-04` |

---

## 3. Users and roles

| Role | Represents | Primary job |
|---|---|---|
| **Analyst** | Front-line fraud-ops staff | Work the REVIEW queue: read the explanation, verdict each item, escalate when unsure |
| **Senior Analyst** | Escalation-tier staff | Own the Escalation Queue: claim, investigate, resolve critical cases |
| **Team Lead** | Risk manager | Monitor all 5 branches: KPIs, SLA compliance, model performance, threshold tuning |
| **Admin** | System operator | Manage users, branch assignments, model versions |

The **paying customer is not a user** of this product. They only experience the outcome (approved / delayed / blocked).

### 3.1 Permission matrix
| Capability | Analyst | Senior Analyst | Team Lead | Admin |
|---|:-:|:-:|:-:|:-:|
| View transactions in permitted branches | ✅ | ✅ | ✅ (all) | ✅ (all) |
| Work REVIEW queue, set verdicts | ✅ | ✅ | ❌ | ❌ |
| Raise an escalation | ✅ | ✅ | ❌ | ❌ |
| Claim / resolve escalations | ❌ | ✅ | ❌ | ❌ |
| Override an analyst decision | ❌ | ✅ | ❌ | ❌ |
| View cross-branch aggregate dashboard | ❌ | ❌ | ✅ | ✅ |
| Tune global score thresholds | ❌ | ❌ | ✅ | ✅ |
| Upload batch files | ✅ | ✅ | ❌ | ✅ |
| Manage users, branches, model versions | ❌ | ❌ | ❌ | ✅ |

### 3.2 Branch access rule **[PROPOSED. Needs confirmation: D-1]**
The original design said analysts see **all 5 branches by default**, with one "active" branch in focus at a time, switchable, and *"nobody's locked out of data they need; it's about focus, not restriction."* A later brief said "Branch Analyst sees OWN branch only." These contradict each other.

**Proposed resolution that satisfies both:** access is driven by a **`user_branches` assignment table** and enforced by RLS.
- Seed default: Analysts and Senior Analysts are assigned **all 5 branches**.
- A **branch switcher** sets the *active* branch (UI focus). An **"All branches"** toggle shows combined data.
- Restricting an analyst to one branch later is a **data change** (delete rows in `user_branches`), not a code change.
- Team Lead and Admin always see all branches.

---

## 4. Branch model

- **FR-BR-01 (MUST):** The system has exactly **5 simulated branches**, seeded at setup. Branches are a **column (`branch_id`)** on shared tables, **not** five databases.
- **FR-BR-02 (MUST):** Branch visibility is enforced by **Postgres RLS**, not frontend filtering.
- **FR-BR-03 (MUST) [PROPOSED]:** PaySim has **no branch field**, so every ingested row needs a `branch_id` assigned. Default: **deterministic assignment from a hash of the originating account ID mod 5**, so the same account always maps to the same branch and results are reproducible. Batch uploads MAY override this by tagging the whole file with a chosen branch. Live simulator submissions choose the branch explicitly.
- **FR-BR-04 (MUST):** The UI exposes a branch switcher (active branch) and an All-Branches toggle where the role allows it.

---

## 5. User flows

### Flow A. Live transaction (the demo hero flow)
1. A presenter uses the **Simulator app** to submit a transaction (normal or a preset fraud scenario) for a chosen branch.
2. It is inserted into the transactions store with `source = live_demo`.
3. The **scoring service** receives it via Realtime, computes features (shared `features.py`), runs rules + XGBoost + autoencoder, aggregates to one score, applies the decision policy.
4. The scored result is written back and pushed to dashboards via Realtime.
5. Outcome:
   - **APPROVE:** auto, appears in history only.
   - **REVIEW:** appears in the Analyst's queue with its explanation.
   - **ESCALATE:** an escalation is created and all online Senior Analysts are notified.

### Flow B. Batch ingestion
1. Analyst/Admin uploads a CSV/Parquet file, optionally tagging a branch.
2. The file is validated (schema, types). Bad rows are rejected with a clear per-row error and **don't** crash the job.
3. Valid rows load in the background, deduplicated by `ingestion_hash`.
4. Scoring runs in batch mode. A **job-status indicator** shows progress, so the UI never looks frozen.
5. Results appear in queues and aggregates when complete.

### Flow C. Analyst review
1. Analyst opens the REVIEW queue for the active branch (or all branches).
2. Selects an item and sees amount, type, branch, risk score, **reasons** (SHAP top features + reconstruction-error top features + rule hits), and the **ego-graph** (Section 6.9).
3. Sets a verdict: **Confirm fraud (block)** or **Dismiss (false positive / approve)**, or **Escalate**.
4. The verdict is recorded in the audit trail and becomes training feedback.

### Flow D. Escalation lifecycle
`open → assigned → resolved`, with `overdue` if unclaimed past the SLA window.
1. An escalation is created automatically (critical rule hit or score above the upper threshold) or manually by an Analyst.
2. All online Senior Analysts get a realtime notification (badge/toast).
3. A Senior Analyst **claims** it (`assigned`, owner recorded), investigates, and **resolves** it with resolution notes.
4. If nobody claims it within the SLA window, status becomes **`overdue`** and is surfaced prominently to the Team Lead. It can still be claimed.
5. Resolution feeds the feedback/retraining pipeline.

### Flow E. Model feedback loop
Analyst and Senior Analyst verdicts accumulate as labeled outcomes. A **scheduled job** periodically (a) refits XGBoost on updated labels, (b) **warm-start fine-tunes** the autoencoder on newly confirmed-normal transactions, and (c) registers the new model version. See `FR-ML-07..09`.

---

## 6. Functional requirements

### 6.1 Authentication and RBAC
- **FR-AUTH-01 (MUST):** Email/password login via Supabase Auth. No public self-signup. Admin creates accounts.
- **FR-AUTH-02 (MUST):** Every user has exactly one role (Analyst / Senior Analyst / Team Lead / Admin). Role gates both routes (UI) and data (RLS).
- **FR-AUTH-03 (MUST):** Unauthenticated users see only the login page.
- **FR-AUTH-04 (SHOULD):** Seeded demo accounts, one per role, documented in the README for evaluators.

### 6.2 Ingestion
- **FR-ING-01 (MUST):** Two ingestion paths, batch upload and live simulator, feed the **same** transactions store and the **same** scoring pipeline.
- **FR-ING-02 (MUST):** Batch upload validates schema/types and rejects malformed rows with row-level errors, never a crash.
- **FR-ING-03 (MUST):** Batch processing runs as a **background job** with a visible status (queued / running / done / failed, rows processed / rejected).
- **FR-ING-04 (MUST):** **Idempotency.** Each row has a unique `ingestion_hash` (hash of source + branch + canonical row content). Insert uses conflict-do-nothing, so replays never duplicate rows or double-count KPIs.
- **FR-ING-05 (MUST):** Every row records `source` ∈ {`batch_upload`, `live_demo`}.
- **FR-ING-06 (MUST) [PROPOSED]:** PaySim field mapping: `step` (hour index) → a synthetic timestamp from a fixed epoch. `nameOrig` → hashed account identifier. `nameDest` with a merchant-style prefix → merchant entity. `branch_id` per `FR-BR-03`. The exact mapping is owned by `SCHEMA_API.md`.

### 6.3 Feature engineering
- **FR-FEAT-01 (MUST):** All feature computation lives in **one shared module (`features.py`)** imported by **both** the batch path and the live path. Two independent implementations are forbidden (this prevents batch-vs-live skew).
- **FR-FEAT-02 (MUST):** Feature families: transaction-level (amount, type, balance delta), velocity (txn counts over 1h / 6h / 24h per account), balance anomaly, behavioral chain (e.g. TRANSFER → CASH_OUT), temporal (hour-of-day), amount deviation (z-score vs account history).
- **FR-FEAT-03 (MUST):** Velocity/rolling state is kept in **Redis (Upstash)** with an **in-memory dict fallback** when Redis is unreachable, so scoring still works (degraded, not down).
- **FR-FEAT-04 (MUST):** **Leakage audit.** Review 2 found a balance-error leakage issue in PaySim. Any feature derived from balance consistency checks MUST be audited for label leakage before it is allowed into the production model. Excluded or retained features must be documented with the reason.

### 6.4 Scoring engine
- **FR-SCORE-01 (MUST):** Three signals run for every transaction: **rules engine**, **XGBoost** (supervised), **autoencoder** (unsupervised).
- **FR-SCORE-02 (MUST):** **Rules engine** covers at least: velocity spike, balance-anomaly / zero-balance-after, TRANSFER→CASH_OUT chain, large-amount threshold, blacklist hit. Rules are split into **critical** (hard override) and **soft** (score nudge).
- **FR-SCORE-03 (MUST):** XGBoost outputs a **calibrated probability** (0–1). Class imbalance is handled with SMOTE and/or class weighting, applied to **training data only**.
- **FR-SCORE-04 (MUST):** The autoencoder is trained **only on legitimate transactions**. Its reconstruction error is **min–max normalized against train-time min/max** (stored with the model) to a 0–1 anomaly score.
- **FR-SCORE-05 (MUST):** **Score aggregation** (never a black box):
  1. Critical rule hit → ESCALATE immediately (bypasses ML).
  2. Otherwise `combined = 0.6 × xgb_calibrated + 0.4 × ae_normalized`.
  3. Soft rule hits add a **bounded boost**, capped at 1.0.
  4. Bands: `< 0.3` APPROVE · `0.3–0.7` REVIEW · `> 0.7` ESCALATE.
  Weights and thresholds are **initial values tuned on a validation set** and stored as configuration, not hardcoded.
- **FR-SCORE-06 (MUST):** **Graceful degradation.** If the ML service or a model fails to load, the rules engine keeps running and routes transactions to **REVIEW** instead of failing silently or dropping them.
- **FR-SCORE-07 (MUST):** Scoring a given transaction twice yields the same stored result (idempotent). No duplicate rows.

### 6.5 Decision policy
- **FR-DEC-01 (MUST):** Verdict values: `APPROVE`, `REVIEW`, `ESCALATE`, plus `BLOCK` (see `FR-DEC-04`).
- **FR-DEC-02 (MUST):** `APPROVE` is automatic for low scores with no critical rule hit.
- **FR-DEC-03 (MUST):** High-risk results are **auto-ESCALATED to a human**, never auto-blocked.
- **FR-DEC-04 (MUST):** **Single exception:** a transaction from an account/merchant **already confirmed fraudulent by a prior human verdict** (blacklist) MAY be auto-blocked. A human already made that call once.
- **FR-DEC-05 (MUST):** Thresholds are editable by Team Lead/Admin via the UI and changes are logged.

### 6.6 Explainability
- **FR-XAI-01 (MUST):** Every REVIEW/ESCALATE item shows a **reason panel**: (a) rule hits, (b) top SHAP feature contributions for XGBoost, (c) top per-feature **reconstruction-error** contributors for the autoencoder, phrased in plain language (e.g. "amount is 40× this account's average").
- **FR-XAI-02 (SHOULD):** SHAP and explanation generation run as **background tasks** so scoring latency isn't blocked. The UI shows the explanation as soon as it's ready.
- **FR-XAI-03 (MUST):** Explanations are persisted with the transaction so the audit trail is reproducible.

### 6.7 Analyst workspace
- **FR-AN-01 (MUST):** REVIEW queue list, sortable by score and time, filterable by branch and type.
- **FR-AN-02 (MUST):** Transaction detail view with score breakdown (rules / XGB / AE / combined), reason panel, ego-graph, and history for the account.
- **FR-AN-03 (MUST):** Verdict actions: **Confirm fraud**, **Dismiss (false positive)**, **Escalate**. Each writes an immutable audit record (who, what, when, notes).
- **FR-AN-04 (MUST):** Realtime updates: new REVIEW items appear without a page refresh.

### 6.8 Escalation workflow
- **FR-ESC-01 (MUST):** Escalation record fields: transaction, branch, severity (`critical`/`high`), raised by (nullable if auto), assigned to, status, raised at, resolved at, resolution notes.
- **FR-ESC-02 (MUST):** Statuses: `open`, `assigned`, `overdue`, `resolved`. Only Senior Analysts can claim and resolve.
- **FR-ESC-03 (MUST):** On creation, online Senior Analysts receive a realtime notification.
- **FR-ESC-04 (MUST):** **SLA fallback.** A scheduled check marks unclaimed escalations `overdue` after a configurable window **[PROPOSED default: 15 minutes for `critical`]**. Overdue items are highlighted on the Team Lead dashboard and remain claimable.
- **FR-ESC-05 (MUST):** Resolution requires notes and writes to the analyst-action log used for retraining.
- **FR-ESC-06 (SHOULD):** Senior Analyst can override an earlier Analyst verdict. The override is logged, not destructive.

### 6.9 Ego-graph (relationship view)
Inspired by PayPal's "Igor" investigator graph, an investigator should see **who an account is connected to**, not just one transaction.
- **FR-GRAPH-01 (MUST):** On a transaction/account detail page, render an **ego-graph**: the selected account as the center node and its **1-hop counterparties** (senders/receivers) as neighbors. Edges are transactions, with **edge thickness ∝ amount/volume**.
- **FR-GRAPH-02 (SHOULD):** Color-code nodes/edges (e.g. confirmed-fraud, flagged, normal). Hover shows amount, type, timestamp.
- **FR-GRAPH-03 (SHOULD):** Cap neighbors (e.g. top-N by volume) to keep the render fast and legible. Fall back to a simple list if the graph can't render.
- **FR-GRAPH-04 (MAY):** Expand to 2 hops on click. Out of scope for MVP.

### 6.10 Team Lead dashboard
- **FR-TL-01 (MUST):** Aggregate KPIs across all branches: transactions processed, flagged, confirmed fraud, false-positive rate, escalations open / assigned / overdue / resolved, mean time to claim and resolve.
- **FR-TL-02 (MUST):** Per-branch breakdown, so the lead can see which branch carries the most risk.
- **FR-TL-03 (MUST):** Model health panel: active model version, training date, and metrics (precision, recall, PR-AUC, F1).
- **FR-TL-04 (MUST):** Aggregates are served from the **analytics store (DuckDB, OLAP)** populated by periodic export from Postgres (OLTP). The UI shows a **"last refreshed" timestamp** and a manual refresh action. Refresh cadence **[PROPOSED: every 5 min + on-demand]**.
- **FR-TL-05 (MUST):** Threshold configuration UI per `FR-DEC-05`.

### 6.11 Admin
- **FR-ADM-01 (MUST):** Create/disable users, assign role, manage `user_branches`.
- **FR-ADM-02 (MUST):** Model-version management: list versions with metrics, mark one **active**.
- **FR-ADM-03 (SHOULD):** Newly trained versions are **shadow-scored** (scored and logged, not used for verdicts) against recent labeled data before promotion.

### 6.12 Live Simulator (separate app)
- **FR-SIM-01 (MUST):** A **standalone** Next.js app (`/frontend-simulator`), **not** a screen inside the dashboard.
- **FR-SIM-02 (MUST):** Branch selector, free-form transaction form, and **named preset scenario buttons**: normal payment; velocity burst (many rapid transactions); TRANSFER→CASH_OUT account-takeover chain; large new-recipient transfer; odd-hour high-amount; known-blacklist account.
- **FR-SIM-03 (MUST):** Each submission is a plain insert into the same store (`source = live_demo`) so it flows through the real pipeline.
- **FR-SIM-04 (SHOULD):** Doubles as the **scenario-based test harness**. Each preset documents its expected verdict band so it can be asserted in tests.

### 6.13 Model operations and retraining
- **FR-ML-01 (MUST):** Two models in the ensemble, **XGBoost + autoencoder**. No third model.
- **FR-ML-02 (MUST):** Autoencoder baseline architecture: `Input → Dense(100) → ReLU → Dense(20) → ReLU → Dense(100) → ReLU → Dense(N)` (N = input features). Small by design (thousands of parameters), trainable on CPU or free Colab.
- **FR-ML-03 (MUST):** Model artifacts are versioned and recorded with training date, data window and metrics. The scoring service loads the **active** version.
- **FR-ML-07 (MUST):** **Retraining is periodic, not real-time.** A scheduled job refits XGBoost, and **warm-start fine-tunes** the autoencoder (loads saved weights, continues training on new confirmed-normal data, saves).
- **FR-ML-08 (MUST):** Docs, UI copy and the viva MUST NOT claim real-time/online learning. The accurate phrase is **"periodic warm-start fine-tuning."**
- **FR-ML-09 (SHOULD):** Merchant/account risk features (e.g. historical fraud rate) are recomputed from confirmed labels on a schedule.

---

## 7. Screens inventory

| # | Screen | Roles | Key content |
|---|---|---|---|
| 1 | **Login** | All | Email/password. No signup link |
| 2 | **Analyst Dashboard** | Analyst, Senior | Branch switcher, REVIEW queue, filters, live updates |
| 3 | **Transaction Detail** | Analyst, Senior | Score breakdown, reason panel (rules/SHAP/AE), ego-graph, account history, verdict actions |
| 4 | **Escalation Queue** | Senior Analyst | open / assigned / overdue / resolved lists, claim + resolve, notifications |
| 5 | **Team Lead Dashboard** | Team Lead, Admin | Cross-branch KPIs, per-branch breakdown, SLA panel, model health, thresholds, last-refreshed |
| 6 | **Batch Upload** | Analyst, Senior, Admin | File picker, branch tag, validation errors, job status/progress |
| 7 | **Admin** | Admin | Users, roles, `user_branches`, model versions |
| 8 | **Simulator (separate app)** | Presenters | Branch select, form, preset scenarios, submission log |

**Explicitly no landing page.** An optional one-screen **context splash** before login (what this is, who it's for) is a demo courtesy only. **Open: D-3.**

---

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | **Reliability:** validation on every ingestion path, graceful degradation (`FR-SCORE-06`), background jobs for slow work, idempotent processing |
| NFR-02 | **Health:** `/health` reports DB, cache, and model-loaded status |
| NFR-03 | **Security:** RLS on all tenant data. Account identifiers hashed. Secrets in env vars, never in the repo. Audit log of verdicts, overrides and threshold changes |
| NFR-04 | **Performance (demo-grade):** live path p95 ≲ 1 s end-to-end. Batch of ~100k rows processes in the background with progress. No hard sub-100 ms claim |
| NFR-05 | **Deployment:** hosted for real (API on Render/Railway, frontends on Vercel, Supabase managed). **Not** demoed from localhost |
| NFR-06 | **Explainability:** no unexplained flag reaches an analyst |
| NFR-07 | **Maintainability:** single monorepo (Section 9.1), one shared `features.py`, typed API contracts, README with run instructions and demo credentials |
| NFR-08 | **Honesty:** documentation states known limitations (Section 12) rather than overclaiming |

---

## 9. Data, ML and technical constraints

### 9.1 Locked technical decisions (summary; details in `ARCHITECTURE.md`)
- **Frontend:** Next.js (App Router) + Tailwind + shadcn/ui, two apps: `/frontend-dashboard`, `/frontend-simulator`
- **Backend:** FastAPI (Python), scoring service + background jobs
- **OLTP:** Supabase Postgres (Auth, RLS, Realtime, Storage)
- **OLAP:** DuckDB analytics store fed from Postgres
- **Cache:** Upstash Redis with in-memory dict fallback
- **ML:** scikit-learn, XGBoost, PyTorch. **Explainability:** SHAP + reconstruction-error breakdown
- **Hosting:** Render/Railway (API) + Vercel (frontends) + Supabase (managed)
- **Monorepo layout:** `/backend`, `/frontend-dashboard`, `/frontend-simulator`, `/notebooks`, `/docs`, `/supabase`

### 9.2 Datasets
| Dataset | Role | Key facts |
|---|---|---|
| **PaySim** (primary) | Training and evaluation | 6,362,620 synthetic mobile-money transactions, 744 hourly steps, types CASH-IN / CASH-OUT / DEBIT / PAYMENT / TRANSFER, **8,213 frauds (~0.13%)**, interpretable columns, `isFlaggedFraud` rule (transfers > 200,000) usable as a naive-rules benchmark |
| **UPI Payment Transactions India** (supplementary) | India-specific validation only | ~20,000 synthetic rows, city tiers, ₹1L cap |

Citation note: PaySim's source paper is **Lopez-Rojas, Elmir & Axelsson, EMSS 2016** (a conference paper, **not** a "PhD thesis").

### 9.3 Prototype baseline (reported in Review 2, Colab)
| Item | Result |
|---|---|
| XGBoost | **PR-AUC 0.884**, **recall 94.2%** |
| Autoencoder | reconstruction MSE **0.286 → 0.004** during training |
| Finding | PaySim **balance-error leakage**, see `FR-FEAT-04` |

**Rules for using these numbers:** they are prototype results, so the production pipeline MUST re-evaluate after the leakage audit and report fresh metrics. The published benchmark figures from the Credit Card Fraud literature (e.g. AE AUC-ROC 0.836 vs Isolation Forest 0.808) apply to **that** dataset and MUST NOT be cited as expected PaySim results.

### 9.4 Evaluation protocol
- **MUST** use a held-out split that respects time ordering (or an account-grouped split) to avoid leakage from the same account appearing in train and test. **[PROPOSED]**
- **MUST** report PR-AUC, precision, recall, F1 and the confusion matrix. **MUST** compare against the `isFlaggedFraud` rule baseline.
- **SHOULD** report metrics with and without any leakage-suspect features.

---

## 10. Acceptance criteria: the viva demo script
The product is "demo-ready" when all of these pass **on the hosted deployment**:

1. Log in as **Analyst** → see the REVIEW queue for a chosen branch → switch branch → toggle All Branches.
2. In the **Simulator**, fire a **normal** transaction → it appears as APPROVE in history within about a second.
3. Fire the **TRANSFER→CASH_OUT** preset → it appears in the Analyst queue **live** with a reason panel (rules + SHAP + reconstruction error) and an ego-graph.
4. Analyst **escalates** it → a **Senior Analyst** (second browser) gets a realtime notification, **claims** and **resolves** it with notes.
5. Fire the **blacklist** preset → it is the only case that auto-blocks.
6. Leave a critical escalation unclaimed → it flips to **overdue** and shows on the **Team Lead** dashboard.
7. **Team Lead** dashboard shows cross-branch KPIs, per-branch risk, model version/metrics, and "last refreshed."
8. Upload a **CSV** (including a few malformed rows) → bad rows are reported, good rows are scored in the background with a progress indicator. **Re-upload the same file → zero duplicates.**
9. **Direct-API RLS test:** an out-of-scope user token cannot read restricted rows.
10. Kill the ML service (or unload the model) → transactions still flow, routed to REVIEW by the rules engine.

---

## 11. Team ownership

| Member | Owns | PRD sections |
|---|---|---|
| **Dhrubojyoti Hazra (Lead)** | Frontend + overall architecture: dashboards, escalation UI, design system | 6.7, 6.8 (UI), 6.10, 6.11 (UI), 7 |
| **Isheeka Mukhopadhyay** | ML pipeline, training/evaluation, **`features.py`**, model versioning | 6.3, 6.4 (models), 6.13, 9.2–9.4 |
| **Samprikta Dey** | FastAPI scoring service, **rules engine**, **score aggregator**, realtime wiring | 6.4, 6.5, 6.2 (service side) |
| **Adhiraj Das** | **SHAP/XAI**, **Live Simulator**, **ego-graph** | 6.6, 6.9, 6.12 |
| **Tiyasha Baidya** | **Supabase schema + RLS**, **DuckDB** analytics store, batch pipeline, **deployment** | 4, 6.1, 6.2 (batch), 6.10 (data), NFR-05 |

---

## 12. Honest-claims register (use this when writing reports, slides or UI copy)

| We CAN claim | We MUST NOT claim |
|---|---|
| Hybrid rules + supervised + unsupervised scoring, mirroring how Stripe Radar, Thirdwatch and Feedzai combine rules and ML | That we replicate Stripe/Thirdwatch/Feedzai |
| Periodic **warm-start fine-tuning** of the autoencoder | Real-time / online / continuous learning |
| A human confirms blocks, with one narrow blacklist exception | Fully autonomous blocking |
| Database-enforced (RLS) branch access | That the 5 branches are real institutions |
| Explanations for every flagged item | That the model is "fully interpretable" (the autoencoder is explained by reconstruction-error attribution) |
| Built on a public synthetic dataset | That results transfer to real bank data |
| We understand real systems' network effects and scoped them out | Cross-institution intelligence of any kind |
| Igor-inspired relationship graph for investigators | That PayPal's Igor was a neural network (it wasn't) |

**Known limitations to state openly:** synthetic data, no real adversary, no cross-institution signals, no sub-100 ms latency engineering, no card-network/regulatory integration.

---

## 13. Milestones

The original plan was **14 weeks**, in this order. Prototype/research is done, but the **build has not started**, so the calendar must be **re-baselined** against the real end-semester date (**Open: O-1**). Weeks below are **relative to build start (W1)**.

| Weeks | Milestone | Risk |
|---|---|---|
| W1–2 | Monorepo, Supabase schema, **RLS**, auth roles, seed data (5 branches, demo users) | Low |
| W3–4 | Batch ingestion, validation, idempotency, background jobs | Low |
| W5–6 | `features.py`, XGBoost + autoencoder, SHAP, aggregator, **leakage audit** | Medium |
| W7–8 | **Simulator + realtime wiring** (live path end to end) | **High, start early** |
| W9–10 | Escalation workflow + SLA/overdue + notifications | Medium |
| W11–12 | Team Lead dashboard, DuckDB analytics, ego-graph | Low–Medium |
| W13–14 | Reliability hardening, deployment rehearsal, demo script dry runs, docs | Low |

**Descope order if time runs out (cut from the bottom first):** ego-graph polish → DuckDB refresh cadence/automation → shadow scoring → 2-hop graph → extra rule types. **Never cut:** RLS, live path, explanations, escalation workflow, idempotency.

---

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Build hasn't started**, with a compressed calendar | Missed scope | Re-baseline (O-1), protect the "never cut" list, vertical-slice first (one transaction end to end before breadth) |
| Realtime wiring (W7–8) | Demo failure | Start the live path as a thin slice in W1–2, not W7 |
| PaySim label leakage inflates metrics | Overclaimed accuracy | `FR-FEAT-04` audit, report with/without suspect features |
| Branch/RLS contradiction unresolved | Rework of policies | Decide D-1 before schema work |
| Venue network / hosting cold starts | Demo failure | Hosted early, rehearsed on similar network, screen-recorded backup |
| Team bandwidth (competing commitments) | Slippage | Clear owners (Section 11), weekly vertical-slice check-ins |
| Autoencoder scores aren't well separated | Weak zero-day story | Tune on validation set, report honestly, rules + XGBoost still carry detection |

---

## 15. Open decisions (need an owner's answer)

| ID | Question | Proposed default |
|---|---|---|
| **D-1** | Analyst branch scope: all 5 by default vs own-branch only? | `user_branches` table, seeded with all 5 (Section 3.2) |
| **D-2** | How does PaySim get `branch_id`? | Deterministic hash(account) mod 5 (`FR-BR-03`) |
| **D-3** | Include a one-screen context splash before login? | Yes, as a skippable demo courtesy |
| **D-4** | SLA window for `critical` escalations? | 15 minutes, configurable |
| **D-5** | DuckDB refresh cadence? | Every 5 minutes + manual refresh |
| **D-6** | Which leakage-suspect features stay in the production model? | Decide after the audit, document either way |
| **O-1** | Real end-semester / final-demo date for re-baselining the 14 weeks | **Needs the date from the team** |

---

## 16. Glossary
- **Zero-day fraud:** a fraud pattern never seen before. Caught by the autoencoder because it looks "not normal" rather than "like a known trick."
- **Reconstruction error:** how badly the autoencoder fails to rebuild a transaction. High error means unusual.
- **RLS (Row-Level Security):** database rules that decide which rows each user can read, enforced even if someone calls the API directly.
- **Idempotent:** doing the same thing twice has the same result as doing it once. No duplicates.
- **Warm-start fine-tuning:** continuing training from saved weights on new data instead of starting over.
- **Ego-graph:** a picture of one account and the accounts directly connected to it.
- **SLA:** the time limit within which something must be picked up.
- **OLTP / OLAP:** the live transactional database vs the analytics store built for aggregate queries.
