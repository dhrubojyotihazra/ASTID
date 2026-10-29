# ASTID: Automated System for Transaction Inspection and Detection

<div align="center">

![ASTID Banner](https://img.shields.io/badge/System-Internal_B2B_RiskOps_Workbench-8C3B43?style=for-the-badge)
![Course](https://img.shields.io/badge/Course-PROJ--CSD782_%7C_Project--I-222022?style=for-the-badge)
![University](https://img.shields.io/badge/University-Brainware_University-8C3B43?style=for-the-badge)

<br/>

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-In--Process_OLAP-FFF000?style=flat&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_&_Realtime-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Platt_Calibrated-EB5424?style=flat)](https://xgboost.readthedocs.io/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Deep_Autoencoder-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)

</div>

---

## 📌 Executive Summary

**ASTID** is an internal enterprise B2B RiskOps workbench and real-time fraud mitigation platform engineered for commercial banking and digital payment gateways. Operating in the exact functional role of **Stripe Radar**, **Razorpay Thirdwatch**, and **Feedzai Pulse**, ASTID enables fraud analysts, senior investigators, and risk managers to inspect, triage, and decide on suspicious digital transactions in sub-80 milliseconds.

ASTID is modeled on a simulated 5-branch Indian commercial banking network (`Kolkata-SaltLake`, `Mumbai-BKC`, `Bengaluru-HSR`, `Delhi-Connaught`, `Chennai-Guindy`) processing transactions in Indian Rupees (**₹ INR**) across domestic UPI and mobile money payment channels.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ASTID System Pipeline                                   │
├─────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│  Layer 1: Deterministic │  Layer 2: Supervised GBDT    │  Layer 3: Unsupervised Deep   │
│  Fast-Path Rules Engine │  Calibrated XGBoost (Platt)  │  PyTorch Autoencoder (Zero-Day│
│  (Blacklists, UPI Caps) │  (Trained on Behavioral Reg) │  Novelty Reconstruction Error)│
└────────────┬────────────┴──────────────┬───────────────┴───────────────┬───────────────┘
             │                           │                               │
             └───────────────────────────┼───────────────────────────────┘
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ Disjunctive Gating Aggregator         │
                     │ (Model Override Escapes: >=0.85/0.90) │
                     └───────────────────┬───────────────────┘
                                         ▼
         ┌───────────────────────────────┴───────────────────────────────┐
         ▼                                                               ▼
┌─────────────────────────────────┐                     ┌────────────────────────────────┐
│ In-Process DuckDB (OLAP)        │                     │ Supabase PostgreSQL (OLTP)     │
│ Scans 6.36M rows in <120ms      │                     │ 8-Table DDL, 3-Tier Branch RLS │
│ Financial Simulator & Leakage   │                     │ Realtime WebSockets to Analyst │
└─────────────────────────────────┘                     └────────────────────────────────┘
```

---

## ⚡ Key Highlights & Benchmark Wins

| Metric / Capability | ASTID Production Platform | Industry Standard / Legacy Baseline |
| :--- | :--- | :--- |
| **Big Data Query Throughput** | **< 120 ms** over 6,362,620 rows (DuckDB in-process) | 8–25s (Row-oriented PostgreSQL) |
| **Scoring Latency SLA** | **< 80 ms** per transaction (Avg: ~42 ms) | Meets Visa/Mastercard 100ms pre-auth window |
| **Production Fraud Recall** | **94.21%** (zero-leakage behavioral signals) | **0.19%** (Legacy `isFlaggedFraud > 200k` rule) |
| **Operational Lift** | **480× Lift** in enterprise fraud prevention coverage | Static business rules fail on novel fraud |
| **PR-AUC (0.129% Imbalance)** | **0.8842** (Platt-calibrated on untouched validation) | Avoids artificial `1.0000` balance-leakage trap |
| **Explainability (XAI)** | Plain-English **Whitebox Risk Insights** badges | Regulatory compliance (GDPR Art. 22 / ECOA) |
| **Mule Ring Detection** | **1-Hop Ego-Graph** (PayPal "Igor" Homage) | Detects fund flows through mule accounts |

---

## 🚀 Ten Standout FinTech Upgrades

### A. Core Engine
1. **HTAP Storage Architecture:** Isolates big data analytical scans (in-process DuckDB querying 6.36M PaySim records) from operational transaction mutations (Supabase PostgreSQL with 3-tier Row-Level Security).
2. **Single Shared Feature Module (`features.py`):** Pure mathematical functions prevent training-serving skew (mirroring Stripe Shepherd / Airbnb Chronon).
3. **Disjunctive Override Gating:** Eliminates anomaly dilution: if supervised XGBoost ($\ge 0.85$) or unsupervised Autoencoder ($\ge 0.90$) exhibits extreme confidence, the transaction is immediately escalated.
4. **Data Leakage Audit Tab:** Exposes why naive models utilizing `errorBalanceDest` score an indefensible PR-AUC of 1.0000, proving our model relies strictly on legitimate pre-authorization behavioral features.
5. **1-Hop Mule Ring Ego-Graph:** Interactive SVG network graph inside the analyst drawer mapping money flows from victim accounts through mule handles to ATM cash-out points.

### B. Real-World FinTech Additions
6. **Cost-Sensitive Bayes Dynamic Thresholding:** Replaces arbitrary 0.50 cutoffs with an Economic Loss Matrix deriving amount-weighted thresholds $\tau^*(x)$. High-value transfers (₹5,00,000) are flagged at $\tau^* \approx 0.007$, while low-value payments (₹150) avoid friction ($\tau^* \approx 0.78$).
7. **IETF `Idempotency-Key` Middleware:** Prevents duplicate scoring runs and network race conditions under unstable mobile connectivity via atomic Redis distributed locking (`SETNX EX 30`).
8. **Impossible Travel Geo-Velocity Detector:** Calculates spherical physical travel speed using the Haversine formula; flags travel $>900$ km/h between login locations.
9. **Model Drift Surveillance (Basel II / Fed SR 11-7):** Tracks 10-decile Population Stability Index (PSI) and Kolmogorov-Smirnov statistics against frozen training baselines to trigger automated recalibration when drift exceeds 0.10.
10. **Delayed Feedback Blackout Window:** Enforces a 60-day maturation window ($[T-60\text{d}, T]$) during model retraining to prevent label corruption from unconfirmed chargeback disputes.

---

## 📂 Monorepo Architecture

```text
ASTID_v2/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint
│   │   ├── config.py                   # Pydantic Settings
│   │   ├── api/                        # REST routes (scoring, warehouse, graph, drift, health)
│   │   ├── middleware/
│   │   │   └── idempotency.py          # IETF Idempotency-Key with Redis SETNX lock
│   │   └── services/                   # Rules, aggregator, cache, cost-sensitive, geo-velocity, drift
│   ├── ml/
│   │   ├── features.py                 # Pure-function shared feature engineering
│   │   ├── train_pipeline.py           # Reproducible benchmark training script
│   │   ├── warm_start.py               # Periodic 3-epoch fine-tuning (delayed feedback aware)
│   │   ├── explain.py                  # TreeSHAP base extraction + Autoencoder MSE breakdown
│   │   └── artifacts/                  # Versioned weights (XGBoost, PyTorch AE, ae_minmax.json, ref_scores)
│   └── warehouse/
│       ├── duckdb_manager.py           # In-process columnar DuckDB connector
│       └── data/                       # Columnar Parquet warehouse tables
├── frontend-dashboard/                 # Next.js 14 App Router, Tailwind CSS, shadcn/ui
│   ├── app/
│   │   ├── (auth)/login/page.tsx       # Evaluator Quick-Login Drawer (1-click RLS testing)
│   │   ├── dashboard/                  # Analyst, Escalations, Team Lead, and Admin views
│   │   └── simulator/page.tsx          # Standalone Simulator with 5 Preset Attack Scenarios
├── supabase/
│   ├── migrations/                     # 8-table DDL, SECURITY DEFINER functions, 3-tier RLS
│   └── seed.sql                        # 5 branches, 4 demo users, 200 pre-scored transactions
├── vibe_coding_context/                # Full technical specifications (PRD, Architecture, Schemas, etc.)
└── ASTID_Master_Engineering_Dossier.pdf # 18-page publication-grade architecture dossier
```

---

## 👥 Engineering Team & Academic Context

* **Project:** Final Year Capstone Project (Project-I) · **PROJ-CSD782**
* **Institution:** School of Engineering, Dept. of CSE (Cyber Security & Data Science), Brainware University
* **Supervisor:** Prof. Rudranath Mitra | **Project Coordinator:** Dr. Ranadip Kundu
* **Team Members:**
  1. **Dhrubojyoti Hazra (Lead):** System Architect, Frontend Lead & Escalation State Machine
  2. **Isheeka Mukhopadhyay:** Lead ML & Deep Learning Engineer (XGBoost, Autoencoder, Leakage Audit)
  3. **Samprikta Dey:** Backend & Real-Time Scoring Engineer (FastAPI, Rules Engine, Redis Caching)
  4. **Adhiraj Das:** Explainable AI (XAI) & Live Simulator Engineer (TreeSHAP, Mule Ring Graph)
  5. **Tiyasha Baidya:** Columnar Data Warehouse (DuckDB), Database & DevOps (Supabase Postgres, 3-Tier RLS)

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
