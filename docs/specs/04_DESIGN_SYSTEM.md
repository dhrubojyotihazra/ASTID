# 04 — Frontend Design System & UI/UX Specification

### 1. Aesthetic Direction & Technical Foundation

* **Framework & Tooling:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, `shadcn/ui` (Radix primitives), `lucide-react` icons, `recharts` for financial metrics.
* **Visual Identity:** Institutional FinTech RiskOps Workbench (inspired by Stripe Radar, Linear dark mode, and Datadog). High-contrast slate/zinc dark theme:
  * Primary Background: `bg-slate-950`
  * Card Surfaces: `bg-slate-900/90 border border-slate-800 backdrop-blur-sm`
  * Typography: Inter / SF Pro Display; tabular numbers (`font-mono`) for all monetary amounts, scores, and timestamps.
* **Domestic Currency & Number Formatting:**
  * All transaction values display with the Indian Rupee symbol (**₹**) formatted according to Indian numbering standards (e.g., `₹2,45,000.00` rather than `₹245,000.00`).
* **Semantic Verdict Badges & Color Palette:**
  * `APPROVE` (< 0.30 or < τ*): Emerald (`bg-emerald-500/10 text-emerald-400 border-emerald-500/30`)
  * `REVIEW` (0.30 – 0.70 or ≥ τ*): Amber (`bg-amber-500/10 text-amber-400 border-amber-500/30`)
  * `ESCALATE` (≥ 0.70 OR Disjunctive Model Spike): Rose/Crimson (`bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse`)
  * `BLOCK` (Confirmed Blacklist Only): Violet/Purple (`bg-purple-500/10 text-purple-300 border-purple-500/40`)

---

### 2. Main Application Screens (`frontend-dashboard`)

#### 1. Login & Viva Evaluator Quick-Switch Drawer (`/login`)
* **Standard View:** Email & password input powered by Supabase Auth client.
* **Viva Evaluator Quick-Login Panel (Right-Hand Collapsible Drawer):**  
  Designed specifically for presentation day to let examiners and team members effortlessly demonstrate RLS security boundaries in one click:
  * `Branch Analyst Button`: Authenticates as Kolkata-SaltLake Analyst. RLS immediately restricts queue visibility to Branch 1 only.
  * `Senior Analyst Button`: Authenticates as Senior Escalation Lead. Unlocks the Escalation Queue and multi-branch cluster view.
  * `Team Lead Button`: Authenticates as Risk Manager. Unlocks global 5-branch executive KPIs, DuckDB Telemetry, PSI Drift Monitor, and the Threshold Simulator.
  * `Admin Button`: Authenticates as System Admin. Unlocks batch upload and model warm-start triggers.

#### 2. Branch Analyst Workbench (`/dashboard/analyst`)
* **Live Ingestion Feed:** Supabase Realtime WebSocket listener updating live as transactions are scored.
* **Transaction Detail Drawer (Slides in on Row Click):**
  * **Composite Score Meter:** Circular gauge showing final score (0.00–1.00) alongside side-by-side component meters: `XGBoost Calibrated Prob (60%)` and `Autoencoder Normalized Reconstruction Error (40%)`.
  * **Cost-Sensitive Bayes Pill:** Displays the dynamic threshold τ*(x) for the transaction amount (e.g., `Dynamic Cutoff τ*(₹2,45,000) = 0.08` vs `Raw Cutoff 0.30`), clearly explaining to investigators why a high-value payment is flagged even with moderate risk scores.
  * **Whitebox Risk Insights Badges:** Human-readable badges translating model internals into compliance-grade explanations:
    * `⚡ Velocity Anomaly: 6 txns in 1 hr (+0.38 SHAP)`
    * `📉 Account Evacuation: 99.8% balance drained (+0.31 SHAP)`
    * `⚠️ Novel Behavior: Autoencoder MSE 0.041 exceeds normal threshold tau (0.004)`
    * `🌍 Impossible Travel: 1,420 km/h between Kolkata & Mumbai (+0.35 Risk)`
  * **1-Hop Mule Ring Ego-Graph (Interactive Drawer Component):**
    * Directed network graph rendering connected origin accounts, intermediary mule VPAs, and final ATM cash-out points within a 24-hour window.
  * **Analyst Action Bar:**
    * Three distinct action buttons: `Mark False Positive`, `Confirm Fraud & Blacklist`, and `Escalate to Senior Analyst`. Logs decisions directly to `analyst_actions`.

#### 3. Senior Analyst Escalation Queue (`/dashboard/escalations`)
* **SLA Priority Queue:** Manages transactions flagged `ESCALATE` (composite score ≥ 0.70 or critical rule overrides).
* **State Management Tabs:**
  * `Open`: Unassigned cases awaiting review.
  * `Overdue (SLA Breached)`: Dynamically filtered cases exceeding the 15-minute resolution window. Visual red timer alert.
  * `Assigned to Me`: Cases claimed by the logged-in senior analyst.
  * `Resolved`: Completed cases with binding resolution notes.
