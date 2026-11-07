'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  ExternalLink,
  ArrowLeft,
  Activity,
  Layers,
  Code2,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { scoreLiveTransaction, ScoreRequest, ScoreResponse, WhiteboxInsight } from '@/lib/api';

const PRESETS: { label: string; tag: string; desc: string; data: ScoreRequest }[] = [
  {
    label: 'Script Storm (Burst Account Drain)',
    tag: 'CRITICAL ATTACK',
    desc: 'High-frequency automated bot draining 100% of victim balance via wire transfer to fresh mule.',
    data: {
      type: 'TRANSFER',
      amount: 8500000.0,
      nameOrig: 'C_VICTIM_882194',
      nameDest: 'M_MULE_990142',
      oldbalanceOrg: 8500000.0,
      oldbalanceDest: 0.0,
      step: 744,
      branch: 'Delhi-Connaught',
      geo_lat: 28.6139,
      geo_lon: 77.2090
    }
  },
  {
    label: 'Impossible Travel Anomaly',
    tag: 'BEHAVIORAL ANOMALY',
    desc: 'Cash out triggered within 2 minutes of overseas login (Delhi to London leap, delta t < 2m).',
    data: {
      type: 'CASH_OUT',
      amount: 1250000.0,
      nameOrig: 'C_EXEC_341908',
      nameDest: 'M_ATM_HEATHROW',
      oldbalanceOrg: 1400000.0,
      oldbalanceDest: 50000.0,
      step: 744,
      branch: 'Mumbai-BKC',
      geo_lat: 51.5074,
      geo_lon: -0.1278
    }
  },
  {
    label: 'Unregistered P2P Crypto Escrow',
    tag: 'HIGH RISK ESCROW',
    desc: 'Large transfer to unverified high-risk P2P crypto liquidity pool with zero balance history.',
    data: {
      type: 'TRANSFER',
      amount: 4200000.0,
      nameOrig: 'C_TRADER_55102',
      nameDest: 'M_CRYPTO_EXCH',
      oldbalanceOrg: 4500000.0,
      oldbalanceDest: 0.0,
      step: 744,
      branch: 'Bengaluru-HSR',
      geo_lat: 12.9716,
      geo_lon: 77.5946
    }
  },
  {
    label: 'Blacklisted Offshore Gaming',
    tag: 'REGULATORY BLOCK',
    desc: 'Disguised payment routed to blacklisted offshore gambling portal flagged in AML registry.',
    data: {
      type: 'PAYMENT',
      amount: 950000.0,
      nameOrig: 'C_USER_11209',
      nameDest: 'M_OFFSHORE_BET',
      oldbalanceOrg: 1100000.0,
      oldbalanceDest: 0.0,
      step: 744,
      branch: 'Kolkata-SaltLake',
      geo_lat: 22.5726,
      geo_lon: 88.3639
    }
  },
  {
    label: 'Clean Routine Salary Transfer',
    tag: 'BASELINE NORMAL',
    desc: 'Routine authorized monthly payroll disbursement to seasoned employee checking account.',
    data: {
      type: 'PAYMENT',
      amount: 45000.0,
      nameOrig: 'C_CORP_PAYROLL_01',
      nameDest: 'C_EMP_66412',
      oldbalanceOrg: 18500000.0,
      oldbalanceDest: 12000.0,
      step: 744,
      branch: 'Chennai-Guindy',
      geo_lat: 13.0827,
      geo_lon: 80.2707
    }
  }
];

