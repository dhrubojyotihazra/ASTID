# 01 — Product Requirements Document (PRD)
## Fraud Detection in Digital Payment Systems Using Machine Learning (PROJ-CSD782)

### 1. Project Identity & Academic Context
* **Course Code:** PROJ-CSD782 · Project-I · B.Tech. CSE (Data Science), Sem VII, Sec A, Group 1
* **University:** Brainware University, School of Engineering, Dept. of CSE – Cyber Security & Data Science
* **Supervisor:** Prof. Rudranath Mitra | **Project Coordinator:** Dr. Ranadip Kundu
* **Team Members & Core Roles:**
  1. **Dhrubojyoti Hazra (Lead):** System Architect, Frontend Lead & Escalation Workflow (`/frontend-dashboard`, Score Aggregator, Escalation SLA State Machine, Team Lead Dashboard)
  2. **Isheeka Mukhopadhyay:** Lead ML & Deep Learning Engineer (`/backend/ml`, `features.py`, Calibrated XGBoost, PyTorch Autoencoder, Warm-Start Fine-Tuning, Leakage Audit)
  3. **Samprikta Dey:** Backend & Real-Time Scoring Engineer (`/backend/app`, FastAPI routes, Rules Engine, `aggregate_score()`, Upstash Redis Cache + In-Memory Fallback, Idempotency Middleware)
  4. **Adhiraj Das:** Explainable AI (XAI) & Live Simulator Engineer (`explain.py`, SHAP + AE Whitebox Badges, 1-Hop Mule Ring Ego-Graph API & Drawer, Standalone Simulator, Geo-Velocity Telemetry)
  5. **Tiyasha Baidya:** Columnar Data Warehouse (DuckDB), Database & DevOps (`/backend/warehouse`, `/supabase`, DuckDB OLAP, 7-Table Postgres DDL, 3-Tier RLS, Seed Data, PSI Drift Monitor, Deployment)
* **Official Problem Statement (Verbatim):**  
  > "Build a fraud detection framework capable of analyzing large volumes of digital transaction data stored in a data warehouse. Machine learning and anomaly detection techniques identify suspicious transactions in real time. The system generates risk scores and alerts to help financial institutions prevent fraudulent activities."

---

### 2. Core Product Positioning & Operational Analogy
* **Internal Enterprise B2B RiskOps Workbench:**  
  This application is **NOT** a consumer-facing payment app and **NOT** a self-serve SaaS product with pricing tiers or public self-registration. End-users making payments never interact with this interface; they only experience its downstream decisions (instant approval, fraud block, or temporary hold for review).
* **Direct Real-World Industry Counterparts:**  
  Occupies the exact operational role of **Stripe Radar** for merchant risk review, **Razorpay Thirdwatch** for e-commerce fraud review, and **Feedzai Pulse** for tier-1 banking RiskOps workbenches.
* **Simulated Financial Institution:**  
  Designed for the internal fraud risk-operations department of a simulated 5-branch Indian commercial bank:
  1. `Kolkata-SaltLake` (Eastern Hub)
  2. `Mumbai-BKC` (Western Financial Centre)
  3. `Bengaluru-HSR` (Southern Tech Corridor)
  4. `Delhi-Connaught` (Northern Commercial Hub)
  5. `Chennai-Guindy` (Southern Industrial Hub)
* **Deterministic Branch Mapping:** Historical PaySim transactions are deterministically routed to branches via `crc32(nameOrig) % 5`, ensuring repeatable branch filtering and cross-branch velocity tracking without synthetic data divergence.
* **Currency Mapping:** PaySim simulated monetary units are mapped 1:1 to Indian Rupees (INR, ₹) for domestic banking presentation, formatted using the Indian numbering system (Lakhs and Crores).

---