* **Action Modal:** One-click `Claim Case` and `Resolve with Binding Verdict` modal.

#### 4. Team Lead Executive Dashboard (`/dashboard/team-lead`)
* **Live DuckDB Warehouse Telemetry Pill (Top Header):**
  * Displays real-time OLAP execution statistics: `⚡ DuckDB OLAP Engine: Scanned 6,362,620 transactions in 118 ms · In-Process Columnar Scan`.
* **5-Branch Cross-Regional Matrix:**
  * Performance table comparing Kolkata-SaltLake, Mumbai-BKC, Bengaluru-HSR, Delhi-Connaught, and Chennai-Guindy across:
    * Total Transactions Ingested
    * Fraud Prevented (₹ INR Value)
    * False Positive Friction Rate (%)
    * Open Escalations & SLA Breach Count
* **Model Drift Governance Card (Basel II / Fed SR 11-7):**
  * Live status pill (`GREEN` / `AMBER` / `RED`) showing latest Population Stability Index (`PSI = 0.0421`) and Kolmogorov-Smirnov statistics against frozen training deciles.
  * Bar chart comparing expected vs. actual score distributions across deciles.
* **Interactive Financial Impact & Threshold Simulator:**
  * Dual range sliders adjusting the `REVIEW` threshold (default 0.30) and `ESCALATE` threshold (default 0.70).
  * Evaluates the pre-scored held-out test split (`scored_test.parquet`, 50,000 rows) in real time to recompute:
    * **₹ Fraud Prevented** vs. **₹ Fraud Missed**
    * **Analyst Workload** (estimated daily queue volume per branch)
    * **Customer Friction Index** (genuine transactions held for review)
* **Model Integrity & Data Leakage Audit Tab:**
  * Side-by-side visualization comparing the naive model with data leakage (`errorBalanceDest` → fake `PR-AUC = 1.0000`) against our production behavioral model (`PR-AUC = 0.8842`, `Recall = 94.21%`).
  * Displays the `isFlaggedFraud` comparison (detects only 16 frauds = 0.19% recall).

#### 5. Batch Warehouse Ingestion & Admin View (`/dashboard/admin`)
* **Parquet / CSV Uploader:** Drag-and-drop zone with branch assignment selector and real-time upload/scoring progress bar.
* **Model Registry Table:** Lists active and shadow model versions (`model_versions`) with PR-AUC, Recall, and F1 scores.
* **Periodic Warm-Start Fine-Tuning Action:** Button to trigger the 3-epoch Autoencoder retraining loop on analyst-confirmed normal transactions with the 60-day delayed feedback blackout window enforced.

---

### 3. Live Transaction Simulator (`/simulator`)

* Accessible directly via the `/simulator` route or as an independent lightweight client during demo day.
* Includes a toggle for **Standard Scoring Mode** vs. **Cost-Sensitive Bayes Mode**.
* Features **5 Named Preset Scenario Buttons** to instantly demonstrate the system's hybrid scoring capabilities:
  1. **Preset 1: Legitimate Everyday UPI Payment**  
     * INR ₹1,850 · 02:30 PM · Normal Velocity (1 txn/hr) · Normal balance ratio.  
     * *Expected Verdict:* `APPROVE` (Score: ~0.08).
  2. **Preset 2: Account Takeover & Rapid Cash-Out Chain**  
     * INR ₹2,45,000 · 11:45 PM · 98% balance drained · Transfer followed by cash-out.  
     * *Expected Verdict:* `ESCALATE` (Score: 0.88 · High XGBoost SHAP attribution).
  3. **Preset 3: Zero-Day Midnight Anomaly**  
     * INR ₹74,500 · 03:15 AM · First-time counterparty · Unseen feature combination.  
     * *Expected Verdict:* `ESCALATE` via Disjunctive Gating (Low XGBoost prob 0.18, but Autoencoder MSE 0.048 spikes above $\tau$ → Autoencoder Norm 0.94 → Escalate).
  4. **Preset 4: Confirmed Blacklisted Mule VPA**  
     * Destination VPA: `mule992@okaxis` (present on verified fraud blacklist).  
     * *Expected Verdict:* `BLOCK` (Score: 1.00 · Critical Blacklist Override).
  5. **Preset 5: Impossible Travel Geo-Velocity Attack**  
     * INR ₹42,000 · Transaction from Kolkata at 02:00 PM followed by transaction from Mumbai at 02:20 PM.  
     * Calculated Haversine speed: **1,420 km/h** (>900 km/h commercial flight limit).  
     * *Expected Verdict:* `ESCALATE` (Geo-Velocity Anomaly Boost + Whitebox Badge `⚡ Impossible Travel: 1,420 km/h`).