export default function StandaloneSimulationPage() {
  const { say } = useApp();

  // Active Transaction Form State
  const [formData, setFormData] = useState<ScoreRequest>(PRESETS[0].data);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(0);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [history, setHistory] = useState<Array<ScoreResponse & { tx: ScoreRequest; timestamp: string }>>([]);
  const [showJson, setShowJson] = useState(false);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  // Initial auto-score of first preset on mount
  useEffect(() => {
    handleRunScore(PRESETS[0].data);
  }, []);

  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    setFormData(PRESETS[idx].data);
    handleRunScore(PRESETS[idx].data);
  };

  const handleRunScore = async (payloadToScore?: ScoreRequest) => {
    const payload = payloadToScore || formData;
    setIsScoring(true);
    const start = performance.now();
    try {
      const res = await scoreLiveTransaction(payload);
      const elapsed = performance.now() - start;
      setBackendLatency(Math.round(elapsed * 100) / 100);
      setScoreResult(res);
      setHistory(prev => [
        { ...res, tx: payload, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 14)
      ]);
    } catch (err: any) {
      say(`Simulation API error: ${err.message || 'Check FastAPI backend'}`);
    } finally {
      setIsScoring(false);
    }
  };

  const popoutWindow = () => {
    if (typeof window !== 'undefined') {
      window.open('/simulation', 'ASTID_Simulation_Studio', 'width=1440,height=900,menubar=no,toolbar=no');
    }
  };

  return (
    <div className="min-h-screen bg-[#07130b] text-[#e8f5ed] flex flex-col font-sans">
      {/* Standalone Window Titlebar */}
      <header className="sticky top-0 z-40 border-b border-[#1b3a26] bg-[#091b10]/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d7347] text-white shadow-md shadow-[#1d7347]/30">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-extrabold tracking-tight text-white">
                ASTID Simulation Studio
              </h1>
              <span className="rounded-full bg-[#1b4329] border border-[#2b653f] px-2 py-0.5 text-[10.5px] font-bold text-[#84e1a7] uppercase tracking-wider">
                Standalone Window
              </span>
            </div>
            <p className="text-[11.5px] text-[#8ea897]">
              Pre-authorization transaction threat simulator &amp; zero-day manifold stress test
            </p>
          </div>
        </div>

        {/* Live Engine Telemetry Pills */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-[#1d432b] bg-[#0c2416] px-3 py-1 text-[11.5px] text-[#84e1a7]">
            <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Dual-Engine: Calibrated XGBoost + Deep AE</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[#1d432b] bg-[#0c2416] px-3 py-1 text-[11.5px] text-[#a4c9b2]">
            <Zap size={13} className="text-[#f59f00]" />
            <span>SLA Target: &lt; 15 ms</span>
          </div>
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={popoutWindow}
            title="Open in independent popout window"
            className="flex items-center gap-1.5 rounded-full border border-[#2b653f] bg-[#133520] px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-[#1a4a2c] transition shadow-xs cursor-pointer"
          >
            <Maximize2 size={13} />
            <span>Popout Window</span>
          </button>

          <Link
            href="/dashboard/home"
            className="flex items-center gap-1.5 rounded-full border border-[#1b3a26] bg-[#0a1f13] px-3.5 py-1.5 text-[12px] font-bold text-[#9fc4ad] hover:text-white hover:bg-[#133520] transition"
          >
            <ArrowLeft size={13} />
            <span>Workbench Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Preset Attack Scenarios Bar */}
        <div className="rounded-[22px] border border-[#1d432b] bg-[#0b2114]/90 p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#7ea38b]">
              <Sparkles size={14} className="text-[#84e1a7]" />
              <span>Real-World Attack Vectors &amp; Baselines</span>
            </div>
            <span className="text-[11.5px] text-[#698a75]">
              Click any scenario to inject payload and execute live pre-authorization scoring
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {PRESETS.map((p, idx) => {
              const isActive = activePresetIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'border-[#22c55e] bg-[#113821] shadow-md shadow-[#22c55e]/15'
                      : 'border-[#173822] bg-[#0c2617]/70 hover:border-[#2b653f] hover:bg-[#10301d]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#84e1a7]">
                        {p.tag}
                      </span>
                      {isActive && <CheckCircle2 size={13} className="text-[#22c55e]" />}
                    </div>
                    <div className="text-[12.5px] font-bold text-white line-clamp-1">
                      {p.label}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#7ea38b] mt-2 line-clamp-2 leading-tight">
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Pane Workbench: Transaction Parameters (Left) & Real-Time Threat HUD (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Transaction Form & Parameters (6 cols) */}
          <div className="lg:col-span-6 rounded-[26px] border border-[#1d432b] bg-[#0b2114]/90 p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#173822]">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#84e1a7]" />
                <h2 className="text-[16px] font-bold text-white">Transaction Parameters</h2>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPreset(0)}
                className="flex items-center gap-1 text-[11.5px] text-[#7ea38b] hover:text-[#84e1a7]"
              >
                <RotateCcw size={12} />
                <span>Reset to Default</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunScore();
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Transaction Type */}
                <div>
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#7ea38b] block mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3 py-2 text-[13px] font-bold text-white focus:outline-none focus:border-[#22c55e]"
                  >
                    <option value="TRANSFER">TRANSFER (Wire Transfer)</option>
                    <option value="CASH_OUT">CASH_OUT (ATM / Cashier)</option>
                    <option value="PAYMENT">PAYMENT (Merchant POS)</option>
                    <option value="DEBIT">DEBIT (Direct Debit)</option>
                    <option value="CASH_IN">CASH_IN (Deposit)</option>
                  </select>
                </div>

                {/* Banking Branch */}
                <div>
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#7ea38b] block mb-1">
                    Originating Branch
                  </label>
                  <select
                    value={formData.branch || 'Kolkata-SaltLake'}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3 py-2 text-[13px] font-bold text-white focus:outline-none focus:border-[#22c55e]"
                  >
                    <option value="Kolkata-SaltLake">Kolkata-SaltLake (Eastern)</option>
                    <option value="Mumbai-BKC">Mumbai-BKC (Western)</option>
                    <option value="Bengaluru-HSR">Bengaluru-HSR (Southern)</option>
                    <option value="Delhi-Connaught">Delhi-Connaught (Northern)</option>
                    <option value="Chennai-Guindy">Chennai-Guindy (Southern)</option>
                  </select>
                </div>
              </div>

              {/* Amount INR */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#7ea38b]">
                    Amount (INR ₹)
                  </label>
                  <span className="text-[13px] font-extrabold text-[#22c55e]">
                    ₹{Number(formData.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="number"
                  step="1000"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3.5 py-2.5 text-[14px] font-extrabold text-white focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              {/* Sender Info: Account & Balance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#7ea38b] block mb-1">
                    Sender Account / VPA
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameOrig}
                    onChange={(e) => setFormData({ ...formData, nameOrig: e.target.value })}
                    className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3 py-2 text-[12.5px] font-mono text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#7ea38b] block mb-1">
                    Sender Pre-Auth Balance
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.oldbalanceOrg}
                    onChange={(e) => setFormData({ ...formData, oldbalanceOrg: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3 py-2 text-[12.5px] font-mono text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              {/* Counterparty Info: Account & Balance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#7ea38b] block mb-1">
                    Destination Counterparty / VPA
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameDest}
                    onChange={(e) => setFormData({ ...formData, nameDest: e.target.value })}
                    className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3 py-2 text-[12.5px] font-mono text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#7ea38b] block mb-1">
                    Destination Pre-Auth Balance
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.oldbalanceDest}
                    onChange={(e) => setFormData({ ...formData, oldbalanceDest: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#1b4329] bg-[#0a1e12] px-3 py-2 text-[12.5px] font-mono text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isScoring}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#1d7347] hover:bg-[#228652] active:scale-[0.99] text-white py-3.5 px-6 font-extrabold text-[14px] shadow-lg shadow-[#1d7347]/25 transition cursor-pointer disabled:opacity-50"
                >
                  {isScoring ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating Neural Manifold...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} className="fill-white" />
                      <span>Run Pre-Authorization Scoring (&lt;15ms)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowJson(!showJson)}
                  className="rounded-2xl border border-[#1b4329] bg-[#0a1e12] p-3.5 text-[#7ea38b] hover:text-white hover:border-[#2b653f] transition"
                  title="Toggle JSON view"
                >
                  <Code2 size={18} />
                </button>
              </div>
            </form>

            {/* JSON Payload Inspector */}
            {showJson && (
              <div className="rounded-xl border border-[#1b4329] bg-[#06140b] p-3 text-[11px] font-mono text-[#84e1a7] overflow-x-auto max-h-48">
                <pre>{JSON.stringify(formData, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* RIGHT: Live Inference Threat HUD (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {scoreResult ? (
              <div className="rounded-[26px] border border-[#1d432b] bg-[#0b2114]/90 p-6 shadow-xl flex flex-col gap-5">
                {/* Decision Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#173822]">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7ea38b] block mb-0.5">
                      Model Pre-Authorization Decision
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[16px] font-extrabold tracking-wide ${
                          scoreResult.final_verdict === 'BLOCK'
                            ? 'bg-[#ef4444]/20 border border-[#ef4444] text-[#f87171] shadow-lg shadow-[#ef4444]/20'
                            : scoreResult.final_verdict === 'ESCALATE'
                            ? 'bg-[#f59e0b]/20 border border-[#f59e0b] text-[#fbbf24] shadow-lg shadow-[#f59e0b]/20'
                            : scoreResult.final_verdict === 'REVIEW'
                            ? 'bg-[#3b82f6]/20 border border-[#3b82f6] text-[#60a5fa]'
                            : 'bg-[#22c55e]/20 border border-[#22c55e] text-[#4ade80]'
                        }`}
                      >
                        {scoreResult.final_verdict === 'BLOCK' && <ShieldAlert size={18} />}
                        {scoreResult.final_verdict === 'ESCALATE' && <AlertTriangle size={18} />}
                        {scoreResult.final_verdict === 'APPROVE' && <ShieldCheck size={18} />}
                        <span>{scoreResult.final_verdict}</span>
                      </span>

                      <span className="text-[12px] font-semibold text-[#8ea897]">
                        Tier: <b className="text-white uppercase">{scoreResult.confidence_tier}</b>
                      </span>
                    </div>
                  </div>

                  {/* Inference Latency */}
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7ea38b] block mb-0.5">
                      Pre-Auth Latency
                    </span>
                    <div className="flex items-center gap-1 text-[20px] font-black text-[#22c55e] font-mono">
                      <span>{scoreResult.scoring_latency_ms.toFixed(2)} ms</span>
                    </div>
                    <span className="text-[10px] text-[#698a75] font-semibold">
                      SLA Threshold: 15.00 ms
                    </span>
                  </div>
                </div>

                {/* Dual Engine Probability Scores */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Calibrated XGBoost Score */}
                  <div className="rounded-2xl border border-[#173822] bg-[#0a1e12] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#7ea38b] mb-1">
                        <span>XGBoost Fraud Prob</span>
                        <span className="text-[#a4c9b2]">Slice 1</span>
                      </div>
                      <div className="text-[26px] font-extrabold text-white font-mono">
                        {(scoreResult.risk_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-full bg-[#173822] h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          scoreResult.risk_score > 0.6
                            ? 'bg-[#ef4444]'
                            : scoreResult.risk_score > 0.1
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#22c55e]'
                        }`}
                        style={{ width: `${Math.min(100, scoreResult.risk_score * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* PyTorch Zero-Day Autoencoder MSE */}
                  <div className="rounded-2xl border border-[#173822] bg-[#0a1e12] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#7ea38b] mb-1">
                        <span>Deep AE Anomaly</span>
                        <span className="text-[#a4c9b2]">Zero-Day</span>
                      </div>
                      <div className="text-[26px] font-extrabold text-white font-mono">
                        {(scoreResult.zero_day_ae_score || 0).toFixed(3)}
                      </div>
                    </div>
                    <div className="w-full bg-[#173822] h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-[#3b82f6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (scoreResult.zero_day_ae_score || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Decision Rationale */}
                <div className="rounded-2xl border border-[#173822] bg-[#0a1e12] p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7ea38b] block mb-1">
                    Primary Decision Rationale
                  </span>
                  <div className="text-[13px] font-medium text-[#cce8d5] leading-relaxed">
                    {scoreResult.primary_reason}
                  </div>
                </div>

                {/* Whitebox TreeSHAP Insights */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Activity size={14} className="text-[#84e1a7]" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#7ea38b]">
                      TreeSHAP Explainability Badges (Whitebox)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {scoreResult.whitebox_insights && scoreResult.whitebox_insights.length > 0 ? (
                      scoreResult.whitebox_insights.map((ins, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#173822] bg-[#091b10] px-3.5 py-2.5 text-[12.5px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="rounded-md bg-[#133520] border border-[#225032] px-2 py-0.5 text-[11px] font-bold text-[#84e1a7] whitespace-nowrap">
                              {ins.badge}
                            </span>
                            <span className="text-[#a4c9b2] truncate">{ins.explanation}</span>
                          </div>
                          <span className="num font-mono font-bold text-[#f59f00] whitespace-nowrap">
                            {ins.impact_score}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-[#698a75] italic">
                        No adverse anomaly markers triggered (Normal baseline).
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction ID & Hash Footprint */}
                <div className="pt-2 border-t border-[#173822] flex items-center justify-between text-[11px] text-[#698a75] font-mono">
                  <span>TXID: {scoreResult.transaction_id.substring(0, 18)}...</span>
                  <span>Persisted: Supabase PostgreSQL (Off-path)</span>
                </div>
              </div>
            ) : (
              <div className="rounded-[26px] border border-[#1d432b] bg-[#0b2114]/90 p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
                <Activity size={40} className="text-[#2b653f] mb-3 animate-pulse" />
                <h3 className="text-[16px] font-bold text-white mb-1">Awaiting Simulation Trigger</h3>
                <p className="text-[12.5px] text-[#7ea38b] max-w-sm">
                  Select an attack vector preset or click "Run Pre-Authorization Scoring" to evaluate the dual-engine neural pipeline.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: Real-Time Simulation Session History */}
        {history.length > 0 && (
          <div className="rounded-[26px] border border-[#1d432b] bg-[#0b2114]/90 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#84e1a7]" />
                <h2 className="text-[16px] font-bold text-white">
                  Session Simulation Stream ({history.length} Scored)
                </h2>
              </div>
              <button
                onClick={() => setHistory([])}
                className="text-[11.5px] text-[#7ea38b] hover:text-white"
              >
                Clear History
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#173822] text-[#7ea38b] text-[11px] font-bold uppercase tracking-wider">
                    <th className="pb-2.5">Time</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Amount</th>
                    <th className="pb-2.5">Sender &rarr; Receiver</th>
                    <th className="pb-2.5">Verdict</th>
                    <th className="pb-2.5">XGB Prob</th>
                    <th className="pb-2.5">Latency</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#173822]">
                  {history.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#10301d]/50 transition">
                      <td className="py-2.5 text-[#7ea38b] font-mono text-[11px]">{item.timestamp}</td>
                      <td className="py-2.5 font-bold text-white">{item.tx.type}</td>
                      <td className="py-2.5 font-mono font-bold text-[#84e1a7]">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 font-mono text-[11.5px] text-[#a4c9b2]">
                        {item.name_orig.substring(0, 10)} &rarr; {item.name_dest.substring(0, 12)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${
                            item.final_verdict === 'BLOCK'
                              ? 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40'
                              : item.final_verdict === 'ESCALATE'
                              ? 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40'
                              : item.final_verdict === 'REVIEW'
                              ? 'bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40'
                              : 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/40'
                          }`}
                        >
                          {item.final_verdict}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-white">
                        {(item.risk_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 font-mono text-[#22c55e]">
                        {item.scoring_latency_ms.toFixed(2)} ms
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            setFormData(item.tx);
                            setScoreResult(item);
                          }}
                          className="text-[11.5px] font-semibold text-[#84e1a7] hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