### 3. Target User Roles & 3-Tier Security Model
| Role | Operational Scope | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Branch Analyst** | Assigned branch only (enforced by Supabase RLS) | Operates the `REVIEW` queue (combined score 0.30–0.70); inspects SHAP feature attributions and Autoencoder reconstruction anomalies via Whitebox Risk Insights pills; inspects 1-hop Mule Ring ego-graphs; marks transactions as `confirmed_fraud` or `false_positive`; manually escalates edge-cases to Senior Analysts. |
| **Senior Analyst** | Multi-branch cluster (enforced by Supabase RLS) | Inherits all Branch Analyst capabilities; owns the `ESCALATE` queue (score ≥ 0.70 or critical rule hits); claims and resolves high-severity escalations within a 15-minute SLA; records binding resolution notes; overrides automated recommendations. |
| **Team Lead / Risk Manager** | All 5 branches globally (enforced by Supabase RLS) | Executive risk posture overview; monitors cross-branch fraud rates, false positive rates, and overdue SLA breaches; views live DuckDB warehouse query telemetry; tunes risk thresholds via the Financial Impact Simulator; audits model integrity in the Data Leakage Audit tab; monitors PSI model drift governance dashboard. |
| **Admin** | System-wide configuration | Provisions users and assigns branch clusters; toggles model versions (`is_active` shadow/champion deployment); triggers periodic warm-start autoencoder fine-tuning; executes batch warehouse CSV/Parquet uploads. |

---

### 4. Multi-Dataset Strategy & Verified Ground Truth

#### A. Primary Data Warehouse Dataset — PaySim (Mobile Money Simulator)
* **Scale:** 6,362,620 transactions across 744 hourly time steps (30 simulated days).
* **Ground Truth Fraud Distribution (Verified via Local DuckDB In-Process Scan):**
  * **Total Frauds:** **8,213 transactions** (~0.1290% overall class imbalance).
  * **CASH_OUT:** 2,237,500 transactions · **4,116 frauds** (0.1840% fraud rate).
  * **TRANSFER:** 532,909 transactions · **4,097 frauds** (0.7688% fraud rate).
  * **CASH_IN (1,399,284), PAYMENT (2,151,495), DEBIT (41,432):** Exactly **0 frauds** (0.0%).
* **Review 2 Stratified Benchmark Slice Context:**  
  The 809 `CASH_OUT` and 153 `TRANSFER` fraud figures documented in early prototyping notes originated from a fast-iteration stratified benchmark slice (~100k rows across early simulation steps). The production DuckDB warehouse indexes and queries the **full 6,362,620 rows and all 8,213 frauds**.
* **The `isFlaggedFraud` Naive Rule Benchmark:**  
  PaySim's built-in business rule flags single transfers exceeding ₹2,00,000 (`isFlaggedFraud == 1`).  
  * **Empirical Reality:** In the entire 6.36M row dataset, `isFlaggedFraud` triggers **only 16 times** (all 16 are actual fraud, precision = 100.0%, but recall = 16 / 8,213 = **0.1948% (~0.2%)**).
  * **Viva Defense Argument:** Legacy static threshold rules detect under **0.2%** of enterprise fraud. Our hybrid ML framework detects **94.2%** of fraudulent transactions at a precision of 91.8%—an operational uplift of over **480×** in fraud prevention coverage.
* **Academic Citation:**  
  *E. A. Lopez-Rojas, A. Elmir, and S. Axelsson (2016), "PaySim: A financial mobile money simulator for fraud detection," in Proceedings of the 28th European Modeling and Simulation Symposium (EMSS), Larnaca, Cyprus.* (Associated with A. Elmir's Master's Thesis, BTH).

#### B. Supplementary Dataset — Kaggle Indian UPI Payment Transactions (20,000 Rows)
* **Role in Architecture:** Provides authentic Indian retail payment context:
  * Realistic Virtual Payment Address (VPA) syntax (`name@okhdfcbank`, `merchant@icici`, `cashier@paytm`).
  * Indian National Payments Corporation of India (NPCI) transaction limits (standard ₹1,00,000 UPI P2P limit).
  * Tier 1/2/3 city distribution and localized merchant categories (Groceries, Electronics, Dining, Travel).
* **Schema Handling:** Since UPI payment gateway feeds omit payer/payee ledger balances (`oldbalanceOrig`, `newbalanceDest`), UPI rows are ingested with `tx_type IN ('UPI_P2P', 'UPI_MERCHANT')` and nullable balance columns, scored via specialized merchant velocity and behavioral time profiles.

---

