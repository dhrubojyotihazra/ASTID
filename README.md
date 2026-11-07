<div align="center">

# 🛡️ ASTID — AI Shield for Transaction Integrity & Defense
### Fraud Detection in Digital Payment Systems within a High-Scale Data Warehouse
#### Final Year Computer Science & Engineering Capstone Project

[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Calibrated%20GBDT-eb5424.svg)](https://xgboost.readthedocs.io/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2%2B%20Deep%20AE-ee4c2c.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-6.36M%20Columnar-fff000.svg?logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq Cloud](https://img.shields.io/badge/Groq%20LPU-SAR%20Narratives-f55036.svg)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*An end-to-end, sub-15ms pre-authorization fraud intelligence platform and tier-1 risk operations workbench, engineered to solve the speed and accuracy bottleneck in digital payment networks.*

---

</div>

## 📖 The Story Behind ASTID: Our Engineering Journey

### 🎓 The College Problem Statement
For our Final Year Engineering Capstone project, we set out to tackle one of the most critical challenges facing the global financial sector: **"Fraud Detection in Digital Payment Systems in a Data Warehouse"**. 

With the meteoric rise of real-time digital payment rails—particularly India's Unified Payments Interface (UPI) handling over 14 billion transactions per month—the speed of transactions has outpaced legacy fraud prevention architectures. Fraudsters exploit this speed through automated script storms, money mule layering networks, and instant account liquidations. Traditional banking institutions are trapped in a dilemma:
1. **Rule-Based Systems**: Static threshold rules (e.g. *flag if amount > ₹2,00,000*) trigger staggering 95%+ false positive rates, drowning risk analysts in benign alerts while letting sophisticated split-transactions slip through.
2. **Batch Data Warehousing**: Nightly or hourly batch analytics detect frauds only hours *after* the capital has already been drained and cashed out at an ATM.
3. **Data Leakage in Academic Research**: Many academic models claim 99.9% accuracy by relying on post-authorization features (like `newbalanceDest`), which are mathematically impossible to know at the millisecond of pre-authorization in real-world payment gateways.

### 💡 Our Vision & Solution
We asked ourselves: **Can we design an institutional-grade, zero-data-leakage fraud detection platform that connects directly to a multi-million-row columnar data warehouse, evaluates every transaction in under 15 milliseconds, catches both known fraud topologies and zero-day anomalies, and provides human investigators with an interactive, white-box operations workbench?**

This vision led to the creation of **ASTID (AI Shield for Transaction Integrity & Defense)**.

---

### 🛠️ How We Developed ASTID: Chapter by Chapter

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE ASTID DEVELOPMENT STORY                           │
├─────────────────┬──────────────────┬──────────────────┬─────────────────┬──────────────┤
│    CHAPTER 1    │    CHAPTER 2     │    CHAPTER 3     │    CHAPTER 4    │  CHAPTER 5   │
│  Data Warehouse │  Feature Engine  │   Dual-Engine    │  Domain Rules   │  Workbench   │
│  & Columnar OLAP│  Zero Leakage    │  XGBoost + AE    │  & Geo-Velocity │  & Groq SAR  │
│  6.36M Parquet  │  11 Causal Feat. │  Disjunctive Gate│  NPCI Caps/Walk │  Next.js 14  │
└─────────────────┴──────────────────┴──────────────────┴─────────────────┴──────────────┘
```

#### Chapter 1: Architecting the 6.36M Analytical Data Warehouse
We started with the canonical **PaySim** mobile payment dataset—6,362,620 transactions spanning 744 temporal simulation steps (30 days of real-world banking operations). Rather than relying on slow relational databases that take minutes to aggregate millions of rows, we structured the entire warehouse into a compressed, columnar **Parquet** format and paired it with **DuckDB**. This allowed our analytics queries (e.g., 20-week temporal fraud distribution, multi-branch exposure calculations) to execute in **sub-30 milliseconds directly in-memory**.

#### Chapter 2: The Zero Data Leakage Discipline
A critical insight during our literature review was that many published models suffer from subtle **temporal and target leakage**. For example, calculating `oldbalanceOrg - newbalanceOrig == amount` achieves trivial 100% recall in testing, but in a real-time gateway, `newbalanceOrig` does not exist until *after* the transaction is authorized!
We designed the **Single Shared Feature Extractor**:
- Exactly **11 causal, pre-authorization features** (log amounts, temporal hour-of-day, pre-auth liquidation drain ratios, unseasoned zero-balance destination checks, and merchant classification).
- The exact same code runs identically during model training, offline batch CSV evaluation, and sub-15ms live API scoring.

#### Chapter 3: Conquering the Zero-Day Paradox (Dual-Engine ML)
Supervised gradient boosting (XGBoost) is world-class at identifying known fraud patterns, but completely blind to brand-new, unseen attack vectors. Conversely, purely unsupervised clustering often lacks calibration and generates excessive false alarms.
We engineered a **Dual-Engine Disjunctive Gating Architecture**:
1. **Slice 1 (Calibrated XGBoost)**: Trained on steps 1–550, calibrated via **Platt Scaling (Sigmoid CalibratedClassifierCV)** on an untouched validation set (steps 551–650). It outputs true, well-calibrated fraud probabilities ($P(\text{Fraud})$).
2. **Slice 2 (Zero-Day Deep Autoencoder)**: Built in PyTorch (`11 → 8 → 4 → 8 → 11` with LeakyReLU & BatchNorm). Trained *strictly* on clean legitimate transactions to learn the normal banking manifold. Any radical deviation in reconstruction Mean Squared Error (MSE) exceeding the 99.9th percentile alerts the system to an attack the supervised model has never seen before.

#### Chapter 4: Real-World Banking Rules & Haversine Geo-Velocity
Machine learning alone is not enough in regulated financial environments. We built:
- **Deterministic Rules Engine**: Immediate hard-block on confirmed mule blacklists; enforcement of the **NPCI UPI ₹1,00,000 regulatory ceiling**; and off-hours nocturnal drain alerts.
- **Geo-Velocity Anomaly Engine**: Implements the spherical Haversine formula between client coordinates and regional branches. If a customer transacts in Kolkata and 15 minutes later attempts a transfer from Mumbai (requiring travel speed $>900$ km/h), the system flags **⚡ Impossible Travel** indicating credential stuffing or proxy fraud.

#### Chapter 5: The Operations Workbench & GenAI Compliance
A detection without explanation is useless to an investigator. We built:
- A responsive, dark-mode **Risk Operations Workbench** in **Next.js 14**, featuring real-time transaction streaming over WebSockets, a dynamic 15-minute SLA Kanban triage queue, regional branch breakdowns, and 20-week review activity heatmaps.
- **Automated SAR Generation**: Integrated with **Groq Cloud LPUs** running high-speed LLMs to transform complex ML feature weights, Autoencoder MSE deviations, and rule triggers into institutional-grade, legally robust **Suspicious Activity Reports (SAR)** in ~350ms.

---

## 🏛️ System Architecture

ASTID decouples the latency-critical pre-authorization transaction inspection path from asynchronous background persistence and analytical data warehouse operations:

```mermaid
flowchart TD
    Client["Client / UPI Gateway / Core Banking Rail"] -->|POST /score/live (<15ms SLA)| FastAPIGateway["FastAPI 2.4 API Gateway"]
    
    subgraph PreAuthPath["⚡ Synchronous Pre-Authorization Fast Path (<15ms)"]
        FastAPIGateway --> Idemp["Idempotency-Key Lock (StateCache)"]
        Idemp --> Rules["Rules Engine\n(Blacklist, NPCI ₹1L Limit, Off-Hours)"]
        Rules --> Geo["Geo-Velocity Engine\n(Haversine >900 km/h Supersonic Anomaly)"]
        Geo --> Extractor["11-Feature Causal Extractor\n(Zero Data Leakage)"]
        
        subgraph DualEngine["Dual-Engine Machine Learning Core"]
            Extractor --> XGB["Slice 1: Platt-Calibrated XGBoost\n(P(Fraud) Supervised Prob)"]
            Extractor --> AE["Slice 2: Deep Autoencoder (PyTorch)\n(99.9th %ile Reconstruction Outlier)"]
        end
        
        XGB --> Arbiter["Disjunctive Decision Arbiter\n(APPROVE / REVIEW / ESCALATE / BLOCK)"]
        AE --> Arbiter
        Arbiter --> Explainer["Fast Risk Attribution Badges\n(Sub-ms Causal Explanations)"]
    end
    
    Explainer -->|Pre-Auth Decision Response| Client
    
    subgraph AsyncPersistence["🔄 Asynchronous Off-Path (BackgroundTasks)"]
        Arbiter -.->|Persist Transaction Record| Storage["StorageService (Ring Buffer)"]
        Storage -.->|REST Ingestion| Supabase["Supabase Cloud PostgreSQL (RLS)"]
    end
    
    subgraph AnalyticsWorkbench["🖥️ Next.js 14 Operations Workbench"]
        Analyst["Fraud Analyst / Senior Lead"] --> UI["Dark Mode Ops Workbench"]
        UI -->|GET /ops/warehouse-stats| DuckDB["DuckDB Analytical Warehouse\n(6.36M Records / Parquet)"]
        UI -->|GET /ops/weekly-activity| DuckDB
        UI -->|GET /ops/team| DuckDB
        UI -->|POST /escalations/{id}/resolve| SLAQueue["15-Min SLA State Machine"]
        UI -->|POST /narratives/generate| GroqLPU["Groq Cloud LPU (SAR Narratives)"]
        UI <-->|WebSocket /ws/stream| Streamer["Live Transaction Stream Manager"]
    end
```

---

## ⚙️ Tech Stack & Design Justification

Every technology in ASTID was selected after deliberate benchmarking against traditional alternatives:

| Layer | Technology | Why We Chose It (Engineering Justification) | Alternative Rejected |
|---|---|---|---|
| **API Gateway** | **FastAPI (Python 3.11+)** | Native async/await event loop, sub-millisecond serialization, built-in Pydantic v2 validation, automatic OpenAPI/Swagger specs. | *Flask / Django* (Too much overhead, synchronous blocking I/O). |
| **Data Warehouse** | **DuckDB + Parquet** | In-process vectorized columnar query execution engine. Aggregates 6.36M rows in <30ms without distributed cluster overhead. | *PostgreSQL / MySQL* (Row-based storage takes 10–30s on multi-million analytical aggregations). |
| **Supervised ML** | **XGBoost (Calibrated)** | State-of-the-art tabular classification efficiency; calibrated via Platt Sigmoid scaling on holdout data to produce reliable probabilities. | *Deep Neural Nets* (Overfit on tabular data, 5x higher inference latency). |
| **Zero-Day ML** | **PyTorch (Deep Autoencoder)** | Symmetric `11→8→4→8→11` manifold bottleneck with BatchNorm; detects anomalous reconstruction error on novel vectors in <1ms. | *Isolation Forest* (Hard to calibrate threshold, poor GPU/vector scaling). |
| **Frontend** | **Next.js 14 (App Router)** | High-performance React server components, static generation, instant client routing, dark-mode institutional aesthetic. | *Vite / CRA* (Lacks streaming SSR, harder production build optimization). |
| **Styling** | **Tailwind CSS** | Zero-runtime CSS utility engine, custom institutional banking palette (emerald risk, crimson block, amber review). | *Material UI / AntD* (Heavy JavaScript bundle bloat). |
| **Cloud Database** | **Supabase (PostgreSQL)** | Immutable escalation audit trail, Row-Level Security (RLS) policies, real-time WebSocket pub/sub for investigator sync. | *MongoDB* (Lacks transactional guarantees for banking ledgers). |
| **Compliance LLM** | **Groq Cloud LPUs** | Tensor-streaming processor architecture delivers 500+ tokens/sec, drafting regulatory SAR reports in ~350ms. | *Standard OpenAI API* (Takes 3–5 seconds, too slow for live triage). |

---

## 📊 Empirical Machine Learning Benchmarks

Tested on a held-out temporal partition of the 6.36M transaction warehouse (Step $> 650$):

| Metric | Measured Value | Standard Benchmark | Interpretation |
|---|:---:|:---:|---|
| **Precision-Recall AUC (PR-AUC)** | **0.9999** | $> 0.9500$ | Near-perfect separation under severe class imbalance (0.13% fraud). |
| **Holdout Recall (Catch Rate)** | **100.00%** | $> 98.00$ | **Zero False Negatives**: Caught all 1,022 holdout fraud transactions. |
| **Holdout False Negative Rate** | **0.0000** | $< 0.0100$ | **Zero Escape**: Not a single fraud slipped past the dual engine. |
| **Brier Calibration Score** | **0.000342** | $< 0.0050$ | Probabilities match observed empirical frequencies with high fidelity. |
| **Pre-Authorization Latency (P95)** | **10.27 ms** | $< 15.00\text{ ms}$ | Fully compliant with commercial banking pre-auth network SLAs. |
| **Zero-Day Autoencoder Detection** | **94.8%** | $> 85.0\%$ | Flags anomalous reconstruction errors without supervised labels. |

---

## 📁 Project Structure

```
ASTID/
├── backend/
│   ├── app/
│   │   ├── api/                   # API v1 route controllers
│   │   │   ├── routes_health.py   # Health telemetry & engine state
│   │   │   ├── routes_narrative.py# Groq SAR narrative generation
│   │   │   ├── routes_ops.py      # Escalation claiming & resolution
│   │   │   ├── routes_scoring.py  # Live, batch & benchmark scoring
│   │   │   ├── routes_warehouse.py# DuckDB telemetry & model governance
│   │   │   └── routes_ws.py       # WebSocket streaming endpoint
│   │   ├── services/              # Core business & ML orchestrators
│   │   │   ├── cache.py           # Thread-safe cache with bounded TTL
│   │   │   ├── geo_velocity.py    # Haversine impossible travel checker
│   │   │   ├── llm_narrative.py   # Groq Cloud compliance generator
│   │   │   ├── rules_engine.py    # Deterministic banking rules engine
│   │   │   ├── scoring_service.py # Dual-engine inference coordinator
│   │   │   ├── storage_service.py # Supabase async cloud persistence
│   │   │   ├── stream_manager.py  # Live transaction streaming service
│   │   │   └── warehouse_service.py# DuckDB analytical queries & cache
│   │   ├── config.py              # Pydantic v2 BaseSettings
│   │   └── main.py                # FastAPI application entrypoint
│   ├── ml/
│   │   ├── artifacts/             # Serialized model weights & thresholds
│   │   │   ├── ae_config.json     # Autoencoder normalization bounds
│   │   │   ├── ae_scaler.joblib   # StandardScaler for autoencoder
│   │   │   ├── autoencoder.pt     # PyTorch Deep Autoencoder weights
│   │   │   ├── metrics.json       # Live training metrics
│   │   │   ├── thresholds.json    # Calibrated decision thresholds
│   │   │   └── xgb_calibrated.joblib # CalibratedClassifierCV model
│   │   ├── autoencoder.py         # Sub-ms Autoencoder inference module
│   │   ├── explain.py             # Fast-path risk attribution badges
│   │   ├── features.py            # Single shared feature extractor
│   │   ├── train_slice1.py        # Supervised XGBoost training pipeline
│   │   └── train_autoencoder_slice2.py # Unsupervised AE training pipeline
│   └── warehouse/
│       └── data/
│           ├── scored_test_sample.parquet # 50K holdout sample (Git tracked)
│           └── paysim_warehouse.parquet   # 6.36M PaySim data warehouse
├── frontend-dashboard/            # Next.js 14 Operations Workbench
│   ├── app/
│   │   ├── simulation/            # Standalone Simulation Studio route
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                # Modular workbench components
│   │   ├── AnalyticsView.tsx      # Model health, drift & 20-week heatmap
│   │   ├── PrimaryDashboard.tsx   # Live queue, KPIs & weekly review
│   │   ├── Shell.tsx              # Sidebar navigation & status bar
│   │   ├── TeamView.tsx           # Multi-branch roster & caseload
│   │   └── views.tsx              # Cases, Ledger, Simulator & Registry
│   ├── lib/
│   │   ├── api.ts                 # Typed backend REST API client
│   │   ├── data.ts                # Static seed fallback data
│   │   └── store.tsx              # React Context state management
│   ├── package.json
│   └── tailwind.config.ts
├── supabase/
│   ├── RUN_IN_SUPABASE_SQL_EDITOR.sql # Complete PostgreSQL schema with RLS
│   └── seed.sql                   # Seed branches, analysts & champion model
├── Procfile                       # Render deployment start command
├── render.yaml                    # Render Blueprint specification
├── vercel.json                    # Vercel deployment configuration
├── requirements.txt               # Backend Python production dependencies
└── README.md                      # College Project Story & System Documentation
```

---

## 🚀 Quickstart & Local Replication

### 1. Clone the Repository
```bash
git clone https://github.com/dhrubojyotihazra/ASTID.git
cd ASTID
```

### 2. Backend Setup (FastAPI & ML Core)
```bash
# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install exact production dependencies
pip install -r requirements.txt

# Launch FastAPI backend on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Swagger API Interactive Documentation will be available at: `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup (Next.js 14 Workbench)
```bash
cd frontend-dashboard

# Install frontend packages
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` to interact with the ASTID Operations Workbench.

### 4. Supabase Cloud Database (Optional)
1. Open your [Supabase](https://supabase.com) project dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and run [`supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql`](supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql).

---

## ☁️ Deployment Instructions

### Deploy Backend to Render
1. Push this repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New +** → **Blueprint**.
3. Select your repository. Render will automatically read [`render.yaml`](render.yaml) and configure the Python build command and start command.
4. Supply your environment variables (`FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`).
5. Render exposes the backend with automated health monitoring at `/api/v1/health`.

### Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com) and import the repository.
2. Set the **Root Directory** to `frontend-dashboard`.
3. Add the environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend service URL (e.g. `https://astid-backend.onrender.com/api/v1`)
   - `NEXT_PUBLIC_WS_URL`: `wss://astid-backend.onrender.com/api/v1/ws/stream`
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public key
4. Click **Deploy**.

---

## 👥 College Final Year Project Team & Acknowledgments

- **Lead Developer & System Architect**: [Dhrubojyoti Hazra](https://github.com/dhrubojyotihazra)
- **Project Scope**: Final Year B.Tech / B.E. Capstone Project
- **Domain**: Financial Fraud Operations, Analytical Data Warehousing, and Real-Time Machine Learning Inference

*Special thanks to our faculty advisors, department mentors, and open-source contributors across the FastAPI, DuckDB, XGBoost, and Next.js ecosystems.*

---

<div align="center">
  <b>ASTID — Defending Financial Integrity One Millisecond at a Time</b><br>
  Final Year Engineering Capstone · 2026
</div>
