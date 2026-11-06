'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Upload,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES } from '@/lib/roles';
import { SYSTEM_METRICS, BRANCHES, BASE_CASES } from '@/lib/data';
import { inr, inrCr } from '@/lib/export';

export default function PrimaryDashboard() {
  const { say, role, cases, stats, select, log, warehouseStats, branchesList } = useApp();
  const router = useRouter();
  const me = role ? ROLES[role] : { name: 'Noah Castell', label: 'Branch Analyst', branch: 'Kolkata-SaltLake' };

  // Alert Action State
  const [alertHandled, setAlertHandled] = useState(false);

  // Time Tracker State
  const [seconds, setSeconds] = useState(5049); // 01:24:09
  const [isRunning, setIsRunning] = useState(true);

  // Decile bar hover
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // New Case Modal State
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagAmount, setFlagAmount] = useState('');
  const [flagBranch, setFlagBranch] = useState(me.branch || 'Kolkata-SaltLake');
  const [flagReason, setFlagReason] = useState('');

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const handleManualFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagAmount) return;
    setFlagModalOpen(false);
    setFlagAmount('');
    setFlagReason('');
    say(`Flagged ₹${Number(flagAmount).toLocaleString('en-IN')} alert for investigation.`);
  };

  // Scoped calculation based on current role
  const unreviewedReviews = cases.filter(c => c.kind === 'review' && !c.res);
  const openEscalations = cases.filter(c => c.kind === 'escalate' && !c.res);
  const overdueEsc = openEscalations.filter(c => (c.rem ?? 1) <= 0);
  const claimedEsc = openEscalations.filter(c => c.claimed);
  const priorityCase = openEscalations[0] || cases[0];

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Head matching Sentinel layout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">
              Dashboard
            </h1>
            <span className="rounded-full bg-so px-2.5 py-0.5 text-[11px] font-bold text-ac border border-ac/20">
              {me.label}
            </span>
          </div>
          <p className="text-[13.5px] text-mu mt-0.5">
            Real-time transaction inspection and operational fraud intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setFlagModalOpen(true)}
            className="flex min-h-[42px] items-center gap-2 rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 text-[13.5px] font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            <span>Flag Transaction</span>
          </button>

          {role === 'admin' ? (
            <Link
              href="/dashboard/upload"
              className="flex min-h-[42px] items-center gap-2 rounded-full border border-bd bg-card px-4 text-[13px] font-semibold text-tx shadow-xs hover:bg-so/40 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Upload size={15} />
              <span>Batch Upload</span>
            </Link>
          ) : (
            <Link
              href="/dashboard/cases"
              className="flex min-h-[42px] items-center gap-2 rounded-full border border-bd bg-card px-4 text-[13px] font-semibold text-tx shadow-xs hover:bg-so/40 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Search size={15} />
              <span>Inspect Queue</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top 4 Stat Cards Row - Role Adaptive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Primary Hero Metric */}
        <article className="stat--hero card-micro rounded-[26px] p-5 shadow-lg flex flex-col justify-between min-h-[145px] cursor-pointer">
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-white/90">
              {role === 'senior'
                ? 'Open Escalations'
                : role === 'lead' || role === 'admin'
                ? 'Global Volume Ingested'
                : 'Pending Case Reviews'}
            </h2>
            <Link
              href={role === 'senior' ? '/dashboard/esc' : '/dashboard/cases'}
              aria-label="Open cases"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0d3a23] shadow-xs transition-transform duration-200 hover:rotate-45 active:scale-90"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="relative z-10 mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-white leading-none">
              {role === 'senior'
                ? openEscalations.length
                : role === 'lead' || role === 'admin'
                ? warehouseStats
                  ? `${(warehouseStats.total_transactions / 1e6).toFixed(2)}M`
                  : '6.36M'
                : unreviewedReviews.length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-white/80">
              <span className="flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-white anim-live-pulse mr-1.5" />
                DuckDB Live
              </span>
              <span>
                {role === 'senior'
                  ? 'High-severity 15m window'
                  : role === 'lead' || role === 'admin'
                  ? warehouseStats
                    ? `${warehouseStats.total_transactions.toLocaleString('en-IN')} real txns`
                    : 'Across 5 hub branches'
                  : `Assigned: ${me.branch}`}
              </span>
            </div>
          </div>
        </article>

        {/* Card 2: Prevention / Today Activity */}
        <article className="card-micro rounded-[26px] border border-bd/80 bg-card p-5 shadow-xs flex flex-col justify-between min-h-[145px] cursor-pointer">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-mu">
              {role === 'senior'
                ? 'SLA Overdue Breaches'
                : role === 'lead'
                ? 'Total Fraud Prevented'
                : role === 'admin'
                ? 'Model Champion'
                : 'Reviewed Today'}
            </h2>
            <Link
              href="/dashboard/analytics"
              aria-label="View analytics"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-bd bg-card text-mu shadow-2xs hover:text-tx hover:rotate-45 active:scale-90 transition-all duration-200"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mt-2">
            <div className={`num text-[36px] font-extrabold tracking-tight leading-none ${role === 'senior' && overdueEsc.length > 0 ? 'text-rd' : 'text-tx'}`}>
              {role === 'senior'
                ? overdueEsc.length
                : role === 'lead'
                ? warehouseStats
                  ? `₹${warehouseStats.fraud_prevented_cr} Cr`
                  : inrCr(SYSTEM_METRICS.fraudPreventedTotal)
                : role === 'admin'
                ? warehouseStats?.active_model_version || 'v2.4'
                : stats.reviewed}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-mu">
              <span className="rounded-full bg-so px-2 py-0.5 text-[10.5px] font-bold text-ac">
                {role === 'senior'
                  ? overdueEsc.length > 0 ? 'Urgent' : 'Optimal'
                  : role === 'lead'
                  ? '100% Catch'
                  : role === 'admin'
                  ? '100% Recall'
                  : '+14% shift'}
              </span>
              <span>
                {role === 'senior'
                  ? 'Breached 15m resolution window'
                  : role === 'lead'
                  ? 'Verified financial protection'
                  : role === 'admin'
                  ? 'Holdout FNR: 0.00% (Zero Escape)'
                  : 'Decisions recorded in session'}
              </span>
            </div>
          </div>
        </article>

        {/* Card 3: Quality / Accuracy Metric */}
        <article className="card-micro rounded-[26px] border border-bd/80 bg-card p-5 shadow-xs flex flex-col justify-between min-h-[145px] cursor-pointer">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-mu">
              {role === 'senior'
                ? 'Claimed by You'
                : role === 'lead'
                ? 'Average Review Rate'
                : role === 'admin'
                ? 'Engine Stability'
                : 'False-Positive Rate'}
            </h2>
            <button
              aria-label="View rate details"
              onClick={() => say('False-positive rate calibrated under 5% SLA standard.')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-bd bg-card text-mu shadow-2xs hover:text-tx hover:rotate-45 active:scale-90 transition-all duration-200 cursor-pointer"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-tx leading-none">
              {role === 'senior'
                ? claimedEsc.length
                : role === 'lead'
                ? warehouseStats ? `${warehouseStats.fraud_rate_pct}%` : SYSTEM_METRICS.avgReviewRate
                : role === 'admin'
                ? '99.8%'
                : stats.reviewed > 0
                ? `${Math.round((stats.fp / stats.reviewed) * 100)}%`
                : '3.8%'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-mu">
              <span className="rounded-full bg-so px-2 py-0.5 text-[10.5px] font-bold text-ac">SLA</span>
              <span>
                {role === 'senior'
                  ? 'In active senior investigation'
                  : role === 'lead'
                  ? 'Measured holdout fraud baseline'
                  : role === 'admin'
                  ? 'Drift Index: 0.042 (Negligible)'
                  : 'Benchmark: < 5.0% threshold'}
              </span>
            </div>
          </div>
        </article>

        {/* Card 4: Action Status Metric */}
        <article className="card-micro rounded-[26px] border border-bd/80 bg-card p-5 shadow-xs flex flex-col justify-between min-h-[145px] cursor-pointer">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-mu">
              {role === 'senior'
                ? 'Resolved This Shift'
                : role === 'lead' || role === 'admin'
                ? 'Active Hub Branches'
                : 'Escalated to Senior'}
            </h2>
            <Link
              href={role === 'lead' ? '/dashboard/branches' : role === 'admin' ? '/dashboard/audit' : '/dashboard/cases'}
              aria-label="View status"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-bd bg-card text-mu shadow-2xs hover:text-tx hover:rotate-45 active:scale-90 transition-all duration-200"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mt-2">
            <div className="num text-[36px] font-extrabold tracking-tight text-tx leading-none">
              {role === 'senior'
                ? stats.reviewed
                : role === 'lead' || role === 'admin'
                ? branchesList.length || '5'
                : openEscalations.length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] font-medium text-mu">
              <span className="rounded-full bg-so px-2 py-0.5 text-[10.5px] font-bold text-ac">
                {role === 'admin' ? 'Online' : 'Verified'}
              </span>
              <span>
                {role === 'senior'
                  ? 'Decisions committed to storage'
                  : role === 'lead' || role === 'admin'
                  ? 'Kolkata, Mumbai, BLR, Delhi, Chennai'
                  : 'Requires senior investigator review'}
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* Middle Grid: Weekly Review Activity, Priority Alert, and Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Weekly Review Activity (5 cols) */}
        <div className="card-micro lg:col-span-5 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between min-h-[300px]">
          {/* Card Header: Locked min-height and nowrap badge so layout never shifts */}
          <div className="flex items-start justify-between gap-3 min-h-[44px] flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-[16px] font-bold text-tx leading-tight">Weekly Review Activity</h2>
              <p className="text-[12px] text-mu leading-tight mt-0.5">Case resolutions across days</p>
            </div>
            <div className="flex-shrink-0 pt-0.5">
              <span
                className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors duration-150 ${
                  hoveredBar ? 'text-ac bg-so font-bold' : 'text-mu bg-so/40'
                }`}
              >
                {hoveredBar || 'Hover to inspect'}
              </span>
            </div>
          </div>

          {/* 7 Bars (Sunday to Saturday) with rock-solid full-column hover & pin tooltip */}
          <div className="relative flex flex-col justify-end mt-4 select-none">
            {/* Bar Track (144px height) - Each column spans 100% height as steady hover hitbox */}
            <div className="relative flex items-end justify-between gap-2.5 h-36">
              {[
                { day: 'S', pct: 60, height: 60, barClass: 'bar--plan', desc: 'Sunday · 48 cases · 98% clean', delay: 0 },
                { day: 'M', pct: 86, height: 86, barClass: 'bar--mid', desc: 'Monday · 124 cases · 14 esc', delay: 60 },
                { day: 'T', pct: 74, height: 74, barClass: 'bar--light', desc: 'Tuesday · 98 cases · 8 esc', delay: 120 },
                { day: 'W', pct: 96, height: 96, barClass: 'bar--dark', desc: 'Wednesday · 142 cases · 100% SLA', delay: 180 },
                { day: 'T', pct: 68, height: 68, barClass: 'bar--plan', desc: 'Thursday · 84 cases · 6 esc', delay: 240 },
                { day: 'F', pct: 55, height: 55, barClass: 'bar--plan', desc: 'Friday · 76 cases · 12 esc', delay: 300 },
                { day: 'S', pct: 45, height: 45, barClass: 'bar--plan', desc: 'Saturday · 52 cases · Low vol', delay: 360 },
              ].map((d, idx) => {
                const isHovered = hoveredDayIdx === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => {
                      setHoveredDayIdx(idx);
                      setHoveredBar(d.desc);
                    }}
                    onMouseLeave={() => {
                      setHoveredDayIdx(null);
                      setHoveredBar(null);
                    }}
                    className="group relative flex flex-col items-center justify-end flex-1 h-full cursor-pointer"
                  >
                    {/* Pin Tooltip: anchored exactly at top of bar */}
                    {isHovered && (
                      <div
                        className="absolute z-30 flex flex-col items-center pointer-events-none transition-opacity duration-150"
                        style={{ bottom: `${d.height}%` }}
                      >
                        <div className="rounded-lg border border-bd/90 bg-card px-2 py-0.5 text-[11.5px] font-bold text-tx shadow-md whitespace-nowrap mb-[-1px]">
                          {d.pct}%
                        </div>
                        <div className="w-[1.5px] h-3 bg-mu/70" />
                      </div>
                    )}

                    {/* Bar Pill */}
                    <div
                      className={`bar-pill ${d.barClass} anim-decile-bar w-full transition-opacity duration-150 ${
                        hoveredDayIdx !== null && !isHovered ? 'opacity-50' : 'opacity-100'
                      }`}
                      style={{ height: `${d.height}%`, animationDelay: `${d.delay}ms` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Day Letters row below bars */}
            <div className="flex items-center justify-between gap-2.5 pt-2.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <span
                  key={idx}
                  className={`text-[12px] font-semibold text-center flex-1 transition-colors duration-150 ${
                    hoveredDayIdx === idx ? 'text-tx font-bold' : 'text-mu'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Case / SLA Alert Card (3 cols) */}
        <div className="card-micro lg:col-span-3 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-tx">Priority Case Alert</h2>
              <span className="flex h-2.5 w-2.5 rounded-full bg-rd anim-live-pulse" />
            </div>
            <div className="mt-4">
              <span className="inline-block rounded-full bg-rb px-2.5 py-0.5 text-[10.5px] font-bold text-rd border border-rd/25 mb-1.5">
                Urgent High-Severity Flag
              </span>
              <h3 className="text-[15px] font-extrabold text-[#0d3a23] dark:text-[#5dbd8b] leading-snug">
                Case {priorityCase?.id || 'R-1041'} · ₹{priorityCase?.amount ? priorityCase.amount.toLocaleString('en-IN') : '2,45,000'}
              </h3>
              <p className="text-[12px] text-mu mt-1">
                {priorityCase?.reasons?.[0] || '99.8% balance drained in single transfer with off-hours cash-out.'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11.5px] font-semibold text-rd">
                <Clock size={13} />
                <span>
                  {priorityCase?.branch || 'Mumbai-BKC'} · 15m Escalation SLA Active
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                const targetId = priorityCase?.id || 'R-1041';
                select(targetId);
                router.push('/dashboard/cases');
                say(`Selected Case ${targetId} for immediate inspection.`);
              }}
              className="w-full flex min-h-[42px] items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold shadow-xs bg-[#0d3a23] dark:bg-[#155a37] text-white hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <ShieldAlert size={15} />
              <span>Inspect Case {priorityCase?.id || 'R-1041'}</span>
            </button>
          </div>
        </div>

        {/* Recent Cases List Card (4 cols) */}
        <div className="card-micro lg:col-span-4 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-bd/50">
            <div>
              <h2 className="text-[16px] font-bold text-tx">Recent Flagged Cases</h2>
              <span className="text-[11px] text-mu">Live operational feed</span>
            </div>
            <Link
              href="/dashboard/cases"
              className="flex items-center gap-1 rounded-full border border-bd bg-so/30 px-2.5 py-1 text-[11.5px] font-semibold text-tx hover:bg-so/60 active:scale-90 transition-all duration-200 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Cases List Items with hover interactions */}
          <div className="flex flex-col divide-y divide-bd/40 overflow-y-auto max-h-[220px]">
            {cases.slice(0, 5).map(c => (
              <div
                key={c.id}
                onClick={() => {
                  select(c.id);
                  say(`Opened Case ${c.id}`);
                }}
                className="flex items-center justify-between py-2.5 first:pt-2 last:pb-0 hover:bg-so/30 hover:translate-x-1 rounded-xl px-2 transition-all duration-200 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-tx">{c.id}</span>
                    <span className="text-[11.5px] font-semibold text-tx/85">₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[11px] text-mu truncate">{c.branch} · {c.reasons[0]}</div>
                </div>
                <span
                  className={`num ml-2 rounded-full px-2 py-0.5 text-[10.5px] font-bold transition-transform duration-200 hover:scale-110 ${
                    c.score >= 0.75
                      ? 'bg-rb text-rd border border-rd/20'
                      : c.score >= 0.5
                      ? 'bg-ab text-am border border-am/20'
                      : 'bg-so text-ac border border-ac/20'
                  }`}
                >
                  {(c.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Active Investigators, Decision Distribution Semicircle, and Shift Session Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Active Investigators Status (5 cols) */}
        <div className="card-micro lg:col-span-5 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-bd/50">
            <div>
              <h2 className="text-[16px] font-bold text-tx">Active Investigators</h2>
              <span className="text-[11px] text-mu">Current triage and review status</span>
            </div>
            <Link
              href="/dashboard/team"
              className="flex items-center gap-1 rounded-full border border-bd bg-so/30 px-2.5 py-1 text-[11.5px] font-semibold text-tx hover:bg-so/60 active:scale-90 transition-all duration-200 cursor-pointer"
            >
              <span>Team</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-bd/40 my-auto py-1">
            {[
              {
                name: 'Priya Raman',
                init: 'PR',
                bg: '#fbcfe8',
                task: 'Reviewing R-1042 (₹74,500)',
                status: 'Investigating',
                statusClass: 'bg-so text-ac border border-ac/20',
              },
              {
                name: 'Mateo Silva',
                init: 'MS',
                bg: '#bbf7d0',
                task: 'Escalation R-1046 (₹5.12L)',
                status: 'Urgent SLA',
                statusClass: 'bg-rb text-rd border border-rd/20',
              },
              {
                name: 'Hana Kobayashi',
                init: 'HK',
                bg: '#e9d5ff',
                task: 'Cleared R-1045 as legitimate',
                status: 'Resolved',
                statusClass: 'bg-so text-ac border border-ac/20',
              },
              {
                name: 'Owen Mercer',
                init: 'OM',
                bg: '#fef08a',
                task: 'Reviewing R-1048 velocity burst',
                status: 'In Review',
                statusClass: 'bg-ab text-am border border-am/20',
              },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl hover:bg-so/30 hover:translate-x-1 transition-all duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-tx shadow-2xs transition-transform duration-200 hover:scale-110"
                    style={{ backgroundColor: m.bg }}
                  >
                    {m.init}
                  </div>
                  <div className="truncate">
                    <div className="text-[13px] font-bold text-tx leading-snug">{m.name}</div>
                    <div className="text-[11px] text-mu truncate">
                      {m.task}
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${m.statusClass}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Distribution Semicircle Gauge (3 cols) */}
        <div className="card-micro lg:col-span-3 rounded-[26px] border border-bd/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="text-left">
            <h2 className="text-[17px] font-bold text-tx tracking-tight">Project Progress</h2>
          </div>

          {/* Semicircle SVG Arc Gauge with animated arc drawing */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <svg viewBox="0 0 240 145" className="w-56 sm:w-64 h-auto overflow-visible">
              <defs>
                <pattern
                  id="hatch-pattern-gauge"
                  width="7"
                  height="7"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#8d9a92" strokeWidth="2.8" />
                </pattern>
              </defs>

              {/* Background Track */}
              <path
                d="M 38 125 A 82 82 0 0 1 202 125"
                fill="none"
                stroke="#e3e7e4"
                strokeWidth="32"
                strokeLinecap="round"
                className="dark:stroke-[#26322C]"
              />

              {/* Completed Segment (68%) */}
              <path
                d="M 38 125 A 82 82 0 0 1 202 125"
                fill="none"
                stroke="#1d7347"
                strokeWidth="32"
                strokeDasharray="175 257.6"
                strokeDashoffset="0"
                strokeLinecap="round"
                className="anim-gauge-arc"
              />

              {/* In Progress Segment (22%) */}
              <path
                d="M 38 125 A 82 82 0 0 1 202 125"
                fill="none"
                stroke="#0d3a23"
                strokeWidth="32"
                strokeDasharray="57 257.6"
                strokeDashoffset="-175"
                className="anim-gauge-arc"
                style={{ animationDelay: '150ms' }}
              />

              {/* Pending Segment (Hatched pattern 10%) */}
              <path
                d="M 38 125 A 82 82 0 0 1 202 125"
                fill="none"
                stroke="url(#hatch-pattern-gauge)"
                strokeWidth="32"
                strokeDasharray="26 257.6"
                strokeDashoffset="-232"
                strokeLinecap="round"
                className="anim-gauge-arc"
                style={{ animationDelay: '300ms' }}
              />
            </svg>

            {/* Gauge Number & Label positioned directly inside the arch */}
            <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="num text-[36px] sm:text-[40px] font-extrabold text-tx leading-none tracking-tight">
                68%
              </div>
              <div className="text-[12px] font-medium text-mu mt-1">
                Queue Cleared
              </div>
            </div>
          </div>

          {/* Legend dots matching reference */}
          <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-bd/40 text-[12px] font-medium text-mu">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#1d7347]" />
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#0d3a23]" />
                <span>In Progress</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full border border-bd/60"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, #8d9a92, #8d9a92 1.5px, transparent 1.5px, transparent 3.5px)',
                }}
              />
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Shift Session Timer Card (4 cols) */}
        <div className="time-tracker-card card-micro lg:col-span-4 rounded-[26px] p-6 shadow-md text-white flex flex-col justify-between">
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-white/90">Shift Session Timer</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#5dbd8b] anim-live-pulse" />
              <span>Active Shift</span>
            </div>
          </div>

          {/* Digital Timer Display */}
          <div className="relative z-10 my-auto text-center py-4">
            <div className="num text-[40px] font-extrabold tracking-wider text-white">
              {formatTimer(seconds)}
            </div>
            <div className="text-[12px] text-white/70 mt-1">
              Investigator: {me.name} ({me.label})
            </div>
          </div>

          {/* Timer Controls */}
          <div className="relative z-10 flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0d3a23] shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setSeconds(0);
                say('Triage shift logged and committed.');
              }}
              aria-label="Stop timer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-rd text-white shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Square size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Flag Transaction Modal */}
      {flagModalOpen && (
        <div
          onClick={() => setFlagModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1811]/50 backdrop-blur-xs p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="anim-dlg w-full max-w-md rounded-[26px] border border-bd bg-card p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-bd/60">
              <h2 className="text-[17px] font-bold text-tx">Manual Transaction Flag</h2>
              <button
                onClick={() => setFlagModalOpen(false)}
                className="text-mu hover:text-tx text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualFlag} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Transaction Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={flagAmount}
                  onChange={e => setFlagAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full rounded-xl border border-bd bg-card px-3.5 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Branch Hub
                </label>
                <select
                  value={flagBranch}
                  onChange={e => setFlagBranch(e.target.value)}
                  className="w-full rounded-xl border border-bd bg-card px-3.5 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                >
                  {BRANCHES.map(b => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1">
                  Suspicion Reason / Indicators
                </label>
                <textarea
                  rows={3}
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  placeholder="e.g. Unverified beneficiary, rapid succession transfers..."
                  className="w-full rounded-xl border border-bd bg-card p-3 text-[13px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-bd/60">
                <button
                  type="button"
                  onClick={() => setFlagModalOpen(false)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold text-mu hover:bg-so/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:opacity-95"
                >
                  Flag Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