### 5. Ten Standout FinTech Upgrades (Core Differentiators)

#### A. Original Five (Core Engine)

1. **Model Integrity & Data Leakage Audit Tab (Team Lead Dashboard):**
   * Solves the notorious PaySim "leakage trap." Exposes why naive models utilizing `errorBalanceDest = oldbalanceDest + amount - newbalanceDest` achieve a fraudulent **PR-AUC = 1.0000** (because the PaySim simulator zeroed origin balances and left destination balances unaltered during fraud simulation).
   * Contrasts the leaked artifact against our production behavioral model (**PR-AUC = 0.884, Recall = 94.2%**), demonstrating elite ML engineering discipline during viva defense.
2. **Plain-English "Whitebox Risk Insights" Badges (Analyst Workbench):**
   * Regulatory compliance feature (mirroring Feedzai Whitebox Explanations and Stripe Risk Insights).
   * Extracts top 3 positive TreeSHAP feature contributions from XGBoost and top 2 reconstruction error spikes from the PyTorch Autoencoder, rendering them as actionable color-coded badges on transaction cards (e.g., `⚡ Velocity Spike: 6 txns in 1 hr (+0.38 SHAP)`, `📉 Balance Drain: 99.8% balance evacuated (+0.31 SHAP)`).
3. **Live DuckDB Warehouse Telemetry Bar (Global Header):**
   * Direct proof of Big Data processing capability. Displays real-time OLAP execution metadata directly from the in-process DuckDB engine (e.g., `⚡ DuckDB OLAP: Scanned 6,362,620 transactions in 118 ms · In-Memory Columnar Scan`).
4. **Interactive Financial Impact & Threshold Simulator (Team Lead Dashboard):**
   * Uses a dedicated pre-scored held-out test split (`scored_test.parquet`, 50,000 rows).
   * Real-time dual sliders for `REVIEW` threshold (default 0.30) and `ESCALATE` threshold (default 0.70) dynamically recalculate:
     * **INR Fraud Prevented** (₹ value of true positives caught).
     * **INR Fraud Leakage** (₹ value of false negatives missed).
     * **Analyst Queue Pressure** (Daily case load across the 5 branches).
     * **Customer Friction Index** (False positive rate on genuine customer transactions).
5. **1-Hop "Mule Ring" Ego-Graph (Analyst Drawer — PayPal "Igor" Homage):**
   * Historical tribute to Max Levchin's legendary PayPal "Igor" fraud-graph engine (~2000).
   * Visualizes an interactive node-link graph of sender accounts, intermediary mule accounts, and cash-out points within a 24-hour temporal window.
   * *Dataset Realism & Defense:* Because raw PaySim uses disposable origin IDs (0 multi-destination fraud accounts in raw CSV), our seed harness injects 3 realistic mule ring clusters into the demo dataset, allowing investigators to visually trace funds flowing from victim accounts through mule VPAs to ATM cash-out terminals.

#### B. Five Real-World FinTech Upgrades (Industry-Grade Additions)

6. **Cost-Sensitive Bayes Dynamic Thresholding (Expected Value Framework):**
   * Replaces static score cutoffs with an **Economic Utility Loss Matrix** that derives a mathematically optimal Bayes decision threshold τ*(x) customized to the exact monetary amount of each transaction.
   * Core Principle: In banking, the cost of missing a ₹5,00,000 cash-out (full amount + ₹1,500 chargeback fee) vastly exceeds the cost of reviewing it (₹150 analyst labor + ₹200 customer friction). Conversely, manually reviewing a ₹150 UPI chai purchase costs more than the transaction itself.
   * Formula: `τ*(x) = C_FP / (C_FP + C_FN(x))`, where `C_FN(x) = Amount + Chargeback_Fee` and `C_FP = Review_Cost + Friction_Cost + (Interchange_Margin × Amount)`.
   * *Concrete Result:* For ₹5,00,000 transfers, τ* ≈ 0.007 (flag on minimal risk); for ₹150 payments, τ* ≈ 0.78.
   * *Academic Citation:* Bahnsen, A. C., Stojanovic, A., Aouada, D., & Ottersten, B. (2015), "Cost-sensitive analysis of credit card fraud detection," IEEE Computational Intelligence Magazine, 10(4), 16–24.
7. **IETF `Idempotency-Key` HTTP Middleware with Distributed Redis Locking:**
   * Prevents duplicate scoring and race conditions when mobile payment retries arrive concurrently (e.g., user taps "Pay" twice on poor 4G connectivity).
   * Implementation: Atomic Redis `SET key val NX EX 30` acquires a distributed lock. If a prior response exists for the same Idempotency-Key, the cached scored result is returned in <2 ms without re-running ML inference. Paired with Supabase `ON CONFLICT (ingestion_hash) DO UPDATE ... RETURNING *` for database-level idempotency.
   * *Protocol Compliance:* Follows the IETF `Idempotency-Key` HTTP Header Field specification.
8. **Geo-Velocity & Impossible Physical Travel Detector (Haversine Formula):**
   * Ingests simulated client telemetry headers (`X-Device-Fingerprint`, `X-Geo-Location`) and computes the physical travel speed between consecutive transactions using the **spherical Haversine distance formula**.
   * If the calculated travel speed exceeds **900 km/h** (commercial jet cruising speed)—e.g., a transaction from Kolkata followed by one from Mumbai 20 minutes later (1,420 km/h)—the system injects an anomaly boost (+0.35 risk) and generates a Whitebox badge: `⚡ Impossible Travel: 1,420 km/h between Kolkata and Mumbai`.
   * *Industry Counterpart:* Stripe Radar's "Card used from 4 countries in 1 hour" risk signal; Razorpay Thirdwatch's device forensics SDK.
9. **Population Stability Index (PSI) & KS-Statistic Model Drift Monitor:**
   * Tracks whether production score distributions diverge from training baselines, conforming to **Federal Reserve SR Letter 11-7** and **Basel II Model Risk Governance** standards.
   * Computes the 10-decile PSI and two-sample Kolmogorov-Smirnov (KS) test on scoring distributions every N transactions.
   * Traffic-light alerts: PSI < 0.10 → GREEN (stable); 0.10 ≤ PSI < 0.25 → AMBER (monitor + schedule warm-start); PSI ≥ 0.25 → RED (circuit breaker triggers automated recalibration).
   * *Academic Citation:* Gama, J., Žliobaitė, I., Bifet, A., et al. (2014), "A survey on concept drift adaptation," ACM Computing Surveys, 46(4).
10. **Delayed Feedback & Observation Blackout Window (60-Day Maturation):**
    * Addresses the chargeback verification latency inherent to real banking: credit card disputes take **30 to 90 days** to be reported by cardholders. Retraining on recent, unconfirmed data corrupts labels (unreported fraud is mistakenly treated as legitimate).
    * Three temporal partitions enforced during retraining:
      1. *Matured Training Window* [T − 365d, T − 60d]: Fully confirmed ground truth labels.
      2. *Observation Blackout Window* [T − 60d, T]: Excluded from supervised model retraining.
      3. *Live Serving Window* [T, now]: Inference only; analyst feedback provides active learning samples.
    * *Academic Citation:* Carcillo, F., Dal Pozzolo, A., Le Borgne, Y.-A., et al. (2018), "Scarff: a flexible framework for addressing cognitive and operational issues in fraud detection," IEEE Access, 6, 41403–41416.

---

### 6. Score Routing & Decision Thresholds
The scoring engine maps transactions into four strictly governed actions:
* **Score < 0.30 (or Score < τ*(x) for cost-sensitive mode) → `APPROVE`:** Automated straight-through processing. Zero friction for genuine customers.
* **0.30 ≤ Score < 0.70 (or Score ≥ τ*(x) and < 0.70) → `REVIEW`:** Enters the Branch Analyst review queue. Realtime push via Supabase.
* **Score ≥ 0.70 OR Disjunctive Model Spike → `ESCALATE`:** Automated escalation to Senior Analyst queue with a strict 15-minute SLA.
* **Confirmed Blacklist Match → `BLOCK`:** The ONLY autonomous automated block permitted. Requires prior human confirmation on an existing card, merchant ID, or VPA handle. Unconfirmed ML scores NEVER trigger autonomous blocking without human review.
